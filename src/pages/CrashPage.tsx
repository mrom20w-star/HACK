import {useEffect, useRef, useState} from 'react';
import {Lock, Rocket, ShieldCheck, Timer} from 'lucide-react';
import {AppHeader, type AppRoute} from '../components/AppHeader';
import {BrandName} from '../components/BrandName';
import {LatestWins} from '../components/LatestWins';
import {CRASH_ICON_SRC} from '../lib/platform';
import {getSession} from '../lib/session';
import {subscribeToCrash, type CrashCurrentData, type CrashPhase} from '../lib/crashFirebase';

interface CrashPageProps {
  onNavigate: (to: AppRoute) => void;
}

interface ShownPrediction {
  roundNumber: number;
  crashPoint: number;
}

export function CrashPage({onNavigate}: CrashPageProps) {
  const [authorized, setAuthorized] = useState(false);
  const [dbClosed, setDbClosed] = useState(false);
  const [shownPrediction, setShownPrediction] = useState<ShownPrediction | null>(null);
  const [livePhase, setLivePhase] = useState<CrashPhase | null>(null);
  const [liveRoundNumber, setLiveRoundNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [autoActive, setAutoActive] = useState(true);
  const [iconError, setIconError] = useState(false);

  // Strict single-round lock: tracks the last round whose prediction was displayed
  const lastShownRoundRef = useRef<number | null>(null);
  const historyRecordedRoundsRef = useRef<Set<number>>(new Set());
  const shownPredictionRef = useRef<ShownPrediction | null>(null);

  useEffect(() => {
    shownPredictionRef.current = shownPrediction;
  }, [shownPrediction]);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      onNavigate('/');
      return;
    }
    setAuthorized(true);
  }, [onNavigate]);

  useEffect(() => {
    if (!authorized || !autoActive) return;

    const unsubscribe = subscribeToCrash({
      onClosedChange: (closed) => {
        setDbClosed(closed);
        if (closed) {
          lastShownRoundRef.current = null;
          setShownPrediction(null);
          setLivePhase(null);
        }
      },
      onCurrent: (data: CrashCurrentData | null) => {
        if (!data) return;

        setLivePhase(data.phase);
        setLiveRoundNumber(data.roundNumber);

        // Strict display gate:
        // 1. data.phase === "waiting" (immediately before takeoff)
        // 2. data.roundNumber !== lastShownRound (and strictly newer if a round was already shown)
        // 3. data.crashPoint >= 1
        if (
          data.phase === 'waiting' &&
          data.roundNumber !== lastShownRoundRef.current &&
          (lastShownRoundRef.current === null || data.roundNumber > lastShownRoundRef.current) &&
          data.crashPoint >= 1
        ) {
          lastShownRoundRef.current = data.roundNumber;
          const nextPrediction: ShownPrediction = {
            roundNumber: data.roundNumber,
            crashPoint: Math.round(data.crashPoint * 100) / 100,
          };
          shownPredictionRef.current = nextPrediction;
          setShownPrediction(nextPrediction);
          return;
        }

        // During "flight" and "crashed", prediction updates are completely locked.
        // Record the round into LAST SIGNALS only after the displayed round finishes (crashed).
        if (
          data.phase === 'crashed' &&
          data.roundNumber === lastShownRoundRef.current &&
          shownPredictionRef.current !== null &&
          !historyRecordedRoundsRef.current.has(data.roundNumber)
        ) {
          historyRecordedRoundsRef.current.add(data.roundNumber);
          const lockedPoint = shownPredictionRef.current.crashPoint;
          setHistory((prev) => [lockedPoint, ...prev].slice(0, 8));
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [authorized, autoActive]);

  if (!authorized) return null;

  const phaseBadgeText = dbClosed
    ? 'CLOSED'
    : livePhase === 'waiting'
      ? 'WAITING'
      : livePhase === 'flight'
        ? 'FLIGHT'
        : livePhase === 'crashed'
          ? 'CRASHED'
          : 'SYNC';

  const statusHelperText = dbClosed
    ? 'قاعدة البيانات مغلقة — تم إيقاف التوقعات'
    : shownPrediction !== null
      ? `ROUND #${shownPrediction.roundNumber}`
      : livePhase === 'flight' || livePhase === 'crashed'
        ? `الجولة #${liveRoundNumber ?? '—'} جارية — في انتظار الجولة القادمة`
        : 'في انتظار بيانات الجولة من الخادم';

  return (
    <div className="min-h-screen">
      <AppHeader backTo="/terms" usersOnline={6314} onNavigate={onNavigate} />

      <main className="mx-auto w-full max-w-xl px-5 pb-16">
        <section className="mt-6 flex flex-col items-center text-center">
          <span className="flex size-28 items-center justify-center overflow-hidden rounded-[26px] border border-primary/30 bg-gradient-to-b from-primary/15 to-transparent">
            {!iconError ? (
              <img
                src={CRASH_ICON_SRC}
                alt="شعار لعبة الطيارة"
                width={512}
                height={512}
                referrerPolicy="no-referrer"
                onError={() => setIconError(true)}
                className="size-24 rounded-2xl object-cover drop-shadow-[0_0_22px_oklch(0.58_0.23_27/0.55)]"
              />
            ) : (
              <Rocket className="size-12 text-primary" />
            )}
          </span>
          <BrandName className="mt-3 text-lg" />
          <p className="mt-1 font-display text-[10px] tracking-[0.4em] text-primary">
            CRASH SIGNALS
          </p>
        </section>

        {dbClosed ? (
          <section
            dir="rtl"
            className="surface-card animate-rise mt-6 flex items-center gap-3 rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-destructive"
          >
            <Lock className="size-4 shrink-0" />
            <p className="font-semibold">
              قاعدة البيانات مغلقة حالياً — تم إيقاف إظهار أي توقعات حتى إعادة الفتح.
            </p>
          </section>
        ) : null}

        <section className="mt-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <p className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">
              LAST SIGNALS
            </p>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {history.length === 0 ? (
              <span className="text-[11px] text-muted-foreground">لا توجد جولات بعد</span>
            ) : (
              history.map((val, idx) => (
                <span
                  key={`${val}-${idx}`}
                  className={`cell-pop shrink-0 rounded-full border px-3 py-1 font-display text-[11px] font-bold tabular-nums ${
                    val >= 2
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border bg-secondary/40 text-muted-foreground'
                  }`}
                >
                  {val.toFixed(2)}x
                </span>
              ))
            )}
          </div>
        </section>

        <section className="mt-4 flex justify-center">
          <div className="surface-card relative flex h-[200px] w-full max-w-[400px] flex-col justify-between overflow-hidden rounded-[24px] p-4">
            <div aria-hidden="true" className="odds-sweep rounded-[24px]" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 size-36 animate-pulse rounded-full bg-primary/20 blur-3xl"
            />
            <div className="relative flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2 py-0.5 font-display text-[8px] font-bold tracking-[0.25em] text-muted-foreground">
                <Timer className="size-3 text-primary" />
                NEXT
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-display text-[8px] font-bold tracking-[0.25em] ${
                  dbClosed
                    ? 'border border-destructive/50 bg-destructive/15 text-destructive'
                    : livePhase === 'waiting'
                      ? 'border border-primary/50 bg-primary/10 text-primary'
                      : 'border border-border bg-secondary/40 text-muted-foreground'
                }`}
              >
                {dbClosed ? (
                  <Lock className="size-3" />
                ) : (
                  <Rocket className={`size-3 ${livePhase === 'flight' ? 'animate-bounce' : ''}`} />
                )}
                {phaseBadgeText}
              </span>
            </div>

            {dbClosed ? (
              <p className="relative mx-auto px-4 py-1 text-center font-display text-lg font-extrabold text-destructive">
                قاعدة البيانات مغلقة
              </p>
            ) : (
              <p
                className={`odds-glow relative mx-auto px-4 py-1 text-center font-display text-[56px] sm:text-[64px] font-extrabold leading-none tabular-nums ${
                  shownPrediction === null ? 'opacity-40' : ''
                }`}
              >
                {shownPrediction === null ? '—' : `${shownPrediction.crashPoint.toFixed(2)}x`}
              </p>
            )}

            <p className="relative text-center font-display text-[9px] tracking-[0.2em] text-muted-foreground tabular-nums">
              {statusHelperText}
            </p>
          </div>
        </section>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setAutoActive(true)}
            disabled={dbClosed}
            className="bg-gold flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-sm font-extrabold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Rocket className={`size-4 ${autoActive && !dbClosed ? 'animate-pulse' : ''}`} />
            {dbClosed
              ? 'قاعدة البيانات مغلقة'
              : autoActive
                ? livePhase === 'waiting' && shownPrediction !== null
                  ? `جولة #${shownPrediction.roundNumber} جاهزة`
                  : 'مزامنة تلقائية مباشرة'
                : 'بدأ'}
          </button>
        </div>

        <LatestWins />
      </main>
    </div>
  );
}
