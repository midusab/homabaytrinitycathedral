/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'motion/react';
import { 
  Heart, 
  MessageSquare,
  Cross as CrossIcon, 
  MapPin as MapPinIcon, 
  Phone as PhoneIcon, 
  Calendar as CalendarIcon, 
  Menu as MenuIcon, 
  X as XIcon,
  ChevronRight as ChevronRightIcon,
  Play as PlayIcon,
  Share2 as Share2Icon,
  Bookmark as BookmarkIcon,
  Sparkles as SparklesIcon,
  Search as SearchIcon,
  Lock as LockIcon,
  Loader2
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { AdminDashboard } from './components/AdminDashboard';
import { Logo } from './components/Logo';
import { User as UserIcon } from 'lucide-react';

const MASS_TIMES = [
  { day: 'Sunday', time: '8:00 AM', location: 'Main Sanctuary', type: 'Low Mass' },
  { day: 'Sunday', time: '10:30 AM', location: 'Main Sanctuary', type: 'High Choral' },
  { day: 'Sunday', time: '5:30 PM', location: 'Lady Chapel', type: 'Vespers' },
  { day: 'Mon - Fri', time: '12:10 PM', location: 'Daily Chapel', type: 'Daily Mass' },
  { day: 'Saturday', time: '5:00 PM', location: 'Vigil Chapel', type: 'Vigil Mass' },
];

const MILESTONES = [
  { year: '1892', event: 'Foundation Stone Laid', desc: 'Designed by renowned architect Thomas J. Thorne in the Neo-Gothic style.' },
  { year: '1924', event: 'Great Organ Install', desc: 'The historic 4,500-pipe organ was consecrated, becoming a landmark of sacred music.' },
  { year: '1962', event: 'Cathedral Status', desc: 'Elevated to the Mother Church of the Diocese, serving as a center for liturgical life.' },
  { year: '2015', event: 'Grand Restoration', desc: 'A five-year project to restore the intricate stained glass and vaulted ceilings.' },
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [intentionMessage, setIntentionMessage] = useState('');
  const [intentionSubmitting, setIntentionSubmitting] = useState(false);
  const [intentionSuccess, setIntentionSuccess] = useState(false);
  const [intentionError, setIntentionError] = useState('');
  const [activeVideoSermon, setActiveVideoSermon] = useState<any>(null);
  const { user, profile, signOut } = useAuth();
  
  // Handle keyboard events (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsAuthModalOpen(false);
        setIsProfileOpen(false);
        setIsAdminOpen(false);
        setActiveVideoSermon(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);
  const heroBlur = useTransform(scrollYProgress, [0, 0.3], [0, 10]);
  const heroFilter = useTransform(heroBlur, (v) => `blur(${v}px)`);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [liveSermons, setLiveSermons] = useState<any[]>([]);
  const [liveIntentions, setLiveIntentions] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);

  // Real-time synchronization for public data
  useEffect(() => {
    if (!supabase) return;

    const fetchPublicData = async () => {
      try {
        const [
          { data: eData },
          { data: sData },
          { data: iData },
          { data: ssData },
          { data: gData }
        ] = await Promise.all([
          supabase.from('events').select('*').order('date', { ascending: true }).limit(5),
          supabase.from('sermons').select('*').order('date', { ascending: false }).limit(4),
          supabase.from('intentions').select('message, created_at, profiles(full_name)').order('created_at', { ascending: false }).limit(6),
          supabase.from('site_settings').select('*').eq('id', 1).single(),
          supabase.from('gallery').select('*').order('created_at', { ascending: false })
        ]);

        if (eData) setLiveEvents(eData);
        if (sData) setLiveSermons(sData);
        if (iData) setLiveIntentions(iData);
        if (ssData) setSiteSettings(ssData);
        if (gData) setGalleryItems(gData);
      } catch (err) {
        console.error('Error fetching public data:', err);
      }
    };

    fetchPublicData();

    // Subscribe to all updates to automatically refetch
    const pubSubscription = supabase.channel('public-data-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchPublicData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sermons' }, fetchPublicData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'intentions' }, fetchPublicData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, fetchPublicData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, fetchPublicData)
      .subscribe();

    return () => {
      supabase.removeChannel(pubSubscription);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmitIntention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;
    if (!intentionMessage.trim()) {
      setIntentionError('Please share your prayer intention.');
      return;
    }

    setIntentionSubmitting(true);
    setIntentionError('');
    setIntentionSuccess(false);

    try {
      const { error } = await supabase.from('intentions').insert([
        { 
          user_id: user.id, 
          message: intentionMessage.trim(),
          status: 'pending'
        }
      ]);
      if (error) throw error;
      setIntentionSuccess(true);
      setIntentionMessage('');
      setTimeout(() => setIntentionSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setIntentionError(err.message || 'Failed to submit intention. Please try again.');
    } finally {
      setIntentionSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-pure-black selection:bg-accent-blue selection:text-pure-black">
      {/* Skip to context for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-accent-blue focus:text-pure-black focus:rounded-full focus:font-bold focus:uppercase focus:tracking-widest transition-all"
      >
        Skip to main content
      </a>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-accent-blue z-[100] origin-left"
        style={{ scaleX }}
      />
      {/* Liquid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="liquid-blob w-[600px] h-[600px] bg-premium-blue top-[-100px] left-[-100px] scale-150 animate-blob-float" style={{ animationDelay: '0s' }} />
        <div className="liquid-blob w-[500px] h-[500px] bg-ethereal-blue bottom-[-100px] right-[-100px] animate-blob-float" style={{ animationDelay: '-5s' }} />
        <div className="liquid-blob w-[400px] h-[400px] bg-premium-blue top-[30%] right-[10%] opacity-20 animate-blob-float" style={{ animationDelay: '-10s' }} />
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-700 ${scrolled ? 'py-4' : 'py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3">
            <div className="specular-highlight rounded-full" />
            <Logo size={24} />
            <span className="font-serif text-xl tracking-tight text-pure-white/90">Trinity</span>
          </div>

          <nav className="hidden lg:flex items-center gap-2" aria-label="Desktop navigation">
            <div className="glass-panel px-10 py-3 rounded-full flex gap-10">
              <div className="specular-highlight rounded-full" />
              <ul className="flex gap-10 list-none m-0 p-0">
                {['Sermons', 'Events', 'Liturgies', 'Gallery', 'Prayer', 'History', 'Contact'].map((item) => (
                  <li key={item}>
                    <a 
                      href={`#${item.toLowerCase()}`}
                      className="text-xs font-sans tracking-[0.2em] uppercase text-white/60 hover:text-white focus-visible:text-accent-blue focus-visible:outline-none transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <button 
              aria-label="Search site"
              className="glass-panel w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 focus-visible:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 transition-colors"
            >
              <SearchIcon className="w-4 h-4 text-white/70" />
            </button>
            
            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  aria-label="View Sanctuary Profile"
                  className="glass-panel p-1 pr-6 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 focus-visible:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden glass-panel border border-white/10 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-accent-blue" />
                    )}
                  </div>
                  Profile
                </button>
                <button 
                  onClick={() => signOut()}
                  className="glass-panel px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 focus-visible:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="glass-panel px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold bg-accent-blue/10 hover:bg-accent-blue hover:text-pure-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue transition-all"
              >
                Sign In
              </button>
            )}
          </nav>

          <button 
            className="lg:hidden glass-panel w-12 h-12 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <main id="main-content" className="relative z-10 pt-32 pb-24" tabIndex={-1}>
        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-8 mb-32 group">
          {/* Background Highlight */}
          <motion.div 
            style={{ y: heroY, opacity: heroOpacity, scale: heroScale, filter: heroFilter }}
            className="absolute inset-0 -mx-8 lg:-mx-24 -z-10 overflow-hidden rounded-[48px]"
          >
            <div className="absolute inset-0 bg-pure-black/60 backdrop-blur-[2px] z-10" />
            <motion.img 
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              src={siteSettings?.hero_image_url || "https://images.unsplash.com/photo-1548003929-79885acc5593?q=80&w=2000&auto=format&fit=crop"} 
              alt="Cathedral Interior Background" 
              className="w-full h-full object-cover filter brightness-50 contrast-125"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-pure-black via-pure-black/50 to-transparent z-20" />
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-12 items-center py-16 lg:py-24 relative">
            <motion.div 
              className="lg:col-span-12 xl:col-span-7"
              style={{ x: mousePosition.x * -0.5, y: mousePosition.y * -0.5 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <span className="w-12 h-[1px] bg-accent-blue/50" />
                  <span className="text-accent-blue font-sans uppercase tracking-[0.4em] text-[10px] font-bold">Est. 1892 • Los Angeles</span>
                </div>
                <h1 className="text-6xl md:text-9xl font-serif text-white leading-[1] mb-12 text-glow">
                  Sacred Space. <br />
                  <span className="italic font-light text-white/70">Modern Faith.</span>
                </h1>
                <div className="flex flex-wrap gap-8">
                  <button className="group relative glass-panel pl-12 pr-10 py-6 rounded-full text-sm font-sans uppercase tracking-[0.3em] font-bold overflow-hidden transition-all hover:scale-105 active:scale-95 bg-white/5 border-white/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex items-center gap-4">
                      <span>Enter the Sanctuary</span>
                      <ChevronRightIcon className="w-5 h-5 text-accent-blue group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                  <button className="flex items-center gap-6 group">
                    <div className="glass-panel w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-accent-blue transition-all duration-500 shadow-xl shadow-accent-blue/10">
                      <PlayIcon className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.3em] font-bold opacity-60 group-hover:opacity-100 transition-opacity">Watch Latest Mass</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="hidden xl:block xl:col-span-5"
              style={{ x: mousePosition.x, y: mousePosition.y }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative"
              >
                <div className="glass-panel p-2 rounded-[32px] overflow-hidden">
                  <div className="specular-highlight rounded-[32px]" />
                  <div className="aspect-[4/5] rounded-[28px] overflow-hidden relative">
                    <img 
                      src="https://images.unsplash.com/photo-1548696444-12347de5fd04?q=80&w=1200&auto=format&fit=crop" 
                      alt="Trinity Cathedral Altar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pure-black/80 via-transparent to-transparent" />
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -bottom-6 -left-6 glass-panel p-4 rounded-lg flex items-center gap-3 backdrop-blur-xl border-white/20">
                  <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div className="pr-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Next Choral Mass</p>
                    <p className="font-serif text-sm">Sunday, 10:30 AM</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Mass Times Section */}
        <section id="liturgies" className="relative max-w-7xl mx-auto px-8 mb-32 overflow-hidden py-12">
          {/* Subtle Background Visual */}
          <div className="absolute inset-0 -z-10 opacity-[0.03] scale-150 rotate-12">
            <CrossIcon className="w-full h-full text-white" strokeWidth={0.5} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-serif mb-2 text-glow">Sacred Liturgy</h2>
              <p className="text-sm text-white/40 font-sans tracking-wide max-w-md">The source and summit of our faith. Join us in worship across our sacred chapels.</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-4"
            >
              <div className="glass-panel px-6 py-3 rounded-lg flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Confessions: Sat 3:30 PM</span>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {MASS_TIMES.map((mass, i) => (
              <motion.div
                key={`${mass.day}-${mass.time}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -12, scale: 1.02 }}
                transition={{ 
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                viewport={{ once: true }}
                className="glass-panel p-6 rounded-xl group hover:bg-white/10 transition-all text-center cursor-default shadow-xl shadow-black/20"
              >
                <div className="specular-highlight rounded-xl" />
                <div className="text-accent-blue mb-4 flex justify-center">
                  <div className="w-10 h-10 glass-panel rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 opacity-70" />
                  </div>
                </div>
                <h3 className="text-[10px] font-sans uppercase tracking-[0.3em] font-bold text-white/40 mb-3">{mass.day}</h3>
                <div className="text-2xl font-serif mb-1">{mass.time}</div>
                <div className="text-[11px] italic text-accent-blue mb-6">{mass.type}</div>
                <div className="flex items-center justify-center gap-2 text-white/30 text-[10px] uppercase tracking-wider mt-auto pt-4 border-t border-white/5 font-medium">
                  <MapPinIcon className="w-3 h-3" />
                  {mass.location}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Cinematic Sanctuary Visual */}
        <section className="relative h-[60vh] mb-32 overflow-hidden mx-8 rounded-[48px]">
          <motion.div
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            <img 
              src="https://images.unsplash.com/photo-1548656549-92f5920d357b?q=80&w=2000&auto=format&fit=crop" 
              alt="Cathedral Dome" 
              className="w-full h-full object-cover grayscale opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-pure-black via-transparent to-pure-black" />
          </motion.div>
          <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="glass-panel px-12 py-10 rounded-[28px]"
            >
              <div className="specular-highlight rounded-[28px]" />
              <h2 className="text-4xl md:text-6xl font-serif mb-6 italic">A Prayer in Stone</h2>
              <p className="text-pure-white/40 max-w-xl mx-auto font-sans tracking-widest text-xs uppercase leading-loose">
                Every arch, every window, every shadow is designed to lift the soul toward the infinite. 
                Experience the hushed majesty of Trinity.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Prayer Intentions Section */}
        <section id="prayer" className="max-w-7xl mx-auto px-8 mb-32">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-12 xl:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-[1px] bg-accent-blue/50" />
                  <span className="text-accent-blue font-sans uppercase tracking-[0.4em] text-[10px] font-bold">Spiritual Communion</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif mb-8 text-glow">Sacred <br /> <span className="italic font-light">Intentions.</span></h2>
                <p className="text-pure-white/50 leading-relaxed mb-12 font-sans">
                  The Cathedral family is here to carry your burdens in prayer. Submit your intentions to be shared with our clergy or displayed on our community board.
                </p>
                <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                  <div className="specular-highlight rounded-2xl" />
                  <h4 className="font-serif text-xl mb-6">Submit an Intention</h4>
                  {user ? (
                    <form onSubmit={handleSubmitIntention} className="space-y-4">
                      {intentionSuccess ? (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg text-sm mb-4 text-center">
                          Your intention has been submitted to the clergy.
                        </div>
                      ) : (
                        <>
                          <input 
                            type="text" 
                            disabled
                            value={profile?.full_name || user.email || 'Anonymous Parisher'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 text-sm focus:outline-none transition-all text-white/50 cursor-not-allowed"
                          />
                          <textarea 
                            rows={4}
                            value={intentionMessage}
                            onChange={(e) => setIntentionMessage(e.target.value)}
                            placeholder="Your prayer intention..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 transition-all placeholder:text-white/20 resize-none"
                          ></textarea>
                          
                          {intentionError && <p className="text-red-400 text-xs px-2">{intentionError}</p>}
                          
                          <div className="flex items-center gap-4 mb-4">
                            <input type="checkbox" id="public" className="rounded bg-white/5 border-white/10 text-accent-blue focus:ring-0" />
                            <label htmlFor="public" className="text-[10px] uppercase tracking-widest text-white/40">Share on Community Board</label>
                          </div>
                          
                          <button 
                            type="submit"
                            disabled={intentionSubmitting}
                            className="w-full glass-panel py-4 rounded-lg text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-accent-blue hover:text-pure-black transition-all flex items-center justify-center gap-2"
                          >
                            {intentionSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Light a Virtual Candle</span>}
                          </button>
                        </>
                      )}
                    </form>
                  ) : (
                    <div className="py-8 text-center">
                      <LockIcon className="w-10 h-10 text-accent-blue/20 mx-auto mb-4" />
                      <p className="text-pure-white/40 text-xs uppercase tracking-widest mb-6 px-4">Sign in to share your intention with our community</p>
                      <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="w-full glass-panel py-4 rounded-lg text-[10px] uppercase tracking-[0.3em] font-bold bg-white/5 hover:bg-accent-blue hover:text-pure-black transition-all"
                      >
                        Sign In to Submit
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {liveIntentions.length > 0 && (
              <div className="lg:col-span-12 xl:col-span-8">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-2xl font-serif italic text-pure-white/70">Community Prayer Board</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                    <span className="text-[10px] tracking-widest uppercase text-white/40 font-bold">Live Support</span>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {liveIntentions.map((prayer, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                      className="glass-panel p-8 rounded-xl hover:bg-white/5 transition-all group"
                    >
                      <div className="specular-highlight rounded-xl" />
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-accent-blue group-hover:scale-110 transition-transform">
                            <Heart className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-serif italic text-pure-white/80">{prayer.profiles?.full_name || 'Anonymous Soul'}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">{new Date(prayer.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-pure-white/50 leading-relaxed italic">
                        "{prayer.message}"
                      </p>
                      <div className="mt-8 flex justify-end">
                        <button className="text-[10px] uppercase tracking-widest text-accent-blue/60 hover:text-accent-blue flex items-center gap-2 transition-colors">
                          <MessageSquare className="w-3 h-3" /> Lift in Prayer
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Heritage & History Section */}
        <section id="history" className="max-w-7xl mx-auto px-8 mb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-serif mb-8 text-glow">Heritage & <br /> <span className="italic font-light">Sacred Architecture.</span></h2>
              <p className="text-white/50 leading-relaxed mb-12 font-sans">
                Trinity Cathedral stands as a testament to the enduring faith of generations. 
                Built in 1892, our sanctuary combines Northern European Gothic architecture 
                with light-filled Californian influences, creating a space where the 
                eternal and the contemporary meet.
              </p>
              
              <div className="grid gap-6">
                {MILESTONES.map((stone, i) => (
                  <motion.div 
                    key={stone.year}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="glass-panel p-6 rounded-lg flex gap-6 items-start hover:bg-white/5 transition-colors"
                  >
                    <div className="text-2xl font-serif text-accent-blue font-bold">{stone.year}</div>
                    <div>
                      <h4 className="font-serif text-xl mb-1">{stone.event}</h4>
                      <p className="text-xs text-white/40 leading-relaxed">{stone.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="glass-panel p-3 rounded-[28px]"
              >
                <div className="specular-highlight rounded-[28px]" />
                <img 
                  src={siteSettings?.history_image_url || "https://images.unsplash.com/photo-1543002588-b974596e744f?w=1200&auto=format&fit=crop"} 
                  alt="Trinity Cathedral History" 
                  className="rounded-2xl w-full h-[600px] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pure-black/60 to-transparent rounded-[28px]" />
                
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="glass-panel p-8 rounded-2xl backdrop-blur-2xl">
                    <h5 className="font-serif text-2xl mb-2 italic">Architecture of Light</h5>
                    <p className="text-xs text-white/60 leading-relaxed text-glow">
                      "The cathedral is a prayer written in stone and light, where 
                      every arch reaches toward the infinite."
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Sacred Gallery Section */}
        {galleryItems.length > 0 && (
          <section id="gallery" className="max-w-7xl mx-auto px-8 mb-32">
            <div className="flex flex-col items-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif mb-4 text-glow text-center">Sacred Gallery</h2>
              <div className="w-24 h-[1px] bg-accent-blue/50 mb-6" />
              <p className="text-sm text-white/40 font-sans tracking-wide text-center max-w-xl">
                A visual journey through the stone, light, and spirit of Trinity Cathedral. 
                Witness the intersection of divine inspiration and architectural mastery.
              </p>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {galleryItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative group break-inside-avoid"
                >
                  <div className="glass-panel p-2 rounded-2xl overflow-hidden transition-all duration-500 group-hover:bg-white/10">
                    <div className="specular-highlight rounded-2xl" />
                    <img 
                      src={item.image_url} 
                      alt={item.description}
                      className="w-full rounded-xl object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pure-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                    
                    <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <p className="font-serif text-lg italic text-white/90">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-12 gap-12">
          
          {/* Upcoming Sermons */}
          {liveSermons.length > 0 && (
            <section id="sermons" className="lg:col-span-8">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-3xl font-serif mb-2">Sermon Archive</h2>
                  <p className="text-sm text-pure-white/40 font-sans tracking-wide">Exploring the Gospel in a contemporary world.</p>
                </div>
                <button className="text-xs uppercase tracking-tighter text-accent-blue font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">
                  Archive <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {liveSermons.map((sermon, i) => (
                  <motion.div
                    key={sermon.id || sermon.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="glass-panel group p-1 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setActiveVideoSermon(sermon)}
                  >
                    <div className="specular-highlight rounded-2xl" />
                    <div className="flex flex-col md:flex-row gap-6 p-4">
                      <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden relative border border-white/5 bg-white/5 flex items-center justify-center">
                        {sermon.thumbnail ? (
                          <>
                            <img src={sermon.thumbnail} alt={sermon.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-premium-blue/30 mix-blend-multiply" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-pure-white bg-black/40 backdrop-blur-md">
                                <PlayIcon className="w-5 h-5 ml-1" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="group-hover:scale-110 transition-transform flex items-center justify-center w-12 h-12 rounded-full glass-panel bg-black/40 backdrop-blur-md">
                            <PlayIcon className="w-5 h-5 text-pure-white ml-1" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 py-2 pr-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-sans uppercase tracking-widest text-accent-blue mb-2 block">{sermon.tag || 'Sermon'}</span>
                          <h3 className="text-2xl font-serif mb-2">{sermon.title}</h3>
                          <p className="text-sm text-pure-white/50">{sermon.speaker}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-[10px] font-sans text-pure-white/30 uppercase tracking-widest">
                            {new Date(sermon.date).toLocaleDateString()}
                          </span>
                          <div className="flex gap-4">
                            <button className="text-pure-white/30 hover:text-pure-white transition-colors"><BookmarkIcon className="w-4 h-4" /></button>
                            <button className="text-pure-white/30 hover:text-pure-white transition-colors"><Share2Icon className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Community Events */}
          {liveEvents.length > 0 && (
            <section id="events" className="lg:col-span-4">
              <div className="glass-panel rounded-[28px] h-full p-10 flex flex-col relative overflow-hidden">
                <div className="specular-highlight rounded-[28px]" />
                
                {/* Decorative Header Image */}
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-20 pointer-events-none">
                  <img 
                    src="https://images.unsplash.com/photo-1590059393160-c3227976e196?q=80&w=400&auto=format&fit=crop" 
                    alt="Stone Carving Detail" 
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex items-center gap-4 mb-12 relative z-10">
                  <SparklesIcon className="w-6 h-6 text-accent-blue" />
                  <h2 className="text-3xl font-serif">Communion</h2>
                </div>

                <div className="space-y-12 flex-1">
                  {liveEvents.map((event, i) => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      viewport={{ once: true }}
                      className="relative"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-accent-blue">{event.category}</span>
                        <span className="text-[10px] font-sans text-white/40">{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xl font-serif mb-3 hover:text-accent-blue cursor-pointer transition-colors">{event.title}</h4>
                      <p className="text-sm text-white/50 leading-relaxed font-sans">{event.description || 'Join us for this special liturgical occasion.'}</p>
                      {i !== liveEvents.length - 1 && <div className="absolute -bottom-6 left-0 right-0 h-[1px] bg-white/5" />}
                    </motion.div>
                  ))}
                </div>

                <button className="mt-12 glass-panel w-full py-5 rounded-lg text-xs uppercase tracking-[0.2em] font-bold hover:bg-white/10 transition-colors">
                  View All Events
                </button>
              </div>
            </section>
          )}

        {/* Upcoming Sermons & Events Grid Wrapper End */}
        </div>

        {/* Contact Section */}
        <section id="contact" className="max-w-7xl mx-auto px-8 mt-32">
          <div className="glass-panel rounded-[32px] p-8 md:p-16 relative">
            <div className="specular-highlight rounded-[32px]" />
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-5xl font-serif mb-8 text-glow">Connect with the <br /> <span className="italic font-light">Cathedral Family.</span></h2>
                  <p className="text-white/50 leading-relaxed mb-12 max-w-md">
                    Whether you are seeking spiritual guidance, sacramental records, or simply a place to call home, our doors and hearts are open.
                  </p>
                  
                  <div className="space-y-8">
                    <div className="flex gap-6 items-center">
                      <div className="w-12 h-12 glass-panel rounded-lg flex items-center justify-center text-accent-blue">
                        <MapPinIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-pure-white/30 font-bold mb-1">Our Location</p>
                        <p className="text-sm font-sans">456 Cathedral Plaza, Los Angeles, CA 90012</p>
                      </div>
                    </div>
                    <div className="flex gap-6 items-center">
                      <div className="w-12 h-12 glass-panel rounded-lg flex items-center justify-center text-accent-blue">
                        <PhoneIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-pure-white/30 font-bold mb-1">Rectory Office</p>
                        <p className="text-sm font-sans">(555) 123-4567 • office@trinitycathedral.org</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="glass-panel p-8 md:p-10 rounded-2xl border-white/5 bg-white/[0.02]"
              >
                {user ? (
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="Saint John"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Email Address</label>
                        <input 
                          type="email" 
                          placeholder="john@cathedral.org"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Subject</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all appearance-none text-pure-white/40">
                        <option className="bg-pure-black text-pure-white">General Inquiry</option>
                        <option className="bg-pure-black text-pure-white">Sacramental Request</option>
                        <option className="bg-pure-black text-pure-white">Prayer Intentions</option>
                        <option className="bg-pure-black text-pure-white">Volunteering</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Your Message</label>
                      <textarea 
                        rows={4}
                        placeholder="How may we walk with you today?"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20 resize-none"
                      ></textarea>
                    </div>
                    <button className="w-full glass-panel py-5 rounded-lg text-[11px] uppercase tracking-[0.3em] font-bold bg-white/10 hover:bg-accent-blue hover:text-pure-black transition-all active:scale-[0.98]">
                      Send Message
                    </button>
                  </form>
                ) : (
                  <div className="py-20 text-center">
                    <LockIcon className="w-12 h-12 text-accent-blue/20 mx-auto mb-6" />
                    <h3 className="text-2xl font-serif mb-4">Secure Outreach</h3>
                    <p className="text-pure-white/40 text-sm uppercase tracking-widest mb-10 max-w-sm mx-auto">Please sign in to your cathedral account to send a secure message to the rectory</p>
                    <button 
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-12 py-5 glass-panel rounded-full text-[11px] uppercase tracking-[0.3em] font-bold bg-white/5 hover:bg-accent-blue hover:text-pure-black transition-all"
                    >
                      Authenticate to Continue
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* User Profile Overlay */}
      <UserProfile 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Admin Dashboard */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <div className="absolute inset-0 bg-pure-black/95 backdrop-blur-2xl p-12 flex flex-col pt-32">
              <div className="liquid-blob w-[400px] h-[400px] bg-premium-blue/10 top-[-100px] right-[-100px] animate-blob-float" />
              
              <nav className="space-y-8 mb-12">
                <ul className="space-y-8 list-none p-0 m-0">
                  {['Sermons', 'Events', 'Liturgies', 'Gallery', 'Prayer', 'History', 'Contact'].map((item, i) => (
                    <motion.li 
                      key={item}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <a 
                        href={`#${item.toLowerCase()}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="block text-4xl font-serif text-white/90 hover:text-accent-blue focus-visible:text-accent-blue focus-visible:outline-none transition-colors italic"
                      >
                        {item}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <div className="mt-auto space-y-6">
                {user ? (
                  <>
                    <button 
                      onClick={() => {
                        setIsProfileOpen(true);
                        setIsMenuOpen(false);
                      }}
                      aria-label="View Sanctuary Profile"
                      className="w-full glass-panel p-4 rounded-lg flex items-center gap-4 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden glass-panel flex items-center justify-center">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-accent-blue" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-serif">{profile?.full_name || 'Faithful Soul'}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/40">View Sanctuary Profile</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="w-full glass-panel py-5 rounded-lg text-[10px] uppercase tracking-widest font-bold hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition-all"
                    >
                      Log Out from Sanctuary
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full glass-panel py-6 rounded-2xl text-[12px] uppercase tracking-[0.3em] font-bold bg-accent-blue text-pure-black hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-blue/50 transition-all"
                  >
                    Enter the Sanctuary
                  </button>
                )}
              </div>
            </div>

            {/* Accessible close button for mobile menu */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-8 right-8 w-12 h-12 glass-panel rounded-full flex items-center justify-center text-white/40 hover:text-white"
              aria-label="Close mobile navigation"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Floating Tab */}
          <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="glass-panel px-10 py-4 rounded-full flex gap-10 items-center whitespace-nowrap">
          <div className="specular-highlight rounded-full" />
          <div className="flex items-center gap-3 pr-8 border-r border-white/10">
            <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-pure-white/60">Live Sanctuary Stream</span>
          </div>
          <div className="flex gap-10">
            <div className="flex items-center gap-3 group cursor-pointer">
              <MapPinIcon className="w-4 h-4 text-pure-white/40 group-hover:text-accent-blue transition-colors" />
              <span className="text-[10px] uppercase tracking-widest text-pure-white/40">Find Us</span>
            </div>
            <div className="flex items-center gap-3 group cursor-pointer">
              <PhoneIcon className="w-4 h-4 text-pure-white/40 group-hover:text-accent-blue transition-colors" />
              <span className="text-[10px] uppercase tracking-widest text-pure-white/40">Rectory</span>
            </div>
            <div className="flex items-center gap-3 group cursor-pointer">
              <CalendarIcon className="w-4 h-4 text-pure-white/40 group-hover:text-accent-blue transition-colors" />
              <span className="text-[10px] uppercase tracking-widest text-pure-white/40">Full Schedule</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Modal Overlay */}
      <AnimatePresence>
        {activeVideoSermon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-pure-black/95 backdrop-blur-3xl" onClick={() => setActiveVideoSermon(null)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center bg-black"
            >
              <button 
                onClick={() => setActiveVideoSermon(null)}
                className="absolute top-4 right-4 z-50 p-2 glass-panel rounded-full hover:bg-white/10 transition-colors"
              >
                <XIcon className="w-5 h-5 text-white" />
              </button>

              {(!activeVideoSermon.video_type || activeVideoSermon.video_type === 'link') ? (
                <iframe
                  className="w-full h-full"
                  src={(() => {
                    const url = activeVideoSermon.video_url || '';
                    try {
                      if (url.includes('youtube.com/watch')) {
                        const urlObj = new URL(url);
                        const v = urlObj.searchParams.get('v');
                        if (v) return `https://www.youtube.com/embed/${v}`;
                      }
                      if (url.includes('youtu.be/')) {
                        const v = url.split('youtu.be/')[1]?.split('?')[0];
                        if (v) return `https://www.youtube.com/embed/${v}`;
                      }
                      if (url.includes('vimeo.com/')) {
                        const v = url.split('vimeo.com/')[1]?.split('?')[0];
                        if (v) return `https://player.vimeo.com/video/${v}`;
                      }
                    } catch (e) {}
                    return url.includes('watch?v=') ? url.replace('watch?v=', 'embed/') : url;
                  })()}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video
                  className="w-full h-full object-cover"
                  src={activeVideoSermon.video_url || ''}
                  controls
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
