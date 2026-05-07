import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: false }, // Temporarily make optional for debugging
    currency: { type: String, default: 'INR' },
    method: { 
      type: String, 
      enum: ['credit_card', 'upi', 'wallet', 'stripe', 'razorpay', 'pending'],
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'success', 'failed', 'refunded'],
      default: 'pending' 
    },
    paymentDetails: {
      // Credit card details (masked)
      maskedCard: String,
      cardType: String,
      
      // UPI details
      upiId: String,
      
      // Wallet details
      previousBalance: Number,
      newBalance: Number,
      
      // External gateway details
      paymentId: String,
      orderId: String
    },
    error: String,
    blockchainHash: String, // Link to blockchain for verification
    refundTransactionId: String
  },
  { timestamps: true }
);

TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ booking: 1 });

export default mongoose.model('Transaction', TransactionSchema);
