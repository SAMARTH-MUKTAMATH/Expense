// Vercel runs in UTC; users and bank SMS are in IST
const IST_OFFSET_MS = 330 * 60 * 1000;

export function istWallClock(year, month, day, hours = 0, minutes = 0, seconds = 0) {
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds) - IST_OFFSET_MS);
}

export function istParts(date) {
  const shifted = new Date(new Date(date).getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

export function istStartOfDay(date = new Date(), dayOffset = 0) {
  const { year, month, day } = istParts(date);
  return istWallClock(year, month, day + dayOffset);
}

export function istMonthRange(date = new Date(), monthOffset = 0) {
  const { year, month } = istParts(date);
  return {
    start: istWallClock(year, month + monthOffset, 1),
    end: istWallClock(year, month + monthOffset + 1, 1),
  };
}

const RANGE_START_DAY_OFFSET = { today: 0, yesterday: -1, "7d": -6, "30d": -29 };

export function istRangeBounds(range, now = new Date()) {
  const end = istStartOfDay(now, 1);
  if (range === "yesterday") return { start: istStartOfDay(now, -1), end: istStartOfDay(now) };
  if (range === "month") return { start: istMonthRange(now).start, end };
  if (range in RANGE_START_DAY_OFFSET) {
    return { start: istStartOfDay(now, RANGE_START_DAY_OFFSET[range]), end };
  }
  return { start: null, end };
}

export function istMonthKey(date) {
  const { year, month } = istParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
