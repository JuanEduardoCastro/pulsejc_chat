import { type ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <div
      className="flex min-h-svh items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border-2 p-8"
        style={{
          borderColor: 'var(--border)',
        }}
      >
        <h1
          className="mb-6 text-center text-2xl font-semibold"
          style={{ color: 'var(--text-h)' }}
        >
          {title}
        </h1>
        {children}
        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}

export default AuthCard;
