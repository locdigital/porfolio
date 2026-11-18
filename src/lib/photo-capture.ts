/** EXIF wall-clock values stay local; offset timestamps can use a known IANA zone. */
export function formatPhotoCapture(value?: string, timeZone?: string) {
  const missing = { date: "Chưa cập nhật", time: "Chưa cập nhật" };
  if (!value) return missing;
  const match = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/.exec(value.trim());
  if (!match) return missing;
  const [, day, clock, seconds, offset] = match;
  const calendar = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day) return missing;
  if (clock && (Number(clock.slice(0, 2)) > 23 || Number(clock.slice(3)) > 59)) return missing;
  if (seconds && Number(seconds) > 59) return missing;
  if (offset && !Number.isFinite(Date.parse(value.trim().replace(" ", "T")))) return missing;

  // Without a known destination zone, retain the date/time written by the camera.
  const convert = Boolean(clock && offset && timeZone);
  const instant = new Date(convert ? value.trim().replace(" ", "T") : `${day}T${clock || "00:00"}:00Z`);
  if (!Number.isFinite(instant.getTime())) return missing;
  try {
    const zone = convert ? timeZone : "UTC";
    return {
      date: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: zone }).format(instant),
      time: clock ? new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zone }).format(instant) : missing.time,
    };
  } catch {
    return missing;
  }
}
