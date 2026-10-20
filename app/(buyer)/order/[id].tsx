import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, Text } from 'react-native';

import { Button, Card, ErrorText, Muted, Screen, StatusBadge, Title } from '@/components/ui';
import { fetchOrder, updateOrderStatus } from '@/lib/api/orders';
import { errorMessage, formatDate, kg, money } from '@/lib/format';
import { useState } from 'react';

export default function BuyerOrderDetailScreen() {
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
    mutationFn: (status: 'cancelled' | 'completed') => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Updated', 'Order status saved.');
    },
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
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <Title>{order.listing?.name ?? 'Order'}</Title>
        <StatusBadge status={order.status} />
        <Card>
          <Text>
            {kg(order.quantity_kg)} at {money(order.unit_price)} = {money(order.total)}
          </Text>
          <Muted>Placed {formatDate(order.created_at)}</Muted>
          <Muted>Pay cash on pickup · {order.payment?.method ?? 'cash'}</Muted>
          {order.payment ? <Muted>Payment: {order.payment.status}</Muted> : null}
        </Card>
        <Card>
          <Text style={{ fontWeight: '700' }}>{order.seller?.farm_name || order.seller?.full_name}</Text>
          <Muted>{order.seller?.phone}</Muted>
          <Muted>{order.seller?.address}</Muted>
        </Card>
        <ErrorText message={error} />
        {order.status === 'pending' ? (
          <Button title="Cancel order" variant="danger" onPress={() => mutation.mutate('cancelled')} />
        ) : null}
        {order.status === 'ready' ? (
          <Button title="Confirm receipt" onPress={() => mutation.mutate('completed')} loading={mutation.isPending} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
