import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';

// PATCH /api/employees/[id] - Update employee status and details
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const updateData = { ...body };
    delete updateData.supervisorId;

    if (updateData.status === 'Inactive') {
      updateData.inactiveDate = new Date();
      updateData.passwordExpiry = new Date();
    } else if (updateData.status === 'Active') {
      updateData.activeDate = new Date();
      updateData.passwordExpiry = new Date('9999-12-31');
    }

    const employee = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: employee });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server Error' }, { status: 500 });
  }
}

// DELETE /api/employees/[id] - Soft Delete / Deactivate
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const employee = await Employee.findByIdAndUpdate(id, { 
      status: 'Inactive',
      inactiveDate: new Date(),
      passwordExpiry: new Date()
    }, { new: true });
    
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Auto-detach subordinates
    await Employee.updateMany({ supervisorId: employee._id }, { supervisorId: null });

    return NextResponse.json({ success: true, message: 'Employee deactivated and subordinates detached.', data: employee });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server Error' }, { status: 500 });
  }
}
