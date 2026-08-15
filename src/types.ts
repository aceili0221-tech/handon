export type AttendanceType =
  | "辦公室上班"
  | "辦公室下班"
  | "辦公室暫離"
  | "暫離返回"
  | "外勤簽到"
  | "外勤簽退"
  | "請假登記"
  | "加班登記";

export interface AttendanceLog {
  id: string;
  empId: string;
  empName: string;
  dept: string;
  role?: string;
  type: AttendanceType;
  date: string;
  time: string;
  details: string;
  ipLocation: string;
  workLog?: string;
  timestamp: number;
  status?: "normal" | "leave" | "overtime" | "break";
  synced?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  dept: string;
  role: string;
  avatarBg: string;
  shift: string;
  phone: string;
  email: string;
}

export interface ProjectSite {
  id: string;
  code: string;
  name: string;
  locationName: string;
  lat: number;
  lng: number;
  manager: string;
  phone: string;
  description: string;
}

export type StorageMode = "LOCAL_STORAGE" | "SERVER_REST";

export interface ToastMessage {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
}
