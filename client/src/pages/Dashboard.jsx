import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  Car, MapPin, Calendar, CreditCard, Bell,
  TrendingUp, Users, Clock, CheckCircle,
  XCircle, AlertCircle, ArrowRight,
  Zap, Shield, Star, ChevronRight, Box
} from 'lucide-react';
import RideReceipt from '../components/RideReceipt.jsx';
import BlockchainView from '../components/BlockchainView.jsx';
import { AnimatePresence } from 'framer-motion';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [driverRides, setDriverRides] = useState([]);
  const [riderBookings, setRiderBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [cancelModal, setCancelModal] = useState(null);
  const [showRiderHistory, setShowRiderHistory] = useState(true);
  const [showDriverHistory, setShowDriverHistory] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState({ booking: null, ride: null, driver: null });
  const [showBlockchain, setShowBlockchain] = useState(false);
  const [blockchainType, setBlockchainType] = useState('rides'); // 'rides' or 'bookings'
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const [ridesRes, booksRes] = await Promise.allSettled([
          api.get('/api/rides/mine'),
          api.get('/api/booking/my')
        ]);
        if (mounted) {
          if (ridesRes.status === 'fulfilled') setDriverRides(ridesRes.value.data.rides || []);
          if (booksRes.status === 'fulfilled') setRiderBookings(booksRes.value.data.bookings || []);
        }

        // Fetch wallet balance (mock for now - would need backend endpoint)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (mounted && user._id) {
          setWalletBalance(500); // Mock balance - would fetch from backend
        }
      } catch (e) {
        if (mounted) setError('Failed to load history');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    try {
      const arr = JSON.parse(localStorage.getItem('notifications') || '[]');
      setNotifications(arr);
    } catch {}
    const onNotif = () => {
      try { setNotifications(JSON.parse(localStorage.getItem('notifications') || '[]')); } catch {}
    };
    window.addEventListener('notifications-updated', onNotif);
    return () => { mounted = false; window.removeEventListener('notifications-updated', onNotif); };
  }, [token]);

  async function refreshHistory() {
    try {
      const [ridesRes, booksRes] = await Promise.allSettled([
        api.get('/api/rides/mine'),
        api.get('/api/booking/my')
      ]);
      if (ridesRes.status === 'fulfilled') setDriverRides(ridesRes.value.data.rides || []);
      if (booksRes.status === 'fulfilled') setRiderBookings(booksRes.value.data.bookings || []);
    } catch {}
  }

  function removeNotification(id) {
    try {
      const arr = JSON.parse(localStorage.getItem('notifications') || '[]');
      const next = arr.filter((n) => n.id !== id);
      localStorage.setItem('notifications', JSON.stringify(next));
      setNotifications(next);
    } catch {}
  }

  function clearNotifications() {
    try {
      localStorage.setItem('notifications', JSON.stringify([]));
      setNotifications([]);
      window.dispatchEvent(new Event('notifications-updated'));
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'info', message: 'Notifications cleared' } }));
    } catch {}
  }

  function deleteNotificationHistory() {
    try {
      localStorage.removeItem('notifications');
      setNotifications([]);
      window.dispatchEvent(new Event('notifications-updated'));
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'info', message: 'Notification history deleted' } }));
    } catch {}
  }

  async function acceptBooking(id) {
    try {
      await api.patch(`/api/booking/${id}/accept`);
      removeNotification(id);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'success', message: 'Booking accepted' } }));
      refreshHistory();
    } catch (e) {
      const msg = e?.response?.data?.error || 'Accept failed';
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: msg } }));
    }
  }

  async function declineBooking(id) {
    try {
      await api.patch(`/api/booking/${id}/decline`);
      removeNotification(id);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'info', message: 'Booking declined' } }));
    } catch (e) {
      const msg = e?.response?.data?.error || 'Decline failed';
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: msg } }));
    }
  }

  const handleCancelBooking = async (booking) => {
    setCancelModal(booking);
  };

  const confirmCancelBooking = async () => {
    if (!cancelModal) return;
    try {
      await api.delete(`/api/booking/${cancelModal._id}`);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'success', message: '🚫 Ride cancelled successfully' } }));
      setCancelModal(null);
      refreshHistory();
    } catch (error) {
      const msg = error?.response?.data?.error || 'Failed to cancel booking';
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: msg } }));
      setCancelModal(null);
    }
  };

  const cancelCancelBooking = () => {
    setCancelModal(null);
  };

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
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: 'Failed to fetch receipt' } }));
    }
  };

  const handleDownloadReceipt = () => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={14} />;
      case 'paid': return <CreditCard size={14} />;
      case 'pending': return <Clock size={14} />;
      default: return <XCircle size={14} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
          {token && (() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); const label = roles.includes('driver') && roles.includes('rider') ? 'Driver & Rider' : roles.includes('driver') ? 'Driver' : roles.includes('rider') ? 'Rider' : 'User'; return (
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Welcome back, {label}</p>
          ); })()}
        </div>
        {(() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); return roles.includes('driver') ? (
          <a onClick={(e) => handleCreateRideClick(e, navigate)} href="/create-ride" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300" style={{ background: 'var(--brand)', color: '#111' }}>
            <Car size={20} />
            Create Ride
          </a>
        ) : null; })()}
      </div>

      {!token && (
        <div className="rounded-2xl border p-8 text-center" style={{ background: 'color-mix(in oklab, var(--surface) 96%, transparent)', borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.05)' }}>
            <AlertCircle size={32} style={{ color: 'var(--muted)' }} />
          </div>
          <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Not Logged In</div>
          <div className="text-sm max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
            Please login to view your trips, bookings, and manage your account.
          </div>
        </div>
      )}

      {token && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl p-6 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <Car size={24} style={{ color: '#3B82F6' }} />
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                  Total
                </span>
              </div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{riderBookings.length + driverRides.length}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Total Trips</div>
            </div>

            <div className="rounded-2xl p-6 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <CheckCircle size={24} style={{ color: '#10B981' }} />
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                  Active
                </span>
              </div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
                {riderBookings.filter(b => b.status === 'confirmed').length}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Confirmed Bookings</div>
            </div>

            <div className="rounded-2xl p-6 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <Users size={24} style={{ color: '#F59E0B' }} />
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                  Seats
                </span>
              </div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
                {driverRides.reduce((acc, r) => acc + r.availableSeats, 0)}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Available Seats</div>
            </div>

            <div className="rounded-2xl p-6 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <Bell size={24} style={{ color: '#EF4444' }} />
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                  Alerts
                </span>
              </div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{notifications.length}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Notifications</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Your Trips Section */}
              <div className="rounded-2xl p-8 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                      <MapPin size={20} style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                      <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>Your Trips</div>
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>Manage your rides and bookings</div>
                    </div>
                  </div>
                </div>

                {loading && <div className="text-center py-8" style={{ color: 'var(--muted)' }}>Loading...</div>}
                {error && <div className="text-center py-8" style={{ color: 'var(--muted)' }}>{error}</div>}
                
                {!loading && !error && (
                  <div className="space-y-6">
                    {/* Rider Bookings */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Users size={18} style={{ color: 'var(--text)' }} />
                          <div className="font-semibold" style={{ color: 'var(--text)' }}>As Rider</div>
                        </div>
                        <button
                          onClick={() => setShowRiderHistory(!showRiderHistory)}
                          className="text-xs px-4 py-2 rounded-lg font-medium transition-all duration-200"
                          style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text)' }}
                        >
                          {showRiderHistory ? 'Hide' : 'Show'} ({riderBookings.length})
                        </button>
                      </div>

                      {showRiderHistory && (
                        <>
                          {riderBookings.length === 0 ? (
                            <div className="text-center py-8 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)' }}>
                              <Car size={48} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
                              <div className="text-sm" style={{ color: 'var(--muted)' }}>No bookings yet</div>
                              <a href="/find-ride" className="inline-flex items-center gap-2 mt-3 text-sm font-medium" style={{ color: 'var(--brand)' }}>
                                Find a Ride <ArrowRight size={16} />
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {riderBookings.map((b) => (
                                <div key={b._id} className="rounded-xl p-4 border transition-all duration-200 hover:shadow-md" style={{ borderColor: 'rgba(0,0,0,0.08)', background: 'var(--bg)' }}>
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <MapPin size={16} style={{ color: 'var(--brand)' }} />
                                        <div className="font-semibold" style={{ color: 'var(--text)' }}>
                                          {b?.ride?.source} → {b?.ride?.destination}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
                                        <span className="flex items-center gap-1">
                                          <Users size={14} />
                                          {b.seats} seats
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <CreditCard size={14} />
                                          ₹{b.amount}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Calendar size={14} />
                                          {new Date(b.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(b.status)}`}>
                                        {getStatusIcon(b.status)}
                                        {b.status}
                                      </span>
                                      <button
                                        onClick={() => showBookingReceipt(b._id)}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-all duration-200 hover:opacity-90"
                                        style={{ background: '#10B981' }}
                                      >
                                        Receipt
                                      </button>
                                      {(b.status === 'confirmed' || b.status === 'pending') && (
                                        <button
                                          onClick={() => handleCancelBooking(b)}
                                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-all duration-200 hover:opacity-90"
                                          style={{ background: '#EF4444' }}
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Driver Rides */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Car size={18} style={{ color: 'var(--text)' }} />
                          <div className="font-semibold" style={{ color: 'var(--text)' }}>As Driver</div>
                        </div>
                        <button
                          onClick={() => setShowDriverHistory(!showDriverHistory)}
                          className="text-xs px-4 py-2 rounded-lg font-medium transition-all duration-200"
                          style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text)' }}
                        >
                          {showDriverHistory ? 'Hide' : 'Show'} ({driverRides.length})
                        </button>
                      </div>

                      {showDriverHistory && (
                        <>
                          {driverRides.length === 0 ? (
                            <div className="text-center py-8 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)' }}>
                              <Car size={48} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
                              <div className="text-sm" style={{ color: 'var(--muted)' }}>No rides created yet</div>
                              <a onClick={(e) => handleCreateRideClick(e, navigate)} href="/create-ride" className="inline-flex items-center gap-2 mt-3 text-sm font-medium" style={{ color: 'var(--brand)' }}>
                                Create a Ride <ArrowRight size={16} />
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {driverRides.map((r) => (
                                <div key={r._id} className="rounded-xl p-4 border transition-all duration-200 hover:shadow-md" style={{ borderColor: 'rgba(0,0,0,0.08)', background: 'var(--bg)' }}>
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <MapPin size={16} style={{ color: 'var(--brand)' }} />
                                        <div className="font-semibold" style={{ color: 'var(--text)' }}>
                                          {r.source} → {r.destination}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
                                        <span className="flex items-center gap-1">
                                          <Users size={14} />
                                          {r.availableSeats} seats
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <CreditCard size={14} />
                                          ₹{r.fare}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                                          {getStatusIcon(r.status)}
                                          {r.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payments Section */}
              <div className="rounded-2xl p-8 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <CreditCard size={20} style={{ color: '#10B981' }} />
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>Payments</div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>View your payment history</div>
                  </div>
                </div>
                <div className="text-center py-8 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <CreditCard size={48} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>No recent payments</div>
                  <div className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Proceed to booking to initiate a payment</div>
                </div>
              </div>

              {/* Wallet Balance Section */}
              <div className="rounded-2xl p-8 hover:shadow-xl transition-all duration-300" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
                    <Box size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">Wallet Balance</div>
                    <div className="text-sm text-white/70">Available for payments</div>
                  </div>
                </div>
                <div className="text-center py-6 rounded-xl bg-white/10">
                  <div className="text-4xl font-bold text-white mb-2">₹{walletBalance}</div>
                  <div className="text-sm text-white/70">Use this for quick payments</div>
                </div>
                <button className="w-full mt-4 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-white/90 transition-colors">
                  Add Funds
                </button>
              </div>

              {/* Blockchain Section */}
              <div className="rounded-2xl p-8 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                    <Box size={20} style={{ color: '#6366F1' }} />
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>Decentralized Ledger</div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>View the blockchain of rides and bookings</div>
                  </div>
                </div>

                {!showBlockchain ? (
                  <button
                    onClick={() => setShowBlockchain(true)}
                    className="w-full p-4 rounded-xl transition-all duration-200 hover:shadow-md"
                    style={{ background: 'var(--bg)', border: '1px solid rgba(0,0,0,0.08)' }}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Shield size={20} style={{ color: '#6366F1' }} />
                      <span className="font-medium" style={{ color: 'var(--text)' }}>View Blockchain</span>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBlockchainType('rides')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          blockchainType === 'rides' ? 'text-white' : ''
                        }`}
                        style={{
                          background: blockchainType === 'rides' ? '#6366F1' : 'var(--bg)',
                          color: blockchainType === 'rides' ? 'white' : 'var(--text)',
                          border: blockchainType === 'rides' ? '1px solid #6366F1' : '1px solid rgba(0,0,0,0.08)'
                        }}
                      >
                        Rides Chain
                      </button>
                      <button
                        onClick={() => setBlockchainType('bookings')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          blockchainType === 'bookings' ? 'text-white' : ''
                        }`}
                        style={{
                          background: blockchainType === 'bookings' ? '#6366F1' : 'var(--bg)',
                          color: blockchainType === 'bookings' ? 'white' : 'var(--text)',
                          border: blockchainType === 'bookings' ? '1px solid #6366F1' : '1px solid rgba(0,0,0,0.08)'
                        }}
                      >
                        Bookings Chain
                      </button>
                    </div>
                    <BlockchainView
                      blocks={blockchainType === 'rides' ? driverRides : riderBookings}
                      type={blockchainType}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Notifications */}
              <div className="rounded-2xl p-6 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                      <Bell size={20} style={{ color: '#EF4444' }} />
                    </div>
                    <div>
                      <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>Notifications</div>
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>{notifications.length} new</div>
                    </div>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell size={48} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>No notifications</div>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {notifications.map((n) => (
                      <div key={n.id} className="rounded-xl p-4 border" style={{ borderColor: 'rgba(0,0,0,0.08)', background: 'var(--bg)' }}>
                        {n.type === 'request' ? (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                                <Users size={16} style={{ color: '#3B82F6' }} />
                              </div>
                              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>New Booking Request</div>
                            </div>
                            <div className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
                              Seats: {n.seats} • Amount: ₹{n.amount}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => acceptBooking(n.id)} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:opacity-90" style={{ background: 'var(--brand)' }}>
                                Accept
                              </button>
                              <button onClick={() => declineBooking(n.id)} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200" style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}>
                                Decline
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm" style={{ color: 'var(--text)' }}>Notification</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={clearNotifications} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200" style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}>
                    Clear All
                  </button>
                  <button onClick={deleteNotificationHistory} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200" style={{ borderColor: 'rgba(239, 68, 68, 0.25)', color: '#EF4444' }}>
                    Delete History
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-2xl p-6 hover:shadow-xl transition-all duration-300" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                    <Zap size={20} style={{ color: '#A855F7' }} />
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>Quick Actions</div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>Get started quickly</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); return (
                    <>
                      {roles.includes('rider') && (
                        <a href="/find-ride" className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:shadow-md" style={{ background: 'var(--bg)', border: '1px solid rgba(0,0,0,0.08)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                              <MapPin size={20} style={{ color: '#3B82F6' }} />
                            </div>
                            <div className="font-medium" style={{ color: 'var(--text)' }}>Find a Ride</div>
                          </div>
                          <ChevronRight size={20} style={{ color: 'var(--muted)' }} />
                        </a>
                      )}
                      {roles.includes('driver') && (
                        <a onClick={(e) => handleCreateRideClick(e, navigate)} href="/create-ride" className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:shadow-md" style={{ background: 'var(--bg)', border: '1px solid rgba(0,0,0,0.08)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                              <Car size={20} style={{ color: '#10B981' }} />
                            </div>
                            <div className="font-medium" style={{ color: 'var(--text)' }}>Create Ride</div>
                          </div>
                          <ChevronRight size={20} style={{ color: 'var(--muted)' }} />
                        </a>
                      )}
                    </>
                  ); })()}
                  <a href="/track" className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:shadow-md" style={{ background: 'var(--bg)', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                        <MapPin size={20} style={{ color: '#F59E0B' }} />
                      </div>
                      <div className="font-medium" style={{ color: 'var(--text)' }}>Live Track</div>
                    </div>
                    <ChevronRight size={20} style={{ color: 'var(--muted)' }} />
                  </a>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-2xl p-6" style={{ background: 'color-mix(in oklab, var(--surface) 96%, transparent)', border: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <Star size={20} style={{ color: '#10B981' }} />
                  </div>
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>Pro Tips</div>
                </div>
                <ul className="space-y-3 text-sm" style={{ color: 'var(--muted)' }}>
                  <li className="flex items-start gap-2">
                    <Shield size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
                    <span>Share your live location during a ride for accurate ETAs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CreditCard size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
                    <span>Use secure payments for bookings and receipts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
                    <span>Book in advance to get better rates and guaranteed seats</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="rounded-2xl p-8 max-w-md w-full" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <XCircle size={32} style={{ color: '#EF4444' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Cancel Ride Booking?</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Are you sure you want to cancel your ride from <strong>{cancelModal.ride?.source || 'Unknown'}</strong> to <strong>{cancelModal.ride?.destination || 'Unknown'}</strong>?
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                This action cannot be undone and your seat will be released.
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-sm p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                <strong>⚠️ Important:</strong> Cancellation will release your seat and this booking will be permanently deleted.
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={cancelCancelBooking}
                  className="px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200"
                  style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}
                >
                  No, Keep Booking
                </button>
                <button
                  onClick={confirmCancelBooking}
                  style={{ background: '#EF4444', color: 'white', border: '1px solid #EF4444' }}
                  className="px-4 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-all duration-200"
                >
                  Yes, Cancel Ride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
