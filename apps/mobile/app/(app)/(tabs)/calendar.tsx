import { Ionicons } from '@expo/vector-icons';
import { FLOOR_META, type Floor } from '@desko/domain';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/lib/auth-client';

import { MonthGrid, buildMonthWeeks, toIso } from './_components/month-grid';
import {
  useDeclarePresence,
  usePresenceRange,
  type MonthAttendeeDto,
} from './_components/use-presence-today';

const FLOORS: Floor[] = ['seventh_floor', 'second_floor'];

function monthBounds(monthStart: Date): { from: string; to: string } {
  const from = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const to = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  return { from: toIso(from), to: toIso(to) };
}

function DayDetail({
  date,
  attendees,
  isPast,
}: {
  date: string;
  attendees: MonthAttendeeDto[];
  isPast: boolean;
}) {
  const declare = useDeclarePresence();
  const [error, setError] = useState<string | null>(null);

  const label = new Date(date).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  function run(action: Promise<unknown>) {
    setError(null);
    action.catch((e: unknown) =>
      setError(e instanceof Error ? e.message : 'Errore. Riprova.'),
    );
  }

  return (
    <View className="gap-3 rounded-md border border-line bg-paper p-4">
      <Text className="font-bold text-base capitalize text-ink">{label}</Text>

      {isPast ? (
        <Text className="text-xs text-ink-muted">
          Giorno passato — la dichiarazione non è modificabile.
        </Text>
      ) : (
        <View className="gap-2">
          <View className="flex-row gap-2">
            {FLOORS.map((f) => (
              <Pressable
                key={f}
                disabled={declare.isPending}
                onPress={() => run(declare.mutateAsync({ date, status: 'in_office', floor: f }))}
                className="flex-1 items-center rounded-sm bg-primary px-3 py-2.5 active:bg-primary-active disabled:opacity-50"
              >
                <Text className="font-bold text-xs text-primary-text">
                  Ufficio · {FLOOR_META[f].shortLabel}
                </Text>
              </Pressable>
            ))}
            <Pressable
              disabled={declare.isPending}
              onPress={() => run(declare.mutateAsync({ date, status: 'remote' }))}
              className="flex-1 items-center rounded-sm border border-line-strong bg-paper px-3 py-2.5 active:bg-paper-alt disabled:opacity-50"
            >
              <Text className="font-bold text-xs text-ink">Remoto</Text>
            </Pressable>
          </View>
          {declare.isPending ? <ActivityIndicator size="small" color="#E8B931" /> : null}
          {error ? (
            <View className="rounded-sm border border-danger bg-danger-subtle p-2">
              <Text className="text-xs text-danger">{error}</Text>
            </View>
          ) : null}
        </View>
      )}

      <View className="gap-2">
        <Text className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          In ufficio ({attendees.length})
        </Text>
        {attendees.length === 0 ? (
          <Text className="text-sm text-ink-muted">Nessuna presenza dichiarata.</Text>
        ) : (
          attendees.map((a) => (
            <View key={a.userId} className="flex-row items-center gap-3">
              <View className="size-8 items-center justify-center rounded-pill border border-primary bg-primary-subtle">
                <Text className="font-bold text-[11px] text-primary-text">{a.initials}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-ink">{a.displayName}</Text>
              </View>
              {a.floor ? (
                <Text className="text-xs text-ink-muted">{FLOOR_META[a.floor].shortLabel}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

/** Tab Calendario — griglia mese da /api/presence/range + dichiarazione su data. */
export default function CalendarScreen() {
  const { data: session } = useSession();
  const myId = session?.user.id;

  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toIso(new Date()));

  const { from, to } = monthBounds(monthStart);
  const { data, isPending, isError, error, refetch } = usePresenceRange(from, to);

  const attendance = useMemo(() => {
    const map = new Map<string, { count: number; me: boolean }>();
    for (const day of data?.days ?? []) {
      map.set(day.date, {
        count: day.attendees.length,
        me: myId ? day.attendees.some((a) => a.userId === myId) : false,
      });
    }
    return map;
  }, [data, myId]);

  const weeks = useMemo(() => buildMonthWeeks(monthStart, attendance), [monthStart, attendance]);

  const monthLabel = monthStart.toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  });

  function shiftMonth(delta: number) {
    const next = new Date(monthStart.getFullYear(), monthStart.getMonth() + delta, 1);
    setMonthStart(next);
    setSelectedDate(toIso(next));
  }

  const selectedAttendees =
    data?.days.find((d) => d.date === selectedDate)?.attendees ?? [];
  const todayStr = toIso(new Date());

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-6">
        <View className="gap-1">
          <Text className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Presenze · mese
          </Text>
          <Text className="font-bold text-3xl text-ink">Calendario.</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => shiftMonth(-1)}
            className="size-9 items-center justify-center rounded-sm border border-line bg-paper active:bg-paper-alt"
          >
            <Ionicons name="chevron-back" size={18} color="#0E0F0C" />
          </Pressable>
          <Text className="font-bold text-lg capitalize text-ink">{monthLabel}</Text>
          <Pressable
            onPress={() => shiftMonth(1)}
            className="size-9 items-center justify-center rounded-sm border border-line bg-paper active:bg-paper-alt"
          >
            <Ionicons name="chevron-forward" size={18} color="#0E0F0C" />
          </Pressable>
        </View>

        {isPending ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#E8B931" />
          </View>
        ) : isError ? (
          <View className="items-center gap-3 py-8">
            <Text className="text-center text-sm text-ink-secondary">
              {error instanceof Error ? error.message : 'Errore di caricamento.'}
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="rounded-sm bg-primary px-5 py-2.5 active:bg-primary-active"
            >
              <Text className="font-bold text-sm text-primary-text">Riprova</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <MonthGrid
              weeks={weeks}
              selectedDate={selectedDate}
              onSelectDay={setSelectedDate}
            />
            <DayDetail
              date={selectedDate}
              attendees={selectedAttendees}
              isPast={selectedDate < todayStr}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
