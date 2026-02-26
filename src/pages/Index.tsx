import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import CTASection from '../components/landing/CTASection';
import FloatingMic from '../components/landing/FloatingMic';
import Footer from '../components/landing/Footer';

const Index = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    // Authenticated users go straight to dashboard
    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    const handleTalkClick = () => {
        navigate('/voice');
    };

    // Show nothing while checking auth (prevents flash of landing page)
    if (loading) {
        return <div className="min-h-screen bg-background" />;
    }

    // Logged-out users see the marketing landing page
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <HeroSection onTalkClick={handleTalkClick} />
            <WorkflowSection />
            <CTASection onGetStarted={handleTalkClick} />
            <Footer />
            <FloatingMic onClick={handleTalkClick} />
        </div>
    );
};

export default Index;
