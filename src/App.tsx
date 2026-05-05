/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, LayoutDashboard, FileText, User as UserIcon, Languages } from 'lucide-react';
import Login from './components/Login';
import CashierForm from './components/CashierForm';
import SupervisorDashboard from './components/SupervisorDashboard';
import { User } from './types';
import { cn } from './lib/utils';
import { translations, Language } from './lib/i18n';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'form' | 'dashboard'>('form');
  const [lang, setLang] = useState<Language>('en');

  const t = translations[lang];

  // For Demo: Auto-login or persist simple session
  useEffect(() => {
    const savedUser = localStorage.getItem('cashier_app_user');
    const savedLang = localStorage.getItem('cashier_app_lang') as Language;
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setView(parsedUser.role === 'supervisor' ? 'dashboard' : 'form');
    }
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('cashier_app_user', JSON.stringify(userData));
    setView(userData.role === 'supervisor' ? 'dashboard' : 'form');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cashier_app_user');
  };

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setLang(newLang);
    localStorage.setItem('cashier_app_lang', newLang);
  };

  if (!user) {
    return <Login onLogin={handleLogin} lang={lang} onLangToggle={toggleLang} />;
  }

  return (
    <div className={cn(
      "min-h-screen bg-[#0A0A0B] text-white/90 font-sans selection:bg-brand-primary/30 selection:text-white",
      lang === 'ar' ? "font-sans-arabic" : ""
    )} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white capitalize">
              {user.branchName || 'The Gourmet Kitchen'}
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
              {t.operationalData} • {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
          >
            <Languages size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
              {lang === 'en' ? 'العربية' : 'English'}
            </span>
          </button>

          {user.role === 'supervisor' && (
            <button
              onClick={() => setView(view === 'form' ? 'dashboard' : 'form')}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300",
                view === 'dashboard' ? "bg-brand-primary/20 text-brand-primary" : "bg-white/5 text-white/40"
              )}
            >
              <LayoutDashboard size={20} />
            </button>
          )}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:bg-brand-danger/20 hover:text-brand-danger transition-all duration-300"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24">
        <AnimatePresence mode="wait">
          {view === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <CashierForm user={user} lang={lang} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <SupervisorDashboard user={user} lang={lang} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* User Info Float */}
      <div className="fixed bottom-6 left-6 right-6 pointer-events-none flex justify-center">
        <div className="bg-[#1A1A1C]/90 backdrop-blur-lg border border-white/10 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto ring-1 ring-white/5">
          <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border border-white/10">
            <UserIcon size={14} className="text-white/60" />
          </div>
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">{user.name}</span>
          <div className="h-3 w-px bg-white/10 mx-1" />
          <span className={cn(
            "text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-tight",
            user.role === 'supervisor' ? "bg-purple-500/20 text-purple-400" : "bg-brand-primary/20 text-brand-primary"
          )}>
            {user.role === 'supervisor' ? t.supervisor : t.cashier}
          </span>
        </div>
      </div>
    </div>
  );
}
