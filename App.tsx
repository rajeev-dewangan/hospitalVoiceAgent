import React from 'react';
import VoiceWidget from './components/VoiceWidget';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-200">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <span className="font-bold text-xl tracking-tight text-slate-900">LogiVoice</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-brand-600 transition-colors">Solutions</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Tracking</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Pricing</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Resources</a>
          </div>
          <div className="flex items-center gap-4">
             <button className="text-slate-500 hover:text-slate-800 text-sm font-medium">Login</button>
             <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="relative pt-16 pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100/50 via-slate-50 to-slate-50"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full text-brand-700 text-xs font-bold uppercase tracking-wide mb-6">
                   <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                   New Feature: AI Voice Support
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                  Logistics that <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">speaks your language.</span>
                </h1>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
                  Experience the future of supply chain management with real-time AI voice tracking. Talk to your data, resolve issues instantly, and schedule deliveries with a simple conversation.
                </p>
                <div className="flex flex-wrap gap-4">
                   <button className="bg-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-500 shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-1">
                      Start Tracking
                   </button>
                   <button className="bg-white text-slate-700 border border-slate-200 px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all">
                      View Demo
                   </button>
                </div>
              </div>
              
              <div className="relative">
                 <div className="absolute -inset-4 bg-gradient-to-r from-brand-500 to-purple-500 opacity-10 blur-2xl rounded-3xl"></div>
                 <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-2">
                    <img 
                      src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" 
                      alt="Logistics Dashboard" 
                      className="rounded-xl w-full h-auto"
                    />
                    
                    {/* Floating cards for effect */}
                    <div className="absolute -left-8 top-1/4 bg-white p-4 rounded-lg shadow-xl border border-slate-100 animate-[bounce_3s_infinite]">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          </div>
                          <div>
                             <p className="text-xs text-slate-500 font-medium">Shipment #8839</p>
                             <p className="text-sm font-bold text-slate-800">Delivered</p>
                          </div>
                       </div>
                    </div>

                    <div className="absolute -right-8 bottom-1/4 bg-white p-4 rounded-lg shadow-xl border border-slate-100 animate-[bounce_4s_infinite]">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </div>
                          <div>
                             <p className="text-xs text-slate-500 font-medium">Est. Arrival</p>
                             <p className="text-sm font-bold text-slate-800">2:30 PM Today</p>
                          </div>
                       </div>
                    </div>

                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-white py-24 border-t border-slate-100">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold text-slate-900 mb-4">Why choose LogiVoice?</h2>
                 <p className="text-slate-600 max-w-2xl mx-auto">We combine global infrastructure with cutting-edge AI to deliver the smoothest logistics experience possible.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 {[
                    { title: "Real-time Tracking", desc: "Monitor your fleet and shipments with millisecond precision using our dashboard.", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
                    { title: "Smart Scheduling", desc: "AI-driven scheduling optimization to reduce transit times and fuel costs.", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                    { title: "24/7 AI Support", desc: "Our Gemini-powered voice agents are always awake to solve your problems instantly.", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
                 ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:shadow-lg transition-all group">
                       <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-brand-600 mb-4 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                       </div>
                       <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                       <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
               <div>
                  <div className="flex items-center gap-2 mb-4">
                     <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center text-white text-xs font-bold">L</div>
                     <span className="font-bold text-white text-lg">LogiVoice</span>
                  </div>
                  <p className="text-sm text-slate-400">Revolutionizing logistics with conversational AI.</p>
               </div>
               <div>
                  <h4 className="text-white font-bold mb-4">Product</h4>
                  <ul className="space-y-2 text-sm">
                     <li><a href="#" className="hover:text-brand-400">Features</a></li>
                     <li><a href="#" className="hover:text-brand-400">Integrations</a></li>
                     <li><a href="#" className="hover:text-brand-400">Pricing</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-white font-bold mb-4">Company</h4>
                  <ul className="space-y-2 text-sm">
                     <li><a href="#" className="hover:text-brand-400">About Us</a></li>
                     <li><a href="#" className="hover:text-brand-400">Careers</a></li>
                     <li><a href="#" className="hover:text-brand-400">Blog</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-white font-bold mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm">
                     <li><a href="#" className="hover:text-brand-400">Privacy</a></li>
                     <li><a href="#" className="hover:text-brand-400">Terms</a></li>
                  </ul>
               </div>
            </div>
            <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
               &copy; 2025 LogiVoice Inc. All rights reserved.
            </div>
         </div>
      </footer>

      {/* The Voice Widget */}
      <VoiceWidget />
    </div>
  );
};

export default App;