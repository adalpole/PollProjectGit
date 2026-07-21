import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "Cookie and tracking information for PoliPol.",
};

export default function CookiesPage() {
  return (
    <section className="section fadein policy-page">
      <p className="page-kicker sans">Cookie policy</p>
      <h1 className="page-title">Cookies and tracking</h1>
      <p className="policy-updated sans">Last updated: 21 July 2026</p>

      <div className="policy-note sans">
        PoliPol is designed to work without advertising, profiling, analytics, or login cookies. For
        this reason, the app does not show a cookie consent banner.
      </div>

      <PolicySection title="Current use">
        <p>
          PoliPol itself does not intentionally set cookies for analytics, advertising, profiling, or
          logged-in user sessions. The app uses simple public links and private organizer links
          instead of account cookies.
        </p>
      </PolicySection>

      <PolicySection title="Technical data">
        <p>
          Hosting, database, and email providers may process technical request data needed to deliver
          the service, such as IP address, user agent, timestamps, request URLs, and security logs.
          This is used for service delivery, reliability, and abuse prevention, not for advertising
          profiles.
        </p>
      </PolicySection>

      <PolicySection title="If tracking is added later">
        <p>
          If PoliPol later adds analytics, advertising, profiling, or other non-essential tracking,
          this policy should be updated before those tools run and an appropriate consent mechanism
          should be added where required.
        </p>
      </PolicySection>

      <PolicySection title="Related information">
        <p>
          See the <a href="/privacy">Privacy policy</a> for information about personal data handled
          by scheduling polls.
        </p>
      </PolicySection>
    </section>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="policy-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
