import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, FileText, Shield, AlertTriangle, Download } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { generateCP12PDF, generateQuotePDF, generateInvoicePDF } from '../lib/generateCompliancePDF';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const CustomerView = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [docType, setDocType] = useState<string | null>(null);
    const [document, setDocument] = useState<AnyRecord | null>(null);
    const [engineer, setEngineer] = useState<AnyRecord | null>(null);

    useEffect(() => {
        if (!token) { setError('Invalid link'); setLoading(false); return; }

        (async () => {
            // 1. Look up the share token
            const shareSnap = await getDocs(
                query(collection(db, 'sharedDocuments'), where('share_token', '==', token))
            );

            if (shareSnap.empty) {
                setError('This link is invalid or has expired.');
                setLoading(false);
                return;
            }

            const share = { id: shareSnap.docs[0].id, ...shareSnap.docs[0].data() } as Record<string, string>;

            // Check expiry
            if (new Date(share.expires_at) < new Date()) {
                setError('This link has expired. Please contact your engineer for a new one.');
                setLoading(false);
                return;
            }

            setDocType(share.document_type);

            // 2. Fetch the actual document
            const tableMap: Record<string, string> = {
                cp12: 'cp12Records',
                quote: 'quotes',
                invoice: 'invoices',
            };
            const tableName = tableMap[share.document_type];
            if (!tableName) { setError('Unknown document type'); setLoading(false); return; }

            const docSnap = await getDoc(doc(db, tableName, share.document_id));
            if (!docSnap.exists()) { setError('Document not found'); setLoading(false); return; }
            setDocument({ id: docSnap.id, ...docSnap.data() });

            // 3. Fetch engineer profile
            const engSnap = await getDoc(doc(db, 'profiles', share.engineer_id));
            setEngineer(engSnap.exists() ? { id: engSnap.id, ...engSnap.data() } : null);

            setLoading(false);
        })();
    }, [token]);

    const handleDownloadPDF = () => {
        if (!document || !docType) return;
        if (docType === 'cp12') generateCP12PDF(document);
        else if (docType === 'quote') generateQuotePDF(document);
        else if (docType === 'invoice') generateInvoicePDF(document);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 size={32} className="text-primary animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
                <AlertTriangle size={48} className="text-amber-400 mb-4" />
                <p className="text-lg font-heading font-bold text-foreground mb-2">Link Error</p>
                <p className="text-sm text-foreground/50 text-center max-w-xs">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Brand header */}
            <header className="bg-card border-b border-border px-6 py-5">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-xl font-bold text-primary">Gas Genie</h1>
                        {engineer && (
                            <p className="text-xs text-foreground/50 mt-0.5">
                                {engineer.company_name || engineer.display_name}
                                {engineer.gas_safe_number && (
                                    <span className="ml-2 inline-flex items-center gap-1">
                                        <Shield size={10} className="text-emerald-400" />
                                        Gas Safe: {engineer.gas_safe_number}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        <Download size={14} /> Download PDF
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-8">
                {docType === 'cp12' && document && <CP12View record={document} />}
                {docType === 'quote' && document && <QuoteView record={document} />}
                {docType === 'invoice' && document && <InvoiceView record={document} />}
            </main>

            <footer className="text-center py-6 text-[10px] text-foreground/20">
                Shared securely via Gas Genie • {new Date().getFullYear()}
            </footer>
        </div>
    );
};

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const CP12View = ({ record }: { record: AnyRecord }) => {
    const appliances = Array.isArray(record.appliances) ? record.appliances : [];
    const resultColor = record.overall_result === 'Pass' ? 'text-emerald-400 bg-emerald-500/10' : record.overall_result === 'Fail' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <FileText size={24} className="text-primary" />
                <div>
                    <h2 className="text-lg font-heading font-bold text-foreground">Gas Safety Record (CP12)</h2>
                    <p className="text-xs text-foreground/40">Landlord Gas Safety Record — Reg.36(3)(4)</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Row label="Property" value={record.property_address} />
                <Row label="Landlord" value={record.landlord_name} />
                <Row label="Tenant" value={record.tenant_name} />
                <Row label="Inspection Date" value={formatDate(record.inspection_date)} />
                <Row label="Next Due" value={formatDate(record.next_due)} />
                <Row label="Result" value={<span className={`text-xs font-bold px-2.5 py-1 rounded-full ${resultColor}`}>{record.overall_result}</span>} />
            </div>

            {appliances.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="text-sm font-bold text-foreground mb-3">Appliances</h3>
                    <div className="space-y-3">
                        {appliances.map((a: AnyRecord, i: number) => (
                            <div key={i} className="bg-background/50 rounded-lg p-3 text-xs">
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-foreground/80">{a.type || 'Appliance'}</span>
                                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${a.result === 'Pass' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>{a.result}</span>
                                </div>
                                <p className="text-foreground/40">{a.make} {a.model} • {a.location}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const QuoteView = ({ record }: { record: AnyRecord }) => {
    const items = Array.isArray(record.items) ? record.items : [];
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText size={24} className="text-primary" />
                    <div>
                        <h2 className="text-lg font-heading font-bold text-foreground">Quotation</h2>
                        <p className="text-xs text-foreground/40">{record.quote_number}</p>
                    </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">{record.status}</span>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
                <table className="w-full text-xs">
                    <thead><tr className="border-b border-border"><th className="py-2 text-left text-foreground/40">Item</th><th className="py-2 text-right text-foreground/40">Qty</th><th className="py-2 text-right text-foreground/40">Price</th><th className="py-2 text-right text-foreground/40">Total</th></tr></thead>
                    <tbody className="text-foreground/70">
                        {items.map((item: AnyRecord, i: number) => (
                            <tr key={i} className="border-b border-border/50">
                                <td className="py-2">{item.description}</td>
                                <td className="text-right">{item.quantity}</td>
                                <td className="text-right">£{(item.unit_price || 0).toFixed(2)}</td>
                                <td className="text-right">£{((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4 pt-3 border-t border-border space-y-1">
                    <div className="flex justify-between text-xs text-foreground/50"><span>Subtotal</span><span>£{(record.subtotal || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between text-xs text-foreground/50"><span>VAT (20%)</span><span>£{(record.vat || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm font-bold text-foreground pt-1"><span>Total</span><span>£{(record.total || 0).toFixed(2)}</span></div>
                </div>
            </div>

            <p className="text-[11px] text-foreground/30">Valid until: {formatDate(record.valid_until)}</p>
        </div>
    );
};

const InvoiceView = ({ record }: { record: AnyRecord }) => {
    const items = Array.isArray(record.items) ? record.items : [];
    const statusColor = record.status === 'Paid' ? 'text-emerald-400 bg-emerald-500/10' : record.status === 'Overdue' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10';
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText size={24} className="text-primary" />
                    <div>
                        <h2 className="text-lg font-heading font-bold text-foreground">Invoice</h2>
                        <p className="text-xs text-foreground/40">{record.invoice_number}</p>
                    </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor}`}>{record.status}</span>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
                <table className="w-full text-xs">
                    <thead><tr className="border-b border-border"><th className="py-2 text-left text-foreground/40">Item</th><th className="py-2 text-right text-foreground/40">Qty</th><th className="py-2 text-right text-foreground/40">Price</th><th className="py-2 text-right text-foreground/40">Total</th></tr></thead>
                    <tbody className="text-foreground/70">
                        {items.map((item: AnyRecord, i: number) => (
                            <tr key={i} className="border-b border-border/50">
                                <td className="py-2">{item.description}</td>
                                <td className="text-right">{item.quantity}</td>
                                <td className="text-right">£{(item.unit_price || 0).toFixed(2)}</td>
                                <td className="text-right">£{((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4 pt-3 border-t border-border space-y-1">
                    <div className="flex justify-between text-xs text-foreground/50"><span>Subtotal</span><span>£{(record.subtotal || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between text-xs text-foreground/50"><span>VAT (20%)</span><span>£{(record.vat || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm font-bold text-foreground pt-1"><span>Total Due</span><span>£{(record.total || 0).toFixed(2)}</span></div>
                </div>
            </div>

            <p className="text-[11px] text-foreground/30">Due: {formatDate(record.due_date)} • Payment terms: 30 days</p>
        </div>
    );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0">
        <span className="text-xs font-medium text-foreground/40">{label}</span>
        <span className="text-sm text-foreground">{value || '—'}</span>
    </div>
);

export default CustomerView;
