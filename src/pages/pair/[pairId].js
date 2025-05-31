import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  writeBatch,
  arrayRemove,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PairPage() {
  const router = useRouter();
  const { pairId } = router.query;
  const [user, setUser] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [theirTasks, setTheirTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [partnerId, setPartnerId] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState("Game not started yet!");
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [progress, setProgress] = useState({});
  const [scoreBoard, setScoreBoard] = useState({});
  const [timerEnded, setTimerEnded] = useState(false);

  const TIMER_DURATION = 30 * 1000; // 30 seconds
// const TIMER_DURATION = 24 * 60 * 60 * 1000; // 24 hours (production)
  const calculateAndSaveScore = async () => {
    const gameDate = gameStatus.startDate;
    const taskRef = collection(db, "pairs", pairId, "tasks");
    const snapshot = await getDocs(taskRef);
    const allTasks = snapshot.docs.map((doc) => doc.data());
    const stats = {};

    for (let task of allTasks) {
      const uid = task.ownerUid;
      if (!stats[uid]) stats[uid] = { total: 0, completed: 0 };
      stats[uid].total++;
      if (task.completed) stats[uid].completed++;
    }

    const percentages = {};
    for (let uid in stats) {
      const { completed, total } = stats[uid];
      percentages[uid] = total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    const userAScore = percentages[user?.uid] ?? 0;
    const partnerScore = percentages[partnerId] ?? 0;

    let winner = null;
    let loser = null;

    if (userAScore > partnerScore) {
      winner = user.uid;
      loser = partnerId;
    } else if (partnerScore > userAScore) {
      winner = partnerId;
      loser = user.uid;
    } else {
      winner = "tie";
    }

    const scoreRef = doc(db, "pairs", pairId, "scoreboard", "current");
    const currentScore = (await getDoc(scoreRef)).data() || {};
    await setDoc(scoreRef, {
      ...currentScore,
      [winner]: (currentScore[winner] || 0) + 1,
    });

    // if (loser) {
    //   await addDoc(collection(db, "pairs", pairId, "tasks"), {
    //     text: "Bonus Task for losing today 💪",
    //     completed: false,
    //     ownerUid: loser,
    //     createdAt: new Date(),
    //   });
    // }

    await setDoc(doc(db, "pairs", pairId, "history", gameDate), {
      date: gameDate,
      percentages,
      winner,
    });

    setWinnerInfo({ winner, percentages });
     
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!pairId || !user) return;
    const gameRef = doc(db, "pairs", pairId, "gameStatus", "current");
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) setGameStatus(docSnap.data());
    });

    const scoreRef = doc(db, "pairs", pairId, "scoreboard", "current");
    const unsubscribeScore = onSnapshot(scoreRef, (scoreSnap) => {
      if (scoreSnap.exists()) setScoreBoard(scoreSnap.data());
    });

    return () => {
      unsubscribe();
      unsubscribeScore();
    };
  }, [pairId, user]);

  useEffect(() => {
    if (!gameStatus?.startedAt?.seconds) {
      setTimeLeft("Game not started yet!");
      return;
    }

    const startedAt = new Date(gameStatus.startedAt.seconds * 1000);

    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(startedAt.getTime() + TIMER_DURATION);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Game over for today!");
        clearInterval(interval);
        if (!timerEnded) {
          setTimerEnded(true);
          calculateAndSaveScore();
        
          
        }
      } else {
        setTimeLeft(`${Math.floor(diff / 1000)}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, timerEnded]);

  useEffect(() => {
    if (!pairId || !user) return;
    const tasksRef = collection(db, "pairs", pairId, "tasks");
    return onSnapshot(tasksRef, (snapshot) => {
      const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const my = all.filter((t) => t.ownerUid === user.uid);
      const their = all.filter((t) => t.ownerUid !== user.uid);
      if (their.length > 0) setPartnerId(their[0].ownerUid);
      setMyTasks(my);
      setTheirTasks(their);

      const stats = {};
      for (let task of all) {
        const uid = task.ownerUid;
        if (!stats[uid]) stats[uid] = { total: 0, completed: 0 };
        stats[uid].total++;
        if (task.completed) stats[uid].completed++;
      }
      const percentages = {};
      for (let uid in stats) {
        const { completed, total } = stats[uid];
        percentages[uid] =
          total > 0 ? Math.round((completed / total) * 100) : 0;
      }
      setProgress(percentages);
    });
  }, [pairId, user]);

  const addTask = async () => {
    if (!taskInput.trim() || !gameStatus?.startedAt || timerEnded) return;
    await addDoc(collection(db, "pairs", pairId, "tasks"), {
      text: taskInput.trim(),
      completed: false,
      ownerUid: user.uid,
      createdAt: new Date(),
    });
    setTaskInput("");
  };

  const toggleTask = async (id, done, uid) => {
    if (uid !== user.uid) return;
    await updateDoc(doc(db, "pairs", pairId, "tasks", id), {
      completed: !done,
    });
  };

  const leavePair = async () => {
    await updateDoc(doc(db, "users", user.uid), { pairs: arrayRemove(pairId) });
    router.push("/dashboard");
  };

  const startGame = async () => {
    const tasksSnap = await getDocs(collection(db, "pairs", pairId, "tasks"));
    const batch = writeBatch(db);
    tasksSnap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    const data = {
      startDate: new Date().toISOString().split("T")[0],
      startedBy: user.uid,
      isOver: false,
      startedAt: new Date(),
    };
    await setDoc(doc(db, "pairs", pairId, "gameStatus", "current"), data);
    setTimerEnded(false);
  };

  const resetScoreBoard = async () => {
    await setDoc(doc(db, "pairs", pairId, "scoreboard", "current"), {});
  };

  return (
    <div className="container">
      <h2>Pair Code: {pairId}</h2>
      <p>Share this code with your friend to join</p>
      <div className="button-group">
        <button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </button>
        <button onClick={leavePair}>Leave Pair</button>
        {(!gameStatus?.startedAt || timerEnded) && (
          <button onClick={startGame}>Start Today’s Game</button>
        )}
        <button onClick={resetScoreBoard}>Reset Scoreboard</button>
      </div>

      <div className="scoreboard">
        <h3>🏆 Scoreboard</h3>
        {Object.entries(scoreBoard).map(([uid, wins]) => (
          <p key={uid}>
            <strong>{uid === user?.uid ? "You" : "Partner"}:</strong> {wins}{" "}
            Wins
          </p>
        ))}
      </div>

      <p>🕒 Time left today: {timeLeft}</p>

      <div className="task-panels">
        <div className="card">
          <h2>Your Tasks</h2>
          <div className="progress-bar">
            <div
              className="progress-bar-inner"
              style={{
                width: `${progress[user?.uid] || 0}%`,
                backgroundColor: "#309898",
              }}
            ></div>
          </div>
          <p>Progress: {progress[user?.uid] || 0}%</p>
          {gameStatus?.startedAt && !timerEnded && (
            <>
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add a task"
              />
              <button onClick={addTask}>Add Task</button>
            </>
          )}
          <ul>
            {/* {myTasks.map((task) => (
              <li key={task.id} >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id, task.completed, task.ownerUid)}
                />{" "}
                {task.text}
              </li>
            ))} */}

            {myTasks.map((task) => (
              <label key={task.id} className="task-checkbox">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() =>
                    toggleTask(task.id, task.completed, task.ownerUid)
                  }
                />
                {task.text}
              </label>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Partner&apos;s Tasks</h2>
          <div className="progress-bar">
            <div
              className="progress-bar-inner"
              style={{
                width: `${progress[partnerId] || 0}%`,
                backgroundColor: "#309898",
              }}
            ></div>
          </div>
          <p>Progress: {progress[partnerId] || 0}%</p>
          <ul>
            {/* {theirTasks.map((task) => (
              <li key={task.id}>
                <input type="checkbox" checked={task.completed} disabled /> {task.text}
              </li>
            ))} */}

            {theirTasks.map((task) => (
              <label key={task.id} className="task-checkbox">
                <input type="checkbox" checked={task.completed} disabled />
                {task.text}
              </label>
            ))}
          </ul>
        </div>
      </div>
{console.log("timerEnded",timerEnded)}
      {(winnerInfo && timerEnded) &&  (
        <div className="popup">
          <h2>
            {winnerInfo.winner === "tie"
              ? `It's a tie! 🤝`
              : winnerInfo.winner === user.uid
              ? "You won! 🏆"
              : "Your partner won! 🎉"}
          </h2>
          <p>Your Completion: {winnerInfo.percentages?.[user.uid] || 0}%</p>
          <p>
           Partner&apos;s Completion:{" "}
            {Object.entries(winnerInfo.percentages || {}).find(
              ([k]) => k !== user.uid
            )?.[1] || 0}
            %
          </p>
          <button onClick={() => setWinnerInfo(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
