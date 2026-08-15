import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const LOGS_FILE = path.join(process.cwd(), "attendance_logs.json");
const EMPLOYEES_FILE = path.join(process.cwd(), "employees.json");

// Default seed employees
const INITIAL_EMPLOYEES = [
  {
    id: "EMP-001",
    name: "張哲豪",
    dept: "資訊部",
    role: "資深系統架構師",
    avatarBg: "bg-blue-600",
    shift: "09:00 - 18:00 (彈性 30m)",
    phone: "0912-345-678",
    email: "chehao.chang@company.internal",
    status: "active",
    joinDate: "2023/04/01",
    notes: "負責公司內部系統架構與雲端伺服器維運。"
  },
  {
    id: "EMP-002",
    name: "林佳穎",
    dept: "工程部",
    role: "案場監造專案經理",
    avatarBg: "bg-emerald-600",
    shift: "08:30 - 17:30 (責任制)",
    phone: "0923-456-789",
    email: "chiaying.lin@company.internal",
    status: "active",
    joinDate: "2023/08/15",
    notes: "負責台北信義 A11 與新竹科學園區案場進度查驗。"
  },
  {
    id: "EMP-003",
    name: "陳冠宇",
    dept: "業務部",
    role: "資深業務總監",
    avatarBg: "bg-amber-600",
    shift: "09:00 - 18:00 (外勤彈性)",
    phone: "0934-567-890",
    email: "kuanyu.chen@company.internal",
    status: "active",
    joinDate: "2022/11/01",
    notes: "負責全省大客戶合約洽談與專案開發。"
  },
  {
    id: "EMP-004",
    name: "王雅婷",
    dept: "管理部",
    role: "人力資源主管",
    avatarBg: "bg-purple-600",
    shift: "09:00 - 18:00 (標準班)",
    phone: "0945-678-901",
    email: "yating.wang@company.internal",
    status: "active",
    joinDate: "2024/01/10",
    notes: "統籌企業人資管理、考核、出勤假單核定。"
  },
  {
    id: "EMP-005",
    name: "黃俊傑",
    dept: "工安部",
    role: "職業安全衛生管理師",
    avatarBg: "bg-rose-600",
    shift: "08:00 - 17:00 (案場巡檢)",
    phone: "0956-789-012",
    email: "chunjieh.huang@company.internal",
    status: "leave",
    joinDate: "2024/05/02",
    notes: "負責甲種職安督導巡查，今日請假中。"
  },
  {
    id: "EMP-006",
    name: "許佩珊",
    dept: "財務部",
    role: "主辦會計專員",
    avatarBg: "bg-indigo-600",
    shift: "09:00 - 18:00 (標準班)",
    phone: "0967-890-123",
    email: "peishan.hsu@company.internal",
    status: "active",
    joinDate: "2024/02/20",
    notes: "掌理日常會計出納與各工項請款覆核。"
  }
];

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

function readEmployees(): any[] {
  try {
    if (fs.existsSync(EMPLOYEES_FILE)) {
      const data = fs.readFileSync(EMPLOYEES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading employees.json:", err);
  }
  return INITIAL_EMPLOYEES;
}

function writeEmployees(employees: any[]): void {
  try {
    fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing employees.json:", err);
  }
}

// Ensure initial files exist
if (!fs.existsSync(LOGS_FILE)) {
  writeLogs(INITIAL_LOGS);
}
if (!fs.existsSync(EMPLOYEES_FILE)) {
  writeEmployees(INITIAL_EMPLOYEES);
}

// Helper to get local IPv4 network address
function getLocalNetworkIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch {
    // fallback
  }
  return "localhost";
}

// Helper to open browser automatically
function openBrowser(url: string) {
  const platform = process.platform;
  try {
    if (platform === "darwin") {
      exec(`open "${url}"`);
    } else if (platform === "win32") {
      exec(`start "" "${url}"`);
    } else {
      exec(`xdg-open "${url}" || sensible-browser "${url}"`);
    }
  } catch (e) {
    console.warn("無法自動開啟瀏覽器，請手動訪問：", url);
  }
}

// ---------------- REST API ROUTES: HEALTH & ATTENDANCE ----------------

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

// ---------------- REST API ROUTES: EMPLOYEES (在職員工管理) ----------------

// Get all employees
app.get("/api/employees", (req, res) => {
  const employees = readEmployees();
  res.json({
    status: "success",
    total: employees.length,
    data: employees
  });
});

// Add new employee
app.post("/api/employees", (req, res) => {
  const newEmp = req.body;
  if (!newEmp || !newEmp.name || !newEmp.dept) {
    return res.status(400).json({ status: "error", message: "員工姓名與部門為必填欄位" });
  }

  const employees = readEmployees();
  if (!newEmp.id) {
    const nextNum = employees.length + 1;
    newEmp.id = `EMP-${String(nextNum).padStart(3, "0")}`;
  }

  if (employees.some(e => e.id === newEmp.id)) {
    return res.status(400).json({ status: "error", message: `員工編號 ${newEmp.id} 已存在，請使用不同編號` });
  }

  if (!newEmp.avatarBg) {
    const colors = ["bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-purple-600", "bg-rose-600", "bg-indigo-600", "bg-teal-600", "bg-cyan-600"];
    newEmp.avatarBg = colors[Math.floor(Math.random() * colors.length)];
  }
  if (!newEmp.shift) {
    newEmp.shift = "09:00 - 18:00 (標準班)";
  }
  if (!newEmp.status) {
    newEmp.status = "active";
  }

  employees.push(newEmp);
  writeEmployees(employees);

  res.json({
    status: "success",
    message: `已成功新增員工：${newEmp.name} (${newEmp.id})`,
    data: newEmp
  });
});

// Update employee (編輯在職狀況與資料)
app.put("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  let employees = readEmployees();
  const index = employees.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ status: "error", message: "找不到該員工資料" });
  }

  employees[index] = { ...employees[index], ...updateData, id };
  writeEmployees(employees);

  res.json({
    status: "success",
    message: `已成功更新員工在職狀況與資料：${employees[index].name}`,
    data: employees[index]
  });
});

// Delete employee
app.delete("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  let employees = readEmployees();
  const target = employees.find(e => e.id === id);

  if (!target) {
    return res.status(404).json({ status: "error", message: "找不到欲刪除的員工資料" });
  }

  employees = employees.filter(e => e.id !== id);
  writeEmployees(employees);

  res.json({
    status: "success",
    message: `已成功刪除員工：${target.name} (${id})`
  });
});

// Reset employees to default
app.post("/api/employees/reset", (req, res) => {
  writeEmployees(INITIAL_EMPLOYEES);
  res.json({
    status: "success",
    message: "已重置為預設示範員工名冊",
    data: INITIAL_EMPLOYEES
  });
});

// ---------------- VITE MIDDLEWARE & STATIC SERVING ----------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
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
    const localIp = getLocalNetworkIp();
    const localUrl = `http://localhost:${PORT}`;
    const networkUrl = `http://${localIp}:${PORT}`;

    console.log(`
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   🏢 企業內部出勤與工時打卡系統 (本地伺服器已正常啟動)        │
│                                                              │
│   💻 本機電腦瀏覽器請點開：  \x1b[36m${localUrl}\x1b[0m               │
│   📱 同 WiFi 手機/平板打卡： \x1b[32m${networkUrl}\x1b[0m           │
│   📁 本地打卡資料檔案：      \x1b[90m${LOGS_FILE}\x1b[0m   │
│   👥 本地員工名冊檔案：      \x1b[90m${EMPLOYEES_FILE}\x1b[0m   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
`);

    if (process.argv.includes("--open") || process.env.AUTO_OPEN === "true") {
      console.log(`🌐 正在自動於您的預設桌面瀏覽器開啟：${localUrl}`);
      setTimeout(() => {
        openBrowser(localUrl);
      }, 500);
    }
  });
}

startServer();
