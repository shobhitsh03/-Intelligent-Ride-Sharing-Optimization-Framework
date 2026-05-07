import { useEffect, useState } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import Carousel from '../components/Carousel.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ButtonSecondary, Card, Input } from '../components/UI.jsx';
import { Car, Search, MapPin, Shield, Zap, Users, Star, Clock, CreditCard, Navigation, CheckCircle, TrendingUp, Award, Heart, ArrowRight } from 'lucide-react';

// Helper function to check if user is a rider and show alert
const handleCreateRideClick = (e, navigate) => {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  
  if (roles.includes('rider') && !roles.includes('driver')) {
    alert('You are logged in as a Rider. Only Drivers can create rides. Please register as a Driver to create rides.');
    return false;
  }
  
  navigate('/create-ride');
  return true;
};

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
  const navigate = useNavigate();
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
    <div className="space-y-12">
      {/* Professional Hero Section */}
      <section className="relative rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        <Carousel className="border-0" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.6))' }} />
        <motion.div
          className="absolute left-6 right-6 bottom-6 md:left-12 md:right-12 md:bottom-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand)' }}>
              <Car size={24} style={{ color: '#fbbf24' }} />
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                <CheckCircle size={12} className="inline mr-1" />
                Live Tracking
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                <Shield size={12} className="inline mr-1" />
                Secure
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-lg" style={{ color: '#ffffff' }}>
            Go anywhere, together
          </h1>
          <p className="mt-4 text-base md:text-lg max-w-3xl drop-shadow" style={{ color: '#f3f4f6' }}>
            Book affordable carpools with live tracking, secure payments, and AI‑smart matching. Save money while reducing your carbon footprint.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/find-ride">
              <button className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2" style={{ background: 'var(--brand)', color: '#111' }}>
                <Search size={18} />
                Find a Ride
              </button>
            </Link>
            <button onClick={(e) => handleCreateRideClick(e, navigate)} className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              <Car size={18} />
              Create a Ride
            </button>
          </div>
        </motion.div>
      </section>

      {loading && <div className="text-sm" style={{ color: 'var(--muted)' }}>Loading recommendations...</div>}

      {/* Feature cards */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Navigation size={24} style={{ color: 'var(--brand)' }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Why Choose Us</h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Find Rides',
              desc: 'Find nearby rides with live maps and smart matching. Book in seconds and track pickup in real time.',
              icon: Search,
              to: '/find-ride',
              cta: 'Find rides'
            },
            {
              title: 'Reserve Ahead',
              desc: 'Plan ahead. Pick a pickup time on the Find Ride page to reserve your seat for later.',
              icon: Clock,
              to: '/find-ride',
              cta: 'Reserve now'
            },
            {
              title: 'Intercity Trips',
              desc: 'Affordable outstation trips. Search routes between cities and pick the best option for you.',
              icon: MapPin,
              to: '/find-ride',
              cta: 'Explore routes'
            }
          ].map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="p-6 h-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex flex-col h-full">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--brand-opacity)' }}>
                    <c.icon size={28} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>{c.title}</div>
                  <p className="text-sm flex-1 mb-4" style={{ color: 'var(--muted)' }}>{c.desc}</p>
                  <Link to={c.to} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: 'var(--brand)', color: '#111' }}>
                    {c.cta}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Zap size={24} style={{ color: 'var(--brand)' }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>How It Works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: 'Search & Book',
              desc: 'Choose pickup and drop, set seats/time, and preview fares and ETA.',
              icon: Search,
              link: '/find-ride'
            },
            {
              step: '2',
              title: 'Pay Securely',
              desc: 'Confirm your seat and pay via Razorpay/Stripe test—instant booking.',
              icon: CreditCard,
              link: '/payment'
            },
            {
              step: '3',
              title: 'Track & Ride',
              desc: 'Track live on the map, get pickup updates, and ride together safely.',
              icon: Navigation,
              link: '/track'
            }
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="p-6 h-full relative" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: 'var(--brand)', color: '#111' }}>
                  {s.step}
                </div>
                <div className="pt-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--brand-opacity)' }}>
                    <s.icon size={24} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>{s.title}</div>
                  <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{s.desc}</p>
                  <Link to={s.link} className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--brand)' }}>
                    Learn more <ArrowRight size={14} />
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={24} style={{ color: 'var(--brand)' }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Our Impact</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              value: '120+',
              label: 'Active rides today',
              icon: Car,
              color: '#3b82f6'
            },
            {
              value: '45',
              label: 'Cities covered',
              icon: MapPin,
              color: '#10b981'
            },
            {
              value: '10k+',
              label: 'Happy riders',
              icon: Users,
              color: '#f59e0b'
            }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="p-6 text-center" style={{ background: 'var(--brand-opacity)', border: '1px solid var(--border)' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--brand-opacity)' }}>
                  <stat.icon size={28} style={{ color: 'var(--brand)' }} />
                </div>
                <div className="text-4xl font-bold mb-2" style={{ color: 'var(--text)' }}>{stat.value}</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <Card className="p-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: 'var(--brand-opacity)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--brand)' }}>
            <Car size={32} style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <div className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Ready to start your journey?</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>Find a ride or offer one in a few taps. Save money and reduce your carbon footprint.</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/find-ride">
            <button className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2" style={{ background: 'var(--brand)', color: '#111' }}>
              <Search size={18} />
              Find Ride
            </button>
          </Link>
          <button onClick={(e) => handleCreateRideClick(e, navigate)} className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Car size={18} />
            Create Ride
          </button>
        </div>
      </Card>

      {/* Testimonials */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Star size={24} style={{ color: 'var(--brand)' }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>What Riders Say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[{
            q: 'Smooth pickup and accurate ETA. Saved me time!',
            name: 'Ananya', city: 'Bengaluru',
            rating: 5,
            img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop'
          }, {
            q: 'Great fares and friendly drivers. Booking was easy.',
            name: 'Ravi', city: 'Delhi',
            rating: 5,
            img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop'
          }, {
            q: 'I share rides on my commute and it pays for fuel.',
            name: 'Mehul', city: 'Mumbai',
            rating: 5,
            img: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=256&auto=format&fit=crop'
          }].map((t, i) => (
            <motion.div
              key={i}
              className="rounded-2xl border p-6"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} size={16} fill="#fbbf24" style={{ color: '#fbbf24' }} />
                ))}
              </div>
              <div className="text-sm mb-4" style={{ color: 'var(--text)' }}>&ldquo;{t.q}&rdquo;</div>
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover border-2" style={{ borderColor: 'var(--brand)' }} />
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{t.name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{t.city}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Shield size={24} style={{ color: 'var(--brand)' }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Trust & Safety</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Secure Payments',
              desc: 'SSL encryption and trusted payment gateways',
              icon: Shield,
              color: '#3b82f6'
            },
            {
              title: 'Real-time Tracking',
              desc: 'Live location updates and ETA monitoring',
              icon: Navigation,
              color: '#10b981'
            },
            {
              title: 'Community Rated',
              desc: 'Quality maintained through user reviews and ratings',
              icon: Award,
              color: '#f59e0b'
            },
          ].map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card
                className="p-6 flex flex-col items-center text-center gap-4"
                style={{ background: 'var(--brand-opacity)', border: '1px solid var(--border)' }}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--brand-opacity)' }}>
                  <b.icon size={32} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{b.title}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{b.desc}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}

