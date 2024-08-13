import { AudioManager } from './engine/audio';
import { Camera } from './engine/camera';
import { drawCircle, drawEllipse } from './engine/drawing';
import { Entity } from './engine/entity';
import { Face } from './engine/face';
import { Game } from './engine/game';
import { clamp01 } from './engine/math';
import { Mouse } from './engine/mouse';
import { Vector } from './engine/vector';

export class Dude extends Entity {
    private phase = 0;
    private height = 0;
    private dip = 0;
    private air = 0;
    private ducking = 0;
    private hopDir: number;
    private wave = 0;
    private kick: boolean;

    private face: Face;
    private flag: string;

    constructor(game: Game, x: number, y: number) {
        super(game, x, y, 0, 0);
        this.face = new Face(this.game, {
            blush: 'red',
            eyeSize: 10,
            width: 0.75,
            mouthWidth: 0.7,
            blushSize: 0.8,
            mouthThickness: 12
        });
    }

    public getCamera(): Camera {
        return this.game.getCamera();
    }

    public getAudio(): AudioManager {
        return this.game.getAudio();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(tick: number, mouse: Mouse): void {
        this.phase = Math.abs(Math.sin(tick * 0.005));
        this.face.update(tick, mouse);
        if (this.height > 0) this.height = clamp01(this.height - 0.0025 * this.delta);
        this.air = Math.sin((1 - this.height) * Math.PI);
        if (this.dip > 0) this.dip = clamp01(this.dip - 0.0015 * this.delta);
        this.ducking = Math.sin((1 - this.dip) * Math.PI);
        this.wave = Math.sin(tick * 0.005);
        super.update(tick, mouse);
    }

    public makeAngry(state: boolean): void {
        this.face.angry = state;
    }

    public think(state: boolean): void {
        // if (state && !this.face.thinking) this.getAudio().think();
        this.face.thinking = state;
    }

    public duck(): void {
        this.dip = 0.7;
    }

    public hop(to: Vector): void {
        this.kick = Math.random() < 0.8;
        this.hopDir = -Math.sign(to.x - this.p.x);
        this.height = 1;
        this.tween.move(to, 0.3);
        // this.game.getAudio().jump();
        setTimeout(() => {
            // this.game.getAudio().squish();
            // this.game.getScene().add(...bits(this.game, offset(this.getCenter(), 0, 10), COLORS.border));
        }, 300);
        setTimeout(() => this.hopDir = 0, 300);
    }

    public hopInPlace(): void {
        this.hop(this.p);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.lineCap = 'round';
        ctx.save();
        drawEllipse(ctx, this.p, 35 + 4 * this.phase - this.air * 5, 10 + 2 * this.phase - this.air * 5, '#00000033');
        ctx.translate(0,  -this.air * 50 + this.ducking * 7);
        this.drawLeg(ctx, 1);
        this.drawLeg(ctx, -1);
        
        ctx.translate(this.p.x, this.p.y);
        ctx.rotate(this.wave * 0.05 + this.hopDir * -0.05);
        ctx.translate(-this.p.x, -this.p.y);

        ctx.translate(0,  -this.phase * 10 + this.ducking * 3);

        ctx.beginPath();
        ctx.moveTo(this.p.x, this.p.y - 30);
        ctx.lineTo(this.p.x, this.p.y - 60);
        ctx.lineWidth = 50;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.lineWidth = 35;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        this.drawArm(ctx, 1);
        this.drawArm(ctx, -1);

        ctx.translate(this.p.x, this.p.y - 50 - this.phase * 5);

        ctx.scale(0.25, 0.25);
        this.face.draw(ctx);

        ctx.scale(5, 5);
        ctx.translate(0, -18 + this.phase * 7 - clamp01(this.air - 0.5) * 20);
        ctx.rotate(clamp01(this.air - 0.75) * 0.5 * this.hopDir);
        this.drawHat(ctx);

        ctx.translate(0, -30);

        ctx.rotate(this.wave * -0.05);

        ctx.restore();
    }

    public setFlagColor(color: string): void {
        this.flag = color;
    }

    private drawHat(ctx: CanvasRenderingContext2D): void {
        const drawHat = (height: number, slant: number, rimWidth: number, rimHeight: number, rimSlant: number, bandHeight: number, curve: number) => {
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.translate(0, 5 - this.phase * 2.5);
            ctx.moveTo(-rimWidth - rimSlant, -10);
            ctx.lineTo(rimWidth + rimSlant, -10);
            ctx.lineTo(rimWidth, -10 - rimHeight);
            ctx.lineTo(10, -10 - rimHeight);
            ctx.lineTo(10 - slant, -10 - rimHeight - height);
            const top = -10 - rimHeight - height - curve;
            if (curve > 0) {
                ctx.bezierCurveTo(rimWidth * 0.5, top, -rimWidth * 0.5, top, -10 + slant, -10 - rimHeight - height);
            } else {
                ctx.lineTo(-10 + slant, -10 - rimHeight - height);
            }
            ctx.lineTo(-10, -10 - rimHeight);
            ctx.lineTo(-rimWidth, -10 - rimHeight);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            if (bandHeight > 0) {
                ctx.lineWidth = 5;
                ctx.fillStyle = 'red';
                ctx.beginPath();
                const pos = -12.75;
                ctx.moveTo(10, pos - rimHeight);
                ctx.lineTo(-10, pos - rimHeight);
                ctx.lineTo(-10 + slant * (bandHeight / height), pos - rimHeight - bandHeight);
                // const ax = 0;
                // const ay = 0;
                // ctx.bezierCurveTo(0, -10 - height, 0, -10 - height, 10 - slant * (bandHeight / height), -10 - rimHeight - bandHeight);
                ctx.lineTo(10 - slant * (bandHeight / height), pos - rimHeight - bandHeight);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }

            // ctx.resetTransform();
        };

        drawHat(15, 0, 15, 5, 0, 5, 10);
    }

    private drawLeg(ctx: CanvasRenderingContext2D, dir: number): void {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.lineJoin = 'round';
        ctx.moveTo(this.p.x, this.p.y - 30 - this.phase * 10);
        const diff = clamp01(this.air - 0.5) * 20;
        const loff = this.kick && dir > 0 && this.hopDir < 0 ? -10 * this.hopDir : 0;
        const roff = this.kick && dir < 0 && this.hopDir > 0 ? 10 * this.hopDir : 0;
        ctx.quadraticCurveTo(
            this.p.x + dir * 30 * (1 + this.phase * 0.2) - diff * 0.2 * dir + loff - roff,
            this.p.y - 15 - this.phase * 5 + diff - diff * 0.2 * dir - loff - roff,
            this.p.x + dir * 22 - diff * dir + loff - roff,
            this.p.y + diff - loff - roff
        );
        ctx.lineTo(this.p.x - this.air * dir * 5 + dir * 30 - diff * dir + loff - roff, this.p.y + this.air * 18 - loff - roff);
        ctx.stroke();
    }

    private curveTo(ctx: CanvasRenderingContext2D, ax: number, ay: number, x: number, y: number): void {
        ctx.quadraticCurveTo(ax, ay, x, y);
        ctx.stroke();
        drawCircle(ctx, { x, y }, 2.5, '#000', 'trasparent');
    }

    private drawArm(ctx: CanvasRenderingContext2D, dir: number): void {
        ctx.save();
        ctx.translate(this.p.x + dir * 22, this.p.y - 15 + this.phase * 10);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.beginPath();
        const diff = this.phase * -15;
        const rise = this.air * -10;
        ctx.moveTo(0, diff - 15);
        const normal = () => this.curveTo(ctx, dir * 20 - this.wave * 5 + rise, -20 + diff * 1.2, dir * 15 + this.wave * 5, 0 + diff + rise);
        if (dir < 0) {
            if (this.face.thinking) {
                this.curveTo(ctx, dir * 20 - this.wave * 5, 5 + diff * 1.2, -15 * dir, -15 + diff); 
            } else {
                normal();
            }
        } else {
            if (this.flag) {
                this.curveTo(ctx, dir * 20 - this.wave * 10 + this.phase * 3, 5 + diff * 1.2, 20 * dir, -25 + diff); 
            } else {
                normal();
            }
        }
        ctx.stroke();
        ctx.restore();
    }
}