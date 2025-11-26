import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Card, Button, Alert } from '../components/UI.jsx';
import { motion } from 'framer-motion';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Payment was successful - webhook will update the booking
      setMessage('🎉 Payment successful! Your booking has been confirmed.');
      setType('success');
    } else {
      setMessage('Payment completed successfully.');
      setType('success');
    }
    
    setLoading(false);
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8"
      >
        <Card className="p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
            Payment Successful!
          </h2>
          
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            Your ride has been booked. You'll receive a confirmation email shortly.
          </p>
          
          {message && <Alert type={type} className="mb-4">{message}</Alert>}
          
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
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
