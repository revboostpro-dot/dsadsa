import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart2, CreditCard, Settings } from 'lucide-react';
import useStore from '../store/useStore';

const NAV_ITEMS = [
  { id: 'nav-dashboard', path: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'nav-workers',   path: '/workers',  icon: Users,           label: 'Workers'   },
  { id: 'nav-reports',   path: '/reports',  icon: BarChart2,       label: 'Reports'   },
  { id: 'nav-payments',  path: '/payments', icon: CreditCard,      label: 'Payments'  },
  { id: 'nav-settings',  path: '/settings', icon: Settings,        label: 'Settings'  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { stats } = useStore();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 pt-2">
        {NAV_ITEMS.map(({ id, path, icon: Icon, label }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);

          // Show pending payments badge on payments tab
          const showBadge = path === '/payments' && stats?.pendingPayments > 0;

          return (
            <button
              key={path}
              id={id}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 relative
                ${isActive ? 'text-primary' : 'text-text-muted'}`}
            >
              <div className={`relative w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                isActive ? 'bg-primary/15' : ''
              }`}>
                <Icon
                  className={`transition-all duration-200 ${isActive ? 'w-5 h-5' : 'w-5 h-5'}`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {stats.pendingPayments > 9 ? '9+' : stats.pendingPayments}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-all ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
