import { NextResponse, NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import UserDesignation from '@/lib/models/UserDesignation';

const SEED_DESIGNATIONS = [
  { designationCd: 'LM', designationName: 'Logistics Manager', createdBy: '', createdOn: '08-01-2025 12:40:41' },
  { designationCd: 'HR', designationName: 'Human Resource', createdBy: '', createdOn: '12-12-2024 15:11:29' },
  { designationCd: 'FSM', designationName: 'Finance Senior Assistant Manager', createdBy: '', createdOn: '12-12-2024 14:59:44' },
  { designationCd: 'SAP', designationName: 'System Admin Procurement', createdBy: '', createdOn: '11-12-2024 16:22:29' },
  { designationCd: 'BA', designationName: 'Business Admin', createdBy: '', createdOn: '00-00-0000 00:00:00' },
  { designationCd: 'SA', designationName: 'System Admin', createdBy: '', createdOn: '00-00-0000 00:00:00' },
  { designationCd: 'RM', designationName: 'Refurbishment Manager', createdBy: '', createdOn: '00-00-0000 00:00:00' },
  { designationCd: 'RE', designationName: 'Refurbishment Executive', createdBy: '', createdOn: '00-00-0000 00:00:00' },
  { designationCd: 'SE', designationName: 'Sales Executive', createdBy: '', createdOn: '00-00-0000 00:00:00' },
  { designationCd: 'SAM', designationName: 'Sales Manager', createdBy: '', createdOn: '00-00-0000 00:00:00' },
  { designationCd: 'BM', designationName: 'Branch Manager', createdBy: '', createdOn: '10-12-2024 11:20:00' },
  { designationCd: 'OM', designationName: 'Operations Manager', createdBy: '', createdOn: '09-12-2024 10:15:00' },
  { designationCd: 'FM', designationName: 'Facility Manager', createdBy: '', createdOn: '05-12-2024 09:30:00' },
  { designationCd: 'QC', designationName: 'Quality Checker', createdBy: '', createdOn: '01-12-2024 14:00:00' },
  { designationCd: 'INV', designationName: 'Inventory Supervisor', createdBy: '', createdOn: '28-11-2024 16:45:00' },
  { designationCd: 'DM', designationName: 'Dismantling Engineer', createdBy: '', createdOn: '25-11-2024 12:00:00' },
  { designationCd: 'ACC', designationName: 'Senior Accountant', createdBy: '', createdOn: '20-11-2024 11:10:00' },
  { designationCd: 'SEC', designationName: 'Security Officer', createdBy: '', createdOn: '15-11-2024 08:30:00' },
  { designationCd: 'TECH', designationName: 'IT Support Specialist', createdBy: '', createdOn: '10-11-2024 17:20:00' },
  { designationCd: 'SUP', designationName: 'Site Supervisor', createdBy: '', createdOn: '05-11-2024 13:15:00' }
];

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    // Clean up any old createdBy values like 'Shubham Shukla' if present in existing DB documents
    await UserDesignation.updateMany({ createdBy: 'Shubham Shukla' }, { createdBy: '' });

    let count = await UserDesignation.countDocuments();
    if (count === 0) {
      await UserDesignation.insertMany(SEED_DESIGNATIONS);
    }

    const query: any = {};
    if (search) {
      query.$or = [
        { designationCd: { $regex: search, $options: 'i' } },
        { designationName: { $regex: search, $options: 'i' } },
        { createdBy: { $regex: search, $options: 'i' } }
      ];
    }

    const designations = await UserDesignation.find(query).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, data: designations });
  } catch (error: any) {
    console.error('GET /api/designations error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { designationCd, designationName, createdBy } = body;

    if (!designationCd || !designationName) {
      return NextResponse.json(
        { success: false, error: 'Designation Code and Title are required.' },
        { status: 400 }
      );
    }

    const existing = await UserDesignation.findOne({
      designationCd: { $regex: new RegExp(`^${designationCd.trim()}$`, 'i') }
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Designation code '${designationCd}' already exists.` },
        { status: 400 }
      );
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newDesignation = await UserDesignation.create({
      designationCd: designationCd.trim(),
      designationName: designationName.trim(),
      createdBy: createdBy || '',
      createdOn: formattedDate
    });

    return NextResponse.json({ success: true, data: newDesignation }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/designations error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
