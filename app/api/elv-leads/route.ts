import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ElvLead from '@/lib/models/ElvLead';

// GET /api/elv-leads
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const clearSample = searchParams.get('clear');

    if (clearSample === 'true') {
      await ElvLead.deleteMany({});
      return NextResponse.json({ success: true, message: 'All sample data cleared' });
    }

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { supplierName: regex },
        { contact: regex },
        { elvLocation: regex },
        { additionalDetails: regex },
        { vehicleRegistrationNumber: regex },
        { ownerName: regex }
      ];
    }

    const leads = await ElvLead.find(query).sort({ leadId: -1 });
    return NextResponse.json({ success: true, data: leads });
  } catch (err: any) {
    console.error('ELV Leads GET error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/elv-leads
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Auto generate next lead ID if not provided
    if (!body.leadId) {
      const maxLead = await ElvLead.findOne().sort({ leadId: -1 });
      body.leadId = maxLead ? maxLead.leadId + 1 : 1;
    }

    // Format additionalDetails if missing
    if (!body.additionalDetails && body.vehicleRegistrationNumber) {
      body.additionalDetails = `Vehicle Number: ${body.vehicleRegistrationNumber || 'N/A'}, Vehicle Category: ${body.vehicleCategory || 'N/A'}, Model Year: ${body.modelYear || 'N/A'}`;
    }

    if (!body.contact && body.mobileNumber) {
      body.contact = body.mobileNumber;
    }

    if (!body.supplierName && body.ownerName) {
      body.supplierName = body.ownerName;
    }

    // Calculate total purchase value
    const leadVal = Number(body.leadValue || 0);
    const addFee = Number(body.additionalFee || 0);
    const freight = Number(body.freightCharges || 0);
    const other = Number(body.otherCharges || 0);
    body.totalPurchaseValue = leadVal + addFee + freight + other;

    const newLead = await ElvLead.create(body);
    return NextResponse.json({ success: true, data: newLead }, { status: 201 });
  } catch (err: any) {
    console.error('ELV Leads POST error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to create lead' }, { status: 400 });
  }
}

// DELETE /api/elv-leads (Clear all leads)
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    await ElvLead.deleteMany({});
    return NextResponse.json({ success: true, message: 'All leads cleared successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to clear leads' }, { status: 500 });
  }
}
