import { Stack } from 'expo-router';

/**
 * Layout del gruppo (app) — qui vivrà l'AuthGuard:
 * quando `rn-module-add auth` cabla better-auth, questo layout legge la
 * sessione e fa <Redirect href="/sign-in" /> se assente.
 */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
