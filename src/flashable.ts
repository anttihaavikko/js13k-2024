import { Entity } from './engine/entity';

export class Flashable extends Entity {
    protected flashing: boolean;
    private color: string;

    protected getColor(normal: string): string {
        return this.flashing ? this.color : normal;
    }

    public flash(duration: number = 0.1, color: string = '#fff'): void {
        this.flashing = true;
        this.color = color;
        setTimeout(() => this.flashing = false, duration * 1000);
    }
}