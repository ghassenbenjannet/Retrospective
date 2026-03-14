import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, Users, FileText, PlayCircle, CheckSquare, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useLocation } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/templates', label: 'Templates', icon: FileText, adminOnly: true },
  { to: '/sessions', label: 'Sessions', icon: PlayCircle },
  { to: '/actions', label: 'Actions', icon: CheckSquare },
  { to: '/users', label: 'Utilisateurs', icon: Users, adminOnly: true },
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Retrospective</h1>
          <p className="text-xs text-gray-500 mt-1 truncate">{user?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems
            .filter(item => !item.adminOnly || user?.role === 'admin')
            .map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Déconnexion
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
