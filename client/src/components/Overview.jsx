import { PageHeading, Empty } from './Shell.jsx';

export function Overview({ user, content, users, runs, onNavigate }) {
  const successRuns = runs.filter((run) => run.status === 'SUCCESS').length;
  const cards = [
    ['Content items', content.length, 'Available to summarize'],
    ['AI runs', runs.length, `${successRuns} completed successfully`],
    ['Your balance', user.tokenBalance, 'TWT tokens'],
    ['Members', users.length || '—', 'Registered accounts']
  ];

  return (
    <>
      <PageHeading kicker="Operations" title="Good to see you." description="A quick look at content, AI usage and rewards across T-World." />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, note], index) => (
          <article key={label} className={`panel p-5 ${index === 2 ? '!bg-brandYellow !text-ink' : ''}`}>
            <p className={`text-sm ${index === 2 ? 'text-black/60' : 'text-black/50'}`}>{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
            <p className={`mt-1 text-xs ${index === 2 ? 'text-black/45' : 'text-black/35'}`}>{note}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <article className="panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="eyebrow">Latest activity</p><h2 className="mt-1 text-xl font-semibold">AI runs</h2></div>
            <button className="rounded-sm bg-brandYellow px-2 py-1 text-sm font-semibold text-ink" onClick={() => onNavigate('activity')}>View all</button>
          </div>
          {runs.length === 0 ? <Empty>No AI runs yet.</Empty> : (
            <div className="divide-y divide-black/5">
              {runs.slice(0, 5).map((run) => (
                <div key={run._id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{run.contentId?.title || 'Removed content'}</p><p className="mt-0.5 text-xs text-black/40">{run.userId?.email || 'Unknown user'}</p></div>
                  <Status value={run.status} />
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="panel overflow-hidden bg-ink p-6 text-white">
          <p className="eyebrow !text-brandYellow">Start a run</p>
          <h2 className="mt-3 text-2xl font-semibold">Turn long content into a useful brief.</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">Choose the tone and length. A successful summary adds 5 TWT to your wallet.</p>
          <button className="btn mt-8 bg-white text-ink hover:bg-brandYellow" onClick={() => onNavigate('content')}>Browse content <span className="ml-2">→</span></button>
        </article>
      </section>
    </>
  );
}

export function Status({ value }) {
  const style = value === 'SUCCESS' || value === 'AVAILABLE' ? 'bg-brandYellow text-ink' : value === 'FALLBACK' ? 'bg-brandYellow/25 text-ink' : value === 'WITHDRAWN' ? 'bg-slate-100 text-slate-600' : 'bg-ink text-white';
  return <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${style}`}>{value}</span>;
}
