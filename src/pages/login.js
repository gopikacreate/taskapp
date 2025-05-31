// src/pages/login.js
import { auth, provider, db } from '@/lib/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      // Try Popup First
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Popup Sign-in error, falling back to redirect:', error);
      // Fallback to Redirect if popup blocked
      await signInWithRedirect(auth, provider);
    }
  };

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        console.log('Redirect result:', result);

        if (result?.user) {
          const user = result.user;
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              pairId: null,
              createdAt: new Date(),
            });
          }
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
      if (user) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Tusk</h1>
        <button
          className="login-button"
          onClick={loginWithGoogle}
          disabled={loading}
        >
          {loading ? 'Redirecting...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}
