import path from "node:path";

/** Root directory holding uploaded client import sources. */
export const CLIENT_IMPORT_ROOT = path.join(process.cwd(), "data/client-imports");

/** Root directory holding screen-generation run artifacts. */
export const RUN_ROOT = path.join(process.cwd(), "data/runs/screen-generation");
