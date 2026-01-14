import React from 'react';
import VoiceWidget from './components/VoiceWidget';

const App: React.FC = () => {
   return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-200">
         {/* Navbar */}
         <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">H</div>
                  <span className="font-bold text-xl tracking-tight text-slate-900">HealthVoice</span>
               </div>
               <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
                  <a href="#" className="hover:text-brand-600 transition-colors">Services</a>
                  <a href="#" className="hover:text-brand-600 transition-colors">Specialists</a>
                  <a href="#" className="hover:text-brand-600 transition-colors">Appointments</a>
                  <a href="#" className="hover:text-brand-600 transition-colors">About</a>
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
                           New: AI-Powered Medical Consultations
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                           Healthcare that <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">listens to you.</span>
                        </h1>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
                           Experience the future of healthcare with AI voice consultations. Talk to specialist doctors instantly, get medical guidance 24/7, and manage your health with a simple conversation.
                        </p>
                        <div className="flex flex-wrap gap-4">
                           <button className="bg-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-500 shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-1">
                              Talk to a Doctor
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
                              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"
                              alt="Healthcare Dashboard"
                              className="rounded-xl w-full h-auto"
                           />

                           {/* Floating cards for effect */}
                           <div className="absolute -left-8 top-1/4 bg-white p-4 rounded-lg shadow-xl border border-slate-100 animate-[bounce_3s_infinite]">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                 </div>
                                 <div>
                                    <p className="text-xs text-slate-500 font-medium">Dr. Pooja</p>
                                    <p className="text-sm font-bold text-slate-800">Available Now</p>
                                 </div>
                              </div>
                           </div>

                           <div className="absolute -right-8 bottom-1/4 bg-white p-4 rounded-lg shadow-xl border border-slate-100 animate-[bounce_4s_infinite]">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                 </div>
                                 <div>
                                    <p className="text-xs text-slate-500 font-medium">Active Patients</p>
                                    <p className="text-sm font-bold text-slate-800">1,247+</p>
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
                     <h2 className="text-3xl font-bold text-slate-900 mb-4">Why choose HealthVoice?</h2>
                     <p className="text-slate-600 max-w-2xl mx-auto">We combine expert medical knowledge with cutting-edge AI to deliver personalized healthcare at your fingertips.</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8">
                     {[
                        { title: "Expert Specialists", desc: "Access 7 medical specialists including cardiology, dermatology, neurology, and more.", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                        { title: "Instant Consultations", desc: "Connect with AI-powered doctors instantly. No waiting rooms, no appointments needed.", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                        { title: "24/7 Availability", desc: "Our AI medical specialists are always available to provide guidance and answer your health questions.", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
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
                        <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center text-white text-xs font-bold">H</div>
                        <span className="font-bold text-white text-lg">HealthVoice</span>
                     </div>
                     <p className="text-sm text-slate-400">Revolutionizing healthcare with conversational AI.</p>
                  </div>
                  <div>
                     <h4 className="text-white font-bold mb-4">Services</h4>
                     <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-brand-400">Specialists</a></li>
                        <li><a href="#" className="hover:text-brand-400">Consultations</a></li>
                        <li><a href="#" className="hover:text-brand-400">Health Records</a></li>
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
                  &copy; 2025 HealthVoice Inc. All rights reserved.
               </div>
            </div>
         </footer>

         {/* The Voice Widget */}
         <VoiceWidget />
      </div>
   );
};

export default App;