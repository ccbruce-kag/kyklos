use axum::Json;
use serde_json::Value;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn split_and_trim_space(s: &str, sep: &str) -> Vec<String> {
    s.split(sep)
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
        .collect()
}

pub fn output(err: Option<&str>, data: Option<Value>) -> Json<Value> {
    let (code, msg) = match err {
        Some(e) => (1, e.to_string()),
        None => (0, "OK".to_string()),
    };
    let mut map = serde_json::Map::new();
    map.insert("code".to_string(), code.into());
    map.insert("msg".to_string(), msg.into());
    if let Some(d) = data {
        map.insert("data".to_string(), d);
    } else {
        map.insert("data".to_string(), Value::Null);
    }
    Json(Value::Object(map))
}

#[allow(dead_code)]
pub fn time_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

pub fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}
