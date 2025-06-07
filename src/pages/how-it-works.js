// src/pages/how-it-works.js
import Head from 'next/head';

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>How It Works | Task Duel</title>
        <meta name="description" content="Learn how to play Task Duel and check out all the features!" />
      </Head>
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>How the App Works</h1>

        <section>
          <h2>How to Pair Up</h2>
          <ul>
            <li><strong>Create a New Pair</strong>: Click the <em>Create New Pair</em> button to generate a unique pairing code.</li>
            <li><strong>Share the Code</strong>: Send the code to the person you want to challenge.</li>
            <li><strong>Join a Pair</strong>: Your partner can join by entering the code in the <em>Join Pair</em> section.</li>
            <li><strong>Multiple Duos</strong>: You can form multiple duos with different people — manage and switch between them from your dashboard.</li>
          </ul>
        </section>

        <section>
          <h2>Starting the Game</h2>
          <ul>
            <li><strong>Start Game</strong>: Once both users are paired, click <em>Start Game</em> to begin.</li>
            <li><strong>24-Hour Timer</strong>: A 24-hour countdown starts immediately.</li>
            <li><strong>Adding Tasks</strong>: After the game starts, both users can add tasks during the 24-hour window.</li>
            <li><strong>Completing Tasks</strong>: Mark each task as done when you finish it.</li>
          </ul>
        </section>

        <section>
          <h2>Progress and Scoring</h2>
          <ul>
            <li><strong>Progress Bar</strong>: As you complete tasks, a progress bar shows your completion percentage compared to your partner.</li>
            <li><strong>Winner Declaration</strong>: When the timer ends, the user who completed the highest percentage of tasks wins.</li>
            <li><strong>Scoreboard</strong>: Your win-loss record updates on the scoreboard after each match.</li>
          </ul>
        </section>

        <section>
          <h2>Managing Your Game</h2>
          <ul>
            <li><strong>Restart Game</strong>: Reset your scoreboard to zero anytime by clicking <em>Restart Game</em>.</li>
            <li><strong>Leave Pair</strong>: Leave a duo anytime if you no longer want to compete with that partner.</li>
          </ul>
        </section>

        <hr style={{ margin: '2rem 0' }} />

        <h1>Application Specifications</h1>
        <ul>
          <li><strong>Multi-User Support</strong>: Form multiple duos with different partners.</li>
          <li><strong>Real-Time Updates</strong>: Task progress and scores update live.</li>
          <li><strong>24-Hour Game Cycle</strong>: Strict 24-hour match timers.</li>
          <li><strong>Task Management</strong>: Add and complete tasks during the match.</li>
          <li><strong>Progress Visualization</strong>: Real-time progress bars display performance.</li>
          <li><strong>Win Tracking</strong>: Scoreboard updates after every match.</li>
          <li><strong>Reset Option</strong>: Reset your overall score anytime.</li>
          <li><strong>Flexible Exit</strong>: Leave any duo anytime.</li>
        </ul>
      </main>
    </>
  );
}
