export const clamp = (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
};

export const clamp01 = (num: number): number => {
    return clamp(num, 0, 1);
};

export const moveTowards = (num: number, target: number, max: number): number => {
    return num + (target > num ? Math.min((target - num), max) : Math.max((target - num), -max));
};

export const lerp = (a: number, b: number, alpha: number, ease: (v: number) => number = v => v): number => {
    return a + ease(alpha) * (b - a);
};

export const asScore = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const asScoreWithSuffix = (value: number, limit: number): string => {
    const text = asScore(value);
    if (text.length <= limit) return text;
    // if (text.length > 29) return text.substring(0, text.length - 28) + ' Z';
    // if (text.length > 25) return text.substring(0, text.length - 24) + ' E';
    if (text.length > 21) return asScore(Math.floor(value/1000000000000000)) + ' P';
    if (text.length > 17) return text.substring(0, text.length - 16) + ' T';
    if (text.length > 13) return text.substring(0, text.length - 12) + ' G';
    if (text.length > 9) return text.substring(0, text.length - 8) + ' M';
    if (text.length > 5) return text.substring(0, text.length - 4) + ' k';
    return text;
};

export const numbersAsText = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five'];
export const numbersAsTextWithArticle = ['a zero', 'a one', 'a two', 'a three', 'a four', 'a five', 'a six', 'a seven', 'an eight', 'a nine', 'a ten'];