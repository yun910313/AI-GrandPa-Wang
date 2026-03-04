export interface MedicalRecord {
  id: number;
  date: string;
  hospital: string;
  department: string;
  doctor: string;
  diagnosis: string;
  notes: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  reminder_time: string;
  is_taken?: number;
  elderly_id?: string;
}

export interface TestResult {
  id: number;
  date: string;
  test_name: string;
  value: number;
  unit: string;
  reference_range: string;
  status: string;
}

export interface GPSLog {
  id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  address: string;
}

export interface VitalSigns {
  id: number;
  timestamp: string;
  heart_rate: number;
  systolic: number;
  diastolic: number;
  blood_oxygen: number;
  temperature: number;
  steps: number;
}

export interface DoctorNote {
  id: number;
  created_at: string;
  question: string;
  answer: string;
  is_resolved: number;
}

export interface UserProfile {
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
}

export interface ElderlyProfile {
  id: number;
  name: string;
  age: number;
  gender: string;
  blood_type: string;
  medical_history: string;
  safe_zone_address: string;
  birthday: string;
  height: string;
  weight: string;
  primary_hospital: string;
  safe_zone_range?: number;
}

export interface EmergencyContact {
  id: any;
  name: string;
  relationship: string;
  phone: string;
}

// ------ 以下為王爺爺專案前端專用型別 ------

export interface HealthStat {
  label: string;
  value: number | string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export enum AppTab {
  HOME = 'home',
  MEDS = 'meds',
  HEALTH = 'health',
  CHAT = 'chat',
  VISION = 'vision'
}
