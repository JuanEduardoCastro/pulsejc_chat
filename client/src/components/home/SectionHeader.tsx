export type SectionHeaderProps = {
  label: string;
  title: string;
  subtitle?: string;
};

function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p
        className="mb-3 text-xs font-semibold tracking-[0.12em] uppercase"
        style={{ color: 'var(--accent)' }}
      >
        {label}
      </p>
      <h2
        className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ color: 'var(--text-h)' }}
      >
        {title}
      </h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export default SectionHeader;
