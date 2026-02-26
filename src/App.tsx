import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Index from './pages/Index';
import VoiceSession from './pages/VoiceSession';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import History from './pages/History';
import Photos from './pages/Photos';
import Profile from './pages/Profile';
import PhotoDiagnosis from './pages/PhotoDiagnosis';
import Dashboard from './pages/Dashboard';
import ReferenceCards from './pages/ReferenceCards';
import CustomerView from './pages/CustomerView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public routes — no bottom nav */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/share/:token" element={<CustomerView />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />

                {/* Protected routes — wrapped in AppLayout (bottom nav + install banner) */}
                <Route path="/voice" element={
                    <ProtectedRoute><AppLayout><VoiceSession /></AppLayout></ProtectedRoute>
                } />
                <Route path="/history" element={
                    <ProtectedRoute><AppLayout><History /></AppLayout></ProtectedRoute>
                } />
                <Route path="/photos" element={
                    <ProtectedRoute><AppLayout><Photos /></AppLayout></ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
                } />
                <Route path="/diagnose" element={
                    <ProtectedRoute><AppLayout><PhotoDiagnosis /></AppLayout></ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
                } />
                <Route path="/reference" element={
                    <ProtectedRoute><AppLayout><ReferenceCards /></AppLayout></ProtectedRoute>
                } />
            </Routes>
        </AuthProvider>
    );
}

export default App;
