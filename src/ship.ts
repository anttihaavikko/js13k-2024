import { Ball } from './ball';
import { fabrics, woods } from './colors';
import { Dice } from './dice';
import { CrewRole, Dude } from './dude';
import { Camera } from './engine/camera';
import { font } from './engine/constants';
import { Container } from './engine/container';
import { drawCircle } from './engine/drawing';
import { quadEaseIn, quadEaseInOut } from './engine/easings';
import { Game } from './engine/game';
import { Mouse } from './engine/mouse';
import { Pulse } from './engine/pulse';
import { randomCell, randomSorter } from './engine/random';
import { RectParticle } from './engine/rect';
import { offset, Vector } from './engine/vector';
import { WobblyText } from './engine/wobbly';
import { Flashable } from './flashable';
import { Scene } from './scene';

export class Ship extends Flashable {
    private dude: Dude;
    private phase: number;
    private dice: Dice[] = [];
    private tempDice: Dice[] = [];
    private mp: Vector;
    private colors: string[];
    private opponent: Ship;
    private recoil: number = 0;
    private stagger: number = 0;
    private incoming: number = 0;
    private ball: Ball;
    private friendly: boolean;
    private splashing: boolean;
    private effects: Container;
    private hidden: boolean;
    private message: WobblyText;
    private crew: Dude[] = [];
    private availableRoles: CrewRole[] = ['quartermaster', 'cannoneer', 'navigator'];
    
    constructor(game: Game, private name: string, x: number, private scene: Scene, private player: boolean) {
        super(game, x, 550, 0, 0);
        this.colors = [
            randomCell(woods),
            randomCell(woods),
            randomCell(woods),
            randomCell(fabrics),
            randomCell(fabrics)
        ];
        this.message = new WobblyText(game, '', 30, this.player ? 300: -300, -200, 0.5, 3, { shadow: 4, align: 'center', scales: true });
        this.effects = new Container(game);
        this.dude = this.createCrew(70, -100, true);
        // this.addCrew(this.dude, 170, -170);
    }

    public removeCrew(): void {
        this.crew = [];
    }

    public createCrew(x: number, y: number, isCap: boolean = false): Dude {
        return new Dude(this.game, x, y, this.colors[4], this.colors[3], isCap ? randomCell(woods) : null);
    }

    public has(role: CrewRole): boolean {
        return this.crew.some(c => c.is(role));
    }

    public getAvailableRole(): CrewRole {
        return randomCell(this.availableRoles);
    }

    public addCrew(dude: Dude): void {
        this.availableRoles = this.availableRoles.filter(role => role !== dude.getRole());
        this.crew.push(dude);
        this.repotionQuartermaster();
    }

    public talk(text: string): void {
        this.message.toggle(text);
        setTimeout(() => this.message.toggle(''), 1000);
    }

    public setBall(ball: Ball) {
        this.ball = ball;
    }

    public isAuto(): boolean {
        // return true;
        return !this.player;
    }

    public getOpponent(): Ship {
        return this.opponent;
    }

    public setOpponent(other: Ship): void {
        this.opponent = other;
    }

    public isDead(): boolean {
        return this.dice.length === 0;
    }

    public addDamage(dmg: number): void {
        if (dmg <= 0) {
            this.scene.nextTurn();
            return;
        }
        this.incoming = dmg;
        this.dice.forEach(d => d.allowPick());
    }

    public hurt(amount: number): void {
        const target = this.dice.find(d => d.getValue() > amount) ?? this.dice.sort((a, b) => a.getValue() - b.getValue())[0];
        if (!target) return;
        this.hurtDice(target, amount);
    }

    public hurtDice(target: Dice, amount: number): void {
        target.mark();
        setTimeout(() => {
            this.flash();
            this.game.getCamera().shake(10, 0.15, 1);
            this.game.getAudio().explosion();
            const dir = this.player ? 1 : -1;
            const pos = offset(this.p, dir * -50, -this.p.y + 340);
            this.pulse(pos.x + 40, pos.y - 100, 200);
            if (target.hurt(amount)) {
                this.dice = this.dice.filter(d => d != target);
                this.repositionDice();
            }
            this.stagger = 1;
        }, 500);
    }

    private wholeCrew(): Dude[] {
        return [this.dude, ...this.crew];
    }

    public shootAnim(): void {
        this.wholeCrew().forEach(d => d.hopInPlace());
        setTimeout(() => this.dude.pose(false), 300);
        this.recoil = 1;
        this.stagger = 1;
        const dir = this.player ? 1 : -1;
        const muzzle = offset(this.p, dir * 300, -this.p.y + 320);
        this.ball.shoot(muzzle, 800 * dir);
        this.game.getCamera().shake(5, 0.1, 1);
        this.pulse(muzzle.x + 40, muzzle.y - 20, 80);
        this.game.getAudio().shoot();
    }

    public shoot(damage: number): void {
        this.shootAnim();
        this.opponent?.hurt(damage);
        setTimeout(() => this.scene.nextTurn(), 500);
    }

    public pulse(x: number, y: number, size: number): void {
        this.game.getScene().add(new Pulse(this.game, x, y, size, 0.15, 0, 150));
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
        this.repotionQuartermaster();
    }

    public notDone(): boolean {
        return this.incoming > 0;
    }

    public hasSpice(): boolean {
        return this.dice.some(d => d.isSpice());
    }

    public allowSpicePick(): void {
        this.dice.filter(d => d.isSpice()).forEach(d => d.allowPick(true));
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.phase = Math.sin(tick * 0.005);
        this.wholeCrew().forEach(c => c.update(tick, mouse));
        this.effects.update(tick, mouse);
        this.message.update(tick, mouse);
        [...this.dice, ...this.tempDice].forEach(d => d.update(tick, this.offsetMouse(mouse, this.game.getCamera())));
        this.mp = this.offsetMouse(mouse, this.game.getCamera());
        if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - 0.075);
        if (this.stagger > 0) this.stagger = Math.max(0, this.stagger - 0.05);

        if (this.splashing) {
            const dir = this.player ? 1 : -1;
            this.effects.add(new RectParticle(
                this.game,
                this.p.x - 180 + 370 * Math.random(),
                500,
                10,
                10,
                0.3,
                { x: (-2 - Math.random() * 5) * dir, y: -4 - Math.random() * 3 },
                { force: { x: 0, y: 0.5 }, color: '#ffffffcc' }));
        }

        if (mouse.pressing && this.player) {
            const d = this.dice.find(d => d.isHovering());
            if (d) {
                this.scene.pick(d);
                if (this.incoming > 0) {
                    this.opponent.shootAnim();
                    this.hurtDice(d, this.incoming);
                    this.incoming = 0;
                    this.disablePicking();
                    setTimeout(() => this.scene.nextTurn(), 500);
                }
            }
        }
    }

    public hasDice(): boolean {
        return this.dice.length > 0;
    }

    public giveDice(amount: number): void {
        this.dice.slice(0, amount).forEach((d, i) => {
            const dp = this.getDicePos(i);
            d.p = offset(this.p, -dp.x - 50, dp.y);
            this.remove(d);
            this.tempDice.push(d);
            d.move(offset(this.opponent.getDicePos(this.opponent.dice.length + i), this.opponent.p.x + 150, this.opponent.p.y), () => {
                this.opponent.addDice(d);
                this.tempDice = [];
            });
        });
        this.game.getAudio().greet();
        this.repositionDice();
    }

    public remove(d: Dice): void {
        this.dice = this.dice.filter(dd => dd != d);
    }

    public disablePicking(): void {
        this.dice.forEach(dd => dd.allowPick(false));
    }

    public offsetMouse(mouse: Mouse, cam: Camera, x: number = 0, y: number = 0): Mouse {
        return {
            ...mouse,
            x: mouse.x / cam.zoom - 400 + cam.shift + x,
            y: mouse.y / cam.zoom - 550 - cam.pan.y + y
        };
    }

    public addPlate(): void {
        if (this.player) this.game.getAudio().greet();
        const options = this.dice.filter(d => d.canPlate());
        if (options.length > 0) randomCell(options).plate(); 
    }

    public sink(): void {
        this.game.getAudio().sink();
        this.wholeCrew().forEach(d => d.hopInPlace());
        this.tween.setEase(quadEaseIn);
        this.tween.move(offset(this.p, 0, 850), 1.5);
    }

    public pose(state: boolean): void {
        this.crew.forEach(d => d.hopInPlace());
        this.dude.pose(state);
    }

    public hop(): void {
        this.wholeCrew().forEach(d => d.hopInPlace());
    }

    public getRollPos(): number {
        return this.p.x + 100 * this.getDirection();
    }

    public getDirection(): number {
        return this.player ? 1 : -1;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (this.hidden) return;

        ctx.strokeStyle = this.getColor('#000');
        
        ctx.save();
        const mirror = this.getDirection();
        ctx.translate(this.p.x - this.stagger * 20 * mirror, this.p.y);
        ctx.rotate(this.phase * 0.02 - this.stagger * 0.05 * mirror);

        if (!this.player) ctx.scale(-1, 1);

        // mast
        ctx.fillStyle = this.getColor(this.colors[0]);
        const mastPos = 40;
        ctx.beginPath();
        ctx.rect(-50 + mastPos, -550, 15, 520);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        // sail
        ctx.fillStyle = this.getColor(this.colors[3]);
        ctx.beginPath();
        ctx.moveTo(-60 + mastPos, -520);
        ctx.lineTo(-60 + mastPos, -200);
        ctx.lineTo(-300 + mastPos - this.phase * 10, -200 - this.phase * 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // draw mouse point
        // if (this.player) ctx.fillRect(this.mp.x, this.mp.y, 20, 20);

        // const cam = this.game.getCamera();
        // const off = cam.pan.x / cam.zoom + (this.player ? 800 : -700);
        // ctx.translate(-this.p.x + off, -this.p.y);
        this.dice.filter(d => !d.isHovering()).forEach(d => d.draw(ctx));
        this.dice.filter(d => d.isHovering()).forEach(d => d.draw(ctx));
        // ctx.translate(this.p.x - off, this.p.y);

        ctx.translate(160, 0);
        ctx.rotate(-0.1 - this.recoil * 0.1);
        if (!this.friendly) this.drawCannon(ctx);
        ctx.rotate(0.1 +  + this.recoil * 0.1);
        ctx.translate(-160, 0);

        ctx.save();
        ctx.scale(1.4, 1.4);
        this.wholeCrew().forEach(c => c.draw(ctx));
        ctx.restore();

        // hull
        ctx.fillStyle = this.getColor(this.colors[2]);
        ctx.beginPath();
        const extension = this.getCargoWidth();
        ctx.moveTo(-200 - extension, -150);
        ctx.lineTo(-170 - extension, 10);
        ctx.lineTo(180, 10);
        ctx.lineTo(250, -160);
        ctx.closePath();
        ctx.moveTo(-195 - extension, -110);
        ctx.lineTo(235, -120);
        ctx.moveTo(-190 - extension + 5, -72);
        ctx.lineTo(215, -77);
        ctx.moveTo(-180 - extension + 5, -30);
        ctx.lineTo(195, -30);
        ctx.fill();
        ctx.stroke();

        // nest
        if (this.has('navigator')) {
            ctx.beginPath();
            ctx.moveTo(-60, -520);
            ctx.lineTo(-60 - 20, -520 - 60);
            ctx.lineTo(60 + 20, -520 - 60);
            ctx.lineTo(60, -520);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.translate(-120, -100);
        ctx.scale(this.player ? 1 : -1, 1);
        ctx.lineWidth = 12;
        ctx.lineJoin = 'round';
        ctx.fillStyle = this.colors[4];
        ctx.font =`40px ${font}`;
        ctx.textAlign = 'center';
        ctx.strokeText(this.name, 0, 0);
        ctx.fillText(this.name, 0, 0);

        // ctx.translate(0, this.phase * 5);
        this.message.draw(ctx);

        ctx.restore();

        this.effects.draw(ctx);
        this.tempDice.forEach(d => d.draw(ctx));
    }

    public repotionQuartermaster(): void {
        const qm = this.crew.find(c => c.is('quartermaster'));
        if (qm) {
            qm.hop({ x: -95, y: -105 - Math.min(3, this.dice.length) * 70});
        }
    }

    public removeSpice(): void {
        this.dice.forEach(d => d.makeSpice(false));
    }

    public addSpice(amount: number): void {
        [...this.dice].sort(randomSorter).slice(0, amount).forEach(l => l.makeSpice());
    }

    public isUnlucky(): boolean {
        return this.dice.reduce((sum, d) => sum + d.getValue(), 0) == 13;
    }

    public hide(): void {
        this.hidden = true;
    }

    public rerollAll(): void {
        this.dice.forEach(d => d.reroll());
    }

    public sail(dir: number = 1): void {
        this.dude.hopInPlace();
        this.tween.setEase(quadEaseInOut);
        this.tween.move(offset(this.p, 2000 * dir, 0), 6);
        setTimeout(() => this.splashing = true, 300);
        setTimeout(() => this.splashing = false, 5000);
        const delay = 750;
        for (let i = 0; i < (6 - 1) * 1000 / delay; i++) {
            setTimeout(() => this.game.getAudio().sail(0.1 + Math.random() * 0.3), i * delay);
        }
    }

    public clearCargo(): void {
        this.dice = [];
    }

    public getCargoWidth(): number {
        return Math.floor(Math.max(0, this.dice.length - 1) / 3) * 100;
    }

    private drawCannon(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.getColor('#666');
        // cannon
        ctx.save();
        ctx.rotate(-this.recoil * 0.2);
        ctx.translate(190 - this.recoil * 10, 0);
        ctx.beginPath();
        const height = 25;
        ctx.moveTo(0, -200 - height);
        ctx.bezierCurveTo(-300, -200 - height * 2, -300, -200 + height * 2, 0, -200 + height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(-20, -230, 20, 60);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = this.getColor(this.colors[1]);
        // cannon base
        ctx.beginPath();
        ctx.moveTo(0, -150);
        ctx.bezierCurveTo(0, -230, 70, -230, 70, -150);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        drawCircle(ctx, { x: 35, y: -190 }, 8, this.getColor('#000'));
    }

    public makeAngry(): void {
        this.dude.makeAngry(true);
    }

    public makeFriendly(): void {
        this.friendly = true;
    }
}