import { skins } from './colors';
import { AudioManager } from './engine/audio';
import { Camera } from './engine/camera';
import { drawCircle } from './engine/drawing';
import { Entity } from './engine/entity';
import { Face } from './engine/face';
import { Game } from './engine/game';
import { clamp01 } from './engine/math';
import { Mouse } from './engine/mouse';
import { randomCell } from './engine/random';
import { Vector } from './engine/vector';

export type CrewRole = 'quartermaster' | 'cannoneer' | 'navigator'

export class Dude extends Entity {
    private phase = 0;
    private height = 0;
    private dip = 0;
    private air = 0;
    private ducking = 0;
    private hopDir: number;
    private wave = 0;
    private posing: boolean;
    private face: Face;
    private skin: string;
    private animOffset: number;
    private animSpeed: number;
    private crewRole: CrewRole;
    private flipHat: number;
    private crown: boolean;

    constructor(game: Game, x: number, y: number, private mainColor: string, private secondaryColor: string, private cane: string) {
        super(game, x, y, 0, 0);
        this.face = new Face(this.game, {
            blush: '#ed4ea3aa',
            eyeSize: 10,
            width: 0.7,
            mouthWidth: 0.5,
            blushSize: 1,
            mouthThickness: 12
        });
        this.skin = randomCell(skins);
        this.animOffset = Math.random() * 9999;
        this.animSpeed = 0.8 + Math.random() * 0.4;
        this.flipHat = Math.random() < 0.5 ? 1 : -1;
    }

    public addCrown(): void {
        this.crown = true;
    }

    public getRole(): CrewRole {
        return this.crewRole;
    }

    public getRoleDescription(): string {
        switch (this.crewRole) {
            case 'cannoneer':
                return 'He will allow you to shoot twice every turn...';
            case 'quartermaster':
                return 'He will repair random cargo when you roll a blank...';
            case 'navigator':
                return 'He will allow you to reroll an extra time...';
            default:
                return '';
        }
    }

    public is(role: CrewRole): boolean {
        return this.crewRole === role;
    }

    public setRolePosition(): void {
        switch (this.crewRole) {
            case 'cannoneer':
                this.p = { x: 170, y: -170 };
                break;
            case 'quartermaster':
                this.p = { x: -80, y: -100 };
                break;
            case 'navigator':
                this.p = { x: 0, y: -400 };
                break;
            default:
                break;
        }
    }

    public clone(): Dude {
        const copy = new Dude(this.game, 0, 0, this.mainColor, this.secondaryColor, null);
        copy.crewRole = this.crewRole;
        copy.skin = this.skin;
        copy.face.angry = this.face.angry;
        copy.setRolePosition();
        return copy;
    }

    public setRole(role: CrewRole): void {
        this.crewRole = role;
    } 

    public getCamera(): Camera {
        return this.game.getCamera();
    }

    public getAudio(): AudioManager {
        return this.game.getAudio();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(tick: number, mouse: Mouse): void {
        this.phase = Math.abs(Math.sin(tick * 0.005 * this.animSpeed + this.animOffset));
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

    // public think(state: boolean): void {
    //     // if (state && !this.face.thinking) this.getAudio().think();
    //     this.face.thinking = state;
    // }

    public duck(): void {
        this.dip = 0.7;
    }

    public hop(to: Vector): void {
        this.hopDir = -Math.sign(to.x - this.p.x);
        this.height = 1;
        this.tween.move(to, 0.3);
        this.game.getAudio().jump();
        setTimeout(() => {
            this.game.getAudio().land();
            // this.game.getScene().add(...bits(this.game, offset(this.getCenter(), 0, 10), COLORS.border));
        }, 370);
        setTimeout(() => this.hopDir = 0, 300);
    }

    public hopInPlace(): void {
        this.hop(this.p);
    }

    public pose(state: boolean): void {
        if (state) this.hopInPlace();
        this.posing = state;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.lineCap = 'round';
        ctx.save();
        ctx.translate(this.p.x, this.p.y);
        if (!this.cane) ctx.scale(0.9, 0.9);
        if (this.crown && this.face.angry) ctx.scale(1.3, 1.3);
        ctx.translate(-this.p.x, -this.p.y);
        
        ctx.translate(0,  -this.air * 50 + this.ducking * 7 - (this.posing ? 10 : 0));


        this.drawLeg(ctx, 1, this.posing ? -45 : 0);
        this.drawLeg(ctx, -1, 0);
        
        ctx.translate(this.p.x, this.p.y);
        ctx.rotate(this.wave * 0.05 - (this.posing ? 0.3 : 0));
        ctx.translate(-this.p.x, -this.p.y);

        ctx.translate(0,  -this.phase * 10 + this.ducking * 3);

        ctx.beginPath();
        ctx.moveTo(this.p.x, this.p.y - 40);
        ctx.lineTo(this.p.x, this.p.y - 90);
        ctx.lineWidth = 50;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.lineWidth = 35;
        ctx.strokeStyle = this.skin;
        ctx.stroke();

        ctx.translate(0, -20);

        this.drawArm(ctx, 1, this.posing ? -30 : 10 + this.phase * 10);
        this.drawArm(ctx, -1, 0);

        ctx.translate(this.p.x, this.p.y - 50 - this.phase * 5);

        ctx.scale(0.3, 0.3);
        this.face.draw(ctx);

        ctx.scale(4.5, 4.5);
        ctx.translate(0, -18 + this.phase * 7 - clamp01(this.air - 0.5) * 20);
        ctx.rotate(clamp01(this.air - 0.75) * 0.5 * this.hopDir);
        this.drawHat(ctx);

        ctx.translate(0, -30);

        ctx.rotate(this.wave * -0.05);

        ctx.restore();
    }

    private drawHat(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.mainColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.translate(0, 20 - this.phase * 5);
        ctx.scale(1.5 * this.flipHat, 1.5);

        if (this.crown) {
            ctx.scale(0.75, 0.75);
            ctx.translate(0, -12);
            ctx.fillStyle = 'yellow';
            ctx.moveTo(-12, -10);
            ctx.lineTo(12, -10);
            ctx.lineTo(12, -25);
            ctx.lineTo(5, -19);
            ctx.lineTo(0, -27);
            ctx.lineTo(-5, -19);
            ctx.lineTo(-12, -25);
            // ctx.moveTo(-6, -15);
            // ctx.lineTo(6, -15);
            // ctx.lineTo(6, -20);
            // ctx.lineTo(3, -18);
            // ctx.lineTo(0, -23);
            // ctx.lineTo(-3, -18);
            // ctx.lineTo(-6, -20);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            return;
        }
        
        ctx.moveTo(8, -15);
        ctx.bezierCurveTo(-12, -5, -12, -5, -20, -5);
        ctx.bezierCurveTo(-10, -26 + this.phase, -3, -26 + this.phase, 10, -18);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = this.secondaryColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(10, -15);
        ctx.bezierCurveTo(6, -25, 6, -25, 15 - this.phase * 2, -35);
        ctx.bezierCurveTo(16, -25, 16, -25, 10, -15);
        ctx.stroke();
        ctx.fill();
    }

    private drawLeg(ctx: CanvasRenderingContext2D, dir: number, yoff: number): void {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.lineJoin = 'round';
        ctx.moveTo(this.p.x, this.p.y - 30 - this.phase * 10);
        const diff = clamp01(this.air - 0.5) * 20;
        ctx.quadraticCurveTo(
            this.p.x + dir * 30 * (1 + this.phase * 0.2) - diff * 0.2 * dir,
            this.p.y - 30 - this.phase * 5 + diff - diff * 0.2 * dir + yoff,
            this.p.x + dir * 22 - diff * dir,
            this.p.y + diff + yoff
        );
        // ctx.lineTo(this.p.x - this.air * dir * 5 + dir * 30 - diff * dir, this.p.y + this.air * 18);
        ctx.stroke();
    }

    private curveTo(ctx: CanvasRenderingContext2D, ax: number, ay: number, x: number, y: number): void {
        ctx.quadraticCurveTo(ax, ay, x, y);
        ctx.stroke();
        drawCircle(ctx, { x, y }, 3, '#000');
    }

    private drawArm(ctx: CanvasRenderingContext2D, dir: number, yoff: number): void {
        ctx.save();
        ctx.translate(this.p.x + dir * 22, this.p.y - 15 + this.phase * 10);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;
        ctx.beginPath();
        const diff = this.phase * -15;
        const rise = this.air * -10;
        ctx.moveTo(0, diff - 15);
        const normal = () => this.curveTo(ctx, dir * 20 - this.wave * 5 + rise, -20 + diff * 1.2, dir * 15 + this.wave * 5, 0 + diff + rise);
        if (dir < 0 || !this.cane) {
            normal();
        } else {
            this.curveTo(ctx, dir * 20 - this.wave * 10 + this.phase * 3, 5 + diff * 1.2 + yoff, 20 * dir, -25 + diff + yoff);
        }
        ctx.stroke();
        if (dir > 0 && this.cane) {
            ctx.translate(20 * dir, -25 + diff + yoff);
            if (this.posing) ctx.rotate(-this.phase * 0.2);
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(0, 50);
            ctx.lineWidth = 12;
            ctx.stroke();
            ctx.strokeStyle = this.cane;
            ctx.lineWidth = 6;
            ctx.stroke();
        }
        ctx.restore();
    }
}