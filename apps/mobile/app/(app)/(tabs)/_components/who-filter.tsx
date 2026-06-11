import { Pressable, Text, View } from 'react-native';

export type WhoFilterValue = 'all' | 'follows';

/** Segmented "Tutti | Chi seguo" (US-3) — UI pura, stato nel parent. */
export function WhoFilter({
  value,
  onChange,
}: {
  value: WhoFilterValue;
  onChange: (v: WhoFilterValue) => void;
}) {
  const options: Array<{ value: WhoFilterValue; label: string }> = [
    { value: 'all', label: 'Tutti' },
    { value: 'follows', label: 'Chi seguo' },
  ];
  return (
    <View className="flex-row overflow-hidden rounded-sm border border-line bg-paper">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 items-center px-3 py-2 ${selected ? 'bg-primary' : 'bg-paper'}`}
          >
            <Text
              className={`font-bold text-xs ${selected ? 'text-primary-text' : 'text-ink-secondary'}`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
