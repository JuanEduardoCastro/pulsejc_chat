import { useTranslation } from 'react-i18next';
import CustomInputField from '../common/CustomInputField';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

function SearchInput({ value, onChange }: SearchInputProps) {
  const { t } = useTranslation('chat');

  return (
    <div className="px-4 py-2">
      <CustomInputField
        id="search-input"
        type="search"
        value={value}
        onChange={onChange}
        placeholder={t('search.placeholder')}
        inputClassName="w-full rounded-md border px-3 py-2 text-sm"
      />
      {/* <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full rounded-md border px-3 py-1.5 text-sm"
        style={{ borderColor: 'var(--border)' }}
      /> */}
    </div>
  );
}

export default SearchInput;
