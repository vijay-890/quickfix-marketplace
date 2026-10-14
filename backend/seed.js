import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import ProviderProfile from './models/ProviderProfile.js';
import ServiceCategory from './models/ServiceCategory.js';
import ServiceRequest from './models/ServiceRequest.js';
import Review from './models/Review.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });
if (process.env.NODE_ENV === 'production') throw new Error('The development seed is disabled in production.');

async function account(values) {
  let user = await User.findOne({ email: values.email });
  if (!user) user = await User.create(values);
  return user;
}

async function seed() {
  await connectDB();
  const categories = [
    ['AC Repair', 'ac-repair', 'Heating and cooling, kept comfortable.', '❄️'],
    ['Plumbing', 'plumbing', 'Leaky taps, drains, and pipe repairs.', '🔧'],
    ['Electrical', 'electrical', 'Safe wiring, fixtures, and troubleshooting.', '⚡'],
    ['Cleaning', 'cleaning', 'A little reset for your home.', '🧹'],
    ['Appliance Repair', 'appliance-repair', 'Repairs for the machines you count on.', '🧺'],
    ['Painting', 'painting', 'Fresh color and careful finishing.', '🎨'],
    ['Computer & Laptop', 'computer-laptop', 'Computer tune-ups and device repairs.', '💻'],
    ['Home Maintenance', 'home-maintenance', 'Small fixes that keep things running.', '🏠']
  ];
  await ServiceCategory.bulkWrite(categories.map(([name, slug, description, icon]) => ({ updateOne: { filter: { slug }, update: { $setOnInsert: { name, slug, description, icon } }, upsert: true } })));
  const [ac, plumbing, electrical] = await Promise.all(['ac-repair', 'plumbing', 'electrical'].map(slug => ServiceCategory.findOne({ slug })));
  const admin = await account({ name: 'QuickFix Admin', email: 'admin@quickfix.test', password: 'QuickFix!Demo2026', role: 'ADMIN' });
  const customer = await account({ name: 'Maya Shah', email: 'maya@quickfix.test', password: 'QuickFix!Demo2026', role: 'CUSTOMER', phone: '+91 90000 10001' });
  const provider = await account({ name: 'Arjun Mehta', email: 'arjun@quickfix.test', password: 'QuickFix!Demo2026', role: 'PROVIDER', phone: '+91 90000 10002' });
  let profile = await ProviderProfile.findOne({ user: provider._id });
  if (!profile) profile = new ProviderProfile({ user: provider._id });
  profile.bio = 'Thoughtful home repairs with clear communication and tidy work. Over seven years helping neighbours keep things running.';
  profile.skills = ['AC servicing', 'Electrical troubleshooting', 'Preventive maintenance'];
  profile.categories = [ac._id, electrical._id];
  profile.experienceYears = 7; profile.hourlyRate = 850; profile.serviceArea = 'Indiranagar, Bengaluru'; profile.status = 'ONLINE';
  await profile.save();

  let openRequest = await ServiceRequest.findOne({ customer: customer._id, title: 'AC needs a seasonal check' });
  if (!openRequest) openRequest = await ServiceRequest.create({ customer: customer._id, category: ac._id, title: 'AC needs a seasonal check', description: 'The bedroom unit is running, but airflow has slowed down. Could someone inspect it and clean the filters?', budget: 1800, address: '18 Lakeview Lane, apartment 4B', city: 'Indiranagar, Bengaluru', status: 'OPEN' });
  let finishedRequest = await ServiceRequest.findOne({ customer: customer._id, title: 'Replace two flickering ceiling lights' });
  if (!finishedRequest) finishedRequest = await ServiceRequest.create({ customer: customer._id, provider: provider._id, category: electrical._id, title: 'Replace two flickering ceiling lights', description: 'Two ceiling fixtures have started flickering. The new LED fixtures are ready; please check the wiring and replace them.', budget: 1600, address: '18 Lakeview Lane, apartment 4B', city: 'Indiranagar, Bengaluru', status: 'COMPLETED' });
  await Review.updateOne({ request: finishedRequest._id }, { $setOnInsert: { request: finishedRequest._id, customer: customer._id, provider: provider._id, rating: 5, comment: 'Arjun arrived on time, explained what he found, and left everything neat. Really appreciated the clear updates.' } }, { upsert: true });
  const stats = await Review.aggregate([{ $match: { provider: provider._id } }, { $group: { _id: '$provider', average: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  if (stats[0]) await ProviderProfile.updateOne({ user: provider._id }, { $set: { ratingAverage: Math.round(stats[0].average * 10) / 10, ratingCount: stats[0].count, completedJobs: 1 } });
  let conversation = await Conversation.findOne({ request: finishedRequest._id });
  if (!conversation) conversation = await Conversation.create({ request: finishedRequest._id, participants: [customer._id, provider._id] });
  if (!await Message.exists({ conversation: conversation._id })) {
    const message = await Message.create({ conversation: conversation._id, sender: customer._id, receiver: provider._id, content: 'Thanks again for the careful work — the lights are perfect.' });
    conversation.lastMessage = message._id; conversation.lastMessageAt = message.createdAt; await conversation.save();
  }
  if (!await Notification.exists({ user: provider._id, type: 'NEW_REVIEW', request: finishedRequest._id })) await Notification.create({ user: provider._id, type: 'NEW_REVIEW', title: 'A customer reviewed your work', body: 'Maya left you a 5-star review.', actor: customer._id, request: finishedRequest._id });
  console.log('QuickFix development data is ready in the local quickfix database.');
  console.log('Admin:    admin@quickfix.test   / QuickFix!Demo2026');
  console.log('Customer: maya@quickfix.test    / QuickFix!Demo2026');
  console.log('Provider: arjun@quickfix.test   / QuickFix!Demo2026');
  await mongoose.disconnect();
}

seed().catch(error => { console.error(error.message); process.exitCode = 1; mongoose.disconnect(); });
