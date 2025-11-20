export function Card({ className = '', style, ...props }) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)', ...style }}
      {...props}
    />
  );
}

export function Button({ className = '', style, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition active:scale-95 ${className}`}
      style={{ background: 'var(--accent)', color: '#111111', ...style }}
      {...props}
    />
  );
}

export function ButtonSecondary({ className = '', style, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border transition active:scale-95 ${className}`}
      style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)', background: 'transparent', ...style }}
      {...props}
    />
  );
}

export function Badge({ className = '', tone = 'default', children }) {
  const bg = tone === 'success'
    ? 'color-mix(in oklab, #22c55e 25%, transparent)'
    : tone === 'warning'
      ? 'color-mix(in oklab, #f59e0b 25%, transparent)'
      : tone === 'danger'
        ? 'color-mix(in oklab, #ef4444 25%, transparent)'
        : 'color-mix(in oklab, var(--primary) 18%, transparent)';
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${className}`} style={{ background: bg, color: 'var(--text)' }}>{children}</span>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${className}`}
      style={{ borderColor: 'rgba(0,0,0,0.12)' }}
      {...props}
    />
  );
}

export function Select({ className = '', ...props }) {
  return (
    <select
      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${className}`}
      style={{ borderColor: 'rgba(0,0,0,0.12)' }}
      {...props}
    />
  );
}

export function SkeletonLine({ className = '', style }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-300/40 dark:bg-gray-700/40 ${className}`}
      style={style}
    />
  );
}

export function Alert({ type = 'info', children }) {
  const map = {
    success: 'color-mix(in oklab, #22c55e 18%, transparent)',
    error: 'color-mix(in oklab, #ef4444 18%, transparent)',
    info: 'color-mix(in oklab, var(--primary) 18%, transparent)'
  };
  return (
    <div className="text-sm rounded-md px-3 py-2" style={{ background: map[type], color: 'var(--text)' }}>{children}</div>
  );
}
