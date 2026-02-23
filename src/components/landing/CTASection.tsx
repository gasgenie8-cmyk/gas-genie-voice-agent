import { Zap } from 'lucide-react';

interface CTASectionProps {
    onGetStarted: () => void;
}

const CTASection = ({ onGetStarted }: CTASectionProps) => {
    return (
        <section className="px-6 py-20">
            <div className="max-w-3xl mx-auto text-center">
                <div className="bg-gradient-to-br from-card to-secondary border border-border rounded-3xl p-10 md:p-16 relative overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <Zap size={40} className="text-primary mx-auto mb-4" />
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Stop Googling. Start Asking.
                        </h2>
                        <p className="text-foreground/50 mb-8 max-w-md mx-auto">
                            Whether you're on site or in the van, Gas Genie gives you instant answers so you can crack on.
                        </p>
                        <button
                            onClick={onGetStarted}
                            className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105"
                        >
                            Get Started — Free
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
