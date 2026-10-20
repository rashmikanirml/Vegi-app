import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Button, Card, EmptyState, Muted, Screen, StatusBadge } from '@/components/ui';
import { fetchMyListings } from '@/lib/api/listings';
import { useAuth } from '@/lib/auth';
import { kg, money } from '@/lib/format';

export default function SellerListingsScreen() {
  const { profile } = useAuth();
  const query = useQuery({
    queryKey: ['listings', 'mine', profile?.id],
    queryFn: () => fetchMyListings(profile!.id),
    enabled: Boolean(profile?.id),
  });

  return (
    <Screen>
      <Button
        title="Create listing"
        disabled={!profile?.approved}
        onPress={() => router.push('/(seller)/listing/new')}
      />
      <View style={{ height: 12 }} />
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState
            title="No listings yet"
            body="Publish a vegetable with quantity, price per kg, and a harvest date."
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(seller)/listing/${item.id}`)}>
            <Card>
              <Text style={{ fontWeight: '800', fontSize: 18 }}>{item.name}</Text>
              <Muted>
                {money(item.price_per_kg)} / kg · {kg(item.quantity_kg)}
              </Muted>
              <StatusBadge status={item.status} />
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
