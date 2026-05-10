import { Timestamp } from 'firebase/firestore';

export interface Report {
  id?: string;
  companyName: string;
  tagId: string;
  notes: string;
  calibrationDate: Timestamp;
  expiryDate: Timestamp;
  userId: string;
  remindersSent?: string[];
}
