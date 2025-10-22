'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Eye, EyeOff, Loader2, Leaf, Cherry, Package } from 'lucide-react';
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
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
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
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (authData?.session) {
        if (data.rememberMe) localStorage.setItem('rememberMe', 'true');
        else localStorage.removeItem('rememberMe');

        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });

        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again later.',
        variant: 'destructive',
      });
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
        toast({
          title: 'Failed to send magic link',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Magic link sent!',
          description: 'Check your email for the login link.',
        });
      }
    } catch (error) {
      console.error('Magic link error:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-green-50" />
      </div>

      {/* Animated berry shapes */}
      <motion.div
        className="absolute top-10 left-10 w-64 h-64 bg-purple-200 rounded-full opacity-20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-96 h-96 bg-green-200 rounded-full opacity-20 blur-3xl"
        animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />

      {/* Main card */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-100"
        >
          <div className="text-center space-y-2 mb-4">
            <div className="relative flex justify-center mb-3">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-green-500 rounded-full flex items-center justify-center shadow-lg relative">
                <Package className="w-10 h-10 text-white" />
                <Cherry className="absolute -top-2 -right-2 w-6 h-6 text-red-500" />
                <Leaf className="absolute -bottom-2 -left-2 w-5 h-5 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
              Rankins Inventory
            </h1>
            <p className="text-sm text-gray-600">Berry Research Test Plot Management</p>
          </div>

          <h2 className="text-lg font-medium text-center text-gray-700 mb-4">
            Sign In to Your Account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@rankins.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setValue('rememberMe', checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                Remember me
              </Label>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider + Magic link */}
          <div className="mt-4 text-center">
            <div className="text-xs text-gray-500 mb-2">Or</div>
            <button
              onClick={handleMagicLink}
              disabled={isLoading}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Send me a magic link instead
            </button>
          </div>

          {/* Footer links */}
          <div className="mt-6 flex justify-between text-xs text-gray-500 border-t border-gray-200 pt-4">
            <Link href="/signup" className="hover:text-purple-600">
              Create Account
            </Link>
            <Link href="/forgot-password" className="hover:text-purple-600">
              Forgot Password?
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 bg-purple-50 rounded-lg p-3 border border-purple-200 text-xs text-purple-700">
            Demo login: <strong>admin@rankins.com / RankinsAdmin2024!</strong>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-400">
            © 2024 Rankins Test Plot. All rights reserved.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
