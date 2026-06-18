use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;
use std::path::Path;
use tokio::process::Command;

#[derive(Clone, Serialize, Deserialize)]
pub struct NginxSettings {
    pub nginx_bin: String,
    pub config_dir: String,
    pub sites_enabled_dir: String,
    pub modules_enabled_dir: String,
    pub conf_d_dir: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct NginxSite {
    pub id: i64,
    pub site_name: String,
    pub server_name: String,
    pub listen_port: u16,
    pub enabled: bool,
    pub document_root: String,
    pub config_content: Option<String>,
    pub site_type: String,
    pub reverse_proxy_pass: Option<String>,
    pub updated_at: String,
}

#[derive(Clone, Deserialize)]
pub struct NginxSiteUpdate {
    pub site_name: String,
    pub server_name: Option<String>,
    pub listen_port: Option<u16>,
    pub enabled: Option<bool>,
    pub document_root: Option<String>,
    pub config_content: Option<String>,
    pub site_type: Option<String>,
    pub reverse_proxy_pass: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct NginxModule {
    pub id: i64,
    pub module_name: String,
    pub enabled: bool,
    pub updated_at: String,
}

#[derive(Clone, Serialize)]
pub struct NginxConfigPreview {
    pub config: String,
    pub sites_count: usize,
    pub modules_count: usize,
}

impl NginxSettings {
    pub fn default() -> Self {
        Self {
            nginx_bin: "nginx".to_string(),
            config_dir: "/etc/nginx".to_string(),
            sites_enabled_dir: "/etc/nginx/sites-enabled".to_string(),
            modules_enabled_dir: "/etc/nginx/modules-enabled".to_string(),
            conf_d_dir: "/etc/nginx/conf.d".to_string(),
        }
    }
}

pub struct NginxClient {
    settings: NginxSettings,
}

impl NginxClient {
    pub fn new(settings: NginxSettings) -> Self {
        Self { settings }
    }

    pub fn settings(&self) -> &NginxSettings {
        &self.settings
    }

    pub fn update_settings(&mut self, s: NginxSettings) {
        self.settings = s;
    }

    pub fn site_path(&self, name: &str) -> String {
        format!("{}/{}", self.settings.sites_enabled_dir, name)
    }

    pub fn module_link_path(&self, name: &str) -> String {
        format!("{}/{}.load", self.settings.modules_enabled_dir, name)
    }

    pub fn generate_site_config(&self, site: &NginxSite) -> String {
        match site.site_type.as_str() {
            "reverse_proxy" => {
                let pass = site
                    .reverse_proxy_pass
                    .as_deref()
                    .unwrap_or("http://127.0.0.1:3000");
                format!(
                    "server {{\n    listen {};\n    server_name {};\n\n    location / {{\n        proxy_pass {};\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }}\n}}\n",
                    site.listen_port, site.server_name, pass
                )
            }
            _ => {
                let root = &site.document_root;
                format!(
                    "server {{\n    listen {};\n    server_name {};\n\n    root {};\n    index index.html index.htm index.nginx-debian.html;\n\n    location / {{\n        try_files $uri $uri/ =404;\n    }}\n}}\n",
                    site.listen_port, site.server_name, root
                )
            }
        }
    }

    pub async fn test_config(&self) -> Result<String, String> {
        let output = Command::new(&self.settings.nginx_bin)
            .arg("-t")
            .output()
            .await
            .map_err(|e| format!("failed to run nginx -t: {e}"))?;
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let combined = if stdout.is_empty() { stderr } else { stdout };
        if output.status.success() {
            Ok(combined)
        } else {
            Err(combined)
        }
    }

    pub async fn reload(&self) -> Result<String, String> {
        self.run_service_command(&["reload", "nginx"], &["-s", "reload"], "reload")
            .await
    }

    async fn run_service_command(
        &self,
        systemctl_args: &[&str],
        nginx_args: &[&str],
        action: &str,
    ) -> Result<String, String> {
        let systemctl = Command::new("systemctl")
            .args(systemctl_args)
            .output()
            .await;
        if let Ok(output) = systemctl {
            if output.status.success() {
                return Ok(Self::command_output(output.stdout, output.stderr, action));
            }
            let systemctl_output = Self::command_output(output.stdout, output.stderr, action);
            let nginx = Command::new(&self.settings.nginx_bin)
                .args(nginx_args)
                .output()
                .await
                .map_err(|e| {
                    format!(
                        "failed to {action} nginx with systemctl and fallback command: {systemctl_output}\nfallback error: {e}"
                    )
                })?;
            if nginx.status.success() {
                return Ok(Self::command_output(nginx.stdout, nginx.stderr, action));
            }
            let nginx_output = Self::command_output(nginx.stdout, nginx.stderr, action);
            return Err(format!(
                "failed to {action} nginx\nsystemctl output:\n{systemctl_output}\nfallback output:\n{nginx_output}"
            ));
        }

        let nginx = Command::new(&self.settings.nginx_bin)
            .args(nginx_args)
            .output()
            .await
            .map_err(|e| format!("failed to {action} nginx: {e}"))?;
        if nginx.status.success() {
            Ok(Self::command_output(nginx.stdout, nginx.stderr, action))
        } else {
            Err(Self::command_output(nginx.stdout, nginx.stderr, action))
        }
    }

    fn command_output(stdout: Vec<u8>, stderr: Vec<u8>, action: &str) -> String {
        let stdout = String::from_utf8_lossy(&stdout).trim().to_string();
        let stderr = String::from_utf8_lossy(&stderr).trim().to_string();
        match (stdout.is_empty(), stderr.is_empty()) {
            (true, true) => format!("nginx {action} command completed"),
            (false, true) => stdout,
            (true, false) => stderr,
            (false, false) => format!("{stdout}\n{stderr}"),
        }
    }

    pub async fn start(&self) -> Result<String, String> {
        self.run_service_command(&["start", "nginx"], &[], "start")
            .await
    }

    pub async fn stop(&self) -> Result<String, String> {
        self.run_service_command(&["stop", "nginx"], &["-s", "stop"], "stop")
            .await
    }

    pub async fn restart(&self) -> Result<String, String> {
        let systemctl = Command::new("systemctl")
            .args(["restart", "nginx"])
            .output()
            .await;
        if let Ok(output) = systemctl {
            if output.status.success() {
                return Ok(Self::command_output(
                    output.stdout,
                    output.stderr,
                    "restart",
                ));
            }
            let systemctl_output = Self::command_output(output.stdout, output.stderr, "restart");
            let reload = Command::new(&self.settings.nginx_bin)
                .args(["-s", "reload"])
                .output()
                .await
                .map_err(|e| {
                    format!(
                        "failed to restart nginx with systemctl and fallback reload: {systemctl_output}\nfallback error: {e}"
                    )
                })?;
            if reload.status.success() {
                return Ok(Self::command_output(
                    reload.stdout,
                    reload.stderr,
                    "restart",
                ));
            }
            let reload_output = Self::command_output(reload.stdout, reload.stderr, "restart");
            let start = Command::new(&self.settings.nginx_bin)
                .output()
                .await
                .map_err(|e| {
                    format!(
                        "failed to restart nginx\nsystemctl output:\n{systemctl_output}\nreload output:\n{reload_output}\nstart fallback error: {e}"
                    )
                })?;
            if start.status.success() {
                return Ok(Self::command_output(start.stdout, start.stderr, "restart"));
            }
            let start_output = Self::command_output(start.stdout, start.stderr, "restart");
            return Err(format!(
                "failed to restart nginx\nsystemctl output:\n{systemctl_output}\nreload output:\n{reload_output}\nstart output:\n{start_output}"
            ));
        }

        let reload = Command::new(&self.settings.nginx_bin)
            .args(["-s", "reload"])
            .output()
            .await
            .map_err(|e| format!("failed to restart nginx: {e}"))?;
        if reload.status.success() {
            return Ok(Self::command_output(
                reload.stdout,
                reload.stderr,
                "restart",
            ));
        }
        let reload_output = Self::command_output(reload.stdout, reload.stderr, "restart");
        let start = Command::new(&self.settings.nginx_bin)
            .output()
            .await
            .map_err(|e| {
                format!("failed to restart nginx\nreload output:\n{reload_output}\nstart fallback error: {e}")
            })?;
        if start.status.success() {
            Ok(Self::command_output(start.stdout, start.stderr, "restart"))
        } else {
            Err(format!(
                "failed to restart nginx\nreload output:\n{reload_output}\nstart output:\n{}",
                Self::command_output(start.stdout, start.stderr, "restart")
            ))
        }
    }

    pub fn scan_modules(&self) -> Result<Vec<String>, String> {
        let dir = Path::new(&self.settings.modules_enabled_dir);
        if !dir.exists() {
            return Ok(Vec::new());
        }
        let mut modules = BTreeSet::new();
        for entry in std::fs::read_dir(dir).map_err(|e| format!("read modules dir failed: {e}"))? {
            let entry = entry.map_err(|e| format!("read modules entry failed: {e}"))?;
            let path = entry.path();
            let ext = path
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or_default();
            if ext == "load" {
                if let Some(name) = Self::module_name_from_path(&path) {
                    modules.insert(name);
                }
            } else if ext == "conf" {
                let mut found_in_file = false;
                if let Ok(content) = std::fs::read_to_string(&path) {
                    for line in content.lines() {
                        if let Some(name) = Self::module_name_from_load_module_line(line) {
                            modules.insert(name);
                            found_in_file = true;
                        }
                    }
                }
                if !found_in_file {
                    if let Some(name) = Self::module_name_from_path(&path) {
                        modules.insert(name);
                    }
                }
            }
        }
        Ok(modules.into_iter().collect())
    }

    fn module_name_from_path(path: &Path) -> Option<String> {
        let stem = path.file_stem()?.to_str()?;
        let name = stem
            .trim_start_matches(|c: char| c.is_ascii_digit() || c == '-')
            .trim_start_matches("mod-")
            .to_string();
        if name.is_empty() {
            None
        } else {
            Some(name)
        }
    }

    fn module_name_from_load_module_line(line: &str) -> Option<String> {
        let line = line.trim();
        if line.starts_with('#') || !line.starts_with("load_module") {
            return None;
        }
        let module_path = line
            .trim_start_matches("load_module")
            .trim()
            .trim_end_matches(';')
            .trim()
            .trim_matches('"')
            .trim_matches('\'');
        let path = Path::new(module_path);
        let stem = path.file_stem()?.to_str()?;
        Some(stem.to_string())
    }

    pub fn scan_sites(&self) -> Result<Vec<String>, String> {
        let dir = Path::new(&self.settings.sites_enabled_dir);
        if !dir.exists() {
            return Ok(Vec::new());
        }
        let mut sites = Vec::new();
        for entry in std::fs::read_dir(dir).map_err(|e| format!("read sites dir failed: {e}"))? {
            let entry = entry.map_err(|e| format!("read sites entry failed: {e}"))?;
            let path = entry.path();
            if path.is_file() || path.is_symlink() {
                if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                    sites.push(name.to_string());
                }
            }
        }
        sites.sort();
        Ok(sites)
    }

    pub fn write_site_file(&self, name: &str, content: &str) -> Result<(), String> {
        let path = self.site_path(name);
        std::fs::write(&path, content).map_err(|e| format!("write site file {path} failed: {e}"))
    }

    pub fn remove_site_file(&self, name: &str) -> Result<(), String> {
        let path = self.site_path(name);
        if Path::new(&path).exists() {
            std::fs::remove_file(&path).map_err(|e| format!("remove site file {path} failed: {e}"))
        } else {
            Ok(())
        }
    }

    pub fn enable_module(&self, name: &str) -> Result<(), String> {
        let path = self.module_link_path(name);
        std::fs::write(&path, format!("# {name} module enabled by Firewall-Man\n"))
            .map_err(|e| format!("enable module {path} failed: {e}"))
    }

    pub fn disable_module(&self, name: &str) -> Result<(), String> {
        let path = self.module_link_path(name);
        if Path::new(&path).exists() {
            std::fs::remove_file(&path).map_err(|e| format!("disable module {path} failed: {e}"))
        } else {
            Ok(())
        }
    }

    pub fn build_full_config(
        &self,
        sites: &[NginxSite],
        module_names: &[String],
    ) -> NginxConfigPreview {
        let mut config = String::new();
        config.push_str("# Nginx Configuration\n");
        config.push_str("# Generated by Firewall-Man\n\n");

        if !module_names.is_empty() {
            config.push_str("# Load modules\n");
            for name in module_names {
                config.push_str(&format!("load_module modules/{}.so;\n", name));
            }
            config.push('\n');
        }

        config.push_str("events {\n    worker_connections 1024;\n}\n\nhttp {\n");
        config.push_str(
            "    include       mime.types;\n    default_type  application/octet-stream;\n",
        );
        config.push_str("    sendfile        on;\n    keepalive_timeout  65;\n\n");

        for site in sites {
            if !site.enabled {
                continue;
            }
            let site_config = match &site.config_content {
                Some(c) if !c.trim().is_empty() => c.clone(),
                _ => self.generate_site_config(site),
            };
            for line in site_config.lines() {
                config.push_str(&format!("    {}\n", line));
            }
            config.push('\n');
        }

        config.push_str("}\n");
        NginxConfigPreview {
            config,
            sites_count: sites.len(),
            modules_count: module_names.len(),
        }
    }
}
