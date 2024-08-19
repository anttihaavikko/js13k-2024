import { AudioManager } from './audio';
import { Blinders } from './blinders';
import { Camera } from './camera';
import { Container } from './container';
import { Entity } from './entity';
import { Mouse } from './mouse';

export class Game extends Entity {
    private scene: Container;
    private keyListeners: ((event: KeyboardEvent) => void)[] = [];
    private camera = new Camera();
    private blinders: Blinders;

    constructor(private audio: AudioManager, private canvas: HTMLCanvasElement) {
        super(null, 0, 0, 0, 0);
        this.blinders = new Blinders(this, 400);
    }

    public goFullScreen(): void {
        this.canvas.requestFullscreen();
    }

    public getScene(): Container {
        return this.scene;
    }

    public getCamera(): Camera {
        return this.camera;
    }

    public getAudio(): AudioManager {
        return this.audio;
    }

    public click(mouse: Mouse): void {
        this.scene?.getButtons().forEach(b => {
            if (b.visible && b.isInside(mouse)) b.trigger();
        });
    }

    public onKey(callback: (event: KeyboardEvent) => void): void {
        this.keyListeners.push(callback);
    }

    public pressed(event: KeyboardEvent): void {
        if (event.repeat) return;
        if (event.key.toLowerCase() == 'm' && event.ctrlKey) this.audio.toggleMute();
        this.keyListeners.forEach(k => k(event));
    }

    public update(tick: number, mouse: Mouse): void {
        this.scene?.update(tick, mouse);
        this.camera.update();
        this.blinders.update(tick, mouse);
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

    public setScene(scene: Container): void {
        this.scene = scene;
    }

    public changeScene(scene: Container): void {
        this.blinders.close(() => {
            this.setScene(scene);
            this.blinders.open();
        });
    }
}