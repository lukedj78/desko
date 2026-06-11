import { Pressable, Text, View } from 'react-native';

/**
 * Griglia mese pura (presentational): settimane Lun→Dom, celle con
 * conteggio presenti. Nessun fetch qui — i dati arrivano dal parent.
 */

export type DayCell = {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  attendeeCount: number;
  meInOffice: boolean;
};

const pad = (n: number) => String(n).padStart(2, '0');
export const toIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Costruisce le settimane (Lun→Dom) che coprono il mese di `monthStart`.
 * `attendance` mappa date ISO → { count, me }.
 */
export function buildMonthWeeks(
  monthStart: Date,
  attendance: Map<string, { count: number; me: boolean }>,
): DayCell[][] {
  const todayStr = toIso(new Date());
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();

  const first = new Date(year, month, 1);
  // getDay(): 0=Dom … 6=Sab → offset rispetto al Lunedì
  const leadingDays = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - leadingDays);

  const weeks: DayCell[][] = [];
  const cursor = new Date(gridStart);
  do {
    const week: DayCell[] = [];
    for (let i = 0; i < 7; i += 1) {
      const iso = toIso(cursor);
      const att = attendance.get(iso);
      week.push({
        date: iso,
        dayOfMonth: cursor.getDate(),
        inCurrentMonth: cursor.getMonth() === month,
        isToday: iso === todayStr,
        isPast: iso < todayStr,
        attendeeCount: att?.count ?? 0,
        meInOffice: att?.me ?? false,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  } while (cursor.getMonth() === month);

  return weeks;
}

const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

export function MonthGrid({
  weeks,
  selectedDate,
  onSelectDay,
}: {
  weeks: DayCell[][];
  selectedDate: string;
  onSelectDay: (date: string) => void;
}) {
  return (
    <View className="gap-1 rounded-md border border-line bg-paper p-3">
      <View className="flex-row">
        {WEEKDAYS.map((d, i) => (
          <Text
            key={`${d}-${i}`}
            className="flex-1 text-center text-[11px] font-semibold uppercase text-ink-muted"
          >
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0]!.date} className="flex-row">
          {week.map((day) => {
            const selected = day.date === selectedDate;
            return (
              <Pressable
                key={day.date}
                onPress={() => onSelectDay(day.date)}
                disabled={!day.inCurrentMonth}
                className={`m-0.5 flex-1 items-center gap-0.5 rounded-sm py-1.5 ${
                  selected
                    ? 'bg-primary'
                    : day.isToday
                      ? 'border border-primary bg-primary-subtle'
                      : 'bg-transparent'
                } ${day.inCurrentMonth ? '' : 'opacity-0'}`}
              >
                <Text
                  className={`text-sm ${
                    selected
                      ? 'font-bold text-primary-text'
                      : day.isPast
                        ? 'text-ink-muted'
                        : 'font-medium text-ink'
                  }`}
                >
                  {day.dayOfMonth}
                </Text>
                <View className="h-4 flex-row items-center gap-0.5">
                  {day.attendeeCount > 0 ? (
                    <Text
                      className={`text-[10px] font-bold ${
                        selected ? 'text-primary-text' : 'text-ink-secondary'
                      }`}
                    >
                      {day.attendeeCount}
                    </Text>
                  ) : null}
                  {day.meInOffice ? (
                    <View
                      className={`size-1.5 rounded-pill ${
                        selected ? 'bg-primary-text' : 'bg-primary-active'
                      }`}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
