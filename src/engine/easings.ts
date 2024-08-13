
export const quadEaseIn = (p: number): number => p * p;
export const quadEaseOut = (p: number): number => -(p * (p - 2));
export const quadEaseInOut = (p: number): number => p < 0.5 ? (2 * p * p) : (-2 * p * p) + (4 * p) - 1;

export const bounce = (p: number): number => {
    if (p < 4 / 11) {
        return (121 * p * p) / 16;
    } else if (p < 8 / 11) {
        return (363 / 40 * p * p) - (99 / 10 * p) + 17 / 5;
    } else if (p < 9 / 10) {
        return (4356 / 361 * p * p) - (35442 / 1805 * p) + 16061 / 1805;
    } else {
        return (54 / 5 * p * p) - (513 / 25 * p) + 268 / 25;
    }
};
