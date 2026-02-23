import { Mic, MessageSquare, CheckCircle } from 'lucide-react';

const steps = [
    {
        icon: Mic,
        title: 'Tap & Speak',
        description: 'Press the mic and ask your question — anything from boiler specs to Gas Safe regs.',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
    },
    {
        icon: MessageSquare,
        title: 'Get Expert Answers',
        description: 'Gas Genie responds instantly like a senior engineer with 30 years on the tools.',
        color: 'text-accent',
        bgColor: 'bg-accent/10',
    },
    {
        icon: CheckCircle,
        title: 'Work with Confidence',
        description: 'Get on with the job knowing you have the right answer. BS 6891? Part J? Sorted.',
        color: 'text-success',
        bgColor: 'bg-success/10',
    },
];

const WorkflowSection = () => {
    return (
        <section id="how-it-works" className="px-6 py-20 bg-secondary/30">
            <div className="max-w-5xl mx-auto">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
                    How It Works
                </h2>
                <p className="text-center text-foreground/50 mb-12 max-w-lg mx-auto">
                    Three steps. No forms. No waiting. Just answers.
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                    {steps.map((step, i) => (
                        <div
                            key={step.title}
                            className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group animate-fade-in"
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <div className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <step.icon size={24} className={step.color} />
                            </div>
                            <div className="text-xs text-foreground/30 font-medium mb-2">
                                STEP {i + 1}
                            </div>
                            <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                                {step.title}
                            </h3>
                            <p className="text-sm text-foreground/50 leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WorkflowSection;
