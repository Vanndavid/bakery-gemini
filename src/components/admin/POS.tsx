import React, { useState } from 'react';
import { MenuItem, SaleItem } from '../../types';
import { db, handleFirestoreError, OperationType, auth } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Check, CreditCard, Expand, Shrink } from 'lucide-react';

interface POSProps {
  menuItems: MenuItem[];
}

export function POS({ menuItems }: POSProps) {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [posCategory, setPosCategory] = useState<'All' | 'Food' | 'Drinks'>('All');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');

  const filteredItems = menuItems.filter(item => {
    if (posCategory === 'All') return true;
    if (posCategory === 'Drinks') return item.category === 'Drinks';
    return item.category !== 'Drinks'; // Food is everything else
  });

  const addToCart = (item: MenuItem) => {
    if (completedSale) setCompletedSale(null);
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      const saleData = {
        items: cart,
        total: parseFloat(cartTotal.toFixed(2)),
        timestamp: new Date().toISOString(),
        userId: auth.currentUser?.uid || 'unknown'
      };

      await addDoc(collection(db, 'sales'), saleData);
      
      setCompletedSale(saleData);
      setCart([]);
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'sales');
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = (saleData: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            h2 { text-align: center; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { font-weight: bold; font-size: 1.2em; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; text-align: right; }
            .date { text-align: center; color: #666; font-size: 0.8em; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h2>BAKERY RECEIPT</h2>
          <div class="date">${new Date(saleData.timestamp).toLocaleString()}</div>
          <div class="items">
            ${saleData.items.map((item: any) => `
              <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>$${item.subtotal.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            TOTAL: $${saleData.total.toFixed(2)}
          </div>
          <div style="text-align: center; margin-top: 30px; font-size: 0.8em;">Thank you for your visit!</div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
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
                <p className="text-gray-500">Total: ${completedSale.total.toFixed(2)}</p>
              </div>
              <div className="space-y-3 w-full px-8">
                <button
                  onClick={() => printReceipt(completedSale)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setCompletedSale(null)}
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
              <span className="text-2xl font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              {isProcessing ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
