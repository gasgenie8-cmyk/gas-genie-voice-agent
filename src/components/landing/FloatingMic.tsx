import { Mic } from 'lucide-react';

interface FloatingMicProps {
    onClick: () => void;
}

const FloatingMic = ({ onClick }: FloatingMicProps) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse-glow transition-all duration-300 hover:scale-110 md:hidden"
            aria-label="Talk to Gas Genie"
        >
            <Mic size={24} className="text-white" />
        </button>
    );
};

export default FloatingMic;
