import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, Text } from 'react-native';

import { Card, EmptyState, Muted, Screen, StatusBadge } from '@/components/ui';
import { fetchOrdersForSeller } from '@/lib/api/orders';
import { useAuth } from '@/lib/auth';
import { formatDate, kg, money } from '@/lib/format';

export default function SellerOrdersScreen() {
  const { profile } = useAuth();
  const query = useQuery({
    queryKey: ['orders', 'seller', profile?.id],
    queryFn: () => fetchOrdersForSeller(profile!.id),
    enabled: Boolean(profile?.id),
  });

  return (
    <Screen>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState title="No incoming orders" body="New buyer orders will show up here." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(seller)/order/${item.id}`)}>
            <Card>
              <Text style={{ fontWeight: '800' }}>{item.listing?.name ?? 'Order'}</Text>
              <Muted>
                {item.buyer?.full_name} · {kg(item.quantity_kg)} · {money(item.total)} · {formatDate(item.created_at)}
              </Muted>
              <StatusBadge status={item.status} />
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
