export function forceQuerySelector<T extends HTMLElement>(selector: string, parent?: HTMLElement): T {
    const elem = parent ? parent.querySelector<T>(selector) : document.querySelector<T>(selector);
    if (elem) {
        return elem;
    }
    throw new Error(`cannot find selector ${selector}`);
}

export function compose<T>(...fns: ((arg: T) => T)[]) : (arg: T) => T {
    return (arg: T) =>
        fns.reduce((val, f) => f(val), arg);
}

export function intersect<T>(a: T[], b: T[]) : T[] {
    const result = [];
    for(const x of a) {
        if(b.includes(x)) {
            result.push(x);
        }
    }
    return result;
}
