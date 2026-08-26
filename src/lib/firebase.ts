import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  writeBatch,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { LawDeck, LawCard, OfficialLawDeck } from '../types';
import { sanitizeCardTextAndParagraphs } from '../utils/thaiLawParser';

// Known Admin identifiers
export const ADMIN_UIDS = ['Statuter-Dev'];
export const ADMIN_EMAILS = ['ratchataphiphat@gmail.com'];

export function checkIsAdmin(user: { uid?: string | null; email?: string | null } | null): boolean {
  if (!user) return false;
  if (user.uid && ADMIN_UIDS.includes(user.uid)) return true;
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
  return false;
}

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

// Ensure Firebase Auth session exists (anonymously if not logged in with Google)
export async function ensureFirebaseAuth(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous auth fallback not available:', err);
    return null;
  }
}

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

    const cloudCards = Array.from(cardsMap.values()).map(c => sanitizeCardTextAndParagraphs(c));

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

import { 
  saveOfficialDeckToLocalDB, 
  loadOfficialDecksFromLocalDB, 
  loadOfficialCardsFromLocalDB, 
  deleteOfficialDeckFromLocalDB, 
  updateOfficialDeckStatusInLocalDB 
} from '../utils/storage';
import { parseThaiLawText } from '../utils/thaiLawParser';

// -------------------------------------------------------------
// OFFICIAL DECKS & STATUTES (CENTRAL CLOUD & LOCAL REPOSITORY)
// -------------------------------------------------------------

// 1. Fetch Official Decks (List of all published official decks in the system)
export async function fetchOfficialDecks(includeUnpublished: boolean = false): Promise<OfficialLawDeck[]> {
  const localDecks = await loadOfficialDecksFromLocalDB();

  const fetchCloud = async () => {
    const colRef = collection(db, 'official_decks');
    const snapshot = await getDocs(colRef);

    const cloudMap = new Map<string, OfficialLawDeck>();
    const deletedDeckIds = new Set<string>();

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data || !data.id) return;
      if (data.id === 'official_civil_code_standard' || data.isDeleted) {
        deletedDeckIds.add(data.id);
      } else {
        const deck: OfficialLawDeck = {
          id: data.id,
          name: data.name || '',
          shortName: data.shortName || '',
          category: data.category || 'code',
          categoryLabel: data.categoryLabel || 'ประมวลกฎหมาย',
          iconName: data.iconName || 'BookOpen',
          color: data.color || '#3b82f6',
          description: data.description || '',
          isPublished: data.isPublished !== false,
          version: data.version || '1.0',
          totalSections: data.totalSections || 0,
          author: data.author || 'Statuter-Dev',
          updatedAt: data.updatedAt || Date.now(),
          downloadCount: data.downloadCount || 0,
          isDefault: true,
          rawText: data.rawText || undefined,
        };

        cloudMap.set(deck.id, deck);
        saveOfficialDeckToLocalDB(deck, undefined, deck.rawText).catch(() => {});
      }
    });

    // Purge any local official decks on this client that were deleted or are no longer on Cloud
    for (const localDeck of localDecks) {
      if (deletedDeckIds.has(localDeck.id) || !cloudMap.has(localDeck.id)) {
        deleteOfficialDeckFromLocalDB(localDeck.id).catch(() => {});
      }
    }

    const allMerged = Array.from(cloudMap.values());
    const result = allMerged.filter(deck => includeUnpublished || deck.isPublished);
    return result.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  };

  try {
    // 3.5-second timeout so the UI is never stalled
    return await withTimeout(fetchCloud(), 3500, 'Cloud fetch timeout');
  } catch (error) {
    console.warn('Official decks using local DB instant cache:', error);
    const result = localDecks.filter(deck => includeUnpublished || deck.isPublished);
    return result.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
}

// 2. Fetch all cards for a specific Official Deck (Instant On-the-fly Parsing)
export async function fetchOfficialDeckCards(
  deckId: string, 
  onProgress?: (msg: string) => void
): Promise<LawCard[]> {
  if (!deckId) return [];

  const performFetch = async () => {
    onProgress?.('กำลังดึงข้อมูลตัวบทจากคลัง...');
    
    // 1. Check local IndexedDB cards first
    const localCards = await loadOfficialCardsFromLocalDB(deckId);
    if (localCards && localCards.length > 0) {
      return localCards;
    }

    // 2. Fetch official deck content from Firestore
    try {
      // Check subdocument 'content/raw' first
      let rawText = '';
      let deckMeta: any = {};

      try {
        const rawDocSnap = await getDoc(doc(db, 'official_decks', deckId, 'content', 'raw'));
        if (rawDocSnap.exists()) {
          rawText = rawDocSnap.data()?.rawText || '';
        }
      } catch {}

      const deckDocSnap = await getDoc(doc(db, 'official_decks', deckId));
      if (deckDocSnap.exists()) {
        deckMeta = deckDocSnap.data() || {};
        if (!rawText) {
          rawText = deckMeta.rawText || '';
        }
      }

      if (rawText && typeof rawText === 'string' && rawText.trim().length > 0) {
        onProgress?.('กำลังประมวลผลแยกมาตราในเครื่อง (0.05 วินาที)...');
        const report = parseThaiLawText(rawText);
        if (report && report.sections.length > 0) {
          const parsedCards: LawCard[] = report.sections.map((sec, idx) => ({
            id: `${deckId}_sec_${sec.sectionRawNum || idx + 1}`,
            deckId: deckId,
            deckName: deckMeta.name || 'สำรับกฎหมาย',
            deckShortName: deckMeta.shortName || 'กฎหมาย',
            book: sec.book,
            titleStructure: sec.titleStructure,
            chapter: sec.chapter,
            part: sec.part,
            sectionNumber: sec.sectionNumber,
            sectionRawNum: sec.sectionRawNum,
            title: sec.title,
            fullText: sec.fullText,
            paragraphs: sec.paragraphs,
            isVerified: true,
            createdAt: Date.now(),
          }));

          // Save parsed cards to IndexedDB for instant future reads
          const officialDeckObj: OfficialLawDeck = {
            id: deckMeta.id || deckId,
            name: deckMeta.name || '',
            shortName: deckMeta.shortName || '',
            category: deckMeta.category || 'code',
            categoryLabel: deckMeta.categoryLabel || 'ประมวลกฎหมาย',
            iconName: deckMeta.iconName || 'BookOpen',
            color: deckMeta.color || '#3b82f6',
            description: deckMeta.description || '',
            isPublished: deckMeta.isPublished !== false,
            version: deckMeta.version || '1.0',
            totalSections: parsedCards.length,
            author: deckMeta.author || 'Statuter-Dev',
            updatedAt: deckMeta.updatedAt || Date.now(),
            isDefault: true,
            rawText: rawText,
          };
          saveOfficialDeckToLocalDB(officialDeckObj, parsedCards, rawText).catch(() => {});

          return parsedCards;
        }
      }
    } catch (err) {
      console.warn('Direct rawText cloud fetch error, falling back to legacy:', err);
    }

    // 3. Fallback for legacy chunked decks
    const cardsMap = new Map<string, LawCard>();
    try {
      const chunksSnap = await getDocs(collection(db, 'official_decks', deckId, 'chunks'));
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
      console.warn('Could not fetch official deck chunks:', err);
    }

    const finalCards = Array.from(cardsMap.values()).map(c => sanitizeCardTextAndParagraphs(c));
    return finalCards;
  };

  try {
    return await withTimeout(performFetch(), 10000, 'การดึงข้อมูลตัวบทหมดเวลา กรุณาลองใหม่อีกครั้ง');
  } catch (error) {
    console.error('Error fetching official deck cards:', error);
    const cached = await loadOfficialCardsFromLocalDB(deckId);
    if (cached && cached.length > 0) return cached;
    throw error;
  }
}

// 3. Publish / Update an Official Deck to Cloud & Local Official Storage (Instant Raw Text)
export async function publishOfficialDeckToCloud(
  deck: OfficialLawDeck,
  cards: LawCard[],
  onProgress?: (msg: string) => void,
  rawText?: string
): Promise<{ success: boolean; durationMs: number; totalCards: number }> {
  const startTime = Date.now();

  // Construct raw text if not provided
  const fullRawText = rawText || deck.rawText || cards.map(c => {
    const header = [c.book, c.titleStructure, c.chapter, c.part].filter(Boolean).join('\n');
    const secTitle = c.title ? ` ${c.title}` : '';
    return (header ? header + '\n' : '') + `${c.sectionNumber}${secTitle}\n${c.fullText}`;
  }).join('\n\n');

  const deckWithRawText: OfficialLawDeck = {
    ...deck,
    rawText: fullRawText,
    totalSections: cards.length,
    updatedAt: Date.now(),
    author: deck.author || 'Statuter-Dev',
  };

  // 1. Save locally to IndexedDB immediately (takes <20ms)
  onProgress?.('กำลังบันทึกลงฐานข้อมูลในเครื่อง (IndexedDB)...');
  await saveOfficialDeckToLocalDB(deckWithRawText, cards, fullRawText);

  // 2. Publish metadata and raw content to Firestore Cloud (<200ms)
  try {
    onProgress?.('กำลังส่งข้อมูลสู่คลังกลาง...');
    const deckDocRef = doc(db, 'official_decks', deck.id);
    
    // Metadata doc (lightweight, without huge rawText payload)
    const { rawText: _, ...deckMetaOnly } = deckWithRawText;
    await setDoc(deckDocRef, cleanForFirestore(deckMetaOnly), { merge: true });

    // Raw content subdoc
    const rawDocRef = doc(db, 'official_decks', deck.id, 'content', 'raw');
    await setDoc(rawDocRef, cleanForFirestore({ rawText: fullRawText, updatedAt: Date.now() }), { merge: true });
  } catch (cloudError) {
    console.warn('Cloud sync deferred or offline:', cloudError);
  }

  return {
    success: true,
    durationMs: Date.now() - startTime,
    totalCards: cards.length,
  };
}

// 4. Delete Official Deck from Cloud & Local (Instant-First Non-Blocking)
export async function deleteOfficialDeckFromCloud(deckId: string): Promise<void> {
  // 1. Delete from local IndexedDB cache immediately (<10ms)
  await deleteOfficialDeckFromLocalDB(deckId);

  // 2. Perform Cloud deletion in background (non-blocking)
  const performCloudDelete = async () => {
    try {
      await deleteDoc(doc(db, 'official_decks', deckId, 'content', 'raw'));
    } catch {}
    try {
      await deleteDoc(doc(db, 'official_decks', deckId));
    } catch {}
  };

  // Fire-and-forget so UI deletes instantaneously
  performCloudDelete().catch(err => {
    console.warn('Cloud deck delete background warning:', err);
  });
}

// 5. Toggle Official Deck Publish Status (Admin Only)
export async function toggleOfficialDeckPublishStatus(
  deckId: string, 
  isPublished: boolean
): Promise<void> {
  await updateOfficialDeckStatusInLocalDB(deckId, isPublished);
  try {
    const deckRef = doc(db, 'official_decks', deckId);
    await setDoc(deckRef, { 
      isPublished,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.warn('Cloud status update deferred:', error);
  }
}
