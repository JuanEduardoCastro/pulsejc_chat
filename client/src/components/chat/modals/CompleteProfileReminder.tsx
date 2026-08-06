import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import type { ChatUser } from '@/types/chat';
import Modal from './Modal';
import FormInputField from '@/components/common/FormInputField';
import ButtonBorder from '@/components/common/ButtonBorder';
import ButtonFull from '@/components/common/ButtonFull';

const nicknameSchema = z.object({
  nickname: z
    .string()
    .min(1, 'chat:completeProfile.validation.required')
    .max(50),
});

type NicknameFormValues = z.infer<typeof nicknameSchema>;

function CompleteProfileReminder() {
  const { t } = useTranslation(['chat', 'common']);
  const setUser = useAuthStore((state) => state.setUser);
  const closeModal = useUiStore((state) => state.closeModal);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NicknameFormValues>({ resolver: zodResolver(nicknameSchema) });

  const setNicknameMutation = useMutation({
    mutationFn: (values: NicknameFormValues) =>
      api
        .patch<ChatUser>('/users/me', { ...values, hasSeenWelcome: true })
        .then((res) => res.data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      closeModal();
    },
    onError: () => {
      toast.error(t('chat:completeProfile.genericError'));
    },
  });

  return (
    <Modal title={t('chat:completeProfile.title')}>
      <p className="mb-4 text-sm">{t('chat:completeProfile.message')}</p>

      <form
        onSubmit={handleSubmit((values) => setNicknameMutation.mutate(values))}
        className="flex flex-col gap-4"
      >
        <FormInputField
          label={t('chat:completeProfile.nicknameLabel')}
          id="nickname"
          type="text"
          autoFocus={true}
          disabled={setNicknameMutation.isPending}
          register={register}
          errorMessage={t(errors.nickname?.message || '')}
          error={!!errors.nickname?.message}
        />

        <div className="flex justify-end gap-2">
          <ButtonBorder
            type="button"
            onClick={closeModal}
            disabled={setNicknameMutation.isPending}
            buttonStyle={{ borderColor: 'var(--border)' }}
            text={t('chat:completeProfile.skip')}
          />

          <ButtonFull
            type="submit"
            disabled={setNicknameMutation.isPending}
            buttonStyle={{ backgroundColor: 'var(--accent)' }}
          >
            {setNicknameMutation.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2  border-white/40 border-t-white" />
            ) : (
              t('chat:completeProfile.submit')
            )}
          </ButtonFull>
        </div>
      </form>
    </Modal>
  );
}

export default CompleteProfileReminder;
