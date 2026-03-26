import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);
export const getCurrentUser = () => auth.currentUser;
export const subscribeToAuth = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);
