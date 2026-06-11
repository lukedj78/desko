import { Ionicons } from '@expo/vector-icons';
import { FLOOR_META, type Floor } from '@desko/domain';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/lib/auth-client';

import {
  useArchivePresences,
  useSaveSettings,
  useSettings,
  type SettingsPayload,
  type Visibility,
} from './_components/use-settings';

const VISIBILITY_OPTIONS: Array<{ value: Visibility; label: string; hint: string }> = [
  { value: 'company', label: 'Tutti i colleghi', hint: 'Chiunque in azienda vede le tue presenze' },
  { value: 'team', label: 'Solo il mio team', hint: 'Visibile solo a chi ha il tuo stesso team' },
  { value: 'followers', label: 'Solo chi mi segue', hint: 'Visibile solo ai colleghi che ti seguono' },
  { value: 'hidden', label: 'Modalità incognito', hint: 'Nessuno vede le tue presenze' },
];

const DAYS: Array<{ key: keyof FormState['days']; label: string; short: string }> = [
  { key: 'monday', label: 'Lun', short: 'L' },
  { key: 'tuesday', label: 'Mar', short: 'M' },
  { key: 'wednesday', label: 'Mer', short: 'M' },
  { key: 'thursday', label: 'Gio', short: 'G' },
  { key: 'friday', label: 'Ven', short: 'V' },
];

type FormState = {
  visibility: Visibility;
  defaultFloor: Floor | null;
  days: Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday', boolean>;
};

function fromPayload(payload: SettingsPayload): FormState {
  return {
    visibility: payload.profile.visibility,
    defaultFloor: payload.pattern.defaultFloor,
    days: {
      monday: payload.pattern.monday === 'in_office',
      tuesday: payload.pattern.tuesday === 'in_office',
      wednesday: payload.pattern.wednesday === 'in_office',
      thursday: payload.pattern.thursday === 'in_office',
      friday: payload.pattern.friday === 'in_office',
    },
  };
}

function isDirty(a: FormState, b: FormState): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3 rounded-md border border-line bg-paper p-4">
      <Text className="font-bold text-base text-ink">{title}</Text>
      {children}
    </View>
  );
}

function SettingsForm({ initial, profile }: { initial: FormState; profile: SettingsPayload['profile'] }) {
  const [baseline, setBaseline] = useState(initial);
  const [form, setForm] = useState(initial);
  const [notice, setNotice] = useState<{ message: string; ok: boolean } | null>(null);

  const save = useSaveSettings();
  const archive = useArchivePresences();
  const [signOutPending, setSignOutPending] = useState(false);

  const dirty = isDirty(form, baseline);

  function handleSave() {
    setNotice(null);
    save.mutate(form, {
      onSuccess: (saved) => {
        setBaseline(saved);
        setNotice({ message: 'Impostazioni salvate.', ok: true });
      },
      onError: (e) =>
        setNotice({ message: e instanceof Error ? e.message : 'Errore nel salvataggio.', ok: false }),
    });
  }

  function handleArchive() {
    Alert.alert(
      'Cancellare lo storico presenze?',
      'Le presenze dei giorni passati verranno eliminate definitivamente (diritto all’oblio, GDPR). Oggi e futuro restano invariati. Operazione non reversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina storico',
          style: 'destructive',
          onPress: () => {
            setNotice(null);
            archive.mutate(undefined, {
              onSuccess: (res) =>
                setNotice({
                  message:
                    res.data.archivedCount > 0
                      ? `Eliminate ${res.data.archivedCount} presenze passate.`
                      : 'Nessuna presenza passata da eliminare.',
                  ok: true,
                }),
              onError: (e) =>
                setNotice({
                  message: e instanceof Error ? e.message : 'Errore nella cancellazione.',
                  ok: false,
                }),
            });
          },
        },
      ],
    );
  }

  async function handleSignOut() {
    setSignOutPending(true);
    try {
      await signOut();
    } finally {
      setSignOutPending(false);
    }
  }

  return (
    <View className="gap-5">
      {/* Profilo (read-only, da Entra/DB) */}
      <SectionCard title="Profilo">
        <View className="flex-row items-center gap-3">
          <View className="size-12 items-center justify-center rounded-pill border border-primary bg-primary-subtle">
            <Text className="font-bold text-sm text-primary-text">
              {profile.name
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-bold text-base text-ink">{profile.name}</Text>
            <Text className="text-sm text-ink-muted">{profile.email}</Text>
            {profile.team ? (
              <Text className="text-xs text-ink-muted">Team · {profile.team}</Text>
            ) : null}
          </View>
        </View>
      </SectionCard>

      {/* Visibilità presenze (US-5) */}
      <SectionCard title="Visibilità presenze">
        <View className="gap-1.5">
          {VISIBILITY_OPTIONS.map((opt) => {
            const selected = form.visibility === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setForm((f) => ({ ...f, visibility: opt.value }))}
                className={`flex-row items-center gap-3 rounded-sm border p-3 ${
                  selected ? 'border-primary bg-primary-subtle' : 'border-line bg-paper'
                }`}
              >
                <View
                  className={`size-5 items-center justify-center rounded-pill border-2 ${
                    selected ? 'border-primary-active' : 'border-line-strong'
                  }`}
                >
                  {selected ? <View className="size-2.5 rounded-pill bg-primary-active" /> : null}
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-ink">{opt.label}</Text>
                  <Text className="text-xs text-ink-muted">{opt.hint}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      {/* Giorni ricorrenti + piano preferito */}
      <SectionCard title="Giorni ricorrenti in ufficio">
        <View className="flex-row justify-between">
          {DAYS.map((d) => {
            const active = form.days[d.key];
            return (
              <View key={d.key} className="items-center gap-1">
                <Pressable
                  onPress={() =>
                    setForm((f) => ({ ...f, days: { ...f.days, [d.key]: !f.days[d.key] } }))
                  }
                  className={`size-11 items-center justify-center rounded-sm border ${
                    active ? 'border-primary bg-primary' : 'border-line bg-paper'
                  }`}
                >
                  <Text
                    className={`font-bold text-sm ${active ? 'text-primary-text' : 'text-ink'}`}
                  >
                    {d.short}
                  </Text>
                </Pressable>
                <Text className="text-[11px] text-ink-muted">{d.label}</Text>
              </View>
            );
          })}
        </View>

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-ink">Piano preferito</Text>
          <View className="flex-row gap-2">
            {(
              [
                { value: 'seventh_floor' as Floor, label: FLOOR_META.seventh_floor.shortLabel },
                { value: 'second_floor' as Floor, label: FLOOR_META.second_floor.shortLabel },
                { value: null, label: 'Nessuno' },
              ] as Array<{ value: Floor | null; label: string }>
            ).map((opt) => {
              const selected = form.defaultFloor === opt.value;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => setForm((f) => ({ ...f, defaultFloor: opt.value }))}
                  className={`flex-1 items-center rounded-sm border px-3 py-2.5 ${
                    selected ? 'border-primary bg-primary' : 'border-line bg-paper'
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${selected ? 'text-primary-text' : 'text-ink'}`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="text-xs text-ink-muted">Pre-selezionato quando dichiari presenza.</Text>
        </View>
      </SectionCard>

      {notice ? (
        <View
          className={`rounded-sm border p-3 ${
            notice.ok ? 'border-success bg-success-subtle' : 'border-danger bg-danger-subtle'
          }`}
        >
          <Text className={`text-sm ${notice.ok ? 'text-success' : 'text-danger'}`}>
            {notice.message}
          </Text>
        </View>
      ) : null}

      {/* Save bar — esplicito, dirty-gated (stessa semantica del web) */}
      <View className="flex-row items-center gap-3">
        <Pressable
          disabled={!dirty || save.isPending}
          onPress={() => {
            setForm(baseline);
            setNotice(null);
          }}
          className="items-center rounded-sm border border-line-strong bg-paper px-5 py-3.5 active:bg-paper-alt disabled:opacity-40"
        >
          <Text className="font-bold text-sm text-ink">Annulla</Text>
        </Pressable>
        <Pressable
          disabled={!dirty || save.isPending}
          onPress={handleSave}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3.5 active:bg-primary-active disabled:opacity-40"
        >
          {save.isPending ? <ActivityIndicator size="small" color="#2B1F00" /> : null}
          <Text className="font-bold text-sm text-primary-text">
            {save.isPending ? 'Salvataggio…' : dirty ? 'Salva modifiche' : 'Tutto salvato'}
          </Text>
        </Pressable>
      </View>

      {/* GDPR — diritto all'oblio */}
      <SectionCard title="Privacy">
        <Pressable
          disabled={archive.isPending}
          onPress={handleArchive}
          className="flex-row items-center gap-3 rounded-sm border border-dashed border-danger bg-paper p-3 active:bg-danger-subtle disabled:opacity-50"
        >
          <Ionicons name="trash-outline" size={18} color="#C73E44" />
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold text-ink">Cancella storico presenze</Text>
            <Text className="text-xs text-ink-muted">Diritto all'oblio (GDPR)</Text>
          </View>
          {archive.isPending ? <ActivityIndicator size="small" color="#C73E44" /> : null}
        </Pressable>
      </SectionCard>

      <Pressable
        onPress={handleSignOut}
        disabled={signOutPending}
        className="flex-row items-center justify-center gap-2 rounded-sm border border-danger bg-paper px-6 py-4 active:bg-danger-subtle disabled:opacity-50"
      >
        {signOutPending ? <ActivityIndicator size="small" color="#C73E44" /> : null}
        <Text className="font-bold text-base text-danger">Esci</Text>
      </Pressable>
    </View>
  );
}

/** Impostazioni — profilo, privacy GDPR e pattern settimanale, dati reali. */
export default function SettingsScreen() {
  const { data, isPending, isError, error, refetch } = useSettings();

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-6">
        <View className="gap-1">
          <Text className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Profilo · Privacy
          </Text>
          <Text className="font-bold text-3xl text-ink">Impostazioni.</Text>
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
          <SettingsForm initial={fromPayload(data)} profile={data.profile} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
