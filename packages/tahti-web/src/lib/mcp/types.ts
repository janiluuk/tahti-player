/** One parameter of an MCP-callable method, as `method_details` shows it. */
export type ParamDef = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'string[]';
  description: string;
  optional?: boolean;
  /** Allowed values for a string parameter. */
  oneOf?: readonly string[];
};

export type MethodDef = {
  description: string;
  params: readonly ParamDef[];
  returns: string;
  run: (params: Record<string, unknown>) => Promise<unknown> | unknown;
};

export type DomainDef = {
  description: string;
  methods: Record<string, MethodDef>;
};

/** A data type named in a `returns`, keyed by name, shown by `describe_type`. */
export type TypeShapes = Record<string, Record<string, string>>;

/** A method refused for a reason the agent can act on (wrong argument, nothing playing). */
export class McpUserError extends Error {}
