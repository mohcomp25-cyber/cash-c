import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Plus,
  Calculator, 
  AlertCircle, 
  CheckCircle2,
  Image as ImageIcon,
  X,
  Send
} from 'lucide-react';
import { User, DailyClosing, CustomPayment } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { closingService } from '../services/dataService';
import { Language, translations } from '../lib/i18n';
import { DEFAULT_APP_PAYMENTS } from '../lib/constants';

interface CashierFormProps {
  user: User;
  lang: Language;
}

interface ExpenseItem {
  id: string;
  amount: string;
  reason: string;
  imageUrl: string | null;
}

export default function CashierForm({ user, lang }: CashierFormProps) {
  const [cash, setCash] = useState<string>('');
  const [cashImage, setCashImage] = useState<string | null>(null);
  const [card, setCard] = useState<string>('');
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [customPayments, setCustomPayments] = useState<CustomPayment[]>(
    DEFAULT_APP_PAYMENTS.map(p => ({ 
      methodId: p.id, 
      methodLabel: p.label, 
      amount: 0,
      imageUrl: undefined
    }))
  );
  const [expectedSales, setExpectedSales] = useState<string>('');
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);
  const cashFileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const expenseFileInputRef = useRef<HTMLInputElement>(null);
  const customPaymentFileInputRef = useRef<HTMLInputElement>(null);
  const activeExpenseIdRef = useRef<string | null>(null);
  const activeCustomPaymentIdRef = useRef<string | null>(null);
  const t = translations[lang];

  const calcs = useMemo(() => {
    const cashVal = parseFloat(cash) || 0;
    const cardVal = parseFloat(card) || 0;
    const customsTotal = customPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const expensesTotal = expenseItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    const expectedVal = parseFloat(expectedSales) || 0;

    const actualTotal = cashVal + cardVal + customsTotal + expensesTotal;
    const difference = actualTotal - expectedVal;

    return {
      actualTotal,
      difference,
      isShortage: difference < 0,
      isOver: difference > 0,
      isPerfect: difference === 0,
      expensesTotal,
      customsTotal
    };
  }, [cash, card, expenseItems, customPayments, expectedSales]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // For demo: create local blob URLs
      const fileList = Array.from(files);
      const newImages = fileList.map(file => URL.createObjectURL(file as Blob));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!expectedSales || parseFloat(expectedSales) <= 0) {
      alert(lang === 'ar' ? `يرجى إدخال ${t.grossSales}.` : "Please enter Gross Sales.");
      return;
    }
    if (!reportImage) {
      alert(lang === 'ar' ? `يرجى إرفاق صورة ${t.grossSales} (التقرير).` : "Please attach Gross Sales photo (Report).");
      return;
    }
    if (!cashImage) {
      alert(lang === 'ar' ? "يرجى إرفاق صورة النقد (كاش)." : "Please attach Cash photo.");
      return;
    }
    if (!cardImage) {
      alert(lang === 'ar' ? "يرجى إرفاق صورة بطاقة (شبكة)." : "Please attach Card photo.");
      return;
    }
    
    // Validate App Sales
    for (const cp of customPayments) {
      const config = DEFAULT_APP_PAYMENTS.find(p => p.id === cp.methodId);
      if (cp.amount > 0 && config?.requiresImage && !cp.imageUrl) {
        alert(lang === 'ar' ? `يرجى إرفاق صورة لـ ${cp.methodLabel}.` : `Please attach photo for ${cp.methodLabel}.`);
        return;
      }
    }
    
    // Validate Expenses
    for (const item of expenseItems) {
      if (!item.amount || parseFloat(item.amount) <= 0) {
        alert(lang === 'ar' ? "يرجى إدخال مبلغ لكل بند مصروفات." : "Please enter amount for all expense items.");
        return;
      }
      if (!item.imageUrl) {
        alert(lang === 'ar' ? "يرجى إرفاق صورة لكل بند مصروفات." : "Please attach photo for all expense items.");
        return;
      }
    }

    if (calcs.isShortage && !notes.trim()) {
      alert(lang === 'ar' ? "يرجى تقديم ملاحظة تشرح سبب النقص." : "Please provide a note explaining the shortage.");
      return;
    }
    if (images.length === 0) {
      alert(lang === 'ar' ? "يرجى تحميل صورة واحدة على الأقل للأدلة المرئية." : "Please upload at least one photo for visual evidence.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await closingService.submitClosing({
        cashierId: user.uid,
        cashierName: user.name,
        branchId: user.branchId,
        branchName: user.branchName,
        date: new Date().toISOString(),
        cashAmount: parseFloat(cash) || 0,
        cardAmount: parseFloat(card) || 0,
        customPayments: customPayments.filter(p => p.amount > 0),
        expenses: calcs.expensesTotal,
        expectedSales: parseFloat(expectedSales) || 0,
        actualTotal: calcs.actualTotal,
        difference: calcs.difference,
        notes: notes,
        imageUrls: [
          ...(reportImage ? [reportImage] : []), 
          ...(cashImage ? [cashImage] : []),
          ...(cardImage ? [cardImage] : []),
          ...customPayments.map(cp => cp.imageUrl).filter(Boolean) as string[],
          ...expenseItems.map(ei => ei.imageUrl).filter(Boolean) as string[],
          ...images
        ],
      });

      setIsSuccess(true);
      setTimeout(() => {
        setCash('');
        setCashImage(null);
        setCard('');
        setCardImage(null);
        setCustomPayments(DEFAULT_APP_PAYMENTS.map(p => ({ 
          methodId: p.id, 
          methodLabel: p.label, 
          amount: 0,
          imageUrl: undefined
        })));
        setExpenseItems([]);
        setExpectedSales('');
        setReportImage(null);
        setNotes('');
        setImages([]);
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert(lang === 'ar' ? "فشل إرسال التقرير. يرجى المحاولة مرة أخرى." : "Failed to submit closing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addExpenseItem = () => {
    setExpenseItems(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), amount: '', reason: '', imageUrl: null }
    ]);
  };

  const updateExpenseItem = (id: string, field: keyof ExpenseItem, value: string) => {
    setExpenseItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeExpenseItem = (id: string) => {
    setExpenseItems(prev => prev.filter(item => item.id !== id));
  };

  const handleExpensePhotoClick = (id: string) => {
    activeExpenseIdRef.current = id;
    expenseFileInputRef.current?.click();
  };

  const handleExpensePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = activeExpenseIdRef.current;
    if (file && id) {
      const url = URL.createObjectURL(file);
      setExpenseItems(prev => prev.map(item => item.id === id ? { ...item, imageUrl: url } : item));
    }
  };

  const handleCustomPaymentPhotoClick = (id: string) => {
    activeCustomPaymentIdRef.current = id;
    customPaymentFileInputRef.current?.click();
  };

  const handleCustomPaymentPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = activeCustomPaymentIdRef.current;
    if (file && id) {
      const url = URL.createObjectURL(file);
      setCustomPayments(prev => prev.map(p => p.methodId === id ? { ...p, imageUrl: url } : p));
    }
  };

  const updateCustomPaymentAmount = (id: string, amount: string) => {
    setCustomPayments(prev => prev.map(p => p.methodId === id ? { ...p, amount: parseFloat(amount) || 0 } : p));
  };

  return (
    <div className={cn("max-w-2xl mx-auto px-4 pt-6 pb-24", lang === 'ar' ? "font-sans-arabic" : "")}>
      {/* Success View */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#0A0A0B]/90 backdrop-blur-md"
          >
            <div className="bg-[#151517] rounded-[2.5rem] p-10 shadow-2xl text-center flex flex-col items-center max-w-sm border border-white/5">
              <div className="w-20 h-20 bg-brand-success rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-brand-success/20 animate-bounce">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{lang === 'ar' ? 'تم بنجاح!' : 'Success!'}</h3>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
                {lang === 'ar' ? 'تم إرسال تقرير الإغلاق بأمان.' : 'Closing record transmitted securely.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branch Info Card */}
        <section className="bg-[#151517] rounded-[2rem] p-6 shadow-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20">{t.operationalData}</h3>
            <div className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-brand-primary uppercase tracking-widest">
              Shift {Math.random().toString(36).substr(2, 6).toUpperCase()}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-[9px] block mb-1 text-white/30 font-black uppercase tracking-widest">{t.branch}</span>
              <p className="font-bold text-sm text-white">{user.branchName}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
              <span className="text-[15px] block mb-1 text-white/30 font-black uppercase tracking-widest">{t.grossSales}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expectedSales}
                  onChange={(e) => setExpectedSales(e.target.value)}
                  className={cn(
                    "bg-transparent border-b border-white/10 outline-none text-white font-bold text-sm w-full placeholder:text-white/5",
                    lang === 'ar' ? "text-right" : ""
                  )}
                />
                <button
                  type="button"
                  onClick={() => reportFileInputRef.current?.click()}
                  className={cn(
                    "p-2 rounded-xl transition-all flex-shrink-0",
                    reportImage ? "bg-brand-secondary/20 text-brand-secondary" : "bg-white/5 text-white/20 hover:bg-white/10"
                  )}
                >
                  <Camera size={14} />
                </button>
                <input 
                  type="file" 
                  ref={reportFileInputRef} 
                  hidden 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setReportImage(URL.createObjectURL(file));
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Input Sections */}
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cash Input */}
            <div className="bg-[#151517] rounded-[2rem] p-6 shadow-2xl border border-white/5 transition-all focus-within:border-brand-primary/50 group flex flex-col justify-between min-h-[180px]">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[14px] font-black uppercase tracking-widest text-white/20 group-focus-within:text-brand-primary transition-colors">
                  <DollarSign size={14} /> {t.fiatCash}
                </label>
                <button
                  type="button"
                  onClick={() => cashFileInputRef.current?.click()}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    cashImage ? "bg-brand-primary/20 text-brand-primary" : "bg-white/5 text-white/20 hover:bg-white/10"
                  )}
                >
                  <Camera size={18} />
                </button>
                <input 
                  type="file" 
                  ref={cashFileInputRef} 
                  hidden 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCashImage(URL.createObjectURL(file));
                  }}
                />
              </div>
              <div className="relative mt-4">
                <span className={cn("absolute top-1/2 -translate-y-1/2 text-2xl font-black text-white/10 group-focus-within:text-brand-primary/20 transition-colors", lang === 'ar' ? "right-0" : "left-0")}>$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className={cn(
                    "w-full text-4xl font-black bg-transparent outline-none text-white placeholder:text-white/5",
                    lang === 'ar' ? "pr-8 text-right" : "pl-8"
                  )}
                />
              </div>
            </div>

            {/* Card Input */}
            <div className="bg-[#151517] rounded-[2rem] p-6 shadow-2xl border border-white/5 transition-all focus-within:border-brand-secondary/50 group flex flex-col justify-between min-h-[180px]">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[14px] font-black uppercase tracking-widest text-white/20 group-focus-within:text-brand-secondary transition-colors">
                  <CreditCard size={14} /> {t.posCard}
                </label>
                <button
                  type="button"
                  onClick={() => cardFileInputRef.current?.click()}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    cardImage ? "bg-brand-secondary/20 text-brand-secondary" : "bg-white/5 text-white/20 hover:bg-white/10"
                  )}
                >
                  <Camera size={18} />
                </button>
                <input 
                  type="file" 
                  ref={cardFileInputRef} 
                  hidden 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCardImage(URL.createObjectURL(file));
                  }}
                />
              </div>
              <div className="relative mt-4">
                <span className={cn("absolute top-1/2 -translate-y-1/2 text-2xl font-black text-white/10 group-focus-within:text-brand-secondary/20 transition-colors", lang === 'ar' ? "right-0" : "left-0")}>$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={card}
                  onChange={(e) => setCard(e.target.value)}
                  className={cn(
                    "w-full text-4xl font-black bg-transparent outline-none text-white placeholder:text-white/5",
                    lang === 'ar' ? "pr-8 text-right" : "pl-8"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* App Sales Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20">
              <ImageIcon size={20} />
            </div>
            <h3 className="text-[16px] font-black uppercase tracking-widest text-white/20">{t.appSales}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customPayments.map((cp) => (
              <div 
                key={cp.methodId}
                className="bg-[#151517] rounded-[2rem] p-6 border border-white/5 shadow-xl transition-all focus-within:border-brand-primary/50 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/30 truncate max-w-[150px]">
                    {cp.methodLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCustomPaymentPhotoClick(cp.methodId)}
                    className={cn(
                      "p-2 rounded-xl transition-all",
                      cp.imageUrl ? "bg-brand-primary/20 text-brand-primary" : "bg-white/5 text-white/20 hover:bg-white/10"
                    )}
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <div className="relative">
                  <span className={cn("absolute top-1/2 -translate-y-1/2 text-lg font-black text-white/10", lang === 'ar' ? "right-0" : "left-0")}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cp.amount || ''}
                    onChange={(e) => updateCustomPaymentAmount(cp.methodId, e.target.value)}
                    className={cn(
                      "w-full text-2xl font-black bg-transparent outline-none text-white placeholder:text-white/5",
                      lang === 'ar' ? "pr-6 text-right" : "pl-6"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          <input
            type="file"
            ref={customPaymentFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleCustomPaymentPhotoUpload}
          />
        </section>

        {/* Dynamic Expenses Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 px-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20">
                <Receipt size={20} />
              </div>
              <h3 className="text-[16px] font-black uppercase tracking-widest text-white/20">{t.expenses}</h3>
            </div>
            <button
              type="button"
              onClick={addExpenseItem}
              className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center hover:bg-brand-primary/20 transition-all active:scale-90"
            >
              <Plus size={20} />
            </button>
          </div>

          <AnimatePresence>
            {expenseItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-[#151517] rounded-[2rem] p-6 border border-white/5 shadow-xl relative group"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/20">{t.expenseReason}</label>
                    <input
                      type="text"
                      value={item.reason}
                      onChange={(e) => updateExpenseItem(item.id, 'reason', e.target.value)}
                      placeholder={t.expenseReasonPlaceholder}
                      className={cn(
                        "w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none focus:border-brand-primary/50 transition-all",
                        lang === 'ar' ? "text-right" : ""
                      )}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/20">{t.expenseAmount}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateExpenseItem(item.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        className={cn(
                          "w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none focus:border-brand-primary/50 transition-all",
                          lang === 'ar' ? "text-right" : ""
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/20 block">{t.snapshot}</label>
                      <button
                        type="button"
                        onClick={() => handleExpensePhotoClick(item.id)}
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                          item.imageUrl ? "bg-brand-success/20 text-brand-success" : "bg-white/5 text-white/20 hover:bg-white/10"
                        )}
                      >
                        {item.imageUrl ? <CheckCircle2 size={24} /> : <Camera size={24} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeExpenseItem(item.id)}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-brand-danger text-white rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-all hover:bg-brand-danger/80"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <input
            type="file"
            ref={expenseFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleExpensePhotoUpload}
          />
        </section>

        {/* Calculations Dashboard */}
        <section className={cn(
          "rounded-[2rem] p-6 shadow-2xl border transition-all duration-500",
          calcs.isShortage ? "bg-brand-danger/5 border-brand-danger/20" : 
          calcs.isOver ? "bg-brand-primary/5 border-brand-primary/20" :
          "bg-brand-success/5 border-brand-success/20"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20">{t.syncReality}</h3>
            <Calculator size={16} className="text-white/10" />
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.totalComputed}</span>
              <span className="text-2xl font-black text-white">{formatCurrency(calcs.actualTotal)}</span>
            </div>
            
            <div className="h-px bg-white/5" />
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.variance}</span>
              <div className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                calcs.isShortage ? "text-brand-danger bg-brand-danger/20" : 
                calcs.isOver ? "text-brand-primary bg-brand-primary/20" :
                "text-brand-success bg-brand-success/20"
              )}>
                {calcs.isShortage ? <AlertCircle size={14} /> : calcs.isPerfect ? <CheckCircle2 size={14} /> : null}
                {calcs.difference > 0 ? '+' : ''}{formatCurrency(calcs.difference)}
              </div>
            </div>
          </div>
        </section>

        {/* Image Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20">{t.visualEvidence}</h3>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{images.length}/2 min</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square bg-white/2 border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary/50 hover:bg-white/5 transition-all group"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-brand-primary group-hover:bg-brand-primary/20 transition-all">
                <Camera size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40">{t.snapshot}</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                hidden 
                accept="image/*" 
                onChange={handleImageUpload}
              />
            </div>

            {images.map((img, idx) => (
              <div key={idx} className="aspect-square relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                <img src={img} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-brand-danger transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/20 px-2">
            {t.addendum} {calcs.isShortage && <span className="text-brand-danger ml-1">• {t.mandatoryShortage}</span>}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={lang === 'ar' ? "وثّق أي اختلافات أو أحداث خلال الوردية..." : "Document any discrepancies or shift events..."}
            className={cn(
              "w-full min-h-[140px] p-6 bg-[#151517] rounded-[2rem] border border-white/5 outline-none focus:border-brand-primary/50 transition-all text-sm font-semibold text-white placeholder:text-white/10 resize-none shadow-2xl",
              lang === 'ar' ? "text-right" : ""
            )}
          />
        </div>

        {/* Floating Submit Button Container */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent p-6 pb-10 z-40 lg:relative lg:p-0 lg:mt-12">
          <button
            type="submit"
            disabled={isSubmitting || (calcs.isShortage && !notes.trim()) || images.length === 0}
            className={cn(
              "w-full py-5 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-10 disabled:grayscale disabled:pointer-events-none group",
              calcs.isPerfect ? "bg-brand-success text-white shadow-brand-success/20" : ""
            )}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-sm">{t.authorizeTransmit}</span>
                <div className="w-8 h-8 bg-black/5 rounded-xl flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <Send size={18} />
                </div>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
