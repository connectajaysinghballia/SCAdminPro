import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';

export async function GET() {
  try {
    await connectDB();
    
    const existingUser = await Employee.findOne({ username: 'rampup' });
    
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 200 });
    }

    const newUser = await Employee.create({
      firstName: 'Ramp',
      lastName: 'Up',
      username: 'rampup',
      email: 'rampup@example.com',
      password: 'rampup555',
      contact: '0000000000',
      organization: 'ScrapCentre',
      rvsf: 'NTS-01',
      designation: 'Admin',
      status: 'Active'
    });

    return NextResponse.json({ message: 'User seeded successfully', user: newUser.username }, { status: 201 });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ message: 'Failed to seed user', error: error.message }, { status: 500 });
  }
}
