mod domains;
mod methods;
mod types;

pub use domains::list_methods;
pub use methods::method_details;
pub use types::describe_type;

#[cfg(test)]
mod tests {
    use super::*;

    const DOMAINS: [&str; 7] = [
        "Queue",
        "Playback",
        "Metadata",
        "Favorites",
        "Playlists",
        "Dashboard",
        "Providers",
    ];

    #[test]
    fn every_listed_method_has_details() {
        for domain in DOMAINS {
            let info = list_methods(domain).unwrap();
            for method in info["methods"].as_array().unwrap() {
                let method = method.as_str().unwrap();
                let details = method_details(domain, method)
                    .unwrap_or_else(|e| panic!("{domain}.{method}: {e}"));
                assert_eq!(details["method"], method);
            }
        }
    }

    #[test]
    fn unknown_lookups_list_the_alternatives() {
        assert!(list_methods("Nope").unwrap_err().contains("Queue"));
        assert!(method_details("Queue", "nope")
            .unwrap_err()
            .contains("getQueue"));
        assert!(method_details("Nope", "x")
            .unwrap_err()
            .contains("Unknown domain"));
        assert!(describe_type("Nope").unwrap_err().contains("Track"));
        assert_eq!(describe_type("Track").unwrap()["type"], "Track");
    }
}
