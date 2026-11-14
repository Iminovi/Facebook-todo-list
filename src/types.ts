import { Timestamp } from 'firebase/firestore';

export type ActiveView = 'checklist' | 'calendar' | 'reminders';

export type ChecklistFilter = 'all' | 'not_logged_in' | 'not_uploaded' | 'completed';

export type ReminderTargetType = 'login' | 'upload' | 'both';

export interface UserProfile {
  ownerId: string;
  displayName: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FbAccount {
  id: string;
  ownerId: string;
  name: string;
  username: string;
  profileUrl: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DailyCheck {
  id: string;
  ownerId: string;
  dateKey: string;
  accountId: string;
  loggedIn: boolean;
  uploaded: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DailyReminder {
  id: string;
  ownerId: string;
  label: string;
  time: string; // HH:mm
  targetType: ReminderTargetType;
  enabled: boolean;
  lastTriggeredDate: string; // YYYY-MM-DD or ''
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActiveReminderAlert {
  id: string;
  label: string;
  time: string;
  targetType: ReminderTargetType;
  pendingAccounts: {
    id: string;
    name: string;
    missingLogin: boolean;
    missingUpload: boolean;
  }[];
}
