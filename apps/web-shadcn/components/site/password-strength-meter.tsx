'use client';

import { Check, Circle } from 'lucide-react';

import { cn } from '@desko/ui/lib/utils';

type Requirement = {
  key: string;
  label: string;
  test: (pwd: string) => boolean;
  required: boolean;
};

const REQUIREMENTS: Requirement[] = [
  { key: 'length', label: 'Almeno 8 caratteri', test: (p) => p.length >= 8, required: true },
  { key: 'uppercase', label: 'Una lettera maiuscola (A–Z)', test: (p) => /[A-Z]/.test(p), required: true },
  { key: 'number', label: 'Un numero (0–9)', test: (p) => /\d/.test(p), required: true },
  { key: 'special', label: 'Un carattere speciale (consigliato)', test: (p) => /[^A-Za-z0-9]/.test(p), required: false },
  { key: 'long', label: '12+ caratteri (consigliato)', test: (p) => p.length >= 12, required: false },
];

type Strength = {
  score: number;
  level: 'empty' | 'weak' | 'poor' | 'fair' | 'good' | 'strong';
  label: string;
  tone: 'destructive' | 'warning' | 'info' | 'success';
  meetsMinimum: boolean;
  requirements: Array<Requirement & { met: boolean }>;
};

export function passwordStrength(password: string): Strength {
  if (!password) {
    return {
      score: 0,
      level: 'empty',
      label: '',
      tone: 'destructive',
      meetsMinimum: false,
      requirements: REQUIREMENTS.map((r) => ({ ...r, met: false })),
    };
  }
  const reqs = REQUIREMENTS.map((r) => ({ ...r, met: r.test(password) }));
  const score = reqs.filter((r) => r.met).length;
  const meetsMinimum = reqs.filter((r) => r.required).every((r) => r.met);

  let level: Strength['level'] = 'weak';
  let label = 'Debole';
  let tone: Strength['tone'] = 'destructive';
  if (score >= 5) {
    level = 'strong';
    label = 'Molto sicura';
    tone = 'success';
  } else if (score === 4) {
    level = 'good';
    label = 'Buona';
    tone = 'success';
  } else if (score === 3) {
    level = 'fair';
    label = 'Discreta';
    tone = 'info';
  } else if (score === 2) {
    level = 'poor';
    label = 'Scarsa';
    tone = 'warning';
  }
  return { score, level, label, tone, meetsMinimum, requirements: reqs };
}

const BAR_TONES: Record<Strength['tone'], string> = {
  destructive: 'bg-destructive',
  warning: 'bg-warning',
  info: 'bg-info',
  success: 'bg-success',
};

const TEXT_TONES: Record<Strength['tone'], string> = {
  destructive: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  const s = passwordStrength(password);
  const pct = (s.score / REQUIREMENTS.length) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full transition-all', BAR_TONES[s.tone])}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={cn('font-mono text-[11px] font-semibold uppercase tracking-wider', TEXT_TONES[s.tone])}>
          {s.label}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {s.requirements.map((r) => (
          <li
            key={r.key}
            className={cn(
              'flex items-center gap-2 text-xs',
              r.met ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {r.met ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Circle className="size-3.5" />
            )}
            <span className={cn(r.met && 'line-through opacity-70')}>{r.label}</span>
            {!r.required ? (
              <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                bonus
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
