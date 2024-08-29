import { font } from './constants';
import { Game } from './game';
import { Particle } from './particle';
import { Vector } from './vector';

export class TextEntity extends Particle {
    constructor(game: Game, public content: string, protected fontSize: number, x: number, y: number, life: number, velocity: Vector, protected options?: TextOptions) {
        super(game, x, y, 0, 0, life, velocity);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        // TODO: commented for optimization
        // ctx.rotate(this.options?.angle ?? 0);
        const mod = this.options?.scales ? this.ratio : 1;
        ctx.font =`${this.fontSize * mod}px ${font}`;
        // TODO: commented for optimization
        // ctx.textAlign = this.options?.align ?? 'center';

        ctx.fillStyle = '#000';
        ctx.fillText(this.content, this.p.x + this.options.shadow, this.p.y + this.options.shadow);

        ctx.fillStyle = '#fff';
        ctx.fillText(this.content, this.p.x, this.p.y);
        
        ctx.restore();
    }

    // public setColor(color: string): void {
    //     this.options.color = color;
    // }

    public getWidth(ctx: CanvasRenderingContext2D): number {
        const mod = this.options?.scales ? this.ratio : 1;
        ctx.font =`${this.fontSize * mod}px ${font}`;
        return Math.max(...this.content.split('\n').map(t => ctx.measureText(t).width));
    }
}

export interface TextOptions {
    color?: string;
    align?: CanvasTextAlign;
    shadow?: number;
    scales?: boolean;
    angle?: number;
    markColors?: string[];
    outline?: number;
    spacing?: number;
}