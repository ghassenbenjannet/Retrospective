import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, Users, FileText, PlayCircle, CheckSquare, LogOut, Zap, Settings } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/templates', label: 'Templates',       icon: FileText,  adminOnly: true },
  { to: '/sessions',  label: 'Sessions',        icon: PlayCircle },
  { to: '/actions',   label: 'Actions',         icon: CheckSquare },
  { to: '/users',     label: 'Utilisateurs',    icon: Users,     adminOnly: true },
  { to: '/settings',  label: 'Paramètres',      icon: Settings,  adminOnly: true },
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-white border-r border-gray-100 shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-none">Retrospective</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">Live collaboration</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems
            .filter(item => !item.adminOnly || user?.role === 'admin')
            .map(({ to, label, icon: Icon }) => {
              const active = pathname.startsWith(to);
              return (
                <Link key={to} to={to}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}>
                  <Icon size={16} className={active ? 'text-indigo-600' : 'text-gray-400'} />
                  {label}
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </Link>
              );
            })}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.role === 'admin' ? 'Administrateur' : 'Collaborateur'}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
            <LogOut size={15} />Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
