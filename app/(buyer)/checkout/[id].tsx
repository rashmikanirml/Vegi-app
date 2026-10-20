import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';

import { Button, Card, ErrorText, Muted, Screen, Title } from '@/components/ui';
import { fetchListing } from '@/lib/api/listings';
import { createOrder } from '@/lib/api/orders';
import { errorMessage, kg, money } from '@/lib/format';

export default function CheckoutScreen() {
  const { id, qty } = useLocalSearchParams<{ id: string; qty?: string }>();
  const quantity = Number(qty ?? 1);
  const queryClient = useQueryClient();
  const listingQuery = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id),
    enabled: Boolean(id),
  });
  const listing = listingQuery.data;
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createOrder(id, quantity),
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      Alert.alert('Order placed', 'The farmer will accept or reject this cash-on-pickup order.');
      router.replace(`/(buyer)/order/${orderId}`);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  if (!listing) {
    return (
      <Screen>
        <Muted>Loading checkout…</Muted>
      </Screen>
    );
  }

  const total = quantity * Number(listing.price_per_kg);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <Title>Cash on pickup</Title>
        <Card>
          <Text style={{ fontWeight: '800' }}>{listing.name}</Text>
          <Muted>
            {kg(quantity)} × {money(listing.price_per_kg)}
          </Muted>
          <Text style={{ fontWeight: '800' }}>Total {money(total)}</Text>
          <Muted>
            Pay the farmer in person. The app records the order; money is marked released when you confirm receipt.
          </Muted>
        </Card>
        <ErrorText message={error} />
        <Button title="Place order" onPress={() => mutation.mutate()} loading={mutation.isPending} />
      </ScrollView>
    </Screen>
  );
}
