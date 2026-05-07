import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seats: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true },
    paymentProvider: { type: String, enum: ['razorpay', 'stripe', 'pending'], required: true },
    paymentId: { type: String },
    status: { type: String, enum: ['pending', 'confirmed', 'paid', 'cancelled'], default: 'pending' },
    // Blockchain fields for tamper-evident ledger
    blockIndex: { type: Number, default: 0 },
    previousHash: { type: String, default: '0' },
    blockHash: { type: String, required: false }, // Made optional for backward compatibility
    blockTimestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Booking', BookingSchema);
