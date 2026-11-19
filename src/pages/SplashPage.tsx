import {useEffect, useState} from 'react';
import {BrandName} from '../components/BrandName';
import {EMBLEM_SRC} from '../lib/platform';
import type {AppRoute} from '../components/AppHeader';

interface SplashPageProps {
  onNavigate: (to: AppRoute) => void;
}

export function SplashPage({onNavigate}: SplashPageProps) {
  const [progress, setProgress] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - startedAt) / 3000) * 100));
    }, 30);
    const timeout = window.setTimeout(() => {
      onNavigate('/terms');
    }, 3050);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [onNavigate]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-primary/8 to-transparent"
      />

      <div className="relative flex flex-col items-center">
        <div className="relative flex size-44 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-primary/25"
          />
          <span
            aria-hidden="true"
            className="absolute inset-3 rounded-full border border-primary/15"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary/70 [animation-duration:3.5s]"
          />
          {!imgError ? (
            <img
              src={EMBLEM_SRC}
              alt="شعار كراش هاك"
              width={256}
              height={256}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="animate-glow-pulse size-28 rounded-full object-cover"
            />
          ) : (
            <div className="animate-glow-pulse flex size-28 items-center justify-center rounded-full border border-primary/40 bg-secondary font-display text-2xl font-extrabold text-primary">
              IR
            </div>
          )}
        </div>

        <h1 className="animate-rise mt-9">
          <BrandName className="text-[2.6rem]" />
        </h1>

        <div className="animate-rise mt-4 flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/60" />
          <p className="text-[10px] tracking-[0.5em] text-muted-foreground">EXCLUSIVE CLUB</p>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-primary/60" />
        </div>
      </div>

      <div className="relative mt-14 w-full max-w-[260px]">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="bg-gold shine h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{width: `${progress}%`}}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] tracking-[0.3em] text-muted-foreground">
          <span>جاري التحميل</span>
          <span className="font-display text-primary tabular-nums">
            {String(Math.round(progress)).padStart(2, '0')}%
          </span>
        </div>
      </div>

      <p className="absolute bottom-8 text-[10px] tracking-[0.35em] text-muted-foreground/70">
        كراش هاك © {new Date().getFullYear()}
      </p>
    </main>
  );
}
