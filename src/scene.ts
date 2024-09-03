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

const END_LEVEL = 13 * 2;

export class Scene extends Container {
    private ship: Ship;
    private enemy: Ship;
    private dice: Dice[] = [];
    private splash: WobblyText;
    private secondLine: WobblyText;
    private action: ButtonEntity;
    private yesButton: ButtonEntity;
    private noButton: ButtonEntity;
    // private fullScreenButton: ButtonEntity;
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
    private prompted: NodeJS.Timeout;
    private extraRerollUsed: boolean;
    private clouds: { x: number, y: number, scale: number, speed: number }[];

    constructor(game: Game) {
        super(game, 0, 0, []);

        this.ball = new Ball(this.game, 100, 100, 0, 0);

        this.ship = new Ship(game, '14', 0, this, true);
        this.current = this.ship;

        this.animationSpeed = 0.002;

        this.splash = new WobblyText(game, 'Lets start by rolling for your cargo!', 35, 400, 60, 0.2, 3, { shadow: 4, align: 'center', scales: true });
        this.secondLine = new WobblyText(game, '', 25, 400, 105, 0.2, 3, { shadow: 3, align: 'center', scales: true });
        this.bigText = new WobblyText(game, '~ COUP AHOO ~', 80, 400, 150, 0.2, 3, { shadow: 6, align: 'center', scales: true });
        this.action = new ButtonEntity(game, 'ROLL', 800 - 100 - 10, 360, 200, 55, () => this.buttonPress(), game.audio, 20);
        this.yesButton = new ButtonEntity(game, '', 800 - 70 - 10, 360, 140, 55, () => this.answer(true), game.audio, 20);
        this.noButton = new ButtonEntity(game, '', 800 - 70 * 3 - 10 * 2, 360, 140, 55, () => this.answer(false), game.audio, 20);
        // this.fullScreenButton = new ButtonEntity(game, '[ ]', 10 + 27, 360, 55, 55, () => this.goFullScreen(), game.audio, 20);

        this.yesButton.visible = false;
        this.noButton.visible = false;

        this.promptAction('ROLL', () => {
            this.rollForCargo();
            setTimeout(() => this.promptAnswerWith('ROLL', 'KEEP', 'Cast the dice once more?', '', () => {
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

        this.cam = game.camera;
        this.cam.zoom = this.targetZoom;
        this.cam.pan = { x: -100, y: -20 };
        this.cam.shift = 0;

        this.clouds = Array.from(Array(50)).map((_, i) => ({ x: -1000 + i * 200, y: Math.random() * 600 - 300, speed: Math.random(), scale: 0.75 + Math.random() * 1.3 }));

        game.onKey((e) => {
            if (e.key == 'm') this.game.audio.toggleMute();
            // if (e.key == 'f') this.game.goFullScreen();
            // dev keys
            // if (e.key == 'w') this.triggerWin();
            // if (e.key == 'a') this.ship.addDice(new Dice(this.game, 0, 0, false));
            // if (e.key == 'e') this.enemy.addDice(new Dice(this.game, 0, 0, false));
            // if (e.key == 'v') this.doEvent();
            // if (e.key == 'f') this.ship.tryRepair();
            // if (e.key == 'z') this.zoom();
            // if (e.key == 's') this.nextLevel();
            // if (e.key == 'l') this.current.badLuck();
            // if (e.key == 'd') this.ship.hurt(1);
            // if (e.key == 'j') this.ship.hop();
            // if (e.key == 'k') this.ship.sink();
            // if (e.key == 'p') this.game.pitcher.pitchTo(0, 5);
            // if (e.key == 'R') this.restart();
            // if (e.key == 'x') this.ship.shoot(1);
            // if (e.key == 'p') this.ship.pose(true);
            // if (e.key == 'h') this.game.camera.shake(10, 0.15, 1);
            // if (e.key == 'c') {
            //     const crew = this.ship.createCrew(-70, -100);
            //     crew.crewRole = this.ship.getAvailableRole();
            //     this.ship.addCrew(crew.clone());
            // }
            // if (e.key == 'C') {
            //     const crew = this.enemy.createCrew(-70, -100);
            //     crew.crewRole = this.enemy.getAvailableRole();
            //     this.enemy.addCrew(crew.clone());
            // }
        });
    }

    // private goFullScreen(): void {
    //     this.fullScreenButton.visible = false;
    //     this.game.goFullScreen();
    // }

    public restart(): void {
        this.game.pitcher.pitchFrom(0.2);
        this.game.pitcher.pitchTo(1, 5);
        this.game.audio.setVolume(0.7);
        // this.game.scene = null;
        this.game.changeScene(new Scene(this.game));
    }

    public answer(answered: boolean): void {
        this.info();
        this.yesButton.visible = false;
        this.noButton.visible = false;
        if (answered) this.yesAct();
        if (!answered) this.noAct();
    }

    private reroll(): void {
        this.current.openMouth();
        [...this.dice, ...this.loot].forEach(l => l.reroll());
        this.checkForBlankRepair();
    }

    private promptAction(label: string, action: () => void): void {
        clearTimeout(this.prompted);
        this.prompted = setTimeout(() => {
            this.action.visible = true;
            this.action.setText(label);
            this.act = action;
        }, 500);
    }

    private promptAnswerWith(positive: string, negative: string, first: string, second: string, yes: () => void, no: () => void): void {
        clearTimeout(this.prompted);
        this.yesButton.setText(positive);
        this.noButton.setText(negative);
        this.info(first, second);
        this.yesButton.visible = true;
        this.noButton.visible = true;
        this.yesAct = yes;
        this.noAct = no;
    }

    private promptAnswer(first: string, second: string, yes: () => void, no: () => void): void {
        this.promptAnswerWith('YEAH', 'NOPE', first, second, yes, no);
    }

    private buttonPress(): void {
        this.info();
        this.action.visible = false;
        if (this.act) this.act();
    }

    private rollForDamage(): void {
        this.useDamageDice = true;
        this.roll(this.current.getDiceCount());
        setTimeout(() => this.promptForReroll('Would you like to roll again?', `The total is ${this.getDamage()}...`, () => this.shoot()), 500);
    }

    private rerollOrAct(first: string, second: string, after: () => void): void {
        if (this.current.has('navigator') && !this.extraRerollUsed) {
            this.extraRerollUsed = true;
            this.promptForReroll(first, this.loot.length > 0 ? second : `The total is ${this.getDamage()}...`, after);
            return;
        }
        after();
        this.dice = [];
    }

    private promptForReroll(first: string, second: string, after: () => void): void {
        if (!this.current.player) {
            const dmg = this.getDamage();
            if (dmg < this.dice.length) {
                this.reroll();
                setTimeout(() => this.rerollOrAct(first, second, after), 750);
                return;
            }
            after();
            return;
        }
        this.promptAnswerWith('ROLL', 'KEEP', first, second, () => {
            this.reroll();
            setTimeout(() => this.rerollOrAct(first, second, after), 750);
        }, () => {
            after();
            this.dice = [];
        });
    }

    public shoot(): void {
        const dmg = this.getDamage();
        if (dmg == 13) {
            this.current.badLuck();
        }
        if (dmg == 13 || dmg == 0) {
            this.nextTurn();
            return;
        } 
        if (this.current.opponent.player && this.current.opponent.getDiceCount() > 1) {
            this.game.audio.incoming();
            this.info(`Incoming ${dmg} damage!`, 'Select cargo taking the hit...');
            this.ship.addDamage(dmg);
            return;
        }
        this.current.shoot(dmg);
    }

    private rollForCargo(): void {
        // this.fullScreenButton.visible = false;
        this.roll(2, -80, -40);
        this.action.visible = false;
        this.info();
        
        setTimeout(() => {
            this.info('Cast the dice once more?');
            this.yesButton.visible = true;
            this.noButton.visible = true;
        }, 500);
    }

    public nextTurn(): void {
        this.extraRerollUsed = false;
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
                this.game.audio.win();
                this.promptForReroll('Victory! Nicely done!', 'Would you like to reroll the loot?', () => {
                    this.promptSail();
                    this.showGreed();
                });
            }, 750);
            return;
        }
        this.current = this.current.opponent;

        if (this.current.isUnlucky() && !this.current.opponent.isUnlucky()) {
            setTimeout(() => {
                this.current.badLuck();
                this.game.audio.bad();
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
        return Math.min((this.level - 1) / 3 + 1, 3);
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
        this.promptAction('SET SAIL', () => this.nextLevel());
    }

    private getDamage(): number {
        return this.dice.reduce((sum, d) => sum + d.getValue(), 0);
    }

    private promptShot(): void {
        this.current.ball = this.ball;

        if (this.current.isDead()) {
            this.ship.pose(false);
            this.enemy.pose(true);
            this.game.pitcher.pitchTo(0, 5);
            this.info('Down to Davy Jones\' Locker...', '', 'GAME OVER');
            this.promptAction('TRY AGAIN?', () => this.restart());
            setTimeout(() => this.ship.sink(), 100);
            return;
        }
        if (!this.current.player) {
            setTimeout(() => this.rollForDamage(), 1000);
            return;
        }
        this.promptAction('SHOOT', () => this.rollForDamage());
        this.current.pose(true);
    }

    private nextLevel(): void {
        clearTimeout(this.prompted);
        this.ship.pose(false);
        this.extraRerollUsed = false;
        this.ship.disablePicking();
        this.won = false;
        this.trading = false;
        this.current = this.ship;
        this.level++;
        this.targetZoom = 0.75;
        this.cam.shift = 0;
        this.cam.pan.y = -25;
        this.ship.sail();
        this.ship.openMouth();
        this.action.setText('');
        this.action.visible = false;
        this.loot.forEach(l => l.allowPick(false));
        setTimeout(() => {
            this.enemy = new Ship(this.game, this.getEnemyName(), (this.level - 1) * 2000 + 3000, this, false);
            this.ship.opponent = this.enemy;
            this.enemy.opponent = this.ship;
            for (let index = 0; index < 1 + (this.level - 1) * 0.5; index++) {
                this.enemy.addDice(new Dice(this.game, 0, 0));
            }

            this.enemy.addSpice(this.getSpiceCount() - 1);

        }, 4000);
        setTimeout(() => this.activateLevel(), 5000);
    }

    private getEnemyName(): string {
        if (this.level > END_LEVEL) return `∞ × ${this.level - END_LEVEL}`;
        return this.level % 2 == 0 ? randomCell(['VND', 'MRC', 'GIT', 'POO', 'SIN', 'CSS', 'ASH', 'CAP']) : (13 - (this.level - 1) * 0.5).toString();
    }

    private activateLevel(): void {
        this.zoom();

        this.loot = [];

        if (this.level % 2 == 0 && this.level <= END_LEVEL) {
            this.enemy.friendly = true;
            const hasSpice = this.ship.hasSpice();

            if (this.level === END_LEVEL) {
                this.enemy.hidden = true;
                setTimeout(() => {
                    // this.targetZoom = 0.75;
                    // this.cam.shift = 0;
                    // this.cam.pan.y = -50;
                    this.zoom();
                    this.ship.addCrown();
                    this.ship.setName('WIN');
                    this.ship.pose(true);
                    this.game.audio.win();
                    this.info('You\'ve defeated the whole 13th fleet!', '', 'THE END?');
                    this.promptSail();
                }, 1000);
                return;
            }

            // events
            switch (randomInt(0, 4 - (this.ship.getAvailableRole() ? 0 : 1))) {
                case 0: {
                    this.enemy.removeSpice();
                    setTimeout(() => {
                        this.game.audio.greet();
                        this.enemy?.hop();
                        this.promptSail();
                        this.info('Ahoy mate! Interested in trade?', hasSpice ? 'I\'ll give you fresh cargo for your spice...' : 'Looks like you don\'t have any spice though...');
                        if (hasSpice) {
                            this.ship.allowSpicePick();
                            this.trading = true;
                        }
                    }, 1000);
                    break;
                }
                case 1: {
                    setTimeout(() => {
                        this.game.audio.greet();
                        this.enemy?.hop();
                        this.promptAnswerWith('ROLL', 'KEEP', 'Hello there mate!', 'Would you like to reroll all your cargo?', () => {
                            this.ship.rerollAll();
                            this.thank();
                        }, () => this.decline());
                    }, 1000);
                    break;
                }
                case 2: {
                    this.enemy.hidden = true;
                    this.promptSail();
                    this.info('Free cargo floating in the drink!', 'A vessel must have sunken here...');
                    this.addLoot();
                    break;
                }
                case 3: {
                    this.enemy.addPlate();
                    setTimeout(() => {
                        this.game.audio.greet();
                        this.enemy?.hop();
                        this.promptAnswer('Ahoy! I could plate one of your cargo!', 'It\'ll only be able to receive 1 damage at a time....', () => {
                            this.ship.addPlate();
                            this.thank();
                        }, () => this.decline());
                    }, 1000);
                    break;
                }
                case 4: {
                    this.enemy.clearCargo();
                    const crew = this.enemy.createCrew(-70, -100);
                    crew.crewRole = this.ship.getAvailableRole();
                    this.enemy.addCrew(crew);
                    setTimeout(() => {
                        this.game.audio.greet();
                        this.enemy?.hop();
                        this.promptAnswer(`Oi! Want to hire this ${crew.crewRole}?`, crew.getRoleDescription(), () => {
                            this.enemy.removeCrew();
                            this.ship.addCrew(crew.clone());
                            this.thank();
                        }, () => this.decline());
                    }, 1000);
                    break;
                }
            }
            return;
        }

        if (this.level == END_LEVEL - 1) this.enemy.addCrown();
        if (this.level >= END_LEVEL - 1) this.addEnemyCrew(2);
        if (this.level > 13) this.addEnemyCrew(1);

        this.enemy.dude.face.angry = true;
        setTimeout(() => {
            this.info('Man the cannons! Battle stations!', 'There\'s no parley in sight...');
            this.enemy.talk(randomCell(['FILTHY RAT', 'HOW DARE YOU', 'YOU TRAITOR', 'LAND LUBBER']));
            this.game.audio.warn();
        }, 1000);
        setTimeout(() => this.promptShot(), 2000);
    }

    private addEnemyCrew(amount: number): void {
        for (let i = 0; i < amount; i++) {
            const crew = this.enemy.createCrew(-70, -100);
            crew.face.angry = true;
            crew.crewRole = this.enemy.getAvailableRole();
            this.enemy.addCrew(crew.clone());
        }
    }

    private thank(): void {
        this.enemy.openMouth();
        this.info('All aboard, you\'re good to go!', 'May that steer you true...');
        setTimeout(() => this.npcLeave(), 500);
    }

    private npcLeave(): void {
        this.enemy.sail(-1);
        this.promptSail();
    }

    private decline(): void {
        this.enemy.openMouth();
        this.info('Aye, all set!', 'Fair winds on your voyage...');
        // "May the tides be ever in your favor..."
        // "Safe travels on the open seas..."
        this.npcLeave();
    }

    public pick(d: Dice): void {
        if (this.trading) {
            this.game.audio.pick();
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

    private zoom(): void {
        const left = this.ship?.getCargoWidth();
        const right = this.enemy?.getCargoWidth() ?? 0;
        const max = Math.max(left, right);
        this.targetZoom = Math.min(750 / (1500 + left + right), 0.5);
        this.cam.pan.y = 220 + max - 100 / this.cam.zoom;
        this.cam.shift = 100 - left + right * this.targetZoom * 0.25;
    }

    private moveDiceTo(ship: Ship): void {
        ship.openMouth();
        this.game.audio.pick();
        this.dice.forEach((d, i) => d.move(offset(ship.getDicePos(i + ship.getDiceCount()), this.ship.p.x, this.ship.p.y), () => ship.addDice(d)));
        setTimeout(() => {
            this.dice = [];
        }, 300);
    }

    public roll(amount: number, offX: number = 0, offY: number = 0): void {
        this.current.openMouth();
        const perRow = 9;
        let row = 0;
        this.dice = [];
        for (let i = 0; i < amount; i++) {
            if (i > 0 && i % perRow == 0) row++;
            // const m = this.getMid() + (70 + this.cam.shift) / this.cam.zoom;
            const m = this.current.getRollPos();
            const d = new Dice(this.game, m, 800, this.useDamageDice);
            d.roll(m + offX + i * 120 - 120 * (Math.min(amount - 1, perRow) * 0.5) - 120 * perRow * Math.floor(i / perRow), 450 + row * 120 + offY);
            this.dice.push(d);
        }
        this.checkForBlankRepair();
    }

    private checkForBlankRepair(): void {
        setTimeout(() => {
            if (this.dice.some(d => d.getValue() === 0)) this.current.tryRepair();
        }, 500);
    }

    public getButtons(): ButtonEntity[] {
        // return [this.action, this.yesButton, this.noButton, this.fullScreenButton];
        return [this.action, this.yesButton, this.noButton];
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        if (this.delta > 1000) return;
        this.wave = Math.sin(tick * 0.0003);
        this.fastWave = Math.sin(tick * 0.0007);
        [this.ball, this.ship, this.enemy, ...this.dice, this.splash, this.secondLine, this.bigText, ...this.getButtons()].filter(e => !!e).forEach(e => e.update(tick, mouse));
        this.loot.forEach(l => l.update(tick, this.mp));
        this.mp = { ...mouse };
        const diff = this.ship.p.x - this.cam.pan.x - 400 + this.cam.shift * 2;
        if (Math.abs(diff) > 10) this.camVelocity += Math.sign(diff);
        this.cam.pan.x += this.camVelocity * 0.05 * this.delta;
        this.camVelocity *= 0.9;
        const z = this.targetZoom - this.cam.zoom;
        if (Math.abs(z) > 0.01) this.cam.zoom += Math.sign(z) * 0.0075 * 0.05 * this.delta;

        if (this.loot.length > 0 && mouse.pressing) {
            const looted = this.loot.find(l => l.isHovering());
            if (looted) {
                this.showGreed();
                this.game.audio.pick();
                this.yesButton.visible = false;
                this.noButton.visible = false;
                this.loot.forEach(l => l.allowPick(false));
                looted.float(false);
                looted.move(offset(this.ship.getDicePos(this.ship.getDiceCount()), this.ship.p.x, this.ship.p.y), () => this.ship.addDice(looted));
                this.ship.openMouth();
                setTimeout(() => {
                    this.loot = this.loot.filter(l => l != looted);
                    this.promptSail();
                }, 300);
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const start = Math.floor(this.cam.pan.x / 100) * 100 - 500 - this.cam.shift;

        // background
        ctx.strokeStyle = '#0000ff11';
        ctx.lineWidth = 45 + 10 * this.animationPhaseAbs;
        ctx.lineCap = 'round';
        ctx.setLineDash([0, 35]);
        for (let i = 0; i < 60; i++) {
            ctx.save();
            ctx.translate(start + i * 100 - 500, 0);
            ctx.rotate(Math.PI * 0.25);
            ctx.beginPath();
            ctx.moveTo(i, -2000);
            ctx.lineTo(i, 5000);
            ctx.stroke();
            ctx.restore();
        }

        // clouds
        // ctx.globalCompositeOperation = 'overlay';
        this.clouds.forEach(c => {
            ctx.lineWidth = 100 * c.scale;
            ctx.setLineDash([0, 80 * c.scale]);
            // ctx.lineDashOffset = Math.sin(c.x * 0.001) * 100;
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff22';
            ctx.ellipse(c.x, c.y, 140 * c.scale, 30 * c.scale, 0, 0, Math.PI * 2);
            ctx.stroke();
            c.x -= c.speed * this.delta * 0.03;
            if (c.x < this.cam.pan.x - 1000) c.x = this.cam.pan.x + 2500 + Math.random() * 1000;
        });

        // ctx.globalCompositeOperation = 'source-over';
        ctx.setLineDash([]);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;
        
        this.enemy?.draw(ctx);
        this.ship.draw(ctx);
        this.ball.draw(ctx);

        this.loot.forEach(l => l.draw(ctx));

        // water
        ctx.strokeStyle = '#ffffffbb';
        ctx.fillStyle = '#03fcf477';
        // ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.moveTo(start + 3000, 2000);
        ctx.lineTo(start, 2000);
        ctx.lineTo(start, 500 + this.animationPhaseAbs * 5);
        for (let i = 0; i < 6000 / 50; i++) {
            const top = Math.sin(start + i * 50 + 25 * this.wave) * 8 + Math.cos(start + i * 25 + 12 * this.fastWave) * 8 + 20;
            ctx.quadraticCurveTo(start + i * 50 - 25, 525 - this.animationPhaseAbs * 5 - top, start + i * 50, 500 + this.animationPhaseAbs * 7 - top);
        }
        ctx.fill();
        ctx.stroke();
        // ctx.globalCompositeOperation = 'source-over';

        [...this.dice, ...this.getChildren()].forEach(e => e.draw(ctx));

        if (this.mp) {
            const p = new DOMPoint(this.mp.x, this.mp.y).matrixTransform(ctx.getTransform().inverse());
            this.mp = { x: p.x, y: p.y };
        }
        
        ctx.resetTransform();
        
        [this.splash, this.secondLine, this.bigText, ...this.getButtons()].forEach(b => b.draw(ctx));
    }
}