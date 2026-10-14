use std::{convert::Infallible, sync::Arc};

use axum::{
    extract::State,
    middleware,
    http::StatusCode,
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse, Response,
    },
    routing::{get, post},
    Json, Router,
};
use futures::Stream;
use serde_json::{json, Value};
use tokio::sync::broadcast;

use super::{actions, search, RemoteEvent};
use crate::bridge::{bridge::Bridge, types::BridgeError};

#[derive(Clone)]
pub struct AppState {
    pub(super) bridge: Bridge,
    events_tx: broadcast::Sender<RemoteEvent>,
    pub(super) pairing_token: Arc<str>,
}

pub(super) struct BridgeErrorResponse(pub(super) BridgeError);

impl IntoResponse for BridgeErrorResponse {
    fn into_response(self) -> Response {
        let message = self.0.to_string();
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": message })),
        )
            .into_response()
    }
}

async fn health() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

const BRIDGE_METHOD_PREFIX: &str = "Jam.";

/** Calls the webview's Tahti Jam adapter; `Jam.` keeps these apart from the MCP and MPD calls. */
pub(super) async fn call(
    bridge: &Bridge,
    method: &str,
    params: Value,
) -> Result<Value, BridgeErrorResponse> {
    bridge
        .call(&format!("{BRIDGE_METHOD_PREFIX}{method}"), params)
        .await
        .map_err(BridgeErrorResponse)
}

async fn get_queue(State(state): State<AppState>) -> Result<Json<Value>, BridgeErrorResponse> {
    call(&state.bridge, "Queue.getQueue", json!({})).await.map(Json)
}

async fn get_playback(State(state): State<AppState>) -> Result<Json<Value>, BridgeErrorResponse> {
    call(&state.bridge, "Playback.getState", json!({})).await.map(Json)
}

async fn get_settings(State(state): State<AppState>) -> Result<Json<Value>, BridgeErrorResponse> {
    call(&state.bridge, "Settings.get", json!({})).await.map(Json)
}

fn events_stream(
    mut receiver: broadcast::Receiver<RemoteEvent>,
) -> impl Stream<Item = Result<Event, Infallible>> {
    async_stream::stream! {
        yield Ok(Event::default().comment("connected"));

        loop {
            match receiver.recv().await {
                Ok(remote_event) => {
                    let event = Event::default()
                        .event(remote_event.kind.as_str())
                        .data(remote_event.data);
                    yield Ok(event);
                }
                Err(broadcast::error::RecvError::Lagged(count)) => {
                    log::warn!("SSE client lagged, skipped {count} events");
                    continue;
                }
                Err(broadcast::error::RecvError::Closed) => break,
            }
        }
    }
}

async fn get_events(
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let receiver = state.events_tx.subscribe();
    Sse::new(events_stream(receiver)).keep_alive(KeepAlive::default())
}

pub fn router(
    bridge: Bridge,
    events_tx: broadcast::Sender<RemoteEvent>,
    pairing_token: &str,
) -> Router {
    let state = AppState {
        bridge,
        events_tx,
        pairing_token: Arc::from(pairing_token),
    };

    Router::new()
        .route("/api/health", get(health))
        .route("/api/queue", get(get_queue))
        .route("/api/playback", get(get_playback))
        .route("/api/settings", get(get_settings))
        .route("/api/events", get(get_events))
        .route("/api/playback/play", post(actions::play))
        .route("/api/playback/pause", post(actions::pause))
        .route("/api/playback/toggle", post(actions::toggle_playback))
        .route("/api/playback/next", post(actions::next_track))
        .route("/api/playback/previous", post(actions::previous_track))
        .route("/api/playback/seek", post(actions::seek))
        .route("/api/playback/shuffle", post(actions::set_shuffle))
        .route("/api/playback/repeat", post(actions::set_repeat))
        .route("/api/playback/volume", post(actions::set_volume))
        .route("/api/queue/play", post(actions::play_queue_item))
        .route("/api/queue/add", post(actions::add_to_queue))
        .route("/api/queue/remove", post(actions::remove_from_queue))
        .route("/api/search", post(search::search))
        .fallback(super::frontend::serve_frontend)
        .layer(middleware::from_fn_with_state(
            state.clone(),
            super::pairing::require_pairing,
        ))
        .with_state(state)
}
