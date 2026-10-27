/**
 * Amelia calendar selectors shared by the session and package flows.
 *
 * Bookable days from today on. Past days are excluded explicitly: right after
 * the calendar renders, Amelia briefly shows every cell as enabled until the
 * availability request returns, so ":not(disabled)" alone can match a past day.
 */
export const ameliaCalendarDay =
  '.am-advsc__dayGridMonth-cell:is(.fc-day-today, .fc-day-future):not(.am-advsc__dayGridMonth-disabled)';

export const ameliaTimeSlot = '.am-advsc__slots-item';
