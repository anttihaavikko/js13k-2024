export class SeedableRandom {
    private state: number;
    private m = 0x80000000;
    private a = 1103515245;
    private c = 12345;

    constructor(seed: number) {
        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    }

    public next = (): number => {
        this.state = (this.a * this.state + this.c) % this.m;
        return parseFloat('0.' + this.state.toString().substring(1));
    };

    public random = (min = 0, max = 1): number => {
        return min + this.next() * max;
    };
    
    public randomInt = (min: number, max: number): number => {
        return min + Math.floor(this.next() * (max - min + 1));
    };
    
    public randomChance = (): boolean => {
        return this.next() < 0.5;
    };
    
    public randomCell = <T>(arr: T[]): T => {
        return arr[Math.floor(this.next() * arr.length)];
    };

    public shuffle = <T>(arr: T[]): T[] => {
        return arr.map(item => ({ order: this.next(), item })).sort((a, b) => a.order - b.order).map(item => item.item);
    };
}