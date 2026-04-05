import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MenuItem } from '../types';

export function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    const q = query(collection(db, 'menu'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const menuItems: MenuItem[] = [];
      snapshot.forEach((doc) => {
        menuItems.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setItems(menuItems);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'menu');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = ['All', ...Array.from(new Set(items.map(item => item.category)))];
  
  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <section id="menu" className="py-20 flex items-center justify-center bg-amber-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </section>
    );
  }

  return (
    <section id="menu" className="bg-amber-50/50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-amber-900 mb-4">Our Menu</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our selection of handcrafted breads, delicate pastries, and sweet treats.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-amber-700 text-white'
                  : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No menu items found. Please check back later!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-md transition-shadow">
                {item.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-serif font-bold text-gray-900">{item.name}</h3>
                    <span className="text-lg font-medium text-amber-700">${item.price.toFixed(2)}</span>
                  </div>
                  <span className="inline-block px-2 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded mb-3">
                    {item.category}
                  </span>
                  {item.description && (
                    <p className="text-gray-600 text-sm line-clamp-3">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
