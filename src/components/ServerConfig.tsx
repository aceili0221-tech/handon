import React, { useState } from "react";
import {
  Server,
  Database,
  Radio,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Wifi,
  WifiOff,
  CloudUpload,
  Terminal,
  Shield,
  RotateCcw,
  Code
} from "lucide-react";
import { StorageMode, AttendanceLog } from "../types";

interface ServerConfigProps {
  storageMode: StorageMode;
  onSetStorageMode: (mode: StorageMode) => void;
  serverOnline: boolean;
  onTestConnection: () => Promise<boolean>;
  offlineQueue: AttendanceLog[];
  onSyncOfflineQueue: () => Promise<void>;
  onResetSeedData: () => void;
  onAddToast: (toast: { type: "success" | "warning" | "error" | "info"; title: string; message: string }) => void;
}

export const ServerConfig: React.FC<ServerConfigProps> = ({
  storageMode,
  onSetStorageMode,
  serverOnline,
  onTestConnection,
  offlineQueue,
  onSyncOfflineQueue,
  onResetSeedData,
  onAddToast
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    const start = performance.now();
    const ok = await onTestConnection();
    const end = performance.now();
    setLatency(Math.round(end - start));
    setIsTesting(false);

    if (ok) {
      onAddToast({
        type: "success",
        title: "伺服器連線成功",
        message: `本機 Node.js 主機回應正常 (延遲 ${Math.round(end - start)}ms)`
      });
    } else {
      onAddToast({
        type: "error",
        title: "無法連線至公司主機",
        message: "請確認固定電腦是否已啟動 node server.js 或連接至公司內網。"
      });
    }
  };

  const handleSync = async () => {
    if (offlineQueue.length === 0) {
      onAddToast({
        type: "info",
        title: "離線隊列為空",
        message: "目前所有打卡紀錄均已與公司主機完全同步。"
      });
      return;
    }
    setIsSyncing(true);
    await onSyncOfflineQueue();
    setIsSyncing(false);
  };

  const sampleServerCode = `// ==========================================
// 企業內部打卡伺服器 (node server.js)
// 執行方式: npm install express && node server.js
// 服務埠號: http://localhost:3000
// ==========================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  next();
});

const LOGS_FILE = path.join(__dirname, 'attendance_logs.json');

// 讀取出勤紀錄
function getLogs() {
  if (!fs.existsSync(LOGS_FILE)) return [];
  return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
}

// 寫入出勤紀錄
function saveLogs(logs) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

// 健康檢查 Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: "online", timestamp: Date.now() });
});

// 查詢所有打卡紀錄
app.get('/api/attendance', (req, res) => {
  res.json({ status: "success", data: getLogs() });
});

// 新增單筆打卡紀錄
app.post('/api/attendance', (req, res) => {
  const newLog = req.body;
  if (!newLog || !newLog.empId) return res.status(400).json({ error: "參數不足" });
  
  newLog.id = newLog.id || ('LOG-' + Date.now());
  newLog.timestamp = newLog.timestamp || Date.now();
  
  const logs = getLogs();
  logs.unshift(newLog);
  saveLogs(logs);
  
  console.log(\`[\${newLog.time}] \${newLog.empName} - \${newLog.type} (\${newLog.details})\`);
  res.json({ status: "success", message: "已成功寫入公司主機資料庫", data: newLog });
});

// 批次同步離線隊列
app.post('/api/attendance/batch', (req, res) => {
  const { logs: batchLogs } = req.body;
  const currentLogs = getLogs();
  const ids = new Set(currentLogs.map(l => l.id));
  
  let added = 0;
  (batchLogs || []).forEach(log => {
    if (!ids.has(log.id)) {
      currentLogs.unshift(log);
      ids.add(log.id);
      added++;
    }
  });
  
  saveLogs(currentLogs);
  res.json({ status: "success", syncedCount: added });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`企業出勤主機啟動完成: http://0.0.0.0:\${PORT}\`);
});
`;

  const copyCode = () => {
    navigator.clipboard.writeText(sampleServerCode);
    setCopied(true);
    onAddToast({
      type: "success",
      title: "程式碼已複製",
      message: "已將 server.js 完整原始碼複製至剪貼簿。"
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="server-config-module" className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              模組 E：本機伺服器設定與同步
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            自由切換純前端 LocalStorage 單機模式或 Node.js Express 公司主機同步模式，保障資料完全本機私有化。
          </p>
        </div>

        {/* Quick Reset Seed Button */}
        <button
          onClick={onResetSeedData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-rose-300 hover:bg-rose-950 hover:border-rose-700 transition"
          title="重置出勤紀錄為初始示範資料"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重置示範資料</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Storage Mode Switcher & Connectivity (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Mode Switcher Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <span>資料儲存模式切換</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mode A: LocalStorage */}
              <button
                type="button"
                onClick={() => {
                  onSetStorageMode("LOCAL_STORAGE");
                  onAddToast({
                    type: "info",
                    title: "已切換至 Mode A",
                    message: "目前使用瀏覽器 LocalStorage 純單機模式運行。"
                  });
                }}
                className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                  storageMode === "LOCAL_STORAGE"
                    ? "bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-950/40"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-indigo-300">Mode A: LocalStorage</span>
                  {storageMode === "LOCAL_STORAGE" && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  純前端單機運行，打卡資料保存在本機瀏覽器 Cache 中，無需任何後端即可隨開即用。
                </p>
              </button>

              {/* Mode B: SERVER_REST */}
              <button
                type="button"
                onClick={() => {
                  onSetStorageMode("SERVER_REST");
                  onAddToast({
                    type: "info",
                    title: "已切換至 Mode B",
                    message: "目前使用 Node.js Express 公司主機 REST API 儲存模式。"
                  });
                }}
                className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                  storageMode === "SERVER_REST"
                    ? "bg-emerald-950/60 border-emerald-500 text-white shadow-lg shadow-emerald-950/40"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-emerald-300">Mode B: SERVER_REST</span>
                  {storageMode === "SERVER_REST" && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  即時 POST 至公司固定主機 REST API，支援多裝置彙整寫入 attendance_logs.json。
                </p>
              </button>
            </div>
          </div>

          {/* Connection Test & Health Check */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wifi className="w-5 h-5 text-emerald-400" />
                <span>公司主機 REST 連線狀態</span>
              </h3>

              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  serverOnline
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                    : "bg-rose-950/60 text-rose-300 border-rose-500/40"
                }`}
              >
                {serverOnline ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{serverOnline ? "連線中 (Online)" : "未連線 (Offline)"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">REST API Endpoint:</span>
                <span className="font-mono text-slate-200">/api/attendance</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">連線延遲 (Latency):</span>
                <span className="font-mono text-emerald-400">
                  {latency !== null ? `${latency} ms` : "已連接"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">儲存檔案路徑:</span>
                <span className="font-mono text-slate-300">./attendance_logs.json</span>
              </div>
            </div>

            <button
              onClick={handleTest}
              disabled={isTesting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-blue-400" : ""}`} />
              <span>{isTesting ? "正在檢測主機狀態..." : "執行伺服器連線測試 (Health Check)"}</span>
            </button>
          </div>

          {/* Offline Sync Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CloudUpload className="w-5 h-5 text-amber-400" />
                <span>離線隊列暫存 (Offline Queue)</span>
              </h3>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {offlineQueue.length} 筆待同步
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              當外勤人員手機處於無收訊或無法連線至公司主機時，打卡紀錄將自動暫存於離線隊列中，待網路恢復時一鍵批次傳送。
            </p>

            <button
              onClick={handleSync}
              disabled={isSyncing || offlineQueue.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CloudUpload className={`w-4 h-4 ${isSyncing ? "animate-bounce" : ""}`} />
              <span>{isSyncing ? "正在同步中..." : `立即批次同步 ${offlineQueue.length} 筆紀錄至主機`}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Embedded Express Server Code Viewer (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">公司主機端程式碼 (server.js)</h3>
              </div>

              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "已複製！" : "一鍵複製 server.js"}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              若要在公司固定電腦建立自建打卡服務器，只需複製以下 Node.js 程式碼並執行 <code className="text-amber-300 font-mono">node server.js</code> 即可。
            </p>

            {/* Code Block Container */}
            <div className="mt-3 flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-[460px] font-mono text-[11px] text-slate-300 leading-relaxed no-scrollbar select-all">
              <pre>{sampleServerCode}</pre>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                零第三方依賴 • 完整自主掌控
              </span>
              <span className="font-mono text-slate-500">Port: 3000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
