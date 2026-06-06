/**
 * @desko/web-shadcn lib/forms — shared form toolkit (TanStack Form + Zod).
 *
 * Pattern canonico skill `forms`:
 *
 *   const { form, formError } = useCreateForm({
 *     schema: LoginSchema,
 *     defaultValues: { email: '', password: '' },
 *     submit: async ({ email, password }) => {
 *       const { error } = await signIn.email({ email, password });
 *       if (error) throw new Error(error.message);
 *       return { ok: true };
 *     },
 *     onSuccess: () => router.push('/dashboard'),
 *   });
 *
 *   <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit(); }}>
 *     <form.Field name="email">
 *       {(field) => <Input ... />}
 *     </form.Field>
 *     <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
 *       {([canSubmit, isSubmitting]) => (
 *         <Button type="submit" disabled={!canSubmit}>
 *           {isSubmitting ? 'Accesso...' : 'Accedi'}
 *         </Button>
 *       )}
 *     </form.Subscribe>
 *   </form>
 *
 * Underlying library: @tanstack/react-form v1 (vedi meta.json#stack.forms).
 * Per cambiare a react-hook-form, riscrivere i due hook mantenendo
 * la stessa API consumer.
 */

export { useCreateForm, type CreateFormReturn } from './use-create-form';
export { useEditForm, type EditFormReturn } from './use-edit-form';
export { mapFormError, type FormError } from './map-form-error';
