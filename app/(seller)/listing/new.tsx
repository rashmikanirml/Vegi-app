import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { ListingForm, type ListingFormValues } from '@/components/ListingForm';
import { Screen, Title } from '@/components/ui';
import { createListing } from '@/lib/api/listings';
import { useAuth } from '@/lib/auth';

export default function NewListingScreen() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  async function onSubmit(values: ListingFormValues) {
    if (!profile) return;
    const quantity = Number(values.quantity_kg);
    await createListing(profile.id, {
      name: values.name,
      category: values.category,
      description: values.description,
      image_url: values.image_url,
      price_per_kg: Number(values.price_per_kg),
      quantity_kg: quantity,
      harvest_date: values.harvest_date || null,
      area: values.area,
      status: quantity <= 0 ? 'sold_out' : 'active',
    });
    await queryClient.invalidateQueries({ queryKey: ['listings'] });
    router.replace('/(seller)');
  }

  return (
    <Screen>
      <Title>New listing</Title>
      {profile ? (
        <ListingForm sellerId={profile.id} submitLabel="Publish listing" onSubmit={onSubmit} />
      ) : null}
    </Screen>
  );
}
