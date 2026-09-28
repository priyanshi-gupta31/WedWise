/**
 * Calculates wedding countdown string
 * e.g. "45 days to go", "Today is the big day! 🎉", or "Married for 12 days ❤️"
 */
export function getWeddingCountdown(weddingDateString: string): {
  days: number;
  text: string;
  isPast: boolean;
  isToday: boolean;
} {
  if (!weddingDateString) {
    return { days: 0, text: 'Date not set', isPast: false, isToday: false };
  }

  const weddingDate = new Date(weddingDateString);
  const today = new Date();
  
  // Normalize to midnight UTC/local
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetMidnight = new Date(weddingDate.getFullYear(), weddingDate.getMonth(), weddingDate.getDate());

  const diffTime = targetMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { days: 0, text: 'Today is the big day! 💍✨', isPast: false, isToday: true };
  }

  if (diffDays === 1) {
    return { days: 1, text: 'Tomorrow is the wedding! 💍', isPast: false, isToday: false };
  }

  if (diffDays > 1) {
    return { days: diffDays, text: `${diffDays} days to go`, isPast: false, isToday: false };
  }

  // In the past
  const pastDays = Math.abs(diffDays);
  return {
    days: pastDays,
    text: `${pastDays} days since celebration ❤️`,
    isPast: true,
    isToday: false,
  };
}

/**
 * Returns user greeting based on local time
 * e.g. "Good morning", "Good afternoon", "Good evening"
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Formats a date string into readable Indian format (e.g. 14 Dec 2026)
 */
export function formatReadableDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Returns today's date in YYYY-MM-DD for form default values
 */
export function getTodayISODate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
