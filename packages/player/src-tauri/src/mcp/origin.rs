use axum::{
    extract::Request,
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};

fn host_name(host: &str) -> &str {
    if host.starts_with('[') {
        return host.split_inclusive(']').next().unwrap_or(host);
    }
    match host.rsplit_once(':') {
        Some((name, port)) if port.chars().all(|c| c.is_ascii_digit()) => name,
        _ => host,
    }
}

fn is_loopback_host(host: &str) -> bool {
    matches!(host_name(host), "127.0.0.1" | "localhost" | "[::1]")
}

fn is_loopback_origin(origin: &str) -> bool {
    origin
        .strip_prefix("http://")
        .or_else(|| origin.strip_prefix("https://"))
        .is_some_and(is_loopback_host)
}

pub fn request_allowed(host: Option<&str>, origin: Option<&str>) -> bool {
    let host_ok = host.is_some_and(is_loopback_host);
    let origin_ok = origin.map_or(true, is_loopback_origin);
    host_ok && origin_ok
}

pub async fn loopback_only(request: Request, next: Next) -> Response {
    let allowed = {
        let headers = request.headers();
        let text =
            |name: header::HeaderName| headers.get(name).and_then(|value| value.to_str().ok());
        request_allowed(text(header::HOST), text(header::ORIGIN))
    };
    if !allowed {
        log::warn!("MCP request refused: Host or Origin is not loopback");
        return (
            StatusCode::FORBIDDEN,
            "Tahti Player's MCP server only accepts local requests.",
        )
            .into_response();
    }
    next.run(request).await
}

#[cfg(test)]
mod tests {
    use super::request_allowed;

    #[test]
    fn a_local_client_without_an_origin_is_allowed() {
        assert!(request_allowed(Some("127.0.0.1:8800"), None));
        assert!(request_allowed(Some("localhost:8801"), None));
        assert!(request_allowed(Some("[::1]:8800"), None));
    }

    #[test]
    fn a_local_page_origin_is_allowed() {
        assert!(request_allowed(
            Some("127.0.0.1:8800"),
            Some("http://localhost:6274")
        ));
    }

    #[test]
    fn a_rebound_host_is_refused() {
        assert!(!request_allowed(Some("evil.example:8800"), None));
        assert!(!request_allowed(None, None));
    }

    #[test]
    fn a_web_page_origin_is_refused() {
        assert!(!request_allowed(
            Some("127.0.0.1:8800"),
            Some("https://evil.example")
        ));
        assert!(!request_allowed(Some("127.0.0.1:8800"), Some("null")));
        assert!(!request_allowed(
            Some("127.0.0.1:8800"),
            Some("http://127.0.0.1.evil.example")
        ));
    }
}
