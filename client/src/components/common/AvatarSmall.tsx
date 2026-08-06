import { useState } from 'react';

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadedForUrl, setLoadedForUrl] = useState(avatarURL);

  if (avatarURL !== loadedForUrl) {
    setLoadedForUrl(avatarURL);
    setImageLoaded(false);
  }

  const showImage = !isAi && !!avatarURL;

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
        {!(showImage && imageLoaded) && (
          <p className="font-semibold text-2xl">
            {username ? username[0] : '?'}
          </p>
        )}
        {showImage && (
          <img
            src={avatarURL}
            alt=""
            onLoad={() => setImageLoaded(true)}
            className={`h-full w-full object-cover ${imageLoaded ? '' : 'hidden'}`}
          />
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
