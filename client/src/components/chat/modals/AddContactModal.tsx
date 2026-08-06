import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { api } from '@/lib/axios';
import Modal from './Modal';
import FormInputField from '@/components/common/FormInputField';
import ButtonFull from '@/components/common/ButtonFull';

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
        <FormInputField
          label={t('chat:addContact.emailLabel')}
          id="email"
          type="email"
          autoComplete="email"
          disabled={addContactMutation.isPending}
          errorMessage={t(errors.email?.message || '')}
          error={!!errors.email?.message}
          register={register}
        />

        <ButtonFull
          type="submit"
          disabled={addContactMutation.isPending}
          buttonStyle={{ backgroundColor: 'var(--accent)' }}
        >
          {addContactMutation.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2   border-white/40 border-t-white" />
          ) : (
            t('chat:addContact.submit')
          )}
        </ButtonFull>
      </form>
    </Modal>
  );
}

export default AddContactModal;
