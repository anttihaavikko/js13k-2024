import { HEIGHT } from './index';
import { Mouse } from './engine/mouse';
import { Game } from './engine/game';
import { Container } from './engine/container';
import { Ship } from './ship';
import { Dice } from './dice';
import { WobblyText } from './engine/wobbly';
import { ButtonEntity } from './engine/button';

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

    constructor(game: Game) {
        super(game, 0, 0, []);
        this.ship = new Ship(game, 300, true);
        this.enemy = new Ship(game, 1300, false);

        this.splash = new WobblyText(game, 'Lets start by rolling for your cargo!', 35, 400, 120, 0.2, 3, { shadow: 5, align: 'center' });
        this.action = new ButtonEntity(game, 'ROLL', 400, 550, 200, 55, () => this.buttonPress(), game.getAudio(), 20);
        this.yesButton = new ButtonEntity(game, 'YEAH', 330, 550, 120, 55, () => this.confirm(true), game.getAudio(), 20);
        this.noButton = new ButtonEntity(game, 'NOPE', 470, 550, 120, 55, () => this.confirm(false), game.getAudio(), 20);

        this.yesButton.visible = false;
        this.noButton.visible = false;

        this.act = () => this.rollForCargo();

        this.nextAction = () => {
            this.moveDiceTo(this.ship);
            this.act = () => this.rollForDamage();
            this.nextAction = () => {
                console.log('dealing damage', this.dice.reduce((sum, d) => sum + d.getValue(), 0));
                this.dice = [];
            };
        };
        
        // this.ship.addDice();
        this.enemy.addDice(new Dice(this.game, 0, 0));
        this.enemy.addDice(new Dice(this.game, 0, 0));

        game.getCamera().zoom = 0.5;

        // game.onKey((e) => {
        // });
    }

    private buttonPress(): void {
        this.act();
    }

    private rollForDamage(): void {
        this.useDamageDice = true;
        this.roll(this.ship.getDiceCount());
        this.action.visible = false;
        this.splash.content = '';
        
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

    private promptShot(): void {
        this.action.setText('SHOOT');
        this.action.visible = true;
    }

    private confirm(state: boolean): void {
        this.splash.content = '';

        if (state) {
            this.roll(this.dice.length);
            setTimeout(() => this.nextAction(), 750);
        } else {
            this.nextAction();
        }

        this.yesButton.visible = false;
        this.noButton.visible = false;

        setTimeout(() => this.promptShot(), state ? 1500 : 750);
    }

    private zoom(): void {
        // const left = this.ship.getCargoWidth();
        // const right = this.enemy.getCargoWidth();
        // this.game.getCamera().zoom = 500 / (1000 + left + right);
        // this.game.getCamera().offset = { x: (right - left) * 0.5, y: 0 };
    }

    private moveDiceTo(ship: Ship): void {
        this.dice.forEach((d, i) => d.move(ship.getDicePos(i + ship.getDiceCount()), () => ship.addDice(d)));
        setTimeout(() => {
            this.dice = [];
            this.zoom();
        }, 300);
    }

    public roll(amount: number): void {
        this.dice = [];
        for (let i = 0; i < amount; i++) {
            const d = new Dice(this.game, 750, 800, this.useDamageDice);
            d.roll(750 + i * 120 - 120 * ((amount - 1) * 0.5), 570);
            this.dice.push(d);
        }
    }

    public getButtons(): ButtonEntity[] {
        return [this.action, this.yesButton, this.noButton];
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.phase = Math.abs(Math.sin(tick * 0.002));
        [this.ship, this.enemy, ...this.dice, this.splash, ...this.getButtons()].forEach(e => e.update(tick, mouse));
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;

        ctx.translate(0, 300);

        ctx.fillStyle = '#fff';
        
        this.ship.draw(ctx);
        this.enemy.draw(ctx);

        ctx.beginPath();
        ctx.rect(-10000, HEIGHT - 100 + this.phase * 5, 20000, HEIGHT + 70);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        [...this.dice].forEach(e => e.draw(ctx));
        ctx.resetTransform();
        
        [this.splash, ...this.getButtons()].forEach(b => b.draw(ctx));
    }
}