// pages/Terms.jsx — Terms of Service
// Author: CPRO306 Capstone | Date: 2026

import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const C = {
  forest:'#253528', moss:'#3D5B45', sage:'#A7BFA5',
  cream:'#F6F3EE', boneWhite:'#FBFAF8', charcoal:'#1C1F1D',
  mistGray:'#E7E5E0', muted:'#6B7280', mutedDark:'#4B5563',
};
const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

export default function Terms() {
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
            Terms of <span style={{ color: C.moss, fontStyle: 'italic' }}>Service</span>
          </h1>
          <p style={lead}>
            The agreement between you and FarmMarket. By using our platform, you agree to
            these terms. Please read them carefully.
          </p>
          <p style={meta}>Last updated: 1 January 2026 · Effective from: 1 January 2026</p>
        </div>
      </section>

      <section style={{ padding: '64px 32px 96px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <Section title="1. Acceptance of terms">
            <p>
              By accessing or using FarmMarket, you agree to be bound by these Terms of Service ("Terms"),
              our <Link to="/privacy" style={inlineLink}>Privacy Policy</Link>, and our
              <Link to="/cookie-policy" style={inlineLink}> Cookie Policy</Link>.
              If you don't agree, please don't use the service.
            </p>
            <p>
              You must be at least 16 years old to use FarmMarket. If you're under 18, you confirm
              you have a parent or guardian's permission.
            </p>
          </Section>

          <Section title="2. About the platform">
            <p>
              FarmMarket is a marketplace that connects Australian farmers ("Farmers") directly with
              buyers ("Buyers"). We provide the platform, but we are <em>not</em> a party to the actual
              sale. Each transaction is a contract between the buyer and the farmer.
            </p>
            <p>
              We facilitate listings, payments (via Stripe), and communication. Farmers are
              responsible for the accuracy of their listings and the quality of their produce.
            </p>
          </Section>

          <Section title="3. Accounts">
            <p>To buy or sell on FarmMarket, you need an account. You agree to:</p>
            <ul style={list}>
              <li>Provide accurate, current, and complete information.</li>
              <li>Keep your password confidential and not share your account.</li>
              <li>Notify us immediately of any unauthorised use of your account.</li>
              <li>Not create multiple accounts to circumvent restrictions.</li>
              <li>Be responsible for all activity that happens under your account.</li>
            </ul>
            <p>
              We may suspend or terminate accounts that violate these Terms, with or without notice.
            </p>
          </Section>

          <Section title="4. Farmer obligations">
            <p>If you list products as a Farmer, you agree to:</p>
            <ul style={list}>
              <li>Only list produce you have the legal right to sell.</li>
              <li>Provide accurate descriptions, quantities, and prices.</li>
              <li>Comply with all applicable food-safety, labelling, and trade laws.</li>
              <li>Honour the prices you list and fulfil orders within the promised timeframe.</li>
              <li>Communicate promptly with buyers about any issues.</li>
              <li>Not list prohibited items (live animals other than as permitted by law, alcohol without proper licensing, illegal goods).</li>
            </ul>
            <p>
              You retain ownership of your listings. By posting them, you grant FarmMarket a
              non-exclusive licence to display them on the platform and in marketing materials.
            </p>
          </Section>

          <Section title="5. Buyer obligations">
            <p>If you buy on FarmMarket, you agree to:</p>
            <ul style={list}>
              <li>Pay for items you order using a valid payment method.</li>
              <li>Provide accurate delivery information.</li>
              <li>Not abuse the dispute-resolution process or initiate fraudulent chargebacks.</li>
              <li>Treat farmers and customer support with respect.</li>
            </ul>
          </Section>

          <Section title="6. Orders and payments">
            <p>
              All payments are processed by Stripe under their own terms.
              FarmMarket does not store full payment card details on its servers.
            </p>
            <ul style={list}>
              <li>Prices are in Australian dollars (AUD), inclusive of GST where applicable.</li>
              <li>An order is a binding contract once payment is confirmed.</li>
              <li>Delivery fees and timelines are set by individual farmers and shown at checkout.</li>
              <li>Risk of loss passes to the buyer upon delivery.</li>
            </ul>
          </Section>

          <Section title="7. Refunds and disputes">
            <p>
              If your order is damaged, missing, or significantly different from what was listed,
              please contact the farmer first. If the issue can't be resolved within 7 days,
              you can escalate to FarmMarket support and we'll mediate.
            </p>
            <p>
              Refunds are issued through the original payment method. Perishable goods that have been delivered
              fresh and as described are not eligible for refund based on change of mind.
            </p>
          </Section>

          <Section title="8. Prohibited conduct">
            <p>You must not, while using FarmMarket:</p>
            <ul style={list}>
              <li>Violate any applicable law or regulation.</li>
              <li>Post false, misleading, or fraudulent listings.</li>
              <li>Harass, abuse, or harm another user.</li>
              <li>Attempt to gain unauthorised access to the platform or other users' accounts.</li>
              <li>Use bots, scrapers, or automated tools to access the service.</li>
              <li>Upload viruses, malware, or anything intended to disrupt the service.</li>
              <li>Circumvent fees or facilitate transactions outside the platform.</li>
            </ul>
          </Section>

          <Section title="9. Intellectual property">
            <p>
              The FarmMarket name, logo, design, code, and content (other than user-submitted listings) are owned
              by us or our licensors and protected by copyright and trademark law. You may not copy, modify,
              or redistribute them without permission.
            </p>
            <p>
              You retain rights to content you upload (listings, photos, reviews) but grant us a worldwide,
              non-exclusive licence to use it for operating and promoting the platform.
            </p>
          </Section>

          <Section title="10. AI features">
            <p>
              FarmMarket uses AI assistants (powered by Groq) for chat support and product description suggestions.
              AI responses are generated automatically and may sometimes be inaccurate. Don't rely on them for
              medical, legal, or other professional advice. We don't use your conversations to train AI models.
            </p>
          </Section>

          <Section title="11. Limitation of liability">
            <p>
              To the extent permitted by Australian law, FarmMarket is not liable for:
            </p>
            <ul style={list}>
              <li>Quality, safety, or legality of items listed by farmers.</li>
              <li>Disputes between buyers and farmers.</li>
              <li>Indirect, incidental, or consequential damages.</li>
              <li>Loss of profits, data, or business arising from use of the service.</li>
            </ul>
            <p>
              Nothing in these Terms excludes or limits any consumer rights or guarantees you have
              under the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)).
            </p>
          </Section>

          <Section title="12. Termination">
            <p>You can close your account anytime from your dashboard, or by emailing us.</p>
            <p>
              We can suspend or terminate accounts that violate these Terms. Outstanding orders will be
              honoured where possible, and we'll comply with applicable refund obligations.
            </p>
          </Section>

          <Section title="13. Governing law">
            <p>
              These Terms are governed by the laws of Victoria, Australia. Any disputes will be subject
              to the exclusive jurisdiction of the courts of Victoria.
            </p>
          </Section>

          <Section title="14. Changes to these Terms">
            <p>
              We may update these Terms from time to time. We'll notify you of material changes by email
              and give you 30 days to review them before they take effect. Continued use after that
              counts as acceptance.
            </p>
          </Section>

          <Section title="15. Contact" last>
            <p>Questions about these Terms? Email us:</p>
            <p style={{ fontFamily: SERIF, fontSize: 22, color: C.charcoal, margin: '12px 0', letterSpacing: '-0.01em' }}>
              <a href="mailto:ALS_MELB@kent.edu.au" style={{ color: C.charcoal, textDecoration: 'none' }}>
                ALS_MELB@kent.edu.au
              </a>
            </p>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 16 }}>
              See also: <Link to="/privacy" style={inlineLink}>Privacy Policy</Link> · <Link to="/cookie-policy" style={inlineLink}>Cookie Policy</Link>
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