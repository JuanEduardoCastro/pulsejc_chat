import renderBlock from '@/components/home/RenderBlock';
import { useEffect } from 'react';

export type Block = string | string[] | { subtitle: string };

export type LegalContent = {
  badge: string;
  title: string;
  lastUpdated: string;
  intro: Block[];
  sections: { title: string; blocks: Block[] }[];
};

function LegalDocument({ content }: { content: LegalContent }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <article>
      <header
        className="relative overflow-hidden border-b px-4 pt-32 pb-14 text-center sm:px-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 0%, var(--accent-border) 0%, transparent 70%)',
          }}
        />
        <span
          className="text-xs font-semibold tracking-wider uppercase"
          style={{
            borderColor: 'var(--accent-border)',
            color: 'var(--accent)',
          }}
        >
          {content.badge}
        </span>
        <h1
          className="relative mb-3 text-3xl font-extrabold tracking-tight  sm:text-5xl"
          style={{ color: 'var(--text-h)' }}
        >
          {content.title}
        </h1>
        <p className="relative text-sm">{content.lastUpdated}</p>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="mb-12">{content.intro.map(renderBlock)}</div>
        {content.sections.map((section) => (
          <section key={section.title} className="mb-10">
            <h2
              className="mb-4 border-b pb-2 text-base font-bold"
              style={{ color: 'var(--text-h)', borderColor: 'var(--border)' }}
            >
              {section.title}
            </h2>
            {section.blocks.map(renderBlock)}
          </section>
        ))}
      </div>
    </article>
  );
}

export default LegalDocument;
