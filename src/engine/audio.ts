/* eslint-disable no-sparse-arrays */
import { song } from '../song';
import { CPlayer } from './audio-player';
import { zzfx } from './zzfx';

export class AudioManager {
    private started = false;
    private audio: HTMLAudioElement;
    private loaded: boolean;
    private muted: boolean;

    constructor(muted: boolean) {
        this.audio = document.createElement('audio');
        if (muted) this.toggleMute();
    }

    public prepare(): void {
        if (this.started) return;
        
        this.started = true;

        const player = new CPlayer();
        player.init(song);
        player.generate();
        this.loaded = false;

        const timer = setInterval(() => {
            if (this.loaded) return;
            this.loaded = player.generate() >= 1;
            if (this.loaded) {
                const wave = player.createWave();
                this.audio.src = URL.createObjectURL(new Blob([wave], { type: 'audio/wav' }));
                this.audio.loop = true;
                clearInterval(timer);
            }
        }, 5);
    }

    public isMuted(): boolean {
        return this.muted;
    }

    public toggleMuteTo(state: boolean): void {
        this.muted = state;
        if (this.muted) {
            localStorage.setItem('KeybGameMute', '1');
            this.audio.pause();
            return;
        }
        localStorage.removeItem('KeybGameMute');
        this.audio.play();
    }

    public toggleMute(): void {
        this.toggleMuteTo(!this.muted);
    }

    public play(): void {
        const timer = setInterval(() => {
            if (!this.loaded) return;
            if (!this.muted) this.audio.play();
            clearInterval(timer);
        }, 5);
        
        // restart early for better looping
        // this.audio.addEventListener('timeupdate', () => {
        //     if(this.audio.currentTime > this.audio.duration - 0.21) {
        //         this.audio.currentTime = 0;
        //         this.audio.play();
        //     }
        // });
    }

    public playEffect(values: number[]): void {
        if (!this.muted) zzfx(...values.map((v, i) => i === 0 ? (v ?? 1) * 0.6 : v));
    }

    public buttonClick(): void {
    }

    public buttonHover(): void {
    }
}