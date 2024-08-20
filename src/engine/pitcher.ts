import { AudioManager } from './audio';

export class Pitcher {
    private target: number;
    private time: number;
    private speed: number;

    constructor(private audio: AudioManager) {
        this.target = this.audio.getPitch();
    }

    public update(tick: number): void {
        const delta = tick - this.time;
        this.time = tick;
        const diff = 1 - this.target;
        if (Math.abs(diff) < 0.01) return;
        this.target += Math.sign(diff) * 0.0001 * delta * this.speed;
        this.audio.setPitch(this.target);
    }

    public pitch(to: number, speed: number = 1): void {
        this.speed = speed;
        this.target = to;
    }
}