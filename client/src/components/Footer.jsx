export default function Footer() {
  return (
    <footer className="mt-8" style={{ background: '#0b1020' }}>
      <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div>
          <div className="font-semibold" style={{ color: '#e5e7eb' }}>Carpool</div>
          <p className="mt-2" style={{ color: '#94a3b8' }}>
            Smarter shared rides with live tracking and secure payments.
          </p>
        </div>
        <div>
          <div className="font-medium mb-2" style={{ color: '#e5e7eb' }}>Quick Links</div>
          <ul className="space-y-1" style={{ color: '#94a3b8' }}>
            <li><a className="hover:underline" style={{ color: '#94a3b8' }} href="/find-ride">Find Ride</a></li>
            <li><a className="hover:underline" style={{ color: '#94a3b8' }} href="/create-ride">Create Ride</a></li>
            <li><a className="hover:underline" style={{ color: '#94a3b8' }} href="/track">Live Track</a></li>
            <li><a className="hover:underline" style={{ color: '#94a3b8' }} href="/payment">Payment</a></li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-2" style={{ color: '#e5e7eb' }}>Contact</div>
          <ul className="space-y-1" style={{ color: '#94a3b8' }}>
            <li>Email: <a className="hover:underline" style={{ color: '#94a3b8' }} href="https://mail.google.com/mail/?view=cm&to=routeshare@gmail.com" target="_blank" rel="noopener noreferrer">routeshare@gmail.com</a></li>
            <li>
              <a className="hover:underline" style={{ color: '#94a3b8' }} href="#">Privacy</a> •{' '}
              <a className="hover:underline" style={{ color: '#94a3b8' }} href="#">Terms</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-xs text-center pb-8" style={{ color: '#94a3b8' }}>
        © {new Date().getFullYear()} Made by Shobhit Shukla & Kumar Tejaswa. All rights Reserved.
      </div>
    </footer>
  );
}
