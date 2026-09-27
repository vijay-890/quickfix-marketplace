import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, LoaderCircle, Star } from 'lucide-react';

export function Brand({ light = false, compact = false }) {
  return <Link to="/" className={`brand ${light ? 'brand-light' : ''} ${compact ? 'brand-compact' : ''}`} aria-label="QuickFix home"><img className="brand-image" src="/quickfix-mark.svg" alt="" /><span>QuickFix<span className="brand-dot">.</span></span></Link>;
}
export function Button({ children, variant = 'primary', className = '', ...props }) { return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>; }
export function PageLoader({ label = 'Getting things ready' }) { return <div className="page-loader"><LoaderCircle size={23} className="spin" /><span>{label}</span></div>; }
export function ErrorState({ message, onRetry }) { return <div className="error-state"><span className="error-icon"><AlertCircle size={20} /></span><div><b>We couldn’t load that</b><p>{message}</p>{onRetry && <button className="text-button" onClick={onRetry}>Try again</button>}</div></div>; }
export function EmptyState({ icon = '✦', title, copy, action, to }) { return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{copy}</p>{action && <Link className="button button-primary" to={to || '/dashboard'}>{action}<ArrowUpRight size={16} /></Link>}</div>; }
export function Field({ label, hint, error, className = '', ...props }) {
  const { as, children, ...inputProps } = props;
  return <label className={`field ${className}`}><span>{label}</span>{as === 'textarea' ? <textarea {...inputProps} /> : as === 'select' ? <select {...inputProps}>{children}</select> : <input {...inputProps} />}{hint && <small>{hint}</small>}{error && <small className="field-error">{error}</small>}</label>;
}
export function Avatar({ name = 'QuickFix', src, size = 'md' }) { return <span className={`avatar avatar-${size}`}>{src ? <img src={src} alt="" /> : (name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'Q')}</span>; }
export function StatusPill({ status }) { const tone = ['COMPLETED', 'ONLINE'].includes(status) ? 'green' : ['CANCELLED', 'OFFLINE'].includes(status) ? 'muted' : ['STARTED', 'PROVIDER_ON_THE_WAY', 'BUSY'].includes(status) ? 'amber' : 'blue'; return <span className={`status-pill tone-${tone}`}><i />{String(status || '').replaceAll('_', ' ').toLowerCase()}</span>; }
export function Stars({ value = 0, count }) { return <span className="stars"><Star size={14} fill="currentColor" /> {Number(value).toFixed(1)}{count !== undefined && <span className="stars-count">({count})</span>}</span>; }
export function Price({ value }) { return <span className="price">₹{Number(value || 0).toLocaleString('en-IN')}</span>; }
export function SectionTitle({ eyebrow, title, copy, action }) { return <div className="section-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</div>; }
export function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} />; }
export function FormError({ children }) { return children ? <div className="form-error"><AlertCircle size={17} />{children}</div> : null; }
export function RequestCard({ request, action }) {
  const id = request._id;
  return <article className="request-card"><Link to={`/requests/${id}`} className="request-card-link"><div className="request-card-icon">{request.category?.icon || '🔧'}</div><div className="request-card-main"><div className="request-card-heading"><div><h3>{request.title}</h3><p>{request.category?.name || 'Home service'}{request.city ? ` · ${request.city}` : ''}</p></div><StatusPill status={request.status} /></div><div className="request-card-foot"><span>Updated {new Date(request.updatedAt || request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span><Price value={request.budget} /></div></div></Link>{action && <div className="request-card-action">{action}</div>}</article>;
}
export function PageControls({ pagination, onChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const page = pagination.page, pages = pagination.pages;
  const start = Math.max(1, Math.min(page - 2, pages - 4)), end = Math.min(pages, start + 4);
  return <nav className="pagination" aria-label="Page navigation"><span>{pagination.total} results</span><div><button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">‹</button>{Array.from({ length: end - start + 1 }, (_, i) => start + i).map(number => <button key={number} onClick={() => onChange(number)} aria-current={page === number ? 'page' : undefined}>{number}</button>)}<button disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">›</button></div></nav>;
}
