import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';

export async function GET() {
  try {
    await connectDB();

    const username = process.env.ADMIN_USERNAME || 'rampup';
    const password = process.env.ADMIN_PASSWORD || 'rampup555';
    
    const existingUser = await Employee.findOne({ username });
    
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists in MongoDB' }, { status: 200 });
    }

    const newUser = await Employee.create({
      firstName: 'Ramp',
      lastName: 'Up',
      username,
      email: `${username}@example.com`,
      password,
      contact: '0000000000',
      organization: 'ScrapCentre',
      rvsf: 'NTS-01',
      designation: 'Admin',
      status: 'Active'
    });

    return NextResponse.json({ message: 'User seeded successfully into MongoDB', user: newUser.username }, { status: 201 });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ message: 'Failed to seed user', error: error.message }, { status: 500 });
  }
}
