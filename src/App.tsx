import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/home/Dashboard';
import HiringOnboarding from './pages/home/HiringOnboarding';
import Offboarding from './pages/home/Offboarding';
import RoleHierarchy from './pages/home/RoleHierarchy';
import Updates from './pages/home/Updates';
import Settings from './pages/home/Settings';

// My Space
import Profile from './pages/myspace/Profile';
import Attendance from './pages/myspace/Attendance';
import Leaves from './pages/myspace/Leaves';
import HelpDesk from './pages/myspace/HelpDesk';
import Resignation from './pages/myspace/Resignation';

// Finance
import PayDocs from './pages/finance/PayDocs';
import Loans from './pages/finance/Loans';
import TaxInformation from './pages/finance/TaxInformation';

// Assets
import Equipment from './pages/assets/Equipment';
import Query from './pages/assets/Query';

// Performance
import PerformancePlaceholder from './pages/performance/PerformancePlaceholder';
// import Goals from './pages/performance/Goals';
// import Analytics from './pages/performance/Analytics';

import LandingPage from './pages/LandingPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            
            {/* Admin Features */}
            <Route path="hiring" element={
              <ProtectedRoute requireAdmin>
                <HiringOnboarding />
              </ProtectedRoute>
            } />
            <Route path="offboarding" element={
              <ProtectedRoute requireAdmin>
                <Offboarding />
              </ProtectedRoute>
            } />
            <Route path="hierarchy" element={
              <ProtectedRoute requireAdmin>
                <RoleHierarchy />
              </ProtectedRoute>
            } />
            <Route path="updates" element={
              <ProtectedRoute requireAdmin>
                <Updates />
              </ProtectedRoute>
            } />
            <Route path="settings" element={<Settings />} />
            
            {/* My Space Group */}
            <Route path="myspace">
              <Route index element={<Navigate to="/dashboard/myspace/profile" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="leaves" element={<Leaves />} />
              <Route path="resignation" element={<Resignation />} />
              <Route path="helpdesk" element={<HelpDesk />} />
            </Route>

            {/* Finance Group */}
            <Route path="finance">
              <Route index element={<PayDocs />} />
              <Route path="loans" element={<Loans />} />
              <Route path="tax" element={<TaxInformation />} />
            </Route>

            {/* Assets Group */}
            <Route path="assets">
              <Route index element={<Equipment />} />
              <Route path="equipment" element={<Equipment />} />
              <Route path="query" element={
                <ProtectedRoute requireAdmin>
                  <Query />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="performance" element={<PerformancePlaceholder />} />

            {/* Flat links for backward compatibility if needed */}
            <Route path="profile" element={<Profile />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="helpdesk" element={<HelpDesk />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
