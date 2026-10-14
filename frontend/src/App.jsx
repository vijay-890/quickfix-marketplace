import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import AppShell from './layouts/AppShell.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { PageLoader } from './components/ui.jsx';
import { About, CategoryPage, Contact, Home, NotFound, ProviderPublicProfile, Services } from './pages/PublicPages.jsx';
import { Login, Register } from './pages/AuthPages.jsx';
import Dashboard from './pages/DashboardPages.jsx';
import { RequestCreate, RequestDetail, RequestsList } from './pages/RequestPages.jsx';
import { AdminActivity, AdminCategories, AdminProviders, AdminRequests, AdminReviews, AdminUsers } from './pages/AdminPages.jsx';
import { EarningsPage, InboxPage, NotificationsPage, ProfilePage, ProviderDirectory, ReviewsPage } from './pages/WorkspacePages.jsx';

function Protected({ roles }) {
  const { user, ready } = useAuth(), location = useLocation();
  if (!ready) return <PageLoader label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
function Public({ children }) { return <PublicLayout>{children}</PublicLayout>; }

export default function App() {
  return <Routes>
    <Route path="/" element={<Public><Home /></Public>} />
    <Route path="/services" element={<Public><Services /></Public>} />
    <Route path="/services/:slug" element={<Public><CategoryPage /></Public>} />
    <Route path="/pros/:id" element={<Public><ProviderPublicProfile /></Public>} />
    <Route path="/about" element={<Public><About /></Public>} />
    <Route path="/contact" element={<Public><Contact /></Public>} />
    <Route path="/login" element={<Public><Login /></Public>} />
    <Route path="/register" element={<Public><Register /></Public>} />
    <Route element={<Protected />}><Route element={<AppShell />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/requests" element={<RequestsList />} />
      <Route path="/requests/:id" element={<RequestDetail />} />
      <Route element={<Protected roles={['CUSTOMER']} />}><Route path="/requests/new" element={<RequestCreate />} /><Route path="/providers" element={<ProviderDirectory />} /><Route path="/history" element={<RequestsList mode="history" />} /></Route>
      <Route element={<Protected roles={['PROVIDER']} />}><Route path="/jobs" element={<RequestsList mode="jobs" />} /><Route path="/earnings" element={<EarningsPage />} /><Route path="/reviews" element={<ReviewsPage />} /></Route>
      <Route element={<Protected roles={['CUSTOMER', 'PROVIDER']} />}><Route path="/inbox" element={<InboxPage />} /><Route path="/profile" element={<ProfilePage />} /></Route>
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route element={<Protected roles={['ADMIN']} />}><Route path="/admin/users" element={<AdminUsers />} /><Route path="/admin/providers" element={<AdminProviders />} /><Route path="/admin/requests" element={<AdminRequests />} /><Route path="/admin/categories" element={<AdminCategories />} /><Route path="/admin/reviews" element={<AdminReviews />} /><Route path="/admin/activity" element={<AdminActivity />} /></Route>
    </Route></Route>
    <Route path="*" element={<Public><NotFound /></Public>} />
  </Routes>;
}
