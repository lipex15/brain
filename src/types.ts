/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppSettings {
  discord: {
    token: string;
    channels: string; // Comma separated channel IDs
    webhookGGMAX: string; // ID or URL
    webhookGameMarket: string;
    webhookDesapego: string;
    historyLimit: number;
    syncInterval: number;
  };
  whatsapp: {
    enabled: boolean;
    phoneNumber: string; // format: 55DDDNUMERO
    priorities: string[]; // ['normal', 'alta', 'urgente']
    platforms: string[]; // ['ggmax', 'gamemarket', 'desapego']
    sendRecovered: boolean;
  };
  general: {
    startup: boolean;
    soundEnabled: boolean;
    browserAlerts: boolean;
    theme: 'claro' | 'escuro';
  };
}

export type NotificationPlatform = 'ggmax' | 'gamemarket' | 'desapego' | 'outros';
export type NotificationPriority = 'normal' | 'alta' | 'urgente';
export type NotificationCategory = 'venda' | 'reclamacao' | 'pergunta' | 'outros';
export type NotificationStatus = 'nao_vista' | 'vista' | 'deletado';
export type ResolutionStatus = 'pendente' | 'resolvida';

export interface NotificationItem {
  id: string;
  externalId?: string; // Discord message ID or unique txn ID
  platform: NotificationPlatform;
  title: string;
  description: string;
  buyerName?: string;
  itemName?: string;
  price?: number;
  timestamp: string; // ISO string
  priority: NotificationPriority;
  category: NotificationCategory;
  status: NotificationStatus;
  resolution: ResolutionStatus;
  notes?: string;
  discordLink?: string;
}

export interface StockProduct {
  id: string;
  name: string;
  platform: string; // Free-form name, ex: Steam/Epic/Uplay/Rockstar
  category?: 'Contas' | 'Keys/Gift Cards' | 'Moedas' | 'Serviços' | 'Outros';
  price?: number;
  minWarning?: number;
  availableCount?: number;
  totalCount?: number;
}

export interface StockInventoryItem {
  id: string;
  product_id: string;
  content: string;
  status: 'disponivel' | 'vendido';
  sold_to?: string;
  sold_at?: string;
  notification_id?: string;

  // New structured account details
  login?: string;
  senha?: string;
  email?: string;
  senhaEmail?: string;
  observacao?: string;
  dataNascimento?: string;
  perguntaSecreta?: string;
  respostaSecreta?: string;
  paisCadastro?: string;

  // Warranty tracking (LZT guarantee)
  warrantyExpiresAt?: string;  // ISO timestamp or undefined
  warrantyAlertSent?: boolean;
}

export interface SystemStatus {
  discord: {
    connected: boolean;
    botUser: string | null;
    statusText: string;
  };
  whatsapp: {
    status: 'desconectado' | 'esperando_qr' | 'conectando' | 'conectado' | 'simulado';
    qrCode: string | null; // Data URL for QR Code image
    statusText: string;
  };
  storagePath: string;
}

export interface LiveLog {
  id: string;
  timestamp: string;
  source: 'sistema' | 'discord' | 'whatsapp';
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  discord: {
    token: '',
    channels: '',
    webhookGGMAX: '',
    webhookGameMarket: '',
    webhookDesapego: '',
    historyLimit: 50,
    syncInterval: 60000,
  },
  whatsapp: {
    enabled: false,
    phoneNumber: '5522998078338',
    priorities: ['alta', 'urgente'],
    platforms: ['ggmax', 'gamemarket', 'desapego'],
    sendRecovered: false,
  },
  general: {
    startup: false,
    soundEnabled: true,
    browserAlerts: true,
    theme: 'claro',
  },
};
