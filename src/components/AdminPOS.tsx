import { useMemo, useState } from 'react';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MenuItem, Sale, SaleItem } from '../types';

export function AdminPOS({ menuItems, sales, appName }: { menuItems: MenuItem[]; sales: Sale[]; appName: string }) {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.quantity, 0), [cart]);
  const addToCart = (item: MenuItem) => setCart((prev) => {
    const found = prev.find((x) => x.menuItemId === item.id);
    return found ? prev.map((x) => x.menuItemId === item.id ? { ...x, quantity: x.quantity + 1 } : x) : [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
  });

  const completeSale = async () => {
    if (!cart.length) return;
    try {
      const ref = await addDoc(collection(db, 'sales'), { items: cart, total, createdAt: serverTimestamp() });
      setLastSale({ id: ref.id, items: cart, total, createdAt: Timestamp.now() });
      setCart([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    }
  };

  const points = useMemo(() => {
    const now = new Date();
    const size = period === 'week' ? 7 : period === 'month' ? 30 : 12;
    const vals = Array.from({ length: size }, () => 0);
    sales.forEach((sale) => {
      const d = (sale.createdAt as Timestamp)?.toDate?.(); if (!d) return;
      if (period !== 'year') {
        const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (diff >= 0 && diff < size) vals[size - 1 - diff] += sale.total;
      } else {
        const diff = now.getMonth() - d.getMonth() + (now.getFullYear() - d.getFullYear()) * 12;
        if (diff >= 0 && diff < 12) vals[11 - diff] += sale.total;
      }
    });
    const max = Math.max(...vals, 1);
    return vals.map((v, i) => `${(i / Math.max(vals.length - 1, 1)) * 100},${100 - ((v / max) * 100)}`).join(' ');
  }, [period, sales]);

  return <div className='space-y-6'>
    <div className='grid md:grid-cols-2 gap-6'>
      <div className='bg-white p-6 rounded-xl border'><h3 className='font-bold mb-3'>POS Menu</h3>{menuItems.map((item) => <button key={item.id} onClick={() => addToCart(item)} className='w-full border rounded p-2 mb-2 flex justify-between'><span>{item.name}</span><span>${item.price.toFixed(2)}</span></button>)}</div>
      <div className='bg-white p-6 rounded-xl border'><h3 className='font-bold mb-3'>Current Order</h3>{cart.map((i) => <div key={i.menuItemId} className='flex justify-between'><span>{i.name} x{i.quantity}</span><span>${(i.price * i.quantity).toFixed(2)}</span></div>)}<div className='mt-4 pt-2 border-t flex justify-between font-bold'><span>Total</span><span>${total.toFixed(2)}</span></div><button onClick={completeSale} disabled={!cart.length} className='mt-4 w-full bg-primary-600 text-white rounded p-2 disabled:bg-gray-300'>Complete Sale</button></div>
    </div>
    {lastSale && <div className='bg-white p-6 rounded-xl border'><div className='flex justify-between mb-3'><h3 className='font-bold'>A4 Receipt</h3><button onClick={() => window.print()} className='bg-primary-600 text-white rounded px-3 py-1'>Print</button></div><div className='max-w-[794px] p-8 border'><h2 className='font-bold text-xl'>{appName}</h2>{lastSale.items.map((i) => <div key={i.menuItemId} className='flex justify-between'><span>{i.name} x{i.quantity}</span><span>${(i.price * i.quantity).toFixed(2)}</span></div>)}<div className='border-t mt-3 pt-2 font-bold flex justify-between'><span>Total</span><span>${lastSale.total.toFixed(2)}</span></div></div></div>}
    <div className='bg-white p-6 rounded-xl border'><h3 className='font-bold mb-3'>Sales Report</h3><div className='flex gap-2 mb-3'>{(['week','month','year'] as const).map((p) => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded ${period===p ? 'bg-primary-600 text-white':'bg-gray-100'}`}>{p}</button>)}</div><svg viewBox='0 0 100 100' className='w-full h-40 bg-gray-50 rounded'><polyline fill='none' stroke='currentColor' strokeWidth='2' className='text-primary-600' points={points} /></svg><table className='w-full mt-4 text-sm'><thead><tr><th className='text-left'>Sale</th><th className='text-left'>Date</th><th className='text-right'>Total</th></tr></thead><tbody>{sales.map((s) => <tr key={s.id}><td>{s.id.slice(0,8)}...</td><td>{(s.createdAt as Timestamp)?.toDate?.().toLocaleString() || 'Pending'}</td><td className='text-right'>${s.total.toFixed(2)}</td></tr>)}</tbody></table></div>
  </div>;
}
