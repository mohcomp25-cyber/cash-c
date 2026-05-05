import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Shield, User as UserIcon, Lock, Languages, ShieldCheck } from 'lucide-react';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';
import { Language, translations } from '../lib/i18n';

interface LoginProps {
  onLogin: (user: User) => void;
  lang: Language;
  onLangToggle: () => void;
}

export default function Login({ onLogin, lang, onLangToggle }: LoginProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock login logic - Now accepts empty credentials for demo
    setTimeout(() => {
      onLogin({
        uid: Math.random().toString(),
        email: email || (role === 'supervisor' ? 'supervisor@demo.com' : 'cashier@demo.com'),
        name: (email.split('@')[0]) || (role === 'supervisor' ? 'Supervisor Demo' : 'Cashier Demo'),
        role,
        branchId: 'branch-1',
        branchName: 'Main Branch'
      });
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className={cn(
      "min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]",
      lang === 'ar' ? "font-sans-arabic" : ""
    )} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#151517] rounded-[2.5rem] shadow-2xl p-10 border border-white/5 backdrop-blur-md relative overflow-hidden"
      >
        {/* Demo Badge */}
        <div className={cn("absolute top-0", lang === 'ar' ? "left-0" : "right-0")}>
          <div className={cn(
            "bg-brand-primary/20 text-brand-primary text-[8px] font-black uppercase tracking-widest px-4 py-1 border-white/5",
            lang === 'ar' ? "rounded-br-xl border-b border-r" : "rounded-bl-xl border-b border-l"
          )}>
            {t.demoMode}
          </div>
        </div>

        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-brand-primary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand-primary/20 mb-6 rotate-3">
            <LogIn size={32} />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-2 italic">Fintech POS</h2>
          <p className="text-white/40 font-semibold text-xs uppercase tracking-widest">{t.selectRole}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex bg-white/5 p-1.5 rounded-2xl gap-1 mb-2">
            {(['cashier', 'supervisor'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  role === r 
                    ? "bg-brand-primary text-white shadow-lg" 
                    : "text-white/30 hover:text-white/60"
                )}
              >
                {r === 'cashier' ? (
                  <span className="flex items-center justify-center gap-2"><UserIcon size={14} /> {t.cashier}</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Shield size={14} /> {t.supervisor}</span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-white/20 group-focus-within:text-brand-primary transition-colors", lang === 'ar' ? "right-0 pr-4" : "left-0 pl-4")}>
                <UserIcon size={18} />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.userIdentifier}
                className={cn(
                  "block w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-semibold text-white focus:bg-white/10 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 transition-all outline-none placeholder:text-white/10",
                  lang === 'ar' ? "pr-11 pl-4" : "pl-11 pr-4"
                )}
              />
            </div>
            
            <p className="text-[10px] text-white/10 text-center font-bold uppercase tracking-widest">
              Passcode bypassed for preview
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-5 px-6 bg-white text-black rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-2xl hover:bg-white/90 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-3",
              isLoading && "opacity-80 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {t.enterDashboard}
                <div className="w-5 h-5 bg-black/10 rounded-lg flex items-center justify-center">
                  <LogIn size={12} />
                </div>
              </>
            )}
          </button>
        </form>

        <button
          onClick={onLangToggle}
          type="button"
          className="mt-6 w-full py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
        >
          <Languages size={14} />
          {lang === 'en' ? 'تغيير للغة العربية' : 'Switch to English'}
        </button>

        <p className="mt-10 text-center text-[10px] text-white/20 font-black uppercase tracking-widest">
          Developer Preview • <span className="text-brand-primary cursor-pointer hover:underline">Support</span>
        </p>
      </motion.div>

      <div className="mt-12 flex items-center gap-8 opacity-10">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-white" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Security Protocol</span>
        </div>
      </div>
    </div>
  );
}
