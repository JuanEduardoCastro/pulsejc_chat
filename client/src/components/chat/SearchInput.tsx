import { useTranslation } from 'react-i18next';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

function SearchInput({ value, onChange }: SearchInputProps) {
  const { t } = useTranslation('chat');

  return (
    <div className="px-4 py-2">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full rounded-md border px-3 py-1.5 text-sm"
        style={{ borderColor: 'var(--border)' }}
      />
    </div>
  );
}

export default SearchInput;
