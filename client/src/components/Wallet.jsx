import { useState } from 'react';
import { api } from '../api.js';
import { Empty, PageHeading } from './Shell.jsx';
import { Status } from './Overview.jsx';

export function Wallet({ balance, conversions, transactions, onRefresh, notify }) {
  const [amount, setAmount] = useState(100);
  const [asset, setAsset] = useState('MOCK_USDT');
  const [busy, setBusy] = useState(false);

  async function convert(event) {
    event.preventDefault(); setBusy(true);
    try {
      const result = await api('/tokens/convert', { method: 'POST', body: JSON.stringify({ amount: Number(amount), toAsset: asset }) });
      notify(`Converted successfully: ${result.convertedAmount}`); onRefresh();
    } catch (error) { notify(error.message, true); } finally { setBusy(false); }
  }

  async function withdraw(conversionId) {
    setBusy(true);
    try {
      const result = await api('/tokens/withdraw', { method: 'POST', body: JSON.stringify({ conversionId }) });
      notify(`Withdrawal confirmed: ${result.txHashMock.slice(0, 18)}…`); onRefresh();
    } catch (error) { notify(error.message, true); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeading kicker="Rewards" title="Token wallet" description="Convert earned TWT into mock assets and simulate an on-chain withdrawal." />
      <section className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <article className="overflow-hidden rounded-2xl bg-ink p-7 text-white shadow-panel">
          <p className="text-sm text-white/60">Available balance</p><p className="mt-2 text-5xl font-semibold">{balance.toLocaleString()} <span className="text-lg text-brandYellow">TWT</span></p>
          <div className="mt-10 border-t border-white/10 pt-5 text-xs leading-5 text-white/40">Tokens are earned from successful AI runs. Each conversion is recorded in the immutable ledger.</div>
        </article>
        <form className="panel p-6" onSubmit={convert}>
          <p className="eyebrow">Convert tokens</p><h2 className="mt-1 text-xl font-semibold">Choose an asset</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label className="text-sm font-semibold">TWT amount</label><input className="field mt-2" type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div><label className="text-sm font-semibold">Receive</label><select className="field mt-2" value={asset} onChange={(event) => setAsset(event.target.value)}><option value="MOCK_USDT">MOCK USDT</option><option value="MOCK_ETH">MOCK ETH</option></select></div></div>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-cream p-3 text-sm"><span className="text-black/45">Estimated amount</span><strong>{asset === 'MOCK_USDT' ? amount * 0.01 : amount * 0.00005} {asset}</strong></div>
          <button className="btn-primary mt-5 w-full" disabled={busy || amount > balance}>{busy ? 'Processing…' : amount > balance ? 'Insufficient balance' : 'Convert tokens'}</button>
        </form>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="panel p-6"><p className="eyebrow">Asset positions</p><h2 className="mt-1 text-xl font-semibold">Conversions</h2>
          <div className="mt-4">{conversions.length === 0 ? <Empty>No conversions yet.</Empty> : conversions.map((conversion) => <div key={conversion._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 py-3 last:border-0"><div><p className="text-sm font-semibold">{conversion.convertedAmount} {conversion.toAsset}</p><p className="mt-0.5 text-xs text-black/35">{conversion.amount} TWT · {new Date(conversion.createdAt).toLocaleDateString()}</p></div><div className="flex items-center gap-2"><Status value={conversion.status} />{conversion.status === 'AVAILABLE' && <button className="btn-secondary !px-3 !py-1.5" disabled={busy} onClick={() => withdraw(conversion._id)}>Withdraw</button>}</div></div>)}</div>
        </article>
        <article className="panel p-6"><p className="eyebrow">Ledger</p><h2 className="mt-1 text-xl font-semibold">Recent movements</h2>
          <div className="mt-4">{transactions.length === 0 ? <Empty>No token movements yet.</Empty> : transactions.slice(0, 8).map((tx) => <div key={tx._id} className="flex items-center justify-between border-b border-black/5 py-3 last:border-0"><div><p className="text-sm font-semibold">{tx.type}</p><p className="text-xs text-black/35">{new Date(tx.createdAt).toLocaleString()}</p></div><div className="text-right"><p className={`text-sm font-semibold ${tx.amount > 0 ? 'inline-block bg-brandYellow px-1.5 py-0.5 text-ink' : ''}`}>{tx.amount > 0 ? '+' : ''}{tx.amount} TWT</p><p className="text-xs text-black/35">Balance {tx.balanceAfter}</p></div></div>)}</div>
        </article>
      </section>
    </>
  );
}
