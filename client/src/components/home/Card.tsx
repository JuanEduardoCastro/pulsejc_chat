import Icon from './Icon';

export type CardProps = {
  icon: string;
  title: string;
  desc: string;
};

function Card({ icon, title, desc }: CardProps) {
  return (
    <div
      className="h-54 rounded-xl border p-6 transition hover:-translate-y-1"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-card, transparent)',
      }}
    >
      <div
        className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border"
        style={{ borderColor: 'var(--accent-border)', color: 'var(--accent)' }}
      >
        <Icon d={icon} />
      </div>
      <h3 className="mb-2 font-semibold" style={{ color: 'var(--text-h)' }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

export default Card;
