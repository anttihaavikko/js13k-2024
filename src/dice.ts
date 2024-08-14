import { drawCircle } from './engine/drawing';
import { Entity } from './engine/entity';
import { Game } from './engine/game';
import { Mouse } from './engine/mouse';
import { randomInt } from './engine/random';
import { Vector } from './engine/vector';

export class Dice extends Entity {
    private value: number;
    private rolling: boolean;
    private hovering: boolean;

    constructor(game: Game, x: number, y: number, private damage: boolean = false) {
        super(game, x, y, 100, 100);
        this.randomize();
        this.fixRotation();
    }

    private randomize(): void {
        this.value = this.damage ? randomInt(0, 2) : randomInt(1, 6);
    }

    public getValue(): number {
        return this.value;
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
        this.hovering = this.isInside(mouse, 5);
        if (this.rolling) {
            this.randomize();
            this.rotation += tick * 0.1;
        }
    }

    public hurt(amount: number): boolean {
        this.value = Math.max(0, this.value - amount);
        return this.value <= 0;
    }

    public drawRim(ctx: CanvasRenderingContext2D): void {
        if (!this.hovering) return;
        ctx.save();
        ctx.translate(this.p.x + 50, this.p.y + 50);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = 'orange';
        const borderWidth = 5;
        ctx.strokeRect(-50 - borderWidth, -50 - borderWidth, 100 + borderWidth * 2, 100 + borderWidth * 2);
        ctx.restore();
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.beginPath();
        ctx.translate(this.p.x + 50, this.p.y + 50);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.hovering ? 'yellow' : '#fff';
        ctx.rect(-50, -50, 100, 100);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        if (this.value === 1 || this.value === 3 || this.value === 5) this.drawPip(ctx, { x: 0, y: 0 });
        if (this.value > 1) {
            this.drawPip(ctx, { x: -25, y: -25 });
            this.drawPip(ctx, { x: 25, y: 25 });
        }
        if (this.value >= 4) {
            this.drawPip(ctx, { x: -25, y: 25 });
            this.drawPip(ctx, { x: 25, y: -25 });
        }
        if (this.value === 6) {
            this.drawPip(ctx, { x: 0, y: -25 });
            this.drawPip(ctx, { x: 0, y: 25 });
        }
        ctx.fillStyle = '#fff';
        ctx.restore();
    }

    private drawPip(ctx: CanvasRenderingContext2D, pos: Vector): void {
        drawCircle(ctx, pos, this.damage ? 12 : 8, '#000', 'transparent');
    }
}