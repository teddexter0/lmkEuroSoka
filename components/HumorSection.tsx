'use client'

export default function HumorSection({ items }: { items: Array<{ line: string; sourceUrl?: string }> }) {
  return <section className="desk-section" aria-label="Football humor">
    <div className="desk-heading"><div><p className="desk-kicker">THE LIGHTER SIDE</p><h2>The week in football</h2></div></div>
    <p className="desk-muted">The comebacks, late goals and score swings that gave us something to laugh about.</p>
    {items.length ? <div className="desk-stack">{items.map(({ line, sourceUrl }) => {
      const split = line.indexOf(' · ')
      return <article className="desk-card" key={line}>
        {split !== -1 && <h3>{line.slice(0, split)}</h3>}
        <p>{split === -1 ? line : line.slice(split + 3)}</p>
        {sourceUrl && <a className="desk-link" href={sourceUrl} target="_blank" rel="noreferrer">See the match ↗</a>}
      </article>
    })}</div> : <p className="desk-status">No verified late twists or big comebacks surfaced this week.</p>}
  </section>
}
