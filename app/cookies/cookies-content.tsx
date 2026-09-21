"use client";

import { useLanguage } from "../../lib/i18n";

export function CookiesContent() {
  const { language } = useLanguage();

  if (language === "it") {
    return (
      <section className="section fadein policy-page">
        <p className="page-kicker sans">Informativa sui cookie</p>
        <h1 className="page-title">Cookie e tracciamento</h1>
        <p className="policy-updated sans">Ultimo aggiornamento: 21 luglio 2026</p>

        <div className="policy-note sans">
          PoliPol è progettato per funzionare senza cookie pubblicitari, di profilazione, analitici o
          di accesso. Per questo motivo l'app non mostra un banner per il consenso ai cookie.
        </div>

        <PolicySection title="Uso attuale">
          <p>
            PoliPol non imposta intenzionalmente cookie per analisi, pubblicità, profilazione o
            sessioni di utenti autenticati. L'app utilizza semplici link pubblici e link privati
            dell'organizzatore al posto dei cookie di account. La lingua selezionata viene salvata
            solo nella memoria locale del browser per mantenerla durante le visite successive; non
            viene usata per il tracciamento.
          </p>
        </PolicySection>

        <PolicySection title="Dati tecnici">
          <p>
            I fornitori di hosting, database ed email possono trattare i dati tecnici necessari a
            erogare il servizio, come indirizzo IP, user agent, orari, URL richiesti e log di
            sicurezza. Questi dati servono per erogazione, affidabilità e prevenzione degli abusi,
            non per profili pubblicitari.
          </p>
        </PolicySection>

        <PolicySection title="Eventuale tracciamento futuro">
          <p>
            Se in futuro PoliPol aggiungesse analisi, pubblicità, profilazione o altri tracciamenti
            non essenziali, questa informativa sarà aggiornata prima dell'attivazione e sarà aggiunto
            un meccanismo di consenso adeguato, ove richiesto.
          </p>
        </PolicySection>

        <PolicySection title="Informazioni correlate">
          <p>
            Consulta l'<a href="/privacy">Informativa sulla privacy</a> per informazioni sui dati
            personali trattati nei sondaggi di pianificazione.
          </p>
        </PolicySection>
      </section>
    );
  }

  return (
    <section className="section fadein policy-page">
      <p className="page-kicker sans">Cookie policy</p>
      <h1 className="page-title">Cookies and tracking</h1>
      <p className="policy-updated sans">Last updated: 21 July 2026</p>

      <div className="policy-note sans">
        PoliPol is designed to work without advertising, profiling, analytics, or login cookies. For
        this reason, the app does not show a cookie consent banner.
      </div>

      <PolicySection title="Current use"><p>PoliPol itself does not intentionally set cookies for analytics, advertising, profiling, or logged-in user sessions. The app uses simple public links and private organizer links instead of account cookies. The selected language is stored only in local browser storage so it remains available on later visits; it is not used for tracking.</p></PolicySection>
      <PolicySection title="Technical data"><p>Hosting, database, and email providers may process technical request data needed to deliver the service, such as IP address, user agent, timestamps, request URLs, and security logs. This is used for service delivery, reliability, and abuse prevention, not for advertising profiles.</p></PolicySection>
      <PolicySection title="If tracking is added later"><p>If PoliPol later adds analytics, advertising, profiling, or other non-essential tracking, this policy should be updated before those tools run and an appropriate consent mechanism should be added where required.</p></PolicySection>
      <PolicySection title="Related information"><p>See the <a href="/privacy">Privacy policy</a> for information about personal data handled by scheduling polls.</p></PolicySection>
    </section>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="policy-section"><h2>{title}</h2>{children}</section>;
}
