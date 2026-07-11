import assert from 'node:assert/strict';
import test from 'node:test';
import { enrichStoredNotifications, parseDiscordMessage } from '../notificationParser.ts';
import { calculateNotificationRevenue } from '../src/notificationAccounting.ts';
import type { NotificationItem } from '../src/types.ts';

function notification(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: overrides.id || Math.random().toString(36),
    platform: 'ggmax',
    title: 'Nova venda',
    description: '',
    timestamp: new Date().toISOString(),
    priority: 'alta',
    category: 'venda',
    status: 'vista',
    resolution: 'pendente',
    ...overrides,
  };
}

test('GGMAX separa anúncio, variação, pedido e entrega sem markdown', () => {
  const parsed = parseDiscordMessage('', {
    title: '💰 Nova Venda',
    authorName: 'GGMAX',
    footer: 'GGMAX • Webhook',
    description: [
      '🧾 **ID da Venda:** [nzwozok](https://ggmax.com.br/conta/pedido/nzwozok)',
      '💵 **Valor:** R$ 4,87',
      '📦 **Status:** Aprovado',
      '👤 **Cliente:** donafifi',
      '📢 **Anúncio:** [XBOX GAMEPASS ULTIMATE](https://ggmax.com.br/anuncio/xbox-gamepass) › [PC] GAMEPASS ULTIMATE',
      '📦 **Entrega Automática:** Sim › Entregue (ID: 10259868)',
    ].join('\n'),
  });

  assert.equal(parsed.category, 'venda');
  assert.equal(parsed.eventType, 'sale');
  assert.equal(parsed.itemName, '[PC] GAMEPASS ULTIMATE');
  assert.equal(parsed.adName, 'XBOX GAMEPASS ULTIMATE');
  assert.equal(parsed.orderId, 'nzwozok');
  assert.equal(parsed.price, 4.87);
  assert.equal(parsed.deliveryStatus, 'Sim › Entregue (ID: 10259868)');
  assert.equal(parsed.actionUrl, 'https://ggmax.com.br/conta/pedido/nzwozok');
  assert.equal(parsed.description?.includes('**'), false);
});

test('GameMarket diferencia venda, entrega e fundos liberados', () => {
  const base = { authorName: 'GAMEMARKET', footer: 'GameMarket • gamemarket.com.br' };
  const sale = parseDiscordMessage('', {
    ...base,
    title: 'Nova Venda Confirmada',
    description: '💳 Pagamento confirmado! Pedido em período de garantia.',
    fields: [
      { name: 'Pedido', value: '#KQVL2Y9' },
      { name: 'Produto', value: 'Game Pass Ultimate' },
      { name: 'Comprador', value: 'daniedss' },
      { name: 'Valor', value: 'R$ 5.00' },
    ],
  });
  const delivered = parseDiscordMessage('', {
    ...base,
    title: 'Pedido Entregue',
    description: '🤖 Entrega automática realizada com sucesso.',
    fields: [{ name: 'Pedido', value: '#KQVL2Y9' }, { name: 'Produto', value: 'Game Pass Ultimate' }],
  });
  const funds = parseDiscordMessage('', {
    ...base,
    title: 'Fundos Liberados',
    description: '💰 Saldo do pedido liberado para disponível após período de garantia.',
    fields: [{ name: 'Pedido', value: '#KQVL2Y9' }, { name: 'Valor Líquido', value: 'R$ 4.25' }],
  });

  assert.deepEqual([sale.category, delivered.category, funds.category], ['venda', 'outros', 'financeiro']);
  assert.deepEqual([sale.eventType, delivered.eventType, funds.eventType], ['sale', 'order_delivered', 'funds_released']);
});

test('faturamento soma o total do pedido uma vez e preserva pedidos diferentes', () => {
  const rows = [
    notification({ id: 'crossfire-1', orderId: '47rxk46', price: 39.98 }),
    notification({ id: 'crossfire-2', orderId: '47rxk46', price: 39.98 }),
    notification({ id: 'subnautica', orderId: 'x6jg50l', price: 59.98 }),
    notification({ id: 'outro-pedido', orderId: 'novo123', price: 19.99 }),
    notification({ id: 'fundos', category: 'financeiro', orderId: '47rxk46', price: 39.98 }),
  ];

  assert.equal(calculateNotificationRevenue(rows), 119.95);
});

test('histórico antigo de pedido entregue deixa de contar como venda', () => {
  const rows = [notification({
    platform: 'gamemarket',
    title: '💰 Nova Venda - GameMarket',
    description: '🤖 Entrega automática realizada com sucesso.',
  })];

  assert.equal(enrichStoredNotifications(rows), true);
  assert.equal(rows[0].category, 'outros');
  assert.equal(rows[0].eventType, 'order_delivered');
});

