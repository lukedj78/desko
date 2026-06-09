import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="font-bold text-2xl text-ink">Impostazioni</Text>
        <Text className="text-center text-base text-ink-secondary">
          Profilo, privacy e pattern settimanale in arrivo.
        </Text>
      </View>
    </SafeAreaView>
  );
}
