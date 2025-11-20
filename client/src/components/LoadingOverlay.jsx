import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingOverlay({ show = false, text = 'Loading...' }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center"
          style={{ background: 'color-mix(in oklab, var(--bg) 85%, black)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="rounded-xl border p-6 w-[280px] text-center"
            style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}
          >
            <div className="relative h-16 overflow-hidden">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full"
                   style={{ background: 'color-mix(in oklab, var(--primary) 25%, transparent)' }} />
              <motion.div className="w-10 h-6 rounded-full mx-auto"
                style={{ background: 'var(--primary)' }}
                animate={{ x: [ -80, 80, -80 ] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{text}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
