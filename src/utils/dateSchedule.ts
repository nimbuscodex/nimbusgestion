/**
 * Date Scheduling Utilities for Nimbuscodex Gestión
 * Handles presets like 1 semana (+7 días), 1 mes (+30 días), mañana (+1 día),
 * formatted badges, and relative day calculations.
 */

export const calculateScheduleDate = (
  preset: 'tomorrow' | '1_week' | '1_month' | string,
  baseDate?: string
): string => {
  const d = baseDate ? new Date(baseDate) : new Date();
  // Ensure valid date
  if (isNaN(d.getTime())) {
    d.setTime(Date.now());
  }

  if (preset === 'tomorrow') {
    d.setDate(d.getDate() + 1);
  } else if (preset === '1_week') {
    d.setDate(d.getDate() + 7);
  } else if (preset === '1_month') {
    d.setMonth(d.getMonth() + 1);
  } else if (preset === '2_weeks') {
    d.setDate(d.getDate() + 14);
  } else if (preset === '3_days') {
    d.setDate(d.getDate() + 3);
  }

  return d.toISOString().split('T')[0];
};

export const getDaysDifference = (targetDateStr?: string): number => {
  if (!targetDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  if (isNaN(target.getTime())) return 0;

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const formatScheduleBadge = (
  dateStr?: string,
  prefix: 'Contactar' | 'Seguimiento' | '' = ''
): {
  label: string;
  shortLabel: string;
  isOverdue: boolean;
  isToday: boolean;
  daysRemaining: number;
} => {
  if (!dateStr) {
    return {
      label: 'Sin programar',
      shortLabel: 'Sin fecha',
      isOverdue: false,
      isToday: false,
      daysRemaining: 0,
    };
  }

  const days = getDaysDifference(dateStr);
  const dateFormatted = new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });

  const pfx = prefix ? `${prefix} ` : '';

  if (days < 0) {
    return {
      label: `${pfx}vencido (${Math.abs(days)}d atrás - ${dateFormatted})`,
      shortLabel: `Vencido (${Math.abs(days)}d)`,
      isOverdue: true,
      isToday: false,
      daysRemaining: days,
    };
  } else if (days === 0) {
    return {
      label: `¡${pfx}toca hoy! (${dateFormatted})`,
      shortLabel: '¡Toca hoy!',
      isOverdue: false,
      isToday: true,
      daysRemaining: 0,
    };
  } else if (days === 1) {
    return {
      label: `${pfx}mañana (${dateFormatted})`,
      shortLabel: 'Mañana',
      isOverdue: false,
      isToday: false,
      daysRemaining: 1,
    };
  } else if (days === 7) {
    return {
      label: `${pfx}en 1 semana (${dateFormatted})`,
      shortLabel: 'En 1 semana',
      isOverdue: false,
      isToday: false,
      daysRemaining: 7,
    };
  } else if (days >= 28 && days <= 32) {
    return {
      label: `${pfx}en 1 mes (${dateFormatted})`,
      shortLabel: 'En 1 mes',
      isOverdue: false,
      isToday: false,
      daysRemaining: days,
    };
  } else {
    return {
      label: `${pfx}en ${days} días (${dateFormatted})`,
      shortLabel: `en ${days}d`,
      isOverdue: false,
      isToday: false,
      daysRemaining: days,
    };
  }
};
