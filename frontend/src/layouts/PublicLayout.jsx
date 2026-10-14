import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, X, Bell, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Brand } from '../components/ui.jsx';
import PwaInstallButton from '../components/PwaInstallButton.jsx';
import LanguageSelect from '../components/LanguageSelect.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function PublicLayout({ children }) {
  const { user, unread, toast } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return <div className="public-site">
    <header className="site-header"><div className="site-header-inner"><Brand />
      <nav className={`public-nav ${open ? 'public-nav-open' : ''}`}>
        <NavLink to="/services" onClick={() => setOpen(false)}>{t('Services')}</NavLink><NavLink to="/about" onClick={() => setOpen(false)}>{t('How it works')}</NavLink><NavLink to="/contact" onClick={() => setOpen(false)}>{t('Contact')}</NavLink>
        <PwaInstallButton toast={toast} compact className="mobile-only nav-install" />
        {user ? <Link to="/dashboard" className="mobile-only nav-dashboard">{t('Dashboard')} <ArrowRight size={15} /></Link> : <Link to="/register" className="mobile-only nav-dashboard">{t('Become a pro')} <ArrowRight size={15} /></Link>}
      </nav>
      <div className="site-actions"><LanguageSelect />{user ? <><Link className="icon-button public-bell" aria-label={t('Notifications')} to="/notifications"><Bell size={18} />{unread > 0 && <i />}</Link><button className="button button-dark site-dashboard" onClick={() => navigate('/dashboard')}><LayoutDashboard size={16} /> {t('Dashboard')}</button></> : <><Link to="/login" className="login-link">{t('Log in')}</Link><Link to="/register" className="button button-dark become-pro">{t('Get started')} <ArrowRight size={16} /></Link></>}</div>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X /> : <Menu />}</button>
    </div></header>
    {children}
    <footer className="public-footer"><div className="footer-main"><div><Brand light /><p>{t('Home repairs, made simple.')}<br />{t('A better way to look after home.')}</p></div><div><span className="footer-label">{t('Explore')}</span><Link to="/services">{t('Services')}</Link><Link to="/about">{t('How it works')}</Link><Link to="/contact">{t('Contact us')}</Link></div><div><span className="footer-label">{t('Get started')}</span><Link to="/register">{t('Book a service')}</Link><Link to="/register?role=PROVIDER">{t('Work with us')}</Link><Link to="/login">{t('Sign in')}</Link></div><div className="footer-note"><span className="trust-dot" /> {t('Locally trusted. Always nearby.')}<br /><small>© 2026 QuickFix Service Co.</small></div></div></footer>
  </div>;
}
