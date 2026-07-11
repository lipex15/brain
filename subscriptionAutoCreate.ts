import type { NotificationItem, SubscriptionPlatform } from "./src/types.js";
import { cleanDiscordText, normalizeNotificationText } from "./notificationParser.js";

export interface AutoSubscriptionDraft {
  platform: SubscriptionPlatform;
  customerName: string;
  chatLink: string | null;
  productName: string;
  purchaseDate: Date;
  startDate: Date;
  durationDays: number;
  sourceNotificationId: string;
  sourceOrderId: string | null;
  notes: string;
}

const SUBSCRIPTION_PLATFORMS: SubscriptionPlatform[] = ["ggmax", "gamemarket"];

function compact(value: string) {
  return cleanDiscordText(value).replace(/\s+/g, " ").trim();
}

function getSearchText(notification: NotificationItem) {
  return normalizeNotificationText([
    notification.title,
    notification.description,
    notification.itemName,
    notification.adName,
    notification.rawPayload?.title,
    notification.rawPayload?.description,
    JSON.stringify(notification.rawPayload?.fields || []),
  ].filter(Boolean).join(" "));
}

function looksLikeGamePass(text: string) {
  return (
    text.includes("gamepass") ||
    text.includes("game pass") ||
    (text.includes("xbox") && text.includes("ultimate")) ||
    (text.includes("xbox") && text.includes("assinatura"))
  );
}

function extractDurationDays(text: string) {
  const daysMatch = text.match(/\b(\d{1,3})\s*(?:dias?|d|days?)\b/i);
  if (daysMatch) {
    const days = Number.parseInt(daysMatch[1], 10);
    if (Number.isFinite(days) && days > 0 && days <= 365) return days;
  }

  const monthsMatch = text.match(/\b(\d{1,2})\s*(?:mes|meses|m[eê]s|m[eê]ses|months?)\b/i);
  if (monthsMatch) {
    const months = Number.parseInt(monthsMatch[1], 10);
    if (Number.isFinite(months) && months > 0 && months <= 24) return months * 30;
  }

  if (text.includes("mensal")) return 30;
  return 30;
}

function getOriginalProductName(notification: NotificationItem) {
  return compact([
    notification.adName,
    notification.itemName,
  ].filter(Boolean).join(" - ")) || "Xbox Game Pass Ultimate";
}

function getSubscriptionProductName(durationDays: number) {
  return `Xbox Game Pass Ultimate ${durationDays} dias`;
}

function getCustomerName(notification: NotificationItem) {
  const buyer = compact(notification.buyerName || "");
  if (!buyer || normalizeNotificationText(buyer) === "n/a") {
    return "Cliente nao identificado";
  }
  return buyer.slice(0, 120);
}

export function buildAutoSubscriptionDraft(notification: NotificationItem): AutoSubscriptionDraft | null {
  if (notification.category !== "venda" || notification.eventType !== "sale") return null;
  if (!SUBSCRIPTION_PLATFORMS.includes(notification.platform as SubscriptionPlatform)) return null;

  const searchText = getSearchText(notification);
  if (!looksLikeGamePass(searchText)) return null;

  const purchaseDate = new Date(notification.timestamp || Date.now());
  if (Number.isNaN(purchaseDate.getTime())) return null;

  const durationDays = extractDurationDays(searchText);
  const originalProduct = getOriginalProductName(notification);
  const sourceOrderId = compact(notification.orderId || "") || null;
  const sourceNotificationId = compact(notification.externalId || notification.id);
  const chatLink = compact(notification.actionUrl || notification.discordLink || notification.productUrl || "") || null;

  const notes = [
    "Criada automaticamente a partir de uma venda de Game Pass.",
    sourceOrderId ? `Pedido: ${sourceOrderId}.` : "",
    `Produto vendido: ${originalProduct}.`,
    notification.price ? `Valor detectado: R$ ${notification.price.toFixed(2).replace(".", ",")}.` : "",
  ].filter(Boolean).join(" ");

  return {
    platform: notification.platform as SubscriptionPlatform,
    customerName: getCustomerName(notification),
    chatLink,
    productName: getSubscriptionProductName(durationDays),
    purchaseDate,
    startDate: purchaseDate,
    durationDays,
    sourceNotificationId,
    sourceOrderId,
    notes,
  };
}
