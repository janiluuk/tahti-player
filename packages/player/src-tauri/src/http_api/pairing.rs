use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

use super::routes::AppState;

const OPEN_PATHS: [&str; 1] = ["/api/health"];

fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    a.len() == b.len() && a.iter().zip(b).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

fn bearer(authorization: Option<&str>) -> Option<&str> {
    authorization?.strip_prefix("Bearer ").map(str::trim)
}

fn query_token(query: Option<&str>) -> Option<&str> {
    query?
        .split('&')
        .find_map(|pair| pair.strip_prefix("token="))
}

pub fn pairing_ok(
    path: &str,
    authorization: Option<&str>,
    query: Option<&str>,
    expected: &str,
) -> bool {
    if !path.starts_with("/api/") || OPEN_PATHS.contains(&path) {
        return true;
    }
    if expected.is_empty() {
        return false;
    }
    bearer(authorization)
        .or_else(|| query_token(query))
        .is_some_and(|token| constant_time_eq(token.as_bytes(), expected.as_bytes()))
}

pub async fn require_pairing(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Response {
    let allowed = pairing_ok(
        request.uri().path(),
        request
            .headers()
            .get(header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok()),
        request.uri().query(),
        &state.pairing_token,
    );
    if !allowed {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({
                "error": "This device isn't paired. Scan the Tahti Jam QR code in Tahti Player's settings again."
            })),
        )
            .into_response();
    }
    next.run(request).await
}

#[cfg(test)]
mod tests {
    use super::pairing_ok;

    const TOKEN: &str = "s3cret-token";

    #[test]
    fn health_and_the_remote_page_need_no_pairing() {
        assert!(pairing_ok("/api/health", None, None, TOKEN));
        assert!(pairing_ok("/remote", None, None, TOKEN));
        assert!(pairing_ok("/assets/remote.js", None, None, TOKEN));
    }

    #[test]
    fn the_api_needs_the_pairing_token() {
        assert!(!pairing_ok("/api/queue", None, None, TOKEN));
        assert!(!pairing_ok("/api/queue", Some("Bearer nope"), None, TOKEN));
        assert!(!pairing_ok("/api/queue", Some(TOKEN), None, TOKEN));
        assert!(pairing_ok(
            "/api/queue",
            Some("Bearer s3cret-token"),
            None,
            TOKEN
        ));
    }

    #[test]
    fn the_event_stream_can_pass_the_token_in_the_query() {
        assert!(pairing_ok(
            "/api/events",
            None,
            Some("token=s3cret-token"),
            TOKEN
        ));
        assert!(!pairing_ok("/api/events", None, Some("token=s3cret"), TOKEN));
    }

    #[test]
    fn an_empty_token_pairs_nothing() {
        assert!(!pairing_ok("/api/queue", Some("Bearer "), None, ""));
    }
}
