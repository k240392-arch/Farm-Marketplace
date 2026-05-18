// pages/Privacy.jsx — Privacy Policy
// Author: CPRO306 Capstone | Date: 2026
// Aligned with the Australian Privacy Act 1988 and the 13 Australian Privacy Principles (APPs).

import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const C = {
  forest:'#253528', moss:'#3D5B45', sage:'#A7BFA5',
  cream:'#F6F3EE', boneWhite:'#FBFAF8', charcoal:'#1C1F1D',
  mistGray:'#E7E5E0', muted:'#6B7280', mutedDark:'#4B5563',
};
const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

export default function Privacy() {
  useEffect(() => {
    const id = 'instrument-serif-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <div style={pageBase}>
      <section style={hero}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={eyebrow}>Legal</p>
          <h1 style={h1}>
            Privacy <span style={{ color: C.moss, fontStyle: 'italic' }}>Policy</span>
          </h1>
          <p style={lead}>
            How FarmMarket collects, uses, stores, and protects your personal information,
            in line with the Australian Privacy Act 1988 and the Australian Privacy Principles.
          </p>
          <p style={meta}>Last updated: 1 January 2026 · Effective from: 1 January 2026</p>
        </div>
      </section>

      <section style={{ padding: '64px 32px 96px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <Section title="1. Who we are">
            <p>
              FarmMarket ("we", "us", "our") is a marketplace platform connecting Australian farmers
              directly with consumers, operated as part of the CPRO306 capstone project at Kent
              Institute Australia.
            </p>
            <p>
              For privacy-related enquiries, contact us at {' '}
              <a href="mailto:ALS_MELB@kent.edu.au" style={inlineLink}>ALS_MELB@kent.edu.au</a>.
            </p>
          </Section>

          <Section title="2. What information we collect">
            <p>We collect personal information that is reasonably necessary for our services. This includes:</p>
            <ul style={list}>
              <li><strong>Account details:</strong> name, email, phone number, encrypted password, role (buyer / farmer / admin).</li>
              <li><strong>Profile details:</strong> farm name and location for farmers, delivery addresses for buyers.</li>
              <li><strong>Order details:</strong> products purchased, quantities, prices, delivery preferences, order history.</li>
              <li><strong>Payment details:</strong> processed via Stripe — we do <em>not</em> store full credit card numbers on our servers.</li>
              <li><strong>Usage data:</strong> pages visited, features used, IP address, browser type (for security and analytics).</li>
              <li><strong>Communications:</strong> messages through the AI chat assistant, customer support enquiries.</li>
            </ul>
          </Section>

          <Section title="3. How we collect it (APP 3 & APP 5)">
            <p>We collect information directly from you when you:</p>
            <ul style={list}>
              <li>Create an account or update your profile.</li>
              <li>Place an order or list a product as a farmer.</li>
              <li>Contact us via email, the chatbot, or support forms.</li>
              <li>Browse the site (cookies and analytics — see our <Link to="/cookie-policy" style={inlineLink}>Cookie Policy</Link>).</li>
            </ul>
            <p>
              We notify you of collection at the point of collection, including the purpose,
              and whether collection is required by law.
            </p>
          </Section>

          <Section title="4. How we use it (APP 6)">
            <p>We use your personal information only for the purposes for which it was collected:</p>
            <ul style={list}>
              <li>Operating your account and processing orders.</li>
              <li>Connecting buyers with farmers (e.g. sharing delivery addresses with the relevant farmer).</li>
              <li>Sending order confirmations, delivery updates, and important platform notices.</li>
              <li>Improving our service through anonymised analytics.</li>
              <li>Detecting fraud, abuse, or security breaches.</li>
              <li>Complying with legal obligations (tax records, dispute resolution).</li>
            </ul>
            <p>We will not use your information for unrelated marketing without your explicit consent.</p>
          </Section>

          <Section title="5. Who we share it with (APP 6)">
            <p>We share personal information only when necessary, with:</p>
            <ul style={list}>
              <li><strong>Farmers</strong> — your delivery name, address, and order details, so they can fulfil your order.</li>
              <li><strong>Buyers</strong> — the farm name, location, and contact details of farmers you order from.</li>
              <li><strong>Stripe</strong> — for payment processing (PCI-DSS compliant).</li>
              <li><strong>Service providers</strong> — hosting, email, AI assistance (each bound by confidentiality and data-handling obligations).</li>
              <li><strong>Law enforcement</strong> — when legally required by court order or statutory authority.</li>
            </ul>
            <p>We never sell your personal data to third parties.</p>
          </Section>

          <Section title="6. Data security (APP 11)">
            <p>We protect your personal information using:</p>
            <ul style={list}>
              <li>Encrypted transmission (HTTPS / TLS 1.3).</li>
              <li>Bcrypt-hashed passwords (never stored in plain text).</li>
              <li>Role-based access controls — staff only see what they need.</li>
              <li>Stripe handles all payment data; we never see your full card number.</li>
              <li>Regular security audits and dependency updates.</li>
            </ul>
            <p>
              No system is 100% secure. If we discover a data breach affecting you, we'll notify
              you and the OAIC (Office of the Australian Information Commissioner) as required
              by the Notifiable Data Breaches scheme.
            </p>
          </Section>

          <Section title="7. Your rights (APP 12 & APP 13)">
            <p>Under the Privacy Act, you have the right to:</p>
            <ul style={list}>
              <li><strong>Access</strong> the personal information we hold about you.</li>
              <li><strong>Correct</strong> information you believe is inaccurate or out of date.</li>
              <li><strong>Withdraw consent</strong> for non-essential processing (analytics, marketing).</li>
              <li><strong>Request deletion</strong> of your account and associated data (subject to legal retention requirements).</li>
              <li><strong>Lodge a complaint</strong> with the OAIC at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" style={inlineLink}>oaic.gov.au</a>.</li>
            </ul>
            <p>
              To exercise these rights, email us at {' '}
              <a href="mailto:ALS_MELB@kent.edu.au" style={inlineLink}>ALS_MELB@kent.edu.au</a>.
              We'll respond within 30 days.
            </p>
          </Section>

          <Section title="8. Data retention">
            <p>We keep your information only as long as needed:</p>
            <ul style={list}>
              <li><strong>Active accounts</strong> — for as long as you have an account.</li>
              <li><strong>Order records</strong> — 7 years (Australian tax law requirement).</li>
              <li><strong>Closed accounts</strong> — anonymised after 30 days, except for legally required records.</li>
              <li><strong>Marketing preferences</strong> — until you opt out.</li>
            </ul>
          </Section>

          <Section title="9. Overseas disclosure (APP 8)">
            <p>
              Some of our service providers (e.g. Stripe, hosting) are based overseas. When we share data with them,
              we take reasonable steps to ensure they handle it consistently with the Australian Privacy Principles.
              We do not currently transfer data to countries with materially weaker privacy laws than Australia.
            </p>
          </Section>

          <Section title="10. Children's privacy">
            <p>
              FarmMarket is not directed at children under 16. We don't knowingly collect personal information from
              children. If you believe we've inadvertently collected such data, contact us and we'll delete it promptly.
            </p>
          </Section>

          <Section title="11. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. The "Last updated" date at the top will reflect
              when changes were made. For material changes, we'll email you and prompt you to review the new policy.
            </p>
          </Section>

          <Section title="12. Contact" last>
            <p>Privacy questions, requests, or complaints — please email:</p>
            <p style={{ fontFamily: SERIF, fontSize: 22, color: C.charcoal, margin: '12px 0', letterSpacing: '-0.01em' }}>
              <a href="mailto:ALS_MELB@kent.edu.au" style={{ color: C.charcoal, textDecoration: 'none' }}>
                ALS_MELB@kent.edu.au
              </a>
            </p>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 16 }}>
              See also: <Link to="/cookie-policy" style={inlineLink}>Cookie Policy</Link> · <Link to="/terms" style={inlineLink}>Terms of Service</Link>
            </p>
          </Section>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children, last }) {
  return (
    <section style={{
      marginBottom: last ? 0 : 44,
      paddingBottom: last ? 0 : 44,
      borderBottom: last ? 'none' : `1px solid ${C.mistGray}`,
    }}>
      <h2 style={h2}>{title}</h2>
      <div style={proseWrap}>{children}</div>
    </section>
  );
}

const pageBase = { background: C.boneWhite, color: C.charcoal, fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh' };
const hero = { background: `linear-gradient(180deg, ${C.cream} 0%, ${C.boneWhite} 100%)`, padding: '72px 32px 56px', borderBottom: `1px solid ${C.mistGray}` };
const eyebrow = { fontSize: 11, fontWeight: 700, color: C.moss, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 14px' };
const h1 = { fontFamily: SERIF, fontSize: 56, fontWeight: 400, color: C.charcoal, margin: '0 0 18px', letterSpacing: '-0.025em', lineHeight: 1.05 };
const lead = { fontSize: 17, color: C.mutedDark, lineHeight: 1.7, margin: '0 0 22px', maxWidth: 640 };
const meta = { fontSize: 13, color: C.muted, margin: 0 };
const h2 = { fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: C.charcoal, margin: '0 0 16px', letterSpacing: '-0.018em', lineHeight: 1.2 };
const proseWrap = { fontSize: 15.5, color: C.mutedDark, lineHeight: 1.75 };
const list = { fontSize: 15, color: C.mutedDark, lineHeight: 1.85, paddingLeft: 22, margin: '14px 0' };
const inlineLink = { color: C.moss, textDecoration: 'underline', textUnderlineOffset: 2 };