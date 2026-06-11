import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSession } from '@/lib/auth-client';
import { usePushRegistration } from '@/lib/push';

/**
 * AuthGuard del gruppo (app): sessione better-auth letta dal client Expo
 * (SecureStore). Senza sessione → redirect a /sign-in.
 * A sessione valida registra il push token del device (una volta).
 */
export default function AppLayout() {
  const { data: session, isPending } = useSession();
  usePushRegistration(!!session);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color="#E8B931" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
