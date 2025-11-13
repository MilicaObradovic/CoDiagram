import * as Y from 'yjs';
import type {Edge} from "reactflow";
import {authApi} from "../services/service.ts";

export const UndoRedoManager = {
    undoManagers: new Map<string, Y.UndoManager>(),
    yDoc: null as Y.Doc | null,
    userId: "" as string,
    diagramId: "" as string,
    isSaving: false as boolean,
    saveStatusElement: null as HTMLElement | null,

    setYDoc(doc: Y.Doc): void {
        this.yDoc = doc;
    },
    setUserId(uid: string): void {
        this.userId = uid;
    },
    setDiagramId(diagramId: string): void {
        this.diagramId = diagramId;
    },
    setIsSaving(isSaving: boolean): void {
        this.isSaving = isSaving;
        this.updateSaveIndicator();
    },
    initializeUserUndoManager(): void {
        if (!this.yDoc) return;

        const yNodes = this.yDoc.getMap('nodes');
        const yEdges = this.yDoc.getMap('edges');

        // Track both maps for this user
        const undoManager = new Y.UndoManager([yNodes, yEdges], {
            trackedOrigins: new Set([`user-${this.userId}`])
        });

        this.undoManagers.set(this.userId, undoManager);
    },
    canUndo(): boolean {
        const undoManager = this.undoManagers.get(this.userId);
        return undoManager ? undoManager.undoStack.length > 0 : false;
    },
    canRedo(): boolean {
        const undoManager = this.undoManagers.get(this.userId);
        return undoManager ? undoManager.redoStack.length > 0 : false;
    },
    undo(): void {
        const undoManager = this.undoManagers.get(this.userId);
        if (undoManager) {
            console.log("undo")
            undoManager.undo();
            this.useDebouncedSave();
        }
    },
    redo(): void {
        const undoManager = this.undoManagers.get(this.userId);
        if (undoManager) {
            undoManager.redo();
            this.useDebouncedSave();
        }
    },
    removeUserUndoManager(): void {
        this.undoManagers.delete(this.userId);
    },
    makeChange(changeFunc): void {
        if (!this.yDoc) return;
        this.yDoc.transact(changeFunc, `user-${this.userId}`);
    },

    async useDebouncedSave(): Promise<void> {
        try {
            this.setIsSaving(true);
            const token = sessionStorage.getItem('token');
            if (!token || !this.diagramId || !this.yDoc) return;

            // Get nodes and edges directly from Y.js
            const yNodes = this.yDoc.getMap('nodes');
            const yEdges = this.yDoc.getMap('edges');

            // Convert to regular JavaScript objects
            const nodes = Array.from(yNodes.values());
            const edges = Array.from(yEdges.values());

            await authApi.updateDiagram(this.diagramId, {nodes, edges}, token);
            console.log('Diagram auto-saved');
        } catch (error) {
            console.error('Auto-save failed:', error);
        } finally {
            setTimeout(() => {
                this.setIsSaving(false);
            }, 1000);
        }
    },
    updateSaveIndicator(): void {
        if (!this.saveStatusElement) {
            this.saveStatusElement = document.getElementById('save-status');
        }

        if (this.saveStatusElement) {
            if (this.isSaving) {
                this.saveStatusElement.textContent = 'Saving...';
            } else {
                this.saveStatusElement.textContent = 'All changes saved';
            }
        }
    }
};
// Bind the methods to preserve 'this' context
UndoRedoManager.undo = UndoRedoManager.undo.bind(UndoRedoManager);
UndoRedoManager.redo = UndoRedoManager.redo.bind(UndoRedoManager);
UndoRedoManager.canUndo = UndoRedoManager.canUndo.bind(UndoRedoManager);
UndoRedoManager.canRedo = UndoRedoManager.canRedo.bind(UndoRedoManager);