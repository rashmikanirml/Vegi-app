import { useQuery } from '@tanstack/react-query';
import { Text } from 'react-native';

import { Card, EmptyState, Muted, Screen, Title } from '@/components/ui';
import { fetchOrdersForSeller } from '@/lib/api/orders';
import { useAuth } from '@/lib/auth';
import { money } from '@/lib/format';

export default function EarningsScreen() {
  const { profile } = useAuth();
  const query = useQuery({
    queryKey: ['orders', 'seller', profile?.id],
    queryFn: () => fetchOrdersForSeller(profile!.id),
    enabled: Boolean(profile?.id),
  });

  const completed = (query.data ?? []).filter((order) => order.status === 'completed');
  const released = completed.reduce((sum, order) => {
    const payment = order.payment;
    const net = Number(payment?.amount ?? order.total) - Number(payment?.platform_fee ?? 0);
    return sum + net;
  }, 0);
  const pending = (query.data ?? [])
    .filter((order) => ['pending', 'accepted', 'ready'].includes(order.status))
    .reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <Screen style={{ gap: 12 }}>
      <Title>Earnings</Title>
      <Card>
        <Muted>Released cash-on-pickup totals</Muted>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#1F7A3A' }}>{money(released)}</Text>
        <Muted>Open orders {money(pending)}</Muted>
      </Card>
      {completed.length === 0 ? (
        <EmptyState title="No completed sales yet" body="Totals appear after a buyer confirms receipt." />
      ) : (
        completed.map((order) => (
          <Card key={order.id}>
            <Text style={{ fontWeight: '700' }}>{order.listing?.name}</Text>
            <Muted>{money(order.total)} · cash</Muted>
          </Card>
        ))
      )}
    </Screen>
  );
}
