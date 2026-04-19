import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
  Loader2,
  Edit
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'overview' | 'events' | 'sermons' | 'intentions' | 'profile' | 'site_settings' | 'gallery';

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
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '', category: 'Worship' });
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    try {
      setLoading(true);
      const isUpdating = !!(newEvent as any).id;
      const eventData = {
        title: newEvent.title,
        date: newEvent.date,
        description: newEvent.description,
        category: newEvent.category
      };

      if (isUpdating) {
        const { error } = await supabase.from('events').update(eventData).eq('id', (newEvent as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('events').insert([eventData]);
        if (error) throw error;
      }
      setNewEvent({ title: '', date: '', description: '', category: 'Worship' });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Event action failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!supabase || !confirm('Are you certain you want to remove this event from the timeline?')) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Event deletion failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    try {
      setLoading(true);
      const isUpdating = !!(newSermon as any).id;
      const sermonData = {
        title: newSermon.title,
        speaker: newSermon.speaker || profile?.full_name || 'Clergy',
        date: newSermon.date || new Date().toISOString().split('T')[0],
        video_url: newSermon.url,
        video_type: newSermon.type === 'link' ? 'link' : 'local'
      };

      if (isUpdating) {
        const { error } = await supabase.from('sermons').update(sermonData).eq('id', (newSermon as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sermons').insert([sermonData]);
        if (error) throw error;
      }
      setNewSermon({ title: '', speaker: '', date: '', url: '', type: 'link' });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Sermon archival failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSermon = async (id: string) => {
    if (!supabase || !confirm('Delete this sermon record?')) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('sermons').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Sermon deletion failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // State for Site Settings and Gallery
  const [siteSettings, setSiteSettings] = useState({ heroFile: null as File | null, heroUrl: '', historyFile: null as File | null, historyUrl: '' });
  const [newGalleryItem, setNewGalleryItem] = useState({ description: '', date: '', time: '', file: null as File | null, url: '' });

  const handleUpdateSiteSettings = async (type: 'hero' | 'history', file: File | null, url: string) => {
    if (!supabase) return;
    try {
      setLoading(true);
      let imageUrl = url;
      if (file) {
        const { data, error } = await supabase.storage.from('site-assets').upload(`site_assets/${type}_${Date.now()}`, file);
        if (error) throw error;
        const { data: publicURLData } = supabase.storage.from('site-assets').getPublicUrl(data.path);
        imageUrl = publicURLData.publicUrl;
      }
      const { error } = await supabase.from('site_settings').update({ [`${type}_image_url`]: imageUrl }).eq('id', 1);
      if (error) throw error;
      toast.success(`Updated ${type} image successfully.`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to update ${type}: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || (!newGalleryItem.file && !newGalleryItem.url)) return;
    try {
      setLoading(true);
      let imageUrl = newGalleryItem.url;
      if (newGalleryItem.file) {
        const { data, error: uploadError } = await supabase.storage.from('gallery-images').upload(`gallery/${Date.now()}`, newGalleryItem.file);
        if (uploadError) throw uploadError;
        const { data: publicURLData } = supabase.storage.from('gallery-images').getPublicUrl(data.path);
        imageUrl = publicURLData.publicUrl;
      }
      
      const { error: insertError } = await supabase.from('gallery').insert([{
        description: newGalleryItem.description,
        date: newGalleryItem.date,
        time: newGalleryItem.time,
        image_url: imageUrl
      }]);
      if (insertError) throw insertError;
      
      setNewGalleryItem({ description: '', date: '', time: '', file: null, url: '' });
      toast.success('Gallery item uploaded successfully.');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Gallery upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // State to hold draft responses
  const [intentionResponses, setIntentionResponses] = useState<Record<string, string>>({});

  const handleRespondIntention = async (id: string) => {
    if (!supabase) return;
    const responseText = intentionResponses[id];
    if (!responseText) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.from('intentions').update({
        status: 'responded',
        response_text: responseText,
        responded_at: new Date().toISOString()
      }).eq('id', id);
      
      if (error) throw error;
      // Clear input
      setIntentionResponses(prev => ({ ...prev, [id]: '' }));
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to send response: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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
        className="glass-panel w-full h-full max-w-7xl rounded-md relative z-10 flex flex-col md:flex-row overflow-hidden shadow-2xl border-white/5"
      >
        <div className="specular-highlight rounded-md" />

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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-5 text-center text-lg focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/10 tracking-[0.5em]"
                  />
                </div>
                {authError && <p className="text-red-500 text-[10px] uppercase tracking-widest font-bold">{authError}</p>}
                <button type="submit" className="w-full glass-panel py-5 rounded-lg text-[11px] uppercase tracking-[0.3em] font-bold bg-white/5 hover:bg-accent-blue hover:text-pure-black transition-all">
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
                  { id: 'events', icon: Calendar, label: 'Events' },
                  { id: 'sermons', icon: Video, label: 'Sermons' },
                  { id: 'intentions', icon: MessageSquare, label: 'Intentions' },
                  { id: 'site_settings', icon: Edit, label: 'Hero & History' },
                  { id: 'gallery', icon: ImageIcon, label: 'Event Gallery' },
                  { id: 'profile', icon: User, label: 'Admin Profile' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-lg text-[11px] uppercase tracking-widest font-medium transition-all ${
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
                <button onClick={onClose} className="w-full glass-panel py-4 rounded-md text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-white/10 transition-colors">
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
                    {/* Header area now just title/desc */}
                  </header>

                  <div className="flex-1">
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                          { label: 'Sermon Archive', value: stats.sermons.toLocaleString(), delta: 'Sanctuary Library', icon: Video },
                          { label: 'Prayer Intentions', value: stats.intentions.toLocaleString(), delta: 'Spiritual Outreach', icon: MessageSquare },
                          { label: 'Liturgical Events', value: stats.events.toLocaleString(), delta: 'Parish Life', icon: Calendar },
                        ].map((stat, i) => (
                          <div key={i} className="glass-panel p-8 rounded-2xl relative">
                            <stat.icon className="w-8 h-8 text-accent-blue/40 absolute top-8 right-8" />
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-4">{stat.label}</p>
                            <h3 className="text-5xl font-serif mb-2">{stat.value}</h3>
                            <p className="text-[10px] tracking-widest text-accent-blue font-bold">{stat.delta}</p>
                          </div>
                        ))}
                        
                        <div className="md:col-span-3 glass-panel p-8 rounded-2xl mt-8 min-h-[300px]">
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
                         {/* Create Event Form */}
                         <form onSubmit={handleCreateEvent} className="glass-panel p-8 rounded-lg border-accent-blue/10 bg-accent-blue/5">
                            <h4 className="text-lg font-serif mb-6">Edit Liturgical Event</h4>
                             <div className="grid md:grid-cols-2 gap-6">
                               <div className="space-y-3">
                                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Event Title</label>
                                  <input 
                                    required
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-md px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50" 
                                    placeholder="Easter Vigil" 
                                  />
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Event Date</label>
                                  <input 
                                    required
                                    type="date"
                                    value={newEvent.date}
                                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-md px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50" 
                                  />
                               </div>
                               <div className="space-y-3 md:col-span-2">
                                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Description</label>
                                  <textarea 
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-md px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 resize-none h-24" 
                                    placeholder="Brief description of the event..." 
                                  />
                               </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                               {(newEvent as any).id && (
                                 <button 
                                   type="button" 
                                   onClick={() => setNewEvent({ title: '', date: '', description: '', category: 'Worship' })}
                                   className="glass-panel px-10 py-4 rounded-md text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-all font-sans"
                                 >
                                    Cancel
                                 </button>
                               )}
                               <button disabled={loading} type="submit" className="glass-panel px-10 py-4 rounded-md text-[10px] uppercase tracking-widest font-bold hover:bg-accent-blue hover:text-pure-black transition-all">
                                 {(newEvent as any).id ? 'Update Event' : 'Publish Event'}
                               </button>
                            </div>
                         </form>

                         <div className="grid gap-6 mt-8">
                           {events.map(event => (
                             <div key={event.id} className="glass-panel p-6 rounded-lg flex items-center gap-6 group hover:bg-white/[0.03] transition-colors">
                               <div className="w-24 h-24 bg-white/5 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 border border-white/5">
                                 {event.image_url ? (
                                   <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                                 ) : (
                                   <ImageIcon className="w-6 h-6 text-white/10" />
                                 )}
                               </div>
                               <div className="flex-1">
                                  <h4 className="text-lg font-serif mb-1">{event.title}</h4>
                                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">{new Date(event.date).toLocaleDateString()} • {event.category}</p>
                                  <div className="flex gap-2">
                                     <button 
                                       onClick={() => {
                                          setNewEvent({ ...event });
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                       }}
                                       className="text-[9px] uppercase tracking-widest font-bold text-accent-blue hover:underline cursor-pointer"
                                     >
                                       Edit Content
                                     </button>
                                     <span className="text-white/10 px-2">•</span>
                                     <button className="text-[9px] uppercase tracking-widest font-bold text-accent-blue hover:underline cursor-pointer">Gallery</button>
                                  </div>
                               </div>
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => handleDeleteEvent(event.id)} className="p-3 text-white/20 hover:text-red-500 transition-colors">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                             </div>
                           ))}
                           {events.length === 0 && <p className="text-center text-white/40 py-8 italic">No upcoming events scheduled.</p>}
                         </div>
                      </div>
                    )}

                    {activeTab === 'sermons' && (
                      <div className="space-y-8">
                         <form onSubmit={handleCreateSermon} className="glass-panel p-8 rounded-lg border-accent-blue/10 bg-accent-blue/5">
                            <h4 className="text-lg font-serif mb-6">Edit Sermon Record</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                               <div className="space-y-3 md:col-span-2">
                                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Video Title</label>
                                  <input 
                                    required
                                    value={newSermon.title}
                                    onChange={e => setNewSermon({...newSermon, title: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-md px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50" 
                                    placeholder="The Path to Clarity" 
                                  />
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Speaker / Clergy</label>
                                  <input 
                                    value={newSermon.speaker || ''}
                                    onChange={e => setNewSermon({...newSermon, speaker: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-md px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50" 
                                    placeholder="e.g., Bishop Thomas" 
                                  />
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Date Delivered</label>
                                  <input 
                                    type="date"
                                    value={newSermon.date || ''}
                                    onChange={e => setNewSermon({...newSermon, date: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-md px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 [&::-webkit-calendar-picker-indicator]:invert" 
                                  />
                               </div>
                               <div className="space-y-3 md:col-span-2">
                                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Video Source</label>
                                  <select 
                                    value={newSermon.type}
                                    onChange={e => setNewSermon({...newSermon, type: e.target.value as 'link' | 'local'})}
                                    className="w-full bg-white/5 border border-white/10 rounded-md px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 [&>option]:bg-pure-black"
                                  >
                                    <option value="link">External Link (YouTube/Vimeo)</option>
                                    <option value="local">Direct Video Upload</option>
                                  </select>
                               </div>
                               <div className="space-y-3 md:col-span-2">
                                  {newSermon.type === 'link' ? (
                                    <>
                                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Source Link</label>
                                      <input 
                                        required={newSermon.type === 'link'}
                                        value={newSermon.url}
                                        onChange={e => setNewSermon({...newSermon, url: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50" 
                                        placeholder="https://youtube.com/watch?v=..." 
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Upload MP4 Video</label>
                                      <input 
                                        type="file"
                                        accept="video/mp4,video/x-m4v,video/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file || !supabase) return;
                                          try {
                                            setLoading(true);
                                            // Make sure we have a unique path
                                            const fileExt = file.name.split('.').pop();
                                            const filePath = `sermons/${Date.now()}-${Math.random()}.${fileExt}`;
                                            
                                            // Using the 'avatars' storage bucket since we know it exists (User profile uses it)
                                            // You can change this if there's a dedicated video bucket
                                            const { error: uploadError } = await supabase.storage
                                              .from('avatars')
                                              .upload(filePath, file);

                                            if (uploadError) throw uploadError;

                                            const { data: { publicUrl } } = supabase.storage
                                              .from('avatars')
                                              .getPublicUrl(filePath);

                                            setNewSermon({...newSermon, url: publicUrl});
                                          } catch (error: any) {
                                            console.error("Upload failed", error);
                                            alert("Upload failed: " + error.message);
                                          } finally {
                                            setLoading(false);
                                          }
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-semibold file:bg-accent-blue file:text-pure-black hover:file:bg-accent-blue/80" 
                                      />
                                      {newSermon.url && newSermon.type === 'local' && (
                                        <p className="text-[10px] text-green-400 mt-2">Video uploaded successfully!</p>
                                      )}
                                    </>
                                  )}
                               </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                               {(newSermon as any).id && (
                                 <button 
                                   type="button" 
                                   onClick={() => setNewSermon({ title: '', speaker: '', date: '', url: '', type: 'link' })}
                                   className="glass-panel px-10 py-4 rounded-md text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-all font-sans"
                                 >
                                    Cancel
                                 </button>
                               )}
                               <button disabled={loading || (!newSermon.url && newSermon.type === 'local')} type="submit" className="glass-panel px-10 py-4 rounded-md text-[10px] uppercase tracking-widest font-bold hover:bg-accent-blue hover:text-pure-black transition-all disabled:opacity-50">
                                 {(newSermon as any).id ? 'Update Video' : 'Publish Video'}
                               </button>
                            </div>
                         </form>

                         <div className="grid gap-6 mt-8">
                           {sermons.map(sermon => (
                             <div key={sermon.id} className="glass-panel p-6 rounded-lg flex items-center justify-between group hover:bg-white/[0.03] transition-colors">
                               <div>
                                  <h4 className="text-lg font-serif mb-1">{sermon.title}</h4>
                                  <p className="text-[10px] uppercase tracking-widest text-white/40">
                                    {sermon.speaker} • {new Date(sermon.date).toLocaleDateString()}
                                  </p>
                               </div>
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => {
                                   setNewSermon({
                                     ...sermon,
                                     url: sermon.video_url,
                                     type: sermon.video_type || 'link'
                                   });
                                   window.scrollTo({ top: 0, behavior: 'smooth' });
                                 }} className="p-3 text-white/20 hover:text-accent-blue transition-colors">
                                   <Edit className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => handleDeleteSermon(sermon.id)} className="p-3 text-white/20 hover:text-red-500 transition-colors">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                             </div>
                           ))}
                           {sermons.length === 0 && <p className="text-center text-white/40 py-8 italic">No sermons archived yet.</p>}
                         </div>
                      </div>
                    )}

                    {activeTab === 'intentions' && (
                      <div className="space-y-6">
                        {intentions.map(intention => (
                          <div key={intention.id} className="glass-panel p-8 rounded-2xl relative group">
                            <div className="flex justify-between items-start mb-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue text-xs font-bold font-serif">
                                    {(intention.profiles?.full_name || 'A')[0].toUpperCase()}
                                  </div>
                                  <div>
                                     <p className="text-sm font-serif">{intention.profiles?.full_name || 'Anonymous Soul'}</p>
                                     {intention.profiles?.email && (
                                       <p className="text-[9px] uppercase tracking-widest text-white/30">{intention.profiles.email}</p>
                                     )}
                                  </div>
                               </div>
                               <span className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-bold ${
                                 intention.status === 'responded' 
                                 ? 'bg-green-500/10 text-green-400' 
                                 : 'bg-accent-blue/10 text-accent-blue'
                               }`}>
                                 {intention.status === 'responded' ? 'Followed Up' : 'Pending Response'}
                               </span>
                            </div>
                            <p className="text-sm text-pure-white/80 leading-relaxed italic border-l-2 border-accent-blue/20 pl-6 mb-8">
                               "{intention.message}"
                            </p>

                            {intention.status === 'responded' ? (
                              <div className="border-t border-white/5 pt-6">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Cathedral Response ({new Date(intention.responded_at).toLocaleDateString()})</p>
                                <p className="text-sm text-accent-blue">{intention.response_text}</p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                                 <input 
                                   value={intentionResponses[intention.id] || ''}
                                   onChange={e => setIntentionResponses({...intentionResponses, [intention.id]: e.target.value})}
                                   className="flex-1 bg-white/5 border border-white/10 rounded-md px-6 py-3 text-xs focus:outline-none focus:border-accent-blue/30" 
                                   placeholder="Type an encouraging response from the cathedral..." 
                                 />
                                 <button 
                                   onClick={() => handleRespondIntention(intention.id)}
                                   disabled={loading || !intentionResponses[intention.id]}
                                   className="glass-panel p-3 rounded-md hover:bg-accent-blue hover:text-pure-black transition-all disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-white"
                                 >
                                    <Check className="w-4 h-4" />
                                 </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {intentions.length === 0 && <p className="text-center text-white/40 py-8 italic">No prayer intentions submitted.</p>}
                      </div>
                    )}

                    {activeTab === 'site_settings' && (
                      <div className="glass-panel p-8 rounded-lg space-y-8">
                        <h4 className="text-lg font-serif">Hero Section & History Image</h4>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Hero Image</label>
                                <input type="file" onChange={(e) => setSiteSettings(prev => ({...prev, heroFile: e.target.files?.[0] || null}))} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-xs" />
                                <input type="text" onChange={(e) => setSiteSettings(prev => ({...prev, heroUrl: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-xs" placeholder="OR Enter Image URL" />
                                <button onClick={() => handleUpdateSiteSettings('hero', siteSettings.heroFile, siteSettings.heroUrl)} disabled={loading} className="glass-panel w-full py-3 rounded-md text-[10px] uppercase font-bold hover:bg-white/10 transition-colors disabled:opacity-50">Save Hero</button>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] uppercase tracking-widest text-white/40 font-bold">History Image</label>
                                <input type="file" onChange={(e) => setSiteSettings(prev => ({...prev, historyFile: e.target.files?.[0] || null}))} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-xs" />
                                <input type="text" onChange={(e) => setSiteSettings(prev => ({...prev, historyUrl: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-xs" placeholder="OR Enter Image URL" />
                                <button onClick={() => handleUpdateSiteSettings('history', siteSettings.historyFile, siteSettings.historyUrl)} disabled={loading} className="glass-panel w-full py-3 rounded-md text-[10px] uppercase font-bold hover:bg-white/10 transition-colors disabled:opacity-50">Save History</button>
                            </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'gallery' && (
                      <form onSubmit={handleUploadGalleryItem} className="glass-panel p-8 rounded-lg space-y-8">
                        <h4 className="text-lg font-serif">Event Gallery</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                           <input type="text" value={newGalleryItem.description} onChange={e => setNewGalleryItem({...newGalleryItem, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-xs" placeholder="Description" required />
                           <input type="date" value={newGalleryItem.date} onChange={e => setNewGalleryItem({...newGalleryItem, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-xs" required />
                           <input type="time" value={newGalleryItem.time} onChange={e => setNewGalleryItem({...newGalleryItem, time: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-xs" required />
                           <input type="file" onChange={e => setNewGalleryItem({...newGalleryItem, file: e.target.files?.[0] || null})} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-xs" />
                           <input type="text" value={newGalleryItem.url} onChange={e => setNewGalleryItem({...newGalleryItem, url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-xs" placeholder="OR Image URL" />
                        </div>
                         <button type="submit" disabled={loading} className="glass-panel w-full py-4 rounded-md text-[10px] uppercase font-bold hover:bg-white/10 transition-colors disabled:opacity-50">
                             {loading ? 'Uploading...' : 'Upload Event Image'}
                         </button>
                      </form>
                    )}

                    {activeTab === 'profile' && (
                       <div className="max-w-2xl mx-auto py-12 text-center">
                          <h4 className="text-2xl font-serif mb-8">Administrator Privileges</h4>
                          <div className="glass-panel p-12 rounded-[32px] relative overflow-hidden">
                             <div className="specular-highlight rounded-[32px]" />
                             <div className="w-24 h-24 rounded-full glass-panel mx-auto mb-8 flex items-center justify-center border-accent-blue/20">
                                <ShieldCheck className="w-10 h-10 text-accent-blue" />
                             </div>
                             <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent-blue mb-4">Level 1 Administrator</p>
                             <h3 className="text-3xl font-serif mb-8">{profile?.full_name}</h3>
                             
                             <div className="space-y-4 text-left">
                                <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                                   <span className="text-[10px] uppercase tracking-widest text-white/40">2FA Status</span>
                                   <span className="text-[10px] uppercase tracking-widest font-bold text-green-500">Active</span>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
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
