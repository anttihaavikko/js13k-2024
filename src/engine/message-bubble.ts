import { Bubble } from './bubble';
import { Game } from './game';

export class MessageBubble extends Bubble {
    constructor(game: Game, url: string, x: number, y: number) {
        super(game, '', x, y);
        fetch(url, { mode: 'no-cors' }).then(response => response.text()).then(data => this.setText(data));
    }
}