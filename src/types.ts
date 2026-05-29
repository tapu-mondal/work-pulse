// Shared Types and Models for the Workforce Management System

export type UserRole = "admin" | "manager" | "worker";

export type WorkerStatus = "Working" | "Traveling" | "On Break" | "Offline";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  phone: string;
  employeeId: string;
  skills: string[];
  avatarUrl?: string;
  performanceRating?: number;
  hourlyRate: number;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  status: "On Time" | "Late" | "Absent" | "Half Day";
  checkInLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  checkOutLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  faceVerificationSimulated?: boolean;
  gpsVerified?: boolean;
  approved?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  assignedById: string;
  assignedByName: string;
  priority: "Low" | "Medium" | "High";
  deadline: string; // YYYY-MM-DD OR ISO string
  category: string; // e.g., "Field Service", "Delivery", "Inspection", "Development"
  status: "Pending" | "In Progress" | "Completed" | "Delayed" | "Cancelled";
  updates?: TaskUpdate[];
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface TaskUpdate {
  id: string;
  timestamp: string;
  updatedBy: string;
  statusFrom: string;
  statusTo: string;
  comment: string;
}

export interface GPSLog {
  id: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  timestamp: string; // ISO string
  status: WorkerStatus;
  batteryLevel?: number;
}

export interface TeamAnnouncement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string; // ISO string
  important: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string; // "all" or specific user
  content: string;
  timestamp: string; // ISO string
}

export interface PayrollRecord {
  id: string;
  userId: string;
  userName: string;
  month: string; // YYYY-MM
  hourlyRate: number;
  hoursWorked: number;
  overtimeHours: number;
  bonus: number;
  incentives: number;
  deductions: number;
  totalEarnings: number;
  status: "Paid" | "Pending";
}

export interface AIInsight {
  productivityTrends: string;
  fraudAlerts: string[];
  smartRecommendations: string[];
}

export interface SafetyIncident {
  id: string;
  userId: string;
  userName: string;
  type: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  timestamp: string;
  location: string;
  status: "Under Investigation" | "Mitigated" | "Escalated";
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  resolved: boolean;
}

export interface HealthAlert {
  userId: string;
  userName: string;
  heartRate: number;
  bodyTempCel: number;
  gasRating: string;
  fatigueIndex: number;
  status: "Normal" | "High Risk" | "Critical Alarm";
}
