import React, { RefObject, useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Users,
  Building,
  Search,
  X,
  Phone,
} from 'lucide-react';
import { formatNumber } from '@/lib/format';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product, Contact } from '@/types';

interface PosSearchCustomerBarProps {
  customerMode: 'cash' | 'customer' | 'both' | 'supplier';
  setCustomerMode: (mode: 'cash' | 'customer' | 'both' | 'supplier') => void;
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  customers: Contact[];
  onOpenCustomerModal: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchResults: Product[];
  searchInputRef: RefObject<HTMLInputElement | null>;
  onSearchKeyDown: (e: React.KeyboardEvent) => void;
  onAddToCart: (product: Product) => void;
  availableFor: (pId: string) => number;
  cartCount: number;
  priceTier: string;
  setPriceTier: (tier: string) => void;
}

export function PosSearchCustomerBar({
  customerMode,
  setCustomerMode,
  selectedCustomerId,
  setSelectedCustomerId,
  customers,
  onOpenCustomerModal,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
  searchResults,
  searchInputRef,
  onSearchKeyDown,
  onAddToCart,
  availableFor,
  cartCount,
  priceTier,
  setPriceTier,
}: PosSearchCustomerBarProps) {
  const router = useRouter();
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Smart Search State
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const customerContainerRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        customerContainerRef.current &&
        !customerContainerRef.current.contains(e.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Filter lists based on target contact type
  // Type 'customer' only
  const onlyCustomers = useMemo(() => {
    return customers.filter((c) => c.type === 'customer');
  }, [customers]);

  // Type 'both' (عميل/مورد)
  const onlyBothContacts = useMemo(() => {
    return customers.filter((c) => c.type === 'both');
  }, [customers]);

  // Current active contacts pool depending on active mode ('customer' vs 'both')
  const activeContactsPool = useMemo(() => {
    if (customerMode === 'both') {
      return onlyBothContacts;
    }
    if (customerMode === 'customer') {
      return onlyCustomers;
    }
    return [];
  }, [customerMode, onlyBothContacts, onlyCustomers]);

  // Filtered contacts based on live search query
  const filteredContacts = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) {
      return activeContactsPool.slice(0, 30);
    }
    return activeContactsPool
      .filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const phoneMatch =
          c.phone?.toLowerCase().includes(q) || c.mobile?.toLowerCase().includes(q);
        const codeMatch = c.code?.toLowerCase().includes(q);
        return nameMatch || phoneMatch || codeMatch;
      })
      .slice(0, 30);
  }, [activeContactsPool, customerSearchQuery]);

  // Handle selecting a contact
  const handleSelectContact = (c: Contact) => {
    setSelectedCustomerId(c.id);
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    // Focus back on product barcode search
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  // Keyboard navigation inside customer search
  const handleCustomerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredContacts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredContacts.length > 0 && filteredContacts[highlightedIndex]) {
        handleSelectContact(filteredContacts[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsCustomerDropdownOpen(false);
    }
  };

  // Helper for balance label
  const getBalanceBadge = (bal: number) => {
    if (Math.abs(bal) < 0.01) {
      return 'رصيد: 0.00 ج.م (متزن)';
    }
    if (bal > 0) {
      return `رصيد: ${formatNumber(bal)} ج.م (مدين)`;
    }
    return `رصيد: ${formatNumber(Math.abs(bal))} ج.م (دائن)`;
  };

  return (
    <div className="bg-white dark:bg-[#111726] border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
      {/* Right side: Segmented Buttons + Conditional Smart Search Input */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {/* Customer Segmented Pill */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
          {/* 1. نقدي (زبون نقدي - بدون إظهار حقل بحث) */}
          <button
            type="button"
            onClick={() => {
              setCustomerMode('cash');
              setSelectedCustomerId('');
              setCustomerSearchQuery('');
              setIsCustomerDropdownOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              customerMode === 'cash'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>نقدي</span>
          </button>

          {/* 2. العملاء (يظهر حقل بحث للعملاء فقط) */}
          <button
            type="button"
            onClick={() => {
              setCustomerMode('customer');
              if (selectedCustomer && selectedCustomer.type !== 'customer') {
                setSelectedCustomerId('');
              }
              setIsCustomerDropdownOpen(true);
              setTimeout(() => customerInputRef.current?.focus(), 100);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              customerMode === 'customer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>
              {selectedCustomer && customerMode === 'customer'
                ? selectedCustomer.name
                : 'العملاء'}
            </span>
          </button>

          {/* 3. عميل/مورد (يظهر حقل بحث للعميل/مورد فقط) */}
          <button
            type="button"
            onClick={() => {
              setCustomerMode('both');
              if (selectedCustomer && selectedCustomer.type !== 'both') {
                setSelectedCustomerId('');
              }
              setIsCustomerDropdownOpen(true);
              setTimeout(() => customerInputRef.current?.focus(), 100);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              customerMode === 'both'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>
              {selectedCustomer && customerMode === 'both'
                ? selectedCustomer.name
                : 'عميل/مورد'}
            </span>
          </button>
        </div>

        {/* SMART CUSTOMER SEARCH INPUT - Only rendered when mode is 'customer' or 'both' */}
        {customerMode !== 'cash' && (
          <div ref={customerContainerRef} className="relative w-full sm:w-64 md:w-72 animate-in fade-in duration-150">
            <div
              className={`relative flex items-center h-10 rounded-2xl bg-white dark:bg-slate-900 border-2 transition-all shadow-2xs ${
                isCustomerDropdownOpen || selectedCustomerId
                  ? 'border-fuchsia-500 dark:border-fuchsia-500 ring-2 ring-fuchsia-500/20'
                  : 'border-fuchsia-400/80 dark:border-fuchsia-600/70 hover:border-fuchsia-500'
              }`}
            >
              {/* Left side in RTL: Count Pill & Search Icon */}
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 pointer-events-none">
                <span className="text-xs font-mono font-bold">
                  {customerSearchQuery.trim()
                    ? filteredContacts.length
                    : activeContactsPool.length}
                </span>
                <Search className="w-3.5 h-3.5 text-blue-500" />
              </div>

              {/* Input Field */}
              <input
                ref={customerInputRef}
                type="text"
                value={
                  isCustomerDropdownOpen
                    ? customerSearchQuery
                    : selectedCustomer
                    ? selectedCustomer.name
                    : customerSearchQuery
                }
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                  if (!isCustomerDropdownOpen) setIsCustomerDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsCustomerDropdownOpen(true);
                }}
                onKeyDown={handleCustomerKeyDown}
                placeholder={
                  customerMode === 'both'
                    ? 'ابحث باسم العميل/المورد أو الهاتف...'
                    : 'ابحث باسم العميل أو الهاتف...'
                }
                className="w-full h-full bg-transparent pr-3.5 pl-16 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
              />

              {/* Clear selected / query button */}
              {(selectedCustomerId || customerSearchQuery) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCustomerId('');
                    setCustomerSearchQuery('');
                    setIsCustomerDropdownOpen(false);
                  }}
                  className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                  title="مسح الاختيار"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* SMART DROPDOWN LIST */}
            {isCustomerDropdownOpen && (
              <div className="absolute top-12 right-0 z-50 w-80 sm:w-96 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
                {/* Header inside dropdown */}
                <div className="p-2.5 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>
                    نتائج بحث {customerMode === 'both' ? 'العملاء/الموردين' : 'العملاء'} ({filteredContacts.length})
                  </span>
                  <span>اختر أو اضغط Enter</span>
                </div>

                {/* Scrollable Contacts List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredContacts.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      <p className="font-bold">
                        {customerMode === 'both'
                          ? 'لا يوجد جهة اتصال من نوع عميل/مورد مطابقة للبحث'
                          : 'لا يوجد عميل مطابق للبحث'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomerDropdownOpen(false);
                          onOpenCustomerModal();
                        }}
                        className="mt-2 text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                      >
                        فتح دليل جهات الاتصال الكامل
                      </button>
                    </div>
                  ) : (
                    filteredContacts.map((c, index) => {
                      const isSelected = selectedCustomerId === c.id;
                      const isHighlighted = highlightedIndex === index;
                      const bal = c.current_balance || 0;

                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectContact(c)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors group ${
                            isSelected
                              ? 'bg-fuchsia-50 dark:bg-fuchsia-950/40'
                              : isHighlighted
                              ? 'bg-slate-50 dark:bg-slate-800/60'
                              : 'hover:bg-fuchsia-50/70 dark:hover:bg-fuchsia-950/30'
                          }`}
                        >
                          {/* Right side in RTL: Avatar & Info */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              {c.type === 'both' ? (
                                <Building className="w-4 h-4 text-purple-600" />
                              ) : (
                                <User className="w-4 h-4 text-blue-600" />
                              )}
                            </div>

                            <div className="flex flex-col text-right">
                              <span
                                className={`font-bold text-xs text-slate-900 dark:text-white group-hover:text-fuchsia-700 dark:group-hover:text-fuchsia-400 transition-colors ${
                                  isSelected ? 'text-fuchsia-700 dark:text-fuchsia-300 font-black' : ''
                                }`}
                              >
                                {c.name}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                <span>{c.phone || c.mobile || c.code || 'بدون هاتف'}</span>
                              </span>
                            </div>
                          </div>

                          {/* Left side in RTL: Tags & Balance */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                c.type === 'both'
                                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80'
                                  : 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80'
                              }`}
                            >
                              {c.type === 'both' ? 'عميل/مورد' : 'عميل'}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {getBalanceBadge(bal)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Search & Barcode Input Field */}
      <div className="relative flex-1 w-full max-w-2xl">
        <div className="relative flex items-center">
          {/* Search icon with count pill badge */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 pointer-events-none">
            <span className="text-xs font-mono font-bold">{cartCount}</span>
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={onSearchKeyDown}
            placeholder="ابحث هنا... (اسم الصنف، الباركود، الكود الدولي)"
            className="w-full h-10 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-700/80 rounded-full pr-12 pl-16 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs"
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* F2 shortcut tag badge */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <span className="bg-slate-200/70 dark:bg-slate-700/70 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              F2
            </span>
          </div>
        </div>

        {/* Autocomplete Search Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute top-12 left-0 right-0 z-50 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-150">
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>نتائج البحث المباشرة ({searchResults.length})</span>
              <span>اضغط Enter لإضافة أول نتيجة</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.map((p) => {
                const avail = availableFor(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => onAddToCart(p)}
                    className="p-3 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col text-right">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        باركود / SKU: {p.sku}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatNumber(p.sale_price)} ج.م
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          avail > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                        }`}
                      >
                        {avail > 0 ? `متاح: ${avail}` : 'نفد'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Left side: Price Tier Selector */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">فئة السعر</span>
        <div className="w-40">
          <Select value={priceTier} onValueChange={setPriceTier}>
            <SelectTrigger className="w-full h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-slate-700/80 text-xs font-bold">
              <SelectValue placeholder="فئة السعر" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
              <SelectItem value="default">السعر الأساسي...</SelectItem>
              <SelectItem value="wholesale">سعر الجملة</SelectItem>
              <SelectItem value="vip">سعر كبار العملاء</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
