import {useEffect, useState} from 'react';

interface WinEntry {
  id: string;
  bet: number;
  win: number;
}

const INITIAL_WINS: WinEntry[] = [
  {id: '27*******81', bet: 50, win: 300},
  {id: '41*******06', bet: 100, win: 640},
  {id: '63*******19', bet: 20, win: 148},
  {id: '18*******74', bet: 200, win: 910},
  {id: '92*******35', bet: 75, win: 412},
];

function createRandomWin(): WinEntry {
  const bets = [20, 40, 50, 75, 100, 120, 200, 250];
  const bet = bets[Math.floor(Math.random() * bets.length)] ?? 50;
  const mult = 1.5 + Math.random() * 8;
  const prefix = Math.floor(10 + Math.random() * 89);
  const suffix = Math.floor(10 + Math.random() * 89);
  return {
    id: `${prefix}*******${suffix}`,
    bet,
    win: Math.round(bet * mult),
  };
}

export function LatestWins() {
  const [wins, setWins] = useState<WinEntry[]>(INITIAL_WINS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWins((prev) => [createRandomWin(), ...prev].slice(0, 5));
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="surface-card mt-6 overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="font-display text-[10px] font-bold tracking-[0.3em] text-primary">
          LATEST WINS
        </p>
        <span className="flex items-center gap-2 text-[10px] tracking-widest text-muted-foreground">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-border px-4 py-2 font-display text-[10px] font-bold tracking-[0.12em] text-muted-foreground">
        <span>User id</span>
        <span className="text-center">BetAmount</span>
        <span className="text-right">WinAmount</span>
      </div>

      {wins.map((entry, idx) => (
        <div
          key={`${entry.id}-${idx}`}
          className="grid animate-rise grid-cols-3 gap-2 border-b border-border/60 px-4 py-2.5 text-xs last:border-0"
        >
          <span className="font-display text-foreground tabular-nums">{entry.id}</span>
          <span className="text-center text-muted-foreground tabular-nums">{entry.bet}</span>
          <span className="text-right font-display font-bold text-primary tabular-nums">
            {entry.win}
          </span>
        </div>
      ))}
    </section>
  );
}
