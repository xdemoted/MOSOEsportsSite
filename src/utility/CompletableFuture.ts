export class CompleteableFuture<T> {
    private listeners: ((value: T) => void)[] = [];
    private value?: T;

    public onComplete(listener: (value: T) => void): void {
        if (this.value !== undefined) {
            listener(this.value);
            return;
        }

        this.listeners.push(listener);
    }

    public async complete(value: T): Promise<void> {
        for (const listener of this.listeners) {
            listener(value);
        }
        this.value = value;
    }
}