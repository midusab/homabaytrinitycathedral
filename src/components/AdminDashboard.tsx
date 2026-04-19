import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Calendar, 
  Video, 
  MessageSquare, 
  User, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Upload, 
  X, 
  Check, 
  Search,
  ChevronRight,
  ShieldCheck,
  Bell,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'overview' | 'events' | 'sermons' | 'intentions' | 'profile';

export function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Tab State
  const [events, setEvents] = useState<any[]>([]);
  const [sermons, setSermons] = useState<any[]>([]);
  const [intentions, setIntentions] = useState<any[]>([]);
  const [stats, setStats] = useState({ intentions: 0, events: 0, sermons: 0 });
  const [loading, setLoading] = useState(false);

  // Form State for Events
  const [newEvent, setNewEvent] = useState({ title: '', date: '', desc: '', category: 'Worship' });
  const [newSermon, setNewSermon] = useState({ title: '', speaker: '', date: '', url: '', type: 'link' });

  useEffect(() => {
    if (isAuthenticated && isOpen) {
       fetchData();
       if (activeTab === 'overview') fetchStats();
    }
  }, [isAuthenticated, isOpen, activeTab]);

  async function fetchStats() {
    if (!supabase) return;
    const { count: iCount } = await supabase.from('intentions').select('*', { count: 'exact', head: true });
    const { count: eCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
    const { count: sCount } = await supabase.from('sermons').select('*', { count: 'exact', head: true });
    setStats({ 
      intentions: iCount || 0, 
      events: eCount || 0, 
      sermons: sCount || 0 
    });
  }

  // Real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated || !isOpen || !supabase) return;

    const eventsSubscription = supabase
      .channel('admin-events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        if (activeTab === 'events') fetchData();
        if (activeTab === 'overview') fetchStats();
      })
      .subscribe();

    const sermonsSubscription = supabase
      .channel('admin-sermons-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons' }, () => {
        if (activeTab === 'sermons') fetchData();
        if (activeTab === 'overview') fetchStats();
      })
      .subscribe();

    const intentionsSubscription = supabase
      .channel('admin-intentions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'intentions' }, () => {
        if (activeTab === 'intentions') fetchData();
        if (activeTab === 'overview') fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventsSubscription);
      supabase.removeChannel(sermonsSubscription);
      supabase.removeChannel(intentionsSubscription);
    };
  }, [isAuthenticated, isOpen, activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (!supabase) return;
      if (activeTab === 'events') {
        const { data } = await supabase.from('events').select('*').order('date', { ascending: false });
        setEvents(data || []);
      } else if (activeTab === 'sermons') {
        const { data } = await supabase.from('sermons').select('*').order('date', { ascending: false });
        setSermons(data || []);
      } else if (activeTab === 'intentions') {
        const { data } = await supabase.from('intentions').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
        setIntentions(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassword === '123@cathedral' && isAdmin) {
      setIsAuthenticated(true);
      setAuthError('');
    } else if (!isAdmin) {
      setAuthError('You do not have administrative privileges.');
    } else {
      setAuthError('Invalid Master Password');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-pure-black/95 backdrop-blur-3xl"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel w-full h-full max-w-7xl rounded-none md:rounded-[48px] relative z-10 flex flex-col md:flex-row overflow-hidden shadow-2xl border-white/5"
      >
        <div className="specular-highlight rounded-[48px]" />

        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
              <div className="w-20 h-20 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-accent-blue/20">
                <ShieldCheck className="w-10 h-10 text-accent-blue" />
              </div>
              <h2 className="text-4xl font-serif mb-4 text-glow">Sanctuary Command</h2>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-12">Restricted Access • Admin Authentication Required</p>
              
              <form onSubmit={handleAdminAuth} className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase tracking-widest text-accent-blue font-bold ml-1">Master Access Key</label>
                  <input 
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center text-lg focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/10 tracking-[0.5em]"
                  />
                </div>
                {authError && <p className="text-red-500 text-[10px] uppercase tracking-widest font-bold">{authError}</p>}
                <button type="submit" className="w-full glass-panel py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] font-bold bg-white/5 hover:bg-accent-blue hover:text-pure-black transition-all">
                  Authorize Access
                </button>
              </form>
              
              <button onClick={onClose} className="mt-8 text-[10px] uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                Return to Sanctuary
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-80 bg-white/[0.02] border-r border-white/5 p-8 flex flex-col gap-12 relative overflow-y-auto">
              <div className="flex items-center gap-4">
                <Logo size={32} />
                <div>
                  <h1 className="font-serif text-xl">Trinity Admin</h1>
                  <p className="text-[9px] uppercase tracking-widest text-accent-blue font-bold">Cathedral Management</p>
                </div>
              </div>

              <nav className="space-y-1">
                {[
                  { id: 'overview', icon: BarChart3, label: 'Overview' },
                  { id: 'events', icon: Calendar, label: 'Events & Gallery' },
                  { id: 'sermons', icon: Video, label: 'Sermons' },
                  { id: 'intentions', icon: MessageSquare, label: 'Intentions' },
                  { id: 'profile', icon: User, label: 'Admin Profile' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] uppercase tracking-widest font-medium transition-all ${
                      activeTab === item.id 
                      ? 'bg-accent-blue text-pure-black' 
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.id === activeTab && <motion.div layoutId="tab-indicator" className="ml-auto"><ChevronRight className="w-3 h-3" /></motion.div>}
                  </button>
                ))}
              </nav>

              <div className="mt-auto pt-12 border-t border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full overflow-hidden glass-panel border border-white/10">
                    {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User className="w-4 h-4 m-3 text-white/20" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase truncate">{profile?.full_name || 'Admin'}</p>
                    <p className="text-[8px] uppercase tracking-widest text-white/30">Privileged Session</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-full glass-panel py-4 rounded-xl text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-white/10 transition-colors">
                  Exit Dashboard
                </button>
              </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 overflow-y-auto p-8 md:p-12 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full flex flex-col"
                >
                  <header className="mb-12 flex justify-between items-end">
                    <div>
                      <h2 className="text-4xl font-serif mb-2 capitalize">{activeTab}</h2>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Managing Trinity Cathedral digital sanctuary</p>
                    </div>
                    {activeTab !== 'overview' && activeTab !== 'profile' && (
                      <button className="glass-panel px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold bg-accent-blue/10 hover:bg-accent-blue hover:text-pure-black transition-all flex items-center gap-2">
                        <Plus className="w-3 h-3" />
                        Create New Record
                      </button>
                    )}
                  </header>

                  <div className="flex-1">
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                          { label: 'Sermon Archive', value: stats.sermons.toLocaleString(), delta: 'Sanctuary Library', icon: Video },
                          { label: 'Prayer Intentions', value: stats.intentions.toLocaleString(), delta: 'Spiritual Outreach', icon: MessageSquare },
                          { label: 'Liturgical Events', value: stats.events.toLocaleString(), delta: 'Parish Life', icon: Calendar },
                        ].map((stat, i) => (
                          <div key={i} className="glass-panel p-8 rounded-3xl relative">
                            <stat.icon className="w-8 h-8 text-accent-blue/40 absolute top-8 right-8" />
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-4">{stat.label}</p>
                            <h3 className="text-5xl font-serif mb-2">{stat.value}</h3>
                            <p className="text-[10px] tracking-widest text-accent-blue font-bold">{stat.delta}</p>
                          </div>
                        ))}
                        
                        <div className="md:col-span-3 glass-panel p-8 rounded-[32px] mt-8 min-h-[300px]">
                           <div className="flex items-center justify-between mb-8">
                             <h4 className="text-xl font-serif">Recent System Activity</h4>
                             <Bell className="w-4 h-4 text-white/20" />
                           </div>
                           <div className="space-y-4 opacity-50 italic text-sm">
                              <p>• Sermon video "The Architecture of Gravity" uploaded successfully.</p>
                              <p>• Automated notification sent to 2,450 parishioners for "Easter Vigil".</p>
                              <p>• Response sent to Maria G. regarding prayer intention #482.</p>
                           </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'events' && (
                      <div className="space-y-8">
                         {/* Simple Event Feed Placeholder */}
                         <div className="grid gap-6">
                           {[1,2,3].map(i => (
                             <div key={i} className="glass-panel p-6 rounded-2xl flex items-center gap-6 group hover:bg-white/[0.03] transition-colors">
                               <div className="w-24 h-24 bg-white/5 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-white/5">
                                 <ImageIcon className="w-6 h-6 text-white/10" />
                               </div>
                               <div className="flex-1">
                                  <h4 className="text-lg font-serif mb-1">Cathedral Restoration Celebration {i}</h4>
                                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">May 24, 2026 • Liturgy</p>
                                  <div className="flex gap-2">
                                     <button className="text-[9px] uppercase tracking-widest font-bold text-accent-blue hover:underline">Edit Content</button>
                                     <span className="text-white/10 px-2">•</span>
                                     <button className="text-[9px] uppercase tracking-widest font-bold text-accent-blue hover:underline">Gallery Management</button>
                                  </div>
                               </div>
                               <button className="p-3 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}

                    {activeTab === 'sermons' && (
                      <div className="space-y-8">
                         <div className="glass-panel p-8 rounded-3xl border-accent-blue/10 bg-accent-blue/5">
                            <h4 className="text-lg font-serif mb-6">Upload New Sermon</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                               <div className="space-y-3">
                                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Video Title</label>
                                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50" placeholder="The Path to Clarity" />
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Source Type</label>
                                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm focus:outline-none appearance-none">
                                     <option>YouTube / Vimeo Link</option>
                                     <option>Direct Upload (Supabase)</option>
                                  </select>
                               </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                               <button className="glass-panel px-10 py-4 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-accent-blue hover:text-pure-black transition-all">Publish Video</button>
                            </div>
                         </div>
                      </div>
                    )}

                    {activeTab === 'intentions' && (
                      <div className="space-y-6">
                        {[1,2,3].map(i => (
                          <div key={i} className="glass-panel p-8 rounded-3xl relative group">
                            <div className="flex justify-between items-start mb-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue text-xs font-bold font-serif">M</div>
                                  <div>
                                     <p className="text-sm font-serif">Maria Gonzalez</p>
                                     <p className="text-[9px] uppercase tracking-widest text-white/30">maria.g@gmail.com</p>
                                  </div>
                               </div>
                               <span className="text-[9px] uppercase tracking-widest px-3 py-1 bg-accent-blue/10 text-accent-blue rounded-full font-bold">Pending Response</span>
                            </div>
                            <p className="text-sm text-pure-white/60 leading-relaxed italic border-l-2 border-accent-blue/20 pl-6 mb-8">
                               "I am praying for my grandmother's recovery from surgery. Please include her in the weekly litany of the sick."
                            </p>
                            <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                               <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-xs focus:outline-none focus:border-accent-blue/30" placeholder="Type an encouraging response from the cathedral..." />
                               <button className="glass-panel p-3 rounded-xl hover:bg-accent-blue hover:text-pure-black transition-all">
                                  <Check className="w-4 h-4" />
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'profile' && (
                       <div className="max-w-2xl mx-auto py-12 text-center">
                          <h4 className="text-2xl font-serif mb-8">Administrator Privileges</h4>
                          <div className="glass-panel p-12 rounded-[48px] relative overflow-hidden">
                             <div className="specular-highlight rounded-[48px]" />
                             <div className="w-24 h-24 rounded-full glass-panel mx-auto mb-8 flex items-center justify-center border-accent-blue/20">
                                <ShieldCheck className="w-10 h-10 text-accent-blue" />
                             </div>
                             <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent-blue mb-4">Level 1 Administrator</p>
                             <h3 className="text-3xl font-serif mb-8">{profile?.full_name}</h3>
                             
                             <div className="space-y-4 text-left">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                   <span className="text-[10px] uppercase tracking-widest text-white/40">2FA Status</span>
                                   <span className="text-[10px] uppercase tracking-widest font-bold text-green-500">Active</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                   <span className="text-[10px] uppercase tracking-widest text-white/40">Last Logged</span>
                                   <span className="text-[10px] uppercase tracking-widest font-bold">Just Now</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </main>
          </>
        )}

        {/* Floating Close if authorized */}
        {isAuthenticated && (
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 glass-panel rounded-full flex items-center justify-center hover:bg-white/10 transition-colors z-20"
          >
            <X className="w-5 h-5 text-white/40" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

// Logo component helper if not imported
function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 10L20 40V90H80V40L50 10Z" stroke="#60a5fa" strokeWidth="2" />
      <path d="M35 90V65C35 56.7157 41.7157 50 50 50C58.2843 50 65 56.7157 65 65V90" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <path d="M50 25V35M45 30H55" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
