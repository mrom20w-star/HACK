import {ArrowLeft} from 'lucide-react';
import {BrandName} from './BrandName';

export type AppRoute = '/' | '/terms' | '/crash' | '/admin' | '/get-code';

interface AppHeaderProps {
  backTo?: AppRoute;
  usersOnline?: number;
  onNavigate: (to: AppRoute) => void;
}

export function AppHeader({backTo, usersOnline, onNavigate}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/30 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-3 min-w-0">
          {backTo ? (
            <button
              type="button"
              onClick={() => onNavigate(backTo)}
              aria-label="رجوع"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-4" />
            </button>
          ) : null}
          <BrandName className="text-base" />
        </div>

        {typeof usersOnline === 'number' ? (
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-secondary/20 px-3 py-1.5">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            <span className="text-[11px] tracking-wide text-muted-foreground whitespace-nowrap">
              Users Online :
            </span>
            <span className="font-display text-xs font-bold text-primary tabular-nums">
              {usersOnline.toLocaleString('en-US')}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
