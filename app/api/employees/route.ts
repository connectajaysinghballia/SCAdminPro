import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';

// GET /api/employees - Paginated and filtered lists
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const orgFilter = searchParams.get('orgFilter');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';

    const query: any = {};

    if (orgFilter && orgFilter !== 'all') {
      query.organization = orgFilter;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
        { designation: searchRegex }
      ];
    }

    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);

    const employees = await Employee.find(query)
      .lean()
      .skip((p - 1) * l)
      .limit(l)
      .sort({ createdAt: -1 });

    const total = await Employee.countDocuments(query);

    return NextResponse.json({ success: true, count: employees.length, total, data: employees });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server Error' }, { status: 500 });
  }
}

// POST /api/employees - Create new employee
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const employee = await Employee.create(body);
    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ success: false, error: 'Username or Email already exists.' }, { status: 400 });
    }
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server Error' }, { status: 500 });
  }
}
