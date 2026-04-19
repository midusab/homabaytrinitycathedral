import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X as XIcon, 
  Mail as MailIcon, 
  Lock as LockIcon, 
  User as UserIcon, 
  Loader2 as Loader2Icon 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validatePassword = (pass: string) => {
    // 1. Minimum 8 characters
    // 2. At least one uppercase letter
    // 3. At least one lowercase letter
    // 4. At least one number
    // 5. At least one special character
    const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    // 6. Prevent sequential repetitions (e.g., "aaa", "111")
    const repetitionRegex = /(.)\1\1/;

    if (!strengthRegex.test(pass)) {
      return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
    }

    if (repetitionRegex.test(pass)) {
      return "Password contains too many repeating characters (e.g. 'aaa'). Please choose a more complex sequence.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate password for sign-up
    if (isSignUp) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        setLoading(false);
        return;
      }
    }

    try {
      if (!supabase) {
        throw new Error('Authentication is not configured. Please set Supabase environment variables.');
      }
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setSuccess(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-pure-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-panel w-full max-w-md p-10 rounded-[32px] relative z-10"
          >
            <div className="specular-highlight rounded-[32px]" />
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-pure-white/40 hover:text-pure-white transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif mb-2">
                {isSignUp ? 'Join the Sanctuary' : 'Welcome Back'}
              </h2>
              <p className="text-xs uppercase tracking-[0.2em] text-accent-blue font-bold">
                {isSignUp ? 'Create your cathedral account' : 'Sign in to your account'}
              </p>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-accent-blue/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MailIcon className="w-8 h-8 text-accent-blue" />
                </div>
                <h3 className="text-xl font-serif mb-4">Check your email</h3>
                <p className="text-pure-white/50 text-sm leading-relaxed mb-8">
                  We've sent a verification link to <strong>{email}</strong>. Please confirm your email to activate your account.
                </p>
                <button
                  onClick={onClose}
                  className="w-full glass-panel py-4 rounded-lg text-[11px] uppercase tracking-[0.3em] font-bold bg-white/10 hover:bg-accent-blue hover:text-pure-black transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase tracking-widest font-bold py-3 px-4 rounded-md text-center">
                    {error}
                  </div>
                )}

                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-pure-white/20" />
                      <input
                        required
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Saint John"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-14 pr-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Email Address</label>
                  <div className="relative">
                    <MailIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-pure-white/20" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@cathedral.org"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-14 pr-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Password</label>
                  <div className="relative">
                    <LockIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-pure-white/20" />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-14 pr-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20"
                    />
                  </div>
                  {isSignUp && (
                    <p className="text-[9px] text-white/30 px-1 leading-relaxed">
                      At least 8 characters, with uppercase, lowercase, numbers, and symbols. No long repetitions.
                    </p>
                  )}
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full glass-panel py-5 rounded-lg text-[11px] uppercase tracking-[0.3em] font-bold bg-white/10 hover:bg-accent-blue hover:text-pure-black transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[10px] uppercase tracking-widest text-pure-white/40 hover:text-accent-blue transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
