import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDesignation extends Document {
  designationCd: string;
  designationName: string;
  createdBy?: string;
  createdOn?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userDesignationSchema = new Schema<IUserDesignation>({
  designationCd: { type: String, required: true, unique: true, trim: true },
  designationName: { type: String, required: true, trim: true },
  createdBy: { type: String, default: '' },
  createdOn: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'user_designations'
});

export default mongoose.models.UserDesignation || mongoose.model<IUserDesignation>('UserDesignation', userDesignationSchema, 'user_designations');
