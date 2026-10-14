import assert from 'node:assert/strict';
import { io } from 'socket.io-client';

const api = 'http://localhost:5000/api';
const socketURL = 'http://localhost:5000';
async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${api}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${payload.message}`);
  return payload.data;
}
function once(socket, event, predicate = () => true, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(event, listener); reject(new Error(`Timed out waiting for ${event}`)); }, timeout);
    const listener = value => { if (!predicate(value)) return; clearTimeout(timer); socket.off(event, listener); resolve(value); };
    socket.on(event, listener);
  });
}
function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => socket.timeout(5000).emit(event, payload, (error, result) => error ? reject(new Error(`${event}: ${error.message}`)) : resolve(result)));
}

let customerSocket, providerSocket, adminSocket;
try {
  const customerLogin = await request('/auth/login', { method: 'POST', body: { email: 'maya@quickfix.test', password: 'QuickFix!Demo2026' } });
  const providerLogin = await request('/auth/login', { method: 'POST', body: { email: 'arjun@quickfix.test', password: 'QuickFix!Demo2026' } });
  const adminLogin = await request('/auth/login', { method: 'POST', body: { email: 'admin@quickfix.test', password: 'QuickFix!Demo2026' } });
  const conversations = await request('/conversations', { token: customerLogin.token });
  const conversation = conversations.find(item => item.participants.some(person => String(person._id) === String(providerLogin.user._id)));
  assert.ok(conversation, 'The seeded customer and provider should have a persisted conversation. Run npm run seed first.');
  const privateHistory = await fetch(`${api}/conversations/${conversation._id}/messages`, { headers: { Authorization: `Bearer ${adminLogin.token}` } });
  assert.equal(privateHistory.status, 403, 'Admins who are not participants cannot read private chat history.');

  customerSocket = io(socketURL, { auth: { token: customerLogin.token }, transports: ['websocket'], autoConnect: false });
  providerSocket = io(socketURL, { auth: { token: providerLogin.token }, transports: ['websocket'], autoConnect: false });
  adminSocket = io(socketURL, { auth: { token: adminLogin.token }, transports: ['websocket'], autoConnect: false });
  const connected = [once(customerSocket, 'connect'), once(providerSocket, 'connect'), once(adminSocket, 'connect')];
  customerSocket.connect(); providerSocket.connect(); adminSocket.connect();
  await Promise.all(connected);
  const connectedUsers = (await emitAck(adminSocket, 'presence:request', {})).userIds;
  assert.ok(connectedUsers.includes(String(customerLogin.user._id)) && connectedUsers.includes(String(providerLogin.user._id)), 'Authenticated clients can read the live-presence snapshot.');
  for (const socket of [customerSocket, providerSocket]) {
    const result = await emitAck(socket, 'conversation:join', { conversationId: conversation._id });
    assert.equal(result.success, true, 'Conversation members can join their chat.');
  }
  const deniedJoin = await emitAck(adminSocket, 'conversation:join', { conversationId: conversation._id });
  assert.equal(deniedJoin.success, false, 'A non-participant cannot join a private conversation room.');

  const typing = once(providerSocket, 'typing:update', event => event.typing === true);
  customerSocket.emit('typing:start', { conversationId: conversation._id });
  await typing;

  const received = once(providerSocket, 'message:received', event => String(event.conversation) === String(conversation._id));
  const ack = await emitAck(customerSocket, 'message:send', { conversationId: conversation._id, content: 'Realtime verification message — safely removable from the conversation.' });
  assert.equal(ack.success, true, 'Socket messages are acknowledged after saving.');
  const delivered = await received;
  assert.equal(delivered.content, 'Realtime verification message — safely removable from the conversation.');

  const readReceipt = once(customerSocket, 'messages:read', event => String(event.conversationId) === String(conversation._id));
  providerSocket.emit('messages:read', { conversationId: conversation._id });
  await readReceipt;
  const history = await request(`/conversations/${conversation._id}/messages`, { token: providerLogin.token });
  assert.ok(history.items.some(message => message.content === delivered.content && message.readAt), 'The Socket.IO message and read receipt are persisted in MongoDB.');
  const providerWentOffline = once(customerSocket, 'user:presence', event => event.userId === String(providerLogin.user._id) && !event.online);
  providerSocket.disconnect(); providerSocket = undefined;
  await providerWentOffline;
  console.log('Realtime verification passed: JWT socket auth, private room membership, typing, message persistence, read receipts, and online/offline presence.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  customerSocket?.disconnect();
  providerSocket?.disconnect();
  adminSocket?.disconnect();
}
