import { fabrics, woods } from './colors';
import { Dice } from './dice';
import { Dude } from './dude';
import { Camera } from './engine/camera';
import { drawCircle } from './engine/drawing';
import { quadEaseInOut } from './engine/easings';
import { Entity } from './engine/entity';
import { Game } from './engine/game';
import { Mouse } from './engine/mouse';
import { randomCell } from './engine/random';
import { offset, Vector } from './engine/vector';

export class Ship extends Entity {
    private dude: Dude;
    private phase: number;
    private dice: Dice[] = [];
    private mp: Vector;
    private colors: string[];
    
    constructor(game: Game, x: number, private player: boolean) {
        super(game, x, 550, 0, 0);
        this.dude = new Dude(game, 70, -125);
        this.colors = [
            randomCell(woods),
            randomCell(woods),
            randomCell(woods),
            randomCell(fabrics),
            randomCell(fabrics)
        ];
    }

    public addDice(d: Dice): void {
        this.dice.push(d);
        d.p = this.getDicePos(this.dice.length - 1);
        this.repositionDice();
    }

    public getDiceCount(): number {
        return this.dice.length;
    }

    public getDicePos(i: number): Vector {
        return {
            x: -105 * Math.floor(i / 3) - 180 + Math.random() * 20,
            y: (i % 3) * -100 - 240
        };
    }

    public repositionDice(): void {
        this.dice.forEach((d, i) => d.move(this.getDicePos(i)));
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.phase = Math.sin(tick * 0.005);
        this.dude.update(tick, mouse);
        this.dice.forEach(d => d.update(tick, this.offsetMouse(mouse, this.game.getCamera())));
        this.mp = this.offsetMouse(mouse, this.game.getCamera());
    }

    private offsetMouse(mouse: Mouse, cam: Camera): Mouse {
        return {
            ...mouse,
            x: (mouse.x - 400) / cam.zoom,
            y: (mouse.y - 30) / cam.zoom - 600
        };
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.p.x, this.p.y);
        ctx.rotate(this.phase * 0.02);

        if (!this.player) ctx.scale(-1, 1);

        // mast
        ctx.fillStyle = this.colors[0];
        const mastPos = 40;
        ctx.rect(-50 + mastPos, -450, 15, 600);
        ctx.fill();
        ctx.stroke();

        // sail
        ctx.fillStyle = this.colors[3];
        ctx.beginPath();
        ctx.moveTo(-60 + mastPos, -440);
        ctx.lineTo(-60 + mastPos, -200);
        ctx.lineTo(-200 + mastPos - this.phase * 10, -200 - this.phase * 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // draw mouse point
        // if (this.player) ctx.fillRect(this.mp.x, this.mp.y, 20, 20);

        // const cam = this.game.getCamera();
        // const off = cam.pan.x / cam.zoom + (this.player ? 800 : -700);
        // ctx.translate(-this.p.x + off, -this.p.y);
        this.dice.forEach(d => d.draw(ctx));
        if (this.player) this.dice.forEach(d => d.drawRim(ctx));
        // ctx.translate(this.p.x - off, this.p.y);

        ctx.translate(120, 0);
        this.drawCannon(ctx);
        ctx.translate(-120, 0);

        ctx.save();
        ctx.scale(1.2, 1.2);
        this.dude.draw(ctx);
        ctx.restore();

        // hull
        ctx.fillStyle = this.colors[2];
        ctx.beginPath();
        const extension = this.getCargoWidth();
        ctx.moveTo(-200 - extension, -150);
        ctx.lineTo(-170 - extension, 150);
        ctx.lineTo(180, 150);
        ctx.lineTo(250, -160);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    public sail(): void {
        this.dude.hopInPlace();
        this.tween.setEase(quadEaseInOut);
        this.tween.move(offset(this.p, 2000, 0), 6);
    }

    public getCargoWidth(): number {
        return Math.floor(Math.max(0, this.dice.length - 1) / 3) * 100;
    }

    private drawCannon(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#666';
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

        ctx.fillStyle = this.colors[1];
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