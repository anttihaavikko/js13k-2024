import { drawCircle } from './engine/drawing';
import { quadEaseIn } from './engine/easings';
import { Entity } from './engine/entity';
import { offset, Vector } from './engine/vector';

export class Ball extends Entity {
    private visible: boolean;
    
    public draw(ctx: CanvasRenderingContext2D): void {
        if (this.visible) drawCircle(ctx, this.p, 20, '#333', '#000');
    }

    public shoot(from: Vector, dir: number): void {
        this.visible = true;
        this.tween.setEase(quadEaseIn);
        this.p = from;
        this.tween.move(offset(from, dir, -100), 0.4);
        setTimeout(() => this.visible = false, 400);
    }
}