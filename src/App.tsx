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
  Lock as LockIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { Logo } from './components/Logo';
import { User as UserIcon } from 'lucide-react';

const SERMONS = [
  { 
    title: 'The Architecture of Mercy', 
    speaker: 'Most Rev. Dr. Michael Aris', 
    date: 'April 19, 2026', 
    thumbnail: 'https://images.unsplash.com/photo-1438232992991-995b7058df3c?w=800&auto=format&fit=crop',
    tag: 'Holy Week'
  },
  { 
    title: 'Light in the Modern Dark', 
    speaker: 'Canon Sarah Jenkins', 
    date: 'April 12, 2026', 
    thumbnail: 'https://images.unsplash.com/photo-1548696444-12347de5fd04?w=800&auto=format&fit=crop',
    tag: 'Faith & Ethics'
  },
  { 
    title: 'Walking with the Master', 
    speaker: 'Fr. Paul Newman', 
    date: 'April 5, 2026', 
    thumbnail: 'https://images.unsplash.com/photo-1549488344-c67be2d178e2?w=800&auto=format&fit=crop',
    tag: 'Discipleship'
  },
  { 
    title: 'The Silent Cathedral', 
    speaker: 'Sister Mary Julian', 
    date: 'March 29, 2026', 
    thumbnail: 'https://images.unsplash.com/photo-1447069387593-a5de0862081c?w=800&auto=format&fit=crop',
    tag: 'Contemplation'
  },
];

const EVENTS = [
  { 
    title: 'Choral Evensong', 
    time: 'Sun, 5:30 PM', 
    desc: 'A meditative evening of prayer and sacred music.',
    category: 'Worship'
  },
  { 
    title: 'Young Adult Retreat', 
    time: 'May 14-16', 
    desc: 'A weekend of silence and spiritual direction.',
    category: 'Community'
  },
  { 
    title: 'St. Phoebe Outreach', 
    time: 'Sat, 9:00 AM', 
    desc: 'Serving our neighbors in the inner city center.',
    category: 'Mission'
  },
];

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

const GALLERY_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1548696444-12347de5fd04?q=80&w=800&auto=format&fit=crop', title: 'The High Altar' },
  { url: 'https://images.unsplash.com/photo-1438232992991-995b7058df3c?q=80&w=1000&auto=format&fit=crop', title: 'Stained Glass Details' },
  { url: 'https://images.unsplash.com/photo-1543002588-b974596e744f?q=80&w=1200&auto=format&fit=crop', title: 'Gothic Vaulting' },
  { url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=800&auto=format&fit=crop', title: 'Morning Light in the Nave' },
  { url: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=800&auto=format&fit=crop', title: 'The Great Organ' },
  { url: 'https://images.unsplash.com/photo-1447069387593-a5de0862081c?q=80&w=800&auto=format&fit=crop', title: 'Vigil Candles' },
  { url: 'https://images.unsplash.com/photo-1549488344-c67be2d178e2?q=80&w=800&auto=format&fit=crop', title: 'Sacred Statuary' },
  { url: 'https://images.unsplash.com/photo-1590059393160-c3227976e196?q=80&w=800&auto=format&fit=crop', title: 'Stone Carvings' },
  { url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop', title: 'Cathedral Exterior' },
];

const PRAYER_INTENTIONS = [
  { name: 'Maria G.', message: 'For the health of my mother and for all those suffering in clinical care.', date: '2h ago' },
  { name: 'Fr. Paul', message: 'In thanksgiving for the successful restoration of the Lady Chapel.', date: '5h ago' },
  { name: 'Anonymous', message: 'Strengthen my faith during this season of transition and uncertainty.', date: '1d ago' },
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-pure-black">
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

          <div className="hidden lg:flex items-center gap-2">
            <div className="glass-panel px-10 py-3 rounded-full flex gap-10">
              <div className="specular-highlight rounded-full" />
              {['Sermons', 'Events', 'Liturgies', 'Gallery', 'Prayer', 'History', 'Contact'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`}
                  className="text-xs font-sans tracking-[0.2em] uppercase text-white/60 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
            <button className="glass-panel w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <SearchIcon className="w-4 h-4 text-white/70" />
            </button>
            
            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="glass-panel p-1 pr-6 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden glass-panel border border-white/10 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-accent-blue" />
                    )}
                  </div>
                  Profile
                </button>
                <button 
                  onClick={() => signOut()}
                  className="glass-panel px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="glass-panel px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold bg-accent-blue/10 hover:bg-accent-blue hover:text-pure-black transition-all"
              >
                Sign In
              </button>
            )}
          </div>

          <button 
            className="lg:hidden glass-panel w-12 h-12 rounded-full flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">
        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-8 mb-32 group">
          {/* Background Highlight */}
          <motion.div 
            style={{ y: heroY, opacity: heroOpacity, scale: heroScale, filter: heroFilter }}
            className="absolute inset-0 -mx-8 lg:-mx-24 -z-10 overflow-hidden rounded-[64px]"
          >
            <div className="absolute inset-0 bg-pure-black/60 backdrop-blur-[2px] z-10" />
            <motion.img 
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              src="https://images.unsplash.com/photo-1548003929-79885acc5593?q=80&w=2000&auto=format&fit=crop" 
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
                <div className="glass-panel p-2 rounded-[48px] overflow-hidden">
                  <div className="specular-highlight rounded-[48px]" />
                  <div className="aspect-[4/5] rounded-[40px] overflow-hidden relative">
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
                <div className="absolute -bottom-6 -left-6 glass-panel p-4 rounded-2xl flex items-center gap-3 backdrop-blur-xl border-white/20">
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
              <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3">
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
                className="glass-panel p-6 rounded-[28px] group hover:bg-white/10 transition-all text-center cursor-default shadow-xl shadow-black/20"
              >
                <div className="specular-highlight rounded-[28px]" />
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
        <section className="relative h-[60vh] mb-32 overflow-hidden mx-8 rounded-[64px]">
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
              className="glass-panel px-12 py-10 rounded-[40px]"
            >
              <div className="specular-highlight rounded-[40px]" />
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
                <div className="glass-panel p-8 rounded-[32px] relative overflow-hidden">
                  <div className="specular-highlight rounded-[32px]" />
                  <h4 className="font-serif text-xl mb-6">Submit an Intention</h4>
                  {user ? (
                    <form className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Your Name (Optional)"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 transition-all placeholder:text-white/20"
                      />
                      <textarea 
                        rows={4}
                        placeholder="Your prayer intention..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 transition-all placeholder:text-white/20 resize-none"
                      ></textarea>
                      <div className="flex items-center gap-4 mb-4">
                        <input type="checkbox" id="public" className="rounded bg-white/5 border-white/10 text-accent-blue focus:ring-0" />
                        <label htmlFor="public" className="text-[10px] uppercase tracking-widest text-white/40">Share on Community Board</label>
                      </div>
                      <button className="w-full glass-panel py-4 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-accent-blue hover:text-pure-black transition-all">
                        Light a Virtual Candle
                      </button>
                    </form>
                  ) : (
                    <div className="py-8 text-center">
                      <LockIcon className="w-10 h-10 text-accent-blue/20 mx-auto mb-4" />
                      <p className="text-pure-white/40 text-xs uppercase tracking-widest mb-6 px-4">Sign in to share your intention with our community</p>
                      <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="w-full glass-panel py-4 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-bold bg-white/5 hover:bg-accent-blue hover:text-pure-black transition-all"
                      >
                        Sign In to Submit
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-12 xl:col-span-8">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-serif italic text-pure-white/70">Community Prayer Board</h3>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                  <span className="text-[10px] tracking-widest uppercase text-white/40 font-bold">Live Support</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {PRAYER_INTENTIONS.map((prayer, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="glass-panel p-8 rounded-[28px] hover:bg-white/5 transition-all group"
                  >
                    <div className="specular-highlight rounded-[28px]" />
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-accent-blue group-hover:scale-110 transition-transform">
                          <Heart className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-serif italic text-pure-white/80">{prayer.name}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">{prayer.date}</span>
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
                    className="glass-panel p-6 rounded-2xl flex gap-6 items-start hover:bg-white/5 transition-colors"
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
                className="glass-panel p-3 rounded-[40px]"
              >
                <div className="specular-highlight rounded-[40px]" />
                <img 
                  src="https://images.unsplash.com/photo-1543002588-b974596e744f?w=1200&auto=format&fit=crop" 
                  alt="Cathedral Vaulted Ceiling" 
                  className="rounded-[32px] w-full h-[600px] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pure-black/60 to-transparent rounded-[40px]" />
                
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="glass-panel p-8 rounded-3xl backdrop-blur-2xl">
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
            {GALLERY_IMAGES.map((image, i) => (
              <motion.div
                key={image.url}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="relative group break-inside-avoid"
              >
                <div className="glass-panel p-2 rounded-[32px] overflow-hidden transition-all duration-500 group-hover:bg-white/10">
                  <div className="specular-highlight rounded-[32px]" />
                  <img 
                    src={image.url} 
                    alt={image.title}
                    className="w-full rounded-[24px] object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pure-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[32px]" />
                  
                  <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="font-serif text-lg italic text-white/90">{image.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-12 gap-12">
          
          {/* Upcoming Sermons */}
          <section id="sermons" className="lg:col-span-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-serif mb-2">Upcoming Sermons</h2>
                <p className="text-sm text-pure-white/40 font-sans tracking-wide">Exploring the Gospel in a contemporary world.</p>
              </div>
              <button className="text-xs uppercase tracking-tighter text-accent-blue font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">
                Archive <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {SERMONS.map((sermon, i) => (
                <motion.div
                  key={sermon.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-panel group p-1 rounded-[32px] hover:bg-white/5 transition-colors"
                >
                  <div className="specular-highlight rounded-[32px]" />
                  <div className="flex flex-col md:flex-row gap-6 p-4">
                    <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden relative">
                      <img src={sermon.thumbnail} alt={sermon.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-premium-blue/30 mix-blend-multiply" />
                    </div>
                    <div className="flex-1 py-2 pr-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-sans uppercase tracking-widest text-accent-blue mb-2 block">{sermon.tag}</span>
                        <h3 className="text-2xl font-serif mb-2">{sermon.title}</h3>
                        <p className="text-sm text-pure-white/50">{sermon.speaker}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-sans text-pure-white/30 uppercase tracking-widest">{sermon.date}</span>
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

          {/* Community Events */}
          <section id="events" className="lg:col-span-4">
            <div className="glass-panel rounded-[40px] h-full p-10 flex flex-col relative overflow-hidden">
              <div className="specular-highlight rounded-[40px]" />
              
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
                {EVENTS.map((event, i) => (
                  <motion.div 
                    key={event.title}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-accent-blue">{event.category}</span>
                      <span className="text-[10px] font-sans text-white/40">{event.time}</span>
                    </div>
                    <h4 className="text-xl font-serif mb-3 hover:text-accent-blue cursor-pointer transition-colors">{event.title}</h4>
                    <p className="text-sm text-white/50 leading-relaxed font-sans">{event.desc}</p>
                    {i !== EVENTS.length - 1 && <div className="absolute -bottom-6 left-0 right-0 h-[1px] bg-white/5" />}
                  </motion.div>
                ))}
              </div>

              <button className="mt-12 glass-panel w-full py-5 rounded-2xl text-xs uppercase tracking-[0.2em] font-bold hover:bg-white/10 transition-colors">
                View All Events
              </button>
            </div>
          </section>

        {/* Upcoming Sermons & Events Grid Wrapper End */}
        </div>

        {/* Contact Section */}
        <section id="contact" className="max-w-7xl mx-auto px-8 mt-32">
          <div className="glass-panel rounded-[48px] p-8 md:p-16 relative">
            <div className="specular-highlight rounded-[48px]" />
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
                      <div className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center text-accent-blue">
                        <MapPinIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-pure-white/30 font-bold mb-1">Our Location</p>
                        <p className="text-sm font-sans">456 Cathedral Plaza, Los Angeles, CA 90012</p>
                      </div>
                    </div>
                    <div className="flex gap-6 items-center">
                      <div className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center text-accent-blue">
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
                className="glass-panel p-8 md:p-10 rounded-[32px] border-white/5 bg-white/[0.02]"
              >
                {user ? (
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="Saint John"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Email Address</label>
                        <input 
                          type="email" 
                          placeholder="john@cathedral.org"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold ml-1">Subject</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all appearance-none text-pure-white/40">
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
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-accent-blue/50 focus:bg-white/10 transition-all placeholder:text-pure-white/20 resize-none"
                      ></textarea>
                    </div>
                    <button className="w-full glass-panel py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] font-bold bg-white/10 hover:bg-accent-blue hover:text-pure-black transition-all active:scale-[0.98]">
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
      />

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <div className="absolute inset-0 bg-pure-black/95 backdrop-blur-2xl p-12 flex flex-col pt-32">
              <div className="liquid-blob w-[400px] h-[400px] bg-premium-blue/10 top-[-100px] right-[-100px] animate-blob-float" />
              
              <div className="space-y-8 mb-12">
                {['Sermons', 'Events', 'Liturgies', 'Gallery', 'Prayer', 'History', 'Contact'].map((item, i) => (
                  <motion.a 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={item} 
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-4xl font-serif text-white/90 hover:text-accent-blue transition-colors italic"
                  >
                    {item}
                  </motion.a>
                ))}
              </div>

              <div className="mt-auto space-y-6">
                {user ? (
                  <>
                    <button 
                      onClick={() => {
                        setIsProfileOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden glass-panel flex items-center justify-center">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
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
                      className="w-full glass-panel py-5 rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:bg-red-500/10 hover:text-red-400 transition-all"
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
                    className="w-full glass-panel py-6 rounded-3xl text-[12px] uppercase tracking-[0.3em] font-bold bg-accent-blue text-pure-black hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Enter the Sanctuary
                  </button>
                )}
              </div>
            </div>
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
    </div>
  );
}
