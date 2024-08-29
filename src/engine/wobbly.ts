import { font } from './constants';
import { Game } from './game';
import { clamp01 } from './math';
import { Mouse } from './mouse';
import { TextEntity, TextOptions } from './text';
import { ZERO } from './vector';


export class WobblyText extends TextEntity {
    private time = 0;
    private timer: NodeJS.Timeout;

    constructor(game: Game, content: string, fontSize: number, x: number, y: number, private frequency: number, private amplitude: number, options?: TextOptions) {
        super(game, content, fontSize, x, y, -1, ZERO, options);
        this.scale = { x: 1, y: 1 };
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.tween.update(tick);
        this.time = tick;
    }

    public toggle(text: string): void {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.content = text, text ? 0 : 200);
        const s = text ? 1 : 0;
        this.tween.scale({ x: s, y: s }, 0.2);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.rotate(this.options?.angle ?? 0);
        this.ratio = clamp01(this.scale.x);
        const mod = this.options?.scales ? this.ratio : 1;
        ctx.textAlign = 'left';
        ctx.font =`${this.fontSize * mod}px ${font}`;

        // if(this.options?.shadow) {
        //     ctx.fillStyle = "#000";
        //     ctx.fillText(this.content.replace(/\|/g, ""), this.p.x + this.options.shadow, this.p.y + this.options.shadow);
        // }
        
        const spacing = this.options?.spacing ?? 0;
        const w = this.getWidth(ctx);

        // ctx.translate(w * 0.25, 0);
        // ctx.scale(0.5, 0.5);
        // ctx.translate(-w * 0.25, 0);

        let offset = this.options?.align === 'center' || !this.options?.align ? -w * 0.5 : 0;
        if (this.options?.align == 'right') offset = -w;
        this.content.split('').forEach((letter, i) => {
            // ctx.font =`${this.fontSize * mod * (this.content[i - 1] === ' ' ? 1.2 : 1)}px ${font}`;
            ctx.fillStyle = '#000';
            ctx.fillText(letter, this.p.x + spacing * i + this.options.shadow + offset, this.p.y + this.options.shadow + Math.sin(this.time * 0.005 + i * this.frequency) * this.amplitude);
            ctx.fillStyle = '#fff';
            // TODO: commented for optimization
            // if (this.options?.outline) {
            //     ctx.strokeStyle = '#000';
            //     ctx.lineWidth = this.options.outline;
            //     ctx.strokeText(letter, this.p.x + spacing * i + offset, this.p.y + Math.sin(this.time * 0.005 + i * this.frequency) * this.amplitude);
            // }
            ctx.fillText(letter, this.p.x + spacing * i + offset, this.p.y + Math.sin(this.time * 0.005 + i * this.frequency) * this.amplitude);
            offset += ctx.measureText(letter).width;
        });

        ctx.restore();
    }
}