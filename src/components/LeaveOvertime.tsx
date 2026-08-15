import React, { useState } from "react";
import {
  CalendarCheck,
  Clock,
  User,
  Plus,
  Minus,
  FileText,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Send
} from "lucide-react";
import { Employee, AttendanceLog } from "../types";
import { formatDateTime } from "../utils/helpers";

interface LeaveOvertimeProps {
  employees: Employee[];
  selectedEmpId: string;
  onSelectEmployee: (empId: string) => void;
  onPunchIn: (log: Omit<AttendanceLog, "id" | "timestamp" | "synced">) => void;
  onAddToast: (toast: { type: "success" | "warning" | "error" | "info"; title: string; message: string }) => void;
}

export const LeaveOvertime: React.FC<LeaveOvertimeProps> = ({
  employees,
  selectedEmpId,
  onSelectEmployee,
  onPunchIn,
  onAddToast
}) => {
  const [category, setCategory] = useState<string>("特別休假");
  const [hours, setHours] = useState<number>(8.0);
  const [reason, setReason] = useState<string>("");
  const [agentEmpId, setAgentEmpId] = useState<string>("");

  // Default start and end datetime-local strings
  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [startDate, setStartDate] = useState(`${todayDateStr}T09:00`);
  const [endDate, setEndDate] = useState(`${todayDateStr}T18:00`);

  const currentEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];
  const agentEmp = employees.find((e) => e.id === agentEmpId) || employees.find((e) => e.id !== currentEmp.id);

  const categories = [
    { id: "特別休假", label: "特別休假 (Annual Leave)", type: "leave", badgeColor: "border-blue-500/40 text-blue-300" },
    { id: "事假", label: "事假 (Personal Leave)", type: "leave", badgeColor: "border-amber-500/40 text-amber-300" },
    { id: "病假", label: "病假 (Sick Leave)", type: "leave", badgeColor: "border-rose-500/40 text-rose-300" },
    { id: "公假/外訓", label: "公假 / 外訓 (Training)", type: "leave", badgeColor: "border-cyan-500/40 text-cyan-300" },
    { id: "婚/喪/產假", label: "婚 / 喪 / 產假 (Special)", type: "leave", badgeColor: "border-purple-500/40 text-purple-300" },
    { id: "平日加班", label: "平日加班 (Weekday Overtime)", type: "overtime", badgeColor: "border-emerald-500/40 text-emerald-300" },
    { id: "假日加班", label: "假日加班 (Weekend Overtime)", type: "overtime", badgeColor: "border-teal-500/40 text-teal-300" }
  ];

  const handleQuickPreset = (hrs: number, typeLabel: string, sTime: string, eTime: string) => {
    setHours(hrs);
    setCategory(typeLabel);
    setStartDate(`${todayDateStr}T${sTime}`);
    setEndDate(`${todayDateStr}T${eTime}`);
  };

  const handleAdjustHours = (delta: number) => {
    setHours((prev) => {
      const next = Math.max(0.5, Math.min(48, prev + delta));
      return Number(next.toFixed(1));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      onAddToast({
        type: "warning",
        title: "請填寫事由說明",
        message: "請輸入具體的請假或加班工作內容以供存查。"
      });
      return;
    }

    const current = formatDateTime();
    const isOvertime = category.includes("加班");
    const punchType = isOvertime ? "加班登記" : "請假登記";
    const agentText = agentEmp ? `職務代理人：${agentEmp.name} (${agentEmp.dept})` : "無需代理人";

    const sDisp = startDate.replace("T", " ");
    const eDisp = endDate.replace("T", " ");
    const details = `${category} (${hours} 小時) [${sDisp} ~ ${eDisp}]`;

    onPunchIn({
      empId: currentEmp.id,
      empName: currentEmp.name,
      dept: currentEmp.dept,
      role: currentEmp.role,
      type: punchType,
      date: current.dateStr,
      time: current.timeStr,
      details,
      ipLocation: "系統審核登記 (本機儲存)",
      workLog: `事由：${reason.trim()}。${agentText}。`,
      status: isOvertime ? "overtime" : "leave"
    });

    onAddToast({
      type: "success",
      title: "表單登記成功",
      message: `已建立 ${currentEmp.name} 的 ${category} (${hours} 小時) 紀錄。`
    });

    setReason("");
  };

  return (
    <div id="leave-overtime-module" className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              模組 C：請假與加班登記
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            提供特休、事病假、公假及平假日加班申請登記，自動壓印時間戳並同步至統計看板。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container (8 cols) */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
          >
            {/* Employee Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>申請人員</span>
                </label>
                <select
                  id="leave-emp-select"
                  value={selectedEmpId}
                  onChange={(e) => onSelectEmployee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id}) - {emp.dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>職務代理人 (審核/交接)</span>
                </label>
                <select
                  id="leave-agent-select"
                  value={agentEmpId}
                  onChange={(e) => setAgentEmpId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- 請選擇職務代理人 --</option>
                  {employees
                    .filter((e) => e.id !== selectedEmpId)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.dept} - {emp.role})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Category Select Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                申請類別選擇
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {categories.map((c) => {
                  const isSelected = category === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                        isSelected
                          ? "bg-purple-600/30 border-purple-500 text-white shadow-lg shadow-purple-900/20 font-bold"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                常用快捷預設
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPreset(4.0, "特別休假", "09:00", "13:00")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-blue-300 border border-slate-700 transition"
                >
                  上午請假 (4 hr)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(4.0, "特別休假", "14:00", "18:00")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-blue-300 border border-slate-700 transition"
                >
                  下午請假 (4 hr)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(8.0, "特別休假", "09:00", "18:00")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-emerald-300 border border-slate-700 transition"
                >
                  全天特休 (8 hr)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(2.0, "平日加班", "18:30", "20:30")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 border border-slate-700 transition"
                >
                  夜間加班 (2 hr)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(3.5, "平日加班", "18:30", "22:00")}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 border border-slate-700 transition"
                >
                  夜間加班 (3.5 hr)
                </button>
              </div>
            </div>

            {/* DateTime Pickers & Fine-tune Hours Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Start DateTime */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  開始時間 (HTML5 datetime-local)
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* End DateTime */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  結束時間 (HTML5 datetime-local)
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Hours Stepper (0.5h step) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  申請時數 (0.5hr 為單位)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustHours(-0.5)}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 transition active:scale-95"
                    title="減少 0.5 小時"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-center py-2 rounded-xl text-sm">
                    {hours.toFixed(1)} hr
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdjustHours(0.5)}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 transition active:scale-95"
                    title="增加 0.5 小時"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>事由說明 / 加班工作項目 (必填)</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例如：私人家庭事務請假、配合案場夜間管線吊掛工程加班、參加勞動部工安證照回訓課程..."
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-slate-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-leave-ot"
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-purple-900/30 transition transform active:scale-[0.99] cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>確認送出申請登記 (自動壓印時間戳)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Info / Rules Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>差勤核算規範說明</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-semibold text-blue-400">特別休假 (特休)</span>
                <p className="text-slate-400">以 0.5 小時為最小申請單位，須於前一日提出並指定職務代理人。</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-semibold text-amber-400">平日 / 假日加班</span>
                <p className="text-slate-400">加班時數滿 30 分鐘起算，依勞基法規定換算補休或加班工資。</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-semibold text-purple-400">系統即時連動</span>
                <p className="text-slate-400">表單送出後將即時壓印系統時間戳，並自動反映於管理端看板統計中。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
