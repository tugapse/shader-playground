 export class EventEmitter {
    private listeners: Map<string, Function[]> = new Map();

    public on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    public emit(event: string, data?: any): void {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.forEach(callback => callback(data));
        }
    }
}
