import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Compass,
  Navigation,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Sliders,
  Building,
  User,
  Phone,
  Crosshair,
  Shield,
  LocateFixed,
  Send
} from "lucide-react";
import { Employee, ProjectSite, AttendanceLog } from "../types";
import { formatDateTime, calculateDistanceMeters } from "../utils/helpers";

interface FieldAttendanceProps {
  employees: Employee[];
  selectedEmpId: string;
  onSelectEmployee: (empId: string) => void;
  projectSites: ProjectSite[];
  onPunchIn: (log: Omit<AttendanceLog, "id" | "timestamp" | "synced">) => void;
  onAddToast: (toast: { type: "success" | "warning" | "error" | "info"; title: string; message: string }) => void;
}

export const FieldAttendance: React.FC<FieldAttendanceProps> = ({
  employees,
  selectedEmpId,
  onSelectEmployee,
  projectSites,
  onPunchIn,
  onAddToast
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectSites[0].id);
  const [workLogText, setWorkLogText] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSimulatedGps, setIsSimulatedGps] = useState(false);

  // Current GPS state
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
    addressNote?: string;
  }>({
    lat: projectSites[0].lat + 0.00015,
    lng: projectSites[0].lng + 0.0002,
    accuracy: 15,
    timestamp: Date.now(),
    addressNote: "案場鄰近區域 (GPS 定位中)"
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const currentEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];
  const currentProject = projectSites.find((p) => p.id === selectedProjectId) || projectSites[0];

  // Calculate distance between user GPS and project target
  const distanceMeters = calculateDistanceMeters(
    currentCoords.lat,
    currentCoords.lng,
    currentProject.lat,
    currentProject.lng
  );

  // Acquire real GPS via navigator.geolocation
  const fetchRealGps = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      onAddToast({
        type: "warning",
        title: "瀏覽器不支援實體 GPS",
        message: "已為您無縫啟用「工程案場智慧模擬定位機制」。"
      });
      simulateGpsNearProject(currentProject);
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: Date.now(),
          addressNote: "實體硬體 GPS 定位取得"
        });
        setIsSimulatedGps(false);
        setIsLocating(false);
        onAddToast({
          type: "success",
          title: "GPS 座標已鎖定",
          message: `精確度 ${Math.round(pos.coords.accuracy)}m (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        });
      },
      (err) => {
        console.warn("GPS failed or denied:", err.message);
        onAddToast({
          type: "info",
          title: "未開啟 GPS 權限或位於室內",
          message: "已為您切換至「案場高精度模擬定位」，可直接進行打卡測試。"
        });
        simulateGpsNearProject(currentProject);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 0
      }
    );
  };

  // Helper to simulate GPS near currently selected project
  const simulateGpsNearProject = (project: ProjectSite) => {
    // Generate jitter within ~20-50m
    const offsetLat = (Math.random() - 0.5) * 0.0003;
    const offsetLng = (Math.random() - 0.5) * 0.0003;
    setCurrentCoords({
      lat: Number((project.lat + offsetLat).toFixed(6)),
      lng: Number((project.lng + offsetLng).toFixed(6)),
      accuracy: Math.floor(8 + Math.random() * 8),
      timestamp: Date.now(),
      addressNote: `${project.name} 施工管制區內 (模擬定位)`
    });
    setIsSimulatedGps(true);
  };

  // Switch project handler
  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    const target = projectSites.find((p) => p.id === projId) || projectSites[0];
    if (isSimulatedGps) {
      simulateGpsNearProject(target);
    }
  };

  // Fetch initial location on mount
  useEffect(() => {
    fetchRealGps();
  }, []);

  // HTML5 Canvas 2D Radar & Map Pin Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let angle = 0;

    const renderRadar = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) / 2 - 16;

      ctx.clearRect(0, 0, width, height);

      // 1. Dark radar background
      const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, maxRadius);
      grad.addColorStop(0, "#0b1329");
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Concentric Range Rings
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Range ring distance labels
      ctx.fillStyle = "#64748b";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("50m", centerX, centerY - maxRadius * 0.25 + 3);
      ctx.fillText("100m", centerX, centerY - maxRadius * 0.5 + 3);
      ctx.fillText("200m", centerX, centerY - maxRadius * 0.75 + 3);
      ctx.fillText("500m 案場半徑", centerX, centerY - maxRadius + 12);

      // 3. Crosshair grid lines
      ctx.strokeStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.stroke();

      // 4. Radar Sweep Sector Animation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      const sweepGrad = ctx.createLinearGradient(0, 0, maxRadius, 0);
      sweepGrad.addColorStop(0, "rgba(59, 130, 246, 0.4)");
      sweepGrad.addColorStop(1, "rgba(59, 130, 246, 0.0)");

      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxRadius, 0, Math.PI / 4);
      ctx.closePath();
      ctx.fill();

      // Sweep leading line
      ctx.strokeStyle = "rgba(96, 165, 250, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(maxRadius, 0);
      ctx.stroke();
      ctx.restore();

      // 5. Target Project Center Point (Center Hub)
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#93c5fd";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`案場中心: ${currentProject.code}`, centerX, centerY + 20);

      // 6. User GPS Location Dynamic Pin & Pulse Wave
      // Calculate relative visual offset on radar based on coordinate delta
      const dLat = currentCoords.lat - currentProject.lat;
      const dLng = currentCoords.lng - currentProject.lng;
      const scale = 80000; // Visual mapping scale
      const userX = Math.max(
        centerX - maxRadius + 15,
        Math.min(centerX + maxRadius - 15, centerX + dLng * scale)
      );
      const userY = Math.max(
        centerY - maxRadius + 15,
        Math.min(centerY + maxRadius - 15, centerY - dLat * scale)
      );

      // Pulse ring for User Pin
      const pulseRadius = 8 + (Math.sin(Date.now() / 250) + 1) * 6;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(userX, userY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Pin core
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(userX, userY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pin Label
      ctx.fillStyle = "#fca5a5";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("目前打卡點 (YOU)", userX, userY - 12);

      // Connecting line if within radar bounds
      ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(userX, userY);
      ctx.stroke();
      ctx.setLineDash([]);

      angle += 0.035;
      if (angle >= Math.PI * 2) angle = 0;

      animationFrameRef.current = requestAnimationFrame(renderRadar);
    };

    renderRadar();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentCoords, currentProject]);

  // Quick work log template snippets
  const insertTemplate = (text: string) => {
    setWorkLogText((prev) => (prev ? `${prev}\n${text}` : text));
  };

  // Submit Field Check-in
  const handleFieldClockIn = () => {
    const current = formatDateTime();
    const gpsStr = `GPS: ${currentCoords.lat}° N, ${currentCoords.lng}° E (精確度 ±${currentCoords.accuracy}m, 距離案場 ${distanceMeters}m)`;

    onPunchIn({
      empId: currentEmp.id,
      empName: currentEmp.name,
      dept: currentEmp.dept,
      role: currentEmp.role,
      type: "外勤簽到",
      date: current.dateStr,
      time: current.timeStr,
      details: `${currentProject.code} ${currentProject.name}`,
      ipLocation: gpsStr,
      workLog: workLogText.trim() || `抵達案場展開工作。案場監造負責人：${currentProject.manager}。`,
      status: "normal"
    });
    setWorkLogText("");
  };

  // Submit Field Check-out
  const handleFieldClockOut = () => {
    const current = formatDateTime();
    const gpsStr = `GPS: ${currentCoords.lat}° N, ${currentCoords.lng}° E (精確度 ±${currentCoords.accuracy}m)`;

    onPunchIn({
      empId: currentEmp.id,
      empName: currentEmp.name,
      dept: currentEmp.dept,
      role: currentEmp.role,
      type: "外勤簽退",
      date: current.dateStr,
      time: current.timeStr,
      details: `${currentProject.code} 離開案場簽退`,
      ipLocation: gpsStr,
      workLog: workLogText.trim() || `已完成本日現場施工查驗與安全巡邏，離開案場。`,
      status: "normal"
    });
    setWorkLogText("");
  };

  return (
    <div id="field-attendance-module" className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              模組 B：外勤與專案簽到
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            針對案場工程師、監造人員與外勤業務，透過 GPS 雷達定位與工程日誌記錄現場足跡。
          </p>
        </div>

        {/* GPS Status Indicator */}
        <div className="flex items-center gap-2">
          <button
            id="btn-re-locate"
            onClick={fetchRealGps}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-blue-300 hover:bg-slate-800 transition cursor-pointer"
            title="重新獲取實體 GPS 座標"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-blue-400" : ""}`} />
            <span>{isLocating ? "定位中..." : "重新抓取 GPS"}</span>
          </button>

          <button
            id="btn-toggle-sim-gps"
            onClick={() => simulateGpsNearProject(currentProject)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 hover:bg-slate-800 transition cursor-pointer"
            title="切換/隨機產生案場模擬座標"
          >
            <LocateFixed className="w-3.5 h-3.5 text-amber-400" />
            <span>案場模擬定位</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls (7 cols), Right Radar Canvas & Site Info (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Employee & Project Selectors */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employee selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>外勤打卡人員</span>
                </label>
                <select
                  id="field-emp-select"
                  value={selectedEmpId}
                  onChange={(e) => onSelectEmployee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id}) - {emp.dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Site selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-400" />
                  <span>選擇工程案場 / 拜訪項目</span>
                </label>
                <select
                  id="field-project-select"
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {projectSites.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Project Card Snapshot */}
            <div id="project-detail-banner" className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentProject.code}
                  </span>
                  <h3 className="font-bold text-sm text-white">{currentProject.name}</h3>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  {currentProject.manager} ({currentProject.phone})
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span>{currentProject.locationName}</span>
              </p>
              <div className="text-[11px] text-slate-500 bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                {currentProject.description}
              </div>
            </div>
          </div>

          {/* Work Log & Daily Remarks Textarea */}
          <div id="work-log-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>外勤工作日誌 / 現場巡檢紀錄</span>
              </label>
              <span className="text-[11px] text-slate-500">支援快速填寫模板</span>
            </div>

            {/* Quick Template Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => insertTemplate("1. 依約執行結構體與管線巡檢，各項標準符合安全規範無異狀。")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition"
              >
                + 例行巡檢無虞
              </button>
              <button
                type="button"
                onClick={() => insertTemplate("2. 與營造廠及機電監造召開定例工務會議，確認工程進度排程。")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition"
              >
                + 業主定例會議
              </button>
              <button
                type="button"
                onClick={() => insertTemplate("3. 進場材料抽驗與隱蔽部分拍照查驗存檔，施作工法符合圖說。")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition"
              >
                + 進料抽驗簽認
              </button>
              <button
                type="button"
                onClick={() => insertTemplate("4. 現場突發狀況處置回報完成，已要求承包商依限期改善。")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition"
              >
                + 工安缺失改善
              </button>
            </div>

            <textarea
              id="textarea-worklog"
              rows={4}
              value={workLogText}
              onChange={(e) => setWorkLogText(e.target.value)}
              placeholder="請填寫本日案場巡檢要點、施工進度查驗項目、工安防護確認或業主交辦事項..."
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
            />

            {/* Field Punch Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                id="btn-field-clockin"
                onClick={handleFieldClockIn}
                className="flex items-center justify-center gap-3 py-4 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-900/30 transition transform active:scale-[0.98] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 fill-white text-white" />
                </div>
                <div className="text-left">
                  <div className="leading-tight">外勤到達簽到</div>
                  <div className="text-[11px] text-emerald-100 font-normal">
                    Arrive at Site (壓印 GPS)
                  </div>
                </div>
              </button>

              <button
                id="btn-field-clockout"
                onClick={handleFieldClockOut}
                className="flex items-center justify-center gap-3 py-4 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-base shadow-lg shadow-amber-900/30 transition transform active:scale-[0.98] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Square className="w-4 h-4 fill-white text-white" />
                </div>
                <div className="text-left">
                  <div className="leading-tight">外勤離開簽退</div>
                  <div className="text-[11px] text-amber-100 font-normal">
                    Leave Site (完成巡檢)
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Radar Map Canvas & GPS Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div id="radar-map-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">案場雷達與地理繪圖</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                HTML5 Canvas 2D
              </span>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full aspect-square max-w-[340px] flex items-center justify-center my-2">
              <canvas
                ref={canvasRef}
                width={340}
                height={340}
                className="rounded-full shadow-2xl border-2 border-slate-800 bg-slate-950 w-full h-full"
              />
            </div>

            {/* GPS Telemetry Metadata */}
            <div className="w-full mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">目前 GPS 緯度 / 經度:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {currentCoords.lat}° N, {currentCoords.lng}° E
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">定位精確度 (Accuracy):</span>
                <span className="font-mono text-cyan-300">±{currentCoords.accuracy} 公尺</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">距離案場目標中心:</span>
                <span
                  className={`font-mono font-bold ${
                    distanceMeters <= 100 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {distanceMeters} 公尺 {distanceMeters <= 100 ? "(合規範圍內)" : "(外圍區域)"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-500">定位來源模式:</span>
                <span className="text-slate-300">
                  {isSimulatedGps ? "智慧模擬模式 (Simulated)" : "實體裝置硬體 GPS"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
