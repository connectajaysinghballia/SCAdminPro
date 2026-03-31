import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Rvsf from '@/lib/models/Rvsf';

// PATCH /api/rvsfs/[id] - Update RVSF
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    const rvsf = await Rvsf.findByIdAndUpdate(id, body, { new: true });
    if (!rvsf) return NextResponse.json({ success: false, error: 'RVSF not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: rvsf });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update RVSF' }, { status: 400 });
  }
}

// DELETE /api/rvsfs/[id] - Delete RVSF
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const rvsf = await Rvsf.findByIdAndDelete(id);
    if (!rvsf) return NextResponse.json({ success: false, error: 'RVSF not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'RVSF deleted successfully' });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete RVSF' }, { status: 500 });
  }
}
