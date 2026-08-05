type AvatarSmallProps = {
  isAi: boolean;
  username?: string;
  avatarURL?: string | null;
  isOnline?: boolean;
  style?: React.CSSProperties | undefined;
};

function AvatarSmall({
  isAi,
  username,
  avatarURL,
  isOnline,
  style,
}: AvatarSmallProps) {
  return (
    <div className="relative flex-none">
      <div
        className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full text-sm font-medium text-white uppercase"
        style={{
          backgroundColor: isAi
            ? 'var(--accent-border)'
            : 'oklch(60.9% 0.126 221.723)',
          ...style,
        }}
      >
        {!isAi && avatarURL ? (
          <img src={avatarURL} alt="" className="h-full w-full object-cover" />
        ) : (
          <p className="font-semibold text-2xl">
            {username ? username[0] : '?'}
          </p>
        )}
      </div>
      {!isAi && isOnline && (
        <span
          className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2"
          style={{ backgroundColor: '#22c55e', borderColor: 'var(--bg)' }}
        />
      )}
    </div>
  );
}

export default AvatarSmall;
