'use client';

import { useForm, type FormValidateOrFn } from '@tanstack/react-form';
import * as React from 'react';

import { mapFormError, type FormError } from './map-form-error';

type UseEditFormOptions<T> = {
  /**
   * Schema validator — qualunque StandardSchemaV1-compat (Zod v4, Valibot, ecc.)
   * o funzione di validation custom. Vedi TanStack Form `FormValidateOrFn`.
   */
  schema: FormValidateOrFn<T>;
  defaultValues: T;
  /**
   * Save callback — DEVE lanciare in caso di failure.
   * Riceve i valori validati + AbortSignal per cancellare in-flight su re-submit.
   * Ritorna il valore salvato (potrebbe differire da quello inviato, es.
   * server applica trim, default, ecc.) — diventa la nuova baseline.
   */
  save: (value: T, ctx: { signal: AbortSignal }) => Promise<T>;
  /** Callback opzionale dopo successo (toast, log, ecc.). Non chiude UI. */
  onSaved?: (savedValue: T) => void;
};

/**
 * useEditForm — pattern "Edit" della skill forms.
 *
 * - Save gated su `state.canSubmit = isValid && isDirty && !isSubmitting`
 *   (dirty = differente dalla baseline corrente)
 * - Baseline reset on success: dopo save() il valore salvato diventa la
 *   nuova baseline, quindi isDirty torna false (editando di nuovo allo
 *   stesso valore non dovrebbe ri-abilitare Save)
 * - AbortController su re-submit
 * - Errori thrown dal save() → mapFormError → formError
 */
export function useEditForm<T extends Record<string, unknown>>({
  schema,
  defaultValues,
  save,
  onSaved,
}: UseEditFormOptions<T>) {
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
        const saved = await save(value as T, { signal: controller.signal });
        // Reset baseline: il valore salvato diventa il nuovo "clean" state
        form.reset(saved);
        onSaved?.(saved);
      } catch (err) {
        if (controller.signal.aborted) return;
        setFormError(mapFormError(err));
        throw err;
      }
    },
  });

  const resetToBaseline = React.useCallback(() => {
    abortRef.current?.abort();
    setFormError(null);
    form.reset();
  }, [form]);

  return { form, formError, resetToBaseline };
}

export type EditFormReturn<T extends Record<string, unknown>> = ReturnType<typeof useEditForm<T>>;
