import { NextResponse, NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import UserDesignation from '@/lib/models/UserDesignation';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { designationCd, designationName } = body;

    if (!designationCd || !designationName) {
      return NextResponse.json(
        { success: false, error: 'Designation Code and Title are required.' },
        { status: 400 }
      );
    }

    const existing = await UserDesignation.findOne({
      _id: { $ne: id },
      designationCd: { $regex: new RegExp(`^${designationCd.trim()}$`, 'i') }
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Designation code '${designationCd}' already exists.` },
        { status: 400 }
      );
    }

    const updated = await UserDesignation.findByIdAndUpdate(
      id,
      {
        designationCd: designationCd.trim(),
        designationName: designationName.trim()
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Designation not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('PATCH /api/designations/[id] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const deleted = await UserDesignation.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Designation not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Designation deleted successfully.' });
  } catch (error: any) {
    console.error('DELETE /api/designations/[id] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
