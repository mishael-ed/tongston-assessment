import { Empty, PageHeading } from './Shell.jsx';
import { Status } from './Overview.jsx';

export function Activity({ runs, users }) {
  return (
    <>
      <PageHeading kicker="Audit view" title="Activity" description="AI outcomes and current member balances for operational review." />
      <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <article className="panel overflow-hidden"><div className="p-6"><p className="eyebrow">AI orchestration</p><h2 className="mt-1 text-xl font-semibold">Run history</h2></div>
          {runs.length === 0 ? <div className="p-6 pt-0"><Empty>No AI runs yet.</Empty></div> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-cream/70 text-xs text-black/40"><tr><th className="px-6 py-3 font-medium">Content</th><th className="px-4 py-3 font-medium">Member</th><th className="px-4 py-3 font-medium">Latency</th><th className="px-4 py-3 font-medium">Reward</th><th className="px-6 py-3 font-medium">Status</th></tr></thead><tbody>{runs.map((run) => <tr key={run._id} className="border-t border-black/5"><td className="max-w-48 truncate px-6 py-4 font-semibold">{run.contentId?.title || 'Removed'}</td><td className="px-4 py-4 text-black/50">{run.userId?.email || 'Unknown'}</td><td className="px-4 py-4 text-black/50">{run.latencyMs} ms</td><td className="px-4 py-4">+{run.tokensAwarded}</td><td className="px-6 py-4"><Status value={run.status} /></td></tr>)}</tbody></table></div>}
        </article>
        <article className="panel p-6"><p className="eyebrow">Accounts</p><h2 className="mt-1 text-xl font-semibold">Member balances</h2>
          <div className="mt-4">{users.length === 0 ? <Empty>Admin access is required.</Empty> : users.map((member) => <div key={member._id} className="flex items-center justify-between border-b border-black/5 py-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-semibold">{member.email}</p><p className="mt-0.5 text-xs capitalize text-black/35">{member.role}</p></div><p className="ml-3 rounded-sm bg-brandYellow px-2 py-1 text-sm font-bold text-ink">{member.tokenBalance} TWT</p></div>)}</div>
        </article>
      </section>
    </>
  );
}
