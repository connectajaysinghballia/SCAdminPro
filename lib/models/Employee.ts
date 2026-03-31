import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmployee extends Document {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  contact: string;
  organization: string;
  rvsf: string;
  designation: string;
  password?: string;
  passwordExpiry: Date;
  dob?: Date;
  anniversary?: Date;
  status: 'Active' | 'Inactive';
  inactiveDate: Date;
  activeDate: Date;
  supervisorId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, lowercase: true, unique: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  organization: { type: String, required: true },
  rvsf: { type: String, required: true },
  designation: { type: String, required: true },
  password: { type: String, required: true },
  passwordExpiry: { type: Date, required: true, default: () => new Date('9999-12-31') },
  dob: { type: Date },
  anniversary: { type: Date },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  inactiveDate: { type: Date, default: () => new Date('9999-12-31') },
  activeDate: { type: Date, default: Date.now },
  supervisorId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null }
}, {
  timestamps: true,
  strict: true,
  optimisticConcurrency: true,
  autoIndex: process.env.NODE_ENV !== 'production'
});

// Compound indexes for common query combinations
employeeSchema.index({ organization: 1, rvsf: 1, status: 1 });
employeeSchema.index({ supervisorId: 1 });
employeeSchema.index({ lastName: 1, firstName: 1 });

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', employeeSchema);
