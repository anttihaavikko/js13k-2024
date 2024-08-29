import { AudioManager } from './audio';

export class Pitcher {
    private value: number;
    private speed: number;
    private target: number;
    private disabled: boolean;

    constructor(private audio: AudioManager) {
        this.value = this.target = this.audio.getPitch();
        this.disabled = ['ipho', 'ipad', 'macin'].some(s => navigator.userAgent.toLowerCase().includes(s) && navigator.maxTouchPoints > 0);
    }

    public update(delta: number): void {
        if (this.disabled) return;
        const diff = this.target - this.value;
        if (Math.abs(diff) < 0.01) return;
        this.value += Math.sign(diff) * 0.0001 * delta * this.speed;
        this.audio.setPitch(this.value);
    }

    public pitchFrom(to: number, speed: number = 1): void {
        this.speed = speed;
        this.value = to;
    }

    public pitchTo(t: number, speed: number = 1): void {
        this.speed = speed;
        this.target = t;
    }
}