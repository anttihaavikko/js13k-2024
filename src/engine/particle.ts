import { Entity } from './entity';
import { Game } from './game';
import { Mouse } from './mouse';
import { Vector } from './vector';

export abstract class Particle extends Entity {
    public ratio = 1;
    private start = -1;

    constructor(game: Game, x: number, y: number, width: number, height: number, protected life: number, protected velocity: Vector) {
        super(game, x, y, width, height);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(tick: number, mouse: Mouse): void {
        if (this.dead || this.life < 0) return;
        this.p = {
            x: this.p.x + this.velocity.x,
            y: this.p.y + this.velocity.y
        };
        this.ratio = 1 - (tick - this.start) / (this.life * 1000);
        if (this.start < 0) this.start = tick;
        if (tick - this.start > this.life * 1000) {
            this.dead = true;
        }
    }
}