import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Sale } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, eachWeekOfInterval, startOfYear, endOfYear, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from 'date-fns';

export function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCancellingId, setIsCancellingId] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Sale[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Sale);
      });
      setSales(items);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sales'));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sales.length / itemsPerPage));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [sales.length, currentPage]);

  const handleCancelTransaction = async (sale: Sale) => {
    const confirmed = window.confirm(
      `Cancel this cash transaction from ${format(new Date(sale.timestamp), 'MMM d, yyyy h:mm a')} for $${sale.total.toFixed(2)}?`
    );

    if (!confirmed) return;

    setIsCancellingId(sale.id);
    try {
      await deleteDoc(doc(db, 'sales', sale.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'sales');
    } finally {
      setIsCancellingId(null);
    }
  };

  const generateChartData = () => {
    const now = new Date();
    
    if (timeRange === 'week') {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });
      
      return days.map(day => {
        const daySales = sales.filter(s => isSameDay(new Date(s.timestamp), day));
        const total = daySales.reduce((sum, s) => sum + s.total, 0);
        return {
          name: format(day, 'EEE'), // Mon, Tue...
          sales: parseFloat(total.toFixed(2))
        };
      });
    }
    
    if (timeRange === 'month') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      const days = eachDayOfInterval({ start, end });
      
      return days.map(day => {
        const daySales = sales.filter(s => isSameDay(new Date(s.timestamp), day));
        const total = daySales.reduce((sum, s) => sum + s.total, 0);
        return {
          name: format(day, 'MMM d'), // Oct 1, Oct 2...
          sales: parseFloat(total.toFixed(2))
        };
      });
    }
    
    if (timeRange === 'year') {
      const start = startOfYear(now);
      const end = endOfYear(now);
      const months = eachMonthOfInterval({ start, end });
      
      return months.map(month => {
        const monthSales = sales.filter(s => isSameMonth(new Date(s.timestamp), month));
        const total = monthSales.reduce((sum, s) => sum + s.total, 0);
        return {
          name: format(month, 'MMM'), // Jan, Feb...
          sales: parseFloat(total.toFixed(2))
        };
      });
    }
    
    return [];
  };

  const chartData = generateChartData();
  const totalPeriodSales = chartData.reduce((sum, data) => sum + data.sales, 0);
  const totalPages = Math.max(1, Math.ceil(sales.length / itemsPerPage));
  const pageStart = (currentPage - 1) * itemsPerPage;
  const paginatedSales = sales.slice(pageStart, pageStart + itemsPerPage);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Sales Report</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['week', 'month', 'year'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  timeRange === range ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500">Total Sales (This {timeRange})</p>
          <p className="text-3xl font-bold text-gray-900">${totalPeriodSales.toFixed(2)}</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Sales']}
              />
              <Line type="monotone" dataKey="sales" stroke="#059669" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Recent Transactions</h3>
          <span className="text-sm text-gray-500">{sales.length} records</span>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(sale.timestamp), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="line-clamp-2">
                      {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    ${sale.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleCancelTransaction(sale)}
                      disabled={isCancellingId === sale.id}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCancellingId === sale.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No sales recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {sales.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {pageStart + 1}-{Math.min(pageStart + itemsPerPage, sales.length)} of {sales.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
