import mongoose from 'mongoose';

const RideSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    sourceLoc: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
    destLoc: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }
    },
    availableSeats: { type: Number, required: true, min: 1 },
    fare: { type: Number, required: true, min: 0 },
    time: { type: Date, required: true },
    status: { type: String, enum: ['open', 'booked', 'completed', 'cancelled'], default: 'open' }
  },
  { timestamps: true }
);

RideSchema.index({ sourceLoc: '2dsphere' });
RideSchema.index({ destLoc: '2dsphere' });

export default mongoose.model('Ride', RideSchema);
