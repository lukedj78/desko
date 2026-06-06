'use client';

import { useForm, type FormValidateOrFn } from '@tanstack/react-form';
import * as React from 'react';

import { mapFormError, type FormError } from './map-form-error';

type UseCreateFormOptions<TInput, TResult> = {
  /**
   * Schema validator — qualunque StandardSchemaV1-compat (Zod v4, Valibot, ecc.)
   * o funzione di validation custom. Vedi TanStack Form `FormValidateOrFn`.
   */
  schema: FormValidateOrFn<TInput>;
  /** Valori di default — usati anche per reset */
  defaultValues: TInput;
  /**
   * Submit callback — DEVE lanciare in caso di failure.
   * Riceve i valori validati + AbortSignal per cancellare in-flight su re-submit.
   */
  submit: (value: TInput, ctx: { signal: AbortSignal }) => Promise<TResult>;
  /** Callback chiamato dopo successo (close dialog, navigate, ecc.) */
  onSuccess?: (result: TResult) => void;
};

/**
 * useCreateForm — pattern "Create" della skill forms.
 *
 * Ritorna `{ form, formError, resetAll, handleSubmit }`:
 * - `form`: l'istanza TanStack Form (usata per <form.Field>, form.state, ecc.)
 * - `formError`: errore corrente mappato via mapFormError (validation/business/unknown)
 * - `resetAll`: reset form + errore + abort in-flight
 * - `handleSubmit`: wrapper su form.handleSubmit() già con preventDefault gestito a monte
 *
 * Caratteristiche:
 * - Submit gated su `state.canSubmit = isValid && !isSubmitting`
 * - Zod schema come validator onChange + onSubmit
 * - AbortController: re-submit cancella la in-flight precedente
 * - Errori thrown dal submit() → mapFormError → formError
 * - onSuccess() chiamato dopo successo
 */
export function useCreateForm<TInput extends Record<string, unknown>, TResult>({
  schema,
  defaultValues,
  submit,
  onSuccess,
}: UseCreateFormOptions<TInput, TResult>) {
  const [formError, setFormError] = React.useState<FormError | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const form = useForm({
    defaultValues,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: { onChange: schema as any, onSubmit: schema as any },
    onSubmit: async ({ value }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setFormError(null);
      try {
        const result = await submit(value as TInput, { signal: controller.signal });
        onSuccess?.(result);
      } catch (err) {
        if (controller.signal.aborted) return;
        setFormError(mapFormError(err));
        throw err;
      }
    },
  });

  const resetAll = React.useCallback(() => {
    abortRef.current?.abort();
    setFormError(null);
    form.reset();
  }, [form]);

  return { form, formError, resetAll };
}

export type CreateFormReturn<TInput extends Record<string, unknown>, TResult> = ReturnType<
  typeof useCreateForm<TInput, TResult>
>;
