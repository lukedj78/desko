import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut, useSession } from '@/lib/auth-client';

/**
 * Impostazioni — per ora: profilo della sessione + sign-out.
 * Privacy GDPR e pattern settimanale arriveranno via /api dedicate
 * (stesse server actions del web).
 */
export default function SettingsScreen() {
  const { data: session } = useSession();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await signOut();
      // Il guard in (app)/_layout reagisce alla sessione svuotata → /sign-in
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 gap-6 px-5 pt-6">
        <View className="gap-1">
          <Text className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Profilo
          </Text>
          <Text className="font-bold text-3xl text-ink">Impostazioni.</Text>
        </View>

        {session ? (
          <View className="gap-3 rounded-md border border-line bg-paper p-4">
            <View className="flex-row items-center gap-3">
              <View className="size-12 items-center justify-center rounded-pill border border-primary bg-primary-subtle">
                <Text className="font-bold text-sm text-primary-text">
                  {session.user.name
                    .split(/\s+/)
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </Text>
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-bold text-base text-ink">{session.user.name}</Text>
                <Text className="text-sm text-ink-muted">{session.user.email}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View className="rounded-md border border-dashed border-line-strong bg-paper-alt p-4">
          <Text className="text-sm text-ink-muted">
            Visibilità presenze, pattern settimanale e notifiche arriveranno qui
            (stesse server actions del web, via API).
          </Text>
        </View>

        <Pressable
          onPress={handleSignOut}
          disabled={pending}
          className="flex-row items-center justify-center gap-2 rounded-sm border border-danger bg-paper px-6 py-4 active:bg-danger-subtle disabled:opacity-50"
        >
          {pending ? <ActivityIndicator size="small" color="#C73E44" /> : null}
          <Text className="font-bold text-base text-danger">Esci</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
