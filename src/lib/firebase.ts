import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  writeBatch,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { LawDeck, LawCard } from '../types';

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth Instance & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Firestore Instance with custom database ID if present
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Operation types for Firestore error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on startup
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore: Please check your Firebase configuration or network.');
    }
  }
}
testFirestoreConnection();

// Sign in with Google Popup
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Save or update user profile in Firestore
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

// Sign out
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Chunk size: 100 cards per document chunk to keep each document ~80-150KB (far below 1MB limit)
const CARDS_PER_CHUNK = 100;

// Deep sanitize object to remove any `undefined` values that crash Firestore
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    return value === undefined ? null : value;
  }));
}

// Helper: Wrap promise with timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 60000, errorMsg: string = 'การเชื่อมต่อคลาวด์หมดเวลา (Timeout)'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ]);
}

// Batch Writer with operation limits and data sanitization
class SafeBatchWriter {
  private batches: ReturnType<typeof writeBatch>[] = [];
  private currentBatch: ReturnType<typeof writeBatch>;
  private opCounts: number[] = [];
  private currentCount = 0;
  private readonly maxOpsPerBatch = 250;

  constructor() {
    this.currentBatch = writeBatch(db);
    this.batches.push(this.currentBatch);
    this.opCounts.push(0);
  }

  set(docRef: any, data: any, options?: { merge?: boolean }) {
    if (this.currentCount >= this.maxOpsPerBatch) {
      this.currentBatch = writeBatch(db);
      this.batches.push(this.currentBatch);
      this.opCounts.push(0);
      this.currentCount = 0;
    }
    const cleanData = cleanForFirestore(data);
    if (options?.merge) {
      this.currentBatch.set(docRef, cleanData, { merge: true });
    } else {
      this.currentBatch.set(docRef, cleanData);
    }
    this.currentCount++;
    this.opCounts[this.opCounts.length - 1] = this.currentCount;
  }

  delete(docRef: any) {
    if (this.currentCount >= this.maxOpsPerBatch) {
      this.currentBatch = writeBatch(db);
      this.batches.push(this.currentBatch);
      this.opCounts.push(0);
      this.currentCount = 0;
    }
    this.currentBatch.delete(docRef);
    this.currentCount++;
    this.opCounts[this.opCounts.length - 1] = this.currentCount;
  }

  async commitAll(onProgress?: (step: string) => void) {
    const activeBatches = this.batches.filter((_, idx) => this.opCounts[idx] > 0);
    if (activeBatches.length === 0) return;

    for (let i = 0; i < activeBatches.length; i++) {
      onProgress?.(`กำลังบันทึกข้อมูลส่วนที่ ${i + 1}/${activeBatches.length}...`);
      await activeBatches[i].commit();
    }
  }
}

// Sync user decks and cards to Cloud (Firebase Firestore) with High-Performance Chunking
export async function syncDataToCloud(
  userId: string, 
  decks: LawDeck[], 
  cards: LawCard[],
  onProgress?: (status: string) => void
): Promise<{ totalDecks: number; totalCards: number; durationMs: number }> {
  if (!userId) throw new Error('ไม่พบข้อมูลผู้ใช้สำหรับการซิงค์');

  const startTime = Date.now();
  onProgress?.('กำลังจัดกลุ่มและเตรียมข้อมูลตัวบทกฎหมาย...');

  const performSync = async () => {
    // 1. Group cards by deckId
    const cardsByDeck: Record<string, LawCard[]> = {};
    for (const card of cards) {
      if (!cardsByDeck[card.deckId]) {
        cardsByDeck[card.deckId] = [];
      }
      cardsByDeck[card.deckId].push(card);
    }

    const batchWriter = new SafeBatchWriter();

    // 2. Fetch existing chunks to clean up obsolete chunks if any
    let existingChunkIds: string[] = [];
    try {
      const existingChunksSnap = await getDocs(collection(db, 'users', userId, 'deck_chunks'));
      existingChunkIds = existingChunksSnap.docs.map(d => d.id);
    } catch (err) {
      console.warn('Could not list existing chunks, will overwrite/set directly:', err);
    }

    onProgress?.(`กำลังเตรียมบันทึก ${decks.length} สำรับ (${cards.length} มาตรา)...`);

    // A. Write deck documents
    for (const deck of decks) {
      const deckRef = doc(db, 'users', userId, 'decks', deck.id);
      batchWriter.set(deckRef, {
        id: deck.id,
        name: deck.name || '',
        shortName: deck.shortName || '',
        description: deck.description || '',
        iconName: deck.iconName || 'BookOpen',
        color: deck.color || '#18181b',
        category: deck.category || 'custom',
        categoryLabel: deck.categoryLabel || '',
        totalCards: (cardsByDeck[deck.id] || []).length,
        isDefault: Boolean(deck.isDefault),
        createdAt: deck.createdAt || Date.now(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // B. Write card chunks for each deck
    const newChunkIds = new Set<string>();

    for (const deck of decks) {
      const deckCards = cardsByDeck[deck.id] || [];
      const totalChunks = Math.ceil(deckCards.length / CARDS_PER_CHUNK) || 1;

      if (deckCards.length === 0) {
        const chunkId = `${deck.id}_chunk_0`;
        newChunkIds.add(chunkId);
        const chunkRef = doc(db, 'users', userId, 'deck_chunks', chunkId);
        batchWriter.set(chunkRef, {
          deckId: deck.id,
          chunkIndex: 0,
          totalChunks: 1,
          count: 0,
          cards: [],
          updatedAt: new Date().toISOString()
        });
      } else {
        for (let i = 0; i < totalChunks; i++) {
          const startIdx = i * CARDS_PER_CHUNK;
          const chunkCards = deckCards.slice(startIdx, startIdx + CARDS_PER_CHUNK);
          const chunkId = `${deck.id}_chunk_${i}`;
          newChunkIds.add(chunkId);
          const chunkRef = doc(db, 'users', userId, 'deck_chunks', chunkId);

          batchWriter.set(chunkRef, {
            deckId: deck.id,
            chunkIndex: i,
            totalChunks,
            count: chunkCards.length,
            cards: chunkCards.map(c => cleanForFirestore(c)),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    // C. Clean up obsolete chunks
    for (const oldId of existingChunkIds) {
      if (!newChunkIds.has(oldId)) {
        const oldRef = doc(db, 'users', userId, 'deck_chunks', oldId);
        batchWriter.delete(oldRef);
      }
    }

    // D. Update user metadata
    const userRef = doc(db, 'users', userId);
    batchWriter.set(userRef, {
      lastSyncAt: new Date().toISOString(),
      totalDecks: decks.length,
      totalCards: cards.length,
      syncEngineVersion: 2
    }, { merge: true });

    // Commit all safe batches
    await batchWriter.commitAll((status) => onProgress?.(status));
  };

  try {
    await withTimeout(performSync(), 45000, 'การซิงค์ข้อมูลขึ้นคลาวด์ใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    const durationMs = Date.now() - startTime;
    return {
      totalDecks: decks.length,
      totalCards: cards.length,
      durationMs
    };
  } catch (err: any) {
    console.error('syncDataToCloud detailed error:', err);
    // Don't wrap if already a standard Error
    if (err instanceof Error) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    throw err;
  }
}

// Fetch user data from Cloud Firestore (Supports both Chunked and Legacy single-doc formats)
export async function fetchUserDataFromCloud(
  userId: string,
  onProgress?: (status: string) => void
): Promise<{ decks: LawDeck[]; cards: LawCard[] } | null> {
  if (!userId) return null;

  const performFetch = async () => {
    onProgress?.('กำลังดึงข้อมูลสำรับจากคลาวด์...');

    // 1. Fetch decks
    let decksSnapshot;
    try {
      decksSnapshot = await getDocs(collection(db, 'users', userId, 'decks'));
    } catch (err) {
      console.error('Error listing decks:', err);
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/decks`);
      return null;
    }

    const cloudDecks: LawDeck[] = [];
    decksSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.id) {
        cloudDecks.push(data as LawDeck);
      }
    });

    onProgress?.('กำลังดาวน์โหลดข้อมูลตัวบทกฎหมาย...');

    const cardsMap = new Map<string, LawCard>();

    // 2. Fetch chunked cards (Fast modern engine)
    try {
      const chunksSnap = await getDocs(collection(db, 'users', userId, 'deck_chunks'));
      chunksSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (Array.isArray(data.cards)) {
          for (const card of data.cards) {
            if (card && card.id) {
              cardsMap.set(card.id, card as LawCard);
            }
          }
        }
      });
    } catch (err) {
      console.warn('Could not fetch deck_chunks:', err);
    }

    // 3. Fallback: If no chunked cards found, check legacy cards subcollection
    if (cardsMap.size === 0) {
      try {
        const legacyCardsSnap = await getDocs(collection(db, 'users', userId, 'cards'));
        legacyCardsSnap.forEach(docSnap => {
          const card = docSnap.data() as LawCard;
          if (card && card.id) {
            cardsMap.set(card.id, card);
          }
        });
      } catch (err) {
        console.warn('Could not fetch legacy cards collection:', err);
      }
    }

    const cloudCards = Array.from(cardsMap.values());

    return {
      decks: cloudDecks,
      cards: cloudCards
    };
  };

  try {
    return await withTimeout(performFetch(), 45000, 'การดึงข้อมูลจากคลาวด์หมดเวลา กรุณาลองใหม่อีกครั้ง');
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    throw error;
  }
}
