export function Card({ className = '', style, ...props }) {
  return (
    <div
      className={`rounded-3xl glass-card transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] group ${className}`}
      style={{ 
        background: 'var(--surface)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        ...style 
      }}
      {...props}
    />
  );
}

export function Button({ className = '', style, variant = 'primary', size = 'md', ...props }) {
  const sizeStyles = size === 'lg' 
    ? 'px-8 py-4 text-base'
    : size === 'sm'
      ? 'px-4 py-2 text-xs'
      : 'px-6 py-3 text-sm';
  
  const baseStyles = `inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group ${sizeStyles}`;
  
  const variantStyles = variant === 'secondary' 
    ? { 
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)', 
        color: 'var(--brand)', 
        border: '1px solid rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(15px) saturate(180%)',
        WebkitBackdropFilter: 'blur(15px) saturate(180%)',
        boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)'
      }
    : variant === 'glass'
      ? {
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)',
        color: '#FFFFFF',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(15px) saturate(180%)',
        WebkitBackdropFilter: 'blur(15px) saturate(180%)',
        boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
      }
    : { 
        background: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 50%, var(--brand) 100%)', 
        backgroundSize: '200% 200%',
        color: '#FFFFFF',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
        animation: 'gradientShift 3s ease infinite'
      };
  
  return (
    <button
      className={`${baseStyles} ${className}`}
      style={{ 
        ...variantStyles, 
        ...style,
        position: 'relative'
      }}
      {...props}
    >
      <span className="relative z-10">{props.children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      )}
    </button>
  );
}

export function ButtonSecondary({ className = '', style, size = 'md', ...props }) {
  const sizeStyles = size === 'lg' 
    ? 'px-8 py-4 text-base'
    : size === 'sm'
      ? 'px-4 py-2 text-xs'
      : 'px-6 py-3 text-sm';
  
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group ${sizeStyles} ${className}`}
      style={{ 
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)', 
        color: 'var(--brand)', 
        border: '1px solid rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(15px) saturate(180%)',
        WebkitBackdropFilter: 'blur(15px) saturate(180%)',
        boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
        position: 'relative',
        ...style 
      }}
      {...props}
    >
      <span className="relative z-10">{props.children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </button>
  );
}

export function Badge({ className = '', tone = 'default', size = 'md', children, ...props }) {
  const sizeStyles = size === 'lg' 
    ? 'px-4 py-2 text-sm'
    : size === 'sm'
      ? 'px-2 py-1 text-xs'
      : 'px-3 py-1.5 text-xs';
  
  const bg = tone === 'success'
    ? 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)'
    : tone === 'warning'
      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)'
      : tone === 'danger'
        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #ef4444 100%)'
        : 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 50%, var(--brand) 100%)';
        
  return (
    <span className={`rounded-full font-semibold relative overflow-hidden group ${sizeStyles} ${className}`} 
          style={{ 
            background: bg, 
            backgroundSize: '200% 200%',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(10px) saturate(180%)',
            WebkitBackdropFilter: 'blur(10px) saturate(180%)',
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
            animation: 'gradientShift 2s ease infinite'
          }}
          {...props}>
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
    </span>
  );
}

export function Input({ className = '', size = 'md', error = false, ...props }) {
  const sizeStyles = size === 'lg' 
    ? 'px-5 py-4 text-base'
    : size === 'sm'
      ? 'px-3 py-2 text-xs'
      : 'px-4 py-3 text-sm';
  
  return (
    <div className="relative group">
      <input
        className={`w-full rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 placeholder:text-gray-400 ${sizeStyles} ${className} ${error ? 'ring-2 ring-red-500' : ''}`}
        style={{ 
          background: 'var(--surface)',
          backdropFilter: 'blur(15px) saturate(180%)',
          WebkitBackdropFilter: 'blur(15px) saturate(180%)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text)',
          focusRingColor: error ? '#ef4444' : 'var(--brand)',
          focusBorderColor: error ? '#ef4444' : 'var(--brand)',
          boxShadow: error 
            ? '0 0 0 4px rgba(239, 68, 68, 0.1), 0 4px 20px 0 rgba(0,0,0,0.1)'
            : '0 4px 20px 0 rgba(99, 102, 241, 0.1)',
          transition: 'all 0.3s ease'
        }}
        {...props}
      />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

export function Select({ className = '', size = 'md', error = false, ...props }) {
  const sizeStyles = size === 'lg' 
    ? 'px-5 py-4 text-base'
    : size === 'sm'
      ? 'px-3 py-2 text-xs'
      : 'px-4 py-3 text-sm';
  
  return (
    <div className="relative group">
      <select
        className={`w-full rounded-2xl focus:outline-none focus:ring-2 transition-all duration-300 appearance-none cursor-pointer ${sizeStyles} ${className} ${error ? 'ring-2 ring-red-500' : ''}`}
        style={{ 
          background: 'var(--surface)',
          backdropFilter: 'blur(15px) saturate(180%)',
          WebkitBackdropFilter: 'blur(15px) saturate(180%)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text)',
          focusRingColor: error ? '#ef4444' : 'var(--brand)',
          focusBorderColor: error ? '#ef4444' : 'var(--brand)',
          boxShadow: error 
            ? '0 0 0 4px rgba(239, 68, 68, 0.1), 0 4px 20px 0 rgba(0,0,0,0.1)'
            : '0 4px 20px 0 rgba(99, 102, 241, 0.1)',
          paddingRight: '2.5rem'
        }}
        {...props}
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand)' }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
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

export function Alert({ type = 'info', children, className = '', variant = 'standard', ...props }) {
  const map = {
    success: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #ef4444 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)',
    info: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 50%, var(--brand) 100%)'
  };
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const variants = {
    standard: 'px-4 py-3 text-sm rounded-2xl',
    compact: 'px-3 py-2 text-xs rounded-xl',
    large: 'px-6 py-4 text-base rounded-3xl',
    neon: 'px-6 py-4 text-base rounded-3xl border-2'
  };

  const getGlowColor = (alertType) => {
    switch (alertType) {
      case 'success': return 'rgba(16, 185, 129, 0.5)';
      case 'error': return 'rgba(239, 68, 68, 0.5)';
      case 'warning': return 'rgba(245, 158, 11, 0.5)';
      default: return 'rgba(99, 102, 241, 0.5)';
    }
  };

  const variantStyles = {
    standard: {},
    compact: {},
    large: {},
    neon: {
      boxShadow: `0 0 20px ${getGlowColor(type)}`,
      animation: 'neonPulse 2s ease-in-out infinite'
    }
  };
  
  return (
    <div className={`text-sm font-medium relative overflow-hidden group transition-all duration-300 ${variants[variant]} ${className}`} 
         style={{ 
           background: map[type], 
           backgroundSize: '200% 200%',
           color: '#FFFFFF',
           border: '1px solid rgba(255,255,255,0.3)',
           backdropFilter: 'blur(15px) saturate(180%)',
           WebkitBackdropFilter: 'blur(15px) saturate(180%)',
           boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
           animation: variant === 'neon' ? undefined : 'gradientShift 3s ease infinite',
           ...variantStyles[variant]
         }} 
         {...props}>
      <div className="flex items-center gap-3 relative z-10">
        <span className="text-lg font-bold" style={{
          animation: variant === 'neon' ? 'neonPulse 2s ease-in-out infinite' : 'pulse 2s ease-in-out infinite',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {icons[type]}
        </span>
        <span style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>{children}</span>
      </div>
      
      {/* Enhanced shimmer effect */}
      <div className="absolute inset-0 rounded-inherit opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
           style={{
             background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
             transform: 'translateX(-100%)'
           }} />
      
      {/* Floating particles for neon variant */}
      {variant === 'neon' && [...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full opacity-60"
          style={{
            background: '#FFFFFF',
            left: `${20 + (i * 20)}%`,
            top: `${30 + (i * 15)}%`,
            animation: `float ${2 + i * 0.5}s ease-in-out infinite`,
            boxShadow: '0 0 6px #FFFFFF'
          }}
        />
      ))}
    </div>
  );
}

export function NeonAlert({ type = 'info', children, className = '', ...props }) {
  const colors = {
    success: { main: '#10b981', glow: 'rgba(16, 185, 129, 0.8)', pulse: 'rgba(16, 185, 129, 0.4)' },
    error: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)', pulse: 'rgba(239, 68, 68, 0.4)' },
    warning: { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.8)', pulse: 'rgba(245, 158, 11, 0.4)' },
    info: { main: 'var(--brand)', glow: 'rgba(99, 102, 241, 0.8)', pulse: 'rgba(99, 102, 241, 0.4)' }
  };

  const color = colors[type];
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

  const getSecondaryColor = (alertType) => {
    switch (alertType) {
      case 'success': return '#059669';
      case 'error': return '#dc2626';
      case 'warning': return '#d97706';
      default: return 'var(--accent)';
    }
  };

  return (
    <div className={`relative overflow-hidden group ${className}`} {...props}>
      {/* Multiple glow layers */}
      <div className="absolute inset-0 rounded-2xl" style={{
        background: `radial-gradient(circle, ${color.glow} 0%, transparent 70%)`,
        filter: 'blur(20px)',
        animation: 'pulse 3s ease-in-out infinite'
      }} />
      
      <div className="absolute inset-0 rounded-2xl" style={{
        background: `radial-gradient(circle, ${color.pulse} 0%, transparent 50%)`,
        animation: 'pulse 2s ease-in-out infinite reverse'
      }} />
      
      {/* Main content */}
      <div className="relative z-10 rounded-2xl px-6 py-4 font-medium backdrop-blur-xl border-2"
           style={{
             background: `linear-gradient(135deg, ${color.main} 0%, ${getSecondaryColor(type)} 100%)`,
             backgroundSize: '200% 200%',
             animation: 'gradientShift 2s ease infinite',
             borderColor: color.main,
             boxShadow: `0 0 30px ${color.glow}, 0 0 60px ${color.pulse}, inset 0 0 20px rgba(255, 255, 255, 0.2), 0 8px 32px 0 rgba(0, 0, 0, 0.4)`,
             backdropFilter: 'blur(20px) saturate(180%)',
             WebkitBackdropFilter: 'blur(20px) saturate(180%)'
           }}>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold relative z-10" style={{
            color: '#FFFFFF',
            textShadow: `0 0 20px ${color.glow}`,
            animation: 'neonFlicker 3s ease-in-out infinite'
          }}>
            {icons[type]}
          </span>
          <span className="text-white relative z-10" style={{ 
            textShadow: `0 0 10px ${color.glow}, 0 2px 4px rgba(0, 0, 0, 0.8)` 
          }}>
            {children}
          </span>
        </div>
        
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl border-2 opacity-50" style={{
          borderColor: color.main,
          animation: 'borderRotate 4s linear infinite'
        }} />
      </div>
    </div>
  );
}
