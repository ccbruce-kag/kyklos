import { useEffect, useMemo, useState } from 'react'

type AuthProfile = {
  username: string
  display_name?: string | null
  role_codes?: string[]
}

type NotificationItem = {
  id: number
  category: string
  title: string
  message: string
  severity: string
  acknowledged: boolean
  created_at: string
  target_view?: string
}

type NavbarProps = {
  authProfile?: AuthProfile | null
}

const HIDDEN_NOTIFICATION_IDS_KEY = 'kyklos_hidden_notification_ids'
const TAB_STORAGE_KEY = 'fwm_tabs'
const FORCE_DEFAULT_TAB_KEY = 'kyklos_force_default_tab'

function isAdminUser(authProfile?: AuthProfile | null): boolean {
  return Boolean(authProfile?.role_codes?.includes('admin'))
}

function loadHiddenNotificationIds(): Set<number> {
  try {
    const raw = window.localStorage.getItem(HIDDEN_NOTIFICATION_IDS_KEY)
    const ids = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(ids) ? ids.map((id) => Number(id)).filter(Number.isFinite) : [])
  } catch {
    return new Set()
  }
}

function saveHiddenNotificationIds(ids: Set<number>) {
  window.localStorage.setItem(HIDDEN_NOTIFICATION_IDS_KEY, JSON.stringify([...ids].slice(-500)))
}

async function loadNotifications(): Promise<NotificationItem[]> {
  const res = await fetch('/notifications?limit=8', { credentials: 'same-origin', cache: 'no-store' })
  const json = await res.json()
  if (!res.ok || json.code !== 0) throw new Error(json.msg || `HTTP ${res.status}`)
  const hiddenIds = loadHiddenNotificationIds()
  return (json.data || []).filter((item: NotificationItem) => !hiddenIds.has(item.id))
}

async function logoutAndSwitchUser() {
  try {
    window.localStorage.removeItem(TAB_STORAGE_KEY)
    window.sessionStorage.setItem(FORCE_DEFAULT_TAB_KEY, '1')
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
    })
  } catch (error) {
    console.warn('[auth] logout request failed:', error)
  } finally {
    window.location.reload()
  }
}

async function postNotificationAction(path: string) {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
  })
  const json = await res.json().catch(() => ({ code: res.ok ? 0 : res.status, msg: res.statusText }))
  if (!res.ok || json.code !== 0) throw new Error(json.msg || `HTTP ${res.status}`)
  return json.data || {}
}

function navigateNotificationTarget(item: NotificationItem) {
  const target = item.target_view || (item.category === 'blocked_ip' ? 'securityWhitelist' : item.category === 'backup_overdue' ? 'backup' : 'notificationSettings')
  const linkId = target === 'securityWhitelist'
    ? 'menuSecurityWhitelistLink'
    : target === 'backup'
      ? 'menuBackupDataLink'
      : 'menuNotificationSettingsLink'
  document.getElementById(linkId)?.click()
}

export default function Navbar({ authProfile }: NavbarProps) {
  const displayName = authProfile?.display_name || authProfile?.username || 'User'
  const canSwitchUser = isAdminUser(authProfile)
  const isLoggedIn = Boolean(authProfile?.username)
  const canUseNotifications = isLoggedIn && canSwitchUser
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const unreadCount = useMemo(() => notifications.filter((item) => !item.acknowledged).length, [notifications])

  useEffect(() => {
    if (!canUseNotifications) return
    let alive = true
    const refresh = async () => {
      try {
        const items = await loadNotifications()
        if (alive) setNotifications(items)
      } catch (error) {
        console.warn('[notifications] load failed:', error)
      }
    }
    refresh()
    const timer = window.setInterval(refresh, 60000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [canUseNotifications])

  const acknowledge = async (id: number) => {
    try {
      await fetch(`/notifications/${id}/ack`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, acknowledged: true } : item))
    } catch (error) {
      console.warn('[notifications] ack failed:', error)
    }
  }

  const openNotification = async (item: NotificationItem) => {
    await acknowledge(item.id)
    navigateNotificationTarget(item)
  }

  const markAllNotificationsRead = async () => {
    try {
      await postNotificationAction('/notifications/ack-all')
      setNotifications((items) => items.map((item) => ({ ...item, acknowledged: true })))
    } catch (error) {
      console.warn('[notifications] ack all failed:', error)
    }
  }

  const clearNotificationList = async () => {
    if (!confirm('確定清除訊息通知列表？')) return
    try {
      await postNotificationAction('/notifications/ack-all')
    } catch (error) {
      console.warn('[notifications] ack before clear failed:', error)
    }
    const hiddenIds = loadHiddenNotificationIds()
    notifications.forEach((item) => hiddenIds.add(item.id))
    saveHiddenNotificationIds(hiddenIds)
    setNotifications([])
  }

  return (
    <nav className="layout-navbar container-xxl navbar-detached navbar navbar-expand-xl align-items-center bg-navbar-theme" id="layout-navbar">
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
        <a className="nav-item nav-link px-0 me-xl-6" href="javascript:void(0)">
          <i className="icon-base bx bx-menu icon-md"></i>
        </a>
      </div>
      <div className="navbar-nav-right d-flex align-items-center justify-content-end w-100" id="navbar-collapse">
        <div className="navbar-nav align-items-center me-auto">
          <div className="nav-item d-flex align-items-center">
            <span className="ipc-title fw-semibold fs-5">Network & Security Tools Console</span>
            <span className="ipc-version badge bg-label-info rounded-pill ms-2"></span>
          </div>
        </div>
        <ul className="navbar-nav flex-row align-items-center ms-md-auto">
          <li className="nav-item dropdown me-3">
            <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="docDropdown" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <i className="bx bx-book me-1"></i><span id="docDropdownLabel">Quick Help</span>
            </button>
            <div className="dropdown-menu dropdown-menu-end doc-dropdown-menu" id="docDropdownMenu" aria-labelledby="docDropdown"></div>
          </li>
          <li className="nav-item dropdown me-3">
            <button className="btn btn-sm btn-outline-primary dropdown-toggle" type="button" id="languageDropdown" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <i className="bx bx-globe me-1"></i><span id="languageDropdownLabel">English</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end" id="languageDropdownMenu" aria-labelledby="languageDropdown">
              <li><a className="dropdown-item" href="#" data-lang="zh">中文</a></li>
              <li><a className="dropdown-item" href="#" data-lang="en">English</a></li>
              <li><a className="dropdown-item" href="#" data-lang="ja">日本語</a></li>
            </ul>
          </li>
          {canUseNotifications && (
            <li className="nav-item dropdown me-3">
              <button className="btn btn-sm btn-outline-warning position-relative" type="button" id="notificationDropdown" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="bx bx-bell"></i>
                {unreadCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{unreadCount}</span>}
              </button>
              <div className="dropdown-menu dropdown-menu-end notification-dropdown" aria-labelledby="notificationDropdown">
                <div className="notification-dropdown-head">
                  <h6 className="dropdown-header">資訊通知</h6>
                  <span className="badge bg-label-warning">{unreadCount} 未讀</span>
                </div>
                <div className="notification-dropdown-actions">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={markAllNotificationsRead} disabled={notifications.length === 0 || unreadCount === 0}>
                    將全部通知設為已讀
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={clearNotificationList} disabled={notifications.length === 0}>
                    清除訊息列表
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <span className="dropdown-item-text text-muted small">目前沒有通知</span>
                ) : notifications.map((item) => (
                  <button type="button" className={`dropdown-item notification-dropdown-item ${item.acknowledged ? 'is-read' : 'is-unread'}`} key={item.id} onClick={() => openNotification(item)}>
                    <span className={`notification-dot is-${item.severity}`}></span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                    </span>
                  </button>
                ))}
              </div>
            </li>
          )}
          {isLoggedIn && (
            <li className="nav-item dropdown">
              <button className="btn btn-sm btn-outline-dark dropdown-toggle d-flex align-items-center gap-1" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i className="bx bx-user-circle"></i>
                <span>{displayName}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <h6 className="dropdown-header">登入使用者</h6>
                </li>
                <li>
                  <span className="dropdown-item-text small text-muted">{authProfile?.username}</span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button type="button" className="dropdown-item text-danger" onClick={logoutAndSwitchUser}>
                    <i className="bx bx-log-out me-2"></i>{canSwitchUser ? '登出 / 切換使用者' : '登出'}
                  </button>
                </li>
              </ul>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}
