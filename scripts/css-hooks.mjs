// Node ESM loader hook: stub out .css imports so node/tsx can load TSX modules
// that statically import CSS modules. Used only by dump scripts.
export async function load(url, context, nextLoad) {
	if (url.endsWith(".css")) {
		return { format: "module", source: "export default {};", shortCircuit: true };
	}
	return nextLoad(url, context);
}
