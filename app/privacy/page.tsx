import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy | PoliPol",
  description: "Privacy information for PoliPol scheduling polls.",
};

export default function PrivacyPage() {
  return (
    <section className="section fadein policy-page">
      <p className="page-kicker sans">Privacy policy</p>
      <h1 className="page-title">How PoliPol handles poll data</h1>
      <p className="policy-updated sans">Last updated: 21 July 2026</p>

      <div className="policy-note sans">
        PoliPol is designed to support EU GDPR transparency and data-minimisation principles. This
        notice is not a legal certification: organizers remain responsible for using polls, exports,
        and invitations consistently with their own institutional or legal obligations.
      </div>

      <PolicySection title="Who is involved">
        <p>
          PoliPol provides the scheduling tool. The organizer who creates and shares a poll decides
          why that poll is used and who is invited to answer it. For poll-specific questions, contact
          the organizer who sent you the link. For platform-level privacy requests, contact{" "}
          <a href="mailto:privacy@polipol.it">privacy@polipol.it</a>.
        </p>
      </PolicySection>

      <PolicySection title="Data collected">
        <ul>
          <li>Organizer email, only if the organizer enters it for link recovery.</li>
          <li>Poll title, proposed dates/times, selected final slot, and creation date.</li>
          <li>Respondent organization, email, optional name, and availability choices.</li>
          <li>Anonymous aggregate counts shown to later respondents for each proposed slot.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Purposes">
        <ul>
          <li>Create and manage scheduling polls.</li>
          <li>Collect, update, display, and export responses for the organizer.</li>
          <li>Show respondents anonymous preference totals from previous responses.</li>
          <li>Email private organizer links when link recovery is requested.</li>
          <li>Maintain basic security, reliability, and abuse prevention for the service.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Legal basis">
        <p>
          The legal basis can depend on the organizer's context, for example an institutional task,
          legitimate interest, contract-related coordination, or consent where the organizer chooses
          to rely on consent. PoliPol is a scheduling tool and does not decide the organizer's legal
          basis. Platform-level processing is limited to providing, securing, and maintaining the
          requested scheduling service.
        </p>
      </PolicySection>

      <PolicySection title="Who can see data">
        <ul>
          <li>Organizers with the private organizer link can see individual responses and exports.</li>
          <li>Respondents with the public poll link can see only anonymous per-slot totals.</li>
          <li>PoliPol does not intentionally publish respondent names, emails, or organizations.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Processors">
        <p>PoliPol uses third-party infrastructure to operate the service:</p>
        <ul>
          <li>Vercel for web hosting and serverless execution.</li>
          <li>Supabase for database storage.</li>
          <li>Resend for organizer-link recovery emails.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Retention">
        <p>
          Poll data is kept until the organizer deletes the poll. PoliPol currently does not apply an
          automatic deletion deadline. Organizers should delete polls when they are no longer needed.
        </p>
      </PolicySection>

      <PolicySection title="Your rights">
        <p>
          Depending on the context, EU data protection rights may include access, correction,
          deletion, restriction, objection, portability, withdrawal of consent where consent is used,
          and the right to lodge a complaint with a data protection authority. Contact the poll
          organizer for poll-specific requests or{" "}
          <a href="mailto:privacy@polipol.it">privacy@polipol.it</a> for platform-level requests.
        </p>
      </PolicySection>

      <PolicySection title="Cookies and tracking">
        <p>
          PoliPol does not use advertising cookies, profiling cookies, or analytics cookies. See the{" "}
          <a href="/cookies">Cookie policy</a> for details.
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
