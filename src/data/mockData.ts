import { Employee, ProjectSite, AttendanceLog } from "../types";

export const MOCK_EMPLOYEES: Employee[] = [
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

export const MOCK_PROJECT_SITES: ProjectSite[] = [
  {
    id: "PRJ-101",
    code: "PRJ-101",
    name: "台北信義 A11 商業大樓監造案",
    locationName: "台北市信義區松壽路 11 號",
    lat: 25.0354,
    lng: 121.5672,
    manager: "林佳穎 (經理)",
    phone: "02-8780-1188",
    description: "結構體巡檢、B2 防水分層施作驗收、定期工安評估。"
  },
  {
    id: "PRJ-102",
    code: "PRJ-102",
    name: "新竹科學園區 Phase-3 廠區新建工程",
    locationName: "新竹市東區研新四路 12 號",
    lat: 24.7785,
    lng: 121.0142,
    manager: "陳冠宇 (總監)",
    phone: "03-577-8899",
    description: "無塵室機電整合、管線配置壓力測試與空調外協廠商協調。"
  },
  {
    id: "PRJ-103",
    code: "PRJ-103",
    name: "台中水湳經貿園區機電整合案",
    locationName: "台中市西屯區中科路 2966 號",
    lat: 24.1845,
    lng: 120.6543,
    manager: "黃俊傑 (管理師)",
    phone: "04-2451-3322",
    description: "太陽能光電回流與高壓受電站安全查驗。"
  },
  {
    id: "PRJ-104",
    code: "PRJ-104",
    name: "高雄港埠旅運中心自動化專案",
    locationName: "高雄市苓雅區海邊路 110 號",
    lat: 22.6139,
    lng: 120.2927,
    manager: "張哲豪 (架構師)",
    phone: "07-531-9988",
    description: "出入境自動辨識閘門與中央監控網路伺服器部署。"
  },
  {
    id: "PRJ-105",
    code: "PRJ-105",
    name: "台南綠能科學城屋頂光電案",
    locationName: "台南市歸仁區高發三路 36 號",
    lat: 22.9238,
    lng: 120.2883,
    manager: "林佳穎 (經理)",
    phone: "06-303-2211",
    description: "屋頂鋼構抗風壓測試與逆變器遠端監測連線。"
  },
  {
    id: "PRJ-999",
    code: "PRJ-999",
    name: "客戶現場緊急技術支援與拜訪",
    locationName: "各客戶企業營運總部 / 服務中心",
    lat: 25.0418,
    lng: 121.5345,
    manager: "陳冠宇 (總監)",
    phone: "0934-567-890",
    description: "現場緊急系統除錯、合約商務談判或維護保養。"
  }
];

export const INITIAL_ATTENDANCE_LOGS: AttendanceLog[] = [
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
    status: "normal",
    synced: true
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
    status: "normal",
    synced: true
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
    workLog: "拜訪台積電外協廠商進行 Q3 空調工程報價複審與合約條款確認。",
    timestamp: 1723704800000,
    status: "normal",
    synced: true
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
    status: "normal",
    synced: true
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
    details: "特別休假 (全天 8.0 小時)",
    ipLocation: "系統審核登記 (本機)",
    workLog: "私人家庭事務請假，今日巡檢事項已委託代理人代為監管。職務代理人：張哲豪",
    timestamp: 1723705500000,
    status: "leave",
    synced: true
  }
];
