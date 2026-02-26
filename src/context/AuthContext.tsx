import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Ensure a profile document exists in Firestore
                const profileRef = doc(db, 'profiles', firebaseUser.uid);
                const profileSnap = await getDoc(profileRef);
                if (!profileSnap.exists()) {
                    await setDoc(profileRef, {
                        display_name: firebaseUser.email?.split('@')[0] ?? '',
                        email: firebaseUser.email ?? '',
                        created_at: new Date().toISOString(),
                    });
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signUp = useCallback(async (email: string, password: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            return { error: null };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Sign up failed';
            return { error: message };
        }
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { error: null };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Sign in failed';
            return { error: message };
        }
    }, []);

    const signOutFn = useCallback(async () => {
        await firebaseSignOut(auth);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut: signOutFn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
