use rmcp::{
    handler::server::router::tool::ToolRouter, handler::server::wrapper::Parameters, model::*,
    schemars, tool, tool_router, ErrorData as McpError,
};

use crate::bridge::bridge::Bridge;
use crate::bridge::types::BridgeError;

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct ListMethodsParams {
    /// A domain such as "Playback". Leave it out to list the domains.
    #[serde(default)]
    pub domain: Option<String>,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct MethodDetailsParams {
    /// The method to describe, in "Domain.method" format, e.g. "Queue.get".
    pub method: String,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct DescribeTypeParams {
    #[serde(rename = "type")]
    pub type_name: String,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
pub struct CallParams {
    /// The method to call, in "Domain.method" format, e.g. "Playback.toggle".
    pub method: String,
    /// Method parameters as a JSON object with named fields. Omit or pass {} for parameterless methods.
    #[serde(default)]
    pub params: serde_json::Value,
}

pub const META_PREFIX: &str = "Meta.";

fn bridge_result_to_mcp(
    tool_label: &str,
    result: Result<serde_json::Value, BridgeError>,
) -> Result<CallToolResult, McpError> {
    match result {
        Ok(data) => Ok(CallToolResult::success(vec![Content::text(
            serde_json::to_string_pretty(&data).unwrap_or_default(),
        )])),
        Err(BridgeError::InfrastructureError(message)) => {
            log::error!("MCP {tool_label} infrastructure error: {message}");
            Err(McpError::internal_error(message, None))
        }
        Err(BridgeError::HandlerError(message)) => {
            Ok(CallToolResult::error(vec![Content::text(message)]))
        }
    }
}

pub fn normalize_params(params: &serde_json::Value) -> serde_json::Value {
    match params {
        serde_json::Value::String(s) => serde_json::from_str(s).unwrap_or_else(|_| params.clone()),
        serde_json::Value::Null => serde_json::Value::Object(Default::default()),
        other => other.clone(),
    }
}

#[derive(Clone)]
pub struct TahtiMcpServer {
    pub bridge: Bridge,
    pub(crate) tool_router: ToolRouter<TahtiMcpServer>,
}

#[tool_router]
impl TahtiMcpServer {
    pub fn new(bridge: Bridge) -> Self {
        Self {
            bridge,
            tool_router: Self::tool_router(),
        }
    }

    #[tool(
        name = "list_methods",
        description = "List the Tahti Player API. Without a domain, lists the domains (Playback, Queue, Library, Radio, Tahti). With a domain, lists its methods."
    )]
    async fn list_methods(
        &self,
        Parameters(params): Parameters<ListMethodsParams>,
    ) -> Result<CallToolResult, McpError> {
        let args = match params.domain {
            Some(domain) => serde_json::json!({ "domain": domain }),
            None => serde_json::json!({}),
        };
        bridge_result_to_mcp(
            "list_methods",
            self.bridge.call("Meta.listMethods", args).await,
        )
    }

    #[tool(
        name = "method_details",
        description = "Get full details for a Tahti Player API method: description, parameter names and types, return type. Use Domain.method format."
    )]
    async fn method_details(
        &self,
        Parameters(params): Parameters<MethodDetailsParams>,
    ) -> Result<CallToolResult, McpError> {
        bridge_result_to_mcp(
            "method_details",
            self.bridge
                .call(
                    "Meta.methodDetails",
                    serde_json::json!({ "method": params.method }),
                )
                .await,
        )
    }

    #[tool(
        name = "describe_type",
        description = "Get the JSON shape of a Tahti Player data type named in a method's parameters or return type, e.g. QueueItem or LibraryTrack."
    )]
    async fn describe_type(
        &self,
        Parameters(params): Parameters<DescribeTypeParams>,
    ) -> Result<CallToolResult, McpError> {
        bridge_result_to_mcp(
            "describe_type",
            self.bridge
                .call(
                    "Meta.describeType",
                    serde_json::json!({ "type": params.type_name }),
                )
                .await,
        )
    }

    #[tool(
        name = "call",
        description = "Call a Tahti Player API method. Use Domain.method format for the method name and pass parameters as a JSON object with named fields."
    )]
    async fn call(
        &self,
        Parameters(params): Parameters<CallParams>,
    ) -> Result<CallToolResult, McpError> {
        if params.method.starts_with(META_PREFIX) {
            return Ok(CallToolResult::error(vec![Content::text(
                "Use list_methods, method_details and describe_type for the API description.",
            )]));
        }
        bridge_result_to_mcp(
            &format!("call({})", params.method),
            self.bridge
                .call(&params.method, normalize_params(&params.params))
                .await,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::normalize_params;
    use serde_json::json;

    #[test]
    fn params_given_as_a_json_string_are_parsed() {
        assert_eq!(normalize_params(&json!("{\"a\":1}")), json!({ "a": 1 }));
    }

    #[test]
    fn missing_params_become_an_empty_object() {
        assert_eq!(normalize_params(&json!(null)), json!({}));
    }

    #[test]
    fn an_object_is_passed_through() {
        assert_eq!(normalize_params(&json!({ "x": [1] })), json!({ "x": [1] }));
    }
}
