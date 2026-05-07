import { Router } from 'express';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { processPayment, refundPayment } from '../services/paymentGateway.js';
import auth from '../middleware/auth.js';

const router = Router();

router.post('/order', async (req, res) => {
  const { provider, amount, currency = 'INR', receipt, bookingId } = req.body;
  try {
    if (provider === 'razorpay') {
      const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const order = await rzp.orders.create({ amount, currency, receipt: receipt || `rcpt_${Date.now()}` });
      if (bookingId && bookingId.match(/^[0-9a-fA-F]{24}$/)) {
        await Booking.findByIdAndUpdate(bookingId, { amount, paymentProvider: 'razorpay' });
      }
      return res.json({ provider, order });
    }
    if (provider === 'stripe') {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Carpool Ride Booking',
              description: 'Payment for ride booking',
            },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
        metadata: {
          bookingId: bookingId || ''
        }
      });
      if (bookingId && bookingId.match(/^[0-9a-fA-F]{24}$/)) {
        await Booking.findByIdAndUpdate(bookingId, { amount, paymentProvider: 'stripe' });
      }
      return res.json({ provider, sessionId: session.id, url: session.url });
    }
    return res.status(400).json({ error: 'Unsupported provider' });
  } catch (e) {
    console.error('Payment order failed:', e.message);
    console.error('Stack trace:', e.stack);
    res.status(500).json({ error: 'Payment order failed: ' + e.message });
  }
});

router.post('/verify', async (req, res) => {
  const { provider, bookingId, paymentId, status } = req.body;
  try {
    if (!bookingId) return res.status(400).json({ error: 'bookingId required' });
    // In real app, verify signature/webhook. For test, accept payload.
    await Booking.findByIdAndUpdate(bookingId, { paymentId, status: status || 'paid' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Payment verify failed' });
  }
});

// Stripe webhook handler
router.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;

  try {
    if (endpointSecret) {
      event = Stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      
      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, {
          paymentId: session.payment_intent,
          status: 'paid'
        });
        console.log(`Payment successful for booking: ${bookingId}`);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

// Custom payment gateway endpoint
router.post('/custom', auth('rider'), async (req, res) => {
  const { method, amount, bookingId, ...paymentDetails } = req.body;
  console.log('Payment endpoint - User from auth:', req.user);
  const userId = req.user.id;
  console.log('Payment endpoint - User ID:', userId);

  try {
    // Get user for wallet balance check
    let user = null;
    if (method === 'wallet' && userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      paymentDetails.currentBalance = user.walletBalance;
    }

    // Process payment
    const result = await processPayment({ method, amount, ...paymentDetails });

    console.log('Payment result:', result);
    console.log('Creating transaction with:', {
      user: userId,
      booking: bookingId,
      transactionId: result.transactionId,
      amount,
      method,
      status: result.status
    });

    // Create transaction record
    try {
      const transactionData = {
        user: userId,
        transactionId: result.transactionId,
        amount,
        method,
        status: result.status,
        paymentDetails: {},
        error: result.error
      };

      // Only add booking if it's a valid ObjectId
      if (bookingId && bookingId.match(/^[0-9a-fA-F]{24}$/)) {
        transactionData.booking = bookingId;
      }

      // Add payment details safely
      if (result.maskedCard) transactionData.paymentDetails.maskedCard = result.maskedCard;
      if (result.upiId) transactionData.paymentDetails.upiId = result.upiId;
      if (typeof result.previousBalance === 'number' && !isNaN(result.previousBalance)) {
        transactionData.paymentDetails.previousBalance = result.previousBalance;
      }
      if (typeof result.newBalance === 'number' && !isNaN(result.newBalance)) {
        transactionData.paymentDetails.newBalance = result.newBalance;
      }

      console.log('Creating transaction with cleaned data:', transactionData);
      const transaction = await Transaction.create(transactionData);
      console.log('Transaction created successfully:', transaction._id);
    } catch (validationError) {
      console.error('Transaction validation error:', validationError.message);
      console.error('Validation error details:', validationError.errors);
      throw new Error('Transaction creation failed: ' + validationError.message);
    }

    // Update booking status if payment successful
    if (result.status === 'success' && bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'paid',
        paymentId: result.transactionId,
        paymentProvider: method
      });

      // Update wallet balance if wallet payment
      if (method === 'wallet' && user) {
        user.walletBalance = result.newBalance;
        await user.save();
      }
    }

    res.json({
      success: result.status === 'success',
      transaction: result,
      transactionId: result.transactionId
    });
  } catch (e) {
    console.error('Custom payment error:', e);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const transactions = await Transaction.find({ user })
      .populate('booking')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ transactions });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Add funds to wallet
router.post('/wallet/add', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.walletBalance += amount;
    await user.save();

    // Create transaction record
    await Transaction.create({
      user: userId,
      transactionId: 'WALLET' + Date.now(),
      amount,
      method: 'wallet',
      status: 'success',
      paymentDetails: {
        previousBalance: user.walletBalance - amount,
        newBalance: user.walletBalance
      }
    });

    res.json({ success: true, newBalance: user.walletBalance });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add funds' });
  }
});

export default router;
