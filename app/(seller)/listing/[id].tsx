import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';

import { ListingForm, type ListingFormValues } from '@/components/ListingForm';
import { Button, Muted, Screen, Title } from '@/components/ui';
import { deleteListing, fetchListing, updateListing } from '@/lib/api/listings';
import { useAuth } from '@/lib/auth';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const listingQuery = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id),
    enabled: Boolean(id),
  });

  const remove = useMutation({
    mutationFn: () => deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      router.replace('/(seller)');
    },
  });

  async function onSubmit(values: ListingFormValues) {
    const quantity = Number(values.quantity_kg);
    await updateListing(id, {
      name: values.name,
      category: values.category,
      description: values.description,
      image_url: values.image_url,
      price_per_kg: Number(values.price_per_kg),
      quantity_kg: quantity,
      harvest_date: values.harvest_date || null,
      area: values.area,
      status: quantity <= 0 ? 'sold_out' : values.status === 'paused' ? 'paused' : 'active',
    });
    await queryClient.invalidateQueries({ queryKey: ['listings'] });
    router.back();
  }

  const listing = listingQuery.data;
  if (!listing || !profile) {
    return (
      <Screen>
        <Muted>Loading listing…</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Edit listing</Title>
      <ListingForm
        initial={listing}
        sellerId={profile.id}
        submitLabel="Save listing"
        onSubmit={onSubmit}
      />
      <View style={{ gap: 8, marginTop: 8 }}>
        <Button
          title={listing.status === 'paused' ? 'Resume listing' : 'Pause listing'}
          variant="secondary"
          onPress={async () => {
            await updateListing(id, {
              status: listing.status === 'paused' ? 'active' : 'paused',
            });
            queryClient.invalidateQueries({ queryKey: ['listings'] });
            queryClient.invalidateQueries({ queryKey: ['listing', id] });
          }}
        />
        <Button
          title="Delete listing"
          variant="danger"
          onPress={() =>
            Alert.alert('Delete listing?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
            ])
          }
        />
      </View>
    </Screen>
  );
}
