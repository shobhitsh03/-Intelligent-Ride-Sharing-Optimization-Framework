import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Dashboard() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [driverRides, setDriverRides] = useState([]);
  const [riderBookings, setRiderBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [cancelModal, setCancelModal] = useState(null);
  const [showRiderHistory, setShowRiderHistory] = useState(true);
  const [showDriverHistory, setShowDriverHistory] = useState(true);

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
      } catch (e) {
        if (mounted) setError('Failed to load history');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    // load notifications from localStorage
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
      refreshHistory(); // Refresh the bookings list
    } catch (error) {
      const msg = error?.response?.data?.error || 'Failed to cancel booking';
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: msg } }));
      setCancelModal(null);
    }
  };

  const cancelCancelBooking = () => {
    setCancelModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Dashboard</h2>
        {token && (() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); const label = roles.includes('driver') && roles.includes('rider') ? 'Driver & Rider' : roles.includes('driver') ? 'Driver' : roles.includes('rider') ? 'Rider' : 'User'; return (
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>Logged in as {label}</span>
        ); })()}
      </div>

      {!token && (
        <div className="rounded-xl border p-4" style={{ background: 'color-mix(in oklab, var(--surface) 96%, transparent)', borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            You are not logged in. Please login to view your trips and payments.
          </div>
        </div>
      )}

      {token && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>Welcome back</div>
                  <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Your Trips</div>
                </div>
                {(() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); return roles.includes('driver') ? (
                  <a href="/create-ride" className="rounded-md px-3 py-2 text-sm font-medium shadow" style={{ background: 'var(--accent)', color: '#111' }}>Create Ride</a>
                ) : null; })()}
              </div>
              {loading && <div className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>Loading...</div>}
              {error && <div className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{error}</div>}
              {!loading && !error && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>As Rider</div>
                      <button
                        onClick={() => setShowRiderHistory(!showRiderHistory)}
                        className="text-xs px-2 py-1 rounded border"
                        style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}
                      >
                        {showRiderHistory ? '▼ Hide' : '▶ Show'} ({riderBookings.length})
                      </button>
                    </div>
                    {showRiderHistory && (
                      <>
                        {riderBookings.length === 0 ? (
                          <div className="text-sm" style={{ color: 'var(--muted)' }}>No bookings yet.</div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                            {riderBookings.map((b) => (
                              <li key={b._id} className="rounded border p-3 text-sm list-none" style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium">{b?.ride?.source} → {b?.ride?.destination}</div>
                                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                                      Seats: {b.seats} • Amount: ₹{b.amount} • Status: <span className={`px-1 py-0.5 rounded text-xs ${
                                        b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        b.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                        b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>{b.status}</span>
                                    </div>
                                  </div>
                                  {(b.status === 'confirmed' || b.status === 'pending') && (
                                    <button
                                      onClick={() => handleCancelBooking(b)}
                                      className="px-2 py-1 text-xs rounded hover:bg-red-700"
                                      style={{ background: '#dc2626', color: 'white', border: '1px solid #dc2626' }}
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                                  Booked on: {new Date(b.createdAt).toLocaleDateString()}
                                </div>
                              </li>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {!showRiderHistory && riderBookings.length > 0 && (
                      <ul className="space-y-2">
                        {riderBookings.slice(0, 2).map((b) => (
                          <li key={b._id} className="rounded border p-2 text-sm opacity-75 list-none" style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>
                            <div className="font-medium text-xs">{b?.ride?.source} → {b?.ride?.destination}</div>
                            <div className="text-xs" style={{ color: 'var(--muted)' }}>
                              ₹{b.amount} • <span className={`px-1 py-0.5 rounded text-xs ${
                                b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                b.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>{b.status}</span>
                            </div>
                          </li>
                        ))}
                        {riderBookings.length > 2 && (
                          <div className="text-xs text-center p-2" style={{ color: 'var(--muted)' }}>
                            ...and {riderBookings.length - 2} more
                          </div>
                        )}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>As Driver</div>
                      <button
                        onClick={() => setShowDriverHistory(!showDriverHistory)}
                        className="text-xs px-2 py-1 rounded border"
                        style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}
                      >
                        {showDriverHistory ? '▼ Hide' : '▶ Show'} ({driverRides.length})
                      </button>
                    </div>
                    {showDriverHistory && (
                      <>
                        {driverRides.length === 0 ? (
                          <div className="text-sm" style={{ color: 'var(--muted)' }}>No rides created yet.</div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                            {driverRides.map((r) => (
                              <li key={r._id} className="rounded border px-3 py-2 text-sm list-none" style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>
                                <div>{r.source} → {r.destination}</div>
                                <div className="text-xs" style={{ color: 'var(--muted)' }}>Seats: {r.availableSeats} • Fare: ₹{r.fare} • Status: {r.status}</div>
                              </li>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {!showDriverHistory && driverRides.length > 0 && (
                      <ul className="space-y-2">
                        {driverRides.slice(0, 2).map((r) => (
                          <li key={r._id} className="rounded border p-2 text-sm opacity-75 list-none" style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>
                            <div className="font-medium text-xs">{r.source} → {r.destination}</div>
                            <div className="text-xs" style={{ color: 'var(--muted)' }}>
                              ₹{r.fare} • {r.availableSeats} seats
                            </div>
                          </li>
                        ))}
                        {driverRides.length > 2 && (
                          <div className="text-xs text-center p-2" style={{ color: 'var(--muted)' }}>
                            ...and {driverRides.length - 2} more
                          </div>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Payments</div>
              <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                You have no recent payments. Proceed to booking to initiate a payment.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Notifications</div>
                <div className="flex items-center gap-2">
                  <button onClick={clearNotifications} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}>Clear</button>
                  <button onClick={deleteNotificationHistory} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'rgba(255,0,0,0.25)', color: 'var(--text)' }}>Delete history</button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>No notifications yet.</div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {notifications.map((n) => (
                    <li key={n.id} className="rounded border px-3 py-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                      {n.type === 'request' ? (
                        <div className="text-sm" style={{ color: 'var(--text)' }}>
                          Booking request • Seats: {n.seats} • Amount: ₹{n.amount}
                          <div className="mt-2 flex gap-2">
                            <button onClick={()=>acceptBooking(n.id)} className="px-3 py-1.5 rounded text-sm" style={{ background: 'var(--accent)', color: '#111' }}>Accept</button>
                            <button onClick={()=>declineBooking(n.id)} className="px-3 py-1.5 rounded text-sm border" style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}>Decline</button>
                            <button onClick={()=>removeNotification(n.id)} className="px-3 py-1.5 rounded text-sm border" style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}>Dismiss</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm" style={{ color: 'var(--text)' }}>Notification</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Quick Actions</div>
              <div className="mt-3 grid gap-2">
                {(() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); return (
                  <>
                    {roles.includes('rider') && (
                      <a href="/find-ride" className="rounded-md px-3 py-2 text-sm font-medium shadow" style={{ background: 'var(--accent)', color: '#111' }}>Find a Ride</a>
                    )}
                    {roles.includes('driver') && (
                      <a href="/create-ride" className="rounded-md px-3 py-2 text-sm font-medium border" style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}>Create Ride</a>
                    )}
                  </>
                ); })()}
                <a href="/track" className="rounded-md px-3 py-2 text-sm font-medium border" style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}>Live Track</a>
              </div>
            </div>

            <div className="rounded-xl border p-5" style={{ background: 'color-mix(in oklab, var(--surface) 96%, transparent)', borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Tips</div>
              <ul className="mt-2 text-sm list-disc pl-5" style={{ color: 'var(--muted)' }}>
                <li>Share your live location during a ride for accurate ETAs.</li>
                <li>Use secure payments for bookings and receipts.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
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
                <button
                  onClick={cancelCancelBooking}
                  className="px-3 py-2 rounded text-sm border"
                  style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text)' }}
                >
                  No, Keep Booking
                </button>
                <button
                  onClick={confirmCancelBooking}
                  style={{ background: '#dc2626', color: 'white', border: '1px solid #dc2626' }}
                  className="px-3 py-2 rounded text-sm hover:bg-red-700"
                >
                  Yes, Cancel Ride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
