import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, X, Bell, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Brand } from '../components/ui.jsx';
import PwaInstallButton from '../components/PwaInstallButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function PublicLayout({ children }) {
  const { user, unread, toast } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return <div className="public-site">
    <header className="site-header"><div className="site-header-inner"><Brand />
      <nav className={`public-nav ${open ? 'public-nav-open' : ''}`}>
        <NavLink to="/services" onClick={() => setOpen(false)}>Services</NavLink><NavLink to="/about" onClick={() => setOpen(false)}>How it works</NavLink><NavLink to="/contact" onClick={() => setOpen(false)}>Contact</NavLink>
        <PwaInstallButton toast={toast} compact className="mobile-only nav-install" />
        {user ? <Link to="/dashboard" className="mobile-only nav-dashboard">Dashboard <ArrowRight size={15} /></Link> : <Link to="/register" className="mobile-only nav-dashboard">Become a pro <ArrowRight size={15} /></Link>}
      </nav>
      <div className="site-actions">{user ? <><Link className="icon-button public-bell" aria-label="Notifications" to="/notifications"><Bell size={18} />{unread > 0 && <i />}</Link><button className="button button-dark site-dashboard" onClick={() => navigate('/dashboard')}><LayoutDashboard size={16} /> Dashboard</button></> : <><Link to="/login" className="login-link">Log in</Link><Link to="/register" className="button button-dark become-pro">Get started <ArrowRight size={16} /></Link></>}</div>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X /> : <Menu />}</button>
    </div></header>
    {children}
    <footer className="public-footer"><div className="footer-main"><div><Brand light /><p>Home repairs, made simple.<br />A better way to look after home.</p></div><div><span className="footer-label">Explore</span><Link to="/services">Services</Link><Link to="/about">How it works</Link><Link to="/contact">Contact us</Link></div><div><span className="footer-label">Get started</span><Link to="/register">Book a service</Link><Link to="/register?role=PROVIDER">Work with us</Link><Link to="/login">Sign in</Link></div><div className="footer-note"><span className="trust-dot" /> Locally trusted. Always nearby.<br /><small>© 2026 QuickFix Service Co.</small></div></div></footer>
  </div>;
}
