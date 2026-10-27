const SERVICE: &str = "live.tahti.player";
const REFRESH_TOKEN_ACCOUNT: &str = "auth-refresh-token";
const MAX_TOKEN_LEN: usize = 2048;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SecretStoreError {
    Unavailable,
    AccessDenied,
    Failed,
}

impl SecretStoreError {
    // Messages must never carry the secret or the platform error text, which
    // can echo attribute values back.
    fn message(&self) -> &'static str {
        match self {
            SecretStoreError::Unavailable => "No OS keychain is available",
            SecretStoreError::AccessDenied => "The OS keychain is locked or denied access",
            SecretStoreError::Failed => "The OS keychain could not be used",
        }
    }
}

pub trait SecretStore: Send + Sync {
    fn get(&self, account: &str) -> Result<Option<String>, SecretStoreError>;
    fn set(&self, account: &str, value: &str) -> Result<(), SecretStoreError>;
    fn delete(&self, account: &str) -> Result<(), SecretStoreError>;
}

pub struct OsKeychain;

fn map_keyring_error(err: keyring::Error) -> SecretStoreError {
    match err {
        keyring::Error::NoDefaultStore => SecretStoreError::Unavailable,
        keyring::Error::NoStorageAccess(_) => SecretStoreError::AccessDenied,
        _ => SecretStoreError::Failed,
    }
}

impl SecretStore for OsKeychain {
    fn get(&self, account: &str) -> Result<Option<String>, SecretStoreError> {
        let entry = keyring::Entry::new(SERVICE, account).map_err(map_keyring_error)?;
        match entry.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(err) => Err(map_keyring_error(err)),
        }
    }

    fn set(&self, account: &str, value: &str) -> Result<(), SecretStoreError> {
        keyring::Entry::new(SERVICE, account)
            .and_then(|entry| entry.set_password(value))
            .map_err(map_keyring_error)
    }

    fn delete(&self, account: &str) -> Result<(), SecretStoreError> {
        let entry = keyring::Entry::new(SERVICE, account).map_err(map_keyring_error)?;
        match entry.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(err) => Err(map_keyring_error(err)),
        }
    }
}

fn is_valid_refresh_token(token: &str) -> bool {
    !token.is_empty()
        && token.len() <= MAX_TOKEN_LEN
        && token
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.' | b'~'))
}

pub fn read_refresh_token(store: &dyn SecretStore) -> Result<Option<String>, SecretStoreError> {
    match store.get(REFRESH_TOKEN_ACCOUNT)? {
        Some(token) if is_valid_refresh_token(&token) => Ok(Some(token)),
        Some(_) => {
            store.delete(REFRESH_TOKEN_ACCOUNT)?;
            Ok(None)
        }
        None => Ok(None),
    }
}

pub fn write_refresh_token(store: &dyn SecretStore, token: Option<&str>) -> Result<(), String> {
    match token {
        Some(token) if !is_valid_refresh_token(token) => {
            Err("Refusing to store a malformed refresh token".to_string())
        }
        Some(token) => store
            .set(REFRESH_TOKEN_ACCOUNT, token)
            .map_err(|err| err.message().to_string()),
        None => store
            .delete(REFRESH_TOKEN_ACCOUNT)
            .map_err(|err| err.message().to_string()),
    }
}

#[tauri::command]
#[specta::specta]
pub async fn auth_refresh_token_get() -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(|| read_refresh_token(&OsKeychain))
        .await
        .map_err(|_| SecretStoreError::Failed.message().to_string())?
        .map_err(|err| {
            log::warn!("auth keychain read failed: {:?}", err);
            err.message().to_string()
        })
}

#[tauri::command]
#[specta::specta]
pub async fn auth_refresh_token_set(token: Option<String>) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || write_refresh_token(&OsKeychain, token.as_deref()))
        .await
        .map_err(|_| SecretStoreError::Failed.message().to_string())?
        .inspect_err(|message| log::warn!("auth keychain write failed: {}", message))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::sync::Mutex;

    #[derive(Default)]
    struct MemoryStore {
        values: Mutex<HashMap<String, String>>,
        fail_with: Option<SecretStoreError>,
    }

    impl MemoryStore {
        fn failing(err: SecretStoreError) -> Self {
            Self {
                values: Mutex::default(),
                fail_with: Some(err),
            }
        }

        fn seed(&self, value: &str) {
            self.values
                .lock()
                .unwrap()
                .insert(REFRESH_TOKEN_ACCOUNT.to_string(), value.to_string());
        }

        fn raw(&self) -> Option<String> {
            self.values
                .lock()
                .unwrap()
                .get(REFRESH_TOKEN_ACCOUNT)
                .cloned()
        }
    }

    impl SecretStore for MemoryStore {
        fn get(&self, account: &str) -> Result<Option<String>, SecretStoreError> {
            if let Some(err) = &self.fail_with {
                return Err(err.clone());
            }
            Ok(self.values.lock().unwrap().get(account).cloned())
        }

        fn set(&self, account: &str, value: &str) -> Result<(), SecretStoreError> {
            if let Some(err) = &self.fail_with {
                return Err(err.clone());
            }
            self.values
                .lock()
                .unwrap()
                .insert(account.to_string(), value.to_string());
            Ok(())
        }

        fn delete(&self, account: &str) -> Result<(), SecretStoreError> {
            if let Some(err) = &self.fail_with {
                return Err(err.clone());
            }
            self.values.lock().unwrap().remove(account);
            Ok(())
        }
    }

    const TOKEN: &str = "rfr_Zm9vYmFyLWJhei1xdXV4LTEyMzQ1Njc4OTA";

    #[test]
    fn stores_reads_and_clears_the_refresh_token() {
        let store = MemoryStore::default();
        assert_eq!(read_refresh_token(&store), Ok(None));

        write_refresh_token(&store, Some(TOKEN)).unwrap();
        assert_eq!(read_refresh_token(&store), Ok(Some(TOKEN.to_string())));

        write_refresh_token(&store, None).unwrap();
        assert_eq!(read_refresh_token(&store), Ok(None));
    }

    #[test]
    fn clearing_an_empty_store_is_not_an_error() {
        let store = MemoryStore::default();
        assert_eq!(write_refresh_token(&store, None), Ok(()));
    }

    #[test]
    fn rotation_replaces_the_previous_token() {
        let store = MemoryStore::default();
        write_refresh_token(&store, Some(TOKEN)).unwrap();
        write_refresh_token(&store, Some("rfr_next")).unwrap();
        assert_eq!(store.raw().as_deref(), Some("rfr_next"));
    }

    #[test]
    fn rejects_malformed_tokens_without_echoing_them() {
        let store = MemoryStore::default();
        for bad in ["", "rfr_has space", "rfr_new\nline", "rfr_\"quoted\""] {
            assert_eq!(
                write_refresh_token(&store, Some(bad)),
                Err("Refusing to store a malformed refresh token".to_string())
            );
        }
        let too_long = "a".repeat(MAX_TOKEN_LEN + 1);
        assert!(write_refresh_token(&store, Some(&too_long)).is_err());
        assert_eq!(store.raw(), None);
    }

    #[test]
    fn drops_a_corrupted_stored_value_instead_of_returning_it() {
        let store = MemoryStore::default();
        store.seed("not a token\u{0}");
        assert_eq!(read_refresh_token(&store), Ok(None));
        assert_eq!(store.raw(), None);
    }

    #[test]
    fn keychain_failures_surface_as_generic_messages() {
        let store = MemoryStore::failing(SecretStoreError::AccessDenied);
        assert_eq!(
            read_refresh_token(&store),
            Err(SecretStoreError::AccessDenied)
        );
        let err = write_refresh_token(&store, Some(TOKEN)).unwrap_err();
        assert_eq!(err, "The OS keychain is locked or denied access");
        assert!(!err.contains(TOKEN));
    }
}
