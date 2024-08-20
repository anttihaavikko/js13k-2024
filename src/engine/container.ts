import { Entity } from './entity';
import { Mouse } from './mouse';
import { Game } from './game';
import { ButtonEntity } from './button';

export class Container extends Entity {
    private children: Entity[] = [];

    constructor(game: Game, x: number = 0, y: number = 0, entities: Entity[] = []) {
        super(game, x, y, 0, 0);
        this.children.push(...entities);
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.children.forEach(c => c.update(tick, mouse));
        if (this.children.some(c => c.dead)) {
            this.children = this.children.filter(c => !c.dead);
        }
    }

    // TODO: commented for optimization
    // public hide(duration = 0.3): void {
    //     this.tween.scale({ x: 0, y: 0 }, duration);
    // }

    // TODO: commented for optimization
    // public show(duration = 0.3): void {
    //     this.tween.scale({ x: 1, y: 1 }, duration);
    // }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        [...this.children].sort((a, b) => a.d - b.d).forEach(c => c.draw(ctx));
        ctx.restore();
    }

    // TODO: commented for optimization
    // public getChild(index: number): Entity {
    //     return this.children[index];
    // }

    public getChildren(): Entity[] {
        return this.children;
    }

    public add(...entity: Entity[]): void {
        this.children.push(...entity);
    }

    // TODO: commented for optimization
    // public clear(): void {
    //     this.children = [];
    // }

    public getButtons(): ButtonEntity[] {
        return [];
    }
}