"""One dad joke at a time, with no repeat until the pile is used up."""

from __future__ import annotations

import json
import random
import threading
from pathlib import Path

from brieflib.net import UpstreamError, fetch_json

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / ".joke-deck.json"

LOCAL = [
    "I only know 25 letters of the alphabet. I don't know y.",
    "I used to hate facial hair, but then it grew on me.",
    "Why don't scientists trust atoms? They make up everything.",
    "I'm reading a book about anti-gravity. It's impossible to put down.",
    "Did you hear about the claustrophobic astronaut? He just needed a little space.",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    "What's the best thing about Switzerland? I don't know, but the flag is a big plus.",
    "I was going to tell a time-traveling joke, but you didn't like it.",
    "Why did the bicycle fall over? It was two tired.",
    "I used to be a banker, but I lost interest.",
    "What do you call a fake noodle? An impasta.",
    "Why don't eggs tell jokes? They'd crack each other up.",
    "I asked the librarian for books on paranoia. She whispered that they were right behind me.",
    "What do you call cheese that isn't yours? Nacho cheese.",
    "I don't trust stairs. They're always up to something.",
    "Why did the coffee file a police report? It got mugged.",
    "How does a penguin build its house? Igloos it together.",
    "I told my computer I needed a break, and now it won't stop sending me candy ads.",
    "Why can't you hear a pterodactyl use the bathroom? The P is silent.",
    "I'm on a seafood diet. I see food and I eat it.",
    "What did the ocean say to the beach? Nothing, it just waved.",
    "Why did the math book look so sad? It had too many problems.",
    "I used to play piano by ear, but now I use my hands.",
    "What do you call a bear with no teeth? A gummy bear.",
    "Why did the golfer bring two pairs of pants? In case he got a hole in one.",
    "I wasn't sure about the brain transplant, but then I changed my mind.",
    "What do you call a can opener that doesn't work? A can't opener.",
    "Did you hear about the restaurant on the moon? Great food, no atmosphere.",
    "Why did the tomato turn red? It saw the salad dressing.",
    "I would tell you a construction joke, but I'm still working on it.",
    "What do you call a snowman with a six-pack? An abdominal snowman.",
    "How do you organize a space party? You planet.",
    "Why did the picture go to jail? It was framed.",
    "What did one wall say to the other wall? I'll meet you at the corner.",
    "Why don't skeletons fight each other? They don't have the guts.",
    "I used to be addicted to soap, but I'm clean now.",
    "What do you call a factory that makes okay products? A satisfactory.",
    "I have a joke about a pencil, but it's pointless.",
    "What lights up a soccer stadium? A soccer match.",
    "Why did the chicken join a band? It had the drumsticks.",
    "I'm reading a book about mazes. I got lost in it.",
    "What do you call a boomerang that doesn't come back? A stick.",
    "Why was the broom late? It overswept.",
    "What did the zero say to the eight? Nice belt.",
    "Why did the student eat his homework? The teacher said it was a piece of cake.",
    "How do cows stay up to date? They read the moos-paper.",
    "What do you call a fish wearing a bow tie? Sofishticated.",
    "Why did the cookie go to the doctor? It felt crummy.",
    "I went looking for my missing watch, but I could never find the time.",
    "What do you call a pile of cats? A meowtain.",
    "Why are elevator jokes so good? They work on many levels.",
    "I told a joke about a roof once. It went over everyone's head.",
    "What did the grape do when it got stepped on? It let out a little wine.",
    "Why did the man run around his bed? He wanted to catch up on his sleep.",
    "How do you make a tissue dance? Put a little boogie in it.",
    "What do you call a dinosaur that crashes his car? Tyrannosaurus wrecks.",
    "Why did the stadium get hot after the game? All the fans left.",
    "What do you call a lazy kangaroo? A pouch potato.",
    "Why can't a nose be 12 inches long? Because then it would be a foot.",
    "I wondered why the baseball kept getting bigger. Then it hit me.",
    "What do you call a magic dog? A Labracadabrador.",
    "Why did the barber win the race? He knew all the shortcuts.",
    "How does a scientist freshen her breath? With experi-mints.",
    "What did the left eye say to the right eye? Between you and me, something smells.",
    "I have a joke about chemistry, but I don't think it will get a reaction.",
    "What do you call a sleeping bull? A bulldozer.",
    "How do trees get online? They log in.",
    "What do you call musical whales? An orca-stra.",
    "I spilled spot remover on my dog. Now he's gone.",
    "What do you call a belt made of watches? A waist of time.",
    "What did the big flower say to the little flower? Hi, bud.",
    "Why don't oysters donate to charity? Because they are shellfish.",
    "I tried to catch some fog. I mist.",
    "What do you call a sad strawberry? A blueberry.",
    "What has ears but cannot hear? A cornfield.",
    "Why did the invisible man turn down the job? He couldn't see himself doing it.",
    "How do you find a dogwood tree? By its bark.",
    "What do you call an alligator in a vest? An investigator.",
    "Why did the cowboy buy a dachshund? He wanted to get a long little doggy.",
    "What do you call a fish with no eyes? A fsh.",
    "Why are ghosts bad liars? You can see right through them.",
    "What did one hat say to the other? You stay here. I'll go on ahead.",
    "Why did the melon jump into the lake? It wanted to be a watermelon.",
    "I ordered a chicken and an egg from the store. I'll let you know which comes first.",
    "What do you call a bear caught in the rain? A drizzly bear.",
    "How do you count cows? With a cowculator.",
    "What do you call a sheep with no legs? A cloud.",
    "Why did the cookie cry? Because his mother was a wafer so long.",
    "What do you call two birds in love? Tweethearts.",
    "Why was six afraid of seven? Because seven eight nine.",
    "What do you call a pony with a cough? A little horse.",
    "Why do bananas use sunscreen? Because they peel.",
    "What did the janitor say when he jumped out of the closet? Supplies.",
    "Why did the frog take the bus to work? His car got toad.",
    "I have a stepladder. I never knew my real ladder.",
    "Why did the orange stop in the middle of the road? It ran out of juice.",
    "What do you call a fly without wings? A walk.",
    "Why don't mountains get cold? They wear snowcaps.",
    "I told my suitcase we weren't going on vacation. Now I'm dealing with emotional baggage.",
    "What do you call a funny mountain? Hill-arious.",
    "I used to be afraid of hurdles, but I got over it.",
    "What do you call a bee that lives in America? A USB.",
    "Why did the man put his money in the freezer? He wanted cold hard cash.",
    "What do you call a fish that practices medicine? A sturgeon.",
    "Why did the student bring a ladder to school? He wanted to go to high school.",
    "Did you hear about the man who invented the knock-knock joke? He won the no-bell prize.",
    "Why did the banana go to the doctor? It wasn't peeling well.",
    "What do you call a deer with no eyes? No eye-deer.",
    "Why did the computer get chilly? It left its Windows open.",
    "I bought a boat because it was for sail.",
    "What do you call a line of rabbits hopping backward? A receding hare-line.",
    "I wanted to be a doctor, but I didn't have any patients.",
    "What do you call a cow that eats your grass? A lawn moo-er.",
    "Why did the gym close down? It just didn't work out.",
    "What do you call a singing laptop? A Dell.",
    "Why are frogs always happy? They eat whatever bugs them.",
    "The rotation of the earth really makes my day.",
    "I have a fear of speed bumps, but I'm slowly getting over it.",
    "What did the buffalo say to his son when he left for college? Bison.",
    "Why did the morning coffee taste like mud? It was ground just a few minutes ago.",
    "What do you call a duck that steals? A robber ducky.",
    "What do you call a cranky pumpkin? A grumpkin.",
    "I told my friend ten jokes to get him to laugh. No pun in ten did.",
    "What do you call a cow during an earthquake? A milkshake.",
    "What do you call a fake stone? A shamrock.",
    "I know a joke about paper. Never mind, it's tearable.",
    "What do you call a shoe made of banana peel? A slipper.",
    "Why did the commuter stare at the orange juice? Because it said concentrate.",
    "What do you call a bear with no ears? B.",
    "I have a UDP joke, but you might not get it.",
    "I have a TCP joke, and I will keep telling it until you get it.",
    "Why did the programmer go broke? He used up all his cache.",
    "There are 10 kinds of people in the world. Those who understand binary and those who don't.",
    "Why do cows wear bells? Because their horns don't work.",
    "What's orange and sounds like a parrot? A carrot.",
    "My old band was called 999 Megabytes. We never got a gig.",
    "Why did the man fall down the well? He couldn't see that well.",
    "Why did the skeleton skip the dance? He had nobody to go with.",
    "What do you call a nose that is not attached to a face? Nobody knows.",
    "I stayed up all night to see where the sun went. Then it dawned on me.",
    "Why did the chicken cross the playground? To get to the other slide.",
    "What do you call a stolen yam? A hot potato.",
    "Why did the geometry class run long? The teacher went off on a tangent.",
    "What do you call an indecisive bee? A maybe.",
    "What do you call a dog on the beach in July? A hot dog.",
    "What do you call a snail on a ship? A snailor.",
    "Why do pancakes always win at baseball? They have the best batter.",
    "What did one plate say to the other plate? Dinner is on me.",
    "I would skip the sushi if I were you. It's a little fishy.",
    "What do you call a magic owl? Hoodini.",
    "What do you call a cold dog? A chili dog.",
    "Why are piggy banks so wise? They are stuffed with common cents.",
    "What do you call a very ordinary potato? A commentator.",
    "What do you call a three-legged donkey? A wonky.",
    "I started a river-tour company. It went under.",
    "What do you call a can of soup that tells jokes? A laughing stock.",
    "Why did the music teacher need a ladder? To reach the high notes.",
    "What do you call a happy cowboy? A jolly rancher.",
]

LOCAL = list(dict.fromkeys(LOCAL))

_lock = threading.Lock()
_deck: list[str] = []
_seen: set[str] = set()
_page = 1
_api_done = False
_loading = False


def _clean(items) -> list[str]:
    jokes = []
    for item in items or []:
        if not isinstance(item, str):
            continue
        joke = " ".join(item.split())
        if joke:
            jokes.append(joke)
    return jokes


def _load() -> None:
    global _page, _api_done
    if not STATE.exists():
        return
    try:
        data = json.loads(STATE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return
    if not isinstance(data, dict):
        return
    seen = set(_clean(data.get("seen")))
    deck = [joke for joke in _clean(data.get("deck")) if joke not in seen]
    _seen.update(seen)
    _deck.extend(joke for joke in deck if joke not in _deck)
    page = data.get("page")
    if isinstance(page, int) and page >= 1:
        _page = page
    _api_done = bool(data.get("api_done"))


def _save() -> None:
    payload = {
        "deck": _deck,
        "seen": sorted(_seen),
        "page": _page,
        "api_done": _api_done,
    }
    try:
        STATE.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    except OSError:
        pass


def _api_page(page: int) -> tuple[list[str], int]:
    data = fetch_json(
        f"https://icanhazdadjoke.com/search?limit=30&page={page}",
        headers={
            "Accept": "application/json",
            "User-Agent": "brief-morning-desk (personal use)",
        },
    )
    total = data.get("total_pages")
    try:
        pages = int(total)
    except (TypeError, ValueError):
        pages = page
    return _clean(item.get("joke") if isinstance(item, dict) else "" for item in (data.get("results") or [])), max(pages, 1)


def _have() -> set[str]:
    return set(_deck) | _seen


def _fold_local() -> None:
    have = _have()
    fresh = [joke for joke in LOCAL if joke not in have]
    random.shuffle(fresh)
    _deck.extend(fresh)


def _catalog_worker() -> None:
    global _loading, _api_done, _page
    gathered: list[str] = []
    page = 1
    total = 1
    try:
        while page <= total:
            rows, total = _api_page(page)
            gathered.extend(rows)
            page += 1
    except UpstreamError:
        with _lock:
            _loading = False
        return
    with _lock:
        have = _have()
        fresh = []
        for joke in gathered:
            if joke not in have:
                have.add(joke)
                fresh.append(joke)
        _deck.extend(fresh)
        random.shuffle(_deck)
        _api_done = True
        _page = 1
        _loading = False
        _save()


def _kick_catalog() -> None:
    global _loading
    with _lock:
        if _api_done or _loading:
            return
        _loading = True
    threading.Thread(target=_catalog_worker, name="joke-catalog", daemon=True).start()


def _restart() -> None:
    global _page, _api_done, _loading
    _seen.clear()
    _deck.clear()
    _page = 1
    _api_done = False
    _loading = False
    pool = list(LOCAL)
    random.shuffle(pool)
    _deck.extend(pool)


def get_joke() -> dict:
    _kick_catalog()
    restarted = False
    with _lock:
        _fold_local()
        if not _deck and _api_done:
            _restart()
            restarted = True
        joke = _deck.pop() if _deck else LOCAL[0]
        _seen.add(joke)
        _save()
    if restarted:
        _kick_catalog()
    return {"joke": joke}


_load()
_kick_catalog()
