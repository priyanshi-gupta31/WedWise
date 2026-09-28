import { WeddingTask, EventStatus } from '../types/database.types';
import { GroupedTasks } from '../types/task';

export interface EventCountdownResult {
  days: number;
  daysRemaining: number;
  label: string;
  text: string;
  pillText: string;
  status: EventStatus;
  isToday: boolean;
  isPast: boolean;
}

/**
 * Calculates dynamic event countdown based on real event date
 */
export function getEventCountdown(
  eventDate: string,
  eventName: string = 'CEREMONY'
): EventCountdownResult {
  if (!eventDate) {
    return {
      days: 0,
      daysRemaining: 0,
      label: 'Date TBD',
      text: 'DATE NOT SET',
      pillText: 'Unscheduled',
      status: 'Upcoming',
      isToday: false,
      isPast: false,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const [year, month, day] = eventDate.split('-').map(Number);
  const target = new Date(year, month - 1, day).getTime();

  const diffMs = target - today;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const cleanName = eventName.toUpperCase();

  if (days === 0) {
    return {
      days: 0,
      daysRemaining: 0,
      label: 'Today',
      text: `TODAY · ${cleanName}`,
      pillText: 'TODAY',
      status: 'Today',
      isToday: true,
      isPast: false,
    };
  }

  if (days > 0) {
    return {
      days,
      daysRemaining: days,
      label: `${days} day${days === 1 ? '' : 's'} to go`,
      text: `${days} DAY${days === 1 ? '' : 'S'} TO ${cleanName}`,
      pillText: `${days} Days`,
      status: 'Upcoming',
      isToday: false,
      isPast: false,
    };
  }

  const pastDays = Math.abs(days);
  return {
    days,
    daysRemaining: days,
    label: `Completed (${pastDays}d ago)`,
    text: `COMPLETED · ${pastDays} DAY${pastDays === 1 ? '' : 'S'} AGO`,
    pillText: 'Completed',
    status: 'Completed',
    isToday: false,
    isPast: true,
  };
}

/**
 * Groups wedding tasks chronologically: Today, This Week, Upcoming, Completed
 */
export function groupTasksChronologically(tasks: WeddingTask[]): GroupedTasks {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const today: WeddingTask[] = [];
  const thisWeek: WeddingTask[] = [];
  const upcoming: WeddingTask[] = [];
  const completed: WeddingTask[] = [];

  tasks.forEach((t) => {
    if (t.status === 'Completed') {
      completed.push(t);
      return;
    }

    if (!t.due_date) {
      upcoming.push(t);
      return;
    }

    const d = t.due_date.split('T')[0];
    if (d <= todayStr) {
      // Due today or overdue
      today.push(t);
    } else if (d <= nextWeekStr) {
      thisWeek.push(t);
    } else {
      upcoming.push(t);
    }
  });

  return {
    today,
    thisWeek,
    upcoming,
    completed,
  };
}

/**
 * Formats start and end times into an elegant display string
 */
export function formatEventTimeRange(
  startTime?: string | null,
  endTime?: string | null
): string {
  if (!startTime && !endTime) return 'Time to be announced';
  if (startTime && !endTime) return startTime;
  if (!startTime && endTime) return `Until ${endTime}`;
  return `${startTime} – ${endTime}`;
}
