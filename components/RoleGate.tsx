import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { type PropsWithChildren } from 'react';

import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

export function RoleGate({ role, children }: PropsWithChildren<{ role: UserRole }>) {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#1F7A3A" />
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (profile && profile.role !== role) return <Redirect href="/" />;
  return <>{children}</>;
}
