import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, ErrorText, Field, Muted } from '@/components/ui';
import { pickAndCompressListingPhoto, uploadListingPhoto } from '@/lib/api/listings';
import { errorMessage } from '@/lib/format';
import type { Listing, ListingStatus } from '@/lib/types';
import { VEGETABLE_CATEGORIES } from '@/lib/types';

export type ListingFormValues = {
  name: string;
  category: string;
  description: string;
  price_per_kg: string;
  quantity_kg: string;
  harvest_date: string;
  area: string;
  image_url: string | null;
  status: ListingStatus;
};

const emptyValues: ListingFormValues = {
  name: '',
  category: 'Leafy',
  description: '',
  price_per_kg: '',
  quantity_kg: '',
  harvest_date: '',
  area: '',
  image_url: null,
  status: 'active',
};

export function listingToForm(listing?: Listing | null): ListingFormValues {
  if (!listing) return emptyValues;
  return {
    name: listing.name,
    category: listing.category,
    description: listing.description ?? '',
    price_per_kg: String(listing.price_per_kg),
    quantity_kg: String(listing.quantity_kg),
    harvest_date: listing.harvest_date ?? '',
    area: listing.area ?? '',
    image_url: listing.image_url,
    status: listing.status,
  };
}

export function ListingForm({
  initial,
  sellerId,
  submitLabel,
  onSubmit,
}: {
  initial?: Listing | null;
  sellerId: string;
  submitLabel: string;
  onSubmit: (values: ListingFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState(listingToForm(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function set<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onPickPhoto() {
    setUploading(true);
    setError(null);
    try {
      const uri = await pickAndCompressListingPhoto();
      if (!uri) return;
      const url = await uploadListingPhoto(sellerId, uri);
      set('image_url', url);
    } catch (err) {
      setError(errorMessage(err, 'Could not upload photo'));
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      if (!values.name.trim()) throw new Error('Name is required');
      if (!Number(values.price_per_kg) || Number(values.price_per_kg) <= 0) {
        throw new Error('Enter a price per kg');
      }
      if (Number(values.quantity_kg) < 0 || values.quantity_kg === '') {
        throw new Error('Enter quantity in kg');
      }
      await onSubmit(values);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
      <Pressable onPress={onPickPhoto}>
        {values.image_url ? (
          <Image source={{ uri: values.image_url }} style={{ width: '100%', height: 180, borderRadius: 16 }} />
        ) : (
          <View
            style={{
              height: 180,
              borderRadius: 16,
              backgroundColor: '#E7F5EA',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontWeight: '700', color: '#1F7A3A' }}>
              {uploading ? 'Uploading…' : 'Add vegetable photo'}
            </Text>
          </View>
        )}
      </Pressable>
      <Field label="Vegetable name" value={values.name} onChangeText={(v) => set('name', v)} />
      <Muted>Category</Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {VEGETABLE_CATEGORIES.map((category) => (
          <Pressable
            key={category}
            onPress={() => set('category', category)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: values.category === category ? '#1F7A3A' : '#E7F5EA',
            }}
          >
            <Text style={{ color: values.category === category ? '#fff' : '#1F7A3A', fontWeight: '700' }}>
              {category}
            </Text>
          </Pressable>
        ))}
      </View>
      <Field
        label="Description"
        value={values.description}
        onChangeText={(v) => set('description', v)}
        multiline
      />
      <Field
        label="Price per kg"
        value={values.price_per_kg}
        onChangeText={(v) => set('price_per_kg', v)}
        keyboardType="decimal-pad"
      />
      <Field
        label="Quantity available (kg)"
        value={values.quantity_kg}
        onChangeText={(v) => set('quantity_kg', v)}
        keyboardType="decimal-pad"
      />
      <Field
        label="Harvest date (YYYY-MM-DD)"
        value={values.harvest_date}
        onChangeText={(v) => set('harvest_date', v)}
        placeholder="2026-10-20"
      />
      <Field
        label="Pickup or delivery area"
        value={values.area}
        onChangeText={(v) => set('area', v)}
      />
      <ErrorText message={error} />
      <Button title={submitLabel} onPress={submit} loading={saving || uploading} />
    </ScrollView>
  );
}
