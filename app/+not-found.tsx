import { Link, Stack } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen style={{ justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>This screen does not exist.</Text>
        <Link href="/">
          <Text style={{ color: '#1F7A3A', fontWeight: '700' }}>Go home</Text>
        </Link>
      </Screen>
    </>
  );
}
