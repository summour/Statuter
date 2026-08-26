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

// Chunk size: 150 cards per document chunk to keep each document ~100-200KB (far below 1MB limit)
const CARDS_PER_CHUNK = 150;

// Helper: Wrap promise with timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 25000, errorMsg: string = 'การเชื่อมต่อคลาวด์หมดเวลา (Timeout)'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ]);
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
  onProgress?.('กำลังเตรียมโครงสร้างข้อมูลและบีบอัดสำรับ...');

  const performSync = async () => {
    // 1. Group cards by deckId
    const cardsByDeck: Record<string, LawCard[]> = {};
    for (const card of cards) {
      if (!cardsByDeck[card.deckId]) {
        cardsByDeck[card.deckId] = [];
      }
      cardsByDeck[card.deckId].push(card);
    }

    // 2. Fetch existing chunks to clean up obsolete chunks if any
    let existingChunkIds: string[] = [];
    try {
      const existingChunksSnap = await getDocs(collection(db, 'users', userId, 'deck_chunks'));
      existingChunkIds = existingChunksSnap.docs.map(d => d.id);
    } catch (err) {
      console.warn('Could not list existing chunks, will overwrite/set directly:', err);
    }

    onProgress?.(`กำลังบันทึกข้อมูล ${decks.length} สำรับ (${cards.length} มาตรา) ขึ้นคลาวด์...`);

    // Prepare writes across safe batches (max 300 writes per batch)
    const BATCH_LIMIT = 300;
    let currentBatch = writeBatch(db);
    let currentBatchOps = 0;
    const batchList: ReturnType<typeof writeBatch>[] = [currentBatch];

    const addBatchOp = (fn: (b: ReturnType<typeof writeBatch>) => void) => {
      if (currentBatchOps >= BATCH_LIMIT) {
        currentBatch = writeBatch(db);
        batchList.push(currentBatch);
        currentBatchOps = 0;
      }
      fn(currentBatch);
      currentBatchOps++;
    };

    // A. Write deck documents
    for (const deck of decks) {
      const deckRef = doc(db, 'users', userId, 'decks', deck.id);
      addBatchOp((b) => {
        b.set(deckRef, {
          ...deck,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });
    }

    // B. Write card chunks for each deck
    const newChunkIds = new Set<string>();

    for (const deck of decks) {
      const deckCards = cardsByDeck[deck.id] || [];
      const totalChunks = Math.ceil(deckCards.length / CARDS_PER_CHUNK) || 1;

      if (deckCards.length === 0) {
        // Empty chunk for deck with 0 cards
        const chunkId = `${deck.id}_chunk_0`;
        newChunkIds.add(chunkId);
        const chunkRef = doc(db, 'users', userId, 'deck_chunks', chunkId);
        addBatchOp((b) => {
          b.set(chunkRef, {
            deckId: deck.id,
            chunkIndex: 0,
            totalChunks: 1,
            count: 0,
            cards: [],
            updatedAt: new Date().toISOString()
          });
        });
      } else {
        for (let i = 0; i < totalChunks; i++) {
          const startIdx = i * CARDS_PER_CHUNK;
          const chunkCards = deckCards.slice(startIdx, startIdx + CARDS_PER_CHUNK);
          const chunkId = `${deck.id}_chunk_${i}`;
          newChunkIds.add(chunkId);
          const chunkRef = doc(db, 'users', userId, 'deck_chunks', chunkId);

          addBatchOp((b) => {
            b.set(chunkRef, {
              deckId: deck.id,
              chunkIndex: i,
              totalChunks,
              count: chunkCards.length,
              cards: chunkCards,
              updatedAt: new Date().toISOString()
            });
          });
        }
      }
    }

    // C. Clean up obsolete chunks
    for (const oldId of existingChunkIds) {
      if (!newChunkIds.has(oldId)) {
        const oldRef = doc(db, 'users', userId, 'deck_chunks', oldId);
        addBatchOp((b) => {
          b.delete(oldRef);
        });
      }
    }

    // D. Update user metadata
    const userRef = doc(db, 'users', userId);
    addBatchOp((b) => {
      b.set(userRef, {
        lastSyncAt: new Date().toISOString(),
        totalDecks: decks.length,
        totalCards: cards.length,
        syncEngineVersion: 2
      }, { merge: true });
    });

    // Commit all batches in parallel
    await Promise.all(batchList.map(b => b.commit()));
  };

  try {
    await withTimeout(performSync(), 30000, 'การซิงค์ข้อมูลขึ้นคลาวด์ใช้เวลานานเกินไป กรุณาตรวจสอบอินเทอร์เน็ต');
    const durationMs = Date.now() - startTime;
    return {
      totalDecks: decks.length,
      totalCards: cards.length,
      durationMs
    };
  } catch (err) {
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
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/decks`);
      return null;
    }

    const cloudDecks: LawDeck[] = [];
    decksSnapshot.forEach(docSnap => {
      cloudDecks.push(docSnap.data() as LawDeck);
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
    return await withTimeout(performFetch(), 30000, 'การดึงข้อมูลจากคลาวด์หมดเวลา กรุณาลองใหม่อีกครั้ง');
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    throw error;
  }
}
