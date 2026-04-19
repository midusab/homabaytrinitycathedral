import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X as XIcon, 
  Camera as CameraIcon, 
  User as UserIcon, 
  Loader2 as Loader2Icon, 
  Check as CheckIcon,
  LogOut as LogOutIcon,
  Shield as ShieldIcon,
  Mail as MailIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, signOut, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    avatar_url: null,
    bio: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchProfile();
    }
  }, [user, isOpen]);

  async function fetchProfile() {
    try {
      setLoading(true);
      if (!supabase || !user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, bio')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          avatar_url: data.avatar_url,
          bio: data.bio || ''
        });
      } else {
        // Fallback to auth metadata if profile record doesn't exist yet
        setProfile(prev => ({
          ...prev,
          full_name: user.user_metadata.full_name || ''
        }));
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      if (!supabase || !user) return;

      const updates = {
        id: user.id,
        full_name: profile.full_name,
        bio: profile.bio,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated with grace' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      setMessage(null);
      if (!supabase || !user || !event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload image to S3 bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update profile with new URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      await refreshProfile();
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ type: 'success', text: 'Sacred image updated' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Upload failed: ${err.message}` });
    } finally {
      setUploading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-pure-black/90 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="glass-panel w-full max-w-4xl min-h-[600px] rounded-[64px] relative z-10 overflow-hidden flex flex-col md:flex-row"
          >
            <div className="specular-highlight rounded-[64px]" />
            
            {/* Sidebar / Visual Aspect */}
            <div className="w-full md:w-1/3 bg-white/[0.02] p-12 flex flex-col items-center border-r border-white/5 relative">
               {/* Background Decorative Gradient */}
               <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent-blue blur-[80px] rounded-full animate-pulse" />
               </div>

              <div className="relative group mb-8">
                <div className="w-32 h-32 rounded-full glass-panel flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:border-accent-blue/50 transition-all duration-500">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-white/20" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-pure-black/60 flex items-center justify-center">
                      <Loader2Icon className="w-6 h-6 animate-spin text-accent-blue" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 w-10 h-10 bg-accent-blue rounded-full flex items-center justify-center text-pure-black shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={uploadAvatar} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>

              <div className="text-center mb-12 relative z-10">
                <h3 className="text-2xl font-serif mb-2">{profile.full_name || 'Faithful Soul'}</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold flex items-center justify-center gap-2">
                  <ShieldIcon className="w-3 h-3 text-accent-blue/50" />
                  Sanctuary Member
                </p>
              </div>

              <div className="mt-auto w-full space-y-4 relative z-10">
                <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 bg-white/[0.03]">
                  <MailIcon className="w-4 h-4 text-white/30" />
                  <div className="overflow-hidden">
                    <p className="text-[9px] uppercase tracking-widest text-white/40 block">Email</p>
                    <p className="text-xs truncate">{user?.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="w-full glass-panel py-4 rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center gap-3"
                >
                  <LogOutIcon className="w-3 h-3" />
                  Log Out
                </button>
              </div>
            </div>

            {/* Main Content Areas */}
            <div className="flex-1 p-12 overflow-y-auto max-h-[85vh]">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-4xl font-serif mb-2">Sanctuary Profile</h2>
                  <p className="text-xs uppercase tracking-widest text-white/40">Manage your spiritual presence in our community</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-12 h-12 glass-panel rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <XIcon className="w-5 h-5 text-white/40" />
                </button>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-8 p-4 rounded-2xl flex items-center gap-4 text-xs font-bold uppercase tracking-widest ${
                    message.type === 'success' 
                    ? 'bg-accent-blue/10 border border-accent-blue/20 text-accent-blue' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                  }`}
                >
                  {message.type === 'success' ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                  {message.text}
                </motion.div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <Loader2Icon className="w-12 h-12 animate-spin mb-4" />
                  <p className="text-[10px] uppercase tracking-[0.4em]">Retrieving Records...</p>
                </div>
              ) : (
                <form onSubmit={updateProfile} className="space-y-10">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Preferred Name</label>
                      <input 
                        required
                        type="text" 
                        value={profile.full_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20"
                      />
                      <p className="text-[9px] text-white/30 italic">How you appear to church staff and community</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Spiritual Status</label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white/40 flex items-center gap-3 cursor-not-allowed">
                        <CheckIcon className="w-4 h-4 text-accent-blue" />
                        Verified Parishioner
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Personal Testimony / Bio</label>
                    <textarea 
                      rows={6}
                      value={profile.bio || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Share a brief message or your role in the cathedral community..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/30">
                       <ShieldIcon className="w-4 h-4" />
                       <span className="text-[9px] uppercase tracking-widest font-medium">Data is encrypted and private</span>
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={saving}
                      className="glass-panel px-12 py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] font-bold bg-white/5 hover:bg-accent-blue hover:text-pure-black transition-all flex items-center gap-3"
                    >
                      {saving ? (
                        <>
                          <Loader2Icon className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4" />
                          Save Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
