export default function NotFound() {
  return (
    <main className="wrap">
      <h1>No such plugin here</h1>
      <p className="lede">
        Either it was never in the registry, or it was and the row moved. Both are
        answerable: the registry publishes what it left out, with reasons.
      </p>
      <p>
        <a href="/">Search the registry</a>
        <span className="dot">·</span>
        <a href="https://github.com/dshworks/awesome-dsh-plugins/blob/main/data/rejected.json">
          What was left out, and why
        </a>
      </p>
    </main>
  );
}
