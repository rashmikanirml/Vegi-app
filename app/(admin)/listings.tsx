import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, ScrollView, Text } from 'react-native';

import { Button, Card, EmptyState, Muted, Screen, StatusBadge, Title } from '@/components/ui';
import { deleteListing, fetchAllListings } from '@/lib/api/listings';
import { kg, money } from '@/lib/format';

export default function AdminListingsScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'listings'], queryFn: fetchAllListings });
  const remove = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] }),
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <Title>All listings</Title>
        {(query.data ?? []).length === 0 ? (
          <EmptyState title="No listings" body="Farmer posts will show here for moderation." />
        ) : (
          (query.data ?? []).map((listing) => (
            <Card key={listing.id}>
              <Text style={{ fontWeight: '800' }}>{listing.name}</Text>
              <Muted>
                {listing.seller?.farm_name || listing.seller?.full_name} · {money(listing.price_per_kg)} / kg ·{' '}
                {kg(listing.quantity_kg)}
              </Muted>
              <StatusBadge status={listing.status} />
              <Button
                title="Remove listing"
                variant="danger"
                onPress={() =>
                  Alert.alert('Remove listing?', listing.name, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(listing.id) },
                  ])
                }
              />
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
