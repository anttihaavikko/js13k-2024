import { drawCircle } from './engine/drawing';
import { Entity } from './engine/entity';
import { Game } from './engine/game';
import { Mouse } from './engine/mouse';
import { randomInt } from './engine/random';
import { Vector } from './engine/vector';

export class Dice extends Entity {
    private value: number;
    private rolling: boolean;

    constructor(game: Game, x: number, y: number) {
        super(game, x, y, 100, 100);
        this.value = randomInt(1, 6);
        this.fixRotation();
    }

    private fixRotation(): void {
        this.rotation = Math.random() < 0.5 ? 0 : Math.PI * 0.5;
    }

    public roll(x: number, y: number): void {
        this.tween.move({ x, y }, 0.3 );
        this.rolling = true;
        setTimeout(() => {
            this.rolling = false;
            this.fixRotation();
        }, 300);
    }

    public move(pos: Vector, after?: () => void): void {
        this.tween.move(pos, 0.3 );
        if (after) setTimeout(after, 300);
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        if (this.rolling) {
            this.value = randomInt(1, 6);
            this.rotation += tick * 0.1;
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.p.x + 50, this.p.y + 50);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.rect(-50, -50, 100, 100);
        ctx.fill();
        ctx.stroke();
        if (this.value === 1 || this.value === 3 || this.value === 5) drawCircle(ctx, { x: 0, y: 0 }, 8, '#000');
        if (this.value !== 1) drawCircle(ctx, { x: -25, y: -25 }, 8, '#000');
        if (this.value !== 1) drawCircle(ctx, { x: 25, y: 25 }, 8, '#000');
        if (this.value >= 4) {
            drawCircle(ctx, { x: -25, y: 25 }, 8, '#000');
            drawCircle(ctx, { x: 25, y: -25 }, 8, '#000');
        }
        if (this.value === 6) {
            drawCircle(ctx, { x: 0, y: -25 }, 8, '#000');
            drawCircle(ctx, { x: 0, y: 25 }, 8, '#000');
        }
        ctx.fillStyle = '#fff';
        ctx.restore();
    }
}