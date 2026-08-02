import mongoose, { Schema, Document } from 'mongoose';

export interface IElvLead extends Document {
  leadId: number;
  leadType: string; // 'Individual', 'Dealer', 'Corporate', etc.
  supplierName: string;
  facilitatorName?: string;
  contact: string;
  additionalDetails: string;
  elvLocation: string;
  registeredBy: string;
  registrationDate: Date;
  estimatedSaleValue: number;
  totalPurchaseValue: number;
  status: 'Ongoing' | 'Under Approval' | 'Approved' | 'Rejected';

  // Individual specific fields
  ownerName?: string;
  mobileNumber?: string;
  emailId?: string;
  vehicleCurrentLocation?: string;
  vehicleRegistrationNumber?: string;
  vehicleType?: string;
  vehicleName?: string;
  modelYear?: string;
  vehicleClass?: string;
  vehicleCategory?: string;
  fuelType?: string;
  vehicleUsageType?: string;
  mobilityCondition?: string;
  engineWorkingCondition?: string;
  battery?: string;
  stepney?: string;
  tyres?: string;
  alloys?: string;
  steelRims?: string;

  // Purchase details fields
  leadValue?: number;
  additionalFee?: number;
  freightCharges?: number;
  otherCharges?: number;

  createdAt: Date;
  updatedAt: Date;
}

const elvLeadSchema = new Schema<IElvLead>(
  {
    leadId: { type: Number, required: true, unique: true },
    leadType: { type: String, required: true, default: 'Individual' },
    supplierName: { type: String, required: true },
    facilitatorName: { type: String, default: '' },
    contact: { type: String, default: '' },
    additionalDetails: { type: String, default: '' },
    elvLocation: { type: String, default: 'KANPUR NAGAR' },
    registeredBy: { type: String, default: 'Workshop Admin' },
    registrationDate: { type: Date, default: Date.now },
    estimatedSaleValue: { type: Number, default: 0 },
    totalPurchaseValue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Ongoing', 'Under Approval', 'Approved', 'Rejected'],
      default: 'Ongoing',
    },

    // Individual ELV Owner
    ownerName: { type: String, default: '' },
    mobileNumber: { type: String, default: '' },
    emailId: { type: String, default: '' },
    vehicleCurrentLocation: { type: String, default: '' },

    // ELV Details
    vehicleRegistrationNumber: { type: String, default: '' },
    vehicleType: { type: String, default: '' },
    vehicleName: { type: String, default: '' },
    modelYear: { type: String, default: '' },
    vehicleClass: { type: String, default: '' },
    vehicleCategory: { type: String, default: '' },
    fuelType: { type: String, default: '' },
    vehicleUsageType: { type: String, default: '' },

    // ELV Inspection
    mobilityCondition: { type: String, default: '' },
    engineWorkingCondition: { type: String, default: '' },
    battery: { type: String, default: '' },
    stepney: { type: String, default: '' },
    tyres: { type: String, default: '' },
    alloys: { type: String, default: '' },
    steelRims: { type: String, default: '' },

    // Financial breakdown
    leadValue: { type: Number, default: 0 },
    additionalFee: { type: Number, default: 0 },
    freightCharges: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ElvLead || mongoose.model<IElvLead>('ElvLead', elvLeadSchema);
