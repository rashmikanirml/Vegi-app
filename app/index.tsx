import { Redirect } from 'expo-router';
import { ActivityIndicator, Image, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth';

export default function Index() {
  const { loading, session, profile, configured } = useAuth();

  if (!configured) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F7A3A' }}>
        <Image source={require('../assets/images/logo.png')} style={{ width: 180, height: 180 }} />
        <ActivityIndicator color="#fff" style={{ marginTop: 16 }} />
        <Text style={{ color: '#fff', marginTop: 8 }}>Loading marketplace…</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (profile?.role === 'admin') {
    return <Redirect href="/(admin)" />;
  }
  if (profile?.role === 'seller') {
    return <Redirect href="/(seller)" />;
  }
  return <Redirect href="/(buyer)" />;
}
