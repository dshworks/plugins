// The plugins this org publishes.
//
// One list, because there were three copies of this fact and they disagreed:
// page.tsx opened with "Three plugins", llms.txt said "the three plugins this
// org publishes", and llms.txt's human-surfaces list named two of them. The
// day dsh-ego-browser shipped, all three were wrong in different ways and
// nothing was red — a hardcoded count next to the list it counts is a number
// waiting to rot.
//
// Every entry here is also in the registry on the same terms as everyone
// else's: same schema, same proof file, same verified-against date.

export type OurPlugin = {
  /** Path on this site when we host a page, else the repo. */
  href: string;
  name: string;
  /** The one-word shelf shown beside the name. */
  kind: string;
  what: string;
};

export const OURS: OurPlugin[] = [
  {
    href: "/dsh-meter/",
    name: "dsh-meter",
    kind: "cost",
    what:
      "DeepSeek bills by the hour now. One line under the composer: what this session cost, " +
      "which tariff is running, how long until it flips, and the balance behind it. Both " +
      "published rate cards, priced at dispatch time.",
  },
  {
    href: "https://github.com/dshworks/dsh-watch",
    name: "dsh-watch",
    kind: "unattended",
    what:
      "Background stream listeners that wake the agent: matching lines from a command or a " +
      "growing file arrive as batched, budgeted notices — plus a daemon host, because no " +
      "stock dsh surface keeps an agent standing.",
  },
  {
    href: "/dsh-crew/",
    name: "dsh-crew",
    kind: "crew",
    what:
      "Claude Code and Codex, each in a real terminal pane inside your dsh session — " +
      "typeable, with five tools so the dsh agent seats them, hands them work, and reads " +
      "their screens.",
  },
  {
    href: "/dsh-ego-browser/",
    name: "dsh-ego-browser",
    kind: "browser",
    what:
      "A browser agent with a memory it writes itself. ego lite brings your real logins; this " +
      "adds the site-skill store ego's own README still lists as coming soon, so the second " +
      "scrape of a dashboard calls a tool the agent wrote last week.",
  },
];

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

/** "Four" — spelled, because prose counts read badly as digits. */
export const oursCount = (): string => WORDS[OURS.length] ?? String(OURS.length);

/** The ones with a page here, for llms.txt's human-surfaces list. */
export const oursHosted = (): OurPlugin[] => OURS.filter((p) => p.href.startsWith("/"));
