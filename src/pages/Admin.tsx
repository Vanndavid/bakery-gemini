import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, handleFirestoreError, OperationType } from '../firebase';
import { MenuItem, GalleryImage } from '../types';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Plus, LogOut, Image as ImageIcon, Coffee, Settings as SettingsIcon, Upload } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export function Admin() {
  const [activeTab, setActiveTab] = useState<'menu' | 'gallery' | 'settings'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  // Menu Form
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', category: '', imageUrl: '' });
  
  // Gallery Form
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', imageUrl: '' });

  // Settings Form
  const [settingsForm, setSettingsForm] = useState({ 
    appName: settings.appName, 
    colorScheme: settings.colorScheme,
    contacts: settings.contacts || [],
    heroImage: settings.heroImage || '',
    heroTitle: settings.heroTitle || '',
    heroSubtitle: settings.heroSubtitle || ''
  });

  // Update settings form when settings load
  useEffect(() => {
    setSettingsForm({ 
      appName: settings.appName, 
      colorScheme: settings.colorScheme,
      contacts: settings.contacts || [],
      heroImage: settings.heroImage || '',
      heroTitle: settings.heroTitle || '',
      heroSubtitle: settings.heroSubtitle || ''
    });
  }, [settings]);

  // Live preview of color scheme
  useEffect(() => {
    if (activeTab === 'settings') {
      document.body.className = `theme-${settingsForm.colorScheme}`;
    }
    return () => {
      document.body.className = `theme-${settings.colorScheme}`;
    };
  }, [settingsForm.colorScheme, activeTab, settings.colorScheme]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'menu' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `${formType}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      if (formType === 'menu') {
        setMenuForm({ ...menuForm, imageUrl: url });
      } else {
        setGalleryForm({ ...galleryForm, imageUrl: url });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
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

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        appName: settingsForm.appName,
        colorScheme: settingsForm.colorScheme as any,
        contacts: settingsForm.contacts,
        heroImage: settingsForm.heroImage,
        heroTitle: settingsForm.heroTitle,
        heroSubtitle: settingsForm.heroSubtitle
      });
      alert('Settings updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings');
    }
  };

  const addContact = () => {
    setSettingsForm({
      ...settingsForm,
      contacts: [
        ...settingsForm.contacts,
        { id: Date.now().toString(), type: 'phone', value: '', enabled: true }
      ]
    });
  };

  const updateContact = (index: number, field: string, value: any) => {
    const newContacts = [...settingsForm.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setSettingsForm({ ...settingsForm, contacts: newContacts });
  };

  const removeContact = (index: number) => {
    const newContacts = [...settingsForm.contacts];
    newContacts.splice(index, 1);
    setSettingsForm({ ...settingsForm, contacts: newContacts });
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
      <div className="min-h-screen flex items-center justify-center bg-primary-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <button 
          onClick={() => navigate('/')} 
          className="text-left hover:opacity-80 transition-opacity mb-8"
        >
          <h2 className="text-2xl font-serif font-bold text-primary-900 flex items-center gap-2">
            <Coffee className="w-6 h-6" />
            Admin Panel
          </h2>
        </button>
        
        <nav className="space-y-2 flex-1">
          <button
            onClick={() => { setActiveTab('menu'); resetMenuForm(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
              activeTab === 'menu' ? 'bg-primary-100 text-primary-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Coffee className="w-5 h-5" /> Menu Items
          </button>
          <button
            onClick={() => { setActiveTab('gallery'); resetGalleryForm(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
              activeTab === 'gallery' ? 'bg-primary-100 text-primary-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-5 h-5" /> Gallery
          </button>
          <button
            onClick={() => { setActiveTab('settings'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-primary-100 text-primary-900' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <SettingsIcon className="w-5 h-5" /> Settings
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
                  {isEditing ? <Edit2 className="w-5 h-5 text-primary-600" /> : <Plus className="w-5 h-5 text-primary-600" />}
                  {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <form onSubmit={handleMenuSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input required type="text" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                      <input required type="number" step="0.01" min="0" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <input required type="text" value={menuForm.category} onChange={e => setMenuForm({...menuForm, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                      <div className="flex gap-2">
                        <input type="url" placeholder="Or paste URL here" value={menuForm.imageUrl} onChange={e => setMenuForm({...menuForm, imageUrl: e.target.value})} className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                        <label className="cursor-pointer bg-primary-100 text-primary-700 px-4 py-2 rounded-md hover:bg-primary-200 flex items-center justify-center transition-colors">
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'menu')} disabled={uploading} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={3} value={menuForm.description} onChange={e => setMenuForm({...menuForm, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"></textarea>
                  </div>
                  <div className="flex justify-end gap-3">
                    {isEditing && (
                      <button type="button" onClick={resetMenuForm} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium">Cancel</button>
                    )}
                    <button type="submit" className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-md font-medium">
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
                          <button onClick={() => editMenu(item)} className="text-primary-600 hover:text-primary-900 mr-4"><Edit2 className="w-4 h-4 inline" /></button>
                          <button onClick={() => deleteMenu(item.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4 inline" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : activeTab === 'gallery' ? (
            <>
              {/* Gallery Form */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  {isEditing ? <Edit2 className="w-5 h-5 text-primary-600" /> : <Plus className="w-5 h-5 text-primary-600" />}
                  {isEditing ? 'Edit Gallery Image' : 'Add New Image'}
                </h3>
                <form onSubmit={handleGallerySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input required type="text" value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                      <div className="flex gap-2">
                        <input required type="url" placeholder="Or paste URL here" value={galleryForm.imageUrl} onChange={e => setGalleryForm({...galleryForm, imageUrl: e.target.value})} className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                        <label className="cursor-pointer bg-primary-100 text-primary-700 px-4 py-2 rounded-md hover:bg-primary-200 flex items-center justify-center transition-colors">
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'gallery')} disabled={uploading} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={3} value={galleryForm.description} onChange={e => setGalleryForm({...galleryForm, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"></textarea>
                  </div>
                  <div className="flex justify-end gap-3">
                    {isEditing && (
                      <button type="button" onClick={resetGalleryForm} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium">Cancel</button>
                    )}
                    <button type="submit" className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-md font-medium">
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
                      <button onClick={() => editGallery(item)} className="p-2 bg-white rounded-full shadow hover:bg-primary-50 text-primary-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteGallery(item.id)} className="p-2 bg-white rounded-full shadow hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : activeTab === 'settings' ? (
            <>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-primary-600" />
                  Global Settings
                </h3>
                <form onSubmit={handleSettingsSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bakery Name *</label>
                      <input required type="text" value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color Scheme *</label>
                      <select value={settingsForm.colorScheme} onChange={e => setSettingsForm({...settingsForm, colorScheme: e.target.value as any})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                        <option value="amber">Amber (Warm)</option>
                        <option value="rose">Rose (Sweet)</option>
                        <option value="emerald">Emerald (Fresh)</option>
                        <option value="slate">Slate (Modern)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Homepage Hero</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
                        <input type="url" value={settingsForm.heroImage} onChange={e => setSettingsForm({...settingsForm, heroImage: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" placeholder="https://images.unsplash.com/..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                        <input type="text" value={settingsForm.heroTitle} onChange={e => setSettingsForm({...settingsForm, heroTitle: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                        <textarea value={settingsForm.heroSubtitle} onChange={e => setSettingsForm({...settingsForm, heroSubtitle: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" rows={3} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
                      <button type="button" onClick={addContact} className="text-sm flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
                        <Plus className="w-4 h-4" /> Add Contact
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {settingsForm.contacts.map((contact, index) => (
                        <div key={contact.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <select 
                            value={contact.type} 
                            onChange={(e) => updateContact(index, 'type', e.target.value)}
                            className="p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                          >
                            <option value="phone">Phone</option>
                            <option value="email">Email</option>
                          </select>
                          
                          <input 
                            type="text" 
                            value={contact.value} 
                            onChange={(e) => updateContact(index, 'value', e.target.value)}
                            placeholder={contact.type === 'phone' ? 'e.g. (02) 1234 5678' : 'e.g. hello@bakery.com'}
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                          />
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={contact.enabled} 
                              onChange={(e) => updateContact(index, 'enabled', e.target.checked)}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-600">Visible</span>
                          </label>
                          
                          <button 
                            type="button" 
                            onClick={() => removeContact(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {settingsForm.contacts.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No contact information added yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6">
                    <button type="submit" className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-md font-medium">
                      Save Settings
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
