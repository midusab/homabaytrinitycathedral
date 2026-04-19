import React from 'react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-pure-black border-t border-white/10 py-16">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <span className="font-serif text-2xl tracking-tight text-white">Trinity</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8">
          <a href="#projects" className="text-xs text-white/60 hover:text-accent-blue transition-colors uppercase tracking-widest">Projects</a>
          <a href="#choir" className="text-xs text-white/60 hover:text-accent-blue transition-colors uppercase tracking-widest">Choir</a>
          <a href="#" className="text-xs text-white/60 hover:text-accent-blue transition-colors uppercase tracking-widest">Top</a>
        </div>

        <p className="text-xs text-white/40 font-sans tracking-widest uppercase text-center md:text-right">
          © {new Date().getFullYear()} Trinity Cathedral. <br className="hidden md:block" /> All rights reserved.
        </p>
      </div>
    </footer>
  );
}
