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

// Sync user decks and cards to Cloud (Firebase Firestore)
export async function syncDataToCloud(userId: string, decks: LawDeck[], cards: LawCard[]): Promise<void> {
  if (!userId) return;

  const batch = writeBatch(db);

  // Write decks
  for (const deck of decks) {
    const deckRef = doc(db, 'users', userId, 'decks', deck.id);
    batch.set(deckRef, {
      ...deck,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  // Write cards
  for (const card of cards) {
    const cardRef = doc(db, 'users', userId, 'cards', card.id);
    batch.set(cardRef, {
      ...card,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  // Update user lastSyncAt
  const userRef = doc(db, 'users', userId);
  batch.set(userRef, {
    lastSyncAt: new Date().toISOString(),
    totalDecks: decks.length,
    totalCards: cards.length
  }, { merge: true });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
  }
}

// Fetch user data from Cloud Firestore
export async function fetchUserDataFromCloud(userId: string): Promise<{ decks: LawDeck[]; cards: LawCard[] } | null> {
  if (!userId) return null;

  try {
    let decksSnapshot;
    try {
      decksSnapshot = await getDocs(collection(db, 'users', userId, 'decks'));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/decks`);
      return null;
    }

    let cardsSnapshot;
    try {
      cardsSnapshot = await getDocs(collection(db, 'users', userId, 'cards'));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/cards`);
      return null;
    }

    const cloudDecks: LawDeck[] = [];
    decksSnapshot.forEach(docSnap => {
      cloudDecks.push(docSnap.data() as LawDeck);
    });

    const cloudCards: LawCard[] = [];
    cardsSnapshot.forEach(docSnap => {
      cloudCards.push(docSnap.data() as LawCard);
    });

    return {
      decks: cloudDecks,
      cards: cloudCards
    };
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    throw error;
  }
}
