import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Sign-in placeholder — il flow reale (better-auth: email+password +
 * Microsoft Entra ID, stesso backend del web) arriva con
 * `rn-module-add auth`.
 */
export default function SignInScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <View className="size-16 items-center justify-center rounded-md bg-primary">
          <Text className="font-bold text-2xl text-primary-text">D</Text>
        </View>
        <View className="items-center gap-2">
          <Text className="font-bold text-3xl text-ink">Desko</Text>
          <Text className="text-center text-base text-ink-secondary">
            Sai chi sarà in ufficio quando ci sarai tu — in due tap.
          </Text>
        </View>
        <Link href="/" asChild>
          <Pressable className="w-full items-center rounded-sm bg-primary px-6 py-4 active:bg-primary-active">
            <Text className="font-bold text-base text-primary-text">
              Entra (placeholder)
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
