import { Entity } from './entity';
import { clamp01 } from './math';
import { Vector, lerp } from './vector';
import { bounce } from './easings';

type TweenType = 'none' | 'move' | 'scale' | 'rotate';

export class Tween {
    public time = 0;
    private target: Vector;
    private start: Vector;
    private startTime: number;
    private duration: number;
    private active: boolean;
    private type: TweenType = 'none';
    private easeFn = (val: number) => bounce(val);

    constructor(private entity: Entity) {
    }

    public scale(target: Vector, duration: number): void {
        this.type = 'scale';
        const p = this.entity.scale;
        this.start = { x: p.x, y: p.y };
        this.startTween(target, duration);
    }

    public move(target: Vector, duration: number): void {
        this.type = 'move';
        const p = this.entity.p;
        this.start = { x: p.x, y: p.y };
        this.startTween(target, duration);
    }

    // TODO: commented for optimization
    // public rotate(target: number, duration: number): void {
    //     this.type = 'rotate';
    //     const rot = this.entity.rotation;
    //     this.start = { x: rot, y: rot };
    //     this.startTween({ x: target, y: target }, duration);
    // }

    public setEase(ease: (val: number) => number): void {
        this.easeFn = ease;
    }

    private startTween(target: Vector, duration: number): void {
        this.target = target;
        this.duration = duration * 1000;
        this.active = true;
        this.startTime = -1;
    }

    // TODO: commented for optimization
    // public stop(): void {
    //     this.type == 'none';
    //     this.active = false;
    // }

    public update(tick: number): void {
        if (this.startTime < 0 || this.type == 'none') {
            this.startTime = tick;
            return;
        }
        if (!this.active) return;
        this.time = clamp01((tick - this.startTime) / this.duration);
        if (!this.start || !this.target) return;
        const p = lerp(this.start, this.target, this.time, this.easeFn);
        
        if (this.type == 'move') this.entity.p = { x: p.x, y: p.y };
        if (this.type == 'scale') this.entity.scale = { x: p.x, y: p.y };
        if (this.type == 'rotate') this.entity.rotation = p.x;

        this.active = this.time < 1;
    }

    public static run(fn: (pos: number) => void, duration: number = 1000): void {
        for (let i = 0; i < 1; i += 0.01) {
            setTimeout(() => fn(i), i * duration);
        }
    }
}