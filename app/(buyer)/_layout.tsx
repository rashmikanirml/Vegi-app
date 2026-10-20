import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { RoleGate } from '@/components/RoleGate';
import { TabIcon } from '@/components/TabIcon';
import { Banner } from '@/components/ui';
import { useRealtimeOrders } from '@/components/useRealtimeOrders';
import { useAuth } from '@/lib/auth';

export default function BuyerLayout() {
  const { session } = useAuth();
  const { notice, clearNotice } = useRealtimeOrders(session?.user.id);

  return (
    <RoleGate role="buyer">
      <View style={{ flex: 1 }}>
      {notice ? (
        <Banner>
          {notice} Tap to dismiss.
        </Banner>
      ) : null}
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
            title: 'Marketplace',
            tabBarIcon: ({ color, size }) => <TabIcon name="leaf" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'My orders',
            tabBarIcon: ({ color, size }) => <TabIcon name="receipt" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <TabIcon name="person" color={color} size={size} />,
          }}
        />
        <Tabs.Screen name="listing/[id]" options={{ href: null, title: 'Listing' }} />
        <Tabs.Screen name="checkout/[id]" options={{ href: null, title: 'Checkout' }} />
        <Tabs.Screen name="order/[id]" options={{ href: null, title: 'Order' }} />
      </Tabs>
      </View>
    </RoleGate>
  );
}
