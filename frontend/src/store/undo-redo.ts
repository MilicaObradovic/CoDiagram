export const UndoRedo = {
    debugMode: 0,
    maxHistory: 50,
    history: [] as any[],
    position: 0,

    reset(item: any): void {
        this.history = [structuredClone(item)];
        this.position = 0;
    },

    canUndo(): boolean {
        return this.position > 0;
    },

    canRedo(): boolean{
        return this.position < this.history.length-1;
    },

    undo(): any | undefined {
        if (this.canUndo()) {
            this.position--;
            this.debug('undo');
            return this.history[this.position];
        }
    },

    redo(): any | undefined {
        if (this.canRedo()) {
            this.position++;
            this.debug('redo');
            return this.history[this.position];
        }
    },

    addHistory(item: any): void {
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
        const ret = ['undo','redo'].indexOf(cmd) !== -1 ?
            '=> ' + this.history[this.position] : '';
        const canUndo = this.canUndo();
        const canRedo = this.canRedo();
        console.log(
            cmd, {history, position, canUndo, canRedo}, ret
        );
    }
};