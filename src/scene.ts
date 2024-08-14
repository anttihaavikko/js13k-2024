import { Mouse } from './engine/mouse';
import { Game } from './engine/game';
import { Container } from './engine/container';
import { Ship } from './ship';
import { Dice } from './dice';
import { WobblyText } from './engine/wobbly';
import { ButtonEntity } from './engine/button';
import { Camera } from './engine/camera';
import { offset } from './engine/vector';

export class Scene extends Container {
    private ship: Ship;
    private enemy: Ship;
    private phase: number;
    private dice: Dice[] = [];
    private splash: WobblyText;
    private action: ButtonEntity;
    private yesButton: ButtonEntity;
    private noButton: ButtonEntity;
    private nextAction: () => void;
    private act: () => void;
    private useDamageDice: boolean;
    private cam: Camera;
    private targetZoom = 0.75;
    private camVelocity = 0;
    private wave: number;
    private level: number = 0;
    private current: Ship;

    constructor(game: Game) {
        super(game, 0, 0, []);

        this.ship = new Ship(game, 0, true);
        this.enemy = new Ship(game, 3000, false);
        this.ship.setOpponent(this.enemy);
        this.enemy.setOpponent(this.ship);
        this.current = this.ship;

        this.splash = new WobblyText(game, 'Lets start by rolling for your cargo!', 35, 400, 120, 0.2, 3, { shadow: 5, align: 'center' });
        this.action = new ButtonEntity(game, 'ROLL', 400, 550, 200, 55, () => this.buttonPress(), game.getAudio(), 20);
        this.yesButton = new ButtonEntity(game, 'YEAH', 330, 550, 120, 55, () => this.confirm(true), game.getAudio(), 20);
        this.noButton = new ButtonEntity(game, 'NOPE', 470, 550, 120, 55, () => this.confirm(false), game.getAudio(), 20);

        this.yesButton.visible = false;
        this.noButton.visible = false;

        this.act = () => this.rollForCargo();

        this.nextAction = () => {
            this.moveDiceTo(this.ship);
        };
        
        // this.ship.addDice();
        this.enemy.addDice(new Dice(this.game, 0, 0));
        this.enemy.addDice(new Dice(this.game, 0, 0));

        this.cam = game.getCamera();
        this.cam.zoom = this.targetZoom;
        this.cam.pan = { x: -400, y: 50 };

        game.onKey((e) => {
            if (e.key == 's') this.ship.sail();
            if (e.key == 'z') this.targetZoom = Math.random() * 0.5 + 0.25;
        });
    }

    private buttonPress(): void {
        this.act();
    }

    private rollForDamage(): void {
        this.useDamageDice = true;
        this.roll(this.current.getDiceCount());
        this.action.visible = false;
        this.splash.content = '';

        if (this.current.isAuto()) {
            setTimeout(() => this.confirm(this.getDamage() < this.dice.length), 750);
            return;
        }
        
        setTimeout(() => {
            this.splash.content = 'Would you like to roll again?';
            this.yesButton.visible = true;
            this.noButton.visible = true;
        }, 500);
    }

    private rollForCargo(): void {
        this.roll(3);
        this.action.visible = false;
        this.splash.content = '';
        
        setTimeout(() => {
            this.splash.content = 'Would you like to roll again?';
            this.yesButton.visible = true;
            this.noButton.visible = true;
        }, 500);
    }

    private nextTurn(): void {
        if (this.level === 0 || this.enemy.isDead()) {
            this.promptSail();
            return;
        }
        this.current = this.current.getOpponent();
        this.promptShot();
    }

    private promptSail(): void {
        this.action.setText('SAIL');
        this.action.visible = true;
        this.act = () => this.nextLevel();
    }

    private getDamage(): number {
        return this.dice.reduce((sum, d) => sum + d.getValue(), 0);
    }

    private promptShot(): void {
        this.act = () => this.rollForDamage();
        this.nextAction = () => {
            const dmg = this.getDamage();
            this.splash.content = `Shot for ${dmg} damage!`;
            this.current.shoot(dmg);
            this.dice = [];
        };

        if (this.current.isAuto()) {
            this.act();
            return;
        }
            
        this.action.setText('SHOOT');
        this.action.visible = true;
        setTimeout(() => this.splash.content = '', 500);
    }

    private nextLevel(): void {
        this.level++;
        this.targetZoom = 0.75;
        this.cam.shift = 0;
        this.cam.pan.y = 50;
        this.ship.sail();
        this.action.setText('');
        this.action.visible = false;
        setTimeout(() => this.activateLevel(), 5000);
    }

    private activateLevel(): void {
        this.targetZoom = 0.5;
        this.cam.pan.y = 350;
        this.cam.shift = 100;
        setTimeout(() => this.promptShot(), 2000);
    }

    private confirm(state: boolean): void {
        this.splash.content = '';

        if (state) {
            this.roll(this.dice.length);
            setTimeout(() => this.nextAction(), 1000);
        } else {
            this.nextAction();
        }

        this.yesButton.visible = false;
        this.noButton.visible = false;

        setTimeout(() => this.nextTurn(), state ? 1500 : 750);
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
        [this.ship, this.enemy, ...this.dice, this.splash, ...this.getButtons()].forEach(e => e.update(tick, mouse));
        const diff = this.ship.p.x - this.getMid() + this.cam.shift;
        if (Math.abs(diff) > 10) this.camVelocity += Math.sign(diff);
        this.cam.pan.x += this.camVelocity;
        this.camVelocity *= 0.9;
        // const z = this.cam.zoom - this.targetZoom
        const z = this.targetZoom - this.cam.zoom;
        if (Math.abs(z) > 0.01) this.cam.zoom += Math.sign(z) * 0.0075;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;
        
        this.enemy.draw(ctx);
        this.ship.draw(ctx);

        ctx.strokeStyle = '#fff';
        ctx.fillStyle = 'cyan';
        // ctx.translate(this.cam.pan.x, 0);
        // ctx.rotate(this.phase * 0.1);
        const start = Math.floor(this.cam.pan.x / 100) * 100 - 500 - this.cam.shift;
        ctx.beginPath();
        ctx.moveTo(start + 3000, 1000);
        ctx.lineTo(start, 1000);
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

        [...this.dice].forEach(e => e.draw(ctx));
        ctx.resetTransform();
        
        [this.splash, ...this.getButtons()].forEach(b => b.draw(ctx));
    }
}