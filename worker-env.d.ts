// The bindings this Worker actually has. wrangler.jsonc declares exactly one:
// the static asset set that carries the registry data. Declared here rather
// than generated so a binding cannot appear in the types without appearing in
// the deploy config too.
declare namespace Cloudflare {
  interface Env {
    ASSETS: Fetcher;
  }
}
