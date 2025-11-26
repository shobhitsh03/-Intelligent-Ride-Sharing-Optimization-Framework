import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert } from '../components/UI.jsx';
import { motion } from 'framer-motion';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  useEffect(() => {
    setMessage('Payment was cancelled. You can try again or choose a different payment method.');
    setType('warning');
  }, []);

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8"
      >
        <Card className="p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
            Payment Cancelled
          </h2>
          
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            Your payment was cancelled. No charges were made to your account.
          </p>
          
          {message && <Alert type={type} className="mb-4">{message}</Alert>}
          
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate('/payment')}
            >
              Try Again
            </Button>
            <Button 
              className="w-full" 
              variant="secondary"
              onClick={() => navigate('/find-ride')}
            >
              Find Another Ride
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
