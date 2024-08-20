import { WIDTH } from '../index';
import { Entity } from './entity';
import { Game } from './game';
import { Mouse } from './mouse';
import { MultilineTextEntity } from './multiline-text';
import { ZERO } from './vector';

export type BubbleDirection = 'auto' | 'center' | 'left' | 'right';

export interface BubbleOptions {
    bgColor?: string;
    color?: string;
    direction?: BubbleDirection;
    centerThreshold?: number;
    lineWidth?: number;
    sound?: () => void;
}

export class Bubble extends Entity {
    private text: MultilineTextEntity;
    private options: BubbleOptions;
    private messagePos: number;
    private message: string;

    public onWord: () => void;
    
    constructor(
        game: Game,
        content: string,
        x: number,
        y: number, 
        options: BubbleOptions = {}
    ) {
        super(game, x, y, 0, 0);
        this.d = -50;
        this.options = {
            color: '#000',
            bgColor: '#fff',
            lineWidth: 4,
            centerThreshold: 100,
            sound: () => {},
            ...options
        };
        this.text = new MultilineTextEntity(game, content, 15, 0, 0, -1, ZERO, { color: this.options.color, align: 'left' });
        this.text.content = '';
        this.messagePos = 0;
        this.message = content;
        this.animationSpeed = 0.004;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        if (this.messagePos < this.message.length && Math.random() < 0.025 * this.delta) {
            this.messagePos++;
            this.text.content = this.message.substring(0, this.messagePos);
            const cur = this.message.substring(this.messagePos, this.messagePos + 1);
            if ([' ', '!', '.', '?', '<'].includes(cur) || this.messagePos == 1) {
                this.options.sound();
                if (this.onWord) this.onWord();
            }
        }
    }

    public changeDirection(direction: BubbleDirection): void {
        this.options.direction = direction;
    }

    private getOffset(direction: BubbleDirection, width: number): number {
        switch (direction) {
            case 'left':
                return width - 20;
            case 'right':
                return 0;
            case 'center':
                return width * 0.5 - 10;
            default:
                return this.getAutoOffset(width);
        }
    }

    private getAutoOffset(width: number): number {
        if (this.p.x < WIDTH * 0.5 - this.options.centerThreshold) return this.getOffset('right', width);
        if (this.p.x > WIDTH * 0.5 + this.options.centerThreshold) return this.getOffset('left', width);
        return this.getOffset('center', width);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (!this.text.content) return;
        const height = this.text.getHeight() + 20;
        const width = Math.max(this.text.getWidth(ctx), 20);
        const offset = this.getOffset(this.options.direction, width);
        ctx.fillStyle = this.options.bgColor;
        ctx.strokeStyle = this.options.color;
        ctx.lineWidth = this.options.lineWidth;
        ctx.beginPath();
        const phase = this.animationPhaseAbs * 6;
        ctx.moveTo(this.p.x, this.p.y - phase);
        ctx.lineTo(this.p.x - 10, this.p.y - 10 - phase);
        ctx.lineTo(this.p.x - 20 - offset, this.p.y - 10 - phase);
        ctx.lineTo(this.p.x - 20 - offset, this.p.y - 10 - height - phase);
        ctx.lineTo(this.p.x + 0 + width - offset, this.p.y - 10 - height - phase);
        ctx.lineTo(this.p.x + 0 + width - offset, this.p.y - 10 - phase);
        ctx.lineTo(this.p.x + 10, this.p.y - 10 - phase);
        ctx.closePath();
        ctx.fill();
        if (this.options.lineWidth > 0) ctx.stroke();
        ctx.translate(this.p.x - 10 - offset, this.p.y - 25 - phase);
        this.text.draw(ctx);
        ctx.resetTransform();
    }

    public setText(content: string): void {
        this.messagePos = 0;
        this.message = content;
        this.text.content = '';
    }

    public continueText(more: string): void {
        this.message += more;
    }

    public setSound(sound: () => void): void {
        this.options.sound = sound;
    }
}