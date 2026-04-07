import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { Suspense } from 'react';
import { FirebaseProvider } from './contexts/FirebaseContext';
import Layout from './components/Layout/Layout';
import { ToastProvider } from './components/ui/Toaster';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TeamView = React.lazy(() => import('./pages/TeamView'));
const SectionView = React.lazy(() => import('./pages/SectionView'));
const DepartmentView = React.lazy(() => import('./pages/DepartmentView'));
const AllDepartments = React.lazy(() => import('./pages/AllDepartments'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Teams = React.lazy(() => import('./pages/Teams'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const Settings = React.lazy(() => import('./pages/Settings'));
const IndividualDashboard = React.lazy(() => import('./pages/IndividualDashboard'));
const StudentData = React.lazy(() => import('./pages/StudentData'));
const Repositories = React.lazy(() => import('./pages/Repositories'));
const AgentAdmin = React.lazy(() => import('./pages/AgentAdmin'));

const LoadingSpinner = () => (
  <div className="flex w-full h-full min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

import { DataProvider } from './contexts/DataContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import AgentChat from './components/AgentChat';

// ... other imports

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <FirebaseProvider>
          <DataProvider>
            <Router>
              <div className="min-h-screen bg-gradient-main text-textMain transition-colors duration-300">
                <Layout>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/team/:deptId/:sectionId/:teamId" element={<TeamView />} />
                        <Route path="/section/:deptId/:sectionId" element={<SectionView />} />
                        <Route path="/department/:deptId" element={<DepartmentView />} />
                        <Route path="/all-departments" element={<AllDepartments />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/repositories" element={<Repositories />} />
                        <Route path="/teams" element={<Teams />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/individual/:memberId" element={<IndividualDashboard />} />
                        <Route path="/student-data" element={<StudentData />} />
                        <Route path="/settings/admin" element={<AgentAdmin />} />
                        <Route path="/agent-admin" element={<AgentAdmin />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </Layout>
                <AgentChat />
              </div>
            </Router>
          </DataProvider>
        </FirebaseProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;