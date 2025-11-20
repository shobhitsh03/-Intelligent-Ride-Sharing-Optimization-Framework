import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seats: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true },
    paymentProvider: { type: String, enum: ['razorpay', 'stripe'], required: true },
    paymentId: { type: String },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' }
  },
  { timestamps: true }
);

export default mongoose.model('Booking', BookingSchema);
