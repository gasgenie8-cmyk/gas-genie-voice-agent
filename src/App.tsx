import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import VoiceSession from './pages/VoiceSession';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/voice" element={<VoiceSession />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
    );
}

export default App;
