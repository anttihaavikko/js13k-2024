import { AudioManager } from './engine/audio';
import { Game } from './engine/game';
import { Mouse } from './engine/mouse';
import { Scene } from './scene';

export const WIDTH = 800;
export const HEIGHT = 600;

const canvas: HTMLCanvasElement = document.createElement('canvas');
const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
const mouse: Mouse = { x: 0, y: 0 };
const audio = new AudioManager(!!localStorage.getItem('KeybGameMute'));
audio.prepare();
audio.play();
const game = new Game(audio);
const scene = new Scene(game);
game.changeScene(scene);

canvas.id = 'game';
canvas.width = WIDTH;
canvas.height = HEIGHT;
document.body.appendChild(canvas);

let ratio = 1;
let x = 0;
let y = 0;

const resize = () => {
    ratio = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
    canvas.style.transformOrigin = 'top left';
    x = (window.innerWidth - WIDTH * ratio) * 0.5;
    y = (window.innerHeight - HEIGHT * ratio) * 0.5;
    canvas.style.transform = `translate(${x}px,${y}px) scale(${ratio})`;
};

resize();
window.onresize = resize;

let isFull = false;
document.onfullscreenchange = () => isFull = !isFull;

document.onmousemove = (e: MouseEvent) => {
    mouse.x = isFull ? (e.offsetX - x) / ratio : e.offsetX;
    mouse.y = isFull ? (e.offsetY - y) / ratio : e.offsetY;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
document.onkeydown = (e: KeyboardEvent) => {
    audio.play();
    game.pressed(e);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
document.ontouchstart = (e: TouchEvent) => {
};

document.onmousedown = () => {
    audio.play();
    mouse.pressing = true;
};

// document.onmouseup = () => mouse.pressing = false;

const tick = (t: number) => {
    requestAnimationFrame(tick);
    ctx.resetTransform();
    game.update(t, mouse);
    game.draw(ctx);
};

requestAnimationFrame(tick);