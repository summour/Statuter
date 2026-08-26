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
  serverTimestamp 
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
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Sign in with Google Popup
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Save or update user profile in Firestore
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        lastLoginAt: new Date().toISOString()
      }, { merge: true });
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

  await batch.commit();
}

// Fetch user data from Cloud Firestore
export async function fetchUserDataFromCloud(userId: string): Promise<{ decks: LawDeck[]; cards: LawCard[] } | null> {
  if (!userId) return null;

  try {
    const decksSnapshot = await getDocs(collection(db, 'users', userId, 'decks'));
    const cardsSnapshot = await getDocs(collection(db, 'users', userId, 'cards'));

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
    return null;
  }
}
