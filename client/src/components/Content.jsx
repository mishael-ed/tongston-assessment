import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Empty, PageHeading } from './Shell.jsx';

export function Content({ items, onRefresh, onReward, notify, isAdmin }) {
  const [runningId, setRunningId] = useState('');
  const [options, setOptions] = useState({ tone: 'professional', length: 'medium' });
  const [result, setResult] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function runSummary(item) {
    setRunningId(item._id);
    setResult(null);
    try {
      const data = await api(`/content/${item._id}/ai/summarize`, { method: 'POST', body: JSON.stringify(options) });
      setResult({ title: item.title, ...data });
      onReward(data.totalTokenBalance);
      notify(data.usedFallback ? 'Provider unavailable — a fallback summary was returned.' : `Summary complete. You earned ${data.tokensAwarded} TWT.`);
    } catch (error) {
      notify(error.message, true);
    } finally {
      setRunningId('');
    }
  }

  return (
    <>
      <PageHeading kicker="Content library" title="Content & AI" description="Review source material and generate a concise version in the voice you need." action={isAdmin && <button className="btn-primary" onClick={() => setShowForm(true)}>New content</button>} />
      <div className="relative z-10 mb-6 flex flex-wrap gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-panel">
        <ChoiceMenu
          value={options.tone}
          options={[["professional", "Professional tone"], ["neutral", "Neutral tone"], ["friendly", "Friendly tone"]]}
          onChange={(tone) => setOptions({ ...options, tone })}
          width="w-48"
        />
        <ChoiceMenu
          value={options.length}
          options={[["short", "Short"], ["medium", "Medium"], ["long", "Long"]]}
          onChange={(length) => setOptions({ ...options, length })}
          width="w-36"
        />
      </div>
      {result && (
        <article className="mb-6 rounded-2xl border border-brandYellow bg-brandYellow/55 p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Latest summary</p><h2 className="mt-1 font-semibold">{result.title}</h2></div><button className="text-lg text-black/35" onClick={() => setResult(null)}>×</button></div>
          <p className="mt-4 max-w-4xl text-sm leading-7">{result.output}</p>
          <p className="mt-4 text-xs text-black/45">{result.latencyMs} ms · +{result.tokensAwarded} TWT {result.usedFallback && '· fallback used'}</p>
        </article>
      )}
      {items.length === 0 ? <Empty>No content has been added yet.</Empty> : (
        <section className="grid gap-5 xl:grid-cols-2">
          {items.map((item) => (
            <article key={item._id} className="panel flex flex-col p-6">
              <div className="flex flex-wrap gap-2">{item.tags.map((tag) => <span key={tag} className="rounded-md bg-brandYellow px-2.5 py-1 text-[11px] font-bold text-ink">{tag}</span>)}</div>
              <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-black/55">{item.body}</p>
              <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
                <p className="text-xs text-black/35">{new Date(item.createdAt).toLocaleDateString()}</p>
                <button className="btn-primary" disabled={Boolean(runningId)} onClick={() => runSummary(item)}>{runningId === item._id ? 'Summarizing…' : 'Summarize ✦'}</button>
              </div>
            </article>
          ))}
        </section>
      )}
      {showForm && <ContentForm onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); onRefresh(); notify('Content item created.'); }} notify={notify} />}
    </>
  );
}

function ChoiceMenu({ value, options, onChange, width }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const selected = options.find(([key]) => key === value);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className={`relative ${width}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between rounded-md border bg-white px-4 py-2.5 text-left text-sm font-medium transition ${open ? 'border-brandYellow ring-2 ring-brandYellow/20' : 'border-black/10 hover:border-brandYellow'}`}
      >
        <span>{selected?.[1]}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`ml-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-md border border-black/10 bg-white p-1.5 shadow-[0_18px_45px_rgba(29,29,27,0.16)]">
          {options.map(([key, label]) => {
            const isSelected = key === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                key={key}
                onClick={() => { onChange(key); setOpen(false); }}
                className={`flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-sm transition ${isSelected ? 'bg-brandYellow font-semibold text-ink' : 'text-black/65 hover:bg-brandYellow/30 hover:text-ink'}`}
              >
                {label}
                {isSelected && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContentForm({ onClose, onCreated, notify }) {
  const [form, setForm] = useState({ title: '', body: '', tags: '' });
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      await api('/content', { method: 'POST', body: JSON.stringify({ title: form.title, body: form.body, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) }) });
      onCreated();
    } catch (error) { notify(error.message, true); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/60 p-4" onMouseDown={onClose}>
      <form className="w-full max-w-xl rounded-2xl bg-cream p-6 shadow-2xl" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex justify-between"><div><p className="eyebrow">Library</p><h2 className="mt-1 text-2xl font-semibold">Add content</h2></div><button type="button" onClick={onClose}>×</button></div>
        <label className="mt-6 block text-sm font-semibold">Title</label><input className="field mt-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength="3" required />
        <label className="mt-4 block text-sm font-semibold">Body</label><textarea className="field mt-2 min-h-40 resize-y" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} minLength="20" required />
        <label className="mt-4 block text-sm font-semibold">Tags <span className="font-normal text-black/35">(comma separated)</span></label><input className="field mt-2" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
        <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save content'}</button></div>
      </form>
    </div>
  );
}
