'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
        return;
      }

      // Remember me preference
      if (data.rememberMe) localStorage.setItem('rememberMe', 'true');
      else localStorage.removeItem('rememberMe');

      if (authData?.session) {
        toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
        router.push('/'); // go to dashboard/home
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      toast({ title: 'Something went wrong', description: 'Please try again later.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    const email = watch('email');
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address to receive a magic link.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        toast({ title: 'Failed to send magic link', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Magic link sent!', description: 'Check your email for the login link.' });
      }
    } catch (err) {
      console.error('Magic link error:', err);
      toast({ title: 'Something went wrong', description: 'Please try again later.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 via-white to-green-50">
      <div className="w-full max-w-md rounded-3xl border bg-white/95 shadow-2xl p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
            Rankins Inventory
          </h1>
          <p className="text-sm text-gray-600">Berry Research Test Plot Management</p>
        </div>

        <h2 className="text-lg font-medium text-center text-gray-700 mb-4">Sign In to Your Account</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@rankins.com"
              className="w-full"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full pr-10"
                {...register('password')}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Remember me */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={!!rememberMe}
              onCheckedChange={(checked) => setValue('rememberMe', Boolean(checked))}
              disabled={isLoading}
            />
            <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer select-none">
              Remember me
            </Label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
          >
            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>) : 'Sign In'}
          </Button>
        </form>

        {/* Or + Magic link */}
        <div className="space-y-3 mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={isLoading}
            className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Send me a magic link instead
          </button>
        </div>

        {/* Footer links */}
        <div className="pt-4 mt-6 border-t border-gray-200 flex justify-between text-xs text-gray-500">
          <Link href="/signup" className="hover:text-purple-600">Create Account</Link>
          <Link href="/forgot-password" className="hover:text-purple-600">Forgot Password?</Link>
        </div>

        {/* Demo creds (optional) */}
        <div className="mt-4 bg-purple-50 rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-purple-700 font-medium mb-1">Demo Credentials:</p>
          <p className="text-xs text-purple-600">admin@rankins.com / RankinsAdmin2024!</p>
        </div>

        {/* Tiny footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          © 2024 Rankins Test Plot. All rights reserved.
        </div>
      </div>
    </main>
  );
}
