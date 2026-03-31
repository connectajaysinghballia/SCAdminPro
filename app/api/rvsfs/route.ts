import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Rvsf from '@/lib/models/Rvsf';

// GET /api/rvsfs - List all RVSFs with optional search
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const query: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { organizationName: regex },
        { name: regex },
        { contactPerson: regex },
        { locationName: regex }
      ];
    }

    const rvsfs = await Rvsf.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: rvsfs });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

// POST /api/rvsfs - Create new RVSF
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const rvsf = await Rvsf.create(body);
    return NextResponse.json({ success: true, data: rvsf }, { status: 201 });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to create RVSF' }, { status: 400 });
  }
}
