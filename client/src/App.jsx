import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { Login } from './components/Login.jsx';
import { Shell } from './components/Shell.jsx';
import { Overview } from './components/Overview.jsx';
import { Content } from './components/Content.jsx';
import { Wallet } from './components/Wallet.jsx';
import { Activity } from './components/Activity.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState('overview');
  const [content, setContent] = useState([]);
  const [users, setUsers] = useState([]);
  const [runs, setRuns] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('tworld_token')));
  const [notice, setNotice] = useState(null);

  const notify = useCallback((message, error = false) => {
    setNotice({ message, error });
    window.setTimeout(() => setNotice(null), 4500);
  }, []);

  const loadData = useCallback(async (currentUser) => {
    const isAdmin = currentUser?.role === 'admin';
    const requests = [api('/content?limit=50'), api('/tokens/balance'), api('/tokens/history?limit=100')];
    if (isAdmin) requests.push(api('/admin/users'), api('/admin/ai-runs'));
    const [contentData, walletData, historyData, userData, runData] = await Promise.all(requests);
    setContent(contentData.items); setConversions(walletData.conversions); setTransactions(historyData.transactions);
    setUser((value) => ({ ...value, tokenBalance: walletData.tokenBalance }));
    if (isAdmin) { setUsers(userData.users); setRuns(runData.runs); }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('tworld_token')) return;
    api('/auth/me').then(({ user: me }) => { setUser(me); return loadData(me); }).catch(() => localStorage.removeItem('tworld_token')).finally(() => setLoading(false));
  }, [loadData]);

  function loggedIn(account) { setUser(account); setLoading(true); loadData(account).catch((error) => notify(error.message, true)).finally(() => setLoading(false)); }
  function logout() { localStorage.removeItem('tworld_token'); setUser(null); setContent([]); setUsers([]); setRuns([]); }
  function refresh() { return loadData(user).catch((error) => notify(error.message, true)); }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-ink"><span className="mr-2 inline-block h-2.5 w-2.5 bg-brandYellow" />Loading T-World…</div>;
  if (!user) return <Login onLogin={loggedIn} />;

  return (
    <Shell user={user} active={active} onNavigate={setActive} onLogout={logout}>
      {active === 'overview' && <Overview user={user} content={content} users={users} runs={runs} onNavigate={setActive} />}
      {active === 'content' && <Content items={content} onRefresh={refresh} onReward={(balance) => { setUser({ ...user, tokenBalance: balance }); refresh(); }} notify={notify} isAdmin={user.role === 'admin'} />}
      {active === 'wallet' && <Wallet balance={user.tokenBalance} conversions={conversions} transactions={transactions} onRefresh={refresh} notify={notify} />}
      {active === 'activity' && <Activity runs={runs} users={users} />}
      {notice && <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-md border-l-4 border-brandYellow bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl">{notice.message}</div>}
    </Shell>
  );
}
