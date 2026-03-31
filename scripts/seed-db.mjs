import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not found in .env');
  process.exit(1);
}

// Model minimal definition
const employeeSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  contact: String,
  organization: String,
  rvsf: String,
  designation: String,
  status: String,
  passwordExpiry: Date
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

async function seed() {
  try {
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const existingUser = await Employee.findOne({ username: 'rampup' });
    
    if (existingUser) {
      console.log('User rampup already exists in the "employee_portal" database.');
    } else {
      await Employee.create({
        firstName: 'Ramp',
        lastName: 'Up',
        username: 'rampup',
        email: 'rampup@example.com',
        password: 'rampup555',
        contact: '0000000000',
        organization: 'ScrapCentre',
        rvsf: 'NTS-01',
        designation: 'Admin',
        status: 'Active',
        passwordExpiry: new Date('9999-12-31')
      });
      console.log('User rampup created successfully in the "employee_portal" database!');
    }
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
