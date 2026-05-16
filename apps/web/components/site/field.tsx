'use client';

import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import OutlinedInput, { type OutlinedInputProps } from '@mui/material/OutlinedInput';
import Select, { type SelectProps } from '@mui/material/Select';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

/**
 * `<Field>` — wrapper sopra primitive MUI (OutlinedInput / Select) con il pattern
 * Desko: label statica sopra, no floating notched, dimensione 48px (match button "large"),
 * focus ring ocra, helper text inline.
 *
 * Sotto il cofano sono componenti MUI puri — solo lo stile è custom. La label è
 * un `<Typography component="label">`, gli elementi value sono `OutlinedInput` e
 * `Select` standard. Per il Select si usano `<MenuItem>` come children.
 *
 * Uso:
 *   <Field id="email" label="Email" defaultValue="..." />
 *   <Field id="note" label="Note" multiline rows={4} />
 *   <Field id="vis" label="Visibilità" select defaultValue="company">
 *     <MenuItem value="company">Tutti i colleghi</MenuItem>
 *   </Field>
 */

type SharedProps = {
  id?: string;
  label: string;
  helperText?: ReactNode;
  hint?: ReactNode;
  error?: boolean;
  required?: boolean;
  optional?: boolean;
  fullWidth?: boolean;
};

type TextProps = SharedProps &
  Omit<OutlinedInputProps, 'label' | 'error' | 'fullWidth' | 'notched'> & {
    multiline?: boolean;
    select?: false;
  };

type SelectFieldProps = SharedProps &
  Omit<SelectProps<string>, 'label' | 'error' | 'fullWidth' | 'notched' | 'displayEmpty'> & {
    select: true;
    children: ReactNode;
  };

export type FieldProps = TextProps | SelectFieldProps;

/**
 * Stili condivisi applicati al `.MuiOutlinedInput-root`.
 *
 * Single-line: forziamo `minHeight: 48px` sul container + height auto sull'input HTML
 * + padding orizzontale 16, verticale 0 (la centratura la fa il line-height del root).
 * In questo modo l'altezza è esattamente 48px = button size="large".
 *
 * Multiline: lasciamo l'altezza al textarea (rows guida l'altezza), padding 12/16.
 *
 * `notched={false}` + `legend display:none` rimuovono il notch del fieldset, perché
 * la label è già statica sopra al field (pattern Desko, non floating Material).
 */
const sharedSx = (error?: boolean, multiline?: boolean) => ({
  borderRadius: 1,
  backgroundColor: 'background.paper',
  ...(multiline
    ? {}
    : { minHeight: 48 }),
  '& .MuiOutlinedInput-input': multiline
    ? {
        padding: '12px 16px',
        fontSize: 16,
        lineHeight: 1.5,
        fontFamily: 'var(--font-inter)',
      }
    : {
        padding: '0 16px',
        height: '46px', // 48 minus 2 borders
        fontSize: 16,
        lineHeight: '46px',
        fontFamily: 'var(--font-inter)',
        boxSizing: 'border-box',
      },
  '& .MuiSelect-select': {
    padding: '0 32px 0 16px !important',
    height: '46px !important',
    minHeight: 'unset',
    fontSize: 16,
    lineHeight: '46px',
    fontFamily: 'var(--font-inter)',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiSelect-icon': {
    right: 12,
    color: 'text.secondary',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: error ? 'error.main' : 'divider',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
    top: 0,
    '& legend': { display: 'none' },
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: error ? 'error.main' : 'text.secondary',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: error ? 'error.main' : 'primary.main',
    borderWidth: 1,
  },
  '&.Mui-focused': {
    boxShadow: (theme: import('@mui/material/styles').Theme) =>
      `0 0 0 3px ${alpha(error ? theme.palette.error.main : theme.palette.primary.main, 0.25)}`,
  },
  '&.Mui-disabled': {
    backgroundColor: 'background.default',
    cursor: 'not-allowed',
  },
});

function FieldLabel({
  id,
  label,
  required,
  optional,
  hint,
  error,
}: {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: boolean;
}) {
  return (
    <Typography
      component="label"
      htmlFor={id}
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 1,
        mb: 1,
        color: error ? 'error.main' : 'text.primary',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1.4,
      }}
    >
      {label}
      {required ? (
        <Typography component="span" sx={{ color: 'error.main', fontSize: 14 }}>
          *
        </Typography>
      ) : null}
      {optional ? (
        <Typography
          component="span"
          sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 400 }}
        >
          facoltativo
        </Typography>
      ) : null}
      {hint ? (
        <Typography
          component="span"
          sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 400, ml: 'auto' }}
        >
          {hint}
        </Typography>
      ) : null}
    </Typography>
  );
}

export function Field(props: FieldProps) {
  const { id, label, helperText, hint, error, required, optional, fullWidth = true } = props;
  const helperId = id ? `${id}-helper` : undefined;

  let control: ReactNode;

  if ('select' in props && props.select) {
    const {
      select: _select,
      label: _label,
      helperText: _helperText,
      hint: _hint,
      error: _error,
      required: _required,
      optional: _optional,
      fullWidth: _fullWidth,
      children,
      sx,
      ...selectProps
    } = props;
    void _select;
    void _label;
    void _helperText;
    void _hint;
    void _error;
    void _required;
    void _optional;
    void _fullWidth;
    control = (
      <Select
        {...selectProps}
        id={id}
        error={error}
        fullWidth
        notched={false}
        displayEmpty={false}
        inputProps={{ 'aria-describedby': helperId }}
        sx={[sharedSx(error, false), ...(Array.isArray(sx) ? sx : [sx])]}
      >
        {children}
      </Select>
    );
  } else {
    const {
      multiline,
      label: _label,
      helperText: _helperText,
      hint: _hint,
      error: _error,
      required: _required,
      optional: _optional,
      fullWidth: _fullWidth,
      sx,
      ...inputProps
    } = props as TextProps;
    void _label;
    void _helperText;
    void _hint;
    void _error;
    void _required;
    void _optional;
    void _fullWidth;
    control = (
      <OutlinedInput
        {...inputProps}
        id={id}
        error={error}
        fullWidth
        notched={false}
        multiline={multiline}
        inputProps={{
          ...(inputProps.inputProps ?? {}),
          'aria-describedby': helperId,
        }}
        sx={[sharedSx(error, multiline), ...(Array.isArray(sx) ? sx : [sx])]}
      />
    );
  }

  return (
    <FormControl fullWidth={fullWidth} error={error} sx={{ display: 'block' }}>
      <FieldLabel
        id={id}
        label={label}
        required={required}
        optional={optional}
        hint={hint}
        error={error}
      />
      {control}
      {helperText ? (
        <FormHelperText
          id={helperId}
          sx={{
            mx: 0,
            mt: 1,
            fontSize: 13,
            lineHeight: 1.4,
            color: error ? 'error.main' : 'text.secondary',
          }}
        >
          {helperText}
        </FormHelperText>
      ) : null}
    </FormControl>
  );
}
