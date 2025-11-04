import type {HistoryState} from '../types/store.ts'
import * as Y from 'yjs';

export const UndoRedo = {
    debugMode: 0,
    maxHistory: 50,
    history: [] as HistoryState[],
    position: 0,
    yDoc: null as Y.Doc | null,

    setYDoc(doc: Y.Doc|null): void {
        this.yDoc = doc;
    },

    reset(item: HistoryState): void {
        this.history = [structuredClone(item)];
        this.position = 0;
    },

    canUndo(): boolean {
        return this.position > 0 && this.history[this.position - 1].type != "loaded";
    },

    canRedo(): boolean {
        return this.position < this.history.length - 1;
    },

    undo(): HistoryState | undefined {
        if (this.canUndo()) {
            this.position--;
            this.debug('undo');
            const state = this.history[this.position]
            if (this.yDoc && state) {
                this.applyStateToYjs(state);
            }
            return state;
        }
    },

    redo(): HistoryState | undefined {
        if (this.canRedo()) {
            this.position++;
            this.debug('redo');
            const state = this.history[this.position];

            // if Y.js, change state with Y.js
            if (this.yDoc && state) {
                this.applyStateToYjs(state);
            }

            return state;
        }
    },
    applyStateToYjs(state: HistoryState): void {
        if (!this.yDoc) return;

        this.yDoc.transact(() => {
            const yNodes = this.yDoc!.getMap('nodes');
            const yEdges = this.yDoc!.getMap('edges');

            // delete current state
            yNodes.clear();
            yEdges.clear();

            // apply new state
            state.nodes.forEach(node => yNodes.set(node.id, node));
            state.edges.forEach(edge => yEdges.set(edge.id, edge));
        }, 'undo-redo');

        console.log('Applied undo/redo state to Y.js');
    },


    addHistory(item: HistoryState): void {
        this.history =
            this.history.slice(0, this.position + 1)
                .concat(structuredClone(item))
                .slice(-this.maxHistory);
        this.position = this.history.length - 1;
        this.debug('addHistory');
    },

    debug(cmd: string): void {
        if (!this.debugMode) return;
        const {history, position} = this;
        const ret = ['undo', 'redo'].indexOf(cmd) !== -1 ?
            '=> ' + this.history[this.position] : '';
        const canUndo = this.canUndo();
        const canRedo = this.canRedo();
        console.log(
            cmd, {history, position, canUndo, canRedo}, ret
        );
    }
};