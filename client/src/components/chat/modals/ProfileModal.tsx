import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { getDisplayName } from '@/lib/displayName';
import type { ChatUser } from '@/types/chat';
import Modal from './Modal';
import FormInputField from '@/components/common/FormInputField';
import ButtonFull from '@/components/common/ButtonFull';
import AvatarBig from '@/components/common/AvatarBig';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const profileSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  nickname: z
    .string()
    .min(1, 'chat:profile.validation.nicknameRequired')
    .max(50),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfileModal() {
  const { t } = useTranslation(['chat', 'common']);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarURL ?? null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      nickname: user?.nickname ?? '',
    },
  });

  function handleAvatarChange(file: File | null) {
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error(t('chat:profile.avatarInvalidType'));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      let avatarURL = user?.avatarURL ?? undefined;

      if (avatarFile) {
        const { data } = await api.post<{
          uploadUrl: string;
          publicUrl: string;
        }>('/users/me/avatar-upload-url', { contentType: avatarFile.type });
        await axios.put(data.uploadUrl, avatarFile, {
          headers: { 'Content-Type': avatarFile.type },
        });
        avatarURL = data.publicUrl;
      }

      const { data: updatedUser } = await api.patch<ChatUser>('/users/me', {
        ...values,
        avatarURL,
      });
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success(t('chat:profile.success'));
    },
    onError: () => {
      toast.error(t('chat:profile.genericError'));
    },
  });

  if (!user) return null;

  return (
    <Modal title={t('chat:profile.title')}>
      <form
        onSubmit={handleSubmit((values) =>
          updateProfileMutation.mutate(values),
        )}
        className="flex flex-col gap-1 scroll-auto"
      >
        <div className="flex flex-col items-center gap-2">
          <AvatarBig
            username={getDisplayName(user)}
            avatarURL={avatarPreview}
            editable={true}
            avatarClassName="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full text-xl font-medium text-white uppercase"
            onFileChange={(file) => handleAvatarChange(file)}
          />
          {/* <label
            htmlFor="avatarInput"
            className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full text-xl font-medium text-white uppercase"
            style={{ backgroundColor: '#9ca3af' }}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              getDisplayName(user)[0]
            )}
          </label>
          <input
            id="avatarInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) =>
              handleAvatarChange(event.target.files?.[0] ?? null)
            }
          /> */}
          <span className="text-xs">{t('chat:profile.changeAvatar')}</span>
        </div>

        <FormInputField
          label={t('chat:profile.emailLabel')}
          id="email"
          type="email"
          inputClassName="text-blue-700"
          value={user.email}
          disabled={true}
          register={register}
        />
        {/* <div>
          <label className="mb-1 block text-sm">
            {t('chat:profile.emailLabel')}
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full rounded-md border px-3 py-2 opacity-60"
            style={{ borderColor: 'var(--border)' }}
          />
        </div> */}

        <FormInputField
          label={t('chat:profile.firstNameLabel')}
          id="firstName"
          type="text"
          disabled={updateProfileMutation.isPending}
          register={register}
        />

        {/* <div>
          <label htmlFor="firstName" className="mb-1 block text-sm">
            {t('chat:profile.firstNameLabel')}
          </label>
          <input
            id="firstName"
            disabled={updateProfileMutation.isPending}
            className="w-full rounded-md border px-3 py-2"
            style={{ borderColor: 'var(--border)' }}
            {...register('firstName')}
          />
        </div> */}

        <FormInputField
          label={t('chat:profile.lastNameLabel')}
          id="lastName"
          type="text"
          disabled={updateProfileMutation.isPending}
          register={register}
        />
        {/* <div>
          <label htmlFor="lastName" className="mb-1 block text-sm">
            {t('chat:profile.lastNameLabel')}
          </label>
          <input
            id="lastName"
            disabled={updateProfileMutation.isPending}
            className="w-full rounded-md border px-3 py-2"
            style={{ borderColor: 'var(--border)' }}
            {...register('lastName')}
          />
        </div> */}

        <FormInputField
          label={t('chat:profile.nicknameLabel')}
          id="nickname"
          type="text"
          disabled={updateProfileMutation.isPending}
          register={register}
          errorMessage={t(errors.nickname?.message || '')}
          error={!!errors.nickname?.message}
        />

        {/* <div>
          <label htmlFor="nickname" className="mb-1 block text-sm">
            {t('chat:profile.nicknameLabel')}
          </label>

          <input
            id="nickname"
            disabled={updateProfileMutation.isPending}
            className="w-full rounded-md border px-3 py-2"
            style={{ borderColor: 'var(--border)' }}
            {...register('nickname')}
          />
          {errors.nickname?.message && (
            <p className="mt-1 text-sm text-red-500">
              {t(errors.nickname.message)}
            </p>
          )}
        </div> */}

        <ButtonFull
          type="submit"
          disabled={updateProfileMutation.isPending}
          buttonStyle={{ backgroundColor: 'var(--accent)' }}
        >
          {updateProfileMutation.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2  border-white/40 border-t-white" />
          ) : (
            t('chat:profile.save')
          )}
        </ButtonFull>
        {/* <button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className="mt-2 flex items-center justify-center rounded-md px-4 py-2 font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {updateProfileMutation.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2  border-white/40 border-t-white" />
          ) : (
            t('chat:profile.save')
          )}
        </button> */}
      </form>
    </Modal>
  );
}

export default ProfileModal;
