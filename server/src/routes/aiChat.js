const express = require('express');
const router = express.Router();
const { AIChatService } = require('../services/aiChatService');

const aiService = new AIChatService();

// AI Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, mode, history } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await aiService.processMessage(message, mode, userId, history);
    
    res.json({
      response: result.response,
      mode: result.mode,
      priority: result.priority || 'normal',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      error: 'AI service temporarily unavailable',
      response: 'Sorry, I\'m having trouble right now. Please try again in a moment.'
    });
  }
});

// Get chat modes info
router.get('/modes', (req, res) => {
  const modes = {
    support: {
      name: '24/7 Support',
      description: 'Get help with bookings, payments, cancellations, and general questions',
      examples: ['How do I book a ride?', 'Cancel my booking', 'Payment not working']
    },
    booking: {
      name: 'Booking Assistant',
      description: 'Natural language booking - just tell me where and when',
      examples: ['Find me a ride to airport at 5 PM', 'Book 2 seats for tomorrow', 'Cheapest ride to city center']
    },
    planning: {
      name: 'Trip Planner',
      description: 'Get suggestions for best routes, timing, and cost savings',
      examples: ['Best time to travel to avoid traffic', 'How to save money on rides', 'Compare ride options']
    },
    live: {
      name: 'Live Help',
      description: 'Real-time assistance during your ride',
      examples: ['Where is my driver?', 'I need to change destination', 'Emergency help']
    }
  };
  
  res.json({ modes });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'AI Chat Service' });
});

module.exports = router;
