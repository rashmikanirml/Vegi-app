import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, ErrorText, Muted, Screen, StatusBadge, Title } from '@/components/ui';
import { fetchOrder, updateOrderStatus } from '@/lib/api/orders';
import { errorMessage, formatDate, kg, money } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

export default function SellerOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrder(id),
    enabled: Boolean(id),
  });
  const order = query.data;

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
    onError: (err) => setError(errorMessage(err)),
  });

  if (!order) {
    return (
      <Screen>
        <Muted>Loading order…</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
        <Title>{order.listing?.name ?? 'Order'}</Title>
        <StatusBadge status={order.status} />
        <Card>
          <Text>
            {kg(order.quantity_kg)} at {money(order.unit_price)} = {money(order.total)}
          </Text>
          <Muted>{formatDate(order.created_at)}</Muted>
        </Card>
        <Card>
          <Text style={{ fontWeight: '700' }}>{order.buyer?.full_name}</Text>
          <Muted>{order.buyer?.phone}</Muted>
          <Muted>{order.buyer?.address}</Muted>
        </Card>
        <ErrorText message={error} />
        {order.status === 'pending' ? (
          <View style={{ gap: 8 }}>
            <Button title="Accept order" onPress={() => mutation.mutate('accepted')} loading={mutation.isPending} />
            <Button title="Reject order" variant="danger" onPress={() => mutation.mutate('rejected')} />
          </View>
        ) : null}
        {order.status === 'accepted' ? (
          <Button title="Mark ready for pickup" onPress={() => mutation.mutate('ready')} loading={mutation.isPending} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
