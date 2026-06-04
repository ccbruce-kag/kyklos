use crate::juniper::JuniperConfig;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use std::path::PathBuf;

const DEFAULT_DEVICE_ID: i64 = 1;

#[derive(Clone)]
pub struct AppDb {
    path: PathBuf,
}

#[derive(Clone, Serialize)]
pub struct JuniperDeviceSettings {
    pub id: i64,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub has_password: bool,
    pub connect_timeout_secs: u64,
    pub strict_host_key_checking: bool,
    #[serde(skip_serializing)]
    pub password: Option<String>,
}

#[derive(Clone)]
pub struct JuniperDeviceUpdate {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: Option<String>,
    pub clear_password: bool,
    pub connect_timeout_secs: u64,
    pub strict_host_key_checking: bool,
}

impl AppDb {
    pub fn from_env() -> Result<Self, String> {
        let path = std::env::var("FWM_DB_PATH")
            .ok()
            .filter(|v| !v.trim().is_empty())
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from("firewall-man.sqlite3"));
        let db = Self { path };
        db.init()?;
        Ok(db)
    }

    pub fn juniper_config(&self) -> Result<JuniperConfig, String> {
        let settings = self.juniper_settings()?;
        Ok(JuniperConfig {
            host: settings.host,
            port: settings.port,
            username: settings.username,
            password: settings.password,
            connect_timeout_secs: settings.connect_timeout_secs,
            strict_host_key_checking: settings.strict_host_key_checking,
        })
    }

    pub fn juniper_settings(&self) -> Result<JuniperDeviceSettings, String> {
        self.ensure_seeded()?;
        let conn = self.connect()?;
        conn.query_row(
            "SELECT id, name, host, port, username, password, connect_timeout_secs, strict_host_key_checking
             FROM juniper_devices WHERE id = ?1",
            params![DEFAULT_DEVICE_ID],
            |row| {
                let password: Option<String> = row.get(5)?;
                Ok(JuniperDeviceSettings {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    host: row.get(2)?,
                    port: row.get::<_, i64>(3)? as u16,
                    username: row.get(4)?,
                    has_password: password.as_ref().map(|s| !s.is_empty()).unwrap_or(false),
                    password,
                    connect_timeout_secs: row.get::<_, i64>(6)? as u64,
                    strict_host_key_checking: row.get::<_, i64>(7)? != 0,
                })
            },
        )
        .map_err(|e| format!("load Juniper device settings failed: {e}"))
    }

    pub fn save_juniper_settings(
        &self,
        update: JuniperDeviceUpdate,
    ) -> Result<JuniperDeviceSettings, String> {
        validate_device_update(&update)?;
        self.ensure_seeded()?;

        let conn = self.connect()?;
        if update.clear_password || update.password.is_some() {
            conn.execute(
                "UPDATE juniper_devices
                 SET name = ?1, host = ?2, port = ?3, username = ?4, password = ?5,
                     connect_timeout_secs = ?6, strict_host_key_checking = ?7,
                     updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
                 WHERE id = ?8",
                params![
                    update.name,
                    update.host,
                    i64::from(update.port),
                    update.username,
                    update.password,
                    update.connect_timeout_secs as i64,
                    if update.strict_host_key_checking {
                        1
                    } else {
                        0
                    },
                    DEFAULT_DEVICE_ID
                ],
            )
        } else {
            conn.execute(
                "UPDATE juniper_devices
                 SET name = ?1, host = ?2, port = ?3, username = ?4,
                     connect_timeout_secs = ?5, strict_host_key_checking = ?6,
                     updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
                 WHERE id = ?7",
                params![
                    update.name,
                    update.host,
                    i64::from(update.port),
                    update.username,
                    update.connect_timeout_secs as i64,
                    if update.strict_host_key_checking {
                        1
                    } else {
                        0
                    },
                    DEFAULT_DEVICE_ID
                ],
            )
        }
        .map_err(|e| format!("save Juniper device settings failed: {e}"))?;

        self.juniper_settings()
    }

    fn init(&self) -> Result<(), String> {
        if let Some(parent) = self.path.parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| format!("create database directory failed: {e}"))?;
            }
        }
        let conn = self.connect()?;
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS juniper_devices (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL DEFAULT 'default',
                host TEXT NOT NULL,
                port INTEGER NOT NULL DEFAULT 22,
                username TEXT NOT NULL,
                password TEXT NULL,
                connect_timeout_secs INTEGER NOT NULL DEFAULT 10,
                strict_host_key_checking INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            );",
        )
        .map_err(|e| format!("initialize database schema failed: {e}"))?;
        self.ensure_seeded()
    }

    fn ensure_seeded(&self) -> Result<(), String> {
        let conn = self.connect()?;
        let exists: Option<i64> = conn
            .query_row(
                "SELECT id FROM juniper_devices WHERE id = ?1",
                params![DEFAULT_DEVICE_ID],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("check Juniper device seed failed: {e}"))?;
        if exists.is_some() {
            return Ok(());
        }

        let config = JuniperConfig::from_env();
        conn.execute(
            "INSERT INTO juniper_devices
             (id, name, host, port, username, password, connect_timeout_secs, strict_host_key_checking)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                DEFAULT_DEVICE_ID,
                "default",
                config.host,
                i64::from(config.port),
                config.username,
                config.password,
                config.connect_timeout_secs as i64,
                if config.strict_host_key_checking { 1 } else { 0 }
            ],
        )
        .map_err(|e| format!("seed Juniper device settings failed: {e}"))?;
        Ok(())
    }

    fn connect(&self) -> Result<Connection, String> {
        Connection::open(&self.path).map_err(|e| format!("open database failed: {e}"))
    }
}

fn validate_device_update(update: &JuniperDeviceUpdate) -> Result<(), String> {
    if update.name.trim().is_empty() || update.name.len() > 64 {
        return Err("invalid device name".to_string());
    }
    if update.host.trim().is_empty() || update.host.len() > 255 {
        return Err("invalid Juniper host".to_string());
    }
    if update.port == 0 {
        return Err("invalid Juniper SSH port".to_string());
    }
    if update.username.trim().is_empty() || update.username.len() > 64 {
        return Err("invalid Juniper username".to_string());
    }
    if update.connect_timeout_secs == 0 || update.connect_timeout_secs > 120 {
        return Err("invalid Juniper connection timeout".to_string());
    }
    Ok(())
}
