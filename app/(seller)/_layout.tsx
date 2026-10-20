import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { RoleGate } from '@/components/RoleGate';
import { TabIcon } from '@/components/TabIcon';
import { Banner } from '@/components/ui';
import { useRealtimeOrders } from '@/components/useRealtimeOrders';
import { useAuth } from '@/lib/auth';

export default function SellerLayout() {
  const { session, profile } = useAuth();
  const { notice, clearNotice } = useRealtimeOrders(session?.user.id);

  return (
    <RoleGate role="seller">
      <View style={{ flex: 1 }}>
      {!profile?.approved ? (
        <Banner>Your farm is waiting for admin approval. You can prepare a profile, but listings cannot go live yet.</Banner>
      ) : null}
      {notice ? <Banner>{notice}</Banner> : null}
      <Tabs
        screenListeners={{ tabPress: () => clearNotice() }}
        screenOptions={{
          tabBarActiveTintColor: '#1F7A3A',
          headerTintColor: '#1F7A3A',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'My listings',
            tabBarIcon: ({ color, size }) => <TabIcon name="storefront" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => <TabIcon name="notifications" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: 'Earnings',
            tabBarIcon: ({ color, size }) => <TabIcon name="wallet" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <TabIcon name="person" color={color} size={size} />,
          }}
        />
        <Tabs.Screen name="listing/new" options={{ href: null, title: 'New listing' }} />
        <Tabs.Screen name="listing/[id]" options={{ href: null, title: 'Edit listing' }} />
        <Tabs.Screen name="order/[id]" options={{ href: null, title: 'Order' }} />
      </Tabs>
      </View>
    </RoleGate>
  );
}
