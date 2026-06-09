import { FLOOR_META } from '@desko/domain';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Tab "Oggi" — placeholder che dimostra: NativeWind + token Desko +
 * riuso di @desko/domain dal monorepo. I dati reali arrivano via API
 * (rn-data-fetching) quando il backend mobile sarà cablato.
 */
export default function TodayScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 gap-6 px-5 pt-6">
        <View className="gap-1">
          <Text className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-muted">
            In ufficio · oggi
          </Text>
          <Text className="font-bold text-3xl text-ink">
            Chi c'è oggi.
          </Text>
        </View>

        <View className="gap-3">
          {(Object.keys(FLOOR_META) as Array<keyof typeof FLOOR_META>).map(
            (floor) => (
              <View
                key={floor}
                className="flex-row items-center justify-between rounded-md border border-line bg-paper p-4"
              >
                <View className="gap-0.5">
                  <Text className="font-bold text-base text-ink">
                    {FLOOR_META[floor].label}
                  </Text>
                  <Text className="text-sm text-ink-secondary">
                    {FLOOR_META[floor].description}
                  </Text>
                </View>
                <View className="rounded-pill bg-primary-subtle px-3 py-1">
                  <Text className="font-bold text-xs text-primary-text">—</Text>
                </View>
              </View>
            ),
          )}
        </View>

        <View className="rounded-md border border-dashed border-line-strong bg-paper-alt p-4">
          <Text className="text-sm text-ink-muted">
            Scaffold rn-bootstrap · Expo SDK 56 · dati reali in arrivo con i
            prossimi moduli (auth, API presence).
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
