import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './index.css';
import 'leaflet/dist/leaflet.css';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateRide from './pages/CreateRide.jsx';
import FindRide from './pages/FindRide.jsx';
import Track from './pages/Track.jsx';
import Payment from './pages/Payment.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import PaymentCancel from './pages/PaymentCancel.jsx';
import Forgot from './pages/Forgot.jsx';
import Reset from './pages/Reset.jsx';
import DriverDashboard from './pages/DriverDashboard.jsx';
import RideBookings from './pages/RideBookings.jsx';
import Debug from './pages/Debug.jsx';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Car, Search, UserPlus, LogIn, LogOut, Menu as MenuIcon, Sun, Moon, DashboardIcon } from './components/Icons.jsx';
import { LogoIcon } from './components/LogoIcon.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import { motion } from 'framer-motion';
import Footer from './components/Footer.jsx';

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

function App() {
  const [token, setToken] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false));
  const [logoutBlink, setLogoutBlink] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  function toggleDark() {
    const root = document.documentElement;
    const next = root.classList.toggle('dark');
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  // Initialize theme from storage
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'token') setToken(e.newValue);
    }
    window.addEventListener('storage', onStorage);
    function onAuthTokenChanged() {
      const t = localStorage.getItem('token');
      setToken(t);
    }
    window.addEventListener('auth-token-changed', onAuthTokenChanged);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Socket.IO: join user room and receive booking updates/requests
  useEffect(() => {
    const user = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null);
    if (!token || !user?._id) {
      if (socketRef.current) { try { socketRef.current.disconnect(); } catch {} socketRef.current = null; }
      return;
    }
    const url = import.meta.env.VITE_SERVER_URL;
    const socket = io(url, { withCredentials: true });
    socketRef.current = socket;
    socket.emit('join:user', { userId: user._id });

    const pushToast = (type, message) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5500);
    };

    socket.on('booking:update', ({ status, bookingId, rideId }) => {
      if (status === 'accepted') pushToast('success', 'Driver accepted your booking.');
      else if (status === 'declined') pushToast('error', 'Driver declined your booking.');
      else pushToast('info', 'Booking updated.');
    });

    socket.on('booking:request', ({ bookingId, rideId, seats, amount }) => {
      // For drivers logged in
      pushToast('info', `New booking request: ${seats} seat(s), ₹${amount}.`);
      try {
        const key = 'notifications';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        const item = { id: bookingId, type: 'request', rideId, seats, amount, ts: Date.now() };
        const next = [item, ...arr].slice(0, 20);
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new Event('notifications-updated'));
      } catch {}
    });

    return () => {
      try { socket.emit('leave:user', { userId: user._id }); } catch {}
      try { socket.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const onAppToast = (e) => {
      const { type = 'info', message = '' } = e.detail || {};
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
    };
    window.addEventListener('app-toast', onAppToast);
    return () => window.removeEventListener('app-toast', onAppToast);
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    navigate('/');
    setShowLogoutConfirm(false);
  }

  function handleLogoutClick() {
    setShowLogoutConfirm(true);
  }

  function cancelLogout() {
    setShowLogoutConfirm(false);
  }

  return (
    <div className="min-h-screen">
        <nav className="sticky top-0 z-50 border-b" style={{ background: 'var(--navbar-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderColor: 'var(--navbar-border)' }}>
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300" style={{ background: isDark ? 'linear-gradient(135deg, #6366F1 0%, #22D3EE 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
                  <LogoIcon size={28} className="text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <span style={{ 
                      color: 'var(--brand)',
                      fontSize: '1.75rem',
                      fontWeight: '800',
                      letterSpacing: '-0.02em'
                    }}>Ride</span>
                    <span style={{ 
                      color: 'var(--text)',
                      fontSize: '1.75rem',
                      fontWeight: '800',
                      letterSpacing: '-0.02em'
                    }}>Flex</span>
                  </div>
                  {(() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); const label = roles.includes('driver') && roles.includes('rider') ? 'Driver & Rider' : roles.includes('driver') ? 'Driver' : roles.includes('rider') ? 'Rider' : 'User'; return (
                    <span className="hidden md:inline-block px-2 py-1 text-xs font-semibold rounded-lg" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)', color: '#111' }}>
                      {label}
                    </span>
                  ); })()}
                </div>
              </Link>
              
              <div className="hidden md:flex items-center gap-1">
                {(() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); return (
                  <>
                    {roles.includes('rider') && (
                      <Link to="/find-ride" className="px-5 py-2.5 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)', color: '#111' }}>
                        <Search size={16} />
                        Find Ride
                      </Link>
                    )}
                    {roles.includes('driver') && (
                      <>
                        <Link to="/create-ride" onClick={(e) => handleCreateRideClick(e, navigate)} className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/5" style={{ color: 'var(--text)' }}>
                          Create Ride
                        </Link>
                        <Link to="/driver-dashboard" className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/5" style={{ color: 'var(--text)' }}>
                          Dashboard
                        </Link>
                      </>
                    )}
                  </>
                ); })()}
                
                {!token ? (
                  <div className="flex items-center gap-2 ml-4">
                    <Link to="/login" className="px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:bg-white/5" style={{ borderColor: 'var(--glass-border)', color: 'var(--text)' }}>
                      Login
                    </Link>
                    <Link to="/register" className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200" style={{ background: 'var(--brand)', color: 'white' }}>
                      Sign Up
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 ml-4">
                    <Link to="/dashboard" className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-xl" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)', color: 'white' }} aria-label="Dashboard">
                      <DashboardIcon size={18} />
                    </Link>
                    <button onClick={toggleDark} className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-xl" style={{ background: 'var(--surface)', color: 'var(--brand)', border: '1px solid var(--glass-border)' }} aria-label="Toggle theme">
                      {isDark ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <button
                      onClick={()=>{
                        setLogoutBlink(true);
                        setTimeout(()=>{ setLogoutBlink(false); handleLogoutClick(); }, 180);
                      }}
                      className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-xl ${logoutBlink ? 'animate-pulse' : ''}`}
                      style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}
                      aria-label="Logout"
                    >
                      <LogOut size={18}/>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="md:hidden flex items-center">
                <button aria-label="Toggle menu" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(o=>!o)} className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg" style={{ background: 'var(--brand)', color: 'white' }}>
                  <MenuIcon size={20} />
                </button>
              </div>
            </div>
            
            {/* Mobile Menu */}
            <div className={`${mobileOpen ? 'flex' : 'hidden'} md:hidden border-t`} style={{ borderColor: 'var(--glass-border)' }}>
              <div className="py-4 space-y-2">
                {(() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); return (
                  <>
                    {roles.includes('rider') && (
                      <Link to="/find-ride" className="block mx-6 px-6 py-3 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)', color: '#111' }} onClick={()=>setMobileOpen(false)}>
                        <Search size={16} />
                        Find Ride
                      </Link>
                    )}
                    {roles.includes('driver') && (
                      <>
                        <Link to="/create-ride" onClick={(e) => { handleCreateRideClick(e, navigate); setMobileOpen(false); }} className="block px-6 py-3 text-sm font-medium transition-colors hover:bg-white/5" style={{ color: 'var(--text)' }}>
                          Create Ride
                        </Link>
                        <Link to="/driver-dashboard" className="block px-6 py-3 text-sm font-medium transition-colors hover:bg-white/5" style={{ color: 'var(--text)' }} onClick={()=>setMobileOpen(false)}>
                          Dashboard
                        </Link>
                      </>
                    )}
                    
                    {!token ? (
                      <div className="pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                        <Link to="/login" className="block px-6 py-3 text-sm font-medium transition-colors hover:bg-white/5" style={{ color: 'var(--text)' }} onClick={()=>setMobileOpen(false)}>
                          Login
                        </Link>
                        <Link to="/register" className="block px-6 py-3 text-sm font-medium transition-colors" style={{ color: 'var(--brand)' }} onClick={()=>setMobileOpen(false)}>
                          Sign Up
                        </Link>
                      </div>
                    ) : (
                      <div className="pt-4 border-t flex items-center justify-between px-6" style={{ borderColor: 'var(--glass-border)' }}>
                        <div className="flex items-center gap-2">
                          <Link to="/dashboard" className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)', color: 'white' }} onClick={()=>setMobileOpen(false)}>
                            <DashboardIcon size={18} />
                          </Link>
                          <button onClick={toggleDark} className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg" style={{ background: 'var(--surface)', color: 'var(--brand)', border: '1px solid var(--glass-border)' }}>
                            {isDark ? <Moon size={18} /> : <Sun size={18} />}
                          </button>
                          <button
                            onClick={()=>{
                              setLogoutBlink(true);
                              setTimeout(()=>{ setLogoutBlink(false); handleLogoutClick(); }, 180);
                            }}
                            className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg ${logoutBlink ? 'animate-pulse' : ''}`}
                            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}
                          >
                            <LogOut size={18}/>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ); })()}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto p-3 md:p-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<Forgot />} />
            <Route path="/reset" element={<Reset />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-ride" element={<CreateRide />} />
            <Route path="/find-ride" element={<FindRide />} />
            <Route path="/track" element={<Track />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/driver-dashboard" element={<DriverDashboard />} />
            <Route path="/ride-bookings/:rideId" element={<RideBookings />} />
            <Route path="/debug" element={<Debug />} />
          </Routes>
          </motion.div>
        </main>
        <Footer />
        {/* Toasts */}
        <div className="fixed bottom-4 inset-x-0 flex justify-center pointer-events-none z-[100]">
          <div className="space-y-2 w-full max-w-md px-3">
            {toasts.map(t => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-lg px-4 py-2.5 text-sm shadow-lg ring-1 pointer-events-auto" style={{ background: t.type==='error' ? '#fee2e2' : t.type==='success' ? '#dcfce7' : '#f3f4f6', color: '#111', borderColor: 'rgba(0,0,0,0.06)' }}>
                {t.message}
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* AI Chat Widget */}
        <ChatWidget />
        
        {/* Logout Confirmation Dialog */}
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
            onClick={cancelLogout}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Confirm Logout
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                  Are you sure you want to logout? You'll need to sign in again to access your account.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelLogout}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={logout}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
  );
}

export default App;
