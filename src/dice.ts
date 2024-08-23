import { font } from './engine/constants';
import { drawCircle } from './engine/drawing';
import { Game } from './engine/game';
import { Mouse } from './engine/mouse';
import { randomInt } from './engine/random';
import { Vector } from './engine/vector';
import { Flashable } from './flashable';

export class Dice extends Flashable {
    private value: number;
    private rolling: boolean;
    private hovering: boolean;
    private marked: boolean;
    private pickable: boolean;
    private floating: boolean;
    private spice: boolean;
    private plated: boolean;

    constructor(game: Game, x: number, y: number, private damage: boolean = false) {
        super(game, x, y, 100, 100);
        this.randomize();
        this.fixRotation();
        this.animationSpeed = 0.005;
    }

    public makeSpice(state: boolean = true): void {
        this.spice = state;
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
        this.game.audio.throw();
        this.tween.move({ x, y }, 0.3 );
        this.rolling = true;
        setTimeout(() => {
            this.game.audio.roll();
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
        return this.hovering || this.marked;
    }

    public plate(): void {
        this.plated = true;
        this.flash(0.2, '#afe6ac');
    }

    public canPlate(): boolean {
        return !this.plated && !this.spice;
    }

    public hurt(amount: number): boolean {
        this.marked = false;
        this.value = Math.max(0, this.value - Math.min(amount, (this.plated ? 1 : amount)));
        return this.value <= 0;
    }

    public fix(): void {
        this.flash(0.2, '#afe6ac');
        this.value = Math.min(this.value + 1, 9);
    }

    private drawRim(ctx: CanvasRenderingContext2D): void {
        if (!this.hovering && !this.marked) return;
        ctx.strokeStyle = '#e92';
        const borderWidth = 5;
        ctx.strokeRect(-50 - borderWidth, -50 - borderWidth, 100 + borderWidth * 2, 100 + borderWidth * 2);
    }

    public reroll(): void {
        this.roll(this.p.x, this.p.y);
    }

    private getHeight(): number {
        return this.floating ? this.animationPhase * 7 : 0;
    }

    public getOrder(): number {
        return (this.p.x - this.p.y) * (this.hovering ? 1 : 10);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = this.flashing ? '#68ad65' : '#000';
        ctx.save();
        ctx.beginPath();
        ctx.translate(this.p.x + 50, this.p.y + 50 + this.getHeight() + (this.rolling ? Math.sin(this.tween.time * Math.PI) * -150 : 0));
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.spice ? '#e92' : '#fff';
        if (this.plated) ctx.fillStyle = '#a9c5db';
        if (this.hovering || this.marked) ctx.fillStyle = '#f2e949';
        if (this.flashing) ctx.fillStyle = this.getColor('#fff');
        ctx.rect(-50, -50, 100, 100);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        if (this.value === 1 || this.value === 3 || this.value === 5 || this.value === 7 || this.value === 9) this.drawPip(ctx, 0, 0);
        if (this.value > 1) {
            this.drawPip(ctx, -25, -25);
            this.drawPip(ctx, 25, 25);
        }
        if (this.value > 3) {
            this.drawPip(ctx, -25, 25);
            this.drawPip(ctx, 25, -25);
        }
        if (this.value > 5) {
            this.drawPip(ctx, 0, -25);
            this.drawPip(ctx, 0, 25);
        }
        if (this.value > 7) {
            this.drawPip(ctx, 25, 0);
            this.drawPip(ctx, -25, 0);
        }
        this.drawRim(ctx);
        ctx.restore();
    }

    private drawPip(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        ctx.fillStyle = this.flashing ? '#68ad65' : '#000';
        if (this.damage) {
            ctx.font =`45px ${font}`;
            ctx.fillText('✦', x * 0.8 - 20, y * 0.8 + 15);
            return;
        }
        drawCircle(ctx, { x, y }, this.damage ? 12 : 8, ctx.fillStyle, 'transparent');
    }
}