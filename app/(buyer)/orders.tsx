import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, Text } from 'react-native';

import { Card, EmptyState, Muted, Screen, StatusBadge } from '@/components/ui';
import { fetchOrdersForBuyer } from '@/lib/api/orders';
import { useAuth } from '@/lib/auth';
import { formatDate, kg, money } from '@/lib/format';

export default function BuyerOrdersScreen() {
  const { profile } = useAuth();
  const query = useQuery({
    queryKey: ['orders', 'buyer', profile?.id],
    queryFn: () => fetchOrdersForBuyer(profile!.id),
    enabled: Boolean(profile?.id),
  });

  return (
    <Screen>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState title="No orders yet" body="Browse the marketplace and pick a quantity." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(buyer)/order/${item.id}`)}>
            <Card>
              <Text style={{ fontWeight: '800' }}>{item.listing?.name ?? 'Vegetable order'}</Text>
              <Muted>
                {kg(item.quantity_kg)} · {money(item.total)} · {formatDate(item.created_at)}
              </Muted>
              <StatusBadge status={item.status} />
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
