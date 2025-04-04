import mongoose from 'mongoose';

const MaintenanceSchema = new mongoose.Schema({
  apartmentNo: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
  },
  category: {
    type: String,
    enum: ['PLUMBING', 'ELECTRICAL', 'HVAC', 'STRUCTURAL', 'ELEVATOR', 'OTHER'],
    required: true,
  },
  assignedTo: {
    type: String,
  },
  estimatedCost: {
    type: Number,
  },
  actualCost: {
    type: Number,
  },
  startDate: {
    type: Date,
  },
  completionDate: {
    type: Date,
  },
  images: [{
    type: String, // URL'ler için
  }],
  notes: [{
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
      required: true,
    },
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Maintenance || mongoose.model('Maintenance', MaintenanceSchema);
