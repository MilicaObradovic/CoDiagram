import { create } from 'zustand';
import type {HistoryState, StoreState} from '../types/store.ts';
import { UndoRedo } from './undo-redo';
import * as Y from 'yjs';

const useStore = create<StoreState>((set, get) => ({
    currentUserId: null,
    isInitialized: false,

    setCurrentUser: (userId: string) => {
        UndoRedo.setCurrentUser(userId);
        set({ currentUserId: userId });
    },

    initializeYjs: (doc: Y.Doc) => {
        UndoRedo.setYDoc(doc);
        set({ isInitialized: true });
    },

    undo: () => {
        const userId = get().currentUserId;
        if (!userId) return;
        UndoRedo.undo(userId);
    },

    redo: () => {
        const userId = get().currentUserId;
        if (!userId) return;
        UndoRedo.redo(userId);
    },

    canUndo: () => {
        const userId = get().currentUserId;
        return userId ? UndoRedo.canUndo(userId) : false;
    },

    canRedo: () => {
        const userId = get().currentUserId;
        return userId ? UndoRedo.canRedo(userId) : false;
    },

    addUserHistory: (state: HistoryState) => {
        const userId = get().currentUserId;
        if (userId) {
            UndoRedo.addUserHistory(userId, state);
        }
    }
}));

export { useStore };