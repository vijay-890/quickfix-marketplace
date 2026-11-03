// Tanglish: Login pannama paakra home, services, category, provider profile, about, contact screens.

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  HeartHandshake,
  Home as HomeIcon,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react';
import api, { dataOf, errorText } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  PageLoader,
  Price,
  SectionTitle,
  Stars,
  StatusPill,
} from '../components/ui.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const howSteps = [
  {
    number: '01',
    title: 'Tell us what needs fixing',
    copy: 'Pick a service, describe the job, and set a budget that works for you.',
  },
  {
    number: '02',
    title: 'A local pro picks it up',
    copy: 'Nearby pros see your request. Once one accepts, you can chat directly.',
  },
  {
    number: '03',
    title: 'Home, back in order',
    copy: 'Follow the job live, then rate your pro when everything’s done.',
  },
];

// Tanglish: Landing page: service intro, popular categories, and main action.
export function Home() {
  const [categories, setCategories] = useState([]),
    [city, setCity] = useState('');
  const { t } = useLanguage();
  const navigate = useNavigate();
  useEffect(() => {
    api
      .get('/services')
      .then(({ data }) => setCategories(data.data))
      .catch(() => {});
  }, []);
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="live-dot" /> {t('THE NEIGHBOURHOOD SERVICE MARKETPLACE')}
            </div>
            <h1>
              {t('Home repairs.')}
              <br />
              <span>{t('Made simple.')}</span>
            </h1>
            <p>
              {t(
                'Book trusted local professionals for repairs, maintenance and everyday home services.',
              )}
            </p>
            <div className="hero-search">
              <label className="hero-search-service">
                <Wrench size={18} />
                <select aria-label={t('Choose a service')} defaultValue="">
                  <option value="">{t('What needs fixing?')}</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {t(c.name)}
                    </option>
                  ))}
                </select>
              </label>
              <span className="search-divider" />
              <label className="hero-search-location">
                <MapPin size={18} />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('Your neighbourhood')}
                  aria-label={t('Your neighbourhood')}
                />
              </label>
              <button
                onClick={(e) => {
                  const category = e.currentTarget.parentElement.querySelector('select').value;
                  navigate(
                    `/providers${category || city ? `?${new URLSearchParams({ ...(category ? { category } : {}), ...(city ? { location: city } : {}) })}` : ''}`,
                  );
                }}
                aria-label={t('Search services')}>
                <ArrowRight size={21} />
              </button>
            </div>
            <div className="hero-trust">
              <div className="hero-avatars">
                <Avatar name="Asha" size="xs" />
                <Avatar name="Ravi" size="xs" />
                <Avatar name="Dev" size="xs" />
              </div>
              <span>
                <b>{t('Trusted nearby.')}</b> {t('Here when you need us.')}
              </span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-sun">✳</div>
            <div className="hero-house">
              <div className="house-roof" />
              <div className="house-body">
                <div className="house-window window-left" />
                <div className="house-door" />
                <div className="house-window window-right" />
              </div>
              <div className="house-base" />
            </div>
            <div className="hero-tool tool-hammer">🔨</div>
            <div className="hero-tool tool-spark">✦</div>
            <div className="hero-floating-card">
              <span className="floating-icon">✓</span>
              <span>
                <b>{t('Pro accepted')}</b>
                <small>{t('Just now · 2.4 km away')}</small>
              </span>
              <span className="floating-live" />
            </div>
            <div className="hero-art-label">{t('A little help goes a long way.')}</div>
          </div>
        </div>
        <div className="hero-bottom">
          <span>{t('For the everyday. And the unexpected.')}</span>
          <ArrowDownRight size={19} />
        </div>
      </section>
      <section className="section-wrap services-preview">
        <div className="section-topline">
          <div>
            <span className="eyebrow">{t('HOW CAN WE HELP?')}</span>
            <h2>
              {t('The right person for')}
              <br />
              <em>{t('little big things.')}</em>
            </h2>
          </div>
          <Link to="/services" className="underlined-link">
            {t('Explore all services')} <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.slice(0, 4).map((category, i) => (
            <Link
              to={`/services/${category.slug}`}
              className={`category-tile category-tile-${i}`}
              key={category._id}>
              <span className="category-icon">{category.icon}</span>
              <h3>{t(category.name)}</h3>
              <p>{t(category.description)}</p>
              <span className="category-arrow">
                <ArrowRight size={17} />
              </span>
            </Link>
          ))}
          {categories.length === 0 && (
            <div className="category-skeletons">
              {[1, 2, 3, 4].map((x) => (
                <div key={x} className="skeleton category-skeleton" />
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="trust-strip">
        <div className="trust-strip-inner">
          <div>
            <ShieldCheck />
            <span>
              <b>{t('Local professionals')}</b>
              <small>{t('Profiles shaped by real jobs')}</small>
            </span>
          </div>
          <div>
            <Clock3 />
            <span>
              <b>{t('Help that moves fast')}</b>
              <small>{t('Real-time updates, no guesswork')}</small>
            </span>
          </div>
          <div>
            <HeartHandshake />
            <span>
              <b>{t('Honest customer reviews')}</b>
              <small>{t('Feedback tied to completed work')}</small>
            </span>
          </div>
        </div>
      </section>
      <section className="section-wrap how-section">
        <div className="how-heading">
          <span className="eyebrow">{t('A BETTER WAY TO GET IT DONE')}</span>
          <h2>
            {t('Three steps.')}
            <br />
            <em>{t('One less thing')}</em>
            <br />
            {t('on your list.')}
          </h2>
          <p>{t('From the first tap to the final check, we keep the small stuff simple.')}</p>
          <Link to="/about" className="button button-outline">
            {t('See how it works')} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="steps-list">
          {howSteps.map((step, i) => (
            <div className="step-row" key={step.number}>
              <span className={`step-number step-number-${i}`}>{step.number}</span>
              <div>
                <h3>{t(step.title)}</h3>
                <p>{t(step.copy)}</p>
              </div>
              <span className="step-check">
                <Check size={15} />
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="cta-band">
        <div className="cta-shape">✳</div>
        <div>
          <span className="eyebrow">{t('A GOOD DAY STARTS HERE')}</span>
          <h2>{t('Home should feel like home.')}</h2>
          <p>{t('Let’s take one thing off your list.')}</p>
        </div>
        <Link to="/register" className="button button-light">
          {t('Find your local pro')} <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}

// Tanglish: Available service categories and provider search screen.
export function Services() {
  const { t } = useLanguage();
  const { data, loading, error, refresh } = useServices();
  return (
    <main className="marketing-page">
      <div className="marketing-heading">
        <span className="eyebrow">{t('LOCAL HANDS. THOUGHTFUL WORK.')}</span>
        <h1>
          {t('A good pro for')}
          <br />
          <em>{t('whatever comes up.')}</em>
        </h1>
        <p>
          {t('Everyday fixes, home resets, and the projects you’ve had on the list for a while.')}
        </p>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <PageLoader />
      ) : (
        <div className="service-directory">
          {data.map((category, i) => (
            <Link
              to={`/services/${category.slug}`}
              key={category._id}
              className={`directory-card directory-${i % 4}`}>
              <span className="directory-emoji">{category.icon}</span>
              <span className="directory-card-copy">
                <small>
                  {t('SERVICE')} {String(i + 1).padStart(2, '0')}
                </small>
                <b>{t(category.name)}</b>
                <span>{t(category.description)}</span>
              </span>
              <ArrowUpRight size={19} />
            </Link>
          ))}
        </div>
      )}
      <div className="directory-footer">
        <span>{t('Don’t see your job?')}</span>
        <Link to="/contact">
          {t('Tell us what you need')} <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}

// Tanglish: Category and provider data fetch panna shared hook.
function useServices() {
  const [data, setData] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const refresh = () => {
    setLoading(true);
    api
      .get('/services')
      .then(({ data: d }) => setData(d.data))
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false));
  };
  useEffect(refresh, []);
  return { data, loading, error, refresh };
}

// Tanglish: Selected category-ku matching service providers list.
export function CategoryPage() {
  const { t } = useLanguage();
  const { slug } = useParams();
  const { user } = useAuth();
  const [category, setCategory] = useState(null),
    [providers, setProviders] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/services')
      .then(async ({ data }) => {
        const found = data.data.find((x) => x.slug === slug);
        if (!active) return;
        setCategory(found || null);
        if (found) {
          const { data: results } = await api.get('/providers', {
            params: { category: found._id, limit: 12 },
          });
          if (active) setProviders(results.data.items);
        }
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  if (loading)
    return (
      <main className="marketing-page">
        <PageLoader />
      </main>
    );
  if (error)
    return (
      <main className="marketing-page">
        <ErrorState message={error} />
      </main>
    );
  if (!category)
    return (
      <main className="marketing-page">
        <EmptyState
          title="That service isn’t here"
          copy="Try another service or browse our full list."
          action="Browse services"
          to="/services"
        />
      </main>
    );
  const bookingPath =
    user?.role === 'CUSTOMER'
      ? `/requests/new?category=${category._id}`
      : user
        ? '/dashboard'
        : '/register';
  return (
    <main className="marketing-page category-page">
      <div className="category-detail-hero">
        <span className="category-detail-emoji">{category.icon}</span>
        <span className="eyebrow">{t('QUICKFIX SERVICES')}</span>
        <h1>
          {t(category.name)},<br />
          <em>{t('handled with care.')}</em>
        </h1>
        <p>{t(category.description)}</p>
        <Link to={bookingPath} className="button button-dark">
          {t('Request this service')} <ArrowRight size={16} />
        </Link>
      </div>
      <section className="category-pros">
        <div className="section-title">
          <div>
            <span className="eyebrow">{t('YOUR LOCAL PROS')}</span>
            <h2>{t('Available specialists')}</h2>
          </div>
          <span className="results-count">{providers.length} pros online</span>
        </div>
        {providers.length ? (
          <div className="provider-grid">
            {providers.map((pro) => (
              <article className="provider-card" key={pro._id}>
                <div className="provider-card-top">
                  <Avatar name={pro.user.name} src={pro.user.avatar} size="lg" />
                  <span className="provider-online">
                    <i /> Available
                  </span>
                </div>
                <h3>
                  <Link className="provider-name-link" to={`/pros/${pro.user._id}`}>
                    {pro.user.name}
                  </Link>
                </h3>
                <p>{pro.serviceArea || t('Local service area')}</p>
                <div className="provider-card-meta">
                  <Stars value={pro.ratingAverage} count={pro.ratingCount} />
                  <span>{pro.experienceYears} yrs experience</span>
                </div>
                <div className="provider-card-bottom">
                  <span>
                    {t('From')} <Price value={pro.hourlyRate} />
                    <small> / {t('hour')}</small>
                  </span>
                  <Link
                    to={`/pros/${pro.user._id}`}
                    className="round-link"
                    aria-label={`View ${pro.user.name}'s profile`}>
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="✳"
            title="No pros online just yet"
            copy="Create a request and we’ll notify specialists as they come online."
            action="Post a service request"
            to={bookingPath}
          />
        )}
      </section>
    </main>
  );
}

// Tanglish: Public provider details, ratings, and service info.
export function ProviderPublicProfile() {
  const { t } = useLanguage();
  const { id } = useParams();
  const [result, setResult] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/providers/${id}`)
      .then(({ data }) => {
        if (active) setResult(data.data);
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (loading)
    return (
      <main className="marketing-page">
        <PageLoader label="Loading professional profile" />
      </main>
    );
  if (error)
    return (
      <main className="marketing-page">
        <ErrorState message={error} />
      </main>
    );
  const { profile, reviews = [], totalReviews = 0 } = result;
  const bookingCategory = profile.categories[0]?._id;
  const bookingPath = `/requests/new${bookingCategory ? `?category=${bookingCategory}` : ''}`;
  return (
    <main className="marketing-page pro-profile-page">
      <Link to="/services" className="back-link">
        <ChevronRight className="back-chevron" size={15} /> Services
      </Link>
      <section className="pro-profile-hero">
        <div className="pro-profile-avatar">
          <Avatar name={profile.user.name} src={profile.user.avatar} size="xxl" />
        </div>
        <div className="pro-profile-intro">
          <span className="eyebrow">LOCAL QUICKFIX PROFESSIONAL</span>
          <h1>{profile.user.name}</h1>
          <p>
            <MapPin size={15} /> {profile.serviceArea || t('Local service area')}
          </p>
          <div className="pro-profile-rating">
            <Stars value={profile.ratingAverage} count={profile.ratingCount} />
            <span>
              <i /> {profile.status === 'ONLINE' ? 'Available now' : 'Usually replies quickly'}
            </span>
          </div>
        </div>
        <Link to={bookingPath} className="button button-dark">
          {t('Request this service')} <ArrowRight size={16} />
        </Link>
      </section>
      <div className="pro-profile-body">
        <section className="pro-profile-main">
          <article className="surface pro-about-card">
            <span className="eyebrow">
              A LITTLE ABOUT {profile.user.name.split(' ')[0].toUpperCase()}
            </span>
            <h2>Good work, done thoughtfully.</h2>
            <p>{profile.bio || 'This professional is part of your local QuickFix network.'}</p>
            <div className="pro-skills">
              {profile.skills.map((skill) => (
                <span key={skill}>
                  <Check size={13} /> {skill}
                </span>
              ))}
            </div>
          </article>
          <section className="pro-reviews-section">
            <div className="section-title">
              <div>
                <span className="eyebrow">CUSTOMER NOTES</span>
                <h2>Reviews from neighbours</h2>
              </div>
              <span className="results-count">{totalReviews} reviews</span>
            </div>
            {reviews.length ? (
              <div className="review-list">
                {reviews.map((review) => (
                  <article className="surface customer-review" key={review._id}>
                    <div className="review-card-person">
                      <Avatar
                        name={review.customer?.name || 'Customer'}
                        src={review.customer?.avatar}
                      />
                      <span>
                        <b>{review.customer?.name || 'QuickFix customer'}</b>
                        <small>
                          {new Date(review.createdAt).toLocaleDateString('en-IN', {
                            dateStyle: 'medium',
                          })}
                        </small>
                      </span>
                      <Stars value={review.rating} />
                    </div>
                    <p>{review.comment || 'A completed QuickFix service.'}</p>
                    {review.request && (
                      <small className="review-job">For “{review.request.title}”</small>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="☆"
                title="No reviews just yet"
                copy="Customer reviews will show up here after completed jobs."
              />
            )}
          </section>
        </section>
        <aside className="pro-profile-aside">
          <div className="surface pro-facts">
            <span className="eyebrow">THE DETAILS</span>
            <div>
              <b>{profile.experienceYears}</b>
              <span>years of experience</span>
            </div>
            <div>
              <b>{profile.completedJobs}</b>
              <span>completed jobs</span>
            </div>
            <div>
              <b>
                <Price value={profile.hourlyRate} />
              </b>
              <span>profile rate per hour</span>
            </div>
          </div>
          <div className="surface pro-services">
            <span className="eyebrow">SERVICES OFFERED</span>
            {profile.categories.map((category) => (
              <Link to={`/services/${category.slug}`} key={category._id}>
                <span>{category.icon}</span>
                {category.name}
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
          <div className="pro-trust-note">
            <ShieldCheck size={17} />
            <span>
              <b>Local and reviewed.</b>
              <small>Jobs and reviews are tied to completed QuickFix requests.</small>
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}

// Tanglish: QuickFix project and service overview page.
export function About() {
  const { t } = useLanguage();
  const values = [
    {
      icon: '✳',
      title: 'Close to home',
      copy: 'We connect you with pros who know your neighbourhood and can get there without the long wait.',
    },
    {
      icon: '♡',
      title: 'People you can trust',
      copy: 'Real profiles, clear job details, and customer reviews help you choose with confidence.',
    },
    {
      icon: '↗',
      title: 'No more chasing',
      copy: 'Request updates, direct chat, and one simple timeline keep you in the loop from start to finish.',
    },
  ];
  return (
    <main className="marketing-page about-page">
      <div className="marketing-heading">
        <span className="eyebrow">{t('SMALL FIXES. BETTER DAYS.')}</span>
        <h1>
          {t('Home is a lot.')}
          <br />
          <em>{t('We make it lighter.')}</em>
        </h1>
        <p>
          {t(
            'QuickFix brings neighbours and skilled local pros together, so the work gets done and your day gets back to you.',
          )}
        </p>
      </div>
      <div className="about-values">
        {values.map((item) => (
          <article key={item.title}>
            <span>{item.icon}</span>
            <h2>{t(item.title)}</h2>
            <p>{t(item.copy)}</p>
          </article>
        ))}
      </div>
      <div className="about-process">
        <span className="eyebrow">{t('FROM HELLO TO ALL DONE')}</span>
        <h2>
          {t('A more human way')}
          <br />
          {t('to find a helping hand.')}
        </h2>
        {howSteps.map((s) => (
          <div className="about-process-step" key={s.number}>
            <span>{s.number}</span>
            <div>
              <h3>{t(s.title)}</h3>
              <p>{t(s.copy)}</p>
            </div>
            <Check size={17} />
          </div>
        ))}
        <Link to="/register" className="button button-primary">
          {t('Get started')} <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}

// Tanglish: Customer contact information and enquiry page.
export function Contact() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText('vv635329@okicici');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="marketing-page contact-page">
      <Link to="/" className="button button-outline contact-home-link">
        <HomeIcon size={16} /> {t('Back to home')}
      </Link>
      <div className="marketing-heading">
        <span className="eyebrow">{t('APP DEVELOPMENT · CONTACT')}</span>
        <h1>
          {t('Let’s build your')}
          <br />
          <em>{t('next app.')}</em>
        </h1>
        <p>{t('I’m Vijay. Have an app or website idea? Contact me and let’s talk about it.')}</p>
      </div>
      <section className="developer-contact" aria-labelledby="developer-contact-title">
        <div className="developer-contact-intro">
          <span className="developer-avatar">V</span>
          <div>
            <span className="eyebrow">{t('YOUR DEVELOPER')}</span>
            <h2 id="developer-contact-title">Vijay</h2>
            <p>{t('Available for your next app project')}</p>
          </div>
        </div>
        <div className="developer-contact-grid">
          <a className="developer-contact-card" href="tel:8248698947">
            <span className="developer-contact-icon">
              <Phone size={19} />
            </span>
            <span>
              <small>{t('PHONE')}</small>
              <b>82486 98947</b>
              <em>{t('Tap to call')}</em>
            </span>
            <ArrowUpRight size={18} />
          </a>
          <a
            className="developer-contact-card"
            href="mailto:vijayvijay23747@gmail.com?subject=App%20Development%20Enquiry">
            <span className="developer-contact-icon">
              <Mail size={19} />
            </span>
            <span>
              <small>{t('EMAIL')}</small>
              <b>vijayvijay23747@gmail.com</b>
              <em>{t('Tap to send an email')}</em>
            </span>
            <ArrowUpRight size={18} />
          </a>
          <div className="developer-contact-card developer-upi-card">
            <span className="developer-contact-icon developer-upi-icon">₹</span>
            <span>
              <small>{t('GPAY · UPI ID')}</small>
              <b>vv635329@okicici</b>
              <em>{t('Copy this ID in your payment app')}</em>
            </span>
            <button
              className="upi-copy-button"
              type="button"
              onClick={copyUpi}
              aria-label={t('Copy GPay UPI ID')}>
              <Copy size={16} />
              {t(copied ? 'Copied' : 'Copy')}
            </button>
          </div>
        </div>
      </section>
      <section className="quickfix-contact-help">
        <div className="quickfix-contact-heading">
          <span className="eyebrow">{t('USING QUICKFIX?')}</span>
          <h2>{t('We can help with that too.')}</h2>
        </div>
        <div className="contact-grid">
          <Link to="/inbox" className="contact-card">
            <span>✉</span>
            <div>
              <small>{t('NEED HELP WITH A BOOKING?')}</small>
              <b>{t('Message your pro')}</b>
              <p>{t('Open your private job conversation and ask directly.')}</p>
            </div>
            <ArrowUpRight />
          </Link>
          <Link to="/services" className="contact-card">
            <span>⌂</span>
            <div>
              <small>{t('NEW TO QUICKFIX?')}</small>
              <b>{t('Find a local service')}</b>
              <p>{t('Browse service categories and see local professionals.')}</p>
            </div>
            <ArrowUpRight />
          </Link>
        </div>
        <p className="contact-note">
          {t(
            'QuickFix is not an emergency service. For urgent safety issues, contact your local emergency services.',
          )}
        </p>
      </section>
    </main>
  );
}

// Tanglish: Theriyaadha URL vandhaa kaattura not-found screen.
export function NotFound() {
  const { t } = useLanguage();
  return (
    <main className="not-found">
      <span className="eyebrow">{t('404 · WRONG TURN')}</span>
      <h1>
        {t('Looks like this')}
        <br />
        <em>{t('needs a fix.')}</em>
      </h1>
      <p>{t('We can’t find the page you were looking for.')}</p>
      <Link to="/" className="button button-dark">
        {t('Back to home')} <ArrowRight size={16} />
      </Link>
    </main>
  );
}
