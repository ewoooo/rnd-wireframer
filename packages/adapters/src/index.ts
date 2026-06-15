export const ADAPTER_PACKAGE_NAME = "@cx/adapters" as const;

export const ADAPTER_PUBLIC_SUBPATHS = ["markdown", "json", "table", "puck"] as const;

export type AdapterPublicSubpath = (typeof ADAPTER_PUBLIC_SUBPATHS)[number];
