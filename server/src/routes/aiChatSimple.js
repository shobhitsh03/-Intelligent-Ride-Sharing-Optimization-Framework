import express from 'express';
import axios from 'axios';
const router = express.Router();

// Simple AI Chat endpoint (Support Only)
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const msg = message.toLowerCase();
    let response = '';

    // Support responses
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      response = 'Hello! Welcome to RideFlex Support. How can I help you today? I can assist with bookings, payments, account issues, and safety concerns.';
    } else if (msg.includes('book') || msg.includes('ride')) {
      response = 'To book a ride: 1) Go to "Find Ride" page 2) Enter pickup and destination 3) Click Search 4) Select a ride 5) Click "Book Now" 6) Complete payment. Need help with a specific step?';
    } else if (msg.includes('payment') || msg.includes('pay') || msg.includes('money')) {
      response = 'Payment options: We accept credit/debit cards, UPI, and wallet balance. For payment issues, check your payment method or contact support. You can also use "Book Now, Pay Later" option.';
    } else if (msg.includes('cancel') || msg.includes('refund')) {
      response = 'To cancel a booking: Go to "My Bookings" page, select the booking, and click "Cancel". Refunds are processed within 5-7 business days to your original payment method.';
    } else if (msg.includes('safety') || msg.includes('emergency')) {
      response = 'Your safety is our priority! All drivers are verified. During your ride, you can share live location with contacts. For emergencies, call our 24/7 helpline or use the SOS button in the app.';
    } else if (msg.includes('driver') || msg.includes('rating')) {
      response = 'Driver ratings help maintain quality. After each ride, rate your driver (1-5 stars). Drivers with low ratings are removed from the platform.';
    } else if (msg.includes('account') || msg.includes('login') || msg.includes('signup')) {
      response = 'Account issues: For login problems, use "Forgot Password" link. For account updates, go to Profile settings. For account deletion, contact support.';
    } else if (msg.includes('contact') || msg.includes('help') || msg.includes('phone')) {
      response = 'Contact Support: Email: support@rideflex.com | Phone: +91 1800-123-4567 (24/7) | Live Chat: Available in the app';
    } else if (msg.includes('what') || msg.includes('who') || msg.includes('why') || msg.includes('how')) {
      response = 'I\'m here to help with RideFlex-related questions. I can assist with bookings, payments, cancellations, safety, driver ratings, and account issues. What would you like to know?';
    } else if (msg.includes('thank') || msg.includes('thanks')) {
      response = 'You\'re welcome! Is there anything else I can help you with?';
    } else if (msg.includes('bye') || msg.includes('goodbye')) {
      response = 'Goodbye! Have a great day. Feel free to reach out anytime you need help with RideFlex.';
    } else if (msg.includes('time') || msg.includes('date')) {
      const now = new Date();
      response = `Current time: ${now.toLocaleTimeString()} | Date: ${now.toLocaleDateString()}. How else can I help with your ride?`;
    } else if (msg.includes('weather')) {
      try {
        // Use OpenMeteo (free, no API key required)
        const weatherResponse = await axios.get(
          'https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current_weather=true'
        );
        const weather = weatherResponse.data.current_weather;
        response = `Current weather in Delhi: ${weather.temperature}°C, wind speed ${weather.windspeed} km/h. Perfect for a ride!`;
      } catch (error) {
        response = 'Unable to fetch weather data at the moment. Please check a weather app for current conditions.';
      }
    } else if (msg.includes('price') || msg.includes('cost') || msg.includes('fare') || msg.includes('cheap')) {
      response = 'Ride fares are calculated based on distance, time, and demand. You can see the fare before booking. We offer competitive rates and sometimes have promotional discounts. Want to check a specific route?';
    } else if (msg.includes('location') || msg.includes('where') || msg.includes('address')) {
      response = 'For location-related help: Use the map in the app to set pickup and destination. You can also share your live location with contacts during rides. Need help with a specific location?';
    } else if (msg.includes('website') || msg.includes('app') || msg.includes('navigate') || msg.includes('page')) {
      response = 'RideFlex website navigation: Dashboard (home), Find Ride (search rides), Create Ride (driver), My Bookings (history), Driver Dashboard (manage rides), Profile (settings). Use the menu or sidebar to navigate. Need help with a specific page?';
    } else if (msg.includes('register') || msg.includes('signup') || msg.includes('create account')) {
      response = 'To create an account: Click "Register" on the login page. Fill in your name, email, password, and role (rider or driver). Verify your email to complete registration.';
    } else if (msg.includes('dashboard') || msg.includes('home')) {
      response = 'The Dashboard is your home page showing quick stats, recent rides, and quick actions. Riders see booking stats, drivers see ride stats. Use it to navigate to other pages quickly.';
    } else if (msg.includes('profile') || msg.includes('settings') || msg.includes('edit')) {
      response = 'Profile page: Go to your profile icon in the top right. You can update name, email, phone, password, and vehicle details (for drivers). All changes are saved automatically.';
    } else if (msg.includes('menu') || msg.includes('sidebar') || msg.includes('navigation bar')) {
      response = 'Navigation: Top menu has Dashboard, Find Ride, Create Ride, My Bookings, and Profile. Sidebar on mobile shows the same options. Click any item to navigate to that page.';
    } else if (msg.includes('feature') || msg.includes('functionality') || msg.includes('what can i do')) {
      response = 'RideFlex features: Book rides, Create rides as driver, Live tracking, AI-powered ride matching, Multiple payment options, Real-time notifications, Driver ratings, Safety features, and 24/7 support. What would you like to explore?';
    } else {
      response = `I understand you're asking about "${message}". I specialize in helping with RideFlex services like bookings, payments, safety, and account issues. Could you rephrase your question related to RideFlex, or would you like me to help with something specific?`;
    }

    res.json({
      response: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      error: 'Support service temporarily unavailable',
      response: 'Sorry, I\'m having trouble right now. Please contact support at support@rideflex.com or call +91 1800-123-4567.'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'AI Chat Service' });
});

export default router;
