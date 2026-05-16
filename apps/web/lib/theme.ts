'use client';

import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import {
  brand,
  surface,
  ink,
  semantic,
  border,
  typography,
  radii,
  shadows,
  motion,
  breakpoints,
  zIndex,
} from '@desko/design-tokens';

declare module '@mui/material/styles' {
  interface Palette {
    brand: {
      primary: string;
      primaryText: string;
      primaryHover: string;
      primaryActive: string;
      primarySubtle: string;
    };
    surfaceCustom: {
      canvas: string;
      paper: string;
      paperAlt: string;
      inverse: string;
    };
    ink: {
      primary: string;
      secondary: string;
      muted: string;
      onInverse: string;
    };
    borderToken: {
      subtle: string;
      default: string;
      strong: string;
      focus: string;
    };
  }
  interface PaletteOptions {
    brand?: Palette['brand'];
    surfaceCustom?: Palette['surfaceCustom'];
    ink?: Palette['ink'];
    borderToken?: Palette['borderToken'];
  }
}

const focusRing = shadows.focusRingPrimary;

const baseTheme = createTheme({
  cssVariables: { cssVarPrefix: 'desko' },
  palette: {
    mode: 'light',
    primary: {
      main: brand.primary,
      contrastText: brand.primaryText,
      light: brand.primaryHover,
      dark: brand.primaryActive,
    },
    secondary: {
      main: ink.primary,
      contrastText: ink.onInverse,
    },
    success: { main: semantic.success, contrastText: '#FFFFFF' },
    error: { main: semantic.danger, contrastText: '#FFFFFF' },
    warning: { main: semantic.warning, contrastText: brand.primaryText },
    info: { main: semantic.info, contrastText: '#FFFFFF' },
    background: {
      default: surface.canvas,
      paper: surface.paper,
    },
    text: {
      primary: ink.primary,
      secondary: ink.secondary,
      disabled: ink.muted,
    },
    divider: border.default,
    brand,
    surfaceCustom: surface,
    ink,
    borderToken: border,
  },
  shape: {
    borderRadius: radii.sm,
  },
  // MUI spacing unit = 8px (default). I design-tokens hanno base 4px,
  // ma sono espressi in pixel diretti dove servono (paddings di button, ecc.).
  // Tenere MUI a 8 rende ogni sx={{ p: N }} ergonomico (1 = 8px, 2 = 16px, 3 = 24px).
  spacing: 8,
  breakpoints: {
    values: breakpoints,
  },
  zIndex: {
    appBar: zIndex.sticky,
    drawer: zIndex.banner,
    modal: zIndex.modal,
    snackbar: zIndex.toast,
    tooltip: zIndex.tooltip,
  },
  typography: {
    fontFamily: typography.fontFamily.body,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontFamily: typography.scale.displayHero.family,
      fontWeight: typography.scale.displayHero.weight,
      fontSize: typography.scale.displayHero.size,
      lineHeight: typography.scale.displayHero.lineHeight,
      letterSpacing: typography.scale.displayHero.letterSpacing,
    },
    h2: {
      fontFamily: typography.scale.display.family,
      fontWeight: typography.scale.display.weight,
      fontSize: typography.scale.display.size,
      lineHeight: typography.scale.display.lineHeight,
      letterSpacing: typography.scale.display.letterSpacing,
    },
    h3: {
      fontFamily: typography.scale.h1.family,
      fontWeight: typography.scale.h1.weight,
      fontSize: typography.scale.h1.size,
      lineHeight: typography.scale.h1.lineHeight,
      letterSpacing: typography.scale.h1.letterSpacing,
    },
    h4: {
      fontFamily: typography.scale.h2.family,
      fontWeight: typography.scale.h2.weight,
      fontSize: typography.scale.h2.size,
      lineHeight: typography.scale.h2.lineHeight,
      letterSpacing: typography.scale.h2.letterSpacing,
    },
    h5: {
      fontFamily: typography.scale.h3.family,
      fontWeight: typography.scale.h3.weight,
      fontSize: typography.scale.h3.size,
      lineHeight: typography.scale.h3.lineHeight,
      letterSpacing: typography.scale.h3.letterSpacing,
    },
    h6: {
      fontFamily: typography.scale.h4.family,
      fontWeight: typography.scale.h4.weight,
      fontSize: typography.scale.h4.size,
      lineHeight: typography.scale.h4.lineHeight,
      letterSpacing: typography.scale.h4.letterSpacing,
    },
    subtitle1: {
      fontWeight: typography.scale.bodyStrong.weight,
      fontSize: typography.scale.bodyLg.size,
      lineHeight: typography.scale.bodyLg.lineHeight,
    },
    subtitle2: {
      fontWeight: typography.scale.bodyStrong.weight,
      fontSize: typography.scale.bodyStrong.size,
      lineHeight: typography.scale.bodyStrong.lineHeight,
    },
    body1: {
      fontFamily: typography.scale.bodyLg.family,
      fontWeight: typography.scale.bodyLg.weight,
      fontSize: typography.scale.bodyLg.size,
      lineHeight: typography.scale.bodyLg.lineHeight,
    },
    body2: {
      fontFamily: typography.scale.body.family,
      fontWeight: typography.scale.body.weight,
      fontSize: typography.scale.body.size,
      lineHeight: typography.scale.body.lineHeight,
    },
    caption: {
      fontFamily: typography.scale.caption.family,
      fontWeight: typography.scale.caption.weight,
      fontSize: typography.scale.caption.size,
      lineHeight: typography.scale.caption.lineHeight,
      letterSpacing: typography.scale.caption.letterSpacing,
    },
    overline: {
      fontFamily: typography.scale.overline.family,
      fontWeight: typography.scale.overline.weight,
      fontSize: typography.scale.overline.size,
      lineHeight: typography.scale.overline.lineHeight,
      letterSpacing: typography.scale.overline.letterSpacing,
      textTransform: 'uppercase',
    },
    button: {
      fontFamily: typography.scale.button.family,
      fontWeight: typography.scale.button.weight,
      fontSize: typography.scale.button.size,
      lineHeight: typography.scale.button.lineHeight,
      letterSpacing: typography.scale.button.letterSpacing,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        },
        body: {
          fontFeatureSettings: typography.fontFeatures.default,
        },
        '*:focus-visible': {
          outline: `2px solid ${brand.primary}`,
          outlineOffset: 2,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radii.sm,
          fontWeight: typography.scale.button.weight,
          transition: `transform ${motion.duration.base}ms ${motion.easing.standard}, background-color ${motion.duration.fast}ms ${motion.easing.standard}, box-shadow ${motion.duration.fast}ms ${motion.easing.standard}`,
          '&:hover': {
            transform: `scale(${motion.scale.buttonHover})`,
          },
          '&:active': {
            transform: `scale(${motion.scale.buttonActive})`,
          },
          '&:focus-visible': {
            boxShadow: focusRing,
            outline: 'none',
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: `background-color ${motion.duration.fast}ms ${motion.easing.standard}`,
            '&:hover': { transform: 'none' },
            '&:active': { transform: 'none' },
          },
        },
        sizeSmall: {
          minHeight: 36,
          padding: '6px 14px',
          fontSize: 13,
        },
        sizeMedium: {
          minHeight: 42,
          padding: '8px 18px',
          fontSize: 14,
        },
        sizeLarge: {
          minHeight: 48,
          padding: '10px 22px',
          fontSize: 16,
        },
        containedPrimary: {
          backgroundColor: brand.primary,
          color: brand.primaryText,
          '&:hover': {
            backgroundColor: brand.primaryHover,
            transform: `scale(${motion.scale.buttonHover})`,
          },
          '&:active': {
            backgroundColor: brand.primaryActive,
          },
        },
        containedSecondary: {
          backgroundColor: ink.primary,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(14, 15, 12, 0.85)',
            color: '#FFFFFF',
          },
          '&:active': {
            backgroundColor: 'rgba(14, 15, 12, 0.95)',
          },
        },
        outlined: {
          borderColor: border.default,
          color: ink.primary,
          '&:hover': {
            borderColor: border.strong,
            backgroundColor: surface.paperAlt,
          },
        },
        text: {
          color: ink.primary,
          '&:hover': {
            backgroundColor: 'rgba(14, 15, 12, 0.04)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: `1px solid ${brand.primary}`,
          boxSizing: 'border-box',
        },
      },
    },
    MuiAvatarGroup: {
      styleOverrides: {
        root: {
          // In group il bordo della sovrapposizione è già coerente con i singoli
          '& .MuiAvatar-root': {
            borderColor: brand.primary,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radii.sm,
          backgroundColor: surface.paper,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: border.default,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: border.strong,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.primary,
            borderWidth: 2,
          },
          '&.Mui-focused': {
            boxShadow: focusRing,
          },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: surface.paper,
          borderRadius: radii.lg,
          boxShadow: shadows.sm,
          border: `1px solid ${border.subtle}`,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: { borderRadius: radii.md },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radii.pill,
          fontWeight: typography.scale.bodyStrong.weight,
        },
        sizeSmall: { height: 22, fontSize: 12 },
        filled: {
          backgroundColor: surface.paperAlt,
          color: ink.primary,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: radii.xl, boxShadow: shadows.lg },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          backgroundColor: surface.inverse,
          color: ink.onInverse,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: surface.inverse,
          color: ink.onInverse,
          fontSize: 12,
          borderRadius: radii.sm,
          padding: '6px 10px',
        },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: {
          color: ink.primary,
          textDecorationColor: border.strong,
          '&:hover': { color: brand.primaryActive },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: {
          backgroundColor: surface.paper,
          borderBottom: `1px solid ${border.default}`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: border.subtle },
      },
    },
  },
});

export const deskoTheme = responsiveFontSizes(baseTheme);
