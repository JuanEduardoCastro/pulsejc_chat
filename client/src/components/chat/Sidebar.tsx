import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/stores/uiStore';
import SidebarHeader from './SidebarHeader';
import SearchInput from './SearchInput';
import ConversationList from './ConversationList';
import ContactRequestItem from './ContactRequestItem';
import SearchResults from './SearchResults';
import { usePendingContactsQuery } from '@/queries/usePendingContactsQuery';
import ButtonMenu from '../common/ButtonMenu';

type Tab = 'chats' | 'requests';

function Sidebar() {
  const { t } = useTranslation('chat');
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [search, setSearch] = useState('');
  const { data: pendingRequests } = usePendingContactsQuery();
  const pendingCount = pendingRequests?.length ?? 0;
  const openModal = useUiStore((state) => state.openModal);

  return (
    <div className="flex h-full flex-col">
      <SidebarHeader />
      <SearchInput value={search} onChange={setSearch} />

      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        <ButtonMenu
          type="button"
          onClick={() => setActiveTab('chats')}
          buttonClassName="flex-1/3 text-center border-b-2"
          buttonStyle={{
            borderColor:
              activeTab === 'chats' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'chats' ? 'var(--text-h)' : 'var(--text)',
          }}
        >
          {t('tabs.chats')}
        </ButtonMenu>

        <ButtonMenu
          type="button"
          onClick={() => setActiveTab('requests')}
          buttonClassName="flex-1/3 text-center border-b-2"
          buttonStyle={{
            borderColor:
              activeTab === 'requests' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'requests' ? 'var(--text-h)' : 'var(--text)',
          }}
        >
          {t('tabs.requests')}
          {pendingCount > 0 && (
            <span
              className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {pendingCount}
            </span>
          )}
        </ButtonMenu>

        <button
          type="button"
          onClick={() => openModal({ type: 'addContact' })}
          aria-label={t('addContact.trigger')}
          title={t('addContact.trigger')}
          className="flex-1/8 px-3 py-2 text-lg leading-none justify-center items-center"
          // style={{ color: 'var(--text)' }}
        >
          <p className="w-5 h-5 flex items-center justify-center font-semibold text-xl rounded-full">
            +
          </p>
        </button>
      </div>

      {search.trim() ? (
        <SearchResults search={search} onSelect={() => setSearch('')} />
      ) : activeTab === 'chats' ? (
        <ConversationList />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {pendingCount === 0 ? (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm">
              {t('requests.empty')}
            </div>
          ) : (
            pendingRequests!.map((request) => (
              <ContactRequestItem key={request.id} request={request} />
            ))
          )}
        </div>
      )}

      {/* {activeTab === 'chats' ? (
        <ConversationList search={search} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {pendingCount === 0 ? (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm">
              {t('requests.empty')}
            </div>
          ) : (
            pendingRequests!.map((request) => (
              <ContactRequestItem key={request.id} request={request} />
            ))
          )}
        </div>
      )} */}
    </div>
  );
}

export default Sidebar;
