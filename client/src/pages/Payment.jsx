import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';
import { Card, Button, Input, Select, Alert } from '../components/UI.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function Payment() {
  const location = useLocation();
  const [amount, setAmount] = useState(5000); // in paise for Razorpay / cents for Stripe
  const [provider, setProvider] = useState('razorpay');
  const [bookingId, setBookingId] = useState('');
  const [rideId, setRideId] = useState('');
  const [msg, setMsg] = useState('');
  const [type, setType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Prefill from navigation state (Find Ride "Book")
  useEffect(() => {
    const st = location?.state || {};
    if (st.amount && typeof st.amount === 'number') setAmount(st.amount);
    if (st.rideId) setRideId(st.rideId);
  }, [location?.state]);

  async function startPayment() {
    setMsg('');
    setType('info');
    setSuccess(false);
    setLoading(true);
    try {
      // Create booking placeholder if not provided
      let bid = bookingId;
      if (!bid) {
        const { data } = await api.post('/api/booking/create', {
          rideId: rideId || 'demo',
          seats: 1,
          amount: Number(amount),
          paymentProvider: provider,
        });
          bid = data.booking?._id;
          setBookingId(bid || '');
      }

      const { data: orderData } = await api.post('/api/payment/order', {
        provider,
        amount: Number(amount),
        currency: provider === 'razorpay' ? 'INR' : 'USD',
        bookingId: bid,
      });

      if (provider === 'razorpay' && window.Razorpay && orderData?.order) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_xxxxx',
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'Carpool',
          description: 'Ride booking',
          order_id: orderData.order.id,
          handler: async function (response) {
            await api.post('/api/payment/verify', { provider, bookingId: bid, paymentId: response.razorpay_payment_id, status: 'paid' });
            setMsg('Payment success');
            setType('success');
            setSuccess(true);
          },
          theme: { color: '#2563EB' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (provider === 'stripe' && orderData?.paymentIntent?.client_secret) {
        setMsg('Stripe PI created. Integrate confirmCardPayment on a real form.');
        setType('info');
      } else {
        setMsg('Payment provider not ready');
        setType('error');
      }
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Payment failed');
      setType('error');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto">
      <LoadingOverlay show={loading} text="Processing payment..." />
      <Card className="p-6 space-y-3">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Payment</h2>
        <div className="space-y-2">
          <Select value={provider} onChange={(e)=>setProvider(e.target.value)}>
            <option value="razorpay">Razorpay (IN)</option>
            <option value="stripe">Stripe (test)</option>
          </Select>
          <Input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Amount (paise/cents)" />
          <Input placeholder="Booking ID (optional)" value={bookingId} onChange={(e)=>setBookingId(e.target.value)} />
          <Button className="w-full" onClick={startPayment}>Pay</Button>
        </div>
        {msg && <Alert type={type}>{msg}</Alert>}
      </Card>

      {/* Success animation */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="mt-6 rounded-xl border p-6 overflow-hidden"
            style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Booking confirmed!</div>
            <div className="relative h-24 rounded-md" style={{ background: 'linear-gradient(90deg, color-mix(in oklab, var(--primary) 10%, transparent), transparent)' }}>
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 rounded-full" style={{ background: 'color-mix(in oklab, var(--primary) 30%, transparent)' }} />
              <motion.div className="w-12 h-7 rounded-full border shadow"
                style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.08)' }}
                animate={{ x: [0, 260, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
