// Client-safe. Nothing here touches a Workers binding, because this module is
// imported by a "use client" component and a client bundle cannot resolve
// `cloudflare:workers` — the build fails outright, which is the good outcome:
// a server-only import reaching the browser should not be a runtime surprise.

// The 17 functional tags the registry sorts by, said in words a reader uses.
// A label, not a claim: `memory` groups a context panel, a shell bridge and a
// session-deleter, so the site calls these tags and never calls them jobs.
const TAG_LABEL: Record<string, string> = {
  ui: "Web UI", terminal: "terminal work", capabilities: "capabilities", vision: "vision",
  agents: "agent orchestration", memory: "memory", models: "model providers",
  interop: "interop and migration", channels: "remote channels", notifications: "notifications",
  usage: "usage and cost", observability: "observability", safety: "safety and approvals",
  marketplace: "plugin management", devtools: "developer tooling",
  knowledge: "knowledge and research", fun: "fun",
};
export const tagLabel = (tag: string) => TAG_LABEL[tag] ?? tag;
