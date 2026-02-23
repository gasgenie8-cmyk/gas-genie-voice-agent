import { useNavigate } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import CTASection from '../components/landing/CTASection';
import FloatingMic from '../components/landing/FloatingMic';
import Footer from '../components/landing/Footer';

const Index = () => {
    const navigate = useNavigate();

    const handleTalkClick = () => {
        navigate('/voice');
    };

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
