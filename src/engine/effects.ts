import { Game } from './game';
import { LineParticle } from './line';
import { RectParticle } from './rect';
import { Vector, offset } from './vector';

export interface EffectOptions {
    color?: string;
    size?: number;
    angle?: number;
}

export const splash = (game: Game, p: Vector): RectParticle[] =>  {
    const offset = Math.random() * Math.PI;
    return Array.from(Array(10)).map((_, i) => {
        const angle = i / 10 * Math.PI * 2 + offset;
        const speed = 2 + Math.random() * 0.5;
        return new RectParticle(game, p.x, p.y, 10, 10, 0.3, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }, { force: { x: 0, y: -10 }, color: '#fff' });
    });
};

export const bits = (game: Game, p: Vector, color: string): RectParticle[] =>  {
    return Array.from(Array(10)).map(() => {
        const angle = (-1 + Math.random()) * Math.PI;
        const speed = Math.random() * 0.5 + 1;
        const size = Math.random() * 10;
        return new RectParticle(game, p.x, p.y, size, size, 0.3, { x: Math.cos(angle) * speed * 3, y: (Math.sin(angle) - 1) * speed }, { force: { x: 0, y: 20000 }, color });
    });
};

export const beams = (game: Game, p: Vector, length: number, amount: number, startAngle: number, angleStep: number): LineParticle[] =>  {
    return Array.from(Array(amount)).map((_, i) => {
        const angle = startAngle + angleStep * i;
        return new LineParticle(game, p, offset(p, Math.cos(angle) * length * Math.random(), Math.sin(angle) * length * Math.random()), 0.5, 5 + 30 * Math.random(), '#fff');
    });
};