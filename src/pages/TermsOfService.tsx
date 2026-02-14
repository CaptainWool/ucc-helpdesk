import React from 'react';

const TermsOfService = () => {
    return (
        <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '800px' }}>
            <h1>Terms of Service</h1>
            <p className="text-muted">Last updated: {new Date().toLocaleDateString()}</p>

            <section style={{ marginTop: '2rem' }}>
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing or using the U.C.C (CoDE) Helpdesk, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h2>2. Use of Service</h2>
                <p>This helpdesk is intended solely for the use of U.C.C (CoDE) students and staff. You agree to use the service only for lawful purposes and in accordance with university regulations.</p>
                <p>You agree not to:</p>
                <ul>
                    <li>Submit false or misleading information.</li>
                    <li>Upload malicious files or content.</li>
                    <li>Harass or abuse support staff.</li>
                </ul>
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h2>3. User Responsibilities</h2>
                <p>You are responsible for maintaining the confidentiality of your student credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h2>4. Intellectual Property</h2>
                <p>The content, features, and functionality of this helpdesk are owned by U.C.C (CoDE) and are protected by copyright and other intellectual property laws.</p>
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h2>5. Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page.</p>
            </section>
        </div>
    );
};

export default TermsOfService;
