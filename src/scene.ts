import { Mouse } from './engine/mouse';
import { Game } from './engine/game';
import { Container } from './engine/container';
import { Ship } from './ship';
import { Dice } from './dice';
import { WobblyText } from './engine/wobbly';
import { ButtonEntity } from './engine/button';
import { Camera } from './engine/camera';
import { offset } from './engine/vector';
import { Ball } from './ball';
import { randomCell } from './engine/random';

export class Scene extends Container {
    private ship: Ship;
    private enemy: Ship;
    private phase: number;
    private dice: Dice[] = [];
    private splash: WobblyText;
    private secondLine: WobblyText;
    private action: ButtonEntity;
    private yesButton: ButtonEntity;
    private noButton: ButtonEntity;
    private act: () => void;
    private yesAct: () => void;
    private noAct: () => void;
    private useDamageDice: boolean;
    private cam: Camera;
    private targetZoom = 0.75;
    private camVelocity = 0;
    private wave: number;
    private level: number = 0;
    private current: Ship;
    private ball: Ball;
    private bigText: WobblyText;
    private loot: Dice[] = [];
    private won: boolean = false;

    constructor(game: Game) {
        super(game, 0, 0, []);

        this.ball = new Ball(this.game, 100, 100, 0, 0);

        this.ship = new Ship(game, '14', 0, this, true);
        this.current = this.ship;

        this.splash = new WobblyText(game, 'Lets start by rolling for your cargo!', 35, 400, 120, 0.2, 3, { shadow: 5, align: 'center' });
        this.secondLine = new WobblyText(game, '', 25, 400, 165, 0.2, 3, { shadow: 3, align: 'center' });
        this.bigText = new WobblyText(game, 'GAME NAME', 80, 400, 210, 0.2, 3, { shadow: 7, align: 'center' });
        this.action = new ButtonEntity(game, 'ROLL', 400, 550, 200, 55, () => this.buttonPress(), game.getAudio(), 20);
        this.yesButton = new ButtonEntity(game, 'YEAH', 330, 550, 120, 55, () => this.answer(true), game.getAudio(), 20);
        this.noButton = new ButtonEntity(game, 'NOPE', 470, 550, 120, 55, () => this.answer(false), game.getAudio(), 20);

        this.yesButton.visible = false;
        this.noButton.visible = false;

        this.promptAction('ROLL', () => {
            this.rollForCargo();
            setTimeout(() => this.promptAnswer('Would you like to roll again?', '', () => {
                this.reroll();
                setTimeout(() => {
                    this.moveDiceTo(this.ship);
                    this.promptSail();
                }, 500);
            }, () => {
                this.moveDiceTo(this.ship);
                this.promptSail();
            }), 500);
        });

        this.cam = game.getCamera();
        this.cam.zoom = this.targetZoom;
        this.cam.pan = { x: -100, y: 50 };

        game.onKey((e) => {
            if (e.key == 's') this.ship.sail();
            if (e.key == 'x') this.ship.shoot(1);
            if (e.key == 'z') this.targetZoom = Math.random() * 0.5 + 0.25;
            if (e.key == 'p') this.ship.pose(true);
            if (e.key == 'h') this.game.getCamera().shake(10, 0.15, 1);
        });
    }

    public answer(answered: boolean): void {
        this.splash.content = '';
        this.secondLine.content = '';
        this.yesButton.visible = false;
        this.noButton.visible = false;
        if (answered) this.yesAct();
        if (!answered) this.noAct();
    }

    private reroll(): void {
        this.roll(this.dice.length);
        this.loot.forEach(l => l.reroll());
    }

    private promptAction(label: string, action: () => void): void {
        setTimeout(() => {
            this.action.visible = true;
            this.action.setText(label);
            this.act = action;
        }, 500);
    }

    private promptAnswer(first: string, second: string, yes: () => void, no: () => void): void {
        this.splash.content = first;
        this.secondLine.content = second;
        this.yesButton.visible = true;
        this.noButton.visible = true;
        this.yesAct = yes;
        this.noAct = no;
    }

    private buttonPress(): void {
        this.bigText.content = '';
        this.action.visible = false;
        this.act();
    }

    private rollForDamage(): void {
        this.useDamageDice = true;
        this.roll(this.current.getDiceCount());
        setTimeout(() => this.promptForReroll('Would you like to roll again?', '', () => this.shoot()), 500);
    }

    private promptForReroll(first: string, second: string, after: () => void): void {
        if (this.current.isAuto()) {
            const dmg = this.getDamage();
            if (dmg < this.dice.length) {
                this.roll(this.dice.length);
                setTimeout(() => after(), 750);
                return;
            }
            this.shoot();
            return;
        }
        this.promptAnswer(first, second, () => {
            this.reroll();
            setTimeout(() => {
                after();
                this.dice = [];
            }, 750);
        }, () => {
            after();
            this.dice = [];
        });
    }

    private shoot(): void {
        const dmg = this.getDamage();
        if (this.current.isAuto()) {
            this.splash.content = `Incoming ${dmg} damage!`;
            this.secondLine.content = 'Select cargo taking the hit...';
            this.ship.addDamage(dmg);
            return;
        }
        this.current.shoot(dmg);
    }

    private rollForCargo(): void {
        this.roll(2);
        this.action.visible = false;
        this.splash.content = '';
        
        setTimeout(() => {
            this.splash.content = 'Would you like to roll again?';
            this.yesButton.visible = true;
            this.noButton.visible = true;
        }, 500);
    }

    public nextTurn(): void {
        this.dice = [];
        this.splash.content = '';
        this.secondLine.content = '';
        if (this.won) {
            this.promptSail();
            return;
        }
        if (this.enemy.isDead() && !this.won) {

            this.won = true;
            this.enemy.sink();
            this.current = this.ship;

            const m = this.getMid() + (80 + this.cam.shift + 200) / this.cam.zoom;
            const amt = Math.min(this.level + 1, 6);
            for (let i = 0; i < amt; i++) {
                const d = new Dice(this.game, m, 300);
                d.roll(m + i * 120 - 120 * ((amt - 1) * 0.5), 420);
                d.float(true);
                this.loot.push(d);
            }

            setTimeout(() => this.promptForReroll('Victory! Nicely done!', 'Would you like to reroll the loot?', () => {
                this.promptSail();
                this.showGreed();
            }), 750);
            return;
        }
        this.current = this.current.getOpponent();
        this.current.pose(true);
        this.promptShot();
    }

    private showGreed(): void {
        this.splash.content = 'Don\'t be greedy!';
        this.secondLine.content = 'You can only take one...';
    }

    private promptSail(): void {
        this.splash.content = '';
        this.secondLine.content = '';
        this.promptAction('SAIL', () => this.nextLevel());
    }

    private getDamage(): number {
        return this.dice.reduce((sum, d) => sum + d.getValue(), 0);
    }

    private promptShot(): void {
        this.current.setBall(this.ball);

        if (this.current.isDead()) {
            this.ship.pose(false);
            this.enemy.pose(true);
            this.splash.content = 'Lost all your cargo!';
            this.bigText.content = 'GAME OVER';
            return;
        }
        if (this.current.isAuto()) {
            setTimeout(() => this.rollForDamage(), 1000);
            return;
        }
        this.promptAction('SHOOT', () => this.rollForDamage());
        this.current.pose(true);
    }

    private nextLevel(): void {
        this.won = false;
        this.current = this.ship;
        this.level++;
        this.targetZoom = 0.75;
        this.cam.shift = 0;
        this.cam.pan.y = 50;
        this.ship.sail();
        this.action.setText('');
        this.action.visible = false;
        setTimeout(() => {
            this.enemy = new Ship(this.game, this.getEnemyName(), (this.level - 1) * 2000 + 3000, this, false);
            this.ship.setOpponent(this.enemy);
            this.enemy.setOpponent(this.ship);
            for (let index = 0; index < 1 + (this.level - 1) * 0.5; index++) {
                this.enemy.addDice(new Dice(this.game, 0, 0));
            }
        }, 4000);
        setTimeout(() => this.activateLevel(), 5000);
    }

    private getEnemyName(): string {
        return this.level % 2 == 0 ? randomCell(['VND', 'MRC', 'GIT', 'POO', 'SIN', 'CSS', 'ASH']) : (13 - (this.level - 1) * 0.5).toString();
    }

    private activateLevel(): void {
        this.targetZoom = 0.5;
        this.cam.pan.y = 350;
        this.cam.shift = 100;

        if (this.level % 2 == 0) {
            this.enemy.makeFriendly();
            this.doEvent();
            return;
        }

        this.enemy.makeAngry();
        setTimeout(() => this.splash.content = 'COMMENCE COMBAT'!, 1000);
        setTimeout(() => this.promptShot(), 2000);
    }

    private doEvent(): void {
        this.promptAnswer('Hello there mate!', 'Would you like to reroll all your cargo?', () => {
            this.ship.rerollAll();
            setTimeout(() => this.promptSail(), 500);
        }, () => this.promptSail());
    }

    private zoom(): void {
        // const left = this.ship.getCargoWidth();
        // const right = this.enemy.getCargoWidth();
        // this.game.getCamera().zoom = 500 / (1000 + left + right);
        // this.game.getCamera().offset = { x: (right - left) * 0.5, y: 0 };
    }

    private moveDiceTo(ship: Ship): void {
        this.dice.forEach((d, i) => d.move(offset(ship.getDicePos(i + ship.getDiceCount()), this.ship.p.x, this.ship.p.y), () => ship.addDice(d)));
        setTimeout(() => {
            this.dice = [];
            this.zoom();
        }, 300);
    }

    private getMid(): number {
        return (this.cam.pan.x + 400 - this.cam.shift);
    }

    public roll(amount: number): void {
        this.dice = [];
        for (let i = 0; i < amount; i++) {
            const m = this.getMid() + (80 + this.cam.shift) / this.cam.zoom;
            const d = new Dice(this.game, m, 800, this.useDamageDice);
            d.roll(m + i * 120 - 120 * ((amount - 1) * 0.5), 450);
            this.dice.push(d);
        }
    }

    public getButtons(): ButtonEntity[] {
        return [this.action, this.yesButton, this.noButton];
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.phase = Math.abs(Math.sin(tick * 0.002));
        this.wave = Math.sin(tick * 0.0003);
        [this.ball, this.ship, this.enemy, ...this.dice, this.splash, this.secondLine, this.bigText, ...this.getButtons()].filter(e => !!e).forEach(e => e.update(tick, mouse));
        this.loot.forEach(l => l.update(tick, this.ship.offsetMouse(mouse, this.cam, this.cam.pan.x + 200, 540)));
        const diff = this.ship.p.x - this.getMid() + this.cam.shift;
        if (Math.abs(diff) > 10) this.camVelocity += Math.sign(diff);
        this.cam.pan.x += this.camVelocity;
        this.camVelocity *= 0.9;
        // const z = this.cam.zoom - this.targetZoom
        const z = this.targetZoom - this.cam.zoom;
        if (Math.abs(z) > 0.01) this.cam.zoom += Math.sign(z) * 0.0075;

        if (this.loot.length > 0 && mouse.pressing) {
            const looted = this.loot.find(l => l.isHovering());
            if (looted) {
                this.yesButton.visible = false;
                this.noButton.visible = false;
                this.loot.forEach(l => l.allowPick(false));
                looted.float(false);
                looted.move(offset(this.ship.getDicePos(this.ship.getDiceCount()), this.ship.p.x, this.ship.p.y), () => this.ship.addDice(looted));
                setTimeout(() => {
                    this.loot = this.loot.filter(l => l != looted);
                    this.promptSail();
                }, 300);
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;

        const start = Math.floor(this.cam.pan.x / 100) * 100 - 500 - this.cam.shift;

        ctx.fillStyle = '#0000ff11';
        
        for (let i = 0; i < 3000 / 50; i++) {
            ctx.save();
            ctx.translate(start + i * 100 - 500, 0);
            ctx.rotate(Math.PI * 0.25);
            ctx.fillRect(i, -500, 25, 3000);
            ctx.restore();
        }
        
        this.enemy?.draw(ctx);
        this.ship.draw(ctx);
        this.ball.draw(ctx);

        this.loot.forEach(l => l.draw(ctx));
        this.loot.forEach(l => l.drawRim(ctx));

        ctx.strokeStyle = '#ffffffcc';
        ctx.fillStyle = '#03fcf4cc';
        // ctx.translate(this.cam.pan.x, 0);
        // ctx.rotate(this.phase * 0.1);
        ctx.beginPath();
        ctx.moveTo(start + 3000, 2000);
        ctx.lineTo(start, 2000);
        ctx.lineTo(start, 500 + this.phase * 5);
        for (let i = 0; i < 3000 / 50; i++) {
            ctx.quadraticCurveTo(start + i * 50 - 25, 525 - this.phase * 5, start + i * 50, 500 + this.phase * 7 + Math.sin(i * this.wave * 0.5) * 5);
        }
        ctx.closePath();
        // ctx.rect(-10000, HEIGHT - 100 + this.phase * 5, 20000, HEIGHT + 70);
        ctx.fill();
        ctx.stroke();
        // ctx.resetTransform();

        ctx.strokeStyle = '#000';

        [...this.dice, ...this.getChildren()].forEach(e => e.draw(ctx));
        ctx.resetTransform();
        
        [this.splash, this.secondLine, this.bigText, ...this.getButtons()].forEach(b => b.draw(ctx));
    }
}