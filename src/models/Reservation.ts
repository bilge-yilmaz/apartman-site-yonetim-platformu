import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
  apartmentNo: {
    type: String,
    required: true,
  },
  facility: {
    type: String,
    enum: ['POOL', 'GYM', 'MEETING_ROOM', 'PARTY_ROOM', 'PARKING'],
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING',
  },
  description: {
    type: String,
  },
  numberOfPeople: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Reservation || mongoose.model('Reservation', ReservationSchema);
