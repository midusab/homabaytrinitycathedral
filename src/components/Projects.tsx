import React from 'react';

export function Projects() {
  return (
    <div className="py-24 max-w-7xl mx-auto px-8">
      <h2 className="text-4xl font-serif mb-12">Our Community Projects</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-lg">
          <h3 className="text-xl font-serif mb-4">Renovation Fund</h3>
          <p className="text-white/60">Restoring the historical stained glass windows of the main sanctuary.</p>
        </div>
      </div>
    </div>
  );
}
