import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import { Button, Card, Muted, Screen, Title } from '@/components/ui';
import { fetchListing } from '@/lib/api/listings';
import { formatDate, kg, money } from '@/lib/format';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listingQuery = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id),
    enabled: Boolean(id),
  });
  const listing = listingQuery.data;
  const [qty, setQty] = useState(1);
  const available = Number(listing?.quantity_kg ?? 0);
  const total = qty * Number(listing?.price_per_kg ?? 0);

  if (!listing) {
    return (
      <Screen>
        <Muted>Loading listing…</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        {listing.image_url ? (
          <Image source={{ uri: listing.image_url }} style={{ width: '100%', height: 220, borderRadius: 16 }} />
        ) : null}
        <Title>{listing.name}</Title>
        <Muted>
          {listing.category} · harvest {formatDate(listing.harvest_date)}
        </Muted>
        <Card>
          <Text style={{ fontWeight: '700' }}>
            {listing.seller?.farm_name || listing.seller?.full_name}
          </Text>
          <Muted>{listing.seller?.address || listing.area || 'Location shared after order'}</Muted>
          <Text>{listing.description || 'Fresh vegetables from the farm.'}</Text>
          <Text style={{ fontWeight: '800', color: '#1F7A3A', fontSize: 18 }}>
            {money(listing.price_per_kg)} / kg · {kg(available)} available
          </Text>
        </Card>
        <Card>
          <Text style={{ fontWeight: '700' }}>Choose quantity</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Button title="-" variant="secondary" onPress={() => setQty((q) => Math.max(0.5, q - 0.5))} />
            <Text style={{ fontSize: 20, fontWeight: '800' }}>{qty} kg</Text>
            <Button
              title="+"
              variant="secondary"
              onPress={() => setQty((q) => Math.min(available, q + 0.5))}
            />
          </View>
          <Text>Total at listed price: {money(total)}</Text>
        </Card>
        <Button
          title="Continue to checkout"
          disabled={available < qty || qty <= 0}
          onPress={() => router.push(`/(buyer)/checkout/${listing.id}?qty=${qty}`)}
        />
      </ScrollView>
    </Screen>
  );
}
