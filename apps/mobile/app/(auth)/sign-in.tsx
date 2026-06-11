import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signIn } from '@/lib/auth-client';

/**
 * Sign-in email+password contro il backend condiviso better-auth.
 * Microsoft Entra ID arriverà quando le credenziali Azure saranno attive
 * (richiede expo-web-browser, già installato).
 */
export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 8 && !pending;

  async function handleSignIn() {
    setError(null);
    setPending(true);
    try {
      const res = await signIn.email({ email: email.trim(), password });
      if (res.error) {
        setError(res.error.message ?? 'Credenziali non valide.');
        return;
      }
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore di rete. Riprova.');
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center gap-8 px-6">
          <View className="items-center gap-4">
            <View className="size-16 items-center justify-center rounded-md bg-primary">
              <Text className="font-bold text-2xl text-primary-text">D</Text>
            </View>
            <View className="items-center gap-1">
              <Text className="font-bold text-3xl text-ink">Desko</Text>
              <Text className="text-center text-base text-ink-secondary">
                Sai chi sarà in ufficio quando ci sarai tu.
              </Text>
            </View>
          </View>

          {error ? (
            <View className="rounded-sm border border-danger bg-danger-subtle p-3">
              <Text className="text-sm text-danger">{error}</Text>
            </View>
          ) : null}

          <View className="gap-4">
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-ink">Email aziendale</Text>
              <TextInput
                className="rounded-sm border border-line bg-paper px-4 py-3 text-base text-ink"
                placeholder="tu@azienda.it"
                placeholderTextColor="#868685"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-ink">Password</Text>
              <TextInput
                className="rounded-sm border border-line bg-paper px-4 py-3 text-base text-ink"
                placeholder="••••••••"
                placeholderTextColor="#868685"
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => canSubmit && handleSignIn()}
              />
            </View>
          </View>

          <View className="gap-4">
            <Pressable
              disabled={!canSubmit}
              onPress={handleSignIn}
              className="w-full flex-row items-center justify-center gap-2 rounded-sm bg-primary px-6 py-4 active:bg-primary-active disabled:opacity-50"
            >
              {pending ? <ActivityIndicator size="small" color="#2B1F00" /> : null}
              <Text className="font-bold text-base text-primary-text">
                {pending ? 'Accesso…' : 'Accedi'}
              </Text>
            </Pressable>

            {/* Recovery e signup restano sul web: il flow email→link torna
                comunque sul browser, duplicarlo in-app non aggiunge nulla. */}
            <Pressable
              onPress={() =>
                void WebBrowser.openBrowserAsync(
                  `${process.env.EXPO_PUBLIC_API_URL ?? ''}/forgot-password`,
                )
              }
              className="items-center py-1"
            >
              <Text className="text-sm font-semibold text-ink-secondary underline">
                Password dimenticata?
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
