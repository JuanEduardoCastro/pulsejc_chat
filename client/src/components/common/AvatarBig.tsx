type AvatarBigProps = {
  username?: string;
  avatarURL?: string | null;
  editable?: boolean;
  avatarClassName?: string;
  onFileChange?: (file: File | null) => void;
};

function AvatarBig({
  avatarURL,
  username,
  editable,
  avatarClassName,
  onFileChange,
}: AvatarBigProps) {
  const circle = (
    <div
      className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-xl font-medium text-white uppercase ${editable ? 'cursor-pointer' : ''}`}
      style={{ backgroundColor: 'var(--accent)' }}
    >
      {avatarURL ? (
        <img src={avatarURL} alt="" className="h-full w-full object-cover" />
      ) : (
        <p className="font-semibold text-4xl">{username?.[0] ?? '?'}</p>
      )}
    </div>
  );

  if (!editable) return circle;

  return (
    <>
      <label htmlFor="avatarInput" className={avatarClassName}>
        {circle}
      </label>
      <input
        id="avatarInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => onFileChange?.(event.target.files?.[0] ?? null)}
      />
    </>
  );
}

export default AvatarBig;
