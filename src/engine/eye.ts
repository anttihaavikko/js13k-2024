import { drawEllipse } from './drawing';
import { Entity } from './entity';
import { Game } from './game';
import { moveTowards } from './math';
import { Mouse } from './mouse';

export class Eye extends Entity {
    private openess = 1;
    private targetOpeness = 1;
    private timer: NodeJS.Timeout;
    private color = '#000';

    constructor(game: Game, x: number, y: number, size: number) {
        super(game, x, y, size, size);
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.openess = moveTowards(this.openess, this.targetOpeness, 0.075);
    }

    public setColor(color: string): void {
        this.color = color;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        drawEllipse(ctx, this.p, this.s.x, this.s.y * this.openess, this.color);
    }

    public blink(blinkDuration: number): void {
        clearTimeout(this.timer);
        this.targetOpeness = 0;
        this.timer = setTimeout(() => this.open(), blinkDuration);
    }

    private open(): void {
        this.targetOpeness = 1;
    }
}