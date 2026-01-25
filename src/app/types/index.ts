export interface Task {
  id: string;
  sourceId?: string; // ✅ ADD THIS
  title: string;
  description: string;
  category: string;
  date: string;
  time?: string;
  createdAt?: string;
  completed?: boolean;
  notifyAt?: string; 
  notifyBefore?: number;
}


export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

export interface NearbyLocation {
  id: string;
  name: string;
  category: string;
  address: string;
  distance: string;
  rating: number;
  isOpen: boolean;
}
