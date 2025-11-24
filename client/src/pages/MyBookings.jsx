import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../lib/api';
import { Card, Button, Alert } from '../components/UI.jsx';
import LiveRideTracking from '../components/LiveRideTracking.jsx';

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [trackingRideId, setTrackingRideId] = useState(null);
  const [cancelModal, setCancelModal] = useState(null); // For cancel confirmation modal

  useEffect(() => {
    fetchBookings();
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    console.log('User data from localStorage:', userData); // Debug log
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchBookings = async () => {
    console.log('Starting fetchBookings...');
    console.log('Current loading state:', loading);
    try {
      const { data } = await api.get('/api/booking/my');
      console.log('Bookings data:', data); // Debug log
      console.log('Setting bookings to:', data.bookings || []);
      setBookings(data.bookings || []);
      console.log('Bookings state set');
    } catch (error) {
      console.error('Error fetching bookings:', error); // Debug log
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data?.error);
      toast.error(error.response?.data?.error || 'Failed to fetch bookings');
    } finally {
      console.log('About to set loading to false');
      setLoading(false);
      console.log('Loading set to false');
    }
  };

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout - forcing loading to false');
        setLoading(false);
        toast.error('Loading timed out. Please check your connection and refresh.');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const handlePayNow = (booking) => {
    // Navigate to payment page with booking details
    navigate('/payment', { 
      state: { 
        bookingId: booking._id,
        amount: booking.amount || 5000,
        rideId: booking.ride?._id
      } 
    });
  };

  const handleCancelBooking = async (booking) => {
    // Show confirmation modal instead of browser confirm
    setCancelModal(booking);
  };

  const confirmCancelBooking = async () => {
    if (!cancelModal) return;

    try {
      await api.delete(`/api/booking/${cancelModal._id}`);
      toast.success('🚫 Ride cancelled successfully');
      setCancelModal(null);
      fetchBookings(); // Refresh the bookings list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error?.response?.data?.error || 'Failed to cancel booking');
      setCancelModal(null);
    }
  };

  const cancelCancelBooking = () => {
    setCancelModal(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    console.log('Still in loading state, bookings:', bookings.length);
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
          <p className="text-xs text-gray-500 mt-2">Debug: loading={loading}, bookings={bookings.length}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
        My Bookings
      </h1>
      
      {bookings.length === 0 ? (
        <Card className="p-6 text-center">
          <p style={{ color: 'var(--muted)' }}>You haven't made any bookings yet.</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/find-ride')}
          >
            Find a Ride
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking, index) => {
            return (
            <Card key={booking._id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                    {booking.ride?.source || 'Unknown'} → {booking.ride?.destination || 'Unknown'}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Ride Date: {booking.ride?.time ? formatDate(booking.ride.time) : 'Not scheduled'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Booked on: {formatDate(booking.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status === 'paid' ? 'Paid' : 'Payment Pending'}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Seats: {booking.seats}
                  </p>
                  {booking.amount > 0 && (
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      Amount: ${(booking.amount / 100).toFixed(2)}
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {/* Live Tracking Button - Available for all bookings */}
                  <Button 
                    onClick={() => setTrackingRideId(trackingRideId === booking.ride?._id ? null : booking.ride?._id)}
                    className="px-3 py-1 text-sm"
                    variant={trackingRideId === booking.ride?._id ? "secondary" : "primary"}
                  >
                    {trackingRideId === booking.ride?._id ? 'Hide Tracking' : 'Track Ride'}
                  </Button>
                  
                  {/* Cancel Booking Button - Always show for active bookings */}
                  <Button 
                    onClick={() => handleCancelBooking(booking)}
                    className="px-3 py-1 text-sm hover:bg-red-700"
                    style={{ 
                      background: '#dc2626', 
                      color: 'white',
                      border: '1px solid #dc2626'
                    }}
                  >
                    Cancel Booking
                  </Button>
                  
                  {booking.status === 'confirmed' && (
                    <div className="text-sm text-green-600 font-medium">
                      Booking Confirmed ✓
                    </div>
                  )}
                  {booking.status === 'paid' && (
                    <div className="text-sm text-green-600 font-medium">
                      Paid ✓
                    </div>
                  )}
                  {booking.status === 'pending' && booking.amount > 0 && (
                    <Button 
                      onClick={() => handlePayNow(booking)}
                      className="px-4 py-2"
                    >
                      Pay Now
                    </Button>
                  )}
                  {booking.status === 'pending' && booking.amount === 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      Free ride - No payment required
                    </div>
                  )}
                </div>
              </div>
              
              {/* Live Tracking Component */}
              {trackingRideId === booking.ride?._id && user && (
                <div className="mt-4">
                  <LiveRideTracking 
                    rideId={booking.ride?._id}
                    isDriver={false}
                    userId={user.id}
                    bookingStatus={booking.status}
                    bookingAmount={booking.amount}
                  />
                </div>
              )}
            </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ 
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelCancelBooking}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ 
                background: 'var(--surface)', 
                color: 'var(--text)',
                zIndex: 10000,
                position: 'relative'
              }}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🚫</div>
                <h3 className="text-xl font-semibold mb-2">Cancel Ride Booking?</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Are you sure you want to cancel your ride from <strong>{cancelModal.ride?.source || 'Unknown'}</strong> to <strong>{cancelModal.ride?.destination || 'Unknown'}</strong>?
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                  This action cannot be undone and your seat will be released.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-sm p-3 rounded-lg" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                  <strong>⚠️ Important:</strong> Cancellation will release your seat and this booking will be permanently deleted.
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <ButtonSecondary onClick={cancelCancelBooking}>
                    No, Keep Booking
                  </ButtonSecondary>
                  <Button 
                    onClick={confirmCancelBooking}
                    style={{ 
                      background: '#dc2626', 
                      color: 'white',
                      border: '1px solid #dc2626'
                    }}
                    className="hover:bg-red-700"
                  >
                    Yes, Cancel Ride
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
