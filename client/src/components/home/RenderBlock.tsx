import type { Block } from '@/screens/home/LegalDocument';
import renderInline from './RenderInline';

function renderBlock(block: Block, key: number) {
  if (typeof block === 'string') {
    return (
      <p key={key} className="mb-3 text-sm leading-7 last:mb-0">
        {renderInline(block)}
      </p>
    );
  }
  if (Array.isArray(block)) {
    return (
      <ul
        key={key}
        className="mb-3 list-disc space-y-2 pl-5 text-sm leading-7 
  marker:text-(--accent) last:mb-0"
      >
        {block.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }
  return (
    <h3
      key={key}
      className="mt-6 mb-2 text-sm font-semibold first:mt-0"
      style={{ color: 'var(--text-h)' }}
    >
      {block.subtitle}
    </h3>
  );
}

export default renderBlock;
