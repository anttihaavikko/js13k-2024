import { Entity } from './entity';
import { Game } from './game';
import { clamp01 } from './math';
import { TextEntity } from './text';
import { ZERO } from './vector';

export class Bar extends Entity {
    private text: TextEntity;
    private gap = 7;
    private ratio = 1;

    constructor(game: Game, x: number, y: number, width: number, height: number, private color: string) {
        super(game, x, y, width, height);
        this.text = new TextEntity(game, '', 17, this.p.x + this.s.x * 0.5, this.p.y + this.s.y * 0.5 + 5, -1, ZERO, { shadow: 2, align: 'center' });
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#000';
        ctx.lineWidth = 3;
        ctx.rect(this.p.x, this.p.y, this.s.x, this.s.y);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.p.x + this.gap, this.p.y + this.gap, (this.s.x - this.gap * 2) * this.ratio, this.s.y - this.gap * 2);
        this.text.draw(ctx);
        ctx.restore();
    }

    public change(cur: number, max: number): void {
        this.ratio = clamp01(cur / max);
        this.text.content = `${Math.max(0, cur)}/${max}`;
    }
}