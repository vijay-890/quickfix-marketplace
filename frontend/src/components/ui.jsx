// Tanglish: Pages ellam reuse pannura buttons, forms, loaders, errors, cards, badges.

import { Link } from 'react-router-dom';
import { assetUrl } from '../services/api.js';
import { AlertCircle, ArrowUpRight, LoaderCircle, Star } from 'lucide-react';
import { Children, cloneElement, isValidElement } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

function localizedChildren(children, t) {
  return Children.map(children, (child) => {
    if (typeof child === 'string') return t(child);
    if (isValidElement(child) && child.props.children)
      return cloneElement(child, {}, localizedChildren(child.props.children, t));
    return child;
  });
}

// Tanglish: Reusable brand mark and button components.
export function Brand({ light = false, compact = false }) {
  return (
    <Link
      to="/"
      className={`brand ${light ? 'brand-light' : ''} ${compact ? 'brand-compact' : ''}`}
      aria-label="QuickFix home">
      <img className="brand-image" src="/quickfix-mark.svg" alt="" />
      <span>
        QuickFix<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
export function Button({ children, variant = 'primary', className = '', ...props }) {
  const { t } = useLanguage();
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {localizedChildren(children, t)}
    </button>
  );
}
// Tanglish: Loading, error, and empty screen feedback components.
export function PageLoader({ label = 'Getting things ready' }) {
  const { t } = useLanguage();
  return (
    <div className="page-loader">
      <LoaderCircle size={23} className="spin" />
      <span>{t(label)}</span>
    </div>
  );
}
export function ErrorState({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="error-state">
      <span className="error-icon">
        <AlertCircle size={20} />
      </span>
      <div>
        <b>{t('We couldn’t load that')}</b>
        <p>{t(message)}</p>
        {onRetry && (
          <button className="text-button" onClick={onRetry}>
            {t('Try again')}
          </button>
        )}
      </div>
    </div>
  );
}
export function EmptyState({ icon = '✦', title, copy, action, to }) {
  const { t } = useLanguage();
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{t(title)}</h3>
      <p>{t(copy)}</p>
      {action && (
        <Link className="button button-primary" to={to || '/dashboard'}>
          {t(action)}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
// Tanglish: Shared form input, avatar, and status badge components.
export function Field({ label, hint, error, className = '', ...props }) {
  const { t } = useLanguage();
  const { as, children, ...inputProps } = props;
  const localizedProps = {
    ...inputProps,
    placeholder: inputProps.placeholder ? t(inputProps.placeholder) : undefined,
  };
  const localizedOptions = Children.map(children, (child) =>
    typeof child === 'string' ? t(child) : child,
  );
  return (
    <label className={`field ${className}`}>
      <span>{t(label)}</span>
      {as === 'textarea' ? (
        <textarea {...localizedProps} />
      ) : as === 'select' ? (
        <select {...localizedProps}>{localizedOptions}</select>
      ) : (
        <input {...localizedProps} />
      )}
      {hint && <small>{t(hint)}</small>}
      {error && <small className="field-error">{t(error)}</small>}
    </label>
  );
}
export function Avatar({ name = 'QuickFix', src, size = 'md' }) {
  return (
    <span className={`avatar avatar-${size}`}>
      {src ? (
        <img src={assetUrl(src)} alt="" />
      ) : (
        name
          .split(' ')
          .map((x) => x[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'Q'
      )}
    </span>
  );
}
export function StatusPill({ status }) {
  const { t } = useLanguage();
  const tone = ['COMPLETED', 'ONLINE'].includes(status)
    ? 'green'
    : ['CANCELLED', 'OFFLINE'].includes(status)
      ? 'muted'
      : ['STARTED', 'PROVIDER_ON_THE_WAY', 'BUSY'].includes(status)
        ? 'amber'
        : 'blue';
  return (
    <span className={`status-pill tone-${tone}`}>
      <i />
      {t(
        String(status || '')
          .replaceAll('_', ' ')
          .toLowerCase(),
      )}
    </span>
  );
}
// Tanglish: Review star rating, prices, and section heading components.
export function Stars({ value = 0, count }) {
  return (
    <span className="stars">
      <Star size={14} fill="currentColor" /> {Number(value).toFixed(1)}
      {count !== undefined && <span className="stars-count">({count})</span>}
    </span>
  );
}
export function Price({ value }) {
  return <span className="price">₹{Number(value || 0).toLocaleString('en-IN')}</span>;
}
export function SectionTitle({ eyebrow, title, copy, action }) {
  const { t } = useLanguage();
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{t(eyebrow)}</span>}
        <h1>{t(title)}</h1>
        {copy && <p>{t(copy)}</p>}
      </div>
      {action}
    </div>
  );
}
// Tanglish: Loading placeholders, form errors, request cards, and pagination.
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}
export function FormError({ children }) {
  return children ? (
    <div className="form-error">
      <AlertCircle size={17} />
      {children}
    </div>
  ) : null;
}
export function RequestCard({ request, action }) {
  const { t } = useLanguage();
  const id = request._id;
  return (
    <article className="request-card">
      <Link to={`/requests/${id}`} className="request-card-link">
        <div className="request-card-icon">{request.category?.icon || '🔧'}</div>
        <div className="request-card-main">
          <div className="request-card-heading">
            <div>
              <h3>{request.title}</h3>
              <p>
                {t(request.category?.name || 'Home service')}
                {request.city ? ` · ${request.city}` : ''}
              </p>
            </div>
            <StatusPill status={request.status} />
          </div>
          <div className="request-card-foot">
            <span>
              {t('Updated')}{' '}
              {new Date(request.updatedAt || request.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <Price value={request.budget} />
          </div>
        </div>
      </Link>
      {action && <div className="request-card-action">{action}</div>}
    </article>
  );
}
export function PageControls({ pagination, onChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const page = pagination.page,
    pages = pagination.pages;
  const start = Math.max(1, Math.min(page - 2, pages - 4)),
    end = Math.min(pages, start + 4);
  return (
    <nav className="pagination" aria-label="Page navigation">
      <span>{pagination.total} results</span>
      <div>
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          ‹
        </button>
        {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((number) => (
          <button
            key={number}
            onClick={() => onChange(number)}
            aria-current={page === number ? 'page' : undefined}>
            {number}
          </button>
        ))}
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          ›
        </button>
      </div>
    </nav>
  );
}
