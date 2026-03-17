// Utilities to derive the latest payment per student while preserving historical records.

const PAYMENT_RECENCY_KEYS = ['fecha_fin', 'fecha_inicio', 'fecha_pago', 'created_at'];

const toTimestamp = (value) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

const compareByRecency = (a, b) => {
  for (const key of PAYMENT_RECENCY_KEYS) {
    const diff = toTimestamp(b?.[key]) - toTimestamp(a?.[key]);
    if (diff !== 0) return diff;
  }

  return (b?.id || 0) - (a?.id || 0);
};

const normalizePayments = (payments = []) => {
  return payments
    .filter((payment) => payment && payment.student_id && !payment.deleted_at)
    .sort(compareByRecency);
};

export const getLatestPaymentsMap = (payments = []) => {
  const latestPaymentsMap = new Map();

  for (const payment of normalizePayments(payments)) {
    if (!latestPaymentsMap.has(payment.student_id)) {
      latestPaymentsMap.set(payment.student_id, payment);
    }
  }

  return latestPaymentsMap;
};

export const getLatestPaymentsList = (payments = []) => {
  return Array.from(getLatestPaymentsMap(payments).values());
};

export const splitLatestAndHistoricalPayments = (payments = []) => {
  const normalizedPayments = normalizePayments(payments);
  const latestMap = getLatestPaymentsMap(normalizedPayments);

  return {
    latestPayments: Array.from(latestMap.values()),
    historicalPayments: normalizedPayments.filter(
      (payment) => latestMap.get(payment.student_id)?.id !== payment.id
    )
  };
};
