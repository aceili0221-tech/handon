import React, { useState } from "react";
import {
  Building,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Coffee,
  RotateCcw,
  ShieldCheck,
  Wifi,
  Calendar,
  Sparkles,
  Briefcase,
  History,
  Phone,
  Mail
} from "lucide-react";
import { Employee, AttendanceLog } from "../types";
import { formatDateTime, calculateTodayWorkHours } from "../utils/helpers";

interface OfficeAttendanceProps {
  employees: Employee[];
  selectedEmpId: string;
  onSelectEmployee: (empId: string) => void;
  attendanceLogs: AttendanceLog[];
  onPunchIn: (log: Omit<AttendanceLog, "id" | "timestamp" | "synced">) => void;
}

export const OfficeAttendance: React.FC<OfficeAttendanceProps> = ({
  employees,
  selectedEmpId,
  onSelectEmployee,
  attendanceLogs,
  onPunchIn
}) => {
  const [remarks, setRemarks] = useState("");
  const currentEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];

  const now = new Date();
  const timeInfo = formatDateTime(now);
  const todayStr = timeInfo.dateStr;

  // Filter today's punch logs for this employee
  const todayLogs = attendanceLogs
    .filter((log) => log.empId === currentEmp.id && log.date === todayStr)
    .sort((a, b) => b.timestamp - a.timestamp); // latest first

  // Check work hours status
  const workHoursInfo = calculateTodayWorkHours(attendanceLogs, currentEmp.id, todayStr);

  // Latest status for today
  const latestLog = todayLogs[0];
  let punchStatusText = "今日尚未打卡";
  let statusBadgeColor = "bg-slate-800 text-slate-300 border-slate-700";

  if (latestLog) {
    if (latestLog.type === "辦公室上班" || latestLog.type === "外勤簽到" || latestLog.type === "暫離返回") {
      punchStatusText = "在勤工作中 (Shift Active)";
      statusBadgeColor = "bg-emerald-950/60 text-emerald-300 border-emerald-500/40";
    } else if (latestLog.type === "辦公室下班" || latestLog.type === "外勤簽退") {
      punchStatusText = "已完成今日工時 (Shift Ended)";
      statusBadgeColor = "bg-blue-950/60 text-blue-300 border-blue-500/40";
    } else if (latestLog.type === "辦公室暫離") {
      punchStatusText = "暫離外出/午休中 (On Break)";
      statusBadgeColor = "bg-amber-950/60 text-amber-300 border-amber-500/40";
    } else if (latestLog.type === "請假登記") {
      punchStatusText = "請假登記中 (On Leave)";
      statusBadgeColor = "bg-purple-950/60 text-purple-300 border-purple-500/40";
    }
  }

  const handleStartShift = () => {
    const current = formatDateTime();
    onPunchIn({
      empId: currentEmp.id,
      empName: currentEmp.name,
      dept: currentEmp.dept,
      role: currentEmp.role,
      type: "辦公室上班",
      date: current.dateStr,
      time: current.timeStr,
      details: "總部辦公室區域網路 (LAN 內網正常簽到)",
      ipLocation: "192.168.1.105 (辦公室 Wi-Fi)",
      workLog: remarks.trim() || "準時上班出勤，展開今日例行業務。",
      status: "normal"
    });
    setRemarks("");
  };

  const handleEndShift = () => {
    const current = formatDateTime();
    const durationNote = workHoursInfo.hasStarted
      ? `本日工時結算：${workHoursInfo.durationText}`
      : "本日下班打卡";

    onPunchIn({
      empId: currentEmp.id,
      empName: currentEmp.name,
      dept: currentEmp.dept,
      role: currentEmp.role,
      type: "辦公室下班",
      date: current.dateStr,
      time: current.timeStr,
      details: `總部辦公室區域網路 (${durationNote})`,
      ipLocation: "192.168.1.105 (辦公室 Wi-Fi)",
      workLog: remarks.trim() || `已完成本日工作任務離退，${durationNote}。`,
      status: "normal"
    });
    setRemarks("");
  };

  const handleBreakOut = () => {
    const current = formatDateTime();
    onPunchIn({
      empId: currentEmp.id,
      empName: currentEmp.name,
      dept: currentEmp.dept,
      role: currentEmp.role,
      type: "辦公室暫離",
      date: current.dateStr,
      time: current.timeStr,
      details: "午休用餐 / 中途公出暫離",
      ipLocation: "192.168.1.105 (辦公室 Wi-Fi)",
      workLog: remarks.trim() || "午休時段用餐 / 短暫離席外出。",
      status: "break"
    });
    setRemarks("");
  };

  const handleReturnFromBreak = () => {
    const current = formatDateTime();
    onPunchIn({
      empId: currentEmp.id,
      empName: currentEmp.name,
      dept: currentEmp.dept,
      role: currentEmp.role,
      type: "暫離返回",
      date: current.dateStr,
      time: current.timeStr,
      details: "午休 / 暫離結束返回工位",
      ipLocation: "192.168.1.105 (辦公室 Wi-Fi)",
      workLog: remarks.trim() || "返回辦公室工位，繼續執行工作任務。",
      status: "normal"
    });
    setRemarks("");
  };

  return (
    <div id="office-attendance-module" className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              模組 A：辦公室內勤打卡
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            適用於總部與分公司內勤同仁，記錄精確上班、下班與中途工時結算。
          </p>
        </div>

        {/* Network Location Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 shadow-sm">
          <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>內部網段: 192.168.1.105 (辦公室 Wi-Fi)</span>
          <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded">
            已驗證
          </span>
        </div>
      </div>

      {/* Main Content Grid: Left Punch Action / Right History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Employee Card & Clock-In Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Employee Selector Dropdown */}
          <div id="employee-select-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-400" />
              <span>選擇打卡同仁身分 (員工切換)</span>
            </label>
            <div className="relative">
              <select
                id="select-employee"
                value={selectedEmpId}
                onChange={(e) => onSelectEmployee(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-slate-900 py-2">
                    {emp.name} ({emp.id}) — {emp.dept} / {emp.role}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Employee Profile Detailed Badge Card */}
            <div id="emp-profile-card" className="mt-5 p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-14 h-14 rounded-2xl ${currentEmp.avatarBg} text-white font-bold text-xl flex items-center justify-center shadow-lg flex-shrink-0 border-2 border-white/10`}
                >
                  {currentEmp.name.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{currentEmp.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                      {currentEmp.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentEmp.dept}</span>
                    <span>•</span>
                    <span className="text-slate-200 font-medium">{currentEmp.role}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      班表: {currentEmp.shift}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Status Badge */}
              <div className="flex flex-col sm:items-end justify-center pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <span className="text-[11px] text-slate-400 mb-1">今日出勤狀態</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeColor}`}>
                  {punchStatusText}
                </span>
                {workHoursInfo.hasStarted && (
                  <span className="text-[11px] text-amber-400 font-mono mt-1">
                    {workHoursInfo.durationText}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Clock-in Action Controls Card */}
          <div id="punch-actions-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>內勤打卡操作區</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                壓印時間: {timeInfo.timeStr}
              </span>
            </div>

            {/* Optional work notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                打卡備註 / 交接事項 (選填)
              </label>
              <input
                id="input-office-remarks"
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="例如：提早到場準備月會報告、下班前往客戶處進行例行交辦..."
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-500"
              />
            </div>

            {/* Main Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Start Shift */}
              <button
                id="btn-start-shift"
                onClick={handleStartShift}
                className="flex items-center justify-center gap-3 py-4 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-900/30 transition transform active:scale-[0.98] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                </div>
                <div className="text-left">
                  <div className="leading-tight">上班打卡</div>
                  <div className="text-[11px] text-emerald-100 font-normal">Start Shift (09:00)</div>
                </div>
              </button>

              {/* End Shift */}
              <button
                id="btn-end-shift"
                onClick={handleEndShift}
                className="flex items-center justify-center gap-3 py-4 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-blue-900/30 transition transform active:scale-[0.98] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Square className="w-4 h-4 fill-white text-white" />
                </div>
                <div className="text-left">
                  <div className="leading-tight">下班打卡</div>
                  <div className="text-[11px] text-blue-100 font-normal">End Shift (結算工時)</div>
                </div>
              </button>
            </div>

            {/* Secondary Action Buttons: Break & Return */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                id="btn-break-out"
                onClick={handleBreakOut}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition active:scale-[0.98] cursor-pointer"
              >
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>中途暫離 / 午休</span>
              </button>

              <button
                id="btn-return-shift"
                onClick={handleReturnFromBreak}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition active:scale-[0.98] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>暫離返回工位</span>
              </button>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                系統自動比對內網 IP 位址與 MAC 雜湊指紋，嚴防代打卡與偽冒行為。
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Today's Punch History Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div id="today-history-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">個人今日打卡歷程</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {todayLogs.length} 筆紀錄
              </span>
            </div>

            {/* Timeline Stream */}
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
              {todayLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center">
                  <Clock className="w-10 h-10 text-slate-600 mb-2 stroke-1" />
                  <p className="text-sm">今日尚無打卡紀錄</p>
                  <p className="text-xs text-slate-600 mt-1">請點選左側「上班打卡」開始計時</p>
                </div>
              ) : (
                todayLogs.map((log, idx) => {
                  let badgeBg = "bg-blue-900/40 text-blue-300 border-blue-700/40";
                  if (log.type === "辦公室上班") {
                    badgeBg = "bg-emerald-900/40 text-emerald-300 border-emerald-700/40";
                  } else if (log.type === "辦公室下班") {
                    badgeBg = "bg-indigo-900/40 text-indigo-300 border-indigo-700/40";
                  } else if (log.type === "辦公室暫離") {
                    badgeBg = "bg-amber-900/40 text-amber-300 border-amber-700/40";
                  } else if (log.type === "請假登記") {
                    badgeBg = "bg-purple-900/40 text-purple-300 border-purple-700/40";
                  }

                  return (
                    <div
                      key={log.id}
                      id={`log-item-${log.id}`}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badgeBg}`}>
                          {log.type}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-300">
                          {log.time}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 leading-snug">
                        {log.details}
                      </div>

                      {log.workLog && (
                        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                          {log.workLog}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/40">
                        <span>{log.ipLocation}</span>
                        <span className="font-mono">{log.id}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Summary Footer */}
            {todayLogs.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>出勤時間計算</span>
                <span className="font-mono font-bold text-emerald-400">
                  {workHoursInfo.durationText}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
