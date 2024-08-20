import { font } from './constants';
import { TextEntity } from './text';

export class MultilineTextEntity extends TextEntity {
    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.rotate(this.options?.angle ?? 0);
        const mod = this.options?.scales ? this.ratio : 1;
        ctx.font =`${this.fontSize * mod}px ${font}`;
        ctx.textAlign = this.options?.align ?? 'center';

        const lineHeight = this.fontSize * 1.25;
        const lines = this.content.split('\n');
        lines.forEach((line, row) => {
            const offset =  + row * lineHeight - (lines.length - 1) * lineHeight;
            if (this.options?.shadow) {
                ctx.fillStyle = '#000';
                ctx.fillText(line.replace(/\|/g, ''), this.p.x + this.options.shadow, this.p.y + this.options.shadow + offset);
            }
            ctx.fillStyle = this.options?.color ?? '#fff';
            ctx.fillText(line, this.p.x, this.p.y + offset);
        });
        
        ctx.restore();
    }

    public getHeight(): number {
        return ((this.content.match(/\n/g) ?? []).length + 1) * this.fontSize * 1.25;
    }
}