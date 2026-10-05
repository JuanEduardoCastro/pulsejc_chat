export type BubbleProps = {
  own?: boolean;
  streaming?: boolean;
  children: React.ReactNode;
};

function Bubble({ own = false, streaming = false, children }: BubbleProps) {
  return (
    <div
      className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
        own ? 'self-end' : 'self-start'
      }`}
      style={
        own
          ? { backgroundColor: 'var(--accent-bg)', color: 'var(--text-h)' }
          : { backgroundColor: 'var(--border)', color: 'var(--text-h)' }
      }
    >
      {children}
      {streaming && (
        <span className="ml-0.5 inline-block animate-pulse">▍</span>
      )}
    </div>
  );
}

export default Bubble;
