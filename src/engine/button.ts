import { AudioManager } from './audio';
import { font } from './constants';
import { Entity } from './entity';
import { Game } from './game';
import { Mouse } from './mouse';

const BORDER_THICKNESS = 5;

export class ButtonEntity extends Entity {
    public visible = true;

    private pressed: boolean;
    protected hovered: boolean;

    private borderThickness = BORDER_THICKNESS;

    constructor(game: Game, private content: string, x: number, y: number, width: number, height: number, private onClick: () => void, private audio: AudioManager, private fontSize = 30) {
        super(game, x - width * 0.5, y - height * 0.5, width, height);
    }

    public trigger(): void {
        this.audio.buttonClick();
        this.onClick();
    }

    // TODO: commented for optimization
    // public setBorderThickness(thickness: number): void {
    //     this.borderThickness = thickness;
    // }

    public setText(text: string): void {
        this.content = text;
    }

    public update(tick: number, mouse: Mouse): void {
        if (!this.visible) return;

        const wasHovered = this.hovered;
        this.hovered = !mouse.dragging && this.isInside(mouse);
        if (!wasHovered && this.hovered) this.hover();
        if (!mouse.pressing) {
            if (this.pressed && !mouse.dragging && this.hovered) {
                this.onClick();
            }
            this.pressed = false;
        }
        
        if (this.hovered && mouse.pressing && !this.pressed && !mouse.dragging) {
            this.pressed = true;
            return;
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (!this.visible) return;
        ctx.save();
        ctx.translate(0, this.hovered ? -5 : 0);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.p.x, this.p.y, this.s.x, this.s.y);
        ctx.fillStyle = this.hovered ? '#f2e949' : '#fff';
        ctx.fillRect(this.p.x + this.borderThickness, this.p.y + this.borderThickness, this.s.x - this.borderThickness * 2, this.s.y - this.borderThickness * 2);

        ctx.font =`${this.fontSize}px ${font}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(this.content, this.p.x + this.s.x * 0.5, this.p.y + this.s.y * 0.5 + this.fontSize * 0.3);

        ctx.restore();
    }

    private hover(): void {
        this.audio.buttonHover();
    }
}