import { AttendanceLog, Employee } from "../types";

export function formatDateTime(dateObj: Date = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const date = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");

  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const weekday = weekdays[dateObj.getDay()];

  return {
    dateStr: `${year}/${month}/${date}`,
    timeStr: `${hours}:${minutes}:${seconds}`,
    fullStr: `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`,
    weekday,
    year,
    month,
    date,
    hours,
    minutes,
    seconds
  };
}

/**
 * Calculates distance in meters between two lat/lng coordinates (Haversine Formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Exports logs as a UTF-8 BOM CSV string and triggers browser download
 */
export function exportAttendanceCSV(logs: AttendanceLog[], filenamePrefix = "Attendance_Report") {
  const headers = [
    "紀錄編號 (ID)",
    "員工編號",
    "員工姓名",
    "所屬部門",
    "打卡類型",
    "日期",
    "時間",
    "專案/明細說明",
    "網路IP/GPS座標",
    "工作日誌/備註",
    "狀態標籤",
    "時間戳記 (Timestamp)"
  ];

  const escapeCSV = (str: string | undefined | null) => {
    if (!str) return '""';
    const clean = String(str).replace(/"/g, '""').replace(/\r?\n/g, " ");
    return `"${clean}"`;
  };

  const rows = logs.map((log) => [
    escapeCSV(log.id),
    escapeCSV(log.empId),
    escapeCSV(log.empName),
    escapeCSV(log.dept),
    escapeCSV(log.type),
    escapeCSV(log.date),
    escapeCSV(log.time),
    escapeCSV(log.details),
    escapeCSV(log.ipLocation),
    escapeCSV(log.workLog || ""),
    escapeCSV(log.status || "normal"),
    escapeCSV(String(log.timestamp))
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\r\n");

  // Add UTF-8 BOM header (\uFEFF) to guarantee Excel in Traditional Chinese / Windows displays without garbled text!
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const filename = `${filenamePrefix}_${timestamp}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports employees list as a UTF-8 BOM CSV string and triggers browser download
 */
export function exportEmployeesCSV(employees: Employee[], filenamePrefix = "Employee_Roster") {
  const headers = [
    "員工編號 (ID)",
    "員工姓名",
    "所屬部門",
    "職稱角色",
    "上班班別",
    "聯絡電話",
    "電子郵件",
    "代表顏色"
  ];

  const escapeCSV = (str: string | undefined | null) => {
    if (!str) return '""';
    const clean = String(str).replace(/"/g, '""').replace(/\r?\n/g, " ");
    return `"${clean}"`;
  };

  const rows = employees.map((emp) => [
    escapeCSV(emp.id),
    escapeCSV(emp.name),
    escapeCSV(emp.dept),
    escapeCSV(emp.role),
    escapeCSV(emp.shift),
    escapeCSV(emp.phone),
    escapeCSV(emp.email),
    escapeCSV(emp.avatarBg)
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const filename = `${filenamePrefix}_${timestamp}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculates work duration between first start and last end shift
 */
export function calculateTodayWorkHours(logs: AttendanceLog[], empId: string, targetDate: string) {
  const empLogs = logs
    .filter((l) => l.empId === empId && l.date === targetDate)
    .sort((a, b) => a.timestamp - b.timestamp);

  const startLog = empLogs.find((l) => l.type === "辦公室上班" || l.type === "外勤簽到");
  const endLog = [...empLogs].reverse().find((l) => l.type === "辦公室下班" || l.type === "外勤簽退");

  if (!startLog) {
    return {
      hasStarted: false,
      hasEnded: false,
      startTime: null,
      endTime: null,
      durationHours: 0,
      durationText: "尚未打卡"
    };
  }

  const startTime = startLog.time;
  const startTs = startLog.timestamp;

  if (!endLog || endLog.timestamp <= startTs) {
    // Ongoing shift
    const elapsedMs = Math.max(0, Date.now() - startTs);
    const totalMinutes = Math.floor(elapsedMs / (1000 * 60));
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return {
      hasStarted: true,
      hasEnded: false,
      startTime,
      endTime: null,
      durationHours: Number((totalMinutes / 60).toFixed(1)),
      durationText: `已在勤 ${hrs} 小時 ${mins} 分鐘 (進行中)`
    };
  }

  const endTs = endLog.timestamp;
  const totalMinutes = Math.floor((endTs - startTs) / (1000 * 60));
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return {
    hasStarted: true,
    hasEnded: true,
    startTime,
    endTime: endLog.time,
    durationHours: Number((totalMinutes / 60).toFixed(1)),
    durationText: `本日總計 ${hrs} 小時 ${mins} 分鐘`
  };
}
