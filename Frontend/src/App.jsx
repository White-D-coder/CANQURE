import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import LandingPage from './pages/LandingPage/LandingPage';
import DoctorDashboard from './pages/DoctorDashboard/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import UserDashboard from './pages/UserDashboard/UserDashboard';
import RiskAssessment from './pages/RiskAssessment/RiskAssessment';
import ReportHistory from './pages/ReportHistory/ReportHistory';
import HospitalDashboard from './pages/HospitalDashboard/HospitalDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard/PharmacyDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/hospital"
                    element={
                        <ProtectedRoute allowedRoles={['hospital_admin', 'admin']}>
                            <HospitalDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/doctors"
                    element={
                        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                            <DoctorDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/pharmacy"
                    element={
                        <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
                            <PharmacyDashboard />
                        </ProtectedRoute>
                    }
                />


                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['patient', 'admin']}>
                            <UserDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/risk-assessment"
                    element={
                        <ProtectedRoute allowedRoles={['patient', 'admin']}>
                            <RiskAssessment />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/vault"
                    element={
                        <ProtectedRoute allowedRoles={['patient', 'admin']}>
                            <ReportHistory />
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<LandingPage />} />
            </Routes>
        </Router>
    );
}

export default App;