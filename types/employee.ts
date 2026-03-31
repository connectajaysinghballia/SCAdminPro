export interface Employee {
  id?: number;
  _id?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  organization: string;
  rvsf: string;
  designation: string;
  contact: string;
  passwordExpiry: string;
  dob?: string;
  anniversary?: string;
  supervisorId: string | null;
  status: "Active" | "Inactive";
  inactiveDate?: string;
  activeDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const organizations = ["Restorehealth Medicare Pvt Ltd", "Novalytix Technology Services Pvt Ltd"];
export const rvsfByOrganization: Record<string, string[]> = {
  "Restorehealth Medicare Pvt Ltd": ["SCRAP CENTRE", "KANPUR RHSV"],
  "Novalytix Technology Services Pvt Ltd": ["NTS DEMO CENTRE", "UP SCRAP HUB"],
};
export const designations = [
  "Business Head",
  "Process Owner",
  "Purchase Manager",
  "Purchase Executive",
  "ELV Cost Analyst",
  "Job Manager",
  "Human Resource",
  "Workshop Admin",
];
