'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { translateApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { X, ArrowRightLeft, AlertCircle, RefreshCw } from 'lucide-react';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    stockId: string;
    stockSymbol: string;
    currentPrice: number;
    initialSide?: 'buy' | 'sell';
    onOrderSuccess?: () => void;
}

export function TradeModal({ isOpen, onClose, stockId, stockSymbol, currentPrice, initialSide = 'buy', onOrderSuccess }: TradeModalProps) {
    // Tabs & Modes
    const [side, setSide] = useState<'buy' | 'sell'>(initialSide);
    const [mode, setMode] = useState<'shares' | 'amount'>('shares');

    // Inputs
    const [sharesInput, setSharesInput] = useState<string>('');
    const [amountInput, setAmountInput] = useState<string>('');

    // Asset Data
    const [availableCash, setAvailableCash] = useState<number | null>(null);
    const [ownedShares, setOwnedShares] = useState<number | null>(null);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Synchronize modal open with pulling fresh asset data
    useEffect(() => {
        if (isOpen) {
            setSide(initialSide);
            setSharesInput('');
            setAmountInput('');
            setErrorMsg('');
            fetchAssets();
        }
    }, [isOpen, initialSide]);

    const fetchAssets = async () => {
        setIsLoadingAssets(true);
        try {
            const [accRes, posRes] = await Promise.all([
                api.get('/trade/account'),
                api.get('/trade/positions')
            ]);
            setAvailableCash(accRes.data.availableCash);
            const pos = posRes.data.find((p: any) => p.stockId === stockId);
            setOwnedShares(pos ? pos.quantity : 0);
        } catch (e) {
            setAvailableCash(0);
            setOwnedShares(0);
        } finally {
            setIsLoadingAssets(false);
        }
    };

    // Calculations
    const parsedShares = Math.floor(Math.max(Number(sharesInput) || 0, 0));
    const parsedAmount = Math.max(Number(amountInput) || 0, 0);

    const estimatedAmount = useMemo(() => {
        return mode === 'shares' ? parsedShares * currentPrice : parsedAmount;
    }, [mode, parsedShares, parsedAmount, currentPrice]);

    const estimatedShares = useMemo(() => {
        return mode === 'shares' ? parsedShares : Math.floor(parsedAmount / currentPrice);
    }, [mode, parsedShares, parsedAmount, currentPrice]);

    // Validation
    let validationError = '';
    if (side === 'buy' && availableCash !== null && estimatedAmount > availableCash) {
        validationError = '可用资金不足';
    } else if (side === 'sell' && ownedShares !== null && estimatedShares > ownedShares) {
        validationError = '持仓股数不足';
    } else if (estimatedShares <= 0 && (sharesInput !== '' || amountInput !== '')) {
        validationError = '按当前价格，成交股数不能为 0';
    }

    const isValid = estimatedShares > 0 && !validationError;

    // Handlers
    const handlePercentClick = (percent: number) => {
        if (side === 'buy') {
            if (availableCash == null || availableCash <= 0) return;
            const targetAmount = availableCash * percent;
            if (mode === 'amount') {
                setAmountInput(targetAmount.toFixed(2));
            } else {
                const shares = Math.floor(targetAmount / currentPrice);
                setSharesInput(String(shares));
            }
        } else {
            if (ownedShares == null || ownedShares <= 0) return;
            const targetShares = Math.floor(ownedShares * percent);
            if (mode === 'shares') {
                setSharesInput(String(targetShares));
            } else {
                const amt = targetShares * currentPrice;
                setAmountInput(amt.toFixed(2));
            }
        }
    };

    const handleInputChange = (val: string) => {
        // Only allow positive numbers or empty
        if (val !== '' && (isNaN(Number(val)) || Number(val) < 0)) return;
        if (mode === 'shares') setSharesInput(val);
        else setAmountInput(val);
    };

    const submitOrder = async () => {
        if (!isValid || isSubmitting) return;
        setIsSubmitting(true);
        setErrorMsg('');
        try {
            await api.post('/trade/orders', {
                stockId,
                type: 'market',
                side,
                quantity: estimatedShares
            });
            if (onOrderSuccess) onOrderSuccess();
            onClose();
        } catch (e: any) {
            const message = Array.isArray(e.response?.data?.message) ? e.response.data.message[0] : e.response?.data?.message;
            setErrorMsg(translateApiErrorMessage(message, '下单失败，请稍后重试'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-all">
            {/* Background Dimmer Close Handler */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] sm:rounded-[2rem] rounded-t-3xl shadow-soft p-5 sm:p-7 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">交易 {stockSymbol}</h2>
                        <p className="text-sm font-mono text-[var(--text-muted)] tracking-wider mt-0.5">@ {formatCurrency(currentPrice)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Buy / Sell Toggles */}
                <div className="flex gap-2 p-1 bg-[var(--bg-tertiary)] rounded-xl mb-5">
                    <button
                        onClick={() => { setSide('buy'); setSharesInput(''); setAmountInput(''); }}
                        className={cn(
                            "flex-1 py-2.5 rounded-[0.5rem] text-sm font-semibold transition-all duration-300",
                            side === 'buy' ? "bg-up text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        )}>买入</button>
                    <button
                        onClick={() => { setSide('sell'); setSharesInput(''); setAmountInput(''); }}
                        className={cn(
                            "flex-1 py-2.5 rounded-[0.5rem] text-sm font-semibold transition-all duration-300",
                            side === 'sell' ? "bg-down text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        )}>卖出</button>
                </div>

                {/* Input Area container */}
                <div className={cn(
                    "rounded-2xl border p-5 mb-4 transition-colors",
                    validationError ? "bg-red-500/10 border-red-500/30" : "bg-[var(--bg-primary)] border-[var(--border-color)]",
                    (side === 'buy' && mode === 'shares' && isValid) && "focus-within:border-up/50",
                    (side === 'buy' && mode === 'amount' && isValid) && "focus-within:border-up/50",
                    (side === 'sell' && mode === 'shares' && isValid) && "focus-within:border-down/50",
                    (side === 'sell' && mode === 'amount' && isValid) && "focus-within:border-down/50"
                )}>

                    {/* Mode Switcher inside input area */}
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-medium tracking-wider text-[var(--text-muted)]">{side === 'buy' ? '买入' : '卖出'}</span>
                        <button onClick={() => {
                            setMode(m => m === 'shares' ? 'amount' : 'shares');
                            setSharesInput('');
                            setAmountInput('');
                        }} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] px-2.5 py-1 rounded-md transition-colors">
                            <ArrowRightLeft size={12} />
                            改为按{mode === 'shares' ? '金额' : '股数'}输入
                        </button>
                    </div>

                    {/* Actual Input */}
                    <div className="flex items-center gap-2 border-b border-[var(--border-color)]/50 pb-2 mb-3 focus-within:border-[var(--text-muted)] transition-colors">
                        <span className="text-xl font-medium text-[var(--text-muted)]">{mode === 'amount' ? '$' : ''}</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={mode === 'shares' ? sharesInput : amountInput}
                            onChange={e => handleInputChange(e.target.value)}
                            className="w-full bg-transparent text-3xl font-mono outline-none tabular-nums font-bold"
                        />
                        <span className="text-sm font-medium text-[var(--text-muted)]">{mode === 'shares' ? '股' : 'USD'}</span>
                    </div>

                    {/* Asset Context & Auto Calculation */}
                    <div className="flex justify-between items-center text-sm px-1">
                        <div className="flex flex-col">
                            <span className="text-xs text-[var(--text-muted)]">{mode === 'shares' ? '预计金额' : '预计股数'}</span>
                            <span className={cn("font-mono font-medium", validationError ? "text-red-400" : "text-[var(--text-primary)]")}>
                                {mode === 'shares'
                                    ? formatCurrency(estimatedAmount)
                                    : `${estimatedShares} 股`}
                            </span>
                        </div>

                        <div className="flex flex-col text-right">
                            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 justify-end">
                                {isLoadingAssets && <RefreshCw size={10} className="animate-spin" />}
                                {side === 'buy' ? '可用资金' : '可卖股数'}
                            </span>
                            <span className="font-mono font-medium text-[var(--text-secondary)]">
                                {side === 'buy'
                                    ? (availableCash !== null ? formatCurrency(availableCash) : '--')
                                    : (ownedShares !== null ? `${ownedShares} 股` : '--')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Validation Warning */}
                {validationError && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mt-2 mb-4 px-1">
                        <AlertCircle size={14} /> {validationError}
                    </div>
                )}
                {errorMsg && (
                    <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center font-medium">
                        {errorMsg}
                    </div>
                )}

                {/* Quick Position Selectors */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    {[{ label: '25%', value: 0.25 }, { label: '50%', value: 0.5 }, { label: '75%', value: 0.75 }, { label: '100%', value: 1.0 }].map(btn => (
                        <button
                            key={btn.label}
                            onClick={() => handlePercentClick(btn.value)}
                            className="py-2 text-xs font-medium rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors border border-transparent hover:border-[var(--border-color)]"
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* Submit */}
                <button
                    onClick={submitOrder}
                    disabled={!isValid || isSubmitting}
                    className={cn(
                        'w-full rounded-[1rem] py-4 font-bold tracking-wider text-[1.1rem] text-white transition-all duration-300 flex justify-center items-center',
                        !isValid ? 'bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]' :
                            side === 'buy' ? 'bg-up hover:bg-up/90' : 'bg-down hover:bg-down/90'
                    )}>
                    {isSubmitting ? <RefreshCw size={20} className="animate-spin text-white/70" /> : `${side === 'buy' ? '确认市价买入' : '确认市价卖出'}`}
                </button>

            </div>
        </div>
    );
}
