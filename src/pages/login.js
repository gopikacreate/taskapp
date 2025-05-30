// src/pages/login.js
import { auth, provider, db } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';

export default function Login() {
  const router = useRouter();

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          pairId: null, // will be set later when paired
          createdAt: new Date()
        });
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Google Sign-in error:', error);
    }
  };

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      router.push('/dashboard');
    }
  });

  return () => unsubscribe();
}, []);
  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Tusk</h1>
        <button className="login-button" onClick={loginWithGoogle}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
