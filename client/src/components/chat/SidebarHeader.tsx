import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import ButtonMenu from '../common/ButtonMenu';
import AvatarSmall from '../common/AvatarSmall';

function SidebarHeader() {
  const { t, i18n } = useTranslation(['chat', 'common']);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const openModal = useUiStore((state) => state.openModal);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const localeMutation = useMutation({
    mutationFn: (locale: 'es' | 'en') => api.patch('/users/me', { locale }),
  });

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  function toggleLanguage() {
    const next = i18n.language === 'es' ? 'en' : 'es';
    void i18n.changeLanguage(next);
    if (user) {
      setUser({ ...user, locale: next });
      localeMutation.mutate(next);
    }
  }

  function handleLogout() {
    setMenuOpen(false);
    openModal({
      type: 'confirm',
      data: {
        title: t('chat:sidebar.logoutConfirmTitle'),
        message: t('chat:sidebar.logoutConfirmMessage'),
        onConfirm: logout,
      },
    });
  }

  // const initials =
  //   user?.nickname?.[0] ?? user?.firstName?.[0] ?? user?.email[0] ?? '?';

  return (
    <div
      className="flex items-center justify-between border-b px-4 py-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <span className="font-semibold" style={{ color: 'var(--text-h)' }}>
        {t('common:appName')}
      </span>

      <div className="relative" ref={menuRef}>
        <ButtonMenu
          type="button"
          buttonClassName="flex h-10 w-9 items-center justify-center overflow-hidden rounded-full"
          onClick={() => setMenuOpen((open) => !open)}
          // buttonStyle={{ backgroundColor: 'var(--accent)' }}
        >
          <AvatarSmall
            isAi={false}
            username={user?.nickname ?? user?.firstName ?? user?.email}
            avatarURL={user?.avatarURL}
            isOnline={false}
            style={{ backgroundColor: 'var(--accent)' }}
          />
        </ButtonMenu>

        {/* <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-sm font-medium text-white uppercase"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {user?.avatarURL ? (
            <img
              src={user.avatarURL}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </button> */}
        {menuOpen && (
          <div
            className="absolute right-0 z-10 mt-2 w-52 rounded-md border py-1 px-1 shadow-lg"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--bg)',
            }}
          >
            <ButtonMenu
              type="button"
              buttonClassName="text-left"
              onClick={() => {
                setMenuOpen(false);
                openModal({ type: 'profile' });
              }}
            >
              {t('chat:sidebar.profile')}
            </ButtonMenu>
            {/* <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openModal({ type: 'profile' });
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:opacity-80"
            >
              {t('chat:sidebar.profile')}
            </button> */}

            <ButtonMenu
              type="button"
              buttonClassName="text-left"
              onClick={toggleTheme}
            >
              {theme === 'light'
                ? t('chat:sidebar.theme.dark')
                : t('chat:sidebar.theme.light')}
            </ButtonMenu>
            {/* <button
              type="button"
              onClick={toggleTheme}
              className="block w-full px-4 py-2 text-left text-sm hover:opacity-80"
            >
              {theme === 'light'
                ? t('chat:sidebar.theme.dark')
                : t('chat:sidebar.theme.light')}
            </button> */}

            <ButtonMenu
              type="button"
              buttonClassName="text-left"
              onClick={toggleLanguage}
            >
              {t('chat:sidebar.language')}: {i18n.language.toUpperCase()}
            </ButtonMenu>
            {/* <button
              type="button"
              onClick={toggleLanguage}
              className="block w-full px-4 py-2 text-left text-sm hover:opacity-80"
            >
              {t('chat:sidebar.language')}: {i18n.language.toUpperCase()}
            </button> */}

            <ButtonMenu
              type="button"
              buttonClassName="text-left"
              onClick={handleLogout}
            >
              {t('chat:sidebar.logout')}
            </ButtonMenu>
            {/* <button
              type="button"
              onClick={handleLogout}
              className="block w-full px-4 py-2 text-left text-sm hover:opacity-80"
            >
              {t('chat:sidebar.logout')}
            </button> */}
          </div>
        )}
      </div>
    </div>
  );
}

export default SidebarHeader;
