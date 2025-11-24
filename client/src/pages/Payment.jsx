import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';
import { Card, Button, Input, Select, Alert } from '../components/UI.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';
import { motion, AnimatePresence } from 'framer-motion';

// Load Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? import('@stripe/stripe-js').then(Stripe => Stripe.default(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY))
  : null;

export default function Payment() {
  const location = useLocation();
  const [amount, setAmount] = useState(5000); // in paise for Razorpay / cents for Stripe
  const [provider, setProvider] = useState('stripe'); // Default to Stripe
  const [bookingId, setBookingId] = useState('');
  const [rideId, setRideId] = useState('');
  const [msg, setMsg] = useState('');
  const [type, setType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookNowPayLater, setBookNowPayLater] = useState(false);

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
      // Get ride details to determine the correct amount
      let bookingAmount = Number(amount);
      
      // If Book Now Pay Later is selected, create booking with 0 amount
      if (bookNowPayLater) {
        bookingAmount = 0;
      }
      
      // Create booking placeholder if not provided
      let bid = bookingId;
      if (!bid) {
        const { data } = await api.post('/api/booking/create', {
          rideId: rideId || 'demo',
          seats: 1,
          amount: bookingAmount,
          paymentProvider: bookNowPayLater ? 'pending' : provider,
        });
        bid = data.booking?._id;
        setBookingId(bid || '');
      }

      // If Book Now Pay Later, skip payment processing
      if (bookNowPayLater) {
        setMsg('Ride booked successfully! You can pay later.');
        setType('success');
        setSuccess(true);
        setLoading(false);
        return;
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
      } else if (provider === 'stripe' && orderData?.paymentIntent?.client_secret && stripePromise) {
        try {
          const stripe = await stripePromise;
          const { error } = await stripe.confirmCardPayment(orderData.paymentIntent.client_secret, {
            payment_method: {
              card: {
                // For demo purposes, using a test token
                // In production, you'd collect card details from a form
                token: 'tok_visa' // Test token
              }
            }
          });

          if (error) {
            setMsg(error.message);
            setType('error');
          } else {
            await api.post('/api/payment/verify', { 
              provider, 
              bookingId: bid, 
              paymentId: orderData.paymentIntent.id, 
              status: 'paid' 
            });
            setMsg('Payment success');
            setType('success');
            setSuccess(true);
          }
        } catch (stripeError) {
          setMsg('Stripe payment failed: ' + stripeError.message);
          setType('error');
        }
      } else if (provider === 'stripe') {
        setMsg('Stripe not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to your .env file');
        setType('error');
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
      <LoadingOverlay show={loading} text="Processing..." />
      <Card className="p-6 space-y-3">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Payment</h2>
        <div className="space-y-2">
          <Select value={provider} onChange={(e)=>setProvider(e.target.value)} disabled={bookNowPayLater}>
            <option value="stripe">Stripe (test)</option>
          </Select>
          <Input 
            type="number" 
            value={amount} 
            onChange={(e)=>setAmount(e.target.value)} 
            placeholder="Amount (₹)" 
            disabled={bookNowPayLater}
          />
          <div className="text-xs text-right" style={{ color: 'var(--muted)' }}>
            {amount > 0 ? `₹${(amount / 100).toFixed(2)}` : '₹0.00'}
          </div>
          <Input placeholder="Booking ID (optional)" value={bookingId} onChange={(e)=>setBookingId(e.target.value)} />
          
          {/* Book Now, Pay Later Option */}
          <div className="flex items-center space-x-2 p-3 rounded-lg border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <input
              type="checkbox"
              id="bookNowPayLater"
              checked={bookNowPayLater}
              onChange={(e) => setBookNowPayLater(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="bookNowPayLater" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--text)' }}>
              Book Now, Pay Later
            </label>
          </div>
          
          <Button 
            className="w-full" 
            onClick={bookNowPayLater ? () => startPayment() : startPayment}
          >
            {bookNowPayLater ? 'Book Ride (Pay Later)' : 'Pay Now'}
          </Button>
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
            <div className="flex justify-center items-center h-24">
              <motion.div
                className="w-16 h-16 rounded-full border-2 flex items-center justify-center"
                style={{ 
                  background: 'color-mix(in oklab, var(--primary) 10%, transparent)',
                  borderColor: 'var(--primary)'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <motion.svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    style={{ stroke: 'var(--primary)' }}
                  />
                </motion.svg>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
