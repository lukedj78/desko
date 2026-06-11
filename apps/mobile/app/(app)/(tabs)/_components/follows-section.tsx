import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import {
  searchUsers,
  useFollows,
  useFollowUser,
  useUnfollowUser,
  type UserSearchResultDto,
} from './use-follows';

/**
 * Sezione "Colleghi che segui" (US-3) per la tab Impostazioni:
 * ricerca + segui, lista con rimozione. Max 50 (enforced dal servizio).
 */
export function FollowsSection() {
  const { data, isPending } = useFollows();
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResultDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const followedIds = new Set((data?.follows ?? []).map((f) => f.userId));
  const mutating = follow.isPending || unfollow.isPending;

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        setResults(await searchUsers(value));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }

  function run(action: Promise<unknown>) {
    setError(null);
    action.catch((e: unknown) =>
      setError(e instanceof Error ? e.message : 'Errore. Riprova.'),
    );
  }

  return (
    <View className="gap-3 rounded-md border border-line bg-paper p-4">
      <View className="gap-0.5">
        <Text className="font-bold text-base text-ink">Colleghi che segui</Text>
        <Text className="text-xs text-ink-muted">
          Filtra calendario e presenze sulle persone che ti interessano. Max 50.
        </Text>
      </View>

      <TextInput
        className="rounded-sm border border-line bg-paper px-4 py-3 text-base text-ink"
        placeholder="Cerca per nome o email…"
        placeholderTextColor="#868685"
        autoCapitalize="none"
        value={query}
        onChangeText={handleQueryChange}
      />

      {searching ? (
        <ActivityIndicator size="small" color="#E8B931" />
      ) : (
        results.length > 0 && (
          <View className="gap-1.5">
            {results.map((u) => {
              const already = followedIds.has(u.userId);
              return (
                <View
                  key={u.userId}
                  className="flex-row items-center gap-3 rounded-sm border border-line bg-paper-alt p-3"
                >
                  <View className="size-8 items-center justify-center rounded-pill border border-primary bg-primary-subtle">
                    <Text className="font-bold text-[11px] text-primary-text">{u.initials}</Text>
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-ink">{u.displayName}</Text>
                    <Text className="text-xs text-ink-muted">
                      {u.email}
                      {u.team ? ` · ${u.team}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    disabled={already || mutating}
                    onPress={() => run(follow.mutateAsync(u.userId))}
                    className={`items-center rounded-sm px-3 py-2 ${
                      already ? 'bg-paper' : 'bg-primary active:bg-primary-active'
                    } disabled:opacity-50`}
                  >
                    <Text
                      className={`font-bold text-xs ${already ? 'text-ink-muted' : 'text-primary-text'}`}
                    >
                      {already ? 'Seguito' : 'Segui'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )
      )}

      {error ? (
        <View className="rounded-sm border border-danger bg-danger-subtle p-2">
          <Text className="text-xs text-danger">{error}</Text>
        </View>
      ) : null}

      {isPending ? (
        <ActivityIndicator size="small" color="#E8B931" />
      ) : (data?.follows.length ?? 0) === 0 ? (
        <Text className="rounded-sm border border-dashed border-line-strong bg-paper-alt p-3 text-sm text-ink-muted">
          Non segui ancora nessuno. Cerca un collega qui sopra.
        </Text>
      ) : (
        <View className="gap-1.5">
          {data!.follows.map((f) => (
            <View key={f.userId} className="flex-row items-center gap-3 py-1">
              <View className="size-8 items-center justify-center rounded-pill border border-primary bg-primary-subtle">
                <Text className="font-bold text-[11px] text-primary-text">{f.initials}</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-semibold text-ink">{f.displayName}</Text>
                {f.team ? <Text className="text-xs text-ink-muted">{f.team}</Text> : null}
              </View>
              <Pressable
                disabled={mutating}
                onPress={() => run(unfollow.mutateAsync(f.userId))}
                className="size-9 items-center justify-center rounded-sm active:bg-danger-subtle disabled:opacity-50"
              >
                <Ionicons name="person-remove-outline" size={16} color="#C73E44" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
