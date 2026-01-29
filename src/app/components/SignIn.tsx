import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Bell, Mail, Lock, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface SignInProps {
  onSignIn: (email: string) => void;
}

export function SignIn({ onSignIn }: SignInProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Mock authentication
    localStorage.setItem('user', JSON.stringify({ email, phone }));
    toast.success(isSignUp ? 'Account created successfully!' : 'Welcome back!');
    onSignIn(email);
  };

  const handleForgotPassword = () => {
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }
    toast.success('Password reset link sent to your email');
    setShowForgotPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#00AEEF] to-[#0A84FF] hover:from-[#0099D6] hover:to-[#006EDC] rounded-2xl mb-4"
            >
              <Bell className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              RemindMe
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isSignUp ? 'Create your account' : 'Welcome back!'}
            </p>
          </div>

          {showForgotPassword ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="reset-email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleForgotPassword} className="w-full">
                Send Reset Link
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowForgotPassword(false)}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email or Phone</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {!isSignUp && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-smfont-semibold text-[#0A2540] dark:text-[#8FA9C4] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full bg-gradient-to-r from-[#00AEEF] to-[#0A84FF] hover:from-[#0099D6] hover:to-[#006EDC]">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <span className="text-[#0A2540] dark:text-[#8FA9C4] font-semibold">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
