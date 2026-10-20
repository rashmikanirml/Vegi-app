# Veggie Marketplace

Mobile marketplace for farmers and buyers. Farmers list vegetables; buyers order a quantity at the listed price and pay **cash on pickup**. Admins approve farms on the web app.

## Stack

- Expo (React Native, TypeScript, Expo Router)
- Supabase Auth, Postgres (RLS), Storage, Realtime
- TanStack Query

Online card payments are not in this MVP.

## Setup

1. Create a Supabase project.
2. In the SQL editor, run [`supabase/migrations/20261020_init.sql`](supabase/migrations/20261020_init.sql).
3. Copy `.env.example` to `.env` and set:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Do not put the service-role key in the app.

4. Install and start:

```
npm install
npx expo start
```

Use Expo Go on a phone, or `npx expo start --web` for the admin screens.

## Create an admin

Register normally as a buyer, then in the Supabase Table Editor set that profile’s `role` to `admin`. Public sign-up never creates admins.

## Seller approval

Sellers cannot publish listings until `profiles.approved` is true. Use the Admin **Approvals** tab.

## App groups

- `(auth)` welcome, register, login, forgot password
- `(buyer)` marketplace, listing, checkout, orders, profile
- `(seller)` listings, incoming orders, earnings, profile
- `(admin)` farmer approvals, listings, orders/payments, users
