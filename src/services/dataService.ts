import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  serverTimestamp,
  type DocumentData
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { DailyClosing, User } from '../types';

// In-memory mock storage if Firebase is not configured
const mockClosings: DailyClosing[] = [
  {
    id: 'rev-001',
    cashierId: 'user-1',
    cashierName: 'Ahmed Ali',
    branchId: 'branch-1',
    branchName: 'Main Branch',
    date: new Date(Date.now() - 86400000).toISOString(),
    cashAmount: 500,
    cardAmount: 750,
    expenses: 0,
    expectedSales: 1250,
    actualTotal: 1250,
    difference: 0,
    notes: 'Shift went smooth.',
    imageUrls: ['https://images.unsplash.com/photo-1554224155-1696413575b3?q=80&w=200&auto=format&fit=crop'],
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'rev-002',
    cashierId: 'user-2',
    cashierName: 'Sara Smith',
    branchId: 'branch-1',
    branchName: 'Main Branch',
    date: new Date(Date.now() - 43200000).toISOString(),
    cashAmount: 420,
    cardAmount: 800,
    expenses: 20,
    expectedSales: 1250,
    actualTotal: 1240,
    difference: -10,
    notes: 'Wrong change given once.',
    imageUrls: ['https://images.unsplash.com/photo-1554224154-360185c08232?q=80&w=200&auto=format&fit=crop'],
    status: 'pending',
    createdAt: new Date(Date.now() - 43200000).toISOString()
  }
];

export const closingService = {
  async submitClosing(data: Partial<DailyClosing>) {
    if (isFirebaseConfigured) {
      return addDoc(collection(db, 'closings'), {
        ...data,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
    } else {
      const newClosing: DailyClosing = {
        id: Math.random().toString(36).substr(2, 9),
        cashierId: data.cashierId || 'mock-id',
        cashierName: data.cashierName || 'Mock Cashier',
        branchId: data.branchId || 'branch-1',
        branchName: data.branchName || 'Downtown Branch',
        date: data.date || new Date().toISOString(),
        cashAmount: data.cashAmount || 0,
        cardAmount: data.cardAmount || 0,
        expenses: data.expenses || 0,
        expectedSales: data.expectedSales || 0,
        actualTotal: data.actualTotal || 0,
        difference: data.difference || 0,
        notes: data.notes || '',
        imageUrls: data.imageUrls || [],
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      mockClosings.push(newClosing);
      return { id: newClosing.id };
    }
  },

  async getClosings() {
    if (isFirebaseConfigured) {
      const q = query(collection(db, 'closings'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyClosing));
    } else {
      return [...mockClosings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  async updateStatus(id: string, status: 'approved' | 'rejected') {
    if (isFirebaseConfigured) {
      const ref = doc(db, 'closings', id);
      return updateDoc(ref, { status });
    } else {
      const index = mockClosings.findIndex(c => c.id === id);
      if (index !== -1) {
        mockClosings[index].status = status;
      }
    }
  }
};
