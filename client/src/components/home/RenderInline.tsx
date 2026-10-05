import { INLINE, linkClass, linkStyle } from '@/constants/home';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(INLINE)) {
    const [full, bold, label, href] = match;
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));

    if (bold) {
      nodes.push(
        <strong
          key={index}
          className="font-semibold"
          style={{ color: 'var(--text-h)' }}
        >
          {bold}
        </strong>,
      );
    } else if (href.startsWith('/')) {
      nodes.push(
        <Link key={index} to={href} className={linkClass} style={linkStyle}>
          {label}
        </Link>,
      );
    } else {
      const isMail = href.startsWith('mailto:');
      nodes.push(
        <a
          key={index}
          href={href}
          className={linkClass}
          style={linkStyle}
          {...(isMail ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        >
          {label}
        </a>,
      );
    }
    last = index + full.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default renderInline;
