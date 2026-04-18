import api from './api';
import type { ApiResponse } from '@/types/api';
import type {
  DiarioSalute,
  CreateDiarioEntryDto,
  RegistrazioneStatoSalute,
  CreateStatoSaluteDto,
  MisurazioneFebbre,
  CreateMisurazioneFebbreDto,
  MisurazioneAntropometrica,
  CreateMisurazioneAntropometricaDto,
  DocumentoCartellaClinica,
  CreateDocumentoDto,
  PermessoCondivisione,
  CreatePermessoCondivisioneDto,
  RegistrazionePandemiaEpidemia,
  CreateEsposizionePandemiaDto,
  AccessoCartellaClinicaAudit,
  DashboardStats,
} from '@/types/cartella-clinica';

// ============================================
// DIARIO SALUTE
// ============================================

export const cartellaClinicaApi = {
  // Diario Salute
  getDiarioEntries: async (params?: {
    categoria?: string;
    tag?: string;
    dataInizio?: string;
    dataFine?: string;
    limit?: number;
    offset?: number;
  }): Promise<DiarioSalute[]> => {
    const queryParams = new URLSearchParams();
    if (params?.categoria) queryParams.append('categoria', params.categoria);
    if (params?.tag) queryParams.append('tag', params.tag);
    if (params?.dataInizio) queryParams.append('dataInizio', params.dataInizio);
    if (params?.dataFine) queryParams.append('dataFine', params.dataFine);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const response = await api.get<ApiResponse<DiarioSalute[]>>(
      `/cartella-clinica/diario?${queryParams.toString()}`
    );
    return response.data.data;
  },

  getDiarioEntry: async (id: number): Promise<DiarioSalute> => {
    const response = await api.get<ApiResponse<DiarioSalute>>(
      `/cartella-clinica/diario/${id}`
    );
    return response.data.data;
  },

  createDiarioEntry: async (data: CreateDiarioEntryDto): Promise<DiarioSalute> => {
    const response = await api.post<ApiResponse<DiarioSalute>>(
      '/cartella-clinica/diario',
      data
    );
    return response.data.data;
  },

  updateDiarioEntry: async (id: number, data: Partial<CreateDiarioEntryDto>): Promise<DiarioSalute> => {
    const response = await api.put<ApiResponse<DiarioSalute>>(
      `/cartella-clinica/diario/${id}`,
      data
    );
    return response.data.data;
  },

  deleteDiarioEntry: async (id: number): Promise<void> => {
    await api.delete(`/cartella-clinica/diario/${id}`);
  },

  searchDiario: async (query: string): Promise<DiarioSalute[]> => {
    const response = await api.get<ApiResponse<DiarioSalute[]>>(
      `/cartella-clinica/diario/search?q=${encodeURIComponent(query)}`
    );
    return response.data.data;
  },

  // Stati Salute
  getStatiSalute: async (params?: {
    tipo?: string;
    dataInizio?: string;
    dataFine?: string;
  }): Promise<RegistrazioneStatoSalute[]> => {
    const queryParams = new URLSearchParams();
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.dataInizio) queryParams.append('dataInizio', params.dataInizio);
    if (params?.dataFine) queryParams.append('dataFine', params.dataFine);
    
    const response = await api.get<ApiResponse<RegistrazioneStatoSalute[]>>(
      `/cartella-clinica/stati-salute?${queryParams.toString()}`
    );
    return response.data.data;
  },

  getStatoSalute: async (id: number): Promise<RegistrazioneStatoSalute> => {
    const response = await api.get<ApiResponse<RegistrazioneStatoSalute>>(
      `/cartella-clinica/stati-salute/${id}`
    );
    return response.data.data;
  },

  registraStatoSalute: async (data: CreateStatoSaluteDto): Promise<RegistrazioneStatoSalute> => {
    const response = await api.post<ApiResponse<RegistrazioneStatoSalute>>(
      '/cartella-clinica/stati-salute',
      data
    );
    return response.data.data;
  },

  // Misurazioni Febbre
  registraMisurazioneFebbre: async (statoId: number, data: CreateMisurazioneFebbreDto): Promise<MisurazioneFebbre> => {
    const response = await api.post<ApiResponse<MisurazioneFebbre>>(
      `/cartella-clinica/stati-salute/${statoId}/febbre`,
      data
    );
    return response.data.data;
  },

  getStoricoFebbre: async (params?: {
    dataInizio?: string;
    dataFine?: string;
  }): Promise<MisurazioneFebbre[]> => {
    const queryParams = new URLSearchParams();
    if (params?.dataInizio) queryParams.append('dataInizio', params.dataInizio);
    if (params?.dataFine) queryParams.append('dataFine', params.dataFine);
    
    const response = await api.get<ApiResponse<MisurazioneFebbre[]>>(
      `/cartella-clinica/febbre/storico?${queryParams.toString()}`
    );
    return response.data.data;
  },

  // Misurazioni Antropometriche
  getMisurazioni: async (params?: {
    tipo?: string;
    dataInizio?: string;
    dataFine?: string;
  }): Promise<MisurazioneAntropometrica[]> => {
    const queryParams = new URLSearchParams();
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.dataInizio) queryParams.append('dataInizio', params.dataInizio);
    if (params?.dataFine) queryParams.append('dataFine', params.dataFine);
    
    const response = await api.get<ApiResponse<MisurazioneAntropometrica[]>>(
      `/cartella-clinica/misurazioni?${queryParams.toString()}`
    );
    return response.data.data;
  },

  registraMisurazione: async (data: CreateMisurazioneAntropometricaDto): Promise<MisurazioneAntropometrica> => {
    const response = await api.post<ApiResponse<MisurazioneAntropometrica>>(
      '/cartella-clinica/misurazioni',
      data
    );
    return response.data.data;
  },

  // Documenti
  getDocumenti: async (params?: {
    tipo?: string;
    categoria?: string;
    tag?: string;
    dataInizio?: string;
    dataFine?: string;
  }): Promise<DocumentoCartellaClinica[]> => {
    const queryParams = new URLSearchParams();
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.categoria) queryParams.append('categoria', params.categoria);
    if (params?.tag) queryParams.append('tag', params.tag);
    if (params?.dataInizio) queryParams.append('dataInizio', params.dataInizio);
    if (params?.dataFine) queryParams.append('dataFine', params.dataFine);
    
    const response = await api.get<ApiResponse<DocumentoCartellaClinica[]>>(
      `/cartella-clinica/documenti?${queryParams.toString()}`
    );
    return response.data.data;
  },

  getDocumento: async (id: number): Promise<DocumentoCartellaClinica> => {
    const response = await api.get<ApiResponse<DocumentoCartellaClinica>>(
      `/cartella-clinica/documenti/${id}`
    );
    return response.data.data;
  },

  createDocumento: async (data: CreateDocumentoDto, file?: File): Promise<DocumentoCartellaClinica> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (file) {
      formData.append('file', file);
    }
    
    const response = await api.post<ApiResponse<DocumentoCartellaClinica>>(
      '/cartella-clinica/documenti',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  updateDocumento: async (id: number, data: Partial<CreateDocumentoDto>): Promise<DocumentoCartellaClinica> => {
    const response = await api.put<ApiResponse<DocumentoCartellaClinica>>(
      `/cartella-clinica/documenti/${id}`,
      data
    );
    return response.data.data;
  },

  deleteDocumento: async (id: number): Promise<void> => {
    await api.delete(`/cartella-clinica/documenti/${id}`);
  },

  // Permessi
  getPermessi: async (): Promise<PermessoCondivisione[]> => {
    const response = await api.get<ApiResponse<PermessoCondivisione[]>>(
      '/cartella-clinica/permessi'
    );
    return response.data.data;
  },

  createPermesso: async (data: CreatePermessoCondivisioneDto): Promise<PermessoCondivisione> => {
    const response = await api.post<ApiResponse<PermessoCondivisione>>(
      '/cartella-clinica/permessi',
      data
    );
    return response.data.data;
  },

  revocaPermesso: async (id: number): Promise<void> => {
    await api.delete(`/cartella-clinica/permessi/${id}`);
  },

  getPermessiMedico: async (): Promise<PermessoCondivisione[]> => {
    const response = await api.get<ApiResponse<PermessoCondivisione[]>>(
      '/medico/pazienti'
    );
    return response.data.data;
  },

  getDocumentiMedico: async (pazienteId: number): Promise<DocumentoCartellaClinica[]> => {
    const response = await api.get<ApiResponse<DocumentoCartellaClinica[]>>(
      `/cartella-clinica/medico/pazienti/${pazienteId}/documenti`
    );
    return response.data.data;
  },

  getReportMedico: async (pazienteId: number, params?: { dataInizio?: string; dataFine?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.dataInizio) queryParams.append('dataInizio', params.dataInizio);
    if (params?.dataFine) queryParams.append('dataFine', params.dataFine);
    const response = await api.get<ApiResponse<any>>(
      `/cartella-clinica/medico/pazienti/${pazienteId}/report?${queryParams.toString()}`
    );
    return response.data.data;
  },

  // Esposizioni Pandemia/Epidemia
  getEsposizioni: async (params?: {
    tipo?: string;
    dataInizio?: string;
    dataFine?: string;
  }): Promise<RegistrazionePandemiaEpidemia[]> => {
    const queryParams = new URLSearchParams();
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.dataInizio) queryParams.append('dataInizio', params.dataInizio);
    if (params?.dataFine) queryParams.append('dataFine', params.dataFine);
    
    const response = await api.get<ApiResponse<RegistrazionePandemiaEpidemia[]>>(
      `/cartella-clinica/esposizioni?${queryParams.toString()}`
    );
    return response.data.data;
  },

  registraEsposizione: async (data: CreateEsposizionePandemiaDto): Promise<RegistrazionePandemiaEpidemia> => {
    const response = await api.post<ApiResponse<RegistrazionePandemiaEpidemia>>(
      '/cartella-clinica/esposizioni',
      data
    );
    return response.data.data;
  },

  // Report e Export
  generaReportCompleto: async (params: {
    formato: 'json' | 'summary' | 'pdf';
    dataInizio?: string;
    dataFine?: string;
  }): Promise<Blob | any> => {
    if (params.formato === 'pdf') {
      const response = await api.post(
        '/cartella-clinica/report/completo',
        {
          formato: params.formato,
          dataInizio: params.dataInizio,
          dataFine: params.dataFine,
        },
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } else {
      const response = await api.post<ApiResponse<any>>(
        '/cartella-clinica/report/completo',
        {
          formato: params.formato,
          dataInizio: params.dataInizio,
          dataFine: params.dataFine,
        }
      );
      return response.data.data;
    }
  },

  exportDati: async (formato: 'json' | 'csv'): Promise<Blob> => {
    const response = await api.get(
      `/cartella-clinica/export?formato=${formato}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  // Audit Log
  getAuditLog: async (params?: {
    tipoOperazione?: string;
    entitaTipo?: string;
    dataInizio?: string;
    dataFine?: string;
    utenteId?: number;
    limit?: number;
    offset?: number;
  }): Promise<AccessoCartellaClinicaAudit[]> => {
    const queryParams = new URLSearchParams();
    if (params?.tipoOperazione) queryParams.append('tipoOperazione', params.tipoOperazione);
    if (params?.entitaTipo) queryParams.append('entitaTipo', params.entitaTipo);
    if (params?.dataInizio) queryParams.append('dataInizio', params.dataInizio);
    if (params?.dataFine) queryParams.append('dataFine', params.dataFine);
    if (params?.utenteId) queryParams.append('utenteId', params.utenteId.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const response = await api.get<ApiResponse<AccessoCartellaClinicaAudit[]>>(
      `/cartella-clinica/audit?${queryParams.toString()}`
    );
    return response.data.data;
  },

  getAuditLogByEntita: async (entitaTipo: string, entitaId: number): Promise<AccessoCartellaClinicaAudit[]> => {
    const response = await api.get<ApiResponse<AccessoCartellaClinicaAudit[]>>(
      `/cartella-clinica/audit/${entitaTipo}/${entitaId}`
    );
    return response.data.data;
  },
};

