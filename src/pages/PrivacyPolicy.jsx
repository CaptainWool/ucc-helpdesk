import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '800px' }}>
            <h1>Privacy Policy</h1>
            <p className="text-muted">Last updated: {new Date().toLocaleDateString()}</p>

            <section style={{ marginTop: '2rem' }}>
                <h2>1. Introduction</h2>
                <p>Welcome to the U.C.C (CoDE) Helpdesk. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h2>2. Data We Collect</h2>
                <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                <ul>
                    <li><strong>Identity Data:</strong> includes Student ID, Name.</li>
                    <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                    <li><strong>Ticket Data:</strong> includes the subject, description, and attachments regarding your academic or fee-related inquiries.</li>
                </ul>
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h2>3. How We Use Your Data</h2>
                <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                <ul>
                    <li>To process and resolve your support tickets.</li>
                    <li>To communicate with you regarding the status of your inquiries.</li>
                    <li>To improve our helpdesk services and student experience.</li>
                </ul>
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h2>4. Data Security</h2>
                <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. Access to your personal data is restricted to authorized university coordinators and support staff.</p>
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h2>5. Contact Us</h2>
                <p>If you have any questions about this privacy policy or our privacy practices, please contact the U.C.C (CoDE) administration.</p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
