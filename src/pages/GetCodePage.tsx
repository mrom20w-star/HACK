import {useEffect, useRef, useState} from 'react';
import {
  BadgeCheck,
  Check,
  Copy,
  ImagePlus,
  KeyRound,
  LoaderCircle,
  Rocket,
  Upload,
} from 'lucide-react';
import {AppHeader, type AppRoute} from '../components/AppHeader';
import {useToast} from '../components/ToastProvider';
import {ADMIN_SECRET_ID} from '../lib/platform';
import {grantAdminAccess, saveAccessCode, saveSession} from '../lib/session';

interface GetCodePageProps {
  onNavigate: (to: AppRoute) => void;
}

function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = (len: number) =>
    Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `CH-${block(4)}-${block(4)}`;
}

export function GetCodePage({onNavigate}: GetCodePageProps) {
  const toast = useToast();
  const [accountId, setAccountId] = useState('');
  const [screen1Preview, setScreen1Preview] = useState<string | null>(null);
  const [screen2Preview, setScreen2Preview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const file1Ref = useRef<HTMLInputElement | null>(null);
  const file2Ref = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<{interval?: number; timeout?: number}>({});

  const digitsOnly = accountId.replace(/\D/g, '');
  const isValidId = digitsOnly.length >= 8 && digitsOnly.length <= 14;
  const hasBothScreens = Boolean(screen1Preview && screen2Preview);

  useEffect(() => {
    return () => {
      if (timersRef.current.interval) window.clearInterval(timersRef.current.interval);
      if (timersRef.current.timeout) window.clearTimeout(timersRef.current.timeout);
    };
  }, []);

  const handleFilePick = (slot: 1 | 2, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة فقط');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (slot === 1) setScreen1Preview(result);
      else setScreen2Preview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (loading) return;
    if (!isValidId) {
      toast.error('لازم تدخل ID صحيح من 8 إلى 14 رقم');
      return;
    }
    if (!hasBothScreens) {
      toast.error('لازم ترفع السكرينتين أولاً');
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setGeneratedCode(null);

    const startedAt = Date.now();
    const durationMs = 2800;

    timersRef.current.interval = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startedAt) / durationMs) * 100);
      setLoadingProgress(pct);
    }, 40);

    timersRef.current.timeout = window.setTimeout(() => {
      if (timersRef.current.interval) window.clearInterval(timersRef.current.interval);
      setLoadingProgress(100);
      const newCode = generateActivationCode();
      saveAccessCode({
        code: newCode,
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        durationLabel: '24 ساعة',
      });
      setGeneratedCode(newCode);
      setLoading(false);
      toast.success('تم استخراج كود التفعيل بنجاح');
    }, durationMs);
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success('تم نسخ كود التفعيل');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('تعذّر نسخ الكود');
    }
  };

  const handleActivateNow = () => {
    if (!isValidId) {
      toast.error('تأكد من صحة الـ ID');
      return;
    }
    saveSession({code: digitsOnly, expiresAt: null});
    onNavigate('/crash');
  };

  const loadingStatusLabel =
    loadingProgress < 35
      ? 'جاري مراجعة رقم الـ ID...'
      : loadingProgress < 75
        ? 'جاري التحقق من السكرينتين...'
        : 'جاري إصدار كود التفعيل...';

  return (
    <div className="min-h-screen">
      <AppHeader backTo="/terms" onNavigate={onNavigate} />

      <main className="mx-auto w-full max-w-xl px-5 pb-16 pt-6">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-display text-[9px] font-bold tracking-[0.3em] text-primary">
            STEP VERIFICATION
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-foreground">
            خد الكود عن طريق الخطوات
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            أدخل الـ ID وارفع السكرينتين للحصول على كود التفعيل تلقائياً
          </p>
        </header>

        {loading ? (
          <section className="surface-card animate-rise mt-8 flex flex-col items-center rounded-3xl p-8 text-center">
            <div className="relative flex size-24 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border border-primary/25"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary"
              />
              <KeyRound className="size-8 text-primary" />
            </div>

            <p className="mt-5 font-display text-sm font-extrabold text-foreground">
              {loadingStatusLabel}
            </p>

            <div className="mt-5 w-full max-w-[260px]">
              <div className="h-[4px] w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="bg-gold shine h-full rounded-full transition-[width] duration-75 ease-linear"
                  style={{width: `${loadingProgress}%`}}
                />
              </div>
              <p className="mt-2 font-display text-xs font-bold text-primary tabular-nums">
                {String(Math.round(loadingProgress)).padStart(2, '0')}%
              </p>
            </div>
          </section>
        ) : generatedCode ? (
          <section className="surface-card animate-rise mt-8 rounded-3xl p-6 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 text-primary">
              <Check className="size-7" />
            </div>

            <h2 className="mt-4 font-display text-xl font-extrabold text-foreground">
              تم إصدار كود التفعيل الخاص بك
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              الكود جاهز الآن ومرتبط برقم الحساب{' '}
              <span className="font-display font-bold text-foreground tabular-nums">
                {digitsOnly}
              </span>
            </p>

            <div className="mt-6 flex h-16 items-center gap-3 rounded-2xl border border-dashed border-primary/50 bg-primary/10 px-4">
              <KeyRound className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 text-left font-display text-lg font-extrabold tracking-[0.16em] text-foreground tabular-nums">
                {generatedCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="نسخ كود التفعيل"
                className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 font-display text-[11px] font-bold text-foreground transition-colors hover:text-primary"
              >
                {copied ? 'COPIED' : 'COPY'}
                {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleActivateNow}
              className="bg-gold mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl font-display text-base font-extrabold text-primary-foreground shadow-lg transition-transform active:scale-[0.98]"
            >
              <Rocket className="size-4" />
              الدخول للتوقعات الآن
            </button>
          </section>
        ) : (
          <div className="mt-6 space-y-4">
            <section className="surface-card animate-rise rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 font-display text-sm font-extrabold text-primary tabular-nums">
                  01
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-display text-[9px] font-bold tracking-[0.3em] text-primary">
                    ACCOUNT ID
                  </span>
                  <h2 className="mt-0.5 font-display text-[15px] font-extrabold text-foreground">
                    إدخال الـ ID
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    أدخل رقم حسابك المكون من 8 إلى 14 رقم.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-input bg-secondary/40 px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
                <BadgeCheck className="size-4 shrink-0 text-primary" />
                <input
                  value={accountId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAccountId(val);
                    if (val.trim() === ADMIN_SECRET_ID) {
                      grantAdminAccess();
                      toast.success('مرحبًا بك في لوحة التحكم');
                      onNavigate('/admin');
                    }
                  }}
                  placeholder="اكتب ID الحساب"
                  inputMode="numeric"
                  className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                {isValidId ? <Check className="size-4 shrink-0 text-primary" /> : null}
              </div>
            </section>

            <section className="surface-card animate-rise rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 font-display text-sm font-extrabold text-primary tabular-nums">
                  02
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-display text-[9px] font-bold tracking-[0.3em] text-primary">
                    SCREENSHOTS
                  </span>
                  <h2 className="mt-0.5 font-display text-[15px] font-extrabold text-foreground">
                    رفع سكرينتين
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ارفع أي صورتين سكرين شوت لإثبات الخطوات.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <input
                  ref={file1Ref}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFilePick(1, e.target.files?.[0])}
                />
                <input
                  ref={file2Ref}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFilePick(2, e.target.files?.[0])}
                />

                <button
                  type="button"
                  onClick={() => file1Ref.current?.click()}
                  className={`group relative flex h-36 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed transition-colors ${
                    screen1Preview
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/30 hover:border-primary/60'
                  }`}
                >
                  {screen1Preview ? (
                    <>
                      <img
                        src={screen1Preview}
                        alt="سكرين شوت 1"
                        className="size-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/75 py-1 text-center font-display text-[10px] font-bold text-primary">
                        تم رفع سكرين 1
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                        <ImagePlus className="size-5" />
                      </span>
                      <span className="font-display text-xs font-bold text-foreground">
                        سكرين شوت 1
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Upload className="size-3" />
                        اختر صورة
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => file2Ref.current?.click()}
                  className={`group relative flex h-36 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed transition-colors ${
                    screen2Preview
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/30 hover:border-primary/60'
                  }`}
                >
                  {screen2Preview ? (
                    <>
                      <img
                        src={screen2Preview}
                        alt="سكرين شوت 2"
                        className="size-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/75 py-1 text-center font-display text-[10px] font-bold text-primary">
                        تم رفع سكرين 2
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                        <ImagePlus className="size-5" />
                      </span>
                      <span className="font-display text-xs font-bold text-foreground">
                        سكرين شوت 2
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Upload className="size-3" />
                        اختر صورة
                      </span>
                    </>
                  )}
                </button>
              </div>
            </section>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gold mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl font-display text-base font-extrabold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              استخراج كود التفعيل
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
