import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Card, Button, Input, Select, Alert } from '../components/UI.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';
import RideReceipt from '../components/RideReceipt.jsx';
import CustomPaymentGateway from '../components/CustomPaymentGateway.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(5000); // in paise for Razorpay / cents for Stripe
  const [provider, setProvider] = useState('stripe'); // Default to Stripe
  const [bookingId, setBookingId] = useState('');
  const [rideId, setRideId] = useState('');
  const [msg, setMsg] = useState('');
  const [type, setType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookNowPayLater, setBookNowPayLater] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState({ booking: null, ride: null, driver: null });
  const [showCustomGateway, setShowCustomGateway] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Prefill from navigation state (Find Ride "Book")
  useEffect(() => {
    const st = location?.state || {};
    if (st.amount && typeof st.amount === 'number') setAmount(st.amount);
    if (st.rideId) setRideId(st.rideId);
  }, [location?.state]);

  // Clear message when custom gateway is shown
  useEffect(() => {
    if (showCustomGateway) {
      setMsg('');
      setType('info');
      setSuccess(false);
      // Clear any potential cached error messages
      localStorage.removeItem('payment_error');
      console.log('Custom gateway opened, cleared parent message state and localStorage');
    }
  }, [showCustomGateway]);

  const showBookingReceipt = async (bookingId) => {
    try {
      const { data } = await api.get(`/api/booking/${bookingId}`);
      setReceiptData({
        booking: data.booking,
        ride: data.ride,
        driver: data.driver
      });
      setShowReceipt(true);
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
    }
  };

  const handleDownloadReceipt = () => {
    // Simple download functionality - can be enhanced
    const receiptContent = `
      RideFlex Booking Receipt
      ========================
      Booking ID: ${receiptData.booking?._id?.slice(-8).toUpperCase()}
      From: ${receiptData.ride?.source}
      To: ${receiptData.ride?.destination}
      Date: ${receiptData.ride?.time ? new Date(receiptData.ride.time).toLocaleString() : 'N/A'}
      Fare: ₹${receiptData.booking?.amount || receiptData.ride?.fare}
      Payment Status: ${receiptData.booking?.status?.toUpperCase()}
      Driver: ${receiptData.driver?.name}
    `;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${receiptData.booking?._id?.slice(-8).toUpperCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareReceipt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RideFlex Booking Receipt',
          text: `Booking ID: ${receiptData.booking?._id?.slice(-8).toUpperCase()}. Ride from ${receiptData.ride?.source} to ${receiptData.ride?.destination}.`
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      alert('Sharing not supported on this browser');
    }
  };

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
      if (!bid && rideId && rideId !== 'demo') {
        try {
          const { data } = await api.post('/api/booking/create', {
            rideId: rideId,
            seats: 1,
            amount: bookingAmount,
            paymentProvider: bookNowPayLater ? 'pending' : provider,
          });
          bid = data.booking?._id;
          setBookingId(bid || '');
        } catch (bookingError) {
          console.log('Booking creation failed, proceeding without booking:', bookingError.message);
          // Continue with payment without booking
        }
      }

      // If Book Now Pay Later, skip payment processing
      if (bookNowPayLater) {
        setMsg('Ride booked successfully! You can pay later.');
        setType('success');
        setSuccess(true);
        setLoading(false);
        if (bid) {
          await showBookingReceipt(bid);
        }
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
            if (bid) {
              await showBookingReceipt(bid);
            }
          },
          theme: { color: '#2563EB' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (provider === 'stripe' && orderData?.url) {
        // Redirect to Stripe Checkout
        window.location.href = orderData.url;
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
            <option value="custom">RideFlex Gateway (Card/UPI/Wallet)</option>
          </Select>
          <Input 
            type="number" 
            value={amount} 
            onChange={(e)=>setAmount(e.target.value)} 
            placeholder="Amount ($)" 
            disabled={bookNowPayLater}
          />
          <div className="text-xs text-right" style={{ color: 'var(--muted)' }}>
            ${amount ? (amount / 100).toFixed(2) : '0.00'}
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
            onClick={() => {
              if (provider === 'custom') {
                setMsg(''); // Clear any existing messages
                setType('info');
                setSuccess(false); // Clear success state
                setShowCustomGateway(true);
                console.log('Opening custom gateway, cleared msg and success state');
              } else {
                startPayment();
              }
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (bookNowPayLater ? 'Book Ride (Pay Later)' : (provider === 'custom' ? `Pay ₹${(amount / 100).toFixed(2)}` : `Pay $${(amount / 100).toFixed(2)}`))}
          </Button>
        </div>
        {/* Temporarily removed Alert to debug issue */}
        {/* {msg && !showCustomGateway && <Alert key={forceUpdate} type={type}>{msg}</Alert>} */}
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

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <RideReceipt
            booking={receiptData.booking}
            ride={receiptData.ride}
            driver={receiptData.driver}
            onClose={() => setShowReceipt(false)}
            onDownload={handleDownloadReceipt}
            onShare={handleShareReceipt}
          />
        )}
      </AnimatePresence>

      {/* Custom Payment Gateway Modal */}
      <AnimatePresence>
        {showCustomGateway && (
          <CustomPaymentGateway
            amount={amount / 100}
            bookingId={bookingId}
            onPaymentSuccess={async (result) => {
              console.log('Payment success callback called in parent');
              setShowCustomGateway(false);
              
              // Clear all states first
              setMsg('');
              setType('info');
              
              // Then set success states
              setTimeout(() => {
                setSuccess(true);
                setMsg('Payment successful');
                setType('success');
                setForceUpdate(prev => prev + 1);
                console.log('All states updated, forcing re-render');
                
                // Show receipt after a short delay
                setTimeout(async () => {
                  if (bookingId) {
                    await showBookingReceipt(bookingId);
                  }
                }, 100);
              }, 50);
            }}
            onPaymentCancel={() => setShowCustomGateway(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
