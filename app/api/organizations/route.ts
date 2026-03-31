import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Organization from '@/lib/models/Organization';

// GET /api/organizations - List all with optional search
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const query: any = {};
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { contactPerson: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') }
      ];
    }
    const organizations = await Organization.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: organizations.length, data: organizations });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server Error' }, { status: 500 });
  }
}

// POST /api/organizations - Create
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const org = await Organization.create(body);
    return NextResponse.json({ success: true, data: org }, { status: 201 });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server Error' }, { status: 500 });
  }
}
