import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Organization from '@/lib/models/Organization';

// PATCH /api/organizations/[id] - Update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const org = await Organization.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: org });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server Error' }, { status: 500 });
  }
}

// DELETE /api/organizations/[id] - Delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const org = await Organization.findByIdAndDelete(id);
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: org });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server Error' }, { status: 500 });
  }
}
