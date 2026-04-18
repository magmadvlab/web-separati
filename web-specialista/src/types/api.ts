// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  timestamp?: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  ruolo: "paziente" | "medico" | "specialista" | "farmacista" | "rider";
  // Dati comuni
  nome?: string;
  cognome?: string;
  // Dati paziente
  codiceFiscale?: string;
  dataNascita?: string;
  telefono?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  // Dati medico
  codiceRegionale?: string;
  specializzazione?: string;
  macroArea?: string;
  // Dati farmacista
  partitaIva?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    ruolo: string;
  };
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  ruolo: "paziente" | "medico" | "specialista" | "farmacista" | "rider" | "admin";
}

// Paziente Types
export interface Paziente {
  id: number;
  utenteId: number;
  codiceFiscale: string;
  tesseraSanitaria?: string;
  nome: string;
  cognome: string;
  dataNascita: string;
  sesso?: string;
  telefono?: string;
  emailPersonale?: string;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  latitudine?: number;
  longitudine?: number;
  farmaciaPreferitaId?: number;
  orarioPreferitoConsegna?: string;
  noteConsegna?: string;
  abbonamentoTipo?: string;
  abbonamentoScadenza?: string;
  creditiRimanenti: number;
  allergie: string[];
  patologieCroniche: string[];
  medicoCuranteId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Prescrizione {
  id: number;
  pazienteId: number;
  medicoId?: number;
  numeroRicetta?: string;
  codiceNre?: string;
  dataEmissione: string;
  dataRicezione?: string;
  dataScadenza?: string;
  dataValidita?: string;
  tipo?: string;
  tipoRicetta?: string;
  ripetibile?: boolean;
  numeroRipetizioni?: number;
  ripetizioniUtilizzate?: number;
  stato: string;
  note?: string;
  noteMedico?: string;
  farmaci: FarmacoPrescrizione[] | any;
  filePdfPath?: string;
  filePdfHash?: string;
  paziente?: Paziente;
  medico?: Medico;
  ordini?: Array<{
    id: number;
    codiceOrdine: string;
    stato: string;
    dataCreazione: string;
    farmacia?: {
      id: number;
      nome: string;
    };
  }>;
  terapie?: Array<{
    id: number;
    posologia: string;
    dataInizio: string;
    stato: string;
    farmaco?: {
      nomeCommerciale: string;
    };
  }>;
}

export interface FarmacoPrescrizione {
  id: number;
  prescrizioneId: number;
  nomeFarmaco: string;
  principioAttivo?: string;
  quantita: number;
  posologia?: string;
  note?: string;
}

export interface Ordine {
  id: number;
  pazienteId: number;
  prescrizioneId?: number;
  farmaciaId?: number;
  riderId?: number;
  stato: string;
  importoTotale?: number;
  dataCreazione: string;
  dataConsegnaPrevista?: string;
  dataConsegnaEffettiva?: string;
  indirizzoConsegna: string;
  note?: string;
  farmaci: OrdineFarmaco[];
  paziente?: Paziente;
  farmacia?: Farmacia;
  rider?: Rider;
  // Campi aggiuntivi per dettaglio ordine
  codiceOrdine?: string;
  tipoConsegna?: "domicilio" | "ritiro";
  totaleFarmaci?: number;
  totaleDaBanco?: number;
  costoConsegna?: number;
  totale?: number;
  dataPronto?: string;
  dataSpedizione?: string;
  trackingNumber?: string;
  finestraOraria?: string;
  noteConsegna?: string;
  prescrizione?: {
    id: number;
    numeroRicetta?: string;
    codiceNre?: string;
    dataEmissione?: string;
  };
}

export interface OrdineFarmaco {
  id: number;
  ordineId: number;
  farmacoId?: number;
  nomeFarmaco: string;
  quantita: number;
  prezzo?: number;
  ricettaRichiesta?: boolean;
}

export interface Terapia {
  fotoTalloncinoUrl?: string;
  id: number;
  pazienteId: number;
  farmacoId?: number;
  prescrizioneId?: number;
  medicoId?: number;
  posologia: string;
  doseGiornaliera: number;
  frequenza?: string;
  orariAssunzione: string[];
  conPasto: boolean;
  dataInizio: string;
  dataFine?: string;
  durataGiorni?: number;
  quantitaTotale?: number;
  quantitaRimanente?: number;
  numeroScatole?: number;
  compressePerScatola?: number;
  tipo: string;
  continuativa: boolean;
  stato: string;
  ultimoRinnovo?: string;
  prossimoRinnovo?: string;
  dataProssimaAssunzione?: string;
  richiestaRinnovoInCorso?: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
  // Campi reminder (da endpoint /paziente/terapie/reminder)
  giorniRimanenti?: number;
  statoReminder?: 'ok' | 'warning' | 'critical';
  messaggioReminder?: string;
  azioneRichiesta?: 'ritiro' | 'rinnovo' | null;
  farmaco?: {
    id: number;
    nomeCommerciale: string;
    principioAttivo?: string;
    formaFarmaceutica?: string;
    dosaggio?: string;
    ricettaRichiesta?: boolean;
  };
  medico?: {
    id: number;
    nome: string;
    cognome: string;
  };
  prescrizione?: {
    id: number;
    numeroRicetta?: string;
    ripetibile?: boolean;
    numeroRipetizioni?: number;
    ripetizioniUtilizzate?: number;
    dataValidita?: string;
    tipoRicetta?: string;
  };
}

// Medico Types
export interface Medico {
  id: number;
  utenteId: number;
  codiceRegionale: string;
  nome: string;
  cognome: string;
  specializzazione?: string;
  telefono?: string;
  emailProfessionale?: string;
  email?: string;
  indirizzoStudio?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescrizioneRequest {
  pazienteId: number;
  farmaci: Array<{
    nomeFarmaco: string;
    principioAttivo?: string;
    quantita: number;
    posologia?: string;
    note?: string;
  }>;
  note?: string;
  codiceNre?: string;
  fotoTalloncino?: string;
}

// Farmacia Types
export interface Farmacia {
  id: number;
  partitaIva: string;
  nome: string;
  codiceFarmacia?: string;
  indirizzo: string;
  citta: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  latitudine?: number;
  longitudine?: number;
  stato?: string;
  convenzionata?: boolean;
  orariApertura?: any;
  giorniChiusura?: string[];
  consegnaAttiva?: boolean;
  ritiroAttivo?: boolean;
  preparazioneRapida?: boolean;
  servizio24h?: boolean;
  turnoNotturno?: boolean;
  maxOrdiniGiornalieri?: number;
  tempoMedioPreparazione?: number;
  ordiniInCoda?: number;
  partecipaBatch?: boolean;
  zonaOperativa?: string;
  capacitaBatchSettimanale?: number;
  orariConsegnaBatch?: any;
  emailNotificheBatch?: string;
  scoreAffidabilita?: number;
  batchAttivi?: number;
  notificheEmail?: boolean;
  notificheSms?: boolean;
  notifichePush?: boolean;
  dataConvenzione?: string;
  quotaPartecipazione?: number;
  percentualeRicettazero?: number;
  distanzaKm?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Farmaco {
  id: number;
  codiceAic?: string;
  nome: string;
  nomeCommerciale?: string;
  principioAttivo?: string;
  formaFarmaceutica?: string;
  dosaggio?: string;
  prezzo?: number;
  disponibile: boolean;
  ricettaRichiesta?: boolean;
  classe?: string;
  mutuabile?: boolean;
  fascia?: string;
}

export interface UpdateOrdineRequest {
  stato?: string;
  note?: string;
}

// Delivery Types
export interface Rider {
  id: number;
  utenteId: number;
  nome: string;
  cognome: string;
  telefono?: string;
  mezzoTrasporto?: string;
  targaMezzo?: string;
  disponibile: boolean;
  latitudine?: number;
  longitudine?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRiderPositionRequest {
  latitudine: number;
  longitudine: number;
}

// Dashboard Stats Types
export interface DashboardStats {
  prescrizioni: {
    totali: number;
    attive: number;
  };
  ordini: {
    totali: number;
    inCorso: number;
  };
  terapie: {
    attive: number;
  };
  spesa: {
    ultimoMese: number;
  };
  ordiniPerMese: Array<{
    month: string;
    count: number;
    totale: number;
  }>;
}

// Prossime Assunzioni Types
export interface ProssimaAssunzione {
  terapiaId: number;
  terapia: {
    id: number;
    posologia: string;
    doseGiornaliera: number;
    conPasto: boolean;
    farmaco?: {
      id: number;
      nomeCommerciale: string;
      principioAttivo?: string;
      formaFarmaceutica?: string;
      dosaggio?: string;
    };
  };
  dataOraProgrammata: string;
  orario: string;
  giaAssunta: boolean;
  assunzioneId: number | null;
}

// Richieste Prescrizione Types
export interface FarmacoRichiesto {
  farmacoId?: number;
  nomeFarmaco: string;
  principioAttivo?: string;
  numeroScatole: number;
  compressePerScatola?: number;
  posologia?: string;
  doseGiornaliera?: number;
  motivo?: string;
}

export interface RichiestaPrescrizione {
  id: number;
  pazienteId: number;
  medicoId: number;
  terapiaId?: number;
  stato: 'in_attesa' | 'approvata' | 'rifiutata' | 'completata';
  farmaciRichiesti: FarmacoRichiesto[];
  motivo?: string;
  notePaziente?: string;
  noteMedico?: string;
  dataRichiesta: string;
  dataApprovazione?: string;
  prescrizioneId?: number;
  paziente?: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale?: string;
    telefono?: string;
    emailPersonale?: string;
  };
  terapia?: Terapia;
  prescrizione?: Prescrizione;
}

export interface RichiestaRinnovoPrescrizione {
  id: number;
  terapiaId: number;
  pazienteId: number;
  medicoId: number;
  prescrizioneId?: number;
  stato: 'in_attesa' | 'approvata' | 'rifiutata' | 'completata';
  quantitaScatole: number;
  ripetibile: boolean;
  numeroRipetizioni?: number;
  motivo?: string;
  giorniRimanenti: number;
  noteMedico?: string;
  fotoTalloncinoPath?: string;
  fotoTalloncinoUrl?: string;
  dataRichiesta: string;
  dataApprovazione?: string;
  nuovaPrescrizioneId?: number;
  terapia?: Terapia;
  paziente?: Paziente;
  medico?: Medico;
  prescrizione?: Prescrizione;
  nuovaPrescrizione?: Prescrizione;
}
