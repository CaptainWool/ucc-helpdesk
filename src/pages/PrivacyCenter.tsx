import React, { useState } from 'react';
import { Download, Trash2, ShieldCheck, Info, FileJson, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './PrivacyCenter.css';

const PrivacyCenter: React.FC = () => {
    const { user } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const [exporting, setExporting] = useState(false);
    const [erasing, setErasing] = useState(false);

    const handleExportData = async () => {
        setExporting(true);
        try {
            const data = await api.compliance.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ucc-helpdesk-export-${user?.id?.substring(0, 8)}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showSuccess('Data export generated and downloaded successfully.');
        } catch (err) {
            showError('Failed to generate data export. Please try again later.');
        } finally {
            setExporting(false);
        }
    };

    const handleErasureRequest = async () => {
        const reason = prompt("Please provide a reason for your erasure request (optional):");
        if (reason === null) return;

        if (!confirm("CRITICAL WARNING: This action will anonymize your profile and revoke access to your account. This cannot be undone. Are you absolutely sure?")) {
            return;
        }

        setErasing(true);
        try {
            await api.compliance.eraseAccount(reason);
            showSuccess('Erasure request processed. You will be logged out.');
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        } catch (err) {
            showError('Failed to process erasure request.');
            setErasing(false);
        }
    };

    return (
        <div className="privacy-center fade-in">
            <header className="privacy-header">
                <ShieldCheck size={48} className="text-primary mb-2" />
                <h1>Privacy & Your Data</h1>
                <p>Manage your rights under GDPR and CCPA compliance standards.</p>
            </header>

            <div className="privacy-grid">
                <Card className="privacy-card">
                    <h3><FileJson size={20} className="text-blue-500" /> Export Personal Data</h3>
                    <p>
                        Download a comprehensive JSON file containing your profile information,
                        submitted tickets, and conversation history. This allows you to exercise
                        your right to data portability.
                    </p>
                    <Button
                        onClick={handleExportData}
                        loading={exporting}
                        className="w-full"
                    >
                        <Download size={18} /> Generate Export
                    </Button>
                </Card>

                <Card className="privacy-card erasure-card">
                    <h3><Trash2 size={20} className="text-red-500" /> Right to Erasure</h3>
                    <p>
                        Request the permanent removal of your personal identifiers from our system.
                        Your data will be anonymized to protect your identity while maintaining
                        system integrity.
                    </p>
                    <Button
                        variant="danger"
                        onClick={handleErasureRequest}
                        loading={erasing}
                        className="w-full"
                    >
                        <AlertTriangle size={18} /> Request Erasure
                    </Button>
                </Card>
            </div>

            <div className="legal-notice">
                <h4><Info size={16} /> Important Information</h4>
                <p>
                    UCC Helpdesk is committed to protecting student privacy. Data exports include all personal
                    information linked to your account. Erasure requests are processed immediately and are
                    irreversible. For more complex inquiries regarding your data, please contact the
                    Dean of Students office.
                </p>
            </div>
        </div>
    );
};

export default PrivacyCenter;
