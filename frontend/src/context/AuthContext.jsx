import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import api, { dataOf, errorText } from '../services/api.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('quickfix_token'));
  const [ready, setReady] = useState(!localStorage.getItem('quickfix_token'));
  const [socket, setSocket] = useState(null);
  const [unread, setUnread] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [toasts, setToasts] = useState([]);
  const toast = (message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(current => [...current.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), 4000);
  };
  useEffect(() => {
    if (!token) { setUser(null); setProfile(null); setReady(true); return; }
    let active = true;
    api.get('/auth/me').then(({ data }) => { if (active) { setUser(data.data.user); setProfile(data.data.profile); } })
      .catch(() => { if (active) { localStorage.removeItem('quickfix_token'); setToken(null); } })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [token]);
  useEffect(() => {
    if (!token || !user) { socket?.disconnect(); setSocket(null); setUnread(0); setOnlineUsers({}); return; }
    const client = io(window.location.origin, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true });
    client.on('notification:count', payload => setUnread(payload.count));
    client.on('presence:list', payload => setOnlineUsers(Object.fromEntries((payload.userIds || []).map(id => [String(id), true]))));
    client.on('user:presence', payload => setOnlineUsers(current => ({ ...current, [String(payload.userId)]: payload.online })));
    client.on('notification:new', notification => {
      setUnread(count => count + (notification.readAt ? 0 : 1));
      if (notification.type === 'NEW_MESSAGE') toast(`${notification.actor?.name || 'A pro'} sent you a message`, 'info');
    });
    client.on('connect_error', () => {});
    setSocket(client);
    api.get('/notifications/count').then(({ data }) => setUnread(data.data.unreadCount)).catch(() => {});
    return () => { client.disconnect(); setSocket(null); };
  }, [token, user?._id]);
  const login = async credentials => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('quickfix_token', data.data.token);
    setToken(data.data.token); setUser(data.data.user); setReady(true);
    return data.data.user;
  };
  const register = async values => {
    const { data } = await api.post('/auth/register', values);
    localStorage.setItem('quickfix_token', data.data.token);
    setToken(data.data.token); setUser(data.data.user); setReady(true);
    return data.data.user;
  };
  const logout = () => { localStorage.removeItem('quickfix_token'); setToken(null); setUser(null); setProfile(null); socket?.disconnect(); };
  const refreshMe = async () => {
    const { data } = await api.get('/auth/me'); setUser(data.data.user); setProfile(data.data.profile); return data.data;
  };
  const value = useMemo(() => ({ user, profile, setProfile, setUser, token, ready, socket, unread, setUnread, onlineUsers, login, register, logout, refreshMe, toast }), [user, profile, token, ready, socket, unread, onlineUsers]);
  return <AuthContext.Provider value={value}>{children}<div className="toast-stack" aria-live="polite">{toasts.map(item => <div className={`toast toast-${item.type}`} key={item.id}>{item.message}</div>)}</div></AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
export function useLoad(loader, key = '') {
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const refresh = async () => { setLoading(true); setError(''); try { setData(await loader()); } catch (e) { setError(errorText(e)); } finally { setLoading(false); } };
  useEffect(() => { refresh(); }, [key]);
  return { data, setData, loading, error, refresh };
}
