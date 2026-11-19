import {useState, type ReactNode} from 'react';
import {Check, Copy, KeyRound, Ticket} from 'lucide-react';
import {AppHeader, type AppRoute} from '../components/AppHeader';
import {BrandName} from '../components/BrandName';
import {useToast} from '../components/ToastProvider';
import {BRAND_NAME, DEPOSIT_OPTIONS, EMBLEM_SRC, PROMO_CODE} from '../lib/platform';

interface TermsPageProps {
  onNavigate: (to: AppRoute) => void;
}

interface StepCardProps {
  index: number;
  badge: string;
  title: string;
  description: string;
  children?: ReactNode;
}

function StepCard({index, badge, title, description, children}: StepCardProps) {
  return (
    <li className="animate-rise surface-card relative rounded-3xl p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 font-display text-sm font-extrabold text-primary tabular-nums">
          {String(index).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <span className="font-display text-[9px] font-bold tracking-[0.3em] text-primary">
            {badge}
          </span>
          <h2 className="mt-0.5 font-display text-[15px] font-extrabold text-foreground">
            {title}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </li>
  );
}

export function TermsPage({onNavigate}: TermsPageProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [emblemError, setEmblemError] = useState(false);

  const handleCopyPromo = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      toast.success('تم نسخ البروموكود بنجاح');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('تعذّر نسخ الكود');
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader backTo="/" onNavigate={onNavigate} />

      <main className="mx-auto w-full max-w-xl px-5 pb-16">
        <section className="mt-7 flex flex-col items-center text-center">
          {!emblemError ? (
            <img
              src={EMBLEM_SRC}
              alt={`شعار ${BRAND_NAME}`}
              width={96}
              height={96}
              referrerPolicy="no-referrer"
              onError={() => setEmblemError(true)}
              className="size-16 rounded-2xl border border-primary/30 object-cover p-1"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-secondary font-display text-lg font-extrabold text-primary">
              IR
            </div>
          )}

          <BrandName className="mt-3 text-xl" />

          <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-display text-[9px] font-bold tracking-[0.3em] text-primary">
            ACCOUNT ACTIVATION
          </span>

          <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-foreground">
            أكمل الشروط لتفعيل عضويتك
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            خطوتان بسيطتان قبل استخراج كود التفعيل
          </p>
        </section>

        <ol className="mt-8 space-y-4">
          <StepCard
            index={1}
            badge="PROMO CODE"
            title="استخدام البروموكود"
            description="انسخ البروموكود واستخدمه أثناء إنشاء الحساب لربطه بالتطبيق."
          >
            <div className="flex h-14 w-full items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <Ticket className="size-4 text-primary" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[9px] font-bold tracking-[0.25em] text-muted-foreground">
                  PROMOCODE
                </p>
                <p className="font-cairo text-base font-extrabold tracking-[0.2em] text-foreground">
                  {PROMO_CODE}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyPromo}
                aria-label="نسخ البرومو كود"
                className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-display text-[10px] font-bold tracking-[0.15em] text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copied ? 'COPIED' : 'COPY'}
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </StepCard>

          <StepCard
            index={2}
            badge="DEPOSIT"
            title="إيداع التفعيل"
            description="الحد الأدنى للإيداع لتنشيط المحفظة (الأموال تبقى في رصيدك)."
          >
            <div className="grid grid-cols-2 gap-3">
              {DEPOSIT_OPTIONS.map((opt) => (
                <div
                  key={opt.unit}
                  className="rounded-xl border border-primary/25 bg-gradient-to-b from-primary/10 to-transparent p-3 text-center"
                >
                  <span className="mx-auto flex size-8 items-center justify-center rounded-full border border-primary/40 bg-primary/15 font-display text-xs font-extrabold text-primary">
                    {opt.symbol}
                  </span>
                  <p className="mt-2 font-display text-2xl font-extrabold leading-none text-foreground tabular-nums">
                    {opt.value}
                  </p>
                  <p className="mt-1.5 font-display text-[9px] font-bold tracking-[0.25em] text-primary/80">
                    {opt.unit}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{opt.note}</p>
                </div>
              ))}
            </div>
          </StepCard>
        </ol>

        <button
          type="button"
          onClick={() => onNavigate('/get-code')}
          className="bg-gold mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-xl font-display text-base font-extrabold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <KeyRound className="size-4" />
          خد الكود عن طريق الخطوات
        </button>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          يتم تفعيل العضوية بعد التحقق من إكمال جميع الشروط.
        </p>
      </main>
    </div>
  );
}
