// Tanglish: Login apram varra dashboard navigation, sidebar, header, and page layout.

import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Bell,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ClipboardList,
  Clock3,
  FilePlus2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings2,
  ShieldCheck,
  Star,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { Avatar, Brand } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import LanguageSelect from '../components/LanguageSelect.jsx';

const roleNavigation = {
  CUSTOMER: [
    {
      label: 'Workspace',
      items: [
        { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Find a pro', to: '/providers', icon: Search },
        { label: 'New request', to: '/requests/new', icon: FilePlus2 },
        { label: 'My requests', to: '/requests', icon: ClipboardList },
        { label: 'Service history', to: '/history', icon: Clock3 },
      ],
    },
    {
      label: 'Stay connected',
      items: [
        { label: 'Messages', to: '/inbox', icon: MessageCircle },
        { label: 'Notifications', to: '/notifications', icon: Bell },
      ],
    },
    { label: 'Account', items: [{ label: 'My profile', to: '/profile', icon: Settings2 }] },
  ],
  PROVIDER: [
    {
      label: 'Workspace',
      items: [
        { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Incoming jobs', to: '/requests', icon: Search },
        { label: 'My jobs', to: '/jobs', icon: BriefcaseBusiness },
        { label: 'Earnings', to: '/earnings', icon: ChartNoAxesColumnIncreasing },
        { label: 'Reviews', to: '/reviews', icon: Star },
      ],
    },
    {
      label: 'Stay connected',
      items: [
        { label: 'Messages', to: '/inbox', icon: MessageCircle },
        { label: 'Notifications', to: '/notifications', icon: Bell },
      ],
    },
    { label: 'Account', items: [{ label: 'Pro profile', to: '/profile', icon: Settings2 }] },
  ],
  ADMIN: [
    {
      label: 'Manage',
      items: [
        { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Users', to: '/admin/users', icon: Users },
        { label: 'Providers', to: '/admin/providers', icon: Wrench },
        { label: 'Requests', to: '/admin/requests', icon: ClipboardList },
        { label: 'Categories', to: '/admin/categories', icon: BriefcaseBusiness },
        { label: 'Reviews', to: '/admin/reviews', icon: Star },
        { label: 'Activity', to: '/admin/activity', icon: ShieldCheck },
      ],
    },
  ],
};

export default function AppShell() {
  const { user, logout, unread } = useAuth();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  const label =
    user?.role === 'PROVIDER'
      ? 'Pro workspace'
      : user?.role === 'ADMIN'
        ? 'Operations'
        : 'My workspace';
  return (
    <div className="app-layout">
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`app-sidebar ${mobileOpen ? 'app-sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button className="sidebar-close" onClick={() => setMobileOpen(false)}>
            <X size={19} />
          </button>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-avatar">
            {user?.role === 'ADMIN' ? (
              <ShieldCheck size={17} />
            ) : user?.role === 'PROVIDER' ? (
              <Wrench size={17} />
            ) : (
              '⌂'
            )}
          </span>
          <span>
            <b>{label}</b>
            <small>{user?.role?.toLowerCase()}</small>
          </span>
          <ChevronDown size={15} className="switch-caret" />
        </div>
        <nav className="sidebar-nav">
          {roleNavigation[user?.role]?.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-title">{t(group.label)}</span>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}>
                  <item.icon size={17} strokeWidth={1.8} />
                  <span>{t(item.label)}</span>
                  {item.label === 'Notifications' && unread > 0 && (
                    <span className="nav-count">{unread > 9 ? '9+' : unread}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <Link to="/" className="side-link app-home-link" onClick={() => setMobileOpen(false)}>
          <Home size={17} strokeWidth={1.8} />
          <span>{t('Back to home')}</span>
        </Link>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-spark">✦</span>
            <b>{t('Need a hand?')}</b>
            <p>{t('Find a request or message your pro.')}</p>
            <Link to="/contact">
              {t('Get help with a booking')} <span>↗</span>
            </Link>
          </div>
          <div className="sidebar-user">
            <Avatar name={user?.name || 'Q'} src={user?.avatar} />
            <div>
              <b>{user?.name}</b>
              <small>{user?.email}</small>
            </div>
            <button onClick={logout} aria-label={t('Log out')} title={t('Log out')}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label={t('Open navigation')}>
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>QuickFix</span>
            <b>/</b>
            <strong>
              {t(
                location.pathname.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') ||
                  'Overview',
              )}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="topbar-date">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <LanguageSelect />
            <Link
              className="icon-button topbar-bell"
              to="/notifications"
              aria-label={t('Notifications')}>
              <Bell size={18} />
              {unread > 0 && <i />}
            </Link>
            <div className="topbar-avatar">
              <Avatar name={user?.name || 'Q'} src={user?.avatar} size="sm" />
            </div>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>{t('Made for homes that run a little better.')}</span>
          <span>QuickFix · 2026</span>
        </footer>
      </div>
    </div>
  );
}
