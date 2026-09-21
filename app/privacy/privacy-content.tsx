"use client";

import { useLanguage } from "../../lib/i18n";

export function PrivacyContent() {
  const { language } = useLanguage();

  if (language === "it") {
    return (
      <section className="section fadein policy-page">
        <p className="page-kicker sans">Informativa sulla privacy</p>
        <h1 className="page-title">Come PoliPol tratta i dati dei sondaggi</h1>
        <p className="policy-updated sans">Ultimo aggiornamento: 21 luglio 2026</p>

        <div className="policy-note sans">
          PoliPol è progettato secondo i principi di trasparenza e minimizzazione dei dati del GDPR
          dell'UE. Questa informativa non costituisce una certificazione legale: gli organizzatori
          restano responsabili dell'uso di sondaggi, esportazioni e inviti nel rispetto dei propri
          obblighi istituzionali e legali.
        </div>

        <PolicySection title="Soggetti coinvolti">
          <p>
            PoliPol fornisce lo strumento di pianificazione. L'organizzatore che crea e condivide un
            sondaggio decide perché viene utilizzato e chi è invitato a rispondere. Per domande su uno
            specifico sondaggio, contatta l'organizzatore che ha inviato il link. Per richieste sulla
            privacy relative alla piattaforma, scrivi a{" "}
            <a href="mailto:privacy@polipol.it">privacy@polipol.it</a>.
          </p>
        </PolicySection>

        <PolicySection title="Dati raccolti">
          <ul>
            <li>Email dell'organizzatore, solo se inserita per il recupero del link.</li>
            <li>Titolo, date e orari proposti, fascia finale selezionata e data di creazione.</li>
            <li>Organizzazione, email, nome facoltativo e disponibilità dei rispondenti.</li>
            <li>Conteggi aggregati anonimi mostrati ai rispondenti per ogni fascia proposta.</li>
          </ul>
        </PolicySection>

        <PolicySection title="Finalità">
          <ul>
            <li>Creare e gestire sondaggi di pianificazione.</li>
            <li>Raccogliere, aggiornare, mostrare ed esportare le risposte per l'organizzatore.</li>
            <li>Mostrare ai rispondenti i totali anonimi delle preferenze precedenti.</li>
            <li>Inviare via email i link privati quando viene richiesto il recupero.</li>
            <li>Garantire sicurezza, affidabilità e prevenzione degli abusi del servizio.</li>
          </ul>
        </PolicySection>

        <PolicySection title="Base giuridica">
          <p>
            La base giuridica dipende dal contesto dell'organizzatore, per esempio un compito
            istituzionale, un legittimo interesse, un coordinamento contrattuale o il consenso quando
            l'organizzatore sceglie di basarsi su di esso. PoliPol è uno strumento di pianificazione e
            non determina la base giuridica dell'organizzatore. Il trattamento della piattaforma è
            limitato alla fornitura, sicurezza e manutenzione del servizio richiesto.
          </p>
        </PolicySection>

        <PolicySection title="Chi può vedere i dati">
          <ul>
            <li>Chi possiede il link privato può vedere risposte individuali ed esportazioni.</li>
            <li>Chi possiede il link pubblico vede solo totali anonimi per fascia oraria.</li>
            <li>PoliPol non pubblica intenzionalmente nomi, email o organizzazioni dei rispondenti.</li>
          </ul>
        </PolicySection>

        <PolicySection title="Responsabili del trattamento">
          <p>PoliPol utilizza servizi di terze parti per il proprio funzionamento:</p>
          <ul>
            <li>Vercel per hosting ed esecuzione serverless.</li>
            <li>Supabase per l'archiviazione nel database.</li>
            <li>Resend per le email di recupero dei link organizzatore.</li>
          </ul>
        </PolicySection>

        <PolicySection title="Conservazione">
          <p>
            I dati sono conservati finché l'organizzatore non elimina il sondaggio. PoliPol non
            applica attualmente una scadenza automatica. Gli organizzatori dovrebbero eliminare i
            sondaggi quando non sono più necessari.
          </p>
        </PolicySection>

        <PolicySection title="I tuoi diritti">
          <p>
            A seconda del contesto, i diritti europei sulla protezione dei dati possono includere
            accesso, rettifica, cancellazione, limitazione, opposizione, portabilità, revoca del
            consenso quando utilizzato e reclamo a un'autorità di controllo. Contatta l'organizzatore
            per richieste sul sondaggio o{" "}
            <a href="mailto:privacy@polipol.it">privacy@polipol.it</a> per richieste sulla piattaforma.
          </p>
        </PolicySection>

        <PolicySection title="Cookie e tracciamento">
          <p>
            PoliPol non utilizza cookie pubblicitari, di profilazione o analitici. Consulta l'{" "}
            <a href="/cookies">Informativa sui cookie</a> per i dettagli.
          </p>
        </PolicySection>
      </section>
    );
  }

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

      <PolicySection title="Who is involved"><p>PoliPol provides the scheduling tool. The organizer who creates and shares a poll decides why that poll is used and who is invited to answer it. For poll-specific questions, contact the organizer who sent you the link. For platform-level privacy requests, contact <a href="mailto:privacy@polipol.it">privacy@polipol.it</a>.</p></PolicySection>
      <PolicySection title="Data collected"><ul><li>Organizer email, only if the organizer enters it for link recovery.</li><li>Poll title, proposed dates/times, selected final slot, and creation date.</li><li>Respondent organization, email, optional name, and availability choices.</li><li>Anonymous aggregate counts shown to later respondents for each proposed slot.</li></ul></PolicySection>
      <PolicySection title="Purposes"><ul><li>Create and manage scheduling polls.</li><li>Collect, update, display, and export responses for the organizer.</li><li>Show respondents anonymous preference totals from previous responses.</li><li>Email private organizer links when link recovery is requested.</li><li>Maintain basic security, reliability, and abuse prevention for the service.</li></ul></PolicySection>
      <PolicySection title="Legal basis"><p>The legal basis can depend on the organizer's context, for example an institutional task, legitimate interest, contract-related coordination, or consent where the organizer chooses to rely on consent. PoliPol is a scheduling tool and does not decide the organizer's legal basis. Platform-level processing is limited to providing, securing, and maintaining the requested scheduling service.</p></PolicySection>
      <PolicySection title="Who can see data"><ul><li>Organizers with the private organizer link can see individual responses and exports.</li><li>Respondents with the public poll link can see only anonymous per-slot totals.</li><li>PoliPol does not intentionally publish respondent names, emails, or organizations.</li></ul></PolicySection>
      <PolicySection title="Processors"><p>PoliPol uses third-party infrastructure to operate the service:</p><ul><li>Vercel for web hosting and serverless execution.</li><li>Supabase for database storage.</li><li>Resend for organizer-link recovery emails.</li></ul></PolicySection>
      <PolicySection title="Retention"><p>Poll data is kept until the organizer deletes the poll. PoliPol currently does not apply an automatic deletion deadline. Organizers should delete polls when they are no longer needed.</p></PolicySection>
      <PolicySection title="Your rights"><p>Depending on the context, EU data protection rights may include access, correction, deletion, restriction, objection, portability, withdrawal of consent where consent is used, and the right to lodge a complaint with a data protection authority. Contact the poll organizer for poll-specific requests or <a href="mailto:privacy@polipol.it">privacy@polipol.it</a> for platform-level requests.</p></PolicySection>
      <PolicySection title="Cookies and tracking"><p>PoliPol does not use advertising cookies, profiling cookies, or analytics cookies. See the <a href="/cookies">Cookie policy</a> for details.</p></PolicySection>
    </section>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="policy-section"><h2>{title}</h2>{children}</section>;
}
