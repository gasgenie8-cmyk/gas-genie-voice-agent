import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Phone, Ruler, Wind, Zap, Gauge, AlertTriangle } from 'lucide-react';

interface ReferenceCard {
    id: string;
    title: string;
    icon: React.ElementType;
    color: string;
    content: React.ReactNode;
}

const ReferenceCards = () => {
    const navigate = useNavigate();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

    const cards: ReferenceCard[] = [
        {
            id: 'pipe-sizing',
            title: 'Pipe Sizing (BS 6891)',
            icon: Ruler,
            color: 'text-cyan-400',
            content: (
                <div className="space-y-3">
                    <p className="text-xs text-foreground/50">Maximum kW load for copper pipe runs (natural gas, 20mbar)</p>
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-1.5 text-left text-foreground/40 font-medium">Pipe Ø</th>
                                <th className="py-1.5 text-right text-foreground/40 font-medium">3m</th>
                                <th className="py-1.5 text-right text-foreground/40 font-medium">6m</th>
                                <th className="py-1.5 text-right text-foreground/40 font-medium">9m</th>
                                <th className="py-1.5 text-right text-foreground/40 font-medium">12m</th>
                                <th className="py-1.5 text-right text-foreground/40 font-medium">15m</th>
                            </tr>
                        </thead>
                        <tbody className="text-foreground/70">
                            <tr className="border-b border-border/50"><td className="py-1.5 font-medium">8mm</td><td className="text-right">1.2</td><td className="text-right">0.8</td><td className="text-right">0.7</td><td className="text-right">—</td><td className="text-right">—</td></tr>
                            <tr className="border-b border-border/50"><td className="py-1.5 font-medium">10mm</td><td className="text-right">3.1</td><td className="text-right">2.1</td><td className="text-right">1.7</td><td className="text-right">1.5</td><td className="text-right">1.3</td></tr>
                            <tr className="border-b border-border/50"><td className="py-1.5 font-medium">15mm</td><td className="text-right">9.6</td><td className="text-right">6.5</td><td className="text-right">5.3</td><td className="text-right">4.5</td><td className="text-right">4.0</td></tr>
                            <tr className="border-b border-border/50"><td className="py-1.5 font-medium">22mm</td><td className="text-right">33</td><td className="text-right">23</td><td className="text-right">18</td><td className="text-right">16</td><td className="text-right">14</td></tr>
                            <tr className="border-b border-border/50"><td className="py-1.5 font-medium">28mm</td><td className="text-right">70</td><td className="text-right">49</td><td className="text-right">39</td><td className="text-right">34</td><td className="text-right">30</td></tr>
                            <tr><td className="py-1.5 font-medium">35mm</td><td className="text-right">148</td><td className="text-right">103</td><td className="text-right">83</td><td className="text-right">71</td><td className="text-right">63</td></tr>
                        </tbody>
                    </table>
                    <p className="text-[10px] text-foreground/30">Values in kW. Based on 1mbar pressure drop. Always verify with current BS 6891 tables.</p>
                </div>
            ),
        },
        {
            id: 'ventilation',
            title: 'Ventilation Requirements (BS 5440)',
            icon: Wind,
            color: 'text-emerald-400',
            content: (
                <div className="space-y-3">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-1.5 text-left text-foreground/40 font-medium">Appliance Type</th>
                                <th className="py-1.5 text-right text-foreground/40 font-medium">Requirement</th>
                            </tr>
                        </thead>
                        <tbody className="text-foreground/70">
                            <tr className="border-b border-border/50"><td className="py-1.5">Open-flue ≤7kW</td><td className="text-right">5 cm²/kW of input</td></tr>
                            <tr className="border-b border-border/50"><td className="py-1.5">Open-flue &gt;7kW</td><td className="text-right">5 cm²/kW (first 7kW) + 10 cm²/kW above</td></tr>
                            <tr className="border-b border-border/50"><td className="py-1.5">Room-sealed (balanced flue)</td><td className="text-right">No room ventilation needed</td></tr>
                            <tr className="border-b border-border/50"><td className="py-1.5">Decorative fuel effect (DFE)</td><td className="text-right">100 cm² high + 100 cm² low</td></tr>
                            <tr><td className="py-1.5">Flueless (max 6kW)</td><td className="text-right">5 cm²/kW + openable window</td></tr>
                        </tbody>
                    </table>
                    <p className="text-[10px] text-foreground/30">Ventilation must be permanent and non-closable. Refer to BS 5440-2 for full requirements.</p>
                </div>
            ),
        },
        {
            id: 'btu-kw',
            title: 'BTU / kW / Watt Conversion',
            icon: Zap,
            color: 'text-amber-400',
            content: (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background/50 rounded-lg p-3">
                            <p className="text-xs font-bold text-foreground/60 mb-2">Quick Conversions</p>
                            <div className="space-y-1 text-xs text-foreground/70">
                                <p>1 kW = <strong>3,412 BTU/h</strong></p>
                                <p>1 kW = <strong>1,000 W</strong></p>
                                <p>1 therm = <strong>29.31 kWh</strong></p>
                                <p>1 m³ gas ≈ <strong>11.1 kWh</strong></p>
                                <p>1 ft³ gas ≈ <strong>0.31 kWh</strong></p>
                            </div>
                        </div>
                        <div className="bg-background/50 rounded-lg p-3">
                            <p className="text-xs font-bold text-foreground/60 mb-2">Common Boiler Sizes</p>
                            <div className="space-y-1 text-xs text-foreground/70">
                                <p>24 kW = <strong>81,891 BTU</strong></p>
                                <p>28 kW = <strong>95,540 BTU</strong></p>
                                <p>30 kW = <strong>102,364 BTU</strong></p>
                                <p>32 kW = <strong>109,188 BTU</strong></p>
                                <p>35 kW = <strong>119,425 BTU</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'pressure',
            title: 'Pressure Testing Guide',
            icon: Gauge,
            color: 'text-violet-400',
            content: (
                <div className="space-y-3">
                    <div className="space-y-2 text-xs text-foreground/70">
                        <div className="bg-background/50 rounded-lg p-3">
                            <p className="font-bold text-foreground/80 mb-1">Tightness Test Procedure</p>
                            <ol className="space-y-1 list-decimal list-inside pl-1">
                                <li>Ensure all appliances are disconnected</li>
                                <li>Connect manometer to test point</li>
                                <li>Turn on gas and purge</li>
                                <li>Allow to stabilise (1 min for small, 2 min for large installations)</li>
                                <li>Record standing pressure</li>
                                <li>Wait test period and re-read</li>
                            </ol>
                        </div>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-1.5 text-left text-foreground/40 font-medium">Parameter</th>
                                    <th className="py-1.5 text-right text-foreground/40 font-medium">Value</th>
                                </tr>
                            </thead>
                            <tbody className="text-foreground/70">
                                <tr className="border-b border-border/50"><td className="py-1.5">Standing pressure (NG)</td><td className="text-right font-mono">21 mbar (±1)</td></tr>
                                <tr className="border-b border-border/50"><td className="py-1.5">Min. working pressure</td><td className="text-right font-mono">19 mbar</td></tr>
                                <tr className="border-b border-border/50"><td className="py-1.5">Max pressure drop</td><td className="text-right font-mono">&lt;1 mbar = PASS</td></tr>
                                <tr className="border-b border-border/50"><td className="py-1.5">Standing pressure (LPG butane)</td><td className="text-right font-mono">28 mbar</td></tr>
                                <tr><td className="py-1.5">Standing pressure (LPG propane)</td><td className="text-right font-mono">37 mbar</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ),
        },
        {
            id: 'error-codes',
            title: 'Common Boiler Error Codes',
            icon: AlertTriangle,
            color: 'text-red-400',
            content: (
                <div className="space-y-4">
                    {[
                        {
                            brand: 'Vaillant ecoTEC', codes: [
                                { code: 'F.22', desc: 'Low water pressure' },
                                { code: 'F.28', desc: 'Ignition failure' },
                                { code: 'F.75', desc: 'Pump/pressure sensor fault' },
                                { code: 'F.29', desc: 'Flame extinguished during operation' },
                            ]
                        },
                        {
                            brand: 'Worcester Bosch', codes: [
                                { code: 'EA', desc: 'No flame detected / ignition failure' },
                                { code: 'CE', desc: 'Low water pressure' },
                                { code: 'D5', desc: 'Heating NTC sensor fault' },
                                { code: 'A1', desc: 'Fan speed too low' },
                            ]
                        },
                        {
                            brand: 'Baxi', codes: [
                                { code: 'E119', desc: 'Low water pressure' },
                                { code: 'E133', desc: 'Ignition lockout' },
                                { code: 'E125', desc: 'DHW NTC fault' },
                                { code: 'E160', desc: 'Fan speed fault' },
                            ]
                        },
                        {
                            brand: 'Ideal', codes: [
                                { code: 'F1', desc: 'Low water pressure' },
                                { code: 'L2', desc: 'Ignition lockout' },
                                { code: 'FD', desc: 'Fan fault' },
                                { code: 'F2', desc: 'Flame lost' },
                            ]
                        },
                    ].map(brand => (
                        <div key={brand.brand}>
                            <p className="text-xs font-bold text-foreground/60 mb-1.5">{brand.brand}</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {brand.codes.map(c => (
                                    <div key={c.code} className="bg-background/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-red-400 w-10">{c.code}</span>
                                        <span className="text-[11px] text-foreground/60">{c.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            id: 'emergency',
            title: 'Emergency Contacts',
            icon: Phone,
            color: 'text-red-400',
            content: (
                <div className="space-y-2">
                    {[
                        { name: 'National Gas Emergency Service', number: '0800 111 999', note: 'Available 24/7 — always call if gas leak suspected' },
                        { name: 'HSE (Health & Safety Executive)', number: '0345 300 9923', note: 'Report workplace incidents' },
                        { name: 'Gas Safe Register', number: '0800 408 5500', note: 'Verify registrations, report concerns' },
                        { name: 'Emergency Services', number: '999', note: 'Fire, explosion, or immediate danger to life' },
                    ].map(c => (
                        <div key={c.name} className="bg-background/50 rounded-lg p-3 flex items-start gap-3">
                            <Phone size={14} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-foreground/80">{c.name}</p>
                                <a href={`tel:${c.number.replace(/\s/g, '')}`} className="text-sm font-mono font-bold text-primary">{c.number}</a>
                                <p className="text-[10px] text-foreground/40 mt-0.5">{c.note}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
                <button onClick={() => navigate('/')} className="text-foreground/70 hover:text-foreground transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="font-heading text-xl font-bold text-foreground">Reference Cards</h1>
                    <p className="text-xs text-foreground/40">Available offline</p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-6 space-y-3">
                {cards.map(card => (
                    <div key={card.id} className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
                        <button
                            onClick={() => toggle(card.id)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-background/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <card.icon size={18} className={card.color} />
                                <span className="text-sm font-semibold text-foreground">{card.title}</span>
                            </div>
                            {expandedId === card.id
                                ? <ChevronUp size={16} className="text-foreground/30" />
                                : <ChevronDown size={16} className="text-foreground/30" />}
                        </button>
                        {expandedId === card.id && (
                            <div className="px-5 pb-5 border-t border-border pt-4 animate-fade-in">
                                {card.content}
                            </div>
                        )}
                    </div>
                ))}

                <p className="text-[10px] text-foreground/20 text-center pt-4">
                    Reference data for quick lookup. Always verify against current editions of BS 6891, BS 5440, and manufacturer documentation.
                </p>
            </main>
        </div>
    );
};

export default ReferenceCards;
