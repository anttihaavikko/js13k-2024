import { AudioManager } from './audio';
import { Blinders } from './blinders';
import { Camera } from './camera';
import { Container } from './container';
import { Entity } from './entity';
import { Mouse } from './mouse';
import { Pitcher } from './pitcher';

export class Game extends Entity {
    public pitcher: Pitcher;
    public scene: Container;
    public camera = new Camera();

    private keyListeners: ((event: KeyboardEvent) => void)[] = [];
    private blinders: Blinders;

    constructor(public audio: AudioManager, public canvas: HTMLCanvasElement) {
        super(null, 0, 0, 0, 0);
        this.pitcher = new Pitcher(audio);
        this.blinders = new Blinders(this, 400);
    }

    public click(mouse: Mouse): void {
        this.scene?.getButtons().forEach(b => {
            if (b.visible && b.isInside(mouse)) b.trigger();
        });
    }

    public onKey(callback: (event: KeyboardEvent) => void): void {
        this.keyListeners = [callback];
    }

    public pressed(event: KeyboardEvent): void {
        if (event.repeat) return;
        // if (event.key.toLowerCase() == 'm' && event.ctrlKey) this.audio.toggleMute();
        this.keyListeners.forEach(k => k(event));
    }

    public update(tick: number, mouse: Mouse): void {
        super.update(tick, mouse);
        this.scene?.update(tick, mouse);
        this.camera.update();
        this.blinders.update(tick, mouse);
        this.pitcher.update(this.delta);
        mouse.pressing = false;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#5d9acf';
        ctx.fillRect(0, 0, 800, 600);
        
        ctx.save();
        ctx.rotate(this.camera.rotation);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(this.camera.offset.x - this.camera.pan.x + this.camera.shift, this.camera.offset.y + this.camera.pan.y);
        this.scene?.draw(ctx);
        ctx.restore();
        this.blinders.draw(ctx);
    }

    public changeScene(scene: Container): void {
        this.blinders.close(() => {
            this.scene = scene;
            this.blinders.open();
        });
    }
}