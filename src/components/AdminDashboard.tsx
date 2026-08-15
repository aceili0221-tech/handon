import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  Building,
  MapPin,
  CalendarCheck,
  Download,
  Search,
  Filter,
  Trash2,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  PieChart as PieChartIcon,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { AttendanceLog, Employee } from "../types";
import { exportAttendanceCSV, formatDateTime } from "../utils/helpers";

interface AdminDashboardProps {
  employees: Employee[];
  attendanceLogs: AttendanceLog[];
  onDeleteLog: (id: string) => void;
  onRefreshData?: () => void;
  onNavigateToEmployees?: () => void;
  onAddToast: (toast: { type: "success" | "warning" | "error" | "info"; title: string; message: string }) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  employees,
  attendanceLogs,
  onDeleteLog,
  onRefreshData,
  onNavigateToEmployees,
  onAddToast
}) => {
  const [filterType, setFilterType] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLogForModal, setSelectedLogForModal] = useState<AttendanceLog | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const todayStr = formatDateTime().dateStr;

  // Calculate real-time KPI metrics for Today
  const stats = useMemo(() => {
    const totalStaff = employees.length;

    // Track status of each employee today
    let inOfficeCount = 0;
    let fieldActiveCount = 0;
    let leaveCount = 0;

    const empTodayStatusMap = new Map<string, string>();

    employees.forEach((emp) => {
      // Find latest punch for this employee today
      const empLogs = attendanceLogs
        .filter((l) => l.empId === emp.id && l.date === todayStr)
        .sort((a, b) => b.timestamp - a.timestamp);

      const latest = empLogs[0];
      if (!latest) {
        empTodayStatusMap.set(emp.id, "未打卡");
        return;
      }

      if (latest.type === "辦公室上班" || latest.type === "暫離返回") {
        inOfficeCount++;
        empTodayStatusMap.set(emp.id, "辦公室在勤");
      } else if (latest.type === "外勤簽到") {
        fieldActiveCount++;
        empTodayStatusMap.set(emp.id, "外勤專案中");
      } else if (latest.type === "請假登記") {
        leaveCount++;
        empTodayStatusMap.set(emp.id, "請假休假中");
      } else if (latest.type === "辦公室下班" || latest.type === "外勤簽退") {
        empTodayStatusMap.set(emp.id, "已下班");
      } else {
        empTodayStatusMap.set(emp.id, "其他");
      }
    });

    const unclockedCount = Math.max(0, totalStaff - inOfficeCount - fieldActiveCount - leaveCount);

    return {
      totalStaff,
      inOfficeCount,
      fieldActiveCount,
      leaveCount,
      unclockedCount
    };
  }, [employees, attendanceLogs, todayStr]);

  // Filtered attendance records
  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      // Type filter
      if (filterType === "office") {
        if (!log.type.includes("辦公室")) return false;
      } else if (filterType === "field") {
        if (!log.type.includes("外勤")) return false;
      } else if (filterType === "leave_ot") {
        if (!log.type.includes("請假") && !log.type.includes("加班")) return false;
      }

      // Dept filter
      if (deptFilter !== "all" && log.dept !== deptFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = log.empName.toLowerCase().includes(q);
        const matchEmpId = log.empId.toLowerCase().includes(q);
        const matchDept = log.dept.toLowerCase().includes(q);
        const matchType = log.type.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchIp = (log.ipLocation || "").toLowerCase().includes(q);
        const matchWorkLog = (log.workLog || "").toLowerCase().includes(q);
        if (!matchName && !matchEmpId && !matchDept && !matchType && !matchDetails && !matchIp && !matchWorkLog) {
          return false;
        }
      }

      return true;
    });
  }, [attendanceLogs, filterType, deptFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      onAddToast({
        type: "warning",
        title: "無出勤資料可匯出",
        message: "當前篩選條件下沒有任何出勤紀錄。"
      });
      return;
    }
    exportAttendanceCSV(filteredLogs);
    onAddToast({
      type: "success",
      title: "CSV 報表已匯出",
      message: `已成功產生包含 UTF-8 BOM 之 ${filteredLogs.length} 筆出勤紀錄檔案。`
    });
  };

  // Doughnut Chart Data calculation
  const chartSlices = useMemo(() => {
    const total = stats.totalStaff || 1;
    const slices = [
      { label: "辦公室在勤", count: stats.inOfficeCount, color: "#10b981", percent: Math.round((stats.inOfficeCount / total) * 100) },
      { label: "外勤專案", count: stats.fieldActiveCount, color: "#3b82f6", percent: Math.round((stats.fieldActiveCount / total) * 100) },
      { label: "請假登記", count: stats.leaveCount, color: "#a855f7", percent: Math.round((stats.leaveCount / total) * 100) },
      { label: "未打卡/已下班", count: stats.unclockedCount, color: "#64748b", percent: Math.max(0, 100 - Math.round((stats.inOfficeCount / total) * 100) - Math.round((stats.fieldActiveCount / total) * 100) - Math.round((stats.leaveCount / total) * 100)) }
    ];
    return slices;
  }, [stats]);

  // SVG Doughnut geometry calculation
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div id="admin-dashboard-module" className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              模組 D：管理端出勤看板與統計
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            即時監控全體同仁在勤狀態、出勤比例圓餅圖分析，並支援無亂碼 UTF-8 BOM CSV 匯出。
          </p>
        </div>

        {/* Top Buttons: Personnel Management, Refresh & Export CSV */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToEmployees && (
            <button
              onClick={onNavigateToEmployees}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold transition cursor-pointer shadow-sm"
              title="前往人員組織與名冊管理區塊"
            >
              <Users className="w-3.5 h-3.5" />
              <span>人員組織管理 ({employees.length})</span>
            </button>
          )}

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
              title="重新載入資料庫最新狀態"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新整理</span>
            </button>
          )}

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition cursor-pointer"
            title="匯出包含 UTF-8 BOM 標頭之 CSV 檔案 (Excel 開啟不亂碼)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>匯出 Excel CSV (UTF-8 BOM)</span>
          </button>
        </div>
      </div>

      {/* 4 Real-time KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">總同仁編制人數</span>
            <div className="text-2xl font-bold text-white tracking-tight mt-0.5">
              {stats.totalStaff}{" "}
              <span className="text-xs text-slate-400 font-normal">人</span>
            </div>
          </div>
        </div>

        {/* In-Office Present */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">辦公室在勤人數</span>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight mt-0.5">
              {stats.inOfficeCount}{" "}
              <span className="text-xs text-slate-400 font-normal">人</span>
            </div>
          </div>
        </div>

        {/* Field Active */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">外勤專案出勤</span>
            <div className="text-2xl font-bold text-cyan-400 tracking-tight mt-0.5">
              {stats.fieldActiveCount}{" "}
              <span className="text-xs text-slate-400 font-normal">人</span>
            </div>
          </div>
        </div>

        {/* On Leave */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">請假 / 缺勤登記</span>
            <div className="text-2xl font-bold text-purple-400 tracking-tight mt-0.5">
              {stats.leaveCount}{" "}
              <span className="text-xs text-slate-400 font-normal">人</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Doughnut Chart & Department Breakdown (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Doughnut Chart Visualization (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">出勤狀態動態圓餅比例 (Doughnut Chart)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">今日即時分析</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
            {/* SVG Doughnut */}
            <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth="18"
                />

                {chartSlices.map((slice, i) => {
                  const strokeDasharray = `${(slice.count / (stats.totalStaff || 1)) * circumference} ${circumference}`;
                  const strokeDashoffset = -cumulativeOffset;
                  cumulativeOffset += (slice.count / (stats.totalStaff || 1)) * circumference;

                  if (slice.count === 0) return null;

                  return (
                    <circle
                      key={i}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="18"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-700 ease-out"
                    />
                  );
                })}
              </svg>

              {/* Inner Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400">總同仁</span>
                <span className="text-2xl font-bold text-white font-mono leading-none">
                  {stats.totalStaff}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">人</span>
              </div>
            </div>

            {/* Slices Legend */}
            <div className="space-y-2.5 w-full sm:w-auto">
              {chartSlices.map((slice, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-slate-300 font-medium">{slice.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-white font-bold">{slice.count} 人</span>
                    <span className="text-slate-400 text-[11px]">({slice.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 text-center">
            圖表即時與打卡紀錄雙向連動，打卡後自動刷新四種出勤狀態佔比。
          </div>
        </div>

        {/* Department Roster Snapshot (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">部門同仁即時概況</h3>
            </div>
            <span className="text-xs text-slate-400">
              今日出勤率:{" "}
              <strong className="text-emerald-400 font-mono">
                {Math.round(((stats.inOfficeCount + stats.fieldActiveCount) / (stats.totalStaff || 1)) * 100)}%
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3 overflow-y-auto max-h-[220px]">
            {employees.map((emp) => {
              // Get today latest log for this emp
              const empLogs = attendanceLogs
                .filter((l) => l.empId === emp.id && l.date === todayStr)
                .sort((a, b) => b.timestamp - a.timestamp);
              const latest = empLogs[0];

              let statusText = "未打卡";
              let badgeStyle = "bg-slate-800 text-slate-400 border-slate-700";

              if (latest) {
                if (latest.type === "辦公室上班" || latest.type === "暫離返回") {
                  statusText = `在勤 (${latest.time})`;
                  badgeStyle = "bg-emerald-950/60 text-emerald-300 border-emerald-500/40";
                } else if (latest.type === "外勤簽到") {
                  statusText = `外勤 (${latest.time})`;
                  badgeStyle = "bg-blue-950/60 text-blue-300 border-blue-500/40";
                } else if (latest.type === "請假登記") {
                  statusText = "請假中";
                  badgeStyle = "bg-purple-950/60 text-purple-300 border-purple-500/40";
                } else if (latest.type === "辦公室下班" || latest.type === "外勤簽退") {
                  statusText = `已下班 (${latest.time})`;
                  badgeStyle = "bg-slate-800 text-slate-300 border-slate-700";
                } else if (latest.type === "辦公室暫離") {
                  statusText = "午休/暫離";
                  badgeStyle = "bg-amber-950/60 text-amber-300 border-amber-500/40";
                }
              }

              return (
                <div
                  key={emp.id}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg ${emp.avatarBg} text-white font-bold text-xs flex items-center justify-center flex-shrink-0`}
                    >
                      {emp.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{emp.dept} • {emp.role}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${badgeStyle}`}>
                    {statusText}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>標準班表: 09:00 - 18:00</span>
            <span className="text-amber-400 font-mono">午休彈性 12:00-13:30</span>
          </div>
        </div>
      </div>

      {/* Attendance Data Table (出勤明細數據表) */}
      <div id="attendance-table-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Table Controls & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setFilterType("all"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              全部打卡 ({attendanceLogs.length})
            </button>
            <button
              onClick={() => { setFilterType("office"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterType === "office"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              辦公室內勤
            </button>
            <button
              onClick={() => { setFilterType("field"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterType === "field"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              外勤 / 專案
            </button>
            <button
              onClick={() => { setFilterType("leave_ot"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterType === "leave_ot"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              請假與加班
            </button>
          </div>

          {/* Department Filter & Search Box */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Department select */}
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-auto bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有部門 (All Departments)</option>
              <option value="資訊部">資訊部</option>
              <option value="工程部">工程部</option>
              <option value="業務部">業務部</option>
              <option value="管理部">管理部</option>
              <option value="工安部">工安部</option>
              <option value="財務部">財務部</option>
            </select>

            {/* Keyword Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="搜尋姓名、編號、專案、IP..."
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">員工資訊</th>
                <th className="py-3 px-3">打卡類型</th>
                <th className="py-3 px-3">日期 / 時間</th>
                <th className="py-3 px-4">專案 / 明細說明</th>
                <th className="py-3 px-3">網路 IP / GPS 座標</th>
                <th className="py-3 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p>沒有符合條件的出勤紀錄</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
                  if (log.type === "辦公室上班") {
                    badgeColor = "bg-emerald-950/70 text-emerald-300 border-emerald-500/40";
                  } else if (log.type === "辦公室下班") {
                    badgeColor = "bg-blue-950/70 text-blue-300 border-blue-500/40";
                  } else if (log.type === "外勤簽到") {
                    badgeColor = "bg-cyan-950/70 text-cyan-300 border-cyan-500/40";
                  } else if (log.type === "外勤簽退") {
                    badgeColor = "bg-amber-950/70 text-amber-300 border-amber-500/40";
                  } else if (log.type === "請假登記") {
                    badgeColor = "bg-purple-950/70 text-purple-300 border-purple-500/40";
                  } else if (log.type === "加班登記") {
                    badgeColor = "bg-teal-950/70 text-teal-300 border-teal-500/40";
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{log.empName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {log.empId} • {log.dept}
                        </div>
                      </td>

                      {/* Punch Type */}
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badgeColor} inline-block`}>
                          {log.type}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3">
                        <div className="font-bold font-mono text-amber-300">{log.time}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.date}</div>
                      </td>

                      {/* Details & Work Log */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-200 truncate">{log.details}</div>
                        {log.workLog && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5" title={log.workLog}>
                            {log.workLog}
                          </div>
                        )}
                      </td>

                      {/* IP / GPS */}
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-400 max-w-[200px] truncate" title={log.ipLocation}>
                        {log.ipLocation}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLogForModal(log)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="檢視詳細日誌"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteLog(log.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                            title="刪除此紀錄"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-slate-400">
          <div>
            顯示第 <span className="font-bold text-white">{(currentPage - 1) * pageSize + 1}</span> 到{" "}
            <span className="font-bold text-white">
              {Math.min(currentPage * pageSize, filteredLogs.length)}
            </span>{" "}
            筆，共 <span className="font-bold text-white">{filteredLogs.length}</span> 筆紀錄
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-mono font-bold text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLogForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedLogForModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                LOG
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">打卡明細紀錄詳情</h3>
                <span className="text-xs font-mono text-slate-400">ID: {selectedLogForModal.id}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl">
                <div>
                  <span className="text-slate-500 block">打卡同仁</span>
                  <span className="font-bold text-white">{selectedLogForModal.empName} ({selectedLogForModal.empId})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">所屬部門 / 職務</span>
                  <span className="font-bold text-white">{selectedLogForModal.dept} {selectedLogForModal.role ? `• ${selectedLogForModal.role}` : ""}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl">
                <div>
                  <span className="text-slate-500 block">打卡類型</span>
                  <span className="font-bold text-emerald-400">{selectedLogForModal.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">壓印日期與時間</span>
                  <span className="font-bold font-mono text-amber-300">{selectedLogForModal.date} {selectedLogForModal.time}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl space-y-1">
                <span className="text-slate-500 block">專案 / 明細說明</span>
                <span className="text-slate-200">{selectedLogForModal.details}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl space-y-1">
                <span className="text-slate-500 block">網路 IP / GPS 座標</span>
                <span className="font-mono text-slate-300 break-all">{selectedLogForModal.ipLocation}</span>
              </div>

              {selectedLogForModal.workLog && (
                <div className="bg-slate-950 p-3 rounded-xl space-y-1">
                  <span className="text-slate-500 block">工作日誌 / 事由紀錄</span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedLogForModal.workLog}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLogForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
