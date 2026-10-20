import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text } from 'react-native';

import { Button, Card, EmptyState, Muted, Screen, StatusBadge, Title } from '@/components/ui';
import { fetchAllOrders, updateOrderStatus } from '@/lib/api/orders';
import { formatDate, kg, money } from '@/lib/format';

export default function AdminOrdersScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'orders'], queryFn: fetchAllOrders });
  const refund = useMutation({
    mutationFn: (id: string) => updateOrderStatus(id, 'refunded'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <Title>Orders and payments</Title>
        {(query.data ?? []).length === 0 ? (
          <EmptyState title="No orders" body="Marketplace orders and cash payment status appear here." />
        ) : (
          (query.data ?? []).map((order) => (
            <Card key={order.id}>
              <Text style={{ fontWeight: '800' }}>{order.listing?.name}</Text>
              <Muted>
                Buyer {order.buyer?.full_name} · Seller {order.seller?.farm_name || order.seller?.full_name}
              </Muted>
              <Muted>
                {kg(order.quantity_kg)} · {money(order.total)} · {formatDate(order.created_at)}
              </Muted>
              <StatusBadge status={order.status} />
              {order.payment ? <Muted>Payment {order.payment.method}: {order.payment.status}</Muted> : null}
              {order.status !== 'refunded' && order.status !== 'cancelled' && order.status !== 'rejected' ? (
                <Button title="Mark refunded" variant="danger" onPress={() => refund.mutate(order.id)} />
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
