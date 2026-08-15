import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const LOGS_FILE = path.join(process.cwd(), "attendance_logs.json");

// Default seed records if file doesn't exist
const INITIAL_LOGS = [
  {
    id: "LOG-1723703425000",
    empId: "EMP-001",
    empName: "張哲豪",
    dept: "資訊部",
    role: "資深系統架構師",
    type: "辦公室上班",
    date: "2026/8/15",
    time: "08:52:10",
    details: "總部辦公室區域網路 (LAN)",
    ipLocation: "192.168.1.105 (辦公室 Wi-Fi)",
    timestamp: 1723703425000,
    status: "normal"
  },
  {
    id: "LOG-1723704200000",
    empId: "EMP-002",
    empName: "林佳穎",
    dept: "工程部",
    role: "案場監造專案經理",
    type: "外勤簽到",
    date: "2026/8/15",
    time: "09:05:22",
    details: "PRJ-101 台北信義 A11 商業大樓監造案",
    ipLocation: "GPS: 25.0354° N, 121.5672° E (精確度 12m)",
    workLog: "完成 B2 結構體防水分層巡檢，下午 14:00 與大林組工程師召開定例會議。",
    timestamp: 1723704200000,
    status: "normal"
  },
  {
    id: "LOG-1723704800000",
    empId: "EMP-003",
    empName: "陳冠宇",
    dept: "業務部",
    role: "資深業務總監",
    type: "外勤簽到",
    date: "2026/8/15",
    time: "09:15:00",
    details: "PRJ-102 新竹科學園區 Phase-3 廠區新建工程",
    ipLocation: "GPS: 24.7785° N, 121.0142° E (精確度 18m)",
    workLog: "拜訪台積電外協廠商進行 Q3 空調工程報價複審。",
    timestamp: 1723704800000,
    status: "normal"
  },
  {
    id: "LOG-1723705100000",
    empId: "EMP-004",
    empName: "王雅婷",
    dept: "管理部",
    role: "人力資源主管",
    type: "辦公室上班",
    date: "2026/8/15",
    time: "08:48:30",
    details: "總部辦公室區域網路 (LAN)",
    ipLocation: "192.168.1.108 (辦公室 Wi-Fi)",
    timestamp: 1723705100000,
    status: "normal"
  },
  {
    id: "LOG-1723705500000",
    empId: "EMP-005",
    empName: "黃俊傑",
    dept: "工安部",
    role: "職業安全衛生管理師",
    type: "請假登記",
    date: "2026/8/15",
    time: "08:30:00",
    details: "特別休假 (全天 8 小時)",
    ipLocation: "系統審核登記",
    workLog: "私人家庭事務請假，職務代理人：張哲豪",
    timestamp: 1723705500000,
    status: "leave"
  }
];

function readLogs(): any[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading attendance_logs.json:", err);
  }
  return INITIAL_LOGS;
}

function writeLogs(logs: any[]): void {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing attendance_logs.json:", err);
  }
}

// Ensure initial file exists
if (!fs.existsSync(LOGS_FILE)) {
  writeLogs(INITIAL_LOGS);
}

// ---------------- REST API ROUTES ----------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    message: "企業內部打卡伺服器正常運作中",
    timestamp: Date.now(),
    uptime: process.uptime(),
    serverTime: new Date().toISOString()
  });
});

// Get all attendance logs
app.get("/api/attendance", (req, res) => {
  const logs = readLogs();
  res.json({
    status: "success",
    total: logs.length,
    data: logs
  });
});

// Post a new attendance log
app.post("/api/attendance", (req, res) => {
  const newLog = req.body;
  if (!newLog || !newLog.empId) {
    return res.status(400).json({ status: "error", message: "缺少必要打卡參數" });
  }

  if (!newLog.id) {
    newLog.id = `LOG-${Date.now()}`;
  }
  if (!newLog.timestamp) {
    newLog.timestamp = Date.now();
  }

  const logs = readLogs();
  logs.unshift(newLog); // prepend to top
  writeLogs(logs);

  res.json({
    status: "success",
    message: "已成功寫入公司主機資料庫",
    data: newLog
  });
});

// Batch sync for offline mode
app.post("/api/attendance/batch", (req, res) => {
  const { logs: batchLogs } = req.body;
  if (!Array.isArray(batchLogs)) {
    return res.status(400).json({ status: "error", message: "傳入資料格式必須為陣列" });
  }

  const currentLogs = readLogs();
  const existingIds = new Set(currentLogs.map(l => l.id));
  let addedCount = 0;

  for (const item of batchLogs) {
    if (item && item.id && !existingIds.has(item.id)) {
      currentLogs.unshift(item);
      existingIds.add(item.id);
      addedCount++;
    }
  }

  writeLogs(currentLogs);

  res.json({
    status: "success",
    message: `成功同步 ${addedCount} 筆離線打卡紀錄至主機`,
    syncedCount: addedCount
  });
});

// Delete a log
app.delete("/api/attendance/:id", (req, res) => {
  const { id } = req.params;
  let logs = readLogs();
  logs = logs.filter(l => l.id !== id);
  writeLogs(logs);

  res.json({
    status: "success",
    message: "已成功刪除該筆打卡紀錄"
  });
});

// Reset logs
app.post("/api/attendance/reset", (req, res) => {
  writeLogs(INITIAL_LOGS);
  res.json({
    status: "success",
    message: "已重置為預設示範出勤資料",
    data: INITIAL_LOGS
  });
});

// ---------------- VITE MIDDLEWARE & STATIC SERVING ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise Attendance Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
