pub mod bridge;
pub mod commands;
pub mod db;
pub mod discord;
pub mod history;
pub mod http;
pub mod http_api;
pub mod logging;
pub mod local_library;
pub mod mcp;
pub mod mpd;
pub mod net;
pub mod pagination;
mod setup;
pub mod stream_server;
pub mod ytdlp;
pub mod ytdlp_setup;

// Maximizes the window when running as a non-steam app in steam
#[cfg(target_os = "linux")]
fn maximize_for_gamescope(app: &tauri::App) {
    use tauri::Manager;

    let is_gamescope = std::env::var("GAMESCOPE_WAYLAND_DISPLAY").is_ok()
        || std::env::var("SteamDeck").map_or(false, |v| v == "1");

    if is_gamescope {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.maximize();
        }
    }
}

fn typescript_export_config() -> specta_typescript::Typescript {
    specta_typescript::Typescript::default().header("/* eslint-disable */")
}

fn specta_builder() -> tauri_specta::Builder<tauri::Wry> {
    tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
        local_library::library_list,
        local_library::playlists::playlist_list,
        local_library::playlists::playlist_create,
        local_library::playlists::playlist_rename,
        local_library::playlists::playlist_duplicate,
        local_library::playlists::playlist_delete,
        local_library::playlists::playlist_add_tracks,
        local_library::playlists::playlist_entries,
        local_library::playlists::playlist_entry_ids,
        local_library::playlists::playlist_move_entries,
        local_library::playlists::playlist_remove_entries,
        local_library::playlists::playlist_restore_entries,
        local_library::playlists::playlist_set_order,
        local_library::playlists::playlist_track_ids,
        local_library::m3u::playlist_export,
        local_library::m3u::playlist_import_preview,
        local_library::m3u::playlist_pick_relink_folder,
        local_library::m3u::playlist_import_commit,
        local_library::m3u::playlist_relink_entry,
        local_library::library_facets,
        local_library::library_matching_ids,
        local_library::library_filter_options,
        local_library::library_prepare_playback,
        local_library::library_totals,
        local_library::library_import,
        local_library::library_import_folder,
        local_library::library_import_paths,
        local_library::library_import_cancel,
        local_library::library_resolve,
        local_library::library_remove,
        local_library::library_remove_many,
        local_library::library_reveal,
        local_library::library_list_unavailable,
        local_library::library_rescan,
        local_library::library_relink,
        local_library::library_list_roots,
        local_library::library_add_root,
        local_library::library_remove_root,
        local_library::library_rescan_roots,
        local_library::library_relink_root,
        local_library::library_take_recovery_notice,
        local_library::watcher::library_watching,
        local_library::watcher::library_set_watching,
        local_library::smart_playlists::smart_list,
        local_library::smart_playlists::smart_save,
        local_library::smart_playlists::smart_delete,
        local_library::smart_playlists::smart_evaluate,
        local_library::smart_playlists::smart_track_ids,
        local_library::smart_playlists::smart_snapshot,
        local_library::analysis::library_analyze_tracks,
        local_library::analysis::library_analysis_cancel,
        local_library::analysis::library_analysis_pause,
        local_library::analysis::library_analysis_summary,
        local_library::analysis::library_analysis_detail,
        local_library::analysis::library_set_corrections,
        local_library::analysis::library_restore_corrections,
        local_library::analysis::library_clear_analysis,
        local_library::catalog::library_edit_preview,
        local_library::catalog::library_edit_tracks,
        local_library::catalog::library_restore_edits,
        local_library::catalog::library_field_summary,
        local_library::catalog::library_provenance,
        local_library::catalog::library_user_data,
        local_library::catalog::library_set_rating,
        local_library::catalog::library_set_color,
        local_library::catalog::library_add_tag,
        local_library::catalog::library_remove_tag,
        local_library::catalog::library_restore_user_data,
        local_library::catalog::library_list_tags,
        local_library::catalog::library_record_play,
        local_library::catalog::library_hash_tracks,
        local_library::catalog::library_hash_cancel,
        local_library::catalog::library_duplicates,
        local_library::catalog::library_merge_tracks,
        local_library::catalog::library_play_history,
        local_library::catalog::library_clear_play_history,
        local_library::tag_writer::library_write_tags_preview,
        local_library::tag_writer::library_write_tags,
        local_library::organize::library_organize_pick_destination,
        local_library::organize::library_organize_preview,
        local_library::organize::library_organize_apply,
        local_library::backup::library_backup_export,
        local_library::backup::library_backup_pick,
        local_library::backup::library_backup_preview,
        local_library::backup::library_backup_restore,
        commands::is_flatpak,
        commands::copy_dir_recursive,
        commands::extract_zip,
        commands::download_file,
        http::http_fetch,
        ytdlp::ytdlp_search,
        ytdlp::ytdlp_get_stream,
        ytdlp::ytdlp_get_playlist,
        logging::get_startup_logs,
        mcp::mcp_start,
        mcp::mcp_stop,
        http_api::http_api_start,
        http_api::http_api_stop,
        mpd::mpd_start,
        mpd::mpd_stop,
        stream_server::stream_server_port,
        ytdlp_setup::ytdlp_ensure_installed,
        discord::discord_connect,
        discord::discord_disconnect,
        discord::discord_set_activity,
        discord::discord_clear_activity,
        bridge::bridge_respond,
        bridge::bridge_notify,
        history::commands::history_record_event,
        history::commands::history_fetch,
        history::commands::history_delete_range,
        history::commands::history_hourly_listening_time,
        history::commands::history_daily_listening_time,
        history::commands::history_first_play_at,
        history::commands::history_top_artists,
        history::commands::history_top_albums,
        history::commands::history_top_tracks
    ])
}

pub fn export_bindings() -> Result<(), String> {
    specta_builder()
        .export(
            typescript_export_config(),
            concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/../src/services/tauri/bindings.ts"
            ),
        )
        .map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let is_flatpak = std::env::var("FLATPAK_ID").is_ok();

    let specta_builder = specta_builder();

    #[cfg(debug_assertions)]
    export_bindings().expect("failed to export typescript bindings");

    let mut builder = tauri::Builder::default()
        .manage(local_library::LibraryState::default())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(setup::log_plugin());

    if !is_flatpak {
        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_process::init());
    }

    builder
        .invoke_handler(specta_builder.invoke_handler())
        .setup(|app| {
            logging::mark_startup_complete();
            bridge::init_bridge(app.handle().clone());
            mcp::init_mcp(app.handle().clone());
            mpd::init_mpd(app.handle().clone());
            http_api::init_http_api(app.handle().clone());
            stream_server::init_stream_server(app.handle().clone());
            discord::init_discord(app.handle().clone());
            history::init_history(app.handle().clone());
            let library_app = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                local_library::watcher::restart(&library_app).await;
            });

            #[cfg(target_os = "linux")]
            maximize_for_gamescope(app);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
