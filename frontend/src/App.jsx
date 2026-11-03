// Tanglish: URL path-ah sariyana screen-kku map panni, user role access check pannum.

import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import AppShell from './layouts/AppShell.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { PageLoader } from './components/ui.jsx';

// Split route groups so the first screen downloads only the page it needs.
const fromPublic = (name) =>
  lazy(() => import('./pages/PublicPages.jsx').then((pages) => ({ default: pages[name] })));
const fromAuth = (name) =>
  lazy(() => import('./pages/AuthPages.jsx').then((pages) => ({ default: pages[name] })));
const fromDashboard = (name) =>
  lazy(() => import('./pages/DashboardPages.jsx').then((pages) => ({ default: pages[name] })));
const fromRequests = (name) =>
  lazy(() => import('./pages/RequestPages.jsx').then((pages) => ({ default: pages[name] })));
const fromAdmin = (name) =>
  lazy(() => import('./pages/AdminPages.jsx').then((pages) => ({ default: pages[name] })));
const fromWorkspace = (name) =>
  lazy(() => import('./pages/WorkspacePages.jsx').then((pages) => ({ default: pages[name] })));

const About = fromPublic('About');
const CategoryPage = fromPublic('CategoryPage');
const Contact = fromPublic('Contact');
const Home = fromPublic('Home');
const NotFound = fromPublic('NotFound');
const ProviderPublicProfile = fromPublic('ProviderPublicProfile');
const Services = fromPublic('Services');
const Login = fromAuth('Login');
const Register = fromAuth('Register');
const Dashboard = fromDashboard('default');
const RequestCreate = fromRequests('RequestCreate');
const RequestDetail = fromRequests('RequestDetail');
const RequestsList = fromRequests('RequestsList');
const AdminActivity = fromAdmin('AdminActivity');
const AdminCategories = fromAdmin('AdminCategories');
const AdminProviders = fromAdmin('AdminProviders');
const AdminRequests = fromAdmin('AdminRequests');
const AdminReviews = fromAdmin('AdminReviews');
const AdminUsers = fromAdmin('AdminUsers');
const EarningsPage = fromWorkspace('EarningsPage');
const InboxPage = fromWorkspace('InboxPage');
const NotificationsPage = fromWorkspace('NotificationsPage');
const ProfilePage = fromWorkspace('ProfilePage');
const ProviderDirectory = fromWorkspace('ProviderDirectory');
const ReviewsPage = fromWorkspace('ReviewsPage');

// Tanglish: Login session and role sariyaa irundhaa mattum indha protected page open aagum.
function Protected({ roles }) {
  const { user, ready } = useAuth(),
    location = useLocation();
  if (!ready) return <PageLoader label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
// Tanglish: Public layout-oda page content-ah wrap pannum.
function Public({ children }) {
  return <PublicLayout>{children}</PublicLayout>;
}

// Tanglish: URL routes inga map aagum; endha path-ku endha screen nu paarunga.
export default function App() {
  return (
    <Suspense fallback={<PageLoader label="Loading page" />}>
      <Routes>
        <Route
          path="/"
          element={
            <Public>
              <Home />
            </Public>
          }
        />
        <Route
          path="/services"
          element={
            <Public>
              <Services />
            </Public>
          }
        />
        <Route
          path="/services/:slug"
          element={
            <Public>
              <CategoryPage />
            </Public>
          }
        />
        <Route
          path="/pros/:id"
          element={
            <Public>
              <ProviderPublicProfile />
            </Public>
          }
        />
        <Route
          path="/about"
          element={
            <Public>
              <About />
            </Public>
          }
        />
        <Route
          path="/contact"
          element={
            <Public>
              <Contact />
            </Public>
          }
        />
        <Route
          path="/login"
          element={
            <Public>
              <Login />
            </Public>
          }
        />
        <Route
          path="/register"
          element={
            <Public>
              <Register />
            </Public>
          }
        />
        <Route element={<Protected />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/requests" element={<RequestsList />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route element={<Protected roles={['CUSTOMER']} />}>
              <Route path="/requests/new" element={<RequestCreate />} />
              <Route path="/providers" element={<ProviderDirectory />} />
              <Route path="/history" element={<RequestsList mode="history" />} />
            </Route>
            <Route element={<Protected roles={['PROVIDER']} />}>
              <Route path="/jobs" element={<RequestsList mode="jobs" />} />
              <Route path="/earnings" element={<EarningsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
            </Route>
            <Route element={<Protected roles={['CUSTOMER', 'PROVIDER']} />}>
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route element={<Protected roles={['ADMIN']} />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/providers" element={<AdminProviders />} />
              <Route path="/admin/requests" element={<AdminRequests />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/activity" element={<AdminActivity />} />
            </Route>
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <Public>
              <NotFound />
            </Public>
          }
        />
      </Routes>
    </Suspense>
  );
}
