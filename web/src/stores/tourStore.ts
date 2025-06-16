import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TourState {
  workbenchTourCompleted: boolean;
  modelEvaluationTourCompleted: boolean;
  setWorkbenchTourCompleted: (completed: boolean) => void;
  setModelEvaluationTourCompleted: (completed: boolean) => void;
  shouldShowWorkbenchTour: () => boolean;
  shouldShowModelEvaluationTour: () => boolean;
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      workbenchTourCompleted: false,
      modelEvaluationTourCompleted: false,
      setWorkbenchTourCompleted: (completed: boolean) => {
        set({ workbenchTourCompleted: completed });
      },
      setModelEvaluationTourCompleted: (completed: boolean) => {
        set({ modelEvaluationTourCompleted: completed });
      },
      shouldShowWorkbenchTour: () => {
        return !get().workbenchTourCompleted;
      },
      shouldShowModelEvaluationTour: () => {
        return !get().modelEvaluationTourCompleted;
      },
    }),
    {
      name: 'tour-storage',
    }
  )
); 