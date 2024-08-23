import { skins } from './colors';
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
    public crown: boolean;
    public face: Face;
    public crewRole: CrewRole;

    private posing: boolean;
    private height = 0;
    private air = 0;
    private wave = 0;
    private skin: string;
    private flipHat: number;

    constructor(game: Game, x: number, y: number, private mainColor: string, private secondaryColor: string, private cane: string) {
        super(game, x, y, 0, 0);
        this.face = new Face(this.game, {
            blush: '#ed4ea3aa',
            width: 0.6,
            mouthWidth: 0.7,
            mouthThickness: 11,
            blushOffset: 5,
            blushSize: 1.1
        });
        this.skin = randomCell(skins);
        this.flipHat = Math.random() < 0.5 ? 1 : -1;
        this.animationSpeed = 0.005 * (0.8 + Math.random() * 0.4);
        // this.crown = true;
    }

    public getRoleDescription(): string {
        switch (this.crewRole) {
            case 'cannoneer':
                return 'He will allow you to make up to two shots every turn...';
            case 'quartermaster':
                return 'He will repair random cargo when you roll a blank...';
            case 'navigator':
                return 'He will allow you to reroll an extra time...';
        }
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(tick: number, mouse: Mouse): void {
        this.face.update(tick, mouse);
        if (this.height > 0) this.height = clamp01(this.height - 0.0025 * this.delta);
        this.air = Math.sin((1 - this.height) * Math.PI);
        this.wave = Math.sin(tick * 0.005);
        super.update(tick, mouse);
    }

    public hop(to: Vector = this.p): void {
        this.height = 1;
        this.tween.move(to, 0.3);
        this.game.audio.jump();
        setTimeout(() => this.game.audio.land(), 370);
    }

    public openMouth(): void {
        this.face.openMouth(1.5, 0.175);
    }

    public pose(state: boolean): void {
        if (state) this.hop();
        this.posing = state;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const boss = this.crown && this.face.angry;
        ctx.lineCap = 'round';
        ctx.save();
        ctx.translate(this.p.x, this.p.y);
        if (!this.cane) ctx.scale(0.9, 0.9);
        if (boss) ctx.scale(1.3, 1.3);
        ctx.translate(0, -this.air * 50 - (this.posing ? 10 : 0));

        const raisePos = boss ? -35 : -45;
        this.drawLeg(ctx, 1, this.posing ? raisePos : 0);
        this.drawLeg(ctx, -1, 0);
        
        ctx.translate(0, -this.animationPhaseAbs * 10);
        ctx.rotate(this.wave * 0.05 - (this.posing ? 0.3 : 0));

        ctx.beginPath();
        ctx.moveTo(0, 0 - 40);
        ctx.lineTo(0, 0 - 90);
        ctx.lineWidth = 50;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.lineWidth = 35;
        ctx.strokeStyle = this.skin;
        ctx.stroke();

        ctx.translate(0, -20);

        this.drawArm(ctx, 1, this.posing ? -30 : 10 + this.animationPhaseAbs * 10);
        this.drawArm(ctx, -1, 0);

        ctx.translate(4, -50 - this.animationPhaseAbs * 5);

        ctx.scale(0.3, 0.3);
        ctx.globalCompositeOperation = 'multiply';
        this.face.draw(ctx);
        ctx.globalCompositeOperation = 'source-over';
        ctx.translate(-13, 0);

        ctx.scale(4.5, 4.5);
        ctx.translate(0, -18 + this.animationPhaseAbs * 7 - clamp01(this.air - 0.5) * 20);
        ctx.rotate(clamp01(this.air - 0.75) * 0.5);
    
        // draw hat
        ctx.fillStyle = this.mainColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.translate(0, 20 - this.animationPhaseAbs * 5);
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
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.translate(2, -1);
        
        ctx.moveTo(8, -15);
        ctx.bezierCurveTo(-12, -5, -12, -5, -20, -5 - this.animationPhaseAbs * 2);
        ctx.bezierCurveTo(-10, -26, -3, -26 + this.animationPhaseAbs * 2, 10, -18);
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(9, -17);
        ctx.bezierCurveTo(7, -25, 7, -25, 15 - this.animationPhaseAbs * 2 - this.wave, -35);
        ctx.bezierCurveTo(15, -25, 15, -25, 9, -17);
        ctx.stroke();
        ctx.fill();

        ctx.restore();
    }

    private drawLeg(ctx: CanvasRenderingContext2D, dir: number, yoff: number): void {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.lineJoin = 'round';
        ctx.moveTo(0, -30 - this.animationPhaseAbs * 10);
        const diff = clamp01(this.air - 0.5) * 20;
        ctx.quadraticCurveTo(
            dir * 30 * (1 + this.animationPhaseAbs * 0.2) - diff * 0.2 * dir,
            -30 - this.animationPhaseAbs * 5 + diff - diff * 0.2 * dir + yoff,
            dir * 22 - diff * dir,
            diff + yoff
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
        ctx.translate(dir * 22, -15 + this.animationPhaseAbs * 10);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;
        ctx.beginPath();
        const diff = this.animationPhaseAbs * -15;
        ctx.moveTo(0, diff - 15);
        if (dir < 0 || !this.cane) {
            this.curveTo(ctx, dir * 20 - this.wave * 5 + this.air * -10, -20 + diff * 1.2, dir * 15 + this.wave * 5, diff + this.air * -10);
        } else {
            this.curveTo(ctx, dir * 20 - this.wave * 10 + this.animationPhaseAbs * 3, 5 + diff * 1.2 + yoff, 20 * dir, -25 + diff + yoff);
        }
        ctx.stroke();
        if (dir > 0 && this.cane) {
            ctx.translate(20 * dir, -25 + diff + yoff);
            if (this.posing) ctx.rotate(-this.animationPhaseAbs * 0.2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 50);
            ctx.lineWidth = 12;
            ctx.stroke();
            ctx.strokeStyle = this.cane;
            ctx.lineWidth = 6;
            ctx.stroke();
            // drawCircle(ctx, { x: 4, y: 0 }, 5, '#000');
        }
        ctx.restore();
    }
}