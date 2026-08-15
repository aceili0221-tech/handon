/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { OfficeAttendance } from "./components/OfficeAttendance";
import { FieldAttendance } from "./components/FieldAttendance";
import { LeaveOvertime } from "./components/LeaveOvertime";
import { EmployeeManagement } from "./components/EmployeeManagement";
import { AdminDashboard } from "./components/AdminDashboard";
import { ServerConfig } from "./components/ServerConfig";
import { Toast } from "./components/Toast";
import { AttendanceLog, Employee, ProjectSite, StorageMode, ToastMessage } from "./types";
import { MOCK_EMPLOYEES, MOCK_PROJECT_SITES, INITIAL_ATTENDANCE_LOGS } from "./data/mockData";
import { formatDateTime } from "./utils/helpers";

const STORAGE_KEY_LOGS = "enterprise_attendance_logs_v1";
const STORAGE_KEY_EMPLOYEES = "enterprise_attendance_employees_v1";
const STORAGE_KEY_MODE = "enterprise_attendance_storage_mode";
const STORAGE_KEY_QUEUE = "enterprise_attendance_offline_queue";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("office");

  // Storage & Server State
  const [storageMode, setStorageMode] = useState<StorageMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    return saved === "LOCAL_STORAGE" ? "LOCAL_STORAGE" : "SERVER_REST";
  });
  const [serverOnline, setServerOnline] = useState<boolean>(true);

  // Employees State (Dynamic & Persistent)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse local employees:", e);
    }
    return MOCK_EMPLOYEES;
  });

  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    return employees[0]?.id || MOCK_EMPLOYEES[0].id;
  });

  // Attendance Logs State
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse local logs:", e);
    }
    return INITIAL_ATTENDANCE_LOGS;
  });

  const [offlineQueue, setOfflineQueue] = useState<AttendanceLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse offline queue:", e);
    }
    return [];
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    ({ type, title, message }: { type: "success" | "warning" | "error" | "info"; title: string; message: string }) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save employees to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.error("Failed to save employees to localStorage:", e);
    }
  }, [employees]);

  // Save logs to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(attendanceLogs));
    } catch (e) {
      console.error("Failed to save logs to localStorage:", e);
    }
  }, [attendanceLogs]);

  // Save queue to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(offlineQueue));
    } catch (e) {
      console.error("Failed to save offline queue to localStorage:", e);
    }
  }, [offlineQueue]);

  // Save storage mode
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MODE, storageMode);
  }, [storageMode]);

  // Check server connection
  const checkServerHealth = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch("/api/health", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        setServerOnline(true);
        return true;
      }
      setServerOnline(false);
      return false;
    } catch (err) {
      setServerOnline(false);
      return false;
    }
  }, []);

  // Fetch employees from server
  const fetchServerEmployees = useCallback(async () => {
    if (storageMode !== "SERVER_REST") return;
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setEmployees(json.data);
          setServerOnline(true);
        }
      }
    } catch (err) {
      console.warn("Could not fetch server employees, using local cache:", err);
    }
  }, [storageMode]);

  // Fetch logs from server
  const fetchServerLogs = useCallback(async () => {
    if (storageMode !== "SERVER_REST") return;
    try {
      const res = await fetch("/api/attendance");
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setAttendanceLogs(json.data);
          setServerOnline(true);
        }
      }
    } catch (err) {
      console.warn("Could not fetch server logs, using local cache:", err);
      setServerOnline(false);
    }
  }, [storageMode]);

  // Initial load
  useEffect(() => {
    checkServerHealth().then((online) => {
      if (online && storageMode === "SERVER_REST") {
        fetchServerEmployees();
        fetchServerLogs();
      }
    });

    const interval = setInterval(() => {
      checkServerHealth();
    }, 15000);

    return () => clearInterval(interval);
  }, [checkServerHealth, fetchServerEmployees, fetchServerLogs, storageMode]);

  // Punch-In handler (unified for Office, Field, Leave/OT)
  const handlePunchIn = async (newLogData: Omit<AttendanceLog, "id" | "timestamp" | "synced">) => {
    const timestamp = Date.now();
    const newLog: AttendanceLog = {
      ...newLogData,
      id: `LOG-${timestamp}`,
      timestamp,
      synced: storageMode === "LOCAL_STORAGE"
    };

    // Update state & local storage immediately
    setAttendanceLogs((prev) => [newLog, ...prev]);

    // If Mode B (SERVER_REST), attempt sending to /api/attendance
    if (storageMode === "SERVER_REST") {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newLog)
        });

        if (res.ok) {
          setServerOnline(true);
          addToast({
            type: "success",
            title: `${newLog.type} 成功 (主機同步)`,
            message: `${newLog.empName} 於 ${newLog.time} 已成功寫入公司主機資料庫。`
          });
          return;
        }
        throw new Error("Server returned non-200");
      } catch (err) {
        // Fallback: Queue for offline sync
        setServerOnline(false);
        setOfflineQueue((prev) => [...prev, newLog]);
        addToast({
          type: "warning",
          title: `${newLog.type} 成功 (離線暫存)`,
          message: `主機目前未連線，紀錄已先存於本機，並加入離線同步隊列。`
        });
      }
    } else {
      // LocalStorage Mode
      addToast({
        type: "success",
        title: `${newLog.type} 成功 (本機儲存)`,
        message: `${newLog.empName} 於 ${newLog.time} 紀錄已儲存至瀏覽器 Cache。`
      });
    }
  };

  // Sync offline queue
  const handleSyncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    try {
      const res = await fetch("/api/attendance/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: offlineQueue })
      });

      if (res.ok) {
        setOfflineQueue([]);
        setServerOnline(true);
        addToast({
          type: "success",
          title: "批次同步完成",
          message: `已將離線隊列中的所有打卡紀錄成功同步至公司主機。`
        });
        fetchServerLogs();
      } else {
        throw new Error("Batch sync failed");
      }
    } catch (err) {
      setServerOnline(false);
      addToast({
        type: "error",
        title: "同步失敗",
        message: "無法連線至公司主機，請檢查網路狀態或主機是否開啟。"
      });
    }
  };

  // Delete attendance log
  const handleDeleteLog = async (id: string) => {
    setAttendanceLogs((prev) => prev.filter((l) => l.id !== id));
    setOfflineQueue((prev) => prev.filter((l) => l.id !== id));

    if (storageMode === "SERVER_REST") {
      try {
        await fetch(`/api/attendance/${id}`, { method: "DELETE" });
      } catch (e) {
        console.warn("Could not delete from server:", e);
      }
    }

    addToast({
      type: "info",
      title: "紀錄已刪除",
      message: `紀錄 ${id} 已自出勤清單中移除。`
    });
  };

  // Reset logs to initial seed data
  const handleResetSeedData = async () => {
    setAttendanceLogs(INITIAL_ATTENDANCE_LOGS);
    setOfflineQueue([]);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(INITIAL_ATTENDANCE_LOGS));
    localStorage.removeItem(STORAGE_KEY_QUEUE);

    if (storageMode === "SERVER_REST") {
      try {
        await fetch("/api/attendance/reset", { method: "POST" });
      } catch (e) {
        console.warn("Could not reset server:", e);
      }
    }

    addToast({
      type: "success",
      title: "出勤資料已重置",
      message: "已重置為預設之 5 筆企業示範出勤紀錄。"
    });
  };

  // ---------------- EMPLOYEES CRUD HANDLERS ----------------

  const handleAddEmployee = async (newEmp: Employee) => {
    setEmployees((prev) => [...prev, newEmp]);

    if (storageMode === "SERVER_REST") {
      try {
        await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEmp)
        });
      } catch (err) {
        console.warn("Could not post employee to server:", err);
      }
    }
  };

  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));

    if (storageMode === "SERVER_REST") {
      try {
        await fetch(`/api/employees/${updatedEmp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedEmp)
        });
      } catch (err) {
        console.warn("Could not update employee on server:", err);
      }
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setEmployees((prev) => {
      const next = prev.filter((e) => e.id !== id);
      // If deleted employee was active in punch-in selection, switch to next available
      if (selectedEmpId === id && next.length > 0) {
        setSelectedEmpId(next[0].id);
      }
      return next;
    });

    if (storageMode === "SERVER_REST") {
      try {
        await fetch(`/api/employees/${id}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Could not delete employee from server:", err);
      }
    }
  };

  const handleResetEmployees = async () => {
    setEmployees(MOCK_EMPLOYEES);
    setSelectedEmpId(MOCK_EMPLOYEES[0].id);
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(MOCK_EMPLOYEES));

    if (storageMode === "SERVER_REST") {
      try {
        await fetch("/api/employees/reset", { method: "POST" });
      } catch (err) {
        console.warn("Could not reset employees on server:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storageMode={storageMode}
        serverOnline={serverOnline}
        offlineQueueCount={offlineQueue.length}
        onQuickSync={handleSyncOfflineQueue}
      />

      {/* Main Module View Port */}
      <main className="flex-1 pb-16">
        {activeTab === "office" && (
          <OfficeAttendance
            employees={employees}
            selectedEmpId={selectedEmpId}
            onSelectEmployee={setSelectedEmpId}
            attendanceLogs={attendanceLogs}
            onPunchIn={handlePunchIn}
          />
        )}

        {activeTab === "field" && (
          <FieldAttendance
            employees={employees}
            selectedEmpId={selectedEmpId}
            onSelectEmployee={setSelectedEmpId}
            projectSites={MOCK_PROJECT_SITES}
            onPunchIn={handlePunchIn}
            onAddToast={addToast}
          />
        )}

        {activeTab === "leave" && (
          <LeaveOvertime
            employees={employees}
            selectedEmpId={selectedEmpId}
            onSelectEmployee={setSelectedEmpId}
            onPunchIn={handlePunchIn}
            onAddToast={addToast}
          />
        )}

        {activeTab === "employees" && (
          <EmployeeManagement
            employees={employees}
            attendanceLogs={attendanceLogs}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onResetEmployees={handleResetEmployees}
            onAddToast={addToast}
          />
        )}

        {activeTab === "admin" && (
          <AdminDashboard
            employees={employees}
            attendanceLogs={attendanceLogs}
            onDeleteLog={handleDeleteLog}
            onRefreshData={fetchServerLogs}
            onNavigateToEmployees={() => setActiveTab("employees")}
            onAddToast={addToast}
          />
        )}

        {activeTab === "server" && (
          <ServerConfig
            storageMode={storageMode}
            onSetStorageMode={setStorageMode}
            serverOnline={serverOnline}
            onTestConnection={checkServerHealth}
            offlineQueue={offlineQueue}
            onSyncOfflineQueue={handleSyncOfflineQueue}
            onResetSeedData={handleResetSeedData}
            onAddToast={addToast}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            企業內部出勤與工時打卡系統 © 2026 • 零雲端訂閱費用 • 本機私有化自主掌控
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>在職員工：{employees.length} 位</span>
            <span>•</span>
            <span>支援瀏覽器: Chrome / Safari / Edge / Firefox</span>
            <span>•</span>
            <span className="font-mono text-emerald-400">REST API Ready</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
