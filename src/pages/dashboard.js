// src/pages/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pairIdInput, setPairIdInput] = useState('');
  const [status, setStatus] = useState('');
  const [activePairs, setActivePairs] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setActivePairs(data.pairs || []);
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const createPair = async () => {
    const pairId = uuidv4().slice(0, 6);
    const pairRef = doc(db, 'pairs', pairId);

    await setDoc(pairRef, {
      user1: user.uid,
      user2: null,
      createdAt: new Date()
    });

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      pairs: arrayUnion(pairId)
    });

    setActivePairs((prev) => [...prev, pairId]);
    router.push(`/pair/${pairId}`);
  };

  const joinPair = async () => {
    if (!pairIdInput.trim()) {
      setStatus('Please enter a pair code.');
      return;
    }

    const pairRef = doc(db, 'pairs', pairIdInput.trim());
    const pairSnap = await getDoc(pairRef);

    if (!pairSnap.exists()) {
      setStatus('Pair not found.');
      return;
    }

    const data = pairSnap.data();
    if (data.user2 && data.user2 !== user.uid) {
      setStatus('Pair already full.');
      return;
    }

    await updateDoc(pairRef, {
      user2: user.uid
    });

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      pairs: arrayUnion(pairIdInput.trim())
    });

    setActivePairs((prev) => [...prev, pairIdInput.trim()]);
    router.push(`/pair/${pairIdInput.trim()}`);
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Welcome to Tusk</h1>

      <h2 className="dashboard-subtitle">Your Active Duos</h2>
      <div className="duo-list">
        {activePairs.map((id) => (
          <button key={id} className="dashboard-button" onClick={() => router.push(`/pair/${id}`)}>
            Go to Duo: {id}
          </button>
        ))}
      </div>

      <button className="dashboard-button" onClick={createPair}>Create New Pair</button>
      <div className="input-group">
        <input
          className="dashboard-input"
          placeholder="Enter Pair Code"
          value={pairIdInput}
          onChange={(e) => setPairIdInput(e.target.value)}
        />
        <button className="dashboard-button" onClick={joinPair}>Join Pair</button>
      </div>
      {status && <p className="dashboard-status">{status}</p>}
      <button className="dashboard-logout-button" onClick={logout}>Logout</button>
    </div>
  );
}
