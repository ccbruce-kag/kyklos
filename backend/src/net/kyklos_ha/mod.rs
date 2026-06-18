use crate::db::{AppDb, KyklosHaServiceSettings};
use crate::services::reverse_proxy::hyper_reverse_proxy;
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Client, Request, Response, Server, StatusCode};
use serde::Serialize;
use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::convert::Infallible;
use std::hash::{Hash, Hasher};
use std::net::{IpAddr, SocketAddr};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tokio::io;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use tracing::{error, info, warn};

#[derive(Clone, Serialize)]
pub struct KyklosHaRuntimeBackend {
    pub id: i64,
    pub name: String,
    pub address: String,
    pub active_connections: usize,
}

#[derive(Clone, Serialize)]
pub struct KyklosHaRuntimeService {
    pub id: i64,
    pub name: String,
    pub service_type: String,
    pub mode: String,
    pub listen: String,
    pub balance_method: String,
    pub backend_count: usize,
    pub active_connections: usize,
    pub backends: Vec<KyklosHaRuntimeBackend>,
}

#[derive(Clone, Serialize)]
pub struct KyklosHaStatus {
    pub running: bool,
    pub listener_count: usize,
    pub services: Vec<KyklosHaRuntimeService>,
}

#[derive(Clone)]
struct RuntimeBackend {
    id: i64,
    name: String,
    address: String,
    active: Arc<AtomicUsize>,
}

#[derive(Clone)]
struct RuntimeState {
    service_id: i64,
    name: String,
    service_type: String,
    mode: String,
    listen: String,
    balance_method: String,
    backends: Vec<RuntimeBackend>,
    rr: Arc<AtomicUsize>,
}

struct ListenerHandle {
    handle: JoinHandle<()>,
    runtime: Arc<RuntimeState>,
}

pub struct KyklosHaManager {
    db: AppDb,
    listeners: Mutex<HashMap<i64, ListenerHandle>>,
}

struct ActiveGuard {
    active: Arc<AtomicUsize>,
}

impl Drop for ActiveGuard {
    fn drop(&mut self) {
        self.active.fetch_sub(1, Ordering::SeqCst);
    }
}

impl KyklosHaManager {
    pub fn new(db: AppDb) -> Self {
        Self {
            db,
            listeners: Mutex::new(HashMap::new()),
        }
    }

    pub async fn sync_from_db(&self) -> Result<KyklosHaStatus, String> {
        let services = self.db.list_kyklos_ha_services()?;
        let enabled: HashMap<i64, KyklosHaServiceSettings> = services
            .into_iter()
            .filter(|service| service.enabled)
            .collect::<Vec<_>>()
            .into_iter()
            .filter(|service| service.servers.iter().any(|server| server.enabled))
            .map(|service| (service.id, service))
            .collect();

        let mut listeners = self.listeners.lock().await;
        let stale_ids: Vec<i64> = listeners
            .keys()
            .copied()
            .filter(|id| !enabled.contains_key(id))
            .collect();
        for id in stale_ids {
            if let Some(listener) = listeners.remove(&id) {
                listener.handle.abort();
                info!("Kyklos HA listener stopped: {}", id);
            }
        }

        let mut errors = Vec::new();
        for (id, service) in enabled {
            let needs_restart = listeners
                .get(&id)
                .map(|listener| listener.runtime.fingerprint() != service.fingerprint())
                .unwrap_or(true);
            if !needs_restart {
                continue;
            }
            if let Some(listener) = listeners.remove(&id) {
                listener.handle.abort();
            }
            match start_listener(service.clone()).await {
                Ok(listener) => {
                    info!(
                        "Kyklos HA listener started: {} {}",
                        service.name, service.listen_port
                    );
                    listeners.insert(id, listener);
                }
                Err(err) => {
                    errors.push(format!("{}: {}", service.name, err));
                }
            }
        }

        if errors.is_empty() {
            Ok(status_from_listeners(&listeners))
        } else {
            Err(errors.join("\n"))
        }
    }

    pub async fn stop_service(&self, id: i64) {
        let mut listeners = self.listeners.lock().await;
        if let Some(listener) = listeners.remove(&id) {
            listener.handle.abort();
            info!("Kyklos HA listener stopped: {}", id);
        }
    }

    pub async fn is_service_running(&self, id: i64) -> bool {
        let listeners = self.listeners.lock().await;
        listeners.contains_key(&id)
    }

    pub async fn status(&self) -> KyklosHaStatus {
        let listeners = self.listeners.lock().await;
        status_from_listeners(&listeners)
    }
}

impl RuntimeState {
    fn choose_backend(&self, client_ip: Option<IpAddr>) -> Option<RuntimeBackend> {
        if self.backends.is_empty() {
            return None;
        }
        let idx = match self.balance_method.as_str() {
            "source" => {
                let mut hasher = DefaultHasher::new();
                client_ip
                    .map(|ip| ip.to_string())
                    .unwrap_or_default()
                    .hash(&mut hasher);
                hasher.finish() as usize % self.backends.len()
            }
            "leastconn" => self
                .backends
                .iter()
                .enumerate()
                .min_by_key(|(_, backend)| backend.active.load(Ordering::SeqCst))
                .map(|(idx, _)| idx)
                .unwrap_or(0),
            _ => self.rr.fetch_add(1, Ordering::SeqCst) % self.backends.len(),
        };
        self.backends.get(idx).cloned()
    }

    fn fingerprint(&self) -> String {
        let backends = self
            .backends
            .iter()
            .map(|backend| format!("{}:{}:{}", backend.id, backend.name, backend.address))
            .collect::<Vec<_>>()
            .join(",");
        format!(
            "{}:{}:{}:{}:{}:{}",
            self.service_id,
            self.service_type,
            self.mode,
            self.listen,
            self.balance_method,
            backends
        )
    }
}

impl KyklosHaServiceSettings {
    fn fingerprint(&self) -> String {
        let backends = self
            .servers
            .iter()
            .filter(|server| server.enabled)
            .map(|server| {
                format!(
                    "{}:{}:{}:{}",
                    server.id, server.name, server.ip, server.port
                )
            })
            .collect::<Vec<_>>()
            .join(",");
        format!(
            "{}:{}:{}:{}:{}:{}:{}",
            self.id,
            self.service_type,
            self.mode,
            self.bind_addr,
            self.listen_port,
            self.balance_method,
            backends
        )
    }
}

async fn start_listener(service: KyklosHaServiceSettings) -> Result<ListenerHandle, String> {
    let addr: SocketAddr = format!("{}:{}", service.bind_addr, service.listen_port)
        .parse()
        .map_err(|e| format!("invalid listen address: {e}"))?;
    let runtime = Arc::new(runtime_state(&service));
    if runtime.backends.is_empty() {
        return Err("enabled backend server list is empty".to_string());
    }

    let handle = if service.mode == "http" {
        start_http_listener(addr, runtime.clone())?
    } else {
        start_tcp_listener(addr, runtime.clone()).await?
    };
    Ok(ListenerHandle { handle, runtime })
}

fn runtime_state(service: &KyklosHaServiceSettings) -> RuntimeState {
    RuntimeState {
        service_id: service.id,
        name: service.name.clone(),
        service_type: service.service_type.clone(),
        mode: service.mode.clone(),
        listen: format!("{}:{}", service.bind_addr, service.listen_port),
        balance_method: service.balance_method.clone(),
        backends: service
            .servers
            .iter()
            .filter(|server| server.enabled)
            .map(|server| RuntimeBackend {
                id: server.id,
                name: server.name.clone(),
                address: format!("{}:{}", server.ip, server.port),
                active: Arc::new(AtomicUsize::new(0)),
            })
            .collect(),
        rr: Arc::new(AtomicUsize::new(0)),
    }
}

fn start_http_listener(
    addr: SocketAddr,
    runtime: Arc<RuntimeState>,
) -> Result<JoinHandle<()>, String> {
    let builder = Server::try_bind(&addr).map_err(|e| format!("failed to bind {addr}: {e}"))?;
    let client = Client::new();
    let make_svc = make_service_fn(move |conn: &AddrStream| {
        let remote_addr = conn.remote_addr().ip();
        let client = client.clone();
        let runtime = runtime.clone();
        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                handle_http(remote_addr, client.clone(), runtime.clone(), req)
            }))
        }
    });
    Ok(tokio::spawn(async move {
        if let Err(err) = builder.serve(make_svc).await {
            error!("Kyklos HA HTTP listener stopped: {}", err);
        }
    }))
}

async fn start_tcp_listener(
    addr: SocketAddr,
    runtime: Arc<RuntimeState>,
) -> Result<JoinHandle<()>, String> {
    let listener = TcpListener::bind(addr)
        .await
        .map_err(|e| format!("failed to bind {addr}: {e}"))?;
    Ok(tokio::spawn(async move {
        loop {
            let (inbound, peer) = match listener.accept().await {
                Ok(conn) => conn,
                Err(err) => {
                    warn!("Kyklos HA TCP accept failed: {}", err);
                    continue;
                }
            };
            let runtime = runtime.clone();
            tokio::spawn(async move {
                if let Err(err) = handle_tcp(peer.ip(), inbound, runtime).await {
                    warn!("Kyklos HA TCP connection failed: {}", err);
                }
            });
        }
    }))
}

async fn handle_http(
    client_ip: IpAddr,
    client: Client<hyper::client::HttpConnector>,
    runtime: Arc<RuntimeState>,
    req: Request<Body>,
) -> Result<Response<Body>, Infallible> {
    let Some(backend) = runtime.choose_backend(Some(client_ip)) else {
        return Ok(Response::builder()
            .status(StatusCode::SERVICE_UNAVAILABLE)
            .body(Body::from("Kyklos HA has no backend server\n"))
            .unwrap());
    };
    backend.active.fetch_add(1, Ordering::SeqCst);
    let _guard = ActiveGuard {
        active: backend.active.clone(),
    };
    let target = format!("http://{}", backend.address);
    match hyper_reverse_proxy::call(client_ip, &target, req, &client).await {
        Ok(response) => Ok(response),
        Err(err) => {
            warn!(
                "Kyklos HA HTTP upstream failed: service={} backend={} err={:?}",
                runtime.name, backend.address, err
            );
            Ok(Response::builder()
                .status(StatusCode::BAD_GATEWAY)
                .body(Body::from("Kyklos HA upstream error\n"))
                .unwrap())
        }
    }
}

async fn handle_tcp(
    client_ip: IpAddr,
    mut inbound: TcpStream,
    runtime: Arc<RuntimeState>,
) -> Result<(), String> {
    let backend = runtime
        .choose_backend(Some(client_ip))
        .ok_or_else(|| "Kyklos HA has no backend server".to_string())?;
    backend.active.fetch_add(1, Ordering::SeqCst);
    let _guard = ActiveGuard {
        active: backend.active.clone(),
    };
    let mut outbound = TcpStream::connect(&backend.address)
        .await
        .map_err(|e| format!("connect {} failed: {e}", backend.address))?;
    io::copy_bidirectional(&mut inbound, &mut outbound)
        .await
        .map_err(|e| format!("tcp copy failed: {e}"))?;
    Ok(())
}

fn status_from_listeners(listeners: &HashMap<i64, ListenerHandle>) -> KyklosHaStatus {
    let mut services = listeners
        .values()
        .map(|listener| {
            let backends = listener
                .runtime
                .backends
                .iter()
                .map(|backend| KyklosHaRuntimeBackend {
                    id: backend.id,
                    name: backend.name.clone(),
                    address: backend.address.clone(),
                    active_connections: backend.active.load(Ordering::SeqCst),
                })
                .collect::<Vec<_>>();
            let active_connections = backends
                .iter()
                .map(|backend| backend.active_connections)
                .sum::<usize>();
            KyklosHaRuntimeService {
                id: listener.runtime.service_id,
                name: listener.runtime.name.clone(),
                service_type: listener.runtime.service_type.clone(),
                mode: listener.runtime.mode.clone(),
                listen: listener.runtime.listen.clone(),
                balance_method: listener.runtime.balance_method.clone(),
                backend_count: listener.runtime.backends.len(),
                active_connections,
                backends,
            }
        })
        .collect::<Vec<_>>();
    services.sort_by(|a, b| a.name.cmp(&b.name));
    KyklosHaStatus {
        running: !services.is_empty(),
        listener_count: services.len(),
        services,
    }
}
