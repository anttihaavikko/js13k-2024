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
import { randomCell, randomInt, randomSorter } from './engine/random';

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
    private fastWave: number;
    private level: number = 0;
    private current: Ship;
    private ball: Ball;
    private bigText: WobblyText;
    private loot: Dice[] = [];
    private won: boolean;
    private trading: boolean;
    private mp: Mouse;

    constructor(game: Game) {
        super(game, 0, 0, []);

        this.ball = new Ball(this.game, 100, 100, 0, 0);

        this.ship = new Ship(game, '14', 0, this, true);
        this.current = this.ship;

        this.splash = new WobblyText(game, 'Lets start by rolling for your cargo!', 35, 400, 120, 0.2, 3, { shadow: 5, align: 'center', scales: true });
        this.secondLine = new WobblyText(game, '', 25, 400, 165, 0.2, 3, { shadow: 3, align: 'center', scales: true });
        this.bigText = new WobblyText(game, 'GAME NAME', 80, 400, 210, 0.2, 3, { shadow: 7, align: 'center', scales: true });
        this.action = new ButtonEntity(game, 'ROLL', 400, 550, 200, 55, () => this.buttonPress(), game.getAudio(), 20);
        this.yesButton = new ButtonEntity(game, 'YEAH', 470, 550, 120, 55, () => this.answer(true), game.getAudio(), 20);
        this.noButton = new ButtonEntity(game, 'NOPE', 330, 550, 120, 55, () => this.answer(false), game.getAudio(), 20);

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
            if (e.key == 'm') this.game.getAudio().toggleMute();
            // dev keys
            if (e.key == 'a') this.ship.addDice(new Dice(this.game, 0, 0, false));
            if (e.key == 'e') this.enemy.addDice(new Dice(this.game, 0, 0, false));
            if (e.key == 'v') this.doEvent();
            if (e.key == 'z') this.zoom();
            if (e.key == 's') this.ship.sail();
            if (e.key == 'k') this.ship.sink();
            if (e.key == 'x') this.ship.shoot(1);
            // if (e.key == 'z') this.targetZoom = Math.random() * 0.5 + 0.25;
            if (e.key == 'p') this.ship.pose(true);
            if (e.key == 'h') this.game.getCamera().shake(10, 0.15, 1);
        });
    }

    public answer(answered: boolean): void {
        this.info();
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
        this.info(first, second);
        this.yesButton.visible = true;
        this.noButton.visible = true;
        this.yesAct = yes;
        this.noAct = no;
    }

    private buttonPress(): void {
        this.info();
        this.action.visible = false;
        this.act();
    }

    private rollForDamage(): void {
        this.useDamageDice = true;
        this.roll(this.current.getDiceCount());
        setTimeout(() => this.promptForReroll('Would you like to roll again?', `The total is ${this.getDamage()}...`, () => this.shoot()), 500);
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
        if (dmg == 13) {
            this.current.talk('UNLUCKY 13!');
            this.game.getAudio().bad();
        }
        if (dmg == 13 || dmg == 0) {
            this.nextTurn();
            return;
        } 
        if (!this.current.getOpponent().isAuto()) {
            this.info(`Incoming ${dmg} damage!`, 'Select cargo taking the hit...');
            this.ship.addDamage(dmg);
            return;
        }
        this.current.shoot(dmg);
    }

    private rollForCargo(): void {
        this.roll(2);
        this.action.visible = false;
        this.info();
        
        setTimeout(() => {
            this.info('Would you like to roll again?');
            this.yesButton.visible = true;
            this.noButton.visible = true;
        }, 500);
    }

    public nextTurn(): void {
        this.dice = [];
        this.info();
        if (this.won) {
            this.promptSail();
            return;
        }
        if (this.enemy.isDead() && !this.won) {

            this.won = true;
            this.enemy.sink();
            this.current = this.ship;

            this.addLoot();

            setTimeout(() => {
                this.game.getAudio().win();
                this.promptForReroll('Victory! Nicely done!', 'Would you like to reroll the loot?', () => {
                    this.promptSail();
                    this.showGreed();
                });
            }, 750);
            return;
        }
        this.current = this.current.getOpponent();

        if (this.current.isUnlucky() && !this.current.getOpponent().isUnlucky()) {
            setTimeout(() => {
                this.current.talk('UNLUCKY 13!');
                this.game.getAudio().bad();
                setTimeout(() => this.nextTurn(), 500);
            }, 500);
            return;
        }

        this.current.pose(true);
        this.promptShot();
    }

    private addLoot(): void {
        // const m = this.getMid() + (80 + this.cam.shift + 200) / this.cam.zoom + offset;
        const m = this.enemy.p.x - 100;
        const amt = Math.min(this.level + 1, 6);
        this.loot = [];
        for (let i = 0; i < amt; i++) {
            const d = new Dice(this.game, m, 300);
            d.roll(m + i * 120 - 120 * ((amt - 1) * 0.5), 420);
            d.float(true);
            d.allowPick(true);
            this.loot.push(d);
        }
        [...this.loot].sort(randomSorter).slice(0, this.getSpiceCount()).forEach(l => l.makeSpice());
    }

    private getSpiceCount(): number {
        return (this.level - 1) / 3 + 1;
    }

    private showGreed(): void {
        this.info('Don\'t be greedy!', 'You can only take one...');
    }

    public info(first: string = '', second: string = '', big: string = ''): void {
        this.splash.toggle(first);
        setTimeout(() => {
            this.secondLine.toggle(second);
            this.bigText.toggle(big);
        }, 150);
    }

    private promptSail(): void {
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
            this.info('Lost all your cargo!', '', 'GAME OVER');
            this.ship.sink();
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
        this.ship.disablePicking();
        this.won = false;
        this.trading = false;
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

            this.enemy.addSpice(this.getSpiceCount() - 1);

        }, 4000);
        setTimeout(() => this.activateLevel(), 5000);
    }

    private getEnemyName(): string {
        return this.level % 2 == 0 ? randomCell(['VND', 'MRC', 'GIT', 'POO', 'SIN', 'CSS', 'ASH', 'CAP']) : (13 - (this.level - 1) * 0.5).toString();
    }

    private getTaunt(): string {
        return randomCell(['FILTHY RAT', 'HOW DARE YOU', 'YOU TRAITOR']);
    }

    private activateLevel(): void {
        this.zoom();

        if (this.level % 2 == 0) {
            this.enemy.makeFriendly();
            this.doEvent();
            return;
        }

        this.enemy.makeAngry();
        setTimeout(() => {
            this.info('COMMENCE COMBAT!', 'This will not end peacefully...');
            this.enemy.talk(this.getTaunt());
            this.game.getAudio().warn();
        }, 1000);
        setTimeout(() => this.promptShot(), 2000);
    }

    private thank(): void {
        this.info('There you go!', 'Hope that helps...');
        setTimeout(() => this.enemy.sail(-1), 700);
    }

    private decline(): void {
        this.info('Ok then!', 'Good luck on your journey...');
        this.enemy.sail(-1);
    }

    public pick(d: Dice): void {
        if (this.trading) {
            this.game.getAudio().buttonClick();
            d.allowPick(false);
            this.enemy.giveDice(d.getValue());
            this.ship.remove(d);
            this.ship.repositionDice();
            setTimeout(() => {
                if (!this.ship.hasSpice() || !this.enemy.hasDice()) {
                    this.trading = false;
                    this.ship.disablePicking();
                    this.thank();
                }
            }, 500);
        }
    }

    private doEvent(): void {
        const hasSpice = this.ship.hasSpice();

        switch (randomInt(0, 3)) {
            case 0:
                this.enemy.removeSpice();
                setTimeout(() => {
                    this.game.getAudio().greet();
                    this.enemy?.hop();
                    this.promptSail();
                    this.info('Ahoy mate! Interested in trade?', hasSpice ? 'I\'ll give you fresh cargo for your spice...' : 'Looks like you don\'t have any spice though...');
                    if (hasSpice) {
                        this.ship.allowSpicePick();
                        this.trading = true;
                    }
                }, 1000);
                break;
            case 1:
                setTimeout(() => {
                    this.game.getAudio().greet();
                    this.enemy?.hop();
                    this.promptAnswer('Hello there mate!', 'Would you like to reroll all your cargo?', () => {
                        this.ship.rerollAll();
                        setTimeout(() => {
                            this.promptSail();
                            this.thank();
                        }, 500);
                    }, () => {
                        this.promptSail();
                        this.decline();
                    });
                }, 1000);
                break;
            case 2:
                this.enemy.hide();
                this.promptSail();
                this.info('Someone must have sunk here!', 'Free loot I guess...');
                this.addLoot();
                break;
            case 3:
                this.enemy.addPlate();
                setTimeout(() => {
                    this.game.getAudio().greet();
                    this.enemy?.hop();
                    this.promptAnswer('Ahoy! I could plate one of your cargo!', 'It\'ll only be able to receive 1 damage at a time....', () => {
                        this.ship.addPlate();
                        setTimeout(() => {
                            this.promptSail();
                            this.thank();
                        }, 500);
                    }, () => {
                        this.promptSail();
                        this.decline();
                    });
                }, 1000);
                break;
            default:
                break;
        }
    }

    private zoom(): void {
        const left = this.ship?.getCargoWidth();
        const right = this.enemy?.getCargoWidth() ?? 0;
        const max = Math.max(left, right);
        this.targetZoom = 500 / (1000 + left + right);
        this.cam.pan.y = 350 + max;
        this.cam.shift = 100 - max;
    }

    private moveDiceTo(ship: Ship): void {
        this.dice.forEach((d, i) => d.move(offset(ship.getDicePos(i + ship.getDiceCount()), this.ship.p.x, this.ship.p.y), () => ship.addDice(d)));
        setTimeout(() => {
            this.dice = [];
        }, 300);
    }

    private getMid(): number {
        return (this.cam.pan.x + 400 - this.cam.shift);
    }

    public roll(amount: number): void {
        this.dice = [];
        for (let i = 0; i < amount; i++) {
            // const m = this.getMid() + (70 + this.cam.shift) / this.cam.zoom;
            const m = this.current.getRollPos();
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
        this.fastWave = Math.sin(tick * 0.0007);
        [this.ball, this.ship, this.enemy, ...this.dice, this.splash, this.secondLine, this.bigText, ...this.getButtons()].filter(e => !!e).forEach(e => e.update(tick, mouse));
        this.mp = this.ship.offsetMouse(mouse, this.cam, this.cam.pan.x + 200, 540);
        this.loot.forEach(l => l.update(tick, this.mp));
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
                this.showGreed();
                this.game.getAudio().buttonClick();
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
            ctx.fillRect(i, -2000, 25, 5000);
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
            const top = Math.sin(start + i * 50 + 25 * this.wave) * 8 + Math.cos(start + i * 25 + 12 * this.fastWave) * 8 + 20;
            ctx.quadraticCurveTo(start + i * 50 - 25, 525 - this.phase * 5 - top, start + i * 50, 500 + this.phase * 7 - top);
        }
        ctx.closePath();
        // ctx.rect(-10000, HEIGHT - 100 + this.phase * 5, 20000, HEIGHT + 70);
        ctx.fill();
        ctx.stroke();
        // ctx.resetTransform();

        ctx.strokeStyle = '#000';

        [...this.dice, ...this.getChildren()].forEach(e => e.draw(ctx));

        // draw mouse point
        // ctx.fillRect(this.mp.x, this.mp.y, 20, 20);
        
        ctx.resetTransform();
        
        [this.splash, this.secondLine, this.bigText, ...this.getButtons()].forEach(b => b.draw(ctx));
    }
}