import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Use reliable photo backgrounds and overlay our own moving car for animation
const defaultImages = [
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501706362039-c06b2d715385?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=1920&auto=format&fit=crop&sat=-50',
  'https://images.unsplash.com/photo-1519640350407-953bc0614f4e?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1465447142348-e9952c393450?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506976785307-8732e854ad75?q=80&w=1920&auto=format&fit=crop'
];

const carSvg = `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 32'><rect x='6' y='10' width='40' height='12' rx='4' fill='#FFC043'/><circle cx='16' cy='24' r='4' fill='#111'/><circle cx='36' cy='24' r='4' fill='#111'/></svg>")}`;

export default function Carousel({ images = defaultImages, interval = 3500, className = '' }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className={`relative overflow-hidden rounded-xl border ${className}`} style={{ borderColor: 'rgba(0,0,0,0.08)', minHeight: '260px', height: 'clamp(240px, 32vw, 380px)' }}>
      <AnimatePresence initial={false}>
        <motion.img
          key={images[index]}
          src={images[index]}
          alt="carousel"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>
      {/* Animated car overlay */}
      <motion.div
        className="absolute bottom-8 h-8 w-12"
        style={{ backgroundImage: `url(${carSvg})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }}
        animate={{ x: ['-10%', '105%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full transition ${i === index ? 'scale-110' : 'opacity-60'}`}
            style={{ background: 'var(--primary)' }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
