"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "it";

const translations = {
  en: {
    tagline: "a register for finding a time everyone keeps",
    legalLinks: "Legal links",
    privacyPolicy: "Privacy policy",
    cookiePolicy: "Cookie policy",
    createPollKicker: "Create a poll",
    proposeMeeting: "Propose a meeting",
    title: "Title",
    titlePlaceholder: "e.g. Partner sync - curriculum review",
    organizerEmailOptional: "Your email optional",
    organizerEmailPlaceholder: "Used only if you lose this poll's organizer link",
    organizerEmailHelp: "If you enter an email, PoliPol can send this poll's private organizer link back to you.",
    proposedSlots: "Proposed slots",
    date: "Date",
    startTime: "Start time",
    endTime: "End time",
    removeSlot: "Remove slot",
    addSlot: "Add another slot",
    creating: "Creating...",
    createPoll: "Create poll",
    pollDataPrefix: "Poll data is handled as described in the",
    lostOrganizerLink: "Lost an organizer link?",
    recoverPolls: "Recover your polls by email",
    errorCreatePoll: "Could not create the poll.",
    addAvailability: "Add your availability for the proposed slots.",
    nameOptional: "Name optional",
    yourName: "Your name",
    organization: "Organization",
    organizationPlaceholder: "Your institution or team",
    email: "Email",
    yes: "Yes",
    ifNeeded: "If needed",
    no: "No",
    submitting: "Submitting...",
    submitResponse: "Submit response",
    submitPrivacyPrefix: "By submitting, your response is stored for this poll and visible to the organizer. See the",
    responseRecorded: "Thanks - your response has been recorded.",
    responseChangeHint: "You can change your answers and submit again as long as you keep this page open.",
    errorRecordResponse: "Could not record your response.",
    slotSelected: "Slot selected",
    selectedSlotNotice: "The organizer has selected {day}, {time}. You can still submit availability, but the meeting may already be scheduled.",
    preferencesSoFar: "Preferences so far",
    noPreferences: "No previous preferences yet.",
    oneResponse: "1 response so far",
    manyResponses: "{count} responses so far",
    choseThis: "{answers}/{total} chose this",
    yesCount: "{count} yes",
    ifNeededCount: "{count} if needed",
    noCount: "{count} no",
    chartLabel: "{answers} of {total} respondents chose this slot: {yes}, {maybe}, {no}.",
    organizerView: "Organizer view",
    recoveryEnabled: "Link recovery is enabled for this poll. We'll be able to email you this organizer link if you lose it.",
    participantLink: "Shareable participant link",
    participantLinkHelp: "Send this link to participants so they can submit or update their availability.",
    organizerLink: "Organizer private link",
    organizerLinkHelp: "Keep this link for yourself. It opens results, slot selection, downloads, and poll deletion.",
    downloadAll: "Download all respondents",
    downloadSelected: "Download available for selected slot",
    calendarShare: "Calendar to be shared",
    noResponses: "No responses yet. Share the link to start collecting availability.",
    exportNote: "The exported file marks each person as \"available\" or \"if needed\" for the selected slot - use that column to decide who's required vs. optional when you send the invite.",
    deleting: "Deleting...",
    deletePoll: "Delete poll",
    deleteConfirm: "Delete this poll and all responses?",
    copied: "Copied",
    copy: "Copy",
    participant: "Participant",
    selecting: "Selecting...",
    selected: "Selected",
    selectSlot: "Select this slot",
    anonymous: "Anonymous",
    answers: "Answers",
    errorSelectSlot: "Could not select that slot.",
    errorDeletePoll: "Could not delete the poll.",
    back: "Back",
    recoveryKicker: "Organizer link recovery",
    recoverTitle: "Recover your poll links",
    recoveryCopy: "Enter the organizer email you used when creating a poll. If any polls are tied to that email, PoliPol will send the private organizer links.",
    sending: "Sending...",
    sendRecovery: "Send recovery email",
    recoveryPrivacyPrefix: "Recovery requests use your email only to look for organizer links. See the",
    recoveryGeneric: "If we found any polls tied to that email, we've sent the links.",
    errorRecovery: "Could not submit recovery request.",
    language: "Language",
  },
  it: {
    tagline: "un registro per trovare un orario adatto a tutti",
    legalLinks: "Link legali",
    privacyPolicy: "Informativa sulla privacy",
    cookiePolicy: "Informativa sui cookie",
    createPollKicker: "Crea un sondaggio",
    proposeMeeting: "Proponi una riunione",
    title: "Titolo",
    titlePlaceholder: "es. Riunione partner - revisione del programma",
    organizerEmailOptional: "La tua email (facoltativa)",
    organizerEmailPlaceholder: "Usata solo se perdi il link organizzatore del sondaggio",
    organizerEmailHelp: "Se inserisci un'email, PoliPol potrà inviarti nuovamente il link privato dell'organizzatore.",
    proposedSlots: "Fasce orarie proposte",
    date: "Data",
    startTime: "Ora di inizio",
    endTime: "Ora di fine",
    removeSlot: "Rimuovi fascia oraria",
    addSlot: "Aggiungi un'altra fascia oraria",
    creating: "Creazione...",
    createPoll: "Crea sondaggio",
    pollDataPrefix: "I dati del sondaggio sono trattati come descritto nell'",
    lostOrganizerLink: "Hai perso un link organizzatore?",
    recoverPolls: "Recupera i tuoi sondaggi via email",
    errorCreatePoll: "Impossibile creare il sondaggio.",
    addAvailability: "Indica la tua disponibilità per le fasce orarie proposte.",
    nameOptional: "Nome (facoltativo)",
    yourName: "Il tuo nome",
    organization: "Organizzazione",
    organizationPlaceholder: "La tua istituzione o il tuo team",
    email: "Email",
    yes: "Sì",
    ifNeeded: "Se necessario",
    no: "No",
    submitting: "Invio...",
    submitResponse: "Invia risposta",
    submitPrivacyPrefix: "Inviando la risposta, i dati saranno salvati per questo sondaggio e visibili all'organizzatore. Consulta l'",
    responseRecorded: "Grazie - la tua risposta è stata registrata.",
    responseChangeHint: "Puoi modificare le risposte e inviarle di nuovo finché mantieni aperta questa pagina.",
    errorRecordResponse: "Impossibile registrare la risposta.",
    slotSelected: "Fascia selezionata",
    selectedSlotNotice: "L'organizzatore ha selezionato {day}, {time}. Puoi ancora inviare la disponibilità, ma la riunione potrebbe essere già stata programmata.",
    preferencesSoFar: "Preferenze finora",
    noPreferences: "Non ci sono ancora preferenze precedenti.",
    oneResponse: "1 risposta finora",
    manyResponses: "{count} risposte finora",
    choseThis: "{answers}/{total} disponibili",
    yesCount: "{count} sì",
    ifNeededCount: "{count} se necessario",
    noCount: "{count} no",
    chartLabel: "{answers} rispondenti su {total} hanno scelto questa fascia: {yes}, {maybe}, {no}.",
    organizerView: "Vista organizzatore",
    recoveryEnabled: "Il recupero del link è attivo per questo sondaggio. Potremo inviarti via email il link organizzatore se lo perdi.",
    participantLink: "Link condivisibile per i partecipanti",
    participantLinkHelp: "Invia questo link ai partecipanti perché possano indicare o aggiornare la propria disponibilità.",
    organizerLink: "Link privato dell'organizzatore",
    organizerLinkHelp: "Conserva questo link per te. Permette di vedere i risultati, selezionare la fascia, scaricare i dati ed eliminare il sondaggio.",
    downloadAll: "Scarica tutti i rispondenti",
    downloadSelected: "Scarica i disponibili per la fascia selezionata",
    calendarShare: "Calendario da condividere",
    noResponses: "Nessuna risposta. Condividi il link per iniziare a raccogliere le disponibilità.",
    exportNote: "Il file esportato indica ogni persona come \"disponibile\" o \"se necessario\" per la fascia selezionata: usa questa colonna per decidere chi è necessario o facoltativo nell'invito.",
    deleting: "Eliminazione...",
    deletePoll: "Elimina sondaggio",
    deleteConfirm: "Eliminare questo sondaggio e tutte le risposte?",
    copied: "Copiato",
    copy: "Copia",
    participant: "Partecipante",
    selecting: "Selezione...",
    selected: "Selezionata",
    selectSlot: "Seleziona questa fascia",
    anonymous: "Anonimo",
    answers: "Risposte",
    errorSelectSlot: "Impossibile selezionare questa fascia.",
    errorDeletePoll: "Impossibile eliminare il sondaggio.",
    back: "Indietro",
    recoveryKicker: "Recupero link organizzatore",
    recoverTitle: "Recupera i link dei tuoi sondaggi",
    recoveryCopy: "Inserisci l'email dell'organizzatore usata per creare il sondaggio. Se ci sono sondaggi associati, PoliPol invierà i relativi link privati.",
    sending: "Invio...",
    sendRecovery: "Invia email di recupero",
    recoveryPrivacyPrefix: "La richiesta usa la tua email solo per cercare i link organizzatore. Consulta l'",
    recoveryGeneric: "Se abbiamo trovato sondaggi associati a questa email, abbiamo inviato i link.",
    errorRecovery: "Impossibile inviare la richiesta di recupero.",
    language: "Lingua",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
type Variables = Record<string, string | number>;

type LanguageContextValue = {
  language: Language;
  locale: "en-GB" | "it-IT";
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, variables?: Variables) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("polipol-language");
    const next = stored === "en" || stored === "it"
      ? stored
      : navigator.language.toLowerCase().startsWith("it")
        ? "it"
        : "en";
    setLanguageState(next);
    document.documentElement.lang = next;
  }, []);

  function setLanguage(next: Language) {
    setLanguageState(next);
    window.localStorage.setItem("polipol-language", next);
    document.documentElement.lang = next;
  }

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    locale: language === "it" ? "it-IT" : "en-GB",
    setLanguage,
    t: (key, variables = {}) => {
      let text: string = translations[language][key];
      for (const [name, replacement] of Object.entries(variables)) {
        text = text.replaceAll(`{${name}}`, String(replacement));
      }
      return text;
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

export function localizeApiError(message: string | undefined, language: Language, fallback: string) {
  if (!message || language === "en") return message || fallback;

  const errors: Record<string, string> = {
    "Title is required.": "Il titolo è obbligatorio.",
    "Add at least one valid slot.": "Aggiungi almeno una fascia oraria valida.",
    "Enter a valid organizer email.": "Inserisci un'email organizzatore valida.",
    "Organization is required.": "L'organizzazione è obbligatoria.",
    "Enter a valid email address.": "Inserisci un indirizzo email valido.",
    "Availability must match the event slots.": "La disponibilità deve corrispondere alle fasce orarie del sondaggio.",
    "Recovery email is not configured.": "L'email di recupero non è configurata.",
    "Not found.": "Elemento non trovato.",
  };

  return errors[message] || fallback;
}
