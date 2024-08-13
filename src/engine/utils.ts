export const withArticle = (word: string): string => {
    return `${getArticleFor(word)} ${word}`;
};

export const getArticleFor = (word: string): string => {
    return ['a', 'e', 'i', 'o', 'u'].includes(word.substring(0, 1).toLowerCase()) ? 'an' : 'a';
};