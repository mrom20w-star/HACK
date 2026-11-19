import {useCallback, useEffect, useState} from 'react';
import {Copy, KeyRound, LoaderCircle, RefreshCw, Rocket, Shuffle, Trash2} from 'lucide-react';
import {AppHeader, type AppRoute} from '../components/AppHeader';
import {useToast} from '../components/ToastProvider';
import {sendCrashOverride, subscribeToCrash, type CrashCurrentData} from '../lib/crashFirebase';
import {
  deleteAccessCode,
  formatRemainingTime,
  isAdminAuthorized,
  loadAccessCodes,
  saveAccessCode,
  type AccessCodeRecord,
} from '../lib/session';

interface AdminPageProps {
  onNavigate: (to: AppRoute) => void;
}

const DURATION_PRESETS: Array<{label: string; ms: number | null}> = [
  {label: '30 دقيقة', ms: 1800000},
  {label: 'ساعة واحدة', ms: 3600000},
  {label: '12 ساعة', ms: 43200000},
  {label: '24 ساعة', ms: 86400000},
  {label: '7 أيام', ms: 604800000},
  {label: 'مدى الحياة', ms: null},
];

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = (len: number) =>
    Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `DV-${block(4)}-${block(4)}`;
}

export function AdminPage({onNavigate}: AdminPageProps) {
  const toast = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [codes, setCodes] = useState<AccessCodeRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [crashCurrent, setCrashCurrent] = useState<CrashCurrentData | null>(null);
  const [overrideRound, setOverrideRound] = useState('');
  const [overridePoint, setOverridePoint] = useState('');
  const [sendingOverride, setSendingOverride] = useState(false);

  useEffect(() => {
    if (!isAdminAuthorized()) {
      onNavigate('/');
      return;
    }
    setAuthorized(true);
  }, [onNavigate]);

  const refreshCodes = useCallback(() => {
    setLoadingList(true);
    try {
      setCodes(loadAccessCodes());
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    refreshCodes();
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const unsubCrash = subscribeToCrash({
      onCurrent: (data) => setCrashCurrent(data),
      onClosedChange: () => {},
    });
    return () => {
      window.clearInterval(timer);
      unsubCrash();
    };
  }, [authorized, refreshCodes]);

  if (!authorized) return null;

  const handleSave = () => {
    const clean = codeInput.trim().toUpperCase();
    if (!clean) {
      toast.error('أدخل نص الكود أولاً');
      return;
    }
    const preset = DURATION_PRESETS[selectedPresetIdx];
    setSaving(true);
    try {
      saveAccessCode({
        code: clean,
        createdAt: Date.now(),
        expiresAt: preset.ms === null ? null : Date.now() + preset.ms,
        durationLabel: preset.label,
      });
      toast.success('تم حفظ وتفعيل الكود بالسيرفر');
      setCodeInput('');
      refreshCodes();
    } catch {
      toast.error('تعذّر حفظ الكود');
    } finally {
      setSaving(false);
    }
  };

  const handleSendOverride = async () => {
    const targetRound = Number(overrideRound.trim());
    const targetPoint = Number(overridePoint.trim());
    setSendingOverride(true);
    try {
      await sendCrashOverride(targetRound, targetPoint, crashCurrent);
      toast.success(`تم إرسال توقع الجولة #${targetRound}`);
      setOverrideRound('');
      setOverridePoint('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذّر إرسال الـ Override';
      toast.error(msg);
    } finally {
      setSendingOverride(false);
    }
  };

  const handleDelete = (code: string) => {
    deleteAccessCode(code);
    toast.success('تم حذف الكود');
    refreshCodes();
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('تم نسخ الكود');
    } catch {
      toast.error('تعذّر نسخ الكود');
    }
  };

  const suggestedRound = crashCurrent
    ? crashCurrent.phase === 'waiting'
      ? crashCurrent.roundNumber
      : crashCurrent.roundNumber + 1
    : '';

  return (
    <div className="min-h-screen">
      <AppHeader backTo="/" usersOnline={2481} onNavigate={onNavigate} />

      <main className="mx-auto w-full max-w-xl px-5 pb-16 pt-6">
        <header className="text-center">
          <p className="font-display text-[10px] tracking-[0.45em] text-primary">
            كراش هاك PANEL
          </p>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-foreground">
            لوحة تحكم الأكواد
          </h1>
        </header>

        <section className="surface-card animate-rise mt-6 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold text-foreground">
              توقع مخصص (Crash Override)
            </h2>
            <span className="rounded-full border border-primary/50 bg-primary/15 px-2.5 py-0.5 font-display text-[10px] font-bold tracking-[0.18em] text-primary tabular-nums">
              {crashCurrent ? `#${crashCurrent.roundNumber} · ${crashCurrent.phase.toUpperCase()}` : 'OFFLINE'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <input
              value={overrideRound}
              onChange={(e) => setOverrideRound(e.target.value.replace(/\D/g, ''))}
              placeholder={suggestedRound ? `الجولة (${suggestedRound})` : 'رقم الجولة'}
              inputMode="numeric"
              className="h-12 rounded-[15px] border border-input bg-secondary/40 px-4 font-display text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground tabular-nums"
            />
            <input
              value={overridePoint}
              onChange={(e) => setOverridePoint(e.target.value)}
              placeholder="المضاعف (مثلاً 2.33)"
              inputMode="decimal"
              className="h-12 rounded-[15px] border border-input bg-secondary/40 px-4 font-display text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground tabular-nums"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSendOverride()}
            disabled={sendingOverride}
            className="bg-gold mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[15px] font-display text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {sendingOverride ? <LoaderCircle className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            إرسال إلى crash/override
          </button>
        </section>

        <section className="surface-card animate-rise mt-5 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold text-foreground">
              إنشاء مفتاح مرور جديد
            </h2>
            <span className="rounded-full border border-primary/50 bg-primary/15 px-2.5 py-0.5 font-display text-[10px] font-bold tracking-[0.18em] text-primary">
              GENERATOR
            </span>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">أدخل نص كود المرور</p>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-3">
            <div className="flex items-center gap-3 rounded-[15px] border border-input bg-secondary/40 px-4 focus-within:border-primary">
              <KeyRound className="size-4 shrink-0 text-primary" />
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="مثال : XP-7738-VIP"
                className="h-12 w-full bg-transparent font-display text-sm tracking-[0.1em] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="button"
              onClick={() => setCodeInput(generateRandomCode())}
              className="flex h-12 items-center gap-2 rounded-[15px] border border-primary/40 bg-primary/10 px-4 font-display text-xs font-bold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Shuffle className="size-4" />
              توليد
            </button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">اختر مدة صلاحية الكود</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DURATION_PRESETS.map((preset, idx) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSelectedPresetIdx(idx)}
                className={`h-11 rounded-[15px] border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  idx === selectedPresetIdx
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-foreground font-display text-sm font-extrabold text-background transition-transform active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            حفظ وتفعيل الكود بالسيرفر
          </button>
        </section>

        <section className="surface-card animate-rise mt-5 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold text-foreground">
              الأكواد الفعالة
            </h2>
            <button
              type="button"
              onClick={refreshCodes}
              aria-label="تحديث"
              className="flex size-9 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-secondary"
            >
              <RefreshCw className={`size-4 ${loadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <ul className="mt-4 space-y-3">
            {codes.length === 0 && !loadingList ? (
              <li className="text-center text-xs text-muted-foreground">لا توجد أكواد بعد</li>
            ) : null}
            {codes.map((item) => {
              const expired = item.expiresAt !== null && item.expiresAt <= now;
              return (
                <li
                  key={item.code}
                  className={`flex items-center justify-between gap-3 rounded-[15px] border px-3 py-3 ${
                    expired
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'border-primary/30 bg-primary/5'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-extrabold tracking-[0.1em] text-foreground">
                      {item.code}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                      {item.durationLabel} ·{' '}
                      <span className={expired ? 'text-destructive' : 'text-primary'}>
                        {expired
                          ? 'منتهي'
                          : item.expiresAt === null
                            ? 'نشط'
                            : formatRemainingTime(item.expiresAt - now)}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.code)}
                      aria-label="نسخ"
                      className="flex size-9 items-center justify-center rounded-[12px] border border-border text-foreground transition-colors hover:bg-secondary"
                    >
                      <Copy className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.code)}
                      aria-label="حذف"
                      className="flex size-9 items-center justify-center rounded-[12px] border border-destructive/50 text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
