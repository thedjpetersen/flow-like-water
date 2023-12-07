class EventEmitter {
    // This map holds the events and their listeners
    private events: Map<string, Array<Function>>;

    constructor() {
        this.events = new Map();
    }

    // Method to add an event listener
    on(event: string, listener: Function): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(listener);
    }

    // Method to emit an event
    emit(event: string, ...args: any[]): void {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                listener(...args);
            });
        }
    }
}

export default EventEmitter;
