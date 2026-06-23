import { useEffect, useMemo, useState, type MouseEvent } from 'react'

type FortiPage =
  | 'dashboard'
  | 'fabricPhysical'
  | 'fabricLogical'
  | 'fabricAutomation'
  | 'fabricSettings'
  | 'fabricConnectors'
  | 'fortiviewLanDmz'
  | 'fortiviewSources'
  | 'fortiviewDestinations'
  | 'fortiviewApplications'
  | 'fortiviewCloudApps'
  | 'fortiviewWebsites'
  | 'fortiviewThreats'
  | 'fortiviewWifi'
  | 'fortiviewTrafficShaping'
  | 'fortiviewWanSources'
  | 'fortiviewWanHosts'
  | 'fortiviewWanThreats'
  | 'fortiviewSystemEvents'
  | 'fortiviewVpn'
  | 'fortiviewEndpoint'
  | 'fortiviewSecurityMap'
  | 'fortiviewPolicies'
  | 'fortiviewInterfaces'
  | 'fortiviewSessions'
  | 'interfaces'
  | 'dns'
  | 'packet'
  | 'sdwan'
  | 'sdwanSla'
  | 'sdwanRules'
  | 'staticRoutes'
  | 'systemAdmins'
  | 'adminProfiles'
  | 'certificates'
  | 'systemSettings'
  | 'ha'
  | 'snmp'
  | 'replacementMessages'
  | 'fortiguard'
  | 'advancedSettings'
  | 'inspectionMode'
  | 'featureVisibility'
  | 'policyIpv4'
  | 'addresses'
  | 'services'
  | 'schedules'
  | 'antivirus'
  | 'webFilter'
  | 'dnsFilter'
  | 'appControl'
  | 'ips'
  | 'forticlientCompliance'
  | 'sslInspection'
  | 'ratingOverrides'
  | 'customSignatures'
  | 'vpnOverlay'
  | 'ipsecTunnels'
  | 'ipsecWizard'
  | 'ipsecTemplates'
  | 'sslVpnPortal'
  | 'sslVpnSettings'
  | 'userDefinition'
  | 'userGroups'
  | 'guestManagement'
  | 'deviceInventory'
  | 'deviceGroups'
  | 'ldap'
  | 'radius'
  | 'authSettings'
  | 'fortitoken'
  | 'wifiController'
  | 'logsTrafficForward'
  | 'logsTrafficLocal'
  | 'logsSystem'
  | 'logsRoute'
  | 'logsVpn'
  | 'logsUser'
  | 'logsEndpoint'
  | 'logsHa'
  | 'logsWifi'
  | 'logsAntivirus'
  | 'logsWebFilter'
  | 'logsDns'
  | 'logsApplication'
  | 'logsIntrusion'
  | 'logsAnomaly'
  | 'monitorRouting'
  | 'monitorVpn'
  | 'monitorSession'

type FortiMenuChild = {
  id: FortiPage
  label: string
  favorite?: boolean
  muted?: boolean
}

type FortiMenuSection = {
  id: string
  label: string
  icon: string
  page?: FortiPage
  badge?: string
  children?: FortiMenuChild[]
}

type FortiInterface = {
  name: string
  alias: string
  type: string
  role: string
  ip: string
  access: string[]
  status: 'up' | 'down'
  members?: string[]
  dhcp?: string
}

type FortiPolicy = {
  id: number
  name: string
  source: string
  destination: string
  service: string
  action: 'ACCEPT' | 'DENY'
  nat: boolean
  status: '啟用' | '停用'
}

type FortiRoute = {
  id: number
  enabled: boolean
  destination: string
  gateway: string
  interfaceName: string
  distance: string
  priority: string
}

type FortiFabricNode = {
  id: string
  label: string
  detail: string
  icon: string
  x: number
  y: number
  size: number
}

type FortiFabricLink = {
  from: string
  to: string
}

type FortiViewConfig = {
  title: string
  columns: string[]
  rows?: string[][]
  visual: 'empty' | 'summary' | 'bubble' | 'vpn' | 'map' | 'session'
  searchPlaceholder?: string
  timeLabel?: string
}

type FabricAutomationItem = {
  id: string
  name: string
  type: string
  enabled: boolean
  description: string
}

type FortiManagedRow = {
  id: string
  name: string
  type: string
  enabled: boolean
  description: string
  selected?: boolean
}

const fortiGroups: FortiMenuSection[] = [
  {
    id: 'dashboard',
    label: '儀表板',
    icon: 'bx-grid-alt',
    page: 'dashboard',
  },
  {
    id: 'securityFabric',
    label: '安全織網',
    icon: 'bx-sitemap',
    children: [
      { id: 'fabricPhysical', label: '實體拓樸圖' },
      { id: 'fabricLogical', label: '邏輯拓樸圖' },
      { id: 'fabricAutomation', label: '自動化' },
      { id: 'fabricSettings', label: '設置' },
      { id: 'fabricConnectors', label: 'Fabric Connectors' },
    ],
  },
  {
    id: 'fortiview',
    label: 'FortiView',
    icon: 'bx-bar-chart-alt-2',
    children: [
      { id: 'fortiviewLanDmz', label: '流量來自 LAN/DMZ', muted: true },
      { id: 'fortiviewSources', label: '來源' },
      { id: 'fortiviewDestinations', label: '目的' },
      { id: 'fortiviewApplications', label: '應用程式' },
      { id: 'fortiviewCloudApps', label: '雲端應用程式' },
      { id: 'fortiviewWebsites', label: '網站' },
      { id: 'fortiviewThreats', label: '威脅' },
      { id: 'fortiviewWifi', label: 'WiFi 客戶端' },
      { id: 'fortiviewTrafficShaping', label: '流量塑形' },
      { id: 'fortiviewWanSources', label: '流量來自 WAN', muted: true },
      { id: 'fortiviewWanHosts', label: '主機' },
      { id: 'fortiviewWanThreats', label: '威脅' },
      { id: 'fortiviewSystemEvents', label: '所有區段', muted: true },
      { id: 'fortiviewVpn', label: 'VPN' },
      { id: 'fortiviewEndpoint', label: 'Endpoint 漏洞' },
      { id: 'fortiviewSecurityMap', label: '資安威脅地圖' },
      { id: 'fortiviewPolicies', label: '政策' },
      { id: 'fortiviewInterfaces', label: '介面' },
      { id: 'fortiviewSessions', label: '連線會話' },
    ],
  },
  {
    id: 'network',
    label: '網路',
    icon: 'bx-transfer',
    children: [
      { id: 'interfaces', label: '介面' },
      { id: 'dns', label: 'DNS' },
      { id: 'packet', label: '封包擷取' },
      { id: 'sdwan', label: 'SD-WAN' },
      { id: 'sdwanSla', label: 'SD-WAN 服務品質檢測' },
      { id: 'sdwanRules', label: 'SD-WAN 優先等級規則' },
      { id: 'staticRoutes', label: '靜態路由' },
    ],
  },
  {
    id: 'system',
    label: '系統管理',
    icon: 'bx-cog',
    children: [
      { id: 'systemAdmins', label: '系統管理員' },
      { id: 'adminProfiles', label: '管理權限配置表' },
      { id: 'certificates', label: '證書' },
      { id: 'systemSettings', label: '設定' },
      { id: 'ha', label: '高可靠性' },
      { id: 'snmp', label: 'SNMP' },
      { id: 'replacementMessages', label: '替換訊息' },
      { id: 'fortiguard', label: 'FortiGuard' },
      { id: 'advancedSettings', label: '進階設定' },
      { id: 'inspectionMode', label: '進階功能開關' },
      { id: 'featureVisibility', label: '標籤' },
    ],
  },
  {
    id: 'policyObjects',
    label: '政策 & 物件',
    icon: 'bx-collection',
    children: [
      { id: 'policyIpv4', label: 'IPv4 政策' },
      { id: 'addresses', label: '位址' },
      { id: 'services', label: '服務' },
      { id: 'schedules', label: '排程' },
    ],
  },
  {
    id: 'securityProfiles',
    label: '資安管理設定',
    icon: 'bx-lock-alt',
    children: [
      { id: 'antivirus', label: '防毒' },
      { id: 'webFilter', label: '網頁過濾' },
      { id: 'dnsFilter', label: 'DNS 過濾器' },
      { id: 'appControl', label: '應用程式控制' },
      { id: 'ips', label: '入侵偵測防禦' },
      { id: 'forticlientCompliance', label: 'FortiClient Compliance' },
      { id: 'sslInspection', label: 'SSL/SSH 深層檢查' },
      { id: 'ratingOverrides', label: '網站自定惡意評級' },
      { id: 'customSignatures', label: '自訂特徵值' },
    ],
  },
  {
    id: 'vpn',
    label: 'VPN',
    icon: 'bx-laptop',
    children: [
      { id: 'vpnOverlay', label: 'Overlay Controller VPN' },
      { id: 'ipsecTunnels', label: 'IPsec 通道' },
      { id: 'ipsecWizard', label: 'IPsec 精靈' },
      { id: 'ipsecTemplates', label: 'IPsec 通道範本' },
      { id: 'sslVpnPortal', label: 'SSL-VPN 入口頁面' },
      { id: 'sslVpnSettings', label: 'SSL-VPN 設定' },
    ],
  },
  {
    id: 'usersDevices',
    label: '用戶與設備',
    icon: 'bx-user',
    children: [
      { id: 'userDefinition', label: '用戶認證' },
      { id: 'userGroups', label: '用戶群組' },
      { id: 'guestManagement', label: '來賓管理' },
      { id: 'deviceInventory', label: '設備清單' },
      { id: 'deviceGroups', label: '設備群組' },
      { id: 'ldap', label: 'LDAP' },
      { id: 'radius', label: 'RADIUS 認證' },
      { id: 'authSettings', label: '身份驗證設定' },
      { id: 'fortitoken', label: 'FortiToken' },
    ],
  },
  {
    id: 'wifiSwitch',
    label: 'WiFi & Switch 控制器',
    icon: 'bx-wifi',
    children: [
      { id: 'wifiController', label: '受管理的 FortiAP' },
    ],
  },
  {
    id: 'logsReports',
    label: '日誌與報表',
    icon: 'bx-bar-chart-alt',
    children: [
      { id: 'logsTrafficForward', label: '轉發流量' },
      { id: 'logsTrafficLocal', label: '本地流量' },
      { id: 'logsSystem', label: '系統事件' },
      { id: 'logsRoute', label: '路由事件' },
      { id: 'logsVpn', label: 'VPN 事件' },
      { id: 'logsUser', label: '用戶事件' },
      { id: 'logsEndpoint', label: '端點事件' },
      { id: 'logsHa', label: 'HA 事件' },
      { id: 'logsWifi', label: 'WiFi 事件' },
      { id: 'logsAntivirus', label: '防毒' },
      { id: 'logsWebFilter', label: '網頁過濾器' },
      { id: 'logsDns', label: 'DNS 查詢' },
      { id: 'logsApplication', label: '應用控制' },
      { id: 'logsIntrusion', label: '入侵偵測' },
      { id: 'logsAnomaly', label: '異常' },
    ],
  },
  {
    id: 'monitor',
    label: '監測',
    icon: 'bx-pie-chart-alt',
    children: [
      { id: 'monitorRouting', label: '路由監測' },
      { id: 'monitorVpn', label: 'VPN 監測' },
      { id: 'monitorSession', label: 'Session Monitor' },
    ],
  },
]

const initialInterfaces: FortiInterface[] = [
  { name: 'wan1', alias: 'Internet', type: '實體介面', role: 'WAN', ip: '61.219.112.31/24', access: ['PING', 'HTTPS'], status: 'up' },
  { name: 'internal3', alias: 'PORT3', type: '實體介面', role: 'LAN', ip: '0.0.0.0/0', access: ['PING'], status: 'up' },
  { name: 'internal4', alias: 'PORT4', type: '實體介面', role: 'LAN', ip: '0.0.0.0/0', access: ['PING'], status: 'up' },
  { name: 'VLAN_40', alias: 'PORT3-4', type: '硬體交換器', role: 'LAN', ip: '10.20.40.1/24', access: ['HTTPS', 'HTTP', 'PING', 'FMG-Access', 'CAPWAP'], status: 'up', members: ['internal3', 'internal4'], dhcp: '10.20.40.100 - 10.20.40.200' },
  { name: 'ssl.root', alias: 'SSL VPN', type: 'Tunnel Interface', role: 'DMZ', ip: '10.20.40.240/28', access: ['PING'], status: 'down' },
]

const initialPolicies: FortiPolicy[] = [
  { id: 1, name: 'LAN_to_WAN', source: 'VLAN_40', destination: 'wan1', service: 'ALL', action: 'ACCEPT', nat: true, status: '啟用' },
  { id: 2, name: 'SSLVPN_to_LAN', source: 'ssl.root', destination: 'VLAN_40', service: 'RDP, HTTPS, SSH', action: 'ACCEPT', nat: false, status: '啟用' },
  { id: 3, name: 'Block_Malware', source: 'all', destination: 'all', service: 'ALL', action: 'DENY', nat: false, status: '啟用' },
]

const initialRoutes: FortiRoute[] = [
  { id: 1, enabled: true, destination: '0.0.0.0/0', gateway: '61.219.112.254', interfaceName: 'wan1', distance: '10', priority: '0' },
  { id: 2, enabled: true, destination: '10.20.50.0/24', gateway: '10.20.40.254', interfaceName: 'VLAN_40', distance: '10', priority: '0' },
  { id: 3, enabled: false, destination: '192.168.88.0/24', gateway: '10.20.40.253', interfaceName: 'VLAN_40', distance: '20', priority: '5' },
]

const fortiLogs = [
  { time: '2026/06/22 09:21:44', type: '系統事件', level: 'notice', src: 'FGT90D3Z16007115', message: 'admin 登入 HTTPS 管理介面' },
  { time: '2026/06/22 09:18:02', type: 'VPN事件', level: 'information', src: 'Taiwan_ip', message: 'SSL-VPN 使用者驗證成功' },
  { time: '2026/06/22 09:14:31', type: '防毒', level: 'warning', src: '10.20.40.113', message: '偵測到 EICAR 測試檔，已隔離' },
  { time: '2026/06/22 09:12:09', type: 'DNS查詢', level: 'information', src: '10.20.40.118', message: '查詢 update.fortinet.com' },
  { time: '2026/06/22 09:10:11', type: 'WiFi事件', level: 'notice', src: 'FortiAP', message: 'AP tunnel state changed' },
  { time: '2026/06/22 09:08:25', type: '用戶事件', level: 'information', src: 'vpn_user', message: '用戶 vpn_user 通過本地認證' },
  { time: '2026/06/22 09:06:44', type: '轉發流量', level: 'information', src: 'VLAN_40', message: '允許 LAN_to_WAN 連線' },
  { time: '2026/06/22 09:05:31', type: '路由事件', level: 'notice', src: 'kernel', message: '靜態路由表已更新' },
]

const logTypeByPage: Partial<Record<FortiPage, string>> = {
  logsTrafficForward: '轉發流量',
  logsTrafficLocal: '本地流量',
  logsSystem: '系統事件',
  logsRoute: '路由事件',
  logsVpn: 'VPN事件',
  logsUser: '用戶事件',
  logsWifi: 'WiFi事件',
  logsAntivirus: '防毒',
  logsDns: 'DNS查詢',
}

const initialFabricNodes: FortiFabricNode[] = [
  { id: 'fgt', label: 'FortiGate 90D', detail: 'FGT90D3Z16007115', icon: 'bx-shield-quarter', x: 330, y: 170, size: 154 },
  { id: 'wan', label: 'WAN', detail: '61.219.112.31', icon: 'bx-cloud', x: 120, y: 72, size: 104 },
  { id: 'lan', label: 'VLAN_40', detail: '10.20.40.1/24', icon: 'bx-transfer', x: 120, y: 305, size: 118 },
  { id: 'ap', label: 'FortiAP', detail: '1 online', icon: 'bx-wifi', x: 575, y: 78, size: 92 },
  { id: 'clients', label: 'Clients', detail: '18 devices', icon: 'bx-laptop', x: 570, y: 305, size: 132 },
]

const initialFabricLinks: FortiFabricLink[] = [
  { from: 'wan', to: 'fgt' },
  { from: 'fgt', to: 'lan' },
  { from: 'fgt', to: 'ap' },
  { from: 'lan', to: 'clients' },
]

const defaultFabricSettings = { telemetry: true, analyzer: true, endpoint: true }
const defaultFabricManagementInterfaces = ['VLAN_40', 'internal']
const defaultFabricAutomations: FabricAutomationItem[] = [
  { id: 'auto-warning', name: 'Stitch_FortiGuard_Warning', type: 'Security Fabric', enabled: true, description: 'FortiGuard warning notification' },
  { id: 'auto-login', name: 'Admin_Login_Notify', type: 'Local event', enabled: true, description: 'Notify on administrator login' },
]

const defaultManagedRows: Partial<Record<FortiPage, FortiManagedRow[]>> = {
  fabricConnectors: [
    { id: 'connector-fa', name: 'FortiAnalyzer', type: 'Fortinet Connector', enabled: true, description: '日誌分析與報表同步' },
    { id: 'connector-fmg', name: 'FortiManager', type: 'Fortinet Connector', enabled: true, description: '集中式設備管理' },
    { id: 'connector-ems', name: 'FortiClient EMS', type: 'Endpoint Connector', enabled: false, description: '端點遙測整合' },
    { id: 'connector-aws', name: 'AWS SDN Connector', type: 'Cloud Connector', enabled: false, description: 'AWS VPC 物件同步' },
  ],
  sdwan: [
    { id: 'sdwan-wan1', name: 'wan1_member', type: 'SD-WAN Member', enabled: true, description: 'wan1 / gateway 61.219.112.254' },
    { id: 'sdwan-wan2', name: 'wan2_member', type: 'SD-WAN Member', enabled: false, description: 'wan2 / backup link' },
  ],
  sdwanSla: [
    { id: 'sla-google-dns', name: 'Google_DNS_SLA', type: 'Performance SLA', enabled: true, description: '8.8.8.8 latency / packet loss' },
    { id: 'sla-fortiguard', name: 'FortiGuard_SLA', type: 'Performance SLA', enabled: true, description: 'service.fortiguard.net health check' },
  ],
  sdwanRules: [
    { id: 'rule-business', name: 'Business_App_Priority', type: 'SD-WAN Rule', enabled: true, description: 'HTTPS / Office365 preferred wan1' },
    { id: 'rule-backup', name: 'Backup_Link_Rule', type: 'SD-WAN Rule', enabled: false, description: 'Use wan2 when SLA fails' },
  ],
  systemAdmins: [
    { id: 'admin-admin', name: 'admin', type: 'super_admin', enabled: true, description: 'HTTPS / SSH 管理者' },
    { id: 'admin-audit', name: 'audit', type: 'read_only', enabled: false, description: '稽核檢視帳號' },
  ],
  adminProfiles: [
    { id: 'profile-super', name: 'super_admin', type: 'Admin Profile', enabled: true, description: '完整系統權限' },
    { id: 'profile-read', name: 'read_only', type: 'Admin Profile', enabled: true, description: '唯讀檢視權限' },
  ],
  certificates: [
    { id: 'cert-factory', name: 'Fortinet_Factory', type: 'Local Certificate', enabled: true, description: '內建 HTTPS 憑證' },
    { id: 'cert-vpn', name: 'SSLVPN_Local_Cert', type: 'Local Certificate', enabled: false, description: 'SSL-VPN 自訂憑證' },
  ],
}

function readFortiStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function writeFortiStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage may be unavailable in restricted browsing modes.
  }
}

const fortiViewConfigs: Partial<Record<FortiPage, FortiViewConfig>> = {
  fortiviewLanDmz: {
    title: 'FortiView - 流量來自 LAN/DMZ',
    columns: ['來源', '設備', '威脅積分', '位元組', '連線數'],
    visual: 'summary',
    searchPlaceholder: '搜尋來源、設備或位元組',
  },
  fortiviewSources: {
    title: 'FortiView - 來源',
    columns: ['來源', '設備', '威脅積分', '位元組', '連線數'],
    visual: 'empty',
    searchPlaceholder: '搜尋來源 IP、使用者或設備',
  },
  fortiviewDestinations: {
    title: 'FortiView - 目的',
    columns: ['目的', '國家/地區', '應用程式', '位元組', '連線數'],
    rows: [['10.20.50.2', 'Taiwan', 'SSH', '148.2 KB', '6'], ['update.fortinet.com', 'United States', 'HTTPS', '27.8 MB', '14']],
    visual: 'summary',
    searchPlaceholder: '搜尋目的 IP、網域或國家',
  },
  fortiviewApplications: {
    title: 'FortiView - 應用程式',
    columns: ['應用程式', '類別', '風險', '位元組', '連線數', '頻寬'],
    visual: 'empty',
    searchPlaceholder: '搜尋應用程式或類別',
    timeLabel: '現在',
  },
  fortiviewCloudApps: {
    title: 'FortiView - 雲端應用程式',
    columns: ['雲端應用程式', '類別', '風險', '位元組', '連線數', '頻寬'],
    visual: 'empty',
    searchPlaceholder: '搜尋雲端服務',
    timeLabel: '現在',
  },
  fortiviewWebsites: {
    title: 'FortiView - 網站',
    columns: ['網站', '類別', '瀏覽時間', '位元組', '連線數'],
    rows: [['docs.fortinet.com', 'Information Technology', '12m 40s', '18.2 MB', '22'], ['support.fortinet.com', 'Business', '8m 10s', '9.7 MB', '11']],
    visual: 'summary',
  },
  fortiviewThreats: {
    title: 'FortiView - 威脅',
    columns: ['威脅', '嚴重性', '來源', '目的', '動作', '次數'],
    rows: [['EICAR_TEST_FILE', 'High', '10.20.40.113', '10.20.100.241', 'Blocked', '1'], ['Suspicious DNS', 'Medium', '10.20.40.118', '8.8.8.8', 'Monitored', '3']],
    visual: 'summary',
  },
  fortiviewWifi: {
    title: 'FortiView - WiFi 客戶端',
    columns: ['客戶端', 'SSID', 'FortiAP', '訊號', '位元組', '連線時間'],
    rows: [['MacBook-Pro', 'KAG-WIFI', 'FAP-U221EV', '-51 dBm', '86.4 MB', '47m'], ['iPhone', 'KAG-GUEST', 'FAP-U221EV', '-64 dBm', '12.2 MB', '18m']],
    visual: 'summary',
  },
  fortiviewTrafficShaping: {
    title: 'FortiView - 流量塑形',
    columns: ['政策', 'Shared Shaper', '目前頻寬', 'Dropped Bytes', 'Sessions'],
    rows: [['Web_Limit', 'shared-20M', '4.2 Mbps', '0 B', '21'], ['VPN_Control', 'guaranteed-5M', '1.1 Mbps', '0 B', '3']],
    visual: 'session',
  },
  fortiviewWanSources: {
    title: 'FortiView - 流量來自 WAN',
    columns: ['來源', '介面', '國家/地區', '位元組', '連線數'],
    visual: 'empty',
  },
  fortiviewWanHosts: {
    title: 'FortiView - 主機',
    columns: ['主機', 'MAC', '作業系統', '介面', '目前頻寬'],
    rows: [['WAN Client', '00:09:0f:da:1f:ad', 'Unknown', 'wan1', '0 bps']],
    visual: 'summary',
  },
  fortiviewWanThreats: {
    title: 'FortiView - WAN 威脅',
    columns: ['威脅', '來源國家', '目的', '嚴重性', '動作'],
    rows: [['Port Scan', 'Unknown', 'wan1', 'Medium', 'Dropped']],
    visual: 'summary',
  },
  fortiviewSystemEvents: {
    title: 'FortiView - 系統相關事件',
    columns: ['時間', '事件', '等級', '使用者', '訊息'],
    rows: [['09:21:13', 'Admin Login', 'information', 'admin', '登入管理介面'], ['09:20:44', 'Config Change', 'notice', 'admin', '更新安全織網設定']],
    visual: 'session',
  },
  fortiviewVpn: {
    title: 'FortiView - VPN',
    columns: ['用戶', '連線', '前次連線時間', 'VPN 類型', '持續時間', '位元組'],
    visual: 'vpn',
    searchPlaceholder: '搜尋 VPN 用戶或類型',
  },
  fortiviewEndpoint: {
    title: 'FortiView - Endpoint 漏洞',
    columns: ['Endpoint', '作業系統', '漏洞數', '嚴重性', '最後回報'],
    rows: [['VAN-200492-PC', 'Windows', '4', 'Medium', '09:10:20'], ['MacBook-Pro', 'macOS', '1', 'Low', '09:12:11']],
    visual: 'summary',
  },
  fortiviewSecurityMap: {
    title: 'FortiView - 資安威脅地圖',
    columns: ['來源國家', '目的', '威脅', '動作', '次數'],
    rows: [['Taiwan', 'FortiGate 90D', 'Malware', 'Blocked', '1'], ['United States', 'FortiGuard', 'Update', 'Allowed', '8']],
    visual: 'map',
  },
  fortiviewPolicies: {
    title: 'FortiView - 政策',
    columns: ['政策', '來源', '目的', '服務', '位元組', 'Sessions'],
    rows: [['LAN_to_WAN', 'VLAN_40', 'wan1', 'ALL', '412.2 MB', '245'], ['SSLVPN_to_LAN', 'ssl.root', 'VLAN_40', 'HTTPS', '18.1 MB', '9']],
    visual: 'session',
  },
  fortiviewInterfaces: {
    title: 'FortiView - 介面',
    columns: ['介面', '角色', 'IP', 'Rx Bytes', 'Tx Bytes', 'Sessions'],
    rows: [['wan1', 'WAN', '61.219.112.31', '182.1 MB', '64.3 MB', '88'], ['VLAN_40', 'LAN', '10.20.40.1/24', '420.3 MB', '118.1 MB', '156']],
    visual: 'session',
  },
  fortiviewSessions: {
    title: 'FortiView - 連線會話',
    columns: ['來源', '目的', '應用程式', '協定', '持續時間', '位元組'],
    rows: [['10.20.40.113:54822', '10.20.50.2:22', 'SSH', 'TCP', '00:01:12', '48.2 KB'], ['10.20.40.118:62421', 'FortiGuard:443', 'HTTPS', 'TCP', '00:00:18', '1.8 MB']],
    visual: 'session',
  },
}

function MiniChart({ tone = 'blue', spike = false }: { tone?: 'blue' | 'orange' | 'gray'; spike?: boolean }) {
  return (
    <div className={`forti-mini-chart is-${tone}`}>
      <span style={{ height: spike ? '8%' : '16%' }}></span>
      <span style={{ height: spike ? '10%' : '18%' }}></span>
      <span style={{ height: spike ? '36%' : '18%' }}></span>
      <span style={{ height: spike ? '12%' : '20%' }}></span>
      <span style={{ height: spike ? '10%' : '20%' }}></span>
      <span style={{ height: spike ? '18%' : '21%' }}></span>
      <span style={{ height: spike ? '72%' : '24%' }}></span>
    </div>
  )
}

function FortiSwitch({ checked, onChange, label }: { checked: boolean; onChange?: () => void; label?: string }) {
  if (onChange) {
    return (
      <button type="button" className="forti-switch-button" onClick={onChange} aria-pressed={checked}>
        <span className={`forti-switch ${checked ? 'is-on' : ''}`}></span>
        {label && <span>{label}</span>}
      </button>
    )
  }
  return <span className={`forti-switch ${checked ? 'is-on' : ''}`}></span>
}

export default function FortigateView() {
  const [page, setPage] = useState<FortiPage>('dashboard')
  const [openMenus, setOpenMenus] = useState<string[]>(['securityFabric', 'fortiview', 'network', 'logsReports'])
  const [interfaces, setInterfaces] = useState<FortiInterface[]>(initialInterfaces)
  const [interfaceModalMode, setInterfaceModalMode] = useState<'add' | 'edit' | null>(null)
  const [interfaceDraft, setInterfaceDraft] = useState<FortiInterface>(initialInterfaces[0])
  const [interfaceAddressMode, setInterfaceAddressMode] = useState('用戶定義')
  const [policies, setPolicies] = useState<FortiPolicy[]>(initialPolicies)
  const [routes, setRoutes] = useState<FortiRoute[]>(initialRoutes)
  const [selectedRouteId, setSelectedRouteId] = useState(initialRoutes[0].id)
  const [routeModalMode, setRouteModalMode] = useState<'add' | 'edit' | null>(null)
  const [routeDraft, setRouteDraft] = useState<FortiRoute>(initialRoutes[0])
  const [selectedInterface, setSelectedInterface] = useState('VLAN_40')
  const [interfaceMemberModalOpen, setInterfaceMemberModalOpen] = useState(false)
  const [interfaceMemberDraft, setInterfaceMemberDraft] = useState('internal5')
  const [interfaceDnsHostMode, setInterfaceDnsHostMode] = useState('與系統DNS相同')
  const [dnsMode, setDnsMode] = useState('指定')
  const [dnsTls, setDnsTls] = useState(false)
  const [sslListenPort, setSslListenPort] = useState('10443')
  const [sslTunnelRange, setSslTunnelRange] = useState('10.20.40.240 - 10.20.40.250')
  const [dnsPrimary, setDnsPrimary] = useState('168.95.1.1')
  const [dnsSecondary, setDnsSecondary] = useState('8.8.8.8')
  const [logTypeOverride, setLogTypeOverride] = useState('')
  const [fortiNotice, setFortiNotice] = useState('')
  const [refreshingArea, setRefreshingArea] = useState('')
  const [lastRefreshAt, setLastRefreshAt] = useState('09:21:43')
  const [noticeMenuOpen, setNoticeMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [fabricNodes, setFabricNodes] = useState<FortiFabricNode[]>(initialFabricNodes)
  const [fabricLinks, setFabricLinks] = useState<FortiFabricLink[]>(initialFabricLinks)
  const [fabricConnectMode, setFabricConnectMode] = useState(false)
  const [fabricConnectFrom, setFabricConnectFrom] = useState<string | null>(null)
  const [draggingFabricNode, setDraggingFabricNode] = useState<string | null>(null)
  const [selectedFabricNode, setSelectedFabricNode] = useState<string>('fgt')
  const [fabricSettings, setFabricSettings] = useState(() => readFortiStorage('fortigate.fabric.settings', defaultFabricSettings))
  const [fabricManagementInterfaces, setFabricManagementInterfaces] = useState(() => readFortiStorage('fortigate.fabric.managementInterfaces', defaultFabricManagementInterfaces))
  const [fabricInterfaceModalOpen, setFabricInterfaceModalOpen] = useState(false)
  const [fabricInterfaceDraft, setFabricInterfaceDraft] = useState('wan1')
  const [fabricAutomations, setFabricAutomations] = useState(() => readFortiStorage('fortigate.fabric.automations', defaultFabricAutomations))
  const [selectedAutomationId, setSelectedAutomationId] = useState(defaultFabricAutomations[0].id)
  const [automationModalMode, setAutomationModalMode] = useState<'add' | 'edit' | null>(null)
  const [automationDraft, setAutomationDraft] = useState({ name: '', type: 'Security Fabric', description: '', enabled: true })
  const [managedRows, setManagedRows] = useState<Partial<Record<FortiPage, FortiManagedRow[]>>>(defaultManagedRows)
  const [selectedManagedIds, setSelectedManagedIds] = useState<Partial<Record<FortiPage, string>>>({
    fabricConnectors: defaultManagedRows.fabricConnectors?.[0]?.id,
    sdwan: defaultManagedRows.sdwan?.[0]?.id,
    sdwanSla: defaultManagedRows.sdwanSla?.[0]?.id,
    sdwanRules: defaultManagedRows.sdwanRules?.[0]?.id,
    systemAdmins: defaultManagedRows.systemAdmins?.[0]?.id,
    adminProfiles: defaultManagedRows.adminProfiles?.[0]?.id,
    certificates: defaultManagedRows.certificates?.[0]?.id,
  })
  const [managedModal, setManagedModal] = useState<{ page: FortiPage; mode: 'add' | 'edit'; title: string } | null>(null)
  const [managedDraft, setManagedDraft] = useState<FortiManagedRow>({ id: '', name: '', type: '自訂', enabled: true, description: '' })
  const [genericSettings, setGenericSettings] = useState<Partial<Record<FortiPage, { enabled: boolean; mode: '啟用' | '停用'; strictHttps: boolean; logAdmin: boolean }>>>({})
  const [haMode, setHaMode] = useState('Standalone')
  const [haOverride, setHaOverride] = useState(false)
  const [haHeartbeatInterfaces, setHaHeartbeatInterfaces] = useState(['internal3', 'internal4'])
  const [haHeartbeatModalOpen, setHaHeartbeatModalOpen] = useState(false)
  const [haHeartbeatDraft, setHaHeartbeatDraft] = useState('internal5')
  const [snmpAgent, setSnmpAgent] = useState(true)
  const [fortiguardUpdateMode, setFortiguardUpdateMode] = useState('自動')
  const [fortiguardProxy, setFortiguardProxy] = useState(false)
  const [advancedCentralManagement, setAdvancedCentralManagement] = useState(true)
  const [advancedAutoBackup, setAdvancedAutoBackup] = useState(false)
  const [advancedChecks, setAdvancedChecks] = useState({ forceHttps: true, loginLock: true, weakPassword: false, logAdmin: true })

  const currentInterface = useMemo(
    () => interfaces.find((item) => item.name === selectedInterface) || interfaces[0],
    [interfaces, selectedInterface],
  )

  useEffect(() => {
    if (!fortiNotice) return undefined
    const timer = window.setTimeout(() => setFortiNotice(''), 2200)
    return () => window.clearTimeout(timer)
  }, [fortiNotice])

  useEffect(() => {
    setLogTypeOverride('')
  }, [page])

  useEffect(() => {
    writeFortiStorage('fortigate.fabric.settings', fabricSettings)
  }, [fabricSettings])

  useEffect(() => {
    writeFortiStorage('fortigate.fabric.managementInterfaces', fabricManagementInterfaces)
  }, [fabricManagementInterfaces])

  useEffect(() => {
    writeFortiStorage('fortigate.fabric.automations', fabricAutomations)
    if (fabricAutomations.length && !fabricAutomations.some((item) => item.id === selectedAutomationId)) {
      setSelectedAutomationId(fabricAutomations[0].id)
    }
    if (!fabricAutomations.length && selectedAutomationId) setSelectedAutomationId('')
  }, [fabricAutomations])

  function updateCurrentInterface(field: keyof FortiInterface, value: string) {
    setInterfaces((items) => items.map((item) => item.name === currentInterface.name ? { ...item, [field]: value } : item))
  }

  function toggleCurrentInterfaceAccess(access: string) {
    setInterfaces((items) => items.map((item) => {
      if (item.name !== currentInterface.name) return item
      const exists = item.access.includes(access)
      return { ...item, access: exists ? item.access.filter((entry) => entry !== access) : [...item.access, access] }
    }))
  }

  function toggleCurrentInterfaceDhcp() {
    setInterfaces((items) => items.map((item) => item.name === currentInterface.name ? { ...item, dhcp: item.dhcp ? '' : '10.20.40.100 - 10.20.40.200' } : item))
  }

  function addInterfaceMember() {
    const member = interfaceMemberDraft.trim()
    if (!member) return
    setInterfaces((items) => items.map((item) => {
      if (item.name !== currentInterface.name) return item
      const members = item.members || [item.name]
      return members.includes(member) ? item : { ...item, members: [...members, member] }
    }))
    setInterfaceMemberModalOpen(false)
    setLastAction(`已新增介面成員 ${member}`)
  }

  function removeInterfaceMember(member: string) {
    setInterfaces((items) => items.map((item) => {
      if (item.name !== currentInterface.name) return item
      const members = (item.members || [item.name]).filter((entry) => entry !== member)
      return { ...item, members: members.length ? members : [item.name] }
    }))
    setLastAction(`已移除介面成員 ${member}`)
  }

  function openInterfaceModal(mode: 'add' | 'edit') {
    setInterfaceModalMode(mode)
    setInterfaceDraft(mode === 'edit' ? currentInterface : {
      name: `port${interfaces.length + 1}`,
      alias: 'New interface',
      type: '實體介面',
      role: 'LAN',
      ip: '0.0.0.0/0',
      access: ['PING'],
      status: 'down',
    })
  }

  function saveInterface() {
    const name = interfaceDraft.name.trim()
    if (!name) return
    if (interfaceModalMode === 'edit') {
      setInterfaces((items) => items.map((item) => item.name === selectedInterface ? { ...interfaceDraft, name } : item))
      setSelectedInterface(name)
    } else {
      const next = { ...interfaceDraft, name }
      setInterfaces((items) => [...items.filter((item) => item.name !== name), next])
      setSelectedInterface(name)
    }
    setInterfaceModalMode(null)
    setLastAction('介面設定已儲存')
  }

  function deleteCurrentInterface() {
    setInterfaces((items) => {
      const next = items.filter((item) => item.name !== selectedInterface)
      setSelectedInterface(next[0]?.name || '')
      return next.length ? next : initialInterfaces
    })
    setLastAction('介面已刪除')
  }

  function setLastAction(message: string) {
    setFortiNotice(message)
  }

  function refreshFortiArea(label: string) {
    const now = new Date()
    setRefreshingArea(label)
    setLastRefreshAt(now.toLocaleTimeString('zh-TW', { hour12: false }))
    setLastAction(`${label} 已重新整理`)
    window.setTimeout(() => setRefreshingArea(''), 700)
  }

  function togglePolicy(id: number) {
    setPolicies((items) => items.map((item) => item.id === id ? { ...item, status: item.status === '啟用' ? '停用' : '啟用' } : item))
    setLastAction(`政策 ${id} 狀態已切換`)
  }

  function openRouteModal(mode: 'add' | 'edit') {
    const selected = routes.find((route) => route.id === selectedRouteId) || routes[0]
    setRouteDraft(mode === 'edit' && selected ? selected : {
      id: Date.now(),
      enabled: true,
      destination: '10.20.0.0/24',
      gateway: '10.20.40.254',
      interfaceName: selectedInterface || 'wan1',
      distance: '10',
      priority: '0',
    })
    setRouteModalMode(mode)
  }

  function saveRoute() {
    if (routeModalMode === 'edit') {
      setRoutes((items) => items.map((item) => item.id === selectedRouteId ? routeDraft : item))
    } else {
      setRoutes((items) => [...items, routeDraft])
      setSelectedRouteId(routeDraft.id)
    }
    setRouteModalMode(null)
    setLastAction('靜態路由已儲存')
  }

  function deleteSelectedRoute() {
    setRoutes((items) => {
      const next = items.filter((item) => item.id !== selectedRouteId)
      setSelectedRouteId(next[0]?.id || 0)
      return next
    })
    setLastAction('靜態路由已刪除')
  }

  function toggleRoute(id: number) {
    setRoutes((items) => items.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))
  }

  function menuContainsPage(section: FortiMenuSection, activePage: FortiPage) {
    if (section.page === activePage) return true
    return !!section.children?.some((child) => child.id === activePage)
  }

  function openMenu(section: FortiMenuSection) {
    if (!section.children?.length) {
      if (section.page) setPage(section.page)
      return
    }
    setOpenMenus((items) => {
      const isOpen = items.includes(section.id)
      return isOpen ? items.filter((item) => item !== section.id) : [...items, section.id]
    })
    if (!menuContainsPage(section, page)) setPage(section.children[0].id)
  }

  function getPageLabel(activePage: FortiPage) {
    for (const section of fortiGroups) {
      if (section.page === activePage) return section.label
      const child = section.children?.find((item) => item.id === activePage)
      if (child) return child.label
    }
    return '儀表板'
  }

  function addFabricNode(kind: 'switch' | 'ap' | 'client' | 'cloud') {
    const labels = {
      switch: ['FortiSwitch', 'Managed switch', 'bx-transfer'],
      ap: ['FortiAP', 'Wireless AP', 'bx-wifi'],
      client: ['Endpoint', 'Client device', 'bx-laptop'],
      cloud: ['Cloud', 'External network', 'bx-cloud'],
    } as const
    const [label, detail, icon] = labels[kind]
    const next = fabricNodes.length + 1
    const id = `${kind}-${Date.now()}`
    const size = kind === 'cloud' ? 118 : kind === 'switch' ? 132 : kind === 'client' ? 106 : 92
    setFabricNodes((nodes) => [...nodes, {
      id,
      label: `${label} ${next}`,
      detail,
      icon,
      size,
      x: 180 + ((next * 91) % 470),
      y: 90 + ((next * 63) % 310),
    }])
    setSelectedFabricNode(id)
    setLastAction(`已新增 ${label} 節點`)
  }

  function connectFabricNode(id: string) {
    setSelectedFabricNode(id)
    if (!fabricConnectMode) return
    if (!fabricConnectFrom) {
      setFabricConnectFrom(id)
      setLastAction('請選擇第二個節點以建立關係線')
      return
    }
    if (fabricConnectFrom === id) {
      setFabricConnectFrom(null)
      return
    }
    const exists = fabricLinks.some((link) => (link.from === fabricConnectFrom && link.to === id) || (link.from === id && link.to === fabricConnectFrom))
    if (!exists) setFabricLinks((links) => [...links, { from: fabricConnectFrom, to: id }])
    setFabricConnectFrom(null)
    setLastAction('已建立拓樸關係線')
  }

  function deleteSelectedFabricNode() {
    if (selectedFabricNode === 'fgt') {
      setLastAction('FortiGate 根節點不可刪除')
      return
    }
    const node = fabricNodes.find((item) => item.id === selectedFabricNode)
    if (!node) {
      setLastAction('請先選取要刪除的拓樸物件')
      return
    }
    setFabricNodes((nodes) => nodes.filter((item) => item.id !== selectedFabricNode))
    setFabricLinks((links) => links.filter((item) => item.from !== selectedFabricNode && item.to !== selectedFabricNode))
    setSelectedFabricNode('fgt')
    setFabricConnectFrom(null)
    setLastAction(`已刪除拓樸物件：${node.label}`)
  }

  function removeLastFabricLink() {
    setFabricLinks((links) => links.slice(0, -1))
    setLastAction('已移除最後一條拓樸關係線')
  }

  function moveFabricNode(event: MouseEvent<HTMLDivElement>) {
    if (!draggingFabricNode) return
    const rect = event.currentTarget.getBoundingClientRect()
    const node = fabricNodes.find((item) => item.id === draggingFabricNode)
    const size = node?.size || 120
    const x = Math.max(8, Math.min(event.clientX - rect.left - (size / 2), rect.width - size - 8))
    const y = Math.max(8, Math.min(event.clientY - rect.top - (size / 2), rect.height - size - 8))
    setFabricNodes((nodes) => nodes.map((node) => node.id === draggingFabricNode ? { ...node, x, y } : node))
  }

  function toggleFabricSetting(key: keyof typeof fabricSettings) {
    setFabricSettings((settings) => ({ ...settings, [key]: !settings[key] }))
  }

  function addFabricManagementInterface() {
    const nextInterface = fabricInterfaceDraft.trim()
    if (!nextInterface || fabricManagementInterfaces.includes(nextInterface)) {
      setFabricInterfaceModalOpen(false)
      return
    }
    setFabricManagementInterfaces((items) => [...items, nextInterface])
    setFabricInterfaceModalOpen(false)
  }

  function removeFabricManagementInterface(name: string) {
    setFabricManagementInterfaces((items) => items.filter((item) => item !== name))
  }

  function openAutomationModal(mode: 'add' | 'edit') {
    if (mode === 'edit') {
      const item = fabricAutomations.find((automation) => automation.id === selectedAutomationId)
      if (!item) return
      setAutomationDraft({ name: item.name, type: item.type, description: item.description, enabled: item.enabled })
    } else {
      setAutomationDraft({ name: `Automation_${fabricAutomations.length + 1}`, type: 'Security Fabric', description: 'Custom automation stitch', enabled: true })
    }
    setAutomationModalMode(mode)
  }

  function saveAutomation() {
    const name = automationDraft.name.trim()
    if (!name) return
    if (automationModalMode === 'edit') {
      setFabricAutomations((items) => items.map((item) => item.id === selectedAutomationId ? { ...item, ...automationDraft, name } : item))
    } else {
      const id = `auto-${Date.now()}`
      setFabricAutomations((items) => [...items, { id, ...automationDraft, name }])
      setSelectedAutomationId(id)
    }
    setAutomationModalMode(null)
  }

  function deleteSelectedAutomation() {
    setFabricAutomations((items) => {
      const next = items.filter((item) => item.id !== selectedAutomationId)
      setSelectedAutomationId(next[0]?.id || '')
      return next
    })
  }

  function getManagedRows(activePage: FortiPage, title: string) {
    return managedRows[activePage] || [
      { id: `${activePage}-default`, name: `${title}_default`, type: '系統預設', enabled: true, description: '參照 1' },
      { id: `${activePage}-custom`, name: `${title}_custom`, type: '自訂', enabled: false, description: '參照 0' },
    ]
  }

  function setManagedRowsForPage(activePage: FortiPage, updater: (rows: FortiManagedRow[]) => FortiManagedRow[]) {
    const title = getPageLabel(activePage)
    setManagedRows((items) => ({ ...items, [activePage]: updater(getManagedRows(activePage, title)) }))
  }

  function setSelectedManagedId(activePage: FortiPage, id: string) {
    setSelectedManagedIds((items) => ({ ...items, [activePage]: id }))
  }

  function openManagedModal(activePage: FortiPage, title: string, mode: 'add' | 'edit') {
    const rows = getManagedRows(activePage, title)
    const selectedId = selectedManagedIds[activePage] || rows[0]?.id || ''
    const selected = rows.find((row) => row.id === selectedId) || rows[0]
    if (mode === 'edit' && !selected) return
    setManagedDraft(mode === 'edit' && selected ? selected : {
      id: `${activePage}-${Date.now()}`,
      name: `${title}_new`,
      type: '自訂',
      enabled: true,
      description: `${title} 自訂項目`,
      selected: false,
    })
    setManagedModal({ page: activePage, mode, title })
  }

  function saveManagedRow() {
    if (!managedModal) return
    const name = managedDraft.name.trim()
    if (!name) return
    const nextDraft = { ...managedDraft, name }
    if (managedModal.mode === 'edit') {
      setManagedRowsForPage(managedModal.page, (rows) => rows.map((row) => row.id === managedDraft.id ? nextDraft : row))
    } else {
      setManagedRowsForPage(managedModal.page, (rows) => [...rows, nextDraft])
      setSelectedManagedId(managedModal.page, nextDraft.id)
    }
    setManagedModal(null)
    setLastAction(`${managedModal.title} 已儲存`)
  }

  function deleteManagedRow(activePage: FortiPage, title: string) {
    const rows = getManagedRows(activePage, title)
    const selectedId = selectedManagedIds[activePage] || rows[0]?.id || ''
    setManagedRowsForPage(activePage, (items) => {
      const next = items.filter((item) => item.id !== selectedId)
      setSelectedManagedId(activePage, next[0]?.id || '')
      return next
    })
    setLastAction(`${title} 已刪除選取項目`)
  }

  function toggleManagedRow(activePage: FortiPage, title: string, id: string) {
    setManagedRowsForPage(activePage, (rows) => rows.map((row) => row.id === id ? { ...row, enabled: !row.enabled } : row))
    setLastAction(`${title} 狀態已切換`)
  }

  function getGenericSetting(activePage: FortiPage) {
    return genericSettings[activePage] || { enabled: true, mode: '啟用', strictHttps: true, logAdmin: true }
  }

  function updateGenericSetting(activePage: FortiPage, patch: Partial<{ enabled: boolean; mode: '啟用' | '停用'; strictHttps: boolean; logAdmin: boolean }>) {
    setGenericSettings((items) => ({ ...items, [activePage]: { ...getGenericSetting(activePage), ...patch } }))
  }

  function addHaHeartbeatInterface() {
    const nextInterface = haHeartbeatDraft.trim()
    if (!nextInterface || haHeartbeatInterfaces.includes(nextInterface)) {
      setHaHeartbeatModalOpen(false)
      return
    }
    setHaHeartbeatInterfaces((items) => [...items, nextInterface])
    setHaHeartbeatModalOpen(false)
    setLastAction(`已新增心跳介面 ${nextInterface}`)
  }

  function removeHaHeartbeatInterface(name: string) {
    setHaHeartbeatInterfaces((items) => items.filter((item) => item !== name))
    setLastAction(`已移除心跳介面 ${name}`)
  }

  function renderDashboard() {
    return (
      <div className="forti-workspace-grid">
        <section className="forti-widget">
          <div className="forti-widget-title">系統資訊</div>
          <div className="forti-info-grid">
            <span>主機名稱</span><strong>FGT90D3Z16007115</strong>
            <span>序號</span><strong>FGT90D3Z16007115</strong>
            <span>韌體</span><strong>v6.0.14 build0457 (GA)</strong>
            <span>模式</span><strong>NAT (Flow-based)</strong>
            <span>系統時間</span><strong>2026/06/22 09:21:36</strong>
            <span>WAN IP</span><strong>61.219.112.31</strong>
          </div>
        </section>
        <section className="forti-widget">
          <div className="forti-widget-title">安全織網</div>
          <div className="forti-fabric-icons">
            {['bx-bar-chart-alt-2', 'bx-time', 'bx-cloud', 'bx-clipboard', 'bx-envelope', 'bx-wifi'].map((icon) => <i key={icon} className={`bx ${icon}`}></i>)}
          </div>
          <div className="forti-device-line"><i className="bx bx-server"></i> FGT90D3Z16007115</div>
          <div className="forti-warning">FortiGate Telemetry 已關閉</div>
        </section>
        <section className="forti-widget">
          <div className="forti-widget-title">系統管理者</div>
          <div className="forti-admin-line"><span>1</span> HTTPS <span>0</span> FortiExplorer</div>
          <a href="#" onClick={(e) => e.preventDefault()}>admin</a> <span className="text-muted">super_admin</span>
        </section>
        <section className="forti-widget forti-chart-widget">
          <div className="forti-widget-title">CPU <span>1 分鐘</span></div>
          <MiniChart spike />
          <div className="forti-chart-foot">目前使用量 <strong>70%</strong></div>
        </section>
        <section className="forti-widget forti-chart-widget forti-wide">
          <div className="forti-widget-title">記憶體 <span>1 分鐘</span></div>
          <MiniChart tone="orange" />
          <div className="forti-chart-foot">目前使用量 <strong>27%</strong></div>
        </section>
        <section className="forti-widget forti-chart-widget forti-wide">
          <div className="forti-widget-title">連線數 <span>1 分鐘</span></div>
          <MiniChart tone="gray" />
          <div className="forti-chart-foot">目前連線數 <strong>423</strong> <span>SPU 54.4%</span></div>
        </section>
      </div>
    )
  }

  function renderInterfaces() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">網路介面</div>
        <div className="forti-toolbar">
          <select className="form-select form-select-sm forti-select" value={selectedInterface} onChange={(e) => setSelectedInterface(e.target.value)}>
            {interfaces.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
          </select>
          <button className="btn btn-sm forti-btn" onClick={() => openInterfaceModal('add')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openInterfaceModal('edit')}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteCurrentInterface}>刪除</button>
          <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === '網路介面' ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea('網路介面')}><i className="bx bx-refresh"></i></button>
        </div>
        <div className="forti-form-section">
          <label>介面名稱</label><input className="form-control form-control-sm" value={currentInterface.name} readOnly />
          <label>別名</label><input className="form-control form-control-sm" value={currentInterface.alias} onChange={(e) => updateCurrentInterface('alias', e.target.value)} />
          <label>類型</label><input className="form-control form-control-sm" value={currentInterface.type} readOnly />
          <label>角色</label>
          <select className="form-select form-select-sm" value={currentInterface.role} onChange={(e) => updateCurrentInterface('role', e.target.value)}>
            <option>LAN</option><option>WAN</option><option>DMZ</option><option>Undefined</option>
          </select>
          <label>介面成員</label>
          <div className="forti-chip-box">
            {(currentInterface.members || [currentInterface.name]).map((member) => (
              <span className="forti-chip" key={member}>
                {member}
                <button type="button" className="forti-chip-remove" onClick={() => removeInterfaceMember(member)} aria-label={`移除 ${member}`}>×</button>
              </span>
            ))}
            <button className="forti-chip-add" onClick={() => setInterfaceMemberModalOpen(true)}>+</button>
          </div>
        </div>
        <div className="forti-band">位址物件</div>
        <div className="forti-form-section">
          <label>位址模式</label><div className="forti-segments">{['用戶定義', 'DHCP', 'PPPoE', '專屬於 FortiSwitch'].map((mode) => <button key={mode} className={interfaceAddressMode === mode ? 'active' : ''} onClick={() => setInterfaceAddressMode(mode)}>{mode}</button>)}</div>
          <label>IP/網路遮罩</label><input className="form-control form-control-sm" value={currentInterface.ip} onChange={(e) => updateCurrentInterface('ip', e.target.value)} />
        </div>
        <div className="forti-band">管理存取</div>
        <div className="forti-access-grid">
          {['HTTPS', 'HTTP', 'PING', 'FMG-Access', 'CAPWAP', 'SSH', 'SNMP', 'FTM', 'RADIUS Accounting', 'FortiTelemetry'].map((access) => (
            <label key={access}><input type="checkbox" checked={currentInterface.access.includes(access)} onChange={() => toggleCurrentInterfaceAccess(access)} /> {access}</label>
          ))}
        </div>
        <div className="forti-band">DHCP 主機</div>
        <div className="forti-form-section">
          <label>DHCP</label><FortiSwitch checked={!!currentInterface.dhcp} onChange={toggleCurrentInterfaceDhcp} label={currentInterface.dhcp ? '啟用' : '停用'} />
          <label>位址範圍</label><input className="form-control form-control-sm" value={currentInterface.dhcp || ''} onChange={(e) => updateCurrentInterface('dhcp', e.target.value)} />
          <label>網路遮罩</label><input className="form-control form-control-sm" defaultValue="255.255.255.0" />
          <label>DNS主機位址</label><div className="forti-segments">{['與系統DNS相同', '與介面IP相同', '指定'].map((mode) => <button key={mode} className={interfaceDnsHostMode === mode ? 'active' : ''} onClick={() => setInterfaceDnsHostMode(mode)}>{mode}</button>)}</div>
        </div>
        {interfaceMemberModalOpen && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label="新增介面成員">
              <div className="forti-modal-title">新增介面成員</div>
              <label>成員介面</label>
              <select className="form-select form-select-sm" value={interfaceMemberDraft} onChange={(event) => setInterfaceMemberDraft(event.target.value)}>
                {['internal1', 'internal2', 'internal3', 'internal4', 'internal5', 'wan1', 'wan2', 'dmz'].map((item) => <option key={item}>{item}</option>)}
              </select>
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setInterfaceMemberModalOpen(false)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={addInterfaceMember}>新增</button>
              </div>
            </div>
          </div>
        )}
        {interfaceModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label={interfaceModalMode === 'add' ? '新增介面' : '編輯介面'}>
              <div className="forti-modal-title">{interfaceModalMode === 'add' ? '新增介面' : '編輯介面'}</div>
              <label>介面名稱</label>
              <input className="form-control form-control-sm" value={interfaceDraft.name} onChange={(event) => setInterfaceDraft((draft) => ({ ...draft, name: event.target.value }))} />
              <label className="mt-2">別名</label>
              <input className="form-control form-control-sm" value={interfaceDraft.alias} onChange={(event) => setInterfaceDraft((draft) => ({ ...draft, alias: event.target.value }))} />
              <label className="mt-2">角色</label>
              <select className="form-select form-select-sm" value={interfaceDraft.role} onChange={(event) => setInterfaceDraft((draft) => ({ ...draft, role: event.target.value }))}>
                <option>LAN</option><option>WAN</option><option>DMZ</option><option>Undefined</option>
              </select>
              <label className="mt-2">IP/網路遮罩</label>
              <input className="form-control form-control-sm" value={interfaceDraft.ip} onChange={(event) => setInterfaceDraft((draft) => ({ ...draft, ip: event.target.value }))} />
              <label className="mt-2">狀態</label>
              <FortiSwitch checked={interfaceDraft.status === 'up'} onChange={() => setInterfaceDraft((draft) => ({ ...draft, status: draft.status === 'up' ? 'down' : 'up' }))} label={interfaceDraft.status === 'up' ? '啟用' : '停用'} />
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setInterfaceModalMode(null)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={saveInterface}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderDns() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">DNS 設定</div>
        <div className="forti-form-section">
          <label>DNS 伺服器</label><div className="forti-segments">{['指定', '從 ISP 取得'].map((mode) => <button key={mode} className={dnsMode === mode ? 'active' : ''} onClick={() => setDnsMode(mode)}>{mode}</button>)}</div>
          <label>主要 DNS</label><input className="form-control form-control-sm" value={dnsPrimary} onChange={(e) => setDnsPrimary(e.target.value)} />
          <label>次要 DNS</label><input className="form-control form-control-sm" value={dnsSecondary} onChange={(e) => setDnsSecondary(e.target.value)} />
          <label>DNS over TLS</label><FortiSwitch checked={dnsTls} onChange={() => setDnsTls((enabled) => !enabled)} label={dnsTls ? '啟用' : '停用'} />
          <label>本機網域名稱</label><input className="form-control form-control-sm" defaultValue="fortigate.local" />
        </div>
        <div className="forti-centered-actions">
          <button className="btn forti-apply" onClick={() => setLastAction('DNS 設定已套用')}>套用</button>
        </div>
      </div>
    )
  }

  function renderRoutes() {
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">靜態路由</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openRouteModal('add')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openRouteModal('edit')} disabled={!selectedRouteId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedRoute} disabled={!selectedRouteId}>刪除</button>
          <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === '靜態路由' ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea('靜態路由')}><i className="bx bx-refresh"></i></button>
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>狀態</th><th>目的地</th><th>閘道</th><th>介面</th><th>距離</th><th>優先權</th></tr></thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.id} className={route.id === selectedRouteId ? 'is-selected' : ''} onClick={() => setSelectedRouteId(route.id)}>
                <td><FortiSwitch checked={route.enabled} onChange={() => toggleRoute(route.id)} /></td>
                <td>{route.destination}</td><td>{route.gateway}</td><td>{route.interfaceName}</td><td>{route.distance}</td><td>{route.priority}</td>
              </tr>
            ))}
            {!routes.length && <tr><td colSpan={6} className="forti-table-empty">無靜態路由</td></tr>}
          </tbody>
        </table>
        {routeModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label={routeModalMode === 'add' ? '新增靜態路由' : '編輯靜態路由'}>
              <div className="forti-modal-title">{routeModalMode === 'add' ? '新增靜態路由' : '編輯靜態路由'}</div>
              <label>目的地</label>
              <input className="form-control form-control-sm" value={routeDraft.destination} onChange={(event) => setRouteDraft((draft) => ({ ...draft, destination: event.target.value }))} />
              <label className="mt-2">閘道</label>
              <input className="form-control form-control-sm" value={routeDraft.gateway} onChange={(event) => setRouteDraft((draft) => ({ ...draft, gateway: event.target.value }))} />
              <label className="mt-2">介面</label>
              <select className="form-select form-select-sm" value={routeDraft.interfaceName} onChange={(event) => setRouteDraft((draft) => ({ ...draft, interfaceName: event.target.value }))}>
                {interfaces.map((item) => <option key={item.name}>{item.name}</option>)}
              </select>
              <label className="mt-2">距離</label>
              <input className="form-control form-control-sm" value={routeDraft.distance} onChange={(event) => setRouteDraft((draft) => ({ ...draft, distance: event.target.value }))} />
              <label className="mt-2">優先權</label>
              <input className="form-control form-control-sm" value={routeDraft.priority} onChange={(event) => setRouteDraft((draft) => ({ ...draft, priority: event.target.value }))} />
              <label className="mt-2">狀態</label>
              <FortiSwitch checked={routeDraft.enabled} onChange={() => setRouteDraft((draft) => ({ ...draft, enabled: !draft.enabled }))} label={routeDraft.enabled ? '啟用' : '停用'} />
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setRouteModalMode(null)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={saveRoute}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderPolicy() {
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">IPv4 政策</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => setLastAction('IPv4 政策新增視窗已開啟')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction('IPv4 政策編輯視窗已開啟')}>編輯</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction('IPv4 政策已複製')}>複製</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction('IPv4 政策移動視窗已開啟')}>移至</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => setLastAction('IPv4 政策已刪除選取項目')}>刪除</button>
          <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === 'IPv4 政策' ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea('IPv4 政策')}><i className="bx bx-refresh"></i></button>
        </div>
        <table className="forti-table">
          <thead><tr><th>ID</th><th>名稱</th><th>來源</th><th>目的地</th><th>服務</th><th>動作</th><th>NAT</th><th>狀態</th></tr></thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id}>
                <td>{policy.id}</td><td>{policy.name}</td><td>{policy.source}</td><td>{policy.destination}</td><td>{policy.service}</td>
                <td><span className={policy.action === 'ACCEPT' ? 'forti-pill success' : 'forti-pill danger'}>{policy.action}</span></td>
                <td>{policy.nat ? '啟用' : '停用'}</td>
                <td><button className="forti-switch-button" onClick={() => togglePolicy(policy.id)}><FortiSwitch checked={policy.status === '啟用'} /> {policy.status}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function renderSslVpn() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">SSL-VPN 設定</div>
        <div className="forti-band">連線設定</div>
        <div className="forti-form-section">
          <label>監聽介面</label><div className="forti-chip-box"><span className="forti-chip">wan1<i className="bx bx-x"></i></span><button className="forti-chip-add">+</button></div>
          <label>監聽埠號</label><input className="form-control form-control-sm" value={sslListenPort} onChange={(e) => setSslListenPort(e.target.value)} />
          <label></label><div className="forti-info-note">Web訪問的方式將被監聽 https://61.219.112.31:{sslListenPort}</div>
          <label>重新導向 HTTP 至 SSL-VPN</label><FortiSwitch checked={false} />
          <label>限制存取</label><div className="forti-segments"><button>允許從任何主機訪問</button><button className="active">限制訪問特定的主機</button></div>
          <label>主機</label><div className="forti-chip-box"><span className="forti-chip">Taiwan_ip<i className="bx bx-x"></i></span><button className="forti-chip-add">+</button></div>
          <label>閒置逾時</label><input className="form-control form-control-sm" defaultValue="300 秒" />
          <label>伺服器憑證</label><select className="form-select form-select-sm" defaultValue="Fortinet_Factory"><option>Fortinet_Factory</option><option>Local_Cert</option></select>
          <label></label><div className="forti-alert-note">你正在使用一個預設的內建CA憑證，將不能驗證伺服器的網域名稱。</div>
        </div>
        <div className="forti-band">通道模式客戶端設定</div>
        <div className="forti-form-section">
          <label>位址範圍</label><div className="forti-segments"><button className="active">自動分配位址</button><button>指定自訂IP範圍</button></div>
          <label>通道 IP 範圍</label><input className="form-control form-control-sm" value={sslTunnelRange} onChange={(e) => setSslTunnelRange(e.target.value)} />
          <label>DNS 伺服器 #1</label><input className="form-control form-control-sm" defaultValue={dnsPrimary} />
          <label>DNS 伺服器 #2</label><input className="form-control form-control-sm" defaultValue={dnsSecondary} />
        </div>
        <button className="btn forti-apply" onClick={() => setLastAction('SSL-VPN 設定已套用')}>套用</button>
      </div>
    )
  }

  function renderUserDefinition() {
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">用戶認證</div>
        <div className="forti-toolbar"><button className="btn btn-sm forti-btn" onClick={() => setLastAction('用戶認證新增視窗已開啟')}>新增</button><button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction('用戶認證編輯視窗已開啟')}>編輯用戶</button><button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction('用戶認證已複製')}>複製</button><button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction('用戶認證已刪除選取項目')}>刪除</button><button className={`btn btn-sm btn-outline-secondary ${refreshingArea === '用戶認證' ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea('用戶認證')}><i className="bx bx-refresh"></i></button><input className="form-control form-control-sm" placeholder="搜尋" /></div>
        <table className="forti-table"><thead><tr><th>用戶名稱</th><th>類型</th><th>雙因素認證</th><th>參照</th></tr></thead><tbody>
          <tr><td>phgate</td><td><i className="bx bx-user"></i> 本地</td><td><span className="forti-pill danger">停用</span></td><td>1</td></tr>
          <tr><td>admin</td><td><i className="bx bx-user"></i> 本地</td><td><span className="forti-pill muted">不適用</span></td><td>3</td></tr>
          <tr><td>vpn_user</td><td><i className="bx bx-user"></i> 本地</td><td><span className="forti-pill success">啟用</span></td><td>2</td></tr>
        </tbody></table>
      </div>
    )
  }

  function renderUserGroups() {
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">用戶群組</div>
        <div className="forti-toolbar"><button className="btn btn-sm forti-btn" onClick={() => setLastAction('用戶群組新增視窗已開啟')}>新增</button><button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction('用戶群組編輯視窗已開啟')}>編輯</button><button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction('用戶群組已刪除選取項目')}>刪除</button><button className={`btn btn-sm btn-outline-secondary ${refreshingArea === '用戶群組' ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea('用戶群組')}><i className="bx bx-refresh"></i></button><input className="form-control form-control-sm" placeholder="搜尋群組" /></div>
        <table className="forti-table"><thead><tr><th>群組名稱</th><th>類型</th><th>成員</th><th>參照</th></tr></thead><tbody>
          <tr><td>SSLVPN_Users</td><td>防火牆</td><td>vpn_user, Taiwan_ip</td><td>2</td></tr>
          <tr><td>Firewall_Admins</td><td>防火牆</td><td>admin</td><td>1</td></tr>
          <tr><td>Guest-group</td><td>訪客</td><td>guest</td><td>0</td></tr>
        </tbody></table>
      </div>
    )
  }

  function renderFortiViewVisual(config: FortiViewConfig) {
    if (config.visual === 'bubble') {
      return (
        <div className="forti-view-visual forti-bubble-map">
          <span className="bubble xl">HTTPS.BROWSER</span>
          <span className="bubble lg">BitTorrent</span>
          <span className="bubble md">SSL</span>
          <span className="bubble sm">DNS</span>
          <span className="bubble sm alt">Teams</span>
          <span className="bubble xs">QUIC</span>
        </div>
      )
    }
    if (config.visual === 'map') {
      return (
        <div className="forti-view-visual forti-threat-map">
          <div className="forti-map-dot is-tw">TW</div>
          <div className="forti-map-dot is-us">US</div>
          <div className="forti-map-dot is-eu">EU</div>
          <div className="forti-map-line"></div>
          <strong>Threat Map</strong>
          <span>依來源地區彙整威脅與 FortiGuard 事件</span>
        </div>
      )
    }
    if (config.visual === 'vpn') {
      return (
        <div className="forti-view-visual forti-vpn-visual">
          <div className="forti-view-mode-tabs"><button>Realtime Map</button><button className="active">歷史</button></div>
          <div className="forti-empty-chart">無結果</div>
        </div>
      )
    }
    if (config.visual === 'session') {
      return (
        <div className="forti-view-visual forti-session-strip">
          <MiniChart tone="gray" />
          <div><strong>245</strong><span>目前連線</span></div>
          <div><strong>52.7%</strong><span>SPU 使用率</span></div>
          <div><strong>0</strong><span>Dropped</span></div>
        </div>
      )
    }
    if (config.visual === 'summary') {
      return (
        <div className="forti-view-visual forti-summary-visual">
          <div className="forti-view-summary-card"><i className="bx bx-user"></i><strong>10.20.40.113</strong><span>689.19 MB</span></div>
          <MiniChart spike />
        </div>
      )
    }
    return <div className="forti-empty-chart">無結果</div>
  }

  function renderFortiView(activePage: FortiPage) {
    const config = fortiViewConfigs[activePage] || {
      title: `FortiView - ${getPageLabel(activePage)}`,
      columns: ['名稱', '類別', '位元組', '連線數'],
      visual: 'empty' as const,
    }
    const rows = config.rows || []
    return (
      <div className="forti-table-page forti-fortiview">
        <div className="forti-section-title">{config.title}</div>
        <div className="forti-toolbar forti-viewbar">
          <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === config.title ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea(config.title)}><i className="bx bx-refresh"></i></button>
          <button className="btn btn-sm forti-btn" onClick={() => setLastAction(`${config.title} 過濾條件視窗已開啟`)}>新增過濾條件</button>
          <input className="form-control form-control-sm" placeholder={config.searchPlaceholder || '搜尋來源、目的、應用程式'} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction(`${config.title} 已切換表格檢視`)}><i className="bx bx-table"></i></button>
          <select className="form-select form-select-sm" defaultValue={config.timeLabel || '5 分鐘'}><option>現在</option><option>5 分鐘</option><option>1 小時</option><option>24 小時</option></select>
        </div>
        {renderFortiViewVisual(config)}
        <table className="forti-table">
          <thead><tr>{config.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {rows.length ? rows.map((row, rowIndex) => (
              <tr key={`${config.title}-${rowIndex}`}>{config.columns.map((column, columnIndex) => <td key={column}>{row[columnIndex] || '-'}</td>)}</tr>
            )) : (
              <tr><td colSpan={config.columns.length} className="forti-table-empty">無結果</td></tr>
            )}
          </tbody>
        </table>
        <div className="forti-view-updated">0 | Updated: {lastRefreshAt}</div>
      </div>
    )
  }

  function renderLogs(activePage: FortiPage) {
    const title = getPageLabel(activePage)
    const selectedType = logTypeOverride || logTypeByPage[activePage] || title
    const rows = fortiLogs.filter((log) => log.type === selectedType)
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">{title}</div>
        <div className="forti-toolbar">
          <select className="form-select form-select-sm forti-select" value={selectedType} onChange={(event) => { setLogTypeOverride(event.target.value); setLastAction(`目前正在檢視 ${event.target.value}`) }}>
            {['系統事件', 'VPN事件', '防毒', 'DNS查詢', 'WiFi事件', '用戶事件', '轉發流量', '路由事件'].map((type) => <option key={type}>{type}</option>)}
          </select>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction(`${title} 已匯出`)}>匯出</button>
          <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === title ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea(title)}>重新整理</button>
        </div>
        <table className="forti-table">
          <thead><tr><th>時間</th><th>類型</th><th>等級</th><th>來源</th><th>訊息</th></tr></thead>
          <tbody>
            {rows.map((log) => <tr key={`${log.time}-${log.message}`}><td>{log.time}</td><td>{log.type}</td><td>{log.level}</td><td>{log.src}</td><td>{log.message}</td></tr>)}
            {!rows.length && <tr><td colSpan={5} className="forti-table-empty">{title} 目前無資料</td></tr>}
          </tbody>
        </table>
      </div>
    )
  }

  function renderPacket() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">封包擷取</div>
        <div className="forti-packet-grid">
          <section className="forti-group-card">
            <strong>擷取條件</strong>
            <div className="forti-form-section forti-compact-form">
              <label>介面</label><select className="form-select form-select-sm" defaultValue="wan1"><option>wan1</option><option>VLAN_40</option><option>ssl.root</option></select>
              <label>協定</label><select className="form-select form-select-sm"><option>Any</option><option>TCP</option><option>UDP</option><option>ICMP</option></select>
              <label>擷取數量</label><input className="form-control form-control-sm" defaultValue="1000" />
            </div>
          </section>
          <section className="forti-group-card">
            <strong>封包過濾</strong>
            <div className="forti-form-section forti-compact-form">
              <label>主機</label><input className="form-control form-control-sm" defaultValue="10.20.40.113" />
              <label>埠號</label><input className="form-control form-control-sm" defaultValue="443" />
              <label>方向</label><select className="form-select form-select-sm" defaultValue="both"><option value="both">雙向</option><option value="src">來源</option><option value="dst">目的</option></select>
            </div>
          </section>
        </div>
        <div className="forti-capture-box">
          <strong>擷取輸出</strong>
          <span>尚未開始擷取。按下開始後會顯示封包摘要、來源、目的與協定。</span>
        </div>
        <div className="forti-centered-actions">
          <button className="btn forti-apply" onClick={() => setLastAction('封包擷取已建立，等待後端串接')}>開始擷取</button>
        </div>
      </div>
    )
  }

  function renderAntivirus() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">防毒設定檔</div>
        <div className="forti-form-section">
          <label>設定檔名稱</label><input className="form-control form-control-sm" defaultValue="default-av-profile" />
          <label>病毒掃描</label><FortiSwitch checked />
          <label>灰色軟體偵測</label><FortiSwitch checked />
          <label>隔離感染檔案</label><FortiSwitch checked />
          <label>掃描協定</label><div className="forti-check-row"><label><input type="checkbox" checked readOnly /> HTTP</label><label><input type="checkbox" checked readOnly /> HTTPS</label><label><input type="checkbox" checked readOnly /> FTP</label><label><input type="checkbox" checked readOnly /> SMB</label></div>
        </div>
        <button className="btn forti-apply" onClick={() => setLastAction('防毒設定檔已套用')}>套用</button>
      </div>
    )
  }

  function renderFabric() {
    return (
      <div className="forti-fabric-page">
        <div className="forti-section-title">安全織網 - 實體拓樸圖</div>
        <div className="forti-toolbar forti-diagram-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => addFabricNode('switch')}><i className="bx bx-plus"></i> FortiSwitch</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => addFabricNode('ap')}><i className="bx bx-plus"></i> FortiAP</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => addFabricNode('client')}><i className="bx bx-plus"></i> Endpoint</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => addFabricNode('cloud')}><i className="bx bx-plus"></i> Cloud</button>
          <button
            className={`btn btn-sm ${fabricConnectMode ? 'forti-btn' : 'btn-outline-secondary'}`}
            onClick={() => { setFabricConnectMode((value) => !value); setFabricConnectFrom(null) }}
          >
            <i className="bx bx-git-branch"></i> 關係線
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={removeLastFabricLink} disabled={!fabricLinks.length}><i className="bx bx-unlink"></i> 移除最後關係</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedFabricNode} disabled={selectedFabricNode === 'fgt'}><i className="bx bx-trash"></i> 刪除選取物件</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setFabricLinks([]); setLastAction('已清除拓樸關係線') }}><i className="bx bx-eraser"></i> 清除關係</button>
        </div>
        <div className="forti-diagram-selection">
          已選取：{fabricNodes.find((node) => node.id === selectedFabricNode)?.label || '無'}
        </div>
        <div
          className={`forti-diagram-canvas ${fabricConnectMode ? 'is-connect-mode' : ''}`}
          onMouseMove={moveFabricNode}
          onMouseUp={() => setDraggingFabricNode(null)}
          onMouseLeave={() => setDraggingFabricNode(null)}
        >
          <svg className="forti-diagram-lines" aria-hidden="true">
            {fabricLinks.map((link) => {
              const from = fabricNodes.find((node) => node.id === link.from)
              const to = fabricNodes.find((node) => node.id === link.to)
              if (!from || !to) return null
              return <line key={`${link.from}-${link.to}`} x1={from.x + (from.size / 2)} y1={from.y + (from.size / 2)} x2={to.x + (to.size / 2)} y2={to.y + (to.size / 2)} />
            })}
          </svg>
          {fabricNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={`forti-diagram-node ${node.id === 'fgt' ? 'is-root' : ''} ${fabricConnectFrom === node.id ? 'is-connecting' : ''} ${selectedFabricNode === node.id ? 'is-selected' : ''}`}
              style={{ left: node.x, top: node.y, width: node.size, height: node.size }}
              onMouseDown={() => { if (!fabricConnectMode) setDraggingFabricNode(node.id) }}
              onClick={() => connectFabricNode(node.id)}
            >
              <i className={`bx ${node.icon}`}></i>
              <strong>{node.label}</strong>
              <span>{node.detail}</span>
            </button>
          ))}
          <div className="forti-diagram-hint">
            {fabricConnectMode ? '關係線模式：依序點選兩個物件建立連線' : '拖曳物件調整位置，或使用上方按鈕新增物件'}
          </div>
        </div>
      </div>
    )
  }

  function renderLogicalFabric() {
    return (
      <div className="forti-fabric-page">
        <div className="forti-section-title">安全織網 - 邏輯拓樸圖</div>
        <div className="forti-topology forti-logical-topology">
          <div className="forti-node root"><i className="bx bx-shield-quarter"></i><strong>FortiGate 90D</strong><span>Root FortiGate</span></div>
          <div className="forti-link"></div>
          <div className="forti-node"><i className="bx bx-cloud"></i><strong>FortiGuard</strong><span>Service partially connected</span></div>
          <div className="forti-node"><i className="bx bx-user"></i><strong>SSL-VPN Users</strong><span>1 authenticated</span></div>
          <div className="forti-node"><i className="bx bx-network-chart"></i><strong>LAN / DMZ</strong><span>VLAN_40, internal</span></div>
        </div>
      </div>
    )
  }

  function renderManagedTable(activePage: FortiPage, title: string) {
    const rows = getManagedRows(activePage, title)
    const selectedId = selectedManagedIds[activePage] || rows[0]?.id || ''
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">{title}</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openManagedModal(activePage, title, 'add')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openManagedModal(activePage, title, 'edit')} disabled={!selectedId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteManagedRow(activePage, title)} disabled={!selectedId}>刪除</button>
          <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === title ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea(title)}><i className="bx bx-refresh"></i></button>
          <input className="form-control form-control-sm" placeholder="搜尋" />
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>名稱</th><th>類型</th><th>狀態</th><th>說明</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}>
                <td>{row.name}</td>
                <td>{row.type}</td>
                <td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '啟用' : '停用'} /></td>
                <td>{row.description}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={4} className="forti-table-empty">無資料</td></tr>}
          </tbody>
        </table>
        {managedModal?.page === activePage && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label={managedModal.mode === 'add' ? `新增${title}` : `編輯${title}`}>
              <div className="forti-modal-title">{managedModal.mode === 'add' ? `新增${title}` : `編輯${title}`}</div>
              <label>名稱</label>
              <input className="form-control form-control-sm" value={managedDraft.name} onChange={(event) => setManagedDraft((draft) => ({ ...draft, name: event.target.value }))} />
              <label className="mt-2">類型</label>
              <input className="form-control form-control-sm" value={managedDraft.type} onChange={(event) => setManagedDraft((draft) => ({ ...draft, type: event.target.value }))} />
              <label className="mt-2">狀態</label>
              <FortiSwitch checked={managedDraft.enabled} onChange={() => setManagedDraft((draft) => ({ ...draft, enabled: !draft.enabled }))} label={managedDraft.enabled ? '啟用' : '停用'} />
              <label className="mt-2">說明</label>
              <input className="form-control form-control-sm" value={managedDraft.description} onChange={(event) => setManagedDraft((draft) => ({ ...draft, description: event.target.value }))} />
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setManagedModal(null)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={saveManagedRow}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderFabricAutomation() {
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">安全織網 - 自動化</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openAutomationModal('add')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openAutomationModal('edit')} disabled={!selectedAutomationId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedAutomation} disabled={!selectedAutomationId}>刪除</button>
          <input className="form-control form-control-sm" placeholder="搜尋" />
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>名稱</th><th>觸發類型</th><th>狀態</th><th>說明</th></tr></thead>
          <tbody>
            {fabricAutomations.map((item) => (
              <tr
                key={item.id}
                className={item.id === selectedAutomationId ? 'is-selected' : ''}
                onClick={() => setSelectedAutomationId(item.id)}
              >
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td><span className={item.enabled ? 'forti-pill success' : 'forti-pill muted'}>{item.enabled ? '啟用' : '停用'}</span></td>
                <td>{item.description}</td>
              </tr>
            ))}
            {!fabricAutomations.length && <tr><td colSpan={4} className="forti-table-empty">無自動化項目</td></tr>}
          </tbody>
        </table>
        {automationModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label={automationModalMode === 'add' ? '新增自動化' : '編輯自動化'}>
              <div className="forti-modal-title">{automationModalMode === 'add' ? '新增自動化' : '編輯自動化'}</div>
              <label>名稱</label>
              <input className="form-control form-control-sm" value={automationDraft.name} onChange={(event) => setAutomationDraft((draft) => ({ ...draft, name: event.target.value }))} />
              <label className="mt-2">觸發類型</label>
              <select className="form-select form-select-sm" value={automationDraft.type} onChange={(event) => setAutomationDraft((draft) => ({ ...draft, type: event.target.value }))}>
                <option>Security Fabric</option>
                <option>Local event</option>
                <option>Webhook</option>
                <option>Schedule</option>
              </select>
              <label className="mt-2">狀態</label>
              <FortiSwitch checked={automationDraft.enabled} onChange={() => setAutomationDraft((draft) => ({ ...draft, enabled: !draft.enabled }))} label={automationDraft.enabled ? '啟用' : '停用'} />
              <label className="mt-2">說明</label>
              <input className="form-control form-control-sm" value={automationDraft.description} onChange={(event) => setAutomationDraft((draft) => ({ ...draft, description: event.target.value }))} />
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAutomationModalMode(null)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={saveAutomation}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderFabricSettings() {
    return (
      <div className="forti-form-page forti-fabric-settings-page">
        <div className="forti-section-title">安全織網 - 設置</div>
        <div className="forti-band">FortiGate Telemetry</div>
        <div className="forti-form-section">
          <label>狀態</label>
          <FortiSwitch
            checked={fabricSettings.telemetry}
            onChange={() => toggleFabricSetting('telemetry')}
            label={fabricSettings.telemetry ? '啟用' : '停用'}
          />
          <label>設備角色</label><select className="form-select form-select-sm" defaultValue="Root FortiGate"><option>Root FortiGate</option><option>Downstream FortiGate</option></select>
          <label>FortiAnalyzer Logging</label><FortiSwitch checked={fabricSettings.analyzer} onChange={() => toggleFabricSetting('analyzer')} label={fabricSettings.analyzer ? '啟用' : '停用'} />
          <label>Endpoint Telemetry</label><FortiSwitch checked={fabricSettings.endpoint} onChange={() => toggleFabricSetting('endpoint')} label={fabricSettings.endpoint ? '啟用' : '停用'} />
          <label>管理介面</label>
          <div className="forti-chip-box">
            {fabricManagementInterfaces.map((item) => (
              <span className="forti-chip" key={item}>
                {item}
                <button type="button" className="forti-chip-remove" onClick={() => removeFabricManagementInterface(item)} aria-label={`刪除 ${item}`}>×</button>
              </span>
            ))}
            <button type="button" className="forti-chip-add" onClick={() => setFabricInterfaceModalOpen(true)}>+</button>
          </div>
        </div>
        <div className="forti-info-note">停用後，實體拓樸圖與下游裝置同步狀態會停止更新；已建立的拓樸物件仍會保留在畫面中。</div>
        <div className="forti-centered-actions">
          <button
            className="btn forti-apply"
            onClick={() => {
              writeFortiStorage('fortigate.fabric.settings', fabricSettings)
              writeFortiStorage('fortigate.fabric.managementInterfaces', fabricManagementInterfaces)
              setLastAction('安全織網設定已套用')
            }}
          >
            套用
          </button>
        </div>
        {fabricInterfaceModalOpen && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label="新增管理介面">
              <div className="forti-modal-title">新增管理介面</div>
              <label>介面名稱</label>
              <select className="form-select form-select-sm" value={fabricInterfaceDraft} onChange={(event) => setFabricInterfaceDraft(event.target.value)}>
                {['wan1', 'wan2', 'VLAN_40', 'internal', 'ssl.root', 'dmz'].map((item) => <option key={item}>{item}</option>)}
              </select>
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setFabricInterfaceModalOpen(false)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={addFabricManagementInterface}>新增</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderHa() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">高可靠性</div>
        <div className="forti-band">HA 設定</div>
        <div className="forti-form-section">
          <label>模式</label><div className="forti-segments">{['Standalone', 'Active-Passive', 'Active-Active'].map((mode) => <button key={mode} className={haMode === mode ? 'active' : ''} onClick={() => setHaMode(mode)}>{mode}</button>)}</div>
          <label>群組名稱</label><input className="form-control form-control-sm" defaultValue="FGT-HA-GROUP" />
          <label>群組 ID</label><input className="form-control form-control-sm" defaultValue="0" />
          <label>心跳介面</label>
          <div className="forti-chip-box">
            {haHeartbeatInterfaces.map((item) => (
              <span className="forti-chip" key={item}>
                {item}
                <button type="button" className="forti-chip-remove" onClick={() => removeHaHeartbeatInterface(item)} aria-label={`移除 ${item}`}>×</button>
              </span>
            ))}
            <button type="button" className="forti-chip-add" onClick={() => setHaHeartbeatModalOpen(true)}>+</button>
          </div>
          <label>Device Priority</label><input className="form-control form-control-sm" defaultValue="128" />
          <label>Override</label><FortiSwitch checked={haOverride} onChange={() => setHaOverride((enabled) => !enabled)} label={haOverride ? '啟用' : '停用'} />
        </div>
        <div className="forti-band">叢集成員</div>
        <table className="forti-table"><thead><tr><th>設備</th><th>序號</th><th>角色</th><th>狀態</th></tr></thead><tbody>
          <tr><td>FortiGate 90D</td><td>FGT90D3Z16007115</td><td>Primary</td><td><span className="forti-pill success">同步</span></td></tr>
        </tbody></table>
        <button className="btn forti-apply" onClick={() => setLastAction('HA 設定已套用')}>套用</button>
        {haHeartbeatModalOpen && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label="新增心跳介面">
              <div className="forti-modal-title">新增心跳介面</div>
              <label>介面名稱</label>
              <select className="form-select form-select-sm" value={haHeartbeatDraft} onChange={(event) => setHaHeartbeatDraft(event.target.value)}>
                {['internal1', 'internal2', 'internal3', 'internal4', 'internal5', 'wan1', 'wan2', 'dmz'].map((item) => <option key={item}>{item}</option>)}
              </select>
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setHaHeartbeatModalOpen(false)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={addHaHeartbeatInterface}>新增</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderSnmp() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">SNMP</div>
        <div className="forti-form-section">
          <label>SNMP Agent</label><FortiSwitch checked={snmpAgent} onChange={() => setSnmpAgent((enabled) => !enabled)} label={snmpAgent ? '啟用' : '停用'} />
          <label>說明</label><input className="form-control form-control-sm" defaultValue="FortiGate 90D firewall" />
          <label>位置</label><input className="form-control form-control-sm" defaultValue="KAG Network Room" />
          <label>聯絡人</label><input className="form-control form-control-sm" defaultValue="admin@example.local" />
        </div>
        <div className="forti-band">SNMP v2c Community</div>
        <table className="forti-table"><thead><tr><th>Community</th><th>Hosts</th><th>Queries</th><th>Trap</th><th>狀態</th></tr></thead><tbody>
          <tr><td>public</td><td>10.20.100.0/24</td><td>啟用</td><td>停用</td><td><span className="forti-pill success">啟用</span></td></tr>
          <tr><td>monitoring</td><td>10.20.50.200</td><td>啟用</td><td>啟用</td><td><span className="forti-pill muted">停用</span></td></tr>
        </tbody></table>
      </div>
    )
  }

  function renderReplacementMessages() {
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">替換訊息</div>
        <div className="forti-toolbar"><button className={`btn btn-sm btn-outline-secondary ${refreshingArea === '替換訊息' ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea('替換訊息')}><i className="bx bx-refresh"></i></button><button className="btn btn-sm forti-btn" onClick={() => setLastAction('替換訊息自訂視窗已開啟')}>自訂訊息</button><select className="form-select form-select-sm forti-select"><option>所有訊息群組</option><option>Authentication</option><option>SSL-VPN</option><option>Web Filter</option></select></div>
        <table className="forti-table"><thead><tr><th>訊息群組</th><th>訊息名稱</th><th>格式</th><th>自訂</th></tr></thead><tbody>
          <tr><td>Authentication</td><td>Login failed</td><td>HTML</td><td><span className="forti-pill muted">否</span></td></tr>
          <tr><td>SSL-VPN</td><td>SSL-VPN login page</td><td>HTML</td><td><span className="forti-pill success">是</span></td></tr>
          <tr><td>Web Filter</td><td>URL blocked</td><td>HTML</td><td><span className="forti-pill muted">否</span></td></tr>
        </tbody></table>
      </div>
    )
  }

  function renderFortiGuard() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">FortiGuard</div>
        <div className="forti-fortiguard-grid">
          <section><strong>授權狀態</strong><span className="forti-pill danger">需要注意</span><p>FortiGuard 服務連線尚未完整設定。</p></section>
          <section><strong>Web Filtering</strong><span className="forti-pill success">可用</span><p>資料庫版本：2026.06.22</p></section>
          <section><strong>AntiVirus</strong><span className="forti-pill success">可用</span><p>病毒定義：92.00452</p></section>
        </div>
        <div className="forti-band">更新設定</div>
        <div className="forti-form-section">
          <label>更新伺服器位置</label><div className="forti-segments">{['自動', '指定'].map((mode) => <button key={mode} className={fortiguardUpdateMode === mode ? 'active' : ''} onClick={() => setFortiguardUpdateMode(mode)}>{mode}</button>)}</div>
          <label>通訊協定</label><select className="form-select form-select-sm" defaultValue="HTTPS"><option>HTTPS</option><option>UDP/8888</option></select>
          <label>Proxy</label><FortiSwitch checked={fortiguardProxy} onChange={() => setFortiguardProxy((enabled) => !enabled)} label={fortiguardProxy ? '啟用' : '停用'} />
        </div>
        <button className="btn forti-apply" onClick={() => setLastAction('FortiGuard 更新檢查已送出')}>立即檢查更新</button>
      </div>
    )
  }

  function renderAdvancedSettings() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">進階設定</div>
        <div className="forti-band">系統進階選項</div>
        <div className="forti-form-section">
          <label>HTTP 管理連接埠</label><input className="form-control form-control-sm" defaultValue="80" />
          <label>HTTPS 管理連接埠</label><input className="form-control form-control-sm" defaultValue="443" />
          <label>SSH 管理連接埠</label><input className="form-control form-control-sm" defaultValue="22" />
          <label>管理閒置逾時</label><input className="form-control form-control-sm" defaultValue="480 分鐘" />
          <label>中央管理</label><FortiSwitch checked={advancedCentralManagement} onChange={() => setAdvancedCentralManagement((enabled) => !enabled)} label={advancedCentralManagement ? '啟用' : '停用'} />
          <label>自動備份設定</label><FortiSwitch checked={advancedAutoBackup} onChange={() => setAdvancedAutoBackup((enabled) => !enabled)} label={advancedAutoBackup ? '啟用' : '停用'} />
        </div>
        <div className="forti-band">管理介面安全性</div>
        <div className="forti-access-grid">
          <label><input type="checkbox" checked={advancedChecks.forceHttps} onChange={() => setAdvancedChecks((checks) => ({ ...checks, forceHttps: !checks.forceHttps }))} /> 強制 HTTPS</label>
          <label><input type="checkbox" checked={advancedChecks.loginLock} onChange={() => setAdvancedChecks((checks) => ({ ...checks, loginLock: !checks.loginLock }))} /> 登入失敗鎖定</label>
          <label><input type="checkbox" checked={advancedChecks.weakPassword} onChange={() => setAdvancedChecks((checks) => ({ ...checks, weakPassword: !checks.weakPassword }))} /> 允許弱密碼</label>
          <label><input type="checkbox" checked={advancedChecks.logAdmin} onChange={() => setAdvancedChecks((checks) => ({ ...checks, logAdmin: !checks.logAdmin }))} /> 記錄管理操作</label>
        </div>
        <button className="btn forti-apply" onClick={() => setLastAction('進階設定已套用')}>套用</button>
      </div>
    )
  }

  function renderMonitor() {
    return (
      <div className="forti-workspace-grid">
        <section className="forti-widget forti-chart-widget forti-wide"><div className="forti-widget-title">Session Monitor</div><MiniChart /><div className="forti-chart-foot">目前連線 <strong>423</strong></div></section>
        <section className="forti-widget forti-chart-widget forti-wide"><div className="forti-widget-title">VPN Monitor</div><MiniChart tone="orange" /><div className="forti-chart-foot">SSL-VPN 使用者 <strong>1</strong></div></section>
        <section className="forti-widget forti-wide"><div className="forti-widget-title">介面狀態</div>{interfaces.map((item) => <div className="forti-status-line" key={item.name}><span>{item.name}</span><span className={item.status === 'up' ? 'text-success' : 'text-muted'}>{item.status}</span></div>)}</section>
      </div>
    )
  }

  function renderGenericTable(activePage: FortiPage, title: string) {
    return renderManagedTable(activePage, title)
  }

  function renderGenericSettings(activePage: FortiPage, title: string) {
    const setting = getGenericSetting(activePage)
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">{title}</div>
        <div className="forti-form-section">
          <label>狀態</label><FortiSwitch checked={setting.enabled} onChange={() => updateGenericSetting(activePage, { enabled: !setting.enabled })} label={setting.enabled ? '啟用' : '停用'} />
          <label>名稱</label><input className="form-control form-control-sm" defaultValue={title} />
          <label>模式</label><div className="forti-segments">{(['啟用', '停用'] as const).map((mode) => <button key={mode} className={setting.mode === mode ? 'active' : ''} onClick={() => updateGenericSetting(activePage, { mode, enabled: mode === '啟用' })}>{mode}</button>)}</div>
          <label>安全選項</label>
          <div className="forti-check-row">
            <label><input type="checkbox" checked={setting.strictHttps} onChange={() => updateGenericSetting(activePage, { strictHttps: !setting.strictHttps })} /> 強制 HTTPS</label>
            <label><input type="checkbox" checked={setting.logAdmin} onChange={() => updateGenericSetting(activePage, { logAdmin: !setting.logAdmin })} /> 記錄管理操作</label>
          </div>
          <label>備註</label><input className="form-control form-control-sm" defaultValue="FortiGate 90D 風格設定項目" />
        </div>
        <button className="btn forti-apply" onClick={() => setLastAction(`${title} 設定已套用`)}>套用</button>
      </div>
    )
  }

  function renderActivePage() {
    if (page === 'dashboard') return renderDashboard()
    if (page === 'fabricPhysical') return renderFabric()
    if (page === 'fabricLogical') return renderLogicalFabric()
    if (page === 'fabricAutomation') return renderFabricAutomation()
    if (page === 'fabricSettings') return renderFabricSettings()
    if (page === 'fabricConnectors') return renderManagedTable(page, 'Fabric Connectors')
    if (page.startsWith('fortiview')) return renderFortiView(page)
    if (page === 'interfaces') return renderInterfaces()
    if (page === 'dns') return renderDns()
    if (page === 'staticRoutes') return renderRoutes()
    if (page === 'packet') return renderPacket()
    if (page === 'policyIpv4') return renderPolicy()
    if (page === 'antivirus') return renderAntivirus()
    if (page === 'sslVpnSettings') return renderSslVpn()
    if (page === 'sslVpnPortal') return renderGenericSettings(page, 'SSL-VPN 入口頁面')
    if (page === 'userDefinition') return renderUserDefinition()
    if (page === 'userGroups') return renderUserGroups()
    if (page === 'ha') return renderHa()
    if (page === 'snmp') return renderSnmp()
    if (page === 'replacementMessages') return renderReplacementMessages()
    if (page === 'fortiguard') return renderFortiGuard()
    if (page === 'advancedSettings') return renderAdvancedSettings()
    if (page.startsWith('logs')) return renderLogs(page)
    if (page.startsWith('monitor')) return renderMonitor()
    if (['sdwan', 'sdwanSla', 'sdwanRules', 'systemAdmins', 'adminProfiles', 'certificates', 'addresses', 'services', 'schedules', 'webFilter', 'dnsFilter', 'appControl', 'ips', 'forticlientCompliance', 'sslInspection', 'ratingOverrides', 'customSignatures', 'vpnOverlay', 'ipsecTunnels', 'ipsecWizard', 'ipsecTemplates', 'guestManagement', 'deviceInventory', 'deviceGroups', 'ldap', 'radius', 'authSettings', 'fortitoken', 'wifiController'].includes(page)) return renderGenericTable(page, getPageLabel(page))
    return renderGenericSettings(page, getPageLabel(page))
  }

  const activePageLabel = getPageLabel(page)

  return (
    <div id="fortigateView" style={{ display: 'none' }}>
      <div className="forti-shell">
        <div className="forti-topbar">
          <div className="forti-brand"><span className="forti-logo">▦</span><strong>FortiGate 90D</strong><span>FGT90D3Z16007115</span></div>
          <div className="forti-top-actions" aria-label="FortiGate 工具列">
            <button type="button" className="forti-top-icon" title="CLI Console"><i className="bx bx-terminal"></i></button>
            <button type="button" className="forti-top-icon" title="全螢幕"><i className="bx bx-fullscreen"></i></button>
            <button type="button" className="forti-top-icon" title="說明"><i className="bx bx-help-circle"></i></button>
            <div className="forti-top-menu-wrap">
              <button
                type="button"
                className={`forti-top-notice ${noticeMenuOpen ? 'is-open' : ''}`}
                title="資訊通知"
                aria-expanded={noticeMenuOpen}
                onClick={() => { setNoticeMenuOpen((open) => !open); setUserMenuOpen(false) }}
              >
                <i className="bx bx-bell"></i>
                <span>資訊通知</span>
                <strong className="forti-badge">2</strong>
              </button>
              {noticeMenuOpen && (
                <div className="forti-top-dropdown forti-notice-dropdown">
                  <div className="forti-dropdown-title">資訊通知</div>
                  <button type="button"><i className="bx bx-error-circle"></i><span>FortiGuard 連線尚未設定</span><small>系統</small></button>
                  <button type="button"><i className="bx bx-info-circle"></i><span>有 1 筆 VPN 使用者登入紀錄</span><small>SSL-VPN</small></button>
                  <button type="button" className="forti-dropdown-footer" onClick={() => setLastAction('已開啟 FortiGate 通知中心')}>檢視所有通知</button>
                </div>
              )}
            </div>
            <div className="forti-top-menu-wrap">
              <button
                type="button"
                className={`forti-user-menu ${userMenuOpen ? 'is-open' : ''}`}
                title="登入使用者：admin"
                aria-expanded={userMenuOpen}
                onClick={() => { setUserMenuOpen((open) => !open); setNoticeMenuOpen(false) }}
              >
                <i className="bx bx-user-circle"></i>
                <span className="forti-user-meta"><strong>admin</strong><small>super_admin</small></span>
                <i className="bx bx-chevron-down"></i>
              </button>
              {userMenuOpen && (
                <div className="forti-top-dropdown forti-user-dropdown">
                  <div className="forti-user-card">
                    <i className="bx bx-user-circle"></i>
                    <div><strong>admin</strong><span>super_admin</span></div>
                  </div>
                  <button type="button" onClick={() => setLastAction('已開啟管理者個人資料')}><i className="bx bx-id-card"></i><span>個人資料</span></button>
                  <button type="button" onClick={() => setLastAction('已開啟變更密碼設定')}><i className="bx bx-key"></i><span>變更密碼</span></button>
                  <button type="button" onClick={() => setLastAction('已開啟系統管理設定')}><i className="bx bx-cog"></i><span>系統管理設定</span></button>
                  <button type="button" className="forti-dropdown-danger" onClick={() => setLastAction('模擬登出 admin') }><i className="bx bx-log-out"></i><span>登出</span></button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="forti-body">
          <aside className="forti-side">
            {fortiGroups.map((section) => {
              const expanded = !!section.children?.length && openMenus.includes(section.id)
              const active = menuContainsPage(section, page)
              return (
              <div className="forti-menu-group" key={section.id}>
                <button
                  type="button"
                  className={`forti-root-menu ${active ? 'is-active' : ''} ${expanded ? 'is-expanded' : ''}`}
                  onClick={() => openMenu(section)}
                  aria-expanded={section.children?.length ? expanded : undefined}
                >
                  <i className={`bx ${section.icon}`}></i>
                  <span>{section.label}</span>
                  {section.badge && <em>{section.badge}</em>}
                  {section.children?.length ? <i className={`bx ${expanded ? 'bx-chevron-down' : 'bx-chevron-right'}`}></i> : <i className="bx bx-chevron-right"></i>}
                </button>
                {section.children?.length && expanded && (
                  <div className="forti-sub-menu">
                    {section.children.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`forti-sub-item ${page === item.id ? 'active' : ''} ${item.muted ? 'is-muted' : ''}`}
                        onClick={() => setPage(item.id)}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              )
            })}
            <div className="forti-search"><i className="bx bx-search"></i></div>
          </aside>
          <main className="forti-main">
            <div className="forti-breadcrumb">{activePageLabel}</div>
            {renderActivePage()}
          </main>
        </div>
        {fortiNotice && (
          <div className="forti-toast">
            <i className="bx bx-check-circle"></i>
            <span>{fortiNotice}</span>
          </div>
        )}
      </div>
    </div>
  )
}
