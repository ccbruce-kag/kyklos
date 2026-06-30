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
  | 'wifiSsids'
  | 'wifiApProfiles'
  | 'wifiFortiSwitches'
  | 'wifiSwitchPorts'
  | 'wifiSwitchVlans'
  | 'wifiSwitchTopology'
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
  schedule?: string
  securityProfiles?: string
}

type FortiAddress = {
  id: number
  name: string
  type: 'Subnet' | 'IP Range' | 'FQDN' | 'Geography'
  address: string
  interfaceName: string
  comment: string
}

type FortiSchedule = {
  id: number
  name: string
  type: 'Recurring' | 'One-time'
  days: string
  startTime: string
  endTime: string
  status: '啟用' | '停用'
}

type FortiUrlFilterRule = {
  id: number
  url: string
  type: 'Simple' | 'Wildcard' | 'Regex'
  action: 'Allow' | 'Block' | 'Monitor'
  status: '啟用' | '停用'
}

type FortiDnsFilterRule = {
  id: number
  domain: string
  category: string
  action: 'Allow' | 'Block' | 'Monitor'
  dnsServer: string
  status: '啟用' | '停用'
}

type FortiAntivirusSettings = {
  scanVirus: boolean
  grayware: boolean
  quarantine: boolean
  http: boolean
  https: boolean
  ftp: boolean
  smb: boolean
}

type FortiAntivirusProfile = {
  id: number
  name: string
  mode: 'Block' | 'Monitor' | 'Quarantine'
  settings: FortiAntivirusSettings
}

type FortiFeatureItem = {
  id: string
  group: string
  name: string
  description: string
  enabled: boolean
}

type FortiTag = {
  id: number
  name: string
  color: string
  category: string
  usedBy: string
}

type FortiSecurityProfileRule = {
  id: number
  name: string
  category: string
  action: string
  protocol: string
  status: '啟用' | '停用'
}

type FortiOverlayPeer = {
  id: number
  name: string
  remoteGateway: string
  subnet: string
  status: '啟用' | '停用'
}

type FortiIpsecTunnel = {
  id: number
  name: string
  remoteGateway: string
  interfaceName: string
  localSubnet: string
  remoteSubnet: string
  phase: string
  status: 'Up' | 'Down'
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

type FortiLogViewConfig = {
  summary: string
  metrics: string[]
  columns: string[]
  rows: string[][]
}

type FortiNotification = {
  id: string
  title: string
  source: string
  detail: string
  targetPage: FortiPage
  icon: string
}

type FortiComplianceProfile = {
  name: string
  enabled: boolean
  emsServer: string
  telemetryPort: string
  certificate: string
  defaultAction: 'Warn' | 'Quarantine' | 'Block'
  quarantineVlan: string
  graceMinutes: string
}

type FortiComplianceCheck = {
  id: string
  name: string
  category: string
  condition: string
  enabled: boolean
  failureAction: 'Warn' | 'Quarantine' | 'Block'
}

type FortiComplianceEndpoint = {
  id: string
  device: string
  user: string
  os: string
  ems: string
  posture: 'Compliant' | 'Warning' | 'At Risk'
  tags: string
  lastSeen: string
}

type FortiThreatMapEvent = {
  id: string
  time: string
  country: string
  countryCode: string
  sourceIp: string
  destination: string
  threat: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  action: 'Blocked' | 'Quarantined' | 'Allowed'
  count: number
  ageMinutes: number
  x: number
  y: number
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

type FortiSwitchPortFields = {
  port: string
  mode: 'Access' | 'Trunk'
  nativeVlan: string
  allowedVlans: string
  role: 'Access' | 'AP/PoE' | 'Uplink'
  poe: boolean
  purpose: string
}

function parseFortiSwitchPort(row: FortiManagedRow): FortiSwitchPortFields {
  const portMatch = row.name.match(/^port\s*(\d+)$/i) || row.name.match(/^(\d+)$/)
  const portNumber = portMatch ? Number(portMatch[1]) : 1
  const port = Number.isFinite(portNumber) && portNumber >= 1 && portNumber <= 24 ? `port${portNumber}` : 'port1'
  const mode = row.type.includes('Trunk') ? 'Trunk' : 'Access'
  const nativeVlan = row.description.match(/Native VLAN\s*([0-9]+)/i)?.[1] || row.description.match(/VLAN[_\s-]*([0-9]+)/i)?.[1] || '40'
  const allowedVlans = row.description.match(/Allowed VLANs\s*([^/]+)/i)?.[1]?.trim() || nativeVlan
  const explicitRole = row.description.match(/Role\s*(Access|AP\/PoE|Uplink)/i)?.[1] as FortiSwitchPortFields['role'] | undefined
  const role = explicitRole || (row.description.includes('Uplink') ? 'Uplink' : row.type.includes('AP') || /PoE enabled/i.test(row.description) ? 'AP/PoE' : 'Access')
  const poe = /PoE enabled/i.test(row.description)
  const purpose = row.description.split('/').map((part) => part.trim()).filter((part) => part && !/^Role\s/i.test(part)).pop() || 'Client'
  return { port, mode, nativeVlan, allowedVlans, role, poe, purpose }
}

function buildFortiSwitchPortRow(row: FortiManagedRow, fields: FortiSwitchPortFields): FortiManagedRow {
  const type = fields.mode === 'Trunk' ? 'Trunk Port' : fields.role === 'AP/PoE' ? 'AP Port' : 'Access Port'
  const vlanText = fields.mode === 'Trunk' ? `Allowed VLANs ${fields.allowedVlans || fields.nativeVlan}` : `Native VLAN ${fields.nativeVlan || '1'}`
  const poeText = `PoE ${fields.poe ? 'enabled' : 'disabled'}`
  const purpose = fields.purpose || fields.role
  return {
    ...row,
    name: fields.port,
    type,
    description: `${vlanText} / ${poeText} / Role ${fields.role} / ${purpose}`,
  }
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
      { id: 'fortiviewLanDmz', label: '流量來自 LAN/DMZ' },
      { id: 'fortiviewSources', label: '來源' },
      { id: 'fortiviewDestinations', label: '目的' },
      { id: 'fortiviewApplications', label: '應用程式' },
      { id: 'fortiviewCloudApps', label: '雲端應用程式' },
      { id: 'fortiviewWebsites', label: '網站' },
      { id: 'fortiviewThreats', label: '威脅' },
      { id: 'fortiviewWifi', label: 'WiFi 客戶端' },
      { id: 'fortiviewTrafficShaping', label: '流量塑形' },
      { id: 'fortiviewWanSources', label: '流量來自 WAN' },
      { id: 'fortiviewWanHosts', label: '主機' },
      { id: 'fortiviewWanThreats', label: '威脅' },
      { id: 'fortiviewSystemEvents', label: '所有區段' },
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
      { id: 'wifiSsids', label: 'SSID' },
      { id: 'wifiApProfiles', label: 'FortiAP 設定檔' },
      { id: 'wifiFortiSwitches', label: '受管理的 FortiSwitch' },
      { id: 'wifiSwitchPorts', label: 'Switch Ports' },
      { id: 'wifiSwitchVlans', label: 'Switch VLANs' },
      { id: 'wifiSwitchTopology', label: 'WiFi / Switch 拓樸' },
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
  { id: 1, name: 'LAN_to_WAN', source: 'VLAN_40', destination: 'all', service: 'ALL', action: 'ACCEPT', nat: true, status: '啟用', schedule: 'always', securityProfiles: 'AV, Web Filter, DNS Filter' },
  { id: 2, name: 'SSLVPN_to_LAN', source: 'ssl.root', destination: 'VLAN_40', service: 'RDP, HTTPS, SSH', action: 'ACCEPT', nat: false, status: '啟用', schedule: 'work-hours', securityProfiles: 'IPS' },
  { id: 3, name: 'Block_Malware', source: 'all', destination: 'all', service: 'ALL', action: 'DENY', nat: false, status: '啟用', schedule: 'always', securityProfiles: 'AV' },
]

const initialAddresses: FortiAddress[] = [
  { id: 1, name: 'LAN_Subnet', type: 'Subnet', address: '10.20.40.0/24', interfaceName: 'VLAN_40', comment: 'Office LAN subnet' },
  { id: 2, name: 'Juniper_MGMT', type: 'Subnet', address: '10.20.50.2/32', interfaceName: 'internal', comment: 'EX2200 management IP' },
  { id: 3, name: 'FortiGuard_FQDN', type: 'FQDN', address: 'service.fortiguard.net', interfaceName: 'any', comment: 'FortiGuard service endpoint' },
]

const initialSchedules: FortiSchedule[] = [
  { id: 1, name: 'always', type: 'Recurring', days: 'Everyday', startTime: '00:00', endTime: '23:59', status: '啟用' },
  { id: 2, name: 'work-hours', type: 'Recurring', days: 'Mon-Fri', startTime: '08:30', endTime: '18:30', status: '啟用' },
  { id: 3, name: 'maintenance-window', type: 'One-time', days: '2026-06-30', startTime: '22:00', endTime: '23:30', status: '停用' },
]

const initialUrlFilters: FortiUrlFilterRule[] = [
  { id: 1, url: 'example-malware.test', type: 'Simple', action: 'Block', status: '啟用' },
  { id: 2, url: '*.social.example', type: 'Wildcard', action: 'Monitor', status: '啟用' },
  { id: 3, url: 'docs.fortinet.com', type: 'Simple', action: 'Allow', status: '啟用' },
]

const initialDnsFilters: FortiDnsFilterRule[] = [
  { id: 1, domain: 'malware.example', category: 'Malware', action: 'Block', dnsServer: '168.95.1.1', status: '啟用' },
  { id: 2, domain: 'tracker.example', category: 'Tracking', action: 'Monitor', dnsServer: '8.8.8.8', status: '啟用' },
  { id: 3, domain: 'intranet.local', category: 'Local Domain', action: 'Allow', dnsServer: '10.20.40.1', status: '啟用' },
]

const defaultAntivirusSettings: FortiAntivirusSettings = { scanVirus: true, grayware: true, quarantine: true, http: true, https: true, ftp: true, smb: true }

const initialAntivirusProfiles: FortiAntivirusProfile[] = [
  { id: 1, name: 'default-av-profile', mode: 'Block', settings: defaultAntivirusSettings },
  { id: 2, name: 'monitor-only-av', mode: 'Monitor', settings: { ...defaultAntivirusSettings, quarantine: false, smb: false } },
]

const initialFeatureVisibility: FortiFeatureItem[] = [
  { id: 'fw-policy', group: 'Firewall', name: 'IPv4 Policy', description: '顯示 IPv4 防火牆政策管理頁', enabled: true },
  { id: 'explicit-proxy', group: 'Firewall', name: 'Explicit Proxy', description: '顯示 Explicit Proxy 與代理政策', enabled: false },
  { id: 'sdwan', group: 'Network', name: 'SD-WAN', description: '顯示 SD-WAN 成員、SLA 與規則頁', enabled: true },
  { id: 'switch-controller', group: 'Network', name: 'Switch Controller', description: '顯示 FortiSwitch 控制器功能', enabled: true },
  { id: 'web-filter', group: 'Security Profiles', name: 'Web Filter', description: '顯示網頁過濾設定檔與 URL Filter', enabled: true },
  { id: 'dns-filter', group: 'Security Profiles', name: 'DNS Filter', description: '顯示 DNS 網域過濾設定檔', enabled: true },
  { id: 'vpn-ipsec', group: 'VPN', name: 'IPsec VPN', description: '顯示 IPsec 通道與精靈', enabled: true },
  { id: 'wifi', group: 'WiFi & Switch', name: 'WiFi Controller', description: '顯示受管理 FortiAP 功能', enabled: false },
]

const initialTags: FortiTag[] = [
  { id: 1, name: 'Branch', color: '#2f80ed', category: 'Location', usedBy: 'FGT90D, wan1' },
  { id: 2, name: 'Critical', color: '#d3483c', category: 'Security', usedBy: 'LAN_to_WAN, SSLVPN_to_LAN' },
  { id: 3, name: 'Server', color: '#10961f', category: 'Asset', usedBy: 'Juniper_MGMT' },
]

const initialOverlayPeers: FortiOverlayPeer[] = [
  { id: 1, name: 'Branch-TPE', remoteGateway: '203.69.10.10', subnet: '10.30.0.0/24', status: '啟用' },
  { id: 2, name: 'Branch-KHH', remoteGateway: '203.69.20.10', subnet: '10.40.0.0/24', status: '啟用' },
]

const initialIpsecTunnels: FortiIpsecTunnel[] = [
  { id: 1, name: 'to-branch-tpe', remoteGateway: '203.69.10.10', interfaceName: 'wan1', localSubnet: '10.20.40.0/24', remoteSubnet: '10.30.0.0/24', phase: 'IKEv2 / AES256-SHA256', status: 'Up' },
  { id: 2, name: 'to-cloud-vpc', remoteGateway: '198.51.100.20', interfaceName: 'wan1', localSubnet: '10.20.40.0/24', remoteSubnet: '172.16.0.0/16', phase: 'IKEv2 / AES256-SHA256', status: 'Down' },
]

const securityProfileRows: Record<string, FortiSecurityProfileRule[]> = {
  appControl: [
    { id: 1, name: 'Social.Media', category: 'Application Category', action: 'Monitor', protocol: 'HTTP/HTTPS', status: '啟用' },
    { id: 2, name: 'P2P', category: 'Application Category', action: 'Block', protocol: 'TCP/UDP', status: '啟用' },
    { id: 3, name: 'Remote.Access', category: 'Application Category', action: 'Allow', protocol: 'SSH/RDP/VNC', status: '啟用' },
  ],
  ips: [
    { id: 1, name: 'server-protect', category: 'IPS Sensor', action: 'Block Critical/High', protocol: 'All protocols', status: '啟用' },
    { id: 2, name: 'client-protect', category: 'IPS Sensor', action: 'Monitor Medium+', protocol: 'Client traffic', status: '啟用' },
    { id: 3, name: 'monitor-only', category: 'IPS Sensor', action: 'Monitor', protocol: 'All protocols', status: '停用' },
  ],
  forticlientCompliance: [
    { id: 1, name: 'EMS_Compliance', category: 'Endpoint Control', action: 'Require registered EMS', protocol: 'Telemetry', status: '啟用' },
    { id: 2, name: 'Vulnerability_Scan', category: 'Endpoint Control', action: 'Warn vulnerable host', protocol: 'FortiClient', status: '啟用' },
  ],
  sslInspection: [
    { id: 1, name: 'certificate-inspection', category: 'SSL/SSH Inspection', action: 'Inspect certificate only', protocol: 'HTTPS/SMTPS/IMAPS', status: '啟用' },
    { id: 2, name: 'deep-inspection', category: 'SSL/SSH Inspection', action: 'Full content inspection', protocol: 'HTTPS', status: '停用' },
  ],
  ratingOverrides: [
    { id: 1, name: 'internal-app.local', category: 'Business', action: 'Allow', protocol: 'Web Rating', status: '啟用' },
    { id: 2, name: 'legacy.example', category: 'Information Technology', action: 'Monitor', protocol: 'Web Rating', status: '啟用' },
  ],
  customSignatures: [
    { id: 1, name: 'KAG_TEST_SIG', category: 'IPS Signature', action: 'Monitor', protocol: 'TCP', status: '啟用' },
    { id: 2, name: 'MALWARE_HASH_TEST', category: 'AV Signature', action: 'Block', protocol: 'HTTP/FTP', status: '停用' },
  ],
}

const initialRoutes: FortiRoute[] = [
  { id: 1, enabled: true, destination: '0.0.0.0/0', gateway: '61.219.112.254', interfaceName: 'wan1', distance: '10', priority: '0' },
  { id: 2, enabled: true, destination: '10.20.50.0/24', gateway: '10.20.40.254', interfaceName: 'VLAN_40', distance: '10', priority: '0' },
  { id: 3, enabled: false, destination: '192.168.88.0/24', gateway: '10.20.40.253', interfaceName: 'VLAN_40', distance: '20', priority: '5' },
]

const initialComplianceProfile: FortiComplianceProfile = {
  name: 'EMS_Compliance',
  enabled: true,
  emsServer: 'ems.kag.local',
  telemetryPort: '8013',
  certificate: 'Fortinet_Factory',
  defaultAction: 'Quarantine',
  quarantineVlan: 'VLAN_QUARANTINE',
  graceMinutes: '15',
}

const initialComplianceChecks: FortiComplianceCheck[] = [
  { id: 'ems-registration', name: 'EMS 註冊狀態', category: 'Registration', condition: '端點必須註冊至指定 EMS', enabled: true, failureAction: 'Block' },
  { id: 'realtime-protection', name: '即時防護', category: 'Security Posture', condition: 'FortiClient AV 與即時防護必須啟用', enabled: true, failureAction: 'Quarantine' },
  { id: 'vulnerability', name: '弱點風險', category: 'Vulnerability', condition: 'Critical = 0 且 High <= 2', enabled: true, failureAction: 'Quarantine' },
  { id: 'os-patch', name: '作業系統更新', category: 'Patch', condition: '安全性更新不得超過 30 天', enabled: true, failureAction: 'Warn' },
  { id: 'telemetry', name: 'Telemetry 狀態', category: 'Telemetry', condition: '最後回報時間不得超過 10 分鐘', enabled: true, failureAction: 'Warn' },
]

const initialComplianceEndpoints: FortiComplianceEndpoint[] = [
  { id: 'endpoint-01', device: 'KAG-NB-021', user: 'lin.tingwei', os: 'Windows 11', ems: 'Registered', posture: 'Compliant', tags: 'EMS-Registered, AV-On', lastSeen: '1 分鐘前' },
  { id: 'endpoint-02', device: 'KAG-PC-118', user: 'finance01', os: 'Windows 10', ems: 'Registered', posture: 'Warning', tags: 'Patch-Required', lastSeen: '4 分鐘前' },
  { id: 'endpoint-03', device: 'BYOD-MAC-07', user: 'guest.user', os: 'macOS 15', ems: 'Unregistered', posture: 'At Risk', tags: 'Unregistered, Quarantine', lastSeen: '12 分鐘前' },
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

const fortiNotifications: FortiNotification[] = [
  {
    id: 'fortiguard-not-configured',
    title: 'FortiGuard 連線尚未設定',
    source: '系統 / FortiGuard',
    detail: 'FortiGuard 更新與授權查詢尚未完成連線設定，請前往 FortiGuard 頁面確認更新模式、Proxy 與連線狀態。',
    targetPage: 'fortiguard',
    icon: 'bx bx-error-circle',
  },
  {
    id: 'ssl-vpn-login',
    title: '有 1 筆 VPN 使用者登入紀錄',
    source: 'SSL-VPN / VPN事件',
    detail: '偵測到 vpn_user 通過 SSL-VPN 驗證登入。可前往 VPN 事件記錄檢視登入時間、來源與驗證結果。',
    targetPage: 'logsVpn',
    icon: 'bx bx-info-circle',
  },
]

const fortiLogViews: Partial<Record<FortiPage, FortiLogViewConfig>> = {
  logsTrafficForward: {
    summary: '顯示穿越防火牆政策的流量，適合檢查 NAT、政策命中與應用程式識別。',
    metrics: ['允許 1,284', '阻擋 18', 'NAT 842'],
    columns: ['時間', '政策', '來源', '目的', '服務 / 應用', '動作'],
    rows: [
      ['09:24:18', 'LAN_to_WAN', '10.20.40.113', '8.8.8.8', 'DNS / Google-DNS', 'Accept'],
      ['09:23:42', 'SSLVPN_to_LAN', 'ssl.root', '10.20.50.2', 'SSH', 'Accept'],
    ],
  },
  logsTrafficLocal: {
    summary: '顯示送往 FortiGate 本機服務的流量，例如 HTTPS、SSH、DNS Proxy 與 FortiGuard 查詢。',
    metrics: ['管理 12', 'DNS Proxy 64', '拒絕 3'],
    columns: ['時間', '介面', '來源', '本機服務', '埠號', '結果'],
    rows: [
      ['09:22:01', 'VLAN_40', '10.20.40.113', 'HTTPS Admin', '443', 'Allowed'],
      ['09:21:38', 'wan1', '203.0.113.88', 'SSH Admin', '22', 'Denied'],
    ],
  },
  logsSystem: {
    summary: '系統事件紀錄管理者登入、設定變更、服務重啟、授權與系統資源告警。',
    metrics: ['Notice 18', 'Warning 2', 'Config 5'],
    columns: ['時間', '等級', '使用者', '事件', '訊息'],
    rows: [
      ['09:21:44', 'notice', 'admin', 'Admin Login', 'admin 登入 HTTPS 管理介面'],
      ['09:20:44', 'notice', 'admin', 'Config Change', '更新安全織網設定'],
    ],
  },
  logsRoute: {
    summary: '路由事件追蹤靜態路由、SD-WAN 成員、Gateway 健康與路由表變動。',
    metrics: ['Route Change 3', 'Gateway Up 2', 'SLA Fail 1'],
    columns: ['時間', '路由類型', '目的網段', '下一跳', '介面', '事件'],
    rows: [
      ['09:05:31', 'Static', '10.20.50.0/24', '10.20.40.254', 'VLAN_40', 'Updated'],
      ['09:04:12', 'SD-WAN', '0.0.0.0/0', '61.219.112.254', 'wan1', 'SLA recovered'],
    ],
  },
  logsVpn: {
    summary: 'VPN 事件包含 IPsec phase 狀態、SSL-VPN 登入、斷線與驗證結果。',
    metrics: ['SSL Login 6', 'IPsec Up 2', 'Failed 1'],
    columns: ['時間', 'VPN 類型', '使用者 / Peer', '來源', '狀態', '訊息'],
    rows: [
      ['09:18:02', 'SSL-VPN', 'Taiwan_ip', '203.0.113.71', 'Success', '使用者驗證成功'],
      ['09:15:40', 'IPsec', 'Branch-01', '203.0.113.10', 'Up', 'Phase 2 selector established'],
    ],
  },
  logsUser: {
    summary: '用戶事件聚焦本地、LDAP、RADIUS 與 FortiToken 驗證流程。',
    metrics: ['Login 14', 'MFA 5', 'Denied 2'],
    columns: ['時間', '使用者', '認證來源', '群組', '結果', '訊息'],
    rows: [
      ['09:08:25', 'vpn_user', 'Local', 'SSLVPN_Users', 'Success', '用戶通過本地認證'],
      ['09:03:08', 'audit', 'LDAP', 'Firewall_Admins', 'Denied', '密碼錯誤'],
    ],
  },
  logsEndpoint: {
    summary: '端點事件顯示 FortiClient 遙測、合規狀態與漏洞掃描結果。',
    metrics: ['Compliant 21', 'Warn 4', 'Quarantine 1'],
    columns: ['時間', '端點', 'IP', '合規狀態', '風險', '動作'],
    rows: [
      ['09:12:11', 'MacBook-Pro', '10.20.100.103', 'Compliant', 'Low', 'Allow'],
      ['09:09:02', 'VAN-200492-PC', '10.20.40.122', 'Needs Patch', 'Medium', 'Warn'],
    ],
  },
  logsHa: {
    summary: 'HA 事件呈現叢集同步、心跳介面與主備角色切換。',
    metrics: ['Sync 8', 'Heartbeat 2', 'Failover 0'],
    columns: ['時間', '節點', '介面', '角色', '狀態', '訊息'],
    rows: [
      ['09:13:44', 'FGT90D-Primary', 'internal3', 'Master', 'OK', 'Configuration sync completed'],
      ['09:07:29', 'FGT90D-Secondary', 'internal4', 'Slave', 'OK', 'Heartbeat received'],
    ],
  },
  logsWifi: {
    summary: 'WiFi 事件用於檢查 FortiAP 採用、SSID 用戶連線、漫遊與射頻狀態。',
    metrics: ['AP Online 3', 'Clients 28', 'Roaming 6'],
    columns: ['時間', 'AP / SSID', '用戶', '訊號', '事件', '結果'],
    rows: [
      ['09:10:11', 'FAP221E-01 / Staff-WiFi', '10.20.60.34', '-54 dBm', 'Client joined', 'Success'],
      ['09:01:40', 'FAP221E-02', '-', '-', 'AP tunnel state changed', 'Online'],
    ],
  },
  logsAntivirus: {
    summary: '防毒日誌顯示惡意檔案偵測、隔離、阻擋與掃描協定。',
    metrics: ['Scanned 438', 'Blocked 1', 'Quarantine 1'],
    columns: ['時間', '來源', '目的', '檔案', '病毒名稱', '動作'],
    rows: [
      ['09:14:31', '10.20.40.113', 'download.example', 'eicar.com', 'EICAR_TEST_FILE', 'Quarantine'],
      ['09:06:21', '10.20.40.118', 'mail.example', 'invoice.zip', 'Clean', 'Allow'],
    ],
  },
  logsWebFilter: {
    summary: '網頁過濾日誌依 URL、分類、設定檔與動作呈現瀏覽控管結果。',
    metrics: ['Allowed 932', 'Blocked 12', 'Override 2'],
    columns: ['時間', '來源', 'URL', '分類', '設定檔', '動作'],
    rows: [
      ['09:16:22', '10.20.40.118', 'games.example', 'Games', 'default-web', 'Block'],
      ['09:15:10', '10.20.40.113', 'docs.fortinet.com', 'Information Technology', 'default-web', 'Allow'],
    ],
  },
  logsDns: {
    summary: 'DNS 查詢日誌顯示查詢網域、分類、DNS Server 與過濾結果。',
    metrics: ['Queries 1,420', 'Blocked 9', 'Sinkhole 0'],
    columns: ['時間', '來源', '查詢網域', 'DNS Server', '分類', '結果'],
    rows: [
      ['09:12:09', '10.20.40.118', 'update.fortinet.com', '168.95.1.1', 'Information Technology', 'Allow'],
      ['09:08:50', '10.20.40.122', 'malware-test.example', '168.95.1.1', 'Security Risk', 'Block'],
    ],
  },
  logsApplication: {
    summary: '應用控制日誌依應用程式、風險等級與政策動作呈現流量識別結果。',
    metrics: ['Detected 76', 'Monitored 42', 'Blocked 4'],
    columns: ['時間', '來源', '應用程式', '分類', '風險', '動作'],
    rows: [
      ['09:19:41', '10.20.40.113', 'Microsoft.Teams', 'Collaboration', 'Medium', 'Allow'],
      ['09:18:27', '10.20.40.122', 'BitTorrent', 'P2P', 'High', 'Block'],
    ],
  },
  logsIntrusion: {
    summary: '入侵偵測日誌呈現 IPS 特徵命中、嚴重性與封包處置方式。',
    metrics: ['Signatures 32', 'Critical 0', 'Blocked 5'],
    columns: ['時間', '來源', '目的', 'Signature', '嚴重性', '動作'],
    rows: [
      ['09:17:08', '203.0.113.88', 'wan1', 'SSH.Brute.Force', 'High', 'Block'],
      ['09:11:55', '10.20.40.113', 'internet', 'Suspicious.User.Agent', 'Medium', 'Monitor'],
    ],
  },
  logsAnomaly: {
    summary: '異常日誌追蹤掃描、DoS、協定異常與流量突增。',
    metrics: ['Anomaly 7', 'DoS 0', 'Scan 3'],
    columns: ['時間', '來源', '目的', '異常類型', '計數', '動作'],
    rows: [
      ['09:25:12', '203.0.113.88', 'wan1', 'TCP Port Scan', '46', 'Drop'],
      ['09:02:33', '10.20.40.118', '8.8.8.8', 'DNS Query Burst', '120', 'Monitor'],
    ],
  },
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
  userDefinition: [
    { id: 'user-admin', name: 'admin', type: '本地用戶', enabled: true, description: 'super_admin 管理帳號' },
    { id: 'user-vpn', name: 'vpn_user', type: '本地用戶', enabled: true, description: 'SSL-VPN 使用者' },
  ],
  userGroups: [
    { id: 'group-ssl', name: 'SSLVPN_Users', type: '防火牆群組', enabled: true, description: 'vpn_user, Taiwan_ip' },
    { id: 'group-admin', name: 'Firewall_Admins', type: '管理群組', enabled: true, description: 'admin' },
  ],
  guestManagement: [
    { id: 'guest-portal', name: 'Guest_Portal', type: '訪客入口', enabled: true, description: '訪客帳號與到期時間管理' },
  ],
  deviceInventory: [
    { id: 'dev-mac', name: 'MacBook-Pro', type: 'Endpoint', enabled: true, description: '10.20.100.103 / macOS' },
    { id: 'dev-ap', name: 'FortiAP', type: 'Wireless AP', enabled: true, description: '受管理 AP' },
  ],
  deviceGroups: [
    { id: 'grp-trusted', name: 'Trusted_Devices', type: '設備群組', enabled: true, description: '公司管理設備' },
  ],
  ldap: [
    { id: 'ldap-ad', name: 'KAG_AD', type: 'LDAP Server', enabled: false, description: 'Active Directory 認證來源' },
  ],
  radius: [
    { id: 'radius-main', name: 'RADIUS_MAIN', type: 'RADIUS Server', enabled: false, description: 'VPN MFA 認證來源' },
  ],
  authSettings: [
    { id: 'auth-lockout', name: 'Login_Lockout', type: '身份驗證設定', enabled: true, description: '登入失敗鎖定與密碼原則' },
  ],
  fortitoken: [
    { id: 'token-vpn', name: 'FTK20000001', type: 'Mobile Token', enabled: true, description: 'vpn_user 雙因素認證' },
  ],
  wifiController: [
    { id: 'fap-01', name: 'FAP221E-01', type: 'FortiAP', enabled: true, description: 'Staff-WiFi / 10.20.60.11 / Online' },
    { id: 'fap-02', name: 'FAP221E-02', type: 'FortiAP', enabled: true, description: 'Guest-WiFi / 10.20.60.12 / Online' },
  ],
  wifiSsids: [
    { id: 'ssid-staff', name: 'Staff-WiFi', type: 'Bridge SSID', enabled: true, description: 'VLAN 60 / WPA2-Enterprise / RADIUS' },
    { id: 'ssid-guest', name: 'Guest-WiFi', type: 'Tunnel SSID', enabled: true, description: 'Captive Portal / Internet only' },
  ],
  wifiApProfiles: [
    { id: 'ap-profile-office', name: 'Office-AP-Profile', type: 'Radio Profile', enabled: true, description: '2.4G channel auto, 5G high density' },
    { id: 'ap-profile-warehouse', name: 'Warehouse-AP-Profile', type: 'Radio Profile', enabled: false, description: 'Long range coverage / lower power' },
  ],
  wifiFortiSwitches: [
    { id: 'fsw-01', name: 'FSW124E-01', type: 'FortiSwitch', enabled: true, description: 'Managed by FortiLink / 24 ports online' },
    { id: 'fsw-02', name: 'FSW108E-Edge', type: 'FortiSwitch', enabled: false, description: 'Pending authorization' },
  ],
  wifiSwitchPorts: [
    { id: 'swp-port1', name: 'port1', type: 'Access Port', enabled: true, description: 'Native VLAN 40 / PoE disabled / PC' },
    { id: 'swp-port8', name: 'port8', type: 'AP Port', enabled: true, description: 'Native VLAN 60 / PoE enabled / FAP221E-01' },
    { id: 'swp-port24', name: 'port24', type: 'Trunk Port', enabled: true, description: 'Allowed VLANs 40,60,90 / Uplink' },
  ],
  wifiSwitchVlans: [
    { id: 'swv-lan', name: 'VLAN_40', type: 'Switch VLAN', enabled: true, description: 'LAN users / 10.20.40.0/24' },
    { id: 'swv-wifi', name: 'VLAN_60', type: 'Switch VLAN', enabled: true, description: 'Wireless users / 10.20.60.0/24' },
    { id: 'swv-guest', name: 'VLAN_90', type: 'Switch VLAN', enabled: true, description: 'Guest isolation / Internet only' },
  ],
  wifiSwitchTopology: [
    { id: 'topo-fgt-fsw', name: 'FGT90D -> FSW124E-01', type: 'FortiLink', enabled: true, description: 'fortilink interface / LACP disabled' },
    { id: 'topo-fsw-fap', name: 'FSW124E-01 -> FAP221E-01', type: 'PoE AP Link', enabled: true, description: 'port8 supplies AP and Staff-WiFi' },
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

const fortiThreatMapEvents: FortiThreatMapEvent[] = [
  { id: 'threat-1', time: '09:21:38', country: 'United States', countryCode: 'US', sourceIp: '198.51.100.42', destination: 'wan1:443', threat: 'Apache.Log4j.RCE', severity: 'Critical', action: 'Blocked', count: 18, ageMinutes: 0, x: 18, y: 38 },
  { id: 'threat-2', time: '09:20:51', country: 'Netherlands', countryCode: 'NL', sourceIp: '203.0.113.77', destination: 'wan1:22', threat: 'SSH.Brute.Force', severity: 'High', action: 'Blocked', count: 32, ageMinutes: 1, x: 48, y: 31 },
  { id: 'threat-3', time: '09:19:26', country: 'Russian Federation', countryCode: 'RU', sourceIp: '192.0.2.146', destination: 'mail:25', threat: 'Botnet.C2.Callback', severity: 'Critical', action: 'Quarantined', count: 7, ageMinutes: 2, x: 63, y: 27 },
  { id: 'threat-4', time: '09:18:44', country: 'Brazil', countryCode: 'BR', sourceIp: '198.51.100.118', destination: 'wan1:3389', threat: 'RDP.Login.Attempt', severity: 'Medium', action: 'Blocked', count: 11, ageMinutes: 3, x: 34, y: 68 },
  { id: 'threat-5', time: '09:17:12', country: 'Singapore', countryCode: 'SG', sourceIp: '203.0.113.208', destination: 'dns:53', threat: 'Suspicious.DNS.Query', severity: 'Medium', action: 'Allowed', count: 5, ageMinutes: 4, x: 76, y: 61 },
  { id: 'threat-6', time: '09:15:03', country: 'Australia', countryCode: 'AU', sourceIp: '192.0.2.94', destination: 'ssl-vpn:10443', threat: 'SSLVPN.Probe', severity: 'Low', action: 'Blocked', count: 3, ageMinutes: 6, x: 84, y: 75 },
]

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
  const [page, setPage] = useState<FortiPage>(() => readFortiStorage('fortigate.page', 'dashboard' as FortiPage))
  const [openMenus, setOpenMenus] = useState<string[]>(() => readFortiStorage('fortigate.openMenus', ['securityFabric', 'fortiview', 'network', 'logsReports']))
  const [interfaces, setInterfaces] = useState<FortiInterface[]>(() => readFortiStorage('fortigate.interfaces', initialInterfaces))
  const [interfaceModalMode, setInterfaceModalMode] = useState<'add' | 'edit' | null>(null)
  const [interfaceDraft, setInterfaceDraft] = useState<FortiInterface>(initialInterfaces[0])
  const [interfaceAddressMode, setInterfaceAddressMode] = useState('用戶定義')
  const [policies, setPolicies] = useState<FortiPolicy[]>(() => readFortiStorage('fortigate.policies', initialPolicies))
  const [selectedPolicyId, setSelectedPolicyId] = useState(initialPolicies[0].id)
  const [policyModalMode, setPolicyModalMode] = useState<'add' | 'edit' | null>(null)
  const [policyDraft, setPolicyDraft] = useState<FortiPolicy>(initialPolicies[0])
  const [addresses, setAddresses] = useState<FortiAddress[]>(() => readFortiStorage('fortigate.addresses', initialAddresses))
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddresses[0].id)
  const [addressModalMode, setAddressModalMode] = useState<'add' | 'edit' | null>(null)
  const [addressDraft, setAddressDraft] = useState<FortiAddress>(initialAddresses[0])
  const [schedules, setSchedules] = useState<FortiSchedule[]>(() => readFortiStorage('fortigate.schedules', initialSchedules))
  const [selectedScheduleId, setSelectedScheduleId] = useState(initialSchedules[0].id)
  const [scheduleModalMode, setScheduleModalMode] = useState<'add' | 'edit' | null>(null)
  const [scheduleDraft, setScheduleDraft] = useState<FortiSchedule>(initialSchedules[0])
  const [routes, setRoutes] = useState<FortiRoute[]>(() => readFortiStorage('fortigate.routes', initialRoutes))
  const [selectedRouteId, setSelectedRouteId] = useState(initialRoutes[0].id)
  const [routeModalMode, setRouteModalMode] = useState<'add' | 'edit' | null>(null)
  const [routeDraft, setRouteDraft] = useState<FortiRoute>(initialRoutes[0])
  const [selectedInterface, setSelectedInterface] = useState(() => readFortiStorage('fortigate.selectedInterface', 'VLAN_40'))
  const [interfaceMemberModalOpen, setInterfaceMemberModalOpen] = useState(false)
  const [interfaceMemberDraft, setInterfaceMemberDraft] = useState('internal5')
  const [interfaceDnsHostMode, setInterfaceDnsHostMode] = useState('與系統DNS相同')
  const [dnsMode, setDnsMode] = useState('指定')
  const [dnsTls, setDnsTls] = useState(false)
  const [sslListenPort, setSslListenPort] = useState(() => readFortiStorage('fortigate.ssl.listenPort', '10443'))
  const [sslTunnelRange, setSslTunnelRange] = useState(() => readFortiStorage('fortigate.ssl.tunnelRange', '10.20.40.240 - 10.20.40.250'))
  const [sslListenInterfaces, setSslListenInterfaces] = useState<string[]>(() => readFortiStorage('fortigate.ssl.listenInterfaces', ['wan1']))
  const [sslListenInterfaceModalOpen, setSslListenInterfaceModalOpen] = useState(false)
  const [sslListenInterfaceDraft, setSslListenInterfaceDraft] = useState('wan2')
  const [sslHosts, setSslHosts] = useState<string[]>(() => readFortiStorage('fortigate.ssl.hosts', ['Taiwan_ip']))
  const [sslHostModalOpen, setSslHostModalOpen] = useState(false)
  const [sslHostDraft, setSslHostDraft] = useState('LAN_Subnet')
  const [sslRedirectHttp, setSslRedirectHttp] = useState(() => readFortiStorage('fortigate.ssl.redirectHttp', false))
  const [sslAccessMode, setSslAccessMode] = useState(() => readFortiStorage('fortigate.ssl.accessMode', '限制訪問特定的主機'))
  const [sslTunnelAddressMode, setSslTunnelAddressMode] = useState(() => readFortiStorage('fortigate.ssl.tunnelAddressMode', '自動分配位址'))
  const [sslPortalMode, setSslPortalMode] = useState(() => readFortiStorage('fortigate.ssl.portalMode', 'Tunnel + Web Mode'))
  const [sslPortalBookmarks, setSslPortalBookmarks] = useState<string[]>(() => readFortiStorage('fortigate.ssl.portalBookmarks', ['RDP-Server', 'Intranet-Web']))
  const [dnsPrimary, setDnsPrimary] = useState(() => readFortiStorage('fortigate.dns.primary', '168.95.1.1'))
  const [dnsSecondary, setDnsSecondary] = useState(() => readFortiStorage('fortigate.dns.secondary', '8.8.8.8'))
  const [fortiNotice, setFortiNotice] = useState('')
  const [refreshingArea, setRefreshingArea] = useState('')
  const [lastRefreshAt, setLastRefreshAt] = useState('09:21:43')
  const [noticeMenuOpen, setNoticeMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [sideSearchOpen, setSideSearchOpen] = useState(false)
  const [sideSearch, setSideSearch] = useState('')
  const [fabricNodes, setFabricNodes] = useState<FortiFabricNode[]>(() => readFortiStorage('fortigate.fabric.nodes', initialFabricNodes))
  const [fabricLinks, setFabricLinks] = useState<FortiFabricLink[]>(() => readFortiStorage('fortigate.fabric.links', initialFabricLinks))
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
  const [managedRows, setManagedRows] = useState<Partial<Record<FortiPage, FortiManagedRow[]>>>(() => readFortiStorage('fortigate.managedRows', defaultManagedRows))
  const [selectedManagedIds, setSelectedManagedIds] = useState<Partial<Record<FortiPage, string>>>({
    fabricConnectors: defaultManagedRows.fabricConnectors?.[0]?.id,
    sdwan: defaultManagedRows.sdwan?.[0]?.id,
    sdwanSla: defaultManagedRows.sdwanSla?.[0]?.id,
    sdwanRules: defaultManagedRows.sdwanRules?.[0]?.id,
    systemAdmins: defaultManagedRows.systemAdmins?.[0]?.id,
    adminProfiles: defaultManagedRows.adminProfiles?.[0]?.id,
    certificates: defaultManagedRows.certificates?.[0]?.id,
    userDefinition: defaultManagedRows.userDefinition?.[0]?.id,
    userGroups: defaultManagedRows.userGroups?.[0]?.id,
    guestManagement: defaultManagedRows.guestManagement?.[0]?.id,
    deviceInventory: defaultManagedRows.deviceInventory?.[0]?.id,
    deviceGroups: defaultManagedRows.deviceGroups?.[0]?.id,
    ldap: defaultManagedRows.ldap?.[0]?.id,
    radius: defaultManagedRows.radius?.[0]?.id,
    authSettings: defaultManagedRows.authSettings?.[0]?.id,
    fortitoken: defaultManagedRows.fortitoken?.[0]?.id,
    wifiController: defaultManagedRows.wifiController?.[0]?.id,
    wifiSsids: defaultManagedRows.wifiSsids?.[0]?.id,
    wifiApProfiles: defaultManagedRows.wifiApProfiles?.[0]?.id,
    wifiFortiSwitches: defaultManagedRows.wifiFortiSwitches?.[0]?.id,
    wifiSwitchPorts: defaultManagedRows.wifiSwitchPorts?.[0]?.id,
    wifiSwitchVlans: defaultManagedRows.wifiSwitchVlans?.[0]?.id,
    wifiSwitchTopology: defaultManagedRows.wifiSwitchTopology?.[0]?.id,
  })
  const [managedModal, setManagedModal] = useState<{ page: FortiPage; mode: 'add' | 'edit'; title: string } | null>(null)
  const [managedDraft, setManagedDraft] = useState<FortiManagedRow>({ id: '', name: '', type: '自訂', enabled: true, description: '' })
  const [genericSettings, setGenericSettings] = useState<Partial<Record<FortiPage, { enabled: boolean; mode: '啟用' | '停用'; strictHttps: boolean; logAdmin: boolean }>>>(() => readFortiStorage('fortigate.genericSettings', {}))
  const [haMode, setHaMode] = useState(() => readFortiStorage('fortigate.ha.mode', 'Standalone'))
  const [haOverride, setHaOverride] = useState(() => readFortiStorage('fortigate.ha.override', false))
  const [haHeartbeatInterfaces, setHaHeartbeatInterfaces] = useState<string[]>(() => readFortiStorage('fortigate.ha.heartbeatInterfaces', ['internal3', 'internal4']))
  const [haHeartbeatModalOpen, setHaHeartbeatModalOpen] = useState(false)
  const [haHeartbeatDraft, setHaHeartbeatDraft] = useState('internal5')
  const [snmpAgent, setSnmpAgent] = useState(() => readFortiStorage('fortigate.snmp.agent', true))
  const [fortiguardUpdateMode, setFortiguardUpdateMode] = useState(() => readFortiStorage('fortigate.fortiguard.updateMode', '自動'))
  const [fortiguardProxy, setFortiguardProxy] = useState(() => readFortiStorage('fortigate.fortiguard.proxy', false))
  const [advancedCentralManagement, setAdvancedCentralManagement] = useState(() => readFortiStorage('fortigate.advanced.centralManagement', true))
  const [advancedAutoBackup, setAdvancedAutoBackup] = useState(() => readFortiStorage('fortigate.advanced.autoBackup', false))
  const [advancedChecks, setAdvancedChecks] = useState(() => readFortiStorage('fortigate.advanced.checks', { forceHttps: true, loginLock: true, weakPassword: false, logAdmin: true }))
  const [featureVisibility, setFeatureVisibility] = useState<FortiFeatureItem[]>(() => readFortiStorage('fortigate.featureVisibility', initialFeatureVisibility))
  const [featureSearch, setFeatureSearch] = useState('')
  const [tags, setTags] = useState<FortiTag[]>(() => readFortiStorage('fortigate.tags', initialTags))
  const [selectedTagId, setSelectedTagId] = useState(initialTags[0].id)
  const [tagModalMode, setTagModalMode] = useState<'add' | 'edit' | null>(null)
  const [tagDraft, setTagDraft] = useState<FortiTag>(initialTags[0])
  const [tableSearches, setTableSearches] = useState<Partial<Record<FortiPage, string>>>(() => readFortiStorage('fortigate.tableSearches', {}))
  const [systemSettingType, setSystemSettingType] = useState(() => readFortiStorage('fortigate.system.settingType', '系統全域設定'))
  const [antivirusProfiles, setAntivirusProfiles] = useState<FortiAntivirusProfile[]>(() => readFortiStorage('fortigate.antivirus.profiles', initialAntivirusProfiles))
  const [selectedAntivirusProfileId, setSelectedAntivirusProfileId] = useState(() => readFortiStorage('fortigate.antivirus.selectedProfileId', initialAntivirusProfiles[0].id))
  const [antivirusSettings, setAntivirusSettings] = useState<FortiAntivirusSettings>(() => readFortiStorage('fortigate.antivirus.settings', initialAntivirusProfiles[0].settings))
  const [antivirusMode, setAntivirusMode] = useState<FortiAntivirusProfile['mode']>(() => readFortiStorage('fortigate.antivirus.mode', initialAntivirusProfiles[0].mode))
  const [webFilterProfileEnabled, setWebFilterProfileEnabled] = useState(() => readFortiStorage('fortigate.webFilter.enabled', true))
  const [urlFilters, setUrlFilters] = useState<FortiUrlFilterRule[]>(() => readFortiStorage('fortigate.webFilter.rules', initialUrlFilters))
  const [selectedUrlFilterId, setSelectedUrlFilterId] = useState(initialUrlFilters[0].id)
  const [urlFilterModalMode, setUrlFilterModalMode] = useState<'add' | 'edit' | null>(null)
  const [urlFilterDraft, setUrlFilterDraft] = useState<FortiUrlFilterRule>(initialUrlFilters[0])
  const [dnsFilterProfileEnabled, setDnsFilterProfileEnabled] = useState(() => readFortiStorage('fortigate.dnsFilter.enabled', true))
  const [dnsFilters, setDnsFilters] = useState<FortiDnsFilterRule[]>(() => readFortiStorage('fortigate.dnsFilter.rules', initialDnsFilters))
  const [selectedDnsFilterId, setSelectedDnsFilterId] = useState(initialDnsFilters[0].id)
  const [dnsFilterModalMode, setDnsFilterModalMode] = useState<'add' | 'edit' | null>(null)
  const [dnsFilterDraft, setDnsFilterDraft] = useState<FortiDnsFilterRule>(initialDnsFilters[0])
  const [sslInspectionMode, setSslInspectionMode] = useState(() => readFortiStorage('fortigate.sslInspection.mode', 'Certificate Inspection'))
  const [complianceProfile, setComplianceProfile] = useState<FortiComplianceProfile>(() => readFortiStorage('fortigate.compliance.profile', initialComplianceProfile))
  const [complianceChecks, setComplianceChecks] = useState<FortiComplianceCheck[]>(() => readFortiStorage('fortigate.compliance.checks', initialComplianceChecks))
  const [complianceEndpoints] = useState<FortiComplianceEndpoint[]>(initialComplianceEndpoints)
  const [selectedComplianceEndpointId, setSelectedComplianceEndpointId] = useState(initialComplianceEndpoints[0].id)
  const [threatMapSearch, setThreatMapSearch] = useState('')
  const [threatMapSeverity, setThreatMapSeverity] = useState<'All' | FortiThreatMapEvent['severity']>('All')
  const [threatMapTimeRange, setThreatMapTimeRange] = useState('5 分鐘')
  const [selectedThreatMapEventId, setSelectedThreatMapEventId] = useState(fortiThreatMapEvents[0].id)
  const [customSignatureText, setCustomSignatureText] = useState(() => readFortiStorage('fortigate.customSignature.text', 'F-SBID( --name "KAG_TEST_SIG"; --protocol tcp; --service HTTP; --pattern "test-malware"; --context packet; )'))
  const [customSignatureRows, setCustomSignatureRows] = useState<FortiSecurityProfileRule[]>(() => readFortiStorage('fortigate.customSignature.rows', securityProfileRows.customSignatures))
  const [selectedCustomSignatureId, setSelectedCustomSignatureId] = useState(() => readFortiStorage('fortigate.customSignature.selectedId', securityProfileRows.customSignatures[0]?.id || 0))
  const [signatureCheckResult, setSignatureCheckResult] = useState('')
  const [overlayEnabled, setOverlayEnabled] = useState(() => readFortiStorage('fortigate.overlay.enabled', true))
  const [overlayPeers, setOverlayPeers] = useState<FortiOverlayPeer[]>(() => readFortiStorage('fortigate.overlay.peers', initialOverlayPeers))
  const [selectedOverlayPeerId, setSelectedOverlayPeerId] = useState(initialOverlayPeers[0].id)
  const [overlayPeerModalMode, setOverlayPeerModalMode] = useState<'add' | 'edit' | null>(null)
  const [overlayPeerDraft, setOverlayPeerDraft] = useState<FortiOverlayPeer>(initialOverlayPeers[0])
  const [ipsecTunnels, setIpsecTunnels] = useState<FortiIpsecTunnel[]>(() => readFortiStorage('fortigate.ipsec.tunnels', initialIpsecTunnels))
  const [selectedIpsecTunnelId, setSelectedIpsecTunnelId] = useState(initialIpsecTunnels[0].id)
  const [ipsecTunnelModalMode, setIpsecTunnelModalMode] = useState<'add' | 'edit' | null>(null)
  const [ipsecTunnelDraft, setIpsecTunnelDraft] = useState<FortiIpsecTunnel>(initialIpsecTunnels[0])
  const [ipsecWizardType, setIpsecWizardType] = useState('Site to Site')
  const [ipsecWizardStep, setIpsecWizardStep] = useState(1)
  const [ipsecWizardNatTraversal, setIpsecWizardNatTraversal] = useState(true)
  const [ipsecWizardLocalSubnet, setIpsecWizardLocalSubnet] = useState('10.20.40.0/24')
  const [ipsecWizardRemoteSubnet, setIpsecWizardRemoteSubnet] = useState('10.30.0.0/24')
  const [ipsecWizardName, setIpsecWizardName] = useState('new-ipsec-vpn')
  const [ipsecWizardGateway, setIpsecWizardGateway] = useState('203.0.113.10')
  const [ipsecWizardError, setIpsecWizardError] = useState('')
  const [ipsecWizardMode, setIpsecWizardMode] = useState<'list' | 'create'>(() => readFortiStorage('fortigate.ipsec.wizardMode', 'list'))
  const [ipsecWizardEnabled, setIpsecWizardEnabled] = useState(true)
  const [sslBookmarkModalOpen, setSslBookmarkModalOpen] = useState(false)
  const [sslBookmarkDraft, setSslBookmarkDraft] = useState('Intranet-Web')

  const currentInterface = useMemo(
    () => interfaces.find((item) => item.name === selectedInterface) || interfaces[0],
    [interfaces, selectedInterface],
  )

  const filteredThreatMapEvents = useMemo(() => {
    const query = threatMapSearch.trim().toLowerCase()
    const maxAge = threatMapTimeRange === '現在' ? 1 : threatMapTimeRange === '5 分鐘' ? 5 : threatMapTimeRange === '1 小時' ? 60 : 1440
    return fortiThreatMapEvents
      .filter((event) => event.ageMinutes <= maxAge)
      .filter((event) => threatMapSeverity === 'All' || event.severity === threatMapSeverity)
      .filter((event) => !query || [event.country, event.countryCode, event.sourceIp, event.destination, event.threat, event.action]
        .some((value) => value.toLowerCase().includes(query)))
  }, [threatMapSearch, threatMapSeverity, threatMapTimeRange])

  const visibleFortiGroups = useMemo(() => {
    const query = sideSearch.trim().toLowerCase()
    if (!query) return fortiGroups
    return fortiGroups
      .map((section) => {
        const sectionMatches = section.label.toLowerCase().includes(query)
        const children = section.children?.filter((child) => `${section.label} ${child.label}`.toLowerCase().includes(query))
        if (sectionMatches) return section
        if (children?.length) return { ...section, children }
        return null
      })
      .filter((section): section is FortiMenuSection => Boolean(section))
  }, [sideSearch])

  useEffect(() => {
    if (!fortiNotice) return undefined
    const timer = window.setTimeout(() => setFortiNotice(''), 2200)
    return () => window.clearTimeout(timer)
  }, [fortiNotice])

  useEffect(() => { writeFortiStorage('fortigate.page', page) }, [page])
  useEffect(() => { writeFortiStorage('fortigate.openMenus', openMenus) }, [openMenus])
  useEffect(() => { writeFortiStorage('fortigate.interfaces', interfaces) }, [interfaces])
  useEffect(() => { writeFortiStorage('fortigate.policies', policies) }, [policies])
  useEffect(() => { writeFortiStorage('fortigate.addresses', addresses) }, [addresses])
  useEffect(() => { writeFortiStorage('fortigate.schedules', schedules) }, [schedules])
  useEffect(() => { writeFortiStorage('fortigate.routes', routes) }, [routes])
  useEffect(() => { writeFortiStorage('fortigate.selectedInterface', selectedInterface) }, [selectedInterface])
  useEffect(() => { writeFortiStorage('fortigate.fabric.nodes', fabricNodes) }, [fabricNodes])
  useEffect(() => { writeFortiStorage('fortigate.fabric.links', fabricLinks) }, [fabricLinks])
  useEffect(() => { writeFortiStorage('fortigate.managedRows', managedRows) }, [managedRows])
  useEffect(() => { writeFortiStorage('fortigate.genericSettings', genericSettings) }, [genericSettings])
  useEffect(() => { writeFortiStorage('fortigate.tags', tags) }, [tags])
  useEffect(() => { writeFortiStorage('fortigate.featureVisibility', featureVisibility) }, [featureVisibility])
  useEffect(() => { writeFortiStorage('fortigate.tableSearches', tableSearches) }, [tableSearches])
  useEffect(() => { writeFortiStorage('fortigate.system.settingType', systemSettingType) }, [systemSettingType])
  useEffect(() => { writeFortiStorage('fortigate.ha.mode', haMode) }, [haMode])
  useEffect(() => { writeFortiStorage('fortigate.ha.override', haOverride) }, [haOverride])
  useEffect(() => { writeFortiStorage('fortigate.ha.heartbeatInterfaces', haHeartbeatInterfaces) }, [haHeartbeatInterfaces])
  useEffect(() => { writeFortiStorage('fortigate.snmp.agent', snmpAgent) }, [snmpAgent])
  useEffect(() => { writeFortiStorage('fortigate.fortiguard.updateMode', fortiguardUpdateMode) }, [fortiguardUpdateMode])
  useEffect(() => { writeFortiStorage('fortigate.fortiguard.proxy', fortiguardProxy) }, [fortiguardProxy])
  useEffect(() => { writeFortiStorage('fortigate.advanced.centralManagement', advancedCentralManagement) }, [advancedCentralManagement])
  useEffect(() => { writeFortiStorage('fortigate.advanced.autoBackup', advancedAutoBackup) }, [advancedAutoBackup])
  useEffect(() => { writeFortiStorage('fortigate.advanced.checks', advancedChecks) }, [advancedChecks])
  useEffect(() => { writeFortiStorage('fortigate.antivirus.profiles', antivirusProfiles) }, [antivirusProfiles])
  useEffect(() => { writeFortiStorage('fortigate.antivirus.selectedProfileId', selectedAntivirusProfileId) }, [selectedAntivirusProfileId])
  useEffect(() => { writeFortiStorage('fortigate.antivirus.settings', antivirusSettings) }, [antivirusSettings])
  useEffect(() => { writeFortiStorage('fortigate.antivirus.mode', antivirusMode) }, [antivirusMode])
  useEffect(() => { writeFortiStorage('fortigate.webFilter.enabled', webFilterProfileEnabled) }, [webFilterProfileEnabled])
  useEffect(() => { writeFortiStorage('fortigate.webFilter.rules', urlFilters) }, [urlFilters])
  useEffect(() => { writeFortiStorage('fortigate.dnsFilter.enabled', dnsFilterProfileEnabled) }, [dnsFilterProfileEnabled])
  useEffect(() => { writeFortiStorage('fortigate.dnsFilter.rules', dnsFilters) }, [dnsFilters])
  useEffect(() => { writeFortiStorage('fortigate.sslInspection.mode', sslInspectionMode) }, [sslInspectionMode])
  useEffect(() => { writeFortiStorage('fortigate.compliance.profile', complianceProfile) }, [complianceProfile])
  useEffect(() => { writeFortiStorage('fortigate.compliance.checks', complianceChecks) }, [complianceChecks])
  useEffect(() => { writeFortiStorage('fortigate.customSignature.text', customSignatureText) }, [customSignatureText])
  useEffect(() => { writeFortiStorage('fortigate.customSignature.rows', customSignatureRows) }, [customSignatureRows])
  useEffect(() => { writeFortiStorage('fortigate.customSignature.selectedId', selectedCustomSignatureId) }, [selectedCustomSignatureId])
  useEffect(() => { writeFortiStorage('fortigate.overlay.enabled', overlayEnabled) }, [overlayEnabled])
  useEffect(() => { writeFortiStorage('fortigate.overlay.peers', overlayPeers) }, [overlayPeers])
  useEffect(() => { writeFortiStorage('fortigate.ipsec.tunnels', ipsecTunnels) }, [ipsecTunnels])
  useEffect(() => { writeFortiStorage('fortigate.ipsec.wizardMode', ipsecWizardMode) }, [ipsecWizardMode])
  useEffect(() => { writeFortiStorage('fortigate.ssl.listenPort', sslListenPort) }, [sslListenPort])
  useEffect(() => { writeFortiStorage('fortigate.ssl.tunnelRange', sslTunnelRange) }, [sslTunnelRange])
  useEffect(() => { writeFortiStorage('fortigate.ssl.listenInterfaces', sslListenInterfaces) }, [sslListenInterfaces])
  useEffect(() => { writeFortiStorage('fortigate.ssl.hosts', sslHosts) }, [sslHosts])
  useEffect(() => { writeFortiStorage('fortigate.ssl.redirectHttp', sslRedirectHttp) }, [sslRedirectHttp])
  useEffect(() => { writeFortiStorage('fortigate.ssl.accessMode', sslAccessMode) }, [sslAccessMode])
  useEffect(() => { writeFortiStorage('fortigate.ssl.tunnelAddressMode', sslTunnelAddressMode) }, [sslTunnelAddressMode])
  useEffect(() => { writeFortiStorage('fortigate.ssl.portalMode', sslPortalMode) }, [sslPortalMode])
  useEffect(() => { writeFortiStorage('fortigate.ssl.portalBookmarks', sslPortalBookmarks) }, [sslPortalBookmarks])
  useEffect(() => { writeFortiStorage('fortigate.dns.primary', dnsPrimary) }, [dnsPrimary])
  useEffect(() => { writeFortiStorage('fortigate.dns.secondary', dnsSecondary) }, [dnsSecondary])

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

  function openPolicyModal(mode: 'add' | 'edit') {
    const selected = policies.find((policy) => policy.id === selectedPolicyId) || policies[0]
    setPolicyDraft(mode === 'edit' && selected ? selected : {
      id: Math.max(0, ...policies.map((item) => item.id)) + 1,
      name: `Policy_${policies.length + 1}`,
      source: 'VLAN_40',
      destination: 'all',
      service: 'HTTPS',
      action: 'ACCEPT',
      nat: true,
      status: '啟用',
      schedule: 'always',
      securityProfiles: 'AV, Web Filter',
    })
    setPolicyModalMode(mode)
  }

  function savePolicy() {
    if (!policyDraft.name.trim()) return
    if (policyModalMode === 'edit') {
      setPolicies((items) => items.map((item) => item.id === selectedPolicyId ? policyDraft : item))
    } else {
      setPolicies((items) => [...items, policyDraft])
      setSelectedPolicyId(policyDraft.id)
    }
    setPolicyModalMode(null)
    setLastAction('IPv4 政策已儲存')
  }

  function deleteSelectedPolicy() {
    setPolicies((items) => {
      const next = items.filter((item) => item.id !== selectedPolicyId)
      setSelectedPolicyId(next[0]?.id || 0)
      return next
    })
    setLastAction('IPv4 政策已刪除')
  }

  function copySelectedPolicy() {
    const selected = policies.find((policy) => policy.id === selectedPolicyId)
    if (!selected) return
    const copy = { ...selected, id: Math.max(0, ...policies.map((item) => item.id)) + 1, name: `${selected.name}_copy` }
    setPolicies((items) => [...items, copy])
    setSelectedPolicyId(copy.id)
    setLastAction('IPv4 政策已複製')
  }

  function moveSelectedPolicy(direction: 'up' | 'down') {
    setPolicies((items) => {
      const index = items.findIndex((item) => item.id === selectedPolicyId)
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return items
      const next = [...items]
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
    setLastAction('IPv4 政策順序已調整')
  }

  function openAddressModal(mode: 'add' | 'edit') {
    const selected = addresses.find((address) => address.id === selectedAddressId) || addresses[0]
    setAddressDraft(mode === 'edit' && selected ? selected : {
      id: Math.max(0, ...addresses.map((item) => item.id)) + 1,
      name: `Address_${addresses.length + 1}`,
      type: 'Subnet',
      address: '10.20.0.0/24',
      interfaceName: 'any',
      comment: 'Custom firewall address',
    })
    setAddressModalMode(mode)
  }

  function saveAddress() {
    if (!addressDraft.name.trim() || !addressDraft.address.trim()) return
    if (addressModalMode === 'edit') {
      setAddresses((items) => items.map((item) => item.id === selectedAddressId ? addressDraft : item))
    } else {
      setAddresses((items) => [...items, addressDraft])
      setSelectedAddressId(addressDraft.id)
    }
    setAddressModalMode(null)
    setLastAction('位址物件已儲存')
  }

  function deleteSelectedAddress() {
    setAddresses((items) => {
      const next = items.filter((item) => item.id !== selectedAddressId)
      setSelectedAddressId(next[0]?.id || 0)
      return next
    })
    setLastAction('位址物件已刪除')
  }

  function openScheduleModal(mode: 'add' | 'edit') {
    const selected = schedules.find((schedule) => schedule.id === selectedScheduleId) || schedules[0]
    setScheduleDraft(mode === 'edit' && selected ? selected : {
      id: Math.max(0, ...schedules.map((item) => item.id)) + 1,
      name: `schedule_${schedules.length + 1}`,
      type: 'Recurring',
      days: 'Mon-Fri',
      startTime: '09:00',
      endTime: '18:00',
      status: '啟用',
    })
    setScheduleModalMode(mode)
  }

  function saveSchedule() {
    if (!scheduleDraft.name.trim()) return
    if (scheduleModalMode === 'edit') {
      setSchedules((items) => items.map((item) => item.id === selectedScheduleId ? scheduleDraft : item))
    } else {
      setSchedules((items) => [...items, scheduleDraft])
      setSelectedScheduleId(scheduleDraft.id)
    }
    setScheduleModalMode(null)
    setLastAction('排程已儲存')
  }

  function deleteSelectedSchedule() {
    setSchedules((items) => {
      const next = items.filter((item) => item.id !== selectedScheduleId)
      setSelectedScheduleId(next[0]?.id || 0)
      return next
    })
    setLastAction('排程已刪除')
  }

  function toggleFeatureVisibility(id: string) {
    setFeatureVisibility((items) => items.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))
  }

  function openUrlFilterModal(mode: 'add' | 'edit') {
    const selected = urlFilters.find((rule) => rule.id === selectedUrlFilterId) || urlFilters[0]
    setUrlFilterDraft(mode === 'edit' && selected ? selected : {
      id: Math.max(0, ...urlFilters.map((item) => item.id)) + 1,
      url: 'new.example.com',
      type: 'Simple',
      action: 'Block',
      status: '啟用',
    })
    setUrlFilterModalMode(mode)
  }

  function saveUrlFilter() {
    if (!urlFilterDraft.url.trim()) return
    if (urlFilterModalMode === 'edit') {
      setUrlFilters((items) => items.map((item) => item.id === selectedUrlFilterId ? urlFilterDraft : item))
    } else {
      setUrlFilters((items) => [...items, urlFilterDraft])
      setSelectedUrlFilterId(urlFilterDraft.id)
    }
    setUrlFilterModalMode(null)
    setLastAction('URL 過濾規則已儲存')
  }

  function deleteSelectedUrlFilter() {
    setUrlFilters((items) => {
      const next = items.filter((item) => item.id !== selectedUrlFilterId)
      setSelectedUrlFilterId(next[0]?.id || 0)
      return next
    })
    setLastAction('URL 過濾規則已刪除')
  }

  function openDnsFilterModal(mode: 'add' | 'edit') {
    const selected = dnsFilters.find((rule) => rule.id === selectedDnsFilterId) || dnsFilters[0]
    setDnsFilterDraft(mode === 'edit' && selected ? selected : {
      id: Math.max(0, ...dnsFilters.map((item) => item.id)) + 1,
      domain: 'new-domain.example',
      category: 'Custom',
      action: 'Block',
      dnsServer: dnsPrimary,
      status: '啟用',
    })
    setDnsFilterModalMode(mode)
  }

  function saveDnsFilter() {
    if (!dnsFilterDraft.domain.trim() || !dnsFilterDraft.dnsServer.trim()) return
    if (dnsFilterModalMode === 'edit') {
      setDnsFilters((items) => items.map((item) => item.id === selectedDnsFilterId ? dnsFilterDraft : item))
    } else {
      setDnsFilters((items) => [...items, dnsFilterDraft])
      setSelectedDnsFilterId(dnsFilterDraft.id)
    }
    setDnsFilterModalMode(null)
    setLastAction('DNS 過濾規則已儲存')
  }

  function deleteSelectedDnsFilter() {
    setDnsFilters((items) => {
      const next = items.filter((item) => item.id !== selectedDnsFilterId)
      setSelectedDnsFilterId(next[0]?.id || 0)
      return next
    })
    setLastAction('DNS 過濾規則已刪除')
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

  function openFortiNotification(notification: FortiNotification) {
    const targetSection = fortiGroups.find((section) => menuContainsPage(section, notification.targetPage))
    if (targetSection?.children?.length) {
      setOpenMenus((items) => items.includes(targetSection.id) ? items : [...items, targetSection.id])
    }
    setPage(notification.targetPage)
    setNoticeMenuOpen(false)
    setLastAction(`${notification.title}｜${notification.detail} 已前往「${getPageLabel(notification.targetPage)}」。`)
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
    const usedPorts = new Set(rows.map((row) => Number(parseFortiSwitchPort(row).port.replace('port', ''))).filter((port) => Number.isFinite(port)))
    const nextPort = Array.from({ length: 24 }, (_, index) => index + 1).find((port) => !usedPorts.has(port))
    if (activePage === 'wifiSwitchPorts' && mode === 'add' && !nextPort) {
      setLastAction('Switch Ports 已無可新增的 Port，請先刪除或編輯既有 Port')
      return
    }
    const addDraft = activePage === 'wifiSwitchPorts' ? {
      id: `${activePage}-${Date.now()}`,
      name: `port${nextPort || 1}`,
      type: 'Access Port',
      enabled: true,
      description: 'Native VLAN 40 / PoE disabled / New device',
      selected: false,
    } : activePage === 'wifiSwitchVlans' ? {
      id: `${activePage}-${Date.now()}`,
      name: `VLAN_${100 + rows.length}`,
      type: 'Switch VLAN',
      enabled: true,
      description: `Custom VLAN / 10.20.${100 + rows.length}.0/24`,
      selected: false,
    } : {
      id: `${activePage}-${Date.now()}`,
      name: `${title}_new`,
      type: '自訂',
      enabled: true,
      description: `${title} 自訂項目`,
      selected: false,
    }
    setManagedDraft(mode === 'edit' && selected ? selected : {
      ...addDraft,
    })
    setManagedModal({ page: activePage, mode, title })
  }

  function saveManagedRow() {
    if (!managedModal) return
    const name = managedDraft.name.trim()
    if (!name) return
    const nextDraft = { ...managedDraft, name }
    if (managedModal.page === 'wifiSwitchPorts') {
      const draftPort = parseFortiSwitchPort(nextDraft).port
      const duplicatedPort = getManagedRows(managedModal.page, managedModal.title).some((row) => row.id !== managedDraft.id && parseFortiSwitchPort(row).port === draftPort)
      if (duplicatedPort) {
        setLastAction(`Switch Ports 已存在 ${draftPort}，請選擇其他 Port`)
        return
      }
    }
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

  function getTableSearch(activePage: FortiPage) {
    return tableSearches[activePage] || ''
  }

  function updateTableSearch(activePage: FortiPage, value: string) {
    setTableSearches((items) => ({ ...items, [activePage]: value }))
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

  function addUniqueChip(value: string, items: string[], setItems: (updater: (current: string[]) => string[]) => void, close: () => void, label: string) {
    const next = value.trim()
    if (!next || items.includes(next)) {
      close()
      return
    }
    setItems((current) => [...current, next])
    close()
    setLastAction(`已新增${label} ${next}`)
  }

  function openTagModal(mode: 'add' | 'edit') {
    const selected = tags.find((tag) => tag.id === selectedTagId) || tags[0]
    setTagDraft(mode === 'edit' && selected ? selected : {
      id: Math.max(0, ...tags.map((tag) => tag.id)) + 1,
      name: `Tag_${tags.length + 1}`,
      color: '#10961f',
      category: 'Custom',
      usedBy: '-',
    })
    setTagModalMode(mode)
  }

  function saveTag() {
    if (!tagDraft.name.trim()) return
    if (tagModalMode === 'edit') {
      setTags((items) => items.map((tag) => tag.id === selectedTagId ? tagDraft : tag))
    } else {
      setTags((items) => [...items, tagDraft])
      setSelectedTagId(tagDraft.id)
    }
    setTagModalMode(null)
    setLastAction('標籤已儲存')
  }

  function deleteSelectedTag() {
    setTags((items) => {
      const next = items.filter((tag) => tag.id !== selectedTagId)
      setSelectedTagId(next[0]?.id || 0)
      return next
    })
    setLastAction('標籤已刪除')
  }

  function loadAntivirusProfile(id: number) {
    const profile = antivirusProfiles.find((item) => item.id === id)
    if (!profile) return
    setSelectedAntivirusProfileId(id)
    setAntivirusMode(profile.mode)
    setAntivirusSettings(profile.settings)
    setLastAction(`已載入防毒設定檔 ${profile.name}`)
  }

  function saveAntivirusProfile() {
    setAntivirusProfiles((items) => items.map((profile) => (
      profile.id === selectedAntivirusProfileId ? { ...profile, mode: antivirusMode, settings: antivirusSettings } : profile
    )))
    setLastAction('防毒設定檔已儲存')
  }

  function addAntivirusProfile() {
    const nextProfile: FortiAntivirusProfile = {
      id: Math.max(0, ...antivirusProfiles.map((profile) => profile.id)) + 1,
      name: `av-profile-${antivirusProfiles.length + 1}`,
      mode: 'Monitor',
      settings: defaultAntivirusSettings,
    }
    setAntivirusProfiles((items) => [...items, nextProfile])
    setSelectedAntivirusProfileId(nextProfile.id)
    setAntivirusMode(nextProfile.mode)
    setAntivirusSettings(nextProfile.settings)
    setLastAction(`已新增防毒設定檔 ${nextProfile.name}`)
  }

  function deleteAntivirusProfile() {
    setAntivirusProfiles((items) => {
      const next = items.filter((profile) => profile.id !== selectedAntivirusProfileId)
      const result = next.length ? next : initialAntivirusProfiles
      const fallback = result[0]
      setSelectedAntivirusProfileId(fallback.id)
      setAntivirusMode(fallback.mode)
      setAntivirusSettings(fallback.settings)
      return result
    })
    setLastAction('防毒設定檔已刪除')
  }

  function openOverlayPeerModal(mode: 'add' | 'edit') {
    const selected = overlayPeers.find((peer) => peer.id === selectedOverlayPeerId) || overlayPeers[0]
    setOverlayPeerDraft(mode === 'edit' && selected ? selected : {
      id: Math.max(0, ...overlayPeers.map((peer) => peer.id)) + 1,
      name: `Branch-${overlayPeers.length + 1}`,
      remoteGateway: '203.0.113.10',
      subnet: '10.50.0.0/24',
      status: '啟用',
    })
    setOverlayPeerModalMode(mode)
  }

  function saveOverlayPeer() {
    if (!overlayPeerDraft.name.trim()) return
    if (overlayPeerModalMode === 'edit') {
      setOverlayPeers((items) => items.map((peer) => peer.id === selectedOverlayPeerId ? overlayPeerDraft : peer))
    } else {
      setOverlayPeers((items) => [...items, overlayPeerDraft])
      setSelectedOverlayPeerId(overlayPeerDraft.id)
    }
    setOverlayPeerModalMode(null)
    setLastAction('Overlay Peer 已儲存')
  }

  function deleteSelectedOverlayPeer() {
    setOverlayPeers((items) => {
      const next = items.filter((peer) => peer.id !== selectedOverlayPeerId)
      setSelectedOverlayPeerId(next[0]?.id || 0)
      return next
    })
    setLastAction('Overlay Peer 已刪除')
  }

  function openIpsecTunnelModal(mode: 'add' | 'edit') {
    const selected = ipsecTunnels.find((tunnel) => tunnel.id === selectedIpsecTunnelId) || ipsecTunnels[0]
    setIpsecTunnelDraft(mode === 'edit' && selected ? selected : {
      id: Math.max(0, ...ipsecTunnels.map((tunnel) => tunnel.id)) + 1,
      name: `to-branch-${ipsecTunnels.length + 1}`,
      remoteGateway: '203.0.113.10',
      interfaceName: 'wan1',
      localSubnet: '10.20.40.0/24',
      remoteSubnet: '10.50.0.0/24',
      phase: 'IKEv2 / AES256-SHA256',
      status: 'Down',
    })
    setIpsecTunnelModalMode(mode)
  }

  function saveIpsecTunnel() {
    if (!ipsecTunnelDraft.name.trim()) return
    if (ipsecTunnelModalMode === 'edit') {
      setIpsecTunnels((items) => items.map((tunnel) => tunnel.id === selectedIpsecTunnelId ? ipsecTunnelDraft : tunnel))
    } else {
      setIpsecTunnels((items) => [...items, ipsecTunnelDraft])
      setSelectedIpsecTunnelId(ipsecTunnelDraft.id)
    }
    setIpsecTunnelModalMode(null)
    setLastAction('IPsec 通道已儲存')
  }

  function deleteSelectedIpsecTunnel() {
    setIpsecTunnels((items) => {
      const next = items.filter((tunnel) => tunnel.id !== selectedIpsecTunnelId)
      setSelectedIpsecTunnelId(next[0]?.id || 0)
      return next
    })
    setLastAction('IPsec 通道已刪除')
  }

  function toggleIpsecTunnel(id: number) {
    setIpsecTunnels((items) => items.map((tunnel) => tunnel.id === id ? { ...tunnel, status: tunnel.status === 'Up' ? 'Down' : 'Up' } : tunnel))
    setLastAction('IPsec 通道狀態已切換')
  }

  function addSslBookmark() {
    const next = sslBookmarkDraft.trim()
    if (!next || sslPortalBookmarks.includes(next)) {
      setSslBookmarkModalOpen(false)
      return
    }
    setSslPortalBookmarks((items) => [...items, next])
    setSslBookmarkModalOpen(false)
    setLastAction(`已新增 Web Bookmark ${next}`)
  }

  function isValidCidr(value: string) {
    const match = value.trim().match(/^(\d{1,3})(?:\.(\d{1,3})){3}\/(\d|[12]\d|3[0-2])$/)
    if (!match) return false
    const [ip, prefix] = value.trim().split('/')
    return Number(prefix) >= 0 && Number(prefix) <= 32 && ip.split('.').every((part) => Number(part) >= 0 && Number(part) <= 255)
  }

  function validateCustomSignature() {
    const text = customSignatureText.trim()
    const valid = text.startsWith('F-SBID(') && text.endsWith(')') && text.includes('--name') && (text.includes('--pattern') || text.includes('--service'))
    setSignatureCheckResult(valid ? '語法檢查通過，可加入清單。' : '語法檢查失敗：需包含 F-SBID(...)、--name，並至少包含 --pattern 或 --service。')
    setLastAction(valid ? '自訂特徵值語法檢查通過' : '自訂特徵值語法檢查失敗')
    return valid
  }

  function addCustomSignature() {
    if (!validateCustomSignature()) return
    const nameMatch = customSignatureText.match(/--name\s+"?([^";]+)"?/)
    const nextName = nameMatch?.[1]?.trim() || `CUSTOM_SIG_${customSignatureRows.length + 1}`
    const nextId = Math.max(0, ...customSignatureRows.map((item) => item.id)) + 1
    setCustomSignatureRows((items) => [
      ...items,
      { id: nextId, name: nextName, category: 'Custom IPS Signature', action: 'Monitor', protocol: 'TCP/HTTP', status: '啟用' },
    ])
    setSelectedCustomSignatureId(nextId)
    setSignatureCheckResult(`已加入清單：${nextName}`)
    setLastAction(`自訂特徵值已加入清單：${nextName}`)
  }

  function deleteCustomSignature() {
    const selected = customSignatureRows.find((item) => item.id === selectedCustomSignatureId)
    if (!selected) return
    setCustomSignatureRows((items) => {
      const next = items.filter((item) => item.id !== selectedCustomSignatureId)
      setSelectedCustomSignatureId(next[0]?.id || 0)
      return next
    })
    setSignatureCheckResult(`已刪除清單項目：${selected.name}`)
    setLastAction(`自訂特徵值已刪除：${selected.name}`)
  }

  function nextIpsecWizardStep() {
    if (ipsecWizardStep === 3) {
      if (!isValidCidr(ipsecWizardLocalSubnet) || !isValidCidr(ipsecWizardRemoteSubnet)) {
        setIpsecWizardError('本地 / 遠端子網格式需為 CIDR，例如 10.20.40.0/24。')
        return
      }
      const nextTunnel: FortiIpsecTunnel = {
        id: Math.max(0, ...ipsecTunnels.map((tunnel) => tunnel.id)) + 1,
        name: ipsecWizardName.trim() || `wizard-ipsec-${ipsecTunnels.length + 1}`,
        remoteGateway: ipsecWizardGateway.trim() || '203.0.113.10',
        interfaceName: 'wan1',
        localSubnet: ipsecWizardLocalSubnet,
        remoteSubnet: ipsecWizardRemoteSubnet,
        phase: `${ipsecWizardType} / IKEv2 / ${ipsecWizardNatTraversal ? 'NAT-T' : 'No NAT-T'}`,
        status: ipsecWizardEnabled ? 'Up' : 'Down',
      }
      setIpsecTunnels((items) => [...items, nextTunnel])
      setSelectedIpsecTunnelId(nextTunnel.id)
      setIpsecWizardMode('list')
      setIpsecWizardStep(1)
      setIpsecWizardError('')
      setLastAction(`IPsec 精靈草稿已儲存：${nextTunnel.name}`)
      return
    }
    setIpsecWizardError('')
    setIpsecWizardStep((step) => Math.min(3, step + 1))
    setLastAction(`IPsec 精靈已前往第 ${Math.min(3, ipsecWizardStep + 1)} 步`)
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
          <button className="btn btn-sm forti-btn" onClick={() => openPolicyModal('add')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openPolicyModal('edit')} disabled={!selectedPolicyId}>編輯</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={copySelectedPolicy} disabled={!selectedPolicyId}>複製</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => moveSelectedPolicy('up')} disabled={!selectedPolicyId}>上移</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => moveSelectedPolicy('down')} disabled={!selectedPolicyId}>下移</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedPolicy} disabled={!selectedPolicyId}>刪除</button>
          <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === 'IPv4 政策' ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea('IPv4 政策')}><i className="bx bx-refresh"></i></button>
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>ID</th><th>名稱</th><th>來源</th><th>目的地</th><th>服務</th><th>排程</th><th>資安設定檔</th><th>動作</th><th>NAT</th><th>狀態</th></tr></thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id} className={policy.id === selectedPolicyId ? 'is-selected' : ''} onClick={() => setSelectedPolicyId(policy.id)}>
                <td>{policy.id}</td><td>{policy.name}</td><td>{policy.source}</td><td>{policy.destination}</td><td>{policy.service}</td>
                <td>{policy.schedule || 'always'}</td><td>{policy.securityProfiles || '-'}</td>
                <td><span className={policy.action === 'ACCEPT' ? 'forti-pill success' : 'forti-pill danger'}>{policy.action}</span></td>
                <td>{policy.nat ? '啟用' : '停用'}</td>
                <td><button className="forti-switch-button" onClick={() => togglePolicy(policy.id)}><FortiSwitch checked={policy.status === '啟用'} /> {policy.status}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {policyModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal forti-modal-wide" role="dialog" aria-modal="true" aria-label={policyModalMode === 'add' ? '新增 IPv4 政策' : '編輯 IPv4 政策'}>
              <div className="forti-modal-title">{policyModalMode === 'add' ? '新增 IPv4 政策' : '編輯 IPv4 政策'}</div>
              <div className="forti-modal-grid">
                <label>政策名稱</label><input className="form-control form-control-sm" value={policyDraft.name} onChange={(event) => setPolicyDraft((draft) => ({ ...draft, name: event.target.value }))} />
                <label>來源</label><input className="form-control form-control-sm" value={policyDraft.source} onChange={(event) => setPolicyDraft((draft) => ({ ...draft, source: event.target.value }))} />
                <label>目的地</label><input className="form-control form-control-sm" value={policyDraft.destination} onChange={(event) => setPolicyDraft((draft) => ({ ...draft, destination: event.target.value }))} />
                <label>服務</label><input className="form-control form-control-sm" value={policyDraft.service} onChange={(event) => setPolicyDraft((draft) => ({ ...draft, service: event.target.value }))} />
                <label>排程</label><select className="form-select form-select-sm" value={policyDraft.schedule || 'always'} onChange={(event) => setPolicyDraft((draft) => ({ ...draft, schedule: event.target.value }))}>{schedules.map((item) => <option key={item.id}>{item.name}</option>)}</select>
                <label>資安設定檔</label><input className="form-control form-control-sm" value={policyDraft.securityProfiles || ''} onChange={(event) => setPolicyDraft((draft) => ({ ...draft, securityProfiles: event.target.value }))} />
                <label>動作</label><select className="form-select form-select-sm" value={policyDraft.action} onChange={(event) => setPolicyDraft((draft) => ({ ...draft, action: event.target.value as FortiPolicy['action'] }))}><option>ACCEPT</option><option>DENY</option></select>
                <label>NAT</label><FortiSwitch checked={policyDraft.nat} onChange={() => setPolicyDraft((draft) => ({ ...draft, nat: !draft.nat }))} label={policyDraft.nat ? '啟用' : '停用'} />
                <label>狀態</label><FortiSwitch checked={policyDraft.status === '啟用'} onChange={() => setPolicyDraft((draft) => ({ ...draft, status: draft.status === '啟用' ? '停用' : '啟用' }))} label={policyDraft.status} />
              </div>
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setPolicyModalMode(null)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={savePolicy}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderAddresses() {
    const search = getTableSearch('addresses')
    const rows = addresses.filter((address) => !search.trim() || `${address.name} ${address.type} ${address.address} ${address.interfaceName} ${address.comment}`.toLowerCase().includes(search.trim().toLowerCase()))
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">位址</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openAddressModal('add')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openAddressModal('edit')} disabled={!selectedAddressId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedAddress} disabled={!selectedAddressId}>刪除</button>
          <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === '位址' ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea('位址')}><i className="bx bx-refresh"></i></button>
          <input className="form-control form-control-sm" placeholder="搜尋名稱、IP、FQDN" value={search} onChange={(event) => updateTableSearch('addresses', event.target.value)} />
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>名稱</th><th>類型</th><th>IP 位址 / FQDN</th><th>介面</th><th>註解</th></tr></thead>
          <tbody>
            {rows.map((address) => (
              <tr key={address.id} className={address.id === selectedAddressId ? 'is-selected' : ''} onClick={() => setSelectedAddressId(address.id)}>
                <td>{address.name}</td><td>{address.type}</td><td>{address.address}</td><td>{address.interfaceName}</td><td>{address.comment}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="forti-table-empty">無符合條件的位址物件</td></tr>}
          </tbody>
        </table>
        {addressModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label={addressModalMode === 'add' ? '新增位址' : '編輯位址'}>
              <div className="forti-modal-title">{addressModalMode === 'add' ? '新增位址' : '編輯位址'}</div>
              <label>名稱</label><input className="form-control form-control-sm" value={addressDraft.name} onChange={(event) => setAddressDraft((draft) => ({ ...draft, name: event.target.value }))} />
              <label className="mt-2">類型</label><select className="form-select form-select-sm" value={addressDraft.type} onChange={(event) => setAddressDraft((draft) => ({ ...draft, type: event.target.value as FortiAddress['type'] }))}><option>Subnet</option><option>IP Range</option><option>FQDN</option><option>Geography</option></select>
              <label className="mt-2">IP 位址 / FQDN</label><input className="form-control form-control-sm" value={addressDraft.address} onChange={(event) => setAddressDraft((draft) => ({ ...draft, address: event.target.value }))} />
              <label className="mt-2">介面</label><select className="form-select form-select-sm" value={addressDraft.interfaceName} onChange={(event) => setAddressDraft((draft) => ({ ...draft, interfaceName: event.target.value }))}><option>any</option>{interfaces.map((item) => <option key={item.name}>{item.name}</option>)}</select>
              <label className="mt-2">註解</label><input className="form-control form-control-sm" value={addressDraft.comment} onChange={(event) => setAddressDraft((draft) => ({ ...draft, comment: event.target.value }))} />
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAddressModalMode(null)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={saveAddress}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderSchedules() {
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">排程</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openScheduleModal('add')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openScheduleModal('edit')} disabled={!selectedScheduleId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedSchedule} disabled={!selectedScheduleId}>刪除</button>
          <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === '排程' ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea('排程')}><i className="bx bx-refresh"></i></button>
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>名稱</th><th>類型</th><th>日期 / 週期</th><th>開始時間</th><th>結束時間</th><th>狀態</th></tr></thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id} className={schedule.id === selectedScheduleId ? 'is-selected' : ''} onClick={() => setSelectedScheduleId(schedule.id)}>
                <td>{schedule.name}</td><td>{schedule.type}</td><td>{schedule.days}</td><td>{schedule.startTime}</td><td>{schedule.endTime}</td><td><span className={schedule.status === '啟用' ? 'forti-pill success' : 'forti-pill muted'}>{schedule.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {scheduleModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label={scheduleModalMode === 'add' ? '新增排程' : '編輯排程'}>
              <div className="forti-modal-title">{scheduleModalMode === 'add' ? '新增排程' : '編輯排程'}</div>
              <label>名稱</label><input className="form-control form-control-sm" value={scheduleDraft.name} onChange={(event) => setScheduleDraft((draft) => ({ ...draft, name: event.target.value }))} />
              <label className="mt-2">類型</label><select className="form-select form-select-sm" value={scheduleDraft.type} onChange={(event) => setScheduleDraft((draft) => ({ ...draft, type: event.target.value as FortiSchedule['type'] }))}><option>Recurring</option><option>One-time</option></select>
              <label className="mt-2">日期 / 週期</label><input className="form-control form-control-sm" value={scheduleDraft.days} onChange={(event) => setScheduleDraft((draft) => ({ ...draft, days: event.target.value }))} />
              <label className="mt-2">開始時間</label><input className="form-control form-control-sm" type="time" value={scheduleDraft.startTime} onChange={(event) => setScheduleDraft((draft) => ({ ...draft, startTime: event.target.value }))} />
              <label className="mt-2">結束時間</label><input className="form-control form-control-sm" type="time" value={scheduleDraft.endTime} onChange={(event) => setScheduleDraft((draft) => ({ ...draft, endTime: event.target.value }))} />
              <label className="mt-2">狀態</label><FortiSwitch checked={scheduleDraft.status === '啟用'} onChange={() => setScheduleDraft((draft) => ({ ...draft, status: draft.status === '啟用' ? '停用' : '啟用' }))} label={scheduleDraft.status} />
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setScheduleModalMode(null)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={saveSchedule}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderSslVpn() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">SSL-VPN 設定</div>
        <div className="forti-band">連線設定</div>
        <div className="forti-form-section">
          <label>監聽介面</label><div className="forti-chip-box">
            {sslListenInterfaces.map((item) => (
              <span className="forti-chip" key={item}>{item}<button type="button" className="forti-chip-remove" onClick={() => setSslListenInterfaces((items) => items.filter((entry) => entry !== item))} aria-label={`移除 ${item}`}>×</button></span>
            ))}
            <button type="button" className="forti-chip-add" onClick={() => setSslListenInterfaceModalOpen(true)}>+</button>
          </div>
          <label>監聽埠號</label><input className="form-control form-control-sm" value={sslListenPort} onChange={(e) => setSslListenPort(e.target.value)} />
          <label></label><div className="forti-info-note">Web訪問的方式將被監聽 https://61.219.112.31:{sslListenPort}</div>
          <label>重新導向 HTTP 至 SSL-VPN</label><FortiSwitch checked={sslRedirectHttp} onChange={() => setSslRedirectHttp((enabled) => !enabled)} label={sslRedirectHttp ? '啟用' : '停用'} />
          <label>限制存取</label><div className="forti-segments">
            {['允許從任何主機訪問', '限制訪問特定的主機'].map((mode) => (
              <button type="button" key={mode} className={sslAccessMode === mode ? 'active' : ''} onClick={() => setSslAccessMode(mode)}>{mode}</button>
            ))}
          </div>
          <label>主機</label><div className="forti-chip-box">
            {sslHosts.map((item) => (
              <span className="forti-chip" key={item}>{item}<button type="button" className="forti-chip-remove" onClick={() => setSslHosts((items) => items.filter((entry) => entry !== item))} aria-label={`移除 ${item}`}>×</button></span>
            ))}
            <button type="button" className="forti-chip-add" onClick={() => setSslHostModalOpen(true)}>+</button>
          </div>
          <label>閒置逾時</label><input className="form-control form-control-sm" defaultValue="300 秒" />
          <label>伺服器憑證</label><select className="form-select form-select-sm" defaultValue="Fortinet_Factory"><option>Fortinet_Factory</option><option>Local_Cert</option></select>
          <label></label><div className="forti-alert-note">你正在使用一個預設的內建CA憑證，將不能驗證伺服器的網域名稱。</div>
        </div>
        <div className="forti-band">通道模式客戶端設定</div>
        <div className="forti-form-section">
          <label>位址範圍</label><div className="forti-segments">
            {['自動分配位址', '指定自訂IP範圍'].map((mode) => (
              <button type="button" key={mode} className={sslTunnelAddressMode === mode ? 'active' : ''} onClick={() => {
                setSslTunnelAddressMode(mode)
                if (mode === '自動分配位址' && !sslTunnelRange.includes('SSLVPN_')) setSslTunnelRange('SSLVPN_TUNNEL_ADDR1')
                if (mode === '指定自訂IP範圍' && sslTunnelRange.includes('SSLVPN_')) setSslTunnelRange('10.20.40.240 - 10.20.40.250')
              }}>{mode}</button>
            ))}
          </div>
          <label>{sslTunnelAddressMode === '自動分配位址' ? '位址物件池' : '通道 IP 範圍'}</label>
          {sslTunnelAddressMode === '自動分配位址' ? (
            <select className="form-select form-select-sm" value={sslTunnelRange} onChange={(e) => setSslTunnelRange(e.target.value)}>
              <option>SSLVPN_TUNNEL_ADDR1</option>
              <option>SSLVPN_POOL_KAG</option>
              <option>LAN_Subnet</option>
            </select>
          ) : (
            <input className="form-control form-control-sm" value={sslTunnelRange.includes('SSLVPN_') ? '10.20.40.240 - 10.20.40.250' : sslTunnelRange} onChange={(e) => setSslTunnelRange(e.target.value)} />
          )}
          <label>DNS 伺服器 #1</label><input className="form-control form-control-sm" value={dnsPrimary} onChange={(event) => setDnsPrimary(event.target.value)} />
          <label>DNS 伺服器 #2</label><input className="form-control form-control-sm" value={dnsSecondary} onChange={(event) => setDnsSecondary(event.target.value)} />
        </div>
        {sslListenInterfaceModalOpen && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label="新增監聽介面">
              <div className="forti-modal-title">新增監聽介面</div>
              <label>介面</label>
              <select className="form-select form-select-sm" value={sslListenInterfaceDraft} onChange={(event) => setSslListenInterfaceDraft(event.target.value)}>
                {interfaces.map((item) => <option key={item.name}>{item.name}</option>)}
              </select>
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSslListenInterfaceModalOpen(false)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={() => addUniqueChip(sslListenInterfaceDraft, sslListenInterfaces, setSslListenInterfaces, () => setSslListenInterfaceModalOpen(false), '監聽介面')}>新增</button>
              </div>
            </div>
          </div>
        )}
        {sslHostModalOpen && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label="新增限制主機">
              <div className="forti-modal-title">新增限制主機</div>
              <label>主機 / 位址物件</label>
              <select className="form-select form-select-sm" value={sslHostDraft} onChange={(event) => setSslHostDraft(event.target.value)}>
                {['Taiwan_ip', 'LAN_Subnet', ...addresses.map((item) => item.name)].map((item) => <option key={item}>{item}</option>)}
              </select>
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSslHostModalOpen(false)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={() => addUniqueChip(sslHostDraft, sslHosts, setSslHosts, () => setSslHostModalOpen(false), '限制主機')}>新增</button>
              </div>
            </div>
          </div>
        )}
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

  function exportThreatMapEvents() {
    const columns = ['Time', 'Country', 'Source IP', 'Threat', 'Severity', 'Destination', 'Action', 'Count']
    const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
    const rows = filteredThreatMapEvents.map((event) => [event.time, event.country, event.sourceIp, event.threat, event.severity, event.destination, event.action, event.count])
    const content = [columns, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'fortigate-threat-events.csv'
    link.click()
    URL.revokeObjectURL(url)
    setLastAction(`已匯出 ${filteredThreatMapEvents.length} 筆資安威脅事件`)
  }

  function renderSecurityThreatMap() {
    const selectedEvent = filteredThreatMapEvents.find((event) => event.id === selectedThreatMapEventId) || filteredThreatMapEvents[0]
    const totalEvents = filteredThreatMapEvents.reduce((sum, event) => sum + event.count, 0)
    const blockedEvents = filteredThreatMapEvents.filter((event) => event.action !== 'Allowed').reduce((sum, event) => sum + event.count, 0)
    const criticalEvents = filteredThreatMapEvents.filter((event) => event.severity === 'Critical').reduce((sum, event) => sum + event.count, 0)
    const countries = [...filteredThreatMapEvents]
      .sort((left, right) => right.count - left.count)
      .slice(0, 5)
    const maxCountryCount = Math.max(...countries.map((event) => event.count), 1)
    const destination = { x: 72, y: 47 }

    return (
      <div className="forti-threat-page">
        <div className="forti-threat-toolbar">
          <div className="forti-threat-heading">
            <span className="forti-threat-heading-icon"><i className="bx bx-shield-quarter"></i></span>
            <div><strong>資安威脅地圖</strong><span>全球來源威脅與阻擋事件</span></div>
          </div>
          <div className="forti-threat-filters">
            <label className="forti-threat-search"><i className="bx bx-search"></i><input value={threatMapSearch} onChange={(event) => setThreatMapSearch(event.target.value)} placeholder="搜尋國家、IP 或威脅" /></label>
            <select value={threatMapSeverity} onChange={(event) => setThreatMapSeverity(event.target.value as typeof threatMapSeverity)} aria-label="嚴重性">
              <option value="All">全部嚴重性</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
            <select value={threatMapTimeRange} onChange={(event) => setThreatMapTimeRange(event.target.value)} aria-label="時間範圍">
              <option>現在</option><option>5 分鐘</option><option>1 小時</option><option>24 小時</option>
            </select>
            <button type="button" className={`forti-threat-icon-button ${refreshingArea === '資安威脅地圖' ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea('資安威脅地圖')} title="重新整理"><i className="bx bx-refresh"></i></button>
          </div>
        </div>

        <div className="forti-threat-metrics">
          <article><span>偵測事件</span><strong>{totalEvents}</strong><small>所選時間範圍</small></article>
          <article className="is-danger"><span>Critical</span><strong>{criticalEvents}</strong><small>需優先處理</small></article>
          <article className="is-success"><span>已阻擋 / 隔離</span><strong>{blockedEvents}</strong><small>{totalEvents ? Math.round((blockedEvents / totalEvents) * 100) : 0}% 防護率</small></article>
          <article className="is-neutral"><span>來源國家</span><strong>{new Set(filteredThreatMapEvents.map((event) => event.countryCode)).size}</strong><small>外部威脅來源</small></article>
        </div>

        <div className="forti-threat-layout">
          <section className="forti-threat-map-panel">
            <header><div><strong>即時攻擊來源</strong><span>選取標記可查看事件詳細資料</span></div><div className="forti-threat-legend"><span className="critical">Critical</span><span className="high">High</span><span className="medium">Medium</span><span className="low">Low</span></div></header>
            <div className="forti-world-map">
              <div className="forti-map-grid"></div>
              <div className="forti-continent north-america"></div><div className="forti-continent south-america"></div><div className="forti-continent europe"></div><div className="forti-continent africa"></div><div className="forti-continent asia"></div><div className="forti-continent australia"></div>
              {filteredThreatMapEvents.map((event) => {
                const dx = destination.x - event.x
                const dy = destination.y - event.y
                const distance = Math.sqrt((dx * dx) + (dy * dy))
                const angle = Math.atan2(dy, dx) * (180 / Math.PI)
                return <span key={`line-${event.id}`} className={`forti-threat-route is-${event.severity.toLowerCase()}`} style={{ left: `${event.x}%`, top: `${event.y}%`, width: `${distance}%`, transform: `rotate(${angle}deg)` }}></span>
              })}
              <div className="forti-threat-destination" style={{ left: `${destination.x}%`, top: `${destination.y}%` }}><i className="bx bx-shield-quarter"></i><span>FortiGate 90D</span></div>
              {filteredThreatMapEvents.map((event) => (
                <button type="button" key={event.id} className={`forti-threat-marker is-${event.severity.toLowerCase()} ${selectedEvent?.id === event.id ? 'is-selected' : ''}`} style={{ left: `${event.x}%`, top: `${event.y}%` }} onClick={() => setSelectedThreatMapEventId(event.id)} title={`${event.country}: ${event.threat}`}>
                  <span>{event.count}</span><b>{event.countryCode}</b>
                </button>
              ))}
              {!filteredThreatMapEvents.length && <div className="forti-threat-map-empty">目前篩選條件沒有事件</div>}
            </div>
          </section>

          <aside className="forti-threat-side-panel">
            <section className="forti-threat-detail">
              <header><strong>事件詳細資料</strong>{selectedEvent && <span className={`forti-threat-severity is-${selectedEvent.severity.toLowerCase()}`}>{selectedEvent.severity}</span>}</header>
              {selectedEvent ? <>
                <h4>{selectedEvent.threat}</h4>
                <dl><div><dt>來源</dt><dd>{selectedEvent.sourceIp}</dd></div><div><dt>國家/地區</dt><dd>{selectedEvent.country}</dd></div><div><dt>目的</dt><dd>{selectedEvent.destination}</dd></div><div><dt>動作</dt><dd>{selectedEvent.action}</dd></div><div><dt>最近發生</dt><dd>{selectedEvent.time}</dd></div></dl>
                <button type="button" onClick={() => { setPage('logsIntrusion'); setLastAction(`已前往查看 ${selectedEvent.threat} 的入侵防護記錄`) }}>查看相關日誌 <i className="bx bx-right-arrow-alt"></i></button>
              </> : <div className="forti-threat-no-selection">請選擇一筆威脅事件</div>}
            </section>
            <section className="forti-threat-countries">
              <header><strong>主要來源國家</strong><span>事件次數</span></header>
              {countries.map((event) => <button type="button" key={event.id} onClick={() => setSelectedThreatMapEventId(event.id)} className={selectedEvent?.id === event.id ? 'is-selected' : ''}><b>{event.countryCode}</b><span><strong>{event.country}</strong><i><em style={{ width: `${(event.count / maxCountryCount) * 100}%` }}></em></i></span><small>{event.count}</small></button>)}
            </section>
          </aside>
        </div>

        <section className="forti-threat-events">
          <header><div><strong>最近威脅事件</strong><span>{filteredThreatMapEvents.length} 筆來源記錄</span></div><button type="button" onClick={exportThreatMapEvents}>匯出 <i className="bx bx-download"></i></button></header>
          <div className="forti-threat-table-wrap"><table className="forti-table forti-selectable-table"><thead><tr><th>時間</th><th>來源國家</th><th>來源 IP</th><th>威脅</th><th>嚴重性</th><th>目的</th><th>動作</th><th>次數</th></tr></thead><tbody>
            {filteredThreatMapEvents.map((event) => <tr key={event.id} className={selectedEvent?.id === event.id ? 'is-selected' : ''} onClick={() => setSelectedThreatMapEventId(event.id)}><td>{event.time}</td><td><b className="forti-country-code">{event.countryCode}</b> {event.country}</td><td>{event.sourceIp}</td><td>{event.threat}</td><td><span className={`forti-threat-severity is-${event.severity.toLowerCase()}`}>{event.severity}</span></td><td>{event.destination}</td><td><span className={`forti-threat-action is-${event.action.toLowerCase()}`}>{event.action}</span></td><td>{event.count}</td></tr>)}
            {!filteredThreatMapEvents.length && <tr><td colSpan={8} className="forti-table-empty">目前篩選條件沒有威脅事件</td></tr>}
          </tbody></table></div>
          <footer>Updated: {lastRefreshAt}</footer>
        </section>
      </div>
    )
  }

  function renderFortiView(activePage: FortiPage) {
    if (activePage === 'fortiviewSecurityMap') return renderSecurityThreatMap()
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

  function renderLogVisual(activePage: FortiPage, config: FortiLogViewConfig) {
    if (activePage === 'logsTrafficForward' || activePage === 'logsTrafficLocal') {
      return (
        <div className="forti-log-flow">
          <section><strong>{activePage === 'logsTrafficForward' ? 'Client / Policy' : 'Client / Local-in'}</strong><span>{config.metrics[0]}</span></section>
          <div className="forti-log-flow-line"><b>Policy Match</b></div>
          <section><strong>{activePage === 'logsTrafficForward' ? 'Destination / NAT' : 'FortiGate Service'}</strong><span>{config.metrics[1]}</span></section>
        </div>
      )
    }
    if (activePage === 'logsSystem' || activePage === 'logsRoute') {
      return (
        <div className="forti-log-timeline">
          {config.rows.slice(0, 4).map((row) => (
            <section key={`${row[0]}-${row[1]}`}><b>{row[0]}</b><strong>{row[3] || row[1]}</strong><span>{row[row.length - 1]}</span></section>
          ))}
        </div>
      )
    }
    if (activePage === 'logsVpn' || activePage === 'logsHa') {
      return (
        <div className="forti-log-status-grid">
          {config.metrics.map((metric) => {
            const [name, value] = metric.split(' ')
            return <section key={metric}><i className={activePage === 'logsVpn' ? 'bx bx-lock-open-alt' : 'bx bx-git-branch'}></i><strong>{value || '-'}</strong><span>{name}</span></section>
          })}
        </div>
      )
    }
    if (activePage === 'logsWifi' || activePage === 'logsEndpoint' || activePage === 'logsUser') {
      return (
        <div className="forti-log-device-strip">
          {config.rows.slice(0, 3).map((row) => <section key={`${row[0]}-${row[1]}`}><i className={activePage === 'logsWifi' ? 'bx bx-wifi' : activePage === 'logsEndpoint' ? 'bx bx-laptop' : 'bx bx-user'}></i><strong>{row[1]}</strong><span>{row[row.length - 1]}</span></section>)}
        </div>
      )
    }
    return (
      <div className="forti-log-security-board">
        <section><strong>命中數</strong><span>{config.metrics[0]}</span></section>
        <section><strong>處置</strong><span>{config.metrics[1]}</span></section>
        <section><strong>風險趨勢</strong><MiniChart tone={activePage === 'logsAntivirus' || activePage === 'logsIntrusion' ? 'orange' : 'gray'} /></section>
      </div>
    )
  }

  function renderLogs(activePage: FortiPage) {
    const title = getPageLabel(activePage)
    const config = fortiLogViews[activePage] || {
      summary: `${logTypeByPage[activePage] || title} 的即時事件列表。`,
      metrics: ['事件 0', '警告 0', '阻擋 0'],
      columns: ['時間', '類型', '等級', '來源', '訊息'],
      rows: fortiLogs
        .filter((log) => log.type === (logTypeByPage[activePage] || title))
        .map((log) => [log.time, log.type, log.level, log.src, log.message]),
    }
    const search = getTableSearch(activePage).toLowerCase()
    const rows = config.rows.filter((row) => row.join(' ').toLowerCase().includes(search))
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">{title}</div>
        <div className="forti-profile-summary">
          <section><strong>{title}</strong><span>{config.summary}</span></section>
          {config.metrics.map((metric) => {
            const [name, value] = metric.split(' ')
            return <section key={metric}><strong>{name}</strong><span>{value || '-'}</span></section>
          })}
        </div>
        {renderLogVisual(activePage, config)}
        <div className="forti-toolbar">
          <input className="form-control form-control-sm" placeholder={`搜尋${title}`} value={getTableSearch(activePage)} onChange={(event) => updateTableSearch(activePage, event.target.value)} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction(`${title} 已匯出`)}>匯出</button>
          <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === title ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea(title)}>重新整理</button>
        </div>
        <table className="forti-table">
          <thead><tr>{config.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`}>{config.columns.map((column, columnIndex) => <td key={column}>{row[columnIndex] || '-'}</td>)}</tr>
            ))}
            {!rows.length && <tr><td colSpan={config.columns.length} className="forti-table-empty">{title} 目前無資料</td></tr>}
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
    const currentProfile = antivirusProfiles.find((profile) => profile.id === selectedAntivirusProfileId) || antivirusProfiles[0] || initialAntivirusProfiles[0]
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">防毒設定檔</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={addAntivirusProfile}>新增設定檔</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={saveAntivirusProfile}>儲存設定檔</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteAntivirusProfile} disabled={!antivirusProfiles.length}>刪除設定檔</button>
        </div>
        <div className="forti-profile-summary">
          <section><strong>檢查模式</strong><span>依政策啟用 flow-based 防毒掃描，針對 Web、FTP、SMB 等流量檢查檔案。</span></section>
          <section><strong>隔離策略</strong><span>感染檔案可隔離、阻擋或僅記錄，並回報到日誌與報表。</span></section>
        </div>
        <div className="forti-form-section">
          <label>設定檔名稱</label>
          <select className="form-select form-select-sm" value={selectedAntivirusProfileId} onChange={(event) => loadAntivirusProfile(Number(event.target.value))}>
            {antivirusProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </select>
          <label>顯示名稱</label><input className="form-control form-control-sm" value={currentProfile.name} onChange={(event) => setAntivirusProfiles((items) => items.map((profile) => profile.id === selectedAntivirusProfileId ? { ...profile, name: event.target.value } : profile))} />
          <label>病毒掃描</label><FortiSwitch checked={antivirusSettings.scanVirus} onChange={() => setAntivirusSettings((settings) => ({ ...settings, scanVirus: !settings.scanVirus }))} label={antivirusSettings.scanVirus ? '啟用' : '停用'} />
          <label>灰色軟體偵測</label><FortiSwitch checked={antivirusSettings.grayware} onChange={() => setAntivirusSettings((settings) => ({ ...settings, grayware: !settings.grayware }))} label={antivirusSettings.grayware ? '啟用' : '停用'} />
          <label>隔離感染檔案</label><FortiSwitch checked={antivirusSettings.quarantine} onChange={() => setAntivirusSettings((settings) => ({ ...settings, quarantine: !settings.quarantine }))} label={antivirusSettings.quarantine ? '啟用' : '停用'} />
          <label>掃描動作</label><select className="form-select form-select-sm" value={antivirusMode} onChange={(event) => setAntivirusMode(event.target.value as FortiAntivirusProfile['mode'])}><option>Block</option><option>Monitor</option><option>Quarantine</option></select>
        </div>
        <div className="forti-band">協定掃描</div>
        <table className="forti-table">
          <thead><tr><th>協定</th><th>狀態</th><th>檔案大小限制</th><th>動作</th></tr></thead>
          <tbody>
            {([
              ['HTTP', 'http', antivirusSettings.http, '10 MB'],
              ['HTTPS', 'https', antivirusSettings.https, '10 MB'],
              ['FTP', 'ftp', antivirusSettings.ftp, '10 MB'],
              ['SMB', 'smb', antivirusSettings.smb, '25 MB'],
            ] as const).map(([name, key, enabled, size]) => (
              <tr key={name}>
                <td>{name}</td>
                <td><FortiSwitch checked={enabled} onChange={() => setAntivirusSettings((settings) => ({ ...settings, [key]: !enabled }))} label={enabled ? '啟用' : '停用'} /></td>
                <td>{size}</td>
                <td>{enabled ? 'Scan and block infected files' : 'Bypass'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <div className="forti-section-title">邏輯拓樸圖</div>
        <div className="forti-logical-layout">
          <section className="forti-logical-column">
            <div className="forti-logical-heading">安全區段</div>
            <div className="forti-logical-card"><i className="bx bx-cloud"></i><strong>WAN</strong><span>wan1 / 61.219.112.31</span></div>
            <div className="forti-logical-card"><i className="bx bx-network-chart"></i><strong>LAN</strong><span>VLAN_40 / 10.20.40.0/24</span></div>
            <div className="forti-logical-card"><i className="bx bx-laptop"></i><strong>SSL-VPN</strong><span>ssl.root / {sslTunnelRange}</span></div>
          </section>
          <section className="forti-logical-core">
            <div className="forti-logical-device">
              <i className="bx bx-shield-quarter"></i>
              <strong>FortiGate 90D</strong>
              <span>Root FortiGate / NAT mode</span>
            </div>
            <div className="forti-logical-policy">
              <span>Policy Path</span>
              <b>LAN_to_WAN</b>
              <b>SSLVPN_to_LAN</b>
              <b>Block_Malware</b>
            </div>
          </section>
          <section className="forti-logical-column">
            <div className="forti-logical-heading">服務與保護</div>
            <div className="forti-logical-card"><i className="bx bx-radar"></i><strong>Security Profiles</strong><span>AV / IPS / Web Filter / DNS Filter</span></div>
            <div className="forti-logical-card"><i className="bx bx-cloud-upload"></i><strong>FortiGuard</strong><span>Rating / AV DB / IPS Signature</span></div>
            <div className="forti-logical-card"><i className="bx bx-stats"></i><strong>FortiAnalyzer</strong><span>Logs and reports connector</span></div>
          </section>
        </div>
        <div className="forti-logical-flows">
          <span><b>WAN</b> 到 <b>FortiGate</b> 經由邊界政策與 IPS 檢查</span>
          <span><b>LAN</b> 到 <b>WAN</b> 經由 NAT、Web Filter 與 DNS Filter</span>
          <span><b>SSL-VPN</b> 登入後套用入口頁與 SSLVPN_to_LAN 政策</span>
        </div>
      </div>
    )
  }

  function renderManagedTable(activePage: FortiPage, title: string) {
    const rows = getManagedRows(activePage, title)
    const search = getTableSearch(activePage)
    const filteredRows = rows.filter((row) => !search.trim() || `${row.name} ${row.type} ${row.description}`.toLowerCase().includes(search.trim().toLowerCase()))
    const selectedId = selectedManagedIds[activePage] || rows[0]?.id || ''
    const hideRefresh = ['fabricConnectors', 'systemAdmins', 'adminProfiles', 'certificates', 'userDefinition', 'userGroups', 'guestManagement', 'deviceInventory', 'deviceGroups', 'ldap', 'radius', 'authSettings', 'fortitoken'].includes(activePage)
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">{title}</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openManagedModal(activePage, title, 'add')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openManagedModal(activePage, title, 'edit')} disabled={!selectedId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteManagedRow(activePage, title)} disabled={!selectedId}>刪除</button>
          {!hideRefresh && <button className={`btn btn-sm btn-outline-secondary ${refreshingArea === title ? 'is-refreshing' : ''}`} onClick={() => refreshFortiArea(title)}><i className="bx bx-refresh"></i></button>}
          <input className="form-control form-control-sm" placeholder="搜尋" value={search} onChange={(event) => updateTableSearch(activePage, event.target.value)} />
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>名稱</th><th>類型</th><th>狀態</th><th>說明</th></tr></thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}>
                <td>{row.name}</td>
                <td>{row.type}</td>
                <td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '啟用' : '停用'} /></td>
                <td>{row.description}</td>
              </tr>
            ))}
            {!filteredRows.length && <tr><td colSpan={4} className="forti-table-empty">無符合條件的資料</td></tr>}
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

  function renderManagedActionBar(activePage: FortiPage, title: string, searchPlaceholder = '搜尋') {
    const rows = getManagedRows(activePage, title)
    const selectedId = selectedManagedIds[activePage] || rows[0]?.id || ''
    return (
      <div className="forti-toolbar">
        <button className="btn btn-sm forti-btn" onClick={() => openManagedModal(activePage, title, 'add')}>新增</button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => openManagedModal(activePage, title, 'edit')} disabled={!selectedId}>編輯</button>
        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteManagedRow(activePage, title)} disabled={!selectedId}>刪除</button>
        <input className="form-control form-control-sm" placeholder={searchPlaceholder} value={getTableSearch(activePage)} onChange={(event) => updateTableSearch(activePage, event.target.value)} />
      </div>
    )
  }

  function renderManagedModalForPage(activePage: FortiPage, title: string) {
    if (managedModal?.page !== activePage) return null
    if (activePage === 'wifiSwitchPorts') {
      const fields = parseFortiSwitchPort(managedDraft)
      const usedPortNames = new Set(getManagedRows(activePage, title).filter((row) => row.id !== managedDraft.id).map((row) => parseFortiSwitchPort(row).port))
      const updatePortFields = (nextFields: Partial<FortiSwitchPortFields>) => {
        setManagedDraft((draft) => buildFortiSwitchPortRow(draft, { ...parseFortiSwitchPort(draft), ...nextFields }))
      }
      return (
        <div className="forti-modal-backdrop" role="presentation">
          <div className="forti-modal forti-switch-port-modal" role="dialog" aria-modal="true" aria-label={managedModal.mode === 'add' ? `新增${title}` : `編輯${title}`}>
            <div className="forti-modal-title">{managedModal.mode === 'add' ? `新增${title}` : `編輯${title}`}</div>
            <div className="forti-form-grid">
              <label>
                <span>Port</span>
                <select className="form-select form-select-sm" value={fields.port} onChange={(event) => updatePortFields({ port: event.target.value })}>
                  {Array.from({ length: 24 }, (_, index) => {
                    const portName = `port${index + 1}`
                    const disabled = managedModal.mode === 'add' && usedPortNames.has(portName)
                    return <option key={portName} value={portName} disabled={disabled}>{portName}{disabled ? ' 已設定' : ''}</option>
                  })}
                </select>
              </label>
              <label>
                <span>Mode</span>
                <select className="form-select form-select-sm" value={fields.mode} onChange={(event) => updatePortFields({ mode: event.target.value as FortiSwitchPortFields['mode'] })}>
                  <option value="Access">Access</option>
                  <option value="Trunk">Trunk</option>
                </select>
              </label>
              {fields.mode === 'Trunk' ? (
                <label>
                  <span>Allowed VLANs</span>
                  <input className="form-control form-control-sm" value={fields.allowedVlans} placeholder="40,60,90" onChange={(event) => updatePortFields({ allowedVlans: event.target.value })} />
                </label>
              ) : (
                <label>
                  <span>Native VLAN</span>
                  <input className="form-control form-control-sm" value={fields.nativeVlan} placeholder="40" onChange={(event) => updatePortFields({ nativeVlan: event.target.value })} />
                </label>
              )}
              <label>
                <span>Role</span>
                <select
                  className="form-select form-select-sm"
                  value={fields.role}
                  onChange={(event) => {
                    const role = event.target.value as FortiSwitchPortFields['role']
                    if (role === 'Uplink') {
                      updatePortFields({ role, mode: 'Trunk', purpose: ['New device', 'Client', 'Access'].includes(fields.purpose) ? 'Uplink' : fields.purpose })
                    } else {
                      updatePortFields({ role, purpose: fields.purpose === 'Uplink' ? role : fields.purpose })
                    }
                  }}
                >
                  <option value="Access">Access</option>
                  <option value="AP/PoE">AP/PoE</option>
                  <option value="Uplink">Uplink</option>
                </select>
              </label>
              <label>
                <span>PoE</span>
                <FortiSwitch checked={fields.poe} onChange={() => updatePortFields({ poe: !fields.poe })} label={fields.poe ? '啟用' : '停用'} />
              </label>
              <label>
                <span>狀態</span>
                <FortiSwitch checked={managedDraft.enabled} onChange={() => setManagedDraft((draft) => ({ ...draft, enabled: !draft.enabled }))} label={managedDraft.enabled ? '啟用' : '停用'} />
              </label>
              <label className="forti-form-grid-wide">
                <span>用途</span>
                <input className="form-control form-control-sm" value={fields.purpose} placeholder="PC / FAP221E-01 / Uplink" onChange={(event) => updatePortFields({ purpose: event.target.value })} />
              </label>
            </div>
            <div className="forti-modal-actions">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setManagedModal(null)}>取消</button>
              <button type="button" className="btn btn-sm forti-btn" onClick={saveManagedRow}>儲存</button>
            </div>
          </div>
        </div>
      )
    }
    return (
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
    )
  }

  function getFilteredManagedRows(activePage: FortiPage, title: string) {
    const search = getTableSearch(activePage).trim().toLowerCase()
    return getManagedRows(activePage, title).filter((row) => !search || `${row.name} ${row.type} ${row.description}`.toLowerCase().includes(search))
  }

  function renderUsersDevicesPage(activePage: FortiPage) {
    const title = getPageLabel(activePage)
    const rows = getFilteredManagedRows(activePage, title)
    const selectedId = selectedManagedIds[activePage] || rows[0]?.id || ''

    if (activePage === 'authSettings') {
      const setting = getGenericSetting(activePage)
      return (
        <div className="forti-form-page forti-identity-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-identity-hero">
            <section><i className="bx bx-lock-alt"></i><strong>登入安全</strong><span>登入失敗鎖定、密碼原則與管理者驗證流程</span></section>
            <section><i className="bx bx-time"></i><strong>Session Timeout</strong><span>480 分鐘</span></section>
            <section><i className="bx bx-shield-quarter"></i><strong>MFA</strong><span>FortiToken 可套用至 VPN 與管理員帳號</span></section>
          </div>
          <div className="forti-form-section">
            <label>登入鎖定</label><FortiSwitch checked={setting.enabled} onChange={() => updateGenericSetting(activePage, { enabled: !setting.enabled })} label={setting.enabled ? '啟用' : '停用'} />
            <label>失敗次數</label><input className="form-control form-control-sm" defaultValue="5" />
            <label>鎖定時間</label><input className="form-control form-control-sm" defaultValue="60 秒" />
            <label>密碼複雜度</label><div className="forti-check-row"><label><input type="checkbox" defaultChecked /> 大小寫</label><label><input type="checkbox" defaultChecked /> 數字</label><label><input type="checkbox" /> 特殊字元</label></div>
          </div>
        </div>
      )
    }

    if (activePage === 'ldap' || activePage === 'radius') {
      const isRadius = activePage === 'radius'
      return (
        <div className="forti-form-page forti-auth-server-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-split">
            <section className="forti-group-card">
              <strong>{isRadius ? 'RADIUS Server' : 'LDAP Server'} 連線設定</strong>
              <div className="forti-form-section forti-compact-form">
                <label>伺服器</label><input className="form-control form-control-sm" defaultValue={isRadius ? '10.20.40.15' : 'ad.kag.local'} />
                <label>Port</label><input className="form-control form-control-sm" defaultValue={isRadius ? '1812' : '389'} />
                <label>{isRadius ? 'Secret' : 'Bind DN'}</label><input className="form-control form-control-sm" defaultValue={isRadius ? '********' : 'cn=fortigate,ou=svc,dc=kag,dc=local'} />
                <label>狀態</label><FortiSwitch checked label="啟用" />
              </div>
              <button className="btn btn-sm forti-btn" onClick={() => setLastAction(`${title} 連線測試已送出`)}>測試連線</button>
            </section>
            <section>
              {renderManagedActionBar(activePage, title, '搜尋認證伺服器')}
              <table className="forti-table forti-selectable-table">
                <thead><tr><th>名稱</th><th>伺服器類型</th><th>狀態</th><th>用途</th></tr></thead>
                <tbody>
                  {rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><td>{row.name}</td><td>{row.type}</td><td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '啟用' : '停用'} /></td><td>{row.description}</td></tr>)}
                </tbody>
              </table>
            </section>
          </div>
          {renderManagedModalForPage(activePage, title)}
        </div>
      )
    }

    if (activePage === 'guestManagement') {
      return (
        <div className="forti-table-page forti-guest-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-guest-vouchers">
            <section><strong>今日訪客</strong><span>12</span><small>3 組即將到期</small></section>
            <section><strong>入口頁</strong><span>Guest_Portal</span><small>Captive Portal + Sponsor approval</small></section>
            <section><strong>預設期限</strong><span>8 小時</span><small>到期自動停用</small></section>
          </div>
          {renderManagedActionBar(activePage, title, '搜尋訪客、入口頁')}
          <table className="forti-table forti-selectable-table">
            <thead><tr><th>訪客 / Portal</th><th>類型</th><th>到期 / 狀態</th><th>說明</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><td>{row.name}</td><td>{row.type}</td><td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '有效' : '停用'} /></td><td>{row.description}</td></tr>)}</tbody>
          </table>
          {renderManagedModalForPage(activePage, title)}
        </div>
      )
    }

    if (activePage === 'deviceInventory' || activePage === 'deviceGroups') {
      return (
        <div className="forti-table-page forti-device-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-device-grid">
            {rows.slice(0, 4).map((row) => (
              <button key={row.id} type="button" className={`forti-device-card ${row.id === selectedId ? 'is-selected' : ''}`} onClick={() => setSelectedManagedId(activePage, row.id)}>
                <i className={`bx ${activePage === 'deviceGroups' ? 'bx-category' : row.type.toLowerCase().includes('ap') ? 'bx-wifi' : 'bx-laptop'}`}></i>
                <strong>{row.name}</strong>
                <span>{row.type}</span>
                <small>{row.description}</small>
              </button>
            ))}
          </div>
          {renderManagedActionBar(activePage, title, '搜尋設備、群組')}
          <table className="forti-table forti-selectable-table">
            <thead><tr><th>名稱</th><th>分類</th><th>信任狀態</th><th>細節</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><td>{row.name}</td><td>{row.type}</td><td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '信任' : '停用'} /></td><td>{row.description}</td></tr>)}</tbody>
          </table>
          {renderManagedModalForPage(activePage, title)}
        </div>
      )
    }

    if (activePage === 'fortitoken') {
      return (
        <div className="forti-table-page forti-token-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-token-strip">
            <section><strong>可用 Token</strong><span>18</span></section>
            <section><strong>已指派</strong><span>{rows.filter((row) => row.enabled).length}</span></section>
            <section><strong>同步狀態</strong><span>FortiGuard OK</span></section>
          </div>
          {renderManagedActionBar(activePage, title, '搜尋 Token 或使用者')}
          <table className="forti-table forti-selectable-table">
            <thead><tr><th>Token 序號</th><th>類型</th><th>指派狀態</th><th>使用者 / 備註</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><td>{row.name}</td><td>{row.type}</td><td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '已指派' : '可用'} /></td><td>{row.description}</td></tr>)}</tbody>
          </table>
          {renderManagedModalForPage(activePage, title)}
        </div>
      )
    }

    return (
      <div className="forti-table-page forti-user-page">
        <div className="forti-section-title">{title}</div>
        <div className="forti-identity-hero">
          <section><i className={activePage === 'userGroups' ? 'bx bx-group' : 'bx bx-user-check'}></i><strong>{title}</strong><span>{activePage === 'userGroups' ? '管理防火牆群組、VPN 群組與管理群組成員' : '管理本地、遠端與 VPN 用戶認證'}</span></section>
          <section><i className="bx bx-check-shield"></i><strong>啟用項目</strong><span>{rows.filter((row) => row.enabled).length}</span></section>
          <section><i className="bx bx-list-check"></i><strong>總數</strong><span>{rows.length}</span></section>
        </div>
        {renderManagedActionBar(activePage, title, '搜尋用戶、群組')}
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>{activePage === 'userGroups' ? '群組名稱' : '用戶名稱'}</th><th>{activePage === 'userGroups' ? '群組類型' : '認證類型'}</th><th>狀態</th><th>{activePage === 'userGroups' ? '成員' : '關聯群組 / 說明'}</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><td>{row.name}</td><td>{row.type}</td><td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '啟用' : '停用'} /></td><td>{row.description}</td></tr>)}</tbody>
        </table>
        {renderManagedModalForPage(activePage, title)}
      </div>
    )
  }

  function renderWifiSwitchPage(activePage: FortiPage) {
    const title = getPageLabel(activePage)
    const rows = getFilteredManagedRows(activePage, title)
    const selectedId = selectedManagedIds[activePage] || rows[0]?.id || ''
    const getVlanSummary = (row: FortiManagedRow) => {
      const fields = parseFortiSwitchPort(row)
      return fields.mode === 'Trunk' ? fields.allowedVlans : fields.nativeVlan
    }
    const getPortRole = (row: FortiManagedRow) => parseFortiSwitchPort(row).role
    const topologyRows = getManagedRows('wifiSwitchTopology', 'WiFi / Switch 拓樸')
    const portRows = getManagedRows('wifiSwitchPorts', 'Switch Ports')
    const vlanRows = getManagedRows('wifiSwitchVlans', 'Switch VLANs')
    const goToRelatedManagedPage = (targetPage: FortiPage, id: string, label: string) => {
      setSelectedManagedId(targetPage, id)
      setPage(targetPage)
      setLastAction(`已切換至 ${label}`)
    }

    if (activePage === 'wifiSwitchTopology') {
      return (
        <div className="forti-fabric-page forti-wifi-topology-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-logical-layout forti-wifi-logical">
            <section className="forti-logical-column">
              <div className="forti-logical-heading">FortiGate / FortiLink</div>
              {topologyRows.slice(0, 1).map((row) => (
                <button key={row.id} type="button" className={`forti-logical-card forti-logical-button ${row.id === selectedId ? 'is-selected' : ''}`} onClick={() => setSelectedManagedId(activePage, row.id)}>
                  <i className="bx bx-shield-quarter"></i><strong>{row.name}</strong><span>{row.description}</span>
                </button>
              ))}
              <div className="forti-logical-card forti-linked-list-card">
                <i className="bx bx-network-chart"></i><strong>Switch VLANs</strong>
                <span>{vlanRows.filter((row) => row.enabled).length} active VLANs</span>
                <div className="forti-linked-list">
                  {vlanRows.map((row) => (
                    <button key={row.id} type="button" className={row.enabled ? 'is-active' : 'is-disabled'} onClick={() => goToRelatedManagedPage('wifiSwitchVlans', row.id, `Switch VLANs / ${row.name}`)}>
                      {row.name}<small>{row.enabled ? '啟用' : '停用'}</small>
                    </button>
                  ))}
                </div>
              </div>
            </section>
            <section className="forti-logical-core">
              <div className="forti-logical-device">
                <i className="bx bx-transfer"></i>
                <strong>{portRows.find((row) => row.description.includes('Uplink'))?.description.split('/').pop()?.trim() || 'Managed FortiSwitch'}</strong>
                <span>{portRows.filter((row) => row.enabled).length} active switch ports / {vlanRows.filter((row) => row.enabled).length} active VLANs</span>
              </div>
              <div className="forti-logical-policy">
                <span>Port Mapping</span>
                {portRows.map((row) => <button key={row.id} type="button" onClick={() => goToRelatedManagedPage('wifiSwitchPorts', row.id, `Switch Ports / ${row.name}`)}>{row.name} {'>'} VLAN {getVlanSummary(row)} / {getPortRole(row)}</button>)}
              </div>
            </section>
            <section className="forti-logical-column">
              <div className="forti-logical-heading">Wireless Edge</div>
              {topologyRows.slice(1).map((row) => (
                <button key={row.id} type="button" className={`forti-logical-card forti-logical-button ${row.id === selectedId ? 'is-selected' : ''}`} onClick={() => setSelectedManagedId(activePage, row.id)}>
                  <i className={row.type.includes('AP') ? 'bx bx-wifi' : 'bx bx-transfer'}></i><strong>{row.name}</strong><span>{row.description}</span>
                </button>
              ))}
            </section>
          </div>
          {renderManagedActionBar(activePage, title, '搜尋拓樸節點')}
          <table className="forti-table forti-selectable-table"><thead><tr><th>鏈路</th><th>類型</th><th>狀態</th><th>說明</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><td>{row.name}</td><td>{row.type}</td><td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? 'Online' : 'Offline'} /></td><td>{row.description}</td></tr>)}</tbody></table>
          {renderManagedModalForPage(activePage, title)}
        </div>
      )
    }

    if (activePage === 'wifiSwitchPorts') {
      return (
        <div className="forti-table-page forti-switch-port-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-port-grid">
            {Array.from({ length: 24 }, (_, index) => {
              const port = index + 1
              const row = portRows.find((item) => parseFortiSwitchPort(item).port === `port${port}`)
              const fields = row ? parseFortiSwitchPort(row) : null
              const selected = row?.id === selectedId
              return (
                <button
                  key={port}
                  type="button"
                  className={`forti-port-tile ${row ? 'is-configured' : ''} ${row?.enabled ? 'is-active' : ''} ${selected ? 'is-selected' : ''}`}
                  title={row ? `${row.name}: ${row.description}` : `port${port}: 尚未設定`}
                  onClick={() => {
                    if (row) {
                      setSelectedManagedId(activePage, row.id)
                      setLastAction(`已選取 ${row.name}`)
                    } else {
                      setLastAction(`port${port} 尚未建立設定`)
                    }
                  }}
                >
                  <span>{port}</span>
                  {fields && <small>{fields.mode === 'Trunk' ? 'T' : fields.poe ? 'P' : 'A'}</small>}
                </button>
              )
            })}
          </div>
          {renderManagedActionBar(activePage, title, '搜尋 port / VLAN')}
          <table className="forti-table forti-selectable-table"><thead><tr><th>Port</th><th>Mode</th><th>VLAN</th><th>Role</th><th>PoE</th><th>狀態</th><th>用途</th></tr></thead><tbody>{rows.map((row) => {
            const fields = parseFortiSwitchPort(row)
            return <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><td>{fields.port}</td><td>{fields.mode}</td><td>{fields.mode === 'Trunk' ? fields.allowedVlans : fields.nativeVlan}</td><td>{fields.role}</td><td>{fields.poe ? '啟用' : '停用'}</td><td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '啟用' : '停用'} /></td><td>{fields.purpose}</td></tr>
          })}</tbody></table>
          {renderManagedModalForPage(activePage, title)}
        </div>
      )
    }

    if (activePage === 'wifiSsids') {
      return (
        <div className="forti-table-page forti-ssid-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-ssid-layout">
            {rows.map((row) => <section key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><i className="bx bx-wifi"></i><strong>{row.name}</strong><span>{row.type}</span><p>{row.description}</p><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? 'Broadcast' : 'Hidden'} /></section>)}
          </div>
          {renderManagedActionBar(activePage, title, '搜尋 SSID')}
          {renderManagedModalForPage(activePage, title)}
        </div>
      )
    }

    if (activePage === 'wifiController') {
      return (
        <div className="forti-table-page forti-ap-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-ap-radio">
            <section><strong>2.4 GHz</strong><MiniChart tone="gray" /><span>Channel Auto / 20 MHz</span></section>
            <section><strong>5 GHz</strong><MiniChart /><span>Channel 149 / 80 MHz</span></section>
          </div>
          {renderManagedActionBar(activePage, title, '搜尋 FortiAP')}
          <table className="forti-table forti-selectable-table"><thead><tr><th>AP 名稱</th><th>型態</th><th>管理狀態</th><th>SSID / IP / 狀態</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><td>{row.name}</td><td>{row.type}</td><td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '授權' : '未授權'} /></td><td>{row.description}</td></tr>)}</tbody></table>
          {renderManagedModalForPage(activePage, title)}
        </div>
      )
    }

    if (activePage === 'wifiSwitchVlans') {
      return (
        <div className="forti-table-page forti-switch-vlan-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-vlan-lanes">
            {rows.map((row) => (
              <button key={row.id} type="button" className={`${row.id === selectedId ? 'is-selected' : ''} ${row.enabled ? 'is-active' : 'is-disabled'}`} onClick={() => setSelectedManagedId(activePage, row.id)}>
                <strong>{row.name}</strong>
                <span>{row.description}</span>
                <small>{row.name === 'VLAN_40' ? 'port1, port24' : row.name === 'VLAN_60' ? 'port8, port24' : 'port24'}</small>
                <div className="forti-vlan-bar"></div>
              </button>
            ))}
          </div>
          {renderManagedActionBar(activePage, title, '搜尋 VLAN')}
          <table className="forti-table forti-selectable-table"><thead><tr><th>VLAN</th><th>類型</th><th>狀態</th><th>網段 / 用途</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><td>{row.name}</td><td>{row.type}</td><td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '啟用' : '停用'} /></td><td>{row.description}</td></tr>)}</tbody></table>
          {renderManagedModalForPage(activePage, title)}
        </div>
      )
    }

    return (
      <div className="forti-table-page forti-ap-profile-page">
        <div className="forti-section-title">{title}</div>
        <div className="forti-profile-summary">
          <section><strong>{activePage === 'wifiApProfiles' ? 'Radio Profile' : 'FortiSwitch Authorization'}</strong><span>{activePage === 'wifiApProfiles' ? '集中設定射頻、頻寬、功率與用戶密度。' : '管理 FortiLink Switch 授權、韌體與成員狀態。'}</span></section>
          <section><strong>啟用項目</strong><span>{rows.filter((row) => row.enabled).length}</span></section>
        </div>
        {renderManagedActionBar(activePage, title, '搜尋設定檔或 Switch')}
        <table className="forti-table forti-selectable-table"><thead><tr><th>名稱</th><th>類型</th><th>狀態</th><th>設定摘要</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={row.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedManagedId(activePage, row.id)}><td>{row.name}</td><td>{row.type}</td><td><FortiSwitch checked={row.enabled} onChange={() => toggleManagedRow(activePage, title, row.id)} label={row.enabled ? '啟用' : '停用'} /></td><td>{row.description}</td></tr>)}</tbody></table>
        {renderManagedModalForPage(activePage, title)}
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
        <div className="forti-centered-actions forti-ha-actions">
          <button className="btn forti-apply" onClick={() => setLastAction('HA 設定已套用')}>套用</button>
        </div>
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
        <div className="forti-toolbar"><button className="btn btn-sm forti-btn" onClick={() => setLastAction('替換訊息自訂視窗已開啟')}>自訂訊息</button><select className="form-select form-select-sm forti-select"><option>所有訊息群組</option><option>Authentication</option><option>SSL-VPN</option><option>Web Filter</option></select></div>
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
      </div>
    )
  }

  function renderFeatureVisibility() {
    const search = featureSearch.trim().toLowerCase()
    const rows = featureVisibility.filter((item) => !search || `${item.group} ${item.name} ${item.description}`.toLowerCase().includes(search))
    const groups = Array.from(new Set(rows.map((item) => item.group)))
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">進階功能開關</div>
        <div className="forti-toolbar">
          <input className="form-control form-control-sm" placeholder="搜尋功能名稱、分類" value={featureSearch} onChange={(event) => setFeatureSearch(event.target.value)} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setFeatureVisibility((items) => items.map((item) => ({ ...item, enabled: true })))}>全部顯示</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setFeatureVisibility(initialFeatureVisibility)}>還原預設</button>
        </div>
        <div className="forti-feature-grid">
          {groups.map((group) => (
            <section className="forti-group-card" key={group}>
              <strong>{group}</strong>
              {rows.filter((item) => item.group === group).map((item) => (
                <div className="forti-feature-row" key={item.id}>
                  <div><b>{item.name}</b><span>{item.description}</span></div>
                  <FortiSwitch checked={item.enabled} onChange={() => toggleFeatureVisibility(item.id)} label={item.enabled ? '顯示' : '隱藏'} />
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    )
  }

  function renderTags() {
    const search = getTableSearch('featureVisibility')
    const rows = tags.filter((tag) => !search.trim() || `${tag.name} ${tag.category} ${tag.usedBy}`.toLowerCase().includes(search.trim().toLowerCase()))
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">標籤</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openTagModal('add')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openTagModal('edit')} disabled={!selectedTagId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedTag} disabled={!selectedTagId}>刪除</button>
          <input className="form-control form-control-sm" placeholder="搜尋標籤、分類、引用物件" value={search} onChange={(event) => updateTableSearch('featureVisibility', event.target.value)} />
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>顏色</th><th>標籤名稱</th><th>分類</th><th>使用於</th></tr></thead>
          <tbody>
            {rows.map((tag) => (
              <tr key={tag.id} className={tag.id === selectedTagId ? 'is-selected' : ''} onClick={() => setSelectedTagId(tag.id)}>
                <td><span className="forti-color-dot" style={{ background: tag.color }}></span></td>
                <td>{tag.name}</td><td>{tag.category}</td><td>{tag.usedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tagModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label={tagModalMode === 'add' ? '新增標籤' : '編輯標籤'}>
              <div className="forti-modal-title">{tagModalMode === 'add' ? '新增標籤' : '編輯標籤'}</div>
              <label>標籤名稱</label><input className="form-control form-control-sm" value={tagDraft.name} onChange={(event) => setTagDraft((draft) => ({ ...draft, name: event.target.value }))} />
              <label className="mt-2">顏色</label><input className="form-control form-control-sm" type="color" value={tagDraft.color} onChange={(event) => setTagDraft((draft) => ({ ...draft, color: event.target.value }))} />
              <label className="mt-2">分類</label><input className="form-control form-control-sm" value={tagDraft.category} onChange={(event) => setTagDraft((draft) => ({ ...draft, category: event.target.value }))} />
              <label className="mt-2">使用於</label><input className="form-control form-control-sm" value={tagDraft.usedBy} onChange={(event) => setTagDraft((draft) => ({ ...draft, usedBy: event.target.value }))} />
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setTagModalMode(null)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={saveTag}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderSecurityProfile(activePage: FortiPage, title: string) {
    const rows = securityProfileRows[activePage] || []
    const search = getTableSearch(activePage)
    const filteredRows = rows.filter((row) => !search.trim() || `${row.name} ${row.category} ${row.action} ${row.protocol} ${row.status}`.toLowerCase().includes(search.trim().toLowerCase()))
    if (activePage === 'appControl') {
      return (
        <div className="forti-table-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-app-control-board">
            {[
              ['Productivity', 'Allow', 'Office 365, GitHub', 'success'],
              ['Social Media', 'Monitor', 'Teams, Facebook', 'muted'],
              ['P2P / Proxy', 'Block', 'BitTorrent, Tor', 'danger'],
            ].map(([category, action, examples, tone]) => (
              <section key={category}><strong>{category}</strong><span className={`forti-pill ${tone}`}>{action}</span><p>{examples}</p></section>
            ))}
          </div>
          <div className="forti-toolbar"><input className="form-control form-control-sm" placeholder="搜尋應用程式分類、動作" value={search} onChange={(event) => updateTableSearch(activePage, event.target.value)} /></div>
          <table className="forti-table"><thead><tr><th>分類 / 應用</th><th>動作</th><th>檢查範圍</th><th>狀態</th></tr></thead><tbody>
            {filteredRows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.action}</td><td>{row.protocol}</td><td>{row.status}</td></tr>)}
          </tbody></table>
        </div>
      )
    }
    if (activePage === 'ips') {
      return (
        <div className="forti-form-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-split">
            <section className="forti-group-card">
              <strong>IPS Sensor</strong>
              <div className="forti-form-section forti-compact-form">
                <label>Sensor 名稱</label><input className="form-control form-control-sm" defaultValue="server-protect" />
                <label>掃描方向</label><select className="form-select form-select-sm" defaultValue="Incoming"><option>Incoming</option><option>Outgoing</option><option>Both</option></select>
                <label>預設動作</label><select className="form-select form-select-sm" defaultValue="Block"><option>Block</option><option>Monitor</option><option>Pass</option></select>
              </div>
            </section>
            <section className="forti-group-card">
              <strong>嚴重性篩選</strong>
              <div className="forti-access-grid">
                {['Critical', 'High', 'Medium', 'Low', 'Info'].map((level, index) => <label key={level}><input type="checkbox" defaultChecked={index < 3} /> {level}</label>)}
              </div>
            </section>
          </div>
          <table className="forti-table"><thead><tr><th>簽章 / Sensor</th><th>模式</th><th>協定</th><th>狀態</th></tr></thead><tbody>
            {rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.action}</td><td>{row.protocol}</td><td>{row.status}</td></tr>)}
          </tbody></table>
        </div>
      )
    }
    if (activePage === 'forticlientCompliance') {
      const endpointSearch = search.trim().toLowerCase()
      const filteredEndpoints = complianceEndpoints.filter((endpoint) => !endpointSearch || `${endpoint.device} ${endpoint.user} ${endpoint.os} ${endpoint.ems} ${endpoint.posture} ${endpoint.tags}`.toLowerCase().includes(endpointSearch))
      const selectedEndpoint = complianceEndpoints.find((endpoint) => endpoint.id === selectedComplianceEndpointId) || complianceEndpoints[0]
      const compliantCount = complianceEndpoints.filter((endpoint) => endpoint.posture === 'Compliant').length
      const warningCount = complianceEndpoints.filter((endpoint) => endpoint.posture === 'Warning').length
      const atRiskCount = complianceEndpoints.filter((endpoint) => endpoint.posture === 'At Risk').length
      return (
        <div className="forti-form-page forti-compliance-page">
          <div className="forti-section-title">{title}</div>

          <section className="forti-compliance-profile">
            <div>
              <span className="forti-panel-kicker">Endpoint compliance profile</span>
              <input className="form-control form-control-sm" value={complianceProfile.name} onChange={(event) => setComplianceProfile((profile) => ({ ...profile, name: event.target.value }))} />
              <p>依 FortiClient EMS 回報的端點註冊、弱點、即時防護與更新狀態決定網路存取權限。</p>
            </div>
            <div className="forti-compliance-profile-status">
              <span>設定檔狀態</span>
              <FortiSwitch checked={complianceProfile.enabled} onChange={() => setComplianceProfile((profile) => ({ ...profile, enabled: !profile.enabled }))} label={complianceProfile.enabled ? '啟用' : '停用'} />
              <span className="forti-pill success">EMS Connected</span>
            </div>
          </section>

          <div className="forti-compliance-metrics">
            <section><i className="bx bx-devices"></i><span>受管理端點</span><strong>{complianceEndpoints.length}</strong><small>Telemetry endpoints</small></section>
            <section><i className="bx bx-check-shield"></i><span>合規</span><strong>{compliantCount}</strong><small>允許正常存取</small></section>
            <section><i className="bx bx-error"></i><span>需要處理</span><strong>{warningCount}</strong><small>警告或寬限中</small></section>
            <section><i className="bx bx-lock-alt"></i><span>高風險</span><strong>{atRiskCount}</strong><small>隔離或阻擋</small></section>
          </div>

          <div className="forti-compliance-layout">
            <section className="forti-compliance-panel">
              <div className="forti-compliance-panel-title"><div><i className="bx bx-server"></i><strong>FortiClient EMS 連線</strong></div><span className="forti-pill success">Connected</span></div>
              <div className="forti-compliance-fields">
                <label><span>EMS Server</span><input className="form-control form-control-sm" value={complianceProfile.emsServer} onChange={(event) => setComplianceProfile((profile) => ({ ...profile, emsServer: event.target.value }))} /></label>
                <label><span>Telemetry Port</span><input className="form-control form-control-sm" value={complianceProfile.telemetryPort} onChange={(event) => setComplianceProfile((profile) => ({ ...profile, telemetryPort: event.target.value }))} /></label>
                <label><span>Server Certificate</span><select className="form-select form-select-sm" value={complianceProfile.certificate} onChange={(event) => setComplianceProfile((profile) => ({ ...profile, certificate: event.target.value }))}><option>Fortinet_Factory</option><option>EMS_CA</option><option>Local_CA</option></select></label>
              </div>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction(`EMS 連線測試成功：${complianceProfile.emsServer}:${complianceProfile.telemetryPort}`)}><i className="bx bx-plug"></i> 測試連線</button>
            </section>

            <section className="forti-compliance-panel">
              <div className="forti-compliance-panel-title"><div><i className="bx bx-shield-quarter"></i><strong>不合規處置</strong></div><span>Policy enforcement</span></div>
              <div className="forti-compliance-fields">
                <label><span>預設動作</span><select className="form-select form-select-sm" value={complianceProfile.defaultAction} onChange={(event) => setComplianceProfile((profile) => ({ ...profile, defaultAction: event.target.value as FortiComplianceProfile['defaultAction'] }))}><option>Warn</option><option>Quarantine</option><option>Block</option></select></label>
                <label><span>隔離 VLAN</span><input className="form-control form-control-sm" value={complianceProfile.quarantineVlan} onChange={(event) => setComplianceProfile((profile) => ({ ...profile, quarantineVlan: event.target.value }))} /></label>
                <label><span>寬限時間（分鐘）</span><input className="form-control form-control-sm" type="number" min="0" value={complianceProfile.graceMinutes} onChange={(event) => setComplianceProfile((profile) => ({ ...profile, graceMinutes: event.target.value }))} /></label>
              </div>
              <div className="forti-compliance-action-flow"><span className="is-good">Compliant</span><i className="bx bx-right-arrow-alt"></i><span className="is-warn">Warning</span><i className="bx bx-right-arrow-alt"></i><span className="is-risk">{complianceProfile.defaultAction}</span></div>
            </section>
          </div>

          <section className="forti-compliance-section">
            <div className="forti-compliance-section-heading"><div><strong>合規檢查條件</strong><span>啟用需要由 EMS 回報並參與存取判斷的端點條件。</span></div><b>{complianceChecks.filter((check) => check.enabled).length}/{complianceChecks.length} enabled</b></div>
            <div className="forti-compliance-checks">
              {complianceChecks.map((check) => (
                <article key={check.id} className={check.enabled ? 'is-enabled' : ''}>
                  <div><span>{check.category}</span><strong>{check.name}</strong><p>{check.condition}</p></div>
                  <select className="form-select form-select-sm" value={check.failureAction} onChange={(event) => setComplianceChecks((checks) => checks.map((item) => item.id === check.id ? { ...item, failureAction: event.target.value as FortiComplianceCheck['failureAction'] } : item))}><option>Warn</option><option>Quarantine</option><option>Block</option></select>
                  <FortiSwitch checked={check.enabled} onChange={() => setComplianceChecks((checks) => checks.map((item) => item.id === check.id ? { ...item, enabled: !item.enabled } : item))} label={check.enabled ? '啟用' : '停用'} />
                </article>
              ))}
            </div>
          </section>

          <section className="forti-compliance-section">
            <div className="forti-compliance-section-heading"><div><strong>端點合規狀態</strong><span>從 EMS Telemetry 彙整的端點健康狀態與動態標籤。</span></div><span className="forti-pill success">Last sync 1 min ago</span></div>
            <div className="forti-toolbar forti-compliance-toolbar">
              <input className="form-control form-control-sm" placeholder="搜尋端點、使用者、OS 或標籤" value={search} onChange={(event) => updateTableSearch(activePage, event.target.value)} />
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => refreshFortiArea('FortiClient Compliance')}><i className="bx bx-refresh"></i> 同步 EMS</button>
            </div>
            <table className="forti-table forti-selectable-table"><thead><tr><th>端點</th><th>使用者</th><th>作業系統</th><th>EMS</th><th>合規狀態</th><th>動態標籤</th><th>最後回報</th></tr></thead><tbody>
              {filteredEndpoints.map((endpoint) => <tr key={endpoint.id} className={endpoint.id === selectedComplianceEndpointId ? 'is-selected' : ''} onClick={() => setSelectedComplianceEndpointId(endpoint.id)}><td><strong>{endpoint.device}</strong></td><td>{endpoint.user}</td><td>{endpoint.os}</td><td>{endpoint.ems}</td><td><span className={endpoint.posture === 'Compliant' ? 'forti-pill success' : endpoint.posture === 'Warning' ? 'forti-pill muted' : 'forti-pill danger'}>{endpoint.posture}</span></td><td>{endpoint.tags}</td><td>{endpoint.lastSeen}</td></tr>)}
              {!filteredEndpoints.length && <tr><td colSpan={7} className="forti-table-empty">沒有符合條件的端點</td></tr>}
            </tbody></table>
            {selectedEndpoint && (
              <div className="forti-compliance-endpoint-detail">
                <div><i className="bx bx-laptop"></i><span>目前選取</span><strong>{selectedEndpoint.device}</strong></div>
                <div><span>使用者</span><strong>{selectedEndpoint.user}</strong></div>
                <div><span>端點標籤</span><strong>{selectedEndpoint.tags}</strong></div>
                <div><span>處置</span><strong>{selectedEndpoint.posture === 'Compliant' ? '允許存取' : selectedEndpoint.posture === 'Warning' ? `寬限 ${complianceProfile.graceMinutes} 分鐘` : complianceProfile.defaultAction}</strong></div>
              </div>
            )}
          </section>
        </div>
      )
    }
    if (activePage === 'sslInspection') {
      return (
        <div className="forti-form-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-form-section">
            <label>檢查模式</label><div className="forti-segments">{['Certificate Inspection', 'Full SSL Inspection'].map((mode) => <button type="button" key={mode} className={sslInspectionMode === mode ? 'active' : ''} onClick={() => setSslInspectionMode(mode)}>{mode}</button>)}</div>
            <label>CA 憑證</label><select className="form-select form-select-sm" defaultValue="Fortinet_CA_SSL"><option>Fortinet_CA_SSL</option><option>Local_CA</option></select>
            <label>檢查協定</label><div className="forti-check-row"><label><input type="checkbox" defaultChecked /> HTTPS</label><label><input type="checkbox" defaultChecked /> SMTPS</label><label><input type="checkbox" /> IMAPS</label><label><input type="checkbox" /> SSH</label></div>
          </div>
          <div className="forti-band">例外清單</div>
          <table className="forti-table"><thead><tr><th>目的地</th><th>原因</th><th>動作</th></tr></thead><tbody>
            <tr><td>banking.example</td><td>金融網站</td><td>Exempt</td></tr>
            <tr><td>update.fortinet.com</td><td>FortiGuard 更新</td><td>Certificate only</td></tr>
          </tbody></table>
        </div>
      )
    }
    if (activePage === 'ratingOverrides') {
      return (
        <div className="forti-table-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-form-section forti-inline-settings">
            <label>網址 / 網域</label><input className="form-control form-control-sm" defaultValue="internal-app.local" />
            <label>自訂分類</label><select className="form-select form-select-sm" defaultValue="Business"><option>Business</option><option>Information Technology</option><option>Security Risk</option></select>
            <label>評級來源</label><select className="form-select form-select-sm" defaultValue="Local Override"><option>Local Override</option><option>FortiGuard</option></select>
          </div>
          <table className="forti-table"><thead><tr><th>網站 / 網域</th><th>自訂分類</th><th>動作</th><th>來源</th></tr></thead><tbody>
            {rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.category}</td><td>{row.action}</td><td>{row.protocol}</td></tr>)}
          </tbody></table>
        </div>
      )
    }
    if (activePage === 'customSignatures') {
      return (
        <div className="forti-form-page">
          <div className="forti-section-title">{title}</div>
          <div className="forti-signature-layout">
            <section>
              <strong>Signature Editor</strong>
              <textarea className="form-control forti-signature-code" value={customSignatureText} onChange={(event) => setCustomSignatureText(event.target.value)} />
            </section>
            <section>
              <strong>測試與套用</strong>
              <button className="btn btn-sm forti-btn" onClick={validateCustomSignature}>檢查語法</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={addCustomSignature}>加入清單</button>
              <button className="btn btn-sm btn-outline-danger" onClick={deleteCustomSignature} disabled={!selectedCustomSignatureId}>刪除選取</button>
              {signatureCheckResult && <div className="forti-info-note">{signatureCheckResult}</div>}
            </section>
          </div>
          <table className="forti-table forti-selectable-table"><thead><tr><th>名稱</th><th>類型</th><th>嚴重性 / 動作</th><th>協定</th><th>狀態</th></tr></thead><tbody>
            {customSignatureRows.map((row) => (
              <tr key={row.id} className={row.id === selectedCustomSignatureId ? 'is-selected' : ''} onClick={() => setSelectedCustomSignatureId(row.id)}>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td>{row.action}</td>
                <td>{row.protocol}</td>
                <td><span className={row.status === '啟用' ? 'forti-pill success' : 'forti-pill muted'}>{row.status}</span></td>
              </tr>
            ))}
            {!customSignatureRows.length && <tr><td colSpan={5} className="forti-table-empty">尚未加入自訂特徵值</td></tr>}
          </tbody></table>
        </div>
      )
    }
    const detail = { profileField: 'Security Profile', summary: '設定檔會套用到政策的資安管理欄位。', defaultAction: '依規則處理' }
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">{title}</div>
        <div className="forti-profile-summary">
          <section><strong>{detail.profileField}</strong><span>{detail.summary}</span></section>
          <section><strong>預設動作</strong><span>{detail.defaultAction}</span></section>
        </div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => setLastAction(`${title} 新增規則視窗已開啟`)}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction(`${title} 編輯規則視窗已開啟`)}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => setLastAction(`${title} 已刪除選取規則`)}>刪除</button>
          <input className="form-control form-control-sm" placeholder="搜尋設定檔、分類、動作" value={search} onChange={(event) => updateTableSearch(activePage, event.target.value)} />
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>名稱</th><th>類型 / 分類</th><th>動作</th><th>協定 / 檢查範圍</th><th>狀態</th></tr></thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td><span className={row.action.toLowerCase().includes('block') ? 'forti-pill danger' : row.action.toLowerCase().includes('allow') ? 'forti-pill success' : 'forti-pill muted'}>{row.action}</span></td>
                <td>{row.protocol}</td>
                <td><span className={row.status === '啟用' ? 'forti-pill success' : 'forti-pill muted'}>{row.status}</span></td>
              </tr>
            ))}
            {!filteredRows.length && <tr><td colSpan={5} className="forti-table-empty">無符合條件的設定檔項目</td></tr>}
          </tbody>
        </table>
      </div>
    )
  }

  function renderVpnOverlay() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">Overlay Controller VPN</div>
        <div className="forti-profile-summary">
          <section><strong>Overlay VPN</strong><span>用於集中管理 ADVPN / Hub-Spoke overlay，讓分支 FortiGate 依拓樸自動建立 VPN。</span></section>
          <section><strong>角色</strong><span>Controller / Hub</span></section>
        </div>
        <div className="forti-form-section">
          <label>狀態</label><FortiSwitch checked={overlayEnabled} onChange={() => setOverlayEnabled((enabled) => !enabled)} label={overlayEnabled ? '啟用' : '停用'} />
          <label>Overlay 名稱</label><input className="form-control form-control-sm" defaultValue="KAG-Overlay" />
          <label>Hub 介面</label><select className="form-select form-select-sm" defaultValue="wan1"><option>wan1</option><option>wan2</option><option>VLAN_40</option></select>
          <label>本地網段</label><input className="form-control form-control-sm" defaultValue="10.20.40.0/24" />
        </div>
        <div className="forti-band">分支 Peer</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openOverlayPeerModal('add')}>新增 Peer</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openOverlayPeerModal('edit')} disabled={!selectedOverlayPeerId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedOverlayPeer} disabled={!selectedOverlayPeerId}>刪除</button>
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>名稱</th><th>遠端 Gateway</th><th>分支網段</th><th>狀態</th></tr></thead>
          <tbody>
            {overlayPeers.map((peer) => (
              <tr key={peer.id} className={peer.id === selectedOverlayPeerId ? 'is-selected' : ''} onClick={() => setSelectedOverlayPeerId(peer.id)}>
                <td>{peer.name}</td><td>{peer.remoteGateway}</td><td>{peer.subnet}</td><td><span className={peer.status === '啟用' ? 'forti-pill success' : 'forti-pill muted'}>{peer.status}</span></td>
              </tr>
            ))}
            {!overlayPeers.length && <tr><td colSpan={4} className="forti-table-empty">尚未設定分支 Peer</td></tr>}
          </tbody>
        </table>
        {overlayPeerModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label={overlayPeerModalMode === 'add' ? '新增 Overlay Peer' : '編輯 Overlay Peer'}>
              <div className="forti-modal-title">{overlayPeerModalMode === 'add' ? '新增 Overlay Peer' : '編輯 Overlay Peer'}</div>
              <label>名稱</label><input className="form-control form-control-sm" value={overlayPeerDraft.name} onChange={(event) => setOverlayPeerDraft((draft) => ({ ...draft, name: event.target.value }))} />
              <label className="mt-2">遠端 Gateway</label><input className="form-control form-control-sm" value={overlayPeerDraft.remoteGateway} onChange={(event) => setOverlayPeerDraft((draft) => ({ ...draft, remoteGateway: event.target.value }))} />
              <label className="mt-2">分支網段</label><input className="form-control form-control-sm" value={overlayPeerDraft.subnet} onChange={(event) => setOverlayPeerDraft((draft) => ({ ...draft, subnet: event.target.value }))} />
              <label className="mt-2">狀態</label><FortiSwitch checked={overlayPeerDraft.status === '啟用'} onChange={() => setOverlayPeerDraft((draft) => ({ ...draft, status: draft.status === '啟用' ? '停用' : '啟用' }))} label={overlayPeerDraft.status} />
              <div className="forti-modal-actions"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setOverlayPeerModalMode(null)}>取消</button><button type="button" className="btn btn-sm forti-btn" onClick={saveOverlayPeer}>儲存</button></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderIpsecTunnels() {
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">IPsec 通道</div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openIpsecTunnelModal('add')}>新增</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openIpsecTunnelModal('edit')} disabled={!selectedIpsecTunnelId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedIpsecTunnel} disabled={!selectedIpsecTunnelId}>刪除</button>
        </div>
        <table className="forti-table forti-selectable-table"><thead><tr><th>名稱</th><th>遠端 Gateway</th><th>介面</th><th>本地子網</th><th>遠端子網</th><th>Phase1/2</th><th>狀態</th></tr></thead><tbody>
          {ipsecTunnels.map((tunnel) => (
            <tr key={tunnel.id} className={tunnel.id === selectedIpsecTunnelId ? 'is-selected' : ''} onClick={() => setSelectedIpsecTunnelId(tunnel.id)}>
              <td>{tunnel.name}</td><td>{tunnel.remoteGateway}</td><td>{tunnel.interfaceName}</td><td>{tunnel.localSubnet}</td><td>{tunnel.remoteSubnet}</td><td>{tunnel.phase}</td>
              <td><button className="forti-switch-button" onClick={() => toggleIpsecTunnel(tunnel.id)}><span className={tunnel.status === 'Up' ? 'forti-pill success' : 'forti-pill muted'}>{tunnel.status}</span></button></td>
            </tr>
          ))}
          {!ipsecTunnels.length && <tr><td colSpan={7} className="forti-table-empty">尚未建立 IPsec 通道</td></tr>}
        </tbody></table>
        {ipsecTunnelModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal forti-modal-wide" role="dialog" aria-modal="true" aria-label={ipsecTunnelModalMode === 'add' ? '新增 IPsec 通道' : '編輯 IPsec 通道'}>
              <div className="forti-modal-title">{ipsecTunnelModalMode === 'add' ? '新增 IPsec 通道' : '編輯 IPsec 通道'}</div>
              <div className="forti-modal-grid">
                <label>名稱</label><input className="form-control form-control-sm" value={ipsecTunnelDraft.name} onChange={(event) => setIpsecTunnelDraft((draft) => ({ ...draft, name: event.target.value }))} />
                <label>遠端 Gateway</label><input className="form-control form-control-sm" value={ipsecTunnelDraft.remoteGateway} onChange={(event) => setIpsecTunnelDraft((draft) => ({ ...draft, remoteGateway: event.target.value }))} />
                <label>介面</label><select className="form-select form-select-sm" value={ipsecTunnelDraft.interfaceName} onChange={(event) => setIpsecTunnelDraft((draft) => ({ ...draft, interfaceName: event.target.value }))}>{interfaces.map((item) => <option key={item.name}>{item.name}</option>)}</select>
                <label>本地子網</label><input className="form-control form-control-sm" value={ipsecTunnelDraft.localSubnet} onChange={(event) => setIpsecTunnelDraft((draft) => ({ ...draft, localSubnet: event.target.value }))} />
                <label>遠端子網</label><input className="form-control form-control-sm" value={ipsecTunnelDraft.remoteSubnet} onChange={(event) => setIpsecTunnelDraft((draft) => ({ ...draft, remoteSubnet: event.target.value }))} />
                <label>Phase1/2</label><input className="form-control form-control-sm" value={ipsecTunnelDraft.phase} onChange={(event) => setIpsecTunnelDraft((draft) => ({ ...draft, phase: event.target.value }))} />
                <label>狀態</label><FortiSwitch checked={ipsecTunnelDraft.status === 'Up'} onChange={() => setIpsecTunnelDraft((draft) => ({ ...draft, status: draft.status === 'Up' ? 'Down' : 'Up' }))} label={ipsecTunnelDraft.status} />
              </div>
              <div className="forti-modal-actions"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setIpsecTunnelModalMode(null)}>取消</button><button type="button" className="btn btn-sm forti-btn" onClick={saveIpsecTunnel}>儲存</button></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderIpsecWizard() {
    const wizardHints = [
      '選擇 VPN 類型與通道角色',
      '設定遠端 Gateway、介面與認證',
      '設定本地/遠端子網與 Phase 2 selector',
    ]
    if (ipsecWizardMode === 'list') {
      return (
        <div className="forti-table-page">
          <div className="forti-section-title">IPsec 精靈</div>
          <div className="forti-profile-summary">
            <section><strong>精靈草稿</strong><span>完成精靈後會建立 IPsec 通道草稿，並同步出現在 IPsec 通道清單。</span></section>
            <section><strong>通道數</strong><span>{ipsecTunnels.length}</span></section>
            <section><strong>已啟用</strong><span>{ipsecTunnels.filter((item) => item.status === 'Up').length}</span></section>
          </div>
          <div className="forti-toolbar">
            <button className="btn btn-sm forti-btn" onClick={() => { setIpsecWizardMode('create'); setIpsecWizardStep(1); setIpsecWizardError('') }}>建立 IPsec VPN</button>
            <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedIpsecTunnel} disabled={!selectedIpsecTunnelId}>刪除</button>
          </div>
          <table className="forti-table forti-selectable-table">
            <thead><tr><th>名稱</th><th>遠端 Gateway</th><th>本地子網</th><th>遠端子網</th><th>Phase1/2</th><th>狀態</th></tr></thead>
            <tbody>
              {ipsecTunnels.map((tunnel) => (
                <tr key={tunnel.id} className={tunnel.id === selectedIpsecTunnelId ? 'is-selected' : ''} onClick={() => setSelectedIpsecTunnelId(tunnel.id)}>
                  <td>{tunnel.name}</td>
                  <td>{tunnel.remoteGateway}</td>
                  <td>{tunnel.localSubnet}</td>
                  <td>{tunnel.remoteSubnet}</td>
                  <td>{tunnel.phase}</td>
                  <td><span className={tunnel.status === 'Up' ? 'forti-pill success' : 'forti-pill muted'}>{tunnel.status}</span></td>
                </tr>
              ))}
              {!ipsecTunnels.length && <tr><td colSpan={6} className="forti-table-empty">尚未建立 IPsec 通道草稿</td></tr>}
            </tbody>
          </table>
        </div>
      )
    }
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">IPsec 精靈</div>
        <div className="forti-wizard-steps">
          {wizardHints.map((hint, index) => (
            <button type="button" key={hint} className={ipsecWizardStep === index + 1 ? 'active' : ''} disabled>
              <strong>{index + 1}</strong><span>{hint}</span>
            </button>
          ))}
        </div>
        {ipsecWizardStep === 1 && (
          <div className="forti-form-section">
            <label>VPN 類型</label><div className="forti-segments">{['Site to Site', 'Remote Access', 'Hub-and-Spoke', 'Custom'].map((mode) => <button type="button" key={mode} className={ipsecWizardType === mode ? 'active' : ''} onClick={() => setIpsecWizardType(mode)}>{mode}</button>)}</div>
            <label>名稱</label><input className="form-control form-control-sm" value={ipsecWizardName} onChange={(event) => setIpsecWizardName(event.target.value)} />
            <label>拓樸角色</label><select className="form-select form-select-sm" defaultValue="Hub"><option>Hub</option><option>Spoke</option><option>Remote Peer</option></select>
          </div>
        )}
        {ipsecWizardStep === 2 && (
          <div className="forti-form-section">
            <label>遠端 Gateway</label><input className="form-control form-control-sm" value={ipsecWizardGateway} onChange={(event) => setIpsecWizardGateway(event.target.value)} />
            <label>介面</label><select className="form-select form-select-sm" defaultValue="wan1"><option>wan1</option><option>wan2</option></select>
            <label>驗證方式</label><select className="form-select form-select-sm" defaultValue="Pre-shared Key"><option>Pre-shared Key</option><option>Certificate</option></select>
            <label>Pre-shared Key</label><input className="form-control form-control-sm" type="password" defaultValue="ChangeMe123!" />
            <label>IKE Version</label><select className="form-select form-select-sm" defaultValue="IKEv2"><option>IKEv2</option><option>IKEv1</option></select>
            <label>NAT Traversal</label><FortiSwitch checked={ipsecWizardNatTraversal} onChange={() => setIpsecWizardNatTraversal((enabled) => !enabled)} label={ipsecWizardNatTraversal ? '啟用' : '停用'} />
          </div>
        )}
        {ipsecWizardStep === 3 && (
          <div className="forti-form-section">
            <label>本地 / 遠端子網</label><div className="forti-two-inputs"><input className={`form-control form-control-sm ${ipsecWizardLocalSubnet && !isValidCidr(ipsecWizardLocalSubnet) ? 'is-invalid' : ''}`} value={ipsecWizardLocalSubnet} onChange={(event) => setIpsecWizardLocalSubnet(event.target.value)} /><input className={`form-control form-control-sm ${ipsecWizardRemoteSubnet && !isValidCidr(ipsecWizardRemoteSubnet) ? 'is-invalid' : ''}`} value={ipsecWizardRemoteSubnet} onChange={(event) => setIpsecWizardRemoteSubnet(event.target.value)} /></div>
            <label>Phase 2 Proposal</label><select className="form-select form-select-sm" defaultValue="AES256-SHA256"><option>AES256-SHA256</option><option>AES128-SHA256</option><option>AES256-SHA1</option></select>
            <label>Dead Peer Detection</label><select className="form-select form-select-sm" defaultValue="On idle"><option>On idle</option><option>On demand</option><option>停用</option></select>
            <label>通道狀態</label><FortiSwitch checked={ipsecWizardEnabled} onChange={() => setIpsecWizardEnabled((enabled) => !enabled)} label={ipsecWizardEnabled ? '啟用' : '停用'} />
            <label></label>{ipsecWizardError && <div className="forti-alert-note">{ipsecWizardError}</div>}
          </div>
        )}
        <div className="forti-centered-actions">
          <button className="btn btn-outline-secondary me-2" onClick={() => { setIpsecWizardMode('list'); setIpsecWizardStep(1); setIpsecWizardError('') }}>回清單</button>
          {ipsecWizardStep > 1 && <button className="btn btn-outline-secondary me-2" onClick={() => setIpsecWizardStep((step) => Math.max(1, step - 1))}>上一步</button>}
          <button className="btn forti-apply" onClick={nextIpsecWizardStep}>{ipsecWizardStep === 3 ? '完成 / 儲存草稿' : '下一步'}</button>
        </div>
      </div>
    )
  }

  function renderIpsecTemplates() {
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">IPsec 通道範本</div>
        <table className="forti-table"><thead><tr><th>範本</th><th>用途</th><th>IKE</th><th>加密</th><th>NAT Traversal</th><th>DPD</th></tr></thead><tbody>
          <tr><td>Site_to_Site_Strong</td><td>分公司互連</td><td>IKEv2</td><td>AES256/SHA256/DH14</td><td>啟用</td><td>On idle</td></tr>
          <tr><td>Remote_Access_User</td><td>使用者撥入</td><td>IKEv2</td><td>AES256/SHA256</td><td>啟用</td><td>On demand</td></tr>
          <tr><td>Cloud_VPC</td><td>雲端 VPC</td><td>IKEv2</td><td>AES256/SHA256/DH14</td><td>啟用</td><td>On idle</td></tr>
        </tbody></table>
      </div>
    )
  }

  function renderSslVpnPortal() {
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">SSL-VPN 入口頁面</div>
        <div className="forti-info-note forti-spaced-note">入口頁面會被 SSL-VPN 設定引用，使用者登入後依入口頁模式取得 Web Bookmark 或 Tunnel IP。</div>
        <div className="forti-form-section">
          <label>入口頁名稱</label><select className="form-select form-select-sm" defaultValue="full-access"><option>full-access</option><option>web-access</option><option>tunnel-access</option><option>custom-portal</option></select>
          <label>入口頁模式</label><div className="forti-segments">{['Tunnel + Web Mode', 'Tunnel Mode Only', 'Web Mode Only'].map((mode) => <button key={mode} className={sslPortalMode === mode ? 'active' : ''} onClick={() => setSslPortalMode(mode)}>{mode}</button>)}</div>
          <label>關聯 SSL-VPN Port</label><input className="form-control form-control-sm" value={sslListenPort} onChange={(event) => setSslListenPort(event.target.value)} />
          <label>Web Bookmarks</label><div className="forti-chip-box">{sslPortalBookmarks.map((item) => <span className="forti-chip" key={item}>{item}<button type="button" className="forti-chip-remove" onClick={() => setSslPortalBookmarks((items) => items.filter((entry) => entry !== item))}>×</button></span>)}<button className="forti-chip-add" onClick={() => setSslBookmarkModalOpen(true)}>+</button></div>
          <label>Split Tunnel</label><FortiSwitch checked={sslTunnelAddressMode === '自動分配位址'} onChange={() => setSslTunnelAddressMode((mode) => mode === '自動分配位址' ? '指定自訂IP範圍' : '自動分配位址')} label={sslTunnelAddressMode === '自動分配位址' ? '啟用' : '停用'} />
        </div>
        {sslBookmarkModalOpen && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label="新增 Web Bookmark">
              <div className="forti-modal-title">新增 Web Bookmark</div>
              <label>Bookmark 名稱</label><input className="form-control form-control-sm" value={sslBookmarkDraft} onChange={(event) => setSslBookmarkDraft(event.target.value)} />
              <label className="mt-2">URL / 目標</label><input className="form-control form-control-sm" defaultValue="https://intranet.local" />
              <div className="forti-modal-actions"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSslBookmarkModalOpen(false)}>取消</button><button type="button" className="btn btn-sm forti-btn" onClick={addSslBookmark}>新增</button></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderWebFilter() {
    const search = getTableSearch('webFilter')
    const rows = urlFilters.filter((rule) => !search.trim() || `${rule.url} ${rule.type} ${rule.action} ${rule.status}`.toLowerCase().includes(search.trim().toLowerCase()))
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">網頁過濾</div>
        <div className="forti-form-section forti-inline-settings">
          <label>設定檔狀態</label><FortiSwitch checked={webFilterProfileEnabled} onChange={() => setWebFilterProfileEnabled((enabled) => !enabled)} label={webFilterProfileEnabled ? '啟用' : '停用'} />
          <label>預設動作</label><select className="form-select form-select-sm" defaultValue="Monitor"><option>Allow</option><option>Block</option><option>Monitor</option></select>
        </div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openUrlFilterModal('add')}>新增 URL</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openUrlFilterModal('edit')} disabled={!selectedUrlFilterId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedUrlFilter} disabled={!selectedUrlFilterId}>刪除</button>
          <input className="form-control form-control-sm" placeholder="搜尋 URL / 網域" value={search} onChange={(event) => updateTableSearch('webFilter', event.target.value)} />
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>URL / 網域</th><th>比對類型</th><th>動作</th><th>狀態</th></tr></thead>
          <tbody>
            {rows.map((rule) => (
              <tr key={rule.id} className={rule.id === selectedUrlFilterId ? 'is-selected' : ''} onClick={() => setSelectedUrlFilterId(rule.id)}>
                <td>{rule.url}</td><td>{rule.type}</td><td><span className={rule.action === 'Block' ? 'forti-pill danger' : rule.action === 'Allow' ? 'forti-pill success' : 'forti-pill muted'}>{rule.action}</span></td><td>{rule.status}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={4} className="forti-table-empty">無符合條件的 URL 過濾規則</td></tr>}
          </tbody>
        </table>
        {urlFilterModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label={urlFilterModalMode === 'add' ? '新增 URL 過濾' : '編輯 URL 過濾'}>
              <div className="forti-modal-title">{urlFilterModalMode === 'add' ? '新增 URL 過濾' : '編輯 URL 過濾'}</div>
              <label>URL / 網域</label><input className="form-control form-control-sm" value={urlFilterDraft.url} onChange={(event) => setUrlFilterDraft((draft) => ({ ...draft, url: event.target.value }))} />
              <label className="mt-2">比對類型</label><select className="form-select form-select-sm" value={urlFilterDraft.type} onChange={(event) => setUrlFilterDraft((draft) => ({ ...draft, type: event.target.value as FortiUrlFilterRule['type'] }))}><option>Simple</option><option>Wildcard</option><option>Regex</option></select>
              <label className="mt-2">動作</label><select className="form-select form-select-sm" value={urlFilterDraft.action} onChange={(event) => setUrlFilterDraft((draft) => ({ ...draft, action: event.target.value as FortiUrlFilterRule['action'] }))}><option>Allow</option><option>Block</option><option>Monitor</option></select>
              <label className="mt-2">狀態</label><FortiSwitch checked={urlFilterDraft.status === '啟用'} onChange={() => setUrlFilterDraft((draft) => ({ ...draft, status: draft.status === '啟用' ? '停用' : '啟用' }))} label={urlFilterDraft.status} />
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setUrlFilterModalMode(null)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={saveUrlFilter}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderDnsFilter() {
    const search = getTableSearch('dnsFilter')
    const rows = dnsFilters.filter((rule) => !search.trim() || `${rule.domain} ${rule.category} ${rule.dnsServer} ${rule.action} ${rule.status}`.toLowerCase().includes(search.trim().toLowerCase()))
    return (
      <div className="forti-table-page">
        <div className="forti-section-title">DNS 過濾器</div>
        <div className="forti-form-section forti-inline-settings">
          <label>設定檔狀態</label><FortiSwitch checked={dnsFilterProfileEnabled} onChange={() => setDnsFilterProfileEnabled((enabled) => !enabled)} label={dnsFilterProfileEnabled ? '啟用' : '停用'} />
          <label>預設 DNS 伺服器</label><input className="form-control form-control-sm" value={dnsPrimary} onChange={(event) => setDnsPrimary(event.target.value)} />
        </div>
        <div className="forti-toolbar">
          <button className="btn btn-sm forti-btn" onClick={() => openDnsFilterModal('add')}>新增網域</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => openDnsFilterModal('edit')} disabled={!selectedDnsFilterId}>編輯</button>
          <button className="btn btn-sm btn-outline-danger" onClick={deleteSelectedDnsFilter} disabled={!selectedDnsFilterId}>刪除</button>
          <input className="form-control form-control-sm" placeholder="搜尋網域 / DNS" value={search} onChange={(event) => updateTableSearch('dnsFilter', event.target.value)} />
        </div>
        <table className="forti-table forti-selectable-table">
          <thead><tr><th>DNS 網域</th><th>分類</th><th>DNS 伺服器</th><th>動作</th><th>狀態</th></tr></thead>
          <tbody>
            {rows.map((rule) => (
              <tr key={rule.id} className={rule.id === selectedDnsFilterId ? 'is-selected' : ''} onClick={() => setSelectedDnsFilterId(rule.id)}>
                <td>{rule.domain}</td><td>{rule.category}</td><td>{rule.dnsServer}</td><td><span className={rule.action === 'Block' ? 'forti-pill danger' : rule.action === 'Allow' ? 'forti-pill success' : 'forti-pill muted'}>{rule.action}</span></td><td>{rule.status}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="forti-table-empty">無符合條件的 DNS 過濾規則</td></tr>}
          </tbody>
        </table>
        {dnsFilterModalMode && (
          <div className="forti-modal-backdrop" role="presentation">
            <div className="forti-modal" role="dialog" aria-modal="true" aria-label={dnsFilterModalMode === 'add' ? '新增 DNS 過濾' : '編輯 DNS 過濾'}>
              <div className="forti-modal-title">{dnsFilterModalMode === 'add' ? '新增 DNS 過濾' : '編輯 DNS 過濾'}</div>
              <label>DNS 網域</label><input className="form-control form-control-sm" value={dnsFilterDraft.domain} onChange={(event) => setDnsFilterDraft((draft) => ({ ...draft, domain: event.target.value }))} />
              <label className="mt-2">分類</label><input className="form-control form-control-sm" value={dnsFilterDraft.category} onChange={(event) => setDnsFilterDraft((draft) => ({ ...draft, category: event.target.value }))} />
              <label className="mt-2">DNS 伺服器</label><input className="form-control form-control-sm" value={dnsFilterDraft.dnsServer} onChange={(event) => setDnsFilterDraft((draft) => ({ ...draft, dnsServer: event.target.value }))} />
              <label className="mt-2">動作</label><select className="form-select form-select-sm" value={dnsFilterDraft.action} onChange={(event) => setDnsFilterDraft((draft) => ({ ...draft, action: event.target.value as FortiDnsFilterRule['action'] }))}><option>Allow</option><option>Block</option><option>Monitor</option></select>
              <label className="mt-2">狀態</label><FortiSwitch checked={dnsFilterDraft.status === '啟用'} onChange={() => setDnsFilterDraft((draft) => ({ ...draft, status: draft.status === '啟用' ? '停用' : '啟用' }))} label={dnsFilterDraft.status} />
              <div className="forti-modal-actions">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDnsFilterModalMode(null)}>取消</button>
                <button type="button" className="btn btn-sm forti-btn" onClick={saveDnsFilter}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderMonitor(activePage: FortiPage) {
    if (activePage === 'monitorRouting') {
      const selectedRoute = routes.find((route) => route.id === selectedRouteId) || routes[0]
      return (
        <div className="forti-table-page forti-monitor-routing">
          <div className="forti-section-title">路由監測</div>
          <div className="forti-route-health">
            {routes.map((route) => (
              <button
                key={route.id}
                type="button"
                className={selectedRoute?.id === route.id ? 'is-selected' : ''}
                onClick={() => setSelectedRouteId(route.id)}
              >
                <strong>{route.interfaceName}</strong>
                <span className={route.enabled ? 'forti-pill success' : 'forti-pill muted'}>{route.enabled ? 'Active' : 'Inactive'}</span>
                <small><b>{route.destination}</b><em>GW {route.gateway}</em><em>Distance {route.distance} / Priority {route.priority}</em></small>
              </button>
            ))}
          </div>
          <div className="forti-toolbar">
            <input className="form-control form-control-sm" placeholder="查詢目的 IP，例如 10.20.50.2" />
            <button className="btn btn-sm forti-btn" onClick={() => setLastAction('路由查詢已送出')}>查詢路由</button>
          </div>
          <table className="forti-table forti-selectable-table"><thead><tr><th>Destination</th><th>Gateway</th><th>Interface</th><th>Distance</th><th>Priority</th><th>狀態</th></tr></thead><tbody>
            {routes.map((route) => <tr key={route.id} className={route.id === selectedRouteId ? 'is-selected' : ''} onClick={() => setSelectedRouteId(route.id)}><td>{route.destination}</td><td>{route.gateway}</td><td>{route.interfaceName}</td><td>{route.distance}</td><td>{route.priority}</td><td><span className={route.enabled ? 'forti-pill success' : 'forti-pill muted'}>{route.enabled ? 'Active' : 'Inactive'}</span></td></tr>)}
          </tbody></table>
        </div>
      )
    }
    if (activePage === 'monitorVpn') {
      return (
        <div className="forti-table-page forti-monitor-vpn">
          <div className="forti-section-title">VPN 監測</div>
          <div className="forti-vpn-monitor-map">
            {ipsecTunnels.map((tunnel) => (
              <button key={tunnel.id} type="button" className={tunnel.id === selectedIpsecTunnelId ? 'is-selected' : ''} onClick={() => setSelectedIpsecTunnelId(tunnel.id)}>
                <i className="bx bx-lock-open-alt"></i><strong>{tunnel.name}</strong><span>{tunnel.remoteGateway}</span><b className={tunnel.status === 'Up' ? 'is-up' : ''}>{tunnel.status}</b>
              </button>
            ))}
          </div>
          <table className="forti-table forti-selectable-table"><thead><tr><th>VPN</th><th>Remote Gateway</th><th>Local Subnet</th><th>Remote Subnet</th><th>Phase</th><th>狀態</th></tr></thead><tbody>
            {ipsecTunnels.map((tunnel) => <tr key={tunnel.id} className={tunnel.id === selectedIpsecTunnelId ? 'is-selected' : ''} onClick={() => setSelectedIpsecTunnelId(tunnel.id)}><td>{tunnel.name}</td><td>{tunnel.remoteGateway}</td><td>{tunnel.localSubnet}</td><td>{tunnel.remoteSubnet}</td><td>{tunnel.phase}</td><td><span className={tunnel.status === 'Up' ? 'forti-pill success' : 'forti-pill muted'}>{tunnel.status}</span></td></tr>)}
          </tbody></table>
        </div>
      )
    }
    return (
      <div className="forti-table-page forti-monitor-session">
        <div className="forti-section-title">Session Monitor</div>
        <div className="forti-session-dashboard">
          <section><strong>423</strong><span>Current Sessions</span></section>
          <section><strong>52.7%</strong><span>SPU Usage</span></section>
          <section><strong>18</strong><span>NAT Sessions</span></section>
          <section><strong>0</strong><span>Dropped</span></section>
        </div>
        <div className="forti-toolbar">
          <input className="form-control form-control-sm" placeholder="Filter: source, destination, service" />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setLastAction('Session filter 已套用')}>套用過濾</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => setLastAction('選取 session 已清除')}>清除 Session</button>
        </div>
        <table className="forti-table"><thead><tr><th>Source</th><th>Destination</th><th>Service</th><th>Policy</th><th>NAT</th><th>Bytes</th></tr></thead><tbody>
          <tr><td>10.20.40.113:54822</td><td>10.20.50.2:22</td><td>SSH</td><td>SSLVPN_to_LAN</td><td>No</td><td>48.2 KB</td></tr>
          <tr><td>10.20.40.118:62421</td><td>8.8.8.8:53</td><td>DNS</td><td>LAN_to_WAN</td><td>Yes</td><td>8.7 KB</td></tr>
          <tr><td>10.20.40.113:53018</td><td>docs.fortinet.com:443</td><td>HTTPS</td><td>LAN_to_WAN</td><td>Yes</td><td>689.1 KB</td></tr>
        </tbody></table>
      </div>
    )
  }

  function renderGenericTable(activePage: FortiPage, title: string) {
    return renderManagedTable(activePage, title)
  }

  function renderSystemSettings() {
    const setting = getGenericSetting('systemSettings')
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">設定</div>
        <div className="forti-profile-summary">
          <section><strong>系統全域設定</strong><span>調整主機名稱、管理連接埠、登入安全與系統時間。</span></section>
          <section><strong>目前狀態</strong><span>管理服務啟用，HTTPS 與管理操作日誌由下方安全選項控制。</span></section>
        </div>
        <div className="forti-form-section">
          <label>設定類型</label>
          <select className="form-select form-select-sm" value={systemSettingType} onChange={(event) => setSystemSettingType(event.target.value)}>
            <option>系統全域設定</option>
            <option>管理介面設定</option>
            <option>登入安全設定</option>
            <option>系統時間設定</option>
          </select>
          <label>主機名稱</label><input className="form-control form-control-sm" defaultValue="FGT90D3Z16007115" />
          <label>管理 HTTPS Port</label><input className="form-control form-control-sm" defaultValue="443" />
          <label>管理 SSH Port</label><input className="form-control form-control-sm" defaultValue="22" />
          <label>管理閒置逾時</label><input className="form-control form-control-sm" defaultValue="480 分鐘" />
          <label>系統時區</label><select className="form-select form-select-sm" defaultValue="Asia/Taipei"><option>Asia/Taipei</option><option>UTC</option></select>
          <label>安全選項</label>
          <div className="forti-check-row">
            <label><input type="checkbox" checked={setting.strictHttps} onChange={() => updateGenericSetting('systemSettings', { strictHttps: !setting.strictHttps })} /> 強制 HTTPS 管理</label>
            <label><input type="checkbox" checked={setting.logAdmin} onChange={() => updateGenericSetting('systemSettings', { logAdmin: !setting.logAdmin })} /> 記錄管理操作</label>
          </div>
        </div>
      </div>
    )
  }

  function renderGenericSettings(activePage: FortiPage, title: string) {
    const setting = getGenericSetting(activePage)
    return (
      <div className="forti-form-page">
        <div className="forti-section-title">{title}</div>
        <div className="forti-form-section">
          <label>狀態</label><FortiSwitch checked={setting.enabled} onChange={() => updateGenericSetting(activePage, { enabled: !setting.enabled })} label={setting.enabled ? '啟用' : '停用'} />
          <label>名稱</label><input className="form-control form-control-sm" value={title} readOnly />
          <label>模式</label><div className="forti-segments">{(['啟用', '停用'] as const).map((mode) => <button key={mode} className={setting.mode === mode ? 'active' : ''} onClick={() => updateGenericSetting(activePage, { mode, enabled: mode === '啟用' })}>{mode}</button>)}</div>
          <label>安全選項</label>
          <div className="forti-check-row">
            <label><input type="checkbox" checked={setting.strictHttps} onChange={() => updateGenericSetting(activePage, { strictHttps: !setting.strictHttps })} /> 強制 HTTPS</label>
            <label><input type="checkbox" checked={setting.logAdmin} onChange={() => updateGenericSetting(activePage, { logAdmin: !setting.logAdmin })} /> 記錄管理操作</label>
          </div>
          <label>備註</label><input className="form-control form-control-sm" defaultValue="FortiGate 90D 風格設定項目" />
        </div>
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
    if (page === 'addresses') return renderAddresses()
    if (page === 'schedules') return renderSchedules()
    if (page === 'antivirus') return renderAntivirus()
    if (page === 'inspectionMode') return renderFeatureVisibility()
    if (page === 'webFilter') return renderWebFilter()
    if (page === 'dnsFilter') return renderDnsFilter()
    if (page === 'sslVpnSettings') return renderSslVpn()
    if (page === 'sslVpnPortal') return renderSslVpnPortal()
    if (page === 'featureVisibility') return renderTags()
    if (['appControl', 'ips', 'forticlientCompliance', 'sslInspection', 'ratingOverrides', 'customSignatures'].includes(page)) return renderSecurityProfile(page, getPageLabel(page))
    if (page === 'vpnOverlay') return renderVpnOverlay()
    if (page === 'ipsecTunnels') return renderIpsecTunnels()
    if (page === 'ipsecWizard') return renderIpsecWizard()
    if (page === 'ipsecTemplates') return renderIpsecTemplates()
    if (['userDefinition', 'userGroups', 'guestManagement', 'deviceInventory', 'deviceGroups', 'ldap', 'radius', 'authSettings', 'fortitoken'].includes(page)) return renderUsersDevicesPage(page)
    if (page === 'ha') return renderHa()
    if (page === 'snmp') return renderSnmp()
    if (page === 'replacementMessages') return renderReplacementMessages()
    if (page === 'fortiguard') return renderFortiGuard()
    if (page === 'advancedSettings') return renderAdvancedSettings()
    if (page === 'systemSettings') return renderSystemSettings()
    if (page.startsWith('logs')) return renderLogs(page)
    if (page.startsWith('monitor')) return renderMonitor(page)
    if (['wifiController', 'wifiSsids', 'wifiApProfiles', 'wifiFortiSwitches', 'wifiSwitchPorts', 'wifiSwitchVlans', 'wifiSwitchTopology'].includes(page)) return renderWifiSwitchPage(page)
    if ([
      'sdwan',
      'sdwanSla',
      'sdwanRules',
      'systemAdmins',
      'adminProfiles',
      'certificates',
      'services',
    ].includes(page)) return renderGenericTable(page, getPageLabel(page))
    return renderGenericSettings(page, getPageLabel(page))
  }

  const activePageLabel = getPageLabel(page)

  return (
    <div id="fortigateView" style={{ display: 'none' }}>
      <div className="forti-shell">
        <div className="forti-topbar">
          <div className="forti-brand"><span className="forti-logo">▦</span><strong>FortiGate 90D</strong><span>FGT90D3Z16007115</span></div>
          <div className="forti-top-actions" aria-label="FortiGate 工具列">
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
                <strong className="forti-badge">{fortiNotifications.length}</strong>
              </button>
              {noticeMenuOpen && (
                <div className="forti-top-dropdown forti-notice-dropdown">
                  <div className="forti-dropdown-title">資訊通知</div>
                  {fortiNotifications.map((notification) => (
                    <button key={notification.id} type="button" className="forti-notice-item" onClick={() => openFortiNotification(notification)}>
                      <i className={notification.icon}></i>
                      <span>{notification.title}</span>
                      <small>{notification.source} · 前往 {getPageLabel(notification.targetPage)}</small>
                      <em>{notification.detail}</em>
                    </button>
                  ))}
                  <button type="button" className="forti-dropdown-footer" onClick={() => openFortiNotification({ id: 'all-notices', title: '檢視所有通知', source: '系統事件', detail: '開啟系統事件頁面，集中檢視管理登入、設定異動與系統層級通知。', targetPage: 'logsSystem', icon: 'bx bx-list-ul' })}>檢視所有通知</button>
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
            {visibleFortiGroups.map((section) => {
              const expanded = !!section.children?.length && (openMenus.includes(section.id) || !!sideSearch.trim())
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
            {!visibleFortiGroups.length && <div className="forti-menu-empty">沒有符合的選單</div>}
            <div className={`forti-search ${sideSearchOpen ? 'is-open' : ''}`}>
              {sideSearchOpen ? (
                <>
                  <i className="bx bx-search"></i>
                  <input
                    autoFocus
                    value={sideSearch}
                    placeholder="搜尋選單"
                    onChange={(event) => setSideSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setSideSearch('')
                        setSideSearchOpen(false)
                      }
                    }}
                  />
                  <button type="button" onClick={() => { setSideSearch(''); setSideSearchOpen(false) }} aria-label="關閉搜尋"><i className="bx bx-x"></i></button>
                </>
              ) : (
                <button type="button" onClick={() => setSideSearchOpen(true)} aria-label="搜尋 FortiGate 選單"><i className="bx bx-search"></i></button>
              )}
            </div>
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
