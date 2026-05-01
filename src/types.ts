export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
}

export interface SaleItem {
  menuItemId: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  createdAt: unknown;
}
