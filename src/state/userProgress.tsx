import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { StageId, UserProgress } from "../game/types";
import { loadJson, saveJson } from "../lib/storage";

const STORAGE_KEY = "earcade_user_v3";

type Action =
  | { type: "GAIN_XP"; xp: number }
  | { type: "INC_STREAK" }
  | { type: "UNLOCK_NEXT"; stageId: StageId; currentLevel: number }
  | { type: "RESET" };

const initial: UserProgress = loadJson<UserProgress>(STORAGE_KEY, {
  xp: 0,
  streak: 0,
  unlocked: { keys: 1, rhythm: 1, intervals: 1 },
});

function reducer(state: UserProgress, action: Action): UserProgress {
  switch (action.type) {
    case "GAIN_XP":
      return { ...state, xp: state.xp + action.xp };
    case "INC_STREAK":
      return { ...state, streak: state.streak + 1 };
    case "UNLOCK_NEXT": {
      const nextUnlocked = { ...state.unlocked };
      if (nextUnlocked[action.stageId] === action.currentLevel) {
        nextUnlocked[action.stageId] = Math.min(
          20,
          nextUnlocked[action.stageId] + 1,
        );
      }
      return { ...state, unlocked: nextUnlocked };
    }
    case "RESET":
      return {
        xp: 0,
        streak: 0,
        unlocked: { keys: 1, rhythm: 1, intervals: 1 },
      };
    default:
      return state;
  }
}

type Ctx = { user: UserProgress; dispatch: (a: Action) => void };

const UserProgressContext = createContext<Ctx | null>(null);

export function UserProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    saveJson(STORAGE_KEY, user);
  }, [user]);

  const value = useMemo(() => ({ user, dispatch }), [user]);

  return (
    <UserProgressContext.Provider value={value}>
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress() {
  const ctx = useContext(UserProgressContext);
  if (!ctx)
    throw new Error("useUserProgress must be used within UserProgressProvider");
  return ctx;
}
