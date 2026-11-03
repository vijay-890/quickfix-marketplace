// Tanglish: Login, register, and auth form screens.

import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { Brand, Button, Field, FormError } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errorText } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';

// Tanglish: Login/register form-ku shared layout and visual frame.
export function AuthFrame({ children, mode }) {
  const { t } = useLanguage();
  return (
    <main className="auth-page">
      <section className="auth-side">
        <Link to="/" className="auth-back">
          <ArrowLeft size={16} /> {t('Back to QuickFix')}
        </Link>
        <div className="auth-side-inner">
          <span className="auth-decoration">✳</span>
          <span className="eyebrow">{t('LOCAL HELP, A BETTER WAY')}</span>
          <h1>
            {t('Make room')}
            <br />
            {t('for')} <em>{t('life at home.')}</em>
          </h1>
          <p>
            {t(
              'We’ll match you with people who care about the work as much as you care about home.',
            )}
          </p>
          <div className="auth-side-proof">
            <span>
              <ShieldCheck size={16} /> {t('Profiles shaped by real jobs')}
            </span>
            <span>
              <Check size={16} /> {t('Real-time progress and updates')}
            </span>
          </div>
        </div>
        <div className="auth-side-footer">
          <Brand light />
          <span>{t('Good work lives close to home.')}</span>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-card">
          <span className="eyebrow">
            {t(mode === 'login' ? 'WELCOME BACK' : 'LET’S GET YOU STARTED')}
          </span>
          {children}
        </div>
        <p className="auth-legal">
          {t('Your account details are used to manage QuickFix marketplace services.')}
        </p>
      </section>
    </main>
  );
}

// Tanglish: Customer/provider account login submit pannura screen.
export function Login() {
  const { t } = useLanguage();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '' }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const account = await login(values);
      navigate('/dashboard', { replace: true, state: { role: account.role } });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthFrame mode="login">
      <h2>{t('Good to see you.')}</h2>
      <p className="auth-description">{t('Sign in to pick up where you left off.')}</p>
      <form className="auth-form" onSubmit={submit}>
        <FormError>{error}</FormError>
        <Field
          label={t('Email address')}
          type="email"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <label className="field">
          <span>{t('Password')}</span>
          <div className="password-input">
            <input
              value={values.password}
              onChange={(e) => setValues({ ...values, password: e.target.value })}
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              aria-label={t(show ? 'Hide password' : 'Show password')}
              onClick={() => setShow(!show)}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <div className="auth-form-meta">
          <span>
            {t('Protected account access')} <ShieldCheck size={14} />
          </span>
        </div>
        <Button type="submit" disabled={busy} className="auth-submit">
          {t(busy ? 'Signing in…' : 'Sign in')} {!busy && <ArrowRight size={17} />}
        </Button>
      </form>
      <p className="auth-switch">
        {t('New to QuickFix?')} <Link to="/register">{t('Create an account')}</Link>
      </p>
    </AuthFrame>
  );
}

// Tanglish: Pudhu customer/provider account create pannura screen.
export function Register() {
  const { t } = useLanguage();
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [role, setRole] = useState(search.get('role') === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER');
  const [values, setValues] = useState({ name: '', email: '', password: '' }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const account = await register({ ...values, role });
      navigate('/dashboard', { replace: true, state: { role: account.role } });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthFrame mode="register">
      <h2>
        {t('Your next good day')}
        <br />
        {t('starts here.')}
      </h2>
      <p className="auth-description">
        {t('Join the neighbourhood network that gets things done.')}
      </p>
      <div className="role-picker" role="tablist" aria-label={t('Account type')}>
        <button
          onClick={() => setRole('CUSTOMER')}
          className={role === 'CUSTOMER' ? 'role-selected' : ''}
          role="tab"
          aria-selected={role === 'CUSTOMER'}>
          <span>⌂</span>
          <b>{t('Book a service')}</b>
        </button>
        <button
          onClick={() => setRole('PROVIDER')}
          className={role === 'PROVIDER' ? 'role-selected' : ''}
          role="tab"
          aria-selected={role === 'PROVIDER'}>
          <span>✦</span>
          <b>{t('Join as a pro')}</b>
        </button>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <FormError>{error}</FormError>
        <Field
          label={t('Your name')}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          placeholder={t('How should we call you?')}
          autoComplete="name"
          minLength="2"
          maxLength="80"
          required
        />
        <Field
          label={t('Email address')}
          type="email"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <label className="field">
          <span>{t('Create a password')}</span>
          <div className="password-input">
            <input
              value={values.password}
              onChange={(e) => setValues({ ...values, password: e.target.value })}
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              minLength="8"
              required
            />
            <button
              type="button"
              aria-label={t(show ? 'Hide password' : 'Show password')}
              onClick={() => setShow(!show)}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <small>{t('At least 8 characters.')}</small>
        </label>
        <Button type="submit" disabled={busy} className="auth-submit">
          {t(busy ? 'Creating account…' : 'Create my account')} {!busy && <ArrowRight size={17} />}
        </Button>
      </form>
      <p className="auth-switch">
        {t('Already with QuickFix?')} <Link to="/login">{t('Sign in')}</Link>
      </p>
      <div className="auth-secure">
        <Sparkles size={15} />{' '}
        {t(
          role === 'PROVIDER'
            ? 'Set up your service profile right after joining.'
            : 'Free to join, easy to use.',
        )}
      </div>
    </AuthFrame>
  );
}
