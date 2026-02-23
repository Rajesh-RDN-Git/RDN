'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  sendOtpSchema,
  updateUserSchema,
  type SendOtpInput,
  type UpdateUserInput,
} from '@rdn/shared';
import { PhoneInput } from '@/components/ui/phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { authApi, usersApi } from '@/lib/api';
import { showToast } from '@/stores/toast-store';

export default function RegisterPage() {
  const router = useRouter();
  const { login, refreshProfile } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const phoneForm = useForm<SendOtpInput>({
    resolver: zodResolver(sendOtpSchema),
  });

  const nameForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onSendOtp = useCallback(async (data: SendOtpInput) => {
    setIsSubmitting(true);
    try {
      await authApi.sendOtp(data.phone);
      setPhone(data.phone);
      setStep('otp');
      setResendTimer(30);
      showToast.success('OTP sent successfully');
    } catch {
      showToast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const onVerifyOtp = useCallback(
    async (otp: string) => {
      setIsSubmitting(true);
      try {
        await login(phone, otp);
        setStep('name');
      } catch {
        showToast.error('Invalid OTP. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [phone, login],
  );

  const onUpdateName = useCallback(
    async (data: UpdateUserInput) => {
      setIsSubmitting(true);
      try {
        await usersApi.updateProfile(data);
        await refreshProfile();
        showToast.success('Profile updated!');
        router.push('/dashboard');
      } catch {
        showToast.error('Failed to update profile');
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, refreshProfile],
  );

  const handleResend = useCallback(async () => {
    try {
      await authApi.sendOtp(phone);
      setResendTimer(30);
      showToast.success('OTP resent successfully');
    } catch {
      showToast.error('Failed to resend OTP');
    }
  }, [phone]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Create account</h1>
        <p className="mb-6 text-sm text-gray-500">
          {step === 'phone' && 'Enter your phone number to get started'}
          {step === 'otp' && `Enter the OTP sent to ${phone}`}
          {step === 'name' && 'Tell us your name'}
        </p>

        {step === 'phone' && (
          <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-4">
            <PhoneInput
              label="Phone Number"
              placeholder="9999900001"
              error={phoneForm.formState.errors.phone?.message}
              {...phoneForm.register('phone', {
                setValueAs: (v: string) => (v.startsWith('+91') ? v : `+91${v}`),
              })}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : 'Send OTP'}
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <OtpInput onComplete={onVerifyOtp} disabled={isSubmitting} />
            {isSubmitting && (
              <div className="flex justify-center">
                <Spinner size="sm" />
              </div>
            )}
            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-gray-500">Resend OTP in {resendTimer}s</p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'name' && (
          <form onSubmit={nameForm.handleSubmit(onUpdateName)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Your name"
              error={nameForm.formState.errors.name?.message}
              {...nameForm.register('name')}
            />
            <Input
              label="Email (optional)"
              type="email"
              placeholder="you@example.com"
              error={nameForm.formState.errors.email?.message}
              {...nameForm.register('email')}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" /> : 'Complete Registration'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
