import { Mic } from 'lucide-react';

interface HeroSectionProps {
    onTalkClick: () => void;
}

const HeroSection = ({ onTalkClick }: HeroSectionProps) => {
    return (
        <section className="relative px-6 py-20 md:py-32 overflow-hidden">
            {/* Background gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-primary font-medium">AI-Powered Engineering Assistant</span>
                </div>

                <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight mb-6 animate-slide-up">
                    Your AI{' '}
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Senior Engineer
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto mb-10 animate-slide-up leading-relaxed">
                    Get instant voice answers on gas, plumbing, building regulations, and diagnostics.
                    Like having a 30-year veteran on speed dial.
                </p>

                <button
                    onClick={onTalkClick}
                    className="group relative inline-flex items-center gap-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-300 animate-pulse-glow hover:scale-105"
                >
                    <Mic size={24} />
                    Talk to Gas Genie
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent animate-ping" />
                </button>

                <p className="text-sm text-foreground/40 mt-4">
                    No signup required. Start talking instantly.
                </p>
            </div>
        </section>
    );
};

export default HeroSection;
