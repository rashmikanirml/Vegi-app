import { Tabs } from 'expo-router';

import { RoleGate } from '@/components/RoleGate';
import { TabIcon } from '@/components/TabIcon';

export default function AdminLayout() {
  return (
    <RoleGate role="admin">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#1F7A3A',
          headerTintColor: '#1F7A3A',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Approvals',
            tabBarIcon: ({ color, size }) => <TabIcon name="checkmark-circle" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="listings"
          options={{
            title: 'Listings',
            tabBarIcon: ({ color, size }) => <TabIcon name="leaf" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => <TabIcon name="receipt" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: 'Users',
            tabBarIcon: ({ color, size }) => <TabIcon name="people" color={color} size={size} />,
          }}
        />
      </Tabs>
    </RoleGate>
  );
}
