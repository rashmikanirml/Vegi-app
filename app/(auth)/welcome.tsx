import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';

import { Banner, Button, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function WelcomeScreen() {
  const { configured } = useAuth();

  return (
    <Screen style={{ justifyContent: 'center', gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Image source={require('../../assets/images/logo.png')} style={{ width: 180, height: 180 }} />
        <Title>Veggie Marketplace</Title>
        <Text style={{ textAlign: 'center', color: '#5E7263', lineHeight: 22 }}>
          Farmers list fresh vegetables. Buyers order and pay the farmer in cash on pickup.
        </Text>
      </View>
      {!configured ? (
        <Banner>
          Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to a .env file, then restart Expo.
        </Banner>
      ) : null}
      <Button title="Create an account" onPress={() => router.push('/(auth)/register')} />
      <Button title="I already have an account" variant="secondary" onPress={() => router.push('/(auth)/login')} />
    </Screen>
  );
}
