import { Game } from './game';
import { Mouse } from './mouse';
import { Tween } from './tween';
import { Vector } from './vector';

export abstract class Entity {
    public scale: Vector = { x: 1, y: 1};
    public d = 0;
    public dead: boolean;
    public p: Vector;
    public rotation = 0;
    private animationOffset = 0;
    private previousTick = 0;

    protected animationPhase = 0;
    protected animationPhaseAbs = 0;
    protected animationSpeed = 0.005;
    protected delta = 0;
    
    protected s: Vector;

    protected tween: Tween;

    public constructor(protected game: Game, x: number, y: number, width: number, height: number) {
        this.p = { x, y };
        this.s = { x: width, y: height };
        this.tween = new Tween(this);
        this.animationOffset = Math.random();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(tick: number, mouse: Mouse): void {
        this.delta = tick - this.previousTick;
        this.previousTick = tick;
        this.tween.update(tick);
        this.animationPhase = Math.sin(tick * this.animationSpeed + this.animationOffset);
        this.animationPhaseAbs = Math.abs(this.animationPhase);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public draw(ctx: CanvasRenderingContext2D): void {
    }

    public getCenter(): Vector {
        return {
            x: this.p.x + this.s.x * 0.5,
            y: this.p.y + this.s.y * 0.5
        };
    }

    // TODO: commented for optimization
    // public setPosition(x: number, y: number): void {
    //     this.p = { x, y };
    // }

    public isInside(point: Vector, radius = 0): boolean {
        const c = this.getCenter();
        return point.x > c.x - this.s.x * 0.5 * this.scale.x - radius * 0.5 && 
            point.x < c.x + this.s.x * 0.5 * this.scale.x + radius * 0.5 &&
            point.y > c.y - this.s.y * 0.5 * this.scale.y - radius * 0.5 &&
            point.y < c.y + this.s.y * 0.5 * this.scale.y + radius * 0.5;
    }
}

export const sortByDepth = (a: Entity, b: Entity) => a.d - b.d;