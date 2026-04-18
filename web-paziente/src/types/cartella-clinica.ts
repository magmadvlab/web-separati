// Types per Cartella Clinica

export interface DiarioSalute {
  id: number;
  pazienteId: number;
  titolo: string;
  contenuto: string;
  categoria: 'sintomo' | 'evento' | 'nota' | 'altro';
  tag: string[];
  dataEvento: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiarioEntryDto {
  titolo: string;
  contenuto: string;
  categoria: 'sintomo' | 'evento' | 'nota' | 'altro';
  tag?: string[];
  dataEvento: string;
  note?: string;
}

export interface RegistrazioneStatoSalute {
  id: number;
  pazienteId: number;
  tipo: 'influenza' | 'raffreddore' | 'malessere' | 'sintomo_generico';
  sintomi: string[];
  gravita: 'lieve' | 'moderata' | 'grave';
  dataInizio: string;
  dataFine?: string;
  durataGiorni?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  misurazioniFebbre?: MisurazioneFebbre[];
}

export interface CreateStatoSaluteDto {
  tipo: 'influenza' | 'raffreddore' | 'malessere' | 'sintomo_generico';
  sintomi: string[];
  gravita: 'lieve' | 'moderata' | 'grave';
  dataInizio: string;
  dataFine?: string;
  durataGiorni?: number;
  note?: string;
}

export interface MisurazioneFebbre {
  id: number;
  statoSaluteId: number;
  temperatura: number;
  dataOraMisurazione: string;
  metodoMisurazione: 'ascellare' | 'orale' | 'retale' | 'timpano';
  sintomiAssociati: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMisurazioneFebbreDto {
  temperatura: number;
  dataOra: string;
  metodoMisurazione: 'ascellare' | 'orale' | 'retale' | 'timpano';
  sintomiAssociati?: string[];
  note?: string;
}

export interface MisurazioneAntropometrica {
  id: number;
  pazienteId: number;
  tipo: 'peso' | 'altezza' | 'circonferenza_vita' | 'circonferenza_petto' | 'circonferenza_fianchi' | 'bmi';
  valore: number;
  unitaMisura: 'kg' | 'cm' | 'm';
  dataMisurazione: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMisurazioneAntropometricaDto {
  tipo: 'peso' | 'altezza' | 'circonferenza_vita' | 'circonferenza_petto' | 'circonferenza_fianchi' | 'bmi';
  valore: number;
  unitaMisura: 'kg' | 'cm' | 'm';
  dataMisurazione: string;
  note?: string;
}

export interface DocumentoCartellaClinica {
  id: number;
  pazienteId: number;
  titolo: string;
  descrizione?: string;
  tipo: 'nota' | 'sintomo' | 'evento' | 'misurazione' | 'documento_esterno';
  contenuto?: any;
  contenutoTesto?: string;
  tag: string[];
  categoria?: string;
  visibilitaMedico: boolean;
  dataEvento: string;
  note?: string;
  fileAllegatoPath?: string;
  fileAllegatoUrl?: string;
  tipoFile?: 'pdf' | 'immagine' | 'altro';
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentoDto {
  titolo: string;
  descrizione?: string;
  tipo: 'nota' | 'sintomo' | 'evento' | 'misurazione' | 'documento_esterno';
  contenuto?: any;
  contenutoTesto?: string;
  tag?: string[];
  categoria?: string;
  visibilitaMedico?: boolean;
  dataEvento: string;
  note?: string;
}

export interface PermessoCondivisione {
  id: number;
  pazienteId: number;
  medicoId?: number;
  specialistaId?: number;
  documentoId?: number;
  tipoDocumento?: string;
  categoriaDocumento?: string;
  livelloAccesso: 'lettura' | 'lettura_scrittura';
  dataInizio: string;
  dataFine?: string;
  stato: 'attivo' | 'revocato' | 'scaduto';
  note?: string;
  createdAt: string;
  updatedAt: string;
  medico?: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
  };
  specialista?: {
    id: number;
    nome: string;
    cognome: string;
    email: string;
    specializzazione?: string;
    macroArea?: string;
  };
  paziente?: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale?: string;
    emailPersonale?: string;
  };
}

export interface CreatePermessoCondivisioneDto {
  medicoId?: number;
  specialistaId?: number;
  documentoId?: number;
  tipoDocumento?: string;
  categoriaDocumento?: string;
  livelloAccesso: 'lettura' | 'lettura_scrittura';
  dataInizio: string;
  dataFine?: string;
  note?: string;
}

export interface RegistrazionePandemiaEpidemia {
  id: number;
  pazienteId: number;
  tipo: 'pandemia' | 'epidemia';
  nomeEvento: string;
  dataEsposizione: string;
  dataFine?: string;
  sintomi: string[];
  gravita: 'lieve' | 'moderata' | 'grave';
  esito?: 'guarito' | 'in_corso' | 'complicazioni';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEsposizionePandemiaDto {
  tipo: 'pandemia' | 'epidemia';
  nomeEvento: string;
  dataEsposizione: string;
  dataFine?: string;
  sintomi: string[];
  gravita: 'lieve' | 'moderata' | 'grave';
  esito?: 'guarito' | 'in_corso' | 'complicazioni';
  note?: string;
}

export interface AccessoCartellaClinicaAudit {
  id: number;
  pazienteId: number;
  utenteId?: number;
  ruoloUtente: string;
  tipoUtente: 'paziente' | 'medico' | 'sistema';
  tipoOperazione: 'creazione' | 'lettura' | 'aggiornamento' | 'eliminazione' | 'condivisione' | 'revoca_permesso' | 'export' | 'report';
  entitaTipo: 'diario' | 'stato_salute' | 'misurazione' | 'documento' | 'esposizione' | 'permesso';
  entitaId?: number;
  azione: string;
  ipAddress?: string;
  userAgent?: string;
  dispositivo?: string;
  dataAccesso: string;
  esito: 'successo' | 'fallito' | 'negato';
  motivo?: string;
  metadata?: any;
  createdAt: string;
}

export interface DashboardStats {
  totaliDiario: number;
  totaliStatiSalute: number;
  totaliMisurazioni: number;
  totaliDocumenti: number;
  totaliPermessi: number;
  ultimiEventi: {
    ultimeVociDiario: DiarioSalute[];
    ultimiStati: RegistrazioneStatoSalute[];
    ultimeMisurazioni: (MisurazioneFebbre | MisurazioneAntropometrica)[];
  };
}
