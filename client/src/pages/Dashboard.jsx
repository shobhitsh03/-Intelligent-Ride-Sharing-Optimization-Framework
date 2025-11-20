import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Dashboard() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [driverRides, setDriverRides] = useState([]);
  const [riderBookings, setRiderBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const [ridesRes, booksRes] = await Promise.allSettled([
          api.get('/api/rides/mine'),
          api.get('/api/booking/mine')
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
        api.get('/api/booking/mine')
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
      window.dispatchEvent(new Event('notifications-updated'));
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
                    <div className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>As Rider</div>
                    {riderBookings.length === 0 ? (
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>No bookings yet.</div>
                    ) : (
                      <ul className="space-y-2">
                        {riderBookings.map((b) => (
                          <li key={b._id} className="rounded border px-3 py-2 text-sm" style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>
                            <div>{b?.ride?.source} → {b?.ride?.destination}</div>
                            <div className="text-xs" style={{ color: 'var(--muted)' }}>Seats: {b.seats} • Amount: ₹{b.amount} • Status: {b.status}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>As Driver</div>
                    {driverRides.length === 0 ? (
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>No rides created yet.</div>
                    ) : (
                      <ul className="space-y-2">
                        {driverRides.map((r) => (
                          <li key={r._id} className="rounded border px-3 py-2 text-sm" style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text)' }}>
                            <div>{r.source} → {r.destination}</div>
                            <div className="text-xs" style={{ color: 'var(--muted)' }}>Seats: {r.availableSeats} • Fare: ₹{r.fare} • Status: {r.status}</div>
                          </li>
                        ))}
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
    </div>
  );
}
