import { useEffect, useState } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import Carousel from '../components/Carousel.jsx';
import { Link } from 'react-router-dom';
import { Button, ButtonSecondary, Card, Input } from '../components/UI.jsx';
import { Car, Search as SearchIcon, UserPlus } from '../components/Icons.jsx';

// simple lightweight illustrations (SVG data URIs)
const illos = {
  ride: `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#f8fafc'/><stop offset='100%' stop-color='#e5e7eb'/></linearGradient></defs><rect width='200' height='120' rx='14' fill='url(#g)'/><g transform='translate(20,40)'><rect x='0' y='20' width='100' height='28' rx='10' fill='#111'/><rect x='10' y='8' width='80' height='24' rx='8' fill='#fff'/><circle cx='22' cy='52' r='8' fill='#111'/><circle cx='78' cy='52' r='8' fill='#111'/></g></svg>")}`,
  reserve: `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120'><rect width='200' height='120' rx='14' fill='#f3f4f6'/><g transform='translate(28,22)'><rect x='0' y='10' width='120' height='70' rx='8' fill='#fff' stroke='#d1d5db'/><rect x='0' y='0' width='120' height='16' rx='6' fill='#ef4444'/><circle cx='100' cy='72' r='12' fill='#111'/><rect x='16' y='34' width='16' height='10' rx='2' fill='#e5e7eb'/><rect x='36' y='34' width='16' height='10' rx='2' fill='#e5e7eb'/><rect x='56' y='34' width='16' height='10' rx='2' fill='#e5e7eb'/></g></svg>")}`,
  intercity: `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120'><rect width='200' height='120' rx='14' fill='#eef2ff'/><g transform='translate(22,34)'><rect x='18' y='40' width='120' height='12' rx='6' fill='#111'/><rect x='0' y='28' width='90' height='24' rx='10' fill='#fff'/><circle cx='18' cy='58' r='8' fill='#111'/><circle cx='76' cy='58' r='8' fill='#111'/><rect x='120' y='14' width='16' height='38' rx='4' fill='#94a3b8'/></g></svg>")}`,
};

// timeline illustrations (lighter, colorful to match reference)
const stepIllos = [
  `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 140'><defs><linearGradient id='g1' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#fde68a'/><stop offset='100%' stop-color='#f59e0b'/></linearGradient></defs><rect width='240' height='140' rx='14' fill='url(#g1)'/><rect x='28' y='24' rx='14' width='110' height='60' fill='#ffffff' opacity='0.9'/><rect x='40' y='34' rx='6' width='86' height='14' fill='#111'/></svg>")}`,
  `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 140'><defs><linearGradient id='g2' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#93c5fd'/><stop offset='100%' stop-color='#3b82f6'/></linearGradient></defs><rect width='240' height='140' rx='14' fill='url(#g2)'/><rect x='30' y='32' rx='8' width='120' height='70' fill='#ffffff'/><rect x='30' y='22' rx='6' width='120' height='14' fill='#111'/><rect x='164' y='54' rx='12' width='38' height='26' fill='#111'/></svg>")}`,
  `data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 140'><defs><linearGradient id='g3' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#c7d2fe'/><stop offset='100%' stop-color='#6366f1'/></linearGradient></defs><rect width='240' height='140' rx='14' fill='url(#g3)'/><rect x='36' y='70' width='140' height='10' rx='5' fill='#111'/><rect x='46' y='46' width='110' height='18' rx='8' fill='#fff'/><circle cx='60' cy='85' r='8' fill='#111'/><circle cx='126' cy='85' r='8' fill='#111'/></svg>")}`,
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
        <Card className="p-5 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>120+</div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>Active rides today</div>
        </Card>
        <Card className="p-5 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>45</div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>Cities covered</div>
        </Card>
        <Card className="p-5 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>10k+</div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>Happy riders</div>
        </Card>
      </section>

      {/* CTA banner */}
      <Card className="p-6 flex flex-col md:flex-row items-center justify-between gap-3" style={{ background: 'linear-gradient(135deg, var(--surface), color-mix(in oklab, var(--primary) 6%, transparent))' }}>
        <div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Ready to start?</div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>Find a ride or offer one in a few taps.</div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/find-ride"><Button>Find Ride</Button></Link>
          <Link to="/create-ride"><ButtonSecondary>Create Ride</ButtonSecondary></Link>
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
            img: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=256&auto=format&fit=crop'
          },
          {
            title: 'Real-time tracking',
            desc: 'Live location updates',
            img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=256&auto=format&fit=crop'
          },
          {
            title: 'Community rated',
            desc: 'Quality via user reviews',
            img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=256&auto=format&fit=crop'
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

      {/* Top routes near you (sample) */}
      <Card className="p-6">
        <div className="font-semibold mb-2" style={{ color: 'var(--text)' }}>Popular routes near you</div>
        <ul className="grid md:grid-cols-3 gap-3 text-sm" style={{ color: 'var(--muted)' }}>
          {['Koramangala → Whitefield', 'Andheri → BKC', 'Gurugram → Connaught Place', 'Noida → Nehru Place', 'Kondapur → Hitech City', 'Salt Lake → Park Street'].map((r, i)=> (
            <li key={i} className="rounded-md border px-3 py-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>{r}</li>
          ))}
        </ul>
      </Card>

      {/* App badges + newsletter */}
      <Card className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-semibold" style={{ color: 'var(--text)' }}>Get the app</div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>Faster access and instant notifications.</div>
          <div className="mt-3 flex gap-2">
            <ButtonSecondary>App Store</ButtonSecondary>
            <ButtonSecondary>Google Play</ButtonSecondary>
          </div>
        </div>
        <div className="w-full md:w-auto">
          <div className="font-semibold" style={{ color: 'var(--text)' }}>Subscribe</div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>Get product updates and offers.</div>
          <div className="mt-2 flex items-center gap-2">
            <Input placeholder="Your email" />
            <Button>Subscribe</Button>
          </div>
        </div>
      </Card>

    </div>
  );
}

