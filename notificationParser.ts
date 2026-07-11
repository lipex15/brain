import type {
  NotificationCategory,
  NotificationEventType,
  NotificationItem,
  NotificationPlatform,
  NotificationPriority,
} from "./src/types.js";

export interface DiscordEmbedData {
  title?: string;
  description?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: string;
  authorName?: string;
  url?: string;
}

type EventClassification = {
  eventType: NotificationEventType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  fallback: string;
};

export function normalizeNotificationText(text: string) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function cleanDiscordText(value: string) {
  return String(value || "")
    .replace(/\[([^\n]*?)\]\((https?:\/\/[^)\s]+)\)/g, "$1")
    .replace(/\*{1,3}|_{2,3}|~{2}|`+/g, "")
    .replace(/<([^>]+)>/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanIdentifier(value: string) {
  return cleanDiscordText(value).replace(/^#/, "").trim();
}

function extractUrl(value: string) {
  return String(value || "").match(/https?:\/\/[^\s)]+/i)?.[0] || undefined;
}

function parseLinkedValue(value: string) {
  const raw = String(value || "")
    .trim()
    .replace(/^(?:\*{1,3}|_{2,3})\s*/, "")
    .replace(/\s*(?:\*{1,3}|_{2,3})$/, "")
    .trim();
  const markdownLink = raw.match(/^\[([\s\S]*)\]\((https?:\/\/[^)]+)\)([\s\S]*)$/);
  if (!markdownLink) {
    return { label: cleanDiscordText(raw), suffix: "", url: extractUrl(raw) };
  }

  return {
    label: cleanDiscordText(markdownLink[1]),
    suffix: cleanDiscordText(markdownLink[3]).replace(/^\s*›\s*/, "").trim(),
    url: markdownLink[2],
  };
}

function parseBrazilianCurrency(value: string): number | undefined {
  const clean = String(value || "").replace(/r\$/gi, "").replace(/[^\d,.-]/g, "").trim();
  if (!clean) return undefined;

  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getFieldRaw(embedData: DiscordEmbedData, nameRegex: RegExp) {
  const field = (embedData.fields || []).find((entry) => nameRegex.test(normalizeNotificationText(entry.name)));
  return field ? String(field.value || "").trim() : "";
}

function getLineRaw(content: string, embedData: DiscordEmbedData, nameRegex: RegExp) {
  const text = `${content || ""}\n${embedData.description || ""}`;
  for (const line of text.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const rawKey = line.slice(0, separator);
    const normalizedKey = normalizeNotificationText(cleanDiscordText(rawKey)).replace(/^[^a-z0-9]+/, "").trim();
    if (nameRegex.test(normalizedKey)) return line.slice(separator + 1).trim();
  }
  return "";
}

function getRawValue(content: string, embedData: DiscordEmbedData, nameRegex: RegExp) {
  return getFieldRaw(embedData, nameRegex) || getLineRaw(content, embedData, nameRegex);
}

function detectPlatform(combinedText: string, authorName = ""): NotificationPlatform {
  const text = normalizeNotificationText(`${combinedText} ${authorName}`);
  if (text.includes("ggmax") || text.includes("gg-max") || text.includes("id da venda")) return "ggmax";
  if (text.includes("gamemarket") || text.includes("game market")) return "gamemarket";
  if (text.includes("desapego") || text.includes("desapegogames") || text.includes("desapego games")) return "desapego";
  return "outros";
}

function classifyEvent(platform: NotificationPlatform, combinedText: string, rawTitle = ""): EventClassification {
  const title = normalizeNotificationText(rawTitle);
  const text = normalizeNotificationText(`${rawTitle} ${combinedText}`);
  const has = (...terms: string[]) => terms.some((term) => text.includes(term));
  const titleHas = (...terms: string[]) => terms.some((term) => title.includes(term));

  if (platform === "gamemarket" && (titleHas("fundos liberados") || has("saldo do pedido liberado", "valor liquido"))) {
    return { eventType: "funds_released", category: "financeiro", priority: "normal", title: "💸 Fundos liberados", fallback: "O valor do pedido foi liberado na GameMarket." };
  }
  if (platform === "gamemarket" && (titleHas("saldo atualizado") || (has("saldo atualizado") && has("disponivel", "pendente")))) {
    return { eventType: "balance_updated", category: "financeiro", priority: "normal", title: "💼 Saldo atualizado", fallback: "O saldo da GameMarket foi atualizado." };
  }
  if (platform === "gamemarket" && has("saque solicitado", "solicitacao de saque")) {
    return { eventType: "withdrawal_requested", category: "financeiro", priority: "normal", title: "🏦 Saque solicitado", fallback: "Um saque foi solicitado na GameMarket." };
  }
  if (platform === "gamemarket" && has("pedido finalizado", "garantia encerrada")) {
    return { eventType: "order_completed", category: "outros", priority: "normal", title: "✅ Pedido finalizado", fallback: "O pedido foi finalizado e a garantia foi encerrada." };
  }
  if (platform === "gamemarket" && has("pedido entregue", "entrega automatica realizada", "itens entregues")) {
    return { eventType: "order_delivered", category: "outros", priority: "normal", title: "📦 Pedido entregue", fallback: "A entrega do pedido foi concluída." };
  }
  if (platform === "gamemarket" && has("produto criado", "novo produto criado", "anuncio criado", "anuncio publicado", "anuncio aprovado")) {
    return { eventType: "product_created", category: "outros", priority: "normal", title: "📦 Produto criado", fallback: "Um produto foi criado na GameMarket." };
  }
  if (has("nova avaliacao", "avaliacao recebida", "estrelas")) {
    return { eventType: "review", category: "outros", priority: "normal", title: "⭐ Nova avaliação", fallback: "Uma nova avaliação foi recebida." };
  }
  if (has("nova pergunta", "pergunta", "duvida")) {
    return { eventType: "question", category: "pergunta", priority: "normal", title: "❓ Nova pergunta", fallback: "Abra a plataforma para visualizar e responder à pergunta." };
  }
  if (has("mediacao", "reclamacao", "problema no pedido", "reembolso", "devolucao", "disputa")) {
    return { eventType: "complaint", category: "reclamacao", priority: "urgente", title: "⚠️ Nova mediação", fallback: "Um problema foi aberto pelo comprador." };
  }
  if (has("nova venda", "venda confirmada", "venda aprovada", "pagamento confirmado", "id da venda")) {
    return { eventType: "sale", category: "venda", priority: "alta", title: "💰 Nova venda", fallback: "Uma nova venda foi confirmada." };
  }

  return { eventType: "other", category: "outros", priority: "normal", title: "🔔 Novo evento", fallback: "Uma nova atualização foi recebida." };
}

function platformLabel(platform: NotificationPlatform) {
  if (platform === "ggmax") return "GGMAX";
  if (platform === "gamemarket") return "GameMarket";
  if (platform === "desapego") return "Desapego";
  return "Sistema";
}

function cleanDescription(value: string) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => cleanDiscordText(line))
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function parseDiscordMessage(content: string, embedData: DiscordEmbedData = {}): Partial<NotificationItem> {
  const combinedText = `${content || ""} ${embedData.title || ""} ${embedData.description || ""} ${embedData.footer || ""} ${embedData.authorName || ""} ${JSON.stringify(embedData.fields || [])}`;
  const platform = detectPlatform(combinedText, embedData.authorName);
  const event = classifyEvent(platform, combinedText, embedData.title || "");

  const orderRaw = getRawValue(content, embedData, /^(id da venda|pedido|venda|mediacao|saque)$/i);
  const orderLink = parseLinkedValue(orderRaw);
  const orderId = cleanIdentifier(orderLink.label || orderRaw) || undefined;

  const buyerRaw = getRawValue(content, embedData, /^(cliente|comprador|avaliador|usuario)$/i);
  const buyerName = cleanDiscordText(buyerRaw) || "N/A";

  const productRaw = getRawValue(content, embedData, /^(anuncio|produto|item|jogo)$/i);
  const productLink = parseLinkedValue(productRaw);
  let itemName = productLink.label || "Produto Desconhecido";
  let adName: string | undefined;

  if (platform === "ggmax" && productRaw) {
    adName = productLink.label || undefined;
    itemName = productLink.suffix || productLink.label || "Produto Desconhecido";
  }

  const priceRaw = getRawValue(content, embedData, /^(valor|preco|valor bruto|valor liquido)$/i);
  let price = parseBrazilianCurrency(priceRaw);
  if (price === undefined) {
    const fallbackPrice = combinedText.match(/r\$\s*[\d.,]+/i)?.[0] || "";
    price = parseBrazilianCurrency(fallbackPrice);
  }

  const deliveryRaw = getRawValue(content, embedData, /^entrega automatica$/i)
    || getRawValue(content, embedData, /^novo status$/i)
    || getRawValue(content, embedData, /^status$/i);
  const deliveryStatus = cleanDiscordText(deliveryRaw) || undefined;
  const actionUrl = orderLink.url || embedData.url || undefined;
  const productUrl = productLink.url || undefined;

  const sourceDescription = embedData.description || content || "";
  const description = (cleanDescription(sourceDescription) || event.fallback).slice(0, 1600);
  const title = `${event.title} - ${platformLabel(platform)}`;
  const dedupeKey = orderId ? `${platform}:${event.eventType}:${normalizeNotificationText(orderId)}` : undefined;

  return {
    platform,
    title,
    description,
    buyerName,
    itemName,
    price,
    priority: event.priority,
    category: event.category,
    eventType: event.eventType,
    orderId,
    actionUrl,
    productUrl,
    adName,
    deliveryStatus,
    dedupeKey,
    rawPayload: {
      content: content || "",
      title: embedData.title || "",
      description: embedData.description || "",
      fields: embedData.fields || [],
      footer: embedData.footer || "",
      authorName: embedData.authorName || "",
      url: embedData.url || "",
    },
  };
}

export function inferStoredEventType(item: NotificationItem): NotificationEventType {
  if (item.eventType) return item.eventType;
  const text = normalizeNotificationText(`${item.title || ""} ${item.description || ""}`);
  if (text.includes("fundos liberados") || text.includes("saldo do pedido liberado")) return "funds_released";
  if (text.includes("saldo atualizado")) return "balance_updated";
  if (text.includes("saque solicitado")) return "withdrawal_requested";
  if (text.includes("pedido finalizado") || text.includes("garantia encerrada")) return "order_completed";
  if (text.includes("pedido entregue") || text.includes("entrega automatica realizada")) return "order_delivered";
  if (text.includes("produto criado") || text.includes("anuncio criado")) return "product_created";
  if (text.includes("avaliacao") || text.includes("estrelas")) return "review";
  if (item.category === "pergunta") return "question";
  if (item.category === "reclamacao") return "complaint";
  if (item.category === "venda") return "sale";
  return "other";
}

function extractStoredOrder(item: NotificationItem) {
  if (item.orderId) return item.orderId;
  const raw = getLineRaw("", { description: item.description || "" }, /^(id da venda|pedido|venda|mediacao|saque)$/i);
  return cleanIdentifier(parseLinkedValue(raw).label || raw) || undefined;
}

export function notificationDedupeKey(item: Partial<NotificationItem>) {
  if (item.dedupeKey) return item.dedupeKey;
  const eventType = item.eventType || (item as NotificationItem).category && inferStoredEventType(item as NotificationItem);
  const orderId = item.orderId || extractStoredOrder(item as NotificationItem);
  if (!eventType || !orderId || !item.platform) return undefined;
  return `${item.platform}:${eventType}:${normalizeNotificationText(orderId)}`;
}

export function enrichStoredNotifications(items: NotificationItem[]) {
  let changed = false;

  for (const item of items) {
    const eventType = inferStoredEventType(item);
    if (item.eventType !== eventType) {
      item.eventType = eventType;
      changed = true;
    }

    const category: NotificationCategory = ["funds_released", "balance_updated", "withdrawal_requested"].includes(eventType)
      ? "financeiro"
      : ["order_completed", "order_delivered", "product_created", "review", "other"].includes(eventType)
        ? "outros"
        : eventType === "question"
          ? "pergunta"
          : eventType === "complaint"
            ? "reclamacao"
            : "venda";
    if (item.category !== category) {
      item.category = category;
      changed = true;
    }

    const orderId = extractStoredOrder(item);
    if (orderId && item.orderId !== orderId) {
      item.orderId = orderId;
      changed = true;
    }

    if (item.platform === "ggmax" && item.description) {
      const parsed = parseDiscordMessage("", {
        title: item.title,
        description: item.description,
        authorName: "GGMAX",
      });
      if (parsed.itemName && parsed.itemName !== "Produto Desconhecido" && item.itemName !== parsed.itemName) {
        item.itemName = parsed.itemName;
        changed = true;
      }
      for (const field of ["actionUrl", "productUrl", "adName", "deliveryStatus"] as const) {
        if (!item[field] && parsed[field]) {
          (item as any)[field] = parsed[field];
          changed = true;
        }
      }
    }

    const key = notificationDedupeKey(item);
    if (key && item.dedupeKey !== key) {
      item.dedupeKey = key;
      changed = true;
    }
  }

  return changed;
}
