import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ElvLead from '@/lib/models/ElvLead';

// GET /api/elv-leads/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const lead = await ElvLead.findById(id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: lead });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/elv-leads/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    if (body.vehicleRegistrationNumber) {
      body.additionalDetails = `Vehicle Number: ${body.vehicleRegistrationNumber}, Vehicle Category: ${body.vehicleCategory || 'N/A'}, Model Year: ${body.modelYear || 'N/A'}`;
    }

    if (body.mobileNumber && !body.contact) {
      body.contact = body.mobileNumber;
    }

    if (body.ownerName && !body.supplierName) {
      body.supplierName = body.ownerName;
    }

    if (body.leadValue !== undefined) {
      const leadVal = Number(body.leadValue || 0);
      const addFee = Number(body.additionalFee || 0);
      const freight = Number(body.freightCharges || 0);
      const other = Number(body.otherCharges || 0);
      body.totalPurchaseValue = leadVal + addFee + freight + other;
    }

    const updatedLead = await ElvLead.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updatedLead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updatedLead });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Update failed' }, { status: 400 });
  }
}

// DELETE /api/elv-leads/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const deletedLead = await ElvLead.findByIdAndDelete(id);
    if (!deletedLead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}
