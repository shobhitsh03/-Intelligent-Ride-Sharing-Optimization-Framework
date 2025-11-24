// Debug script to check payment configuration
import dotenv from 'dotenv';
dotenv.config();

console.log('=== Payment Configuration Debug ===\n');

// Check environment variables
const requiredVars = {
  'RAZORPAY_KEY_ID': process.env.RAZORPAY_KEY_ID,
  'RAZORPAY_KEY_SECRET': process.env.RAZORPAY_KEY_SECRET,
  'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
  'MONGODB_URI': process.env.MONGODB_URI ? 'SET' : 'NOT SET'
};

console.log('Environment Variables:');
Object.entries(requiredVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const display = typeof value === 'string' && value.includes('test') ? 
    value.substring(0, 10) + '...' : 
    value || 'MISSING';
  console.log(`${status} ${key}: ${display}`);
});

// Test Razorpay connection if keys are available
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    import('razorpay').then(Razorpay => {
      const rzp = new Razorpay.default({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      console.log('\n✅ Razorpay instance created successfully');
    }).catch(err => {
      console.log('\n❌ Razorpay import error:', err.message);
    });
  } catch (err) {
    console.log('\n❌ Razorpay initialization error:', err.message);
  }
} else {
  console.log('\n❌ Razorpay keys not configured');
}

// Test Stripe connection if key is available
if (process.env.STRIPE_SECRET_KEY) {
  try {
    import('stripe').then(Stripe => {
      const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY);
      console.log('\n✅ Stripe instance created successfully');
    }).catch(err => {
      console.log('\n❌ Stripe import error:', err.message);
    });
  } catch (err) {
    console.log('\n❌ Stripe initialization error:', err.message);
  }
} else {
  console.log('\n❌ Stripe key not configured');
}

console.log('\n=== Common Payment Issues ===');
console.log('1. Ensure API keys are correct and active');
console.log('2. Check if amount is in smallest currency unit (paise/cents)');
console.log('3. Verify MongoDB connection for booking creation');
console.log('4. Check user authentication token');
console.log('5. Ensure ride exists and has available seats');
