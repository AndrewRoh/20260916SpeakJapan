import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/listening', label: '듣기 학습' },
  { to: '/books', label: '책 읽기' },
  { to: '/settings', label: '설정' },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-2xl items-center gap-1 px-4 py-3">
          <span className="mr-4 font-bold text-slate-900">日本語リスニング</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
