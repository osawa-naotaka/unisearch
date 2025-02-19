export function forceQuerySelector<T extends HTMLElement>(selector: string, parent?: HTMLElement): T {
    const elem = parent ? parent.querySelector<T>(selector) : document.querySelector<T>(selector);
    if (elem) {
        return elem;
    }
    throw new Error(`cannot find selector ${selector}`);
}

type Attr = {
    className?: string[] | string;
};

type AAttr = Attr & {
    href: string;
};

function setClass(e: HTMLElement, { className }: Attr) {
    if (className) {
        e.setAttribute("class", typeof className === "string" ? className : className.join(" "));
    }
}

function createWithClass<T extends HTMLElement = HTMLElement>(e: string, attr: Attr, children?: Node[]): T {
    const elem = document.createElement(e);
    setClass(elem, attr);
    if (children) {
        for (const c of children) {
            elem.appendChild(c);
        }
    }
    return elem as T;
}

function sanitizeInternalUrl(url: string) {
    return url.startsWith("/") ? url : "/";
}

export function text(str: string): Node {
    return document.createTextNode(str);
}

export function div(attr: Attr, ...elem: Node[]): HTMLDivElement {
    return createWithClass<HTMLDivElement>("div", attr, elem);
}

export function a(attr: AAttr, ...elem: Node[]): HTMLAnchorElement {
    const a = createWithClass<HTMLAnchorElement>("a", attr, elem);
    a.setAttribute("href", sanitizeInternalUrl(attr.href));
    return a;
}

export function li(attr: Attr, ...elem: Node[]): HTMLLIElement {
    const li = createWithClass<HTMLLIElement>("li", attr, elem);
    return li;
}

export function time(attr: Attr, date: Date | string): HTMLTimeElement {
    const date_object = typeof date === "string" ? new Date(date) : date;
    const isodate = date_object.toISOString();
    const localdate = date_object.toLocaleDateString("ja-jp", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const t = createWithClass<HTMLTimeElement>("time", attr);
    t.setAttribute("datetime", isodate);
    t.appendChild(text(localdate));

    return t;
}
