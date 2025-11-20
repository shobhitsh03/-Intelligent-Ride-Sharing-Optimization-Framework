import { Router } from 'express';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import Booking from '../models/Booking.js';

const router = Router();

router.post('/order', async (req, res) => {
  const { provider, amount, currency = 'INR', receipt, bookingId } = req.body;
  try {
    if (provider === 'razorpay') {
      const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const order = await rzp.orders.create({ amount, currency, receipt: receipt || `rcpt_${Date.now()}` });
      if (bookingId) await Booking.findByIdAndUpdate(bookingId, { amount, paymentProvider: 'razorpay' });
      return res.json({ provider, order });
    }
    if (provider === 'stripe') {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.create({ amount, currency: currency.toLowerCase() });
      if (bookingId) await Booking.findByIdAndUpdate(bookingId, { amount, paymentProvider: 'stripe' });
      return res.json({ provider, paymentIntent });
    }
    return res.status(400).json({ error: 'Unsupported provider' });
  } catch (e) {
    res.status(500).json({ error: 'Payment order failed' });
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

export default router;
