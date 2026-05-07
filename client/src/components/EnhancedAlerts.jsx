import { useEffect, useState } from 'react';

export function EnhancedAlert({ 
  type = 'info', 
  children, 
  className = '', 
  dismissible = false,
  autoDismiss = 5000,
  icon = null,
  ...props 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const alertConfig = {
    success: {
      bg: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
      icon: '✓',
      pulseColor: 'rgba(16, 185, 129, 0.3)',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      particles: ['#10b981', '#059669', '#34d399']
    },
    error: {
      bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #ef4444 100%)',
      icon: '✕',
      pulseColor: 'rgba(239, 68, 68, 0.3)',
      glowColor: 'rgba(239, 68, 68, 0.4)',
      particles: ['#ef4444', '#dc2626', '#f87171']
    },
    warning: {
      bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)',
      icon: '⚠',
      pulseColor: 'rgba(245, 158, 11, 0.3)',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      particles: ['#f59e0b', '#d97706', '#fbbf24']
    },
    info: {
      bg: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 50%, var(--brand) 100%)',
      icon: 'ℹ',
      pulseColor: 'rgba(99, 102, 241, 0.3)',
      glowColor: 'rgba(99, 102, 241, 0.4)',
      particles: ['var(--brand)', 'var(--accent)', '#818cf8']
    }
  };

  const config = alertConfig[type];

  useEffect(() => {
    if (autoDismiss && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, isVisible]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`relative overflow-hidden group ${className}`}
      style={{
        animation: isLeaving ? 'slideOut 0.3s ease-out' : 'slideIn 0.5s ease-out',
        ...props.style
      }}
    >
      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-20"
            style={{
              background: config.particles[i % config.particles.length],
              left: `${10 + (i * 15)}%`,
              top: `${20 + (i * 10)}%`,
              animation: `float ${3 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
              boxShadow: `0 0 10px ${config.particles[i % config.particles.length]}`
            }}
          />
        ))}
      </div>

      {/* Main alert content */}
      <div 
        className="relative z-10 rounded-2xl px-6 py-4 font-medium backdrop-blur-xl"
        style={{
          background: config.bg,
          backgroundSize: '200% 200%',
          animation: 'gradientShift 4s ease infinite',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: `
            0 8px 32px 0 rgba(0, 0, 0, 0.3),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.3),
            0 0 0 0 ${config.pulseColor}
          `,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)'
        }}
      >
        <div className="flex items-start gap-4">
          {/* Animated icon */}
          <div className="relative">
            <span 
              className="text-2xl font-bold relative z-10"
              style={{
                color: '#FFFFFF',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            >
              {icon || config.icon}
            </span>
            {/* Icon glow ring */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
                animation: 'pulse 2s ease-in-out infinite'
              }}
            />
          </div>

          {/* Alert text */}
          <div className="flex-1">
            <span 
              className="text-white relative z-10 block"
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}
            >
              {children}
            </span>
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="relative z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <span 
                className="text-white text-xs font-bold"
                style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
              >
                ×
              </span>
            </button>
          )}
        </div>

        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
            transform: 'translateX(-100%)'
          }}
        />
      </div>

      {/* Progress indicator for auto-dismiss */}
      {autoDismiss && (
        <div 
          className="absolute bottom-0 left-0 h-1 rounded-b-2xl transition-all duration-100"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            animation: `progress ${autoDismiss}ms linear`,
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
          }}
        />
      )}
    </div>
  );
}

export function ToastAlert({ 
  type = 'info', 
  children, 
  position = 'top-right',
  ...props 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const alertConfig = {
    success: { bg: 'linear-gradient(135deg, #10b981, #059669)', icon: '✓' },
    error: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', icon: '✕' },
    warning: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: '⚠' },
    info: { bg: 'linear-gradient(135deg, var(--brand), var(--accent))', icon: 'ℹ' }
  };

  const config = alertConfig[type];
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  };

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed z-50 ${positionStyles[position]}`}
      style={{
        animation: isMounted ? 'slideInBounce 0.5s ease-out' : 'slideOut 0.3s ease-in'
      }}
    >
      <div 
        className="relative rounded-2xl px-4 py-3 text-white font-medium backdrop-blur-xl shadow-2xl"
        style={{
          background: config.bg,
          backgroundSize: '200% 200%',
          animation: 'gradientShift 3s ease infinite',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(15px) saturate(180%)',
          WebkitBackdropFilter: 'blur(15px) saturate(180%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)'
        }}
      >
        <div className="flex items-center gap-3">
          <span 
            className="text-lg font-bold"
            style={{
              animation: 'pulse 2s ease-in-out infinite',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            {config.icon}
          </span>
          <span 
            className="text-sm relative z-10"
            style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}
          >
            {children}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LoadingAlert({ children, className = '', ...props }) {
  return (
    <div 
      className={`relative overflow-hidden group ${className}`}
      {...props}
    >
      <div 
        className="relative z-10 rounded-2xl px-6 py-4 font-medium backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 50%, var(--brand) 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 3s ease infinite',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)'
        }}
      >
        <div className="flex items-center gap-4">
          {/* Loading spinner */}
          <div className="relative w-6 h-6">
            <div 
              className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white"
              style={{
                animation: 'spin 1s linear infinite',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
              }}
            />
          </div>
          
          <div className="flex-1">
            <span 
              className="text-white relative z-10 block"
              style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}
            >
              {children}
            </span>
          </div>
        </div>

        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
            transform: 'translateX(-100%)'
          }}
        />
      </div>
    </div>
  );
}

// Add the required animations to your CSS file
const animationStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-20px) scale(0.9);
    }
  }

  @keyframes slideInBounce {
    0% {
      opacity: 0;
      transform: translateY(-100px) scale(0.3);
    }
    50% {
      transform: translateY(10px) scale(1.05);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Inject styles into document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}
