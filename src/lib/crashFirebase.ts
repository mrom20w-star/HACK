import {getApp, getApps, initializeApp} from 'firebase/app';
import {getDatabase, onValue, ref, set} from 'firebase/database';

export const CRASH_DB_URL = 'https://mrwan-dd795-default-rtdb.firebaseio.com';

export type CrashPhase = 'waiting' | 'flight' | 'crashed';

export interface CrashCurrentData {
  roundNumber: number;
  phase: CrashPhase;
  crashPoint: number;
  roundStartedAt?: number;
  flightStartedAt?: number;
  updatedAt?: number;
}

export interface CrashOverridePayload {
  roundNumber: number;
  crashPoint: number;
  updatedAt: number;
}

function getCrashDatabase() {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        databaseURL: CRASH_DB_URL,
      });
  return getDatabase(app);
}

function isPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const errObj = error as {code?: unknown; message?: unknown};
  const combined = `${String(errObj.code ?? '')} ${String(errObj.message ?? '')}`.toUpperCase();
  return combined.includes('PERMISSION_DENIED') || combined.includes('PERMISSION DENIED');
}

async function checkCrashRootAvailability(): Promise<{closed: boolean; reason?: string}> {
  try {
    const res = await fetch(`${CRASH_DB_URL}/crash.json?shallow=true&_=${Date.now()}`);
    if (res.status === 401 || res.status === 403) {
      return {closed: true, reason: 'PERMISSION_DENIED'};
    }
    if (!res.ok) {
      return {closed: true, reason: `HTTP_${res.status}`};
    }
    const val = (await res.json()) as unknown;
    if (val === false) {
      return {closed: true, reason: 'CRASH_FALSE'};
    }
    if (val && typeof val === 'object' && 'enabled' in val && (val as {enabled?: unknown}).enabled === false) {
      return {closed: true, reason: 'DISABLED'};
    }
    return {closed: false};
  } catch {
    return {closed: false};
  }
}

export interface SubscribeCrashOptions {
  onCurrent: (data: CrashCurrentData | null) => void;
  onClosedChange: (closed: boolean, reason?: string) => void;
}

export function subscribeToCrash({onCurrent, onClosedChange}: SubscribeCrashOptions): () => void {
  const db = getCrashDatabase();
  const currentRef = ref(db, 'crash/current');
  const enabledRef = ref(db, 'crash/enabled');

  let disposed = false;
  let enabledFlag: unknown = undefined;
  let rootClosed = false;

  const evaluateClosed = (reason?: string) => {
    if (disposed) return;
    const isClosed = rootClosed || enabledFlag === false;
    onClosedChange(isClosed, reason);
  };

  void checkCrashRootAvailability().then((status) => {
    if (disposed) return;
    rootClosed = status.closed;
    evaluateClosed(status.reason);
  });

  const unsubEnabled = onValue(
    enabledRef,
    (snapshot) => {
      if (disposed) return;
      enabledFlag = snapshot.val();
      if (enabledFlag === false) {
        onClosedChange(true, 'DISABLED');
      } else {
        void checkCrashRootAvailability().then((status) => {
          if (disposed) return;
          rootClosed = status.closed;
          evaluateClosed(status.reason);
        });
      }
    },
    (error) => {
      if (disposed) return;
      if (isPermissionDeniedError(error)) {
        rootClosed = true;
        onClosedChange(true, 'PERMISSION_DENIED');
      }
    }
  );

  const unsubCurrent = onValue(
    currentRef,
    (snapshot) => {
      if (disposed) return;
      const raw = snapshot.val() as Record<string, unknown> | null;
      if (raw === null) {
        onCurrent(null);
        void checkCrashRootAvailability().then((status) => {
          if (disposed) return;
          rootClosed = status.closed;
          evaluateClosed(status.reason);
        });
        return;
      }

      const roundNumber = Number(raw.roundNumber);
      const crashPoint = Number(raw.crashPoint);
      const phase = raw.phase;

      if (
        !Number.isInteger(roundNumber) ||
        (phase !== 'waiting' && phase !== 'flight' && phase !== 'crashed') ||
        !Number.isFinite(crashPoint)
      ) {
        onCurrent(null);
        return;
      }

      onCurrent({
        roundNumber,
        phase,
        crashPoint,
        roundStartedAt: typeof raw.roundStartedAt === 'number' ? raw.roundStartedAt : undefined,
        flightStartedAt: typeof raw.flightStartedAt === 'number' ? raw.flightStartedAt : undefined,
        updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : undefined,
      });
    },
    (error) => {
      if (disposed) return;
      if (isPermissionDeniedError(error)) {
        rootClosed = true;
        onClosedChange(true, 'PERMISSION_DENIED');
      }
    }
  );

  return () => {
    disposed = true;
    unsubEnabled();
    unsubCurrent();
  };
}

export async function sendCrashOverride(
  targetRoundNumber: number,
  crashPoint: number,
  currentState: CrashCurrentData | null
): Promise<void> {
  if (!Number.isInteger(targetRoundNumber) || targetRoundNumber <= 0) {
    throw new Error('رقم الجولة المستهدفة غير صالح');
  }
  if (!Number.isFinite(crashPoint) || crashPoint < 1) {
    throw new Error('قيمة التوقع يجب أن تكون 1.00 أو أكبر');
  }

  if (currentState) {
    const isCurrentWaiting =
      targetRoundNumber === currentState.roundNumber && currentState.phase === 'waiting';
    const isFutureRound = targetRoundNumber > currentState.roundNumber;

    if (!isCurrentWaiting && !isFutureRound) {
      throw new Error('ممنوع إرسال Override لجولة بدأت بالفعل أو انتهت');
    }
  }

  const db = getCrashDatabase();
  const payload: CrashOverridePayload = {
    roundNumber: targetRoundNumber,
    crashPoint: Math.round(crashPoint * 100) / 100,
    updatedAt: Date.now(),
  };

  await set(ref(db, 'crash/override'), payload);
}
