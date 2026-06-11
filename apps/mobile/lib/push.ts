import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { api } from './api';

/**
 * Registrazione push token Expo → backend (/api/push/register).
 *
 * Graceful per design: in sviluppo senza EAS projectId
 * `getExpoPushTokenAsync` fallisce — logghiamo e proseguiamo, l'app
 * funziona senza push. Diventa effettiva con la prima dev build EAS.
 */

// Foreground: mostra banner anche con app aperta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPush(): Promise<void> {
  if (!Device.isDevice) {
    // Simulatore: niente push token
    return;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Desko',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  await api.post('/api/push/register', {
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });
}

/**
 * Hook da montare UNA volta nel layout autenticato: registra il token
 * alla prima sessione valida. useEffect legittimo: sincronizzazione con
 * un sistema esterno (permessi OS + backend), non derivazione di stato.
 */
export function usePushRegistration(enabled: boolean) {
  const done = useRef(false);

  useEffect(() => {
    if (!enabled || done.current) return;
    done.current = true;
    registerForPush().catch((e: unknown) => {
      // Tipico in dev senza EAS projectId — non bloccare l'app
      console.warn('[push] registrazione saltata:', e instanceof Error ? e.message : e);
    });
  }, [enabled]);
}
