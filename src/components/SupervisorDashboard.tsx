import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Wallet,
  Calendar,
  MoreVertical,
  ExternalLink,
  FileText,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { DailyClosing, User } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { closingService } from '../services/dataService';
import { format } from 'date-fns';
import { Language, translations } from '../lib/i18n';

interface SupervisorDashboardProps {
  user: User;
  lang: Language;
}

export default function SupervisorDashboard({ user, lang }: SupervisorDashboardProps) {
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClosing, setSelectedClosing] = useState<DailyClosing | null>(null);

  const t = translations[lang];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const data = await closingService.getClosings();
    setClosings(data);
    setIsLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    await closingService.updateStatus(id, status);
    loadData();
    if (selectedClosing?.id === id) {
      setSelectedClosing(prev => prev ? { ...prev, status } : null);
    }
  };

  const filteredClosings = useMemo(() => {
    return closings.filter(c => {
      const matchesSearch = c.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.branchName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [closings, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalActual = closings.reduce((sum, c) => sum + c.actualTotal, 0);
    const totalDiff = closings.reduce((sum, c) => sum + c.difference, 0);
    const pendingCount = closings.filter(c => c.status === 'pending').length;
    
    return {
      totalActual,
      totalDiff,
      pendingCount
    };
  }, [closings]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#151517] p-6 rounded-[2rem] shadow-2xl border border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-brand-success/10 rounded-xl flex items-center justify-center text-brand-success">
              <TrendingUp size={20} />
            </div>
            <span className="text-[9px] font-black text-brand-success uppercase tracking-widest bg-brand-success/10 px-2.5 py-1 rounded-full">{t.grossSales}</span>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-white">{formatCurrency(stats.totalActual)}</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Network-wide liquidity</p>
          </div>
        </div>

        <div className="bg-[#151517] p-6 rounded-[2rem] shadow-2xl border border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className={cn(
               "w-10 h-10 rounded-xl flex items-center justify-center",
               stats.totalDiff >= 0 ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-danger/10 text-brand-danger"
            )}>
              <Wallet size={20} />
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
              stats.totalDiff >= 0 ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-danger/10 text-brand-danger"
            )}>{t.netVariance}</span>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-white">{stats.totalDiff > 0 ? '+' : ''}{formatCurrency(stats.totalDiff)}</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">System discrepancy total</p>
          </div>
        </div>

        <div className="bg-[#151517] p-6 rounded-[2rem] shadow-2xl border border-white/5 flex flex-col gap-4 border-l-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400">
              <Clock size={20} />
            </div>
            <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2.5 py-1 rounded-full">{t.pendingQueue}</span>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-white">{stats.pendingCount}</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Reports awaiting validation</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#151517] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group max-w-sm w-full">
            <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors", lang === 'ar' ? "right-5" : "left-5")} />
            <input
              type="text"
              placeholder={t.filterPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-semibold text-white outline-none focus:bg-white/10 focus:border-brand-primary/50 transition-all placeholder:text-white/10",
                lang === 'ar' ? "pr-14 pl-4 text-right" : "pl-14 pr-4"
              )}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  statusFilter === status 
                    ? "bg-white text-black shadow-2xl" 
                    : "bg-white/5 text-white/30 hover:bg-white/10"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table/List */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-4 text-white/10">
              <div className="w-12 h-12 border-4 border-white/5 border-t-brand-primary rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Hydrating Ledger...</span>
            </div>
          ) : filteredClosings.length === 0 ? (
            <div className="p-24 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/5">
                <FileText size={32} />
              </div>
              <h3 className="font-black text-white/20 uppercase tracking-widest">Zero Data Found</h3>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <thead>
                <tr className={cn("bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.25em] text-white/20", lang === 'ar' ? "text-right" : "text-left")}>
                  <th className="px-8 py-5">Personnel / Timestamp</th>
                  <th className="px-8 py-5">Origin</th>
                  <th className="px-8 py-5">Capitalization</th>
                  <th className="px-8 py-5">Variance</th>
                  <th className="px-8 py-5 text-center">Protocol</th>
                  <th className="px-8 py-5 text-right">Insight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredClosings.map((closing) => (
                  <tr 
                    key={closing.id} 
                    className="group hover:bg-white/[0.03] transition-all cursor-pointer"
                    onClick={() => setSelectedClosing(closing)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 font-black border border-white/5 group-hover:border-brand-primary/30 transition-all">
                          {closing.cashierName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white mb-1 group-hover:text-brand-primary transition-colors">{closing.cashierName}</p>
                          <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                            {format(new Date(closing.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-tight">{closing.branchName}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-black text-white">
                           {formatCurrency(closing.actualTotal)}
                        </div>
                        <div className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                          Target: {formatCurrency(closing.expectedSales)}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        closing.difference < 0 ? "text-brand-danger bg-brand-danger/10" : closing.difference > 0 ? "text-brand-primary bg-brand-primary/10" : "text-brand-success bg-brand-success/10"
                      )}>
                        {closing.difference > 0 ? '+' : ''}{formatCurrency(closing.difference)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        closing.status === 'approved' ? "bg-brand-success/10 text-brand-success border-brand-success/20" :
                        closing.status === 'rejected' ? "bg-brand-danger/10 text-brand-danger border-brand-danger/20" :
                        "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      )}>
                        {closing.status === 'approved' && <CheckCircle2 size={10} />}
                        {closing.status === 'rejected' && <XCircle size={10} />}
                        {closing.status === 'pending' && <Clock size={10} />}
                        {closing.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-white/10 group-hover:text-brand-primary transition-colors">
                        <ChevronRight size={20} className={cn(lang === 'ar' ? "rotate-180" : "")} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Side Panel / Dialog */}
      {selectedClosing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#0A0A0B]/90 backdrop-blur-md"
            onClick={() => setSelectedClosing(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-[#151517] rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Modal Header */}
            <div className="p-10 border-b border-white/5 flex items-center justify-between sticky top-0 z-10 bg-[#151517]">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white uppercase tracking-tight">{t.ledgerDetail}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{selectedClosing.branchName}</span>
                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">REF: {selectedClosing.id.substr(0,8).toUpperCase()}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedClosing(null)}
                className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 hover:text-white transition-all border border-white/5"
              >
                <XCircle size={28} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={cn("p-10 overflow-y-auto space-y-10 no-scrollbar", lang === 'ar' ? "text-right" : "text-left")}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" dir="ltr">
                <div className="bg-white/5 p-5 rounded-2x">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1">Cash Liquid</span>
                  <p className="font-bold text-white text-lg">{formatCurrency(selectedClosing.cashAmount)}</p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1">POS Credit</span>
                  <p className="font-bold text-white text-lg">{formatCurrency(selectedClosing.cardAmount)}</p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1">Outflow</span>
                  <p className="font-bold text-brand-warning text-lg">{formatCurrency(selectedClosing.expenses)}</p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1">Net Aggregated</span>
                  <p className="font-black text-brand-primary text-lg">{formatCurrency(selectedClosing.actualTotal)}</p>
                </div>
              </div>

              {selectedClosing.customPayments && selectedClosing.customPayments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] px-1">{t.appSales}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedClosing.customPayments.map((cp, idx) => (
                      <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1">{cp.methodLabel}</span>
                          <p className="font-bold text-white text-lg">{formatCurrency(cp.amount)}</p>
                        </div>
                        {cp.imageUrl && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                            <img src={cp.imageUrl} className="w-full h-full object-cover" alt={cp.methodLabel} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] px-1">Visual Verification</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedClosing.imageUrls.length > 0 ? selectedClosing.imageUrls.map((url, idx) => (
                    <div key={idx} className="aspect-video rounded-3xl bg-white/5 overflow-hidden group relative border border-white/5">
                      <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Evidence" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <ExternalLink className="text-white" size={24} />
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-white/10">
                      <ImageIcon size={40} />
                      <span className="text-[10px] font-black uppercase mt-3 tracking-widest">Metadata Empty</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] px-1">{t.operatorNotes}</h3>
                <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5">
                  <p className="text-sm text-white/70 leading-relaxed font-semibold italic">
                    "{selectedClosing.notes || (lang === 'ar' ? "لم يتم تقديم ملاحظات." : "No operational context provided.")}"
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={cn("p-10 border-t border-white/5 bg-white/[0.02] flex items-center gap-4 sticky bottom-0 z-10", lang === 'ar' ? "justify-start" : "justify-end")}>
              {selectedClosing.status === 'pending' ? (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(selectedClosing!.id, 'rejected')}
                    className="px-8 py-4 bg-white/5 border border-white/10 text-brand-danger rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-danger/10 hover:border-brand-danger/20 transition-all"
                  >
                    {t.rejectProtocol}
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedClosing!.id, 'approved')}
                    className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/90 shadow-2xl transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    {t.validateApprove}
                  </button>
                </>
              ) : (
                <div className={cn(
                  "px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 border",
                  selectedClosing.status === 'approved' ? "bg-brand-success/10 text-brand-success border-brand-success/20" : "bg-brand-danger/10 text-brand-danger border-brand-danger/20"
                )}>
                  {selectedClosing.status === 'approved' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  Node Status: {selectedClosing.status}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
