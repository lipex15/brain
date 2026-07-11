import type { NotificationItem, NotificationPlatform } from './types';

export function getNotificationOrderKey(notification: NotificationItem) {
  const storedOrder = notification.orderId?.trim();
  const legacyOrder = notification.description?.match(/(?:ID\s+da\s+Venda|Pedido):\*{0,2}\s*\[?#?([a-z0-9]+)/i)?.[1];
  const orderId = storedOrder || legacyOrder;
  return orderId
    ? `${notification.platform}:${orderId.toLowerCase()}`
    : `notification:${notification.id}`;
}

export function calculateNotificationRevenue(notifications: NotificationItem[], platform?: NotificationPlatform) {
  const totalsByOrder = new Map<string, number>();

  notifications
    .filter((notification) => notification.category === 'venda' && (!platform || notification.platform === platform))
    .forEach((notification) => {
      if (typeof notification.price !== 'number' || notification.price <= 0) return;
      const key = getNotificationOrderKey(notification);
      totalsByOrder.set(key, Math.max(totalsByOrder.get(key) || 0, notification.price));
    });

  const total = Array.from(totalsByOrder.values()).reduce((sum, value) => sum + value, 0);
  return Math.round(total * 100) / 100;
}
