/**
 * Barrel for inference-node contracts. The types live in ../contracts/* grouped by concern
 * (agent IO, catalogs, candidates, planning decisions); this re-export keeps the historical
 * "./types" / "./planning/types" import paths stable for callers.
 */
export * from "../contracts/agent-context";
export * from "../contracts/candidate";
export * from "../contracts/catalog";
export * from "../contracts/planning";
