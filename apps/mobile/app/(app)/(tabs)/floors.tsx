import { FLOOR_META, type Floor } from '@desko/domain';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/lib/api';

import { useUpdateFloor } from './_components/use-presence-today';
import type { PresenceEntryDto } from './_components/use-presence-today';

type FloorOccupancyDto = {
  byFloor: Array<{
    floor: Floor;
    presentCount: number;
    capacity: number;
    byTeam: Array<{ team: string; count: number }>;
    recentlyMovedIn: PresenceEntryDto[];
  }>;
  unassignedCount: number;
  totalInOffice: number;
};

function useFloorOccupancy() {
  return useQuery({
    queryKey: ['presence', 'floors'] as const,
    queryFn: () => api.get<FloorOccupancyDto>('/api/presence/floors'),
    staleTime: 60_000,
  });
}

function CapacityBar({ count, capacity }: { count: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((count / capacity) * 100)) : 0;
  return (
    <View className="h-2 overflow-hidden rounded-pill bg-paper-alt">
      <View
        className={`h-full rounded-pill ${pct >= 90 ? 'bg-danger' : 'bg-primary'}`}
        style={{ width: `${pct}%` }}
      />
    </View>
  );
}

function FloorCard({
  data,
  onMoveHere,
  movePending,
}: {
  data: FloorOccupancyDto['byFloor'][number];
  onMoveHere: () => void;
  movePending: boolean;
}) {
  return (
    <View className="gap-3 rounded-md border border-line bg-paper p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="gap-0.5">
          <Text className="font-bold text-lg text-ink">{FLOOR_META[data.floor].label}</Text>
          <Text className="text-xs text-ink-muted">{FLOOR_META[data.floor].description}</Text>
        </View>
        <View className="items-end">
          <Text className="font-bold text-2xl text-ink">
            {data.presentCount}
            <Text className="text-sm font-medium text-ink-muted">/{data.capacity}</Text>
          </Text>
        </View>
      </View>

      <CapacityBar count={data.presentCount} capacity={data.capacity} />

      {data.byTeam.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {data.byTeam.map((t) => (
            <View key={t.team} className="rounded-pill bg-paper-alt px-2.5 py-1">
              <Text className="text-[11px] font-semibold text-ink-secondary">
                {t.team} · {t.count}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-xs text-ink-muted">Nessuno su questo piano, per ora.</Text>
      )}

      <Pressable
        disabled={movePending}
        onPress={onMoveHere}
        className="items-center rounded-sm border border-line-strong bg-paper px-4 py-2.5 active:bg-paper-alt disabled:opacity-50"
      >
        <Text className="font-bold text-xs text-ink">
          Sono qui · {FLOOR_META[data.floor].shortLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/** Tab Piani — occupazione 7°/2° (US-7) con quick action "sono qui". */
export default function FloorsScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useFloorOccupancy();
  const updateFloor = useUpdateFloor();

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-6">
        <View className="gap-1">
          <Text className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Occupazione · oggi
          </Text>
          <Text className="font-bold text-3xl text-ink">Piani.</Text>
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
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1 rounded-md border border-line bg-paper p-3">
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  In ufficio
                </Text>
                <Text className="font-bold text-2xl text-ink">{data.totalInOffice}</Text>
              </View>
              <View className="flex-1 gap-1 rounded-md border border-line bg-paper p-3">
                <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  Senza piano
                </Text>
                <Text className="font-bold text-2xl text-ink">{data.unassignedCount}</Text>
              </View>
            </View>

            {data.byFloor.map((f) => (
              <FloorCard
                key={f.floor}
                data={f}
                movePending={updateFloor.isPending}
                onMoveHere={() => updateFloor.mutate(f.floor)}
              />
            ))}

            {isRefetching ? <ActivityIndicator size="small" color="#E8B931" /> : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
