// Stand-in for `cloudflare:workers`, which is a workerd built-in and does not
// resolve under plain Node. `vinext dev` runs on Node, so the static import in
// data.ts would fail module resolution there even though the code path is
// never taken. vite.config.ts aliases this file in when the Cloudflare plugin
// is not active; see the `resolve.alias` branch there.
export const env: { ASSETS?: { fetch: (req: Request | string) => Promise<Response> } } = {};
