import mongoose, { Schema, Document } from 'mongoose';

export interface IRvsf extends Document {
  organizationName: string;
  name: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  address: string;
  locationName: string;
  pincode: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const rvsfSchema = new Schema<IRvsf>({
  organizationName: { type: String, required: true },
  name: { type: String, required: true },
  contactPerson: { type: String },
  contactNumber: { type: String },
  email: { type: String },
  address: { type: String },
  locationName: { type: String },
  pincode: { type: String },
  createdBy: { type: String, default: 'Admin' }
}, {
  timestamps: true,
  strict: true
});

// Index for common search queries
rvsfSchema.index({ organizationName: 1, name: 1 });

export default mongoose.models.Rvsf || mongoose.model<IRvsf>('Rvsf', rvsfSchema);
