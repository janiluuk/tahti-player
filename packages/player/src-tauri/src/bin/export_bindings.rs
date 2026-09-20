fn main() {
    app_lib::export_bindings().expect("failed to export typescript bindings");
    println!("Exported TypeScript bindings to packages/player/src/services/tauri/bindings.ts");
}
