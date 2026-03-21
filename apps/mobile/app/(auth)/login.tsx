import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      await sendOtp(fullPhone);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      await verifyOtp(fullPhone, otp);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>RDN</Text>
        <Text style={styles.title}>{otpSent ? 'Verify OTP' : 'Welcome Back'}</Text>
        <Text style={styles.subtitle}>
          {otpSent
            ? `Enter the 6-digit code sent to +91${phone.replace('+91', '')}`
            : 'Sign in with your phone number'}
        </Text>

        {!otpSent ? (
          <>
            <Input
              label="Phone Number"
              placeholder="Enter 10-digit number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9+]/g, ''));
                setError('');
              }}
              keyboardType="phone-pad"
              maxLength={13}
              error={error}
            />
            <Button
              title={loading ? 'Sending...' : 'Send OTP'}
              onPress={handleSendOtp}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <Input
              label="OTP"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={(text) => {
                setOtp(text.replace(/[^0-9]/g, ''));
                setError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              error={error}
            />
            <Button
              title={loading ? 'Verifying...' : 'Verify OTP'}
              onPress={handleVerifyOtp}
              style={styles.button}
            />
            <Button
              title="Change Phone Number"
              onPress={() => {
                setOtpSent(false);
                setOtp('');
                setError('');
              }}
              variant="outline"
              style={styles.button}
            />
          </>
        )}

        <Button
          title="New user? Register"
          onPress={() => router.push('/(auth)/register')}
          variant="outline"
          style={styles.registerButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: { marginTop: 8, width: '100%' },
  registerButton: { marginTop: 24, width: '100%' },
});
