import webpush from 'web-push';
import UserPushSubscription from '../models/UserPushSubscription.js';

export const getPublicPushKey = () => process.env.WEB_PUSH_PUBLIC_KEY || '';

export async function sendPush(userId, payload) {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  webpush.setVapidDetails(process.env.WEB_PUSH_SUBJECT || 'mailto:support@example.com', publicKey, privateKey);
  const subscriptions = await UserPushSubscription.find({ user: userId }).lean();
  await Promise.allSettled(subscriptions.map(async row => {
    try {
      await webpush.sendNotification({ endpoint: row.endpoint, expirationTime: row.expirationTime, keys: row.keys }, JSON.stringify(payload), { TTL: 3600 });
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) await UserPushSubscription.deleteOne({ _id: row._id });
      else throw error;
    }
  }));
}
