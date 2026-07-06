/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { Client as DiscordClient, GatewayIntentBits, TextChannel, Message } from "discord.js";
import qrcode from "qrcode";
import pkg from "whatsapp-web.js";
const { Client: WhatsAppClient, LocalAuth } = pkg;
import { AppSettings, NotificationItem, SystemStatus, LiveLog, DEFAULT_SETTINGS, NotificationPlatform, NotificationPriority, NotificationCategory } from "./src/types.js";
import { initDatabase, dbRun, dbAll, dbGet, getStockSummary, closeDatabase } from "./database.js";
import cors from "cors";
import multer from "multer";

// Ensure Node ESM/CJS dual compatibility
import { fileURLToPath } from "url";
const _filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath((import.meta as any).url || 'file://' + process.cwd());
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

const app = express();
const PORT = 3000;



app.get('/api/local-image', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    return res.status(400).send('No path provided');
  }
  // Remove file:/// if present
  const cleanPath = filePath.replace(/^file:\/\/\/?/, '');
  res.sendFile(cleanPath, (err) => {
    if (err) {
      console.error('[SISTEMA] [ERRO] Falha ao carregar BG local:', err);
      // fallback to 404 transparent
      res.status(404).end();
    }
  });
});

app.use(cors());
app.use(express.json());

// --- CUSTOM BACKGROUND UPLOAD UTLITY ---
// Ensure STORAGE_DIR is available or retrieve it
function getStoragePathTemp() {
  const isElectron = !!process.versions.electron || process.env.IS_ELECTRON === 'true';
  const defaultBaseDir = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : path.join(os.homedir(), '.config'));
  const sDir = path.join(defaultBaseDir, "deathstuffs-brain");
  if (!fs.existsSync(sDir)) fs.mkdirSync(sDir, { recursive: true });
  return sDir;
}

const storageOpts = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to the data directory to persist
    const dir = typeof getStorageFolder === 'function' ? getStorageFolder() : getStoragePathTemp();
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `bg_custom_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: storageOpts });

app.post('/api/upload-bg', upload.single('bg'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const localPath = req.file.path.replace(/\\/g, '/');
  const url = `http://localhost:${PORT}/api/local-image?path=${encodeURIComponent(localPath)}`;
  res.json({ url });
});

// --- 1. DYNAMIC STORAGE PATHS ---
function getStorageFolder(): string {
  const isElectron = !!process.versions.electron || process.env.IS_ELECTRON === 'true';
  const defaultBaseDir = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : path.join(os.homedir(), '.config'));
  let defaultDir = path.join(defaultBaseDir, "deathstuffs-brain");

  // Keep compatibility with legacy SellerHub naming
  const oldDir = path.join(defaultBaseDir, "SellerHub");
  if (!fs.existsSync(defaultDir) && fs.existsSync(oldDir)) {
    try {
      fs.renameSync(oldDir, defaultDir);
    } catch (e) {
      defaultDir = oldDir;
    }
  }

  if (isElectron) {
    const redirectFile = path.join(defaultDir, "storage_path.txt");
    if (fs.existsSync(redirectFile)) {
      try {
        const customPath = fs.readFileSync(redirectFile, "utf8").trim();
        if (customPath) {
          if (!fs.existsSync(customPath)) {
            fs.mkdirSync(customPath, { recursive: true });
          }
          return customPath;
        }
      } catch (e) {
        console.error("[Storage] Falha ao ler ou criar pasta indicada em storage_path.txt:", e);
      }
    }

    if (!fs.existsSync(defaultDir)) fs.mkdirSync(defaultDir, { recursive: true });
    return defaultDir;
  } else {
    // Local container data path
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
}

let STORAGE_DIR = getStorageFolder();
let SETTINGS_FILE = path.join(STORAGE_DIR, "settings.json");
let NOTIFICATIONS_FILE = path.join(STORAGE_DIR, "notifications.json");
let NOTIFICATIONS_BACKUP = path.join(STORAGE_DIR, "notifications.json.bak");



// Initialize default empty databases if not present
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf8");
}
if (!fs.existsSync(NOTIFICATIONS_FILE)) {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2), "utf8");
}

// Load configurations and notifications
function loadSettings(): AppSettings {
  try {
    const data = fs.readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(data);
    return {
      discord: { ...DEFAULT_SETTINGS.discord, ...parsed.discord },
      whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...parsed.whatsapp },
      general: { ...DEFAULT_SETTINGS.general, ...parsed.general },
    };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
}

function loadNotifications(): NotificationItem[] {
  try {
    const data = fs.readFileSync(NOTIFICATIONS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    // Try restoring backup
    if (fs.existsSync(NOTIFICATIONS_BACKUP)) {
      try {
        const bak = fs.readFileSync(NOTIFICATIONS_BACKUP, "utf8");
        return JSON.parse(bak);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}

function saveNotifications(notifications: NotificationItem[]) {
  try {
    // Write backup first
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      fs.copyFileSync(NOTIFICATIONS_FILE, NOTIFICATIONS_BACKUP);
    }
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar notificações:", err);
  }
}

// --- 1.5. REAL SQLITE DATABASE INITIALIZATION ---
initDatabase(STORAGE_DIR);

// --- 2. GLOBAL APP STATE ---
let settings = loadSettings();
let notifications = loadNotifications();
let sseClients: express.Response[] = [];
let logs: LiveLog[] = [];

// Helper to push a system log
function addLog(source: 'sistema' | 'discord' | 'whatsapp', type: 'info' | 'success' | 'warn' | 'error', message: string) {
  // Mirror to console so standard streams capture this in production error.log
  const consoleMsg = `[${source.toUpperCase()}] [${type.toUpperCase()}] ${message}`;
  if (type === 'error') {
    console.error(consoleMsg);
  } else {
    console.log(consoleMsg);
  }

  const log: LiveLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    source,
    type,
    message,
  };
  logs.unshift(log);
  if (logs.length > 300) logs.pop(); // Keep log size sane
  broadcastEvent("log", log);
}

// Broadcast JSON structures to all listening React tabs
function broadcastEvent(type: string, data: any) {
  const messageStr = `data: ${JSON.stringify({ type, data })}\n\n`;
  sseClients.forEach((client) => client.write(messageStr));
}

// Receive IPC messages from Electron main process (autoUpdater)
process.on('message', (msg: any) => {
  if (msg && msg.type === 'updater_state') {
    broadcastEvent('updater_state', msg.data);
  }
});

// NOTE: Auto-delivery is intentionally DISABLED.
// Notifications and stock are independent systems — stock management is fully manual.
// This function only forwards the notification to WhatsApp when applicable.
async function tryAutoDelivery(notif: NotificationItem, shouldForward = true) {
  try {
    if (shouldForward) {
      triggerWhatsAppForward(notif);
    }
  } catch (err: any) {
    console.error("Erro no forward do WhatsApp:", err);
  }
}

// Discord bot client container
let discordClient: DiscordClient | null = null;
let discordStatus: SystemStatus['discord'] = {
  connected: false,
  botUser: null,
  statusText: "Não configurado",
};

// WhatsApp service container
let whatsappStatus: SystemStatus['whatsapp'] = {
  status: 'desconectado',
  qrCode: null,
  statusText: "Serviço inativo",
};

// --- 3. DISCORD BOT IMPLEMENTATION ---
function stopDiscordBot() {
  if (discordClient) {
    try {
      discordClient.destroy();
      addLog("discord", "warn", "Bot do Discord desconectado.");
    } catch (e) { }
    discordClient = null;
  }
  discordStatus = {
    connected: false,
    botUser: null,
    statusText: "Desconectado",
  };
  broadcastEvent("status_discord", discordStatus);
}

function parseDiscordMessage(content: string, embedData: any = {}): Partial<NotificationItem> {
  const combinedText = `${content} ${embedData.title || ''} ${embedData.description || ''} ${embedData.footer || ''} ${embedData.authorName || ''} ${JSON.stringify(embedData.fields || [])}`.toLowerCase();

  let platform: NotificationPlatform = "outros";
  let priority: NotificationPriority = "normal";
  let category: NotificationCategory = "venda";
  let title = "Notificação Recebida";
  let description = content;
  let buyerName = "N/A";
  let itemName = "Produto Desconhecido";
  let price: number | undefined = undefined;

  // 1. Detect platform
  if (combinedText.includes("ggmax") || combinedText.includes("gg-max")) {
    platform = "ggmax";
  } else if (combinedText.includes("gamemarket") || combinedText.includes("game market")) {
    platform = "gamemarket";
  } else if (combinedText.includes("desapego") || combinedText.includes("desapegogames") || combinedText.includes("desapego games")) {
    platform = "desapego";
  } else if (embedData.authorName) {
    const authorLower = embedData.authorName.toLowerCase();
    if (authorLower.includes("ggmax")) platform = "ggmax";
    else if (authorLower.includes("gamemarket")) platform = "gamemarket";
    else if (authorLower.includes("desapego")) platform = "desapego";
  }

  // Fallback platform checks
  if (platform === "outros") {
    if (combinedText.includes("venda aprovada") || combinedText.includes("id da venda")) {
      platform = "ggmax";
    } else if (combinedText.includes("anúncio") || combinedText.includes("venda de jogo") || combinedText.includes("liberação em")) {
      platform = "gamemarket";
    }
  }

  // Utility helper to extract value from fields or lines by key name regex
  const getFieldVal = (nameRegex: RegExp): string => {
    // 1. Try fields
    if (embedData.fields && Array.isArray(embedData.fields)) {
      const field = embedData.fields.find((f: any) => nameRegex.test(f.name));
      if (field) return field.value.trim();
    }
    // 2. Try description / content text lines
    const text = `${content || ''}\n${embedData.description || ''}`;
    const lines = text.split('\n');
    for (const line of lines) {
      if (nameRegex.test(line)) {
        const parts = line.split(/:\s*/);
        if (parts.length > 1) {
          // Join in case of multiple colons, and strip markdown formatting
          return parts.slice(1).join(':').replace(/[*_~`[\]()]/g, '').trim();
        }
      }
    }
    return "";
  };

  // Helper to parse Brazilian currency (e.g. "R$ 14,96" or "59,00" or "R$ 59.00")
  const parseBrazilianCurrency = (text: string): number | undefined => {
    const clean = text.replace(/r\$/i, '').trim();
    if (!clean) return undefined;
    if (clean.includes(',')) {
      const standard = clean.replace(/\./g, '').replace(',', '.');
      const val = parseFloat(standard);
      return isNaN(val) ? undefined : val;
    } else {
      const val = parseFloat(clean);
      return isNaN(val) ? undefined : val;
    }
  };

  // 2. Category and Title detection based on the types of webhooks (venda, pergunta, reclamacao, outros)
  const embedTitle = (embedData.title || "").toLowerCase();

  if (embedTitle.includes("pergunta") || combinedText.includes("pergunta") || combinedText.includes("dúvida")) {
    category = "pergunta";
    priority = "normal";
    title = "❓ Nova Pergunta";
  } else if (embedTitle.includes("avaliação") || embedTitle.includes("avaliacao") || combinedText.includes("avaliação") || combinedText.includes("estrelas")) {
    category = "outros";
    priority = "normal";
    title = "⭐ Nova Avaliação";
  } else if (embedTitle.includes("mediação") || embedTitle.includes("mediacao") || embedTitle.includes("reclamação") || embedTitle.includes("reclamacao") || combinedText.includes("reclamou") || combinedText.includes("devolução") || combinedText.includes("suporte") || combinedText.includes("problema") || combinedText.includes("reembolso") || combinedText.includes("disputa")) {
    category = "reclamacao";
    priority = "urgente";
    title = "⚠️ Nova Mediação";
  } else {
    // Default to "venda"
    category = "venda";
    priority = "alta";
    title = "💰 Nova Venda";
  }

  // Append platform specific title suffix
  if (platform === "ggmax") {
    title += " - GGMAX";
  } else if (platform === "gamemarket") {
    title += " - GameMarket";
  } else if (platform === "desapego") {
    title += " - Desapego";
  } else {
    title += " - " + (embedData.authorName || "Sistema");
  }

  // 3. Extract transaction ID, buyer/client name, item name, and price
  const rawTxnId = getFieldVal(/id\s+da\s+venda|pedido|mediação|mediacao/i);
  const txnId = rawTxnId.replace(/#/g, '').trim();

  const buyer = getFieldVal(/cliente|comprador|avaliador|usuario|usuário/i) || "N/A";
  const item = getFieldVal(/anúncio|anuncio|produto|item|jogo/i) || "Produto Desconhecido";

  const priceValStr = getFieldVal(/valor|preço|preco/i);
  let parsedPrice = priceValStr ? parseBrazilianCurrency(priceValStr) : undefined;

  // Fallback price extraction if not found by field
  if (parsedPrice === undefined) {
    const priceMatch = combinedText.match(/r\$\s*([\d,.]+)/i);
    if (priceMatch) {
      parsedPrice = parseBrazilianCurrency(priceMatch[0]);
    }
  }

  // Build a nice clean description for the user interface
  let cleanDesc = embedData.description || content || "";
  if (!cleanDesc) {
    if (category === "venda") {
      cleanDesc = `Venda realizada no ${platform.toUpperCase()}.\nProduto: ${item}\nComprador: ${buyer}\nValor: R$ ${parsedPrice ? parsedPrice.toFixed(2) : '0.00'}`;
    } else {
      cleanDesc = `Notificação recebida de ${platform.toUpperCase()}`;
    }
  }

  return {
    platform,
    title,
    description: cleanDesc.substring(0, 1000),
    buyerName: buyer,
    itemName: item,
    price: parsedPrice,
    priority,
    category,
    externalId: txnId || undefined
  };
}

function startDiscordBot() {
  stopDiscordBot();

  const token = settings.discord.token;
  if (!token) {
    discordStatus.statusText = "Token não configurado";
    broadcastEvent("status_discord", discordStatus);
    return;
  }

  addLog("discord", "info", "Iniciando bot do Discord...");
  discordStatus.statusText = "Iniciando...";
  broadcastEvent("status_discord", discordStatus);

  try {
    discordClient = new DiscordClient({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    discordClient.on("ready", () => {
      const userTag = discordClient?.user?.tag || "Bot";
      discordStatus = {
        connected: true,
        botUser: userTag,
        statusText: `Conectado como ${userTag}`,
      };
      addLog("discord", "success", `Bot do Discord conectado com sucesso como: ${userTag}`);
      broadcastEvent("status_discord", discordStatus);

      // Sincronizar histórico ao conectar
      syncDiscordHistory();
    });

    discordClient.on("shardDisconnect", (event, shardId) => {
      addLog("discord", "warn", `Desconectado do Gateway Discord (Shard ${shardId}).`);
      discordStatus.connected = false;
      discordStatus.statusText = "Desconectado";
      broadcastEvent("status_discord", discordStatus);
    });

    discordClient.on("shardReconnecting", (shardId) => {
      addLog("discord", "info", `Reconectando ao Gateway Discord (Shard ${shardId})...`);
      discordStatus.statusText = "Reconectando...";
      broadcastEvent("status_discord", discordStatus);
    });

    discordClient.on("shardReady", (shardId) => {
      const userTag = discordClient?.user?.tag || "Bot";
      addLog("discord", "info", `Conexão reestabelecida no Gateway Discord (Shard ${shardId}).`);
      discordStatus.connected = true;
      discordStatus.botUser = userTag;
      discordStatus.statusText = `Conectado como ${userTag}`;
      broadcastEvent("status_discord", discordStatus);
    });

    discordClient.on("messageCreate", async (message: Message) => {
      try {
        // Evitar loop infinito se mensagem for do próprio bot
        if (message.author && message.author.id === discordClient?.user?.id) return;

        // Verificar se canal está configurado
        const configuredChannels = settings.discord.channels
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id.length > 0);

        if (configuredChannels.length > 0 && !configuredChannels.includes(message.channelId)) {
          return; // Mensagem de canal não monitorado
        }

        handleIncomingDiscordMessage(message);
      } catch (err: any) {
        console.error("Erro ao receber/processar mensagem em messageCreate:", err);
        addLog("discord", "error", `Erro em tempo real no Discord: ${err.message}`);
      }
    });

    discordClient.on("error", (error) => {
      addLog("discord", "error", `Erro no bot do Discord: ${error.message}`);
      discordStatus.connected = false;
      discordStatus.statusText = "Erro de conexão";
      broadcastEvent("status_discord", discordStatus);
    });

    discordClient.login(token).catch((err) => {
      addLog("discord", "error", `Falha no login do Discord: ${err.message}`);
      discordStatus = {
        connected: false,
        botUser: null,
        statusText: "Falha de Login (Verifique o Token)",
      };
      broadcastEvent("status_discord", discordStatus);
    });
  } catch (error: any) {
    addLog("discord", "error", `Erro ao inicializar cliente Discord: ${error.message}`);
    discordStatus.statusText = "Falha crítica";
    broadcastEvent("status_discord", discordStatus);
  }
}

function handleIncomingDiscordMessage(message: Message) {
  try {
    // Check if message is already recorded to prevent duplicate
    if (notifications.some((n) => n.externalId === message.id)) return;

    // Extract content and first embed details if exists
    const embed = message.embeds && message.embeds[0];
    const embedData = embed ? {
      title: embed.title || "",
      description: embed.description || "",
      fields: embed.fields || [],
      footer: embed.footer?.text || "",
      authorName: message.author?.username || "",
    } : {
      authorName: message.author?.username || "",
    };

    const parsed = parseDiscordMessage(message.content, embedData);

    const newNotification: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      externalId: message.id,
      platform: parsed.platform || "outros",
      title: parsed.title || "Notificação Recebida",
      description: parsed.description || message.content || "Sem conteúdo",
      buyerName: parsed.buyerName || "N/A",
      itemName: parsed.itemName || "Item Desconhecido",
      price: parsed.price,
      timestamp: message.createdAt ? message.createdAt.toISOString() : new Date().toISOString(),
      priority: parsed.priority || "normal",
      category: parsed.category || "venda",
      status: "nao_vista",
      resolution: "pendente",
      discordLink: `https://discord.com/channels/${message.guildId || "@me"}/${message.channelId}/${message.id}`,
    };

    notifications.unshift(newNotification);
    saveNotifications(notifications);

    // Broadcast to all active client tabs
    broadcastEvent("notification_new", newNotification);

    // Try automatic delivery from SQLite stock (handles WhatsApp forwarding)
    tryAutoDelivery(newNotification);

    addLog("sistema", "success", `Nova notificação recebida de ${newNotification.platform.toUpperCase()}: ${newNotification.itemName}`);
  } catch (err: any) {
    console.error("Erro em handleIncomingDiscordMessage:", err);
    addLog("discord", "error", `Erro ao salvar mensagem recebida: ${err.message}`);
  }
}

// Tracker to identify if a sync is the initial startup sync (recovers historic entries)
// vs periodic runtime syncs (where newly found messages should always forward to WhatsApp)
let isInitialSync = true;

async function syncDiscordHistory() {
  if (!discordClient || !discordStatus.connected) return;

  const channelIds = settings.discord.channels
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (channelIds.length === 0) {
    addLog("discord", "warn", "Sincronização abortada: Nenhum canal cadastrado nas configurações.");
    return;
  }

  addLog("discord", "info", `Iniciando varredura em ${channelIds.length} canal(is) do Discord (limite: ${settings.discord.historyLimit})...`);

  let addedCount = 0;

  for (const cid of channelIds) {
    try {
      const channel = await discordClient.channels.fetch(cid);
      if (channel instanceof TextChannel) {
        const messages = await channel.messages.fetch({ limit: settings.discord.historyLimit });

        // Process oldest first to preserve order
        const sortedMsgs = Array.from(messages.values()).reverse();

        for (const msg of sortedMsgs) {
          if (msg.author && msg.author.id === discordClient.user?.id) continue;
          if (notifications.some((n) => n.externalId === msg.id)) continue;

          // Parse and add
          const embed = msg.embeds && msg.embeds[0];
          const embedData = embed ? {
            title: embed.title || "",
            description: embed.description || "",
            fields: embed.fields || [],
            footer: embed.footer?.text || "",
            authorName: msg.author?.username || "",
          } : {
            authorName: msg.author?.username || "",
          };

          const parsed = parseDiscordMessage(msg.content, embedData);
          const newNotif: NotificationItem = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            externalId: msg.id,
            platform: parsed.platform || "outros",
            title: parsed.title || "Notificação Sincronizada",
            description: parsed.description || msg.content || "Sem conteúdo",
            buyerName: parsed.buyerName || "N/A",
            itemName: parsed.itemName || "Item Desconhecido",
            price: parsed.price,
            timestamp: msg.createdAt ? msg.createdAt.toISOString() : new Date().toISOString(),
            priority: parsed.priority || "normal",
            category: parsed.category || "venda",
            status: "nao_vista",
            resolution: "pendente",
            discordLink: `https://discord.com/channels/${msg.guildId || "@me"}/${msg.channelId}/${msg.id}`,
          };

          notifications.unshift(newNotif);
          addedCount++;

          // Try automatic delivery from SQLite stock (which also handles WhatsApp forwarding if configured)
          // Forward if it's a live periodic sync (not initial startup sync) OR if sendRecovered settings is true
          const shouldForward = !isInitialSync || !!settings.whatsapp.sendRecovered;
          tryAutoDelivery(newNotif, shouldForward);
        }
      }
    } catch (e: any) {
      addLog("discord", "error", `Falha ao sincronizar canal ${cid}: ${e.message}`);
    }
  }

  // Once first sync completes, toggle flag to false to allow forwarding periodic syncs
  isInitialSync = false;

  if (addedCount > 0) {
    saveNotifications(notifications);
    broadcastEvent("notifications_refresh", notifications.filter(n => n.status !== 'deletado'));
    addLog("discord", "success", `Sincronização concluída! ${addedCount} novas notificações adicionadas.`);
  } else {
    addLog("discord", "info", "Sincronização concluída. Nenhuma mensagem nova encontrada.");
  }
}

// --- 4. DUAL-MODE WHATSAPP CLIENT ---
let wpClient: any = null;
let simulatedWhatsAppTimer: NodeJS.Timeout | null = null;

function stopWhatsAppBot() {
  if (simulatedWhatsAppTimer) {
    clearTimeout(simulatedWhatsAppTimer);
    simulatedWhatsAppTimer = null;
  }
  if (wpClient) {
    try {
      const pid = wpClient.pupBrowser?.process()?.pid;
      if (pid) {
        addLog("whatsapp", "info", `Encerrando Chromium ativamente (PID ${pid}) para liberar arquivos.`);
        process.kill(pid, "SIGKILL");
      }
    } catch (e: any) {
      console.error("[WhatsApp] Erro ao forçar encerramento do Chromium:", e.message);
    }
    try {
      wpClient.destroy();
    } catch (e) { }
    wpClient = null;
  }
  whatsappStatus = {
    status: 'desconectado',
    qrCode: null,
    statusText: "WhatsApp Desconectado",
  };
  addLog("whatsapp", "warn", "Serviço WhatsApp desativado.");
  broadcastEvent("status_whatsapp", whatsappStatus);
}

function getChromeExecutablePath() {
  const fs = require('fs');
  const path = require('path');

  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
  const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';

  const paths = [
    path.join(localAppData, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(programFilesX86, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(programFiles, 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(programFilesX86, 'Microsoft\\Edge\\Application\\msedge.exe'),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      console.log(`[WhatsApp] Encontrou navegador local em: ${p}`);
      return p;
    }
  }
  return undefined; // Fallback to Puppeteer default
}

function startWhatsAppBot() {
  stopWhatsAppBot();

  if (!settings.whatsapp.enabled) {
    whatsappStatus.statusText = "Serviço desativado";
    broadcastEvent("status_whatsapp", whatsappStatus);
    return;
  }

  addLog("whatsapp", "info", "Iniciando cliente nativo WhatsApp...");
  whatsappStatus.status = 'conectando';
  whatsappStatus.statusText = "Inicializando Chromium...";
  broadcastEvent("status_whatsapp", whatsappStatus);

  // Clear directory locks to avoid Chrome startup profile hang
  try {
    const fs = require('fs');
    const lockPath1 = path.join(STORAGE_DIR, 'whatsapp-session', 'session', 'SingletonLock');
    const lockPath2 = path.join(STORAGE_DIR, 'whatsapp-session', 'session', 'Default', 'SingletonLock');
    const lockPath3 = path.join(STORAGE_DIR, 'whatsapp-session', 'session', 'lockfile');
    const lockPath4 = path.join(STORAGE_DIR, 'whatsapp-session', 'session', 'Default', 'lockfile');
    if (fs.existsSync(lockPath1)) fs.unlinkSync(lockPath1);
    if (fs.existsSync(lockPath2)) fs.unlinkSync(lockPath2);
    if (fs.existsSync(lockPath3)) fs.unlinkSync(lockPath3);
    if (fs.existsSync(lockPath4)) fs.unlinkSync(lockPath4);
  } catch (e) { }

  // Clean environment variables when spawning Puppeteer inside Electron
  const cleanEnv = process.env.ELECTRON_RUN_AS_NODE
    ? Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('ELECTRON_') && k !== 'NODE_OPTIONS'))
    : undefined;

  wpClient = new WhatsAppClient({
    authStrategy: new LocalAuth({ dataPath: path.join(STORAGE_DIR, 'whatsapp-session') }),
    puppeteer: {
      executablePath: getChromeExecutablePath(),
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-extensions',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check'
      ],
      env: cleanEnv
    }
  });

  wpClient.on('qr', async (qr: string) => {
    try {
      const qrDataUrl = await qrcode.toDataURL(qr);
      whatsappStatus.status = 'esperando_qr';
      whatsappStatus.qrCode = qrDataUrl;
      whatsappStatus.statusText = "Aguardando escaneamento QR";
      addLog("whatsapp", "info", "Código QR WhatsApp gerado! Escaneie via app para conectar.");
      broadcastEvent("status_whatsapp", whatsappStatus);
    } catch (err: any) {
      addLog("whatsapp", "error", `Erro ao gerar QR Code: ${err.message}`);
    }
  });

  wpClient.on('ready', () => {
    whatsappStatus.status = 'conectado';
    whatsappStatus.qrCode = null;
    whatsappStatus.statusText = "Conectado e Ativo";
    addLog("whatsapp", "success", "WhatsApp Client conectado com sucesso! Pronto para alertas.");
    broadcastEvent("status_whatsapp", whatsappStatus);
  });

  wpClient.on('disconnected', (reason) => {
    addLog("whatsapp", "warn", `WhatsApp desconectado: ${reason}`);
    stopWhatsAppBot();
  });

  wpClient.on('auth_failure', (msg) => {
    addLog("whatsapp", "error", `Falha na autenticação WhatsApp: ${msg}`);
  });

  wpClient.initialize().catch(err => {
    addLog("whatsapp", "error", `Falha ao iniciar core do WhatsApp: ${err.message}`);
  });
}

// Em modo REAL, o botão scan-sim não precisa conectar (apenas mostra erro de simulação indisponível)
function simulateWhatsAppScan() {
  addLog("whatsapp", "warn", "Simulação nativa desativada. Escaneie o QR exibido com o seu celular no app WhatsApp.");
}

function triggerWhatsAppForward(notif: NotificationItem, deliveredItem: any = null) {
  if (!settings.whatsapp.enabled || whatsappStatus.status !== 'conectado' || !wpClient) return;

  // Filter based on Priority and Platform filters
  const matchesPriority = settings.whatsapp.priorities.includes(notif.priority);
  const matchesPlatform = settings.whatsapp.platforms.includes(notif.platform);

  if (!matchesPriority || !matchesPlatform) {
    addLog("whatsapp", "info", `Alerta ignorado: Não bate com os filtros de envio WhatsApp.`);
    return;
  }

  const phone = settings.whatsapp.phoneNumber;
  if (!phone) {
    addLog("whatsapp", "warn", "Não foi possível enviar alerta: Telefone de destino não configurado.");
    return;
  }

  // Format message body beautifully
  const emojiPlat = notif.platform === 'ggmax' ? '🔵 GGMAX' : notif.platform === 'gamemarket' ? '🟢 GameMarket' : notif.platform === 'desapego' ? '🟠 Desapego' : '🛒 Outro';
  const priceText = notif.price ? `R$ ${notif.price.toFixed(2)}` : 'N/A';

  let text = `🚨 *NOTIFICAÇÃO SELLERHUB* 🚨\n\n`;
  text += `🎮 *Plataforma:* ${emojiPlat}\n`;
  text += `📋 *Tipo:* ${notif.title}\n`;
  text += `📦 *Item:* ${notif.itemName}\n`;
  text += `💰 *Preço:* ${priceText}\n`;
  text += `👤 *Comprador:* ${notif.buyerName || 'N/A'}\n\n`;

  if (deliveredItem) {
    text += `✅ *STATUS:* ENTREGUE AUTOMATICAMENTE\n\n`;
    text += `🔑 *DADOS DE ACESSO DA CONTA*\n`;
    text += `👤 *Login/Usuário:* *${deliveredItem.login || deliveredItem.content}*\n`;
    if (deliveredItem.senha) {
      text += `🔒 *Senha:* *${deliveredItem.senha}*\n`;
    }
    if (deliveredItem.email) {
      text += `📧 *E-mail da Conta:* *${deliveredItem.email}*\n`;
    }
    if (deliveredItem.senhaEmail) {
      text += `🔑 *Senha do E-mail:* \`${deliveredItem.senhaEmail}\`\n`;
    }
    if (deliveredItem.observacao) {
      text += `📝 *Observação:* ${deliveredItem.observacao}\n`;
    }

    // Additional optional details
    if (deliveredItem.dataNascimento) {
      text += `📅 *Nascimento:* ${deliveredItem.dataNascimento}\n`;
    }
    if (deliveredItem.perguntaSecreta) {
      text += `❓ *Pergunta Secreta:* ${deliveredItem.perguntaSecreta}\n`;
    }
    if (deliveredItem.respostaSecreta) {
      text += `💡 *Resposta:* ${deliveredItem.respostaSecreta}\n`;
    }
    if (deliveredItem.paisCadastro) {
      text += `🇧🇷 *País:* ${deliveredItem.paisCadastro}\n`;
    }
  } else {
    text += `⏳ *Status:* Pendente\n`;
    text += `⚡ *Prioridade:* ${notif.priority.toUpperCase()}\n`;
  }

  text += `\n_Acesse o software para responder e gerenciar._`;

  const targetId = `${phone.replace(/\D/g, '')}@c.us`;
  wpClient.sendMessage(targetId, text).then(() => {
    addLog("whatsapp", "success", `Alerta gerado e enviado via WhatsApp para ${phone}.`);
  }).catch(err => {
    addLog("whatsapp", "error", `Falha no envio via WhatsApp para ${phone}: ${err.message}`);
  });
}

// --- WARRANTY ALERT: send WhatsApp to self when guarantee is about to expire ---
function sendWarrantyAlert(item: any, productName: string) {
  // Broadcast SSE to trigger in-app modal
  broadcastEvent("warranty_alert", {
    itemId: item.id,
    productName,
    login: item.login || item.content || '(sem login)',
    warrantyExpiresAt: item.warranty_expires_at,
  });

  addLog("sistema", "warn", `⏰ GARANTIA EXPIRANDO: Conta "${item.login || item.content}" de "${productName}" vence em ~20 minutos!`);

  // WhatsApp self-message (bypasses priority/platform filters — this is an internal alert)
  if (!settings.whatsapp.enabled || whatsappStatus.status !== 'conectado' || !wpClient) return;
  const phone = settings.whatsapp.phoneNumber;
  if (!phone) return;

  const expiresAt = new Date(item.warranty_expires_at);
  const formatted = expiresAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false });

  let text = `⏰ *GARANTIA EXPIRANDO EM ~20 MINUTOS!* ⏰\n\n`;
  text += `🎮 *Produto:* ${productName}\n`;
  text += `👤 *Login:* ${item.login || item.content || 'N/A'}\n`;
  if (item.senha) text += `🔒 *Senha:* ${item.senha}\n`;
  if (item.email) text += `📧 *E-mail:* ${item.email}\n`;
  text += `⏱ *Expira às:* ${formatted}\n\n`;
  text += `🔗 Acesse o LZT.market agora e verifique se a conta está funcionando antes de perder a garantia!`;

  const targetId = `${phone.replace(/\D/g, '')}@c.us`;
  wpClient.sendMessage(targetId, text).then(() => {
    addLog("whatsapp", "success", `Alerta de garantia enviado via WhatsApp para ${phone}.`);
  }).catch(err => {
    addLog("whatsapp", "error", `Falha ao enviar alerta de garantia: ${err.message}`);
  });
}

// --- 5. PERIODIC BACKGROUND SYNC ---
let syncTimer: NodeJS.Timeout | null = null;

function resetPeriodicSync() {
  if (syncTimer) clearInterval(syncTimer);

  const interval = settings.discord.syncInterval || 60000;
  syncTimer = setInterval(() => {
    if (discordClient && discordStatus.connected) {
      addLog("sistema", "info", "Sincronização periódica iniciada de forma automática...");
      syncDiscordHistory();
    }
  }, interval);
}

// --- 5b. WARRANTY EXPIRY CHECKER (every 60s) ---
function startWarrantyChecker() {
  setInterval(async () => {
    try {
      const ALERT_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes
      const now = Date.now();

      const items = dbAll(
        `SELECT items.*, products.name as product_name
         FROM items
         JOIN products ON items.product_id = products.id
         WHERE items.warranty_expires_at IS NOT NULL
           AND items.warranty_alert_sent = 0
           AND items.status = 'disponivel'`
      );

      for (const item of items) {
        const expiresAt = new Date(item.warranty_expires_at).getTime();
        const msUntilExpiry = expiresAt - now;

        if (msUntilExpiry > 0 && msUntilExpiry <= ALERT_THRESHOLD_MS) {
          // Mark as sent FIRST to prevent duplicate alerts
          dbRun("UPDATE items SET warranty_alert_sent = 1 WHERE id = ?", [item.id]);
          sendWarrantyAlert(item, item.product_name);
        }
      }
    } catch (err: any) {
      console.error("[Warranty] Erro no checker:", err);
    }
  }, 60000); // every 60 seconds
}

// Start core listeners
startDiscordBot();
startWhatsAppBot();
resetPeriodicSync();
startWarrantyChecker();


// --- 6. EXPRESS API ENDPOINTS ---

// Server SSE channel mapping
app.get("/api/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  sseClients.push(res);
  addLog("sistema", "info", "Painel conectado ao fluxo de eventos em tempo real.");

  // Send initial load details
  res.write(`data: ${JSON.stringify({ type: "init_logs", data: logs.slice(0, 50) })}\n\n`);
  res.write(`data: ${JSON.stringify({ type: "status_discord", data: discordStatus })}\n\n`);
  res.write(`data: ${JSON.stringify({ type: "status_whatsapp", data: whatsappStatus })}\n\n`);

  req.on("close", () => {
    sseClients = sseClients.filter((client) => client !== res);
    addLog("sistema", "info", "Painel desconectado do fluxo de eventos.");
  });
});

// App Settings CRUD
app.get("/api/settings", (req, res) => {
  res.json(settings);
});

app.post("/api/settings", (req, res) => {
  try {
    const oldSettings = { ...settings };
    settings = { ...settings, ...req.body };
    saveSettings(settings);

    addLog("sistema", "success", "Configurações atualizadas e salvas no disco.");

    // Reboot Discord or WhatsApp if tokens or status toggle changes
    if (oldSettings.discord.token !== settings.discord.token ||
      oldSettings.discord.channels !== settings.discord.channels) {
      startDiscordBot();
    }
    if (oldSettings.whatsapp.enabled !== settings.whatsapp.enabled) {
      if (settings.whatsapp.enabled) startWhatsAppBot();
      else stopWhatsAppBot();
    }

    resetPeriodicSync();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications CRUD
app.get("/api/notifications", (req, res) => {
  res.json(notifications.filter(n => n.status !== 'deletado'));
});

app.post("/api/notifications", (req, res) => {
  const body = req.body;
  const newNotif: NotificationItem = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    platform: body.platform || "outros",
    title: body.title || "Notificação Manual",
    description: body.description || "Descrição manual do alerta",
    buyerName: body.buyerName || "Cliente Local",
    itemName: body.itemName || "Produto Genérico",
    price: body.price ? parseFloat(body.price) : undefined,
    timestamp: new Date().toISOString(),
    priority: body.priority || "normal",
    category: body.category || "venda",
    status: "nao_vista",
    resolution: "pendente",
    notes: body.notes || "",
  };

  notifications.unshift(newNotif);
  saveNotifications(notifications);
  broadcastEvent("notification_new", newNotif);

  // Try automatic delivery from SQLite stock (which also handles WhatsApp forwarding)
  tryAutoDelivery(newNotif);

  addLog("sistema", "success", `Nova notificação criada manualmente: ${newNotif.itemName}`);

  res.json(newNotif);
});

app.put("/api/notifications/:id", (req, res) => {
  const { id } = req.params;
  const index = notifications.findIndex((n) => n.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Notificação não encontrada" });
  }

  notifications[index] = { ...notifications[index], ...req.body };
  saveNotifications(notifications);
  broadcastEvent("notifications_refresh", notifications.filter(n => n.status !== 'deletado'));

  res.json(notifications[index]);
});

app.delete("/api/notifications/:id", (req, res) => {
  const { id } = req.params;
  const index = notifications.findIndex((n) => n.id === id);
  if (index !== -1) {
    notifications[index].status = "deletado";
    notifications[index].resolution = "resolvida";
    saveNotifications(notifications);
  }

  broadcastEvent("notifications_refresh", notifications.filter(n => n.status !== 'deletado'));

  addLog("sistema", "info", `Notificação deletada com sucesso.`);
  res.json({ success: true });
});

app.post("/api/notifications/clear", (req, res) => {
  notifications = [];
  saveNotifications(notifications);
  broadcastEvent("notifications_refresh", notifications);

  addLog("sistema", "warn", "Banco de dados de notificações limpo pelo usuário.");
  res.json({ success: true });
});

// --- STORAGE & BACKUP MANAGEMENT ENDPOINTS ---

function copyRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Get current storage path
app.get("/api/storage/info", (req, res) => {
  res.json({ currentPath: STORAGE_DIR });
});

// Export database backup as single base64 JSON downloadable packet
app.get("/api/storage/backup/export", (req, res) => {
  try {
    const dbFile = path.join(STORAGE_DIR, "stock.db");
    let dbBase64 = "";
    if (fs.existsSync(dbFile)) {
      dbBase64 = fs.readFileSync(dbFile).toString("base64");
    }

    const pack = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      settings,
      notifications,
      dbBase64
    };

    res.setHeader("Content-Disposition", `attachment; filename=deathStuffs-backup-${Date.now()}.dsb`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(pack, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Import backup JSON packet directly and restore local database/configs
app.post("/api/storage/backup/import", (req, res) => {
  try {
    const { settings: backupSettings, notifications: backupNotifications, dbBase64 } = req.body;
    if (!dbBase64) {
      return res.status(400).json({ error: "Backup inválido ou corrompido (banco ausente)." });
    }

    addLog("sistema", "info", "Iniciando restauração de backup local...");

    // 1. Fechar bots e o banco sqlite
    stopDiscordBot();
    stopWhatsAppBot();
    closeDatabase();

    // 2. Gravar os arquivos físicos convertidos de volta
    const dbFile = path.join(STORAGE_DIR, "stock.db");
    fs.writeFileSync(dbFile, Buffer.from(dbBase64, "base64"));

    if (backupSettings) {
      settings = { ...DEFAULT_SETTINGS, ...backupSettings };
      saveSettings(settings);
    }
    if (backupNotifications) {
      notifications = backupNotifications;
      saveNotifications(notifications);
    }

    // 3. Re-iniciar banco e conexões dos bots
    initDatabase(STORAGE_DIR);
    settings = loadSettings();

    addLog("sistema", "success", "Backup restaurado com sucesso! Serviços reiniciados.");

    startDiscordBot();
    if (settings.whatsapp.enabled) {
      startWhatsAppBot();
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao importar backup:", err);
    res.status(500).json({ error: err.message });
  }
});

// Migrate database storage folder to a new drive directory
app.post("/api/storage/migrate", (req, res) => {
  try {
    const { newPath } = req.body;
    if (!newPath) {
      return res.status(400).json({ error: "Caminho de destino não especificado." });
    }

    const targetPath = path.resolve(newPath.trim());
    if (targetPath === STORAGE_DIR) {
      return res.status(400).json({ error: "O destino é idêntico à pasta de dados atual." });
    }

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    addLog("sistema", "info", `Iniciando cópia e migração da pasta de dados para: ${targetPath}`);

    // 1. Fechar bots e o banco
    stopDiscordBot();
    stopWhatsAppBot();
    closeDatabase();

    // Aguardar breves milissegundos para liberação dos locks do Windows
    setTimeout(() => {
      try {
        // 2. Copiar os arquivos principais
        const filesToCopy = ["stock.db", "settings.json", "notifications.json", "stock.db-wal", "stock.db-shm"];
        for (const file of filesToCopy) {
          const src = path.join(STORAGE_DIR, file);
          const dest = path.join(targetPath, file);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
          }
        }

        // 3. Copiar pasta do whatsapp recursivamente
        const srcWp = path.join(STORAGE_DIR, "whatsapp-session");
        const destWp = path.join(targetPath, "whatsapp-session");
        if (fs.existsSync(srcWp)) {
          copyRecursiveSync(srcWp, destWp);
        }

        // 4. Salvar ponteiro de redirecionamento no AppData padrão
        const defaultBaseDir = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : path.join(os.homedir(), '.config'));
        const defaultDir = path.join(defaultBaseDir, "deathstuffs-brain");
        if (!fs.existsSync(defaultDir)) {
          fs.mkdirSync(defaultDir, { recursive: true });
        }
        const redirectFile = path.join(defaultDir, "storage_path.txt");
        fs.writeFileSync(redirectFile, targetPath, "utf8");

        // 5. Atualizar variáveis de pasta locais
        STORAGE_DIR = targetPath;
        SETTINGS_FILE = path.join(STORAGE_DIR, "settings.json");
        NOTIFICATIONS_FILE = path.join(STORAGE_DIR, "notifications.json");
        NOTIFICATIONS_BACKUP = path.join(STORAGE_DIR, "notifications.json.bak");

        // 6. Re-abrir banco e recarregar status
        initDatabase(STORAGE_DIR);
        settings = loadSettings();

        addLog("sistema", "success", `Pasta de dados migrada com sucesso! Novo caminho ativo: ${STORAGE_DIR}`);

        startDiscordBot();
        if (settings.whatsapp.enabled) {
          startWhatsAppBot();
        }

        res.json({ success: true, currentPath: STORAGE_DIR });
      } catch (err: any) {
        console.error("Erro ao copiar arquivos de dados na migração:", err);
        // Fallback: restaurar banco no local original
        initDatabase(STORAGE_DIR);
        startDiscordBot();
        if (settings.whatsapp.enabled) {
          startWhatsAppBot();
        }
        res.status(500).json({ error: `Erro na transferência física de dados: ${err.message}` });
      }
    }, 1500);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- STOCK & INVENTORY MANAGEMENT API (SQLITE BACKED) ---

// Get stock summary (all products with counts)
app.get("/api/stock/products", async (req, res) => {
  try {
    const products = await getStockSummary();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new product to stock
app.post("/api/stock/products", async (req, res) => {
  try {
    const { name, platform, category, price, minWarning, initialItems } = req.body;
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    await dbRun(
      "INSERT INTO products (id, name, platform, category, price, minWarning) VALUES (?, ?, ?, ?, ?, ?)",
      [productId, name || "Novo Produto", platform || "todas", category || "Outros", parseFloat(price) || 0, parseInt(minWarning) || 2]
    );

    // Process raw items if present
    if (initialItems && typeof initialItems === "string") {
      const itemLines = initialItems.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      for (const line of itemLines) {
        const itemId = `item_${productId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await dbRun(
          "INSERT INTO items (id, product_id, content, status) VALUES (?, ?, ?, ?)",
          [itemId, productId, line, 'disponivel']
        );
      }
      addLog("sistema", "success", `Cadastrado produto "${name}" com ${itemLines.length} itens.`);
    } else {
      addLog("sistema", "success", `Cadastrado produto "${name}" sem itens iniciais.`);
    }

    const refreshed = await getStockSummary();
    broadcastEvent("stock_refresh", refreshed);
    res.json({ success: true, productId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update a product's configuration
app.put("/api/stock/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, platform, category, price, minWarning } = req.body;

    await dbRun(
      "UPDATE products SET name = ?, platform = ?, category = ?, price = ?, minWarning = ? WHERE id = ?",
      [name, platform, category, parseFloat(price) || 0, parseInt(minWarning) || 2, id]
    );

    addLog("sistema", "info", `Produto "${name}" atualizado no estoque.`);
    const refreshed = await getStockSummary();
    broadcastEvent("stock_refresh", refreshed);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product and its associated inventory items
app.delete("/api/stock/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch product name first for logging
    const product = await dbGet("SELECT name FROM products WHERE id = ?", [id]) as any;
    const productName = product ? product.name : "Desconhecido";

    await dbRun("DELETE FROM items WHERE product_id = ?", [id]);
    await dbRun("DELETE FROM products WHERE id = ?", [id]);

    addLog("sistema", "warn", `Produto "${productName}" e todos os seus itens removidos do estoque.`);

    const refreshed = await getStockSummary();
    broadcastEvent("stock_refresh", refreshed);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all items (accounts/keys) of a product
app.get("/api/stock/products/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const items = await dbAll(`
      SELECT *, 
             warranty_expires_at AS warrantyExpiresAt, 
             warranty_alert_sent AS warrantyAlertSent 
      FROM items 
      WHERE product_id = ? 
      ORDER BY status ASC, sold_at DESC
    `, [id]);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all active (unsold and not expired) warranty items
app.get("/api/stock/warranties/active", async (req, res) => {
  try {
    const now = new Date().toISOString();
    const items = await dbAll(`
      SELECT items.*, products.name as productName, 
             items.warranty_expires_at AS warrantyExpiresAt, 
             items.warranty_alert_sent AS warrantyAlertSent
      FROM items
      JOIN products ON items.product_id = products.id
      WHERE items.warranty_expires_at IS NOT NULL
        AND items.warranty_expires_at > ?
        AND items.status = 'disponivel'
      ORDER BY items.warranty_expires_at ASC
    `, [now]);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk add or single structured add new items (accounts/keys) to a product
app.post("/api/stock/products/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const { rawItems, login, senha, email, senhaEmail, observacao, dataNascimento, perguntaSecreta, respostaSecreta, paisCadastro, warrantyHours } = req.body;

    // Compute warranty expiry timestamp if warrantyHours is provided
    const warrantyExpiresAt = warrantyHours && parseFloat(warrantyHours) > 0
      ? new Date(Date.now() + parseFloat(warrantyHours) * 60 * 60 * 1000).toISOString()
      : null;

    if (rawItems && typeof rawItems === "string") {
      const itemLines = rawItems.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      for (const line of itemLines) {
        const itemId = `item_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        // Parse parts: login:senha:email:senhaEmail
        const parts = line.split(':');
        let loginVal = "";
        let senhaVal = "";
        let emailVal = "";
        let senhaEmailVal = "";

        if (parts.length >= 4) {
          loginVal = parts[0].trim();
          senhaVal = parts[1].trim();
          emailVal = parts[2].trim();
          senhaEmailVal = parts[3].trim();
        } else if (parts.length === 3) {
          loginVal = parts[0].trim();
          senhaVal = parts[1].trim();
          emailVal = parts[2].trim();
        } else if (parts.length === 2) {
          loginVal = parts[0].trim();
          senhaVal = parts[1].trim();
        } else {
          loginVal = line;
        }

        dbRun(
          `INSERT INTO items (id, product_id, content, status, login, senha, email, senhaEmail, warranty_expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, id, line, 'disponivel', loginVal, senhaVal, emailVal, senhaEmailVal, warrantyExpiresAt]
        );
      }

      const product = await dbGet("SELECT name FROM products WHERE id = ?", [id]) as any;
      addLog("sistema", "success", `Adicionado(s) ${itemLines.length} item(ns) de estoque para "${product?.name || 'Desconhecido'}"`);
    } else {
      // Single structured account item
      const itemId = `item_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      let content = `${login || ''}:${senha || ''}`;
      if (email) content += ` | Email: ${email}:${senhaEmail || ''}`;
      if (observacao) content += ` | Obs: ${observacao}`;

      dbRun(
        `INSERT INTO items (id, product_id, content, status, login, senha, email, senhaEmail, observacao, dataNascimento, perguntaSecreta, respostaSecreta, paisCadastro, warranty_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, id, content, 'disponivel', login || null, senha || null, email || null, senhaEmail || null, observacao || null, dataNascimento || null, perguntaSecreta || null, respostaSecreta || null, paisCadastro || null, warrantyExpiresAt]
      );

      const product = await dbGet("SELECT name FROM products WHERE id = ?", [id]) as any;
      if (warrantyExpiresAt) {
        addLog("sistema", "success", `Conta "${login || ''}" adicionada com garantia até ${new Date(warrantyExpiresAt).toLocaleString('pt-BR')} para "${product?.name || 'Desconhecido'}"`);
      } else {
        addLog("sistema", "success", `Adicionada conta "${login || ''}" no estoque para "${product?.name || 'Desconhecido'}"`);
      }
    }

    const refreshed = await getStockSummary();
    broadcastEvent("stock_refresh", refreshed);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update a specific stock item (e.g. edit password or content)
app.put("/api/stock/items/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const { content, status, sold_to, sold_at, notification_id } = req.body;

    await dbRun(
      "UPDATE items SET content = ?, status = ?, sold_to = ?, sold_at = ?, notification_id = ? WHERE id = ?",
      [content, status, sold_to, sold_at, notification_id, itemId]
    );

    const refreshed = await getStockSummary();
    broadcastEvent("stock_refresh", refreshed);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a specific stock item
app.delete("/api/stock/items/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    await dbRun("DELETE FROM items WHERE id = ?", [itemId]);

    const refreshed = await getStockSummary();
    broadcastEvent("stock_refresh", refreshed);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manually deliver or mark an available item of a product as sold/associated with a buyer
app.post("/api/stock/products/:productId/deliver-manual", async (req, res) => {
  try {
    const { productId } = req.params;
    const { notificationId, buyerName } = req.body;

    // Find first available item
    const item = await dbGet("SELECT * FROM items WHERE product_id = ? AND status = 'disponivel' ORDER BY rowid ASC", [productId]) as any;
    if (!item) {
      return res.status(400).json({ error: "Nenhum item disponível em estoque para este produto!" });
    }

    // Mark as sold
    await dbRun(
      "UPDATE items SET status = 'vendido', sold_to = ?, sold_at = ?, notification_id = ? WHERE id = ?",
      [buyerName || "Cliente Manual", new Date().toISOString(), notificationId || null, item.id]
    );

    const product = await dbGet("SELECT name FROM products WHERE id = ?", [productId]) as any;
    addLog("sistema", "success", `Item de "${product?.name}" resgatado/marcado como vendido manualmente para "${buyerName || 'Cliente Manual'}".`);

    // If notificationId is provided, update that notification notes!
    if (notificationId) {
      const notifIndex = notifications.findIndex(n => n.id === notificationId);
      if (notifIndex !== -1) {
        notifications[notifIndex].notes = `[ENTREGA MANUAL] Entregue do estoque: ${item.content}`;
        notifications[notifIndex].resolution = "resolvida";
        saveNotifications(notifications);
        broadcastEvent("notifications_refresh", notifications);
      }
    }

    const refreshed = await getStockSummary();
    broadcastEvent("stock_refresh", refreshed);
    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/system/updater-action", (req, res) => {
  const { action } = req.body;
  if (process.send) {
    process.send({ type: 'updater_action', action });
    res.json({ success: true, message: `Acionado comando: ${action}` });
  } else {
    res.json({ success: false, message: "Modo standalone (sem Electron IPC ativo)." });
  }
});

// Test Actions
app.post("/api/discord/test", async (req, res) => {
  if (discordClient && discordStatus.connected) {
    addLog("discord", "success", "Teste de conexão Discord recebido: OK");
    return res.json({ success: true, message: "Discord está conectado e respondendo corretamente." });
  }

  if (!settings.discord.token) {
    return res.json({ success: false, message: "Insira e salve um Token válido primeiro!" });
  }

  // Force connection if disconnected
  addLog("discord", "info", "Tentando forçar conexão de teste...");
  startDiscordBot();

  // Wait up to 3.5s for the Discord API to complete handshake
  setTimeout(() => {
    if (discordStatus.connected) {
      res.json({ success: true, message: "Bot conectado e autenticado com sucesso!" });
    } else {
      res.json({ success: false, message: "Bot offline. Verifique o Config Token e suas Intents (Discord Developer)." });
    }
  }, 3500);
});

app.post("/api/whatsapp/test", async (req, res) => {
  if (wpClient && whatsappStatus.status === 'conectado') {
    addLog("whatsapp", "success", "Teste de conexão WhatsApp recebido: OK");
    return res.json({ success: true, message: "Sessão nativa do WhatsApp conectada." });
  }

  if (whatsappStatus.status === 'esperando_qr' || whatsappStatus.status === 'conectando') {
    return res.json({ success: false, message: "Aguardando escaneamento do QR Code abaixo!" });
  }

  addLog("whatsapp", "info", "Forçando reinício e verificação do WhatsApp...");
  startWhatsAppBot();

  setTimeout(() => {
    if (whatsappStatus.status === 'conectado') {
      res.json({ success: true, message: "WhatsApp conectado e pronto no backend!" });
    } else {
      res.json({ success: false, message: `Status Atual WP: ${whatsappStatus.statusText}` });
    }
  }, 3500);
});

app.post("/api/whatsapp/disconnect", async (req, res) => {
  addLog("whatsapp", "warn", "Solicitado desconexão manual do WhatsApp. Limpando dados do Chromium...");
  try {
    if (wpClient) {
      try { await wpClient.logout(); } catch (e) { }
    }
    stopWhatsAppBot();

    // Deleting the session auth directory forcefully
    const wsSessionDir = path.join(STORAGE_DIR, 'whatsapp-session');
    if (fs.existsSync(wsSessionDir)) {
      fs.rmSync(wsSessionDir, { recursive: true, force: true });
    }

    // Automatically bring the QR code scanner back up if enabled
    if (settings.whatsapp.enabled) startWhatsAppBot();

    res.json({ success: true, message: "Sessão desconectada. Você já pode ler um novo QR Code." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Erro ao desconectar: ${err.message}` });
  }
});

app.post("/api/whatsapp/scan-sim", (req, res) => {
  simulateWhatsAppScan();
  res.json({ success: true });
});

// For incoming external webhooks
app.post("/api/webhook", express.json(), (req, res) => {
  if (!settings.whatsapp.enabled) {
    return res.json({ success: false, message: "Habilite o WhatsApp nas configurações antes de testar!" });
  }
  if (whatsappStatus.status !== 'conectado') {
    return res.json({ success: false, message: "WhatsApp não está conectado! Escaneie o QR Code primeiro." });
  }

  const testNotif: NotificationItem = {
    id: "test_notif",
    platform: "ggmax",
    title: "Venda de Teste",
    description: "Este é um disparo de teste do deathstuffs brain para validar a rota WhatsApp.",
    buyerName: "Felipe (Teste)",
    itemName: "Licença Pro Premium deathstuffs brain",
    price: 49.90,
    timestamp: new Date().toISOString(),
    priority: "urgente",
    category: "venda",
    status: "nao_vista",
    resolution: "pendente",
  };

  triggerWhatsAppForward(testNotif);
  res.json({ success: true, message: "Disparo de teste efetuado! Verifique seus alertas WhatsApp." });
});

app.post("/api/whatsapp/scan-sim", (req, res) => {
  simulateWhatsAppScan();
  res.json({ success: true, status: whatsappStatus });
});

// Simulated Webhook Triggers for developer playground testing
app.post("/api/notifications/test-trigger", (req, res) => {
  const { platform, type } = req.body;

  let p: NotificationPlatform = platform || "ggmax";
  let cat: NotificationCategory = type === "reclamacao" ? "reclamacao" : type === "pergunta" ? "pergunta" : "venda";
  let prio: NotificationPriority = cat === "reclamacao" ? "urgente" : cat === "pergunta" ? "normal" : "alta";

  let itemName = "Gift Card Google Play R$ 100";
  let buyerName = "Ana Julia Silva";
  let price = 85.00;
  let desc = "Aguardando envio do produto pelo vendedor.";

  if (p === "gamemarket") {
    itemName = "Conta GTA V Modded Level 400";
    buyerName = "Marcos Vinicius";
    price = 120.00;
    if (cat === "reclamacao") {
      desc = "O comprador abriu reclamação informando que a senha fornecida está incorreta.";
    }
  } else if (p === "desapego") {
    itemName = "Item Blox Fruits Kitsune Física";
    buyerName = "Gabriel Gamer";
    price = 45.00;
    if (cat === "reclamacao") {
      desc = "Disputa iniciada: Conta vinculada divergente do anúncio.";
    }
  }

  const testNotif: NotificationItem = {
    id: `notif_sim_${Date.now()}`,
    externalId: `msg_sim_${Math.random().toString(36).substr(2, 9)}`,
    platform: p,
    title: cat === "reclamacao" ? `Reclamação Aberta - ${p.toUpperCase()}` : cat === "pergunta" ? `Nova Pergunta - ${p.toUpperCase()}` : `Nova Venda - ${p.toUpperCase()}`,
    description: desc,
    buyerName,
    itemName,
    price,
    timestamp: new Date().toISOString(),
    priority: prio,
    category: cat,
    status: "nao_vista",
    resolution: "pendente",
    discordLink: "https://discord.com",
  };

  notifications.unshift(testNotif);
  saveNotifications(testNotif ? [testNotif, ...notifications] : notifications);
  broadcastEvent("notification_new", testNotif);

  // Try automatic delivery from SQLite stock
  tryAutoDelivery(testNotif);

  addLog("sistema", "success", `[Simulado] Webhook disparado com sucesso: ${itemName}`);
  triggerWhatsAppForward(testNotif);

  res.json(testNotif);
});

// App System Metadata & directory locations
app.get("/api/status", (req, res) => {
  res.json({
    discord: discordStatus,
    whatsapp: whatsappStatus,
    storagePath: STORAGE_DIR,
  });
});


// --- 7. VITE MIDDLEWARE CONFIG FOR DEVELOPMENT & PRODUCTION ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = _dirname;
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[deathstuffs brain Backend] Ativo na porta ${PORT}`);
    console.log(`[deathstuffs brain Backend] Diretório de dados: ${STORAGE_DIR}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

startServer();
