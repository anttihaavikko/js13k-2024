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
import { TextEntity } from './engine/text';
import { offset, Vector } from './engine/vector';
import { WobblyText } from './engine/wobbly';
import { Flashable } from './flashable';
import { Scene } from './scene';

export class Ship extends Flashable {
    public hidden: boolean;
    public ball: Ball;
    public friendly: boolean;
    public dude: Dude;
    public opponent: Ship;

    private dice: Dice[] = [];
    private tempDice: Dice[] = [];
    private colors: string[];
    private recoil: number = 0;
    private stagger: number = 0;
    private incoming: number = 0;
    private splashing: boolean;
    private effects: Container;
    private message: WobblyText;
    private crew: Dude[] = [];
    private availableRoles: CrewRole[] = ['quartermaster', 'cannoneer', 'navigator'];
    private hits: number = 0;
    
    constructor(game: Game, private name: string, x: number, private scene: Scene, public player: boolean) {
        super(game, x, 550, 0, 0);
        this.animationSpeed = 0.005;
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
        // this.dude.crown = true;
        // this.dude.makeAngry();
    }

    private getStackHeight(): number {
        if (this.dice.length < 10) return 3;
        if (this.dice.length < 20) return 4;
        if (this.dice.length < 30) return 5;
        return 6;
    }

    private pop(text: string, x: number, y: number): void {
        this.effects.add(new TextEntity(this.game, text, 60, this.p.x + x * this.getDir(), this.p.y + y, 1.2, { x: 0, y: -2.5 }, { shadow: 4, scales: true }));
    }

    public tryRepair(): void {
        const qm = this.crew.find(c => c.crewRole == 'quartermaster');
        if (qm) {
            const target = randomCell(this.dice);
            qm.hop();
            target.fix();
        }
    }

    public removeCrew(): void {
        this.crew = [];
    }

    public createCrew(x: number, y: number, isCap: boolean = false): Dude {
        return new Dude(this.game, x, y, this.colors[4], this.colors[3], isCap ? randomCell(woods) : null);
    }

    public has(role: CrewRole): boolean {
        return this.crew.some(c => c.crewRole == role);
    }

    public getAvailableRole(): CrewRole {
        return randomCell(this.availableRoles);
    }

    public addCrew(dude: Dude): void {
        this.availableRoles = this.availableRoles.filter(role => role !== dude.crewRole);
        this.crew.push(dude);
        this.repotionQuartermaster();
    }

    public talk(text: string): void {
        this.message.toggle(text);
        this.dude.openMouth();
        setTimeout(() => this.dude.openMouth(), 320);
        setTimeout(() => this.message.toggle(''), 1000);
    }

    public badLuck(): void {
        this.talk('UNLUCKY 13!');
        this.game.audio.bad();
        if (this.player) this.game.pitcher.pitchFrom(0.7, 1.5);
    }

    public isDead(): boolean {
        return this.dice.length === 0;
    }

    public addCrown(): void {
        this.dude.crown = true;
    }

    public openMouth(): void {
        this.dude.openMouth();
    }

    public addDamage(dmg: number): void {
        if (dmg <= 0) {
            this.scene.nextTurn();
            return;
        }
        this.incoming = dmg;
        this.dice.forEach(d => d.allowPick());
    }

    public hurt(amount: number): number {
        const target = this.dice.find(d => d.getValue() > amount) ?? [...this.dice].sort((a, b) => a.getValue() - b.getValue())[0];
        if (!target) return;
        this.hurtDice(target, amount);
        return amount - target.getValue();
    }

    private getDir(): number {
        return this.player ? 1 : -1;
    }

    public hurtDice(target: Dice, amount: number): void {
        target.mark();
        setTimeout(() => {
            this.game.pitcher.pitchFrom(this.player ? 0.85 : 1.21, this.player ? 1 : 2);
            this.openMouth();
            this.flash();
            this.game.camera.shake(20, 0.3, 2);
            this.game.audio.explosion();
            const pos = offset(this.p, this.getDir() * -50, -this.p.y + 340);
            this.pulse(pos.x + 40, pos.y - 100, 200);
            this.pop(amount.toString(), target.p.x + 25, target.p.y);
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
        this.dude.openMouth();
        this.wholeCrew().forEach(d => d.hop());
        setTimeout(() => this.dude.pose(false), 300);
        this.recoil = 1;
        this.stagger = 1;
        const dir = this.getDir();
        const muzzle = offset(this.p, dir * 300, -this.p.y + 320);
        this.ball.shoot(muzzle, 800 * dir);
        this.game.camera.shake(15, 0.2, 1.25);
        this.pulse(muzzle.x + 40, muzzle.y - 20, 80);
        this.game.audio.shoot();
    }

    public shoot(damage: number, first: boolean = true): void {
        this.shootAnim();
        const more = this.opponent?.hurt(damage);
        setTimeout(() => {
            if (this.has('cannoneer') && more > 0 && first && this.opponent.canTake(more)) {
                this.shoot(more, false);
                return;
            }
            this.scene.nextTurn();
        }, 500);
    }

    private canTake(dmg: number): boolean {
        return this.dice.length > 1 || this.getSum() > dmg;
    }

    public pulse(x: number, y: number, size: number): void {
        this.game.scene.add(new Pulse(this.game, x, y, size, 0.15, 0, 150));
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
        const stack = this.getStackHeight();
        return {
            x: -105 * Math.floor(i / stack) - 180 + Math.random() * 20,
            y: (i % stack) * -100 - 240
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
        this.wholeCrew().forEach(c => c.update(tick, mouse));
        this.effects.update(tick, mouse);
        this.message.update(tick, mouse);
        [...this.dice, ...this.tempDice].forEach(d => d.update(tick, this.offsetMouse(mouse, this.game.camera)));
        if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - 0.075);
        if (this.stagger > 0) this.stagger = Math.max(0, this.stagger - 0.05);

        if (this.splashing) {
            this.effects.add(new RectParticle(
                this.game,
                this.p.x - 550 * Math.random(),
                500,
                10,
                10,
                0.3,
                { x: (-2 - Math.random() * 5) * this.getDir(), y: -4 - Math.random() * 3 },
                { force: { x: 0, y: 0.5 }, color: '#ffffffcc' }));
        }

        if (mouse.pressing && this.player) {
            const d = this.dice.find(d => d.isHovering());
            if (d) {
                this.scene.pick(d);
                if (this.incoming > 0) {
                    this.hits++;
                    this.opponent.shootAnim();
                    this.hurtDice(d, this.incoming);
                    this.incoming = this.incoming - d.getValue();
                    if (this.opponent.has('cannoneer') && this.incoming > 0 && this.hits < 2 && this.canTake(this.incoming)) {
                        this.scene.info();
                        setTimeout(() => {
                            this.game.audio.incoming();
                            this.scene.info(`Another ${this.incoming} damage!`, 'Choose cargo taking the hit...');
                        }, 750);
                        return;
                    }
                    this.hits = 0;
                    this.incoming = 0;
                    this.disablePicking();
                    setTimeout(() => this.scene.nextTurn(), 500);
                }
            }
        }
    }

    public setName(name: string): void {
        this.name = name;
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
        this.game.audio.greet();
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
        if (this.player) this.game.audio.greet();
        const options = this.dice.filter(d => d.canPlate());
        if (options.length > 0) randomCell(options).plate();
    }

    public sink(): void {
        this.game.audio.sink();
        this.wholeCrew().forEach(d => d.hop());
        this.tween.setEase(quadEaseIn);
        this.tween.move(offset(this.p, 0, 800 / this.game.camera.zoom), 1.5);
    }

    public pose(state: boolean): void {
        // this.crew.forEach(d => d.hop());
        this.dude.pose(state);
    }

    public hop(): void {
        this.wholeCrew().forEach(d => d.hop());
    }

    public getRollPos(): number {
        return this.p.x + 100 * this.getDir();
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (this.hidden) return;

        ctx.strokeStyle = this.getColor('#000');
        
        ctx.save();
        const mirror = this.getDir();
        ctx.translate(this.p.x - this.stagger * 20 * mirror, this.p.y - Math.cos(this.animationPhase) * 10);
        ctx.rotate(this.animationPhase * 0.02 - this.stagger * 0.05 * mirror);

        ctx.scale(mirror, 1);

        // mast
        ctx.fillStyle = this.getColor(this.colors[0]);
        const mastPos = 40;
        ctx.beginPath();
        ctx.rect(mastPos - 50, -550, 15, 520);
        ctx.fill();
        ctx.stroke();

        // sail
        ctx.fillStyle = this.getColor(this.colors[3]);
        ctx.beginPath();
        ctx.moveTo(mastPos - 60, -520);
        ctx.quadraticCurveTo(-200 - this.animationPhase * 10, -400, mastPos - 340 - this.animationPhase * 10, -180 - this.animationPhase * 10);
        ctx.lineTo(mastPos - 60, -180);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // small flag
        // ctx.beginPath();
        // ctx.translate(0, -480);
        // ctx.moveTo(-60 + mastPos, -40);
        // const diff = Math.sin(this.time * 0.01 + Math.PI * 0.5) * 10;
        // ctx.quadraticCurveTo(-100, diff - 10, -200 + mastPos - this.phase * 5, Math.sin(this.time * 0.01) * 10);
        // ctx.quadraticCurveTo(-100, diff, -60 + mastPos, 20);
        // ctx.closePath();
        // ctx.fill();
        // ctx.stroke();
        // ctx.translate(0, 480);

        // draw mouse point
        // if (this.player) ctx.fillRect(this.mp.x, this.mp.y, 20, 20);

        this.dice.filter(d => !d.isHovering()).forEach(d => d.draw(ctx));
        this.dice.filter(d => d.isHovering()).forEach(d => d.draw(ctx));

        ctx.strokeStyle = this.getColor('#000');

        ctx.save();
        ctx.translate(160, 0);
        ctx.rotate(-0.1 - this.recoil * 0.1);
        
        if (!this.friendly) {
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

        ctx.restore();

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
        ctx.moveTo(-193 - extension, -110);
        ctx.lineTo(233, -120);
        ctx.moveTo(-190 - extension + 7, -72);
        ctx.lineTo(213, -77);
        ctx.moveTo(-180 - extension + 7, -30);
        ctx.lineTo(193, -30);

        // nest
        if (!this.friendly && this.has('navigator')) {
            ctx.moveTo(-60, -535);
            ctx.lineTo(-80, -595);
            ctx.lineTo(80, -595);
            ctx.lineTo(60, -535);
            ctx.closePath();
            ctx.moveTo(-70, -565);
            ctx.lineTo(70, -565);
        }

        ctx.fill();
        ctx.stroke();

        ctx.translate(-120, -100);
        ctx.scale(this.getDir(), 1);
        ctx.lineWidth = 12;
        ctx.lineJoin = 'round';
        ctx.fillStyle = this.colors[4];
        ctx.font =`40px ${font}`;
        ctx.textAlign = 'center';
        ctx.strokeText(this.name, 0, 0);
        ctx.fillText(this.name, 0, 0);

        this.message.draw(ctx);

        ctx.restore();

        this.effects.draw(ctx);
        this.tempDice.forEach(d => d.draw(ctx));
    }

    public repotionQuartermaster(): void {
        const qm = this.crew.find(c => c.crewRole == 'quartermaster');
        if (qm) {
            const height = this.getStackHeight();
            qm.hop({ x: -45 - Math.max(Math.floor(this.dice.length / height), 1) * 40, y: -105 - Math.min(height, this.dice.length) * 70});
        }
    }

    public removeSpice(): void {
        this.dice.forEach(d => d.makeSpice(false));
    }

    public addSpice(amount: number): void {
        [...this.dice].sort(randomSorter).slice(0, amount).forEach(l => l.makeSpice());
    }

    private getSum(): number {
        return this.dice.reduce((sum, d) => sum + d.getValue(), 0);
    }

    public isUnlucky(): boolean {
        return this.getSum() == 13;
    }

    public rerollAll(): void {
        this.dice.forEach(d => d.reroll());
        this.repotionQuartermaster();
    }

    public sail(dir: number = 1): void {
        this.dude.hop();
        this.tween.setEase(quadEaseInOut);
        this.tween.move(offset(this.p, 2000 * dir, 0), 6);
        setTimeout(() => this.splashing = true, 300);
        setTimeout(() => this.splashing = false, 5000);
        for (let i = 0; i < 7; i++) {
            setTimeout(() => this.game.audio.sail(0.1 + Math.random() * 0.3), i * 750);
        }
    }

    public clearCargo(): void {
        this.dice = [];
    }

    public getCargoWidth(): number {
        return Math.floor(Math.max(this.has('navigator') ? 4 : 1, this.dice.length - 1) / this.getStackHeight()) * 100;
    }
}