import { HEIGHT } from './index';
import { Mouse } from './engine/mouse';
import { Game } from './engine/game';
import { Container } from './engine/container';
import { Ship } from './ship';
import { Dice } from './dice';

export class Scene extends Container {
    private ship: Ship;
    private enemy: Ship;
    private phase: number;
    private dice: Dice[] = [];

    constructor(game: Game) {
        super(game, 0, 0, []);
        this.ship = new Ship(game, 300, false);
        this.enemy = new Ship(game, 1300, true);
        
        // this.ship.addDice();

        game.getCamera().zoom = 0.5;

        game.onKey((e) => {
            if (e.key === 'a') this.moveDiceTo(this.ship);
            if (e.key === 'e') this.moveDiceTo(this.enemy);
            if (e.key === 'r') this.roll();
        });
    }

    private zoom(): void {
        const left = Math.floor((this.ship.getDiceCount() - 1) / 3) * 100;
        const right = Math.floor((this.enemy.getDiceCount() - 1) / 3) * 100;
        this.game.getCamera().zoom = 500 / (1000 + left + right);
        // this.game.getCamera().offset = { x: (right - left) * 0.5, y: 0 };
    }

    private moveDiceTo(ship: Ship): void {
        this.dice.forEach((d, i) => d.move(ship.getDicePos(i + ship.getDiceCount()), () => ship.addDice(d)));
        setTimeout(() => {
            this.dice = [];
            this.zoom();
        }, 300);
    }

    public roll(): void {
        const d = new Dice(this.game, 750, 800);
        d.roll(750, 600);
        this.dice = [d];
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.phase = Math.abs(Math.sin(tick * 0.003));
        [this.ship, this.enemy, ...this.dice].forEach(e => e.update(tick, mouse));
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;

        ctx.translate(0, 300);

        ctx.fillStyle = '#fff';
        
        this.ship.draw(ctx);
        this.enemy.draw(ctx);

        ctx.beginPath();
        ctx.rect(-10000, HEIGHT - 100 + this.phase * 5, 20000, HEIGHT + 50);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        [...this.dice].forEach(e => e.draw(ctx));
    }
}