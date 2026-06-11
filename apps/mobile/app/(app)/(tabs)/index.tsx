import { FLOOR_META } from '@desko/domain';
import { FlashList } from '@shopify/flash-list';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MyDayCard } from './_components/my-day-card';
import { useFollows } from './_components/use-follows';
import {
  usePresenceToday,
  type PresenceEntryDto,
} from './_components/use-presence-today';
import { WhoFilter, type WhoFilterValue } from './_components/who-filter';

function ColleagueRow({ entry }: { entry: PresenceEntryDto }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-line-subtle bg-paper px-4 py-3">
      <View className="size-9 items-center justify-center rounded-pill border border-primary bg-primary-subtle">
        <Text className="font-bold text-xs text-primary-text">{entry.initials}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-bold text-sm text-ink">{entry.displayName}</Text>
        <Text className="text-xs text-ink-muted">
          {entry.status === 'in_office'
            ? entry.floor
              ? FLOOR_META[entry.floor].label
              : 'In ufficio'
            : 'Da remoto'}
          {entry.team ? ` · ${entry.team}` : ''}
        </Text>
      </View>
      {entry.isLastMinute ? (
        <View className="rounded-pill bg-warning-subtle px-2 py-0.5">
          <Text className="text-[10px] font-bold text-primary-text">last-minute</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Tab "Oggi" — dati reali da /api/presence/today (filtro privacy incluso). */
export default function TodayScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = usePresenceToday();
  // Filtro US-3: chi voglio guardare (la privacy è già applicata server-side)
  const [who, setWho] = useState<WhoFilterValue>('all');
  const follows = useFollows(who === 'follows');

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas" edges={['top']}>
        <ActivityIndicator size="large" color="#E8B931" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center text-base text-ink-secondary">
            {error instanceof Error ? error.message : 'Errore di caricamento.'}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="rounded-sm bg-primary px-6 py-3 active:bg-primary-active"
          >
            <Text className="font-bold text-sm text-primary-text">Riprova</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  let inOffice = data.entries.filter((e) => e.status === 'in_office');
  if (who === 'follows' && follows.data) {
    const allowed = new Set(follows.data.follows.map((f) => f.userId));
    inOffice = inOffice.filter((e) => allowed.has(e.userId));
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlashList
        data={inOffice}
        keyExtractor={(e) => e.userId}
        renderItem={({ item }) => <ColleagueRow entry={item} />}
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View className="gap-5 px-5 pb-4 pt-6">
            <View className="gap-1">
              <Text className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-muted">
                In ufficio · oggi
              </Text>
              <Text className="font-bold text-3xl text-ink">Chi c'è oggi.</Text>
            </View>

            <MyDayCard status={data.me.status} floor={data.me.floor} />

            <View className="flex-row gap-3">
              {[
                { label: 'In ufficio', value: data.counts.totalDeclared },
                { label: 'Last-minute', value: data.counts.lastMinute },
                { label: 'Remote', value: data.counts.remote },
              ].map((kpi) => (
                <View
                  key={kpi.label}
                  className="flex-1 gap-1 rounded-md border border-line bg-paper p-3"
                >
                  <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    {kpi.label}
                  </Text>
                  <Text className="font-bold text-2xl text-ink">{kpi.value}</Text>
                </View>
              ))}
            </View>

            <WhoFilter value={who} onChange={setWho} />

            <Text className="font-bold text-base text-ink">
              {who === 'follows' ? 'Chi segui, in ufficio' : 'Colleghi in ufficio'} (
              {inOffice.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="mx-5 rounded-md border border-dashed border-line-strong bg-paper-alt p-4">
            <Text className="text-sm text-ink-muted">
              Nessuno ha ancora dichiarato la presenza per oggi.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
