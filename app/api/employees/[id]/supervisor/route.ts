import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';

// Check for hierarchy cycle recursively
async function createsCycle(employeeId: string, nextSupervisorId: string): Promise<boolean> {
  let currentId: string | null = nextSupervisorId;
  while (currentId) {
    if (currentId.toString() === employeeId.toString()) return true;
    
    const current: any = await Employee.findById(currentId).lean();
    if (!current) break;
    
    currentId = current.supervisorId ? current.supervisorId.toString() : null;
  }
  return false;
}

// PATCH /api/employees/[id]/supervisor - Link supervisor with cycle detection
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { supervisorId } = body;
    
    if (supervisorId) {
      if (supervisorId.toString() === id.toString()) {
        return NextResponse.json({ success: false, error: 'Cannot supervise themselves.' }, { status: 400 });
      }

      const cycle = await createsCycle(id, supervisorId);
      if (cycle) {
        return NextResponse.json({ success: false, error: 'This supervisor link creates a cycle.' }, { status: 400 });
      }
    }

    const employee = await Employee.findByIdAndUpdate(id, { supervisorId: supervisorId || null }, { new: true });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server Error' }, { status: 500 });
  }
}
