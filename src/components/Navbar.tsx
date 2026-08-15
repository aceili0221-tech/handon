import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  CalendarCheck,
  LayoutDashboard,
  Server,
  Clock,
  Wifi,
  WifiOff,
  CloudUpload,
  Layers,
  Users
} from "lucide-react";
import { StorageMode } from "../types";
import { formatDateTime } from "../utils/helpers";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  storageMode: StorageMode;
  serverOnline: boolean;
  offlineQueueCount: number;
  onQuickSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  storageMode,
  serverOnline,
  offlineQueueCount,
  onQuickSync
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeData = formatDateTime(now);

  const navItems = [
    { id: "office", label: "辦公室內勤", icon: Building2, desc: "標準班表與工時" },
    { id: "field", label: "外勤專案簽到", icon: MapPin, desc: "GPS雷達與日誌" },
    { id: "leave", label: "請假加班登記", icon: CalendarCheck, desc: "假單與加班核算" },
    { id: "employees", label: "人員組織管理", icon: Users, desc: "名冊與新增刪減" },
    { id: "admin", label: "管理出勤看板", icon: LayoutDashboard, desc: "即時KPI與CSV導出" },
    { id: "server", label: "本機主機設定", icon: Server, desc: "REST與離線同步" }
  ];

  return (
    <header id="main-header" className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3.5 gap-3 border-b border-slate-800/80">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    企業內部出勤與工時打卡系統
                  </h1>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-normal">
                  單頁自主掌控架構 • 零雲端訂閱費用 • 支援桌機、獨立視窗與行動裝置
                </p>
              </div>
            </div>

            {/* Mobile Real-time Clock preview */}
            <div className="md:hidden flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeData.timeStr}</span>
            </div>
          </div>

          {/* Right Status & Real-time Clock */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* Live Clock Display */}
            <div
              id="live-clock-card"
              className="hidden md:flex items-center gap-2.5 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-inner text-right"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-slate-400 leading-tight">
                  {timeData.dateStr} ({timeData.weekday})
                </span>
                <span className="text-sm font-mono font-bold text-amber-400 tracking-wider leading-none mt-0.5">
                  {timeData.timeStr}
                </span>
              </div>
            </div>

            {/* Storage Mode Badge */}
            <div className="flex items-center gap-2">
              {storageMode === "SERVER_REST" ? (
                <div
                  id="status-server-mode"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                    serverOnline
                      ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/50 border-rose-500/40 text-rose-300"
                  }`}
                  title="目前使用 Node.js Express 本機伺服器儲存模式"
                >
                  {serverOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
                  <span>主機模式: {serverOnline ? "連線正常" : "斷線中"}</span>
                </div>
              ) : (
                <div
                  id="status-local-mode"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/50 border border-indigo-500/40 text-indigo-300"
                  title="目前使用瀏覽器 LocalStorage 本機快取模式"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  <span>單機模式 (LocalStorage)</span>
                </div>
              )}

              {/* Offline Queue Badge */}
              {offlineQueueCount > 0 && (
                <button
                  id="btn-sync-queue"
                  onClick={onQuickSync}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 transition cursor-pointer"
                  title="點擊立即將未同步的打卡資料送至公司主機"
                >
                  <CloudUpload className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>未同步 ({offlineQueueCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav id="module-tabs" className="flex overflow-x-auto py-2.5 gap-1.5 sm:gap-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
