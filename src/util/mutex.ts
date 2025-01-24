export class Mutex {
    private locked = false;
    private queue: (((arg?: unknown) => void) | undefined)[] = [];

    public async acquire() {
        if (!this.locked) {
            this.locked = true;
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.queue.push(resolve);
        });
    }

    public release() {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) {
                next();
            } else {
                throw new Error("Mutex release internal error");
            }
        } else {
            this.locked = false;
        }
    }
}
