import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/Signup'));
const LandingPage = lazy(() => import('./pages/LandingPage/LandingPage'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard/DoctorDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const UserDashboard = lazy(() => import('./pages/UserDashboard/UserDashboard'));
const RiskAssessment = lazy(() => import('./pages/RiskAssessment/RiskAssessment'));
const ReportHistory = lazy(() => import('./pages/ReportHistory/ReportHistory'));
const HospitalDashboard = lazy(() => import('./pages/HospitalDashboard/HospitalDashboard'));
const PharmacyDashboard = lazy(() => import('./pages/PharmacyDashboard/PharmacyDashboard'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard/DriverDashboard'));

const PageLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#38bdf8' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading CANQURE Module...</div>
    </div>
);

function App() {
    return (
        <Router>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/driver" element={<DriverDashboard />} />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['admin', 'SYSTEM_ADMIN']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/hospital"
                        element={
                            <ProtectedRoute allowedRoles={['hospital_admin', 'HOSPITAL_ADMIN', 'admin', 'SYSTEM_ADMIN']}>
                                <HospitalDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctors"
                        element={
                            <ProtectedRoute allowedRoles={['doctor', 'DOCTOR', 'admin', 'SYSTEM_ADMIN']}>
                                <DoctorDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/pharmacy"
                        element={
                            <ProtectedRoute allowedRoles={['pharmacy', 'PHARMACY_ADMIN', 'admin', 'SYSTEM_ADMIN']}>
                                <PharmacyDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['patient', 'PATIENT', 'admin', 'SYSTEM_ADMIN']}>
                                <UserDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/risk-assessment"
                        element={
                            <ProtectedRoute allowedRoles={['patient', 'PATIENT', 'admin', 'SYSTEM_ADMIN']}>
                                <RiskAssessment />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/vault"
                        element={
                            <ProtectedRoute allowedRoles={['patient', 'PATIENT', 'admin', 'SYSTEM_ADMIN']}>
                                <ReportHistory />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/" element={<LandingPage />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;