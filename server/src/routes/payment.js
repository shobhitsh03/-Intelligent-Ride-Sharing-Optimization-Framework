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

export default router;
