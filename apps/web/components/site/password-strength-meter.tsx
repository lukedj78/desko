'use client';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Indicatore di forza password con checklist requisiti.
 *
 * Strategia di scoring:
 *   1. Lunghezza ≥ 8        +1
 *   2. Lunghezza ≥ 12       +1 (bonus)
 *   3. Lettera maiuscola    +1
 *   4. Numero               +1
 *   5. Carattere speciale   +1
 *
 * Score 0..5 → mappato a 5 livelli: weak / poor / fair / good / strong.
 *
 * I primi 3 requisiti (≥8, maiuscola, numero) sono CONSIDERATI MINIMI.
 * `meetsMinimum` è esposto per gating del submit:
 *
 *   const { meetsMinimum, score } = passwordStrength(value);
 *   <Button disabled={!meetsMinimum}>...</Button>
 */

type Requirement = {
  key: string;
  label: string;
  test: (pwd: string) => boolean;
  required: boolean;
};

const REQUIREMENTS: Requirement[] = [
  {
    key: 'length',
    label: 'Almeno 8 caratteri',
    test: (p) => p.length >= 8,
    required: true,
  },
  {
    key: 'uppercase',
    label: 'Una lettera maiuscola (A–Z)',
    test: (p) => /[A-Z]/.test(p),
    required: true,
  },
  {
    key: 'number',
    label: 'Un numero (0–9)',
    test: (p) => /\d/.test(p),
    required: true,
  },
  {
    key: 'special',
    label: 'Un carattere speciale (consigliato)',
    test: (p) => /[^A-Za-z0-9]/.test(p),
    required: false,
  },
  {
    key: 'long',
    label: '12+ caratteri (consigliato)',
    test: (p) => p.length >= 12,
    required: false,
  },
];

type Strength = {
  score: number; // 0..5
  level: 'empty' | 'weak' | 'poor' | 'fair' | 'good' | 'strong';
  label: string;
  color: 'error' | 'warning' | 'info' | 'success';
  meetsMinimum: boolean; // tutti i required soddisfatti
  requirements: Array<Requirement & { met: boolean }>;
};

export function passwordStrength(password: string): Strength {
  if (!password) {
    return {
      score: 0,
      level: 'empty',
      label: 'Inizia a digitare',
      color: 'error',
      meetsMinimum: false,
      requirements: REQUIREMENTS.map((r) => ({ ...r, met: false })),
    };
  }

  const requirements = REQUIREMENTS.map((r) => ({ ...r, met: r.test(password) }));
  const score = requirements.filter((r) => r.met).length;
  const meetsMinimum = requirements.filter((r) => r.required).every((r) => r.met);

  let level: Strength['level'];
  let label: string;
  let color: Strength['color'];

  if (score <= 1) {
    level = 'weak';
    label = 'Debole';
    color = 'error';
  } else if (score === 2) {
    level = 'poor';
    label = 'Insufficiente';
    color = 'error';
  } else if (score === 3) {
    level = 'fair';
    label = meetsMinimum ? 'Sufficiente' : 'Mancano requisiti';
    color = meetsMinimum ? 'warning' : 'error';
  } else if (score === 4) {
    level = 'good';
    label = 'Buona';
    color = 'info';
  } else {
    level = 'strong';
    label = 'Forte';
    color = 'success';
  }

  return { score, level, label, color, meetsMinimum, requirements };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = passwordStrength(password);
  const pct = (strength.score / REQUIREMENTS.length) * 100;

  const colorMap: Record<Strength['color'], string> = {
    error: '#C73E44',
    warning: '#E8B931',
    info: '#3D87C9',
    success: '#2D7A3F',
  };

  return (
    <Stack
      spacing={1.25}
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        backgroundColor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Bar + label */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Forza password
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: colorMap[strength.color],
            fontWeight: 700,
            fontSize: 12,
            fontFamily: 'var(--font-jetbrains)',
          }}
        >
          {strength.label}
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(14,15,12,0.06)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: colorMap[strength.color],
            transition: 'width 200ms ease, background-color 200ms ease',
          },
        }}
      />

      {/* Checklist */}
      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
        {strength.requirements.map((req) => (
          <Stack key={req.key} direction="row" spacing={1} alignItems="center">
            {req.met ? (
              <CheckCircleOutlineIcon
                sx={{ color: 'success.main', fontSize: 14, flexShrink: 0 }}
              />
            ) : (
              <RadioButtonUncheckedIcon
                sx={{
                  color: req.required ? 'text.secondary' : 'text.disabled',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              variant="caption"
              sx={{
                fontSize: 12,
                color: req.met
                  ? 'success.main'
                  : req.required
                  ? 'text.primary'
                  : 'text.secondary',
                fontWeight: req.met ? 600 : 400,
                textDecoration: req.met ? 'none' : 'none',
              }}
            >
              {req.label}
              {!req.required ? (
                <Typography
                  component="span"
                  sx={{ color: 'text.disabled', ml: 0.5, fontSize: 11 }}
                >
                  · opzionale
                </Typography>
              ) : null}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
