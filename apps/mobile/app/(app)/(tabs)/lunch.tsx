import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { todayIso } from '@/lib/api';

import {
  useCancelLunch,
  useCreateLunchProposal,
  useJoinLunch,
  useLeaveLunch,
  useLunchProposals,
  useRestaurants,
  type LunchProposalDto,
} from './_components/use-lunch';

const TIME_PRESETS = ['12:30', '13:00', '13:30'];
const CAP_PRESETS: Array<{ label: string; value: number | null }> = [
  { label: 'Libero', value: null },
  { label: '4', value: 4 },
  { label: '6', value: 6 },
  { label: '8', value: 8 },
];

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center rounded-pill border px-3.5 py-2 ${
        selected ? 'border-primary bg-primary' : 'border-line bg-paper'
      }`}
    >
      <Text className={`font-bold text-xs ${selected ? 'text-primary-text' : 'text-ink'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function ProposalCard({ proposal }: { proposal: LunchProposalDto }) {
  const join = useJoinLunch();
  const leave = useLeaveLunch();
  const cancel = useCancelLunch();
  const [error, setError] = useState<string | null>(null);

  const pending = join.isPending || leave.isPending || cancel.isPending;
  const capReached =
    proposal.maxParticipants !== null &&
    proposal.participants.length >= proposal.maxParticipants;

  function run(action: Promise<unknown>) {
    setError(null);
    action.catch((e: unknown) =>
      setError(e instanceof Error ? e.message : 'Errore. Riprova.'),
    );
  }

  return (
    <View className="gap-3 rounded-md border border-line bg-paper p-4">
      <View className="flex-row items-start gap-3">
        <View className="size-11 items-center justify-center rounded-md bg-paper-alt">
          <Text className="text-xl">{proposal.restaurant.emoji ?? '🍽️'}</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-bold text-base text-ink">{proposal.restaurant.name}</Text>
          <Text className="text-xs text-ink-muted">
            {proposal.restaurant.priceRange}
            {proposal.restaurant.ratingCount > 0
              ? ` · ★ ${proposal.restaurant.ratingAvg}`
              : ''}
            {proposal.restaurant.distanceM ? ` · ${proposal.restaurant.distanceM}m` : ''}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text className="font-bold text-lg text-ink">{proposal.meetingTime}</Text>
          {proposal.visibility === 'private' ? (
            <View className="rounded-pill bg-paper-alt px-2 py-0.5">
              <Text className="text-[10px] font-bold text-ink-secondary">privata</Text>
            </View>
          ) : null}
        </View>
      </View>

      {proposal.note ? (
        <Text className="text-sm text-ink-secondary">{proposal.note}</Text>
      ) : null}

      <View className="flex-row items-center gap-2">
        <View className="flex-row">
          {proposal.participants.slice(0, 5).map((p, i) => (
            <View
              key={p.userId}
              className="size-8 items-center justify-center rounded-pill border-2 border-paper bg-primary-subtle"
              style={{ marginLeft: i === 0 ? 0 : -8 }}
            >
              <Text className="font-bold text-[10px] text-primary-text">{p.initials}</Text>
            </View>
          ))}
        </View>
        <Text className="text-xs text-ink-muted">
          {proposal.participants.length}
          {proposal.maxParticipants ? `/${proposal.maxParticipants}` : ''} partecipanti · di{' '}
          {proposal.createdBy.displayName}
        </Text>
      </View>

      {proposal.iAmCreator ? (
        <Pressable
          disabled={pending}
          onPress={() => run(cancel.mutateAsync(proposal.id))}
          className="items-center rounded-sm border border-danger bg-paper px-4 py-2.5 active:bg-danger-subtle disabled:opacity-50"
        >
          <Text className="font-bold text-xs text-danger">Cancella proposta</Text>
        </Pressable>
      ) : proposal.iAmParticipant ? (
        <Pressable
          disabled={pending}
          onPress={() => run(leave.mutateAsync(proposal.id))}
          className="items-center rounded-sm border border-line-strong bg-paper px-4 py-2.5 active:bg-paper-alt disabled:opacity-50"
        >
          <Text className="font-bold text-xs text-ink">Lascia il pranzo</Text>
        </Pressable>
      ) : (
        <Pressable
          disabled={pending || capReached}
          onPress={() => run(join.mutateAsync(proposal.id))}
          className="items-center rounded-sm bg-primary px-4 py-2.5 active:bg-primary-active disabled:opacity-50"
        >
          <Text className="font-bold text-xs text-primary-text">
            {capReached ? 'Posti esauriti' : 'Partecipa'}
          </Text>
        </Pressable>
      )}

      {error ? (
        <View className="rounded-sm border border-danger bg-danger-subtle p-2">
          <Text className="text-xs text-danger">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CreateProposalPanel({ onCreated }: { onCreated: () => void }) {
  const { data, isPending } = useRestaurants();
  const create = useCreateLunchProposal();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [time, setTime] = useState('13:00');
  const [cap, setCap] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    if (!restaurantId) return;
    setError(null);
    create.mutate(
      {
        restaurantId,
        date: todayIso(),
        meetingTime: time,
        visibility: 'public',
        maxParticipants: cap,
      },
      {
        onSuccess: onCreated,
        onError: (e) =>
          setError(e instanceof Error ? e.message : 'Errore nella creazione.'),
      },
    );
  }

  return (
    <View className="gap-4 rounded-md border border-primary bg-paper p-4">
      <Text className="font-bold text-base text-ink">Nuova proposta · oggi</Text>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-ink">Ristorante</Text>
        {isPending ? (
          <ActivityIndicator size="small" color="#E8B931" />
        ) : (data?.restaurants.length ?? 0) === 0 ? (
          <Text className="text-sm text-ink-muted">
            Nessun ristorante in lista — aggiungine uno dal web.
          </Text>
        ) : (
          <View className="gap-1.5">
            {data!.restaurants.map((r) => {
              const selected = restaurantId === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setRestaurantId(r.id)}
                  className={`flex-row items-center gap-3 rounded-sm border p-3 ${
                    selected ? 'border-primary bg-primary-subtle' : 'border-line bg-paper'
                  }`}
                >
                  <Text className="text-lg">{r.emoji ?? '🍽️'}</Text>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-ink">{r.name}</Text>
                    <Text className="text-xs text-ink-muted">
                      {r.priceRange}
                      {r.ratingCount > 0 ? ` · ★ ${r.ratingAvg}` : ''}
                    </Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={20} color="#D4A625" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-ink">Orario</Text>
        <View className="flex-row gap-2">
          {TIME_PRESETS.map((t) => (
            <Chip key={t} label={t} selected={time === t} onPress={() => setTime(t)} />
          ))}
        </View>
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-ink">Posti max</Text>
        <View className="flex-row gap-2">
          {CAP_PRESETS.map((c) => (
            <Chip
              key={c.label}
              label={c.label}
              selected={cap === c.value}
              onPress={() => setCap(c.value)}
            />
          ))}
        </View>
      </View>

      {error ? (
        <View className="rounded-sm border border-danger bg-danger-subtle p-2">
          <Text className="text-xs text-danger">{error}</Text>
        </View>
      ) : null}

      <Pressable
        disabled={!restaurantId || create.isPending}
        onPress={handleCreate}
        className="flex-row items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 active:bg-primary-active disabled:opacity-40"
      >
        {create.isPending ? <ActivityIndicator size="small" color="#2B1F00" /> : null}
        <Text className="font-bold text-sm text-primary-text">
          {create.isPending ? 'Creazione…' : 'Proponi pranzo'}
        </Text>
      </Pressable>
    </View>
  );
}

/** Tab Pranzo — proposte di oggi, partecipa/lascia, nuova proposta. */
export default function LunchScreen() {
  const { data, isPending, isError, error, refetch } = useLunchProposals();
  const [creating, setCreating] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-6">
        <View className="flex-row items-end justify-between">
          <View className="gap-1">
            <Text className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-muted">
              Pausa pranzo · oggi
            </Text>
            <Text className="font-bold text-3xl text-ink">Pranzo.</Text>
          </View>
          <Pressable
            onPress={() => setCreating((v) => !v)}
            className={`size-10 items-center justify-center rounded-sm ${
              creating ? 'bg-paper-alt' : 'bg-primary'
            }`}
          >
            <Ionicons
              name={creating ? 'close' : 'add'}
              size={22}
              color={creating ? '#0E0F0C' : '#2B1F00'}
            />
          </Pressable>
        </View>

        {creating ? <CreateProposalPanel onCreated={() => setCreating(false)} /> : null}

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
        ) : data.proposals.length === 0 ? (
          <View className="items-center gap-2 rounded-md border border-dashed border-line-strong bg-paper-alt p-6">
            <Text className="text-2xl">🥗</Text>
            <Text className="text-center text-sm text-ink-muted">
              Nessuna proposta per oggi. Sii la prima persona a proporne una!
            </Text>
          </View>
        ) : (
          data.proposals.map((p) => <ProposalCard key={p.id} proposal={p} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
