import { useCallback, useRef, useState } from "react";
import { HomeScreen } from "./features/home/HomeScreen";
import { NoteRushScreen } from "./features/noteRush/NoteRushScreen";
import { loadNoteRushBest, type Exercise } from "./features/noteRush/useNoteRush";
import { calcXp } from "./game/scoring";
import { useUserProgress } from "./state/userProgress";

export default function App() {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const returningHome = useRef<Exercise | null>(null);
  const { dispatch } = useUserProgress();
  const completeRound = useCallback((correctCount: number, attempts: number) => {
    if (attempts === 0) return;
    dispatch({ type: "GAIN_XP", xp: calcXp(correctCount / attempts) });
    dispatch({ type: "INC_STREAK" });
  }, [dispatch]);

  function navigate(next: Exercise | null) {
    if (!next) returningHome.current = exercise;
    setExercise(next);
    window.scrollTo(0, 0);
  }

  if (!exercise) {
    return (
      <HomeScreen
        best={loadNoteRushBest()}
        focusPlay={returningHome.current}
        onOpenExercise={() => navigate("notes")}
        onOpenIntervals={() => navigate("intervals")}
      />
    );
  }

  return (
    <NoteRushScreen
      exercise={exercise}
      onExit={() => navigate(null)}
      onComplete={completeRound}
    />
  );
}
