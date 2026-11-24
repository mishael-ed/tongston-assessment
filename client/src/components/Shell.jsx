const nav = [
  ['overview', 'Overview', 'overview'],
  ['content', 'Content & AI', 'content'],
  ['wallet', 'Token wallet', 'wallet'],
  ['activity', 'Activity', 'activity']
];

function MenuIcon({ name }) {
  const paths = {
    overview: <><path d="M3 10.8 12 3l9 7.8" /><path d="M5.5 9.5V21h13V9.5" /><path d="M9 21v-6h6v6" /></>,
    content: <><path d="M12 3v3" /><path d="M12 18v3" /><path d="m4.2 4.2 2.1 2.1" /><path d="m17.7 17.7 2.1 2.1" /><path d="M3 12h3" /><path d="M18 12h3" /><path d="m4.2 19.8 2.1-2.1" /><path d="m17.7 6.3 2.1-2.1" /><circle cx="12" cy="12" r="3.5" /></>,
    wallet: <><path d="M4 6.5h13.5A2.5 2.5 0 0 1 20 9v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" /><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" /><circle cx="16" cy="14" r=".6" fill="currentColor" stroke="none" /></>,
    activity: <><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19H2" /><path d="m3 7 6-4 6 5 6-5" /></>
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1d1d1b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flex: 'none' }}
    >
      {paths[name]}
    </svg>
  );
}

export function Shell({ user, active, onNavigate, onLogout, children }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-black/10 bg-white px-5 py-4 text-ink lg:fixed lg:inset-y-0 lg:w-[250px] lg:border-b-0 lg:border-r lg:border-black/10 lg:p-7">
        <div className="flex items-center justify-between lg:block">
          <img src="/tongston-logo.webp" alt="Tongston" className="h-auto w-44" />
          <button className="text-xs text-black/50 lg:hidden" onClick={onLogout}>Log out</button>
        </div>
        <nav className="mt-5 flex gap-2 overflow-x-auto lg:mt-14 lg:block lg:space-y-2">
          {nav.map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`group flex shrink-0 items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition lg:w-full ${active === key ? 'bg-brandYellow text-ink' : 'text-black/55 hover:bg-brandYellow/40 hover:text-ink'}`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center">
                <MenuIcon name={icon} />
              </span>
              {label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 hidden lg:block">
          <div className="rounded-md bg-ink p-4 text-white">
            <p className="truncate text-sm font-semibold">{user.email}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs capitalize text-white/50">{user.role}</span>
              <button className="text-xs text-white/60 hover:text-brandYellow" onClick={onLogout}>Log out</button>
            </div>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-5 sm:p-8 lg:col-start-2 lg:p-10 xl:p-12">{children}</main>
    </div>
  );
}

export function PageHeading({ kicker, title, description, action }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function Empty({ children }) {
  return <div className="rounded-xl border border-dashed border-black/15 px-5 py-10 text-center text-sm text-black/45">{children}</div>;
}
