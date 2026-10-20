import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import { Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/format';

export function ProfileForm() {
  const { profile, updateProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [farmName, setFarmName] = useState(profile?.farm_name ?? '');
  const [payoutAccount, setPayoutAccount] = useState(profile?.payout_account ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        full_name: fullName,
        phone,
        address,
        farm_name: farmName,
        payout_account: payoutAccount,
      });
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <Title>Profile</Title>
        <Field label="Full name" value={fullName} onChangeText={setFullName} />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Address" value={address} onChangeText={setAddress} />
        {profile?.role === 'seller' ? (
          <>
            <Field label="Farm name" value={farmName} onChangeText={setFarmName} />
            <Field
              label="Payout details"
              value={payoutAccount}
              onChangeText={setPayoutAccount}
              placeholder="Bank account or mobile money"
            />
          </>
        ) : null}
        <ErrorText message={error} />
        <Button title="Save profile" onPress={onSave} loading={saving} />
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}
