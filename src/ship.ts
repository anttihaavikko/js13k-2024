import { Dice } from './dice';
import { Dude } from './dude';
import { drawCircle } from './engine/drawing';
import { Entity } from './engine/entity';
import { Game } from './engine/game';
import { Mouse } from './engine/mouse';
import { Vector } from './engine/vector';

export class Ship extends Entity {
    private dude: Dude;
    private phase: number;
    private dice: Dice[] = [];
    
    constructor(game: Game, x: number, private flip: boolean) {
        super(game, x, 550, 0, 0);
        this.dude = new Dude(game, 70, -125);
    }

    public addDice(d: Dice): void {
        this.dice.push(d);
        this.repositionDice();
    }

    public getDiceCount(): number {
        return this.dice.length;
    }

    public getDicePos(i: number): Vector {
        return {
            x: -105 * Math.floor(i / 3) - 180 + Math.random() * 20 + this.p.x,
            y: (i % 3) * -100 - 240 + this.p.y
        };
    }

    public repositionDice(): void {
        this.dice.forEach((d, i) => d.move(this.getDicePos(i)));
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.phase = Math.sin(tick * 0.005);
        this.dude.update(tick, mouse);
        this.dice.forEach(d => d.update(tick, mouse));
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.p.x, this.p.y);
        ctx.rotate(this.phase * 0.02);

        if (this.flip) ctx.scale(-1, 1);

        // mast
        const mastPos = 40;
        ctx.rect(-50 + mastPos, -450, 15, 600);
        ctx.fill();
        ctx.stroke();

        // sail
        ctx.beginPath();
        ctx.moveTo(-60 + mastPos, -440);
        ctx.lineTo(-60 + mastPos, -200);
        ctx.lineTo(-200 + mastPos, -200);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.translate(-this.p.x, -this.p.y);
        this.dice.forEach(d => d.draw(ctx));
        ctx.translate(this.p.x, this.p.y);

        ctx.translate(120, 0);
        this.drawCannon(ctx);
        ctx.translate(-120, 0);

        ctx.save();
        ctx.scale(1.2, 1.2);
        this.dude.draw(ctx);
        ctx.restore();

        ctx.fillStyle = '#fff';

        // hull
        ctx.beginPath();
        const extension = Math.floor((this.dice.length - 1) / 3) * 100;
        ctx.moveTo(-200 - extension, -150);
        ctx.lineTo(-170 - extension, 150);
        ctx.lineTo(180, 150);
        ctx.lineTo(250, -160);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    private drawCannon(ctx: CanvasRenderingContext2D): void {
        // cannon
        ctx.translate(190, 0);
        ctx.beginPath();
        const height = 25;
        ctx.moveTo(0, -200 - height);
        ctx.bezierCurveTo(-300, -200 - height * 2, -300, -200 + height * 2, 0, -200 + height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.translate(-190, 0);

        // cannon base
        ctx.beginPath();
        ctx.moveTo(0, -150);
        ctx.bezierCurveTo(0, -230, 70, -230, 70, -150);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        drawCircle(ctx, { x: 35, y: -190 }, 8, '#000');
    }
}