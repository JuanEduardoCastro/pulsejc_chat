import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { api } from '@/lib/axios';
import Modal from './Modal';

const addContactSchema = z.object({
  email: z
    .string()
    .min(1, 'chat:addContact.validation.required')
    .email('chat:addContact.validation.invalid'),
});

type AddContactFormValues = z.infer<typeof addContactSchema>;

function AddContactModal() {
  const { t } = useTranslation('chat');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddContactFormValues>({
    resolver: zodResolver(addContactSchema),
  });

  const addContactMutation = useMutation({
    mutationFn: (values: AddContactFormValues) => api.post('/contacts', values),
    onSuccess: () => {
      toast.success(t('chat:addContact.success'));
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 404) {
        toast.error(t('chat:addContact.notFound'));
        return;
      }
      if (isAxiosError(error) && error.response?.status === 409) {
        toast.error(t('chat:addContact.alreadyExists'));
        return;
      }
      if (isAxiosError(error) && error.response?.status === 400) {
        toast.error(t('chat:addContact.self'));
        return;
      }
      toast.error(t('chat:addContact.genericError'));
    },
  });

  return (
    <Modal title={t('chat:addContact.title')}>
      <form
        onSubmit={handleSubmit((values) => addContactMutation.mutate(values))}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="contactEmail" className="mb-1 block text-sm">
            {t('chat:addContact.emailLabel')}
          </label>
          <input
            id="contactEmail"
            type="email"
            autoComplete="email"
            disabled={addContactMutation.isPending}
            className="w-full rounded-md border px-3 py-2"
            style={{ borderColor: 'var(--border)' }}
            {...register('email')}
          />
          {errors.email?.message && (
            <p className="mt-1 text-sm text-red-500">
              {t(errors.email.message)}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={addContactMutation.isPending}
          className="flex items-center justify-center rounded-md px-4 py-2   font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {addContactMutation.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2   border-white/40 border-t-white" />
          ) : (
            t('chat:addContact.submit')
          )}
        </button>
      </form>
    </Modal>
  );
}

export default AddContactModal;
