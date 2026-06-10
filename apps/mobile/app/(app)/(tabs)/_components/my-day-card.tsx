import { FLOOR_META, type Floor, type PresenceStatus } from '@desko/domain';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import {
  useDeclarePresence,
  useLeaveOffice,
  useUpdateFloor,
} from './use-presence-today';

const FLOORS: Floor[] = ['seventh_floor', 'second_floor'];

function ActionButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={
        variant === 'primary'
          ? 'flex-1 items-center rounded-sm bg-primary px-3 py-3 active:bg-primary-active disabled:opacity-50'
          : 'flex-1 items-center rounded-sm border border-line-strong bg-paper px-3 py-3 active:bg-paper-alt disabled:opacity-50'
      }
    >
      <Text
        className={
          variant === 'primary'
            ? 'text-center font-bold text-sm text-primary-text'
            : 'text-center font-bold text-sm text-ink'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Card "La mia giornata" — il core di US-1 su mobile:
 * dichiara in ufficio (con piano), da remoto, cambia piano, esci.
 */
export function MyDayCard({
  status,
  floor,
}: {
  status: PresenceStatus;
  floor: Floor | null;
}) {
  const declare = useDeclarePresence();
  const leave = useLeaveOffice();
  const updateFloor = useUpdateFloor();
  const [error, setError] = useState<string | null>(null);

  const pending = declare.isPending || leave.isPending || updateFloor.isPending;

  function run(action: Promise<unknown>) {
    setError(null);
    action.catch((e: unknown) =>
      setError(e instanceof Error ? e.message : 'Errore. Riprova.'),
    );
  }

  const otherFloor: Floor = floor === 'seventh_floor' ? 'second_floor' : 'seventh_floor';

  return (
    <View className="gap-3 rounded-md border border-line bg-paper p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold text-base text-ink">La mia giornata</Text>
        {pending ? <ActivityIndicator size="small" color="#E8B931" /> : null}
      </View>

      {status === 'in_office' ? (
        <>
          <View className="flex-row items-center gap-2">
            <View className="rounded-pill bg-primary-subtle px-3 py-1">
              <Text className="font-bold text-xs text-primary-text">
                In ufficio{floor ? ` · ${FLOOR_META[floor].shortLabel}` : ''}
              </Text>
            </View>
            {floor ? (
              <Text className="text-xs text-ink-muted">{FLOOR_META[floor].label}</Text>
            ) : (
              <Text className="text-xs text-ink-muted">piano non indicato</Text>
            )}
          </View>
          <View className="flex-row gap-2">
            <ActionButton
              label={`Sposta al ${FLOOR_META[otherFloor].shortLabel}`}
              variant="outline"
              disabled={pending}
              onPress={() => run(updateFloor.mutateAsync(otherFloor))}
            />
            <ActionButton
              label="Esci dall'ufficio"
              variant="outline"
              disabled={pending}
              onPress={() => run(leave.mutateAsync())}
            />
          </View>
        </>
      ) : (
        <>
          <Text className="text-sm text-ink-secondary">
            {status === 'remote'
              ? 'Oggi lavori da remoto. Cambiato idea?'
              : 'Dove lavori oggi?'}
          </Text>
          <View className="flex-row gap-2">
            {FLOORS.map((f) => (
              <ActionButton
                key={f}
                label={`Ufficio · ${FLOOR_META[f].shortLabel}`}
                disabled={pending}
                onPress={() => run(declare.mutateAsync({ status: 'in_office', floor: f }))}
              />
            ))}
          </View>
          {status !== 'remote' ? (
            <ActionButton
              label="Da remoto"
              variant="outline"
              disabled={pending}
              onPress={() => run(declare.mutateAsync({ status: 'remote' }))}
            />
          ) : null}
        </>
      )}

      {error ? (
        <View className="rounded-sm border border-danger bg-danger-subtle p-2">
          <Text className="text-xs text-danger">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
