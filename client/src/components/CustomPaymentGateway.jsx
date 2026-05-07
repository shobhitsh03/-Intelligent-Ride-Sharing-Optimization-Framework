import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Wallet, Check, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomPaymentGateway({ amount, onPaymentSuccess, onPaymentCancel, bookingId }) {
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Clear error when payment method changes
  useEffect(() => {
    setError('');
  }, [selectedMethod]);

  // Credit card form state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  // UPI form state
  const [upiDetails, setUpiDetails] = useState({
    upiId: ''
  });

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      color: 'from-green-500 to-green-700'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: Wallet,
      color: 'from-purple-500 to-purple-700'
    }
  ];

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/\D/g, '').slice(0, 16);
      const spaced = formatted.replace(/(.{4})/g, '$1 ').trim();
      setCardDetails(prev => ({ ...prev, [name]: spaced }));
    } else if (name === 'expiry') {
      // Format expiry as MM/YY
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      if (formatted.length >= 2) {
        setCardDetails(prev => ({ ...prev, [name]: formatted.slice(0, 2) + '/' + formatted.slice(2) }));
      } else {
        setCardDetails(prev => ({ ...prev, [name]: formatted }));
      }
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUPIChange = (e) => {
    setUpiDetails({ upiId: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    console.log('Starting payment processing, cleared error state');

    try {
      let paymentData = {
        method: selectedMethod,
        amount: amount,
        bookingId
      };

      if (selectedMethod === 'credit_card') {
        paymentData = {
          ...paymentData,
          cardNumber: cardDetails.cardNumber,
          expiry: cardDetails.expiry,
          cvv: cardDetails.cvv,
          name: cardDetails.name
        };
      } else if (selectedMethod === 'upi') {
        paymentData = {
          ...paymentData,
          upiId: upiDetails.upiId
        };
      } else if (selectedMethod === 'wallet') {
        // User ID will be extracted from auth token on backend
      }

      const api = (await import('../lib/api.js')).default;
      const data = await api.post('/api/payment/custom', paymentData);
      console.log('Payment response data:', data);

      if (data.success) {
        console.log('Payment successful, setting success state');
        console.log('Current success state before:', success);
        console.log('Current error state before:', error);
        
        // Force clear error immediately
        setError('');
        // Force success state
        setSuccess(true);
        
        console.log('Success state set to true, error cleared');
        
        // Call success callback after showing success modal for 2 seconds
        setTimeout(() => {
          console.log('Calling onPaymentSuccess callback with data:', data);
          try {
            onPaymentSuccess(data);
            console.log('onPaymentSuccess callback completed');
          } catch (callbackError) {
            console.error('Error in onPaymentSuccess callback:', callbackError);
          }
        }, 2000);
      } else {
        console.log('Payment failed, setting error:', data.error);
        setError(data.error || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment processing error. Please try again.');
    } finally {
      console.log('Setting processing to false');
      setProcessing(false);
    }
  };

  if (success) {
    console.log('Rendering success modal - success state is true');
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your booking has been confirmed.</p>
          <div className="text-sm text-gray-500">Redirecting...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Payment Gateway</h2>
            <button
              onClick={onPaymentCancel}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Lock size={16} />
            <span>Secure Payment</span>
          </div>
        </div>

        {/* Amount Display */}
        <div className="p-6 border-b">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Amount to Pay</div>
            <div className="text-4xl font-bold text-gray-900">₹{amount}</div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6">
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</div>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                    <method.icon size={20} className="text-white" />
                  </div>
                  <div className="text-xs font-medium text-center">{method.name}</div>
                  {selectedMethod === method.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Forms */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedMethod === 'credit_card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      name="expiry"
                      value={cardDetails.expiry}
                      onChange={handleCardChange}
                      placeholder="12/25"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleCardChange}
                      placeholder="123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    name="name"
                    value={cardDetails.name}
                    onChange={handleCardChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'upi' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <input
                  type="text"
                  value={upiDetails.upiId}
                  onChange={handleUPIChange}
                  placeholder="yourname@upi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">Format: yourname@upi</div>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet size={24} className="text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">Wallet Balance</div>
                    <div className="text-2xl font-bold text-purple-600">₹500</div>
                  </div>
                </div>
                {amount > 500 && (
                  <div className="mt-3 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Insufficient balance
                  </div>
                )}
              </div>
            )}

            {error && !success && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${amount}`
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex items-center justify-center gap-2 text-xs text-gray-500">
          <Lock size={12} />
          <span>Secured by RideFlex Payment Gateway</span>
        </div>
      </motion.div>
    </div>
  );
}
