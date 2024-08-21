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
                this.audio.volume = 0.7;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this.audio as any).preservesPitch = false;
                clearInterval(timer);
            }
        }, 5);
    }

    public setVolume(vol: number): void {
        this.audio.volume = vol;
    }

    public getPitch(): number {
        return this.audio.playbackRate;
    }

    public setPitch(target: number): void {
        if (target < 0.1) {
            this.audio.volume = 0;
            return;
        }
        this.audio.playbackRate = target;
    }

    public isMuted(): boolean {
        return this.muted;
    }

    public toggleMuteTo(state: boolean): void {
        this.muted = state;
        if (this.muted) {
            // localStorage.setItem('KeybGameMute', '1');
            this.audio.pause();
            return;
        }
        // localStorage.removeItem('KeybGameMute');
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
        this.playEffect([2.5,,321,.01,,.02,,.7,-62,-30,116,.15,,.6,35,,.04,.51,.03,,99]);
    }

    public buttonHover(): void {
    }

    public pick(): void {
        this.buttonClick();
        this.playEffect([1.5,,419,.02,.03,.01,3,3.5,-49,5,283,.49,.09,,,,.04,.69,.02,.12,-1280]);
    }

    public shoot(): void {
        this.playEffect([2,,419,.02,.03,.18,2,1.5,14,8,,,,,,.4,.17,.93,.19,,305]);
    }

    public explosion(): void {
        this.playEffect([1.5,,341,.02,.14,,3,2.8,-14,15,,,.07,,3.4,.4,.04,.64,.18,.2,99]);
        this.playEffect([2.5,,468,.01,.08,.11,4,2.8,,,,,.1,1.3,,.3,.04,.46,.08,.3]);
    }

    public throw(): void {
        this.playEffect([.6,,528,.01,.05,.03,2,4.4,-47,22,77,.29,,,,,,.7,.03,.21,422]);
        this.playEffect([3.2,,291,,,.04,1,3.9,7,,26,.04,.1,.4,,,.16,.73,.01,.45,-1167]);
    }

    public roll(): void {
        this.playEffect([1.4,,586,,.04,.01,4,.6,32,,-1,.03,,.4,,,.28,.72,.01,.31,-1408]);
    }

    public sail(vol: number): void {
        this.playEffect([vol,,50,.09,.26,.62,4,2.7,6,,,,.06,1.2,,.1,,.46,.27,.03,1598]);
    }

    public jump(): void {
        this.playEffect([.7,,312,.01,.01,.06,,2.6,,58,,,,,,.1,,.57,.09]);
    }

    public land(): void {
        this.playEffect([1,,252,.02,.02,.19,,1.7,,-50,,,,,,.1,.03,.91,.04]);
    }

    public win(): void {
        this.playEffect([2.2,,229,.03,.11,.5,,2.6,,,-186,.06,.03,,,,.12,.5,.17]);
    }

    public sink(): void {
        this.playEffect([.8,,35,.04,.08,.6,4,3.4,5,,,,,.3,,.1,,.37,.19,,1989]);
        setTimeout(() => this.playEffect([0.7,,468,.06,.11,,,3.2,-8,,-61,.07,.05,,,,,.91,.14]), 500);
    }

    public bad(): void {
        this.playEffect([1.5,,525,.07,.12,.44,,1.2,,75,,,.05,.3,.9,,,,.26,.23,494]);
    }

    public warn(): void {
        this.bad();
        this.playEffect([,,326,,.11,.45,1,.8,,-5,124,.07,.06,.2,33,,,.54,.14,,-1210]);
        // this.playEffect([0.6,,486,.09,.11,.24,1,1.3,,,20,.07,.03,,48,.1,,.62,.26,.08]);
    }

    public greet(): void {
        this.win();
        this.playEffect([1.5,,444,.1,.13,.34,1,1.2,,,-128,.06,.02,,1,.1,,.56,.19]);
    }

    public incoming(): void {
        this.playEffect([0.5,,541,.03,.16,.35,1,1.5,3,1,,,.07,,.6,,,.89,.17]);
        this.playEffect([2.5,,93,.06,.01,.67,2,1.6,,3,,,,.5,,.6,.04,.32,.09]);
    }
}