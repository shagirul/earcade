import { useCallback, useRef, useState } from "react";
import { HomeScreen } from "./features/home/HomeScreen";
import { NoteRushScreen } from "./features/noteRush/NoteRushScreen";
import { loadNoteRushBest } from "./features/noteRush/useNoteRush";
import { calcXp } from "./game/scoring";
import { useUserProgress } from "./state/userProgress";

export default function App() {
  const [showExercise, setShowExercise] = useState(false);
  const returningHome = useRef(false);
  const { dispatch } = useUserProgress();
  const completeRound = useCallback((score: number, attempts: number) => {
    if (attempts === 0) return;
    dispatch({ type: "GAIN_XP", xp: calcXp(score / attempts) });
    dispatch({ type: "INC_STREAK" });
  }, [dispatch]);

  function navigate(toExercise: boolean) {
    returningHome.current = !toExercise;
    setShowExercise(toExercise);
    window.scrollTo(0, 0);
  }

  if (!showExercise) {
    return (
      <HomeScreen
        best={loadNoteRushBest()}
        focusPlay={returningHome.current}
        onOpenExercise={() => navigate(true)}
      />
    );
  }

  return (
    <NoteRushScreen
      onExit={() => navigate(false)}
      onComplete={completeRound}
    />
  );
}
