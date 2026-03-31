import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  gst?: string;
  contactNumber?: string;
  contactPerson?: string;
  email?: string;
  location?: string;
  state?: string;
  city?: string;
  pincode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  gst: { type: String },
  contactNumber: { type: String },
  contactPerson: { type: String },
  email: { type: String },
  location: { type: String },
  state: { type: String },
  city: { type: String },
  pincode: { type: String },
}, {
  timestamps: true,
  strict: true,
});

export default mongoose.models.Organization || mongoose.model<IOrganization>('Organization', organizationSchema, 'organizations');
