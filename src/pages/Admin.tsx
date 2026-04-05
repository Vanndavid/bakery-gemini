import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { MenuItem, GalleryImage } from '../types';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Plus, LogOut, Image as ImageIcon, Coffee } from 'lucide-react';

export function Admin() {
  const [activeTab, setActiveTab] = useState<'menu' | 'gallery'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  // Menu Form
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', category: '', imageUrl: '' });
  
  // Gallery Form
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', imageUrl: '' });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
    });

    const menuQ = query(collection(db, 'menu'));
    const unsubscribeMenu = onSnapshot(menuQ, (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as MenuItem));
      setMenuItems(items);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'menu'));

    const galleryQ = query(collection(db, 'gallery'));
    const unsubscribeGallery = onSnapshot(galleryQ, (snapshot) => {
      const items: GalleryImage[] = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as GalleryImage));
      setGalleryImages(items);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'gallery'));

    return () => {
      unsubscribeAuth();
      unsubscribeMenu();
      unsubscribeGallery();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const resetMenuForm = () => {
    setMenuForm({ name: '', description: '', price: '', category: '', imageUrl: '' });
    setIsEditing(false);
    setCurrentId(null);
  };

  const resetGalleryForm = () => {
    setGalleryForm({ title: '', description: '', imageUrl: '' });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: menuForm.name,
        description: menuForm.description || undefined,
        price: parseFloat(menuForm.price),
        category: menuForm.category,
        imageUrl: menuForm.imageUrl || undefined
      };

      if (isEditing && currentId) {
        await updateDoc(doc(db, 'menu', currentId), data);
      } else {
        await addDoc(collection(db, 'menu'), data);
      }
      resetMenuForm();
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'menu');
    }
  };

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        title: galleryForm.title,
        description: galleryForm.description || undefined,
        imageUrl: galleryForm.imageUrl
      };

      if (isEditing && currentId) {
        await updateDoc(doc(db, 'gallery', currentId), data);
      } else {
        await addDoc(collection(db, 'gallery'), data);
      }
      resetGalleryForm();
    } catch (error) {
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'gallery');
    }
  };

  const deleteMenu = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteDoc(doc(db, 'menu', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `menu/${id}`);
      }
    }
  };

  const deleteGallery = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
      }
    }
  };

  const editMenu = (item: MenuItem) => {
    setMenuForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || ''
    });
    setIsEditing(true);
    setCurrentId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editGallery = (item: GalleryImage) => {
    setGalleryForm({
      title: item.title,
      description: item.description || '',
      imageUrl: item.imageUrl
    });
    setIsEditing(true);
    setCurrentId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <h2 className="text-2xl font-serif font-bold text-amber-900 mb-8">Admin Panel</h2>
        
        <nav className="space-y-2 flex-1">
          <button
            onClick={() => { setActiveTab('menu'); resetMenuForm(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
              activeTab === 'menu' ? 'bg-amber-100 text-amber-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Coffee className="w-5 h-5" /> Menu Items
          </button>
          <button
            onClick={() => { setActiveTab('gallery'); resetGalleryForm(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
              activeTab === 'gallery' ? 'bg-amber-100 text-amber-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-5 h-5" /> Gallery
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'menu' ? (
            <>
              {/* Menu Form */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  {isEditing ? <Edit2 className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-amber-600" />}
                  {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <form onSubmit={handleMenuSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input required type="text" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                      <input required type="number" step="0.01" min="0" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <input required type="text" value={menuForm.category} onChange={e => setMenuForm({...menuForm, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <input type="url" value={menuForm.imageUrl} onChange={e => setMenuForm({...menuForm, imageUrl: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={3} value={menuForm.description} onChange={e => setMenuForm({...menuForm, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"></textarea>
                  </div>
                  <div className="flex justify-end gap-3">
                    {isEditing && (
                      <button type="button" onClick={resetMenuForm} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium">Cancel</button>
                    )}
                    <button type="submit" className="px-4 py-2 text-white bg-amber-600 hover:bg-amber-700 rounded-md font-medium">
                      {isEditing ? 'Update Item' : 'Add Item'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Menu List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {menuItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.imageUrl && (
                              <img className="h-10 w-10 rounded-full object-cover mr-3" src={item.imageUrl} alt="" referrerPolicy="no-referrer" />
                            )}
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => editMenu(item)} className="text-amber-600 hover:text-amber-900 mr-4"><Edit2 className="w-4 h-4 inline" /></button>
                          <button onClick={() => deleteMenu(item.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4 inline" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* Gallery Form */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  {isEditing ? <Edit2 className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-amber-600" />}
                  {isEditing ? 'Edit Gallery Image' : 'Add New Image'}
                </h3>
                <form onSubmit={handleGallerySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input required type="text" value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                      <input required type="url" value={galleryForm.imageUrl} onChange={e => setGalleryForm({...galleryForm, imageUrl: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={3} value={galleryForm.description} onChange={e => setGalleryForm({...galleryForm, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"></textarea>
                  </div>
                  <div className="flex justify-end gap-3">
                    {isEditing && (
                      <button type="button" onClick={resetGalleryForm} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium">Cancel</button>
                    )}
                    <button type="submit" className="px-4 py-2 text-white bg-amber-600 hover:bg-amber-700 rounded-md font-medium">
                      {isEditing ? 'Update Image' : 'Add Image'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Gallery List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryImages.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => editGallery(item)} className="p-2 bg-white rounded-full shadow hover:bg-amber-50 text-amber-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteGallery(item.id)} className="p-2 bg-white rounded-full shadow hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
