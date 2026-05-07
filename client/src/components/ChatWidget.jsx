import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUPPORT_COLOR = '#10B981';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! Welcome to RideFlex Support. How can I help you today? I can assist with bookings, payments, account issues, and safety concerns.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, {
        type: 'bot',
        text: data.response || 'Sorry, I did not understand that.'
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Connection error: ${error.message}. Please try again or contact support at support@rideflex.com.`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickReplies = [
    'How to book a ride?',
    'Payment issues',
    'Cancel booking',
    'Safety concerns',
    'Contact support'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <HelpCircle size={24} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">RideFlex Support</div>
                  <div className="text-xs text-white/80">24/7 Support</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'var(--bg)' }}>
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: msg.type === 'user' ? 'var(--brand)' : SUPPORT_COLOR
                    }}
                  >
                    {msg.type === 'user' ? <User size={16} className="text-white" /> : <HelpCircle size={16} className="text-white" />}
                  </div>
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.type === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                    style={{
                      background: msg.type === 'user' ? 'var(--brand)' : 'var(--surface)',
                      color: msg.type === 'user' ? 'white' : 'var(--text)',
                      border: msg.type === 'bot' ? '1px solid var(--glass-border)' : 'none'
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: SUPPORT_COLOR }}>
                    <HelpCircle size={16} className="text-white" />
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-sm" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: SUPPORT_COLOR }}></span>
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: SUPPORT_COLOR, animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: SUPPORT_COLOR, animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="p-3 border-t flex gap-2 overflow-x-auto" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface)' }}>
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(reply);
                    setTimeout(handleSend, 100);
                  }}
                  className="px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all hover:scale-105"
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t flex gap-3" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface)' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask support..."
                className="flex-1 px-4 py-2 rounded-full text-sm outline-none"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--glass-border)'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-2 rounded-full transition-all hover:scale-110 disabled:opacity-50"
                style={{ background: SUPPORT_COLOR }}
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all"
        style={{
          background: isOpen ? '#EF4444' : SUPPORT_COLOR
        }}
      >
        {isOpen ? <X size={24} className="text-white" /> : <HelpCircle size={24} className="text-white" />}
      </motion.button>
    </div>
  );
}
