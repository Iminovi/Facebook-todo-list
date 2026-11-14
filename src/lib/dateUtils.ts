const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const INDONESIAN_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const CALENDAR_WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateKey(): string {
  return formatDateKey(new Date());
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + deltaDays);
  return formatDateKey(date);
}

export function formatIndonesianDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const dayName = INDONESIAN_DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function formatShortIndonesianDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getDate();
  const monthName = INDONESIAN_MONTHS[date.getMonth()];
  return `${day} ${monthName} ${date.getFullYear()}`;
}

export function formatIndonesianMonthYear(year: number, monthIndex: number): string {
  return `${INDONESIAN_MONTHS[monthIndex]} ${year}`;
}

export interface CalendarCell {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}

export function getMonthCalendarDays(year: number, monthIndex: number): CalendarCell[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, monthIndex, 1 - startOffset);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    cells.push({
      dateKey: formatDateKey(current),
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === monthIndex,
    });
  }
  return cells;
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
