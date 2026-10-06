import { getActiveBusyHolds, getBookingSettings } from "./data";
import { getGoogleBusy } from "./google";
import { buildSlots, enumerateDates, getTwoMonthBookingWindow, isDateInWindow, zonedTimeToUtc } from "./time";

export async function getAvailabilityWindow(durationMinutes?: number, excludeId?: string) {
  const settings = await getBookingSettings();
  const duration = durationMinutes || settings.default_duration_minutes;
  if (!settings.allowed_durations.includes(duration)) throw new Error("Unsupported meeting duration.");

  const window = getTwoMonthBookingWindow(settings.owner_timezone);
  const googleBusy = await getGoogleBusy(settings, window.timeMin, window.timeMax);
  const appBusy = await getActiveBusyHolds(window.timeMin, window.timeMax, excludeId);
  const busy = [...googleBusy, ...appBusy];
  const dates = enumerateDates(window.startDate, window.endDate).map((date) => {
    const slots = buildSlots({ date, durationMinutes: duration, settings, busy });
    return { date, available: slots.length > 0, slots };
  });

  return { settings, window, duration, dates };
}

export async function getAvailabilityForDate(date: string, durationMinutes?: number, excludeId?: string) {
  const settings = await getBookingSettings();
  const duration = durationMinutes || settings.default_duration_minutes;
  if (!settings.allowed_durations.includes(duration)) throw new Error("Unsupported meeting duration.");
  if (!isDateInWindow(date, settings.owner_timezone)) throw new Error("Selected date is outside the two-month booking window.");

  const rangeStart = zonedTimeToUtc(date, "00:00", settings.owner_timezone);
  const rangeEnd = new Date(rangeStart.getTime() + 36 * 60 * 60 * 1000);
  const googleBusy = await getGoogleBusy(settings, rangeStart.toISOString(), rangeEnd.toISOString());
  const appBusy = await getActiveBusyHolds(rangeStart.toISOString(), rangeEnd.toISOString(), excludeId);
  const slots = buildSlots({ date, durationMinutes: duration, settings, busy: [...googleBusy, ...appBusy] });
  return { settings, slots };
}
