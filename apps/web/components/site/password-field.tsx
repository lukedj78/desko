'use client';

import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ChangeEvent, ReactNode } from 'react';
import { useState } from 'react';

/**
 * `<PasswordField>` — input password con toggle eye + stile coerente al `<Field>`.
 *
 * Use:
 *   <PasswordField id="pwd" name="password" label="Password" required />
 *   <PasswordField label="Conferma password" autoComplete="new-password" />
 *
 * Toggle eye:
 *  - Default: password nascosta (type=password)
 *  - Click occhio → mostra (type=text), tooltip "Nascondi password"
 *  - Re-click → nasconde
 *  - L'aria-label cambia di conseguenza per accessibility
 */

type PasswordFieldProps = {
  id?: string;
  name?: string;
  label: string;
  helperText?: ReactNode;
  hint?: ReactNode;
  error?: boolean;
  required?: boolean;
  optional?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export function PasswordField(props: PasswordFieldProps) {
  const {
    id,
    name,
    label,
    helperText,
    hint,
    error,
    required,
    optional,
    fullWidth = true,
    placeholder,
    value,
    defaultValue,
    disabled,
    autoComplete = 'current-password',
    autoFocus,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const [show, setShow] = useState(false);
  const helperId = id ? `${id}-helper` : undefined;

  return (
    <FormControl fullWidth={fullWidth} error={error} sx={{ display: 'block' }}>
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

      <OutlinedInput
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        error={error}
        fullWidth
        notched={false}
        inputProps={{ 'aria-describedby': helperId }}
        sx={{
          borderRadius: 1,
          backgroundColor: 'background.paper',
          minHeight: 48,
          '& .MuiOutlinedInput-input': {
            padding: '0 0 0 16px',
            height: '46px',
            fontSize: 16,
            lineHeight: '46px',
            fontFamily: 'var(--font-inter)',
            boxSizing: 'border-box',
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
            boxShadow: (theme) =>
              `0 0 0 3px ${alpha(error ? theme.palette.error.main : theme.palette.primary.main, 0.25)}`,
          },
          '&.Mui-disabled': {
            backgroundColor: 'background.default',
            cursor: 'not-allowed',
          },
        }}
        endAdornment={
          <InputAdornment position="end" sx={{ pr: 1 }}>
            <Tooltip title={show ? 'Nascondi password' : 'Mostra password'}>
              <IconButton
                aria-label={show ? 'Nascondi password' : 'Mostra password'}
                onClick={() => setShow((s) => !s)}
                edge="end"
                size="small"
                tabIndex={-1}
                sx={{ color: 'text.secondary', mr: 0.25 }}
              >
                {show ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </InputAdornment>
        }
      />

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
