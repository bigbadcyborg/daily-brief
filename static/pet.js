const PET_KEY = "brief.pet.v1";
const SIZE = 24;
const INK = "#1c1915";
const PAPER = "#f7f1e6";
const EYE = "#fbf7f0";
const BLUSH = "#e7a0a0";
const ACCENT = "#b86112";
const MAX_EDGE = 64;
const MAX_FRAMES = 8;
const MAX_URL = 150000;
const MAX_FILE = 4 * 1024 * 1024;

const COATS = [
  ["ink", "Ink", "#1c1915"],
  ["saffron", "Saffron", "#b86112"],
  ["green", "Green", "#0d6a3e"],
  ["red", "Red", "#9d1c1c"],
  ["slate", "Slate", "#5c564c"],
  ["blue", "Blue", "#2a4d6e"],
  ["cream", "Cream", "#e7d7b8"],
  ["black", "Black", "#141210"],
];
const ACCESSORIES = ["none", "bow", "scarf", "glasses", "cap"];


const CAP = [
  "...######...",
  ".##@@@@@@##.",
  "#@@@@@@@@@@#",
  "#@@@@@@@@@@#",
  "############",
];
const BOW = [
  "#..@..#",
  "##@@@##",
  ".#@@@#.",
  "..#@#..",
  "...#...",
];
const SCARF = [
  ".############.",
  "#@@@@@@@@@@@@#",
  "#@@@@@@@@@@@@#",
  ".############.",
];
const GLASSES = [
  ".####......####.",
  ".#..#......#..#.",
  ".####......####.",
];
const PAW = [
  ".#.#.",
  "#@@@#",
  "#@@@#",
  ".#@#.",
  "..#..",
];
const HEART = [
  "................",
  "................",
  ".....##.##......",
  "....#@@#@@#.....",
  ".....#@@@#......",
  "......#@#.......",
  ".......#........",
  "................",
];
const ZZZ = [
  "................",
  "...######.......",
  ".......#........",
  "......#.........",
  ".....#..........",
  "...######.......",
  "................",
  "................",
];
const TEAR = [
  "................",
  "................",
  ".......#........",
  "......#~~#......",
  "......#~~#......",
  ".......#........",
  "................",
  "................",
];
const SWEAT = [
  "................",
  ".....#..........",
  "....#~#.........",
  ".....#..........",
  "...........#....",
  "..........#~#...",
  "...........#....",
  "................",
];
const NOTE = [
  "................",
  "..........#.....",
  ".........##.....",
  "........#.#.....",
  ".......#..#.....",
  ".......#@@@.....",
  ".......#@#......",
  "........#.......",
];
const STAR = [
  "................",
  ".....#.....#....",
  "....###...###...",
  ".....#.....#....",
  "...#.#.....#.#..",
  "................",
  "................",
  "................",
];
const STEAM = [
  "................",
  "..#o#.......#o#.",
  ".#o#o#.....#o#o#",
  "..#o#.......#o#.",
  "................",
  "................",
  "................",
  "................",
];
const BANG = [
  "................",
  "......#.........",
  "......#.........",
  "......#.........",
  "......#.........",
  "................",
  "......#.........",
  "................",
];
const ASK = [
  "................",
  ".....##.........",
  "....#..#........",
  "......#.........",
  ".....#..........",
  "................",
  ".....#..........",
  "................",
];
const SNOW = [
  "................",
  ".....#.....#....",
  "....#~#...#~#...",
  ".....#.....#....",
  "................",
  "..#.............",
  ".#~#......#~#...",
  "..#........#....",
];
const SPARK = [
  "................",
  "...#.....#......",
  "..#.#...#.#.....",
  "...#.....#......",
  "................",
  ".....#.#........",
  "......#.........",
  "................",
];
const MEDAL = [
  "................",
  ".....####.......",
  "....#@@@@#......",
  "....#@##@#......",
  ".....#@@#.......",
  "......##........",
  ".......#........",
  "................",
];
const SWIRL = [
  "................",
  ".......##.......",
  "......#..#......",
  ".....#....#.....",
  ".....#..##......",
  "......#.#.......",
  ".......#........",
  "................",
];
const MOOD_FX = {
  happy: "",
  laugh: "note",
  cheer: "star",
  sad: "tear",
  worry: "sweat",
  angry: "steam",
  shock: "bang",
  love: "heart",
  skeptical: "ask",
  bored: "",
  calm: "",
  curious: "",
  yawn: "z",
  proud: "medal",
  awe: "spark",
  shiver: "snow",
  dizzy: "swirl",
  smirk: "",
};
const GRIM = ["war", "wars", "killed", "kills", "kill", "death", "deaths", "dead", "died", "dies", "attack", "attacks", "crash", "crashes", "crisis", "disaster", "recession", "layoffs", "layoff", "murder", "shooting", "earthquake", "quake", "quakes", "flood", "hurricane", "outbreak", "bankrupt", "bankruptcy", "default", "plunge", "plunges", "slump", "collapse", "invasion", "famine", "wildfire", "explosion", "missile", "missiles", "hostage", "hostages", "airstrike", "airstrikes", "blast", "blasts", "tsunami", "tornado"];
const ANGRY = ["scandal", "corruption", "corrupt", "fraud", "lied", "lying", "lie", "guilty", "indicted", "indictment", "protest", "protests", "riot", "riots", "abuse", "abuses", "outrage", "outraged", "banned", "bans", "scam", "scams", "impeached", "impeachment", "bribe", "bribery"];
const LOVE = ["wedding", "weddings", "marry", "married", "marriage", "baby", "babies", "newborn", "born", "birth", "reunited", "reunion", "rescued", "rescue", "puppy", "kitten"];
const SHOCK = ["stunned", "stunning", "unexpected", "unexpectedly", "surprise", "surprised", "surprising", "shocking", "shock", "suddenly", "abrupt", "bombshell", "breaking", "unprecedented"];
const UNEASY = ["fear", "fears", "lawsuit", "probe", "inflation", "shortage", "strike", "strikes", "sinks", "slides", "slid", "drops", "dropped", "falls", "fell", "warning", "warnings", "threat", "sanctions", "tariff", "outage", "recall", "injured", "injury"];
const GLAD = ["rally", "rallies", "record", "surge", "surges", "soar", "soars", "gains", "growth", "peace", "breakthrough", "recovery", "wins", "approval", "cure", "profit", "profits", "beats", "upgrade", "ceasefire", "celebration", "celebrates"];
const CHEER_WORDS = ["record", "surge", "surges", "soar", "soars", "breakthrough", "ceasefire"];
const DOUBT = ["allegedly", "reportedly", "claims", "claimed", "rumor", "rumors", "rumours", "rumored", "doubts", "doubtful"];
const AWE = ["launch", "launched", "astronaut", "eclipse", "comet", "galaxy", "telescope", "aurora", "discovery", "discovered", "nasa", "moon", "mars", "orbit", "orbital"];
const PROUD = ["champion", "championship", "olympic", "olympics", "crowned", "medal"];
const SMIRK = ["gaffe", "prank", "blooper", "awkward", "meme", "oops"];
const CHILL = ["blizzard", "snowstorm", "arctic", "frost", "snowfall"];
const SPIN = ["volatile", "volatility", "whiplash", "rollercoaster", "chaotic"];

const GRIDS = {
  cat: {
    idle: [
      "........................",
      ".......#........#.......",
      "......#@#......#@#......",
      ".....#ee.#....#ee.#.....",
      "....#@ee@.#..#@ee@.#....",
      "....#@eee@#..#eee@@#....",
      "...#@eee##@##@##ee@.#...",
      "...@@@#@@@@@@@@@@#@@....",
      ".....#@@@@@@@@@@@@#.....",
      "....#@@@@@@@@@@@@@@#....",
      "....#^^^^^@@@@^^^^^#....",
      "....#^^*^^@@@@^^*^^#....",
      "....#^**^^@@@@^**^^#....",
      "##..#^^^^^@@@@^^^^^#..##",
      "..#.ee@@@@#oo#@@@@ee.#..",
      "##...#@@#@@##@@#@@#@..##",
      "......#@@@#@@#@@@#@@@@..",
      ".##...###@++++@###@@@##.",
      "......@@@++++++@@@@@@@..",
      "......#@@++++++@@#@@@...",
      "......#@@++++++@@#@@@...",
      ".......#@@#@@#@@#.@@....",
      ".......##########.......",
      "........................",
    ],
    blink: [
      "........................",
      ".......#........#.......",
      "......#@#......#@#......",
      ".....#ee.#....#ee.#.....",
      "....#@ee@.#..#@ee@.#....",
      "....#@eee@#..#eee@@#....",
      "...#@eee##@##@##ee@.#...",
      "...@@@#@@@@@@@@@@#@@....",
      ".....#@@@@@@@@@@@@#.....",
      "....#@@@@@@@@@@@@@@#....",
      "....#@@@@@@@@@@@@@@#....",
      "....#@@@@@@@@@@@@@@#....",
      "....######@@@@######....",
      "##..#@@@@@@@@@@@@@@#..##",
      "..#.ee@@@@#oo#@@@@ee.#..",
      "##...#@@#@@##@@#@@#@..##",
      "......#@@@#@@#@@@#@@@@..",
      ".##...###@++++@###@@@##.",
      "......@@@++++++@@@@@@@..",
      "......#@@++++++@@#@@@...",
      "......#@@++++++@@#@@@...",
      ".......#@@#@@#@@#.@@....",
      ".......##########.......",
      "........................",
    ],
    look: [
      "........................",
      ".......#........#.......",
      "......#@#......#@#......",
      ".....#ee.#....#ee.#.....",
      "....#@ee@.#..#@ee@.#....",
      "....#@eee@#..#eee@@#....",
      "...#@eee##@##@##ee@.#...",
      "...@@@#@@@@@@@@@@#@@....",
      ".....#@@@@@@@@@@@@#.....",
      "....#@@@@@@@@@@@@@@#....",
      "....#^^^^^@@@@^^^^^#....",
      "....#^^^*^@@@@^^^*^#....",
      "....#^^**^@@@@^^**^#....",
      "##..#^^^^^@@@@^^^^^#..##",
      "..#.ee@@@@#oo#@@@@ee.#..",
      "##...#@@#@@##@@#@@#@..##",
      "......#@@@#@@#@@@#@@@@..",
      ".##...###@++++@###@@@##.",
      "......@@@++++++@@@@@@@..",
      "......#@@++++++@@#@@@...",
      "......#@@++++++@@#@@@...",
      ".......#@@#@@#@@#.@@....",
      ".......##########.......",
      "........................",
    ],
  },
  dog: {
    idle: [
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      ".........######.........",
      "...#@#.#@@#@@#@@#.#@#...",
      "..#@@@.@@@@@@@@@@.@@@#..",
      "..@ee@#^^^^^@^^^^^@ee@..",
      ".#@eee@^^*^^@^^*^^eee@#.",
      ".@@eee@^**^^@^**^^eee@@.",
      ".@@eee@^^^^^@^^^^^eee@@.",
      ".@@eee#@@@++++@@@#eee@@.",
      ".@@eee@@@+####+@@@eee@@.",
      ".#@eee@##++oo++##@eee@#.",
      "..@ee@#@@##oo##@@#@ee@..",
      "..#@@@#@@@#ee#@@@#@@@#..",
      "...#@#@@@@@ee@@@@@#@#...",
      "......@@@@@##@@@@@......",
      "......#@@@@@@@@@@#......",
      ".......#@@@@@@@@#.......",
      ".......@@@@@@@@@@.......",
      ".......#@@#..#@@#.......",
      "........................",
    ],
    blink: [
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      ".........######.........",
      "...#@#.#@@#@@#@@#.#@#...",
      "..#@@@.@@@@@@@@@@.@@@#..",
      "..@ee@#@@@@@@@@@@@@ee@..",
      ".#@eee@@@@@@@@@@@@eee@#.",
      ".@@eee@#####@#####eee@@.",
      ".@@eee@@@@@@@@@@@@eee@@.",
      ".@@eee#@@@++++@@@#eee@@.",
      ".@@eee@@@+####+@@@eee@@.",
      ".#@eee@##++oo++##@eee@#.",
      "..@ee@#@@##oo##@@#@ee@..",
      "..#@@@#@@@#ee#@@@#@@@#..",
      "...#@#@@@@@ee@@@@@#@#...",
      "......@@@@@##@@@@@......",
      "......#@@@@@@@@@@#......",
      ".......#@@@@@@@@#.......",
      ".......@@@@@@@@@@.......",
      ".......#@@#..#@@#.......",
      "........................",
    ],
    look: [
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      ".........######.........",
      "...#@#.#@@#@@#@@#.#@#...",
      "..#@@@.@@@@@@@@@@.@@@#..",
      "..@ee@#^^^^^@^^^^^@ee@..",
      ".#@eee@^^^*^@^^^*^eee@#.",
      ".@@eee@^^**^@^^**^eee@@.",
      ".@@eee@^^^^^@^^^^^eee@@.",
      ".@@eee#@@@++++@@@#eee@@.",
      ".@@eee@@@+####+@@@eee@@.",
      ".#@eee@##++oo++##@eee@#.",
      "..@ee@#@@##oo##@@#@ee@..",
      "..#@@@#@@@#ee#@@@#@@@#..",
      "...#@#@@@@@ee@@@@@#@#...",
      "......@@@@@##@@@@@......",
      "......#@@@@@@@@@@#......",
      ".......#@@@@@@@@#.......",
      ".......@@@@@@@@@@.......",
      ".......#@@#..#@@#.......",
      "........................",
    ],
  },
  rabbit: {
    idle: [
      ".......####..####.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#e######e#.......",
      ".......#@@@@@@@@#.......",
      "......#@@@@@@@@@@#......",
      "......^^^^^@@^^^^^......",
      ".....#^^*^^@@^^*^^#.....",
      ".....#^**^^@@^**^^#.....",
      "......^^^^^@@^^^^^......",
      "......#@@@#oo#@@@#.#....",
      ".......#@@#^^^@@##^^^#..",
      ".......####^^^####^^^#..",
      ".......@@@####@@@#^^^#..",
      ".......#@@@@@@@@#..#....",
      "........@@@@@@@@........",
      "........#@@###@#........",
      "........................",
    ],
    blink: [
      ".......####..####.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#e######e#.......",
      ".......#@@@@@@@@#.......",
      "......#@@@@@@@@@@#......",
      "......@@@@@@@@@@@@......",
      ".....#@@@@@@@@@@@@#.....",
      ".....######@@######.....",
      "......@@@@@@@@@@@@......",
      "......#@@@#oo#@@@#.#....",
      ".......#@@#^^^@@##^^^#..",
      ".......####^^^####^^^#..",
      ".......@@@####@@@#^^^#..",
      ".......#@@@@@@@@#..#....",
      "........@@@@@@@@........",
      "........#@@###@#........",
      "........................",
    ],
    look: [
      ".......####..####.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#ee#..#ee#.......",
      ".......#e######e#.......",
      ".......#@@@@@@@@#.......",
      "......#@@@@@@@@@@#......",
      "......^^^^^@@^^^^^......",
      ".....#^^^*^@@^^^*^#.....",
      ".....#^^**^@@^^**^#.....",
      "......^^^^^@@^^^^^......",
      "......#@@@#oo#@@@#.#....",
      ".......#@@#^^^@@##^^^#..",
      ".......####^^^####^^^#..",
      ".......@@@####@@@#^^^#..",
      ".......#@@@@@@@@#..#....",
      "........@@@@@@@@........",
      "........#@@###@#........",
      "........................",
    ],
  },
  frog: {
    idle: [
      "........................",
      "........................",
      "........................",
      "...####..........####...",
      "..#^^^^#........#^^^^#..",
      ".#^^*^^^#......#^^*^^^#.",
      ".#^**^^^#......#^**^^^#.",
      ".#^^^^^^#......#^^^^^^#.",
      "..#^^^^#........#^^^^#..",
      "...####..........####...",
      "........########........",
      "......#@@@@@@@@@@#......",
      ".....#@@@@@@@@@@@@#.....",
      "....#@@@@@#@@#@@@@@#....",
      "...#@@#@@@@++@@@@#@@#...",
      "...#@@@#++++++++#@@@#...",
      "...#@@@+########+@@@#...",
      "....#@@++++++++++@@#....",
      ".....#@@++++++++@@#.....",
      "......#@@++++++@@#......",
      "..#@@#@@##@@@@##@@#@@#..",
      "..#@@#@@#......#@@#@@#..",
      "..#..#..#......#..#..#..",
      "........................",
    ],
    blink: [
      "........................",
      "........................",
      "........................",
      "...####..........####...",
      "..######........######..",
      ".#......#......#......#.",
      ".#......#......#......#.",
      ".#......#......#......#.",
      "..######........######..",
      "...####..........####...",
      "........########........",
      "......#@@@@@@@@@@#......",
      ".....#@@@@@@@@@@@@#.....",
      "....#@@@@@#@@#@@@@@#....",
      "...#@@#@@@@++@@@@#@@#...",
      "...#@@@#++++++++#@@@#...",
      "...#@@@+########+@@@#...",
      "....#@@++++++++++@@#....",
      ".....#@@++++++++@@#.....",
      "......#@@++++++@@#......",
      "..#@@#@@##@@@@##@@#@@#..",
      "..#@@#@@#......#@@#@@#..",
      "..#..#..#......#..#..#..",
      "........................",
    ],
    look: [
      "........................",
      "........................",
      "........................",
      "...####..........####...",
      "..#^^^^#........#^^^^#..",
      ".#^^^*^^#......#^^^*^^#.",
      ".#^^**^^#......#^^**^^#.",
      ".#^^^^^^#......#^^^^^^#.",
      "..#^^^^#........#^^^^#..",
      "...####..........####...",
      "........########........",
      "......#@@@@@@@@@@#......",
      ".....#@@@@@@@@@@@@#.....",
      "....#@@@@@#@@#@@@@@#....",
      "...#@@#@@@@++@@@@#@@#...",
      "...#@@@#++++++++#@@@#...",
      "...#@@@+########+@@@#...",
      "....#@@++++++++++@@#....",
      ".....#@@++++++++@@#.....",
      "......#@@++++++@@#......",
      "..#@@#@@##@@@@##@@#@@#..",
      "..#@@#@@#......#@@#@@#..",
      "..#..#..#......#..#..#..",
      "........................",
    ],
  },
  bird: {
    idle: [
      "...........####.........",
      "..........#@@@@#........",
      ".........#@@@@@@#.......",
      "........#@@@@@^^^^##....",
      ".......#@@@@@@^^*^#o#o..",
      "....###@@@@@@@^*^^ooooo#",
      "...#@@@@@@@@@@^^^^#oo##.",
      ".##@@@@@@@@@@@@@@@@#....",
      "#@@@@@@@@@++++@@@@@#....",
      "#@@@@@@@@@@++++@@@@@@#..",
      "#@@@@@@@@@++++++@@@@@#..",
      "#@@@@@@@@@@@@@@@@@@@#...",
      ".#@@@@@@@@@@@@@@@@#.....",
      "...##@@@@@@@@@@@@#......",
      ".....#@@@@@@@@@@#.......",
      "......##.#....#.#.......",
      "........#.....#.........",
      ".......#.....#..........",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
    ],
    blink: [
      "...........####.........",
      "..........#@@@@#........",
      ".........#@@@@@@#.......",
      "........#@@@@@@@@###....",
      ".......#@@@@@@#####o#o..",
      "....###@@@@@@@@@@@ooooo#",
      "...#@@@@@@@@@@@@@@#oo##.",
      ".##@@@@@@@@@@@@@@@@#....",
      "#@@@@@@@@@++++@@@@@#....",
      "#@@@@@@@@@@++++@@@@@@#..",
      "#@@@@@@@@@++++++@@@@@#..",
      "#@@@@@@@@@@@@@@@@@@@#...",
      ".#@@@@@@@@@@@@@@@@#.....",
      "...##@@@@@@@@@@@@#......",
      ".....#@@@@@@@@@@#.......",
      "......##.#....#.#.......",
      "........#.....#.........",
      ".......#.....#..........",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
    ],
    look: [
      "...........####.........",
      "..........#@@@@#........",
      ".........#@@@@@@#.......",
      "........#@@@@@^^^^##....",
      ".......#@@@@@@^^^*#o#o..",
      "....###@@@@@@@^^*^ooooo#",
      "...#@@@@@@@@@@^^^^#oo##.",
      ".##@@@@@@@@@@@@@@@@#....",
      "#@@@@@@@@@++++@@@@@#....",
      "#@@@@@@@@@@++++@@@@@@#..",
      "#@@@@@@@@@++++++@@@@@#..",
      "#@@@@@@@@@@@@@@@@@@@#...",
      ".#@@@@@@@@@@@@@@@@#.....",
      "...##@@@@@@@@@@@@#......",
      ".....#@@@@@@@@@@#.......",
      "......##.#....#.#.......",
      "........#.....#.........",
      ".......#.....#..........",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
    ],
  },
  blob: {
    idle: [
      "........................",
      "........................",
      "........................",
      "........................",
      "..........####..........",
      ".......##@@@@@@##.......",
      "......##@@@@@@@@##......",
      ".....#@@@@@@@@@@@@#.....",
      ".....#@@@@@@@@@@@@#.....",
      "....#@@@@@@@@@@@@@@#....",
      "....#^^^^^@@@@^^^^^#....",
      "....@^^*^^@@@@^^*^^@....",
      "....@^**^^@@@@^**^^@....",
      "....@^^^^^@@@@^^^^^@....",
      "....#@@@@@@@@@@@@@@#....",
      "....ee@@#@@@@@@#@@ee....",
      ".....#@@@######@@@#.....",
      ".....#@@@@@@@@@@@@#.....",
      "......##@@@@@@@@##......",
      ".......##@@@@@@##.......",
      ".......#@@#####@@#......",
      ".......@@@@...@@@@......",
      ".......#@@#...#@@#......",
      "........................",
    ],
    blink: [
      "........................",
      "........................",
      "........................",
      "........................",
      "..........####..........",
      ".......##@@@@@@##.......",
      "......##@@@@@@@@##......",
      ".....#@@@@@@@@@@@@#.....",
      ".....#@@@@@@@@@@@@#.....",
      "....#@@@@@@@@@@@@@@#....",
      "....#@@@@@@@@@@@@@@#....",
      "....@@@@@@@@@@@@@@@@....",
      "....@#####@@@@#####@....",
      "....@@@@@@@@@@@@@@@@....",
      "....#@@@@@@@@@@@@@@#....",
      "....ee@@#@@@@@@#@@ee....",
      ".....#@@@######@@@#.....",
      ".....#@@@@@@@@@@@@#.....",
      "......##@@@@@@@@##......",
      ".......##@@@@@@##.......",
      ".......#@@#####@@#......",
      ".......@@@@...@@@@......",
      ".......#@@#...#@@#......",
      "........................",
    ],
    look: [
      "........................",
      "........................",
      "........................",
      "........................",
      "..........####..........",
      ".......##@@@@@@##.......",
      "......##@@@@@@@@##......",
      ".....#@@@@@@@@@@@@#.....",
      ".....#@@@@@@@@@@@@#.....",
      "....#@@@@@@@@@@@@@@#....",
      "....#^^^^^@@@@^^^^^#....",
      "....@^^^*^@@@@^^^*^@....",
      "....@^^**^@@@@^^**^@....",
      "....@^^^^^@@@@^^^^^@....",
      "....#@@@@@@@@@@@@@@#....",
      "....ee@@#@@@@@@#@@ee....",
      ".....#@@@######@@@#.....",
      ".....#@@@@@@@@@@@@#.....",
      "......##@@@@@@@@##......",
      ".......##@@@@@@##.......",
      ".......#@@#####@@#......",
      ".......@@@@...@@@@......",
      ".......#@@#...#@@#......",
      "........................",
    ],
  }
};

const SPECIES = [
  ["cat", "Cat", { cap: [6, 5], glasses: [4, 9], bow: [0, 4], scarf: [5, 16] }, [18, 11]],
  ["dog", "Dog", { cap: [6, 2], glasses: [4, 7], bow: [0, 8], scarf: [5, 14] }, [18, 9]],
  ["rabbit", "Rabbit", { cap: [6, 7], glasses: [4, 11], bow: [1, 2], scarf: [5, 17] }, [18, 13]],
  ["frog", "Frog", { cap: [6, 9], glasses: [4, 4], bow: [17, 12], scarf: [5, 17] }, [18, 11]],
  ["bird", "Bird", { cap: [8, 0], glasses: [8, 2], bow: [7, 9], scarf: [4, 10] }, [18, 8]],
  ["blob", "Blob", { cap: [6, 3], glasses: [4, 9], bow: [18, 10], scarf: [5, 16] }, [18, 12]],
].map(([id, label, anchors, paw]) => ({
  id,
  label,
  anchors,
  paw,
  idle: GRIDS[id].idle,
  blink: GRIDS[id].blink,
  look: GRIDS[id].look,
}));

function validateSprites() {
  const overlays = { cap: CAP, bow: BOW, scarf: SCARF, glasses: GLASSES, paw: PAW, heart: HEART, z: ZZZ };
  for (const species of SPECIES) {
    for (const key of ["idle", "blink", "look"]) {
      const rows = species[key];
      if (!rows || rows.length !== SIZE) throw new Error(`${species.id} ${key}`);
      for (const row of rows) {
        if (row.length !== SIZE) throw new Error(`${species.id} ${key} width`);
      }
    }
  }
  for (const [name, rows] of Object.entries(overlays)) {
    const width = rows[0].length;
    if (rows.some((row) => row.length !== width)) throw new Error(`${name} uneven`);
  }
}
validateSprites();

const COAT_HEX = Object.fromEntries(COATS.map(([id, , hex]) => [id, hex]));
const BY_ID = Object.fromEntries(SPECIES.map((species) => [species.id, species]));

function rgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
}

function mix(hex, toward, amount) {
  const from = rgb(hex);
  const to = rgb(toward);
  const mixed = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function shift(rows, dy) {
  const width = rows[0].length;
  const next = Array.from({ length: rows.length }, () => ".".repeat(width));
  rows.forEach((row, index) => {
    const at = index + dy;
    if (at >= 0 && at < rows.length) next[at] = row;
  });
  return next;
}

function airFrame(rows) {
  if (/[#@+*o^e]/.test(rows[0])) return rows;
  return shift(rows, -1);
}

function shear(rows) {
  const mid = Math.floor(rows.length / 2);
  return rows.map((row, index) => (index < mid ? row : `${row.slice(1)}.`.slice(0, row.length)));
}

function mentions(text, words) {
  return words.some((word) => new RegExp(`\\b${word}\\b`, "i").test(text));
}

function moveMood(el) {
  if (!el) return "curious";
  const raw = el.textContent || "";
  const amount = Math.abs(parseFloat(raw.replace(/[^\d.-]/g, ""))) || 0;
  const basis = /bp\b/i.test(raw);
  const big = amount >= (basis ? 6 : 1.5);
  const huge = amount >= (basis ? 20 : 4);
  if (el.classList.contains("up")) return huge ? "dizzy" : big ? "cheer" : "happy";
  if (el.classList.contains("down")) return huge ? "dizzy" : big ? "worry" : "sad";
  return "calm";
}

function newsMood(text) {
  const line = (text || "").trim();
  if (!line) return "curious";
  if (mentions(line, GRIM)) return "worry";
  if (mentions(line, ANGRY)) return "angry";
  if (mentions(line, CHILL)) return "shiver";
  if (mentions(line, LOVE)) return "love";
  if (mentions(line, AWE)) return "awe";
  if (mentions(line, SHOCK)) return "shock";
  if (mentions(line, SPIN)) return "dizzy";
  if (mentions(line, PROUD)) return "proud";
  if (mentions(line, SMIRK)) return "smirk";
  const uneasy = mentions(line, UNEASY);
  const glad = mentions(line, GLAD);
  if (uneasy && !glad) return "sad";
  if (glad) return mentions(line, CHEER_WORDS) ? "cheer" : "happy";
  if (mentions(line, DOUBT)) return "skeptical";
  return "bored";
}

function weatherMood(body) {
  const cond = (body.querySelector(".cond")?.textContent || "").toLowerCase();
  if (!cond) return "curious";
  if (/snow|sleet|freezing|blizzard|ice/.test(cond)) return "shiver";
  if (/thunder|heavy/.test(cond)) return "worry";
  if (/fog|mist|haze|overcast|cloudy/.test(cond)) return "yawn";
  if (/wind/.test(cond)) return "dizzy";
  if (/rain|drizzle|shower/.test(cond)) return "sad";
  if (/clear/.test(cond)) {
    const temp = parseFloat(body.querySelector(".temp")?.textContent);
    const celsius = body.querySelector('[data-unit="c"][aria-pressed="true"]');
    const hot = Number.isFinite(temp) && temp >= (celsius ? 35 : 96);
    return hot ? "worry" : "happy";
  }
  return "calm";
}

function readMood(tile) {
  if (!tile) return "curious";
  const body = tile.querySelector(".body");
  if (!body || body.dataset.ready !== "1") return "curious";
  if (body.querySelector(".error")) return "worry";
  const type = tile.dataset.type;
  if (type === "joke") return body.querySelector(".joke-quote") ? "laugh" : "curious";
  if (type === "weather") return weatherMood(body);
  if (type === "stock-chart" || type === "btc-chart") return moveMood(body.querySelector(".chg"));
  if (type === "change") return moveMood(body.querySelector(".pct"));
  if (type === "overnight") return moveMood(body.querySelector(".lede b") || body.querySelector(".pct"));
  if (type === "debt") return debtMood(body);
  if (type === "headlines" || type === "stock-news" || type === "btc-news") {
    const hed = body.querySelector(".hed");
    return hed ? newsMood(hed.textContent || "") : "curious";
  }
  return "curious";
}

function debtMood(body) {
  const pct = body.querySelector(".debt-stats .pct");
  if (!pct) return "curious";
  const text = pct.textContent || "";
  const amount = Math.abs(parseFloat(text.replace(/[^\d.]/g, ""))) || 0;
  const trillions = /t/i.test(text);
  if (pct.classList.contains("up")) return trillions || amount >= 100 ? "proud" : "cheer";
  if (pct.classList.contains("down")) {
    if (trillions) return "dizzy";
    if (amount >= 50) return "worry";
    return "sad";
  }
  return "calm";
}

function eyeRegions(grid) {
  const height = grid.length;
  const width = grid[0].length;
  const seen = Array.from({ length: height }, () => Array(width).fill(false));
  const regions = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (seen[y][x] || (grid[y][x] !== "^" && grid[y][x] !== "*")) continue;
      const found = [];
      const stack = [[x, y]];
      seen[y][x] = true;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        found.push([cx, cy]);
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || seen[ny][nx]) return;
          if (grid[ny][nx] !== "^" && grid[ny][nx] !== "*") return;
          seen[ny][nx] = true;
          stack.push([nx, ny]);
        });
      }
      if (found.length >= 6) regions.push({ cells: found, minX, maxX, minY, maxY });
    }
  }
  return regions;
}

function restyleEye(grid, box, mood, side) {
  const width = box.maxX - box.minX + 1;
  const height = box.maxY - box.minY + 1;
  const mid = (width - 1) / 2;
  const amp = Math.min(2, Math.max(1, height - 2));
  const dropAt = (lx) => (mid === 0 ? 0 : Math.round((Math.abs(lx - mid) / mid) * amp));
  const droop = mood === "sad" || mood === "shiver";
  const peaks = Array.from({ length: width }, (_, lx) => (droop ? amp - dropAt(lx) : dropAt(lx)));
  box.cells.forEach(([x, y]) => {
    const lx = x - box.minX;
    const ly = y - box.minY;
    if (mood === "happy" || mood === "laugh" || mood === "cheer" || mood === "love" || mood === "proud" || droop) {
      let lo = peaks[lx];
      let hi = peaks[lx];
      [lx - 1, lx + 1].forEach((near) => {
        if (near < 0 || near >= width) return;
        lo = Math.min(lo, peaks[near]);
        hi = Math.max(hi, peaks[near]);
      });
      if (mood === "laugh") hi = Math.min(height - 1, hi + 1);
      grid[y][x] = ly >= lo && ly <= hi ? "#" : "@";
      return;
    }
    if (mood === "angry") {
      const inner = side < 0 ? lx >= Math.ceil(width / 2) : side > 0 ? lx <= Math.floor((width - 1) / 2) : lx <= 1 || lx >= width - 2;
      const pupil = side < 0 ? width - 2 : side > 0 ? 1 : Math.round(mid);
      if (ly === 0 || (ly === 1 && inner)) grid[y][x] = "#";
      else if (ly >= height - 1) grid[y][x] = "@";
      else grid[y][x] = ly >= height - 2 && (lx === pupil || lx === pupil + 1) ? "*" : "@";
      return;
    }
    if (mood === "shock" || mood === "awe") {
      const midY = Math.max(1, Math.floor((height - 1) / 2));
      grid[y][x] = ly === midY && Math.abs(lx - mid) <= 0.6 ? "*" : "^";
      return;
    }
    if (mood === "bored" || mood === "yawn") {
      const lid = Math.max(0, height - 2);
      grid[y][x] = ly === lid ? "#" : "@";
      return;
    }
    if (mood === "dizzy") {
      grid[y][x] = (lx + ly) % 3 === 0 ? "*" : "^";
      return;
    }
    if (mood === "skeptical" || mood === "smirk") {
      if (side <= 0) {
        const pupil = side < 0 ? width - 2 : Math.max(0, Math.floor(mid));
        if (ly === 0 && lx === 0) grid[y][x] = "#";
        else grid[y][x] = ly === 1 && (lx === pupil || lx === Math.min(width - 1, pupil + 1)) ? "*" : "^";
      } else {
        grid[y][x] = ly === Math.max(0, height - 2) ? "#" : "@";
      }
      return;
    }
    if (mood === "calm") {
      if (ly < Math.ceil(height * 0.45)) grid[y][x] = "@";
      else if (ly === height - 2 && Math.abs(lx - mid) <= 0.75) grid[y][x] = "*";
      else grid[y][x] = "^";
      return;
    }
    const pupil = side < 0 ? width - 2 : 1;
    const outer = side < 0 ? lx <= 1 : side > 0 ? lx >= width - 2 : lx === 0 || lx === width - 1;
    if (ly === 0 && outer) grid[y][x] = "#";
    else grid[y][x] = ly === 1 && (lx === pupil || lx === pupil + 1) ? "*" : "^";
  });
  if (mood === "sad") {
    const x = side < 0 ? box.minX : box.maxX;
    const y = box.maxY + 1;
    if (grid[y] && (grid[y][x] === "@" || grid[y][x] === "+" || grid[y][x] === "e")) grid[y][x] = "~";
  }
}

function findMouth(grid, eyeBottom) {
  let best = null;
  for (let y = eyeBottom + 1; y < grid.length - 3; y += 1) {
    let start = 0;
    let run = 0;
    for (let x = 0; x <= grid[y].length; x += 1) {
      if (x < grid[y].length && grid[y][x] === "#") {
        if (run === 0) start = x;
        run += 1;
        continue;
      }
      if (run >= 4 && run <= 10) {
        let interior = 0;
        for (let i = 0; i < run; i += 1) {
          const above = grid[y - 1][start + i];
          const below = grid[y + 1] && grid[y + 1][start + i];
          if ("@+e^".includes(above) || "@+e^".includes(below)) interior += 1;
        }
        if (interior >= run * 0.6 && (!best || run > best.len)) best = { y, start, len: run };
      }
      run = 0;
    }
  }
  return best;
}

function bendMouth(grid, run, dir, reach) {
  const mid = (run.len - 1) / 2;
  for (let i = 0; i < run.len; i += 1) {
    const dist = Math.abs(i - mid);
    const steps = dist <= 0.6 ? reach : dist <= mid * 0.55 ? 1 : 0;
    if (!steps) continue;
    const x = run.start + i;
    let y = run.y;
    if (dir < 0 && grid[y - 1]) {
      const above = grid[y - 1][x];
      if ("@+e.".includes(above)) grid[y][x] = above === "." ? "@" : above;
    }
    for (let step = 0; step < steps; step += 1) {
      const ny = y + dir;
      if (ny < 1 || ny >= grid.length - 1) break;
      const dest = grid[ny][x];
      if (!"@+e.".includes(dest)) break;
      grid[ny][x] = dir > 0 && reach > 1 && step === 0 ? "e" : "#";
      y = ny;
    }
  }
}

function pinchMouth(grid, run, mood) {
  const mid = (run.len - 1) / 2;
  for (let i = 0; i < run.len; i += 1) {
    const x = run.start + i;
    const above = grid[run.y - 1][x];
    const fill = "@+e".includes(above) ? above : "@";
    const dist = Math.abs(i - mid);
    if (mood === "shock") grid[run.y][x] = dist <= 0.6 ? "o" : fill;
    else grid[run.y][x] = dist <= 1.1 ? "#" : fill;
  }
}

function stampNoseMouth(grid, mood) {
  let spot = null;
  for (let y = 0; y < grid.length; y += 1) {
    let start = 0;
    let run = 0;
    for (let x = 0; x <= grid[y].length; x += 1) {
      if (x < grid[y].length && grid[y][x] === "+") {
        if (run === 0) start = x;
        run += 1;
        continue;
      }
      if (run >= 3 && (!spot || run > spot.len)) spot = { y, start, len: run };
      run = 0;
    }
  }
  if (!spot) {
    for (let y = 0; y < grid.length - 2 && !spot; y += 1) {
      const start = grid[y].indexOf("o");
      if (start < 0) continue;
      let end = start;
      while (grid[y][end] === "o") end += 1;
      spot = { y: y + 1, start: Math.floor((start + end - 1) / 2), len: 1 };
    }
  }
  if (!spot) return;
  const x = spot.start + Math.floor((spot.len - 1) / 2);
  const y = spot.y;
  const put = (col, row, ch) => {
    if (!grid[row] || col < 1 || col >= grid[row].length - 1) return;
    if (!"@+e.".includes(grid[row][col])) return;
    grid[row][col] = ch;
  };
  if (mood === "laugh" || mood === "awe") {
    put(x - 1, y, "#");
    put(x, y, "e");
    put(x + 1, y, "#");
    put(x - 1, y + 1, "#");
    put(x, y + 1, "#");
    put(x + 1, y + 1, "#");
    return;
  }
  if (mood === "sad" || mood === "angry" || mood === "shiver") {
    put(x, y, "#");
    put(x - 1, y + 1, "#");
    put(x + 1, y + 1, "#");
    return;
  }
  if (mood === "shock" || mood === "yawn") {
    put(x - 1, y, "#");
    put(x, y, "o");
    put(x + 1, y, "#");
    return;
  }
  if (mood === "bored" || mood === "dizzy") {
    put(x - 1, y, "#");
    put(x, y, "#");
    put(x + 1, y, "#");
    return;
  }
  put(x - 1, y, "#");
  put(x + 1, y, "#");
  put(x, y + 1, "#");
}

const expressionCache = new Map();

function expressionRows(species, mood) {
  const key = `${species.id}:${mood}`;
  const cached = expressionCache.get(key);
  if (cached) return cached;
  const grid = species.idle.map((row) => row.split(""));
  const regions = eyeRegions(grid).sort((a, b) => a.minX - b.minX);
  regions.forEach((box, index) => {
    const side = regions.length === 1 ? 0 : (index === 0 ? -1 : 1);
    restyleEye(grid, box, mood, side);
  });
  if (regions.length && mood !== "worry" && mood !== "calm") {
    const run = findMouth(grid, Math.max(...regions.map((box) => box.maxY)));
    const mouth = mood === "skeptical" || mood === "dizzy" ? "bored" : mood === "yawn" ? "shock" : mood;
    if (mood === "shock" || mood === "bored" || mood === "skeptical" || mood === "yawn" || mood === "dizzy") {
      if (run) pinchMouth(grid, run, mouth);
      else stampNoseMouth(grid, mouth);
    } else if (run) {
      const dir = mood === "sad" || mood === "angry" || mood === "shiver" ? -1 : 1;
      const reach = mood === "laugh" || mood === "awe" ? 2 : 1;
      bendMouth(grid, run, dir, reach);
    } else {
      stampNoseMouth(grid, mood);
    }
  }
  if (mood === "skeptical" || mood === "smirk") {
    regions.forEach((box, index) => {
      const side = regions.length === 1 ? 0 : (index === 0 ? -1 : 1);
      if (side > 0) return;
      const x = box.minX;
      const y = box.minY - 1;
      if (y >= 0 && grid[y] && "@+.".includes(grid[y][x])) grid[y][x] = "#";
    });
  }
  if (mood === "love") {
    regions.forEach((box) => {
      const x = box.minX < grid[0].length / 2 ? Math.max(0, box.minX - 1) : Math.min(grid[0].length - 1, box.maxX + 1);
      const y = box.maxY;
      if (grid[y] && "@+".includes(grid[y][x])) grid[y][x] = "e";
    });
  }
  const rows = grid.map((row) => row.join(""));
  expressionCache.set(key, rows);
  return rows;
}

function frameRows(species, which) {
  if (which === "curious") return species.look;
  if (which === "happy" || which === "laugh" || which === "cheer" || which === "sad" || which === "worry" || which === "calm" || which === "angry" || which === "shock" || which === "love" || which === "skeptical" || which === "bored" || which === "yawn" || which === "proud" || which === "awe" || which === "shiver" || which === "dizzy" || which === "smirk") {
    return expressionRows(species, which);
  }
  if (which === "blink" || which === "sleep") return species.blink;
  if (which === "look") return species.look;
  if (which === "sit") return shift(species.blink, 1);
  if (which === "crouch") return shift(species.idle, 1);
  if (which === "air") return airFrame(species.idle);
  if (which === "stretch") return shear(species.idle);
  return species.idle;
}

function stamp(ctx, rows, origin, colors, width, height) {
  if (!origin || !rows) return;
  const [ox, oy] = origin;
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (!colors[ch]) return;
      const px = ox + x;
      const py = oy + y;
      if (px < 0 || py < 0 || px >= width || py >= height) return;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(px, py, 1, 1);
    });
  });
}

function paint(canvas, rows, coat, accessory, species, paw) {
  const height = rows.length;
  const width = rows[0].length;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  const colors = {
    "#": INK,
    "@": coat,
    "+": mix(coat, PAPER, 0.72),
    "*": INK,
    o: ACCENT,
    "^": EYE,
    e: BLUSH,
    "~": "#6aa6d8",
  };
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (!colors[ch]) return;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(x, y, 1, 1);
    });
  });
  if (width !== SIZE || height !== SIZE || !species) return;
  if (accessory && accessory !== "none") {
    const grid = { cap: CAP, bow: BOW, scarf: SCARF, glasses: GLASSES }[accessory];
    stamp(ctx, grid, species.anchors[accessory], { "#": INK, "@": ACCENT }, width, height);
  }
  if (paw) stamp(ctx, PAW, species.paw, { "#": INK, "@": coat }, width, height);
}

function reduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cleanFrames(value) {
  if (!Array.isArray(value)) return [];
  const frames = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.startsWith("data:image/png;base64,") || item.length > MAX_URL) continue;
    frames.push(item);
    if (frames.length === MAX_FRAMES) break;
  }
  return frames;
}

function loadPet() {
  const fallback = { species: "cat", name: "", coat: "saffron", accessory: "none", hidden: false, custom: { frames: [] } };
  try {
    const saved = JSON.parse(localStorage.getItem(PET_KEY) || "null");
    if (!saved || typeof saved !== "object") return fallback;
    const frames = cleanFrames(saved.custom && saved.custom.frames);
    let species = BY_ID[saved.species] ? saved.species : fallback.species;
    if (saved.species === "custom") species = frames.length ? "custom" : "cat";
    return {
      species,
      name: String(saved.name || "").replace(/\s+/g, " ").trim().slice(0, 16),
      coat: COAT_HEX[saved.coat] ? saved.coat : fallback.coat,
      accessory: ACCESSORIES.includes(saved.accessory) ? saved.accessory : fallback.accessory,
      hidden: Boolean(saved.hidden),
      custom: { frames },
    };
  } catch {
    return fallback;
  }
}

export function bootPet() {
  const stage = document.createElement("div");
  stage.className = "pet-stage";
  stage.innerHTML = `
    <button class="pet" type="button" id="pet">
      <span class="pet-sprite-wrap">
        <canvas class="pet-fx" width="16" height="8" hidden></canvas>
        <canvas class="pet-sprite" width="24" height="24"></canvas>
      </span>
      <span class="pet-shadow" aria-hidden="true"></span>
      <span class="pet-name"></span>
    </button>
    <div class="pet-card" id="pet-card" role="dialog" aria-label="Choose a pet" hidden>
      <p class="pet-kicker">Desk pet</p>
      <div class="pet-species" role="group" aria-label="Species"></div>
      <label class="pet-field">Name
        <input class="pet-name-input" maxlength="16" autocomplete="off" spellcheck="false" placeholder="Pip" />
      </label>
      <div class="pet-upload" hidden>
        <div class="pet-upload-actions">
          <button class="pet-extra" type="button" data-pet-idle>Idle picture</button>
          <button class="pet-extra" type="button" data-pet-anim>Add animation</button>
          <button class="pet-extra" type="button" data-pet-clear>Clear</button>
        </div>
        <div class="pet-frames"></div>
        <p class="pet-hint">Idle picture, then animation frames. Square pixel art, 64 pixels or less.</p>
      </div>
      <div class="pet-coats" role="group" aria-label="Coat"></div>
      <div class="pet-extras" role="group" aria-label="Accessory"></div>
      <p class="pet-note"></p>
      <button class="pet-hide" type="button" data-pet-hide>No pet</button>
    </div>
  `;
  const summon = document.createElement("button");
  summon.className = "pet-summon";
  summon.type = "button";
  summon.textContent = "Pet";
  summon.hidden = true;
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,image/gif,image/webp,image/jpeg";
  fileInput.hidden = true;
  fileInput.dataset.mode = "idle";
  document.body.append(stage, summon, fileInput);

  const pet = stage.querySelector(".pet");
  const card = stage.querySelector(".pet-card");
  const wrap = stage.querySelector(".pet-sprite-wrap");
  const sprite = stage.querySelector(".pet-sprite");
  const fx = stage.querySelector(".pet-fx");
  const nameEl = stage.querySelector(".pet-name");
  const nameInput = stage.querySelector(".pet-name-input");
  const speciesBox = stage.querySelector(".pet-species");
  const coatBox = stage.querySelector(".pet-coats");
  const extraBox = stage.querySelector(".pet-extras");
  const uploadBox = stage.querySelector(".pet-upload");
  const framesBox = stage.querySelector(".pet-frames");
  const note = stage.querySelector(".pet-note");

  const state = loadPet();
  let mode = "idle";
  let lift = 0;
  let faceLeft = false;
  let pos = { x: 28, y: 28 };
  let token = 0;
  let roamTimer = 0;
  let blinkTimer = 0;
  let yawnTimer = 0;
  let animTimer = 0;

  let picking = false;
  let hopping = false;
  let hopFrame = 0;
  let settleTimer = 0;
  let scrolling = false;
  let scrollX = window.scrollX;
  let scrollY = window.scrollY;
  let currentId = "";
  let currentKey = "";
  let lost = false;
  const previews = new Map();
  const images = new Map();

  speciesBox.innerHTML = `${SPECIES.map((species) => `
    <button class="pet-pick" type="button" data-pet-species="${species.id}" aria-pressed="false">
      <canvas class="pet-preview" width="24" height="24"></canvas>
      <span>${species.label}</span>
    </button>
  `).join("")}
    <button class="pet-pick" type="button" data-pet-species="custom" aria-pressed="false">
      <canvas class="pet-preview" width="24" height="24"></canvas>
      <span>Yours</span>
    </button>`;
  speciesBox.querySelectorAll(".pet-preview").forEach((canvas, index) => {
    previews.set(index < SPECIES.length ? SPECIES[index].id : "custom", canvas);
  });
  coatBox.innerHTML = COATS.map(([id, label, hex]) => `
    <button class="pet-coat" type="button" data-pet-coat="${id}" aria-label="${label} coat" aria-pressed="false" style="background:${hex}"></button>
  `).join("");
  extraBox.innerHTML = ACCESSORIES.map((id) => `
    <button class="pet-extra" type="button" data-pet-accessory="${id}" aria-pressed="false">${id}</button>
  `).join("");

  function species() {
    return BY_ID[state.species] || BY_ID.cat;
  }

  function coat() {
    return COAT_HEX[state.coat] || COAT_HEX.saffron;
  }

  function isCustom() {
    return state.species === "custom" && state.custom.frames.length > 0;
  }

  function bump() {
    token += 1;
    window.clearInterval(animTimer);
    animTimer = 0;
    if (hopFrame) {
      window.cancelAnimationFrame(hopFrame);
      hopFrame = 0;
    }
    hopping = false;
  }

  function alive() {
    const current = token;
    return () => current === token;
  }

  function imageFor(url) {
    if (!url) return null;
    let img = images.get(url);
    if (img) return img;
    img = new Image();
    images.set(url, img);
    img.onload = () => {
      paintCustomPreview();
      if (isCustom()) {
        paintSprite();
        readChrome();
        place();
        placeSummon();
        if (!card.hidden) placeCard();
      }
    };
    img.src = url;
    return img;
  }

  function metrics() {
    if (isCustom()) {
      const img = images.get(state.custom.frames[0]);
      if (img && img.naturalWidth) {
        const target = window.innerWidth < 720 ? 64 : 84;
        const scale = Math.max(1, Math.floor(target / Math.max(img.naturalWidth, img.naturalHeight)));
        return { w: img.naturalWidth * scale, h: img.naturalHeight * scale };
      }
    }
    const px = SIZE * 3;
    return { w: px, h: px };
  }

  function blockHeight() {
    return footHeight();
  }

  function dockHeight() {
    const dock = document.querySelector(".dock-wrap");
    return dock ? Math.ceil(dock.getBoundingClientRect().height) : 150;
  }

  function applyScale() {
    const size = metrics();
    sprite.style.width = `${size.w}px`;
    sprite.style.height = `${size.h}px`;
    const fxScale = Math.max(1, Math.floor(size.w / 16));
    fx.style.width = `${16 * fxScale}px`;
    fx.style.height = `${8 * fxScale}px`;
  }

  function label() {
    const who = isCustom()
      ? (state.name ? `${state.name}, your pet` : "Your pet")
      : (state.name ? `${state.name}, ${species().label.toLowerCase()}` : species().label);
    pet.setAttribute("aria-label", `${who}. Choose a pet.`);
    pet.dataset.species = isCustom() ? "custom" : species().id;
    pet.dataset.coat = state.coat;
    pet.dataset.accessory = state.accessory;
  }

  function customIndex(which, step) {
    const count = state.custom.frames.length;
    if (count <= 1) return 0;
    if (which === "idle" || which === "blink" || which === "look") return 0;
    return (Math.abs(step) % (count - 1)) + 1;
  }

  function paintCustomCanvas(canvas, index) {
    const url = state.custom.frames[index] || state.custom.frames[0];
    const img = imageFor(url);
    if (!img || !img.naturalWidth) return false;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return true;
  }

  function paintCustomPreview() {
    const canvas = previews.get("custom");
    if (!canvas) return;
    const url = state.custom.frames[0];
    const ctx = canvas.getContext("2d");
    canvas.width = 24;
    canvas.height = 24;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 24, 24);
    const img = url ? images.get(url) : null;
    if (!img || !img.naturalWidth) {
      ctx.fillStyle = INK;
      ctx.fillRect(11, 6, 2, 12);
      ctx.fillRect(6, 11, 12, 2);
      return;
    }
    const fit = 24 / Math.max(img.naturalWidth, img.naturalHeight);
    const w = Math.max(1, Math.round(img.naturalWidth * fit));
    const h = Math.max(1, Math.round(img.naturalHeight * fit));
    ctx.drawImage(img, Math.floor((24 - w) / 2), Math.floor((24 - h) / 2), w, h);
  }

  function paintSprite(step = 0) {
    if (isCustom()) {
      const which = mode === "hop" ? "air" : mode;
      paintCustomCanvas(sprite, customIndex(which, step));
      return;
    }
    const current = species();
    const which = mode === "hop" ? "idle" : mode;
    paint(sprite, frameRows(current, which), coat(), state.accessory, current, which === "wave");
  }

  function paintCurrent() {
    paintSprite();
    for (const item of SPECIES) {
      const canvas = previews.get(item.id);
      if (canvas) paint(canvas, item.idle, coat(), state.accessory, item, false);
    }
    paintCustomPreview();
    label();
  }

  function paintFx(kind) {
    const rows = { z: ZZZ, heart: HEART, tear: TEAR, sweat: SWEAT, note: NOTE, star: STAR, steam: STEAM, bang: BANG, ask: ASK, snow: SNOW, spark: SPARK, medal: MEDAL, swirl: SWIRL }[kind];
    if (!rows) {
      fx.hidden = true;
      return;
    }
    fx.hidden = false;
    paint(fx, rows, ACCENT, "none", null, false);
  }

  const chrome = { dock: 150, foot: 80 };

  function readChrome() {
    applyScale();
    chrome.dock = dockHeight();
    chrome.foot = footHeight();
  }

  function place() {
    pet.style.left = `${pos.x}px`;
    pet.style.top = `${pos.y}px`;
    sprite.style.transform = faceLeft ? "scaleX(-1)" : "";
    wrap.style.transform = lift ? `translateY(${lift}px)` : "";
  }

  function placeSummon() {
    summon.style.bottom = `${chrome.dock + 12}px`;
  }

  function clamp(point) {
    const size = metrics();
    const maxX = Math.max(8, window.innerWidth - size.w - 8);
    const maxY = Math.max(8, window.innerHeight - chrome.dock - chrome.foot - 8);
    return {
      x: Math.round(Math.min(maxX, Math.max(8, point.x))),
      y: Math.round(Math.min(maxY, Math.max(8, point.y))),
    };
  }

  function stopMoodAnim() {
    window.clearInterval(animTimer);
    animTimer = 0;
  }

  function playMoodAnim(which) {
    stopMoodAnim();
    if (!isCustom() || state.custom.frames.length < 2) return;
    if (which === "calm" || which === "curious" || which === "bored") return;
    let step = 0;
    const still = alive();
    animTimer = window.setInterval(() => {
      if (!still() || mode !== which) {
        stopMoodAnim();
        return;
      }
      step += 1;
      if (step > (state.custom.frames.length - 1) * 2) {
        stopMoodAnim();
        paintCustomCanvas(sprite, 0);
        return;
      }
      paintCustomCanvas(sprite, customIndex(which, step));
    }, 140);
  }

  function showPose(which, step = 0) {
    mode = which;
    const mood = Object.prototype.hasOwnProperty.call(MOOD_FX, which);
    if (isCustom()) {
      paintCustomCanvas(sprite, mood ? 0 : customIndex(which, step));
      if (mood) playMoodAnim(which);
      else stopMoodAnim();
    } else {
      stopMoodAnim();
      const current = species();
      paint(sprite, frameRows(current, which), coat(), state.accessory, current, which === "wave");
    }
    if (which === "sleep") paintFx("z");
    else if (which === "heart") paintFx("heart");
    else paintFx(mood ? MOOD_FX[which] : "");
    if (mood) pet.dataset.mood = which;
    label();
  }

  function footHeight() {
    if (pet.offsetHeight > 20) return pet.offsetHeight;
    return metrics().h + 8 + (state.name ? 14 : 0);
  }

  function sectionTiles() {
    return [...document.querySelectorAll("#board .tile")];
  }

  function band() {
    return {
      min: 48,
      max: Math.max(48, window.innerHeight - chrome.dock - chrome.foot - 8),
    };
  }

  function inBand(y) {
    const room = band();
    return y >= room.min && y <= room.max;
  }

  function perchPoint(box, x, rawY) {
    if (!box || box.width < 24 || box.height < 8) return null;
    const size = metrics();
    return {
      x: Math.round(Math.max(8, Math.min(x, window.innerWidth - size.w - 8))),
      y: Math.round(rawY),
    };
  }

  function perch(tile) {
    if (!tile) return null;
    const box = tile.getBoundingClientRect();
    if (box.width < 40) return null;
    const size = metrics();
    const foot = footHeight();
    const rawY = Math.round(box.top - foot + 6);
    const tools = tile.querySelector(".tools");
    const toolsLeft = tools ? tools.getBoundingClientRect().left : box.right;
    let x = Math.round(box.left + (box.width - size.w) / 2);
    if (x + size.w > toolsLeft - 4) x = Math.round(toolsLeft - size.w - 6);
    x = Math.max(Math.round(box.left + 2), Math.min(x, Math.round(box.right - size.w - 2)));
    return perchPoint(box, x, rawY);
  }

  function perchStory(story) {
    const hed = story.querySelector(".hed") || story;
    const box = hed.getBoundingClientRect();
    const size = metrics();
    const eye = Math.round(size.h * 0.42);
    let x = Math.round(box.left - size.w + 6);
    let rawY = Math.round(box.top + Math.min(box.height, 28) / 2 - eye);
    if (x < 8) {
      x = Math.round(Math.max(8, box.left));
      rawY = Math.round(box.top - size.h - 2);
    }
    return perchPoint(box, x, rawY);
  }

  function stops(all) {
    const found = [];
    sectionTiles().forEach((tile) => {
      const news = tile.dataset.type === "headlines" || tile.dataset.type === "stock-news" || tile.dataset.type === "btc-news";
      const stories = news ? [...tile.querySelectorAll(".story")] : [];
      if (stories.length) {
        stories.forEach((story, index) => {
          const spot = perchStory(story);
          if (!spot || (!all && !inBand(spot.y))) return;
          found.push({ key: `${tile.dataset.id}:${index}`, tile, story, index, spot });
        });
        return;
      }
      const spot = perch(tile);
      if (!spot || (!all && !inBand(spot.y))) return;
      found.push({ key: `${tile.dataset.id}:`, tile, story: null, index: -1, spot });
    });
    found.sort((a, b) => {
      const ab = (a.story || a.tile).getBoundingClientRect();
      const bb = (b.story || b.tile).getBoundingClientRect();
      return Math.round(ab.top / 12) - Math.round(bb.top / 12) || ab.left - bb.left;
    });
    return found;
  }

  function activeStop() {
    return stops(true).find((stop) => stop.key === currentKey) || null;
  }

  function remember(stop) {
    currentKey = stop.key;
    currentId = stop.tile.dataset.id;
    pet.dataset.section = currentId;
    if (stop.story) pet.dataset.story = String(stop.index);
    else delete pet.dataset.story;
  }

  function moodFor(stop) {
    if (!stop) return "curious";
    if (stop.story) {
      const body = stop.tile.querySelector(".body");
      if (!body || body.dataset.ready !== "1") return "curious";
      const hed = stop.story.querySelector(".hed");
      return hed ? newsMood(hed.textContent || "") : "curious";
    }
    return readMood(stop.tile);
  }

  function faceToward(el) {
    if (!el) return;
    const hed = el.classList && el.classList.contains("story") ? el.querySelector(".hed") : null;
    const box = (hed || el).getBoundingClientRect();
    faceLeft = pos.x + metrics().w / 2 > box.left + box.width / 2;
  }

  function currentTile() {
    if (!currentId) return null;
    return document.querySelector(`#board .tile[data-id="${CSS.escape(currentId)}"]`);
  }

  function stick() {
    if (scrolling || state.hidden || hopping) return;
    if (!currentKey && card.hidden) {
      const first = stops()[0];
      if (!first) return;
      remember(first);
      pos = first.spot;
      faceToward(first.story || first.tile);
      showPose(moodFor(first));
      place();
      return;
    }
    const stop = activeStop();
    if (!stop || !inBand(stop.spot.y)) {
      if (lost || !card.hidden) return;
      lost = true;
      window.clearTimeout(roamTimer);
      roamTimer = window.setTimeout(() => {
        lost = false;
        bounce();
      }, 280);
      return;
    }
    lost = false;
    pos = stop.spot;
    faceToward(stop.story || stop.tile);
    place();
  }

  function refreshMood() {
    if (hopping || state.hidden || !card.hidden) return;
    const stop = activeStop();
    if (!stop) return;
    const mood = moodFor(stop);
    if (mood !== mode) showPose(mood);
    stick();
  }

  function scheduleBlink() {
    window.clearTimeout(blinkTimer);
    blinkTimer = window.setTimeout(() => {
      const expressive = Object.prototype.hasOwnProperty.call(MOOD_FX, mode);
      if ((mode === "idle" || expressive) && !state.hidden && card.hidden && !hopping && !reduceMotion() && !isCustom()) {
        const back = mode;
        const current = species();
        paint(sprite, frameRows(current, "blink"), coat(), state.accessory, current, false);
        window.setTimeout(() => {
          if (mode === back && !hopping) showPose(back);
        }, 140);
      }
      scheduleBlink();
    }, 2200 + Math.random() * 2600);
  }

  function scheduleYawn() {
    window.clearTimeout(yawnTimer);
    yawnTimer = window.setTimeout(() => {
      const quiet = mode === "calm" || mode === "bored" || mode === "curious" || mode === "idle";
      if (quiet && !state.hidden && card.hidden && !hopping && !scrolling && !reduceMotion()) {
        const back = mode;
        showPose("yawn");
        window.setTimeout(() => {
          if (mode === "yawn" && !hopping) showPose(back);
        }, 1100);
      }
      scheduleYawn();
    }, 9000 + Math.random() * 11000);
  }

  function schedule() {
    window.clearTimeout(roamTimer);
    if (state.hidden || !card.hidden) return;
    roamTimer = window.setTimeout(() => {
      if (state.hidden || !card.hidden) return;
      bounce();
    }, 20000);
  }

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
  }

  function hopLift(t, arc) {
    if (t < 0.14) return Math.round(Math.sin((t / 0.14) * Math.PI) * 6);
    if (t < 0.62) {
      const rise = (t - 0.14) / 0.48;
      return -Math.round(Math.sin(rise * Math.PI) * arc);
    }
    if (t < 0.74) return Math.round(Math.sin(((t - 0.62) / 0.12) * Math.PI) * 8);
    if (t < 0.9) {
      const rebound = Math.sin(((t - 0.74) / 0.16) * Math.PI);
      return -Math.round(rebound * Math.min(28, arc * 0.36));
    }
    return 0;
  }

  function hopTo(dest, done) {
    const still = alive();
    faceLeft = dest.x < pos.x;
    if (reduceMotion()) {
      pos = dest;
      lift = 0;
      hopping = false;
      place();
      done();
      return;
    }
    if (hopFrame) window.cancelAnimationFrame(hopFrame);
    hopping = true;
    readChrome();
    const from = { ...pos };
    const dist = Math.hypot(dest.x - from.x, dest.y - from.y) || 1;
    const arc = Math.max(64, Math.min(132, Math.round(36 + dist * 0.22)));
    const duration = Math.max(1200, Math.min(1900, 980 + dist * 0.7));
    const started = performance.now();
    let pose = "";
    let posed = -1;
    const step = (now) => {
      if (!still()) {
        hopping = false;
        hopFrame = 0;
        lift = 0;
        return;
      }
      const t = Math.min(1, (now - started) / duration);
      const travel = easeInOut(Math.min(1, t / 0.72));
      const raw = {
        x: from.x + (dest.x - from.x) * travel,
        y: from.y + (dest.y - from.y) * travel,
      };
      const boxed = clamp(raw);
      pos = inBand(from.y) ? boxed : { x: boxed.x, y: Math.round(raw.y) };
      lift = hopLift(t, arc);
      const frame = t < 0.14 ? "crouch" : t < 0.74 ? "air" : t < 0.9 ? "crouch" : "idle";
      const frameStep = Math.round(t * 6);
      if (frame !== pose || frameStep !== posed) {
        pose = frame;
        posed = frameStep;
        showPose(frame, frameStep);
      }
      place();
      if (t < 1) {
        hopFrame = window.requestAnimationFrame(step);
        return;
      }
      hopFrame = 0;
      hopping = false;
      done();
    };
    hopFrame = window.requestAnimationFrame(step);
  }

  function landHop() {
    const stop = activeStop();
    if (stop && inBand(stop.spot.y)) pos = stop.spot;
    lift = 0;
    faceToward(stop ? stop.story || stop.tile : null);
    showPose(stop ? moodFor(stop) : "curious");
    place();
    schedule();
  }

  function bounce() {
    if (state.hidden || !card.hidden || hopping) return;
    const list = stops();
    if (!list.length) {
      showPose("curious");
      pet.dataset.section = "";
      delete pet.dataset.story;
      currentKey = "";
      currentId = "";
      place();
      schedule();
      return;
    }
    const index = list.findIndex((stop) => stop.key === currentKey);
    let next = list[(index + 1) % list.length];
    if (index < 0) {
      const mid = (band().min + band().max) / 2;
      let best = Infinity;
      list.forEach((stop) => {
        const dist = Math.abs(stop.spot.y - mid);
        if (dist < best) {
          best = dist;
          next = stop;
        }
      });
    }
    if (!next || !next.spot) {
      schedule();
      return;
    }
    remember(next);
    hopTo(next.spot, landHop);
  }

  function stopHop() {
    if (hopFrame) window.cancelAnimationFrame(hopFrame);
    hopFrame = 0;
    if (!hopping && !lift) return;
    hopping = false;
    lift = 0;
    place();
  }

  function nearestStop() {
    const list = stops();
    let best = null;
    let bestDist = Infinity;
    list.forEach((stop) => {
      const dist = Math.hypot(stop.spot.x - pos.x, stop.spot.y - pos.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = stop;
      }
    });
    return best;
  }

  function comeBack() {
    if (!scrolling) return;
    scrolling = false;
    window.clearTimeout(settleTimer);
    settleTimer = 0;
    if (state.hidden || !card.hidden) return;
    const current = activeStop();
    if (current && inBand(current.spot.y)) {
      const dist = Math.hypot(current.spot.x - pos.x, current.spot.y - pos.y);
      if (dist < 48) {
        lost = false;
        pos = current.spot;
        faceToward(current.story || current.tile);
        showPose(moodFor(current));
        place();
        schedule();
        return;
      }
    }
    const stop = (current && inBand(current.spot.y) && current) || nearestStop();
    if (!stop) {
      pos = clamp(pos);
      place();
      schedule();
      return;
    }
    remember(stop);
    hopTo(stop.spot, landHop);
  }

  function followScroll() {
    const x = window.scrollX;
    const y = window.scrollY;
    const dx = x - scrollX;
    const dy = y - scrollY;
    scrollX = x;
    scrollY = y;
    if (state.hidden || !card.hidden || (!dx && !dy)) return;
    scrolling = true;
    window.clearTimeout(roamTimer);
    window.clearTimeout(settleTimer);
    stopHop();
    pos.x -= dx;
    pos.y -= dy;
    place();
    const wait = "onscrollend" in window ? 700 : 200;
    settleTimer = window.setTimeout(comeBack, wait);
  }

  function bootSettle() {
    const list = stops();
    if (!list.length) {
      pos = clamp({
        x: 28,
        y: window.innerHeight - dockHeight() - footHeight() - 20,
      });
      showPose("curious");
      place();
      return;
    }
    const first = list[0];
    remember(first);
    pos = first.spot;
    faceToward(first.story || first.tile);
    showPose(moodFor(first));
    place();
  }

  function renderFrames() {
    framesBox.replaceChildren();
    state.custom.frames.forEach((url, index) => {
      const item = document.createElement("div");
      item.className = "pet-frame";
      const img = document.createElement("img");
      img.alt = index === 0 ? "Idle picture" : `Animation ${index}`;
      img.src = url;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "pet-frame-x";
      remove.dataset.petFrame = String(index);
      remove.setAttribute("aria-label", index === 0 ? "Remove idle picture" : `Remove animation ${index}`);
      remove.textContent = "×";
      item.append(img, remove);
      framesBox.append(item);
    });
  }

  function syncPicks() {
    speciesBox.querySelectorAll("[data-pet-species]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.petSpecies === state.species ? "true" : "false");
    });
    coatBox.querySelectorAll("[data-pet-coat]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.petCoat === state.coat ? "true" : "false");
    });
    extraBox.querySelectorAll("[data-pet-accessory]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.petAccessory === state.accessory ? "true" : "false");
    });
    coatBox.hidden = state.species === "custom";
    extraBox.hidden = state.species === "custom";
    uploadBox.hidden = state.species !== "custom";
    nameEl.textContent = state.name;
    nameInput.value = state.name;
    renderFrames();
    if (state.custom.frames[0]) imageFor(state.custom.frames[0]);
  }

  function present() {
    pet.hidden = state.hidden;
    summon.hidden = !state.hidden;
    syncPicks();
    if (!state.hidden) {
      mode = "idle";
      lift = 0;
    }
    paintCurrent();
    readChrome();
    placeSummon();
    if (!state.hidden) place();
  }

  function placeCard() {
    const anchor = state.hidden ? summon.getBoundingClientRect() : pet.getBoundingClientRect();
    const width = card.offsetWidth || 340;
    const height = card.offsetHeight || 360;
    let left = anchor.right + 10;
    if (left + width > window.innerWidth - 8) left = anchor.left - width - 10;
    if (left < 8) left = 8;
    let top = anchor.top;
    const limit = window.innerHeight - dockHeight() - 8;
    if (top + height > limit) top = limit - height;
    if (top < 8) top = 8;
    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;
  }

  function setCard(open) {
    card.hidden = !open;
    pet.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      bump();
      window.clearTimeout(roamTimer);
      lift = 0;
      if (!state.hidden) showPose("idle");
      place();
      placeCard();
    } else {
      const stop = activeStop();
      if (stop) {
        showPose(moodFor(stop));
        stick();
      }
      schedule();
    }
  }

  function save() {
    try {
      localStorage.setItem(PET_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  function restore(backup) {
    state.species = backup.species;
    state.hidden = backup.hidden;
    state.custom = backup.custom;
  }

  function pickFiles(mode) {
    if (mode === "anim" && state.custom.frames.length >= MAX_FRAMES) {
      note.textContent = "Eight frames is the limit.";
      return;
    }
    picking = true;
    fileInput.dataset.mode = mode;
    fileInput.multiple = mode === "anim";
    fileInput.value = "";
    fileInput.click();
  }

  function decodeFile(file) {
    return new Promise((resolve, reject) => {
      const named = /\.(png|gif|webp|jpe?g)$/i.test(file.name || "");
      if (!file || (!file.type.startsWith("image/") && !named)) {
        reject(new Error("picture"));
        return;
      }
      if (file.size > MAX_FILE) {
        reject(new Error("big"));
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const factor = Math.max(1, Math.ceil(Math.max(img.naturalWidth, img.naturalHeight) / MAX_EDGE));
        const w = Math.max(1, Math.round(img.naturalWidth / factor));
        const h = Math.max(1, Math.round(img.naturalHeight / factor));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, w, h);
        const data = canvas.toDataURL("image/png");
        if (data.length > MAX_URL) {
          reject(new Error("big"));
          return;
        }
        resolve(data);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("picture"));
      };
      img.src = url;
    });
  }

  pet.addEventListener("click", () => setCard(card.hidden));
  summon.addEventListener("click", () => setCard(card.hidden));
  card.addEventListener("click", (event) => {
    const speciesButton = event.target.closest("[data-pet-species]");
    if (speciesButton) {
      const id = speciesButton.dataset.petSpecies;
      if (id === "custom" && !state.custom.frames.length) {
        pickFiles("idle");
        return;
      }
      state.species = id;
      state.hidden = false;
      note.textContent = "";
      save();
      present();
      setCard(true);
      placeCard();
      return;
    }
    const coatButton = event.target.closest("[data-pet-coat]");
    if (coatButton) {
      state.coat = coatButton.dataset.petCoat;
      save();
      present();
      return;
    }
    const extra = event.target.closest("[data-pet-accessory]");
    if (extra) {
      state.accessory = extra.dataset.petAccessory;
      save();
      present();
      return;
    }
    if (event.target.closest("[data-pet-idle]")) {
      pickFiles("idle");
      return;
    }
    if (event.target.closest("[data-pet-anim]")) {
      pickFiles("anim");
      return;
    }
    if (event.target.closest("[data-pet-clear]")) {
      state.custom.frames = [];
      if (state.species === "custom") state.species = "cat";
      note.textContent = "";
      save();
      present();
      placeCard();
      return;
    }
    const frameButton = event.target.closest("[data-pet-frame]");
    if (frameButton) {
      state.custom.frames.splice(Number(frameButton.dataset.petFrame), 1);
      if (!state.custom.frames.length && state.species === "custom") state.species = "cat";
      note.textContent = "";
      save();
      present();
      placeCard();
      return;
    }
    if (event.target.closest("[data-pet-hide]")) {
      state.hidden = true;
      save();
      setCard(false);
      present();
    }
  });
  nameInput.addEventListener("input", () => {
    state.name = nameInput.value.replace(/\s+/g, " ").trim().slice(0, 16);
    nameEl.textContent = state.name;
    label();
    readChrome();
    if (currentId) stick();
    else place();
    save();
  });
  nameInput.addEventListener("blur", () => {
    nameInput.value = state.name;
  });
  fileInput.addEventListener("change", async () => {
    const files = [...fileInput.files];
    picking = true;
    window.setTimeout(() => {
      picking = false;
    }, 400);
    if (!files.length) return;
    const backup = JSON.parse(JSON.stringify(state));
    const modeName = fileInput.dataset.mode || "idle";
    try {
      const urls = [];
      for (const file of files) urls.push(await decodeFile(file));
      if (modeName === "idle") {
        state.custom.frames = [urls[0], ...state.custom.frames.slice(1)].slice(0, MAX_FRAMES);
      } else if (!state.custom.frames.length) {
        state.custom.frames = urls.slice(0, MAX_FRAMES);
      } else {
        for (const url of urls) {
          if (state.custom.frames.length >= MAX_FRAMES) break;
          state.custom.frames.push(url);
        }
      }
      state.species = "custom";
      state.hidden = false;
      if (!save()) {
        restore(backup);
        note.textContent = "That picture is too big to keep.";
      } else {
        note.textContent = "";
      }
    } catch (error) {
      restore(backup);
      note.textContent = error.message === "big" ? "Use a smaller picture." : "That file is not a picture.";
    }
    present();
    setCard(true);
    placeCard();
  });

  document.addEventListener("click", (event) => {
    if (card.hidden || picking) return;
    if (event.target.closest(".pet-card") || event.target.closest(".pet") || event.target.closest(".pet-summon")) return;
    setCard(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || card.hidden) return;
    event.stopPropagation();
    setCard(false);
  }, true);
  window.addEventListener("focus", () => {
    window.setTimeout(() => {
      picking = false;
    }, 300);
  });

  window.addEventListener("resize", () => {
    readChrome();
    placeSummon();
    if (currentId) stick();
    else {
      pos = clamp(pos);
      place();
    }
    if (!card.hidden) placeCard();
  });
  const dock = document.querySelector(".dock-wrap");
  if (dock && "ResizeObserver" in window) {
    new ResizeObserver(() => {
      readChrome();
      placeSummon();
      if (currentId) stick();
      else {
        pos = clamp(pos);
        place();
      }
      if (!card.hidden) placeCard();
    }).observe(dock);
  }
  window.addEventListener("scroll", followScroll, { passive: true });
  window.addEventListener("scrollend", comeBack, { passive: true });
  const board = document.querySelector("#board");
  if (board) {
    let moodFrame = 0;
    new MutationObserver(() => {
      if (moodFrame) return;
      moodFrame = window.requestAnimationFrame(() => {
        moodFrame = 0;
        refreshMood();
      });
    }).observe(board, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "data-ready"],
    });
  }
  document.addEventListener("visibilitychange", () => {
    bump();
    hopping = false;
    lift = 0;
    if (document.hidden) window.clearTimeout(roamTimer);
    else {
      if (!state.hidden && card.hidden) {
        const stop = activeStop();
        showPose(stop ? moodFor(stop) : "curious");
        stick();
      }
      schedule();
    }
  });

  present();
  bootSettle();
  scheduleBlink();
  scheduleYawn();
  schedule();
}
