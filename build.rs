use std::process::Command;

fn main() {
    let date = Command::new("date")
        .arg("+%Y-%m-%d %H:%M:%S")
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| {
            chrono::Local::now()
                .format("%Y-%m-%d %H:%M:%S")
                .to_string()
        });

    std::fs::write(
        std::path::Path::new(&std::env::var("OUT_DIR").unwrap()).join("build-date.txt"),
        &date,
    )
    .unwrap();

    let git_hash = Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    println!("cargo:rustc-env=GIT_HASH={}", git_hash);
}
