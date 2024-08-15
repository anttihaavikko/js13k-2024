import { font } from './engine/constants';
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
    private marked: boolean;
    private pickable: boolean;
    private floating: boolean;
    private phase: number;
    private floatOffset: number;
    private spice: boolean;

    constructor(game: Game, x: number, y: number, private damage: boolean = false) {
        super(game, x, y, 100, 100);
        this.randomize();
        this.fixRotation();
        this.floatOffset = Math.random();
    }

    public makeSpice(): void {
        this.spice = true;
    }

    public isSpice(): boolean {
        return this.spice;
    }

    public allowPick(state: boolean = true): void {
        this.pickable = state;
    }

    public mark(state: boolean = true): void {
        this.marked = state;
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
        this.game.getAudio().throw();
        this.tween.move({ x, y }, 0.3 );
        this.rolling = true;
        setTimeout(() => {
            this.game.getAudio().roll();
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
        this.phase = Math.sin(tick * 0.005 + this.floatOffset);
        this.hovering = this.pickable && this.isInside(mouse, 5);
        if (this.rolling) {
            this.randomize();
            this.rotation += tick * 0.1;
        }
    }

    public float(state: boolean): void {
        this.floating = state;
    }

    public isHovering(): boolean {
        return this.hovering;
    }

    public hurt(amount: number): boolean {
        this.marked = false;
        this.value = Math.max(0, this.value - amount);
        return this.value <= 0;
    }

    public drawRim(ctx: CanvasRenderingContext2D): void {
        if (!this.hovering && !this.marked) return;
        ctx.save();
        ctx.translate(this.p.x + 50, this.p.y + 50 + this.getHeight());
        ctx.rotate(this.rotation);
        ctx.strokeStyle = 'orange';
        const borderWidth = 5;
        ctx.strokeRect(-50 - borderWidth, -50 - borderWidth, 100 + borderWidth * 2, 100 + borderWidth * 2);
        ctx.restore();
    }

    public reroll(): void {
        this.roll(this.p.x, this.p.y);
    }

    private getHeight(): number {
        return this.floating ? this.phase * 7 : 0;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.beginPath();
        ctx.translate(this.p.x + 50, this.p.y + 50 + this.getHeight() + (this.rolling ? Math.sin(this.tween.time * Math.PI) * -150 : 0));
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.spice ? 'orange' : '#fff';
        if (this.hovering || this.marked) ctx.fillStyle = 'yellow';
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
        if (this.damage) {
            ctx.fillStyle = '#000';
            ctx.font =`45px ${font}`;
            ctx.fillText('✦', pos.x * 0.8 - 20, pos.y * 0.8 + 15);
            return;
        }
        drawCircle(ctx, pos, this.damage ? 12 : 8, '#000', 'transparent');
    }
}