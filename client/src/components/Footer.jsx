import { Mail, MapPin, Phone, Facebook, Twitter, Linkedin, Instagram, Car, Shield, Zap } from 'lucide-react';

// Helper function to check if user is a rider and show alert
const handleCreateRideClick = (e) => {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  
  if (roles.includes('rider') && !roles.includes('driver')) {
    alert('You are logged in as a Rider. Only Drivers can create rides. Please register as a Driver to create rides.');
    return false;
  }
  
  window.location.href = '/create-ride';
  return true;
};

export default function Footer() {
  return (
    <footer className="mt-8" style={{ background: '#0b1020' }}>
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)' }}>
                <Car size={20} className="text-white" />
              </div>
              <div>
                <span style={{ color: 'var(--brand)', fontSize: '1.5rem', fontWeight: '800' }}>Ride</span>
                <span style={{ color: '#D97706', fontSize: '1.5rem', fontWeight: '300' }}>Flex</span>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              Smarter shared rides with live tracking and secure payments. Join the future of sustainable transportation.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', color: 'var(--brand)' }}>
                <Facebook size={16} />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', color: 'var(--brand)' }}>
                <Twitter size={16} />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', color: 'var(--brand)' }}>
                <Linkedin size={16} />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', color: 'var(--brand)' }}>
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Quick Links</div>
            <ul className="space-y-2 text-sm">
              <li><a className="hover:underline transition-all duration-200" style={{ color: 'var(--muted)' }} href="/find-ride">Find Ride</a></li>
              <li><a className="hover:underline transition-all duration-200" style={{ color: 'var(--muted)' }} href="/create-ride" onClick={handleCreateRideClick}>Create Ride</a></li>
              <li><a className="hover:underline transition-all duration-200" style={{ color: 'var(--muted)' }} href="/track">Live Track</a></li>
              <li><a className="hover:underline transition-all duration-200" style={{ color: 'var(--muted)' }} href="/payment">Payment</a></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <div className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Features</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <Shield size={14} style={{ color: 'var(--brand)' }} />
                <span>Secure Payments</span>
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <Zap size={14} style={{ color: 'var(--brand)' }} />
                <span>Live Tracking</span>
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <Car size={14} style={{ color: 'var(--brand)' }} />
                <span>Vetted Drivers</span>
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <MapPin size={14} style={{ color: 'var(--brand)' }} />
                <span>Real-time Navigation</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Contact</div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <Mail size={14} style={{ color: 'var(--brand)' }} />
                <a className="hover:underline" href="mailto:rideflex@gmail.com">rideflex@gmail.com</a>
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <Phone size={14} style={{ color: 'var(--brand)' }} />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <MapPin size={14} style={{ color: 'var(--brand)' }} />
                <span>New Delhi, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            © {new Date().getFullYear()} RideFlex. All rights reserved.
          </div>
          <div className="flex gap-6 text-xs">
            <a className="hover:underline transition-all duration-200" style={{ color: 'var(--muted)' }} href="#">Privacy Policy</a>
            <a className="hover:underline transition-all duration-200" style={{ color: 'var(--muted)' }} href="#">Terms of Service</a>
            <a className="hover:underline transition-all duration-200" style={{ color: 'var(--muted)' }} href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
