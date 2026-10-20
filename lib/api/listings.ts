import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';
import type { Listing, ListingStatus } from '@/lib/types';

const listingSelect = `
  *,
  seller:profiles!listings_seller_id_fkey (
    id, full_name, farm_name, address, phone
  )
`;

export type MarketplaceQuery = {
  search?: string;
  category?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
};

export async function fetchMarketplace(query: MarketplaceQuery = {}) {
  let request = supabase.from('listings').select(listingSelect).eq('status', 'active');

  if (query.category) {
    request = request.eq('category', query.category);
  }
  if (query.search) {
    request = request.ilike('name', `%${query.search}%`);
  }
  if (query.sort === 'price_asc') {
    request = request.order('price_per_kg', { ascending: true });
  } else if (query.sort === 'price_desc') {
    request = request.order('price_per_kg', { ascending: false });
  } else {
    request = request.order('created_at', { ascending: false });
  }

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function fetchListing(id: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Listing;
}

export async function fetchMyListings(sellerId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function fetchAllListings() {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export type ListingInput = {
  name: string;
  category: string;
  description?: string;
  image_url?: string | null;
  price_per_kg: number;
  quantity_kg: number;
  harvest_date?: string | null;
  area?: string;
  status?: ListingStatus;
};

export async function createListing(sellerId: string, input: ListingInput) {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: sellerId,
      name: input.name.trim(),
      category: input.category,
      description: input.description?.trim() || null,
      image_url: input.image_url ?? null,
      price_per_kg: input.price_per_kg,
      quantity_kg: input.quantity_kg,
      harvest_date: input.harvest_date || null,
      area: input.area?.trim() || null,
      status: input.quantity_kg <= 0 ? 'sold_out' : (input.status ?? 'active'),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Listing;
}

export async function updateListing(id: string, input: Partial<ListingInput>) {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.category !== undefined) payload.category = input.category;
  if (input.description !== undefined) payload.description = input.description.trim() || null;
  if (input.image_url !== undefined) payload.image_url = input.image_url;
  if (input.price_per_kg !== undefined) payload.price_per_kg = input.price_per_kg;
  if (input.quantity_kg !== undefined) payload.quantity_kg = input.quantity_kg;
  if (input.harvest_date !== undefined) payload.harvest_date = input.harvest_date || null;
  if (input.area !== undefined) payload.area = input.area.trim() || null;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await supabase.from('listings').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as Listing;
}

export async function deleteListing(id: string) {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
}

export async function pickAndCompressListingPhoto() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;

  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 900 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipulated.uri;
}

export async function uploadListingPhoto(userId: string, uri: string) {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('listing-photos').upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
  return data.publicUrl;
}
