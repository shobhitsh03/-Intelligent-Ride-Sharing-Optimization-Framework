export function LogoIcon({ size = 40, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Car body */}
      <path 
        d="M20 60 Q20 50 30 50 L70 50 Q80 50 80 60 L80 70 Q80 75 75 75 L70 75 Q65 75 65 70 L65 65 L35 65 L35 70 Q35 75 30 75 L25 75 Q20 75 20 70 Z" 
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Car top */}
      <path 
        d="M30 50 L35 35 Q40 25 50 25 Q60 25 65 35 L70 50" 
        stroke="currentColor" 
        strokeWidth="3" 
        fill="none"
      />
      {/* Wheels */}
      <circle cx="30" cy="70" r="8" fill="currentColor" />
      <circle cx="70" cy="70" r="8" fill="currentColor" />
      {/* People icons - driver */}
      <circle cx="55" cy="40" r="6" fill="currentColor" />
      <path d="M50 52 Q55 48 60 52" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* People icons - passenger */}
      <circle cx="40" cy="40" r="5" fill="currentColor" fillOpacity="0.6" />
      <path d="M36 50 Q40 47 44 50" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.6" />
      {/* Connection line */}
      <path 
        d="M15 45 Q25 35 35 40" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeDasharray="4 2"
        fill="none"
      />
    </svg>
  );
}
