/**
 * Tailwind config per NativeWind v4 (Tailwind 3.4 — NON bumpare a 4.x:
 * NativeWind v4 legge il formato preset 3.x).
 *
 * Theme generato da `@desko/design-tokens` (DESIGN.md §2/§4) — valori
 * inlined perché questo file è CJS e i token sono sorgente TS.
 * Se i token cambiano, rigenerare da packages/design-tokens/src/{colors,radii}.ts.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // brand — Ocra Gold, unico accent. Mai ocra come testo su bianco.
        primary: {
          DEFAULT: '#E8B931',
          text: '#2B1F00',
          hover: '#F4C84A',
          active: '#D4A625',
          subtle: '#FBEFD0',
        },
        // surface — canvas warm, non bianco puro
        canvas: '#FAFAF7',
        paper: '#FFFFFF',
        'paper-alt': '#F4F2EC',
        inverse: '#0E0F0C',
        // ink
        ink: {
          DEFAULT: '#0E0F0C',
          secondary: '#454745',
          muted: '#868685',
          'on-inverse': '#FAFAF7',
        },
        // semantic
        success: { DEFAULT: '#2D7A3F', subtle: '#E0F0D8' },
        danger: { DEFAULT: '#C73E44', subtle: '#FAE2E3' },
        warning: { DEFAULT: '#E8B931', subtle: '#FBEFD0' },
        info: { DEFAULT: '#3D87C9', subtle: '#E0EDF7' },
        // border
        line: {
          subtle: 'rgba(14, 15, 12, 0.08)',
          DEFAULT: 'rgba(14, 15, 12, 0.12)',
          strong: 'rgba(14, 15, 12, 0.20)',
          focus: '#E8B931',
        },
      },
      borderRadius: {
        // radii Desko: button a 8px (sm), pill SOLO per chip/badge/avatar counter
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
