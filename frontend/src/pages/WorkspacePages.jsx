import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Bell, Check, ChevronDown, ChevronRight, CircleDollarSign, Clock3, ImagePlus, MapPin, MessageCircle, Send, ShieldCheck, Star, UsersRound, Wrench } from 'lucide-react';
import api, { dataOf, errorText } from '../services/api.js';
import { useAuth, useLoad } from '../context/AuthContext.jsx';
import { Avatar, Button, EmptyState, ErrorState, Field, FormError, PageControls, PageLoader, Price, SectionTitle, Stars } from '../components/ui.jsx';
import PwaInstallButton from '../components/PwaInstallButton.jsx';

const asset = path => path?.startsWith('http') ? path : path ? `${import.meta.env.VITE_API_URL || ''}${path}` : '';

export function ProviderDirectory() {
  const [search] = useSearchParams();
  const [categories, setCategories] = useState([]), [filters, setFilters] = useState({ category: search.get('category') || '', location: search.get('location') || '', rating: '', maxRate: '' }), [applied, setApplied] = useState({ category: search.get('category') || '', location: search.get('location') || '' }), [page, setPage] = useState(1);
  const [payload, setPayload] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const query = new URLSearchParams({ page: String(page), limit: '12', ...Object.fromEntries(Object.entries(applied).filter(([, v]) => v)) });
  useEffect(() => { api.get('/services').then(({ data }) => setCategories(data.data)).catch(() => {}); }, []);
  useEffect(() => { let ok = true; setLoading(true); api.get(`/providers?${query.toString()}`).then(({ data }) => { if (ok) setPayload(data.data); }).catch(e => { if (ok) setError(errorText(e)); }).finally(() => { if (ok) setLoading(false); }); return () => { ok = false; }; }, [query.toString()]);
  const apply = e => { e.preventDefault(); setApplied(filters); setPage(1); };
  const items = payload?.items || [];
  return <div className="directory-page"><SectionTitle eyebrow="LOCAL SERVICE PROFESSIONALS" title="Find your kind of pro." copy="Good hands, right around the corner." /><form className="filter-bar" onSubmit={apply}><label><Wrench size={16} /><select aria-label="Service category" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}><option value="">All services</option>{categories.map(c => <option value={c._id} key={c._id}>{c.name}</option>)}</select></label><label><MapPin size={16} /><input aria-label="Location" value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} placeholder="Neighbourhood" /></label><label><Star size={16} /><select aria-label="Minimum rating" value={filters.rating} onChange={e => setFilters({ ...filters, rating: e.target.value })}><option value="">Any rating</option>{[4, 4.5, 5].map(n => <option key={n} value={n}>{n}+ stars</option>)}</select></label><label><span className="filter-currency">₹</span><input aria-label="Maximum hourly rate" type="number" min="0" placeholder="Max rate" value={filters.maxRate} onChange={e => setFilters({ ...filters, maxRate: e.target.value })} /></label><Button>Find pros <ArrowRight size={15} /></Button></form><div className="directory-results-head"><span>{loading ? 'Finding local pros…' : `${payload?.pagination?.total || 0} pros available`}</span><span className="results-live"><i /> Availability updates live</span></div>{loading ? <PageLoader /> : error ? <ErrorState message={error} /> : items.length ? <><div className="provider-grid provider-grid-wide">{items.map(pro => <article className="provider-card" key={pro._id}><div className="provider-card-top"><Avatar name={pro.user.name} src={asset(pro.user.avatar)} size="lg" /><span className="provider-online"><i /> Available</span></div><h3><Link className="provider-name-link" to={`/pros/${pro.user._id}`}>{pro.user.name}</Link></h3><p>{pro.serviceArea || 'Local service area'}</p><div className="provider-categories">{pro.categories.map(c => <span key={c._id}>{c.icon} {c.name}</span>)}</div><div className="provider-card-meta"><Stars value={pro.ratingAverage} count={pro.ratingCount} /><span>{pro.experienceYears} yrs experience</span></div><div className="provider-card-bottom"><span>From <Price value={pro.hourlyRate} /><small> / hour</small></span><Link to={`/requests/new${pro.categories[0] ? `?category=${pro.categories[0]._id}` : ''}`} className="button button-dark">Request a service <ArrowRight size={15} /></Link></div></article>)}</div><PageControls pagination={payload.pagination} onChange={setPage} /></> : <EmptyState icon="✳" title="No pros match those filters" copy="Try widening your search, or check back as local pros come online." action="Clear filters" to="/providers" />}</div>;
}

export function ProfilePage() {
  const { user, refreshMe, toast } = useAuth();
  const [categories, setCategories] = useState([]), [form, setForm] = useState({ name: user.name, phone: user.phone || '', bio: '', skills: '', categories: [], experienceYears: 0, hourlyRate: 0, serviceArea: '' }), [avatar, setAvatar] = useState(user.avatar || ''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [ready, setReady] = useState(user.role !== 'PROVIDER');
  useEffect(() => { Promise.all([api.get('/services'), user.role === 'PROVIDER' ? api.get('/providers/me') : Promise.resolve(null)]).then(([services, profile]) => { setCategories(services.data.data); if (profile) { const p = profile.data.data; setForm(current => ({ ...current, bio: p.bio || '', skills: p.skills?.join(', ') || '', categories: p.categories?.map(x => x._id) || [], experienceYears: p.experienceYears || 0, hourlyRate: p.hourlyRate || 0, serviceArea: p.serviceArea || '' })); } }).catch(e => setError(errorText(e))).finally(() => setReady(true)); }, [user.role]);
  const save = async e => { e.preventDefault(); setError(''); setBusy(true); try { const payload = { name: form.name, phone: form.phone }; if (user.role === 'PROVIDER') Object.assign(payload, { bio: form.bio, skills: form.skills.split(',').map(x => x.trim()).filter(Boolean), categories: form.categories, experienceYears: Number(form.experienceYears), hourlyRate: Number(form.hourlyRate), serviceArea: form.serviceArea }); await api.patch('/users/me', payload); await refreshMe(); toast('Your profile has been saved'); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } };
  const uploadPhoto = async e => { const image = e.target.files?.[0]; if (!image) return; try { const body = new FormData(); body.append('image', image); const { data } = await api.post('/uploads/avatar', body, { headers: { 'Content-Type': 'multipart/form-data' } }); setAvatar(data.data.url); await refreshMe(); toast('Profile photo updated'); } catch (e) { toast(errorText(e), 'error'); } };
  const toggleCategory = id => setForm(current => ({ ...current, categories: current.categories.includes(id) ? current.categories.filter(x => x !== id) : [...current.categories, id] }));
  if (!ready) return <PageLoader label="Loading your profile" />;
  return <div className="profile-page"><SectionTitle eyebrow="YOUR ACCOUNT" title={user.role === 'PROVIDER' ? 'Your pro profile.' : 'A little about you.'} copy={user.role === 'PROVIDER' ? 'Help the right customers find you. A thoughtful profile goes a long way.' : 'Keep your details up to date for a smoother service experience.'} /><form className="surface profile-form" onSubmit={save}><FormError>{error}</FormError><div className="profile-photo-row"><div className="profile-photo-wrap"><Avatar name={user.name} src={asset(avatar)} size="xxl" /><label className="photo-upload" title="Upload profile photo"><ImagePlus size={16} /><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadPhoto} /></label></div><div><b>Your profile photo</b><p>A clear photo helps neighbours feel at ease.</p><small>JPG, PNG, or WEBP · up to 5 MB</small></div></div><div className="form-divider" /><div className="profile-fields"><Field label="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /><Field label="Email address" value={user.email} disabled hint="Email changes are handled by support." /><Field label="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" /></div>{user.role === 'PROVIDER' && <><div className="form-divider" /><span className="eyebrow profile-section-eyebrow">YOUR SERVICE PROFILE</span><Field label="A quick intro" as="textarea" rows="4" maxLength="700" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="A little about your experience and the care you bring to each job…" /><Field label="Your skills" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Tap repairs, pipe fitting, leak detection" hint="Separate each skill with a comma." /><div className="form-row"><Field label="Years of experience" type="number" min="0" max="60" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: e.target.value })} /><Field label="Hourly rate (₹)" type="number" min="0" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} /></div><Field label="Your service area" value={form.serviceArea} onChange={e => setForm({ ...form, serviceArea: e.target.value })} placeholder="e.g. Indiranagar, Bengaluru" /><fieldset className="category-checks"><legend>Services you offer</legend><p>Choose each category that matches your work.</p><div>{categories.map(cat => <label key={cat._id} className={form.categories.includes(cat._id) ? 'category-check-selected' : ''}><input type="checkbox" checked={form.categories.includes(cat._id)} onChange={() => toggleCategory(cat._id)} /><span>{cat.icon}</span>{cat.name}<Check size={15} /></label>)}</div></fieldset></>}<div className="profile-save-row"><span><ShieldCheck size={15} /> Your personal details stay private.</span><Button disabled={busy}>{busy ? 'Saving…' : 'Save changes'} <Check size={16} /></Button></div></form></div>;
}

export function InboxPage() {
  const { socket, user, toast, onlineUsers } = useAuth();
  const [search, setSearch] = useSearchParams();
  const requestedId = search.get('conversation');
  const [conversations, setConversations] = useState([]), [selected, setSelected] = useState(requestedId || ''), [messages, setMessages] = useState([]), [draft, setDraft] = useState(''), [typing, setTyping] = useState(null), [loading, setLoading] = useState(true), [sending, setSending] = useState(false), [error, setError] = useState('');
  const bottomRef = useRef(null), typingTimer = useRef(null);
  const loadConversations = async () => { try { const { data } = await api.get('/conversations'); setConversations(data.data); if (!selected && data.data.length) { setSelected(data.data[0]._id); setSearch({ conversation: data.data[0]._id }, { replace: true }); } } catch (e) { setError(errorText(e)); } finally { setLoading(false); } };
  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { if (requestedId) setSelected(requestedId); }, [requestedId]);
  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    let mounted = true;
    setLoading(true); setError('');
    api.get(`/conversations/${selected}/messages`).then(({ data }) => { if (mounted) { setMessages(data.data.items); api.post(`/conversations/${selected}/read`).catch(() => {}); socket?.emit('messages:read', { conversationId: selected }); } }).catch(e => { if (mounted) setError(errorText(e)); }).finally(() => { if (mounted) setLoading(false); });
    socket?.emit('conversation:join', { conversationId: selected }, result => { if (!result?.success) setError(result?.message || 'Unable to open this conversation'); });
    return () => { mounted = false; };
  }, [selected, socket]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);
  useEffect(() => { if (!socket) return; const receive = message => { if (String(message.conversation) === String(selected)) setMessages(current => current.some(x => x._id === message._id) ? current : [...current, message]); loadConversations(); }; const typingEvent = data => { if (String(data.conversationId) === String(selected) && String(data.user?._id) !== String(user._id)) setTyping(data.typing ? data.user : null); }; const read = data => { if (String(data.conversationId) === String(selected)) setMessages(current => current.map(m => String(m.sender?._id || m.sender) === String(user._id) && !m.readAt ? { ...m, readAt: data.readAt } : m)); }; socket.on('message:received', receive); socket.on('typing:update', typingEvent); socket.on('messages:read', read); return () => { socket.off('message:received', receive); socket.off('typing:update', typingEvent); socket.off('messages:read', read); }; }, [socket, selected, user._id]);
  const chosen = conversations.find(c => c._id === selected);
  const peer = chosen?.participants?.find(p => p._id !== user._id);
  const send = async e => { e.preventDefault(); if (!draft.trim() || !selected || sending) return; const content = draft.trim(); setDraft(''); setSending(true); if (typingTimer.current) clearTimeout(typingTimer.current); socket?.emit('typing:stop', { conversationId: selected }); try { if (socket?.connected) { socket.emit('message:send', { conversationId: selected, content }, result => { if (!result?.success) toast(result?.message || 'Message could not be sent', 'error'); }); } else { const { data } = await api.post(`/conversations/${selected}/messages`, { content }); setMessages(current => [...current, data.data]); } } catch (e) { setDraft(content); toast(errorText(e), 'error'); } finally { setSending(false); } };
  const changeDraft = value => { setDraft(value); if (!selected || !socket) return; socket.emit(value ? 'typing:start' : 'typing:stop', { conversationId: selected }); if (typingTimer.current) clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => socket.emit('typing:stop', { conversationId: selected }), 1200); };
  const choose = id => { setSelected(id); setSearch({ conversation: id }, { replace: true }); };
  return <div className="inbox-page"><SectionTitle eyebrow="YOUR CONVERSATIONS" title="Good conversations." copy="Pick up right where you left off." /><div className="inbox-layout surface"><aside className="conversation-sidebar"><div className="conversation-sidebar-heading"><span>Messages</span><span>{conversations.length}</span></div><div className="conversation-list">{loading && !conversations.length ? <PageLoader /> : conversations.map(c => { const other = c.participants.find(p => p._id !== user._id); return <button className={`conversation-preview ${selected === c._id ? 'conversation-selected' : ''}`} key={c._id} onClick={() => choose(c._id)}><span className="conversation-avatar-wrap"><Avatar name={other?.name || 'QuickFix'} src={asset(other?.avatar)} />{onlineUsers[other?._id] && <i />}</span><span className="conversation-preview-copy"><b>{other?.name || 'QuickFix customer'}</b><small>{c.request?.title}</small><span>{c.lastMessage?.content || 'Conversation started'}</span></span>{c.unreadCount > 0 && <i className="conversation-unread">{c.unreadCount}</i>}</button>; })}{!conversations.length && !loading && <div className="conversation-empty">Your conversations will show up here once a pro accepts a request.</div>}</div></aside><main className="conversation-view">{chosen ? <><header className="conversation-header"><span className="conversation-avatar-wrap"><Avatar name={peer?.name || 'QuickFix'} src={asset(peer?.avatar)} />{onlineUsers[peer?._id] && <i />}</span><span><b>{peer?.name || 'QuickFix customer'}</b><small>{chosen.request?.title}</small></span><span className={`chat-presence ${onlineUsers[peer?._id] ? 'chat-is-online' : ''}`}><i />{onlineUsers[peer?._id] ? 'Online now' : 'Offline'}</span><span className="chat-secure"><ShieldCheck size={15} /> Private chat</span></header><div className="message-list">{loading ? <PageLoader label="Loading your conversation" /> : error ? <div className="chat-error">{error}</div> : messages.length ? <>{messages.map((m, i) => { const mine = String(m.sender?._id || m.sender) === String(user._id); return <div className={`message-row ${mine ? 'message-mine' : ''}`} key={m._id || i}>{!mine && <Avatar name={m.sender?.name || peer?.name || 'Q'} src={asset(m.sender?.avatar)} size="xs" />}<div className="message-bubble"><p>{m.content}</p><small>{new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}{mine && m.readAt ? ' · Read' : ''}</small></div></div>; })}</> : <div className="chat-first"><span>✦</span><b>A good job starts with a good conversation.</b><small>Say hello to {peer?.name || 'your match'}.</small></div>}{typing && <div className="typing-note"><span className="typing-dots"><i /><i /><i /></span> {typing.name} is typing…</div>}<div ref={bottomRef} /></div><form className="message-compose" onSubmit={send}><input maxLength="2000" value={draft} onChange={e => changeDraft(e.target.value)} placeholder="Write a message…" aria-label="Write a message" /><span className="compose-limit">{draft.length > 0 && `${draft.length}/2000`}</span><button type="submit" disabled={!draft.trim() || sending} aria-label="Send message"><Send size={17} /></button></form><span className="chat-footnote">Keep communication respectful and job-related.</span></> : <div className="inbox-placeholder"><span>✉</span><h2>A little hello<br />goes a long way.</h2><p>Select a conversation to get started.</p></div>}</main></div></div>;
}

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, refresh } = useLoad(async () => dataOf(await api.get('/notifications', { params: { page } })), String(page));
  const { setUnread, toast } = useAuth(); const navigate = useNavigate();
  const items = data?.items || [];
  const readAll = async () => { try { await api.patch('/notifications/read-all'); setUnread(0); await refresh(); toast('All caught up'); } catch (e) { toast(errorText(e), 'error'); } };
  const open = async item => { if (!item.readAt) { try { await api.patch(`/notifications/${item._id}/read`); setUnread(n => Math.max(0, n - 1)); } catch {} } if (item.conversation) navigate(`/inbox?conversation=${item.conversation}`); else if (item.request) navigate(`/requests/${item.request._id || item.request}`); };
  return <div className="notifications-page"><SectionTitle eyebrow="STAY IN THE LOOP" title="Notifications." copy="The little updates that keep everything moving." action={items.some(x => !x.readAt) && <button className="button button-outline" onClick={readAll}><Check size={15} /> Mark all read</button>} /><PushAlertsCard toast={toast} />{loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={refresh} /> : items.length ? <><div className="notification-list">{items.map(item => <button className={`notification-item ${item.readAt ? '' : 'notification-unread'}`} onClick={() => open(item)} key={item._id}><span className={`notification-icon notification-${item.type?.toLowerCase()}`}><NotificationIcon type={item.type} /></span><span className="notification-copy"><b>{item.title}</b><span>{item.body}</span><small>{new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></span>{!item.readAt && <i className="notification-dot" />}<ChevronRight size={18} /></button>)}</div><PageControls pagination={data.pagination} onChange={setPage} /></> : <EmptyState icon="✦" title="You’re all caught up" copy="When something needs your attention, you’ll find it here." />}</div>;
}

function pushKeyToBytes(value) {
  const padded = `${value}${'='.repeat((4 - value.length % 4) % 4)}`;
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function PushAlertsCard({ toast }) {
  const [available, setAvailable] = useState(false), [enabled, setEnabled] = useState(false), [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const sync = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (!supported) return;
      if (active) setAvailable(true);
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription || !active) return;
        const { data } = await api.post('/notifications/push/subscriptions/status', { endpoint: subscription.endpoint });
        if (active) setEnabled(Boolean(data.data.subscribed));
      } catch {}
    };
    sync();
    return () => { active = false; };
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      if (enabled && current) {
        await api.delete('/notifications/push/subscriptions', { data: { endpoint: current.endpoint } });
        await current.unsubscribe();
        setEnabled(false);
        toast('Phone alerts turned off');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error(permission === 'denied' ? 'Browser settings-la QuickFix notifications allow pannunga.' : 'Notifications permission kudutha alerts varum.');
      const { data: keyResult } = await api.get('/notifications/push/public-key');
      const publicKey = keyResult.data.publicKey;
      if (!publicKey) throw new Error('Push setup ready illa. Terminal-la npm run setup:vapid run panni server restart pannunga.');
      const subscription = current || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: pushKeyToBytes(publicKey) });
      await api.post('/notifications/push/subscriptions', subscription.toJSON());
      setEnabled(true);
      toast('Phone alerts enabled');
    } catch (error) {
      toast(errorText(error), 'error');
    } finally { setBusy(false); }
  };

  return <section className="push-alert-card surface"><span className="push-alert-icon"><Bell size={18} /></span><div className="push-alert-copy"><b>Phone alerts</b><span>{available ? (enabled ? 'QuickFix updates will reach this device.' : 'Get a heads-up when a pro accepts or messages you.') : 'Push alerts are not supported in this browser.'}</span><small>Allow notifications in your browser. iPhone-la, first Home Screen-la install pannitu enable pannunga.</small></div><div className="push-alert-actions"><PwaInstallButton toast={toast} compact /><button className={`button ${enabled ? 'button-outline' : 'button-dark'} push-alert-toggle`} onClick={toggle} disabled={busy || !available}>{busy ? 'Please wait…' : enabled ? 'Turn off' : 'Enable alerts'}</button></div></section>;
}
function NotificationIcon({ type }) { if (type === 'NEW_MESSAGE') return <MessageCircle size={18} />; if (type === 'NEW_REVIEW') return <Star size={18} />; if (type === 'REQUEST_ACCEPTED' || type === 'SERVICE_COMPLETED') return <Check size={18} />; if (type === 'PROVIDER_STATUS') return <Wrench size={18} />; return <Bell size={18} />; }

export function ReviewsPage() {
  const { data, loading, error, refresh } = useLoad(async () => dataOf(await api.get('/reviews')));
  return <div className="reviews-page"><SectionTitle eyebrow="CUSTOMER NOTES" title="Good work, remembered." copy="Thoughtful work makes a difference. Here’s what customers are saying." />{loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={refresh} /> : data?.length ? <div className="review-list">{data.map(item => <article className="surface customer-review" key={item._id}><div className="review-card-person"><Avatar name={item.customer?.name || 'Customer'} src={asset(item.customer?.avatar)} /><span><b>{item.customer?.name}</b><small>{new Date(item.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</small></span><Stars value={item.rating} /></div><p>{item.comment || 'The service was completed. Thank you for using QuickFix.'}</p>{item.request && <small className="review-job">For “{item.request.title}”</small>}</article>)}</div> : <EmptyState icon="☆" title="Your reviews will live here" copy="After a completed job, customers can leave you a note and a rating." />}</div>;
}

export function EarningsPage() {
  const { data, loading, error, refresh } = useLoad(async () => dataOf(await api.get('/requests?scope=assigned')), 'earnings');
  const { data: profile, loading: profileLoading } = useLoad(async () => dataOf(await api.get('/providers/me')));
  if (loading || profileLoading) return <PageLoader label="Loading your work history" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  const jobs = (data?.items || []).filter(x => x.status === 'COMPLETED');
  const total = jobs.reduce((sum, job) => sum + Number(job.budget || 0), 0);
  return <div className="earnings-page"><SectionTitle eyebrow="YOUR WORK HISTORY" title="Good work adds up." copy="A clear record of the jobs you’ve completed on QuickFix." /><div className="earnings-summary"><span className="earnings-summary-icon"><CircleDollarSign size={22} /></span><div><small>COMPLETED REQUEST BUDGETS</small><b>{currency(total)}</b><span>Across {jobs.length} completed {jobs.length === 1 ? 'job' : 'jobs'} · budgets are not payouts</span></div><div className="earnings-summary-side"><span><Check size={16} /> Completed work</span><span>Profile rate <b>{currency(profile?.hourlyRate)}/hr</b></span></div></div><div className="surface history-panel"><div className="panel-heading"><div><span className="eyebrow">COMPLETED JOBS</span><h2>Your work history</h2></div><span className="results-count">{jobs.length} jobs</span></div>{jobs.length ? <div className="request-list">{jobs.map(row => <article className="history-job-row" key={row._id}><Link to={`/requests/${row._id}`} className="history-job-info"><span className="request-card-icon">{row.category?.icon || '🔧'}</span><span><b>{row.title}</b><small>{row.category?.name} · Completed {new Date(row.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</small></span></Link><Price value={row.budget} /></article>)}</div> : <EmptyState title="Your first completed job is ahead" copy="Accepted and finished work will show up here." action="See incoming requests" to="/requests" />}</div></div>;
}
