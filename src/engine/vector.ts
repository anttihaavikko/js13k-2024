export interface Vector {
    x: number;
    y: number;
}

export const ZERO = { x: 0, y: 0 };

export const normalize = (v: Vector, multi = 1): Vector => {
    const m = magnitude(v);
    if (m == 0) return ZERO;
    return { x: v.x / m * multi, y: v.y / m * multi };
};

export const distance = (a: Vector, b: Vector): number => {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.sqrt(dx * dx + dy * dy);
};

export const dot = (a: Vector, b: Vector): number => {
    // const al = magnitude(a);
    // const bl = magnitude(b);
    return a.x * b.x + a.y * b.y;
};

export const magnitude = (v: Vector): number => {
    return Math.sqrt(v.x * v.x + v.y * v.y);
};

export const lerp = (a: Vector, b: Vector, t: number, ease: (v: number) => number = v => v): Vector => {
    return {
        x: a.x + ease(t) * (b.x - a.x),
        y: a.y + ease(t) * (b.y - a.y)
    };
};

export const offset = (v: Vector, x: number, y: number): Vector => {
    return {
        x: v.x + x,
        y: v.y + y
    };
};