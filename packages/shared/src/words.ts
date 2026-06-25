import type { WordPack } from './types.js';

export const WORD_BANK: Record<WordPack, string[]> = {
  general: [
    'house', 'tree', 'car', 'sun', 'moon', 'star', 'cloud', 'rain',
    'fish', 'bird', 'dog', 'cat', 'book', 'chair', 'table', 'door',
    'window', 'phone', 'clock', 'shoe', 'hat', 'ball', 'key', 'pen',
    'cake', 'apple', 'banana', 'pizza', 'coffee', 'bottle', 'box',
    'bridge', 'mountain', 'river', 'ocean', 'island', 'beach', 'campfire',
    'tent', 'rocket', 'airplane', 'bicycle', 'train', 'boat', 'helicopter',
    'guitar', 'piano', 'drum', 'microphone', 'camera', 'telescope',
    'robot', 'ghost', 'alien', 'wizard', 'knight', 'princess', 'dragon',
    'unicorn', 'dinosaur', 'butterfly', 'bee', 'ant', 'spider',
    'flower', 'leaf', 'grass', 'mushrock', 'cactus', 'snowman',
    'umbrella', 'lantern', 'compass', 'magnet', 'lightbulb', 'battery',
    'hammer', 'saw', 'drill', 'ladder', 'shovel', 'rake',
    'crown', 'ring', 'necklace', 'glasses', 'backpack', 'suitcase',
    'basket', 'balloon', 'kite', 'puzzle', 'dice', 'chess',
    'trophy', 'medal', 'flag', 'banner', 'fireworks', 'candle',
  ],
  food: [
    'pizza', 'hamburger', 'hotdog', 'sushi', 'taco', 'burrito',
    'pasta', 'spaghetti', 'noodles', 'rice', 'bread', 'croissant',
    'pancake', 'waffle', 'donut', 'cookie', 'cake', 'pie',
    'ice cream', 'chocolate', 'candy', 'lollipop', 'popcorn',
    'apple', 'banana', 'orange', 'grape', 'strawberry', 'watermelon',
    'pineapple', 'mango', 'cherry', 'peach', 'lemon',
    'carrot', 'broccoli', 'corn', 'potato', 'tomato', 'onion',
    'mushroom', 'pepper', 'lettuce', 'cucumber',
    'chicken', 'steak', 'fish', 'shrimp', 'egg', 'bacon',
    'cheese', 'milk', 'juice', 'coffee', 'tea', 'soda',
    'soup', 'salad', 'sandwich', 'burger', 'fries', 'nachos',
  ],
  animals: [
    'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep',
    'chicken', 'duck', 'goose', 'turkey', 'rabbit', 'deer', 'bear',
    'wolf', 'fox', 'lion', 'tiger', 'elephant', 'giraffe', 'zebra',
    'monkey', 'ape', 'gorilla', 'panda', 'koala', 'kangaroo',
    'dolphin', 'whale', 'shark', 'octopus', 'squid', 'crab', 'lobster',
    'turtle', 'frog', 'snake', 'lizard', 'crocodile', 'alligator',
    'eagle', 'hawk', 'owl', 'parrot', 'penguin', 'flamingo',
    'butterfly', 'bee', 'ant', 'spider', 'scorpion', 'snail',
    'horse', 'donkey', 'camel', 'llama', 'cow', 'goat',
    'hamster', 'guinea pig', 'mouse', 'rat', 'squirrel',
    'mole', 'hedgehog', 'bat', 'otter', 'seal', 'polar bear',
  ],
  objects: [
    'chair', 'table', 'bed', 'sofa', 'lamp', 'mirror', 'clock',
    'phone', 'computer', 'laptop', 'tablet', 'keyboard', 'mouse',
    'television', 'remote', 'camera', 'headphones', 'speaker',
    'book', 'notebook', 'pen', 'pencil', 'eraser', 'ruler',
    'scissors', 'tape', 'glue', 'stapler', 'paper', 'envelope',
    'backpack', 'suitcase', 'wallet', 'purse', 'glasses', 'watch',
    'ring', 'necklace', 'bracelet', 'hat', 'scarf', 'gloves',
    'shoe', 'boot', 'sandal', 'sock', 'belt', 'tie',
    'umbrella', 'key', 'lock', 'hammer', 'saw', 'drill',
    'ladder', 'shovel', 'rake', 'broom', 'mop', 'bucket',
    'plate', 'bowl', 'cup', 'glass', 'fork', 'knife', 'spoon',
    'bottle', 'can', 'jar', 'basket', 'box', 'bag',
  ],
  nature: [
    'sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'wind', 'storm',
    'lightning', 'thunder', 'rainbow', 'fog', 'ice', 'frost',
    'mountain', 'hill', 'valley', 'canyon', 'cliff', 'cave',
    'river', 'lake', 'ocean', 'waterfall', 'pond', 'stream',
    'island', 'beach', 'desert', 'forest', 'jungle', 'swamp',
    'tree', 'flower', 'grass', 'leaf', 'branch', 'root',
    'mushroom', 'cactus', 'bamboo', 'vine', 'bush', 'shrub',
    'rock', 'stone', 'pebble', 'sand', 'dirt', 'mud',
    'crystal', 'gem', 'diamond', 'gold', 'silver', 'copper',
    'fire', 'flame', 'ash', 'smoke', 'ember',
    'wave', 'tide', 'current', 'ripple', 'bubble',
    'sunrise', 'sunset', 'eclipse', 'aurora', 'stardust',
    'volcano', 'earthquake', 'tornado', 'hurricane', 'blizzard',
  ],
  custom: [],
};

export function getRandomWords(pack: WordPack, count: number, exclude: string[] = []): string[] {
  const words = WORD_BANK[pack].filter((w) => !exclude.includes(w));
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomWord(pack: WordPack, exclude: string[] = []): string {
  const words = getRandomWords(pack, 1, exclude);
  return words[0];
}
