import { Timestamp } from 'firebase/firestore';

export interface Report {
  id?: string;
  companyName: string;
  companyEmail: string;
  contactPerson: string;
  instrumentList: string;
  calibrationDate: Timestamp;
  expiryDate: Timestamp;
  userId: string;
  remindersSent?: string[];
}
