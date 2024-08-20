import { drawEllipse } from './drawing';
import { Entity } from './entity';
import { Eye } from './eye';
import { Game } from './game';
import { moveTowards } from './math';
import { Mouse } from './mouse';
import { random } from './random';

export interface FaceOptions {
    blush?: string;
    blinkDuration?: number;
    blinkDiff?: number;
    width?: number;
    eyeSize?: number;
    blushSize?: number;
    mouthWidth?: number;
    mouthThickness?: number;
    color?: string;
    blushOffset?: number;
}

const defaultOptions: FaceOptions = {
    blush: 'red',
    eyeSize: 10,
    width: 1,
    blinkDiff: 100,
    blinkDuration: 200,
    blushSize: 1,
    mouthWidth: 1,
    mouthThickness: 7,
    blushOffset: 0,
    color: '#000'
};

export class Face extends Entity {
    public angry: boolean;
    // public thinking: boolean;

    private openess = 0;
    private targetOpeness = 0;
    private closeTimer: NodeJS.Timeout;

    private left: Eye;
    private right: Eye;
    private options: FaceOptions;
    private mirrorer = 1;

    constructor(game: Game, options: FaceOptions) {
        super(game, 0, 0, 0, 0);
        this.options = { ...defaultOptions };
        this.setOptions(options);
        this.blink(this.options.blinkDuration, this.options.blinkDiff);
        this.left = new Eye(game, -50 * this.options.width, 0, this.options.eyeSize);
        this.right = new Eye(game, 50 * this.options.width, 0, this.options.eyeSize);
    }

    public setOptions(options: FaceOptions): void {
        this.options = {
            ...this.options,
            ...options
        };
        this.left?.setColor(options.color);
        this.right?.setColor(options.color);
    }

    private blink(blinkDuration: number, blinkDiff: number): void {
        setTimeout(() => this.left.blink(blinkDuration), random(0, blinkDiff));
        setTimeout(() => this.right.blink(blinkDuration), random(0, blinkDiff));
        setTimeout(() => this.blink(blinkDuration, blinkDiff), random(1000, 4000));
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.openess = moveTowards(this.openess, this.targetOpeness, 0.1);
        this.left.update(tick, mouse);
        this.right.update(tick, mouse);
        if (Math.random() < 0.002) this.mirrorer *= -1;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        drawEllipse(ctx, { x: -65 * this.options.width - this.options.blushOffset, y: 20 }, 15 * this.options.blushSize, 10 * this.options.blushSize, this.options.blush);
        drawEllipse(ctx, { x: 65 * this.options.width + this.options.blushOffset, y: 20 }, 15 * this.options.blushSize, 10 * this.options.blushSize, this.options.blush);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = this.options.mouthThickness;
        ctx.strokeStyle = this.options.color;
        ctx.fillStyle = this.options.color;

        if (this.angry) {
            ctx.beginPath();
            ctx.moveTo(-50 * this.options.width + 10, -5);
            ctx.lineTo(-50 * this.options.width - 20, -20);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(50 * this.options.width - 10, -5);
            ctx.lineTo(50 * this.options.width + 20, -20);
            ctx.stroke();
        }

        // if (this.thinking && !this.angry) {
        //     ctx.beginPath();
        //     ctx.moveTo((-40 * this.options.width + 10) * this.mirrorer, -20);
        //     ctx.lineTo((-40 * this.options.width - 20) * this.mirrorer, -20);
        //     ctx.stroke();
        //     ctx.beginPath();
        //     ctx.moveTo((40 * this.options.width - 10) * this.mirrorer, -40);
        //     ctx.lineTo((40 * this.options.width + 20) * this.mirrorer, -35);
        //     ctx.stroke();
        // }

        // mouth
        ctx.save();
        ctx.scale(this.mirrorer, 1);
        ctx.beginPath();
        const mw = this.options.width * this.options.mouthWidth;
        // const start = this.thinking ? 25 : 20;
        const start = 20;
        ctx.moveTo(-40 * mw, start);
        const curve = this.angry ? -30 : 0;
        ctx.quadraticCurveTo(0, 40 - 60 * mw * this.openess + curve, 40 * mw, 20);
        ctx.quadraticCurveTo(0, 40 + 60 * mw * this.openess + curve, -40 * mw, start);
        ctx.stroke();
        ctx.fill();
        ctx.restore();

        this.left.draw(ctx);
        this.right.draw(ctx);
    }

    public openMouth(amount: number, closeDelay: number): void {
        clearTimeout(this.closeTimer);
        this.targetOpeness = amount;
        this.closeTimer = setTimeout(() => this.closeMouth(), closeDelay * 1000);
    }

    public closeMouth(): void {
        this.targetOpeness = 0;
    }
}