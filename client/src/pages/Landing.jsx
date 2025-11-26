import { useEffect, useState } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import Carousel from '../components/Carousel.jsx';
import { Link } from 'react-router-dom';
import { Button, ButtonSecondary, Card, Input } from '../components/UI.jsx';
import { Car, Search as SearchIcon, UserPlus } from '../components/Icons.jsx';

// simple lightweight illustrations (SVG data URIs)
const illos = {
  ride: '/card-ride.svg',
  reserve: '/card-reserve.svg',
  intercity: '/card-intercity.svg',
};

// timeline illustrations (lighter, colorful to match reference)
const stepIllos = [
  '/step1-search.svg',
  '/step2-payment.svg',
  '/step3-meet.svg',
];

export default function Landing() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRecs() {
      try {
        setLoading(true);
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          const sourceLoc = { type: 'Point', coordinates: [longitude, latitude] };
          const destLoc = sourceLoc; // placeholder same as source
          const { data } = await api.post('/api/rides/match', { sourceLoc, destLoc });
          setRides(data.rides || []);
          setLoading(false);
        }, () => setLoading(false));
      } catch (_) {
        setLoading(false);
      }
    }
    fetchRecs();
  }, []);

  return (
    <div className="space-y-8">
      <section className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <Carousel className="border-0" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.35))' }} />
        <motion.div
          className="absolute left-6 right-6 bottom-6 md:left-10 md:right-10 md:bottom-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow-md" style={{ color: '#ffffff' }}>
            Go anywhere, together
          </h1>
          <p className="mt-2 text-sm md:text-base max-w-2xl drop-shadow" style={{ color: '#f3f4f6' }}>
            Book affordable carpools with live tracking, secure payments, and AI‑smart matching.
          </p>
        </motion.div>
      </section>

      {loading && <div className="text-sm" style={{ color: 'var(--muted)' }}>Loading recommendations...</div>}

      {/* Feature cards */}
      <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[{
          title: 'Ride',
          desc: 'Find nearby rides with live maps and smart matching. Book in seconds and track pickup in real time.',
          img: illos.ride,
          to: '/find-ride',
          cta: 'Find rides'
        }, {
          title: 'Reserve',
          desc: 'Plan ahead. Pick a pickup time on the Find Ride page to reserve your seat for later.',
          img: illos.reserve,
          to: '/find-ride',
          cta: 'Reserve now'
        }, {
          title: 'Intercity',
          desc: 'Affordable outstation trips. Search routes between cities and pick the best option for you.',
          img: illos.intercity,
          to: '/find-ride',
          cta: 'Explore routes'
        }].map((c, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>{c.title}</div>
                  <p className="mt-2 text-sm pr-2" style={{ color: 'var(--muted)' }}>{c.desc}</p>
                </div>
                <Link to={c.to} className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium active:scale-95 transition" style={{ background: '#111', color: '#fff' }}>
                  {c.cta}
                </Link>
              </div>
              <img src={c.img} alt={c.title} className="h-24 w-28 object-contain" />
            </div>
          </Card>
        ))}
      </section>

      {/* How it works (CSS-like dimensions) */}
      <section className="mt-6 md:mt-8">
        <div className="booking-steps" style={{ maxWidth: 800, margin: '60px auto', padding: 20, fontFamily: 'Inter, ui-sans-serif, system-ui' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: 40, fontWeight: 700, color: 'var(--text)' }}>Book your trip in a few taps</h2>

          {/* Step 1 */}
          <div className="step" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 50, gap: 20, borderLeft: '3px solid #000', paddingLeft: 20, position: 'relative' }}>
            <span style={{ content: '""', position: 'absolute', left: -8, top: 10, width: 15, height: 15, background: '#000', borderRadius: '50%' }} />
            <img src={stepIllos[0]} alt="Add details" style={{ width: 160, height: 'auto', borderRadius: 10, objectFit: 'cover' }} />
            <div className="step-content">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}><Link to="/find-ride">1. Add your trip details</Link></h3>
              <p style={{ fontSize: '1rem', lineHeight: 1.5, color: '#333' }}>Choose pickup and drop, set seats/time, and preview fares and ETA.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 50, gap: 20, borderLeft: '3px solid #000', paddingLeft: 20, position: 'relative' }}>
            <span style={{ content: '""', position: 'absolute', left: -8, top: 10, width: 15, height: 15, background: '#000', borderRadius: '50%' }} />
            <img src={stepIllos[1]} alt="Pay easily" style={{ width: 160, height: 'auto', borderRadius: 10, objectFit: 'cover' }} />
            <div className="step-content">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}><Link to="/payment">2. Pay securely</Link></h3>
              <p style={{ fontSize: '1rem', lineHeight: 1.5, color: '#333' }}>Confirm your seat and pay via Razorpay/Stripe test—instant booking.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 0, gap: 20, borderLeft: '3px solid #000', paddingLeft: 20, position: 'relative' }}>
            <span style={{ content: '""', position: 'absolute', left: -8, top: 10, width: 15, height: 15, background: '#000', borderRadius: '50%' }} />
            <img src={stepIllos[2]} alt="Meet driver" style={{ width: 160, height: 'auto', borderRadius: 10, objectFit: 'cover' }} />
            <div className="step-content">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}><Link to="/track">3. Meet your driver</Link></h3>
              <p style={{ fontSize: '1rem', lineHeight: 1.5, color: '#333' }}>Track live on the map, get pickup updates, and ride together safely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 text-center" style={{ background: 'rgba(17,17,17,0.9)', color: '#ffffff' }}>
          <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>120+</div>
          <div className="text-sm" style={{ color: '#e5e7eb' }}>Active rides today</div>
        </Card>
        <Card className="p-5 text-center" style={{ background: 'rgba(17,17,17,0.9)', color: '#ffffff' }}>
          <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>45</div>
          <div className="text-sm" style={{ color: '#e5e7eb' }}>Cities covered</div>
        </Card>
        <Card className="p-5 text-center" style={{ background: 'rgba(17,17,17,0.9)', color: '#ffffff' }}>
          <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>10k+</div>
          <div className="text-sm" style={{ color: '#e5e7eb' }}>Happy riders</div>
        </Card>
      </section>

      {/* CTA banner */}
      <Card className="p-6 flex flex-col md:flex-row items-center justify-between gap-3" style={{ background: 'rgba(17,17,17,0.9)', backdropFilter: 'blur(8px)', color: '#ffffff' }}>
        <div>
          <div className="text-lg font-semibold" style={{ color: '#ffffff' }}>Ready to start?</div>
          <div className="text-sm" style={{ color: '#e5e7eb' }}>Find a ride or offer one in a few taps.</div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/find-ride"><Button>Find Ride</Button></Link>
          <Link to="/create-ride"><button className="text-sm flex items-center gap-1 rounded-md px-3 py-1.5 border active:scale-95 transition" style={{ background: '#10b981', color: '#fff', borderColor: '#10b981' }}>Create Ride</button></Link>
        </div>
      </Card>

      {/* Testimonials slider */}
      <section>
        <div className="font-semibold mb-3" style={{ color: 'var(--text)' }}>What riders say</div>
        <div className="grid md:grid-cols-3 gap-4">
          {[{
            q: 'Smooth pickup and accurate ETA. Saved me time!',
            name: 'Ananya', city: 'Bengaluru',
            img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop'
          }, {
            q: 'Great fares and friendly drivers. Booking was easy.',
            name: 'Ravi', city: 'Delhi',
            img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop'
          }, {
            q: 'I share rides on my commute and it pays for fuel.',
            name: 'Mehul', city: 'Mumbai',
            img: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=256&auto=format&fit=crop'
          }].map((t, i) => (
            <motion.div key={i} className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <div className="text-sm" style={{ color: 'var(--text)' }}>&ldquo;{t.q}&rdquo;</div>
              <div className="mt-3 flex items-center gap-2">
                <img src={t.img} alt={t.name} className="h-8 w-8 rounded-full object-cover border" style={{ borderColor: 'rgba(0,0,0,0.08)' }} />
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{t.name}, {t.city}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: 'Secure payments',
            desc: 'SSL and trusted gateways',
            img: '/badge-secure-payments.svg'
          },
          {
            title: 'Real-time tracking',
            desc: 'Live location updates',
            img: '/badge-realtime-tracking.svg'
          },
          {
            title: 'Community rated',
            desc: 'Quality via user reviews',
            img: '/badge-community-rated.svg'
          },
        ].map((b, i) => (
          <Card
            key={i}
            className="p-6 flex flex-col items-center text-center gap-3"
            style={{ background: 'color-mix(in oklab, var(--surface) 96%, transparent)' }}
          >
            <div className="h-16 w-16 rounded-full overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <img src={b.img} alt={b.title} className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{b.title}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{b.desc}</div>
            </div>
          </Card>
        ))}
      </section>

    </div>
  );
}

