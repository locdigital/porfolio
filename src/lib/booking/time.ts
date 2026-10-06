import type { BookingSettings, Slot } from "./types";

const DEFAULT_LOCALE = "vi-VN";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function formatInTimeZone(date: Date | string, timeZone: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    timeZone,
    hour12: false,
    ...options,
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateTime(date: Date | string, timeZone: string) {
  return formatInTimeZone(date, timeZone, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === 24 ? 0 : get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

export function zonedTimeToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  for (let i = 0; i < 3; i += 1) {
    const parts = getZonedParts(utc, timeZone);
    const asIfUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const wanted = Date.UTC(year, month - 1, day, hour, minute, 0);
    utc = new Date(utc.getTime() - (asIfUtc - wanted));
  }

  return utc;
}

export function getWeekday(date: string, timeZone: string) {
  const noonUtc = zonedTimeToUtc(date, "12:00", timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(noonUtc);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

export function dateOnlyInTimeZone(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function parseDate(date: string) {
  if (!DATE_RE.test(date)) throw new Error("Invalid date.");
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addCalendarMonths(date: string, months: number) {
  const parsed = parseDate(date);
  const zeroBasedMonth = parsed.month - 1 + months;
  const year = parsed.year + Math.floor(zeroBasedMonth / 12);
  const month = ((zeroBasedMonth % 12) + 12) % 12 + 1;
  const day = Math.min(parsed.day, daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addCalendarDays(date: string, days: number) {
  const parsed = parseDate(date);
  const utc = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

export function enumerateDates(startDate: string, endDateInclusive: string) {
  const dates: string[] = [];
  for (let cursor = startDate; cursor <= endDateInclusive; cursor = addCalendarDays(cursor, 1)) {
    dates.push(cursor);
  }
  return dates;
}

export function getTwoMonthBookingWindow(timeZone: string, now = new Date()) {
  const startDate = dateOnlyInTimeZone(now, timeZone);
  const endDate = addCalendarMonths(startDate, 2);
  const endExclusiveDate = addCalendarDays(endDate, 1);
  return {
    startDate,
    endDate,
    timeMin: zonedTimeToUtc(startDate, "00:00", timeZone).toISOString(),
    timeMax: zonedTimeToUtc(endExclusiveDate, "00:00", timeZone).toISOString(),
  };
}

export function isDateInWindow(date: string, timeZone: string, now = new Date()) {
  const window = getTwoMonthBookingWindow(timeZone, now);
  return date >= window.startDate && date <= window.endDate;
}

export function isIntervalInWindow(startsAt: Date, endsAt: Date, timeZone: string, now = new Date()) {
  const window = getTwoMonthBookingWindow(timeZone, now);
  return startsAt >= new Date(window.timeMin) && endsAt <= new Date(window.timeMax);
}

export function buildSlots(params: {
  date: string;
  durationMinutes: number;
  settings: BookingSettings;
  busy: { start: string; end: string }[];
  now?: Date;
}): Slot[] {
  const { date, durationMinutes, settings, busy, now = new Date() } = params;
  const timeZone = settings.owner_timezone;
  if (!isDateInWindow(date, timeZone, now)) return [];

  const day = getWeekday(date, timeZone);
  if (!settings.working_days.includes(day)) return [];

  const workStart = zonedTimeToUtc(date, settings.work_start_time.slice(0, 5), timeZone);
  const workEnd = zonedTimeToUtc(date, settings.work_end_time.slice(0, 5), timeZone);
  const minimumStart = addMinutes(now, settings.minimum_notice_hours * 60);
  const buffer = settings.buffer_minutes;
  const bufferedBusy = busy.map((item) => ({
    start: addMinutes(new Date(item.start), -buffer),
    end: addMinutes(new Date(item.end), buffer),
  }));

  const slots: Slot[] = [];
  for (let cursor = new Date(workStart); addMinutes(cursor, durationMinutes + buffer) <= workEnd; cursor = addMinutes(cursor, 15)) {
    const startsAt = new Date(cursor);
    const endsAt = addMinutes(startsAt, durationMinutes);
    const bookingWithBufferStart = addMinutes(startsAt, -buffer);
    const bookingWithBufferEnd = addMinutes(endsAt, buffer);
    const bufferFitsWorkHours = bookingWithBufferStart >= workStart && bookingWithBufferEnd <= workEnd;
    const conflict = bufferedBusy.some((period) => overlaps(startsAt, endsAt, period.start, period.end));
    const outsideNotice = startsAt < minimumStart;
    const outsideWindow = !isIntervalInWindow(startsAt, endsAt, timeZone, now);

    if (bufferFitsWorkHours && !conflict && !outsideNotice && !outsideWindow) {
      slots.push({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        label: `${formatInTimeZone(startsAt, timeZone, { hour: "2-digit", minute: "2-digit" })} UTC+7`,
      });
    }
  }

  return slots;
}
