import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, token } = useAuth();

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {

        if (user?.role === 'admin') return <Navigate to="/admin" />;
        if (user?.role === 'doctor') return <Navigate to="/doctors" />;
        if (user?.role === 'patient') return <Navigate to="/dashboard" />;
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;
