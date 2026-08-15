import React, { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Filter,
  Download,
  RotateCcw,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Clock,
  Building,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  LayoutGrid,
  ListFilter,
  Check,
  Info,
  Calendar,
  Laptop,
  Plane,
  FileText,
  ShieldCheck
} from "lucide-react";
import { Employee, AttendanceLog, EmploymentStatus } from "../types";
import { exportEmployeesCSV, formatDateTime } from "../utils/helpers";

interface EmployeeManagementProps {
  employees: Employee[];
  attendanceLogs: AttendanceLog[];
  onAddEmployee: (employee: Employee) => Promise<void> | void;
  onUpdateEmployee: (employee: Employee) => Promise<void> | void;
  onDeleteEmployee: (id: string) => Promise<void> | void;
  onResetEmployees: () => Promise<void> | void;
  onAddToast: (toast: { type: "success" | "warning" | "error" | "info"; title: string; message: string }) => void;
}

const AVATAR_COLORS = [
  { name: "經典藍", bg: "bg-blue-600", border: "border-blue-500" },
  { name: "翡翠綠", bg: "bg-emerald-600", border: "border-emerald-500" },
  { name: "琥珀金", bg: "bg-amber-600", border: "border-amber-500" },
  { name: "紫羅蘭", bg: "bg-purple-600", border: "border-purple-500" },
  { name: "玫瑰紅", bg: "bg-rose-600", border: "border-rose-500" },
  { name: "青檸靛", bg: "bg-indigo-600", border: "border-indigo-500" },
  { name: "松石綠", bg: "bg-teal-600", border: "border-teal-500" },
  { name: "天際青", bg: "bg-cyan-600", border: "border-cyan-500" },
  { name: "艷陽橙", bg: "bg-orange-600", border: "border-orange-500" }
];

const PRESET_DEPTS = ["資訊部", "工程部", "業務部", "管理部", "工安部", "財務部", "研發部", "行銷部", "總經理室"];
const PRESET_SHIFTS = [
  "09:00 - 18:00 (標準班)",
  "08:30 - 17:30 (責任制)",
  "09:00 - 18:00 (彈性 30m)",
  "09:00 - 18:00 (外勤彈性)",
  "08:00 - 17:00 (案場巡檢)",
  "10:00 - 19:00 (晚班/工程)",
  "自訂班別"
];

const STATUS_CONFIG: Record<
  EmploymentStatus,
  { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }
> = {
  active: { label: "在職出勤", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: UserCheck },
  leave: { label: "休假請假", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", icon: Calendar },
  wfh: { label: "居家遠端 (WFH)", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", icon: Laptop },
  business_trip: { label: "公差出差", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", icon: Plane },
  resigned: { label: "已離職/除名", bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700", icon: UserX }
};

interface EmployeeStatusInfo {
  status: string;
  type: string;
  time: string;
  badgeColor: string;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  attendanceLogs,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onResetEmployees,
  onAddToast
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Form State for Add / Edit
  const [formId, setFormId] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formDept, setFormDept] = useState<string>("資訊部");
  const [formCustomDept, setFormCustomDept] = useState<string>("");
  const [formRole, setFormRole] = useState<string>("");
  const [formShift, setFormShift] = useState<string>(PRESET_SHIFTS[0]);
  const [formCustomShift, setFormCustomShift] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formStatus, setFormStatus] = useState<EmploymentStatus>("active");
  const [formJoinDate, setFormJoinDate] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formAvatarBg, setFormAvatarBg] = useState<string>(AVATAR_COLORS[0].bg);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const todayStr = formatDateTime().dateStr;

  // Real-time status lookup map for each employee based on logs + employee record
  const employeeStatusMap = useMemo<Map<string, EmployeeStatusInfo>>(() => {
    const map = new Map<string, EmployeeStatusInfo>();

    employees.forEach((emp) => {
      const logs = attendanceLogs
        .filter((l) => l.empId === emp.id && l.date === todayStr)
        .sort((a, b) => b.timestamp - a.timestamp);

      const latest = logs[0];
      if (!latest) {
        // Fallback to employee status if no log today
        if (emp.status === "leave") {
          map.set(emp.id, {
            status: "休假登記中",
            type: "休假",
            time: "--",
            badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30"
          });
        } else if (emp.status === "wfh") {
          map.set(emp.id, {
            status: "居家遠端辦公",
            type: "WFH",
            time: "--",
            badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30"
          });
        } else if (emp.status === "business_trip") {
          map.set(emp.id, {
            status: "公差出差中",
            type: "出差",
            time: "--",
            badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30"
          });
        } else {
          map.set(emp.id, {
            status: "今日尚未打卡",
            type: "未簽到",
            time: "--",
            badgeColor: "bg-slate-800 text-slate-400 border-slate-700"
          });
        }
        return;
      }

      if (latest.type === "辦公室上班" || latest.type === "暫離返回") {
        map.set(emp.id, {
          status: "辦公室在勤中",
          type: latest.type,
          time: latest.time,
          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        });
      } else if (latest.type === "外勤簽到") {
        map.set(emp.id, {
          status: "外勤專案案場中",
          type: latest.type,
          time: latest.time,
          badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30"
        });
      } else if (latest.type === "請假登記") {
        map.set(emp.id, {
          status: "休假請假審核中",
          type: latest.type,
          time: latest.time,
          badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30"
        });
      } else if (latest.type === "辦公室下班" || latest.type === "外勤簽退") {
        map.set(emp.id, {
          status: "已完成本日下班",
          type: latest.type,
          time: latest.time,
          badgeColor: "bg-slate-700/50 text-slate-300 border-slate-600"
        });
      } else {
        map.set(emp.id, {
          status: latest.type,
          type: latest.type,
          time: latest.time,
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30"
        });
      }
    });

    return map;
  }, [employees, attendanceLogs, todayStr]);

  // Today active staff count
  const activeStaffTodayCount = useMemo(() => {
    let count = 0;
    employeeStatusMap.forEach((info) => {
      if (info.status.includes("在勤") || info.status.includes("案場") || info.status.includes("遠端")) {
        count++;
      }
    });
    return count;
  }, [employeeStatusMap]);

  // Status breakdown counts
  const statusStats = useMemo(() => {
    let active = 0;
    let leave = 0;
    let wfh = 0;
    let businessTrip = 0;

    employees.forEach((e) => {
      const s = e.status || "active";
      if (s === "active") active++;
      else if (s === "leave") leave++;
      else if (s === "wfh") wfh++;
      else if (s === "business_trip") businessTrip++;
    });

    return { active, leave, wfh, businessTrip };
  }, [employees]);

  // Department counts
  const deptList = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach((emp) => {
      counts.set(emp.dept, (counts.get(emp.dept) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([dept, count]) => ({ dept, count }));
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Status filter
      if (statusFilter !== "all") {
        const s = emp.status || "active";
        if (s !== statusFilter) return false;
      }

      // Dept filter
      if (deptFilter !== "all" && emp.dept !== deptFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchId = emp.id.toLowerCase().includes(q);
        const matchDept = emp.dept.toLowerCase().includes(q);
        const matchRole = emp.role.toLowerCase().includes(q);
        const matchPhone = emp.phone.toLowerCase().includes(q);
        const matchEmail = emp.email.toLowerCase().includes(q);
        const matchNotes = (emp.notes || "").toLowerCase().includes(q);
        return matchName || matchId || matchDept || matchRole || matchPhone || matchEmail || matchNotes;
      }

      return true;
    });
  }, [employees, deptFilter, statusFilter, searchQuery]);

  // Quick toggle status directly from card/table
  const handleQuickStatusChange = async (emp: Employee, newStatus: EmploymentStatus) => {
    const updated: Employee = { ...emp, status: newStatus };
    await onUpdateEmployee(updated);
    onAddToast({
      type: "success",
      title: "在職狀況已切換",
      message: `${emp.name} 的狀況已變更為「${STATUS_CONFIG[newStatus].label}」。`
    });
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const nextNum = employees.length + 1;
    let autoId = `EMP-${String(nextNum).padStart(3, "0")}`;
    while (employees.some((e) => e.id === autoId)) {
      autoId = `EMP-${String(parseInt(autoId.replace("EMP-", ""), 10) + 1).padStart(3, "0")}`;
    }

    setFormId(autoId);
    setFormName("");
    setFormDept("資訊部");
    setFormCustomDept("");
    setFormRole("");
    setFormShift(PRESET_SHIFTS[0]);
    setFormCustomShift("");
    setFormPhone("");
    setFormEmail("");
    setFormStatus("active");
    setFormJoinDate(formatDateTime().dateStr);
    setFormNotes("");
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)].bg;
    setFormAvatarBg(randomColor);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormId(emp.id);
    setFormName(emp.name);

    if (PRESET_DEPTS.includes(emp.dept)) {
      setFormDept(emp.dept);
      setFormCustomDept("");
    } else {
      setFormDept("自訂部門");
      setFormCustomDept(emp.dept);
    }

    setFormRole(emp.role);

    if (PRESET_SHIFTS.includes(emp.shift)) {
      setFormShift(emp.shift);
      setFormCustomShift("");
    } else {
      setFormShift("自訂班別");
      setFormCustomShift(emp.shift);
    }

    setFormPhone(emp.phone);
    setFormEmail(emp.email);
    setFormStatus(emp.status || "active");
    setFormJoinDate(emp.joinDate || formatDateTime().dateStr);
    setFormNotes(emp.notes || "");
    setFormAvatarBg(emp.avatarBg || AVATAR_COLORS[0].bg);
    setFormErrors({});
  };

  // Validate form
  const validateForm = (isEdit: boolean): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formId.trim()) {
      errors.id = "員工編號為必填";
    } else if (!isEdit && employees.some((e) => e.id === formId.trim())) {
      errors.id = "該員工編號已存在，請使用不同編號";
    }

    if (!formName.trim()) {
      errors.name = "員工姓名為必填";
    }

    const finalDept = formDept === "自訂部門" ? formCustomDept.trim() : formDept;
    if (!finalDept) {
      errors.dept = "請選擇或填寫所屬部門";
    }

    if (!formRole.trim()) {
      errors.role = "職稱角色為必填";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save new employee
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    const finalDept = formDept === "自訂部門" ? formCustomDept.trim() : formDept;
    const finalShift = formShift === "自訂班別" ? (formCustomShift.trim() || "09:00 - 18:00 (標準班)") : formShift;

    const newEmp: Employee = {
      id: formId.trim().toUpperCase(),
      name: formName.trim(),
      dept: finalDept,
      role: formRole.trim(),
      shift: finalShift,
      phone: formPhone.trim() || "未填寫",
      email: formEmail.trim() || `${formId.trim().toLowerCase()}@company.internal`,
      status: formStatus,
      joinDate: formJoinDate.trim() || formatDateTime().dateStr,
      notes: formNotes.trim(),
      avatarBg: formAvatarBg
    };

    await onAddEmployee(newEmp);
    setIsAddModalOpen(false);
    onAddToast({
      type: "success",
      title: "員工新增成功",
      message: `已成功將 ${newEmp.name} (${newEmp.id}) 加入企業員工名冊。`
    });
  };

  // Save edit employee
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    if (!validateForm(true)) return;

    const finalDept = formDept === "自訂部門" ? formCustomDept.trim() : formDept;
    const finalShift = formShift === "自訂班別" ? (formCustomShift.trim() || "09:00 - 18:00 (標準班)") : formShift;

    const updatedEmp: Employee = {
      ...editingEmployee,
      name: formName.trim(),
      dept: finalDept,
      role: formRole.trim(),
      shift: finalShift,
      phone: formPhone.trim() || "未填寫",
      email: formEmail.trim() || `${editingEmployee.id.toLowerCase()}@company.internal`,
      status: formStatus,
      joinDate: formJoinDate.trim() || editingEmployee.joinDate,
      notes: formNotes.trim(),
      avatarBg: formAvatarBg
    };

    await onUpdateEmployee(updatedEmp);
    setEditingEmployee(null);
    onAddToast({
      type: "success",
      title: "在職狀況與資料已更新",
      message: `已更新 ${updatedEmp.name} (${updatedEmp.id}) 的在職狀態與員工資料。`
    });
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    const empName = deletingEmployee.name;
    const empId = deletingEmployee.id;

    await onDeleteEmployee(empId);
    setDeletingEmployee(null);
    onAddToast({
      type: "info",
      title: "員工已除名",
      message: `已將 ${empName} (${empId}) 從在職員工名單中移除（歷史出勤紀錄已保留）。`
    });
  };

  // Confirm Reset
  const handleConfirmReset = async () => {
    await onResetEmployees();
    setIsResetConfirmOpen(false);
    onAddToast({
      type: "success",
      title: "員工名冊已重置",
      message: "已還原為 6 位預設示範員工名冊。"
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 via-indigo-600/5 to-transparent rounded-full pointer-events-none blur-3xl" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    管理員專區 • 在職員工狀況與組織管理
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                    在職共 {employees.length} 人
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  即時編輯在職狀況（出勤、請假休假、居家遠端WFH、出差公差）、職務班表與人員除名管理。
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              id="btn-export-employees-csv"
              onClick={() => {
                exportEmployeesCSV(employees);
                onAddToast({
                  type: "success",
                  title: "員工名冊已匯出",
                  message: "已下載包含在職狀況之 UTF-8 BOM 員工名冊 CSV 檔。"
                });
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition cursor-pointer shadow-sm"
              title="匯出 UTF-8 BOM 格式 CSV 員工名冊"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>匯出名冊 (CSV)</span>
            </button>

            <button
              id="btn-reset-employees"
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-xl text-xs sm:text-sm font-medium border border-slate-700/80 transition cursor-pointer"
              title="還原為預設 6 位示範員工"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>重置示範名單</span>
            </button>

            <button
              id="btn-add-employee-modal"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 transition cursor-pointer transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>新增人員入職</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">在職正常出勤</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">{statusStats.active} <span className="text-xs font-normal text-slate-500">人</span></div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">休假 / 請假中</div>
              <div className="text-lg font-bold text-rose-400 font-mono">{statusStats.leave} <span className="text-xs font-normal text-slate-500">人</span></div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">居家遠端 (WFH)</div>
              <div className="text-lg font-bold text-blue-400 font-mono">{statusStats.wfh} <span className="text-xs font-normal text-slate-500">人</span></div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">公差 / 出差中</div>
              <div className="text-lg font-bold text-purple-400 font-mono">{statusStats.businessTrip} <span className="text-xs font-normal text-slate-500">人</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-employees"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋員工姓名、工號、部門、職稱、電話、備註..."
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap mr-1">在職狀況:</span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer border ${
                statusFilter === "all"
                  ? "bg-slate-800 text-white border-slate-600 font-semibold"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              全部 ({employees.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer border ${
                statusFilter === "active"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              在職中 ({statusStats.active})
            </button>
            <button
              onClick={() => setStatusFilter("leave")}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer border ${
                statusFilter === "leave"
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              休假請假 ({statusStats.leave})
            </button>
            <button
              onClick={() => setStatusFilter("wfh")}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer border ${
                statusFilter === "wfh"
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              遠端 WFH ({statusStats.wfh})
            </button>
            <button
              onClick={() => setStatusFilter("business_trip")}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer border ${
                statusFilter === "business_trip"
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              出差 ({statusStats.businessTrip})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="btn-view-grid"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>卡片視圖</span>
              </button>
              <button
                id="btn-view-table"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>清單表格</span>
              </button>
            </div>
          </div>
        </div>

        {/* Department Filter Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> 部門篩選:
          </span>
          <button
            onClick={() => setDeptFilter("all")}
            className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer border ${
              deptFilter === "all"
                ? "bg-blue-600/20 text-blue-300 border-blue-500/40 font-semibold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            全部部門 ({employees.length})
          </button>
          {deptList.map(({ dept, count }) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer border ${
                deptFilter === dept
                  ? "bg-blue-600/20 text-blue-300 border-blue-500/40 font-semibold"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              {dept} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Employees Main List */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-300">找不到符合條件的人員</h3>
            <p className="text-sm text-slate-500">
              {searchQuery ? `找不到與關鍵字「${searchQuery}」相符的員工。` : "目前篩選條件下尚無人員資料。"}
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setDeptFilter("all");
              setStatusFilter("all");
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer border border-slate-700"
          >
            清除所有篩選條件
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const todayStatus = employeeStatusMap.get(emp.id) || {
              status: "今日尚未打卡",
              type: "未簽到",
              time: "--",
              badgeColor: "bg-slate-800 text-slate-400 border-slate-700"
            };

            const empStatus = emp.status || "active";
            const statusConfig = STATUS_CONFIG[empStatus] || STATUS_CONFIG.active;
            const StatusIcon = statusConfig.icon;
            const empLogsCount = attendanceLogs.filter((l) => l.empId === emp.id).length;

            return (
              <div
                key={emp.id}
                id={`card-emp-${emp.id}`}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent Top Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${emp.avatarBg || "bg-blue-600"}`} />

                <div className="space-y-4 pt-1">
                  {/* Top Header with Avatar, Status & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-13 h-13 rounded-2xl ${
                          emp.avatarBg || "bg-blue-600"
                        } flex items-center justify-center text-white text-lg font-bold shadow-md shadow-black/30 border border-white/20`}
                      >
                        {emp.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                            {emp.name}
                          </h3>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                            {emp.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                            {emp.dept}
                          </span>
                          <span className="text-slate-300 font-medium">{emp.role}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        id={`btn-edit-emp-${emp.id}`}
                        onClick={() => handleOpenEditModal(emp)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition cursor-pointer border border-transparent hover:border-blue-500/30"
                        title="編輯在職狀況與員工資料"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-delete-emp-${emp.id}`}
                        onClick={() => setDeletingEmployee(emp)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer border border-transparent hover:border-rose-500/30"
                        title="刪除/除名此員工"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Employment Status Badge & Quick Switch */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">在職狀況設定:</span>
                      <div className="flex items-center gap-1">
                        <select
                          value={empStatus}
                          onChange={(e) => handleQuickStatusChange(emp, e.target.value as EmploymentStatus)}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <option value="active">在職出勤</option>
                          <option value="leave">休假請假</option>
                          <option value="wfh">居家遠端 (WFH)</option>
                          <option value="business_trip">公差出差</option>
                          <option value="resigned">已離職/除名</option>
                        </select>
                      </div>
                    </div>

                    {/* Today Punch Real-time Status */}
                    <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-between ${todayStatus.badgeColor}`}>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        <span className="truncate">今日打卡: {todayStatus.status}</span>
                      </div>
                      <span className="font-mono text-[11px] opacity-80 flex-shrink-0 ml-1">{todayStatus.time}</span>
                    </div>
                  </div>

                  {/* Info fields */}
                  <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{emp.shift}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="font-mono text-slate-300">{emp.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate text-slate-400 hover:text-slate-200 transition">{emp.email}</span>
                    </div>
                    {emp.notes && (
                      <div className="flex items-start gap-2 pt-1 text-slate-500 text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1 italic">{emp.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>累計歷史打卡: <strong className="text-slate-300 font-mono">{empLogsCount}</strong> 筆</span>
                  <button
                    onClick={() => handleOpenEditModal(emp)}
                    className="text-blue-400 hover:underline cursor-pointer flex items-center gap-1 font-medium"
                  >
                    編輯狀況與資料 &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">員工姓名 / 工號</th>
                  <th className="px-4 py-3.5">部門與職稱</th>
                  <th className="px-4 py-3.5">在職狀況設定</th>
                  <th className="px-4 py-3.5">今日打卡狀況</th>
                  <th className="px-4 py-3.5">上班班別</th>
                  <th className="px-4 py-3.5">聯絡資訊</th>
                  <th className="px-4 py-3.5 text-right">操作管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredEmployees.map((emp) => {
                  const todayStatus = employeeStatusMap.get(emp.id) || {
                    status: "今日尚未打卡",
                    type: "未簽到",
                    time: "--",
                    badgeColor: "bg-slate-800 text-slate-400 border-slate-700"
                  };
                  const empStatus = emp.status || "active";
                  const statusConfig = STATUS_CONFIG[empStatus] || STATUS_CONFIG.active;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl ${
                              emp.avatarBg || "bg-blue-600"
                            } flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                          >
                            {emp.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{emp.name}</div>
                            <div className="text-xs font-mono text-slate-400">{emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
                            {emp.dept}
                          </span>
                          <span className="text-xs text-slate-300 font-medium">{emp.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={empStatus}
                          onChange={(e) => handleQuickStatusChange(emp, e.target.value as EmploymentStatus)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <option value="active">在職出勤</option>
                          <option value="leave">休假請假</option>
                          <option value="wfh">居家遠端 (WFH)</option>
                          <option value="business_trip">公差出差</option>
                          <option value="resigned">已離職/除名</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${todayStatus.badgeColor}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{todayStatus.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                        {emp.shift}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400 space-y-0.5">
                        <div className="font-mono text-slate-300">{emp.phone}</div>
                        <div className="text-slate-500 truncate max-w-[160px]">{emp.email}</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>編輯</span>
                          </button>
                          <button
                            onClick={() => setDeletingEmployee(emp)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 text-xs font-medium border border-slate-700 hover:border-rose-500/40 transition cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>刪減</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD EMPLOYEE (新增人員) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">新增在職員工入職登記</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    員工編號 (ID) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                    placeholder="例如: EMP-007"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                  {formErrors.id && <p className="text-rose-400 text-xs mt-1">{formErrors.id}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    員工姓名 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="例如: 林小華"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  {formErrors.name && <p className="text-rose-400 text-xs mt-1">{formErrors.name}</p>}
                </div>
              </div>

              {/* Department & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    所屬部門 <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {PRESET_DEPTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="自訂部門">+ 自訂其他部門...</option>
                  </select>
                  {formDept === "自訂部門" && (
                    <input
                      type="text"
                      value={formCustomDept}
                      onChange={(e) => setFormCustomDept(e.target.value)}
                      placeholder="輸入自訂部門名稱..."
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  )}
                  {formErrors.dept && <p className="text-rose-400 text-xs mt-1">{formErrors.dept}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    職稱 / 職務角色 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="例如: 資深架構師、專案經理..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  {formErrors.role && <p className="text-rose-400 text-xs mt-1">{formErrors.role}</p>}
                </div>
              </div>

              {/* Status & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    在職狀況設定
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as EmploymentStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">在職出勤</option>
                    <option value="leave">休假請假</option>
                    <option value="wfh">居家遠端 (WFH)</option>
                    <option value="business_trip">公差出差</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    排班班別設定
                  </label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {PRESET_SHIFTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {formShift === "自訂班別" && (
                    <input
                      type="text"
                      value={formCustomShift}
                      onChange={(e) => setFormCustomShift(e.target.value)}
                      placeholder="例如: 07:30 - 16:30 (早班輪值)"
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    聯絡電話
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0912-345-678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    電子郵件
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@company.internal"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  在職狀況說明 / 備註
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="備註員工工作職責、特殊排班或狀況..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  頭像代表色票
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.bg}
                      type="button"
                      onClick={() => setFormAvatarBg(c.bg)}
                      className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center transition transform cursor-pointer ${
                        formAvatarBg === c.bg
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-md"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                      title={c.name}
                    >
                      {formAvatarBg === c.bg && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  確認新增入職
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT EMPLOYEE (編輯在職狀況與資料) */}
      {/* ========================================================================= */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">編輯在職狀況 • {editingEmployee.name}</h3>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    員工編號 (不可修改)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formId}
                    className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-3.5 py-2 text-sm text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    員工姓名 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  {formErrors.name && <p className="text-rose-400 text-xs mt-1">{formErrors.name}</p>}
                </div>
              </div>

              {/* Status & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    在職狀況設定 <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as EmploymentStatus)}
                    className="w-full bg-slate-950 border border-blue-500/50 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">🟢 在職出勤</option>
                    <option value="leave">🔴 休假請假中</option>
                    <option value="wfh">🔵 居家遠端 (WFH)</option>
                    <option value="business_trip">🟣 公差出差中</option>
                    <option value="resigned">⚪ 已離職/除名</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    所屬部門 <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {PRESET_DEPTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="自訂部門">+ 自訂其他部門...</option>
                  </select>
                  {formDept === "自訂部門" && (
                    <input
                      type="text"
                      value={formCustomDept}
                      onChange={(e) => setFormCustomDept(e.target.value)}
                      placeholder="輸入自訂部門名稱..."
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  )}
                  {formErrors.dept && <p className="text-rose-400 text-xs mt-1">{formErrors.dept}</p>}
                </div>
              </div>

              {/* Role & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    職稱 / 職務角色 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  {formErrors.role && <p className="text-rose-400 text-xs mt-1">{formErrors.role}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    上班班別設定
                  </label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {PRESET_SHIFTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {formShift === "自訂班別" && (
                    <input
                      type="text"
                      value={formCustomShift}
                      onChange={(e) => setFormCustomShift(e.target.value)}
                      placeholder="例如: 07:30 - 16:30 (早班輪值)"
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    聯絡電話
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    電子郵件
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  在職狀況說明 / 備註
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="備註員工工作職責、特殊排班或狀況..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  頭像代表色票
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.bg}
                      type="button"
                      onClick={() => setFormAvatarBg(c.bg)}
                      className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center transition transform cursor-pointer ${
                        formAvatarBg === c.bg
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-md"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      }`}
                      title={c.name}
                    >
                      {formAvatarBg === c.bg && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  儲存變更
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION (刪除/除名確認) */}
      {/* ========================================================================= */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">確認將此員工除名？</h3>
                <p className="text-xs text-rose-300/80">此動作將從打卡名冊中移除該員工</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">員工姓名:</span>
                <span className="text-white font-bold">{deletingEmployee.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">員工編號:</span>
                <span className="font-mono text-slate-300">{deletingEmployee.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">所屬部門:</span>
                <span className="text-blue-400 font-medium">{deletingEmployee.dept} ({deletingEmployee.role})</span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>提醒：</strong> 該員工已產生的歷史出勤打卡與假單紀錄將繼續妥善保留在系統資料庫中，不會遺失。
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEmployee(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                取消保留
              </button>
              <button
                type="button"
                id="btn-confirm-delete-employee"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                確定除名刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET SEED DATA CONFIRMATION */}
      {/* ========================================================================= */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">重置為預設示範名單？</h3>
                <p className="text-xs text-amber-300/80">將還原為系統初始的 6 位示範員工</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              您目前新增或修改的所有自訂員工資料將被清空，並重置為張哲豪、林佳穎、陳冠宇等 6 位預設示範員工名冊。
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-600/30 transition cursor-pointer"
              >
                確認重置名單
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
