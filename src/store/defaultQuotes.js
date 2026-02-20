const now = Date.now();

function isoDaysAgo(days) {
  return new Date(now - days * 86400000).toISOString();
}

function isoDaysFromNow(days) {
  return new Date(now + days * 86400000).toISOString();
}

export const defaultQuotes = [
  {
    id: "q-001",
    number: 1001,
    status: "pendiente",
    clientName: "Cliente demo",
    projectDesc: "Mantenimiento general",
    deliveryDays: 5,
    projectPrice: 50,
    createdAt: isoDaysAgo(2),
    items: [
      { productId: "p-003", name: "Pan de molde", unitCost: 1.45, qty: 8 },
      { productId: "p-001", name: "Leche entera 1L", unitCost: 1.15, qty: 6 },
    ],
  },
  {
    id: "q-002",
    number: 1002,
    status: "en_curso",
    clientName: "Constructora Alvarez",
    projectDesc: "Compra de insumos (fase 1)",
    deliveryDays: 10,
    projectPrice: 125,
    createdAt: isoDaysAgo(6),
    startedAt: isoDaysAgo(1),
    progressPct: 35,
    progressUpdatedAt: isoDaysAgo(0),
    items: [
      { productId: "p-006", name: "Jabon liquido 1L", unitCost: 3.25, qty: 2 },
      { productId: "p-007", name: "Papel higienico x4", unitCost: 2.75, qty: 4 },
    ],
  },
  {
    id: "q-003",
    number: 1003,
    status: "completada",
    clientName: "Inmobiliaria Central",
    projectDesc: "Suministro mensual",
    deliveryDays: 7,
    projectPrice: 0,
    createdAt: isoDaysAgo(18),
    startedAt: isoDaysAgo(16),
    completedAt: isoDaysFromNow(-10),
    items: [
      { productId: "p-004", name: "Cereal avena 500g", unitCost: 2.05, qty: 10 },
      { productId: "p-005", name: "Atun en lata", unitCost: 1.1, qty: 12 },
    ],
  },
];
