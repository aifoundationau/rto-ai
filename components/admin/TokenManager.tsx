import React, { useState } from 'react';
import {
  Coins, UserCheck, ShieldCheck, ShoppingBag, HeartHandshake, Send, Clock,
  ShieldAlert, ListTree, MailCheck, CreditCard, Heart, Award, Calculator,
  ShoppingCart, PlusCircle, Building2, CheckCircle2, ArrowRightLeft,
  Play, Database, MailWarning, X, Wallet, AtSign, Check
} from 'lucide-react';

const AUD_PER_TOKEN = 1.00;

const initialDB = {
  emergencyFund: {
    tokenBalance: 1450,
    totalDonationsCount: 18,
    beneficiariesSupported: 3
  },
  beneficiaries: [
    {
      id: "inst_1",
      name: "St. Jude Children's Haven",
      email: "stjude@orphanage.org",
      category: "Orphanage & Youth Care",
      description: "Full-time residential care and learning hub for 45 vulnerable children.",
      tokenBalance: 400,
      grantsReceivedTokens: 600,
      verified: true
    },
    {
      id: "inst_2",
      name: "Hope Horizon Shelter",
      email: "hope@shelter.org",
      category: "Community Housing & Crisis Support",
      description: "Emergency shelter and social services for families in lower socioeconomic tiers.",
      tokenBalance: 150,
      grantsReceivedTokens: 300,
      verified: true
    },
    {
      id: "inst_3",
      name: "Sunshine Coast Youth Care",
      email: "sunshine@youth.org",
      category: "Youth Mentorship",
      description: "After-school educational access and digital literacy programs.",
      tokenBalance: 200,
      grantsReceivedTokens: 250,
      verified: true
    }
  ],
  users: {
    "alex@example.com": {
      uid: "usr_alex123",
      email: "alex@example.com",
      tokenBalance: 250,
      lastDeductionDate: null,
      isAdmin: false
    },
    "stjude@orphanage.org": {
      uid: "usr_stjude",
      email: "stjude@orphanage.org",
      tokenBalance: 400,
      lastDeductionDate: null,
      isAdmin: false
    },
    "admin@example.com": {
      uid: "usr_admin007",
      email: "admin@example.com",
      tokenBalance: 1000,
      lastDeductionDate: null,
      isAdmin: true
    }
  } as Record<string, any>,
  pendingGifts: [
    {
      id: "gift_201",
      targetEmail: "newcommunitycenter@regional.org",
      senderEmail: "alex@example.com",
      tokens: 100,
      status: "PENDING",
      createdAt: "2026-09-28 10:30:00"
    }
  ],
  auditLogs: [
    {
      timestamp: "2026-09-28 10:30:00",
      action: "EMERGENCY_FUND_DONATION",
      performedBy: "alex@example.com",
      targetAllocation: "Emergency Token Fund Pool",
      tokensAdded: 500,
      reason: "Donor Lot Purchase Allocated to Emergency Fund (AUD $500.00)"
    },
    {
      timestamp: "2026-09-27 15:10:00",
      action: "GRANT_DISBURSED",
      performedBy: "admin@example.com",
      targetAllocation: "stjude@orphanage.org",
      tokensAdded: 250,
      reason: "Emergency Fund Disbursal for Learning Center Operations"
    }
  ]
};

export const TokenManager: React.FC = () => {
  const [db, setDb] = useState(initialDB);
  const [activeUserKey, setActiveUserKey] = useState("alex@example.com");
  const [activeTab, setActiveTab] = useState('store');
  const [toasts, setToasts] = useState<{id: number, message: string, type: string}[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  // Store/Checkout State
  const [customTokens, setCustomTokens] = useState(50);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutLot, setCheckoutLot] = useState({ tokens: 0, price: 0 });
  const [checkoutAllocation, setCheckoutAllocation] = useState('SELF');
  const [checkoutBeneficiary, setCheckoutBeneficiary] = useState('');
  const [customTargetEmail, setCustomTargetEmail] = useState('');

  // P2P State
  const [p2pTarget, setP2pTarget] = useState('EMERGENCY_FUND');
  const [p2pCustomEmail, setP2pCustomEmail] = useState('');
  const [p2pAmount, setP2pAmount] = useState<number | ''>('');

  // Admin State
  const [adminSource, setAdminSource] = useState('EMERGENCY_POOL');
  const [adminTarget, setAdminTarget] = useState('');
  const [adminAmount, setAdminAmount] = useState<number | ''>('');
  const [adminReason, setAdminReason] = useState('');

  const currentUser = db.users[activeUserKey] || { email: activeUserKey, tokenBalance: 0, isAdmin: false };
  const audValue = (currentUser.tokenBalance * AUD_PER_TOKEN).toFixed(2);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = toastIdCounter + 1;
    setToastIdCounter(id);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const forceUpdateDB = (newDb: any) => {
    setDb({ ...newDb });
  };

  const syncTokenTransactionToFirestore = (tx: {
    action: string;
    performedBy: string;
    targetAllocation?: string;
    tokensAmount: number;
    audEquivalent?: number;
    reason?: string;
    metadata?: any;
  }) => {
    try {
      fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      }).catch(err => console.warn('[TokenManager] Firestore transaction write:', err));
    } catch (e) {
      // non-blocking
    }
  };

  const handleP2PTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (p2pAmount === '' || p2pAmount <= 0) {
      showToast("Amount must be greater than zero", "error");
      return;
    }
    
    const sender = db.users[activeUserKey];
    if (sender.tokenBalance < p2pAmount) {
      showToast(`Insufficient balance of ${sender.tokenBalance}`, "error");
      return;
    }

    let recipientEmail = p2pTarget;
    if (p2pTarget === 'CUSTOM') {
      recipientEmail = p2pCustomEmail.trim().toLowerCase();
      if (!recipientEmail) {
        showToast("Please enter recipient email", "error");
        return;
      }
    }

    const newDb = { ...db };
    newDb.users[activeUserKey].tokenBalance -= p2pAmount;
    const audVal = (p2pAmount * AUD_PER_TOKEN).toFixed(2);

    if (recipientEmail === 'EMERGENCY_FUND') {
      newDb.emergencyFund.tokenBalance += p2pAmount;
      newDb.emergencyFund.totalDonationsCount += 1;
      showToast(`Transferred ${p2pAmount} tokens to Emergency Fund`, "success");
    } else if (newDb.users[recipientEmail]) {
      newDb.users[recipientEmail].tokenBalance += p2pAmount;
      showToast(`Transferred ${p2pAmount} tokens to ${recipientEmail}`, "success");
    } else {
      const foundBen = newDb.beneficiaries.find(b => b.email === recipientEmail);
      if (foundBen) {
        foundBen.tokenBalance += p2pAmount;
        showToast(`Funded ${foundBen.name} with ${p2pAmount} tokens`, "success");
      } else {
        newDb.pendingGifts.push({
          id: `gift_${Date.now()}`,
          targetEmail: recipientEmail,
          senderEmail: sender.email,
          tokens: p2pAmount,
          status: "PENDING",
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
        showToast(`Escrowed ${p2pAmount} tokens for unregistered ${recipientEmail}`, "info");
      }
    }

    newDb.auditLogs.unshift({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: "P2P_TRANSFER",
      performedBy: sender.email,
      targetAllocation: recipientEmail === 'EMERGENCY_FUND' ? 'Emergency Token Fund Pool' : recipientEmail,
      tokensAdded: -p2pAmount,
      reason: `P2P Allocation (AUD $${audVal})`
    });

    syncTokenTransactionToFirestore({
      action: "P2P_TRANSFER",
      performedBy: sender.email,
      targetAllocation: recipientEmail === 'EMERGENCY_FUND' ? 'Emergency Token Fund Pool' : recipientEmail,
      tokensAmount: -p2pAmount,
      audEquivalent: Number(audVal),
      reason: `P2P Allocation (AUD $${audVal})`
    });

    forceUpdateDB(newDb);
    setP2pAmount('');
  };

  const handleAdminGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.isAdmin) {
      showToast("PERMISSION_DENIED: Admin claims required", "error");
      return;
    }
    if (adminAmount === '' || adminAmount <= 0) {
      showToast("Grant amount must be greater than zero", "error");
      return;
    }

    const targetEmail = adminTarget.trim().toLowerCase();
    const newDb = { ...db };
    const audVal = (adminAmount * AUD_PER_TOKEN).toFixed(2);

    if (adminSource === 'EMERGENCY_POOL') {
      if (newDb.emergencyFund.tokenBalance < adminAmount) {
        showToast(`Emergency Pool only has ${newDb.emergencyFund.tokenBalance} tokens`, "error");
        return;
      }
      newDb.emergencyFund.tokenBalance -= adminAmount;
    }

    if (newDb.users[targetEmail]) {
      newDb.users[targetEmail].tokenBalance += adminAmount;
    } else {
      const foundBen = newDb.beneficiaries.find(b => b.email === targetEmail);
      if (foundBen) {
        foundBen.tokenBalance += adminAmount;
      } else {
        newDb.pendingGifts.push({
          id: `gift_${Date.now()}`,
          targetEmail: targetEmail,
          senderEmail: `ADMIN (${adminSource})`,
          tokens: adminAmount,
          status: "PENDING",
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
      }
    }

    newDb.auditLogs.unshift({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: "GRANT_DISBURSED",
      performedBy: currentUser.email,
      targetAllocation: targetEmail,
      tokensAdded: adminAmount,
      reason: `Source: ${adminSource} | ${adminReason} (AUD $${audVal})`
    });

    syncTokenTransactionToFirestore({
      action: "GRANT_DISBURSED",
      performedBy: currentUser.email,
      targetAllocation: targetEmail,
      tokensAmount: Number(adminAmount),
      audEquivalent: Number(audVal),
      reason: `Source: ${adminSource} | ${adminReason} (AUD $${audVal})`
    });

    forceUpdateDB(newDb);
    showToast(`Disbursed ${adminAmount} tokens to ${targetEmail}`, "success");
    setAdminAmount('');
    setAdminReason('');
  };

  const simulateDailyDeduction = () => {
    const todayISO = "2026-09-28";
    if (currentUser.tokenBalance <= 0) {
      showToast("Access Denied: 0 tokens remaining.", "error");
      return;
    }
    if (currentUser.lastDeductionDate === todayISO) {
      showToast(`Access Active: Today's fee was already consumed for ${todayISO}.`, "info");
      return;
    }

    const newDb = { ...db };
    newDb.users[activeUserKey].tokenBalance -= 1;
    newDb.users[activeUserKey].lastDeductionDate = todayISO;
    
    newDb.auditLogs.unshift({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: "DAILY_ACCESS_CONSUMPTION",
      performedBy: "ACCESS_SIMULATOR",
      targetAllocation: currentUser.email,
      tokensAdded: -1,
      reason: `Daily Access Active Usage (AUD $1.00 consumed for ${todayISO})`
    });

    syncTokenTransactionToFirestore({
      action: "DAILY_ACCESS_CONSUMPTION",
      performedBy: "ACCESS_SIMULATOR",
      targetAllocation: currentUser.email,
      tokensAmount: -1,
      audEquivalent: 1.0,
      reason: `Daily Access Active Usage (AUD $1.00 consumed for ${todayISO})`
    });

    forceUpdateDB(newDb);
    showToast(`Deducted 1 token for active day use.`, "success");
  };

  const initiateLotCheckout = (tokens: number, price: number) => {
    setCheckoutLot({ tokens, price });
    setCheckoutAllocation('SELF');
    setIsCheckoutOpen(true);
  };

  const executeStripeWebhookSimulation = () => {
    const newDb = { ...db };
    const tokensToGrant = checkoutLot.tokens;
    const audVal = (tokensToGrant * AUD_PER_TOKEN).toFixed(2);
    let targetEmail = activeUserKey;
    let actionType = "PURCHASE_SELF";

    if (checkoutAllocation === 'EMERGENCY_FUND') {
      newDb.emergencyFund.tokenBalance += tokensToGrant;
      newDb.emergencyFund.totalDonationsCount += 1;
      actionType = "EMERGENCY_FUND_DONATION";
      targetEmail = "Emergency Token Fund Pool";
      showToast(`Donated ${tokensToGrant} tokens to Emergency Fund!`, 'success');
    } else if (checkoutAllocation === 'SPECIFIC_BENEFICIARY') {
      const email = checkoutBeneficiary === 'CUSTOM' ? customTargetEmail.trim().toLowerCase() : checkoutBeneficiary;
      if (!email) {
        showToast("Please specify a recipient email", "error");
        return;
      }
      targetEmail = email;
      actionType = "DIRECT_BENEFICIARY_PURCHASE";

      if (newDb.users[targetEmail]) {
        newDb.users[targetEmail].tokenBalance += tokensToGrant;
        showToast(`Granted ${tokensToGrant} tokens directly to ${targetEmail}`, 'success');
      } else {
        const foundBen = newDb.beneficiaries.find(b => b.email === targetEmail);
        if (foundBen) {
          foundBen.tokenBalance += tokensToGrant;
          newDb.users[targetEmail] = { uid: foundBen.id, email: targetEmail, tokenBalance: foundBen.tokenBalance, isAdmin: false };
          showToast(`Funded ${foundBen.name} with ${tokensToGrant} tokens!`, 'success');
        } else {
          newDb.pendingGifts.push({
            id: `gift_${Date.now()}`,
            targetEmail: targetEmail,
            senderEmail: activeUserKey,
            tokens: tokensToGrant,
            status: "PENDING",
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
          });
          showToast(`Created Pending Escrow for ${targetEmail}`, 'info');
        }
      }
    } else {
      newDb.users[activeUserKey].tokenBalance += tokensToGrant;
      showToast(`Added ${tokensToGrant} tokens to your balance.`, 'success');
    }

    newDb.auditLogs.unshift({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: actionType,
      performedBy: activeUserKey,
      targetAllocation: targetEmail,
      tokensAdded: tokensToGrant,
      reason: `Lot Purchase (${tokensToGrant} Tokens) - AUD $${audVal}`
    });

    syncTokenTransactionToFirestore({
      action: actionType,
      performedBy: activeUserKey,
      targetAllocation: targetEmail,
      tokensAmount: tokensToGrant,
      audEquivalent: Number(audVal),
      reason: `Lot Purchase (${tokensToGrant} Tokens) - AUD $${audVal}`
    });

    forceUpdateDB(newDb);
    setIsCheckoutOpen(false);
  };

  const donateToEmergencyFund = (tokens: number) => {
    if (currentUser.tokenBalance < tokens) {
      showToast(`Insufficient wallet balance. Buying lot instead...`, "info");
      initiateLotCheckout(tokens, tokens * AUD_PER_TOKEN);
      return;
    }
    const newDb = { ...db };
    newDb.users[activeUserKey].tokenBalance -= tokens;
    newDb.emergencyFund.tokenBalance += tokens;
    newDb.emergencyFund.totalDonationsCount += 1;

    newDb.auditLogs.unshift({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: "EMERGENCY_FUND_DONATION",
      performedBy: currentUser.email,
      targetAllocation: "Emergency Token Fund Pool",
      tokensAdded: tokens,
      reason: `Direct Wallet Contribution (AUD $${(tokens * AUD_PER_TOKEN).toFixed(2)})`
    });

    syncTokenTransactionToFirestore({
      action: "EMERGENCY_FUND_DONATION",
      performedBy: currentUser.email,
      targetAllocation: "Emergency Token Fund Pool",
      tokensAmount: tokens,
      audEquivalent: Number((tokens * AUD_PER_TOKEN).toFixed(2)),
      reason: `Direct Wallet Contribution (AUD $${(tokens * AUD_PER_TOKEN).toFixed(2)})`
    });

    forceUpdateDB(newDb);
    showToast(`Donated ${tokens} tokens to the Emergency Fund.`, 'success');
  };

  const simulateNewUserSignup = (email: string) => {
    const newDb = { ...db };
    const gifts = newDb.pendingGifts.filter(g => g.targetEmail === email && g.status === 'PENDING');
    const totalTokens = gifts.reduce((sum, g) => sum + g.tokens, 0);

    newDb.users[email] = {
      uid: `usr_${Date.now()}`,
      email: email,
      tokenBalance: totalTokens,
      lastDeductionDate: null,
      isAdmin: false
    };

    gifts.forEach(g => g.status = "CLAIMED");
    forceUpdateDB(newDb);
    setActiveUserKey(email);
    showToast(`User ${email} registered & claimed ${totalTokens} pending tokens!`, "success");
  };

  const glassCard = "bg-slate-900/75 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-xl";

  return (
    <div className="bg-[#0b0f19] text-gray-100 min-h-[800px] rounded-3xl overflow-hidden font-sans shadow-2xl relative border border-slate-800">
      
      {/* Toast Container */}
      <div className="absolute top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`p-3.5 rounded-xl border flex items-center justify-between shadow-2xl backdrop-blur-md bg-slate-900/95 text-xs font-mono min-w-[300px] ${
            toast.type === 'success' ? 'border-emerald-500/40 text-emerald-200' : 
            toast.type === 'error' ? 'border-rose-500/40 text-rose-200' : 'border-indigo-500/40 text-indigo-200'
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))} className="text-gray-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-slate-900/85 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white leading-none">TokenPulse</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                  1 Token = AUD $1.00
                </span>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block mt-0.5">Community Emergency Fund</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-gray-800 text-xs">
              <span className="text-gray-400 px-2.5 font-medium flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Persona:</span>
              <button onClick={() => setActiveUserKey('alex@example.com')} className={`px-3 py-1 rounded-lg transition-all font-medium ${activeUserKey === 'alex@example.com' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Alex</button>
              <button onClick={() => setActiveUserKey('stjude@orphanage.org')} className={`px-3 py-1 rounded-lg transition-all font-medium ${activeUserKey === 'stjude@orphanage.org' ? 'bg-rose-600 text-white' : 'text-gray-300'}`}>St. Jude</button>
              <button onClick={() => setActiveUserKey('admin@example.com')} className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1 ${activeUserKey === 'admin@example.com' ? 'bg-amber-600 text-white' : 'text-gray-300'}`}><ShieldCheck className="w-3.5 h-3.5" /> Admin</button>
            </div>

            <div className="flex items-center space-x-2 bg-indigo-950/60 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-semibold text-white font-mono hidden sm:inline">{currentUser.email}</span>
              <span className="text-gray-700 hidden sm:inline">|</span>
              <div className="flex items-center text-amber-400 font-bold font-mono text-sm gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{currentUser.tokenBalance}</span>
                <span className="text-[10px] text-gray-400 font-sans font-normal">(AUD ${audValue})</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800/80 bg-gray-900/50">
        <nav className="flex space-x-2 overflow-x-auto p-2 max-w-7xl mx-auto">
          {[
            { id: 'store', label: 'Token Lots Store', icon: ShoppingBag },
            { id: 'emergency', label: 'Emergency Fund Hub', icon: HeartHandshake, color: 'text-rose-400' },
            { id: 'p2p', label: 'Direct Allocation', icon: Send },
            { id: 'usage', label: 'Access Simulator', icon: Clock },
            ...(currentUser.isAdmin ? [{ id: 'admin', label: 'Super Admin', icon: ShieldAlert, color: 'text-amber-400' }] : []),
            { id: 'audit', label: 'Audit Trail', icon: ListTree },
            { id: 'pending', label: 'Pending Escrow', icon: MailCheck }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === t.id ? 'border-b-2 border-indigo-500 text-indigo-300 bg-indigo-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <t.icon className={`w-4 h-4 ${t.color || ''}`} /> {t.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-800">
        
        {/* VIEW: STORE */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <div className={`${glassCard} bg-gradient-to-r from-indigo-950/40 to-purple-950/30 border-indigo-500/20`}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">STRIPE LOTS ENGINE</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">FIXED RATE: 1 TOKEN = AUD $1.00</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">EMERGENCY FUND ENABLED</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Purchase & Allocate Tokens</h1>
              <p className="text-sm text-gray-300 max-w-2xl">Buy tokens in standard lots. Allocate them to yourself, a beneficiary, or our <strong className="text-rose-400">Emergency Fund</strong>.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { tokens: 10, price: 10, title: 'Standard Lot', desc: 'Starter lot for personal access', icon: CreditCard, color: 'indigo-600', hoverColor: 'indigo-500' },
                { tokens: 100, price: 100, title: 'Community Lot', desc: 'Most popular. Fund days of access', icon: Heart, color: 'indigo-600', hoverColor: 'indigo-500', featured: true },
                { tokens: 1000, price: 1000, title: 'Sponsor Lot', desc: 'Major institutional sponsorship', icon: Award, color: 'purple-600', hoverColor: 'purple-500' }
              ].map(lot => (
                <div key={lot.tokens} className={`${glassCard} flex flex-col justify-between group relative ${lot.featured ? 'border-indigo-500/50 bg-indigo-950/20' : ''}`}>
                  {lot.featured && <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">Most Popular</div>}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-xs font-mono font-semibold uppercase ${lot.featured ? 'text-indigo-300' : 'text-gray-300'}`}>{lot.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-800 text-gray-300">{lot.tokens} Tokens</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 my-3">
                      <span className="text-3xl font-bold text-white">AUD ${lot.price}.00</span>
                    </div>
                    <div className="my-4 py-3 border-y border-gray-800/80 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Non-Expiring Access:</span>
                      <span className="font-bold text-amber-400 flex items-center gap-1 font-mono"><Coins className="w-3.5 h-3.5" /> {lot.tokens} Token Lot</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-6">{lot.desc}</p>
                  </div>
                  <button onClick={() => initiateLotCheckout(lot.tokens, lot.price)} className={`w-full py-2.5 bg-${lot.color} hover:bg-${lot.hoverColor} text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all`}>
                    <lot.icon className={`w-4 h-4 ${lot.featured ? 'text-rose-300' : ''}`} /> Buy {lot.tokens} Tokens
                  </button>
                </div>
              ))}
            </div>

            <div className={`${glassCard} flex flex-col sm:flex-row items-center justify-between gap-4`}>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2"><Calculator className="w-4 h-4 text-indigo-400"/> Custom Token Lot Calculator</h3>
                <p className="text-xs text-gray-400">Calculate custom lots at AUD $1.00 parity</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="number" value={customTokens} onChange={e => setCustomTokens(parseInt(e.target.value) || 1)} className="w-24 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-indigo-500 outline-none" />
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block uppercase">Total Price</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">AUD ${(customTokens * AUD_PER_TOKEN).toFixed(2)}</span>
                </div>
                <button onClick={() => initiateLotCheckout(customTokens, customTokens * AUD_PER_TOKEN)} className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs flex items-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5"/> Purchase Custom</button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: EMERGENCY FUND */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <div className={`${glassCard} border-rose-500/30 bg-gradient-to-r from-rose-950/30 to-indigo-950/20 flex flex-col md:flex-row justify-between gap-6`}>
              <div className="space-y-3 max-w-2xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Heart className="w-6 h-6 text-rose-500 fill-rose-500/20"/> Emergency Token Fund</h2>
                <p className="text-sm text-gray-300 leading-relaxed">Donated tokens directly subsidize software and platform access for orphanages, community shelters, and institutions supporting lower socioeconomic groups.</p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <button onClick={() => donateToEmergencyFund(10)} className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 border border-rose-500/30 rounded-lg text-xs font-mono flex items-center gap-1 transition-all"><PlusCircle className="w-3.5 h-3.5"/> Donate 10 Tokens</button>
                  <button onClick={() => donateToEmergencyFund(100)} className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 border border-rose-500/30 rounded-lg text-xs font-mono flex items-center gap-1 transition-all"><PlusCircle className="w-3.5 h-3.5"/> Donate 100 Tokens</button>
                </div>
              </div>
              <div className="bg-gray-950/90 p-4 rounded-xl border border-rose-500/30 text-center min-w-[220px] shadow-lg">
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Pool Balance</span>
                <div className="text-3xl font-extrabold font-mono text-amber-400 flex items-center justify-center gap-1.5 my-1">
                  <Coins className="w-6 h-6 text-amber-400"/> {db.emergencyFund.tokenBalance.toLocaleString()}
                </div>
                <span className="text-xs font-mono text-emerald-400">(AUD ${(db.emergencyFund.tokenBalance * AUD_PER_TOKEN).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-indigo-400"/> Verified Institutional Beneficiaries</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {db.beneficiaries.map(ben => (
                  <div key={ben.id} className={`${glassCard} flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{ben.category}</span>
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</span>
                      </div>
                      <h4 className="text-base font-bold text-white leading-tight">{ben.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono mb-2">{ben.email}</p>
                      <p className="text-xs text-gray-300">{ben.description}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-800/80 space-y-3">
                      <div className="flex justify-between items-center text-xs font-mono"><span className="text-gray-400">Granted Tokens:</span><span className="text-amber-400 font-bold">{ben.tokenBalance} Tokens</span></div>
                      <button onClick={() => { initiateLotCheckout(100, 100); setCheckoutAllocation('SPECIFIC_BENEFICIARY'); setCheckoutBeneficiary(ben.email); }} className="w-full py-2 bg-indigo-900/30 hover:bg-indigo-800/50 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all"><Heart className="w-3.5 h-3.5 text-rose-400"/> Fund This Institution</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: P2P ALLOCATION */}
        {activeTab === 'p2p' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 ${glassCard} space-y-5`}>
              <div className="border-b border-gray-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-indigo-400"/> Direct Token Allocation & P2P</h2>
                <p className="text-xs text-gray-400 mt-1">Transfer tokens from your balance directly to individuals or institutions.</p>
              </div>
              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20"><Wallet className="w-5 h-5"/></div>
                  <div>
                    <p className="text-xs text-gray-400">Available Wallet Balance</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-bold font-mono text-white">{currentUser.tokenBalance} Tokens</p>
                      <p className="text-xs font-mono text-emerald-400">(AUD ${audValue})</p>
                    </div>
                  </div>
                </div>
              </div>
              <form onSubmit={handleP2PTransfer} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Target Destination</label>
                  <select value={p2pTarget} onChange={e => setP2pTarget(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none focus:border-indigo-500">
                    <option value="EMERGENCY_FUND">❤️ Donate to 'Emergency Token Fund'</option>
                    {db.beneficiaries.map(b => <option key={b.id} value={b.email}>🏛️ {b.name} ({b.email})</option>)}
                    <option value="CUSTOM">✉️ Direct Recipient Email (Custom)</option>
                  </select>
                </div>
                {p2pTarget === 'CUSTOM' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Custom Recipient Email Address</label>
                    <div className="relative">
                      <AtSign className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                      <input type="email" value={p2pCustomEmail} onChange={e => setP2pCustomEmail(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-mono outline-none focus:border-indigo-500" placeholder="recipient@example.com" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Tokens to Allocate</label>
                  <div className="relative">
                    <Coins className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                    <input type="number" value={p2pAmount} onChange={e => setP2pAmount(parseInt(e.target.value) || '')} className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-24 py-2.5 text-sm text-white font-mono outline-none focus:border-indigo-500" placeholder="10" />
                    <span className="absolute right-3.5 top-3 text-xs font-mono text-gray-500">AUD ${(Number(p2pAmount) * AUD_PER_TOKEN).toFixed(2)}</span>
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg"><Send className="w-4 h-4"/> Execute Token Allocation</button>
              </form>
            </div>
            <div className={`${glassCard} flex flex-col justify-between`}>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400"/> Non-Expiring Escrow Logic</h3>
                <ul className="space-y-3 text-xs text-gray-400">
                  <li className="flex items-start gap-2 bg-gray-950/50 p-3 rounded-xl border border-gray-800/60"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> <span><strong>Emergency Fund:</strong> Direct transfers increase public pool.</span></li>
                  <li className="flex items-start gap-2 bg-gray-950/50 p-3 rounded-xl border border-gray-800/60"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> <span><strong>Unregistered:</strong> Tokens sent to non-registered emails sit safely in pending escrow.</span></li>
                  <li className="flex items-start gap-2 bg-gray-950/50 p-3 rounded-xl border border-gray-800/60"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> <span><strong>Atomic Checks:</strong> System verifies available balance prior to completing allocations.</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: ACCESS SIMULATOR */}
        {activeTab === 'usage' && (
          <div className={`${glassCard}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-400"/> Non-Expiring Access Engine</h2>
                <p className="text-xs text-gray-400 mt-1">Tokens do not expire over time. 1 Token is deducted only when an active day of platform access is consumed.</p>
              </div>
              <button onClick={simulateDailyDeduction} className="py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-sm font-medium flex items-center gap-2 shrink-0 transition-all"><Play className="w-4 h-4"/> Simulate Active Day Use</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <span className="text-[11px] text-gray-400 uppercase font-mono tracking-wider">Active Wallet Balance</span>
                <div className="text-2xl font-bold font-mono text-white flex items-center gap-2 mt-1"><Coins className="w-5 h-5 text-amber-400"/> {currentUser.tokenBalance} Tokens</div>
                <p className="text-[10px] text-gray-500 font-mono">Value: AUD ${audValue}</p>
              </div>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <span className="text-[11px] text-gray-400 uppercase font-mono tracking-wider">Last Deduction Date</span>
                <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">{currentUser.lastDeductionDate || 'None Consumed Today'}</div>
                <p className="text-[10px] text-gray-500 font-mono">1 Token/Day Rate</p>
              </div>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <span className="text-[11px] text-gray-400 uppercase font-mono tracking-wider">Access Status</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 flex items-center gap-2 mt-1"><CheckCircle2 className="w-5 h-5"/> Access Active</div>
                <p className="text-[10px] text-emerald-500 font-mono">Non-expiring balance valid anytime</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: ADMIN */}
        {activeTab === 'admin' && currentUser.isAdmin && (
          <div className={`${glassCard} border-amber-500/30 bg-amber-950/10`}>
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30"><ShieldAlert className="w-6 h-6"/></div>
                <div>
                  <h2 className="text-lg font-bold text-white">Super Admin Control Panel</h2>
                  <p className="text-xs text-gray-400">Disburse tokens from Emergency Fund or issue direct support grants.</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleAdminGrant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Source / Type of Grant</label>
                  <select value={adminSource} onChange={e => setAdminSource(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500 font-mono">
                    <option value="EMERGENCY_POOL">Disburse From Emergency Token Fund Pool</option>
                    <option value="SYSTEM_MINT">Direct System Token Grant / Support Override</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Target Institution or User Email</label>
                  <input type="email" value={adminTarget} onChange={e => setAdminTarget(e.target.value)} required className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500 font-mono" placeholder="stjude@orphanage.org" />
                </div>
              </div>
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Grant Token Amount</label>
                  <input type="number" value={adminAmount} onChange={e => setAdminAmount(parseInt(e.target.value) || '')} required min="1" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500 font-mono" placeholder="250" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Grant Justification / Notes</label>
                  <input type="text" value={adminReason} onChange={e => setAdminReason(e.target.value)} required className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500 font-mono" placeholder="Q3 Emergency Grant" />
                </div>
                <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"><Award className="w-4 h-4"/> Execute Grant Disbursement</button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className={`${glassCard}`}>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-gray-800 pb-4"><Database className="w-5 h-5 text-indigo-400"/> Immutable Audit Trail</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300 font-mono">
                <thead className="border-b border-gray-800 text-[10px] uppercase text-gray-500">
                  <tr><th className="py-2 px-2">Time</th><th className="py-2 px-2">Action</th><th className="py-2 px-2">By</th><th className="py-2 px-2">Target</th><th className="py-2 px-2">Tokens</th><th className="py-2 px-2">Reason</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {db.auditLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-gray-800/30">
                      <td className="py-2.5 px-2 text-gray-400">{log.timestamp}</td>
                      <td className="py-2.5 px-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 ${log.action.includes('GRANT') ? 'text-amber-400' : 'text-indigo-300'}`}>{log.action}</span></td>
                      <td className="py-2.5 px-2">{log.performedBy}</td>
                      <td className="py-2.5 px-2 text-indigo-400 font-bold">{log.targetAllocation}</td>
                      <td className={`py-2.5 px-2 font-bold ${log.tokensAdded > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{log.tokensAdded > 0 ? '+' : ''}{log.tokensAdded}</td>
                      <td className="py-2.5 px-2 text-gray-500 truncate max-w-xs">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: PENDING ESCROW */}
        {activeTab === 'pending' && (
          <div className={`${glassCard}`}>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-gray-800 pb-4"><MailWarning className="w-5 h-5 text-purple-400"/> Pending Gift Escrow</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300 font-mono">
                <thead className="border-b border-gray-800 text-[10px] uppercase text-gray-500">
                  <tr><th className="py-2 px-2">Created At</th><th className="py-2 px-2">Target Email</th><th className="py-2 px-2">Sender</th><th className="py-2 px-2">Tokens</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {db.pendingGifts.map(gift => (
                    <tr key={gift.id} className="hover:bg-gray-800/30">
                      <td className="py-2.5 px-2 text-gray-400">{gift.createdAt}</td>
                      <td className="py-2.5 px-2 font-bold text-indigo-300">{gift.targetEmail}</td>
                      <td className="py-2.5 px-2">{gift.senderEmail}</td>
                      <td className="py-2.5 px-2 font-bold text-amber-400">+{gift.tokens}</td>
                      <td className="py-2.5 px-2"><span className="bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20 text-[10px]">{gift.status}</span></td>
                      <td className="py-2.5 px-2">
                        {gift.status === 'PENDING' ? (
                          <button onClick={() => simulateNewUserSignup(gift.targetEmail)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white text-[11px] font-sans transition-all shadow-sm">Simulate Registration</button>
                        ) : <span className="text-gray-600">Claimed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-indigo-400">
                <CreditCard className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Stripe Checkout</h3>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800/80 font-mono text-xs space-y-2">
              <div className="flex justify-between text-gray-400"><span>Purchasing Lot:</span><span className="text-white font-bold">{checkoutLot.tokens} Tokens</span></div>
              <div className="flex justify-between text-gray-400"><span>Conversion:</span><span className="text-amber-400">1 Token = AUD $1.00</span></div>
              <div className="flex justify-between text-gray-400 border-t border-gray-800 pt-2 mt-2"><span>Total Charge:</span><span className="font-bold text-emerald-400 text-sm">AUD ${checkoutLot.price.toFixed(2)}</span></div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-300">Who should receive these tokens?</label>
              <div className="space-y-2 text-xs">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checkoutAllocation === 'SELF' ? 'bg-gray-950 border-indigo-500/50' : 'bg-gray-950/60 border-gray-800'}`}>
                  <input type="radio" value="SELF" checked={checkoutAllocation === 'SELF'} onChange={() => setCheckoutAllocation('SELF')} className="text-indigo-600 focus:ring-indigo-500" />
                  <div>
                    <span className="font-bold text-white block">Self / Personal Account</span>
                    <span className="text-[11px] text-gray-400 block">{activeUserKey}</span>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checkoutAllocation === 'EMERGENCY_FUND' ? 'bg-rose-950/30 border-rose-500/50' : 'bg-rose-950/10 border-rose-500/30'}`}>
                  <input type="radio" value="EMERGENCY_FUND" checked={checkoutAllocation === 'EMERGENCY_FUND'} onChange={() => setCheckoutAllocation('EMERGENCY_FUND')} className="text-rose-600 focus:ring-rose-500" />
                  <div>
                    <span className="font-bold text-rose-300 flex items-center gap-1">❤️ Donate to Emergency Fund</span>
                    <span className="text-[11px] text-gray-400 block">Assists orphanages and shelters</span>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checkoutAllocation === 'SPECIFIC_BENEFICIARY' ? 'bg-gray-950 border-indigo-500/50' : 'bg-gray-950/60 border-gray-800'}`}>
                  <input type="radio" value="SPECIFIC_BENEFICIARY" checked={checkoutAllocation === 'SPECIFIC_BENEFICIARY'} onChange={() => setCheckoutAllocation('SPECIFIC_BENEFICIARY')} className="text-indigo-600 focus:ring-indigo-500" />
                  <div>
                    <span className="font-bold text-white block">Direct Recipient or Institution</span>
                  </div>
                </label>
              </div>

              {checkoutAllocation === 'SPECIFIC_BENEFICIARY' && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                  <select value={checkoutBeneficiary} onChange={e => setCheckoutBeneficiary(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none">
                    <option value="">-- Choose Institution or Custom --</option>
                    {db.beneficiaries.map(b => <option key={b.id} value={b.email}>{b.name}</option>)}
                    <option value="CUSTOM">Custom Recipient Email...</option>
                  </select>
                  {checkoutBeneficiary === 'CUSTOM' && (
                    <input type="email" value={customTargetEmail} onChange={e => setCustomTargetEmail(e.target.value)} placeholder="enter.email@institution.org" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none" />
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsCheckoutOpen(false)} className="w-1/2 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium transition-all">Cancel</button>
              <button onClick={executeStripeWebhookSimulation} className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"><CheckCircle2 className="w-4 h-4"/> Complete Purchase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
