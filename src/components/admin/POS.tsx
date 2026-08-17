import React, { useState } from 'react';
import { MenuItem, PaymentMethod, Sale, SaleItem } from '../../types';
import { db, handleFirestoreError, OperationType, auth } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Check, Banknote, CreditCard, Expand, Shrink } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { formatMoney, printReceipt } from '../../utils/printReceipt';

interface POSProps {
  menuItems: MenuItem[];
}

function parseCashAmount(value: string): number | null {
  const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parseFloat(parsed.toFixed(2));
}

export function POS({ menuItems }: POSProps) {
  const { settings } = useSettings();
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<(Omit<Sale, 'id'> & { id?: string }) | null>(null);
  const [posCategory, setPosCategory] = useState<'All' | 'Food' | 'Drinks'>('All');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [cashInput, setCashInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const filteredItems = menuItems.filter(item => {
    if (posCategory === 'All') return true;
    if (posCategory === 'Drinks') return item.category === 'Drinks';
    return item.category !== 'Drinks'; // Food is everything else
  });

  const addToCart = (item: MenuItem) => {
    if (completedSale) {
      setCompletedSale(null);
      setCashInput('');
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + 1, subtotal: parseFloat(((i.quantity + 1) * i.price).toFixed(2)) }
            : i
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, subtotal: item.price }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return item;
        return { ...item, quantity: newQuantity, subtotal: parseFloat((newQuantity * item.price).toFixed(2)) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cashTendered = parseCashAmount(cashInput);
  const changeDue =
    paymentMethod === 'cash' && cashTendered !== null && cart.length > 0
      ? parseFloat((cashTendered - cartTotal).toFixed(2))
      : null;
  const canCheckout =
    cart.length > 0 &&
    (paymentMethod === 'card' || (cashTendered !== null && cashTendered >= cartTotal));

  const handleCheckout = async () => {
    if (!canCheckout) return;
    if (paymentMethod === 'cash' && (cashTendered === null || changeDue === null)) return;
    setIsProcessing(true);
    
    try {
      const saleData: Omit<Sale, 'id'> = {
        items: cart,
        total: parseFloat(cartTotal.toFixed(2)),
        timestamp: new Date().toISOString(),
        userId: auth.currentUser?.uid || 'unknown',
        paymentMethod,
        ...(paymentMethod === 'cash' && cashTendered !== null && changeDue !== null
          ? { cashTendered, changeDue }
          : {})
      };

      await addDoc(collection(db, 'sales'), saleData);
      
      setCompletedSale(saleData);
      setCart([]);
      setCashInput('');
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'sales');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = (saleData: Omit<Sale, 'id'> & { id?: string }) => {
    printReceipt(saleData, { appName: settings.appName, abn: settings.abn });
  };

  return (
    <div className={`flex gap-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-100 p-6' : 'h-[calc(100vh-8rem)]'}`}>
      {/* Menu Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex gap-2">
            {(['All', 'Food', 'Drinks'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setPosCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  posCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setGridSize('small')}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-shadow ${gridSize === 'small' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                title="Small Items"
              >
                S
              </button>
              <button
                onClick={() => setGridSize('medium')}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-shadow ${gridSize === 'medium' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                title="Medium Items"
              >
                M
              </button>
              <button
                onClick={() => setGridSize('large')}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-shadow ${gridSize === 'large' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                title="Large Items"
              >
                L
              </button>
            </div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Shrink className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className={`grid gap-4 ${
            gridSize === 'small' ? 'grid-cols-3 md:grid-cols-4 xl:grid-cols-6' :
            gridSize === 'large' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
          }`}>
            {filteredItems.map(item => (
              <button 
                key={item.id}
                onClick={() => addToCart(item)}
                className="border border-gray-200 rounded-lg text-left hover:border-primary-500 hover:ring-1 hover:ring-primary-500 transition-all flex flex-col overflow-hidden bg-white group cursor-pointer"
              >
                <div className={`w-full relative bg-gray-100 overflow-hidden ${
                  gridSize === 'small' ? 'h-20' : gridSize === 'large' ? 'h-40' : 'h-28'
                }`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-gray-900 line-clamp-2 text-sm">{item.name}</div>
                  <div className="text-primary-600 font-bold mt-1">${item.price.toFixed(2)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Order
          </h3>
          <span className="text-sm font-medium text-gray-500">{cart.length} items</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {completedSale ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sale Completed!</h3>
                <p className="text-gray-500">Total: {formatMoney(completedSale.total)}</p>
                {completedSale.paymentMethod === 'card' && (
                  <p className="mt-3 text-sm text-gray-600">Paid by card</p>
                )}
                {completedSale.paymentMethod !== 'card' && completedSale.cashTendered !== undefined && (
                  <div className="mt-3 text-sm text-gray-600 space-y-1">
                    <p>Cash: {formatMoney(completedSale.cashTendered)}</p>
                    <p>Change: {formatMoney(completedSale.changeDue ?? 0)}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3 w-full px-8">
                <button
                  onClick={() => handlePrintReceipt(completedSale)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    setCompletedSale(null);
                    setCashInput('');
                  }}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  New Order
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select items to add to order
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">${item.price.toFixed(2)} each</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="w-16 text-right font-medium">
                    ${item.subtotal.toFixed(2)}
                  </div>
                  
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {!completedSale && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-2xl font-bold text-gray-900">{formatMoney(cartTotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  paymentMethod === 'cash'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  paymentMethod === 'card'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Card
              </button>
            </div>
            {paymentMethod === 'cash' && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="inline-block border-2 border-gray-900 px-3 py-1 font-bold tracking-wide text-sm">
                    CASH
                  </span>
                  <span className="text-gray-700 font-medium">:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={cashInput}
                      onChange={(e) => setCashInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 font-medium"
                      aria-label="Cash received"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span>change :</span>
                  <span className={`font-semibold ${changeDue !== null && changeDue < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {changeDue === null ? '—' : formatMoney(changeDue)}
                  </span>
                </div>
                {cashTendered !== null && cashTendered < cartTotal && cart.length > 0 && (
                  <p className="text-xs text-red-600">Cash received is less than the total.</p>
                )}
              </div>
            )}
            <button 
              onClick={handleCheckout}
              disabled={!canCheckout || isProcessing}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              {paymentMethod === 'card' ? <CreditCard className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
              {isProcessing ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
