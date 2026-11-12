// src/ui/shared/kc-safe.ts
function kcEsc(v) {
	return String(typeof v === "undefined" || v === null ? "" : v).replace(/[&<>"']/g, (c) => String({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	}[c]));
}
var KcSafeHtml = class {
	s;
	constructor(s) {
		this.s = s;
	}
	toString() {
		return this.s;
	}
};
function kcHtml(strings, ...values) {
	const show = (v) => v instanceof KcSafeHtml ? v.s : Array.isArray(v) ? v.map(show).join("") : kcEsc(v);
	let out = String(strings[0]);
	for (let i = 0; i < values.length; i++) out += show(values[i]) + String(strings[i + 1]);
	return new KcSafeHtml(out);
}
function kcArg(v) {
	return new KcSafeHtml(kcEsc(JSON.stringify(v === void 0 ? null : v)));
}
// src/db/kc-db-guard.ts
/** A thrown value as `(e && e.message) || e` reads it: its message when it is an object or a function with a truthy
*  one, else the value itself. */
function itsMessageOrItself(e) {
	const message = (typeof e === "object" || typeof e === "function") && e !== null && "message" in e ? e.message : void 0;
	if (message) return message;
	return e;
}
async function kcDbGuard(db, min) {
	const ask = async () => {
		try {
			return await db.theDatabasesVersion.askTheDatabaseItsVersion();
		} catch (e) {
			return {
				data: null,
				error: { message: String(itsMessageOrItself(e)) },
				status: 0
			};
		}
	};
	let r = await ask();
	if (r.error && !r.status) r = await ask();
	const v = !r.error && typeof r.data === "string" && /^\d{14}$/.test(r.data) ? r.data : null;
	if (!v || v < min) {
		const why = r.error ? r.status ? "no version check in the database" : "the database didn't answer" : `database ${v ?? "unknown"}`;
		window.dispatchEvent(new ErrorEvent("error", { message: `The game is being updated. Try again in a few minutes. (${why}; this page needs ${min})` }));
		return new Promise(() => void 0);
	}
	document.documentElement.setAttribute("data-kc-db", v);
	document.dispatchEvent(new CustomEvent("kc-db-version", { detail: v }));
	return v;
}
// src/content/kingdoms-call-data.ts
var PRIMAL_ARMY_DEFS_P = {
	"Stone Giants": {
		str: 13,
		speed: 2,
		cost: 5,
		race: "Stone Giant",
		cat: "Heavy",
		desc: "Ancient stone-fleshed giants, at home in the mountains (terrain ×1.15 there). Boulder Wall: cavalry facing them fights at no better than ×0.75 (the Unicorn Herd's Purity breaks it). Pre-battle strike Boulder Barrage: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 4–7 strength damage to one enemy unit. Slow (speed 2).",
		spells: [{
			name: "Boulder Barrage",
			dmg: [4, 7],
			target: "single",
			flavour: "Giants heave boulders that shatter a formation before contact!"
		}]
	},
	"Forest Ents": {
		str: 11,
		speed: 2,
		cost: 4,
		race: "Forest Ent",
		cat: "Heavy",
		desc: "Living trees of great age, at home in forest and jungle (terrain ×1.15 there; they wither in the desert). Rooted: never hit from the side when the enemy line wraps their end. Pre-battle strike Choking Spores: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 2–4 strength damage to EVERY enemy unit.",
		spells: [{
			name: "Choking Spores",
			dmg: [2, 4],
			target: "all",
			flavour: "A cloud of ancient spores rolls across the whole enemy line."
		}]
	},
	Thunderbirds: {
		str: 11,
		speed: 5,
		cost: 4,
		race: "Thunderbird",
		cat: "Free Lances",
		desc: "Storm-birds of the high crags (they replace the Giant Eagles, 2026-10-13: the elves already ride eagles). They fight from the air, taking no place in the line. Storm Wings: every enemy unit in the air fights ×0.85. Pre-battle strike Lightning Strike: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 4–8 strength damage to one enemy unit. Flying (speed 5).",
		spells: [{
			name: "Lightning Strike",
			dmg: [4, 8],
			target: "single",
			flavour: "Thunder cracks from the flock and a bolt tears through the ranks!"
		}]
	},
	"Cave Trolls": {
		str: 11,
		speed: 2,
		cost: 4,
		race: "Cave Troll",
		cat: "Heavy",
		desc: "Regenerating mountain brutes, at home in the mountains and the forest (terrain ×1.15 and ×1.1 there). Regenerating Hide: after a lost battle, a 30% chance to shrug off a death roll. Pre-battle strike Hurled Rubble: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 4–7 strength damage to one enemy unit.",
		spells: [{
			name: "Hurled Rubble",
			dmg: [4, 7],
			target: "single",
			flavour: "A troll rips a slab from the earth and hurls it into the ranks."
		}]
	},
	"Manticore Pride": {
		str: 13,
		speed: 5,
		cost: 5,
		race: "Manticore",
		cat: "Free Lances",
		desc: "Ferocious lion-scorpion-bat creatures that fight from the air. Relentless Hunt: +25% strength when their side is the ATTACKER, and when at least half the winning force are Manticores the beaten foe takes +15% rout losses. Pre-battle strike Spine Volley: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 2–4 strength damage to every enemy unit.",
		spells: [{
			name: "Spine Volley",
			dmg: [2, 4],
			target: "all",
			flavour: "A storm of tail-spines rains across every enemy unit."
		}]
	},
	"Basilisk Brood": {
		str: 11,
		speed: 2,
		cost: 4,
		race: "Basilisk",
		cat: "Heavy",
		desc: "Petrifying reptiles. Stone Deterrent: +25% strength when their side is DEFENDING. Pre-battle strike Petrifying Gaze: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 2–4 strength damage to every enemy unit.",
		spells: [{
			name: "Petrifying Gaze",
			dmg: [2, 4],
			target: "all",
			flavour: "A hundred stony eyes sweep the field — flesh begins to seize."
		}]
	},
	"Sea Giants": {
		str: 13,
		speed: 3,
		cost: 5,
		race: "Sea Giant",
		cat: "Naval",
		desc: "Colossal ocean-dwelling giants that wade ashore. Tidal Might: +20% strength when fighting in a coastal land province (one bordering the sea). Pre-battle strike Tidal Surge: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 4–8 strength damage to one enemy unit.",
		spells: [{
			name: "Tidal Surge",
			dmg: [4, 8],
			target: "single",
			flavour: "A wall of driven water smashes a vessel broadside."
		}]
	},
	"Eldritch Kraken": {
		str: 15,
		speed: 2,
		cost: 6,
		race: "Kraken",
		cat: "Naval",
		desc: "Elder krakens of the lightless deep, risen whole (renamed from Kraken Tentacles, 2026-10-13). Deepwater Grasp: +35% strength in a sea battle. Pre-battle strike Crushing Coils: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 5–9 strength damage to one enemy unit.",
		spells: [{
			name: "Crushing Coils",
			dmg: [5, 9],
			target: "single",
			flavour: "Titanic coils breach and drag a hull under."
		}]
	},
	"Elder Dragons": {
		str: 19,
		speed: 5,
		cost: 8,
		race: "Dragon",
		cat: "Free Lances",
		desc: "Fully sapient ancient dragons — each unit is one elder dragon. Wyrmscale: +25% strength in every battle. Pre-battle strike Dragonfire Breath: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 3–6 strength damage to every enemy unit. Flying.",
		spells: [{
			name: "Dragonfire Breath",
			dmg: [3, 6],
			target: "all",
			flavour: "A sheet of ancient fire washes across the entire front line!"
		}]
	},
	"Crimson Rocs": {
		str: 15,
		speed: 5,
		cost: 6,
		race: "Roc",
		cat: "Free Lances",
		desc: "Riders atop massive thunder-birds. Air Superiority: +30% strength whenever the enemy fields any missile unit. Pre-battle strike Thunderous Stoop: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 5–9 strength damage to one enemy unit. Flying (speed 5).",
		spells: [{
			name: "Thunderous Stoop",
			dmg: [5, 9],
			target: "single",
			flavour: "A roc plummets from cloud-height and scatters a unit outright."
		}]
	},
	"Titan Warbeasts": {
		str: 18,
		speed: 2,
		cost: 7,
		race: "Titan",
		cat: "Heavy",
		desc: "Primordial mythic beasts, at home on the plain and in the desert (terrain ×1.1 there). Colossal Bulk: they fight from the second line at full strength. Pre-battle strike World-Shaking Charge: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 3–6 strength damage to every enemy unit.",
		spells: [{
			name: "World-Shaking Charge",
			dmg: [3, 6],
			target: "all",
			flavour: "The herd charges — the ground itself throws every enemy off balance."
		}]
	},
	"Dread Hydras": {
		str: 19,
		speed: 2,
		cost: 8,
		race: "Hydra",
		cat: "Heavy",
		desc: "Many-headed terrors of the fens, at home in jungle and forest (terrain ×1.1 and ×1.05 there). They take the Leviathan Pods' place as the greatest of the Monsters (2026-10-13), on land. Many Heads: ×1.25 facing foot. Pre-battle strike Venom Breath: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 3–6 strength damage to EVERY enemy unit.",
		spells: [{
			name: "Venom Breath",
			dmg: [3, 6],
			target: "all",
			flavour: "A hundred heads exhale as one and a green mist rolls over the line."
		}]
	},
	"Shark Shoals": {
		str: 5,
		speed: 5,
		cost: 3,
		race: "Shark",
		cat: "Naval",
		desc: "Grey hunters of the poor shallows: the cheapest and weakest of the Monsters, and the one sea-beast an Evil realm leads from its first turn. A shoal is no hull: it carries nothing. Shoal Swarm: +10% per other Shark Shoals in the force, to +30%. Feeding Frenzy: when at least half the winning force are shoals, a foe beaten at sea takes +15% rout losses. Found in shark waters, the poor seas the whales do not hold; no special strike (speed 5)."
	},
	"Great Bears": {
		str: 11,
		speed: 3,
		cost: 4,
		race: "Great Bear",
		cat: "Heavy",
		desc: "Great bears of the deep woods and high crags, at home in forest and mountain (terrain ×1.1 there; they suffer in the desert). Maul: ×1.15 facing foot. Thick Hide: pre-battle volleys against them do half. No special strike. Move 3."
	},
	"Unicorn Herd": {
		str: 13,
		speed: 4,
		cost: 5,
		race: "Unicorn",
		cat: "Cavalry",
		desc: "The wild's only horse: a herd of unicorns, at home on the plain and in the forest (terrain ×1.1 there; ×0.9 in the jungle, ×0.85 in the mountains). Cavalry (move 4). Purity: ×1.25 facing Monsters and skeletons, and it breaks a Spear Hedge or a Boulder Wall (no ×0.75 cap). Through the Glades: takes a flank in forest and jungle, as the Stag Riders do. No special strike."
	},
	"Mammoth Host": {
		str: 13,
		speed: 2,
		cost: 5,
		race: "Mammoth",
		cat: "Heavy",
		desc: "A host of mammoths, at home on the open plain (terrain ×1.1; ×0.85 in the desert, ×0.8 in the forest, ×0.75 in the jungle). Trample: ×1.15 facing foot. Pre-battle strike Stampede: fires in the pre-battle magic phase (30% chance +10% per Druid level of the commander, max 90%) and deals 2–4 strength damage to EVERY enemy unit. Slow (speed 2).",
		spells: [{
			name: "Stampede",
			dmg: [2, 4],
			target: "all",
			flavour: "The herd thunders through the enemy line before it has formed."
		}]
	},
	"Great Turtles": {
		str: 13,
		speed: 2,
		cost: 5,
		race: "Great Turtle",
		cat: "Naval",
		desc: "Island-backed turtles of the prosperous seas, the one Creature among the sea-beasts: they swim under their own power and, Island Back, carry two land units a hull where a fleet carries one. Shell Wall: immune to pre-battle volleys, as the Ironclads. Slow (speed 2); no special strike. Recruited where they live."
	}
};
var MASTERY_UNLOCKS = {
	melee: {
		6: "Parry — in personal combat, each enemy melee blow that lands has a 50% chance to be reduced by 1 up to half your Melee skill.",
		7: "New order — Challenge: call out an enemy commander in your province to single combat.",
		8: "Counterattack — in personal combat, when an enemy misses you there is a 50% chance you riposte at once with a free melee strike.",
		9: "New order — Rampage: after winning a duel, immediately strike a second enemy force."
	},
	archery: {
		6: "Impalement — in personal combat, each arrow that hits has a 50% chance to impale, bleeding the foe 1-3 damage every round for three rounds.",
		7: "New order — Rain of Arrows: a free pre-battle volley that softens the enemy front line.",
		8: "Trueshot — in personal combat, each arrow that hits has a 50% chance to strike a vital point, so the foe's very next attack automatically fails.",
		9: "New order — Sniper's Mark: target an enemy commander before battle for a chance to wound or slay them."
	},
	tactical: {
		6: "Each unit you lead has a 10% chance to fight one experience tier higher in each battle.",
		7: "New order — Feigned Retreat: bait an attacker, then counter at +strength.",
		8: "Units you lead are 50% less likely to die or disband after losing a battle.",
		9: "New order — Grand Stratagem: dictate the terms of one battle."
	},
	march: {
		6: "Each army you lead adds +2% exploration to every province you move into.",
		7: "New order — Forced March: march to an adjacent province with a 50% chance to slip past a battle this phase (once per turn).",
		8: "All terrain combat bonuses for the units you lead are doubled, and they suffer no terrain penalties.",
		9: "New order — Lightning Advance: a foe you attack this turn fights with no terrain bonus, no pre-battle magic and no pre-battle archery."
	},
	naval: {
		6: "Moving into a sea province while leading naval units adds +5% exploration to each adjacent land province.",
		7: "New order — Blockade (needs a fleet): a 50% chance to seal a sea province so enemies may not cross it this turn.",
		8: "Land units you lead take no penalty fighting at sea, and one naval hull now carries what once needed two.",
		9: "New order — Raid the Coast (needs a fleet): an amphibious assault launched from the sea at +strength, plundering the province treasury if you capture it."
	},
	sage: {
		6: "Gain +5 gold each time you make a new Sage discovery (discovery chance still caps at 5; your level counts toward the Loremaster title).",
		7: "New order — Research Breakthrough: a guaranteed Sage discovery this turn.",
		8: "Each new Sage discovery permanently raises the tax base of the province you are in by +1 (max 10).",
		9: "New order — Grand Design: realise your alignment's unique realm-wide Wonder."
	},
	spy: {
		6: "Your spy actions now always succeed.",
		7: "New order — Sabotage: wreck an enemy province (−tax / disband a garrison unit next turn).",
		8: "Your spycraft deepens — infiltration grows surer.",
		9: "New order — Assassinate: attempt to kill an enemy hero in a province you have infiltrated."
	},
	thief: {
		6: "A personal stipend adds +5 gold to your income each turn.",
		7: "New order — Grand Heist: once per turn, crack the vaults of the enemy capital or rich province you stand in — a quarter of that realm's treasury and a magic item off one of their couriers.",
		8: "Gold you steal with a Grand Heist is doubled — you take the full amount even if the victim cannot cover it — and your own pockets can no longer be picked.",
		9: "New order — Vanish: nothing can bring you to bay this turn — no pursuit, Encounter or ambush."
	},
	druid: {
		6: "Creature and Monster units you lead cost half to recruit and draw half wages.",
		7: "New order — Awaken Grove: raise a temporary Creature host from a forest or jungle you hold.",
		8: "Creature and Monster units you lead fight one experience tier higher in every battle.",
		9: "New order — Wild Calling: turn a whole wild (Creature or Monster) province's defenders to your side."
	},
	explorer: {
		6: "On entering a province you automatically spot one random undiscovered lair.",
		7: "New order — Chart the Unknown: fully explore this province and reveal all its neighbours.",
		8: "Each Explore action has a 50% chance to permanently raise the province tax base by +2 (max 10), once per province.",
		9: "New order — Discover Lost Ruin: guaranteed to find and reveal a hidden lair or treasure site."
	},
	white: {
		6: "Mass Healing — at the end of every turn, all friendly characters sharing your province (you included) heal half their maximum HP.",
		7: "New spell — Sanctuary: ward a province so enemy armies there fight at −strength.",
		8: "+10% to your chance to cast ANY spell — stacks with the same L8 perk from your other magic schools (hard 95% cap).",
		9: "New spell — Divine Judgment: smite a chosen enemy force for heavy holy damage."
	},
	psychic: {
		6: "Words of Awe — your Oratory raises the armies it inspires by TWO quality levels instead of one.",
		7: "New spell — Mass Confusion: an enemy hero loses their Tactical command in their next battle.",
		8: "+10% to your chance to cast ANY spell — stacks with the same L8 perk from your other magic schools (hard 95% cap).",
		9: "New spell — Dominate: seize an enemy hero's orders, turning up to half their armies to your side."
	},
	illusory: {
		6: "Shimmer — enemy players are half as likely to see or find this character.",
		7: "New spell — Phantom Host: duplicate the monsters and creatures you lead as phantom doubles that fight for the rest of the turn.",
		8: "+10% to your chance to cast ANY spell — stacks with the same L8 perk from your other magic schools (hard 95% cap).",
		9: "New spell — Veil: for two phases, you and your armies vanish from enemy sight and hostile magic."
	},
	elemental: {
		6: "Elemental Armour — in combat, every attack that lands on you is reduced by 1-3 HP.",
		7: "New spell — Chain Lightning: strike several of an enemy hero's units at once.",
		8: "+10% to your chance to cast ANY spell — stacks with the same L8 perk from your other magic schools (hard 95% cap).",
		9: "New spell — Cataclysm: devastate a province — heavy damage to every enemy force, and it yields no tax."
	},
	necromancy: {
		6: "The Necromantic Arts — every skeletal army you lead fights one experience tier higher in battle.",
		7: "New spell — Raise Wraiths: raise the strongest battlefield dead as an elite Wraith whose Wraith's Touch withers the enemy's finest each battle.",
		8: "+10% to your chance to cast ANY spell — stacks with the same L8 perk from your other magic schools (hard 95% cap).",
		9: "New spell — Death's Dominion: mass-raise skeletal units from a battle's graves at once."
	}
};
var _ITEM_NAME_ALTS = {
	"Potion of Healing": ["Red Draught of Mending"],
	"Elixir of Vigour": ["Tonic of the Hale"],
	"Salve of Closing Wounds": ["Balm of the Field Surgeon"],
	"Draught of the Phoenix": ["Ashen Phial"],
	"Potion of Regeneration": ["Troll-Blood Tincture"],
	"Elixir of Second Wind": ["Cordial of Clear Blood"],
	"Scroll of Fire": ["Ember-Script"],
	"Scroll of Frost": ["Rime-Script"],
	"Scroll of Lightning": ["Storm-Script"],
	"Scroll of Acid": ["Vitriol Vellum"],
	"Wand of Sparks": ["Rod of Cinders"],
	"Scroll of Shadow Bolt": ["Umbral Vellum"],
	"Vial of Alchemist's Fire": ["Flask of Greek Fire"],
	"Scroll of Sunburst": ["Dawn-Script"],
	"Thunder Stone": ["Crack-Stone"],
	"Scroll of Twin Bolts": ["Vellum of Two Arrows"],
	"Scroll of Paralysis": ["Hold-Script"],
	"Scroll of Sleep": ["Poppy-Script"],
	"Scroll of Blindness": ["Dazzle-Script"],
	"Scroll of Confusion": ["Babble-Script"],
	"Scroll of Weakness": ["Leaden-Arm Vellum"],
	"Scroll of Curse": ["Hex-Script"],
	"Scroll of Terror": ["Dread-Script"],
	"Bolas of Binding": ["Hunter's Weighted Cords"],
	"Scroll of Silence": ["Mute-Script"],
	"Potion of Strength": ["Ox-Blood Draught"],
	"Potion of Giant's Might": ["Jotun Brew"],
	"Potion of Heroism": ["Champion's Cordial"],
	"Elixir of Focus": ["Hawk-Eye Tincture"],
	"Potion of Iron Skin": ["Draught of the Anvil"],
	"Scroll of Ward": ["Glyph of Turning"],
	"Scroll of Stone Skin": ["Granite Vellum"],
	"Potion of Mirrors": ["Quicksilver Draught"],
	"Smoke Bomb": ["Sooty Egg"],
	"Potion of Fleetness": ["Hare-Blood Draught"],
	"Potion of Invisibility": ["Draught of Nothing"],
	"Scroll of Dispel": ["Cleansing Vellum"],
	"Scroll of Life Drain": ["Leech-Script"],
	"Flask of Holy Water": ["Vial of Blessed Tears"],
	"Dragonbane Dart": ["Wyrm-Piercer"],
	"Beastbane Snare": ["Trapper's Iron Net"],
	"Dwarf-Forged Warhammer": ["Hammer of the Deep Halls"],
	"Deep-Delver's Lantern": ["Mine-Warden's Lamp"],
	"Runic Ale-Horn": ["Tankard of the Stone Fathers"],
	"Ironclad Captain's Chain": ["Chain of the Iron Fleet"],
	"Anvil-Brand Shield": ["Shield of the Mountain Hall"],
	"Moonsilver Bow": ["Bow of the Silver Crescent"],
	"Starlight Diadem": ["Circlet of the Evening Star"],
	"Cloak of Leaves": ["Mantle of the Green Shadow"],
	"Wardancer's Anklets": ["Bells of the Swift Dance"],
	"Phial of Elvenmead": ["Flask of Starwine"],
	"Skull-Cleaver": ["Gutripper"],
	"Warg-Hide Mantle": ["Cloak of the Black Warg"],
	"Blood-Drum of the Horde": ["War-Drum of Gorok"],
	"Tusk Fetish": ["Necklace of Skulls"],
	"Berserker's Draught": ["Red-Eye Brew"],
	"Banner of the Free Companies": ["Standard of the Marches"],
	"Yeoman's Warbow": ["Longbow of the Greenwood Levy"],
	"Guildmaster's Seal": ["Signet of the Counting-House"],
	"Knight-Marshal's Baton": ["Baton of the Constable"],
	"Chirurgeon's Kit": ["Field-Surgeon's Satchel"],
	"Paladin's Sword": ["Blade of the Oath"],
	"Shield of the Innocent": ["Aegis of the Hearth"],
	"Oathkeeper's Ring": ["Band of the True Heart"],
	"Tyrant's Sceptre": ["Rod of Iron Rule"],
	"Poisoner's Ring": ["Assassin's Signet"],
	"Mask of the Torturer": ["Visage of Dread"],
	"Merchant-Prince's Ledger": ["Tally-Book of the Guilds"],
	"Broker's Signet": ["Ring of the Fair Deal"],
	"Caravan Master's Boots": ["Boots of the Long Road"],
	"Halo of the Martyr": ["Crown of the Blessed"],
	"Censer of Consecration": ["Thurible of Holy Fire"],
	"Relic of the Saint": ["Fingerbone of the Blessed"],
	"Antler Crown": ["Crown of the Stag-Lord"],
	"Seed of the World-Tree": ["Acorn of the First Oak"],
	"Bark-Skin Girdle": ["Belt of Living Wood"],
	"Totem of the Old Gods": ["Idol of the Ancestors"],
	"Wolf-Pelt Cloak": ["Mantle of the Wild Hunt"],
	"Blood-Rune Knife": ["Sacrificial Dagger"],
	"Lich's Phylactery Shard": ["Splinter of the Soul-Jar"],
	"Crown of the Barrow-King": ["Diadem of the Bone Lord"],
	"Grave-Cold Blade": ["Sword of the Sepulchre"],
	"Blade of Fury": ["Sword of Wrath", "Reaver's Edge"],
	"Elven Longbow": ["Bow of the Silver Wood", "Greatbow of the Marches"],
	"Tome of Tactics": ["Codex of War", "The Marshal's Treatise"],
	"Boots of the Wind": ["Striders of the Gale", "Seven-League Boots"],
	"Admiral's Spyglass": ["Tide-Lord's Glass", "The Deepwater Lens"],
	"Sage's Crown": ["Circlet of Lore", "Diadem of the Learned"],
	Shadowcloak: ["Mantle of Whispers", "Nightshroud"],
	"Gloves of the Nightcrawler": ["Fingers of the Fox", "Gauntlets of the Silent Hand"],
	"Staff of the Wildwood": ["Rod of the Green Deep", "Branch of the Elder Grove"],
	"Ring of the Explorer": ["Band of the Farstrider", "Signet of the Uncharted"],
	"Holy Reliquary": ["Ark of the Saints", "Sanctified Coffer"],
	"Mind's Eye Amulet": ["Pendant of the Third Sight", "Amulet of the Open Mind"],
	"Veil of Illusions": ["Shroud of Mirages", "Gossamer of Deceit"],
	"Orb of the Storm": ["Sphere of Tempests", "The Thunderheart"],
	"Skull of the Undying": ["Cranium of the Deathless", "The Grinning Relic"],
	"Amulet of Fortitude": ["Talisman of the Ox", "Heartstone of Vigour"],
	"Banner of the Realm": ["Standard of the Homeland", "Ensign of the Hearth"],
	"Tide-Caller's Horn": ["Conch of the Open Sea", "Horn of the Salt Roads"],
	"Siege Master's Ring": ["Ring of the Breach", "Sapper's Signet"],
	"Warbringer Gauntlets": ["Bracers of the Berserker", "Ironfist Gauntlets"],
	"Quiver of the Hawk": ["Falcon's Quiver", "Quiver of Swift Flights"],
	"War Drum of the Ancients": ["Drum of the Old Kings", "Thunder-Drum of the Host"],
	"Traveller's Cloak": ["Wayfarer's Mantle", "Cloak of the Long Road"],
	"Sea Chart of the Deep": ["Portolan of the Abyss", "Chart of the Hidden Currents"],
	"Philosopher's Lens": ["Scholar's Loupe", "Lens of Revelation"],
	"Whispering Mirror": ["Glass of Murmurs", "Mirror of Faint Voices"],
	"Lock-Pick of Legends": ["Skeleton Key of Ages", "The Master Pick"],
	"Green Stone of Speaking": ["Whisper-Stone of the Wild", "The Speaking Emerald"],
	"Beastcaller's Warhorn": ["Horn of the First Hunt", "Wildwood Warhorn"],
	"Totem of the Thunderhead": ["Storm-Spirit Totem", "Totem of the Gathering Sky"],
	"Compass of the Wanderer": ["Lodestone of the Wanderer", "Needle of the Trailblazer"],
	"Chalice of Dawn": ["Grail of First Light", "Cup of the Morning"],
	Dreamstone: ["Slumber Gem", "Stone of Reverie"],
	"Mirror Shard": ["Splinter of the False Glass", "Shard of Reflections"],
	"Ember Rune": ["Cinder Glyph", "Rune of Kindling"],
	"Death's Finger Ring": ["Bone Signet", "Ring of the Pale Hand"],
	"Iron Heart Talisman": ["Amulet of the Stalwart", "Charm of the Iron Vein"],
	"Golden Spur": ["Spur of the Charge", "Silver Rowel"],
	"War-Horn of the Plains": ["Horn of the Wild Ride", "Clarion of the Plains"],
	"Legionnaire's Mark": ["Centurion's Sigil", "Mark of the Legion"],
	"Shield-Wall Rune": ["Rune of the Unbroken Line", "Glyph of the Steadfast"],
	"Quiver of Many Arrows": ["Endless Quiver", "Quiver of the Ceaseless Volley"],
	"Eagle-Eye Pendant": ["Hawk-Eye Charm", "Pendant of the Keen Shot"],
	"Engineer's Blueprint": ["Master Smith's Schematic", "The Bombardier's Plans"],
	"Black Sceptre": ["Rod of the Grave", "Sceptre of Bone"],
	"Ring of Wealth": ["Band of Plenty", "Coin-Ring of the Hoard"],
	"Merchant's Ledger": ["Trader's Tally-Book", "The Gilded Ledger"],
	"Dwarf-Forged Hauberk": ["Deepstone Mail", "Ringmail of the Under-Halls"],
	"Arrow-Turning Brigandine": ["Shaft-Breaker Coat", "Bowman's Bane Jack"],
	"Troll-Hide Jerkin": ["Living-Leather Vest", "Knitflesh Jerkin"],
	"Thornwood Cuirass": ["Briar-Heart Breastplate", "Bramble Plate"],
	"Tower Shield of the Wall": ["Doorward Pavise", "Shield of the Unbroken Line"],
	"Serpent-Scale Coat": ["Wyrmling-Scale Coat", "Beastward Scale"],
	"Grave-Iron Plate": ["Ashen-Quenched Plate", "Sanctified Cuirass"],
	"Blood-Bound Cuirass": ["First-Wound Plate", "Oathblood Breastplate"],
	"Spellwarded Robe": ["Sigil-Stitched Vestment", "Robe of Quiet Silver"],
	"Quicksilver Mail": ["Mercurial Hauberk", "Mail of the Passing Wind"],
	"Ashen Plate": ["Cinderforged Plate", "Plate of the Dead Mountain"],
	"Bulwark Breastplate": ["Rampart Cuirass", "Bastion Plate"],
	"Last-Stand Plate": ["Champion's Unyielding Plate", "Plate of the Final Hour"],
	"Steadfast Harness": ["Harness of the Unfaltering", "Ironwill Straps"],
	"Warden's Scale": ["Borderguard Scale", "Scale of the Long Watch"],
	"Kite Shield of the Marches": ["Rider's Long Shield", "Shield of the Border Road"],
	"Bronze Buckler": ["Quickhand Buckler", "Targe of the Nimble"],
	"Oaken Roundshield": ["Heartwood Roundshield", "Shield of the First Rounds"],
	"Mirror-Bright Shield": ["Skyglass Shield", "Shield of Turned Spells"],
	"Shield of the Ward-Saints": ["Icon Shield", "Shield of the Painted Martyrs"],
	"Dragonbone Shield": ["Wyrmbone Shield", "Shield of the Unshaken Arm"]
};
var SPELL_DEFS_P = {
	Resurrect: {
		school: "white",
		target: "character",
		encounter: false,
		phase: true,
		desc: "Action: bring a slain hero back to life at full health — without their possessions. The body must lie in your province and must not already have been raised this turn. Your own most recently fallen KING may be recalled this way (his body is borne home), and reclaims the throne; a rival's king never can.",
		fn: "white_resurrect"
	},
	"Part Sea": {
		school: "white",
		target: "province",
		encounter: false,
		phase: true,
		desc: "Action: any sea OR land province you are in or adjacent to. A sea province (including a land province flooded to sea earlier this turn) becomes plains for the rest of this turn; fleets cannot enter or leave it from the next phase onward. Cast on still-dry land it finds no sea to part. Cancels Flood.",
		fn: "white_part_sea"
	},
	"Bless Province": {
		school: "white",
		target: "province",
		encounter: false,
		phase: true,
		desc: "Action: a province you are in or adjacent to gains +60% tax base this turn (+80% for Divine realms; +100% when the Divine KING casts it in person). The blessed ground is also WARDED: a 50% + 5% per White level chance (counted to level 5, so 50–75%) to turn aside each enemy Flood, Earthquake, Plague or Part Sea cast there this turn. Only one Bless can affect a province at a time (does not stack).",
		fn: "white_bless_province"
	},
	"Holy Symbol": {
		school: "white",
		target: "none",
		encounter: true,
		phase: true,
		desc: "Action: cleanses the province the caster stands in of all its battlefield dead — every grave there is laid to rest and can no longer be raised by any necromancer. Combat: the opponent suffers −8% per caster level to hit and is seared for 6% of its health (both ×1.5 against undead and fiends), and the caster recovers 10% of their own. Battle magic: all enemy undead units fight at 75% base strength.",
		fn: "white_holy_symbol"
	},
	Spiritwrack: {
		school: "white",
		target: "none",
		encounter: true,
		phase: false,
		desc: "Combat: for 1 round, plus 1 per two White levels (at most 3), the target cannot cast spells, use its powers or use archery (reaching for one, it attacks instead), and its melee damage is halved. Battle magic: all missile units fight at half base strength.",
		fn: "white_spiritwrack"
	},
	Charm: {
		school: "psychic",
		target: "character",
		encounter: true,
		phase: true,
		desc: "Action: hire a wandering hero in your province for free (you still pay upkeep), or seize a general's command of an armyless enemy hero for the rest of the turn (reverts to its owner at end of turn). Combat: doubles the chance of a later successful Flee.",
		fn: "psychic_charm"
	},
	Oratory: {
		school: "psychic",
		target: "character",
		encounter: false,
		phase: true,
		desc: "Action: every army travelling with the target (self or an ally in your province) gains +1 quality level for the rest of the turn. Not cumulative.",
		fn: "psychic_oratory"
	},
	Clairvoyance: {
		school: "psychic",
		target: "character",
		encounter: false,
		phase: true,
		desc: "Action: everything that happens to the target enemy character becomes known to you for the rest of the turn, reported in your Realm Events. Cannot be cast on a neutral or wandering hero. Only one Clairvoyance may be active at a time — a new casting replaces the old.",
		fn: "psychic_clairvoyance"
	},
	"Psychic Blast": {
		school: "psychic",
		target: "character",
		encounter: true,
		phase: true,
		desc: "Action: the target loses 2 skill levels, each drawn from a random owned skill (the two picks may be the same skill). Combat: the opponent can do nothing at all for 1 round, plus 1 per two Psychic levels (3 at Psychic 5), unless a stun ward turns it. Battle magic: negates the enemy commander's Druid skill for the battle.",
		fn: "psychic_blast"
	},
	"Telekinetic Storm": {
		school: "psychic",
		target: "character",
		encounter: true,
		phase: true,
		desc: "Action: a number of the target's units equal to your skill level (counted to 5) are struck — Green units are destroyed outright, and every other struck unit PERMANENTLY drops one experience level; a skeletal unit struck by it shatters outright. Combat: deals 12% of the target's max HP, plus 3% per Psychic level (15% at 1, 27% at 5), as damage; the caster takes a quarter of that. Battle magic: halves the enemy commander's Tactical bonus, on land, if he has any.",
		fn: "psychic_storm"
	},
	"Illusory Terrain": {
		school: "illusory",
		target: "province",
		encounter: false,
		phase: true,
		desc: "Action: a province you are in or adjacent to shows enemies a false, ever-shifting terrain on their maps. Any enemy who fights there is disoriented — each of their units fights as if caught in the worst terrain for its kind, always at least a 15% strength reduction. An enemy hero who enters dispels it at the end of that turn; otherwise 20% chance to fade each turn.",
		fn: "illusory_terrain"
	},
	"Phantasmal Armies": {
		school: "illusory",
		target: "character",
		encounter: false,
		phase: true,
		desc: "Action: phantasmal duplicates of 10% per caster level (counted to level 5, minimum 1) of the humanoid armies led by you or an allied hero in your province join that force for the rest of the turn — they fight but never appear in the roster, and melt away if their originals fall or the force is beaten.",
		fn: "illusory_phantasmal"
	},
	"Hide Lairs": {
		school: "illusory",
		target: "province",
		encounter: false,
		phase: true,
		desc: "Action: veil an entire province you are in or adjacent to — every lair within becomes invisible to all other players, who cannot discover any lair there (though any they already found remains theirs). 20% chance to fade each turn.",
		fn: "illusory_hide_feature"
	},
	Invisibility: {
		school: "illusory",
		target: "none",
		encounter: true,
		phase: true,
		desc: "Combat: enemies suffer −10%, and a further −4% per Illusory level (−14% at 1, −30% at 5), to hit the caster for the fight, and the caster gains +30% to Flee. Action: cast on yourself — 80% chance that no enemy player sees you (sightings, spies, encounter targeting, the map) for the rest of the turn, and every enemy order and ambush aimed at you misses you.",
		fn: "illusory_invisibility"
	},
	"Mirror Image": {
		school: "illusory",
		target: "none",
		encounter: true,
		phase: false,
		desc: "Combat: conjures a phantom duplicate of your opponent that they must fight while you concentrate (taking no other actions). Each round they may disbelieve it (4% per total skill level); casting it again dissipates both images.",
		fn: "illusory_mirror_image"
	},
	"Lightning Bolt": {
		school: "elemental",
		target: "none",
		encounter: true,
		phase: false,
		desc: "Combat: deals 1–3 damage per caster level (counted to level 5) to the opponent. Battle magic: the bolt leaps from army to army — a number of enemy armies equal to your level (counted to 5) each lose 20% of their strength for the battle.",
		fn: "elemental_lightning"
	},
	Fireball: {
		school: "elemental",
		target: "none",
		encounter: true,
		phase: false,
		desc: "Combat: burns the target for 10% of its health each round, plus 2% per Elemental level (12% at 1, 20% at 5), for three rounds. Battle magic: the strongest enemy army unit has its base strength halved for the battle.",
		fn: "elemental_fireball"
	},
	Earthquake: {
		school: "elemental",
		target: "province",
		encounter: false,
		phase: true,
		desc: "Action: a province you are in or adjacent to yields no tax revenue at the end of this turn.",
		fn: "elemental_earthquake"
	},
	Flood: {
		school: "elemental",
		target: "province",
		encounter: false,
		phase: true,
		desc: "Action: a land province you are in or adjacent to acts as a sea province for the rest of the turn (cancels Part Sea).",
		fn: "elemental_flood"
	},
	"Elemental Summon": {
		school: "elemental",
		target: "none",
		encounter: false,
		phase: true,
		desc: "Action: summon a random elemental (Air, Fire, Earth, Water or Darkness) to fight under your command for the rest of the turn, then it dissolves. Roughly as strong as a powerful primal unit.",
		fn: "elemental_summon"
	},
	"Control Undead": {
		school: "necromancy",
		target: "character",
		encounter: true,
		phase: true,
		desc: "Action: seize one random undead army unit from a neutral/enemy character in your province — or cast it on your own province to sense the battlefield dead lying there, unit by unit, and to learn which of the SURROUNDING provinces hold graves of their own (that they do, never how many or what). Combat: an undead foe cannot act for a number of rounds equal to your Necromancy level (counted to 5), unless a stun ward turns it. Battle magic: one random enemy undead unit defects to your side.",
		fn: "necromancy_control"
	},
	"Skeletal Armies": {
		school: "necromancy",
		target: "none",
		encounter: false,
		phase: true,
		desc: "Action: raise the most experienced dead army units lying in your province as skeletal versions under your command — 1 unit at Necromancy 1–2, 2 at Necromancy 3–4, 3 at Necromancy 5+.",
		fn: "necromancy_skeletal"
	},
	Curse: {
		school: "necromancy",
		target: "character",
		encounter: true,
		phase: true,
		desc: "Action: EVERY skill the target has is halved (rounded down) for the rest of the turn. Combat: the target's best combat ability is halved for the fight. Battle magic: the enemy commander's best combat-affecting skill (Tactical, Druid or Naval) is halved for the battle.",
		fn: "necromancy_curse"
	},
	"Hand of Death": {
		school: "necromancy",
		target: "none",
		encounter: true,
		phase: false,
		desc: "Combat: 10% per Necromancy level (counted to 5), at most 60%, to strike for 40% of the enemy's maximum health (×1.1 with Death's Finger Ring).",
		fn: "necromancy_hand"
	},
	Plague: {
		school: "necromancy",
		target: "province",
		encounter: false,
		phase: true,
		desc: "Action: in your province or an adjacent one, each humanoid army unit has a (10% + 5%/level, the level counted to 5) chance to drop an experience level; a unit that faced a plague before rolls at half the chance. The plague then spreads to adjacent provinces (15% each per phase) until turn's end. Not cumulative.",
		fn: "necromancy_plague"
	},
	Sanctuary: {
		school: "white",
		target: "province",
		encounter: false,
		phase: true,
		reqLevel: 7,
		desc: "Action (White 7): ward a province you are in or adjacent to. Enemy armies fighting there this turn do so at −25% strength.",
		fn: "white_sanctuary"
	},
	"Divine Judgment": {
		school: "white",
		target: "character",
		encounter: false,
		phase: true,
		reqLevel: 9,
		desc: "Action (White 9): smite an enemy hero in your province — heavy holy damage to them, and several of the units they lead are destroyed.",
		fn: "white_judgment"
	},
	"Mass Confusion": {
		school: "psychic",
		target: "character",
		encounter: false,
		phase: true,
		reqLevel: 7,
		desc: "Action (Psychic 7): an enemy hero in your province loses all Tactical command in their next battle this turn.",
		fn: "psychic_massconfusion"
	},
	Dominate: {
		school: "psychic",
		target: "character",
		encounter: false,
		phase: true,
		reqLevel: 9,
		desc: "Action (Psychic 9): seize the mind of an enemy hero in your province — up to half the armies they lead defect to you.",
		fn: "psychic_dominate"
	},
	"Phantom Host": {
		school: "illusory",
		target: "none",
		encounter: false,
		phase: true,
		reqLevel: 7,
		desc: "Action (Illusory 7): phantasmal duplicates of 15% per caster level (min 1) of the monsters/creatures you lead join your force for the rest of the turn — they fight but never appear in your roster, and melt away if their originals fall or the force is beaten.",
		fn: "illusory_phantomhost"
	},
	Veil: {
		school: "illusory",
		target: "none",
		encounter: false,
		phase: true,
		reqLevel: 9,
		desc: "Action (Illusory 9): for this phase and the next, you and the armies you lead vanish from enemy sight and cannot be targeted or affected by any hostile spell.",
		fn: "illusory_veil"
	},
	"Chain Lightning": {
		school: "elemental",
		target: "character",
		encounter: false,
		phase: true,
		reqLevel: 7,
		desc: "Action (Elemental 7): arcing lightning tears through an enemy hero in your province — 30% of the units they lead are caught, and each caught unit has a 50% chance to be destroyed.",
		fn: "elemental_chainlightning"
	},
	Cataclysm: {
		school: "elemental",
		target: "province",
		encounter: false,
		phase: true,
		reqLevel: 9,
		desc: "Action (Elemental 9): devastate a province you are in or adjacent to — every enemy force there loses units, and the province tax base is permanently reduced to 0.",
		fn: "elemental_cataclysm"
	},
	"Raise Wraiths": {
		school: "necromancy",
		target: "none",
		encounter: false,
		phase: true,
		reqLevel: 7,
		desc: "Action (Necromancy 7): raise the strongest of your province's battlefield dead as an elite Wraith — whose Wraith's Touch permanently withers a highest-experience enemy unit each battle it fights.",
		fn: "necromancy_wraiths"
	},
	"Death's Dominion": {
		school: "necromancy",
		target: "none",
		encounter: false,
		phase: true,
		reqLevel: 9,
		desc: "Action (Necromancy 9): the fallen of your province rise en masse — raise several skeletal units at once from its battlefield graves, each risen one experience level higher.",
		fn: "necromancy_dominion"
	}
};
var KC_UNIT_CLASS = {
	flying: [
		"Eagle Riders",
		"Noble Griffons",
		"Gnomish Gyrocopters",
		"Wyvern Riders"
	],
	aerial: [
		"Eagle Riders",
		"Noble Griffons",
		"Gnomish Gyrocopters",
		"Wyvern Riders",
		"Thunderbirds",
		"Manticore Pride",
		"Elder Dragons",
		"Crimson Rocs"
	],
	creature: [
		"Thunderbirds",
		"Forest Ents",
		"Stone Giants",
		"Crimson Rocs",
		"Whale Cohort",
		"Great Bears",
		"Unicorn Herd",
		"Mammoth Host",
		"Great Turtles"
	],
	monster: [
		"Cave Trolls",
		"Manticore Pride",
		"Basilisk Brood",
		"Sea Giants",
		"Eldritch Kraken",
		"Elder Dragons",
		"Titan Warbeasts",
		"Dread Hydras",
		"Shark Shoals"
	],
	carrier: [
		"Galleon Fleet",
		"Corsair Fleet",
		"Elven Galleys",
		"Dwarf Ironclads",
		"Orcish Longships",
		"Whale Cohort",
		"Great Turtles"
	],
	primalSea: [
		"Sea Giants",
		"Eldritch Kraken",
		"Shark Shoals",
		"Great Turtles"
	],
	cavalry: [
		"Free Lances",
		"Gilded Lances",
		"Warg Riders",
		"Stag Riders",
		"Ironhoof Rams",
		"Unicorn Herd"
	],
	missile: [
		"Yeoman Longbows",
		"Elven Bowmen",
		"Shadow Archers",
		"Ironwood Crossbows",
		"Mountain Guns",
		"Black Arrows"
	],
	garrison: [
		"Human Garrison",
		"Elven Garrison",
		"Dwarf Garrison",
		"Orc Garrison"
	],
	lightFoot: [
		"Shieldwall Levies",
		"Yeoman Longbows",
		"Ironwood Crossbows",
		"Elven Bowmen",
		"Shadow Archers",
		"Human Garrison",
		"Elven Garrison",
		"Dwarf Garrison",
		"Orc Garrison",
		"Goblin Horde",
		"Forest Wardens",
		"Dwarven Guard",
		"Orc Berserkers",
		"Mountain Guns",
		"Men-at-Arms",
		"Black Arrows"
	],
	tamedFlyer: [
		"Thunderbirds",
		"Manticore Pride",
		"Crimson Rocs",
		"Elder Dragons"
	],
	sea: [
		"Galleon Fleet",
		"Corsair Fleet",
		"Elven Galleys",
		"Dwarf Ironclads",
		"Orcish Longships",
		"Whale Cohort",
		"Sea Giants",
		"Eldritch Kraken",
		"Shark Shoals",
		"Great Turtles"
	]
};
var KC_UNIT_TYPE = {
	"Shieldwall Levies": "infantry",
	"Free Lances": "cavalry",
	"Yeoman Longbows": "ranged",
	"Gilded Lances": "cavalry",
	"Noble Griffons": "flyer",
	"Galleon Fleet": "naval",
	"Corsair Fleet": "naval",
	"Human Garrison": "infantry",
	"Men-at-Arms": "infantry",
	"Elven Bowmen": "ranged",
	"Forest Wardens": "infantry",
	"Shadow Archers": "ranged",
	"Eagle Riders": "flyer",
	"Elven Galleys": "naval",
	"Elven Garrison": "infantry",
	"Stag Riders": "cavalry",
	"Dwarven Guard": "infantry",
	"Ironwood Crossbows": "ranged",
	"Mountain Guns": "ranged",
	"Gnomish Gyrocopters": "flyer",
	"Dwarf Ironclads": "naval",
	"Dwarf Garrison": "infantry",
	"Ironhoof Rams": "cavalry",
	"Warg Riders": "cavalry",
	"Orc Berserkers": "infantry",
	"Goblin Horde": "infantry",
	"Wyvern Riders": "flyer",
	"Orcish Longships": "naval",
	"Orc Garrison": "infantry",
	"Black Arrows": "ranged",
	"Whale Cohort": "naval",
	"Stone Giants": "infantry",
	"Forest Ents": "infantry",
	Thunderbirds: "flyer",
	"Crimson Rocs": "flyer",
	"Cave Trolls": "infantry",
	"Manticore Pride": "flyer",
	"Basilisk Brood": "infantry",
	"Sea Giants": "naval",
	"Eldritch Kraken": "naval",
	"Elder Dragons": "flyer",
	"Titan Warbeasts": "infantry",
	"Dread Hydras": "infantry",
	"Shark Shoals": "naval",
	"Great Bears": "infantry",
	"Unicorn Herd": "cavalry",
	"Mammoth Host": "infantry",
	"Great Turtles": "naval",
	"Air Elemental": "infantry",
	"Fire Elemental": "infantry",
	"Earth Elemental": "infantry",
	"Water Elemental": "infantry",
	"Darkness Elemental": "infantry"
};
var KC_DRUID_LEVELS = {
	1: [
		"Shieldwall Levies",
		"Free Lances",
		"Yeoman Longbows",
		"Gilded Lances",
		"Galleon Fleet",
		"Corsair Fleet",
		"Human Garrison",
		"Elven Bowmen",
		"Forest Wardens",
		"Shadow Archers",
		"Elven Galleys",
		"Elven Garrison",
		"Dwarven Guard",
		"Ironwood Crossbows",
		"Mountain Guns",
		"Dwarf Ironclads",
		"Dwarf Garrison",
		"Warg Riders",
		"Orc Berserkers",
		"Goblin Horde",
		"Orcish Longships",
		"Orc Garrison",
		"Eagle Riders",
		"Noble Griffons",
		"Wyvern Riders",
		"Men-at-Arms",
		"Stag Riders",
		"Ironhoof Rams",
		"Black Arrows"
	],
	2: [],
	3: ["Whale Cohort", "Shark Shoals"],
	4: [
		"Stone Giants",
		"Forest Ents",
		"Thunderbirds",
		"Cave Trolls",
		"Manticore Pride",
		"Basilisk Brood",
		"Sea Giants",
		"Eldritch Kraken",
		"Great Bears",
		"Unicorn Herd",
		"Mammoth Host",
		"Great Turtles"
	],
	5: [
		"Elder Dragons",
		"Crimson Rocs",
		"Titan Warbeasts",
		"Dread Hydras"
	]
};
var KC_UNIT_BASE_STR = Object.assign({
	"Shieldwall Levies": 4,
	"Free Lances": 6,
	"Yeoman Longbows": 4,
	"Gilded Lances": 7,
	"Human Garrison": 2,
	"Elven Bowmen": 5,
	"Forest Wardens": 4,
	"Shadow Archers": 7,
	"Eagle Riders": 6,
	"Noble Griffons": 6,
	"Gnomish Gyrocopters": 5,
	"Elven Galleys": 5,
	"Elven Garrison": 2,
	"Dwarven Guard": 6,
	"Ironwood Crossbows": 4,
	"Mountain Guns": 7,
	"Dwarf Garrison": 2,
	"Warg Riders": 6,
	"Orc Berserkers": 6,
	"Goblin Horde": 3,
	"Wyvern Riders": 6,
	"Orc Garrison": 2,
	"Galleon Fleet": 5,
	"Corsair Fleet": 4,
	"Dwarf Ironclads": 7,
	"Orcish Longships": 5,
	"Whale Cohort": 4,
	"Men-at-Arms": 6,
	"Stag Riders": 6,
	"Ironhoof Rams": 6,
	"Black Arrows": 4
}, Object.fromEntries(Object.entries(PRIMAL_ARMY_DEFS_P).map(([t, d]) => [t, d.str])), {
	"Air Elemental": 10,
	"Fire Elemental": 10,
	"Earth Elemental": 11,
	"Water Elemental": 10,
	"Darkness Elemental": 11
});
var KC_UNIT_Q_MULT = {
	Green: 1,
	Average: 2,
	Veteran: 3,
	Crack: 4,
	Elite: 5
};
var KC_QUALITY_UP = {
	Green: "Average",
	Average: "Veteran",
	Veteran: "Crack",
	Crack: "Elite",
	Elite: "Elite"
};
var KC_SKILLS = [
	"melee",
	"archery",
	"tactical",
	"march",
	"naval",
	"sage",
	"spy",
	"thief",
	"druid",
	"explorer",
	"white",
	"psychic",
	"illusory",
	"elemental",
	"necromancy"
];
var KC_MAGIC_SCHOOLS = [
	"white",
	"psychic",
	"illusory",
	"elemental",
	"necromancy"
];
var KC_SKILL_LABELS = {
	melee: "Melee",
	archery: "Archery",
	tactical: "Tactical",
	march: "March",
	naval: "Naval",
	sage: "Sage",
	spy: "Spy",
	thief: "Thief",
	druid: "Druid",
	explorer: "Explorer",
	white: "White Magic",
	psychic: "Psychic Magic",
	illusory: "Illusory Magic",
	elemental: "Elemental Magic",
	necromancy: "Necromancy"
};
var KC_ITEM_UNCAPPED_SKILLS = [
	"melee",
	"archery",
	"white",
	"psychic",
	"illusory",
	"elemental",
	"necromancy"
];
var KC_ITEM_SLOT_CAP = {
	weapon: 1,
	armour: 1,
	shield: 1,
	cloak: 1,
	helm: 1,
	ring: 2,
	amulet: 1,
	combat: 2
};
var KC_ITEM_RACE_ALIAS = {
	Elf: "Elven",
	Elves: "Elven",
	Dwarf: "Dwarven",
	Dwarves: "Dwarven",
	Orc: "Orcish",
	Orcs: "Orcish"
};
var KC_RUMOUR_COST_BY_POWER = {
	Weak: 1,
	Moderate: 2,
	Powerful: 3,
	Legendary: 4
};
var KC_CARRIER_BERTHS = { "Great Turtles": 2 };
var KC_BASIC_EXPLORE = {
	plain: 35,
	desert: 25,
	forest: 20,
	mountain: 20,
	jungle: 15,
	sea: 25
};
var KC_TERRAIN_COLORS = {
	plain: "#d1a63a",
	desert: "#c66b3d",
	forest: "#2d7a2d",
	jungle: "#1a5e1a",
	mountain: "#8a7a6a",
	sea: "#3a7abf"
};
var KC_PHASE_NAMES = [
	"Spring",
	"Early Summer",
	"Late Summer",
	"Fall",
	"Early Winter",
	"End of Turn"
];
var KC_PHASE_COLORS = [
	"#2d6a2d",
	"#7a5a10",
	"#8a6010",
	"#6a3a10",
	"#1a3a6a",
	"#555"
];
var KC_SEASONS = [
	"Spring",
	"Early Summer",
	"Late Summer",
	"Fall",
	"Early Winter"
];
var KC_ALIGNMENTS = [
	"Divine",
	"Good",
	"Druidic",
	"Neutral",
	"Pagan",
	"Evil",
	"Undead"
];
var KC_TEMPERS = [
	"Berserk",
	"Brave",
	"Cautious",
	"Cowardly"
];
var KC_HUMANOID_RACES = [
	"Human",
	"Elven",
	"Dwarven",
	"Orcish"
];
var KC_RIVAL_RACE = {
	Elven: "Dwarven",
	Dwarven: "Elven",
	Human: "Orcish",
	Orcish: "Human"
};
var KC_HEX_DIRS = [
	"NW",
	"NE",
	"W",
	"E",
	"SW",
	"SE"
];
var KC_GRAND_DESIGNS = {
	Divine: {
		name: "Grand Cathedral",
		desc: "Bless costs you no casting slot, and its ward lies permanently over your capital."
	},
	Good: {
		name: "Free City Charter",
		desc: "Every province you hold that keeps a garrison yields +2 tax."
	},
	Neutral: {
		name: "Grand Library",
		desc: "Your scholars make one guaranteed Sage discovery every turn."
	},
	Pagan: {
		name: "Standing Stones",
		desc: "Your armies fight at +25% strength when defending forest, jungle or mountain provinces."
	},
	Evil: {
		name: "Iron Throne of Skulls",
		desc: "Enemy units slain in battles you win may rise as your skeletons."
	},
	Undead: {
		name: "Deathless Legion",
		desc: "Your skeletal units never disband for unpaid wages, and rise one experience tier stronger."
	},
	Druidic: {
		name: "World-Tree Grove",
		desc: "Your monsters and creatures cost half their wages and muster as Veterans."
	}
};
KC_UNIT_CLASS.garrison;
var UNIT_ABILITIES = {
	"Shieldwall Levies": "Spear Hedge — cavalry facing them in the line fights at no better than ×0.75 (the Unicorn Herd's Purity breaks it). Shieldwall — ×1.25 when an archer stands in the second line behind them.",
	"Men-at-Arms": "Halberds — ×1.25 facing cavalry. Sergeants — Levies beside them in the front line fight ×1.1.",
	"Free Lances": "Harriers — ×1.15 in a flank duel. Ride Them Down — in plains and desert only, each adds +6% to enemy losses when your side wins (max +18%). Works the same against neutral defenders — and theirs works the same against you.",
	"Yeoman Longbows": "Bodkin Points — no penalty shooting cavalry from the second line (other archers fire at ×0.75). Prepared Ground — defending, they loose two pre-battle volleys.",
	"Gilded Lances": "Lance Charge — ×1.15 facing foot, where cavalry is usually ×0.85 (a Spear Hedge still stops it). Knightly Example — while a Gilded Lances unit is in the army, your Levies and Men-at-Arms never lose a tier in defeat.",
	"Noble Griffons": "Dive on the Bowmen — the enemy’s strongest second-line archer fights ×0.75. Screech Dive — a diving pre-battle strike scatters one enemy unit (2–4), one chance in two whatever the commander’s Druid.",
	"Human Garrison": "Hold the Gate — defending, never hit from the side when the enemy line wraps its end. Town Watch — counts as Levies for Shieldwall and for anchoring the line.",
	"Galleon Fleet": "Broadside — fires in the pre-battle archery phase during sea battles.",
	"Forest Wardens": "Woodland Skirmish — ×1.15 in forest and jungle, whatever they face. Ambush — in forest or jungle, the side facing them gets no archery phase at all (unless Eagle Riders fly with it). Works attacking or defending, and against province defenders as well as another realm.",
	"Elven Bowmen": "Volley at the Charge — ×1.25 shooting cavalry from the second line. Woodland Volley — double volley damage in forest and jungle.",
	"Shadow Archers": "Marksmen — ×1.25 shooting archers from the second line, and they pick the best target anywhere along the enemy front. Loosed From Cover — cannot be targeted by enemy volleys (unless Eagle Riders fly with the shooters).",
	"Stag Riders": "Through the Trees — the one cavalry that takes a flank in forest and jungle. Forest Runners — ×1.1 in forest and no penalty in jungle (see the roster).",
	"Eagle Riders": "Stoop on the Horses — on open ground they may hold a flank slot no rider fills, and fight cavalry at ×1.25. Eyes of the Forest — while they fly with your shooters, an enemy Ambush is spoiled and Shadow Archers can be shot at.",
	"Elven Garrison": "Thorn Hedge — cavalry facing it in forest or jungle ×0.85. Tree Watch — in forest or jungle it shoots in the archery step like an archer unit.",
	"Elven Galleys": "Sea Archers — your ranged units ignore the land-unit penalty at sea.",
	"Dwarven Guard": "Unbreakable — foot facing them in the line ×0.85, and they are never hit from the side. Shield Fort — when at least half the front line is Guard (a Dwarf Garrison counts), a beaten force never routs: with a retreat open it withdraws in good order (immune to pursuit losses and to demotion in retreat); trapped, it locks shields and holds the province contested with no flight casualties. In every battle, and for a province's own Guard defenders too.",
	"Ironwood Crossbows": "Armour-Piercing — ×1.25 shooting a unit of base strength 6 or more from the second line. Punch Through — can soften a target to 55% instead of the usual 40% limit (90% instead of 80% against a winged rider).",
	"Mountain Guns": "Bombard — ×1.15 from the second line, whatever they shoot. Bombardment — fire before all other ranged units, and +50% volley damage against garrisons.",
	"Ironhoof Rams": "Battering Horns — a Ram riding free turns the enemy flank even when infantry anchor both ends of its line. Crag Charge — the one cavalry that takes a flank in the mountains.",
	"Gnomish Gyrocopters": "Flak Gunners — ×1.25 when the enemy has flyers. Flak Screen — each engages one enemy flying unit before the battle (−30% strength). No two gyrocopters engage the same flyer.",
	"Dwarf Garrison": "Stone Halls — foot facing it in the mountains ×0.9. Deep Halls — counts as Guard for Shield Fort.",
	"Dwarf Ironclads": "Armoured Hulls — immune to pre-battle volleys.",
	"Goblin Horde": "Arrow Fodder — second-line archers shooting them fire at ×0.75. Sheer Numbers — +10% strength per other orc foot unit in the force (Goblin Hordes, Berserkers, the Orc Garrison), max +30%.",
	"Orc Berserkers": "Frenzy — ×1.15 facing foot. Driven Before Them — +10% for each Goblin Horde beside them in the front line.",
	"Black Arrows": "Brawling Archers — full strength when forced into the front line, where other archers fight ×0.75. Raiders’ Volley — their pre-battle volley does ×1.5 when attacking.",
	"Warg Riders": "Wolves Panic Horses — ×1.25 facing cavalry. Run Them Down — if at least half your winning force are Wargs, they run the beaten army down on the field: every beaten unit is 15% more likely to be destroyed in the rout, on any ground (not against a Dwarven Shield Fort). There is no chase afterwards. Against neutral guards, who never flee, they end the fight fast instead: half casualties for you on a win.",
	"Wyvern Riders": "Terror From Above — the enemy’s strongest front-line unit fights ×0.85. Acid Spit — a pre-battle strike on one enemy unit (2–5), one chance in two whatever the commander’s Druid.",
	"Orc Garrison": "Bloodthirsty — defending, ×1.15 facing foot. Raiders’ Muster — an orcish province that sees an orc realm win there gains a Goblin Horde in its garrison at turn’s end, for nothing.",
	"Orcish Longships": "Reaver Crews — the whole force fights at +25% in any battle the phase it lands from these ships, even if another hero takes command of the combined host.",
	"Whale Cohort": "Breach and Swamp — 25% chance each to sink one enemy fleet outright before the battle is fought.",
	Thunderbirds: "Storm Wings — every enemy unit in the air fights ×0.85. Lightning Strike: a pre-battle strike on one enemy unit (4–8). Storm-birds of the high crags that fight from the air, taking no place in the line.",
	"Forest Ents": "Rooted — never hit from the side when the enemy line wraps their end. Choking Spores: a pre-battle strike across the whole enemy line (2–4 each). At home in forest and jungle (terrain ×1.15), withering in the desert.",
	"Stone Giants": "Boulder Wall — cavalry facing them fights at no better than ×0.75 (the Unicorn Herd's Purity breaks it). Boulder Barrage: a pre-battle strike that shatters one enemy unit (4–7). At home in the mountains (terrain ×1.15); slow.",
	"Cave Trolls": "Regenerating Hide — after a lost battle, a 30% chance to shrug off a death roll. Hurled Rubble: a pre-battle strike on one enemy unit (4–7). At home in the mountains and the forest (terrain ×1.15 and ×1.1).",
	"Manticore Pride": "Relentless Hunt — ×1.25 strength when their side is the attacker, and when at least half the winning force are Manticores the beaten foe takes +15% rout losses. Spine Volley: a pre-battle strike across every enemy unit (2–4 each). Fights from the air.",
	"Basilisk Brood": "Stone Deterrent — ×1.25 strength when their side is defending. Petrifying Gaze: a pre-battle strike across the whole enemy line (2–4 each).",
	"Crimson Rocs": "Air Superiority — ×1.3 strength when the enemy fields ranged troops. Thunderous Stoop: a pre-battle strike scatters one enemy unit (5–9). Fights from the air, taking no place in the line.",
	"Elder Dragons": "Wyrmscale — ×1.25 strength in every battle. Dragonfire Breath: a pre-battle strike that washes every enemy unit in fire (3–6 each). Fights from the air, taking no place in the line.",
	"Titan Warbeasts": "Colossal Bulk — fights from the second line at full strength. World-Shaking Charge: a pre-battle strike that unbalances every enemy unit (3–6 each). At home on the plain and in the desert (terrain ×1.1).",
	"Sea Giants": "Tidal Might — ×1.2 strength in a coastal land province (one bordering the sea). Tidal Surge: a pre-battle strike on one enemy unit (4–8).",
	"Eldritch Kraken": "Deepwater Grasp — ×1.35 strength at sea. Crushing Coils: a pre-battle strike that drags one enemy unit under (5–9).",
	"Dread Hydras": "Many Heads — ×1.25 facing foot. Venom Breath: a pre-battle strike across the whole enemy line (3–6 each). The greatest of the Monsters, at home in jungle and forest (terrain ×1.1 and ×1.05).",
	"Shark Shoals": "Shoal Swarm — +10% strength per other Shark Shoals in the force, to +30%. Feeding Frenzy — when at least half the winning force are shoals, a foe beaten at sea takes +15% rout losses. A shoal is no hull: it carries nothing.",
	"Great Bears": "Maul — ×1.15 facing foot. Thick Hide — pre-battle volleys against them do half. At home in forest and mountain (terrain ×1.1), poor in the desert; move 3.",
	"Unicorn Herd": "Purity — ×1.25 facing Monsters and skeletons, and it breaks a Spear Hedge or a Boulder Wall (no ×0.75 cap). Through the Glades — the one cavalry, with the Stag Riders, that takes a flank in forest and jungle. At home on the plain and in the forest (terrain ×1.1).",
	"Mammoth Host": "Trample — ×1.15 facing foot. Stampede: a pre-battle strike across the whole enemy line (2–4 each). At home on the open plain (terrain ×1.1), ill at ease under trees; slow.",
	"Great Turtles": "Island Back — carries two land units a hull, where a fleet carries one. Shell Wall — immune to pre-battle volleys, as the Ironclads. Island-backed turtles of the prosperous seas that swim under their own power; slow."
};
// src/db/the-db-interface-and-its-areas.ts
/** The page's Db, on its own client: each function sends the query the page sent on that client before. */
function makeTheDbFromItsClient(client) {
	return {
		theDatabasesVersion: { askTheDatabaseItsVersion: () => client.rpc("kc_db_version") },
		signingIn: {
			theSessionKeptInThisBrowser: () => client.auth.getSession(),
			signInWithEmailAndPassword: (email, password) => client.auth.signInWithPassword({
				email,
				password
			}),
			signUpWithEmailPasswordAndName: (email, password, name) => client.auth.signUp({
				email,
				password,
				options: { data: { display_name: name } }
			}),
			signOut: () => client.auth.signOut(),
			changeThePassword: (password) => client.auth.updateUser({ password }),
			changeTheNameKeptWithTheSignIn: (name) => client.auth.updateUser({ data: { display_name: name } })
		},
		theAccountsNames: {
			theNamesOfTheseAccounts: (ids) => client.from("profiles").select("id,name").in("id", ids),
			theNameOfEveryAccount: () => client.from("profiles").select("id,name"),
			theNameAndJoiningDateOfEveryAccountInNameOrder: () => client.from("profiles").select("id,name,created_at").order("name", { ascending: true }),
			theNameOfThisAccount: (id) => client.from("profiles").select("id,name").eq("id", id).single(),
			giveThisAccountItsName: (id, name) => client.from("profiles").upsert({
				id,
				name
			}, { onConflict: "id" })
		},
		theRoles: {
			isTheSignedInAccountAGameMaster: () => client.rpc("is_game_master"),
			isTheSignedInAccountTheOverlord: () => client.rpc("is_site_admin"),
			theGameMasterOfferMadeToThisAccount: (id) => client.from("game_masters").select("accepted_at").eq("user_id", id).maybeSingle(),
			answerTheGameMasterOffer: (answer) => client.rpc(answer)
		},
		theOverlordsAccounts: {
			everyAccountAsTheOverlordSeesIt: () => client.rpc("overlord_accounts"),
			suspendThisAccountUntil: (user, until) => client.rpc("account_suspend", {
				p_user: user,
				p_until: until
			}),
			liftThisAccountsSuspension: (user) => client.rpc("account_unsuspend", { p_user: user }),
			deleteThisAccount: (user) => client.rpc("account_delete", { p_user: user }),
			offerThisAccountGameMaster: (user) => client.rpc("gm_offer", { p_user: user }),
			withdrawTheGameMasterOfferToThisAccount: (user) => client.rpc("gm_withdraw_offer", { p_user: user }),
			revokeThisAccountsGameMaster: (user) => client.rpc("gm_revoke", { p_user: user })
		},
		theOverlordsGames: {
			everyGameNewestFirstFromRowToRow: (from, to) => client.from("games").select("id,name,gm_user_id,status,turn,max_turns,created_at,meta").order("created_at", { ascending: false }).range(from, to),
			handThisGameToThisGameMaster: (game, gameMaster) => client.rpc("reassign_game", {
				p_game: game,
				p_new_gm: gameMaster
			}),
			theRealmsNamesOfTheseGames: (games) => client.from("game_players").select("game_id,player_index,display_name").in("game_id", games)
		},
		theHallOfFame: {
			oneEntrysGame: () => client.from("game_records").select("game_id").limit(1),
			everyEntryNewestFinishedFirstFromRowToRow: (from, to) => client.from("game_records").select("*").order("finished_at", { ascending: false }).range(from, to),
			theGameOfEveryEntry: () => client.from("game_records").select("game_id"),
			theGameMastersNotesOnThisGamesEntry: (game) => client.from("game_records").select("note,hidden,game_name").eq("game_id", game).maybeSingle(),
			writeTheseEntries: (entries) => client.from("game_records").upsert([...entries], { onConflict: "game_id" }),
			changeThisGamesEntry: (game, change) => client.from("game_records").update(change).eq("game_id", game),
			deleteThisGamesEntry: (game) => client.from("game_records").delete().eq("game_id", game),
			deleteTheseGamesEntries: (games) => client.from("game_records").delete().in("game_id", games),
			renameThisPlayer: (user, name) => client.rpc("rename_player", {
				p_user: user,
				p_name: name
			})
		},
		theStatistics: {
			oneTurnRecordsId: () => client.from("turn_events").select("id").limit(1),
			oneGameResultsId: () => client.from("game_results").select("id").limit(1),
			theResultsOfThisGame: (game) => client.from("game_results").select("*").eq("game_id", game),
			thisGamesTurnRecordsForItsEntryFromRowToRow: (game, from, to) => client.from("turn_events").select("turn,player_index,is_bot,realm,race,alignment,post,outcomes").eq("game_id", game).order("turn").order("player_index").range(from, to),
			theGameOfEveryResultFromRowToRow: (from, to) => client.from("game_results").select("game_id").order("game_id").order("player_index").range(from, to),
			everyTurnRecordFromRowToRow: (from, to) => client.from("turn_events").select("game_id,turn,player_index,is_bot,bot_difficulty,realm,race,alignment,orders,pre,post,outcomes").order("game_id").order("turn").order("player_index").range(from, to),
			everyResultFromRowToRow: (from, to) => client.from("game_results").select("*").range(from, to),
			deleteThisGamesResults: (game) => client.from("game_results").delete().eq("game_id", game),
			deleteThisGamesTurnRecords: (game) => client.from("turn_events").delete().eq("game_id", game),
			deleteTheseGamesResults: (games) => client.from("game_results").delete().in("game_id", games),
			deleteTheseGamesTurnRecords: (games) => client.from("turn_events").delete().in("game_id", games)
		},
		theHallOfFamesGames: {
			oneGameThisGameMasterRuns: (gameMaster) => client.from("games").select("id").eq("gm_user_id", gameMaster).limit(1),
			thisGameWithItsWorldAndRealms: (game) => client.from("games").select("id,name,gm_user_id,created_at,max_turns,meta,game_state,game_players(id,player_index,user_id,display_name)").eq("id", game).maybeSingle(),
			theFinishedGamesThisGameMasterRuns: (gameMaster) => client.from("games").select("id,name,gm_user_id,created_at,max_turns,meta").eq("gm_user_id", gameMaster).eq("status", "complete"),
			everyGamesNameStatusAndTurn: () => client.from("games").select("id,name,status,turn"),
			theNameStatusAndTurnOfTheGamesThisGameMasterRuns: (gameMaster) => client.from("games").select("id,name,status,turn").eq("gm_user_id", gameMaster),
			whichOfTheseGamesStillExist: (games) => client.from("games").select("id").in("id", games)
		},
		theDispatches: {
			oneDispatchsId: () => client.from("game_messages").select("id").limit(1),
			oneReadMarksGame: () => client.from("game_message_reads").select("game_id").limit(1),
			theNewestDispatchesOfThisGame: (game, count) => client.from("game_messages").select("id,turn,from_index,to_indexes,scope,body,created_at").eq("game_id", game).order("id", { ascending: false }).limit(count),
			theDispatchesOfThisGameAfterThisOne: (game, after, count) => client.from("game_messages").select("id,turn,from_index,to_indexes,scope,body,created_at").eq("game_id", game).gt("id", after).order("id", { ascending: true }).limit(count),
			theDispatchesOfThisGameBeforeThisOne: (game, before, count) => client.from("game_messages").select("id,turn,from_index,to_indexes,scope,body,created_at").eq("game_id", game).lt("id", before).order("id", { ascending: false }).limit(count),
			theNewestDispatchesOfTheseGamesGamesAndRealms: (games) => client.from("game_messages").select("id,game_id,from_index,to_indexes,scope").in("game_id", games).order("id", { ascending: false }).limit(3e3),
			sendThisDispatch: (dispatch) => client.from("game_messages").insert(dispatch),
			deleteThisDispatch: (id) => client.from("game_messages").delete().eq("id", id),
			thisRealmsReadMarksInThisGame: (game, realm) => client.from("game_message_reads").select("reads").eq("game_id", game).eq("player_index", realm).maybeSingle(),
			thisAccountsReadMarksInTheseGames: (games, account) => client.from("game_message_reads").select("game_id,player_index,reads").in("game_id", games).eq("user_id", account),
			writeTheseReadMarks: (marks) => client.from("game_message_reads").upsert(marks, { onConflict: "game_id,player_index" })
		},
		theReportedDispatches: {
			theDispatchesThisAccountReportedInThisGame: (game) => client.from("message_reports").select("message_id").eq("game_id", game),
			reportThisDispatch: (report) => client.from("message_reports").insert(report),
			theDispatchesReportedToThisAccount: (game) => client.rpc("gm_reported_messages", { p_game: game })
		},
		thePlayersRealms: {
			thisAccountsRealmsAndTheirOrdersFlags: (account) => client.from("game_players").select("id,game_id,player_index,orders_submitted").eq("user_id", account),
			everyRealmOfThisAccount: (account) => client.from("game_players").select("*").eq("user_id", account),
			theGamesOfThisAccountsRealms: (account) => client.from("game_players").select("game_id").eq("user_id", account),
			thisAccountsRealmsInThisGame: (game, account) => client.from("game_players").select("id,player_index").eq("game_id", game).eq("user_id", account),
			thisRealm: (id) => client.from("game_players").select("*").eq("id", id).single(),
			joinWithThisRealm: (realm) => client.from("game_players").insert(realm).select().single(),
			theSlotsOfTheseGames: (games) => client.rpc("get_game_slots", { p_games: games })
		},
		thePlayersGames: {
			theTurnAndStateOfTheseGames: (games) => client.from("games").select("id,turn,status").in("id", games),
			theseGamesForTheirCards: (games) => client.from("games").select("id,name,gm_user_id,status,turn,max_players,created_at,meta").in("id", games),
			theseGamesEveryColumn: (games) => client.from("games").select("*").in("id", games),
			theGamesInSetup: () => client.from("games").select("*").eq("status", "setup"),
			thisGamesWorldAndState: (game) => client.from("games").select("game_state,status").eq("id", game).single(),
			thisGameForItsReport: (game) => client.from("games").select("id,name,gm_user_id,status,turn,max_players,block_eliminated_msgs").eq("id", game).single(),
			thisGameEveryColumn: (game) => client.from("games").select("*").eq("id", game).single()
		},
		theChroniclesLogs: { theLogOfThisRealmInThisTurn: (game, turn, realm) => client.from("turn_logs").select("*").eq("game_id", game).eq("turn", turn).eq("player_index", realm).limit(1) },
		theOrders: {
			saveThisRealmsDraft: (realm, orders) => client.from("game_players").update({
				orders,
				orders_submitted: false
			}).eq("id", realm),
			saveThisRealmsHeroOrder: (realm, orders) => client.from("game_players").update({ orders }).eq("id", realm),
			reopenThisRealmsOrders: (realm) => client.from("game_players").update({ orders_submitted: false }).eq("id", realm),
			submitThisRealmsOrders: (realm, orders, submittedAt) => client.from("game_players").update({
				orders,
				orders_submitted: true,
				last_submitted_at: submittedAt
			}).eq("id", realm),
			theTurnOfThisGame: (game) => client.from("games").select("turn").eq("id", game).single()
		}
	};
}
// src/db/the-pages-database-client.ts
/** The name, on the page's window, of the Db a test hands the page. */
var THE_NAME_A_TEST_HANDS_THE_PAGE_ITS_DB_UNDER = "kcTheDbATestHandsThePage";
/** A value a test handed in, taken as a Db when it has the version guard's area (the first area: every page has it). */
function isADbHandedIn(handed) {
	return typeof handed === "object" && handed !== null && "theDatabasesVersion" in handed;
}
/** The page's client, made as the page made it (with its options only when it has some), and its Db: the one a test
*  handed in, else the one on this client. */
function makeThePagesDatabase(url, key, options) {
	const client = options === void 0 ? supabase.createClient(url, key) : supabase.createClient(url, key, options);
	const handed = Reflect.get(globalThis, THE_NAME_A_TEST_HANDS_THE_PAGE_ITS_DB_UNDER);
	return {
		client,
		db: isADbHandedIn(handed) ? handed : makeTheDbFromItsClient(client)
	};
}
// src/ui/player/startup.ts
var KC_DB_MIN = "20261015062128";
if (typeof KC_CONFIG === "undefined") throw new Error("kc-config.js did not load: reload the page.");
var SUPABASE_URL = KC_CONFIG.supabaseUrl;
var SUPABASE_ANON_KEY = KC_CONFIG.supabaseKey;
var thePagesDatabase = makeThePagesDatabase(SUPABASE_URL, SUPABASE_ANON_KEY);
var sb = thePagesDatabase.client;
var thePagesDb = thePagesDatabase.db;
// src/content/mastery-orders-their-keys-names-skills-and-levels.ts
/** The mastery orders, by key, in the order of MASTERY_ORDER_KEYS. */
var THE_MASTERY_ORDERS = {
	challenge: {
		key: "challenge",
		name: "Challenge",
		skill: "melee",
		level: 7
	},
	rampage: {
		key: "rampage",
		name: "Rampage",
		skill: "melee",
		level: 9
	},
	rain_of_arrows: {
		key: "rain_of_arrows",
		name: "Rain of Arrows",
		skill: "archery",
		level: 7
	},
	snipers_mark: {
		key: "snipers_mark",
		name: "Sniper's Mark",
		skill: "archery",
		level: 9
	},
	feigned_retreat: {
		key: "feigned_retreat",
		name: "Feigned Retreat",
		skill: "tactical",
		level: 7
	},
	grand_stratagem: {
		key: "grand_stratagem",
		name: "Grand Stratagem",
		skill: "tactical",
		level: 9
	},
	forced_march: {
		key: "forced_march",
		name: "Forced March",
		skill: "march",
		level: 7
	},
	lightning_advance: {
		key: "lightning_advance",
		name: "Lightning Advance",
		skill: "march",
		level: 9
	},
	blockade: {
		key: "blockade",
		name: "Blockade",
		skill: "naval",
		level: 7
	},
	raid_coast: {
		key: "raid_coast",
		name: "Raid the Coast",
		skill: "naval",
		level: 9
	},
	research_breakthrough: {
		key: "research_breakthrough",
		name: "Research Breakthrough",
		skill: "sage",
		level: 7
	},
	grand_design: {
		key: "grand_design",
		name: "Grand Design",
		skill: "sage",
		level: 9
	},
	sabotage: {
		key: "sabotage",
		name: "Sabotage",
		skill: "spy",
		level: 7
	},
	assassinate: {
		key: "assassinate",
		name: "Assassinate",
		skill: "spy",
		level: 9
	},
	grand_heist: {
		key: "grand_heist",
		name: "Grand Heist",
		skill: "thief",
		level: 7
	},
	vanish: {
		key: "vanish",
		name: "Vanish",
		skill: "thief",
		level: 9
	},
	awaken_grove: {
		key: "awaken_grove",
		name: "Awaken Grove",
		skill: "druid",
		level: 7
	},
	wild_calling: {
		key: "wild_calling",
		name: "Wild Calling",
		skill: "druid",
		level: 9
	},
	chart_unknown: {
		key: "chart_unknown",
		name: "Chart the Unknown",
		skill: "explorer",
		level: 7
	},
	discover_ruin: {
		key: "discover_ruin",
		name: "Discover Lost Ruin",
		skill: "explorer",
		level: 9
	}
};
var L79_ORDERS = Object.fromEntries([
	["sabotage", {
		target: "province",
		provKind: "enemy",
		hint: "Spy 7: wreck an enemy province you can see — it yields no tax next turn and loses a garrison unit."
	}],
	["forced_march", {
		target: "province",
		provKind: "move_adjacent",
		hint: "March 7: march to an adjacent province — if an enemy army or a Defend order awaits, a 50% chance to slip in without a battle this phase (the fight comes next phase if you stay, or at turn end)."
	}],
	["grand_heist", {
		target: "here",
		hint: "Thief 7 · ONE attempt per thief per turn (spent win or lose). You crack the vaults of THE PROVINCE YOU STAND IN — no hero is targeted. Where: the province must be held by a realm you are AT WAR with, and be their HOME CAPITAL or RICH country (tax 7+). Take: 25% of that realm's treasury (doubled at Thief 8, even past what they can cover) AND one magic item — cut from a courier still on the road inside their realm, from a Send Item order made earlier this turn (a heist never touches what a hero carries in their own pack — that is the Steal order). Odds: 60% +5% per Thief level past 5, halved if the vaults are guarded (a garrison stands there, or an enemy commander of that realm is present with troops). Fail and you are seen unless you slip away (Thief × 20%) — then a hero of that realm draws steel on you (lead with Flee in your Encounter Plan if you would rather not fight), or if none is there the guards beat you off."
	}],
	["awaken_grove", {
		target: "none",
		hint: "Druid 7: while in an owned forest, jungle or wild (Creature or Monster) province, raise a temporary Creature host that fights until turn’s end."
	}],
	["chart_unknown", {
		target: "here_or_adjacent",
		hint: "Explorer 7: fully chart the province you stand in OR one bordering it — 100% mapped, every lair in it revealed, and all ITS neighbours glimpsed at 25%."
	}],
	["discover_ruin", {
		target: "lair_tier",
		hint: "Explorer 9: name a class of lair. EVERY lair of that class in your province and in each bordering province is laid bare at once. A rival's Hide Lairs glamour still conceals what it covers."
	}],
	["blockade", {
		target: "province",
		provKind: "sea_adjacent",
		hint: "Naval 7: seal a sea province you are in or adjacent to — enemy fleets may not cross it this turn."
	}],
	["research_breakthrough", {
		target: "none",
		hint: "Sage 7: a guaranteed scholarly discovery this turn (if any remain undiscovered by your realm)."
	}],
	["assassinate", {
		target: "character",
		hint: "Spy 9: attempt to slay an enemy hero in the province you stand in — a spy-level chance to kill."
	}],
	["vanish", {
		target: "none",
		hint: "Thief 9: melt into the shadows — for the rest of this turn no pursuit, Encounter or ambush can bring you to bay, and no thief caught in the act can be cornered."
	}],
	["challenge", {
		target: "character",
		hint: "Melee 7: call out a LONE enemy hero in your province to single combat — the loser is wounded, or slain."
	}],
	["rampage", {
		target: "character",
		hint: "Melee 9: hurl yourself at an enemy force in your province — cut down several of its units and wound its commander."
	}],
	["rain_of_arrows", {
		target: "character",
		hint: "Archery 7: loose a volley on an enemy force in your province, felling several of its units."
	}],
	["snipers_mark", {
		target: "character",
		hint: "Archery 9: mark an enemy commander in your province — a telling shot that wounds, and may slay."
	}],
	["feigned_retreat", {
		target: "none",
		hint: "Tactical 7: bait your attacker — if you are attacked this turn, your defence counters at +25% strength."
	}],
	["grand_stratagem", {
		target: "none",
		hint: "Tactical 9: dictate the terms of battle — your next battle this turn is fought at +20% strength."
	}],
	["lightning_advance", {
		target: "none",
		hint: "March 9: strike before they can set — enemies you attack this turn lose their defensive footing (−20%)."
	}],
	["raid_coast", {
		target: "none",
		hint: "Naval 9: an amphibious assault — when you come ashore from the sea this turn and fight for the coast you land on, you hit at +25% strength (the whole landing does, even if another hero takes command of it)."
	}],
	["wild_calling", {
		target: "none",
		hint: "Druid 9: while standing in a wild (Creature or Monster) province, call its wild host to your banner — several of its beasts defect to you."
	}],
	["grand_design", {
		target: "none",
		hint: "Sage 9: complete your realm’s Grand Design — a unique, once-ever Wonder whose blessing is set by your realm’s alignment."
	}]
].map(([key, fields]) => {
	const row = THE_MASTERY_ORDERS[key];
	return [row.name, {
		skill: row.skill,
		lvl: row.level,
		...fields
	}];
}));
// src/engine/rules-on-plain-values/a-games-settings-read-from-its-row.ts
function gameMetaOf(game) {
	if (!game || game.meta == null) return null;
	try {
		const m = typeof game.meta === "string" ? JSON.parse(game.meta) : game.meta;
		return m && typeof m === "object" && m.v ? m : null;
	} catch (e) {
		return null;
	}
}
// src/engine/rules-on-plain-values/a-number-shown-to-a-player-rounded-down.ts
function dispFloor(v) {
	const n = Number(v) || 0;
	const r = Math.round(n);
	return Math.abs(n - r) < 1e-9 ? r : Math.trunc(n);
}
// src/engine/rules-on-plain-values/a-guarded-value-read-as-it-is-and-a-skill-held-above-nothing.ts
/** A value where the code guards it as if it may be missing (a narrative, a foe or a status no caller leaves out
*  today), read as it is: the guard stays, and the value keeps its type where the code reads it unguarded. */
function asItsGuardReadsIt(value) {
	return value;
}
// src/engine/rules-on-plain-values/alignments-and-a-wandering-heros-hire-wage.ts
var ALIGNMENTS_P = KC_ALIGNMENTS.slice();
function alignDistP(a, b) {
	const i = ALIGNMENTS_P.indexOf(a), j = ALIGNMENTS_P.indexOf(b);
	if (i < 0 || j < 0) return 0;
	return Math.abs(i - j);
}
function heroSkillTotal(ch) {
	return Object.values(ch && ch.skills || {}).reduce((s, v) => s + (v || 0), 0);
}
function heroSkillWage(ch) {
	return Math.max(0, Math.ceil(heroSkillTotal(ch) / 4) - 1);
}
function heroHireWage(kingdomAlign, heroAlign, waiveBan, hero) {
	const d = alignDistP(kingdomAlign, heroAlign);
	if (d >= 6 && !waiveBan) return null;
	return 2 + Math.floor(Math.min(d, 6) / 2) + (hero ? heroSkillWage(hero) : 0);
}
// src/engine/rules-on-plain-values/units-that-fly-sail-or-can-be-carried-through-the-air.ts
var FLYING_TYPES = new Set(KC_UNIT_CLASS.flying);
var AERIAL_TYPES = new Set(KC_UNIT_CLASS.aerial);
var CREATURE_ARMIES = new Set(KC_UNIT_CLASS.creature);
var MONSTER_ARMIES = new Set(KC_UNIT_CLASS.monster);
var CARRIER_TYPES = new Set(KC_UNIT_CLASS.carrier);
var PRIMAL_SEA_TYPES = new Set(KC_UNIT_CLASS.primalSea);
var SEA_TYPES = /* @__PURE__ */ new Set([...CARRIER_TYPES, ...PRIMAL_SEA_TYPES]);
var CAVALRY_TYPES = new Set(KC_UNIT_CLASS.cavalry);
function isAirCarriable(a) {
	if (!a) return false;
	const t = a.type;
	if (AERIAL_TYPES.has(t) || SEA_TYPES.has(t)) return false;
	if (CREATURE_ARMIES.has(t) || MONSTER_ARMIES.has(t)) return false;
	if (CAVALRY_TYPES.has(t)) return false;
	return true;
}
function getFlyCapability(armies) {
	armies = (armies || []).filter((a) => a && !a._phantom);
	if (armies.length === 0) return false;
	let carriers = 0, carried = 0, sawSelfFlier = false;
	for (const a of armies) {
		if (!a) continue;
		if (FLYING_TYPES.has(a.type)) {
			carriers++;
			sawSelfFlier = true;
			continue;
		}
		if (AERIAL_TYPES.has(a.type)) {
			sawSelfFlier = true;
			continue;
		}
		if (isAirCarriable(a)) {
			carried++;
			continue;
		}
		return false;
	}
	return sawSelfFlier && carriers >= carried;
}
// src/engine/rules-on-plain-values/beasts-a-hero-may-lead-and-the-druid-each-unit-needs.ts
var BEAST_CMD_TYPES = /* @__PURE__ */ new Set([...KC_UNIT_CLASS.creature, ...KC_UNIT_CLASS.monster]);
/** Whether the unit counts against its hero's beast command: a living Creature or Monster that stays. */
function countsAgainstBeastCommand(a) {
	return !!a && BEAST_CMD_TYPES.has(a.type) && !a.skeletal && !a.temporary && !a.wildHunt && !a.phantom;
}
/** The room a leader's beast command leaves (plan P1-11e15): his Druid as it counts, less the beasts he leads that
*  count against it, never below none. A company is read as its realm sees it (`seenAs`: the engine hands
*  unitAsItsRealmSeesIt); a gap among his companies counts for none. A hero who serves no realm has no beast command:
*  the engine's beastCommandRoom answers Infinity for him before it asks this. */
function theRoomALeadersBeastCommandLeaves(hisDruid, theCompaniesHeLeads, seenAs) {
	return Math.max(0, hisDruid - theCompaniesHeLeads.filter((a) => countsAgainstBeastCommand(seenAs(a))).length);
}
/** Where a recruited company musters. GARRISON UNITS GO STRAIGHT TO THE GARRISON (2026-09-23c, Toby): a garrison
*  company never joins a column when recruited; it musters into the garrison of the province it was raised in, whatever
*  "Muster to" names (a hero can still march it out with Pick Up Army). Item 24 (2026-10-12): a beast recruited into a
*  column already holding as many beasts as its leader's Druid musters into the garrison instead, in a province of his
*  realm (native beasts are raised only there). */
function whereARecruitedCompanyMusters(c) {
	if (c.theOrderNamesTheGarrison || c.itIsAGarrisonCompany && c.inAProvinceOfHisRealm) return "the garrison";
	if (c.inAProvinceOfHisRealm && countsAgainstBeastCommand(c.theCompany) && c.theRoomTheColumnsBeastCommandLeaves <= 0) return "the garrison, the column it would join being full";
	return "the column";
}
/** Whether a mercenary band roaming a province is not hired, before its price is asked (Item 24): a band of beasts, for
*  a column whose beast command has no room left, where there is no garrison to take it (the order names none, and the
*  province is not his realm's). */
function aMercenaryBandIsNotHiredIntoAFullColumn(c) {
	return !c.theOrderNamesTheGarrison && !c.inAProvinceOfHisRealm && countsAgainstBeastCommand(c.theCompany) && c.theRoomTheColumnsBeastCommandLeaves <= 0;
}
var DRUID_ARMY_LEVELS_P = Object.fromEntries(Object.entries(KC_DRUID_LEVELS).map(([lvl, types]) => [lvl, new Set(types)]));
function getDruidLevel(armyType) {
	for (const [lvl, armies] of Object.entries(DRUID_ARMY_LEVELS_P)) if (armies.has(armyType)) return parseInt(lvl);
	return 0;
}
var TAMED_FLYER_TYPES_D = new Set(KC_UNIT_CLASS.tamedFlyer);
/** Whether a unit of this type follows its leader whatever his Druid, for his realm's alignment or his own.
*  Druidic alignment: no Druid penalty for Creature armies (they follow willingly). Keyed on the KINGDOM's alignment —
*  NOT the commander's personal alignment — so EVERY character of a Druidic realm (king and heroes alike) leads
*  Creatures freely, even though a Druidic king's heroes are seeded with a randomised personal alignment near his own
*  (Good/Druidic/Neutral) and so are usually NOT personally Druidic. A personally-Druidic wandering hero (no realm, so
*  no realm alignment) also qualifies by his own. Evil alignment (2026-10-13, Toby, Creatures and Monsters I): the
*  mirror — no Druid penalty for Monster armies under an Evil realm (or a personally Evil wandering commander). They
*  are driven, not led. (sd40 Dragon Taming's winged beasts are waived too: the caller knows the realm's discoveries,
*  so it passes that on its own, to druidLevelALeaderNeeds.) */
function druidNeedWaivedByAlignment(unitType, realmAlignment, leaderAlignment) {
	return CREATURE_ARMIES.has(unitType) && (realmAlignment === "Druidic" || leaderAlignment === "Druidic") || MONSTER_ARMIES.has(unitType) && (realmAlignment === "Evil" || leaderAlignment === "Evil");
}
/** The Druid a leader needs to lead a unit of this type at full strength, the waivers counted: none where his realm's
*  alignment or his own waives it, or where the unit is a winged beast his realm has tamed (`tamed`: sd40 Dragon
*  Taming); else the unit's level in the table. (A skeleton needs none either: each caller leaves it out first.) */
function druidLevelALeaderNeeds(unitType, realmAlignment, leaderAlignment, tamed) {
	if (druidNeedWaivedByAlignment(unitType, realmAlignment, leaderAlignment)) return 0;
	if (tamed) return 0;
	return getDruidLevel(unitType);
}
/** The Druid a leader brings to a unit: his own, or at least 1 for a unit of his own race. */
function druidALeaderBringsToAUnit(druidLevel, unitOfHisOwnRace) {
	return unitOfHisOwnRace ? Math.max(1, druidLevel) : druidLevel;
}
/** The levels of Druid a leader is short of a unit's need (0: none). */
function druidShortfall(levelNeeded, levelBrought) {
	return Math.max(0, levelNeeded - levelBrought);
}
/** The share of its strength a unit keeps in battle when its leader is `shortfall` levels of Druid short of its need:
*  20% less a level, never below a tenth. */
function strengthLeftByADruidShortfall(shortfall) {
	if (shortfall === 0) return 1;
	return Math.max(.1, 1 - shortfall * .2);
}
var DRUID_MASTERY_PER_LVL = .2;
var DRUID_MASTERY_CAP = 1;
var DRUID_MASTERY_MAX_LVL = 9;
/** A leader's Druid as the mastery counts it: from 0 to 9. */
function druidLevelTheMasteryCounts(druidLevel) {
	return Math.max(0, Math.min(DRUID_MASTERY_MAX_LVL, druidLevel));
}
/** The Druid mastery's gain on a Creature or Monster unit (0 to 1: +20% a level the leader holds over the unit's need,
*  to +100%), from the level the mastery counts (druidLevelTheMasteryCounts) and the unit's need (0 where waived). */
function druidMasteryGainOver(levelCounted, levelNeeded) {
	return Math.min(DRUID_MASTERY_CAP, DRUID_MASTERY_PER_LVL * Math.max(0, levelCounted - levelNeeded));
}
/** Whether the Druid mastery lifts a unit of this type: a Creature or a Monster, and not a skeleton (the dead follow no
*  Druid). The battle's druidMasteryGain and the army card ask it (plan P1-11d12). */
function theDruidMasteryLiftsAUnitOfThisType(unitType, itIsSkeletal) {
	return !itIsSkeletal && (CREATURE_ARMIES.has(unitType) || MONSTER_ARMIES.has(unitType));
}
// src/content/magic-item-effects-their-names-numbers-and-words.ts
/** The `effect.stat` of a combat item: a potion, scroll or device carried into a personal combat, used once a fight
*  (its `effect.use` says how), which a hero brings from his active items and a guardian from the hoard it wields. */
var THE_STAT_OF_A_COMBAT_ITEM = "combatUse";
/** The `effect.stat` of an item worn as armour: its effect is a ward (`effect.ward`, with its amount, percentage or
*  hits), which personal combat merges into the wards its bearer wears. */
var THE_STAT_OF_AN_ITEM_WORN_AS_ARMOUR = "armour";
var THE_CAVALRY_THE_LANCERS_ITEMS_REACH = [
	"Free Lances",
	"Gilded Lances",
	"Warg Riders",
	"Eagle Riders",
	"Noble Griffons",
	"Stag Riders",
	"Ironhoof Rams"
];
var THE_INFANTRY_THE_LEGIONS_ITEMS_REACH = [
	"Shieldwall Levies",
	"Dwarven Guard",
	"Orc Berserkers",
	"Men-at-Arms"
];
var THE_ARCHERS_THE_BOWMANS_ITEMS_REACH = [
	"Yeoman Longbows",
	"Elven Bowmen",
	"Shadow Archers",
	"Ironwood Crossbows",
	"Black Arrows"
];
var THE_HEAVY_ENGINES_THE_ENGINEERS_ITEMS_REACH = ["Mountain Guns", "Dwarf Ironclads"];
var THE_WORTH_OF_A_WARD_OF_AN_AMOUNT = { aPointIsWorth: 1.2 };
var THE_WORTH_OF_A_WARD_OF_A_PERCENTAGE = { percentagePointsForAPoint: 7 };
var THE_PERCENTAGE_POINTS_A_FLAG_WARD_CARRIES_FOR_A_POINT = 10;
var THE_WORTH_OF_A_BLOW = {
	damageForAPoint: 3,
	lingeringHarmForAPoint: 2,
	aRoundStunnedIsWorth: 2,
	toHitPenaltyForAPoint: 6
};
/** The magic items' effects the registry holds, in the order the battle code meets them: the commander's items on
*  each unit he leads, then his items at sea (plan P1-19m); the commanders' items at the defenders' fortifications, at
*  the volley and in the rout (plan P1-19n); then a hero's items in the realm's tax at the turn's end, and in his orders
*  (plan P1-19o); then a hero's items in his own standing: his maximum hit points, his temper and his skills (plan
*  P1-19p); then what a fighter wears in personal combat: his wards, his riders and the Mithril suit (plan P1-19q),
*  with the numbers the fight wrote for what each does (plan P1-19r); then the combat items a fighter carries into it,
*  the Lock-Pick's steal and the Warbringer Gauntlets' blow (plan P1-19s); then the kinds of item the treasury weighs as
*  a whole (plan P1-19t). */
var MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS = {
	"army-bonus": {
		name: "Battle Standard",
		carriedAs: { stat: "armyBonus" },
		numbers: { strengthAdded: {
			value: 2,
			theTextsWriteIt: "strength added"
		} }
	},
	"cavalry-bonus": {
		name: "Golden Spur",
		carriedAs: { stat: "cavBonus" },
		numbers: { multiplier: {
			value: 1.25,
			theTextsWriteIt: "a multiplier, as the share it adds"
		} },
		reaches: THE_CAVALRY_THE_LANCERS_ITEMS_REACH
	},
	"infantry-bonus": {
		name: "Legionnaire's Mark",
		carriedAs: { stat: "infBonus" },
		numbers: { multiplier: {
			value: 1.2,
			theTextsWriteIt: "a multiplier, as the share it adds"
		} },
		reaches: THE_INFANTRY_THE_LEGIONS_ITEMS_REACH
	},
	"archer-bonus": {
		name: "Eagle-Eye Pendant",
		carriedAs: { stat: "archerStr" },
		numbers: { multiplier: {
			value: 1.3,
			theTextsWriteIt: "a multiplier, as the share it adds"
		} },
		reaches: THE_ARCHERS_THE_BOWMANS_ITEMS_REACH
	},
	"heavy-bonus": {
		name: "Engineer's Blueprint",
		carriedAs: { stat: "heavyBonus" },
		numbers: { strengthAdded: {
			value: 4,
			theTextsWriteIt: "strength added"
		} },
		reaches: THE_HEAVY_ENGINES_THE_ENGINEERS_ITEMS_REACH
	},
	"naval-bonus": {
		name: "Kraken Figurehead",
		carriedAs: { stat: "navalBonus" },
		numbers: {},
		reaches: KC_UNIT_CLASS.carrier
	},
	"fleet-strength": {
		name: "Sea Chart of the Deep",
		carriedAs: { field: "fleetStr" },
		numbers: { strengthAdded: {
			value: 1,
			theTextsWriteIt: "strength added"
		} },
		reaches: KC_UNIT_CLASS.carrier
	},
	"admirals-spyglass": {
		name: "Admiral's Spyglass",
		carriedAs: { itemName: "Admiral's Spyglass" },
		numbers: { strengthAdded: {
			value: 2,
			theTextsWriteIt: "strength added"
		} },
		reaches: KC_UNIT_CLASS.carrier
	},
	"chalice-of-dawn": {
		name: "Chalice of Dawn",
		carriedAs: { itemName: "Chalice of Dawn" },
		numbers: { multiplier: {
			value: 1.15,
			theTextsWriteIt: "a multiplier, as the share it adds"
		} },
		forARealmThatIs: "Divine"
	},
	"undead-bonus": {
		name: "Black Sceptre",
		carriedAs: { stat: "undeadBonus" },
		numbers: { strengthAdded: {
			value: 4,
			theTextsWriteIt: "strength added"
		} },
		reaches: "the skeletal units"
	},
	"fireball-strikes-two": {
		name: "Ember Rune",
		carriedAs: { field: "emberTwo" },
		numbers: { theStrongestUnitsStruck: {
			value: 2,
			theTextsWriteIt: "the strongest units, in words"
		} }
	},
	"strike-chance-bonus": {
		name: "Totem of the Thunderhead",
		carriedAs: { stat: "primalStrike" },
		numbers: {}
	},
	"strike-chance-field": {
		name: "Beastcaller's Warhorn",
		carriedAs: { field: "primalStrike" },
		numbers: {}
	},
	"land-units-at-full-strength-at-sea": {
		name: "Tide-Caller's Horn",
		carriedAs: { field: "landFullAtSea" },
		numbers: {}
	},
	"home-defence-bonus": {
		name: "Banner of the Realm",
		carriedAs: { stat: "homeDefBonus" },
		numbers: { multiplier: {
			value: 1.25,
			theTextsWriteIt: "a multiplier, as the share it adds"
		} }
	},
	"siege-bonus": {
		name: "Siege Master's Ring",
		carriedAs: { stat: "siegeBonus" },
		numbers: { theShareOfTheFortificationsLeft: {
			value: .5,
			theTextsWriteIt: "a share, in words"
		} }
	},
	"quiver-of-the-hawk": {
		name: "Quiver of the Hawk",
		carriedAs: { itemName: "Quiver of the Hawk" },
		numbers: { volleys: {
			value: 2,
			theTextsWriteIt: "volleys, in words"
		} }
	},
	"quiver-of-many-arrows": {
		name: "Quiver of Many Arrows",
		carriedAs: { itemName: "Quiver of Many Arrows" },
		numbers: { extraShots: {
			value: 1,
			theTextsWriteIt: "extra shots, in words"
		} }
	},
	"war-horn-of-the-plains": {
		name: "War-Horn of the Plains",
		carriedAs: { itemName: "War-Horn of the Plains" },
		numbers: {}
	},
	"shield-wall-rune": {
		name: "Shield-Wall Rune",
		carriedAs: { stat: "infStay" },
		numbers: {}
	},
	"tax-bonus": {
		name: "Ring of Wealth",
		carriedAs: { stat: "taxBonus" },
		numbers: {},
		theWorthOfItInTheTreasury: { aGoldIsWorth: 1.2 }
	},
	"tax-per-province": {
		name: "Merchant's Ledger",
		carriedAs: { stat: "taxPerProv" },
		numbers: { goldForEachProvince: {
			value: 1,
			theTextsWriteIt: "gold, for each province"
		} }
	},
	"crystal-orb": {
		name: "Crystal Orb",
		carriedAs: { stat: "oracle" },
		numbers: {}
	},
	"philosophers-lens": {
		name: "Philosopher's Lens",
		carriedAs: { itemName: "Philosopher's Lens" },
		numbers: {}
	},
	"iron-heart-talisman": {
		name: "Iron Heart Talisman",
		carriedAs: { itemName: "Iron Heart Talisman" },
		numbers: { theShareOfMaximumHpHealed: {
			value: .1,
			theTextsWriteIt: "a share, as a percentage"
		} }
	},
	"travellers-cloak": {
		name: "Traveller's Cloak",
		carriedAs: { field: "exploreMove" },
		numbers: {}
	},
	"philosophers-stone": {
		name: "Philosopher's Stone",
		carriedAs: { stat: "massPromote" },
		numbers: {}
	},
	"wailing-phylactery": {
		name: "Wailing Phylactery",
		carriedAs: { stat: "necroAuto" },
		numbers: {}
	},
	"cloak-of-many-faces": {
		name: "Cloak of Many Faces",
		carriedAs: { stat: "hidden" },
		numbers: {}
	},
	"maximum-hp": {
		name: "Amulet of Fortitude",
		carriedAs: { stat: "maxHp" },
		numbers: {},
		theWorthOfItInTheTreasury: { aHitPointIsWorth: .7 }
	},
	temper: {
		name: "Warmask of the Red Rage",
		carriedAs: { stat: "temper" },
		numbers: {},
		theWorthOfItInTheTreasury: { worth: 3 }
	},
	"crown-of-command": {
		name: "Crown of Command",
		carriedAs: { stat: "aura" },
		numbers: { theLevelsItAddsToEverySkill: {
			value: 1,
			theTextsWriteIt: "skill levels added"
		} }
	},
	"melee-damage-turned-aside": {
		name: "Dwarf-Forged Hauberk",
		carriedAs: { ward: "meleeDR" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_AN_AMOUNT
	},
	"arrow-damage-turned-aside": {
		name: "Arrow-Turning Brigandine",
		carriedAs: { ward: "arrowDR" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_AN_AMOUNT
	},
	"nature-damage-turned-aside": {
		name: "Serpent-Scale Coat",
		carriedAs: { ward: "natureDR" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_AN_AMOUNT
	},
	"dark-damage-turned-aside": {
		name: "Grave-Iron Plate",
		carriedAs: { ward: "darkDR" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_AN_AMOUNT
	},
	thorns: {
		name: "Thornwood Cuirass",
		carriedAs: { ward: "thorns" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_AN_AMOUNT
	},
	regeneration: {
		name: "Troll-Hide Jerkin",
		carriedAs: { ward: "regen" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_AN_AMOUNT
	},
	"spell-damage-cut": {
		name: "Spellwarded Robe",
		carriedAs: { ward: "spellPct" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_A_PERCENTAGE
	},
	dodge: {
		name: "Quicksilver Mail",
		carriedAs: { ward: "dodge" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_A_PERCENTAGE
	},
	block: {
		name: "Tower Shield of the Wall",
		carriedAs: { ward: "block" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_A_PERCENTAGE
	},
	"a-hits-damage-capped": {
		name: "Bulwark Breastplate",
		carriedAs: { ward: "cap" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_A_PERCENTAGE
	},
	"second-wind": {
		name: "Last-Stand Plate",
		carriedAs: { ward: "secondWind" },
		numbers: { belowThisShareOfHisMaximumHp: {
			value: .3,
			theTextsWriteIt: "a share, as a percentage"
		} },
		theWorthOfItInTheTreasury: {
			worth: 4,
			percentagePointsForAPoint: THE_PERCENTAGE_POINTS_A_FLAG_WARD_CARRIES_FOR_A_POINT
		}
	},
	"damage-cut-at-low-hp": {
		name: "Warden's Scale",
		carriedAs: { ward: "lowHp" },
		numbers: { belowThisShareOfHisMaximumHp: {
			value: .5,
			theTextsWriteIt: "a share, in words"
		} },
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_A_PERCENTAGE
	},
	"the-first-hit-drunk": {
		name: "Blood-Bound Cuirass",
		carriedAs: { ward: "firstHit" },
		numbers: {},
		theWorthOfItInTheTreasury: {
			worth: 2.5,
			percentagePointsForAPoint: THE_PERCENTAGE_POINTS_A_FLAG_WARD_CARRIES_FOR_A_POINT
		}
	},
	"lingering-harm-turned-aside": {
		name: "Ashen Plate",
		carriedAs: { ward: "dotImmune" },
		numbers: {},
		theWorthOfItInTheTreasury: {
			worth: 3,
			percentagePointsForAPoint: THE_PERCENTAGE_POINTS_A_FLAG_WARD_CARRIES_FOR_A_POINT
		}
	},
	resist: {
		name: "Steadfast Harness",
		carriedAs: { ward: "resist" },
		numbers: { theChanceToShrugOffADaze: {
			value: .5,
			theTextsWriteIt: "a share, in words"
		} },
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_A_PERCENTAGE
	},
	"arrow-block": {
		name: "Kite Shield of the Marches",
		carriedAs: { ward: "arrowBlock" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_A_PERCENTAGE
	},
	buckler: {
		name: "Bronze Buckler",
		carriedAs: { ward: "buckler" },
		numbers: {
			meleeDamageTurnedAside: {
				value: 1,
				theTextsWriteIt: "damage turned aside"
			},
			dodge: {
				value: 5,
				theTextsWriteIt: "a chance, in percentage points"
			}
		},
		theWorthOfItInTheTreasury: {
			worth: 2.5,
			percentagePointsForAPoint: THE_PERCENTAGE_POINTS_A_FLAG_WARD_CARRIES_FOR_A_POINT
		}
	},
	"open-guard": {
		name: "Oaken Roundshield",
		carriedAs: { ward: "openGuard" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: {
			hits: 2,
			pct: 50
		},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_A_PERCENTAGE
	},
	"spell-block": {
		name: "Mirror-Bright Shield",
		carriedAs: { ward: "spellBlock" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_A_PERCENTAGE
	},
	"round-ward": {
		name: "Shield of the Ward-Saints",
		carriedAs: { ward: "roundWard" },
		numbers: {},
		theWorthOfItInTheTreasury: THE_WORTH_OF_A_WARD_OF_AN_AMOUNT
	},
	"stun-immunity": {
		name: "Dragonbone Shield",
		carriedAs: { ward: "stunImmune" },
		numbers: {},
		theWorthOfItInTheTreasury: {
			worth: 3,
			percentagePointsForAPoint: THE_PERCENTAGE_POINTS_A_FLAG_WARD_CARRIES_FOR_A_POINT
		}
	},
	"aura-rider": {
		name: "Oathkeeper's Blade",
		carriedAs: { rider: "aura" },
		numbers: {},
		theWorthOfItInTheTreasury: { pointsForAPoint: 4 }
	},
	"burn-rider": {
		name: "Brand of the Salamander",
		carriedAs: { rider: "burn" },
		numbers: {},
		theWorthOfItInTheTreasury: { aPointIsWorth: 1.5 }
	},
	"drain-rider": {
		name: "Grave-Cold Blade",
		carriedAs: { rider: "drain" },
		numbers: {},
		theWorthOfItInTheTreasury: { aPointIsWorth: 5 }
	},
	"hit-bonus-rider": {
		name: "Warden's Poleaxe",
		carriedAs: { rider: "hitBonus" },
		numbers: {},
		theWorthOfItInTheTreasury: { pointsForAPoint: 4 }
	},
	"damage-bonus-rider": {
		name: "Kingsteel Longsword",
		carriedAs: { rider: "dmgBonus" },
		numbers: {},
		theWorthOfItInTheTreasury: { aPointIsWorth: 1.2 }
	},
	"mithril-armour": {
		name: "Mithril Armour",
		carriedAs: { stat: "mithrilArmour" },
		numbers: { damageTurnedAside: {
			value: 2,
			theTextsWriteIt: "damage turned aside"
		} },
		theWorthOfItInTheTreasury: { aPointOfItsBonusIsWorth: 3 }
	},
	"combat-item-heals": {
		name: "Potion of Healing",
		carriedAs: { use: "heal" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: {
			below: .5,
			amt: 5
		},
		theWorthOfItInTheTreasury: { hitPointsHealedForAPoint: 2.5 }
	},
	"combat-item-second-wind": {
		name: "Elixir of Second Wind",
		carriedAs: { use: "secondwind" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: {
			below: .6,
			amt: 10
		},
		theNumbersAFighterWeighsItBy: {
			aPenaltyWorthLifting: 10,
			belowThisShareOfHisMaximumHpWhateverLingers: .4
		},
		theWorthOfItInTheTreasury: {
			hitPointsHealedForAPoint: 2.5,
			whatLiftsIsWorth: 1
		}
	},
	"combat-item-heals-over-time": {
		name: "Potion of Regeneration",
		carriedAs: { use: "hot" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: {
			below: .7,
			amt: 3,
			rounds: 3
		},
		theWorthOfItInTheTreasury: { hitPointsHealedForAPoint: 3 }
	},
	"combat-item-wards": {
		name: "Potion of Iron Skin",
		carriedAs: { use: "absorb" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: { absorb: 10 },
		theWorthOfItInTheTreasury: { damageSoakedForAPoint: 3 }
	},
	"combat-item-hides": {
		name: "Potion of Invisibility",
		carriedAs: { use: "invis" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: {
			below: .5,
			toHitReduce: 25
		},
		theWorthOfItInTheTreasury: { toHitReducedForAPoint: 6 }
	},
	"combat-item-mirror-images": {
		name: "Potion of Mirrors",
		carriedAs: { use: "mirror" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: {
			below: .7,
			images: 2
		},
		theWorthOfItInTheTreasury: { anImageIsWorth: 1.5 }
	},
	"combat-item-flight": {
		name: "Smoke Bomb",
		carriedAs: { use: "flee" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: {
			below: .35,
			fleeBonus: 25
		},
		theWorthOfItInTheTreasury: {
			fleeBonusForAPoint: 12,
			toHitReducedForAPoint: 8
		}
	},
	"combat-item-dispels": {
		name: "Scroll of Dispel",
		carriedAs: { use: "dispel" },
		numbers: {},
		theNumbersAFighterWeighsItBy: { aPenaltyWorthLifting: 15 },
		theWorthOfItInTheTreasury: { worth: 3 }
	},
	"combat-item-bane": {
		name: "Flask of Holy Water",
		carriedAs: { use: "bane" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: { times: 1 },
		theWorthOfItInTheTreasury: {
			...THE_WORTH_OF_A_BLOW,
			forStrikingItsKindsAlone: -1
		}
	},
	"combat-item-bane-stun": {
		name: "Beastbane Snare",
		carriedAs: { use: "banestun" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: {
			stun: 1,
			times: 1
		},
		theWorthOfItInTheTreasury: {
			...THE_WORTH_OF_A_BLOW,
			forStrikingItsKindsAlone: -1
		}
	},
	"combat-item-strengthens": {
		name: "Potion of Strength",
		carriedAs: { use: "buff" },
		numbers: {},
		theWorthOfItInTheTreasury: { aPointAddedIsWorth: 3 }
	},
	"combat-item-focuses": {
		name: "Elixir of Focus",
		carriedAs: { use: "focus" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: { hitBonus: 10 },
		theWorthOfItInTheTreasury: { toHitBonusForAPoint: 4 }
	},
	"combat-item-silences": {
		name: "Scroll of Silence",
		carriedAs: { use: "silence" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: { rounds: 3 },
		theWorthOfItInTheTreasury: { aRoundSilencedIsWorth: 1.2 }
	},
	"combat-item-stuns": {
		name: "Scroll of Paralysis",
		carriedAs: { use: "stun" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: { stun: 1 },
		theWorthOfItInTheTreasury: { aRoundStunnedIsWorth: 2.5 }
	},
	"combat-item-blinds": {
		name: "Scroll of Blindness",
		carriedAs: { use: "pen" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: { hitPen: 15 },
		theWorthOfItInTheTreasury: { toHitPenaltyForAPoint: 6 }
	},
	"combat-item-weakens": {
		name: "Scroll of Weakness",
		carriedAs: { use: "weak" },
		numbers: {},
		theWorthOfItInTheTreasury: { aPointTakenIsWorth: 2.5 }
	},
	"combat-item-terrifies": {
		name: "Scroll of Terror",
		carriedAs: { use: "terror" },
		numbers: { theChanceTheFoeFlees: {
			value: .5,
			theTextsWriteIt: "a share, in words"
		} },
		theNumbersOfACopyThatCarriesNone: { hitPen: 15 },
		theWorthOfItInTheTreasury: {
			worth: 3,
			toHitPenaltyForAPoint: 10
		}
	},
	"combat-item-damages": {
		name: "Scroll of Fire",
		carriedAs: { use: "dmg" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: { times: 1 },
		theWorthOfItInTheTreasury: {
			...THE_WORTH_OF_A_BLOW,
			forStrikingItsKindsAlone: 0
		}
	},
	"combat-item-drains": {
		name: "Scroll of Life Drain",
		carriedAs: { use: "drain" },
		numbers: {},
		theNumbersOfACopyThatCarriesNone: { below: .75 },
		theWorthOfItInTheTreasury: { damageForAPoint: 2.2 }
	},
	"combat-item-doubled-against-its-kinds": {
		name: "Scroll of Sunburst",
		carriedAs: { effectField: "doubleVs" },
		numbers: { multiplier: {
			value: 2,
			theTextsWriteIt: "a multiplier, in words"
		} }
	},
	"lock-pick-of-legends": {
		name: "Lock-Pick of Legends",
		carriedAs: { itemName: "Lock-Pick of Legends" },
		numbers: { stealChance: {
			value: 20,
			theTextsWriteIt: "a chance, in percentage points"
		} }
	},
	"warbringer-gauntlets": {
		name: "Warbringer Gauntlets",
		carriedAs: { itemName: "Warbringer Gauntlets" },
		numbers: { damageAdded: {
			value: 2,
			theTextsWriteIt: "damage added"
		} }
	},
	dreamstone: {
		name: "Dreamstone",
		carriedAs: { itemName: "Dreamstone" },
		numbers: { theRoundsAdded: {
			value: 1,
			theTextsWriteIt: "rounds added, in words"
		} }
	},
	"deaths-finger-ring": {
		name: "Death's Finger Ring",
		carriedAs: { itemName: "Death's Finger Ring" },
		numbers: { multiplier: {
			value: 1.1,
			theTextsWriteIt: "a multiplier, as the share more"
		} }
	},
	"mirror-shard": {
		name: "Mirror Shard",
		carriedAs: { itemName: "Mirror Shard" },
		numbers: { multiplier: {
			value: .5,
			theTextsWriteIt: "a share, in words"
		} }
	},
	"an-item-worn-as-armour": {
		name: "Padded Gambeson",
		carriedAs: { stat: THE_STAT_OF_AN_ITEM_WORN_AS_ARMOUR },
		numbers: {},
		theWorthOfItInTheTreasury: { aPointOfItsBonusIsWorth: 3 }
	},
	"a-combat-item": {
		name: "Elixir of Vigour",
		carriedAs: { stat: THE_STAT_OF_A_COMBAT_ITEM },
		numbers: {}
	},
	"an-item-of-riders-alone": {
		name: "Serpent-Fang Dagger",
		carriedAs: { stat: "pc" },
		numbers: {},
		theWorthOfItInTheTreasury: { worth: 0 }
	},
	"a-spell-charm": {
		name: "Phial of the Dawn",
		carriedAs: { stat: "castSpell" },
		numbers: {},
		theWorthOfItInTheTreasury: {
			worth: 3,
			aLevelOfItsSpellIsWorth: 1.2,
			theLevelOfASpellThatStatesNone: 2
		}
	}
};
// src/engine/rules-on-plain-values/items-slots-races-and-who-may-use-them.ts
/** The stat the Mithril suit carries its effect by (its row's: plan P1-19t). */
var THE_STAT_OF_THE_MITHRIL_SUIT = MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["mithril-armour"].carriedAs.stat;
function isLegendaryItem(it) {
	return !!it && it.tier === 4;
}
var ITEM_SLOT_OF = {
	"Blade of Fury": "weapon",
	"Elven Longbow": "weapon",
	"Staff of the Wildwood": "weapon",
	"Sword of the First Emperor": "weapon",
	"Black Sceptre": "weapon",
	"Warbringer Gauntlets": "armour",
	"Gloves of the Nightcrawler": "armour",
	"Boots of the Wind": "armour",
	"Tower Shield of the Wall": "shield",
	"Anvil-Brand Shield": "shield",
	"Shield of the Innocent": "shield",
	"Traveller's Cloak": "cloak",
	Shadowcloak: "cloak",
	"Veil of Illusions": "cloak",
	"Cloak of Many Faces": "cloak",
	"Sage's Crown": "helm",
	"Crown of Command": "helm",
	"Imperial Regalia": "helm",
	"Ring of the Explorer": "ring",
	"Death's Finger Ring": "ring",
	"Siege Master's Ring": "ring",
	"Ring of Wealth": "ring",
	"Mithril Armour": "armour",
	"Mind's Eye Amulet": "amulet",
	"Amulet of Fortitude": "amulet",
	"Iron Heart Talisman": "amulet",
	"Eagle-Eye Pendant": "amulet",
	"Legionnaire's Mark": "amulet"
};
var _ITEM_ALT_BASE = {};
Object.entries(_ITEM_NAME_ALTS).forEach(([base, alts]) => alts.forEach((a) => {
	_ITEM_ALT_BASE[a] = base;
}));
var _SHIELD_BASES = /* @__PURE__ */ new Set([
	"Tower Shield of the Wall",
	"Anvil-Brand Shield",
	"Shield of the Innocent",
	"Kite Shield of the Marches",
	"Bronze Buckler",
	"Oaken Roundshield",
	"Mirror-Bright Shield",
	"Shield of the Ward-Saints",
	"Dragonbone Shield"
]);
function itemSlot(it) {
	if (!it) return null;
	if (_SHIELD_BASES.has(_ITEM_ALT_BASE[it.name] || it.name)) return "shield";
	if (it.effect && it.effect.stat === THE_STAT_OF_A_COMBAT_ITEM) return "combat";
	if (it.effect && it.effect.stat === THE_STAT_OF_THE_MITHRIL_SUIT) return "armour";
	if (it.slot !== void 0) return it.slot || null;
	const altBase = _ITEM_ALT_BASE[it.name];
	return ITEM_SLOT_OF[it.name] || (altBase === void 0 ? void 0 : ITEM_SLOT_OF[altBase]) || null;
}
var _ITEM_RACE_ALIAS = { ...KC_ITEM_RACE_ALIAS };
function itemRaceOf(it) {
	const r = it && it.race;
	return r ? _ITEM_RACE_ALIAS[r] || r : r;
}
function itemUsableBy(it, c) {
	if (!it) return false;
	if (it.race && (!c || c.race !== itemRaceOf(it))) return false;
	if (it.alignment && (!c || c.alignment !== it.alignment)) return false;
	return true;
}
/** The items a hero uses: each he may use (his race's and alignment's), and of those that take a slot, the ones he
*  wears; the rest are inert in his hands. activeItems asks it once it has tidied his slots; the army card asks it of
*  the report's items (plan P1-11e38). */
function theItemsAHeroUses(items, hero) {
	return items.filter((it) => !!it && itemUsableBy(it, hero) && (!itemSlot(it) || it.equipped === true));
}
// src/engine/rules-on-plain-values/the-quality-a-commanders-druid-8-or-necromancy-6-lifts-a-unit-to-and-the-minor-titles-army-perks.ts
var MINOR_CAV = new Set(KC_UNIT_CLASS.cavalry);
var MINOR_HEAVY = /* @__PURE__ */ new Set([
	"Mountain Guns",
	"Dwarf Ironclads",
	"Galleon Fleet",
	"Corsair Fleet",
	"Elven Galleys",
	"Orcish Longships",
	"Whale Cohort",
	"Great Turtles",
	"Siege Towers"
]);
/** The quality one tier above each (Elite stays Elite); a quality the table doesn't hold has none. */
var THE_QUALITY_ONE_TIER_UP = { ...KC_QUALITY_UP };
/** A hero's trained level of a skill, from 0 to 9, as his card or the save writes it (none is 0). */
function theTrainedLevelOfASkill(theLevelWritten) {
	return Math.max(0, Math.min(9, Number(theLevelWritten) || 0));
}
/** The mastery tier a trained level gives: the levels past 5 (Druid 8 is tier 3, Necromancy 6 tier 1). */
function theMasteryTierATrainedLevelGives(theLevelWritten) {
	return Math.max(0, theTrainedLevelOfASkill(theLevelWritten) - 5);
}
/** The quality a unit fights at once its commander's Druid 8 and Necromancy 6 have lifted it, each by one tier, and
*  which of them did: Druid 8 (mastery tier 3) lifts a Creature or a Monster; Necromancy 6 (The Necromantic Arts,
*  mastery tier 1) lifts a unit of the risen dead. */
function theQualityACommandersDruid8AndNecromancy6LiftAUnitTo(unit, commander) {
	let quality = unit.quality;
	const druid = commander.hisDruidMasteryTier >= 3 && (CREATURE_ARMIES.has(unit.unitType) || MONSTER_ARMIES.has(unit.unitType));
	if (druid) quality = THE_QUALITY_ONE_TIER_UP[quality] ?? quality;
	const necromancy = unit.isSkeletal && commander.hisNecromancyMasteryTier >= 1;
	if (necromancy) quality = THE_QUALITY_ONE_TIER_UP[quality] ?? quality;
	return {
		quality,
		liftedByDruid: druid,
		liftedByNecromancy: necromancy
	};
}
/** A unit's strength once its commander's minor titles' army perks have lifted it, and the perks that did, in their
*  order (each ×1.05, rounded as it goes): Naturalist or Beastmaster, a Creature or a Monster (one perk, however many
*  of the two he holds); Cavalier, a cavalry unit; Ironclad, a heavy unit or a fleet. `heHoldsTheMinorTitle` is asked
*  in the turn's order, and only where the unit's kind leaves it a question (a Naturalist only of a Creature or a
*  Monster, a Beastmaster only if he isn't the Naturalist). */
function theStrengthAUnitsCommandersMinorTitlesLiftItTo(strength, unitType, heHoldsTheMinorTitle) {
	let str = strength;
	const liftedBy = [];
	if ((CREATURE_ARMIES.has(unitType) || MONSTER_ARMIES.has(unitType)) && (heHoldsTheMinorTitle("naturalist") || heHoldsTheMinorTitle("beastmaster"))) {
		str = Math.round(str * 1.05);
		liftedBy.push("naturalist or beastmaster");
	}
	if (heHoldsTheMinorTitle("cavalier") && MINOR_CAV.has(unitType)) {
		str = Math.round(str * 1.05);
		liftedBy.push("cavalier");
	}
	if (heHoldsTheMinorTitle("ironclad") && MINOR_HEAVY.has(unitType)) {
		str = Math.round(str * 1.05);
		liftedBy.push("ironclad");
	}
	return {
		strength: str,
		liftedBy
	};
}
// src/engine/rules-on-plain-values/unit-types-and-base-strength.ts
var UNIT_TYPE_WORD_OF = KC_UNIT_TYPE;
function unitTypeOf(armyType) {
	return typeof KC_UNIT_TYPE !== "undefined" && UNIT_TYPE_WORD_OF[armyType] || "infantry";
}
var UNIT_BASE_STR = { ...KC_UNIT_BASE_STR };
var UNIT_Q_MULT = { ...KC_UNIT_Q_MULT };
function unitBaseStrength(army) {
	return (UNIT_BASE_STR[army.type] || 4) * (UNIT_Q_MULT[army.quality || "Average"] || 2);
}
// src/engine/rules-on-plain-values/the-strength-a-unit-has-after-the-steps-of-its-commanders-items.ts
/** Each quality's next tier up (Elite's is its own), read by any quality's name. */
var ONE_TIER_UP = KC_QUALITY_UP;
/** Whether the row's effect reaches the unit: the units it names, the skeletal units, or (none named) every unit. */
function reaches(slug, facts) {
	const row = MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS[slug];
	if (row.reaches === void 0) return true;
	if (row.reaches === "the skeletal units") return facts.isSkeletal;
	return row.reaches.includes(facts.unitType);
}
var THE_COMMANDERS_ITEMS = {
	"army-bonus": () => ({ adds: MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["army-bonus"].numbers.strengthAdded.value }),
	"cavalry-bonus": (facts) => reaches("cavalry-bonus", facts) ? { multipliesBy: MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["cavalry-bonus"].numbers.multiplier.value } : null,
	"infantry-bonus": (facts) => reaches("infantry-bonus", facts) ? { multipliesBy: MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["infantry-bonus"].numbers.multiplier.value } : null,
	"archer-bonus": (facts) => reaches("archer-bonus", facts) ? { multipliesBy: MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["archer-bonus"].numbers.multiplier.value } : null,
	"heavy-bonus": (facts) => reaches("heavy-bonus", facts) ? { adds: MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["heavy-bonus"].numbers.strengthAdded.value } : null,
	"naval-bonus": (facts) => {
		if (!reaches("naval-bonus", facts)) return null;
		const own = facts.quality;
		if (own === void 0) return null;
		const up = ONE_TIER_UP[own];
		if (!up || up === own) return null;
		return {
			multipliesBy: Number(UNIT_Q_MULT[up]),
			dividedBy: Number(UNIT_Q_MULT[own])
		};
	},
	"fleet-strength": (facts) => reaches("fleet-strength", facts) ? { adds: MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["fleet-strength"].numbers.strengthAdded.value } : null,
	"admirals-spyglass": (facts) => reaches("admirals-spyglass", facts) ? { adds: MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["admirals-spyglass"].numbers.strengthAdded.value } : null,
	"chalice-of-dawn": (facts) => facts.theRealmsAlignment === MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["chalice-of-dawn"].forARealmThatIs ? { multipliesBy: MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["chalice-of-dawn"].numbers.multiplier.value } : null,
	"undead-bonus": (facts) => reaches("undead-bonus", facts) ? { adds: MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["undead-bonus"].numbers.strengthAdded.value } : null
};
/** The strength of a unit a commander leads after the steps of the effects his items carry, handed in the stage's
*  order, each rounded as it goes (strength added is not rounded). */
function theStrengthAUnitHasAfterTheStepsOfItsCommandersItems(theEffectsHisItemsCarry, facts, theStrengthSoFar) {
	let str = theStrengthSoFar;
	for (const slug of theEffectsHisItemsCarry) {
		const step = THE_COMMANDERS_ITEMS[slug](facts);
		if (!step) continue;
		if ("adds" in step) str += step.adds;
		else if (step.dividedBy === void 0) str = Math.round(str * step.multipliesBy);
		else str = Math.round(str * step.multipliesBy / step.dividedBy);
	}
	return str;
}
// src/engine/rules-on-plain-values/the-effects-a-held-item-carries.ts
var ROWS = MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS;
var BY_STAT = /* @__PURE__ */ new Map();
var BY_FIELD = [];
var BY_ITEM_NAME = /* @__PURE__ */ new Map();
var BY_WARD = /* @__PURE__ */ new Map();
var BY_RIDER = [];
var BY_USE = /* @__PURE__ */ new Map();
var BY_EFFECT_FIELD = [];
var SLUGS = Object.keys(ROWS).filter((slug) => slug in ROWS);
for (const slug of SLUGS) {
	const key = ROWS[slug].carriedAs;
	if ("stat" in key) BY_STAT.set(key.stat, [...BY_STAT.get(key.stat) ?? [], slug]);
	else if ("field" in key) BY_FIELD.push([key.field, slug]);
	else if ("itemName" in key) BY_ITEM_NAME.set(key.itemName, [...BY_ITEM_NAME.get(key.itemName) ?? [], slug]);
	else if ("ward" in key) BY_WARD.set(key.ward, slug);
	else if ("rider" in key) BY_RIDER.push([key.rider, slug]);
	else if ("use" in key) BY_USE.set(key.use, slug);
	else BY_EFFECT_FIELD.push([key.effectField, slug]);
}
/** The effect a ward carries, by its kind, or none. */
var theEffectAWardCarries = (ward) => ward == null ? void 0 : BY_WARD.get(ward);
/** The effect a combat item's use carries, or none. */
var theEffectAUseCarries = (use) => use == null ? void 0 : BY_USE.get(use);
/** The effects a held copy of an item carries: by its effect's key, by a field of its own that is set, by its base
*  name (a second name counts as its base's, as hasItemBase reads it), by its armour's ward and its rider's, by each
*  rider it carries above 0, by its combat use, and by a field of its effect that is set. */
function theEffectsAnItemCarries(item) {
	const stat = item.effect?.stat;
	const carried = [...(stat == null ? void 0 : BY_STAT.get(stat)) ?? []];
	for (const [field, slug] of BY_FIELD) if (item[field]) carried.push(slug);
	if (item.name) carried.push(...BY_ITEM_NAME.get((_ITEM_ALT_BASE[item.name] ?? "") || item.name) ?? []);
	const worn = anItemIsWornAsArmour(item) ? theEffectAWardCarries(item.effect?.ward) : void 0;
	if (worn) carried.push(worn);
	const pc = item.effect?.pc;
	if (pc) {
		const ridden = theEffectAWardCarries(pc.ward);
		if (ridden) carried.push(ridden);
		for (const [rider, slug] of BY_RIDER) if ((pc[rider] ?? 0) > 0) carried.push(slug);
	}
	const used = theEffectAUseCarries(item.effect?.use);
	if (used) carried.push(used);
	for (const [field, slug] of BY_EFFECT_FIELD) if (item.effect?.[field]) carried.push(slug);
	return carried;
}
/** Whether a held item is worn as armour: its effect is a ward, which personal combat merges into the wards its bearer
*  wears (pcArmourOf). */
function anItemIsWornAsArmour(item) {
	return item.effect?.stat === THE_STAT_OF_AN_ITEM_WORN_AS_ARMOUR;
}
/** The effects a hero's items carry, all of them, once. */
function theEffectsTheseItemsCarry(items) {
	return new Set(items.flatMap(theEffectsAnItemCarries));
}
// src/content/discovery-effects-their-kinds-numbers-and-words.ts
/** The kinds of effect the discoveries' registry holds, by slug. */
var DISCOVERY_EFFECTS_THE_REGISTRY_HOLDS = {
	"unit-strength": {
		kind: "unitStr",
		numbers: { theCeiling: {
			value: 1.3,
			aTextWouldWriteIt: "a multiplier, as a figure"
		} }
	},
	siegecraft: { kind: "siege" },
	"own-ground": {
		kind: "defOwn",
		numbers: { theCeiling: {
			value: .3,
			aTextWouldWriteIt: "a share added, as a percentage"
		} }
	},
	fanaticism: { kind: "fanatic" },
	casting: { kind: "cast" },
	"dragon-taming": { kind: "flyingNoDruid" },
	"flanking-tactics": { kind: "flankBonus" },
	"a-beaten-units-death-cut": {
		kind: "deathRed",
		numbers: { theFloor: {
			value: .25,
			aTextWouldWriteIt: "a multiplier, as a figure"
		} }
	},
	promotion: { kind: "promo" },
	"homeward-flight": { kind: "elvenEscape" },
	"battlefield-surgery": { kind: "nearDeathSurvival" },
	"a-fighters-aim": { kind: "duelHit" },
	"veteran-training": {
		kind: "skillBonusCombat",
		numbers: { theLevelsAdded: {
			value: 1,
			aTextWouldWriteIt: "levels added, as a figure"
		} }
	},
	"mithril-craft": { kind: "mithril" },
	"a-skills-rise": { kind: "skillGain" },
	"golden-shield": {
		kind: "kingKillHpX2",
		numbers: { theFactor: {
			value: 2,
			aTextWouldWriteIt: "a multiplier, as a figure"
		} }
	},
	spying: { kind: "spy" },
	"counter-spying": { kind: "counterSpy" },
	"spying-on-a-hero": { kind: "spyChar" },
	"catching-a-spy": { kind: "catchSpy" },
	"disguise-techniques": { kind: "spyDisguise" },
	exploring: { kind: "explore" },
	"the-long-hunt": { kind: "wildHunt" },
	"lair-gold": { kind: "lairGold" },
	"lair-items": { kind: "itemChance" },
	research: { kind: "research" },
	practice: { kind: "practice" },
	resting: { kind: "rest" },
	"medical-arts": { kind: "restFull" },
	"watching-for-lurkers": { kind: "spotLurker" },
	"ancient-lore": { kind: "adjacentReveal" },
	"diplomatic-protocols": { kind: "alignmentHire" },
	consecrations: { kind: "consecrate" },
	"muster-rolls": { kind: "ctaQuality" },
	"corpse-carters": { kind: "harvestCost" },
	mercenaries: { kind: "merc" },
	"recruit-cost": { kind: "recruitCost" },
	"recruit-quality": { kind: "recruitQ" },
	"rites-of-plenty": { kind: "bless" },
	"blood-harvest": { kind: "bloodHarvest" },
	"lingering-terror": { kind: "terror" },
	plunder: { kind: "plunder" },
	marching: { kind: "move" },
	"converging-columns": { kind: "unify" },
	"province-tax": { kind: "tax" },
	"taxation-records": { kind: "taxPct" },
	interest: { kind: "interest" },
	"a-units-wage-cut": { kind: "upkeep" },
	"a-heros-wage-cut": { kind: "heroWage" },
	"a-heros-wage-ceiling": { kind: "heroWageCap" },
	"maximum-hp": { kind: "maxHp" },
	"healing-the-wounded": { kind: "regen" },
	"grave-keeping": { kind: "graveDecay" },
	"war-academy": { kind: "homePromotion" },
	"informant-network": { kind: "informants" },
	"arcane-observatory": { kind: "turnReveal" },
	"herbal-lore": { kind: "autoHeal" },
	"messenger-birds": { kind: "extendedIntel" }
};
// src/engine/rules-on-plain-values/units-a-discoverys-effect-reaches-by-type-class-race-and-quality.ts
var DISC_CLS_SETS = {
	cavalry: /* @__PURE__ */ new Set([
		"Free Lances",
		"Gilded Lances",
		"Warg Riders",
		"Eagle Riders",
		"Noble Griffons",
		"Stag Riders",
		"Ironhoof Rams"
	]),
	infantry: /* @__PURE__ */ new Set([
		"Shieldwall Levies",
		"Dwarven Guard",
		"Orc Berserkers",
		"Men-at-Arms"
	]),
	missile: new Set(KC_UNIT_CLASS.missile),
	fleet: new Set(KC_UNIT_CLASS.carrier),
	flyer: new Set(KC_UNIT_CLASS.aerial),
	garrison: new Set(KC_UNIT_CLASS.garrison)
};
function discUnitIs(cls, ...[army, typeOnly]) {
	const t = (typeOnly ? army : army?.type) ?? "";
	if (cls === "primal") return CREATURE_ARMIES.has(t) || MONSTER_ARMIES.has(t);
	if (cls === "creature") return CREATURE_ARMIES.has(t);
	if (cls === "monster") return MONSTER_ARMIES.has(t);
	if (cls === "skeletal") return !typeOnly && !!army?._isSkeletal;
	if (cls === "humanoid") return (FLYING_TYPES.has(t) || !CREATURE_ARMIES.has(t) && !MONSTER_ARMIES.has(t)) && !DISC_CLS_SETS.fleet.has(t) && !(typeof army === "object" && army?._isSkeletal);
	return !!DISC_CLS_SETS[cls]?.has(t);
}
function discUnitMatch(e, ...unitOrItsTypesName) {
	if (!e) return false;
	const [army, typeOnly] = unitOrItsTypesName;
	const t = (typeOnly ? army : army?.type) ?? "";
	if (e.types && !e.types.includes(t)) return false;
	if (e.cls && !discUnitIs(e.cls, ...unitOrItsTypesName)) return false;
	if (e.race) {
		if ((typeOnly ? ARMY_RACE_OF_TYPE[t] ?? null : (army?.race ?? "") || null) !== e.race) return false;
	}
	if (Array.isArray(e.quality)) {
		const q = typeOnly ? "Average" : (army?.quality ?? "") || "Average";
		if (!e.quality.includes(q)) return false;
	}
	return true;
}
var ARMY_RACE_OF_TYPE = {
	"Shieldwall Levies": "Human",
	"Free Lances": "Human",
	"Yeoman Longbows": "Human",
	"Gilded Lances": "Human",
	"Human Garrison": "Human",
	"Men-at-Arms": "Human",
	"Elven Bowmen": "Elven",
	"Forest Wardens": "Elven",
	"Shadow Archers": "Elven",
	"Eagle Riders": "Elven",
	"Elven Galleys": "Elven",
	"Elven Garrison": "Elven",
	"Stag Riders": "Elven",
	"Dwarven Guard": "Dwarven",
	"Ironwood Crossbows": "Dwarven",
	"Mountain Guns": "Dwarven",
	"Dwarf Ironclads": "Dwarven",
	"Gnomish Gyrocopters": "Dwarven",
	"Dwarf Garrison": "Dwarven",
	"Ironhoof Rams": "Dwarven",
	"Warg Riders": "Orcish",
	"Orc Berserkers": "Orcish",
	"Goblin Horde": "Orcish",
	"Wyvern Riders": "Orcish",
	"Orcish Longships": "Orcish",
	"Black Arrows": "Orcish",
	"Orc Garrison": "Orcish"
};
// src/engine/rules-on-plain-values/the-factor-a-realms-unit-strength-discoveries-strengthen-a-unit-by.ts
/** "strength: a realm's discoveries strengthen a unit" (`unitStr`): the factor one effect gives the unit, `1 + pct`,
*  or nothing if it doesn't reach the unit's type, race and quality (or risen dead), the ground, the side, the king's
*  own command or a garrison standing alone. */
function theFactorAUnitStrengthDiscoveryGivesAUnit(e, facts) {
	if (!discUnitMatch(e, facts.theUnit)) return null;
	if (e.king && !facts.isItLedByTheKing) return null;
	if (e.terrain && (facts.theGround == null || !e.terrain.includes(facts.theGround))) return null;
	if (e.side === "atk" && facts.isItsSideTheAttacker !== true) return null;
	if (e.side === "def" && facts.isItsSideTheAttacker !== false) return null;
	if (e.led === "garrison" && facts.hasItACommander) return null;
	return 1 + (e.pct ?? 0);
}
/** The product of the factors of the unit-strength effects a realm holds that reach the unit, capped at the kind's
*  ceiling (×1.30), however many it stacks (Toby, 2026-09-21). */
function theFactorTheUnitStrengthDiscoveriesARealmHoldsStrengthenAUnitBy(theEffects, facts) {
	let m = 1;
	for (const e of theEffects) {
		const factor = theFactorAUnitStrengthDiscoveryGivesAUnit(e, facts);
		if (factor !== null) m *= factor;
	}
	return Math.min(DISCOVERY_EFFECTS_THE_REGISTRY_HOLDS["unit-strength"].numbers.theCeiling.value, m);
}
// src/engine/rules-on-plain-values/the-strength-a-units-kin-and-a-rival-kins-leader-leave-it.ts
/** HUMANOID RACE AFFINITY and RACIAL ANIMOSITY. Two independent, stacking ×1.2 boosts: a unit of its realm's king's
*  race, and a unit led by a character (king or hero) of its race (a king leading his own race's troops: ×1.44). Then
*  ×0.8 for a unit led by a commander of its rival kin. Each is rounded as it is taken. A unit, king or leader with no
*  race is no one's kin: Creatures, Monsters and skeletons never match, since a character's race is always humanoid. */
function theStrengthAUnitsKinAndARivalKinsLeaderLeaveIt(strength, theUnitsRace, theKingsRace, theLeadersRace) {
	const rivalKin = { ...KC_RIVAL_RACE };
	const itsKingIsOfItsKin = !!theUnitsRace && !!theKingsRace && theUnitsRace === theKingsRace;
	const itsLeaderIsOfItsKin = !!theUnitsRace && !!theLeadersRace && theUnitsRace === theLeadersRace;
	const aLeaderOfItsRivalKinLeadsIt = !!theUnitsRace && !!theLeadersRace && rivalKin[theUnitsRace] === theLeadersRace;
	let str = strength;
	if (itsKingIsOfItsKin) str = Math.round(str * 1.2);
	if (itsLeaderIsOfItsKin) str = Math.round(str * 1.2);
	if (aLeaderOfItsRivalKinLeadsIt) str = Math.round(str * .8);
	return {
		strength: str,
		itsKingIsOfItsKin,
		itsLeaderIsOfItsKin,
		aLeaderOfItsRivalKinLeadsIt
	};
}
// src/engine/rules-on-plain-values/the-strength-a-unit-has-before-the-ground-and-the-foe.ts
/** Whether an effect a held item carries has a step at the stage "strength: the commander's items". */
function anEffectOfTheCommandersItems(slug) {
	return Object.hasOwn(THE_COMMANDERS_ITEMS, slug);
}
/** The effects with a step at "strength: the commander's items" that his items carry, in the stage's order (the
*  steps' own: a unit case pins it to the items' registry's order of the stage). */
function theEffectsOfTheCommandersItemsInTheirOrder(theItemsHeUses) {
	const carried = theEffectsTheseItemsCarry(theItemsHeUses);
	return Object.keys(THE_COMMANDERS_ITEMS).filter(anEffectOfTheCommandersItems).filter((slug) => carried.has(slug));
}
/** The strength of a unit a hero leads before the ground, the foe and the battle's tactics, in armStr's order, each
*  step rounded as armStr rounds it: Druid 8 and Necromancy 6 lift its quality; its base strength at that quality; a
*  Druid shortfall (rounded down); its kin and a rival kin's leader; the realm's unit-strength discoveries; his items'
*  steps; his Druid mastery; his minor titles' army perks. With the kin it counted, for the card's tags. */
function theStrengthAUnitHasBeforeTheGroundAndTheFoe(unit, hero) {
	const quality = theQualityACommandersDruid8AndNecromancy6LiftAUnitTo({
		unitType: unit.unitType,
		quality: (unit.quality ?? "") || "Average",
		isSkeletal: unit.isSkeletal
	}, {
		hisDruidMasteryTier: hero.hisDruidMasteryTier,
		hisNecromancyMasteryTier: hero.hisNecromancyMasteryTier
	}).quality;
	let str = (UNIT_BASE_STR[unit.unitType] ?? 4) * (UNIT_Q_MULT[quality] ?? 2);
	if (hero.theShareHisDruidShortfallLeaves < 1) str = Math.floor(str * hero.theShareHisDruidShortfallLeaves);
	const theKin = theStrengthAUnitsKinAndARivalKinsLeaderLeaveIt(str, (unit.race ?? "") || null, hero.theKingsRace, (hero.hisRace ?? "") || null);
	str = theKin.strength;
	const discoveries = theFactorTheUnitStrengthDiscoveriesARealmHoldsStrengthenAUnitBy(hero.theRealmsUnitStrengthEffects, {
		theUnit: {
			type: unit.unitType,
			race: unit.race,
			_isSkeletal: unit.isSkeletal,
			...unit.quality === void 0 ? {} : { quality: unit.quality }
		},
		theGround: null,
		isItsSideTheAttacker: null,
		isItLedByTheKing: hero.heIsTheKing,
		hasItACommander: true
	});
	if (discoveries !== 1) str = Math.round(str * discoveries);
	str = theStrengthAUnitHasAfterTheStepsOfItsCommandersItems(theEffectsOfTheCommandersItemsInTheirOrder(hero.theItemsHeUses), {
		unitType: unit.unitType,
		quality: unit.quality,
		isSkeletal: unit.isSkeletal,
		theRealmsAlignment: hero.theRealmsAlignment
	}, str);
	if (hero.hisDruidMasteryGain > 0) str = Math.round(str * (1 + hero.hisDruidMasteryGain));
	str = theStrengthAUnitsCommandersMinorTitlesLiftItTo(str, unit.unitType, hero.heHoldsTheMinorTitle).strength;
	return {
		strength: str,
		theKin
	};
}
// src/engine/rules-on-plain-values/ships-and-flyers-that-carry-a-column-across-the-sea.ts
/** The berths each carrier offers where it isn't one (2026-10-13, Creatures and Monsters VI: the Great Turtles). */
var BERTHS_OF_A_CARRIER = KC_CARRIER_BERTHS;
function carrierBerths(a) {
	return a && CARRIER_TYPES.has(a.type) ? BERTHS_OF_A_CARRIER[a.type] ?? 1 : 0;
}
var LIGHT_ARMIES = new Set(KC_UNIT_CLASS.lightFoot);
/** Whether a unit takes half a hull aboard ship (light foot), not a whole one. */
function takesHalfAHullAboard(a) {
	return LIGHT_ARMIES.has(a.type);
}
/** Whether `column` can put to sea, and why: its hulls (doubled when `hullsCarryDouble`, the leader's Naval 8) and its
*  humanoid flyers pool their lift. `takesHalfAHull` says which units take half a hull (light foot; the player
*  portal adds the units it can't type in advance). */
function seaLiftOfAColumn(column, hullsCarryDouble, takesHalfAHull = takesHalfAHullAboard) {
	const armies = (column ?? []).filter((a) => !!a && !a._phantom);
	const landArmies = armies.filter((a) => !AERIAL_TYPES.has(a.type) && !SEA_TYPES.has(a.type));
	const seaCount = armies.reduce((s, a) => s + carrierBerths(a), 0);
	let hullCap = seaCount;
	if (hullsCarryDouble) hullCap *= 2;
	const flyerLift = armies.filter((a) => FLYING_TYPES.has(a.type)).length;
	const lifted = getFlyCapability(armies);
	const lift = (answer, room, mustSail, leftAshore) => ({
		answer,
		berths: seaCount,
		berthsUnderItsLeader: hullCap,
		landUnits: landArmies.length,
		unitsThatMustSail: mustSail,
		humanoidFlyers: flyerLift,
		flyersLiftTheWholeColumn: lifted,
		roomLeft: room,
		unitsLeftAshore: leftAshore
	});
	if (armies.length === 0) return lift("all", hullCap, 0, []);
	if (landArmies.length === 0) return lift("all", hullCap, 0, []);
	if (lifted) return lift("sea", hullCap, 0, []);
	const _capOf = (a) => takesHalfAHull(a) ? .5 : 1;
	const _mustSail = landArmies.filter((a) => !isAirCarriable(a));
	const _liftable = landArmies.filter((a) => isAirCarriable(a));
	let _room = hullCap - _mustSail.reduce((s, a) => s + _capOf(a), 0);
	if (_room < 0) {
		const _ashore = [];
		let _over = -_room;
		for (const a of _mustSail.slice().sort((a, b) => _capOf(b) - _capOf(a))) {
			if (_over <= 0) break;
			_ashore.push(a);
			_over -= _capOf(a);
		}
		return lift("land", _room, _mustSail.length, _ashore);
	}
	const _byAir = [];
	_liftable.slice().sort((a, b) => _capOf(a) - _capOf(b)).forEach((a) => {
		const _c = _capOf(a);
		if (_room >= _c) _room -= _c;
		else _byAir.push(a);
	});
	if (_byAir.length <= flyerLift) return lift("sea", _room, _mustSail.length, []);
	return lift("land", _room, _mustSail.length, _byAir.slice(flyerLift));
}
// src/engine/rules-on-plain-values/skills-in-order-and-a-heros-fame-in-words.ts
var ALL_SKILLS = KC_SKILLS.slice();
function skillFameLabelM(level) {
	const l = level || 0;
	return l >= 7 ? "has a heroic level of" : l >= 4 ? "legendary for" : "renowned for";
}
function topSkillOf(char) {
	const skills = Object.entries(char && char.skills || {}).filter(([, v]) => v > 0);
	if (!skills.length) return null;
	const maxLevel = Math.max(...skills.map(([, v]) => v));
	const tied = skills.filter(([, v]) => v === maxLevel);
	tied.sort((a, b) => ALL_SKILLS.indexOf(a[0]) - ALL_SKILLS.indexOf(b[0]));
	const top = tied[0];
	if (!top) return null;
	const [sk, lv] = top;
	return {
		skill: sk,
		level: lv
	};
}
// src/content/spell-effects-their-names-numbers-and-words.ts
var SPELL_EFFECTS_THE_REGISTRY_HOLDS = {
	fireball: {
		name: "Fireball",
		fn: "elemental_fireball",
		battleMagic: {
			theShareOfBaseStrengthLost: {
				value: .5,
				theTextsWriteIt: "a share lost, in words"
			},
			theStrongestUnitsStruck: {
				value: 1,
				theTextsWriteIt: "the strongest units, in words"
			}
		},
		combat: {
			theShareOfMaximumHpItBurnsARound: {
				value: 10,
				theTextsWriteIt: "a percentage"
			},
			theShareMoreALevel: {
				value: 2,
				theTextsWriteIt: "a percentage"
			},
			theRoundsItBurns: {
				value: 3,
				theTextsWriteIt: "rounds"
			}
		}
	},
	"lightning-bolt": {
		name: "Lightning Bolt",
		fn: "elemental_lightning",
		battleMagic: {
			theShareOfBaseStrengthLost: {
				value: .2,
				theTextsWriteIt: "a share lost, as a percentage"
			},
			theLevelItCountsTo: {
				value: 5,
				theTextsWriteIt: "the level it counts to"
			}
		},
		combat: {
			theLeastDamageALevel: {
				value: 1,
				theTextsWriteIt: "the least of a range"
			},
			theMostDamageALevel: {
				value: 3,
				theTextsWriteIt: "the most of a range"
			}
		}
	},
	"telekinetic-storm": {
		name: "Telekinetic Storm",
		fn: "psychic_storm",
		battleMagic: { theTacticalMultiplier: {
			value: .5,
			theTextsWriteIt: "a multiplier, in words"
		} },
		combat: {
			theShareOfMaximumHpItDeals: {
				value: 12,
				theTextsWriteIt: "a percentage"
			},
			theShareMoreALevel: {
				value: 3,
				theTextsWriteIt: "a percentage"
			},
			theShareTheCasterTakesBack: {
				value: .25,
				theTextsWriteIt: "a share, in words"
			}
		},
		asAnOrder: {
			aCharmedHeroWillNotTurnItOnHisLord: true,
			itsMarkMustStandInTheProvince: true
		}
	},
	"psychic-blast": {
		name: "Psychic Blast",
		fn: "psychic_blast",
		battleMagic: {},
		combat: {
			theRoundsItStuns: {
				value: 1,
				theTextsWriteIt: "rounds"
			},
			theLevelsForEachRoundMore: {
				value: 2,
				theTextsWriteIt: "the levels for each round more, in words"
			}
		},
		asAnOrder: {
			aCharmedHeroWillNotTurnItOnHisLord: true,
			itsMarkMustStandInTheProvince: true,
			aCloakedMarkIsShieldedFromIt: true
		}
	},
	curse: {
		name: "Curse",
		fn: "necromancy_curse",
		battleMagic: {},
		combat: { theDivisorOfHisBestSkill: {
			value: 2,
			theTextsWriteIt: "a divisor, in words"
		} },
		asAnOrder: {
			aCharmedHeroWillNotTurnItOnHisLord: true,
			itsMarkMustStandInTheProvince: true,
			aCloakedMarkIsShieldedFromIt: true
		}
	},
	"control-undead": {
		name: "Control Undead",
		fn: "necromancy_control",
		battleMagic: {},
		combat: {},
		asAnOrder: {
			aCharmedHeroWillNotTurnItOnHisLord: true,
			itsMarkMustStandInTheProvince: true
		}
	},
	"holy-symbol": {
		name: "Holy Symbol",
		fn: "white_holy_symbol",
		battleMagic: { theShareOfBaseStrengthLost: {
			value: .25,
			theTextsWriteIt: "a share lost, as the share kept"
		} },
		combat: {
			theCutToTheTargetsAimALevel: {
				value: 8,
				theTextsWriteIt: "a percentage"
			},
			theShareOfMaximumHpItSears: {
				value: 6,
				theTextsWriteIt: "a percentage"
			},
			theShareOfHisOwnMaximumHpTheCasterRecovers: {
				value: 10,
				theTextsWriteIt: "a percentage"
			},
			theMultiplierAgainstTheUndeadAndFiends: {
				value: 1.5,
				theTextsWriteIt: "a multiplier, as a figure"
			}
		}
	},
	spiritwrack: {
		name: "Spiritwrack",
		fn: "white_spiritwrack",
		battleMagic: { theShareOfBaseStrengthLost: {
			value: .5,
			theTextsWriteIt: "a share lost, in words"
		} },
		combat: {
			theRoundsItSilences: {
				value: 1,
				theTextsWriteIt: "rounds"
			},
			theLevelsForEachRoundMore: {
				value: 2,
				theTextsWriteIt: "the levels for each round more, in words"
			},
			theMostRounds: {
				value: 3,
				theTextsWriteIt: "the most rounds"
			},
			theRoundsLongerAgainstAGuardianWeakToWhite: {
				value: 1,
				theTextsWriteIt: "rounds longer"
			},
			theChanceAPowerfulGuardianShrugsItOff: {
				value: 25,
				theTextsWriteIt: "a percentage"
			},
			theChanceALegendaryGuardianShrugsItOff: {
				value: 40,
				theTextsWriteIt: "a percentage"
			}
		}
	},
	"hand-of-death": {
		name: "Hand of Death",
		fn: "necromancy_hand",
		combat: {
			theChanceALevel: {
				value: 10,
				theTextsWriteIt: "a percentage"
			},
			theMostChance: {
				value: 60,
				theTextsWriteIt: "a percentage"
			},
			theShareOfMaximumHpItStrikesFor: {
				value: 40,
				theTextsWriteIt: "a percentage"
			}
		}
	},
	"mirror-image": {
		name: "Mirror Image",
		fn: "illusory_mirror_image",
		combat: {
			theShareOfHisHealthTheImageCarries: {
				value: 40,
				theTextsWriteIt: "a percentage"
			},
			theRoundsItLasts: {
				value: 3,
				theTextsWriteIt: "rounds"
			},
			theChanceAHeroSeesThroughItForEachSkillLevel: {
				value: 4,
				theTextsWriteIt: "a percentage"
			},
			theChanceAGuardianSeesThroughIt: {
				value: 5,
				theTextsWriteIt: "a percentage"
			},
			theChanceMoreForEachLevelOfAGuardiansMelee: {
				value: 3,
				theTextsWriteIt: "a percentage"
			},
			theLeastChanceItIsSeenThrough: {
				value: 2,
				theTextsWriteIt: "a percentage"
			},
			theMostChanceItIsSeenThrough: {
				value: 90,
				theTextsWriteIt: "a percentage"
			}
		}
	},
	invisibility: {
		name: "Invisibility",
		fn: "illusory_invisibility",
		combat: {
			theCutToHisFoesAim: {
				value: 10,
				theTextsWriteIt: "a percentage"
			},
			theCutMoreALevel: {
				value: 4,
				theTextsWriteIt: "a percentage"
			},
			theFlightAdded: {
				value: 30,
				theTextsWriteIt: "a percentage"
			},
			theStealAdded: {
				value: 15,
				theTextsWriteIt: "a percentage"
			}
		}
	},
	charm: {
		name: "Charm",
		fn: "psychic_charm",
		combat: {},
		asAnOrder: {
			aCharmedHeroWillNotTurnItOnHisLord: true,
			itsMarkMustStandInTheProvince: true
		}
	},
	"part-sea": {
		name: "Part Sea",
		fn: "white_part_sea",
		asAnOrder: { aBlessWardMayTurnItAside: true }
	},
	"bless-province": {
		name: "Bless Province",
		fn: "white_bless_province",
		asAnOrder: { aGrandCathedralFreesItsSlot: true }
	},
	oratory: {
		name: "Oratory",
		fn: "psychic_oratory",
		asAnOrder: { itsMarkMustStandInTheProvince: true }
	},
	"phantasmal-armies": {
		name: "Phantasmal Armies",
		fn: "illusory_phantasmal",
		asAnOrder: { itsMarkMustStandInTheProvince: true }
	},
	earthquake: {
		name: "Earthquake",
		fn: "elemental_earthquake",
		asAnOrder: { aBlessWardMayTurnItAside: true }
	},
	flood: {
		name: "Flood",
		fn: "elemental_flood",
		asAnOrder: { aBlessWardMayTurnItAside: true }
	},
	plague: {
		name: "Plague",
		fn: "necromancy_plague",
		asAnOrder: { aBlessWardMayTurnItAside: true }
	},
	"divine-judgment": {
		name: "Divine Judgment",
		fn: "white_judgment",
		asAnOrder: { itsMarkMustStandInTheProvince: true }
	},
	"mass-confusion": {
		name: "Mass Confusion",
		fn: "psychic_massconfusion",
		asAnOrder: { itsMarkMustStandInTheProvince: true }
	},
	dominate: {
		name: "Dominate",
		fn: "psychic_dominate",
		asAnOrder: {
			aCharmedHeroWillNotTurnItOnHisLord: true,
			itsMarkMustStandInTheProvince: true
		}
	},
	"chain-lightning": {
		name: "Chain Lightning",
		fn: "elemental_chainlightning",
		asAnOrder: { itsMarkMustStandInTheProvince: true }
	}
};
// src/engine/rules-on-plain-values/spells-each-school-allows-a-turn-and-a-fight.ts
/** Action spells of one school a hero may cast in a turn, by his effective level in it: 1 at level 1 or 2, 2 at
*  level 3, 3 at level 4 or more (AK rules). The Warlock's extra cast is actionSpellsAHeroMayCastInASchoolEachTurn's. */
function actionSpellsAllowedPerSchoolEachTurn(level) {
	return level >= 4 ? 3 : level >= 3 ? 2 : 1;
}
/** A hero's trained level in a skill, 0 to 9 (as the engine's skillLevel reads it). */
var hisTrainedLevel = (hero, skill) => Math.max(0, Math.min(9, Number(hero?.skills?.[skill]) || 0));
/** The highest level a hero has trained in any magic school (0: none): the Warlock title's measure, and the level of
*  his best school. */
function theHighestLevelAHeroHasTrainedInAMagicSchool(hero) {
	return Math.max(0, ...KC_MAGIC_SCHOOLS.map((school) => hisTrainedLevel(hero, school)));
}
/** Action spells of one school a hero may cast in a turn (R-123): actionSpellsAllowedPerSchoolEachTurn at his
*  effective level in it, and one more if he holds the Warlock's minor title and it is his best school (his trained
*  level in it is his highest in any school: each school tied for it counts). */
function actionSpellsAHeroMayCastInASchoolEachTurn(hero, school, hisEffectiveLevelInTheSchool, heHoldsTheWarlocksTitle) {
	const hisBestSchool = hisTrainedLevel(hero, school) === theHighestLevelAHeroHasTrainedInAMagicSchool(hero);
	return actionSpellsAllowedPerSchoolEachTurn(hisEffectiveLevelInTheSchool) + (heHoldsTheWarlocksTitle && hisBestSchool ? 1 : 0);
}
/** Whether the spell named costs its caster no casting slot (R-124): never counted among his casts of its school, nor
*  ever blocked by them. So it is where its row in the content says a Grand Cathedral frees its slot
*  (`asAnOrder.aGrandCathedralFreesItsSlot`: Bless Province) and the caster's realm's Grand Cathedral stands. A name with
*  no row costs a slot. */
function theSpellCostsItsCasterNoCastingSlot(theSpellsName, theCastersRealmHasAGrandCathedral) {
	const row = Object.values(SPELL_EFFECTS_THE_REGISTRY_HOLDS).find((r) => r.name === theSpellsName);
	return theCastersRealmHasAGrandCathedral && row?.asAnOrder?.aGrandCathedralFreesItsSlot === true;
}
/** Combat spells of one school a hero may cast in one personal combat, by his level in it: 1 at level 1, 2 at
*  level 2 or more. */
function combatSpellsAllowedPerSchoolEachFight(level) {
	return level >= 2 ? 2 : 1;
}
// src/engine/rules-on-plain-values/spells-the-order-form-offers-each-school-aim-and-mastery-level.ts
/** Every spell, by its name, in the content's order. */
function everySpell() {
	return Object.entries(SPELL_DEFS_P);
}
/** The names of the spells the content writes as `keep` says, in its order. */
function theSpellsThat(keep) {
	return everySpell().filter(([, spell]) => keep(spell)).map(([name]) => name);
}
/** The spells named, by school: each school in the order its first spell comes, its spells in the order named. */
function bySchool(names) {
	const spells = everySpell();
	const schools = {};
	for (const name of names) {
		const school = spells.find(([n]) => n === name)?.[1].school;
		if (school !== void 0) (schools[school] ??= []).push(name);
	}
	return schools;
}
/** Every spell by school (white, psychic, illusory, elemental, necromancy), each school's in the content's order. */
function everySpellBySchool() {
	return bySchool(theSpellsThat(() => true));
}
/** The school of each spell, by its name, school by school as everySpellBySchool lists them. */
function theSchoolOfEachSpell() {
	return Object.fromEntries(Object.entries(everySpellBySchool()).flatMap(([school, spells]) => spells.map((name) => [name, school])));
}
/** The raw level in its school each mastery spell needs (7 or 9), by its name: past level 5 comes from experience
*  only. A spell not here needs none. */
function theLevelEachMasterySpellNeeds() {
	return Object.fromEntries(everySpell().flatMap(([name, spell]) => spell.reqLevel ? [[name, spell.reqLevel]] : []));
}
/** The action spells (a Cast Spell order may name them), in the content's order. */
function theActionSpells() {
	return new Set(theSpellsThat((spell) => spell.phase));
}
/** The action spells no mastery level gates, in the content's order: the ones the form offers a hero whose levels his
*  realm can't see (hired, raised or charmed this turn). */
function theActionSpellsNoMasteryLevelGates() {
	return new Set(theSpellsThat((spell) => spell.phase && !spell.reqLevel));
}
/** The order an Encounter plan lists the combat spells in. It is the content's but in three schools (Psychic Blast and
*  Telekinetic Storm before Charm, Mirror Image before Invisibility, Curse and Hand of Death before Control Undead), and
*  the content writes no other, so it is written here, once. Which spells are combat spells is the content's to say
*  (`encounter`); each is named here (tests/unit/spells-the-order-form-offers-and-where-their-marks-must-stand.test.ts
*  lists them). */
var THE_ORDER_AN_ENCOUNTER_PLAN_LISTS_THE_COMBAT_SPELLS = [
	"Holy Symbol",
	"Spiritwrack",
	"Psychic Blast",
	"Telekinetic Storm",
	"Charm",
	"Mirror Image",
	"Invisibility",
	"Lightning Bolt",
	"Fireball",
	"Curse",
	"Hand of Death",
	"Control Undead"
];
/** The combat spells (an Encounter plan may name them) by school, as an Encounter plan lists them. */
function theCombatSpellsBySchool() {
	return bySchool(theSpellsThat((spell) => spell.encounter).sort((a, b) => THE_ORDER_AN_ENCOUNTER_PLAN_LISTS_THE_COMBAT_SPELLS.indexOf(a) - THE_ORDER_AN_ENCOUNTER_PLAN_LISTS_THE_COMBAT_SPELLS.indexOf(b)));
}
/** The action spells aimed at a province (the order names the province), in the content's order. */
function theActionSpellsAimedAtAProvince() {
	return new Set(theSpellsThat((spell) => spell.phase && spell.target === "province"));
}
/** The action spells aimed at a hero (the order names the hero), in the content's order. */
function theActionSpellsAimedAtAHero() {
	return new Set(theSpellsThat((spell) => spell.phase && spell.target === "character"));
}
// src/content/alignment-orders-their-keys-names-creeds-numbers-and-words.ts
/** The alignment orders, by slug, in the order of ALIGNMENT_ORDER_KEYS. */
var THE_ALIGNMENT_ORDERS = {
	consecrate: {
		key: "consecrate",
		name: "Consecrate",
		theOtherNamesTheTurnReads: ["consecrate province"],
		creed: "Divine",
		theKingAlone: true,
		theNumbers: {}
	},
	"call-to-arms": {
		key: "call_to_arms",
		name: "Call to Arms",
		theOtherNamesTheTurnReads: [],
		creed: "Good",
		theKingAlone: true,
		theNumbers: { theGradeMustered: {
			value: "Green",
			writtenAs: "as it is",
			inItsCreedsSection: "a free {N} garrison unit",
			inTheReportsSummary: "a free {N} garrison unit"
		} }
	},
	broker: {
		key: "broker",
		name: "Broker",
		theOtherNamesTheTurnReads: [],
		creed: "Neutral",
		theKingAlone: true,
		theNumbers: { thePriceOfWordFromAProvince: {
			value: 2,
			writtenAs: "as it is",
			inItsCreedsSection: "has ever seen for {N}g",
			inTheReportsSummary: "has ever seen for {N}g"
		} }
	},
	"harvest-the-field": {
		key: "harvest_field",
		name: "Harvest the Field",
		theOtherNamesTheTurnReads: [],
		creed: "Undead",
		theKingAlone: false,
		theNumbers: { thePrice: {
			value: 2,
			writtenAs: "as it is",
			inItsCreedsSection: "as a Skeletal unit for {N}g",
			inTheIntrosTable: "from a grave for {N} gold",
			inTheReportsSummary: "as a Skeletal unit for {N}g",
			inTheJoinForm: "raises a grave as a soldier for {N}g"
		} }
	},
	"perform-rite": {
		key: "rite",
		name: "Perform Rite",
		theOtherNamesTheTurnReads: [],
		creed: "Pagan",
		theKingAlone: false,
		theNumbers: {
			theWildHuntsBeasts: {
				value: 2,
				writtenAs: "as a word",
				inItsCreedsSection: "the Wild Hunt binds {N} of",
				inTheReportsSummary: "the Wild Hunt binds {N} of",
				inTheJoinForm: "the Wild Hunt binds {N} of"
			},
			theWildHuntsTurnsMore: {
				value: 1,
				writtenAs: "as the turn it lasts until",
				inItsCreedsSection: "serve until the end of {N}",
				inTheReportsSummary: "as Veterans until the end of {N}"
			},
			theBloodOfferingsGrades: {
				value: 2,
				writtenAs: "as it is",
				inItsCreedsSection: "by +{N} quality tiers",
				inTheReportsSummary: "(+{N} quality tiers each"
			}
		}
	}
};
// src/engine/rules-on-plain-values/the-alignment-orders-the-names-the-form-writes-and-who-may-give-each.ts
/** Whether a realm of the creed `creed` (none: a realm whose creed isn't known) may give the order: its row's creed
*  alone may. */
function aRealmOfThisCreedMayGiveTheAlignmentOrder(order, creed) {
	return creed === order.creed;
}
/** Whether a hero, the king or not (`isKing`; none: not the king), may give the order: any hero may, unless its row
*  marks it the king's alone. */
function aHeroMayGiveTheAlignmentOrderAsKingOrNot(order, isKing) {
	return !order.theKingAlone || (isKing ?? false);
}
/** The name the order form writes for the alignment order of the slug `slug`. */
function theNameTheFormWritesOfTheAlignmentOrder(slug) {
	return THE_ALIGNMENT_ORDERS[slug].name;
}
/** The alignment orders by the name the order form writes, each its row, in the rows' order. */
function theAlignmentOrdersByTheNameTheFormWrites() {
	return Object.fromEntries(Object.values(THE_ALIGNMENT_ORDERS).map((order) => [order.name, order]));
}
// src/engine/rules-on-plain-values/the-company-a-call-to-arms-musters-a-blood-offerings-companies-and-a-consecrations-checks.ts
/** The company a Call to Arms musters in a province of the realm: the first garrison type of the province's own pool
*  (Elven Bowmen), else its race's garrison, else a plain levy (Human Garrison); its race the province's, else Human. */
function theCompanyACallToArmsMusters(ctaProv) {
	return {
		type: ((ctaProv.armyTypes ?? []).find((t) => t.toLowerCase().includes("garrison")) ?? "") || ({
			Human: "Human Garrison",
			Elven: "Elven Garrison",
			Dwarven: "Dwarf Garrison",
			Orcish: "Orc Garrison"
		}[String(ctaProv.race)] ?? "") || "Human Garrison",
		race: (ctaProv.race ?? "") || "Human"
	};
}
/** Whether a Blood Offering may take a company, to give or to raise: one borrowed for a while (summoned, charmed), a
*  Wild Hunt beast or a skeleton can be neither offered nor raised. */
function aBloodOfferingMayTakeTheCompany(a) {
	return !a.temporary && !a.wildHunt && !a.skeletal;
}
/** The companies a Blood Offering gives and raises (each raised two tiers, capped at Elite). The player names them in
*  the order's marks, "S:i,j|E:a,b": places in the column, the ones it may take, each once, none both. With a side
*  named empty (or no marks, an older form's), the first company it may take is given and the second raised; with
*  fewer than two, no offering (null). Each given raises one: the longer side is cut to the shorter. A company is read
*  as its realm sees it (`seenAs`: the engine hands unitAsItsRealmSeesIt); a gap in the column is never taken. */
function theCompaniesABloodOfferingGivesAndRaises(_army, extra, seenAs) {
	const _bOffElig = (i) => {
		const a = _army[i];
		return !!a && aBloodOfferingMayTakeTheCompany(seenAs(a));
	};
	let _sacI = [], _benI = [];
	const _bm = /S:([0-9,]*)\|E:([0-9,]*)/.exec((extra || "").trim());
	if (_bm) {
		_sacI = [...new Set(String(_bm[1]).split(",").filter((x) => x !== "").map(Number))].filter((i) => Number.isInteger(i) && _bOffElig(i));
		_benI = [...new Set(String(_bm[2]).split(",").filter((x) => x !== "").map(Number))].filter((i) => Number.isInteger(i) && _bOffElig(i) && !_sacI.includes(i));
	}
	if (_sacI.length === 0 || _benI.length === 0) {
		const _own = _army.map((a, i) => i).filter(_bOffElig);
		if (_own.length >= 2) {
			_sacI = _own.slice(0, 1);
			_benI = _own.slice(1, 2);
		} else return null;
	}
	const _bn = Math.min(_sacI.length, _benI.length);
	return {
		given: _sacI.slice(0, _bn),
		raised: _benI.slice(0, _bn)
	};
}
/** Why a king may not consecrate the province he stands in, or (refused: null) that he may: it must be his realm's;
*  not his home or beside it (the home marches were anointed at the coronation); not consecrated already; beside no
*  consecrated province (holy ground is spread across the realm); and he must know White, and hold fewer than he may.
*  The answer carries what the turn's lines name: the consecrated neighbour, the list and the limit. */
function whyAKingMayNotConsecrateAProvince(facts) {
	if (!facts.itIsHisRealms) return { refused: "it is not a province of his realm" };
	const { theHomeId: _homeId, theProvincesBesideIt } = facts.theHomeMarches();
	const _homeAdj = new Set(theProvincesBesideIt);
	if (facts.theProvinceId === _homeId || _homeAdj.has(facts.theProvinceId)) return { refused: "it lies in the home marches" };
	const _cList = facts.theConsecrated();
	if (_cList.includes(facts.theProvinceId)) return { refused: "it is consecrated already" };
	const _provAdjC = new Set(facts.theProvincesBesideIt());
	const _adjConsecId = _cList.find((id) => _provAdjC.has(id));
	if (_adjConsecId != null) return {
		refused: "a consecrated province lies beside it",
		theNeighbourId: _adjConsecId
	};
	const _cLimit = facts.theConsecrationsHeMayHold();
	if (_cLimit <= 0) return { refused: "he knows no White" };
	if (_cList.length >= _cLimit) return {
		refused: "he holds as many as he may",
		theConsecrated: _cList,
		theLimit: _cLimit
	};
	return {
		refused: null,
		theConsecrated: _cList,
		theLimit: _cLimit
	};
}
// src/engine/rules-on-plain-values/the-hexes-next-to-a-province-on-a-map-that-wraps-east-to-west.ts
/** The six steps, each a row and a column, from a hex on `row` to its neighbours, in the compass directions' order
*  (KC_HEX_DIRS: NW, NE, W, E, SW, SE). An even row's neighbours above and below lie a column west of an odd row's. */
function theSixStepsFromAHexOnItsRow(row) {
	return row % 2 === 0 ? [
		[-1, -1],
		[-1, 0],
		[0, -1],
		[0, 1],
		[1, -1],
		[1, 0]
	] : [
		[-1, 0],
		[-1, 1],
		[0, -1],
		[0, 1],
		[1, 0],
		[1, 1]
	];
}
/** The place in the map's list (row × `cols` + column) of the hex `step` steps round from `prov` (0 to 5, in
*  KC_HEX_DIRS' order), on a map `cols` wide and `rows` high: the columns wrap round; null past the top or bottom row. */
function theHexStepsRoundFromAProvince(prov, step, cols, rows) {
	const { row, col } = prov;
	const theStep = theSixStepsFromAHexOnItsRow(row)[step];
	if (!theStep) throw new TypeError("no step to a neighbour in that direction");
	const [dr, dc] = theStep;
	const nr = row + dr;
	if (nr < 0 || nr >= rows) return null;
	const nc = ((col + dc) % cols + cols) % cols;
	return nr * cols + nc;
}
/** The place in the map's list (row × `cols` + column) of the hex next to `prov` in the compass direction `dir` (NW,
*  NE, W, E, SW or SE), on a map `cols` wide and `rows` high: the columns wrap round; null past the top or bottom row,
*  or for a direction that isn't one of the six. */
function theHexNextToAProvinceInADirection(prov, dir, cols, rows) {
	const step = KC_HEX_DIRS.indexOf(dir);
	if (step < 0) return null;
	return theHexStepsRoundFromAProvince(prov, step, cols, rows);
}
/** The provinces next to `prov`, from the map's list `provinces` (in row order, `cols` wide and `rows` high), in the
*  compass directions' order (NW, NE, W, E, SW, SE): none past the top or bottom row, and none where the list holds
*  nothing. */
function theProvincesNextToAProvince(prov, cols, rows, provinces) {
	return [
		0,
		1,
		2,
		3,
		4,
		5
	].map((step) => {
		const at = theHexStepsRoundFromAProvince(prov, step, cols, rows);
		return at === null ? null : provinces[at];
	}).filter((p) => Boolean(p));
}
// src/engine/rules-on-plain-values/where-a-column-may-step-the-ground-a-neutral-realms-border-and-ships-over-land.ts
function canEnterTerrain(c, terrain, seaCap) {
	if (terrain === "sea") {
		if (seaCap === "all" || seaCap === "sea") return true;
		if (c._partSeaThisPhase) return true;
		return false;
	}
	const armies = c.armies ?? [];
	if (armies.length > 0 && armies.every((a) => SEA_TYPES.has(a.type))) return false;
	return true;
}
/** Whether a hero's march into a province is turned back at its border: it is held by another realm his own is merely
*  neutral with (no alliance, no war), and he leads companies (a lone hero passes freely). The relation is the one
*  between his realm and the province's owner, as the turn reads it (`'neutral'`, `'allied'`, `'enemy'` or `'self'`). */
function aColumnIsTurnedBackAtANeutralRealmsBorder(theMarchersRealm, theProvincesOwner, theCompaniesHeLeads, theRelationBetweenThem) {
	return theProvincesOwner != null && theProvincesOwner !== theMarchersRealm && theCompaniesHeLeads > 0 && theRelationBetweenThem === "neutral";
}
/** Whether a column that leads any naval unit (a fleet or a sea-beast) is refused this step: ships never cross land, so
*  it may not step from one land province to another; it puts out to sea first, and lands again only from the sea. */
function aColumnLeadingShipsMayNotStepFromLandToLand(theColumnLeadsShips, theGroundItLeaves, theGroundItEnters) {
	return theColumnLeadsShips && theGroundItLeaves !== "sea" && theGroundItEnters !== "sea";
}
// src/engine/rules-on-plain-values/the-first-step-of-a-shortest-route-a-column-may-take.ts
/** A search, breadth first, from `from` toward the province `toId`: the first step of a shortest route the column may
*  take, and its depth (the steps after the first), or null when no route of at most 40 steps exists. A step may
*  enter a province whose ground the column may enter (canEnterTerrain, with its sea cap) and that `extraFilter`
*  allows, if given; a column that leads ships may not step from land to land. Neighbours are searched in the compass
*  directions' order (NW, NE, W, E, SW, SE), so of two routes as short, the one whose first step comes first wins. */
function theFirstStepOfAShortestRouteAColumnMayTake(theColumn, itsSeaCap, itLeadsShips, theMap, from, toId, extraFilter) {
	const passable = (p) => !!p && canEnterTerrain(theColumn, p.terrain, itsSeaCap) && (!extraFilter || extraFilter(p));
	const edgeOk = (a, b) => !aColumnLeadingShipsMayNotStepFromLandToLand(itLeadsShips, a.terrain, b.terrain);
	const seen = /* @__PURE__ */ new Set([from.id]);
	let frontier = theProvincesNextToAProvince(from, theMap.cols, theMap.rows, theMap.provinces).filter((p) => passable(p) && edgeOk(from, p)).map((p) => ({
		p,
		first: p
	}));
	frontier.forEach((e) => seen.add(e.p.id));
	let depth = 0;
	while (frontier.length && depth < 40) {
		for (const e of frontier) if (e.p.id === toId) return {
			first: e.first,
			depth
		};
		const next = [];
		for (const e of frontier) for (const nb of theProvincesNextToAProvince(e.p, theMap.cols, theMap.rows, theMap.provinces)) {
			if (seen.has(nb.id) || !passable(nb) || !edgeOk(e.p, nb)) continue;
			seen.add(nb.id);
			next.push({
				p: nb,
				first: e.first
			});
		}
		frontier = next;
		depth++;
	}
	return null;
}
/** Whether a realm's column may pass through a province on its way without starting a fight or being turned back (plan
*  P1-11e12): its realm's own, an ally's (`theRelation`, asked only of another realm's province), or ground no realm
*  holds where no armed neutral guard stands (`anArmedNeutralGuardStandsThere`, asked only there). */
function aProvinceIsSafePassageForARealmsColumn(theRealm, theOwner, theRelation, anArmedNeutralGuardStandsThere) {
	if (theOwner === theRealm) return true;
	if (theOwner != null) return theRelation() === "allied";
	return !anArmedNeutralGuardStandsThere();
}
/** The step a column takes toward a far province (plan P1-11e12): the first step of a shortest route (`theRoute`, asked
*  with no filter), but where it serves a realm, of a route over safe passage (`isSafePassage`: the province it makes
*  for may be any) that is no longer, that one's. Null when no route reaches it. */
function theStepAColumnTakesTowardAFarProvince(theRoute, toId, itServesARealm, isSafePassage) {
	const any = theRoute();
	if (!any) return null;
	if (itServesARealm) {
		const safe = theRoute((p) => p.id === toId || isSafePassage(p));
		if (safe && safe.depth <= any.depth) return safe.first;
	}
	return any.first;
}
// src/engine/rules-on-plain-values/the-items-a-send-item-hands-over-and-the-companies-a-hand-over-or-a-pick-up-moves.ts
/** Whether a held item is the Mithril suit, a relic granted to its wearer: its effect carries the key of the
*  `mithril-armour` row (the items' registry's anItemIsTheMithrilSuit asks this). */
function anItemIsTheMithrilSuitGrantedToItsWearer(item) {
	return item?.effect?.stat === MAGIC_ITEM_EFFECTS_THE_REGISTRY_HOLDS["mithril-armour"].carriedAs.stat;
}
/** The places in a hero's pack a Send Item order hands over, highest first (each is taken out before the places below
*  it shift), and whether a Mithril suit it names stays with its wearer (forged to him, it is never sent). "all" names
*  every item; else each token is a place (a plain whole number in the pack's range: "3 Rings of Dawn" is a name) or
*  an item's id or name. */
function theItemsASendItemOrderHandsOver(held, target) {
	let idxs;
	if (String((target ?? "") || "").trim().toLowerCase() === "all") idxs = held.map((_, i) => i);
	else idxs = String((target ?? "") || "").split(",").map((s) => s.trim()).filter(Boolean).map((t) => {
		const n = parseInt(t);
		if (Number.isInteger(n) && String(n) === t && n >= 0 && n < held.length) return n;
		return held.findIndex((it) => it && (String(it.id) === t || it.name === t));
	}).filter((n) => Number.isInteger(n) && n >= 0 && n < held.length);
	let uniq = [...new Set(idxs)].sort((a, b) => b - a);
	let theMithrilSuitStays = false;
	if (uniq.some((i) => anItemIsTheMithrilSuitGrantedToItsWearer(held[i]))) {
		uniq = uniq.filter((i) => !anItemIsTheMithrilSuitGrantedToItsWearer(held[i]));
		theMithrilSuitStays = true;
	}
	return {
		places: uniq,
		theMithrilSuitStays
	};
}
/** Whether risen dead follow a hand-over to where it goes: into a garrison (no recipient) always; to a comrade only if
*  he is Undead himself or serves an Undead realm. */
function theRisenDeadFollowAHandOverTo(recipient) {
	return !recipient || recipient.alignment === "Undead" || recipient.hisRealmsAlignment === "Undead";
}
/** Where a hand-over's companies go, by the risen dead among them: where they refuse to follow (theyFollow false),
*  the skeletal companies go to their graves and the rest are handed; else every company is handed. Each list keeps
*  the companies' order. */
function whereAHandOversRisenDeadGo(companies, theyFollow, seenAs) {
	const skelTransfer = companies.filter((a) => seenAs(a).skeletal);
	if (skelTransfer.length > 0 && !theyFollow) return {
		handed: companies.filter((a) => !seenAs(a).skeletal),
		toTheirGraves: skelTransfer
	};
	return {
		handed: [...companies],
		toTheirGraves: []
	};
}
/** Which of the companies joining a leader's column he takes, and which are left where they were (Item 24,
*  2026-10-12): in their order, each beast that counts against his beast command (countsAgainstBeastCommand) takes one
*  place of the room his command leaves while any is left; past it, beasts are left. Other companies are always taken. */
function theCompaniesALeaderTakesUpToHisBeastCommandsRoom(joining, room, seenAs) {
	let _room = room;
	const taken = [], left = [];
	joining.forEach((a) => {
		if (countsAgainstBeastCommand(seenAs(a))) {
			if (_room > 0) {
				_room--;
				taken.push(a);
			} else left.push(a);
		} else taken.push(a);
	});
	return {
		taken,
		left
	};
}
/** The places in a province's garrison a Pick Up order takes its companies from, in the order he takes them up: the
*  last first. "all" takes every company; else each `g:N` token names a place in the garrison, once (a place out of
*  range names none). */
function theGarrisonPlacesAPickUpTakes(target, garrisonSize) {
	if (((target ?? "") || "").toString().trim().toLowerCase() === "all") return Array.from({ length: garrisonSize }, (_, i) => garrisonSize - 1 - i);
	const idxs = String(target).split(",").map((s) => s.trim()).filter((s) => /^g:\d+$/i.test(s)).map((s) => parseInt(s.slice(2)));
	return [...new Set(idxs)].filter((i) => Number.isInteger(i) && i >= 0 && i < garrisonSize).sort((a, b) => b - a);
}
// src/engine/rules-on-plain-values/the-chance-a-practice-alone-raises-a-skill-and-the-price-and-wage-a-druid-or-a-host-leader-cuts.ts
/** The chance, in percent, a practice alone raises a skill from each level below mastery: 25% at level 0 down to 5%
*  at level 4 (the report's table of chances shows these). */
var THE_PERCENT_CHANCE_A_PRACTICE_ALONE_RAISES_A_SKILL_FROM_EACH_LEVEL = [
	25,
	20,
	15,
	10,
	5
];
/** Whether a skill at this level is past what practice can raise (level 5 or more): no roll is made. */
function aSkillAtThisLevelIsPractisedNoFurther(theLevelHeHolds) {
	return theLevelHeHolds >= 5;
}
/** The base chance (0 to 1) a practice alone raises a skill from the level he holds at the phase's start (a level of
*  4 or more reads level 4's). */
function theBaseChanceAPracticeAloneRaisesASkill(theLevelHeHolds) {
	return Number(THE_PERCENT_CHANCE_A_PRACTICE_ALONE_RAISES_A_SKILL_FROM_EACH_LEVEL[Math.min(theLevelHeHolds, 4)]) / 100;
}
/** Perseverance: each practice he failed this turn multiplies his next practice's chance by 1.2. */
function thePerseveranceOfAHeroWhoFailedPracticesThisTurn(thePracticesHeFailedThisTurn) {
	return Math.pow(1.2, thePracticesHeFailedThisTurn);
}
/** Quick learners: a Human of a Human realm practises at ×1.5. */
function theShareAQuickLearnerPractisesAt(isHeAHumanOfAHumanRealm) {
	return isHeAHumanOfAHumanRealm ? 1.5 : 1;
}
/** The chance (0 to 1) a hero practising alone raises his skill: the base by the level he holds, plus what his realm's
*  discoveries add, times his perseverance and his quick learners' share. Peers and a mentor work on top of it. */
function theChanceAHeroPractisingAloneRaisesHisSkill(theLevelHeHolds, whatHisRealmsDiscoveriesAdd, thePracticesHeFailedThisTurn, isHeAHumanOfAHumanRealm) {
	return (theBaseChanceAPracticeAloneRaisesASkill(theLevelHeHolds) + whatHisRealmsDiscoveriesAdd) * thePerseveranceOfAHeroWhoFailedPracticesThisTurn(thePracticesHeFailedThisTurn) * theShareAQuickLearnerPractisesAt(isHeAHumanOfAHumanRealm);
}
/** Whether a company of this type is a beast whose price and wage a Druid halves (a creature or a monster). */
function aCompanyIsABeastADruidHalves(theType) {
	return CREATURE_ARMIES.has(theType) || MONSTER_ARMIES.has(theType);
}
/** The price a Druid 6 recruiter pays for a beast: half, rounded down. */
function thePriceADruidPaysForABeast(thePrice) {
	return Math.floor(thePrice * .5);
}
/** Whether a leader's beasts pay half wages: he holds Druid 6, or his realm has built the Druidic Wonder (asked only
*  when he doesn't, as the turn asks it). */
function aLeadersBeastsPayHalfWages(heHoldsDruidSix, hisRealmHasBuiltTheDruidicWonder) {
	return heHoldsDruidSix || hisRealmHasBuiltTheDruidicWonder();
}
/** The wage a beast pays under a Druid: half, rounded down, at least 1g. */
function theWageABeastPaysUnderADruid(theWage) {
	return Math.max(1, Math.floor(theWage * .5));
}
/** The Host-Leader's cut: the gold saved (no more than the wages) and the wages left. */
function theHostLeadersCut(theCompanyWages, theCompaniesHeSavesOn) {
	return {
		theGoldSaved: Math.min(theCompanyWages, theCompaniesHeSavesOn),
		theWagesLeft: Math.max(0, theCompanyWages - theCompaniesHeSavesOn)
	};
}
// src/engine/rules-on-plain-values/a-wage-after-each-cut-and-ceiling-a-realms-discoveries-make.ts
/** A wage after each cut in turn: a cut never takes the wage below 1g, and is capped at `theCeiling` (or, given none,
*  its own ceiling), what each has saved so far kept in `theAccount`. A cut of null reaches nothing. */
function aWageAfterEachCut(theCuts, theWage, theAccount, theCeiling) {
	let out = theWage;
	for (const [e, theCut] of theCuts) {
		if (theCut === null) continue;
		let cut = Math.min(theCut.theGold, out - 1);
		if (cut <= 0) continue;
		const lim = theCeiling ?? theCut.itsOwnCeiling;
		if (lim != null) {
			const u = Number(theAccount.get(e)) || 0;
			cut = Math.min(cut, lim - u);
			if (cut <= 0) continue;
			theAccount.set(e, u + cut);
		}
		out -= cut;
	}
	return out;
}
/** A hero's wage under each ceiling in turn, after the cuts: each cuts a wage above it down to it (never below 1g), the
*  cut capped at `theCeiling` (or, given none, its own ceiling), what each has saved so far kept in `theAccount`. */
function aWageUnderEachCeiling(theCeilings, theWage, theAccount, theCeiling) {
	let w = theWage;
	for (const [e, theCap] of theCeilings) {
		if (theCap === null || w <= theCap.theWagesCeiling) continue;
		let cut = w - Math.max(1, theCap.theWagesCeiling);
		const lim = theCeiling ?? theCap.itsOwnCeiling;
		if (lim != null) {
			const u = Number(theAccount.get(e)) || 0;
			cut = Math.min(cut, lim - u);
			if (cut <= 0) continue;
			theAccount.set(e, u + cut);
		}
		w -= cut;
	}
	return w;
}
/** A hero's wage after his realm's discoveries: the cuts, then the ceilings, and never below 1g (discHeroWage). */
function aHerosWageAfterTheCutsAndTheCeilings(theCutsLeave, theCeilingsLeave, theWage) {
	return Math.max(1, theCeilingsLeave(theCutsLeave(theWage)));
}
// src/engine/rules-on-plain-values/the-level-a-heros-skill-counts-at-and-his-items-each-name-once.ts
var SKILL_BENEFIT_CAP = 5;
var SKILL_MAX = 9;
var ITEM_UNCAPPED_SKILLS = new Set(KC_ITEM_UNCAPPED_SKILLS);
var FULL_RANGE_SKILLS = /* @__PURE__ */ new Set(["druid"]);
/** The share of a hero's trained level that counts: from 0 to 5, or to 9 for a skill whose trained levels 6 to 9
*  count (Druid). */
function theTrainedLevelOfAHerosSkillThatCounts(skill, theTrainedLevel) {
	return Math.max(0, Math.min(FULL_RANGE_SKILLS.has(skill) ? SKILL_MAX : SKILL_BENEFIT_CAP, theTrainedLevel));
}
/** The level a hero's skill counts at: the share of his trained level that counts, plus his items' bonus (each name
*  once), a Crown of Command's aura and a Curse's cut (negative), from 0 to 5, or to 9 for a skill whose bonuses
*  stack past 5 (melee, archery, the five schools) or whose trained levels count to 9 (Druid). */
function theLevelAHerosSkillCountsAt(skill, theTrainedLevel, hisItemsBonus, theAurasBonus, theCursesCut) {
	const _trained = theTrainedLevelOfAHerosSkillThatCounts(skill, theTrainedLevel);
	const _ceiling = ITEM_UNCAPPED_SKILLS.has(skill) || FULL_RANGE_SKILLS.has(skill) ? SKILL_MAX : SKILL_BENEFIT_CAP;
	return Math.max(0, Math.min(_ceiling, _trained + hisItemsBonus + theAurasBonus + theCursesCut));
}
// src/engine/rules-on-plain-values/the-kind-of-order-each-name-of-an-order-reads-as.ts
var PHASE_ACTION_MAP = {
	move: "move",
	explore: "explore",
	"explore province": "explore",
	search: "search",
	"search lair": "search",
	"search feature": "search",
	"hunting rumours": "hunt_rumours",
	"hunt rumours": "hunt_rumours",
	hunt_rumours: "hunt_rumours",
	recruit: "recruit",
	"recruit armies": "recruit",
	hire: "hire",
	"hire hero": "hire",
	release: "release",
	"release hero": "release",
	"dismiss hero": "release",
	leave_army: "leave_army",
	"leave/transfer army": "leave_army",
	"leave army": "leave_army",
	"transfer army": "leave_army",
	disband_army: "disband_army",
	"disband army": "disband_army",
	disband: "disband_army",
	pickup_army: "pickup_army",
	"pick up army": "pickup_army",
	pick_up_army: "pickup_army",
	give_item: "give_item",
	"give item": "give_item",
	"give magic item": "give_item",
	send_item: "give_item",
	"send item": "give_item",
	"send magic item": "give_item",
	cast_spell: "cast_spell",
	"cast spell": "cast_spell",
	spy: "spy",
	practice: "practice",
	"practice skill": "practice",
	"practice ability": "practice",
	research: "research",
	"research discovery": "research",
	defend: "defend",
	rest: "rest",
	"rest & heal": "rest",
	"rest and heal": "rest",
	...Object.fromEntries(Object.values(THE_ALIGNMENT_ORDERS).flatMap((order) => [
		order.key,
		order.name.toLowerCase(),
		...order.theOtherNamesTheTurnReads
	].map((name) => [name, order.key]))),
	"awaken the wild": "awaken_wild",
	awaken_wild: "awaken_wild",
	"call from the pit": "call_pit",
	call_pit: "call_pit",
	encounter: "encounter",
	"encounter character": "encounter",
	steal: "steal",
	"steal item": "steal",
	"steal from character": "steal",
	use_item: "use_item",
	"use item": "use_item",
	"use magic item": "use_item",
	equip_items: "equip_items",
	"equip items": "equip_items",
	equip: "equip_items",
	"equip item": "equip_items",
	pursue: "encounter",
	"pursue character": "encounter",
	sabotage: "sabotage",
	"forced march": "forced_march",
	forced_march: "forced_march",
	"grand heist": "grand_heist",
	grand_heist: "grand_heist",
	"awaken grove": "awaken_grove",
	awaken_grove: "awaken_grove",
	"chart the unknown": "chart_unknown",
	chart_unknown: "chart_unknown",
	"discover lost ruin": "discover_ruin",
	discover_ruin: "discover_ruin",
	blockade: "blockade",
	"research breakthrough": "research_breakthrough",
	research_breakthrough: "research_breakthrough",
	assassinate: "assassinate",
	vanish: "vanish",
	challenge: "challenge",
	rampage: "rampage",
	"rain of arrows": "rain_of_arrows",
	rain_of_arrows: "rain_of_arrows",
	"sniper's mark": "snipers_mark",
	"snipers mark": "snipers_mark",
	snipers_mark: "snipers_mark",
	"feigned retreat": "feigned_retreat",
	feigned_retreat: "feigned_retreat",
	"grand stratagem": "grand_stratagem",
	grand_stratagem: "grand_stratagem",
	"lightning advance": "lightning_advance",
	lightning_advance: "lightning_advance",
	"raid the coast": "raid_coast",
	raid_coast: "raid_coast",
	"wild calling": "wild_calling",
	wild_calling: "wild_calling",
	"grand design": "grand_design",
	grand_design: "grand_design"
};
function normaliseAction(order) {
	return (PHASE_ACTION_MAP[((order?.action ?? "") || "defend").toLowerCase().trim()] ?? "") || "defend";
}
// src/engine/rules-on-plain-values/the-order-the-heroes-act-in-a-phase-and-who-must-act-first.ts
/** A hero's initiative (AK [3.0]): his skills added up, his March counted three times. */
function theInitiativeAHeroActsBy(c) {
	const s = c.skills ?? {};
	return (Number(s.melee) || 0) + (Number(s.archery) || 0) + (Number(s.tactical) || 0) + (Number(s.march) || 0) * 3 + (Number(s.naval) || 0) + (Number(s.sage) || 0) + (Number(s.spy) || 0) + (Number(s.thief) || 0) + (Number(s.druid) || 0) + (Number(s.explorer) || 0) + (Number(s.white) || 0) + (Number(s.psychic) || 0) + (Number(s.illusory) || 0) + (Number(s.elemental) || 0) + (Number(s.necromancy) || 0);
}
/** The tier an order's kind acts in: 0 an order that stays put, 1 Move and Encounter, 2 Defend. */
function theTierAnOrderActsIn(d) {
	return d === "defend" ? 2 : d === "move" || d === "pursue" || d === "encounter" ? 1 : 0;
}
/** Which of two heroes acts first in a phase: below zero the first, above zero the second (a sort's comparator). */
function whichOfTwoHeroesActsFirstInAPhase(a, b) {
	const at = theTierAnOrderActsIn(a.action), bt = theTierAnOrderActsIn(b.action);
	if (at !== bt) return at - bt;
	const d = theInitiativeAHeroActsBy(b) - theInitiativeAHeroActsBy(a);
	if (d !== 0) return d;
	return a.id - b.id;
}
function theHeroesWhoMustActFirstInAPhase(intents) {
	const edges = [];
	const list = [...intents.values()];
	const byId = (id) => intents.get(id);
	list.forEach((it) => {
		const { order, action } = it;
		if (!order) return;
		const tgtId = parseInt(order.target);
		const tgt = isNaN(tgtId) ? null : byId(tgtId);
		const tgtArrivingHere = (t) => !!t && t.action === "move" && t.toId === it.fromId;
		const _rcp = action === "give_item" || action === "leave_army" ? (() => {
			const r = it.theHeroHisOrderHandsTo;
			return r !== null ? byId(r) : null;
		})() : null;
		if (_rcp?.player === it.player && _rcp.id !== it.id && !tgtArrivingHere(_rcp)) edges.push([it.id, _rcp.id]);
		if (action === "cast_spell") {
			const spellTargetId = parseInt(order.extra);
			const st = isNaN(spellTargetId) ? null : byId(spellTargetId);
			if (st?.player === it.player && st.id !== it.id && !tgtArrivingHere(st)) edges.push([it.id, st.id]);
		}
		if (action === "pickup_army") list.forEach((other) => {
			if (other.id === it.id || other.player !== it.player) return;
			if (other.action !== "leave_army") return;
			if (other.fromId !== it.fromId) return;
			edges.push([other.id, it.id]);
		});
		const itsDest = it.toId;
		if (action === "move" && itsDest !== null) list.forEach((other) => {
			if (other.id === it.id || other.player !== it.player) return;
			if (other.fromId !== itsDest) return;
			if (other.action !== "give_item" && other.action !== "leave_army") return;
			if (other.theHeroHisOrderHandsTo !== it.id) return;
			edges.push([it.id, other.id]);
		});
		if ((action === "pursue" || action === "encounter") && tgt && tgt.id !== it.id) edges.push([tgt.id, it.id]);
		if (it.theHeroHePursues !== null) {
			const pt = byId(it.theHeroHePursues);
			if (pt && pt.id !== it.id) edges.push([pt.id, it.id]);
		}
	});
	return edges;
}
/** The order the heroes act in a phase: the heroes who act (each once), and who must act before whom. */
function theOrderTheHeroesActInAPhase(heroes, dependencies) {
	const cmp = whichOfTwoHeroesActsFirstInAPhase;
	const nodes = [...heroes].sort(cmp);
	const actors = new Set(heroes.map((c) => c.id));
	const edges = dependencies.filter(([u, v]) => actors.has(u) && actors.has(v) && u !== v);
	const indeg = new Map(nodes.map((c) => [c.id, 0]));
	const out = new Map(nodes.map((c) => [c.id, []]));
	/** The heroes who wait for one (each actor has his list, and the edges join actors alone). */
	const theOnesWaitingFor = (id) => {
		const waiting = out.get(id);
		if (waiting === void 0) throw new TypeError(`hero ${String(id)} is none of the phase's actors`);
		return waiting;
	};
	edges.forEach(([u, v]) => {
		theOnesWaitingFor(u).push(v);
		indeg.set(v, Number(indeg.get(v)) + 1);
	});
	const ready = nodes.filter((c) => indeg.get(c.id) === 0);
	const result = [];
	const placed = /* @__PURE__ */ new Set();
	while (ready.length) {
		ready.sort(cmp);
		const c = ready.shift();
		if (c === void 0) throw new TypeError("the list of the heroes ready to act held a gap");
		if (placed.has(c.id)) continue;
		placed.add(c.id);
		result.push(c);
		theOnesWaitingFor(c.id).forEach((v) => {
			indeg.set(v, Number(indeg.get(v)) - 1);
			if (indeg.get(v) === 0) {
				const n = nodes.find((x) => x.id === v);
				if (n && !placed.has(v)) ready.push(n);
			}
		});
	}
	nodes.forEach((c) => {
		if (!placed.has(c.id)) result.push(c);
	});
	return result;
}
// src/engine/rules-on-plain-values/the-move-pools-a-column-marches-and-sails-by-and-the-pool-a-step-spends.ts
/** The pool a step from one ground into another spends: the sea pool to enter the sea, or to land from it (a coastal
*  landing: the journey is naval); the land pool from land to land. */
function theMovePoolAStepSpends(theGroundItLeaves, theGroundItEnters) {
	const enteringSea = theGroundItEnters === "sea";
	return enteringSea || theGroundItLeaves === "sea" && !enteringSea ? "sea" : "land";
}
// src/engine/rules-on-plain-values/the-share-of-a-province-an-explore-order-maps.ts
/** AK 3.2: the ground's Basic Exploration Number × (Explorer + 1), in percent of the province, capped at 100. The
*  terrain table: Plain 35, Desert 25, Forest 20, Mountain 20, Jungle 15, Sea 25 (cut 15 points from the original
*  {plain:50,desert:40,forest:35,mountain:35,jungle:30,sea:40} to slow the early land-grab), and 15 for a ground it
*  doesn't name (or none). His Explorer counts to 5. The Trailblazer minor title adds 5% (the Loremaster's old bonus is
*  gone: R-125). His realm's `explore` discoveries multiply it by their factor on this ground (Scouts & Rangers and The
*  Compass among them). Rounded down, multiplied in this order (the forecast's old order gives the same figure on
*  every share, level and factor the content holds: plan P1-11d14). */
function theShareOfAProvinceAnExploreOrderMaps(theGround, theExplorersLevel, heHoldsTheTrailblazer, theFactorHisRealmsDiscoveriesMultiplyItBy) {
	const BASIC_EXPLORE = { ...KC_BASIC_EXPLORE };
	const basicRate = (theGround == null ? 0 : BASIC_EXPLORE[theGround] ?? 0) || 15;
	const explorerSkill = Math.min(5, theExplorersLevel);
	const loreMult = heHoldsTheTrailblazer ? 1.05 : 1;
	return Math.min(100, Math.floor(basicRate * (explorerSkill + 1) * loreMult * theFactorHisRealmsDiscoveriesMultiplyItBy));
}
// src/engine/rules-on-plain-values/the-share-a-march-into-a-province-maps-and-the-coast-a-voyage-charts.ts
/** The share of a province a hero's march into it maps, on every march in (not the first alone): 10%, and 5% a level
*  of his Explorer as the turn counts it, and the share his worn items add (a Traveller's Cloak 20%), and at March 6 or
*  more 2% a company he leads. In percent; the cap is the province's (below). */
function theShareOfAProvinceAMarchIntoItMaps(theMarchersExplorerLevel, theShareHisWornItemsAdd, heHoldsMarchSixOrMore, theCompaniesHeLeads) {
	return 10 + 5 * theMarchersExplorerLevel + theShareHisWornItemsAdd + (heHoldsMarchSixOrMore ? 2 * theCompaniesHeLeads : 0);
}
/** Naval 6, charting the coast: a hero who sails into a sea at Naval 6 or more, leading ships, charts 5% of each land
*  province beside it; else he charts none (0). */
function theShareAVoyageChartsOfEachCoastBesideTheSea(theGroundHeEnters, heHoldsNavalSixOrMore, heLeadsShips) {
	return theGroundHeEnters === "sea" && heHoldsNavalSixOrMore && heLeadsShips ? 5 : 0;
}
/** The provinces beside the sea a voyage charts are its coast: those of land (not the sea's own). */
function aProvinceBesideTheSeaIsACoastAVoyageCharts(theGroundBesideIt) {
	return theGroundBesideIt !== "sea";
}
// src/engine/rules-on-plain-values/whether-a-spells-mark-must-stand-in-the-casters-province.ts
/** Whether the hero the spell named is aimed at must stand in the caster's own province, as its row in the content
*  says (`asAnOrder.itsMarkMustStandInTheProvince`): one who has left is refused before the cast roll. A spell aimed at
*  a province, Resurrect (its body's own rule), Clairvoyance (a scry from afar) and a name with no row need none. */
function theMarkOfThisSpellMustStandInTheCastersProvince(theSpellsName) {
	return Object.values(SPELL_EFFECTS_THE_REGISTRY_HOLDS).find((r) => r.name === theSpellsName)?.asAnOrder?.itsMarkMustStandInTheProvince === true;
}
// src/engine/rules-on-plain-values/what-a-marchs-order-names.ts
/** What a Move's or a Forced March's target names: `dir:<compass>` a compass step; `prov:<id>` and the bare number a
*  province, read alike (`parseInt`, so NaN for words that name none). */
function whatAMarchsOrderNames(target) {
	if (target.startsWith("dir:")) return {
		by: "compass",
		direction: target.slice(4)
	};
	return {
		by: "province",
		provinceId: parseInt(target.startsWith("prov:") ? target.slice(5) : target)
	};
}
// src/ui/player/the-order-forms-forecast-where-a-hero-stands-what-he-carries-and-leads.ts
/** A field's value as the page holds it, read for its words where the code splits or trims it, or hands it to a rule
*  that does: words (an input's or a select's value is), handed back as they are; any other value throws the TypeError
*  the old `.split`, `.trim` or `.startsWith` on it threw. */
function theWordsAFieldHolds(value) {
	if (typeof value === "string") return value;
	throw new TypeError(`an order's field holds ${typeof value}, not words`);
}
/** A field's value as `|| ''` read it: the value, or no words where it is falsy (typed as any value, as the field's is). */
function theFieldOrNoWords(value) {
	if (value) return value;
	return "";
}
/** Any value in words, as String writes it (a field's value, a hero's id as the form holds it). */
function inWords(value) {
	return String(value);
}
/** The element of `list` at `i`, a place the code has just made sure of; none throws the TypeError reading a field of
*  it threw. */
function theOneAt(list, i) {
	const one = list[i];
	if (one === void 0) throw new TypeError(`no element at ${String(i)} of a list of ${String(list.length)}`);
	return one;
}
/** The companies the replay gives `char` (it gives every hero of the report a column); none throws the TypeError
*  reading the list threw. */
function theColumnTheReplayGivesHim(armies, char) {
	const column = armies.get(char);
	if (column === void 0) throw new TypeError(`the replay gives the hero ${String(char.id)} no column`);
	return column;
}
/** The numbers the form reads of an alignment order's row (`order`, ALIGN_ACTIONS' or theAlignmentOrdersByTheNameTheFormWrites'
*  by its name), each read as it is asked: no row throws the TypeError reading its numbers threw, and a number the row
*  doesn't state, or states as words, throws a TypeError (every row the form reads states it as a number). */
function theNumbersOfTheRow(order) {
	if (order === void 0) throw new TypeError("the form reads the numbers of an alignment order it has no row of");
	const theNumber = (what) => {
		const stated = order.theNumbers[what]?.value;
		if (typeof stated !== "number") throw new TypeError(`the row of ${order.name} states no number ${what}`);
		return { value: stated };
	};
	return {
		get theWildHuntsBeasts() {
			return theNumber("theWildHuntsBeasts");
		},
		get thePriceOfWordFromAProvince() {
			return theNumber("thePriceOfWordFromAProvince");
		},
		get thePrice() {
			return theNumber("thePrice");
		}
	};
}
function theOrderField(orders, part, heroId, ph) {
	const order = orders.byHero?.[String(heroId)]?.[ph];
	return order && part in order ? { value: order[part] } : null;
}
function theRecruitBoxesOf(orders, heroId, ph) {
	const boxes = (orders.byHero?.[String(heroId)]?.[ph])?.recruit;
	if (!boxes) return null;
	return {
		dest: boxes.musterTo === null ? null : { value: boxes.musterTo },
		ticked: boxes.ticked.map((value) => ({ value }))
	};
}
var GARRISON_UNIT_TYPES_P = new Set(KC_UNIT_CLASS.garrison);
function _projRecruitUnits(report, tokens) {
	const out = [];
	const mercs = report?.mercIntel ?? [];
	const toks = (tokens ?? []).map((t) => inWords(theFieldOrNoWords(t)).trim()).filter(Boolean);
	const _picked = new Set(toks.filter((t) => t.startsWith("merc:")));
	mercs.forEach((m) => {
		if (_picked.has(`merc:${String(m.id)}`)) out.push({
			type: m.type,
			quality: (m.quality ?? "") || "Average",
			unitName: m.unitName,
			race: (m.race ?? "") || null,
			_merc: true
		});
	});
	const _known = new Set(mercs.map((m) => `merc:${String(m.id)}`));
	_picked.forEach((t) => {
		if (!_known.has(t)) out.push({
			type: "Mercenary band",
			quality: "Average",
			unitName: "a hired band",
			_merc: true
		});
	});
	toks.forEach((v) => {
		if (!v || v === "all" || v.startsWith("to:") || v.startsWith("merc:")) return;
		const bar = v.indexOf("|");
		const type = bar >= 0 ? v.slice(0, bar) : v;
		out.push({
			type,
			quality: "Average"
		});
	});
	return out;
}
var asTheReportShowsIt = (a) => a;
function theCompanyAsTheFormCarriesIt(a, withRace = true) {
	const company = {
		type: a.type,
		quality: a.quality,
		unitName: a.unitName
	};
	if (withRace) company.race = a.race;
	return {
		...company,
		skeletal: a.skeletal,
		temporary: a.temporary,
		wildHunt: a.wildHunt,
		wildHuntUntil: a.wildHuntUntil
	};
}
function theRoomHisBeastCommandLeaves(card, column) {
	return theRoomALeadersBeastCommandLeaves(effSkillP(card, "druid") | 0, column ?? [], asTheReportShowsIt);
}
function whereTheCompaniesARecruitRaisesMuster(report, orders, o, ph, ticks, destTok, columnOf) {
	const loc = whereAHeroStandsAfterTheOrdersBefore(report, orders, o.id, ph);
	const inAProvinceOfHisRealm = !!loc && (report.ownedProvinces ?? []).some((p) => p.id === loc.id);
	const theOrderNamesTheGarrison = destTok === "to:garrison" && inAProvinceOfHisRealm;
	const dest = (destTok && destTok !== "to:self" && destTok !== "to:garrison" ? (report.characters ?? []).find((x) => `to:${String(x.id)}` === destTok) : null) ?? o;
	const column = (columnOf(dest) ?? []).slice();
	const out = {
		dest,
		toTheColumn: [],
		toTheGarrison: []
	};
	_projRecruitUnits(report, ticks).forEach((u) => {
		const facts = {
			theOrderNamesTheGarrison,
			inAProvinceOfHisRealm,
			theCompany: u,
			theRoomTheColumnsBeastCommandLeaves: theRoomHisBeastCommandLeaves(dest, column)
		};
		if (u._merc && aMercenaryBandIsNotHiredIntoAFullColumn(facts)) return;
		if (whereARecruitedCompanyMusters({
			...facts,
			itIsAGarrisonCompany: GARRISON_UNIT_TYPES_P.has(u.type)
		}) === "the column") {
			column.push(u);
			out.toTheColumn.push(u);
		} else out.toTheGarrison.push(u);
	});
	return out;
}
function whereTheCompaniesAHerosRecruitRaisesMusterOnTheseOrders(report, orders, o, ph, ticks) {
	return whereTheCompaniesARecruitRaisesMuster(report ?? {}, orders, o, ph, ticks, ticks.find((t) => t.startsWith("to:")) ?? "to:self", (x) => whatAHeroLeadsAsAPhaseBegins(report, orders, x.id, ph));
}
function whatAComradeTakesOfAHandOver(report, recipient, column, handed) {
	const following = whereAHandOversRisenDeadGo(handed, theRisenDeadFollowAHandOverTo({
		alignment: recipient.alignment,
		hisRealmsAlignment: report.kingdom?.alignment
	}), asTheReportShowsIt).handed;
	return theCompaniesALeaderTakesUpToHisBeastCommandsRoom(following, theRoomHisBeastCommandLeaves(recipient, column), asTheReportShowsIt);
}
function hisMovePoolsAsTheReportGivesThem(char) {
	if (Number(char.hiredInPhase) >= 0) return null;
	const pace = (n) => typeof n === "number" && Number.isFinite(n) ? n : Infinity;
	return {
		land: pace(char.effectiveSpeed),
		sea: pace(char.effectiveSeaSpeed)
	};
}
function theRelationAMarchMeetsAtTheBorderOf(report, orders, owner) {
	if (owner === report.playerIndex) return "self";
	const known = (report.diplomacy?.known ?? []).find((k) => k?.index === owner);
	const now = (known?.relation ?? "") || "neutral";
	const declared = known && orders.declarations ? Reflect.get(Object(orders.declarations), owner) : null;
	const withoutWarning = ["Evil", "Undead"].includes(report.kingdom?.alignment);
	return declared === "enemy" && withoutWarning ? "enemy" : now;
}
function aMarchTheTurnRefuses(report, orders, char, ph, from, to) {
	const column = theColumnAHeroMarchesWithInAPhase(report, orders, char.id, ph).armies;
	if (aColumnIsTurnedBackAtANeutralRealmsBorder(report.playerIndex, to.owner, column.length, to.owner == null ? "neutral" : theRelationAMarchMeetsAtTheBorderOf(report, orders, to.owner))) return true;
	const lift = poSeaAnalysis(column, Number(char.skills?.["naval"]) || 0).cap;
	if (to.terrain === "sea") return !canEnterTerrain({ armies: column }, "sea", lift);
	if (from.terrain === "sea") return false;
	return aColumnLeadingShipsMayNotStepFromLandToLand(column.some((a) => a && PO_SEA_TYPES.has(a.type)), from.terrain, to.terrain);
}
function theStepTowardAFarProvinceTheTurnTakes(report, orders, char, ph, from, toId) {
	const worldMeta = report.worldMeta;
	if (!worldMeta) throw new TypeError("the march forecast steps over a map the report gives none of");
	const column = theColumnAHeroMarchesWithInAPhase(report, orders, char.id, ph).armies;
	const seaCap = poSeaAnalysis(column, Number(char.skills?.["naval"]) || 0).cap;
	const leadsShips = column.some((a) => a && PO_SEA_TYPES.has(a.type));
	const route = (extraFilter) => theFirstStepOfAShortestRouteAColumnMayTake({ armies: column }, seaCap, leadsShips, worldMeta, from, toId, extraFilter);
	const known = (owner) => (report.diplomacy?.known ?? []).find((k) => k?.index === owner);
	const anArmedGuardIsSeen = (p) => (p.characters ?? []).some((x) => x?.isWanderer && x.isNeutralGuard && x.armyBand && x.armyBand !== "no armies");
	const isSafePassage = (p) => aProvinceIsSafePassageForARealmsColumn(report.playerIndex, p.owner, () => (known(p.owner)?.relation ?? "") || "neutral", () => anArmedGuardIsSeen(p));
	return theStepAColumnTakesTowardAFarProvince(route, toId, true, isSafePassage);
}
var theForecastsReport = null;
var theForecastsAnswers = /* @__PURE__ */ new Map();
function whatTheForecastOfThePhasesBeforeReads(report, orders, upToPhaseExclusive) {
	const parts = [orders.declarations ? JSON.stringify(orders.declarations) : ""];
	const value = (part, heroId, ph) => {
		const el = theOrderField(orders, part, heroId, ph);
		return el ? inWords(el.value ?? "") : "";
	};
	(report.characters ?? []).forEach((o) => {
		for (let ph = 0; ph < upToPhaseExclusive; ph++) {
			parts.push(value("action", o.id, ph), value("target", o.id, ph), value("extra", o.id, ph));
			const wrap = theRecruitBoxesOf(orders, o.id, ph);
			if (!wrap) continue;
			const dest = wrap.dest;
			const ticked = wrap.ticked.map((x) => x.value);
			parts.push(dest ? String(dest.value) : "", ticked.join(","));
		}
	});
	return JSON.stringify(parts);
}
function whereAHeroStandsAfterTheOrdersBefore(report, orders, charId, upToPhaseExclusive) {
	if (!report) return null;
	if (theForecastsReport !== report || theForecastsAnswers.size > 5e3) {
		theForecastsReport = report;
		theForecastsAnswers.clear();
	}
	const key = `${String(charId)}|${String(upToPhaseExclusive)}|${whatTheForecastOfThePhasesBeforeReads(report, orders, upToPhaseExclusive)}`;
	const kept = theForecastsAnswers.get(key);
	if (kept !== void 0) return kept ? { ...kept } : kept;
	const answer = (() => {
		const char = (report.characters ?? []).find((c) => c.id === charId);
		if (!char) return null;
		let locId = char.locationId;
		const worldMeta = report.worldMeta;
		if (!worldMeta) return {
			id: locId,
			name: char.locationName
		};
		const pools = hisMovePoolsAsTheReportGivesThem(char);
		for (let ph = 0; ph < upToPhaseExclusive; ph++) {
			const action = theOrderField(orders, "action", charId, ph)?.value;
			if (action !== "Move" && action !== "Forced March") continue;
			const named = whatAMarchsOrderNames(theWordsAFieldHolds(theFieldOrNoWords(theOrderField(orders, "target", charId, ph)?.value)));
			const curProv = worldMeta.provinces.find((p) => p.id === locId);
			let toId = null;
			if (named.by === "province") {
				if (worldMeta.provinces.some((p) => p.id === named.provinceId)) toId = named.provinceId;
			} else if (curProv) {
				const nid = theHexNextToAProvinceInADirection(curProv, named.direction, worldMeta.cols, worldMeta.rows);
				if (nid !== null && worldMeta.provinces.some((p) => p.id === nid)) toId = nid;
			}
			if (toId === null || toId === locId) continue;
			if (!curProv) {
				locId = toId;
				continue;
			}
			const toProv = KC_HEX_DIRS.some((d) => theHexNextToAProvinceInADirection(curProv, d, worldMeta.cols, worldMeta.rows) === toId) ? worldMeta.provinces.find((p) => p.id === toId) : theStepTowardAFarProvinceTheTurnTakes(report, orders, char, ph, curProv, toId);
			if (!toProv) continue;
			const spends = pools ? theMovePoolAStepSpends(curProv.terrain, toProv.terrain) : null;
			if (spends && pools && pools[spends] <= 0) continue;
			if (aMarchTheTurnRefuses(report, orders, char, ph, curProv, toProv)) continue;
			if (spends && pools) pools[spends] -= 1;
			locId = toProv.id;
		}
		const prov = worldMeta.provinces.find((p) => p.id === locId);
		return prov ? {
			id: locId,
			name: (prov.name ?? "") || "Unknown"
		} : {
			id: locId,
			name: "Unknown"
		};
	})();
	theForecastsAnswers.set(key, answer ? { ...answer } : answer);
	return answer;
}
var PO_SEA_TYPES = new Set(KC_UNIT_CLASS.sea);
var PO_CARRIER_TYPES = new Set(KC_UNIT_CLASS.carrier);
var PO_AERIAL_TYPES = new Set(KC_UNIT_CLASS.aerial);
var PO_PROJECTED_FOOT = "__projected foot__";
var takesHalfAHullAboardOrIsYetToBeRaised = (a) => a.type === PO_PROJECTED_FOOT || takesHalfAHullAboard(a);
function poSeaAnalysis(armies, navalRaw) {
	const A = (armies ?? []).filter((a) => Boolean(a));
	const navalL8 = (navalRaw ?? 0) >= 8;
	const lift = seaLiftOfAColumn(A, navalL8, takesHalfAHullAboardOrIsYetToBeRaised);
	return {
		cap: lift.answer,
		hulls: lift.berths,
		seaBeasts: A.filter((a) => PO_SEA_TYPES.has(a.type) && !PO_CARRIER_TYPES.has(a.type)).length,
		flyers: lift.humanoidFlyers,
		aerial: A.filter((a) => PO_AERIAL_TYPES.has(a.type)).length,
		landCount: lift.landUnits,
		hullCap: lift.berthsUnderItsLeader,
		navalL8,
		lifted: lift.flyersLiftTheWholeColumn,
		allAerial: A.length > 0 && A.every((a) => PO_AERIAL_TYPES.has(a.type)),
		allSea: A.length > 0 && A.every((a) => PO_SEA_TYPES.has(a.type)),
		total: A.length,
		mustSail: lift.unitsThatMustSail,
		short: lift.unitsLeftAshore.length,
		shortNames: lift.unitsLeftAshore.map((a) => (a.unitName ?? "") || a.type)
	};
}
var PO_UNCOUNTABLE_ACTIONS = /* @__PURE__ */ new Set(["Awaken Grove", "Wild Calling"]);
var PO_UNCOUNTABLE_SPELLS = /* @__PURE__ */ new Set([
	"Control Undead",
	"Raise Wraiths",
	"Death's Dominion",
	"Phantom Host"
]);
function theColumnAHeroMarchesWithInAPhase(theReport, orders, charId, ph) {
	const report = theReport ?? {};
	const ch = (report.characters ?? []).find((x) => String(x.id) === String(charId));
	const out = {
		armies: [],
		uncounted: [],
		gained: 0,
		base: 0
	};
	if (!ch) return out;
	out.armies = whatAHeroLeadsAsAPhaseBegins(report, orders, ch.id, ph);
	out.base = (ch.armies ?? []).length;
	const sameFrom = [];
	out.sameFrom = sameFrom;
	const pod = report.provinceOrderData ?? {};
	const theUncountableActions = PO_UNCOUNTABLE_ACTIONS;
	const anUncountableAction = (act) => theUncountableActions.has(act);
	const add = (a) => {
		out.armies.push(a);
		out.gained++;
	};
	{
		const myLoc = whereAHeroStandsAfterTheOrdersBefore(report, orders, ch.id, ph);
		(report.characters ?? []).forEach((o) => {
			if (!o || o.alive === false || String(o.id) === String(ch.id)) return;
			const oAct = theFieldOrNoWords(theOrderField(orders, "action", o.id, ph)?.value);
			if (oAct !== "Recruit Armies" && oAct !== "Leave/Transfer Army") return;
			const oLoc = whereAHeroStandsAfterTheOrdersBefore(report, orders, o.id, ph);
			if (!myLoc || !oLoc || oLoc.id !== myLoc.id) return;
			const toks = String(theFieldOrNoWords(theOrderField(orders, "target", o.id, ph)?.value)).split(",").map((t) => t.trim()).filter(Boolean);
			let got = [];
			if (oAct === "Recruit Armies") {
				if (!toks.includes(`to:${String(ch.id)}`)) return;
				const musters = whereTheCompaniesARecruitRaisesMuster(report, orders, o, ph, toks, `to:${String(ch.id)}`, (x) => x === ch ? out.armies : whatAHeroLeadsAsAPhaseBegins(report, orders, x.id, ph));
				got = musters.dest === ch ? musters.toTheColumn : [];
			} else {
				const oExtra = theFieldOrNoWords(theOrderField(orders, "extra", o.id, ph)?.value);
				if (String(oExtra) !== String(ch.id)) return;
				const oArm = whatAHeroLeadsAsAPhaseBegins(report, orders, o.id, ph);
				if (toks.includes("all")) got = oArm.slice();
				else {
					const pool = oArm.slice();
					toks.forEach((val) => {
						const i = pool.findIndex((x) => ((x.unitName ?? "") || x.type) === val || x.type === val);
						if (i >= 0) got.push(...pool.splice(i, 1));
					});
				}
				got = whatAComradeTakesOfAHandOver(report, ch, out.armies, got).taken;
			}
			if (!got.length) return;
			got.forEach((u) => {
				add({
					...u,
					_projected: true
				});
			});
			sameFrom.push(`${String(got.length)} unit${got.length !== 1 ? "s" : ""} ${oAct === "Recruit Armies" ? "recruited for him" : "handed over"} by ${String(o.name)}`);
		});
	}
	for (let p = 0; p < ph; p++) {
		const act = theFieldOrNoWords(theOrderField(orders, "action", charId, p)?.value);
		if (!act) continue;
		const tgt = String(theFieldOrNoWords(theOrderField(orders, "target", charId, p)?.value)).trim();
		if (act === "Perform Rite") {
			if (tgt === "Wild Hunt") {
				const loc = whereAHeroStandsAfterTheOrdersBefore(report, orders, charId, p);
				const wt = loc ? pod[String(loc.id)]?.wildHuntType : null;
				if (wt) {
					const theBeasts = theNumbersOfTheRow(theAlignmentOrdersByTheNameTheFormWrites()["Perform Rite"]).theWildHuntsBeasts.value;
					for (let bound = 0; bound < theBeasts; bound++) add({
						type: wt,
						quality: "Veteran",
						unitName: `${wt} (bound by the Wild Hunt)`,
						_projected: true
					});
				} else out.uncounted.push("the Wild Hunt");
			} else {
				const ex = String(theFieldOrNoWords(theOrderField(orders, "extra", charId, p)?.value));
				const atThen = whatAHeroLeadsAsAPhaseBegins(report, orders, charId, p);
				const offered = theCompaniesABloodOfferingGivesAndRaises(atThen, ex, asTheReportShowsIt);
				(offered ? offered.given : []).forEach((i) => {
					const a = atThen[i];
					if (!a) return;
					const j = out.armies.findIndex((x) => ((x.unitName ?? "") || x.type) === ((a.unitName ?? "") || a.type));
					if (j >= 0) out.armies.splice(j, 1);
				});
			}
			continue;
		}
		if (act === "Harvest the Field") {
			add({
				type: PO_PROJECTED_FOOT,
				quality: "Average",
				unitName: "a grave you expect to raise this turn",
				_projected: true
			});
			continue;
		}
		if (act === "Cast Spell") {
			if (tgt === "Elemental Summon") {
				add({
					type: "Air Elemental",
					quality: "Veteran",
					unitName: "the elemental you expect to summon",
					_projected: true
				});
				continue;
			}
			if (tgt === "Skeletal Armies") {
				const lv = Math.max(0, Math.min(5, Math.round(effSkillP(ch, "necromancy") || 0)));
				const n = lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
				for (let k = 0; k < n; k++) add({
					type: PO_PROJECTED_FOOT,
					quality: "Average",
					unitName: "a grave you expect to raise this turn",
					_projected: true
				});
				continue;
			}
			if (PO_UNCOUNTABLE_SPELLS.has(tgt)) out.uncounted.push(tgt);
			continue;
		}
		if (anUncountableAction(act)) out.uncounted.push(act);
	}
	out.uncounted = [...new Set(out.uncounted)];
	return out;
}
function effSkillP(c, k) {
	const e = c?.skillEff?.[k];
	if (typeof e?.total === "number") return e.total;
	return ((c?.skills ?? {})[k] ?? 0) || 0;
}
function theFormsReplayOfThePhasesBefore(report, orders, upToPhaseExclusive) {
	const characters = report.characters ?? [];
	const items = /* @__PURE__ */ new Map();
	const byKey = /* @__PURE__ */ new Map();
	characters.forEach((x) => {
		items.set(String(x.id), [...x.items ?? []]);
		byKey.set(String(x.id), x);
	});
	let armies = /* @__PURE__ */ new Map();
	characters.forEach((x) => {
		armies.set(x, (x.armies ?? []).map((a) => theCompanyAsTheFormCarriesIt(a)));
	});
	const garrisons = /* @__PURE__ */ new Map();
	for (let p = 0; p < upToPhaseExclusive; p++) {
		theItemsAPhasesOrdersHandOver(report, orders, characters, items, byKey, p);
		const added = theCompaniesAPhasesOrdersAddToEachGarrison(report, orders, armies, p);
		const next = /* @__PURE__ */ new Map();
		const goBack = /* @__PURE__ */ new Map();
		characters.forEach((x) => {
			next.set(x, theCompaniesAHeroLeadsAfterAPhase(report, orders, armies, garrisons, added, x, p, goBack));
		});
		theGarrisonsAfterAPhase(report, orders, garrisons, added, p, goBack);
		armies = next;
	}
	return {
		items,
		armies,
		garrisons
	};
}
function theHeroesInTheOrderTheTurnHasThemActInAPhase(report, orders, characters, p) {
	const field = (part, x) => String(theFieldOrNoWords(theOrderField(orders, part, x.id, p)?.value));
	const acting = characters.filter((x) => Boolean(x && x.alive !== false && !(Number(x.hiredInPhase) >= 0 && p <= Number(x.hiredInPhase))));
	const plainIds = new Map(acting.map((x, i) => [x, typeof x.id === "number" ? x.id : 1e6 + i]));
	const thePlainIdOf = (x) => {
		const id = plainIds.get(x);
		if (id === void 0) throw new TypeError(`no plain id for the hero ${String(x.id)}`);
		return id;
	};
	const heroes = acting.map((x) => ({
		id: thePlainIdOf(x),
		action: normaliseAction({ action: field("action", x) }),
		skills: x.skills,
		hero: x
	}));
	return theOrderTheHeroesActInAPhase(heroes, theHeroesWhoMustActFirstInAPhase(new Map(heroes.map((h) => {
		const from = whereAHeroStandsAfterTheOrdersBefore(report, orders, h.hero.id, p);
		const to = h.action === "move" ? whereAHeroStandsAfterTheOrdersBefore(report, orders, h.hero.id, p + 1) : null;
		const handsTo = h.action === "give_item" || h.action === "leave_army" ? acting.find((x) => String(x.id) === field("extra", h.hero)) : null;
		return [h.id, {
			id: h.id,
			player: report.playerIndex ?? null,
			action: h.action,
			fromId: from ? from.id : null,
			toId: to && from && to.id !== from.id ? to.id : null,
			order: {
				target: field("target", h.hero),
				extra: field("extra", h.hero)
			},
			theHeroHisOrderHandsTo: handsTo ? thePlainIdOf(handsTo) : null,
			theHeroHePursues: null
		}];
	})))).map((h) => h.hero);
}
function theItemsAPhasesOrdersHandOver(report, orders, characters, items, byKey, p) {
	const theSendOrders = ["Send Item", "Give Item"];
	const sends = (x) => theSendOrders.includes(theOrderField(orders, "action", x.id, p)?.value);
	if (!characters.some(sends)) return;
	const actedBefore = /* @__PURE__ */ new Set();
	const whereHeStandsAsTheGiverActs = (x) => whereAHeroStandsAfterTheOrdersBefore(report, orders, x.id, actedBefore.has(x) ? p + 1 : p);
	theHeroesInTheOrderTheTurnHasThemActInAPhase(report, orders, characters, p).forEach((x) => {
		if (sends(x)) theItemsAHeroHandsOver(report, orders, x, items, byKey, p, whereHeStandsAsTheGiverActs);
		actedBefore.add(x);
	});
}
function theItemsAHeroHandsOver(report, orders, x, items, byKey, p, whereHeStandsAsTheGiverActs) {
	const recipKey = String(theFieldOrNoWords(theOrderField(orders, "extra", x.id, p)?.value)).trim();
	const arr = items.get(String(x.id)) ?? [];
	if (!recipKey || !items.has(recipKey)) return;
	const recipCh = byKey.get(recipKey);
	if (!recipCh) return;
	const uniq = theItemsASendItemOrderHandsOver(arr, theWordsAFieldHolds(theFieldOrNoWords(theOrderField(orders, "target", x.id, p)?.value)).trim()).places;
	const _same = whereAHeroStandsAfterTheOrdersBefore(report, orders, x.id, p)?.id === whereHeStandsAsTheGiverActs(recipCh)?.id;
	uniq.forEach((i) => {
		const [it] = arr.splice(i, 1);
		if (_same) (items.get(recipKey) ?? []).push(it);
	});
}
function theGarrisonTheReportShows(report, provId) {
	return ((report.provinceOrderData ?? {})[String(provId)]?.garrisonArmies ?? []).map((a) => theCompanyAsTheFormCarriesIt(a));
}
function theCompaniesAPhasesOrdersAddToEachGarrison(report, orders, armies, ph) {
	const added = /* @__PURE__ */ new Map();
	(report.characters ?? []).filter((x) => Boolean(x && x.alive !== false)).forEach((o) => {
		const act = theFieldOrNoWords(theOrderField(orders, "action", o.id, ph)?.value);
		if (act !== "Leave/Transfer Army" && act !== "Recruit Armies") return;
		const tgt = theFieldOrNoWords(theOrderField(orders, "target", o.id, ph)?.value);
		const loc = whereAHeroStandsAfterTheOrdersBefore(report, orders, o.id, ph);
		if (!loc) return;
		const units = [];
		if (act === "Leave/Transfer Army") {
			const extra = theOrderField(orders, "extra", o.id, ph)?.value;
			if (extra !== "" && extra != null && inWords(extra) !== "-1") return;
			const led = theCompaniesTheReplayGivesTheHeroOfId(report, armies, o.id);
			if (theWordsAFieldHolds(tgt).split(",").map((t) => t.trim()).includes("all")) led.forEach((a) => units.push(a));
			else {
				const pool = led.slice();
				theWordsAFieldHolds(tgt).split(",").map((t) => t.trim()).filter(Boolean).forEach((val) => {
					const i = pool.findIndex((a) => a.type === val || a.unitName === val);
					if (i >= 0) units.push(...pool.splice(i, 1));
				});
			}
		} else {
			const wrap = theRecruitBoxesOf(orders, o.id, ph);
			if (!wrap) return;
			const destSel = wrap.dest;
			whereTheCompaniesARecruitRaisesMuster(report, orders, o, ph, wrap.ticked.map((cb) => theFieldOrNoWords(cb.value)), destSel ? destSel.value : "to:self", (x) => armies.get(x)).toTheGarrison.forEach((u) => units.push(u));
		}
		const here = added.get(loc.id) ?? [];
		added.set(loc.id, here);
		here.push({
			hero: o,
			units
		});
	});
	return added;
}
function theGarrisonAPickUpOfThePhaseSees(report, garrisons, added, provId, excludeCharId) {
	const garr = (garrisons.get(provId) ?? theGarrisonTheReportShows(report, provId)).slice();
	(added.get(provId) ?? []).forEach((by) => {
		if (String(by.hero.id) === String(excludeCharId)) return;
		by.units.forEach((a) => garr.push(a));
	});
	return garr;
}
function theGarrisonsAfterAPhase(report, orders, garrisons, added, ph, goBack) {
	const garrisonOf = (provId) => {
		const held = garrisons.get(provId) ?? theGarrisonTheReportShows(report, provId);
		garrisons.set(provId, held);
		return held;
	};
	added.forEach((bys, provId) => {
		const garr = garrisonOf(provId);
		bys.forEach((by) => {
			by.units.forEach((a) => garr.push(a));
		});
	});
	(report.characters ?? []).filter((x) => Boolean(x && x.alive !== false)).forEach((o) => {
		if (theFieldOrNoWords(theOrderField(orders, "action", o.id, ph)?.value) !== "Pick Up Army") return;
		const loc = whereAHeroStandsAfterTheOrdersBefore(report, orders, o.id, ph);
		if (!loc) return;
		const tgt = theFieldOrNoWords(theOrderField(orders, "target", o.id, ph)?.value);
		const garr = garrisonOf(loc.id);
		theGarrisonPlacesAPickUpTakes(String(tgt), garr.length).forEach((i) => garr.splice(i, 1));
	});
	goBack.forEach((beasts, provId) => {
		const garr = garrisonOf(provId);
		beasts.forEach((a) => garr.push(a));
	});
}
function theCompaniesAHeroLeadsAfterAPhase(report, orders, armies, garrisons, added, char, prevPh, goBack) {
	const charId = char.id;
	let led = (armies.get(char) ?? []).slice();
	const prevAction = theFieldOrNoWords(theOrderField(orders, "action", charId, prevPh)?.value);
	const prevTarget = theFieldOrNoWords(theOrderField(orders, "target", charId, prevPh)?.value);
	(report.characters ?? []).forEach((o) => {
		if (o.id === charId) return;
		const oAct = theFieldOrNoWords(theOrderField(orders, "action", o.id, prevPh)?.value);
		const oTgt = theFieldOrNoWords(theOrderField(orders, "target", o.id, prevPh)?.value);
		if (oAct === "Recruit Armies") {
			const toks = theWordsAFieldHolds(oTgt).split(",").map((t) => t.trim());
			const musters = whereTheCompaniesARecruitRaisesMuster(report, orders, o, prevPh, toks, toks.find((t) => t.startsWith("to:")) ?? "to:self", (x) => armies.get(x));
			if (musters.dest === char) musters.toTheColumn.forEach((u) => led.push(u));
		} else if (oAct === "Leave/Transfer Army") {
			const oExtra = theFieldOrNoWords(theOrderField(orders, "extra", o.id, prevPh)?.value);
			if (String(oExtra) !== String(charId)) return;
			const oArm = theCompaniesTheReplayGivesTheHeroOfId(report, armies, o.id);
			const handed = [];
			if (theWordsAFieldHolds(oTgt).split(",").includes("all")) oArm.forEach((a) => handed.push(a));
			else theWordsAFieldHolds(oTgt).split(",").filter(Boolean).forEach((val) => {
				val = val.trim();
				const a = oArm.find((x) => ((x.unitName ?? "") || x.type) === val);
				if (a) handed.push(a);
			});
			whatAComradeTakesOfAHandOver(report, char, armies.get(char), handed).taken.forEach((a) => led.push(a));
		}
	});
	if (prevAction === "Recruit Armies") {
		const wrap = theRecruitBoxesOf(orders, charId, prevPh);
		if (wrap) {
			const destSel = wrap.dest;
			const musters = whereTheCompaniesARecruitRaisesMuster(report, orders, char, prevPh, wrap.ticked.map((cb) => theFieldOrNoWords(cb.value)), destSel ? destSel.value : "to:self", (x) => armies.get(x));
			if (musters.dest === char) musters.toTheColumn.forEach((u) => led.push(u));
		}
	} else if (prevAction === "Pick Up Army") {
		const ploc = whereAHeroStandsAfterTheOrdersBefore(report, orders, charId, prevPh);
		const pgarr = ploc ? theGarrisonAPickUpOfThePhaseSees(report, garrisons, added, ploc.id, charId) : [];
		const { taken, left } = theCompaniesALeaderTakesUpToHisBeastCommandsRoom(theGarrisonPlacesAPickUpTakes(String(prevTarget), pgarr.length).map((i) => theCompanyAsTheFormCarriesIt(theOneAt(pgarr, i), false)), theRoomHisBeastCommandLeaves(char, led), asTheReportShowsIt);
		taken.forEach((a) => led.push(a));
		if (left.length && ploc) goBack.set(ploc.id, [...goBack.get(ploc.id) ?? [], ...left]);
	} else if (prevAction === "Leave/Transfer Army" || prevAction === "Disband Army") {
		let removed = [];
		if (prevTarget === "all") {
			removed = led;
			led = [];
		} else theWordsAFieldHolds(prevTarget).split(",").filter(Boolean).forEach((val) => {
			val = val.trim();
			const idx = led.findIndex((a) => ((a.unitName ?? "") || a.type) === val);
			if (idx >= 0) removed.push(...led.splice(idx, 1));
		});
		const extra = prevAction === "Leave/Transfer Army" ? theOrderField(orders, "extra", charId, prevPh)?.value : "";
		const recipient = extra !== "" && extra != null && inWords(extra) !== "-1" ? (report.characters ?? []).find((x) => String(x.id) === inWords(extra)) : null;
		if (recipient) whatAComradeTakesOfAHandOver(report, recipient, armies.get(recipient), removed).left.forEach((a) => led.push(a));
	}
	return led;
}
function theCompaniesTheReplayGivesTheHeroOfId(report, armies, charId) {
	const char = (report.characters ?? []).find((x) => x.id === charId);
	return char ? theColumnTheReplayGivesHim(armies, char) : [];
}
function whatAHeroCarriesAsAPhaseBegins(report, orders, charId, upToPhaseExclusive) {
	if (!report) return [];
	return theFormsReplayOfThePhasesBefore(report, orders, upToPhaseExclusive).items.get(String(charId)) ?? [];
}
function whatAGarrisonHoldsAsAPhaseBegins(theReport, orders, provId, phase, includeSamePhase, excludeCharId) {
	const report = theReport ?? {};
	const replay = theFormsReplayOfThePhasesBefore(report, orders, phase);
	if (!includeSamePhase) return (replay.garrisons.get(provId) ?? theGarrisonTheReportShows(report, provId)).slice();
	const added = theCompaniesAPhasesOrdersAddToEachGarrison(report, orders, replay.armies, phase);
	return theGarrisonAPickUpOfThePhaseSees(report, replay.garrisons, added, provId, excludeCharId);
}
function whatAHeroLeadsAsAPhaseBegins(theReport, orders, charId, upToPhaseExclusive) {
	const report = theReport ?? {};
	const char = (report.characters ?? []).find((x) => x.id === charId);
	if (!char) return [];
	return theColumnTheReplayGivesHim(theFormsReplayOfThePhasesBefore(report, orders, upToPhaseExclusive).armies, char).slice();
}
// src/ui/player/the-order-forms-ledger-practice-note-order-list-and-magic-levels-on-the-orders-handed-them.ts
/** The province `id`'s part of the report's order data (by its id as words, as an object's key is read). */
function theOrderDataOfAProvince(rep, id) {
	return (rep.provinceOrderData ?? {})[String(id)];
}
/** The hero a Recruit's companies muster to (the forecasts' hero), read with the titles the ledger reads of him. */
function theHeroAsTheLedgerReadsHim(hero) {
	return hero;
}
var SKILL_LABELS = { ...KC_SKILL_LABELS };
var RUMOUR_COST_BY_POWER_P = { ...KC_RUMOUR_COST_BY_POWER };
var ACTIONS = [
	"Move",
	"Explore",
	"Search Lair",
	"Hunting Rumours",
	"Recruit Armies",
	"Hire Hero",
	"Release Hero",
	"Encounter Character",
	"Steal",
	"Disband Army",
	"Leave/Transfer Army",
	"Pick Up Army",
	"Send Item",
	"Cast Spell",
	"Use Item",
	"Equip Items",
	"Spy",
	"Practice Skill",
	"Research",
	theNameTheFormWritesOfTheAlignmentOrder("perform-rite"),
	theNameTheFormWritesOfTheAlignmentOrder("consecrate"),
	theNameTheFormWritesOfTheAlignmentOrder("call-to-arms"),
	theNameTheFormWritesOfTheAlignmentOrder("broker"),
	theNameTheFormWritesOfTheAlignmentOrder("harvest-the-field"),
	"Sabotage",
	"Forced March",
	"Grand Heist",
	"Awaken Grove",
	"Chart the Unknown",
	"Discover Lost Ruin",
	"Blockade",
	"Research Breakthrough",
	"Assassinate",
	"Vanish",
	"Challenge",
	"Rampage",
	"Rain of Arrows",
	"Sniper's Mark",
	"Feigned Retreat",
	"Grand Stratagem",
	"Lightning Advance",
	"Raid the Coast",
	"Wild Calling",
	"Grand Design",
	"Defend",
	"Rest"
];
var ALIGN_ACTIONS = theAlignmentOrdersByTheNameTheFormWrites();
function gdAlreadyBuiltP(report) {
	return ((report ?? {}).discoveries ?? []).some((d) => d?.id === "gd");
}
var rawSkillLvl = (charObj, sk) => {
	return ((charObj?.skills ?? {})[sk] ?? 0) || 0;
};
var skillsUnseenP = (c) => c ? Boolean(c._hiddenSkills) || Boolean(c._unknownSkills) : false;
var ACTION_DISPLAY_ORDER = [
	"Broker",
	"Consecrate",
	"Call to Arms",
	"Perform Rite",
	"Harvest the Field",
	"Sabotage",
	"Forced March",
	"Grand Heist",
	"Awaken Grove",
	"Chart the Unknown",
	"Discover Lost Ruin",
	"Blockade",
	"Research Breakthrough",
	"Assassinate",
	"Vanish",
	"Challenge",
	"Rampage",
	"Rain of Arrows",
	"Sniper's Mark",
	"Feigned Retreat",
	"Grand Stratagem",
	"Lightning Advance",
	"Raid the Coast",
	"Wild Calling",
	"Grand Design",
	"Move",
	"Practice Skill",
	"Research",
	"Cast Spell",
	"Explore",
	"Search Lair",
	"Hunting Rumours",
	"Recruit Armies",
	"Pick Up Army",
	"Leave/Transfer Army",
	"Disband Army",
	"Hire Hero",
	"Release Hero",
	"Defend",
	"Encounter Character",
	"Spy",
	"Send Item",
	"Use Item",
	"Equip Items",
	"Steal",
	"Rest"
];
var _actionRank = (a) => {
	const i = ACTION_DISPLAY_ORDER.indexOf(a);
	return i < 0 ? ACTION_DISPLAY_ORDER.length : i;
};
function theOrdersTheFormOffersAHero(report, c) {
	const align = report?.kingdom?.alignment;
	return ACTIONS.filter((a) => {
		const itsRow = ALIGN_ACTIONS[a];
		const itsMastery = L79_ORDERS[a];
		if (itsRow && !aRealmOfThisCreedMayGiveTheAlignmentOrder(itsRow, align)) return false;
		if (itsRow && !aHeroMayGiveTheAlignmentOrderAsKingOrNot(itsRow, c?.isKing)) return false;
		if (itsMastery && skillsUnseenP(c)) return false;
		if (a === "Grand Design" && gdAlreadyBuiltP(report)) return false;
		if (itsMastery && !skillsUnseenP(c) && rawSkillLvl(c, itsMastery.skill) < itsMastery.lvl) return false;
		if (a === "Research" && !skillsUnseenP(c) && rawSkillLvl(c, "sage") < 1) return false;
		if (a === "Steal" && !skillsUnseenP(c) && effSkillP(c, "thief") < 1) return false;
		if (a === "Release Hero" && c?.isKing) return false;
		if (c?._hiddenSkills && (a === "Send Item" || a === "Give Item" || a === "Use Item" || a === "Release Hero")) return false;
		if (c?._charmEnemy && (itsMastery || itsRow || a === "Disband Army")) return false;
		return true;
	}).sort((a, b) => _actionRank(a) - _actionRank(b));
}
function heroHireWageOfP(h, report) {
	if (h && Object.prototype.hasOwnProperty.call(h, "hireWage")) return h.hireWage;
	return heroHireWage((report?.kingdom?.alignment ?? "") || "Neutral", h?.alignment ?? "");
}
function theTreasuryLedgerOnTheseOrders(report, orders) {
	const rep = report ?? {};
	const k = rep.kingdom ?? {};
	const P = rep.orderPrices ?? {};
	const wageOf = (t) => {
		const theWage = P.unitWage?.[t];
		const theCosts = P.unitCost ?? {};
		return theWage ?? ((theCosts[t] ?? 0) || 2);
	};
	const mk = () => ({
		g: 0,
		n: 0,
		wage: 0
	});
	const cats = {
		armies: mk(),
		mercs: mk(),
		heroes: mk(),
		intel: mk(),
		other: mk()
	};
	const notes = /* @__PURE__ */ new Set();
	const heroesAvail = Object.values(rep.provinceOrderData ?? {}).flatMap((pd) => pd?.availableHeroes ?? []);
	const hired = /* @__PURE__ */ new Set(), mercsTaken = /* @__PURE__ */ new Set();
	const theirSavings = /* @__PURE__ */ new Map();
	const itsRoom = (x) => x.theRoomLeftUnderItsCap ?? void 0;
	const upkeepCuts = Array.isArray(k.theUpkeepDiscoveriesCutsAndTheirRoom) ? k.theUpkeepDiscoveriesCutsAndTheirRoom : null;
	const theUpkeepCutsOn = (type) => {
		if (!upkeepCuts) throw new TypeError("the ledger asks the upkeep cuts of a report that gives none");
		return upkeepCuts.map((x) => {
			const g = (x.theGoldItCutsFromAUnitOfEachType ?? {})[type];
			return [x, g == null ? null : {
				theGold: g,
				itsOwnCeiling: itsRoom(x)
			}];
		});
	};
	const theHeroWageCutsOn = (alignment) => (k.theHeroWageDiscoveriesCutsAndTheirRoom ?? []).map((x) => {
		const g = (x.theGoldItCutsFromAHeroOfEachAlignment ?? {})[String(alignment)];
		return [x, g == null ? null : {
			theGold: g,
			itsOwnCeiling: itsRoom(x)
		}];
	});
	const theHeroWageCeilings = (k.theHeroWageDiscoveriesCeilingsAndTheirRoom ?? []).map((x) => [x, {
		theWagesCeiling: x.theWagesCeiling,
		itsOwnCeiling: itsRoom(x)
	}]);
	const hireHero = (hidHanded) => {
		const hid = inWords(hidHanded);
		if (!/^\d+$/.test(hid) || hired.has(hid)) return;
		const h = heroesAvail.find((x) => String(x.id) === hid);
		if (!h) return;
		const w = heroHireWageOfP(h, rep);
		if (w == null) return;
		hired.add(hid);
		cats.heroes.g += w;
		cats.heroes.n++;
		cats.heroes.wage += aHerosWageAfterTheCutsAndTheCeilings((x) => aWageAfterEachCut(theHeroWageCutsOn(h.alignment), x, theirSavings, null), (x) => aWageUnderEachCeiling(theHeroWageCeilings, x, theirSavings, null), w);
	};
	(rep.characters ?? []).filter((c) => Boolean(c && c.alive !== false)).forEach((c) => {
		for (let ph = 0; ph < 5; ph++) {
			const act = theFieldOrNoWords(theOrderField(orders, "action", c.id, ph)?.value);
			if (!act) continue;
			const tgt = inWords(theFieldOrNoWords(theOrderField(orders, "target", c.id, ph)?.value));
			if (act === "Recruit Armies") {
				const loc = whereAHeroStandsAfterTheOrdersBefore(report, orders, c.id, ph);
				const pd = loc ? theOrderDataOfAProvince(rep, loc.id) : null;
				const ticks = tgt.split(",").map((x) => x.trim()).filter(Boolean);
				const musters = whereTheCompaniesAHerosRecruitRaisesMusterOnTheseOrders(report, orders, c, ph, ticks);
				const leader = theHeroAsTheLedgerReadsHim(musters.dest);
				const hisBeastsPayHalfWages = aLeadersBeastsPayHalfWages(rawSkillLvl(leader, "druid") >= 6, () => !!k.itsDruidicWonderHalvesItsBeastsWages);
				const heIsTheHostLeader = (leader.minorHeld ?? []).some((t) => t?.key === "hostleader");
				const theWageOf = (type, joinsTheColumn) => {
					const halved = joinsTheColumn && hisBeastsPayHalfWages && aCompanyIsABeastADruidHalves(type);
					const raw = ((P.unitCost ?? {})[type] ?? 0) || 2;
					let w;
					if (upkeepCuts) w = aWageAfterEachCut(theUpkeepCutsOn(type), halved ? theWageABeastPaysUnderADruid(raw) : raw, theirSavings, null);
					else {
						w = wageOf(type);
						if (halved) w = Math.max(0, theWageABeastPaysUnderADruid(raw) - Math.max(0, raw - w));
					}
					return joinsTheColumn && heIsTheHostLeader ? theHostLeadersCut(w, 1).theWagesLeft : w;
				};
				const intoTheColumn = (type, unitName) => musters.toTheColumn.some((u) => u.type === type && (unitName == null || u.unitName === unitName));
				ticks.forEach((tok) => {
					if (tok.startsWith("to:")) return;
					if (tok.startsWith("merc:")) {
						if (mercsTaken.has(tok)) return;
						const m = (rep.mercIntel ?? []).find((x) => `merc:${String(x.id)}` === tok);
						if (!m) return;
						mercsTaken.add(tok);
						cats.mercs.g += (m.cost ?? 0) || 0;
						cats.mercs.n++;
						cats.mercs.wage += theWageOf(m.type, intoTheColumn(m.type, m.unitName));
						return;
					}
					const [first, q] = tok.split("|");
					const type = String(first);
					const n = Math.max(1, parseInt(String(q)) || 1);
					const at = (pd?.armyTypes ?? []).find((a) => a.type === type);
					const theCosts = P.unitCost ?? {};
					let cost = at?.cost ?? ((theCosts[type] ?? 0) || 2);
					if (rawSkillLvl(c, "druid") >= 6 && aCompanyIsABeastADruidHalves(type)) cost = thePriceADruidPaysForABeast(cost);
					cats.armies.g += cost * n;
					cats.armies.n += n;
					for (let i = 0; i < n; i++) cats.armies.wage += theWageOf(type, intoTheColumn(type));
				});
			} else if (act === "Hire Hero") hireHero(tgt);
			else if (act === "Broker") {
				if (tgt.startsWith("hire:")) hireHero(tgt.slice(5));
				else if (tgt.startsWith("spy:")) {
					cats.intel.g += P.brokerSpy ?? theNumbersOfTheRow(ALIGN_ACTIONS["Broker"]).thePriceOfWordFromAProvince.value;
					cats.intel.n++;
				}
			} else if (act === "Harvest the Field") {
				cats.armies.g += P.harvest ?? theNumbersOfTheRow(ALIGN_ACTIONS["Harvest the Field"]).thePrice.value;
				cats.armies.n++;
				cats.armies.wage += 1;
			} else if (act === "Perform Rite" && /^wild/i.test(tgt)) {
				const loc = whereAHeroStandsAfterTheOrdersBefore(report, orders, c.id, ph);
				const pd = loc ? theOrderDataOfAProvince(rep, loc.id) : null;
				if (pd?.wildHuntCost != null) {
					cats.other.g += pd.wildHuntCost;
					cats.other.n++;
				}
			} else if (act === "Hunting Rumours") {
				const loc = whereAHeroStandsAfterTheOrdersBefore(report, orders, c.id, ph);
				const feats = (((loc ? theOrderDataOfAProvince(rep, loc.id) : null) ?? theOrderDataOfAProvince(rep, c.locationId) ?? null)?.features ?? []).filter((f) => !f.ritualSite && f.monster);
				const theCostByPower = RUMOUR_COST_BY_POWER_P;
				tgt.split(",").map((x) => x.trim()).filter(Boolean).forEach((ix) => {
					const f = feats.find((x) => String(x.idx) === ix);
					if (!f) return;
					cats.intel.g += (theCostByPower[String(f.monsterPower)] ?? 0) || 1;
					cats.intel.n++;
				});
			}
		}
	});
	const spend = Object.values(cats).reduce((s, x) => s + x.g, 0);
	const newWages = Object.values(cats).reduce((s, x) => s + x.wage, 0);
	const gold = (k.gold ?? 0) || 0, tax = (k.taxIncome ?? 0) || 0;
	const armyW = k.nextArmyWages ?? ((k.armyWages ?? 0) || 0), heroW = k.nextHeroWages ?? ((k.heroWages ?? 0) || 0);
	return {
		gold,
		spend,
		left: gold - spend,
		tax,
		armyW,
		heroW,
		newWages,
		cats,
		notes: [...notes],
		projected: gold - spend + tax - armyW - heroW - newWages
	};
}
function chanceLine(txt, tone) {
	return kcHtml`<div style="font-size:.72rem;color:${tone === "bad" ? "var(--crimson)" : tone === "sure" ? "#2d6a2d" : "var(--forest)"};margin-top:2px">🎲 ${txt}</div>`;
}
function theNoteUnderAnOrderThatQuotesItsChance(report, orders, c, action, ph) {
	const oc = c?.orderChance ?? null;
	if (!c || !oc) return "";
	const pct = (n) => kcHtml`<strong>${Math.max(0, Math.min(100, dispFloor(n)))}%</strong>`;
	switch (action) {
		case "Spy": {
			const o = oc.spy ?? {};
			if (o.auto) return chanceLine(kcHtml`Success is <strong>certain</strong> — ${(o.autoWhy ?? "") || "your craft"} never fails. Only an enemy's counter-espionage could trouble it.`, "sure");
			if (!o.level) return chanceLine(kcHtml`No Spy skill — ${pct((o.chance ?? 0) || 20)} at best. Espionage rewards training.`, "bad");
			return chanceLine(kcHtml`Success: ${pct(o.chance)} (Spy ${o.level}). A realm with Cipher Scripts is up to 25% harder to spy on.`);
		}
		case "Research": {
			const o = oc.research ?? {};
			if (((o.rawLevel ?? 0) || 0) < 1) return chanceLine("Research needs Sage 1+ — without it the archives yield nothing.", "bad");
			return chanceLine(kcHtml`Discovery: ${pct(o.chance)} (Sage ${o.level}). A failed search still passes the season; nothing else is lost. Each failed Research this turn makes the hero's next one ×1.2 likelier (a discovery resets it).`);
		}
		case "Assassinate": {
			const o = oc.assassinate ?? {};
			return chanceLine(kcHtml`Success: ${pct(o.chance)} (Spy ${o.level}) — but only ${pct(Math.max(0, Number(o.chance) - ((o.kingPenalty ?? 0) || 25)))} against a king, who is heavily guarded. Failure is noticed.`);
		}
		case "Steal": {
			const o = oc.steal ?? {};
			return chanceLine(kcHtml`Success: ${pct(o.chance)} (Thief ${o.level}), halved if the target leads troops or the paymaster is guarded. Fail and you are seen unless you slip away (${pct(o.escape)}).`);
		}
		case "Grand Heist": {
			const o = oc.grandHeist ?? {};
			return chanceLine(kcHtml`Success: ${pct(o.chance)} (Thief ${o.level}), halved if the vaults are guarded — a garrison, or an enemy commander here with troops. Fail and you are seen unless you slip away (${pct(o.escape)}).`);
		}
		case "Blockade": return chanceLine(kcHtml`The blockade forms ${pct((oc.blockade?.chance ?? 0) || 50)} of the time — wind and tide decide the rest.`);
		case "Practice Skill": {
			const o = oc.practice ?? {};
			const by = o.byLevel ?? [
				25,
				20,
				15,
				10,
				5
			];
			const _pick = KC_SKILLS.indexOf(theFieldOrNoWords(theOrderField(orders, "target", c.id, ph)?.value));
			const sel = _pick >= 0 ? KC_SKILLS[_pick] : "";
			const hisLevels = c.skills ?? {};
			const lvl = sel ? (hisLevels[sel] ?? 0) || 0 : null;
			const scale = `Chance falls as mastery grows: ${by.map((v, i) => `${String(v)}% at ${String(i)}`).join(", ")}.`;
			const extra = `Practising alongside someone of equal level adds half again; anyone of HIGHER level teaches you, and the lesson cannot fail. A run of failures makes the next attempt likelier.`;
			if (lvl == null) return chanceLine(`${scale} ${extra}`);
			const label = (SKILL_LABELS[String(sel)] ?? "") || sel;
			if (aSkillAtThisLevelIsPractisedNoFurther(lvl)) return chanceLine(kcHtml`No roll is made: practice raises a skill only to level 5, and ${label} is at ${lvl}. Higher levels come only from experience in the field.`);
			const discoveries = ((o.astro ?? 0) || 0) + ((o.discovery ?? 0) || 0) + (o.bySkill ? (o.bySkill[String(sel)] ?? 0) || 0 : 0);
			const quick = c.race === "Human" && report?.kingdom?.race === "Human";
			return chanceLine(kcHtml`Improvement: ${pct(theChanceAHeroPractisingAloneRaisesHisSkill(lvl, discoveries / 100, 0, quick) * 100)} at ${label} ${lvl}.${quick ? " A Human of a Human realm learns half as fast again (×1.5)." : ""} ${extra}`);
		}
		default: return "";
	}
}
var rawMagicLvl = (charObj, school) => {
	return ((charObj?.skills ?? {})[school] ?? 0) || 0;
};
function effMagicLvl(charObj, school) {
	const trained = ((charObj?.skills ?? {})[school] ?? 0) || 0;
	const eff = charObj?.skillEff?.[school];
	return theLevelAHerosSkillCountsAt(school, trained, (eff?.items ?? 0) || 0, (eff?.aura ?? 0) || 0, 0);
}
function theMagicLevelsAHerosPractisesBeforeAPhaseMayRaise(orders, c, ph) {
	const hisId = () => {
		if (!c) throw new TypeError("the magic levels read the orders of no hero");
		return c.id;
	};
	const theSchools = KC_MAGIC_SCHOOLS;
	const aSchoolOfMagic = (t) => theSchools.includes(t);
	const practice = {};
	for (let prevPh = 0; prevPh < ph; prevPh++) {
		if (theFieldOrNoWords(theOrderField(orders, "action", hisId(), prevPh)?.value) !== "Practice Skill") continue;
		const t = theFieldOrNoWords(theOrderField(orders, "target", hisId(), prevPh)?.value);
		if (t && aSchoolOfMagic(t)) practice[t] = (practice[t] ?? 0) + 1;
	}
	const projected = {}, trained = {};
	KC_MAGIC_SCHOOLS.forEach((school) => {
		const raw = rawMagicLvl(c, school), n = practice[school] ?? 0;
		const rawProj = raw >= 5 ? raw : Math.min(5, raw + n);
		trained[school] = rawProj;
		projected[school] = effMagicLvl({
			...c,
			skills: {
				...c?.skills,
				[school]: rawProj
			}
		}, school);
	});
	return {
		practising: new Set(Object.keys(practice)),
		projected,
		practice,
		trained
	};
}
// src/ui/player/items-and-heroes.ts
/** The slots' caps, labels and the tiers' names and colours, read by any slot or tier. */
var theSlotCaps = { ...KC_ITEM_SLOT_CAP };
var theWondersByAlignment = { ...KC_GRAND_DESIGNS };
var theSkillsNames$6 = SKILL_LABELS;
/** A pair's leads, as `p.options` the filter made sure is a list. */
function theLeadsOf$1(p) {
	const options = p.options;
	if (!options) throw new TypeError("a pair of leads' options are not a list");
	return options;
}
var ITEM_SLOT_CAP_P = { ...KC_ITEM_SLOT_CAP };
var GUARD_POWER_COLORS_P = {
	Weak: "#4a8a4a",
	Moderate: "#c8922a",
	Powerful: "#8a1c1c",
	Legendary: "#5a0a9a"
};
var ITEM_SLOT_LABEL_P = {
	weapon: "Weapon",
	armour: "Armour",
	shield: "Shield",
	cloak: "Cloak / clothing",
	helm: "Helm / crown",
	ring: "Rings (up to two)",
	amulet: "Amulet / talisman",
	combat: "Combat Items (up to two)"
};
var ITEM_SLOT_ORDER_P = [
	"weapon",
	"armour",
	"shield",
	"cloak",
	"helm",
	"ring",
	"amulet",
	"combat"
];
function isPreOrderIdP(id) {
	return typeof id === "string" && /^(?:hired|resurrect|charm)_\d+_via_/.test(id);
}
function orderTargetCharsP(report, ph, opts) {
	return (report?.characters ?? []).filter((x) => {
		if (!x || x.alive === false) return false;
		if (isPreOrderIdP(x.id)) {
			if (ph == null) return false;
			if (ph <= (x.hiredInPhase ?? -1)) return false;
			if (x._charmEnemy && !opts?.allowCharmEnemy) return false;
		}
		return true;
	});
}
function preOrderTagP(x) {
	if (!x || !isPreOrderIdP(x.id)) return "";
	const k = String(x.id).split("_")[0];
	return k === "hired" ? " — if the hire lands" : k === "resurrect" ? " — if raised" : " — if charmed";
}
function realmOfP(playerIdx, report) {
	const rep = report ?? currentReport ?? {};
	if (playerIdx == null) return null;
	return (rep.allKingdoms ?? []).find((k) => k?.index === playerIdx) ?? null;
}
function realmNameP(playerIdx, report) {
	const k = realmOfP(playerIdx, report);
	return k ? k.name : "enemy";
}
function itemsForDisplayP(c) {
	const src = c?.items ?? [];
	const rank = (it) => {
		const sl = itemSlot(it);
		if (!!sl && it && it.equipped !== false && itemUsableBy(it, c)) {
			const i = ITEM_SLOT_ORDER_P.indexOf(sl);
			return [0, i < 0 ? 99 : i];
		}
		return [1, sl ? ITEM_SLOT_ORDER_P.indexOf(sl) : 99];
	};
	return src.map((it, i) => ({
		it,
		i,
		r: rank(it)
	})).sort((a, b) => a.r[0] - b.r[0] || a.r[1] - b.r[1] || a.i - b.i).map((x) => x.it);
}
var ITEM_TIER_NAME_P = {
	1: "Weak",
	2: "Moderate",
	3: "Powerful",
	4: "Legendary"
};
var ITEM_TIER_COLOUR_P = {
	1: "var(--stone)",
	2: "#2c4a1e",
	3: "#6a3d08",
	4: "#7a5806"
};
function itemTierTagP(it) {
	const n = (it?.tier ?? 0) || 1;
	const theColours = ITEM_TIER_COLOUR_P;
	const theNames = ITEM_TIER_NAME_P;
	const leg = n === 4;
	return kcHtml`<span style="color:${theColours[n]};font-weight:${leg ? 700 : 600};font-size:.9em">${leg ? " ✨ Legendary" : " · " + String(theNames[n])}</span>`;
}
function itemBoundTag(it, c) {
	if (!it || !it.race && !it.alignment) return "";
	const who = it.race ? `${String(itemRaceOf(it))} characters` : `${String(it.alignment)} characters`;
	return itemUsableBy(it, c) ? "" : kcHtml` <span style="color:#7a1010;font-size:.72rem">[${who} only — unusable by this character]</span>`;
}
function itemSlotTag(it, c) {
	const sl = itemSlot(it);
	if (!sl) return kcHtml` <span style="color:#2a2419;font-size:.72rem">[carried — needs no slot]</span>`;
	const cap = (theSlotCaps[sl] ?? 0) || 1;
	const theLabels = ITEM_SLOT_LABEL_P;
	const used = c ? (c.items ?? []).filter((o) => o && itemSlot(o) === sl && o.equipped !== false && itemUsableBy(o, c)).length : it.equipped === false ? 0 : 1;
	const free = Math.max(0, cap - used);
	const st = it.equipped === false ? "not equipped" : "equipped";
	return kcHtml` <span style="color:${it.equipped === false ? "#5b5b5b" : "#43350f"};font-size:.72rem">[${theLabels[sl]} slot — ${st} · ${free} of ${cap} free]</span>`;
}
function updateRumourTarget(charId, ph) {
	const wrap = document.getElementById(`po-rumour-wrap-${String(charId)}-${String(ph)}`);
	const hidden = document.getElementById(`po-target-${String(charId)}-${String(ph)}`);
	if (!wrap || !(hidden instanceof HTMLInputElement)) return;
	const boxes = [...wrap.querySelectorAll("input[type=checkbox]")].filter((b) => b instanceof HTMLInputElement);
	hidden.value = boxes.filter((b) => b.checked).map((b) => b.value).join(",");
	const tot = document.getElementById(`po-rumour-total-${String(charId)}-${String(ph)}`);
	if (tot) {
		let sum = 0;
		boxes.filter((b) => b.checked).forEach((b) => {
			const m = /(\d+)g\s*$/.exec(theParentOf(b).textContent ?? "");
			if (m) sum += parseInt(String(m[1]));
		});
		const cost = tot.querySelector("strong");
		if (cost) cost.textContent = `${String(sum)}g`;
	}
}
/** A box's parent, which a box inside its list always has; none throws the TypeError reading its text threw. */
function theParentOf(b) {
	const parent = b.parentNode;
	if (parent === null) throw new TypeError("a box has no parent to read the lair's cost from");
	return parent;
}
function updateEquipTarget(charId, ph) {
	const wrap = document.getElementById(`po-equip-wrap-${String(charId)}-${String(ph)}`);
	const hidden = document.getElementById(`po-target-${String(charId)}-${String(ph)}`);
	if (!wrap || !(hidden instanceof HTMLInputElement)) return;
	const vals = [...wrap.querySelectorAll("select")].map((s) => s.value).filter(Boolean);
	hidden.value = [...new Set(vals)].join(",");
}
var SEASONS = KC_SEASONS.slice();
var DIRECTIONS = {
	NW: "North West",
	NE: "North East",
	W: "West",
	E: "East",
	SW: "South West",
	SE: "South East"
};
var GD_BY_ALIGNMENT = { ...KC_GRAND_DESIGNS };
function gdHintFor(report) {
	const al = ((report ?? currentReport ?? {}).kingdom?.alignment ?? "") || null;
	const gd = al ? theWondersByAlignment[al] : null;
	if (!gd) return theGrandDesignsHint();
	return kcHtml`Sage 9 · ONCE EVER, and only in a province you hold. Your ${al} realm raises the <strong>${gd.name}</strong> — ${gd.desc} The Wonder stands in the province it is built in: hold that ground and its blessing flows, lose the province and the blessing lapses until you take it back. The Wonder itself is never destroyed, and a conqueror gains nothing from it but the view.`;
}
var unseenSuffixP = (c) => c?._unknownSkills ? `${(c.name ?? "") || "this hero"}’s level is not known until they have joined` : `${(c?.name ?? "") || "this hero"}’s level is hidden from you`;
/** The Grand Design's hint as the orders' table writes it (the table always holds the order). */
function theGrandDesignsHint() {
	const theOrder = L79_ORDERS["Grand Design"];
	if (theOrder === void 0) throw new TypeError("the orders' table holds no Grand Design");
	return theOrder.hint;
}
globalThis.currentUser = null;
globalThis.currentProfile = null;
globalThis.joiningGame = null;
globalThis.joinSkills = {};
globalThis.currentGamePlayer = null;
globalThis.currentReport = null;
globalThis.diploChoices = {};
globalThis.reckoningCall = false;
globalThis._heroOrder = [];
globalThis.concedeGame = false;
globalThis.discoveryChoices = {};
function _pendingDiscChoices() {
	return (currentReport?.pendingDiscoveryChoices ?? []).filter((p) => !!(p?.key && Array.isArray(p.options) && p.options.length));
}
function discoveryChoiceBlockHTML() {
	const pend = _pendingDiscChoices();
	if (!pend.length) return "";
	return kcHtml`<div id="orders-discovery-top" class="orders-char-block" style="background:#f4f7ec">
      <div class="orders-char-head" style="background:#3e5a1c">
        <button type="button" class="sec-toggle" aria-expanded="true" title="Minimise / maximise" onclick="toggleSection(this)">&#9662;</button>
        💡 Research — choose which discover${pend.length !== 1 ? "ies" : "y"} to keep
      </div>
      <div id="orders-discovery-choice" style="padding:6px 10px 10px"></div>
    </div>`;
}
function renderDiscoveryChoices() {
	const w = document.getElementById("orders-discovery-choice");
	if (!w) return;
	const pend = _pendingDiscChoices();
	w.innerHTML = String(kcHtml`<div style="font-size:.72rem;color:var(--stone);margin-bottom:6px">Your scholars turned up two leads for each discovery below, but only one can be pursued. Keep one — the other is <strong>forgotten for good</strong> and will never come up again. Left unchosen, one is kept at random.</div>${pend.map((p, i) => kcHtml`<div style="${i ? "border-top:1px solid var(--parchment-dark);margin-top:8px;padding-top:8px;" : ""}">
      <div style="font-family:Cinzel,serif;font-size:.78rem;font-weight:600;color:var(--ink);margin-bottom:4px">Found by ${(p.charName ?? "") || "a scholar"}${p.category ? ` — ${p.category} research` : ""}${p.turn ? ` (turn ${String(p.turn)})` : ""}</div>
      ${theLeadsOf$1(p).map((o) => kcHtml`<label style="display:flex;align-items:flex-start;gap:8px;padding:5px 6px;margin:3px 0;border:1px solid ${discoveryChoices[String(p.key)] === o.id ? "var(--forest)" : "var(--parchment-dark)"};border-radius:3px;background:${discoveryChoices[String(p.key)] === o.id ? "#e8f1dc" : "#fffdf6"};cursor:pointer;font-size:.76rem;line-height:1.4">
          <input type="radio" name="dc-${p.key}" value="${o.id}" ${discoveryChoices[String(p.key)] === o.id ? "checked" : ""} onchange="setDiscoveryChoice(${kcArg(String(p.key))},${kcArg(String(o.id))})" style="margin-top:3px">
          <span><strong>${o.name}</strong> <span style="color:var(--stone)">(${o.category})</span><br>${o.desc}</span>
        </label>`)}
    </div>`)}`);
}
function setDiscoveryChoice(key, id) {
	discoveryChoices[key] = id;
	renderDiscoveryChoices();
}
function renderConcede() {
	const w = document.getElementById("concede-wrap");
	if (!w) return;
	if ((currentReport?.kingdom ?? {}).conceded) {
		w.innerHTML = `<div style="background:#eee;border:1px solid #999;border-radius:3px;padding:6px 8px;color:#231e16">\u{1F3F3} <strong>Your realm has conceded.</strong> Your heroes hold their ground and take no further orders.</div>`;
		return;
	}
	w.innerHTML = concedeGame ? `<div style="background:#fdeaea;border:1px solid var(--crimson);border-radius:3px;padding:6px 8px">\u{1F3F3} <strong>You will CONCEDE the game with these orders.</strong> This cannot be undone once the turn runs. <button type="button" onclick="setConcede(false)" style="margin-left:6px;font-size:.7rem;padding:2px 8px;cursor:pointer">Cancel</button></div>` : `<button type="button" onclick="setConcede(true)" style="font-family:'Cinzel',serif;font-size:.66rem;padding:4px 10px;border:1px solid #999;background:#f4f0e6;color:#2a2419;border-radius:2px;cursor:pointer" title="Withdraw your realm from the game">\u{1F3F3} Concede the game\u2026</button>`;
}
function setConcede(v) {
	if (v && !confirm("Concede the game?\n\nYour realm withdraws for good: from the turn this is submitted your heroes will only Defend, you send no private dispatches until the game is over, and you can never rejoin. If every other realm has conceded, or all those left are one alliance, the game ends at once and the results are shown.\n\nSubmit your orders to confirm.")) return;
	concedeGame = !!v;
	renderConcede();
}
/** `Array.isArray` on a list typed `readonly` (which it narrows to `any[]`), its elements' type kept. */
function isAListOf(x) {
	return Array.isArray(x);
}
function provDirectionLabel(fromId, toId, provs, cols) {
	if (!isAListOf(provs)) return null;
	const a = provs.find((p) => p.id === fromId), b = provs.find((p) => p.id === toId);
	if (!a || !b || a.row == null || b.row == null) return null;
	let dc = b.col - a.col;
	if (cols) {
		if (dc > cols / 2) dc -= cols;
		if (dc < -cols / 2) dc += cols;
	}
	if (b.row - a.row === 0 && dc === 0) return null;
	const x1 = a.col + (a.row & 1) * .5, y1 = a.row * .866;
	const x2 = a.col + dc + (b.row & 1) * .5, y2 = b.row * .866;
	const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
	return [
		"East",
		"Southeast",
		"South",
		"Southwest",
		"West",
		"Northwest",
		"North",
		"Northeast"
	][Math.round((ang + 360) % 360 / 45) % 8];
}
function renderPreSchool(charId) {
	const disp = document.getElementById(`ep-preschool-display-${String(charId)}`);
	const hidden = document.getElementById(`ep-preschool-${String(charId)}`);
	if (!disp || !(hidden instanceof HTMLInputElement)) return;
	const school = (hidden.value || "").toLowerCase();
	if (school) disp.innerHTML = String(kcHtml`<span style="display:inline-flex;align-items:center;gap:6px;background:#fff8e8;border:1px solid #c8922a;border-radius:2px;padding:3px 8px;font-size:.78rem">
        <span style="color:#5a4208">Random <strong>${(theSkillsNames$6[school] ?? "") || school}</strong> spell</span>
        <button onclick="clearPreSchool(${kcArg(String(charId))})" title="Remove" style="background:var(--crimson);color:#fff;border:none;border-radius:2px;padding:0 6px;cursor:pointer;font-size:.7rem">✕</button>
      </span>
      <button onclick="openPreSchoolPicker(${kcArg(String(charId))})" style="font-size:.7rem;padding:3px 8px;border:1px solid var(--stone);background:var(--parchment-dark);cursor:pointer;border-radius:2px">Change</button>`);
	else disp.innerHTML = String(kcHtml`<button onclick="openPreSchoolPicker(${kcArg(String(charId))})" style="font-size:.72rem;padding:3px 10px;border:1px solid var(--stone);background:var(--parchment-dark);cursor:pointer;border-radius:2px">+ Choose spell school</button>
      <span style="font-size:.72rem;color:#aaa">None set</span>`);
}
// src/ui/player/a-list-of-kchtml-pieces-joined-by-a-separator.ts
function kcJoinP(list, sep) {
	return list.flatMap((x, i) => i ? [sep, x] : [x]);
}
// src/ui/player/order-chances.ts
/** The skills' names by key, read by any key (none is empty words). */
var theSkillsNames$5 = SKILL_LABELS;
var SPELLS_BY_SCHOOL = everySpellBySchool();
function castChanceNote(c, spellName, optsHanded) {
	const opts = optsHanded ?? {};
	const school = SPELL_TO_SCHOOL[spellName];
	if (!school) return "";
	const rec = c?.castChance?.[school] ?? null;
	if (opts.itemCast) return kcHtml`<div style="font-size:.72rem;color:var(--forest);margin-top:2px">🎲 Cast chance: <strong>95%</strong> — worked from the item, whatever your own skill.</div>`;
	const lvl = rec ? rec.level : effMagicLvl(c, school);
	if (Number(lvl) <= 0) return kcHtml`<div style="font-size:.72rem;color:var(--crimson);margin-top:2px">🎲 No ${(theSkillsNames$5[school] ?? "") || school} skill yet — this cast will fail unless a Practice order earlier this turn raises it.</div>`;
	if (school === "necromancy" && c?.necroAutoReady) return kcHtml`<div style="font-size:.72rem;color:var(--forest);margin-top:2px">🎲 Cast chance: <strong>100%</strong> — your Wailing Phylactery makes this turn's first Necromancy spell certain.</div>`;
	const chance = rec ? rec.chance : Math.min(95, 30 + Number(lvl) * 10);
	const bits = [`${(theSkillsNames$5[school] ?? "") || school} ${String(lvl)}`];
	if (rec?.arcane) bits.push(`+${String(rec.arcane)}% Arcane Codex`);
	if (rec?.mastery) bits.push(`+${String(rec.mastery)}% school mastery`);
	if (rec?.discovery) bits.push(`+${String(rec.discovery)}% discoveries`);
	const capped = Number(chance) >= 95 ? " — the 95% cap" : "";
	return kcHtml`<div style="font-size:.72rem;color:var(--forest);margin-top:2px">🎲 Cast chance: <strong>${chance}%</strong> (${bits.join(", ")}${capped}). A failed cast is spent — the spell fizzles and the phase is used.</div>`;
}
var SPELL_TO_SCHOOL = theSchoolOfEachSpell();
var SPELL_REQ_LEVEL = theLevelEachMasterySpellNeeds();
var ITEM_UNCAPPED_SKILLS_P = new Set(KC_ITEM_UNCAPPED_SKILLS);
function roundReportNumbers(text) {
	return (text ?? "").replace(/(\u00d7\s*)?(?<![\d.])(\d+)\.(\d+)(?![.\d\u00d7])/g, (m, mult, whole, frac) => mult ? m : String(dispFloor(Number(whole + "." + frac))));
}
function unitEmoji(type) {
	const _SEAMON = new Set(KC_UNIT_CLASS.primalSea);
	const _MON = new Set(KC_UNIT_CLASS.monster.filter((t) => !KC_UNIT_CLASS.primalSea.includes(t)));
	const _FLY = new Set(KC_UNIT_CLASS.aerial);
	const _SEA = new Set(KC_UNIT_CLASS.carrier);
	const _CRE = new Set(KC_UNIT_CLASS.creature);
	if ((/* @__PURE__ */ new Set([
		"Air Elemental",
		"Fire Elemental",
		"Earth Elemental",
		"Water Elemental",
		"Darkness Elemental"
	])).has(type)) return "🌀";
	if (_SEAMON.has(type)) return "🌊";
	if (_SEA.has(type)) return "⛵";
	if (_MON.has(type)) return "🐉";
	if (_FLY.has(type)) return "🦅";
	if (_CRE.has(type)) return "🐾";
	return "🛡️";
}
// src/ui/player/skills-and-projections.ts
/** The skills' names, the sources' kinds, marks and words, and the beasts' classes, read by any key. */
var theSkillsNames$4 = SKILL_LABELS;
var BONUS_KIND_P = {
	item: {
		c: "#9a6b12",
		bg: "#f7edd4",
		label: "Item"
	},
	aura: {
		c: "#b05e12",
		bg: "#fbe8d6",
		label: "Aura"
	},
	title: {
		c: "#6a4a9a",
		bg: "#ece5f6",
		label: "Title"
	},
	perk: {
		c: "#1f6f6f",
		bg: "#dcefef",
		label: "Perk"
	},
	discovery: {
		c: "#2a5a8a",
		bg: "#dde9f5",
		label: "Discovery"
	},
	curse: {
		c: "var(--crimson)",
		bg: "#f6dede",
		label: "Curse"
	}
};
var BONUS_SCOPE_MARK_P = {
	combat: "⚔",
	battle: "⚑",
	move: "➤",
	order: "✎"
};
var BONUS_SCOPE_TEXT_P = {
	combat: "personal combat only",
	battle: "army battles only",
	move: "movement points only",
	order: "that order’s own roll only"
};
var theSourcesKinds = BONUS_KIND_P;
var theScopesMarks = BONUS_SCOPE_MARK_P;
var theScopesWords = BONUS_SCOPE_TEXT_P;
function _bonusKindP(k) {
	return theSourcesKinds[k] ?? {
		c: "#555",
		bg: "#eeeeee",
		label: "Other"
	};
}
var _kindFallbackP = (delta, pos) => (delta ?? 0) < 0 ? "curse" : pos;
function _skillSourcesP(c, k) {
	const e = c?.skillEff?.[k] ?? null;
	const out = [];
	if (e && Array.isArray(e.sources)) e.sources.forEach((x) => out.push({
		label: x.label,
		delta: x.delta,
		kind: (x.kind ?? "") || _kindFallbackP(x.delta, "item"),
		scope: "always"
	}));
	(((c ? c.skillExtra ?? c.combatSkillBonus : void 0) ?? {})[k] ?? []).forEach((x) => out.push({
		label: x.label,
		delta: x.delta,
		kind: (x.kind ?? "") || _kindFallbackP(x.delta, "title"),
		scope: (x.scope ?? "") || "combat"
	}));
	return out;
}
function skillRowHTML(c, style) {
	const eff = c?.skillEff, raw = c?.skills ?? {};
	const extra = (c ? c.skillExtra ?? c.combatSkillBonus : void 0) ?? {};
	const keys = eff ? Object.keys(eff) : Object.keys(raw).filter((k) => (raw[k] ?? 0) > 0);
	Object.keys(extra).forEach((k) => {
		if (!keys.includes(k)) keys.push(k);
	});
	const legendKinds = /* @__PURE__ */ new Set();
	const detail = [];
	const rows = keys.map((k) => {
		const e = eff ? eff[k] : null;
		const base = e ? e.base : Number(raw[k]) || 0;
		const bonus = e ? Number(e.bonus) || 0 : 0;
		const srcs = _skillSourcesP(c, k);
		const cb = srcs.filter((s) => s.scope !== "always").reduce((sm, x) => sm + (Number(x.delta) || 0), 0);
		if (Number(base) <= 0 && bonus <= 0 && cb <= 0) return "";
		const label = (theSkillsNames$4[k] ?? "") || k;
		const always = srcs.filter((s) => s.scope === "always");
		const rawTotal = always.reduce((s, x) => s + (Number(x.delta) || 0), 0);
		const chips = [];
		if (always.length && bonus !== 0) {
			const byKind = {};
			const order = [];
			always.forEach((s) => {
				if (byKind[s.kind] === void 0) {
					byKind[s.kind] = 0;
					order.push(s.kind);
				}
				byKind[s.kind] = Number(byKind[s.kind]) + (Number(s.delta) || 0);
			});
			const posRaw = order.filter((x) => Number(byKind[x]) > 0).reduce((s, x) => s + Number(byKind[x]), 0);
			const neg = order.filter((x) => Number(byKind[x]) < 0).reduce((s, x) => s + Number(byKind[x]), 0);
			const posShown = Math.max(0, bonus - neg);
			let left = posShown;
			order.forEach((kind) => {
				const v = Number(byKind[kind]);
				const st = _bonusKindP(kind);
				let shown = v;
				if (v > 0) {
					shown = posRaw > 0 ? Math.min(left, Math.round(v * posShown / posRaw)) : 0;
					left -= shown;
				}
				if (!shown) return;
				legendKinds.add(kind);
				chips.push(kcHtml`<span style="color:${st.c};font-weight:600">${shown > 0 ? "+" : ""}${shown}</span>`);
			});
		} else if (bonus !== 0) chips.push(kcHtml`<span style="color:${bonus > 0 ? "var(--gold)" : "var(--crimson)"};font-weight:600">${bonus > 0 ? "+" : ""}${bonus}</span>`);
		const scoped = {};
		const scOrder = [];
		srcs.filter((s) => s.scope !== "always").forEach((s) => {
			let theScope = scoped[s.scope];
			if (!theScope) {
				theScope = {};
				scoped[s.scope] = theScope;
				scOrder.push(s.scope);
			}
			theScope[s.kind] = (Number(theScope[s.kind]) || 0) + (Number(s.delta) || 0);
		});
		scOrder.forEach((sc) => {
			const theScope = scoped[sc];
			if (theScope === void 0) throw new TypeError(`no sources of the scope ${sc}`);
			Object.keys(theScope).forEach((kind) => {
				const v = theScope[kind];
				if (!v) return;
				const st = _bonusKindP(kind);
				legendKinds.add(kind);
				chips.push(kcHtml`<span style="color:${st.c};font-weight:600">(${v > 0 ? "+" : ""}${v}${theScopesMarks[sc] ?? ""})</span>`);
			});
		});
		if (srcs.length) {
			const bits = srcs.map((s) => {
				const st = _bonusKindP(s.kind);
				return kcHtml`<span style="background:${st.bg};color:${st.c};border-radius:2px;padding:0 4px;white-space:nowrap">${Number(s.delta) > 0 ? "+" : ""}${s.delta} ${s.label}${s.scope !== "always" ? ` ${theScopesMarks[s.scope] ?? ""}` : ""}</span>`;
			});
			if (rawTotal > 0 && bonus < rawTotal) bits.push(kcHtml`<span style="color:#3a3224">(capped at ${ITEM_UNCAPPED_SKILLS_P.has(k) || k === "druid" ? 9 : 5})</span>`);
			detail.push(kcHtml`<span style="white-space:normal"><strong style="color:#231e16">${label}</strong> ${kcJoinP(bits, " ")}</span>`);
		}
		const _ceil = ITEM_UNCAPPED_SKILLS_P.has(k) || k === "druid" ? 9 : 5;
		const parts = srcs.map((s) => `${Number(s.delta) > 0 ? "+" : ""}${String(s.delta)} ${String(s.label)}${s.scope !== "always" ? ` (${theScopesWords[s.scope] ?? ""})` : ""}`);
		if (rawTotal > 0 && bonus < rawTotal) parts.push("capped at " + String(_ceil));
		const tip = parts.length ? kcHtml` title="${label + " " + String(base) + " — " + parts.join(", ")}"` : "";
		return style === "tags" ? kcHtml`<span class="skill-tag"${tip}>${label} ${base}${chips}</span>` : kcHtml`<span style="color:var(--forest)"${tip}><strong>${label}:</strong> ${base}${chips}</span>`;
	}).filter(Boolean);
	if (!rows.length) return style === "tags" ? "" : kcHtml`<span style="color:#aaa">No skills</span>`;
	const out = [rows];
	if (detail.length) {
		const legend = kcJoinP([...legendKinds].map((kd) => {
			const st = _bonusKindP(kd);
			return kcHtml`<span style="color:${st.c}">● ${st.label}</span>`;
		}), " ");
		out.push(kcHtml`<span style="flex-basis:100%;width:100%;margin-top:3px;font-size:.68rem;color:#2a2419;line-height:1.8;display:block">${[
			kcHtml`<span style="color:#3a3224;text-transform:uppercase;letter-spacing:.04em">Skill bonuses</span> ${legend}`,
			kcHtml`<span style="display:block;margin-top:2px">${kcJoinP(detail, kcHtml` &nbsp; `)}</span>`,
			kcHtml`<span style="display:block;color:#3a3224;margin-top:1px">⚔ personal combat &middot; ⚑ army battles &middot; ➤ movement &middot; ✎ that order&rsquo;s roll — these never change the skill itself</span>`
		]}</span>`);
	}
	return kcHtml`${out}`;
}
function capitalise(s) {
	return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
var theHumanoidRaces = new Set(KC_HUMANOID_RACES);
function druidNeedP(a, c, report) {
	const rep = report ?? currentReport ?? {};
	if (!a || a.skeletal || a._isSkeletal) return {
		req: 0,
		effDru: 0,
		shortfall: 0,
		counts: false
	};
	const realmAlign = (rep.kingdom?.alignment ?? "") || null;
	const tamed = TAMED_FLYER_TYPES_D.has(a.type) && (rep.discoveries ?? []).some((d) => d?.id === "sd40");
	const req = druidLevelALeaderNeeds(a.type, realmAlign, c?.alignment, tamed);
	const druLevel = effSkillP(c, "druid");
	const sameRace = !!(a.race && a.race === c?.race);
	const effDru = druidALeaderBringsToAUnit(druLevel, sameRace);
	return {
		req,
		effDru,
		shortfall: druidShortfall(req, effDru),
		counts: req > 0 && !(sameRace && req <= 1)
	};
}
function theArmyCardsFiguresOfAColumn(arr, c, report) {
	const kingdom = report.kingdom ?? {};
	const druLevel = effSkillP(c, "druid");
	const hisBeastsPayHalfWages = aLeadersBeastsPayHalfWages(rawSkillLvl(c, "druid") >= 6, () => !!kingdom.itsDruidicWonderHalvesItsBeastsWages);
	let totalStr = 0, totalCost = 0, druidUnits = 0, druidShort = 0;
	return {
		druLevel,
		units: arr.map((a) => {
			const creature = CREATURE_ARMIES.has(a.type), monster = MONSTER_ARMIES.has(a.type);
			const _dn = druidNeedP(a, c, report);
			const req = _dn.req;
			if (_dn.counts) druidUnits++;
			const effDru = _dn.effDru;
			const shortfall = _dn.shortfall;
			let theShareHisShortfallLeaves = 1;
			if (shortfall > 0) {
				druidShort++;
				theShareHisShortfallLeaves = strengthLeftByADruidShortfall(shortfall);
			}
			const mastery = theDruidMasteryLiftsAUnitOfThisType(a.type, a.skeletal) ? Math.round(druidMasteryGainOver(druidLevelTheMasteryCounts(druLevel), req) * 100) : 0;
			const _str = theStrengthAUnitHasBeforeTheGroundAndTheFoe({
				unitType: a.type,
				quality: a.quality,
				isSkeletal: !!a.skeletal,
				race: a.race
			}, {
				hisDruidMasteryTier: theMasteryTierATrainedLevelGives(rawSkillLvl(c, "druid")),
				hisNecromancyMasteryTier: theMasteryTierATrainedLevelGives(rawSkillLvl(c, "necromancy")),
				theShareHisDruidShortfallLeaves: theShareHisShortfallLeaves,
				theKingsRace: kingdom.race,
				hisRace: c.race,
				theRealmsUnitStrengthEffects: [],
				heIsTheKing: !!c.isKing,
				theItemsHeUses: theItemsAHeroUses(c.items ?? [], c),
				theRealmsAlignment: kingdom.alignment,
				hisDruidMasteryGain: mastery / 100,
				heHoldsTheMinorTitle: (title) => (c.minorHeld ?? []).some((t) => t?.key === title)
			});
			const kingRaceMatch = _str.theKin.itsKingIsOfItsKin;
			const leadRaceMatch = _str.theKin.itsLeaderIsOfItsKin;
			const feudLed = _str.theKin.aLeaderOfItsRivalKinLeadsIt;
			const bs = _str.strength;
			totalStr += bs;
			const wage = a.cost ?? 2;
			totalCost += hisBeastsPayHalfWages && !a.temporary && !a.wildHunt && aCompanyIsABeastADruidHalves(a.type) ? theWageABeastPaysUnderADruid(wage) : wage;
			return {
				creature,
				monster,
				req,
				effDru,
				shortfall,
				theShareHisShortfallLeaves,
				mastery,
				kingRaceMatch,
				leadRaceMatch,
				feudLed,
				bs
			};
		}),
		totalStr,
		totalCost,
		druidUnits,
		druidShort
	};
}
function theArmyCardsAirAndSeaNotesOfAColumn(arr, c) {
	const _FLY_UI2 = new Set(KC_UNIT_CLASS.flying);
	const _SEA_UI2 = new Set(KC_UNIT_CLASS.sea);
	const _AER_UI2 = new Set(KC_UNIT_CLASS.aerial);
	const _hasFlyer = arr.some((a) => _FLY_UI2.has(a.type));
	const _hasFoot = arr.some((a) => !_AER_UI2.has(a.type) && !_SEA_UI2.has(a.type));
	const _airborne = _hasFlyer && _hasFoot && !arr.some((a) => _SEA_UI2.has(a.type)) && Number(c.effectiveSeaSpeed) > 0;
	const _airNote = _airborne ? kcHtml` · <span style="color:#2d6a8a">🦅 Airborne — the flyers carry the foot soldiers, so the whole force flies (crosses sea, moves at the flyers' pace)</span>` : "";
	const _naval8 = (c.skills?.["naval"] ?? 0) >= 8;
	const _lift = seaLiftOfAColumn(arr, _naval8);
	let _hullNeed = arr.filter((a) => !_AER_UI2.has(a.type) && !_SEA_UI2.has(a.type)).reduce((n, a) => n + (takesHalfAHullAboard(a) ? .5 : 1), 0);
	if (_naval8) _hullNeed /= 2;
	const _hullNeedShown = Math.ceil(_hullNeed);
	const _hullHave = _lift.berths;
	const _ashore = _lift.unitsLeftAshore.length;
	const _hulls = kcHtml`needs ${_hullNeedShown} hull${_hullNeedShown !== 1 ? "s" : ""}, has ${_hullHave}`;
	let _seaNote;
	if (_lift.answer === "all") _seaNote = kcHtml` · ⚓ <span style="color:#2d6a8a">Sea: every unit sails or flies on its own</span>`;
	else if (_airborne) _seaNote = "";
	else if (_lift.answer === "sea" && _hullHave >= _hullNeed) _seaNote = kcHtml` · ⚓ <span style="color:#1d5a1d">Sea transport: ${_hulls} — can put to sea</span>`;
	else if (_lift.answer === "sea") _seaNote = kcHtml` · ⚓ <span style="color:#1d5a1d">Sea transport: ${_hulls}, and the flyers carry the rest — can put to sea</span>`;
	else _seaNote = kcHtml` · ⚓ <span style="color:var(--crimson)">Sea transport: ${_hulls} — ${_ashore} unit${_ashore !== 1 ? "s" : ""} left ashore: more fleet units or flyers to carry the whole force</span>`;
	return {
		_airNote,
		_seaNote
	};
}
var thePrimalSubracesClass = {
	"Stone Giant": "Creature",
	"Forest Ent": "Creature",
	Thunderbird: "Creature",
	"Giant Eagle": "Creature",
	Roc: "Creature",
	Whale: "Creature",
	"Great Bear": "Creature",
	Unicorn: "Creature",
	Mammoth: "Creature",
	"Great Turtle": "Creature",
	"Cave Troll": "Monster",
	Manticore: "Monster",
	Basilisk: "Monster",
	Dragon: "Monster",
	Titan: "Monster",
	"Sea Giant": "Monster",
	Kraken: "Monster",
	Hydra: "Monster",
	Leviathan: "Monster",
	Shark: "Monster"
};
function formatRace(race, unitType) {
	if (!race) return "Uninhabited";
	if (race.startsWith("Primal")) {
		const sub = race.slice(7).trim();
		if (sub) return (thePrimalSubracesClass[sub] ?? "") || "Creature";
		if (unitType) return MONSTER_ARMIES.has(unitType) ? "Monster" : "Creature";
		return "Creature";
	}
	return race;
}
var PRIMAL_ARMY_SPEEDS = Object.fromEntries(Object.entries(PRIMAL_ARMY_DEFS_P).map(([t, d]) => [t, d.speed]));
function armyLabel(a, opts = {}) {
	const name = a.unitName ?? "";
	if (opts.short) return name ? name : `${String(a.quality)} ${a.type}`;
	const primalWord = CREATURE_ARMIES.has(a.type) ? "Creature" : MONSTER_ARMIES.has(a.type) ? "Monster" : null;
	const race = a.race ? formatRace(a.race, a.type) : null;
	const lead = !!(a.race && theHumanoidRaces.has(a.race)) ? primalWord ? `${String(race)} (${primalWord})` : race : primalWord ?? race;
	const str = unitBaseStrength(a);
	const _mv = a.moveRate != null && !opts.noMove ? `Move ${String(a.moveRate)}${a.moveKind === "sea" ? " (sea)" : a.moveKind === "air" ? " (air)" : ""}` : null;
	const detail = [
		lead,
		a.type,
		a.quality,
		`Base str ${String(str)}`,
		_mv
	].filter(Boolean).join(", ");
	const wild = a.wildHunt || a._wildHuntUntilTurn != null ? kcHtml` <span style="color:#7a4a10;font-size:.72rem">[Wild Hunt — bound until end of turn ${a.wildHuntUntil ?? a._wildHuntUntilTurn ?? "?"}, no wages]</span>` : "";
	return kcHtml`${name ? `${name} (${detail})` : detail}${wild}`;
}
// src/ui/player/map-symbols.ts
/** The declarations the player has chosen this turn (diploChoices): a TypeError for none, as a read on `null` threw. */
function theDiplomaticChoices() {
	if (diploChoices === null) throw new TypeError("Cannot read properties of null (reading the realm's declaration)");
	return diploChoices;
}
/** The tables read by a key of words: the skills' names and the guardians' colours (no colour is ''). */
var theSkillsNames$3 = SKILL_LABELS;
var theGuardiansColours = GUARD_POWER_COLORS_P;
var TERRAIN_COLORS_MAP = { ...KC_TERRAIN_COLORS };
function makeTerrainIcon(svgNS, cx, cy, terrain) {
	const els = [];
	const mk = (tag, attrs) => {
		const el = document.createElementNS(svgNS, tag);
		Object.entries(attrs).forEach(([k, v]) => {
			el.setAttribute(k, String(v));
		});
		el.setAttribute("pointer-events", "none");
		return el;
	};
	switch (terrain) {
		case "sea":
			els.push(mk("path", {
				d: `M${String(cx - 8)},${String(cy - 1)} q4,-4 8,0 q4,4 8,0`,
				stroke: "rgba(255,255,255,0.55)",
				"stroke-width": "1.5",
				fill: "none"
			}));
			els.push(mk("path", {
				d: `M${String(cx - 6)},${String(cy + 3)} q3,-3 6,0 q3,3 6,0`,
				stroke: "rgba(255,255,255,0.35)",
				"stroke-width": "1",
				fill: "none"
			}));
			break;
		case "forest":
			[[cx - 8.5, cy - 3], [cx + .5, cy - 3]].forEach(([tx, ty]) => {
				els.push(mk("polygon", {
					points: `${String(tx)},${String(ty + 6)} ${String(tx + 4)},${String(ty - 2)} ${String(tx + 8)},${String(ty + 6)}`,
					fill: "rgba(255,255,255,0.35)"
				}));
				els.push(mk("rect", {
					x: tx + 3.5,
					y: ty + 5,
					width: 1,
					height: 3,
					fill: "rgba(255,255,255,0.3)"
				}));
			});
			break;
		case "jungle":
			[
				cx - 9,
				cx - 3,
				cx + 3
			].forEach((tx, i) => {
				const ty = cy + (i === 1 ? -4 : -1);
				els.push(mk("circle", {
					cx: tx + 3,
					cy: ty + 2,
					r: "4",
					fill: "rgba(255,255,255,0.28)"
				}));
				els.push(mk("rect", {
					x: tx + 2.5,
					y: ty + 5.5,
					width: 1,
					height: 2.5,
					fill: "rgba(255,255,255,0.25)"
				}));
			});
			break;
		case "mountain":
			els.push(mk("polygon", {
				points: `${String(cx - 10)},${String(cy + 5)} ${String(cx - 4)},${String(cy - 5)} ${String(cx + 2)},${String(cy + 5)}`,
				fill: "rgba(255,255,255,0.2)",
				stroke: "rgba(255,255,255,0.45)",
				"stroke-width": "0.8"
			}));
			els.push(mk("polygon", {
				points: `${String(cx - 2)},${String(cy + 5)} ${String(cx + 4)},${String(cy - 4)} ${String(cx + 10)},${String(cy + 5)}`,
				fill: "rgba(255,255,255,0.12)",
				stroke: "rgba(255,255,255,0.35)",
				"stroke-width": "0.8"
			}));
			break;
		case "desert":
			els.push(mk("path", {
				d: `M${String(cx - 12)},${String(cy + 2)} q6,-8 12,0 q6,8 12,0`,
				stroke: "rgba(255,255,255,0.4)",
				"stroke-width": "1.5",
				fill: "none"
			}));
			break;
		case "plain":
			els.push(mk("circle", {
				cx,
				cy,
				r: "3",
				fill: "rgba(255,255,255,0.35)"
			}));
			[
				[0, -6],
				[0, 6],
				[-5, -3],
				[5, -3],
				[-5, 3],
				[5, 3]
			].forEach(([dx, dy]) => {
				els.push(mk("line", {
					x1: cx + dx * .55,
					y1: cy + dy * .55,
					x2: cx + dx,
					y2: cy + dy,
					stroke: "rgba(255,255,255,0.3)",
					"stroke-width": "1"
				}));
			});
	}
	return els;
}
function bulletizeDesc(text) {
	if (!text) return "";
	const bold = (s) => s.split(/\*\*(.+?)\*\*/).map((x, i) => i % 2 ? kcHtml`<strong>${x}</strong>` : x);
	const parts = inWords(text).trim().split(/\.\s+/).map((s) => s.trim()).filter(Boolean);
	if (parts.length <= 1) return kcHtml`${bold(inWords(text))}`;
	return kcHtml`<ul style="margin:2px 0 0;padding-left:1.15em;line-height:1.45">${parts.map((p) => {
		const needsDot = !/[.!?]$/.test(p);
		return kcHtml`<li style="margin-bottom:4px">${bold(p)}${needsDot ? "." : ""}</li>`;
	})}</ul>`;
}
function neutralCharLabel(c) {
	return `${(c?.name ?? "").replace(/\s*\(wandering\)/gi, "").trim()} (${c?.isNeutralGuard ? "local chieftain" : "wandering"})`;
}
function _hexRgb(hex) {
	if (!hex || typeof hex !== "string" || !hex.startsWith("#") || hex.length !== 7) return null;
	const v = [
		1,
		3,
		5
	].map((k) => parseInt(hex.slice(k, k + 2), 16));
	return v.some(isNaN) ? null : v;
}
function _relLum(rgb) {
	const f = (c) => {
		c /= 255;
		return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
	};
	return .2126 * f(Number(rgb[0])) + .7152 * f(Number(rgb[1])) + .0722 * f(Number(rgb[2]));
}
function _contrast(a, b) {
	const la = _relLum(a), lb = _relLum(b);
	return (Math.max(la, lb) + .05) / (Math.min(la, lb) + .05);
}
function _toHex(rgb) {
	return "#" + rgb.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");
}
function _shiftForContrast(hex, bgHex, target, toward) {
	const rgb = _hexRgb(hex), bg = _hexRgb(bgHex);
	if (!rgb || !bg) return hex;
	if (_contrast(rgb, bg) >= target) return hex;
	for (let t = .05; t <= 1.0001; t += .05) {
		const m = rgb.map((c) => c + (toward - c) * t);
		if (_contrast(m, bg) >= target) return _toHex(m);
	}
	return _toHex(rgb.map(() => toward));
}
function _ownerLineP(pd) {
	if (!pd?.ownerName) return "Unclaimed";
	const known = (currentReport ?? {}).diplomacy?.known ?? [];
	const k = known.find((x) => pd.owner != null && x.index === pd.owner) ?? known.find((x) => x.name === pd.ownerName);
	const col = (_tintForDarkTooltip((pd.ownerColor ?? "") || k?.color) ?? "") || "#f2e8d0";
	const rel = k ? k.relation : null;
	const relShown = rel ? {
		neutral: ["Neutral", "#e8d8b0"],
		allied: ["Allied", "#9be07a"],
		enemy: ["Enemy", "#ff7a6a"]
	}[rel] : void 0;
	const tag = relShown ? kcHtml` <span style="color:${relShown[1]};font-weight:600">(${relShown[0]})</span>` : "";
	return kcHtml`Owned by <strong style="color:${col}">${pd.ownerName}</strong>${tag}`;
}
function _tintForDarkTooltip(hex) {
	return _shiftForContrast(hex, "#1a1208", 6, 255);
}
function reportColour(hex) {
	return _shiftForContrast(hex, "#fdf5e0", 4.5, 0);
}
var MAP_CROSS_PATH = "M-0.7 -5H0.7V-2.2H3.2V-0.8H0.7V5H-0.7V-0.8H-3.2V-2.2H-0.7Z";
var MAP_SYM = {
	dead: {
		glyph: "☠",
		text: true,
		fill: "#ffffff",
		label: "a fallen hero lies here",
		path: "M0,-4.8C3.3,-4.8 4,-2.2 4,0.1C4,1.5 3.35,2.25 2.5,2.6L2.5,3.9C2.5,4.5 2.1,4.9 1.5,4.9L-1.5,4.9C-2.1,4.9 -2.5,4.5 -2.5,3.9L-2.5,2.6C-3.35,2.25 -4,1.5 -4,0.1C-4,-2.2 -3.3,-4.8 0,-4.8ZM-2.95,-1A1.2,1.2 0 1,1 -0.55,-1A1.2,1.2 0 1,1 -2.95,-1ZM0.55,-1A1.2,1.2 0 1,1 2.95,-1A1.2,1.2 0 1,1 0.55,-1ZM0,0.45L0.8,1.95L-0.8,1.95ZM-1.15,2.95L-0.6,2.95L-0.6,4.75L-1.15,4.75ZM0.6,2.95L1.15,2.95L1.15,4.75L0.6,4.75Z",
		box: 10
	},
	gravesFresh: {
		glyph: "✝",
		text: true,
		fill: "#9de89d",
		label: "battlefield graves, read this turn",
		path: MAP_CROSS_PATH,
		box: 10
	},
	gravesStale: {
		glyph: "✝",
		text: true,
		fill: "#9a9a9a",
		label: "battlefield graves, older knowledge",
		path: MAP_CROSS_PATH,
		box: 10
	},
	battle: {
		glyph: "⚔",
		text: true,
		fill: "#ff4444",
		label: "a battle was fought here this turn"
	},
	battleOngoing: {
		glyph: "⚔",
		text: true,
		fill: "#ff8800",
		label: "a battle still raging — it carries on next turn"
	},
	duel: {
		glyph: "⚔",
		text: true,
		fill: "#b060ff",
		label: "personal combat — a duel, encounter or assassination"
	},
	capital: {
		glyph: "♛",
		text: true,
		fill: null,
		legend: "#c8922a",
		label: "a realm's home capital, in its own colour"
	},
	flag: {
		glyph: "⚑",
		text: true,
		fill: null,
		legend: "#c8922a",
		label: "your army in the field"
	},
	consecrate: {
		glyph: "✨",
		text: false,
		fill: null,
		label: "consecrated — holy ground"
	},
	ritual: {
		glyph: "🌙",
		text: false,
		fill: null,
		label: "a ritual site you have discovered"
	},
	wonder: {
		glyph: "🏛",
		text: false,
		fill: null,
		label: "a Grand Design — a Wonder of the age"
	},
	garrison: {
		glyph: "🛡",
		text: false,
		fill: null,
		label: "a standing garrison holds this province"
	},
	lair: {
		glyph: "⭐",
		text: false,
		fill: null,
		label: "a lair"
	}
};
var theMapSymbolsByKey = MAP_SYM;
function mapSymSvg(el, sym, fill) {
	const f = fill ?? sym.fill;
	if (sym.path) {
		const ns = "http://www.w3.org/2000/svg";
		const size = parseFloat(String(el.getAttribute("font-size"))) || 8, sc = size / ((sym.box ?? 0) || 10);
		const x = parseFloat(String(el.getAttribute("x"))) || 0, y = parseFloat(String(el.getAttribute("y"))) || 0;
		const g = document.createElementNS(ns, "g");
		g.setAttribute("transform", `translate(${String(x)} ${String(y - size * .4)}) scale(${String(sc)})`);
		[
			"filter",
			"pointer-events",
			"opacity"
		].forEach((a) => {
			if (el.hasAttribute(a)) g.setAttribute(a, String(el.getAttribute(a)));
		});
		const p = document.createElementNS(ns, "path");
		p.setAttribute("d", sym.path);
		p.setAttribute("fill-rule", "evenodd");
		if (f != null) p.setAttribute("fill", f);
		if (el.hasAttribute("stroke")) {
			p.setAttribute("stroke", String(el.getAttribute("stroke")));
			p.setAttribute("stroke-width", String((parseFloat(String(el.getAttribute("stroke-width"))) || .3) / sc));
			p.setAttribute("paint-order", "stroke");
			p.setAttribute("stroke-linejoin", "round");
		}
		Array.from(el.childNodes).forEach((n) => {
			if (n.nodeType === 1) g.appendChild(n);
		});
		g.appendChild(p);
		return g;
	}
	if (f != null) el.setAttribute("fill", f);
	(sym.text ? mapTextGlyph : mapEmojiGlyph)(el, sym.glyph);
	return el;
}
function mapSymHtml(sym, colour, size) {
	if (sym.path) {
		const raw = colour ?? ((sym.fill ?? "") || sym.legend);
		const col = raw ? _tintForDarkTooltip(raw) : "currentColor";
		const b = (sym.box ?? 0) || 10, sz = (size ?? "") || "1em";
		return kcHtml`<svg viewBox="${String(-b / 2)} ${String(-b / 2)} ${String(b)} ${String(b)}" style="width:${sz};height:${sz};vertical-align:-0.15em" aria-hidden="true"><path d="${sym.path}" fill="${col}" fill-rule="evenodd" stroke="#000" stroke-width="0.4" paint-order="stroke" stroke-linejoin="round"></path></svg>`;
	}
	const vs = sym.text ? "︎" : "️";
	const raw = colour ?? ((sym.fill ?? "") || sym.legend);
	return kcHtml`<span style="${sym.text && raw ? `color:${_tintForDarkTooltip(raw)};` : ""}font-family:${MAP_SYMBOL_FONT}${size ? ";font-size:" + size : ""}">${sym.glyph}${vs}</span>`;
}
function txtGlyph(ch, colour) {
	return kcHtml`<span style="${colour ? `color:${colour};` : ""}font-family:${MAP_SYMBOL_FONT}">${ch}︎</span>`;
}
function applyMapSymLegend(root) {
	(root ?? document).querySelectorAll("[data-mapsym]").forEach((el) => {
		const sym = theMapSymbolsByKey[String(el.getAttribute("data-mapsym"))];
		if (!sym) return;
		el.innerHTML = String(mapSymHtml(sym, (el.getAttribute("data-mapcolour") ?? "") || null, (el.getAttribute("data-mapsize") ?? "") || "1rem"));
		if (!el.getAttribute("title")) el.setAttribute("title", sym.label);
	});
}
function mapRaceBadgeHtml(race) {
	const rb = theRaceBadgesByKey[String(race)];
	if (!rb) return "";
	return kcHtml`<svg width="13" height="13" viewBox="0 0 13 13" style="vertical-align:-2px" aria-hidden="true"><circle cx="6.5" cy="6.5" r="6" fill="${rb.fill}"></circle><text x="6.5" y="9.2" text-anchor="middle" font-size="8" font-weight="700" font-family="Cinzel,serif" fill="${rb.text}">${rb.glyph}</text></svg>`;
}
function _lairStar(f) {
	const _pw = (f.monsterPower ?? "") || f.power;
	const col = _tintForDarkTooltip(theGuardiansColours[String(_pw)] ?? "#7a5510");
	const _tag = _pw ? kcHtml` <span style="font-size:.68rem;opacity:.8">(${_pw})</span>` : "";
	const _cat = !f.cleared && f.monsterCat ? kcHtml` <span style="font-size:.68rem;opacity:.7">${f.monsterCat.toLowerCase()}</span>` : "";
	return kcHtml`<span style="color:${col}">\u2b50 ${f.name}${_tag}${_cat}</span>`;
}
function _lairsClearedNote(pd) {
	if (pd?.explored == null || pd.explored < 100) return "";
	const lairs = (pd.features ?? []).filter((f) => Boolean(f) && !f?.ritualSite);
	if (lairs.length === 0) return kcHtml`<br><span style="color:${_tintForDarkTooltip("#6a7f5a")};font-style:italic">\u{1F5FA} Fully mapped \u2014 no lair was ever found in this province.</span>`;
	if (lairs.some((f) => !f.cleared)) return "";
	return kcHtml`<br><span style="color:${_tintForDarkTooltip("#4a8a4a")};font-weight:600">\u2705 Cleared of all lairs \u2014 ${lairs.length === 1 ? "its lair has" : `all ${String(lairs.length)} lairs have`} been put to the sword. Nothing is left to fight here.</span>`;
}
var _graveIntelById = null;
var _graveIntelTurn = null;
function _rebuildGraveIntelIndex(report) {
	const byId = {};
	_graveIntelById = byId;
	_graveIntelTurn = report?.turnNumber ?? null;
	(report?.graveIntel ?? []).forEach((g) => {
		if (g?.provinceId != null) byId[String(g.provinceId)] = g;
	});
}
function _garrisonNote(pd) {
	if (!pd || !(pd.tier === "owned" || pd.tier === "live")) return "";
	const g = pd.garrisonArmies ?? [];
	if (!g.length) return "";
	const col = (_tintForDarkTooltip(pd.ownerColor) ?? "") || "#e8d8b0";
	const counts = {};
	g.forEach((a) => {
		const k = (a.type ?? "") || "unit";
		counts[k] = (counts[k] ?? 0) + 1;
	});
	const list = Object.entries(counts).map(([k, n = 0]) => `${unitEmoji(k)} ${n > 1 ? String(n) + "× " : ""}${k}`).join(", ");
	return kcHtml`<br>\u{1F6E1} <span style="color:${col}">${String(g.length)} unit${g.length !== 1 ? "s" : ""} garrisoned${pd.tier === "live" && pd.ownerName ? ` (${pd.ownerName})` : ""}</span> <span style="opacity:.8;font-size:.9em">— ${list}</span>`;
}
function _graveNote(pd) {
	if (pd?.id == null || !_graveIntelById) return "";
	const g = _graveIntelById[String(pd.id)];
	if (!g) return "";
	const sym = g.turn != null && _graveIntelTurn != null && g.turn === _graveIntelTurn ? MAP_SYM.gravesFresh : MAP_SYM.gravesStale;
	const gcol = _tintForDarkTooltip(sym.fill);
	const stamp = kcHtml`<span style="opacity:.75">(known turn ${g.turn ?? "?"})</span>`;
	if (g.detail?.length) {
		const list = g.detail.map((d) => `${String(d.n)}× ${d.k}`).join(", ");
		return kcHtml`<br>${mapSymHtml(sym)} <span style="color:${gcol}">Battlefield graves: ${g.detailPartial ? "at least " : ""}${list}</span> ${stamp}${g.detailPartial ? kcHtml`<br><span style="opacity:.7;font-style:italic">Grave-sight names only the crack and elite — lesser dead may lie here unseen.</span>` : ""}`;
	}
	return kcHtml`<br>${mapSymHtml(sym)} <span style="color:${gcol}">Battlefield graves lie here</span> <span style="opacity:.7;font-style:italic">— how many, and what they hold, is unknown</span> ${stamp}`;
}
function _lairName(f) {
	if (!f) return "";
	const col = theGuardiansColours[String((f.monsterPower ?? "") || f.power)] ?? null;
	return col ? kcHtml`<span style="color:${col}">${f.name}</span>` : f.name ?? "";
}
function terrorNoteP(pd, light) {
	const t = pd?.terror;
	if (!t || !(Number(t.pct) > 0)) return "";
	return kcHtml`<br><span style="color:${light ? "#701010" : "#e08a8a"}">\u{1F480} Terror ${String(t.pct)}% \u2014 ${String(t.stacks)} stack${t.stacks !== 1 ? "s" : ""}${t.byYou ? " of your own" : ""}: its next defenders fight at \u2212${String(t.pct)}%${t.byYou ? " (yours are spared where you hold the ground)" : ""}</span>`;
}
function _grandDesignNote(pd) {
	const gd = pd?.grandDesign;
	if (!gd) return "";
	return kcHtml`<br><span style="color:#d8a63a;font-weight:600">\u{1F3DB} ${gd.name}</span><span style="opacity:.85"> \u2014 a Grand Design raised by <strong>${(gd.ownerName ?? "") || "a fallen realm"}</strong>${gd.active ? "." : ", dormant while another crown holds this ground."}</span>`;
}
var _GD_DESC_BY_NAME = null;
function grandDesignDesc(name) {
	if (!_GD_DESC_BY_NAME) {
		const byName = {};
		_GD_DESC_BY_NAME = byName;
		try {
			Object.values(GD_BY_ALIGNMENT).forEach((d) => {
				if (d.name) byName[d.name] = d.desc || "";
			});
		} catch {}
	}
	return _GD_DESC_BY_NAME[String(name)] ?? "";
}
function provinceGrandDesignHTML(p) {
	const gd = p?.grandDesign;
	if (!gd) return "";
	const desc = grandDesignDesc(gd.name);
	const mine = !!gd.active;
	return kcHtml`<div style="margin-top:4px;border-left:3px solid ${mine ? "#8a6208" : "#7a7160"};background:${mine ? "#fdf3d8" : "#efe9dc"};border-radius:2px;padding:4px 7px">
      <div style="font-family:Cinzel,serif;font-size:.76rem;color:#4a3105;font-weight:700">\u{1F3DB} ${gd.name}
        <span style="font-weight:400;font-size:.7rem;color:${mine ? "#1d541d" : "#7a1010"}">\u2014 ${mine ? "active" : "dormant"}</span></div>
      ${desc ? kcHtml`<div style="font-size:.73rem;color:#2a2419;line-height:1.45;margin-top:1px">${desc}</div>` : ""}
      <div style="font-size:.68rem;color:#4a4335;margin-top:1px">Raised by <strong>${(gd.ownerName ?? "") || "a fallen realm"}</strong>.
        ${mine ? "A realm may raise only one Grand Design, and its powers last while that realm holds this province." : "Its powers serve only the realm that built it — while another crown holds this ground it is dormant stonework."}</div>
    </div>`;
}
function leadsArmiesP(x) {
	return x?.leadsArmies != null ? Boolean(x.leadsArmies) : (x?.armies ?? 0) > 0;
}
function spiedExtraP(s) {
	if (!s) return "";
	const h = [];
	if (Array.isArray(s.spiedItems)) h.push(kcHtml`<br><span style="color:#1d5a1d">🔍 Items:</span> ${s.spiedItems.length ? s.spiedItems.join(", ") : "none"}`);
	if (Array.isArray(s.spiedArmies)) h.push(kcHtml`<br><span style="color:#1d5a1d">🔍 Leads:</span> ${s.spiedArmies.length ? kcJoinP(s.spiedArmies.map((a) => armyLabel(a, { short: true })), ", ") : "no armies"}`);
	return h.length ? kcHtml`${h}` : "";
}
function popupKnownChars(pd, deadHeroes) {
	const chars = pd?.characters ?? [];
	const _deadSeen = /* @__PURE__ */ new Set();
	const dead = (deadHeroes ?? []).filter((d) => d.locationId === (pd ? pd.id : pd)).filter((d) => {
		if (_deadSeen.has(d.id)) return false;
		_deadSeen.add(d.id);
		return true;
	});
	const deadIds = new Set(dead.map((d) => d.id));
	if (!chars.length && !dead.length) return "";
	const cnt = (c) => c.armyBand ? c.armyBand === "no armies" ? "" : kcHtml` <span style="opacity:.7">(${c.armyBand})</span>` : Number(c.armyCount) > 0 ? kcHtml` <span style="opacity:.7">(${String(c.armyCount)} unit${c.armyCount !== 1 ? "s" : ""})</span>` : "";
	const crown = (c) => c.isKing ? kcHtml`${txtGlyph("♛")} ` : "";
	const own = chars.filter((c) => c.isOwn && !deadIds.has(c.id));
	const enemy = chars.filter((c) => !c.isOwn && !c.isWanderer && !deadIds.has(c.id));
	const wand = chars.filter((c) => c.isWanderer && !deadIds.has(c.id));
	const s = [];
	const NEUTRAL_GREY = "#9a9a9a";
	own.forEach((c) => {
		const col = (_tintForDarkTooltip(c.ownerColor) ?? "") || "#f2e8d0";
		s.push(kcHtml`<br>\u{1F464} <span style="color:${col}">${crown(c)}${c.name}</span>${cnt(c)}`);
	});
	enemy.forEach((c) => {
		const col = (_tintForDarkTooltip(c.ownerColor) ?? "") || "#e05050";
		s.push(kcHtml`<br>\u{1F441} <span style="color:${col}">${crown(c)}${c.name}${c.ownerName ? " of " + c.ownerName : ""}</span>${cnt(c)}`);
	});
	wand.forEach((c) => s.push(kcHtml`<br>${txtGlyph("⚔")} <span style="color:${c.isNeutralGuard ? _tintForDarkTooltip(CHIEFTAIN_MARKER_COLOR) : NEUTRAL_GREY}">${neutralCharLabel(c)}</span>${cnt(c)}`));
	if (dead.length) {
		const _dc = _tintForDarkTooltip(MAP_SYM.dead.fill);
		dead.forEach((d) => s.push(kcHtml`<br>${mapSymHtml(MAP_SYM.dead)} <span style="color:${_dc}">${crown(d)}${d.name} (dead)</span> <span style="font-size:.9em;opacity:.9">${deadHeroRealmTagP(d, null, {
			dark: true,
			bare: true
		})}</span>`));
	}
	return s.length ? kcHtml`${s}` : "";
}
function heroFameTextP(h) {
	const ts = h?.topSkill ?? topSkillOf(h);
	return ts ? `${skillFameLabelM(ts.level)} ${(theSkillsNames$3[ts.skill] ?? "") || ts.skill}` : "no notable skills";
}
var MAP_SYMBOL_FONT = "'Noto Sans Symbols 2','Noto Sans Symbols','Segoe UI Symbol','Apple Symbols','Symbola','DejaVu Sans',sans-serif";
function _setGlyphText(el, s) {
	Array.from(el.childNodes).forEach((n) => {
		if (n.nodeType === 3) el.removeChild(n);
	});
	el.appendChild(document.createTextNode(s));
}
function mapTextGlyph(el, ch) {
	el.setAttribute("font-family", MAP_SYMBOL_FONT);
	_setGlyphText(el, ch + "︎");
	return el;
}
function mapEmojiGlyph(el, ch) {
	_setGlyphText(el, ch + "️");
	return el;
}
var MAP_RACE_BADGE = {
	Human: {
		glyph: "H",
		fill: "#c9a961",
		text: "#1a1208"
	},
	Elven: {
		glyph: "E",
		fill: "#6fbf73",
		text: "#0c2a0e"
	},
	Dwarven: {
		glyph: "D",
		fill: "#9fa8b8",
		text: "#151a22"
	},
	Orcish: {
		glyph: "O",
		fill: "#b8433a",
		text: "#fff"
	},
	Creature: {
		glyph: "C",
		fill: "#4fa3c9",
		text: "#0a1f28"
	},
	Monster: {
		glyph: "M",
		fill: "#7d4fb5",
		text: "#fff"
	}
};
var theRaceBadgesByKey = MAP_RACE_BADGE;
var CHIEFTAIN_MARKER_COLOR = "#8f6a38";
function provLinkHtml(id, name, extraCls) {
	if (id == null || id === "") return name;
	return kcHtml`<span class="prov-link${extraCls ? " " + extraCls : ""}" onmouseenter="highlightMapProv(${kcArg(Number(id))},true)" onmouseleave="highlightMapProv(${kcArg(Number(id))},false)" onclick="locateOnMap(${kcArg(Number(id))})" title="Hover to light up ${name} on the map — click or tap to show it">${name}</span>`;
}
function realmOptStyleP(playerIdx, report) {
	const k = realmOfP(playerIdx, report);
	return k?.color ? kcHtml` style="color:${reportColour(k.color)};font-weight:600"` : "";
}
function deadHeroRealmTagP(h, report, optsHanded) {
	const opts = optsHanded ?? {};
	const rep = report ?? currentReport ?? {};
	const own = rep.playerIndex ?? null;
	const lead = opts.bare ? "" : "— ";
	if (h && h.player == null) return `${lead}a neutral hero, sworn to no crown`;
	if (h && own != null && h.player === own) return `${lead}your own hero`;
	const k = realmOfP(h ? h.player : null, rep);
	const nm = (k?.name ?? "") || "another realm";
	const col = k?.color ? opts.dark ? _tintForDarkTooltip(k.color) || "#e8b84b" : reportColour(k.color) : null;
	return kcHtml`${lead}a hero of <span style="${col ? `color:${col};` : ""}font-weight:600">${nm}</span>`;
}
function renderDiplomacy(report) {
	_renderDiplomacyInto(document.getElementById("report-diplomacy"), report, false);
	_renderDiplomacyInto(document.getElementById("orders-diplomacy"), report, true);
}
function _renderDiplomacyInto(el, report, withControls) {
	if (!el) return;
	const known = report?.diplomacy?.known ?? [];
	const alliancesAllowed = report?.diplomacy?.alliancesAllowed !== false;
	const _ssUntil = Number(report?.diplomacy?.safeStartUntil) || 0;
	const _ssLive = Number(report ? (report._liveTurn ?? 0) || report.turn : report) || 1;
	const safeLocked = _ssUntil > 0 && _ssLive < _ssUntil;
	if (!known.length) {
		el.innerHTML = String(kcHtml`<em style="color:#3a3224;font-size:.85rem">You have not yet encountered another realm. Once you see a rival's province or one of their characters, you may treat with them here.</em>`);
		return;
	}
	const reportRead = report ?? {};
	const relBadge = (r) => r === "allied" ? kcHtml`<span class="pill" style="background:#dff0d8;color:#1d541d">🤝 Allied</span>` : r === "enemy" ? kcHtml`<span class="pill" style="background:#f7d7d7;color:#701010">⚔ At war</span>` : kcHtml`<span class="pill" style="background:#efe6cc;color:#3a2e18">🕊 Neutral</span>`;
	const btn = (idx, val, label, bg) => kcHtml`<button onclick="setDiploChoice(${kcArg(idx)},${kcArg(val)})" style="font-family:'Cinzel',serif;font-size:.68rem;padding:5px 10px;border:1px solid ${bg};background:transparent;color:${bg};border-radius:2px;cursor:pointer">${label}</button>`;
	const pendingLabel = (k) => {
		const p = theDiplomaticChoices()[String(k.index)];
		if (p === "enemy") return k.relation === "allied" ? "Break Alliance" : "Declare War";
		if (p === "treat") return k.relation === "enemy" ? "Propose Peace" : "Propose Alliance";
		return "";
	};
	el.innerHTML = String(kcHtml`${known.map((k) => {
		const pending = theDiplomaticChoices()[String(k.index)];
		let controls;
		if (k.conceded || k.eliminated) {
			if (pending != null) Reflect.deleteProperty(theDiplomaticChoices(), String(k.index));
			controls = kcHtml`<div style="font-size:.78rem;color:#3a3224"><em>${k.eliminated && !k.conceded ? "This dynasty is extinguished" : "This realm has withdrawn from the game"} — there is no court left to treat with, and no declaration can be made against it.</em></div>`;
		} else if (safeLocked) {
			if (pending != null) Reflect.deleteProperty(theDiplomaticChoices(), String(k.index));
			controls = withControls ? kcHtml`<div style="font-size:.78rem;color:#3a3224"><em>🕊 Safe Start — no Treat or declaration of war may be made until the orders for Turn ${String(_ssUntil)}.</em></div>` : "";
		} else if (!withControls) controls = pending ? kcHtml`<div style="font-size:.78rem;color:#7a1c1c">Pending this turn: <strong>${pendingLabel(k)}</strong> <span style="color:#3a3224">(change it at the top of your Orders)</span></div>` : "";
		else if (pending) controls = kcHtml`<div style="font-size:.8rem;color:#7a1c1c">Pending this turn: <strong>${pendingLabel(k)} — ${k.name}</strong> &nbsp;<button onclick="setDiploChoice(${kcArg(k.index)},null)" style="font-size:.66rem;padding:2px 8px;border:1px solid #999;background:#eee;border-radius:2px;cursor:pointer">cancel</button></div>`;
		else if (k.relation === "neutral") controls = kcHtml`${alliancesAllowed ? kcHtml`${btn(k.index, "treat", "Propose Alliance", "#2d6a2d")} ` : ""}${btn(k.index, "enemy", "Declare War", "#8a1c1c")}`;
		else if (k.relation === "enemy") controls = btn(k.index, "treat", "Propose Peace", "#2d6a2d");
		else {
			const _darkSelf = ["Evil", "Undead"].includes(reportRead.kingdom?.alignment);
			controls = btn(k.index, "enemy", _darkSelf ? "Break Alliance — War" : "Break Alliance", "#8a1c1c");
		}
		return kcHtml`<div style="border:1px solid var(--parchment-dark);border-radius:2px;padding:8px 10px;margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="color:${(reportColour(k.color) ?? "") || "#333"}">${k.name}</strong>
        <span style="font-size:.72rem;color:#332c20">${k.alignment ?? ""}</span>
        ${k.conceded || k.eliminated ? kcHtml`<span class="pill" style="background:#e6ded0;color:#3a2e18">${k.eliminated && !k.conceded ? "☠ Extinguished" : "🏳 Conceded"}${k.conceded && k.concededTurn ? ` (turn ${String(k.concededTurn)})` : ""}</span>` : relBadge(k.relation)}
        ${!k.conceded && !k.eliminated && k.offeredUs ? kcHtml`<span class="pill" style="background:#e3eefa;color:#1c3e6a" title="They proposed this last turn. Propose it back this turn to seal it.">🕊 Offered ${k.offeredUs === "peace" ? "peace" : "an alliance"} last turn</span>` : ""}
      </div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${controls}</div>
    </div>`;
	})}${withControls && safeLocked ? kcHtml`<div style="font-size:.72rem;color:#3a3224;margin-top:6px">🕊 <strong>Safe Start:</strong> this is a Safe Start game — diplomacy opens with the orders for <strong>Turn ${String(_ssUntil)}</strong> (this is Turn ${String(_ssLive)}).</div>` : ""}${withControls && !safeLocked ? kcHtml`<div style="font-size:.72rem;color:#3a3224;margin-top:6px">${alliancesAllowed ? kcHtml`An <strong>alliance</strong> or <strong>peace</strong> is sealed only if <em>both</em> realms propose it in the same turn; a <strong>declaration of war</strong> takes effect on its own.` : kcHtml`In a realm of so few kings <strong>no alliances</strong> may be forged — you may make <strong>peace</strong> (both must propose it) or <strong>declare war</strong> (on its own).`} Changes apply at the start of next turn — except that an <strong>Evil</strong> or <strong>Undead</strong> realm's declaration of war takes effect at the <strong>start of this very turn</strong>: its armies may attack the moment the orders run. <strong>Breaking an alliance</strong> returns the two realms to <strong>Neutral</strong> — only an Evil or Undead crown goes straight from alliance to war. Submit your orders to lodge these declarations.</div>` : ""}`);
}
// src/ui/player/the-orders-the-form-holds-handed-to-its-forecasts.ts
function theValueOfAField(el) {
	return "value" in el ? el.value : void 0;
}
/** The value of the page's field with the id `id`, as `document.getElementById(id)?.value` read it. */
function theValueOfThePagesField(id) {
	const el = document.getElementById(id);
	return el ? theValueOfAField(el) : void 0;
}
function getOrderTarget(charId, ph) {
	const hidden = document.getElementById(`po-target-${String(charId)}-${String(ph)}`);
	if (hidden) {
		const value = theValueOfAField(hidden);
		if (value) return value;
		return "";
	}
	return "";
}
function getOrderExtra(charId, ph) {
	const el = document.getElementById(`po-extra-${String(charId)}-${String(ph)}`);
	const value = el ? theValueOfAField(el) : void 0;
	if (value) return value;
	return "";
}
function theOrdersTheFormHolds(report) {
	const byHero = {};
	const characters = typeof report === "object" && report !== null && "characters" in report ? report.characters : null;
	(Array.isArray(characters) ? characters : []).forEach((o) => {
		const id = String(typeof o === "object" && o !== null && "id" in o ? o.id : void 0);
		const phases = [];
		for (let ph = 0; ph < KC_PHASE_NAMES.length; ph++) {
			const order = {};
			const action = document.getElementById(`po-action-${id}-${String(ph)}`);
			if (action) order.action = theValueOfAField(action);
			const target = document.getElementById(`po-target-${id}-${String(ph)}`);
			if (target) order.target = theValueOfAField(target);
			const extra = document.getElementById(`po-extra-${id}-${String(ph)}`);
			if (extra) order.extra = theValueOfAField(extra);
			const wrap = document.getElementById(`po-target-wrap-${id}-${String(ph)}`);
			if (wrap) {
				const dest = wrap.querySelector(".po-recruit-dest");
				order.recruit = {
					musterTo: dest ? theValueOfAField(dest) : null,
					ticked: [...wrap.querySelectorAll("input[type=\"checkbox\"]:checked")].map(theValueOfAField)
				};
			}
			phases.push(order);
		}
		byHero[id] = phases;
	});
	return {
		byHero,
		declarations: typeof diploChoices === "object" && diploChoices ? diploChoices : null
	};
}
function predictedLocation(charId, upToPhaseExclusive) {
	return whereAHeroStandsAfterTheOrdersBefore(currentReport, theOrdersTheFormHolds(currentReport), charId, upToPhaseExclusive);
}
function projectedMoveHost(charId, ph) {
	return theColumnAHeroMarchesWithInAPhase(currentReport, theOrdersTheFormHolds(currentReport), charId, ph);
}
function predictedItems(charId, upToPhaseExclusive) {
	return whatAHeroCarriesAsAPhaseBegins(currentReport, theOrdersTheFormHolds(currentReport), charId, upToPhaseExclusive);
}
function projectedGarrison(provId, phase, includeSamePhase, excludeCharId) {
	return whatAGarrisonHoldsAsAPhaseBegins(currentReport, theOrdersTheFormHolds(currentReport), provId, phase, includeSamePhase, excludeCharId);
}
function projectedLedArmies(charId, upToPhaseExclusive) {
	return whatAHeroLeadsAsAPhaseBegins(currentReport, theOrdersTheFormHolds(currentReport), charId, upToPhaseExclusive);
}
function theOrdersTheFormHoldsForTheHero(c) {
	return theOrdersTheFormHolds({ characters: [c] });
}
function computeOrderLedgerP() {
	return theTreasuryLedgerOnTheseOrders(currentReport, theOrdersTheFormHolds(currentReport));
}
function orderChanceNote(c, action, ph) {
	return theNoteUnderAnOrderThatQuotesItsChance(currentReport, theOrdersTheFormHoldsForTheHero(c), c, action, ph);
}
function actionsFor(c) {
	return theOrdersTheFormOffersAHero(currentReport, c);
}
function projectedMagicLevels(c, ph) {
	return theMagicLevelsAHerosPractisesBeforeAPhaseMayRaise(theOrdersTheFormHoldsForTheHero(c), c, ph);
}
// src/ui/player/move-analysis.ts
/** A province's row on the map, read where an older report may lack it (the map's province type holds one). */
function theRowOf(p) {
	return p.row;
}
/** The skills' names, read by any skill. */
var theSkillsNames$2 = SKILL_LABELS;
/** The hero's name, read where the notice reads it: a TypeError for no hero, as the read on none threw. */
function theNameOfTheHero(ch) {
	if (ch === null || ch === void 0) throw new TypeError(`Cannot read properties of ${String(ch)} (reading 'name')`);
	return ch.name;
}
/** A Move order's target in words (the field's value, else ''): a TypeError for one that isn't words, as its `trim`
*  threw. */
function theTargetOfTheOrderInWords(charId, ph) {
	const target = getOrderTarget(charId, ph);
	if (typeof target !== "string") throw new TypeError("the order's target has no trim: it is not words");
	return target;
}
/** The orders as held (words of JSON, or the object), read for its hero order: a TypeError for none, as the read did. */
function theHeroOrderHeld(r) {
	if (r === null || r === void 0) throw new TypeError(`Cannot read properties of ${String(r)} (reading 'heroOrder')`);
	return Reflect.get(Object(r), "heroOrder");
}
/** The orders as handed, else an empty object (`existingOrders || {}`). */
function theOrdersOrNone(existingOrders) {
	if (existingOrders) return existingOrders;
	return {};
}
function poMoveModeNote(ch, destProv, host, fromProv) {
	const H = host ?? {
		armies: (ch?.armies ?? []).map((a) => ({ ...a })),
		uncounted: [],
		gained: 0,
		base: (ch?.armies ?? []).length
	};
	const A = H.armies;
	const an = poSeaAnalysis(A, Number(ch?.skills?.["naval"]) || 0);
	const destSea = destProv?.terrain === "sea";
	const destKnown = Boolean(destProv?.terrain);
	const fromSea = fromProv?.terrain === "sea";
	const fromKnown = Boolean(fromProv?.terrain);
	const _foot = (() => {
		const bits = [];
		const diff = A.length - (H.base || 0);
		const _same = H.sameFrom ?? [];
		if (diff !== 0 || H.gained) bits.push(`counting your ${_same.length ? `orders this turn, including this phase's hand-overs (${_same.join("; ")} — these resolve before any move)` : "earlier orders this turn"} — ${String(A.length)} unit${A.length !== 1 ? "s" : ""} under command by then${diff > 0 ? ` (${String(diff)} more than now)` : diff < 0 ? ` (${String(-diff)} fewer than now)` : ""}`);
		if (H.uncounted.length) bits.push(kcHtml`<strong>not counted:</strong> ${H.uncounted.join(", ")} — there is no telling in advance what they will bring`);
		return bits.length ? kcHtml`<div style="opacity:.85;margin-top:2px">${kcJoinP(bits, " · ")}.</div>` : "";
	})();
	const box = (bg, bd, fg, html) => kcHtml`<div style="font-size:.72rem;color:${fg};background:${bg};border:1px solid ${bd};border-radius:2px;padding:3px 6px;margin-top:3px">${html}${_foot}</div>`;
	const good = (h) => box("#eaf5e2", "#7ea45f", "#1f4410", h);
	const warn = (h) => box("#fff3e0", "#e0b070", "#7a3c00", h);
	const bad = (h) => box("#fdeaea", "#c06060", "#7a1010", h);
	const where = destProv ? kcHtml` into <strong>${(destProv.name ?? "") || "that province"}</strong>` : "";
	if (!A.length) return good(kcHtml`🚶 <strong>Solo ride</strong> — ${theNameOfTheHero(ch)} leads no troops${where}, and travels by land or takes passage over water freely.`);
	const _navalAboard = an.hulls + an.seaBeasts;
	if (_navalAboard > 0 && !fromSea && !destSea && fromKnown && destKnown) {
		const _names = [...new Set(A.filter((a) => PO_SEA_TYPES.has(a.type)).map((a) => (a.unitName ?? "") || a.type))];
		return bad(kcHtml`⛔ <strong>This move will be refused — ships cannot cross land.</strong> ${theNameOfTheHero(ch)} would be marching from one land province${fromProv ? kcHtml` (<strong>${(fromProv.name ?? "") || "here"}</strong>)` : ""} to another${where} while leading ${_navalAboard} naval unit${_navalAboard !== 1 ? "s" : ""} (${_names.slice(0, 3).join(", ")}${_names.length > 3 ? "…" : ""}). There is no coast-to-coast march for a fleet. Either <strong>Leave/Transfer</strong> the ships into this province's garrison in an earlier phase and march without them, or sail instead — from a land province a fleet may only move to an <strong>adjacent sea province</strong>.`);
	}
	if (an.allAerial) return good(kcHtml`🦅 <strong>Flying move</strong> — every unit is winged, so the column crosses land and sea alike and needs no fleet.`);
	if (an.lifted) return good(kcHtml`🦅 <strong>Flying move</strong> — the ${an.flyers} humanoid flyer${an.flyers !== 1 ? "s" : ""} lift the whole column${where}; land and sea are both open to it.`);
	if (an.allSea) {
		if (destSea) return good(kcHtml`⛵ <strong>Naval move</strong> — a fleet of ${an.total} at sea${where}.`);
		return fromSea ? good(kcHtml`⛵ <strong>Coastal landing</strong> — the fleet puts in${where}. A landing is only possible on a <strong>coastal</strong> province; an inland hex will turn it back.`) : warn(kcHtml`⛵ <strong>Naval move</strong> — this column is all ships and sea-beasts. From a land province its only legal move is to an <strong>adjacent sea province</strong>; it cannot march overland.`);
	}
	if (destSea) {
		if (an.cap !== "land") {
			const carried = an.landCount;
			return good(kcHtml`⛵ <strong>Naval move</strong> — ${String(an.hulls)} hull${an.hulls !== 1 ? "s" : ""}${an.navalL8 ? " (Naval 8: each carries double)" : ""}${an.flyers ? ` and ${String(an.flyers)} flyer${an.flyers !== 1 ? "s" : ""}` : ""} carry ${String(carried)} land unit${carried !== 1 ? "s" : ""} out to sea.`);
		}
		return bad(kcHtml`⚠ <strong>Not enough lift for a sea crossing.</strong> ${theNameOfTheHero(ch)} leads ${String(an.landCount)} land unit${an.landCount !== 1 ? "s" : ""} but only ${String(an.hulls)} hull${an.hulls !== 1 ? "s" : ""}${an.flyers ? ` and ${String(an.flyers)} humanoid flyer${an.flyers !== 1 ? "s" : ""}` : " and no flyers"}. About ${String(an.short)} unit${an.short !== 1 ? "s" : ""} would be left ashore${an.shortNames.length ? ` (${an.shortNames.slice(0, 3).join(", ")}${an.shortNames.length > 3 ? "…" : ""})` : ""}. Recruit or bring more ships, send the surplus elsewhere, or choose a land province.`);
	}
	const bits = [];
	if (an.aerial) bits.push(`${String(an.aerial)} winged unit${an.aerial !== 1 ? "s" : ""} march with the rest`);
	if (_navalAboard > 0) {
		if (fromSea) return good(kcHtml`⛵ <strong>Coastal landing</strong>${where} — the ships put in and the land units come ashore.${bits.length ? ` (${bits.join("; ")}.)` : ""} Once ashore the column cannot march on while it still leads ships: leave them in the garrison first.`);
		return warn(kcHtml`⚠ <strong>Land march with ships in the column.</strong> ${theNameOfTheHero(ch)} leads ${_navalAboard} naval unit${_navalAboard !== 1 ? "s" : ""}, and a column carrying ships or sea-beasts <strong>cannot step from one land province to another</strong> — if this leg turns out to start and end on land the order will be refused. Leave the hulls behind to march, or sail to an adjacent sea province.${bits.length ? ` (${bits.join("; ")}.)` : ""}`);
	}
	return good(kcHtml`🛡 <strong>Land march</strong>${where}${destKnown ? "" : " (destination not yet mapped)"}${bits.length ? ` — ${bits.join("; ")}.` : "."}`);
}
function moveOriginProv(charId, ph) {
	const provs = currentReport?.worldMeta?.provinces ?? [];
	const loc = predictedLocation(charId, ph);
	if (!loc) return null;
	return provs.find((p) => p.id === loc.id) ?? {
		id: loc.id,
		name: loc.name
	};
}
function refreshMoveModeNote(charId, ph) {
	const charIdInWords = String(charId);
	const host = document.getElementById(`po-move-mode-${charIdInWords}-${String(ph)}`);
	if (!host) return;
	const ch = (currentReport?.characters ?? []).find((c) => String(c.id) === charIdInWords);
	if (!ch) {
		host.innerHTML = "";
		return;
	}
	const tgt = theTargetOfTheOrderInWords(charId, ph).trim();
	const provs = currentReport?.worldMeta?.provinces ?? [];
	let dest = null;
	if (tgt.startsWith("prov:")) {
		const id = parseInt(tgt.slice(5));
		if (!isNaN(id)) dest = provs.find((p) => p.id === id) ?? null;
	}
	host.innerHTML = String(poMoveModeNote(ch, dest, projectedMoveHost(charId, ph), moveOriginProv(charId, ph)));
}
function refreshAllMoveModeNotes() {
	(currentReport?.characters ?? []).forEach((c) => {
		if (!c || c.alive === false) return;
		for (let p = 0; p <= 4; p++) if (document.getElementById(`po-move-mode-${String(c.id)}-${String(p)}`)) refreshMoveModeNote(c.id, p);
	});
}
function lastMoveDirOf(charId, beforePhase) {
	const report = currentReport;
	if (!report?.worldMeta) return null;
	const wm = report.worldMeta, cols = wm.cols, rows = wm.rows, provs = wm.provinces;
	const HEX = KC_HEX_DIRS.slice();
	let found = null;
	for (let ph = 0; ph < beforePhase; ph++) {
		const actionField = document.getElementById(`po-action-${String(charId)}-${String(ph)}`);
		if ((actionField ? theValueOfAField(actionField) : void 0) !== "Move") continue;
		const tgt = theTargetOfTheOrderInWords(charId, ph).trim();
		if (!tgt) continue;
		if (tgt.startsWith("dir:")) {
			const d = tgt.slice(4);
			if (HEX.includes(d)) found = d;
			continue;
		}
		if (!tgt.startsWith("prov:")) continue;
		const toId = parseInt(tgt.slice(5));
		if (isNaN(toId)) continue;
		const from = predictedLocation(charId, ph);
		if (!from) continue;
		const fp = provs.find((p) => p.id === from.id);
		if (!fp || theRowOf(fp) == null) continue;
		if (toId === fp.id) continue;
		for (const d of HEX) if (theHexNextToAProvinceInADirection(fp, d, cols, rows) === toId) {
			found = d;
			break;
		}
	}
	return found;
}
var DUEL_STANCES = [
	{
		code: "challenge",
		label: "⚔ Challenge — ride out and demand single combat"
	},
	{
		code: "accept",
		label: "🛡 Accept — will not initiate, but will answer a challenge"
	},
	{
		code: "refuse",
		label: "🏳 Refuse — will not duel (−20% strength if challenged)"
	}
];
var ENCOUNTER_TACTICS = [
	{
		code: "ME",
		label: "Melee — close and fight in hand-to-hand combat"
	},
	{
		code: "FI",
		label: "Fire Arrow — move to bow range and shoot (requires Archery skill; 2 arrows at Archery 3+)"
	},
	{
		code: "CA",
		label: "Cast Spell — combat spells: Lightning Bolt, Fireball, Psychic Blast, Telekinetic Storm, Hand of Death, Curse, Control Undead, Holy Symbol, Spiritwrack, Mirror Image, Invisibility, Charm",
		hasSpell: true
	},
	{
		code: "CS",
		label: "Cast from School — during the pre-battle magic phase, cast a RANDOM battle spell from a chosen school (White, Elemental, Psychic or Necromancy)",
		hasSchool: true
	},
	{
		code: "TA",
		label: "Talk — attempt to negotiate or parley",
		retired: true
	},
	{
		code: "ST",
		label: "Steal — attempt to steal treasure (requires Thief skill)"
	},
	{
		code: "FL",
		label: "Flee — attempt to escape from the encounter (does not affect duels; see Duel stance)"
	},
	{
		code: "SC",
		label: "Scout — scout the lair for secrets and special functions",
		retired: true
	}
];
var ENCOUNTER_VALID = theCombatSpellsBySchool();
var HEIR_TEMPERS_LIST = KC_TEMPERS.slice();
function heirBaseSkills(c) {
	return c?._heirBase ?? c?.skills ?? {};
}
function heirAddedTo(c, skill) {
	const b = heirBaseSkills(c);
	return (Number(c.skills?.[skill]) || 0) - (Number(b[skill]) || 0);
}
function heirTotalAdded(c) {
	const b = heirBaseSkills(c), s = c.skills ?? {}, keys = /* @__PURE__ */ new Set([...Object.keys(s), ...Object.keys(b)]);
	let t = 0;
	keys.forEach((k) => {
		t += Math.max(0, (Number(s[k]) || 0) - (Number(b[k]) || 0));
	});
	return t;
}
function heirPointsRemaining(c) {
	return 4 - heirTotalAdded(c);
}
function heirSelectorHTML(chars) {
	const heir = (chars ?? []).find((c) => c._isHeir);
	if (!heir) return "";
	const remaining = heirPointsRemaining(heir);
	const pip = (skill) => {
		const lvl = Number(heir.skills?.[skill]) || 0;
		const added = heirAddedTo(heir, skill);
		const displayName = (theSkillsNames$2[skill] ?? "") || skill;
		const minusOff = added <= 0;
		const plusOff = remaining <= 0 || added >= 2;
		return kcHtml`<div class="skill-pip">
      <button onclick="allocateHeirSkill(${kcArg(heir.id)},${kcArg(skill)},-1)" ${minusOff ? "disabled" : ""}>−</button>
      <span class="sk-name" onmousemove="showSkillTip(event,${kcArg(skill)})" onmouseleave="hideSkillTip()">${displayName}</span>
      <span class="sk-val">${lvl}</span>
      <button onclick="allocateHeirSkill(${kcArg(heir.id)},${kcArg(skill)},1)" ${plusOff ? "disabled" : ""}>+</button>
    </div>`;
	};
	const grid = kcHtml`<div class="skill-cols">${SKILL_COLUMNS.map((col) => kcHtml`<div class="skill-col"><div class="skill-col-head">${col.head}</div>${col.skills.map(pip)}</div>`)}</div>`;
	return kcHtml`<div style="background:#fff8e8;border:2px solid var(--gold);border-radius:3px;padding:10px 12px;margin-bottom:14px">
    <div style="font-family:'Cinzel',serif;font-size:.82rem;color:var(--gold);margin-bottom:4px">👑 Royal Succession — Name, Temper &amp; Skills</div>
    <div style="font-size:.76rem;color:#444;margin-bottom:8px">A new monarch has risen. Name them, choose their Temper, and spend their <strong>${remaining}</strong> remaining skill point${remaining !== 1 ? "s" : ""} before submitting orders. New skills take effect this turn — buy a magic school and you can cast from it right away.</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px">
      <label style="font-size:.74rem;color:#231e16">Name
        <input id="heir-name" value="${heir.name ?? ""}" maxlength="40" oninput="setHeirName(${kcArg(heir.id)},this.value)"
          style="margin-left:4px;font-size:.76rem;padding:3px 6px;border:1px solid var(--stone);border-radius:2px;width:200px">
      </label>
      <label style="font-size:.74rem;color:#231e16">Temper
        <select id="heir-temper" onchange="setHeirTemper(${kcArg(heir.id)},this.value)"
          style="margin-left:4px;font-size:.76rem;padding:3px 6px;border:1px solid var(--stone);border-radius:2px">
          ${HEIR_TEMPERS_LIST.map((t) => kcHtml`<option value="${t}"${heir.temper === t ? " selected" : ""}>${t}</option>`)}
        </select>
      </label>
      <span class="pts-remaining" style="margin-left:auto">${remaining} point${remaining !== 1 ? "s" : ""} remaining</span>
    </div>
    ${grid}
  </div>`;
}
function heroOrderFromOrdersP(existingOrders) {
	try {
		const heroOrder = theHeroOrderHeld(typeof existingOrders === "string" ? JSON.parse(existingOrders || "{}") : theOrdersOrNone(existingOrders));
		return Array.isArray(heroOrder) && heroOrder.length ? heroOrder.map(String) : null;
	} catch {
		return null;
	}
}
function applyHeroOrderP(chars, order) {
	const list = [...chars ?? []];
	if (order?.length) {
		const rank = new Map(order.map((id, i) => [String(id), i]));
		list.sort((a, b) => (rank.get(String(a.id)) ?? 1e9) - (rank.get(String(b.id)) ?? 1e9));
		return list;
	}
	return list.sort((a, b) => (a.isKing || a._isHeir ? 0 : 1) - (b.isKing || b._isHeir ? 0 : 1));
}
function heroBlocksP() {
	const form = document.getElementById("orders-form");
	return form ? [...form.querySelectorAll(":scope > .orders-char-block[data-hero]")] : [];
}
function heroGroupP(block) {
	const g = [block];
	let n = block.nextElementSibling;
	while (n && !(n.classList.contains("orders-char-block") && n.hasAttribute("data-hero"))) {
		g.push(n);
		n = n.nextElementSibling;
	}
	return g;
}
function currentHeroOrderP() {
	const fromDom = heroBlocksP().map((b) => b.getAttribute("data-hero"));
	return fromDom.length ? fromDom : (_heroOrder ?? []).slice();
}
function refreshHeroMoveButtonsP() {
	const blocks = heroBlocksP();
	blocks.forEach((b, i) => {
		const up = b.querySelector(".hero-move-up"), dn = b.querySelector(".hero-move-down");
		if (up instanceof HTMLButtonElement) up.disabled = i === 0;
		if (dn instanceof HTMLButtonElement) dn.disabled = i >= blocks.length - 1;
	});
}
function epRowHtml(charId, t, i, n) {
	return kcHtml`<div draggable="true" data-char="${charId}" data-idx="${i}"
      ondragstart="epDragStart(event,${kcArg(String(charId))},${kcArg(i)})"
      ondragover="event.preventDefault();this.style.outline='2px solid var(--crimson)'"
      ondragleave="this.style.outline=''"
      ondrop="epDropTactic(event,${kcArg(String(charId))},${kcArg(i)});this.style.outline=''"
      style="display:flex;align-items:center;gap:6px;background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px 8px;cursor:grab">
      <span style="color:#bbb;font-size:.9rem;cursor:grab" title="Drag to reorder">⠿</span>
      <span style="font-family:'Cinzel',serif;font-size:.72rem;color:var(--stone);min-width:16px">${i + 1}.</span>
      <span style="font-size:.8rem;flex:1">${tacticLabel(t)}</span>
      <button type="button" onclick="epMoveTactic(${kcArg(String(charId))},${kcArg(i)},-1)" ${i === 0 ? "disabled" : ""} title="Move up" style="background:var(--parchment-dark);border:1px solid var(--stone);border-radius:2px;padding:1px 5px;cursor:pointer;font-size:.7rem">▲</button>
      <button type="button" onclick="epMoveTactic(${kcArg(String(charId))},${kcArg(i)},1)" ${i >= n - 1 ? "disabled" : ""} title="Move down" style="background:var(--parchment-dark);border:1px solid var(--stone);border-radius:2px;padding:1px 5px;cursor:pointer;font-size:.7rem">▼</button>
      <button type="button" onclick="removeEncounterTactic(${kcArg(String(charId))},${kcArg(i)})" style="background:var(--crimson);color:#fff;border:none;border-radius:2px;padding:1px 6px;cursor:pointer;font-size:.7rem">✕</button>
    </div>`;
}
function tacticLabel(code) {
	if (code.startsWith("CA:")) return `Cast Spell — ${code.slice(3)}`;
	if (code.startsWith("CS:")) {
		const school = code.slice(3);
		return `Pre-battle: random ${(theSkillsNames$2[school] ?? "") || school} spell`;
	}
	const baseCode = code.split(":")[0];
	return (ENCOUNTER_TACTICS.find((et) => et.code === baseCode)?.label ?? "") || code;
}
function refreshEncounterPlan(charId, tactics) {
	const list = document.getElementById(`ep-list-${String(charId)}`);
	if (!list) return;
	list.innerHTML = String(kcHtml`${tactics.map((t, i) => epRowHtml(String(charId), t, i, tactics.length))}`);
}
var SKILL_COLUMNS = [
	{
		head: "⚔ Martial",
		skills: [
			"melee",
			"archery",
			"tactical",
			"march",
			"naval"
		]
	},
	{
		head: "✦ Special",
		skills: [
			"sage",
			"spy",
			"thief",
			"druid",
			"explorer"
		]
	},
	{
		head: "✨ Magic",
		skills: KC_MAGIC_SCHOOLS.slice()
	}
];
// src/ui/player/map.ts
/** The tables read by a key of words: the terrains' colours, the races' badges, the map's symbols. */
var theTerrainsColours = TERRAIN_COLORS_MAP;
var theRacesBadges = MAP_RACE_BADGE;
var theMapsSymbols = MAP_SYM;
/** Whether the popup is held open (its `_sticky` mark, set by a tap). */
function isHeldOpen(tt) {
	return Boolean(Reflect.get(tt, "_sticky"));
}
/** What was clicked, as `contains` reads it: none for none, and a TypeError for a target that isn't a node, as
*  `contains` threw. */
function theNodeClicked(target) {
	if (target === null || target instanceof Node) return target;
	throw new TypeError("Failed to execute 'contains' on 'Node': the target is not a node");
}
/** A hero's block of the form, at an index the code has just made sure of: a TypeError for none, as the read did. */
function theBlockAt(blocks, i) {
	const b = blocks[i];
	if (b === void 0) throw new TypeError(`Cannot read properties of undefined (reading the hero block ${String(i)})`);
	return b;
}
/** A node's parent, which a hero's block in the form always has: a TypeError for none, as the read did. */
function theParentOfTheBlock(n) {
	const parent = n.parentNode;
	if (parent === null) throw new TypeError("Cannot read properties of null (reading a hero block's parent)");
	return parent;
}
/** `Array.isArray` on the heroes a province lists (typed `readonly`, which it narrows to `any[]`), their type kept. */
function isAListOfHeroes(x) {
	return Array.isArray(x);
}
/** The orders a seat holds as an object (not words), or `{}` for none: `gp.orders || {}`. */
function theOrdersHeldOrNone(held) {
	if (held) return held;
	return {};
}
var _PROV_LINK_SKIP = /* @__PURE__ */ new Set([
	"SCRIPT",
	"STYLE",
	"BUTTON",
	"SELECT",
	"OPTION",
	"TEXTAREA",
	"INPUT",
	"A",
	"svg",
	"SVG",
	"LABEL"
]);
var _provNameRe = null;
var _provNameMap = null;
var _provNameKey = "";
function _buildProvNameIndex(report) {
	const map = /* @__PURE__ */ new Map();
	const add = (id, name) => {
		if (id == null || !name || typeof name !== "string") return;
		const n = name.trim();
		if (n.length < 3) return;
		if (!map.has(n)) map.set(n, id);
	};
	(report?.worldMeta?.provinces ?? []).forEach((p) => {
		add(p.id, p.name);
	});
	(report?.ownedProvinces ?? []).forEach((p) => {
		add(p.id, p.name);
	});
	const key = [...map.keys()].sort().join("|");
	if (key === _provNameKey) return;
	_provNameKey = key;
	_provNameMap = map;
	const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const names = [...map.keys()].sort((a, b) => b.length - a.length).map(esc);
	_provNameRe = names.length ? new RegExp("(?<![A-Za-zÀ-ɏ])(" + names.join("|") + ")(?![A-Za-zÀ-ɏ])", "g") : null;
}
function highlightMapProv(id, on) {
	document.querySelectorAll(".prov-hl").forEach((n) => {
		n.remove();
	});
	if (!on) return;
	const ns = "http://www.w3.org/2000/svg";
	[...document.querySelectorAll(`svg g[data-prov="${String(id)}"]`)].filter((g) => g instanceof SVGElement).forEach((g) => {
		const poly = g.querySelector("polygon");
		const svg = g.ownerSVGElement;
		if (!poly || !svg) return;
		const hl = document.createElementNS(ns, "polygon");
		hl.setAttribute("points", String(poly.getAttribute("points")));
		hl.setAttribute("fill", "#fff");
		hl.setAttribute("fill-opacity", ".3");
		hl.setAttribute("stroke", "#ffe27a");
		hl.setAttribute("stroke-width", "3");
		hl.setAttribute("stroke-linejoin", "round");
		hl.setAttribute("pointer-events", "none");
		hl.setAttribute("class", "prov-hl");
		hl.setAttribute("filter", "drop-shadow(0 0 3px #ffe27a)");
		svg.appendChild(hl);
	});
}
function renderMapIntoSvg(svgEl, report) {
	const svgNS = "http://www.w3.org/2000/svg";
	svgEl.innerHTML = "";
	_rebuildGraveIntelIndex(report);
	const worldMeta = report.worldMeta;
	if (!worldMeta) {
		const t = document.createElementNS(svgNS, "text");
		t.setAttribute("x", "10");
		t.setAttribute("y", "30");
		t.setAttribute("fill", "#aaa");
		t.setAttribute("font-size", "14");
		t.textContent = "Map not available — awaiting Turn 0";
		svgEl.appendChild(t);
		return;
	}
	const { cols, rows, provinces: provs } = worldMeta;
	if (!asItsGuardReadsIt(provs) || provs.length === 0) return;
	const centreCol = worldMeta.centreCol != null && cols > 0 ? worldMeta.centreCol : null;
	const colShift = centreCol == null ? 0 : Math.floor(cols / 2) - centreCol;
	function displayCol(col) {
		return cols > 0 ? ((col + colShift) % cols + cols) % cols : col;
	}
	const HS = 22;
	function hexCentre(col, row) {
		return {
			x: col * HS * 1.75 + row % 2 * HS * .875 + HS,
			y: row * HS * 1.52 + HS
		};
	}
	function hexPts(cx, cy, r) {
		r = Number(r) || 20.5;
		return Array.from({ length: 6 }, (_, i) => {
			const a = Math.PI / 180 * (60 * i - 30);
			return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
		}).join(" ");
	}
	const c0 = hexCentre(0, 0), c1 = hexCentre(cols - 1, rows - 1);
	const pad = HS * 1.5;
	svgEl.setAttribute("viewBox", `${String(c0.x - pad)} ${String(c0.y - pad)} ${String(c1.x - c0.x + 66 + HS)} ${String(c1.y - c0.y + 66 + HS)}`);
	const playerColor = (report.kingdom?.color ?? "") || "#fcb4c0";
	const ownedIds = new Set((report.ownedProvinces ?? []).map((p) => p.id));
	const visitedIds = /* @__PURE__ */ new Set([...report.visitedProvinceIds ?? [], ...ownedIds]);
	const adjacentIds = /* @__PURE__ */ new Set();
	provs.forEach((p) => {
		if (visitedIds.has(p.id)) (p.neighbors ?? []).forEach((nid) => {
			if (!visitedIds.has(nid)) adjacentIds.add(nid);
		});
	});
	const provById = {};
	provs.forEach((p) => provById[p.id] = p);
	(report.ownedProvinces ?? []).forEach((op) => {
		const _wm = provById[op.id];
		provById[op.id] = {
			..._wm,
			...op,
			characters: _wm && isAListOfHeroes(_wm.characters) ? _wm.characters : op.characters
		};
	});
	let ttFound = document.getElementById("map-tooltip");
	if (!ttFound) {
		ttFound = document.createElement("div");
		ttFound.id = "map-tooltip";
		ttFound.style.cssText = "position:fixed;background:#1a1208;color:#f2e8d0;border:1px solid #c8922a;padding:8px 12px;font-size:.78rem;line-height:1.6;pointer-events:none;z-index:99999;max-width:220px;display:none;border-radius:2px;font-family:\"Crimson Text\",serif;box-shadow:0 4px 16px rgba(0,0,0,.6)";
		document.body.appendChild(ttFound);
	}
	const tt = ttFound;
	const symbolLayer = document.createElementNS(svgNS, "g");
	symbolLayer.setAttribute("pointer-events", "none");
	provs.forEach((p) => {
		if (asItsGuardReadsIt(p.row) === void 0 || asItsGuardReadsIt(p.col) === void 0) return;
		const { x, y } = hexCentre(displayCol(p.col), p.row);
		const pd = provById[p.id] ?? p;
		const tier = (pd.tier ?? "") || (ownedIds.has(p.id) ? "owned" : "unknown");
		const isOwned = tier === "owned";
		const isRemembered = tier === "remembered";
		const isVisited = (tier === "live" || tier === "border" || tier === "remembered") && !isOwned;
		const isAdj = tier === "border";
		const known = tier !== "unknown";
		const g = document.createElementNS(svgNS, "g");
		g.setAttribute("data-prov", String(p.id));
		const fill = document.createElementNS(svgNS, "polygon");
		fill.setAttribute("points", hexPts(x, y));
		if (known && pd.terrain) {
			fill.setAttribute("fill", (theTerrainsColours[pd.terrain] ?? "") || "#555");
			fill.setAttribute("opacity", isOwned ? "1" : tier === "live" || tier === "border" ? "0.85" : isRemembered ? "0.45" : "0.5");
		} else {
			fill.setAttribute("fill", "#555");
			fill.setAttribute("opacity", "1");
		}
		fill.setAttribute("stroke", "rgba(0,0,0,0.4)");
		fill.setAttribute("stroke-width", "0.5");
		g.appendChild(fill);
		if (known && pd.terrain) makeTerrainIcon(svgNS, x, y - 2, pd.terrain).forEach((el) => g.appendChild(el));
		if (isOwned) {
			const ol = document.createElementNS(svgNS, "polygon");
			ol.setAttribute("points", hexPts(x, y, 21.5));
			ol.setAttribute("fill", "none");
			ol.setAttribute("stroke", playerColor);
			ol.setAttribute("stroke-width", "2.5");
			ol.setAttribute("pointer-events", "none");
			g.appendChild(ol);
		} else if (pd.ownerName && (isVisited || isAdj)) {
			const ol = document.createElementNS(svgNS, "polygon");
			ol.setAttribute("points", hexPts(x, y, 21.5));
			ol.setAttribute("fill", "none");
			const ownerBorderColor = (pd.ownerColor ?? "") || "rgba(255,255,255,0.45)";
			ol.setAttribute("stroke", ownerBorderColor);
			ol.setAttribute("stroke-width", isVisited ? "2" : "1.2");
			ol.setAttribute("opacity", isVisited ? "0.8" : "0.5");
			ol.setAttribute("pointer-events", "none");
			g.appendChild(ol);
		}
		if (pd.name && known) {
			const lbl = document.createElementNS(svgNS, "text");
			const lblY = pd.explored !== void 0 && Number(pd.explored) > 0 ? y + HS - 10 : y + HS - 7;
			lbl.setAttribute("x", String(x));
			lbl.setAttribute("y", String(lblY));
			lbl.setAttribute("text-anchor", "middle");
			lbl.setAttribute("dominant-baseline", "middle");
			lbl.setAttribute("font-size", "4.2");
			lbl.setAttribute("fill", isOwned ? "#fff" : isVisited ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)");
			lbl.setAttribute("pointer-events", "none");
			lbl.setAttribute("font-family", "Cinzel,serif");
			lbl.textContent = pd.name.length > 10 ? pd.name.substring(0, 9) + "…" : pd.name;
			g.appendChild(lbl);
			if (pd.explored !== void 0 && Number(pd.explored) > 0) {
				const el = document.createElementNS(svgNS, "text");
				el.setAttribute("x", String(x));
				el.setAttribute("y", String(y + HS - 3));
				el.setAttribute("text-anchor", "middle");
				el.setAttribute("font-size", "3.5");
				el.setAttribute("fill", isOwned ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.4)");
				el.setAttribute("pointer-events", "none");
				el.textContent = String(pd.explored) + "%";
				g.appendChild(el);
			}
		}
		if (pd.wealth) {
			const wStyles = {
				Rich: {
					fill: "#FFD700",
					stroke: "#FFA500",
					glow: "drop-shadow(0 0 1.5px #FFD700)"
				},
				Prosperous: {
					fill: "#C0C0C0",
					stroke: "#A8A8A8",
					glow: null
				},
				Poor: {
					fill: "#CD7F32",
					stroke: "#A0522D",
					glow: null
				}
			};
			const ws = wStyles[pd.wealth] ?? wStyles.Poor;
			const dotX = x - HS * .477;
			const dotY = y - HS * .5;
			const dot = document.createElementNS(svgNS, "circle");
			dot.setAttribute("cx", String(dotX));
			dot.setAttribute("cy", String(dotY));
			dot.setAttribute("r", "1.75");
			dot.setAttribute("fill", ws.fill);
			dot.setAttribute("stroke", ws.stroke);
			dot.setAttribute("stroke-width", "0.5");
			if (ws.glow) dot.setAttribute("filter", ws.glow);
			dot.setAttribute("pointer-events", "none");
			dot.setAttribute("class", "sym-prosper");
			symbolLayer.appendChild(dot);
		}
		if ((isOwned || isVisited) && pd.characters?.length) {
			const ownChars = pd.characters.filter((c) => c.isOwn);
			const enemyChars = pd.characters.filter((c) => !c.isOwn && !c.isWanderer && !c.isNeutralGuard && c.ownerColor);
			const chieftains = pd.characters.filter((c) => !c.isOwn && c.isNeutralGuard);
			const wanderers = pd.characters.filter((c) => !c.isOwn && !c.isNeutralGuard && (Boolean(c.isWanderer) || !c.ownerColor));
			let markerX = x + HS - 11;
			if (ownChars.length > 0) {
				const mx = markerX, my = y - HS + 12;
				const mg = document.createElementNS(svgNS, "g");
				mg.setAttribute("transform", `translate(${String(mx)} ${String(my)}) scale(0.75) translate(${String(-mx)} ${String(-my)})`);
				const circ = document.createElementNS(svgNS, "circle");
				circ.setAttribute("cx", String(mx));
				circ.setAttribute("cy", String(my));
				circ.setAttribute("r", "5");
				circ.setAttribute("fill", playerColor);
				circ.setAttribute("stroke", "#fff");
				circ.setAttribute("stroke-width", "1");
				circ.setAttribute("pointer-events", "none");
				const clbl = document.createElementNS(svgNS, "text");
				clbl.setAttribute("x", String(mx));
				clbl.setAttribute("y", String(my + 2));
				clbl.setAttribute("text-anchor", "middle");
				clbl.setAttribute("font-size", "5.5");
				clbl.setAttribute("fill", "#fff");
				clbl.setAttribute("pointer-events", "none");
				const hasKing = ownChars.some((c) => c.isKing);
				if (hasKing) mapTextGlyph(clbl, "♛");
				else clbl.textContent = ownChars.length > 1 ? String(ownChars.length) : "";
				mg.appendChild(circ);
				mg.appendChild(clbl);
				if (!hasKing && ownChars.length === 1) {
					const hd = document.createElementNS(svgNS, "circle");
					hd.setAttribute("cx", String(mx));
					hd.setAttribute("cy", String(my - 1.5));
					hd.setAttribute("r", "1.8");
					hd.setAttribute("fill", "#fff");
					hd.setAttribute("pointer-events", "none");
					const sh = document.createElementNS(svgNS, "path");
					sh.setAttribute("d", `M${String(mx - 2.8)},${String(my + 2.2)} Q${String(mx)},${String(my + .5)} ${String(mx + 2.8)},${String(my + 2.2)}`);
					sh.setAttribute("fill", "#fff");
					sh.setAttribute("pointer-events", "none");
					mg.appendChild(hd);
					mg.appendChild(sh);
				}
				mg.setAttribute("class", "sym-char");
				symbolLayer.appendChild(mg);
				markerX -= 8;
			}
			if (enemyChars.length > 0) {
				const mx = markerX, my = y - HS + 12;
				const mg = document.createElementNS(svgNS, "g");
				mg.setAttribute("transform", `translate(${String(mx)} ${String(my)}) scale(0.75) translate(${String(-mx)} ${String(-my)})`);
				const realmCols = [...new Set(enemyChars.map((c) => (c.ownerColor ?? "") || "#7a1c1c"))];
				const ec = document.createElementNS(svgNS, "g");
				ec.setAttribute("pointer-events", "none");
				if (realmCols.length === 1) {
					const c1 = document.createElementNS(svgNS, "circle");
					c1.setAttribute("cx", String(mx));
					c1.setAttribute("cy", String(my));
					c1.setAttribute("r", "4.5");
					c1.setAttribute("fill", String(realmCols[0]));
					c1.setAttribute("stroke", "#fff");
					c1.setAttribute("stroke-width", "0.8");
					ec.appendChild(c1);
				} else {
					const R = 4.5, n = realmCols.length;
					realmCols.forEach((col, i) => {
						const a0 = -Math.PI / 2 + 2 * Math.PI * i / n, a1 = -Math.PI / 2 + 2 * Math.PI * (i + 1) / n;
						const x0 = mx + R * Math.cos(a0), y0 = my + R * Math.sin(a0), x1 = mx + R * Math.cos(a1), y1 = my + R * Math.sin(a1);
						const w = document.createElementNS(svgNS, "path");
						w.setAttribute("d", `M${String(mx)},${String(my)} L${x0.toFixed(2)},${y0.toFixed(2)} A${String(R)},${String(R)} 0 ${String(a1 - a0 > Math.PI ? 1 : 0)},1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`);
						w.setAttribute("fill", col);
						ec.appendChild(w);
					});
					const ring = document.createElementNS(svgNS, "circle");
					ring.setAttribute("cx", String(mx));
					ring.setAttribute("cy", String(my));
					ring.setAttribute("r", "4.5");
					ring.setAttribute("fill", "none");
					ring.setAttribute("stroke", "#fff");
					ring.setAttribute("stroke-width", "0.8");
					ec.appendChild(ring);
				}
				const elbl = document.createElementNS(svgNS, "text");
				elbl.setAttribute("x", String(mx));
				elbl.setAttribute("y", String(my + 2));
				elbl.setAttribute("text-anchor", "middle");
				elbl.setAttribute("font-size", "5");
				elbl.setAttribute("fill", "#fff");
				elbl.setAttribute("pointer-events", "none");
				const eHasKing = enemyChars.some((c) => c.isKing);
				if (eHasKing) mapTextGlyph(elbl, "♛");
				else elbl.textContent = enemyChars.length > 1 ? String(enemyChars.length) : "";
				mg.appendChild(ec);
				mg.appendChild(elbl);
				if (!eHasKing && enemyChars.length === 1) {
					const ehd = document.createElementNS(svgNS, "circle");
					ehd.setAttribute("cx", String(mx));
					ehd.setAttribute("cy", String(my - 1.5));
					ehd.setAttribute("r", "1.8");
					ehd.setAttribute("fill", "#fff");
					ehd.setAttribute("pointer-events", "none");
					const esh = document.createElementNS(svgNS, "path");
					esh.setAttribute("d", `M${String(mx - 2.8)},${String(my + 2.2)} Q${String(mx)},${String(my + .5)} ${String(mx + 2.8)},${String(my + 2.2)}`);
					esh.setAttribute("fill", "#fff");
					esh.setAttribute("pointer-events", "none");
					mg.appendChild(ehd);
					mg.appendChild(esh);
				}
				mg.setAttribute("class", "sym-char");
				symbolLayer.appendChild(mg);
				markerX -= 8;
			}
			if (wanderers.length > 0) {
				const mx = markerX, my = y - HS + 12;
				const mg = document.createElementNS(svgNS, "g");
				mg.setAttribute("transform", `translate(${String(mx)} ${String(my)}) scale(0.75) translate(${String(-mx)} ${String(-my)})`);
				const wc = document.createElementNS(svgNS, "circle");
				wc.setAttribute("cx", String(mx));
				wc.setAttribute("cy", String(my));
				wc.setAttribute("r", "4.5");
				wc.setAttribute("fill", "#888");
				wc.setAttribute("stroke", "#fff");
				wc.setAttribute("stroke-width", "1");
				wc.setAttribute("pointer-events", "none");
				const wlbl = document.createElementNS(svgNS, "text");
				wlbl.setAttribute("x", String(mx));
				wlbl.setAttribute("y", String(my + 2));
				wlbl.setAttribute("text-anchor", "middle");
				wlbl.setAttribute("font-size", "5");
				wlbl.setAttribute("fill", "#fff");
				wlbl.setAttribute("pointer-events", "none");
				wlbl.textContent = "?";
				mg.appendChild(wc);
				mg.appendChild(wlbl);
				mg.setAttribute("class", "sym-char");
				symbolLayer.appendChild(mg);
				markerX -= 8;
			}
			if (chieftains.length > 0) {
				const mx = markerX, my = y - HS + 12;
				const mg = document.createElementNS(svgNS, "g");
				mg.setAttribute("transform", `translate(${String(mx)} ${String(my)}) scale(0.75) translate(${String(-mx)} ${String(-my)})`);
				const gc = document.createElementNS(svgNS, "circle");
				gc.setAttribute("cx", String(mx));
				gc.setAttribute("cy", String(my));
				gc.setAttribute("r", "4.5");
				gc.setAttribute("fill", CHIEFTAIN_MARKER_COLOR);
				gc.setAttribute("stroke", "#fff");
				gc.setAttribute("stroke-width", "1");
				gc.setAttribute("pointer-events", "none");
				const glbl = document.createElementNS(svgNS, "text");
				glbl.setAttribute("x", String(mx));
				glbl.setAttribute("y", String(my + 2));
				glbl.setAttribute("text-anchor", "middle");
				glbl.setAttribute("font-size", "5");
				glbl.setAttribute("font-weight", "700");
				glbl.setAttribute("fill", "#fff");
				glbl.setAttribute("pointer-events", "none");
				glbl.textContent = "!";
				mg.appendChild(gc);
				mg.appendChild(glbl);
				mg.setAttribute("class", "sym-char");
				symbolLayer.appendChild(mg);
			}
		}
		if (isOwned || isVisited) {
			if ((report.visibleDeadHeroes ?? []).filter((d) => d.locationId === pd.id).length > 0) {
				const dx = x - HS + 8, dy = y + HS - 10;
				const dt = document.createElementNS(svgNS, "text");
				dt.setAttribute("x", String(dx));
				dt.setAttribute("y", String(dy));
				dt.setAttribute("text-anchor", "middle");
				dt.setAttribute("font-size", "6");
				dt.setAttribute("stroke", "#241a12");
				dt.setAttribute("stroke-width", "0.35");
				dt.setAttribute("paint-order", "stroke");
				dt.setAttribute("filter", "drop-shadow(0 0 1px rgba(0,0,0,.7))");
				dt.setAttribute("pointer-events", "none");
				const dNode = mapSymSvg(dt, MAP_SYM.dead);
				dNode.setAttribute("class", "sym-dead");
				symbolLayer.appendChild(dNode);
			}
		}
		if (known && pd.race) {
			const rb = theRacesBadges[formatRace(pd.race)];
			if (rb) {
				const rx = x + HS - 7.5, ry = y + HS - 16.5;
				const rg = document.createElementNS(svgNS, "g");
				const rc = document.createElementNS(svgNS, "circle");
				rc.setAttribute("cx", String(rx));
				rc.setAttribute("cy", String(ry));
				rc.setAttribute("r", "3");
				rc.setAttribute("fill", rb.fill);
				rc.setAttribute("stroke", "none");
				rc.setAttribute("opacity", !isOwned && !isVisited ? "0.7" : "1");
				const rt = document.createElementNS(svgNS, "text");
				rt.setAttribute("x", String(rx));
				rt.setAttribute("y", String(ry + 1.4));
				rt.setAttribute("text-anchor", "middle");
				rt.setAttribute("font-size", "4");
				rt.setAttribute("font-weight", "700");
				rt.setAttribute("font-family", "Cinzel,serif");
				rt.setAttribute("fill", rb.text);
				rt.textContent = rb.glyph;
				const rtt = document.createElementNS(svgNS, "title");
				rtt.textContent = formatRace(pd.race) + " province";
				rg.appendChild(rtt);
				rg.appendChild(rc);
				rg.appendChild(rt);
				rg.setAttribute("pointer-events", "none");
				rg.setAttribute("class", "sym-race");
				symbolLayer.appendChild(rg);
			}
		}
		if (isOwned && (pd.garrisonArmies ?? []).length > 0) {
			const gx = x + HS - 13, gy = y + HS - 10;
			const gtxt = document.createElementNS(svgNS, "text");
			gtxt.setAttribute("x", String(gx));
			gtxt.setAttribute("y", String(gy));
			gtxt.setAttribute("text-anchor", "middle");
			gtxt.setAttribute("font-size", "5.5");
			gtxt.setAttribute("fill", "#2c3e6a");
			gtxt.setAttribute("stroke", "#f4ead8");
			gtxt.setAttribute("stroke-width", "0.25");
			gtxt.setAttribute("pointer-events", "none");
			const _gn = (pd.garrisonArmies ?? []).length;
			const _tt = document.createElementNS(svgNS, "title");
			_tt.textContent = `Garrison: ${String(_gn)} unit${_gn !== 1 ? "s" : ""} holding this province`;
			gtxt.setAttribute("pointer-events", "auto");
			gtxt.appendChild(_tt);
			mapSymSvg(gtxt, MAP_SYM.garrison);
			gtxt.setAttribute("class", "sym-garrison");
			symbolLayer.appendChild(gtxt);
		}
		if (pd.hadBattle || pd.battleUnresolved) {
			const bx = x, by = y - HS + 12;
			const btxt = document.createElementNS(svgNS, "text");
			btxt.setAttribute("x", String(bx));
			btxt.setAttribute("y", String(by));
			btxt.setAttribute("text-anchor", "middle");
			btxt.setAttribute("font-size", "9");
			btxt.setAttribute("pointer-events", "auto");
			btxt.setAttribute("filter", "drop-shadow(0 0 2px #000)");
			const _bt = document.createElementNS(svgNS, "title");
			_bt.textContent = pd.battleUnresolved ? "Battle still raging here — it will carry on next turn" : "Battle fought here this turn";
			btxt.appendChild(_bt);
			mapSymSvg(btxt, pd.battleUnresolved ? MAP_SYM.battleOngoing : MAP_SYM.battle);
			btxt.setAttribute("class", "sym-battle");
			symbolLayer.appendChild(btxt);
		}
		if (pd.hadCombat) {
			const cx2 = x + (pd.hadBattle || pd.battleUnresolved ? 12 : 0), cy2 = y - HS + 12;
			const ctx2 = document.createElementNS(svgNS, "text");
			ctx2.setAttribute("x", String(cx2));
			ctx2.setAttribute("y", String(cy2));
			ctx2.setAttribute("text-anchor", "middle");
			ctx2.setAttribute("font-size", "9");
			ctx2.setAttribute("pointer-events", "auto");
			ctx2.setAttribute("filter", "drop-shadow(0 0 2px #000)");
			const _ct = document.createElementNS(svgNS, "title");
			_ct.textContent = "Personal combat fought here this turn — a duel, encounter or assassination attempt, not a field battle";
			ctx2.appendChild(_ct);
			mapSymSvg(ctx2, MAP_SYM.duel);
			ctx2.setAttribute("class", "sym-combat");
			symbolLayer.appendChild(ctx2);
		}
		if (pd.consecrated) {
			const ctxt = document.createElementNS(svgNS, "text");
			ctxt.setAttribute("x", String(x + HS * .42));
			ctxt.setAttribute("y", String(y - HS * .2));
			ctxt.setAttribute("text-anchor", "middle");
			ctxt.setAttribute("font-size", "8");
			ctxt.setAttribute("pointer-events", "none");
			ctxt.setAttribute("filter", "drop-shadow(0 0 2px #000)");
			mapSymSvg(ctxt, MAP_SYM.consecrate);
			ctxt.setAttribute("class", "sym-consec");
			symbolLayer.appendChild(ctxt);
		}
		if (pd.isHomeCapitalOfOwner && pd.ownerColor) {
			const kx = x - HS * .62, ky = y - HS * .145;
			const ktxt = document.createElementNS(svgNS, "text");
			ktxt.setAttribute("x", String(kx));
			ktxt.setAttribute("y", String(ky));
			ktxt.setAttribute("text-anchor", "middle");
			ktxt.setAttribute("font-size", "6.75");
			ktxt.setAttribute("font-weight", "700");
			ktxt.setAttribute("font-family", "Cinzel,serif");
			ktxt.setAttribute("fill", pd.ownerColor);
			ktxt.setAttribute("stroke", "#ffffff");
			ktxt.setAttribute("stroke-width", "0.45");
			ktxt.setAttribute("paint-order", "stroke");
			ktxt.setAttribute("filter", "drop-shadow(0 0 1px rgba(0,0,0,.6))");
			ktxt.setAttribute("pointer-events", "auto");
			const _kt = document.createElementNS(svgNS, "title");
			_kt.textContent = (pd.ownerName ? pd.ownerName + "'s" : "The") + " home capital" + (pd.tier === "remembered" ? " — as last seen" : "");
			ktxt.appendChild(_kt);
			mapSymSvg(ktxt, MAP_SYM.capital, pd.ownerColor);
			ktxt.setAttribute("class", "sym-capital");
			symbolLayer.appendChild(ktxt);
		}
		const _gi = _graveIntelById && asItsGuardReadsIt(pd.id) != null ? _graveIntelById[pd.id] : void 0;
		if (_gi) {
			const _fresh = _gi.turn != null && report.turnNumber != null && _gi.turn === report.turnNumber;
			const vx = x - HS * .62, vy = y + HS * .227;
			const vtxt = document.createElementNS(svgNS, "text");
			vtxt.setAttribute("x", String(vx));
			vtxt.setAttribute("y", String(vy));
			vtxt.setAttribute("text-anchor", "middle");
			vtxt.setAttribute("font-size", "6.4");
			vtxt.setAttribute("font-weight", "700");
			vtxt.setAttribute("stroke", "#000");
			vtxt.setAttribute("stroke-width", "0.3");
			vtxt.setAttribute("paint-order", "stroke");
			vtxt.setAttribute("filter", "drop-shadow(0 0 1px rgba(0,0,0,.7))");
			vtxt.setAttribute("pointer-events", "auto");
			const _vt = document.createElementNS(svgNS, "title");
			_vt.textContent = _fresh ? "Battlefield graves lie here — read this turn, so the dead are certainly still in the ground." : `Battlefield graves were here as of turn ${_gi.turn != null ? String(_gi.turn) : "?"} — they may since have been raised or rotted away.`;
			vtxt.appendChild(_vt);
			const vnode = mapSymSvg(vtxt, _fresh ? MAP_SYM.gravesFresh : MAP_SYM.gravesStale);
			vnode.setAttribute("class", "sym-graves");
			symbolLayer.appendChild(vnode);
		}
		if (Boolean(pd.ownArmyHere) || (pd.characters ?? []).some((c) => c.isOwn && (Number(c.armyCount) || 0) > 0)) {
			const _deadBL = (report.visibleDeadHeroes ?? []).some((d) => d.locationId === pd.id);
			const lx = x - HS + 8 + (_deadBL ? 9 : 0), ly = y + HS - 10;
			const ltxt = document.createElementNS(svgNS, "text");
			ltxt.setAttribute("x", String(lx));
			ltxt.setAttribute("y", String(ly));
			ltxt.setAttribute("text-anchor", "middle");
			ltxt.setAttribute("font-size", "9");
			ltxt.setAttribute("fill", playerColor);
			ltxt.setAttribute("pointer-events", "none");
			ltxt.setAttribute("filter", "drop-shadow(0 0 1.5px #000)");
			mapSymSvg(ltxt, MAP_SYM.flag, playerColor);
			ltxt.setAttribute("class", "sym-flag");
			symbolLayer.appendChild(ltxt);
		}
		if (pd.grandDesign) {
			const _flagGD = Boolean(pd.ownArmyHere) || (pd.characters ?? []).some((c) => c.isOwn && (Number(c.armyCount) || 0) > 0);
			const _deadGD = (report.visibleDeadHeroes ?? []).some((d) => d.locationId === pd.id);
			const _ritGD = (pd.features ?? []).some((f) => f.ritualSite);
			const gx = x - HS + 8 + ((_deadGD ? 9 : 0) + (_flagGD ? 9 : 0) + (_ritGD ? 9 : 0)), gy = y + HS - 10;
			const gtxt = document.createElementNS(svgNS, "text");
			gtxt.setAttribute("x", String(gx));
			gtxt.setAttribute("y", String(gy));
			gtxt.setAttribute("text-anchor", "middle");
			gtxt.setAttribute("font-size", "9");
			gtxt.setAttribute("fill", pd.grandDesign.active ? "#d8a63a" : "#8a8a8a");
			gtxt.setAttribute("pointer-events", "none");
			gtxt.setAttribute("filter", "drop-shadow(0 0 1.5px #000)");
			gtxt.setAttribute("opacity", pd.grandDesign.active ? "1" : "0.45");
			mapSymSvg(gtxt, MAP_SYM.wonder);
			gtxt.setAttribute("class", "sym-wonder");
			symbolLayer.appendChild(gtxt);
		}
		if ((pd.features ?? []).some((f) => f.ritualSite)) {
			const hasFlag = Boolean(pd.ownArmyHere) || (pd.characters ?? []).some((c) => c.isOwn && (Number(c.armyCount) || 0) > 0);
			const _deadBL2 = (report.visibleDeadHeroes ?? []).some((d) => d.locationId === pd.id);
			const mnx = x - HS + 8 + ((_deadBL2 ? 9 : 0) + (hasFlag ? 9 : 0) + (pd.grandDesign ? 9 : 0)), mny = y + HS - 10;
			const mtxt = document.createElementNS(svgNS, "text");
			mtxt.setAttribute("x", String(mnx));
			mtxt.setAttribute("y", String(mny));
			mtxt.setAttribute("text-anchor", "middle");
			mtxt.setAttribute("font-size", "9");
			mtxt.setAttribute("pointer-events", "none");
			mtxt.setAttribute("filter", "drop-shadow(0 0 1.5px #000)");
			mapSymSvg(mtxt, MAP_SYM.ritual);
			mtxt.setAttribute("class", "sym-ritual");
			symbolLayer.appendChild(mtxt);
		}
		if (known) {
			g.style.cursor = "pointer";
			const showTip = (ev) => {
				const h = [kcHtml`<strong style="font-family:'Cinzel',serif;font-size:.8rem">${(pd.name ?? "") || capitalise(pd.terrain) || "Unknown"}</strong><br>`];
				const natives = () => pd.armyTypes?.length ? pd.armyTypes.map((t) => kcHtml`<br>${unitEmoji(t)} ${t}`) : kcHtml`<br>${txtGlyph("⚔")} <span style="opacity:.7;font-style:italic">No native recruitable armies</span>`;
				const lairsAndRites = () => {
					const kf = (pd.features ?? []).filter((f) => !f.cleared);
					const lairs = kf.filter((f) => !f.ritualSite), rituals = kf.filter((f) => f.ritualSite);
					return [
						lairs.length ? kcHtml`<br>${kcJoinP(lairs.map(_lairStar), kcHtml`<br>`)}` : "",
						_lairsClearedNote(pd),
						rituals.length ? kcHtml`<br>\u{1F319} ${rituals.map((f) => f.name).join(", ")} <span style="opacity:.7;font-style:italic">(ritual site${rituals.length !== 1 ? "s" : ""})</span>` : ""
					];
				};
				if (isOwned) {
					h.push(kcHtml`${capitalise(pd.terrain)} · <span style="color:#e8b84b">${pd.tax ?? "?"}g/turn</span> · <span style="color:#8fbc5a">Your province</span>`);
					if (pd.consecrated) h.push(kcHtml`<br><span style="color:#f0d060">\u2728 Consecrated \u2014 holy ground (+50% tax, defenders twice as fanatical, Undead/Evil attackers \u221215%, resurrections return here)</span>`);
					h.push(_grandDesignNote(pd));
					h.push(terrorNoteP(pd));
					h.push(kcHtml`<br>${mapRaceBadgeHtml(formatRace(pd.race))} ${formatRace(pd.race)}`);
					if (pd.explored !== void 0) h.push(kcHtml`<br>\u{1F50D} ${pd.explored}% explored`);
					h.push(lairsAndRites());
					h.push(natives());
					h.push(popupKnownChars(pd, report.visibleDeadHeroes));
					if (pd.neutralDefenders?.length) h.push(kcHtml`${pd.neutralGuard ? kcHtml`<br>\u{1F6E1} ${pd.neutralGuard.name} leads:` : ""}${pd.neutralDefenders.map((d) => kcHtml`<br>${unitEmoji(d.type)} <span style="color:#d8cfbd">${armyLabel(d)}</span>`)}`);
					h.push(_garrisonNote(pd));
					h.push(_graveNote(pd));
				} else if (isVisited) {
					h.push(`${capitalise((pd.terrain ?? "") || "?")} · ${(pd.wealth ?? "") || "?"}`);
					if (pd.race !== void 0) h.push(` · ${formatRace(pd.race)}`);
					h.push(kcHtml`<br>${_ownerLineP(pd)}`);
					h.push(_grandDesignNote(pd));
					h.push(terrorNoteP(pd));
					if (pd.explored !== void 0) h.push(kcHtml`<br>\u{1F50D} ${pd.explored}% explored`);
					h.push(lairsAndRites());
					h.push(natives());
					if (pd.tier === "remembered") h.push(kcHtml`<br><span style="color:#c8922a;font-style:italic">\u{1F441} Last seen turn ${pd.seenTurn ?? "?"}</span>`);
					h.push(popupKnownChars(pd, report.visibleDeadHeroes));
					h.push(_garrisonNote(pd));
					h.push(_graveNote(pd));
				} else {
					h.push(`${capitalise((pd.terrain ?? "") || "?")} terrain · ${(pd.wealth ?? "") || "unknown wealth"}`);
					h.push(kcHtml`<br>${_ownerLineP(pd)}`);
					h.push(_grandDesignNote(pd));
					h.push(terrorNoteP(pd));
					h.push(natives());
					h.push(_graveNote(pd));
				}
				tt.innerHTML = String(kcHtml`${h}<div style="text-align:right;margin-top:8px;border-top:1px solid #4a3a1a;padding-top:6px"><button onclick="_closeMapTip(event)" style="background:#7a1c1c;color:#fff;border:none;padding:6px 14px;border-radius:2px;cursor:pointer;font-family:Cinzel,serif;font-size:.72rem;pointer-events:auto">\u2715 Close</button></div>`);
				tt.style.display = "block";
				tt.style.left = String(ev.clientX + 16) + "px";
				tt.style.top = String(ev.clientY + 16) + "px";
				_clampMapTip(tt);
			};
			g.addEventListener("mousemove", showTip);
			g.addEventListener("mouseleave", () => {
				if (!isHeldOpen(tt)) tt.style.display = "none";
			});
			g.addEventListener("click", (ev) => {
				showTip(ev);
				Reflect.set(tt, "_sticky", true);
				tt.style.pointerEvents = "auto";
				ev.stopPropagation();
			});
		}
		svgEl.appendChild(g);
	});
	svgEl.appendChild(symbolLayer);
}
function _closeMapTip(ev) {
	if (ev) ev.stopPropagation();
	const tt = document.getElementById("map-tooltip");
	if (tt) {
		tt.style.display = "none";
		Reflect.set(tt, "_sticky", false);
		tt.style.pointerEvents = "none";
	}
}
function _clampMapTip(tt) {
	try {
		const r = tt.getBoundingClientRect(), vw = window.innerWidth || 0, vh = window.innerHeight || 0, pad = 8;
		if (!vw || !vh) return;
		let l = r.left, t = r.top;
		if (l + r.width > vw - pad) l = Math.max(pad, vw - pad - r.width);
		if (t + r.height > vh - pad) t = Math.max(pad, vh - pad - r.height);
		if (l < pad) l = pad;
		if (t < pad) t = pad;
		tt.style.left = String(l) + "px";
		tt.style.top = String(t) + "px";
		tt.style.maxHeight = String(Math.max(120, vh - 16)) + "px";
		tt.style.overflowY = "auto";
	} catch {}
}
document.addEventListener("click", (ev) => {
	const tt = document.getElementById("map-tooltip");
	if (!tt || tt.style.display === "none" || !isHeldOpen(tt)) return;
	if (tt.contains(theNodeClicked(ev.target))) return;
	_closeMapTip();
}, true);
document.addEventListener("keydown", (ev) => {
	if (ev.key === "Escape") _closeMapTip();
});
var MAP_ICON_TYPES = [
	{
		key: "char",
		emoji: "👤",
		label: "Heroes"
	},
	{
		key: "flag",
		sym: "flag",
		label: "Army flags"
	},
	{
		key: "garrison",
		sym: "garrison",
		label: "Garrisons"
	},
	{
		key: "battle",
		sym: "battle",
		label: "Battles"
	},
	{
		key: "combat",
		sym: "duel",
		label: "Duels"
	},
	{
		key: "capital",
		sym: "capital",
		label: "Capitals"
	},
	{
		key: "dead",
		sym: "dead",
		label: "Fallen"
	},
	{
		key: "consec",
		sym: "consecrate",
		label: "Consecrated"
	},
	{
		key: "ritual",
		sym: "ritual",
		label: "Ritual sites"
	},
	{
		key: "prosper",
		dot: "#FFD700",
		label: "Prosperity"
	},
	{
		key: "graves",
		sym: "gravesFresh",
		label: "Graves"
	},
	{
		key: "race",
		badge: "Human",
		label: "Races"
	}
];
var _mapIconOff = /* @__PURE__ */ new Set();
function applyMapIconVisibility() {
	let st = document.getElementById("map-icon-style");
	if (!st) {
		st = document.createElement("style");
		st.id = "map-icon-style";
		document.head.appendChild(st);
	}
	st.textContent = [..._mapIconOff].map((k) => `.sym-${k}{display:none!important;}`).join("");
	[...document.querySelectorAll("#map-icon-toggles button[data-icon]")].filter((b) => b instanceof HTMLButtonElement).forEach((b) => {
		const icon = b.getAttribute("data-icon");
		const off = icon !== null && _mapIconOff.has(icon);
		b.style.opacity = off ? "0.4" : "1";
		b.style.textDecoration = off ? "line-through" : "none";
	});
}
function toggleMapIcon(key) {
	if (_mapIconOff.has(key)) _mapIconOff.delete(key);
	else _mapIconOff.add(key);
	applyMapIconVisibility();
}
function buildMapIconToggles() {
	const bar = document.getElementById("map-icon-toggles");
	if (!bar || Reflect.get(bar, "_built")) return;
	Reflect.set(bar, "_built", true);
	const swatch = (t) => {
		const sym = t.sym ? theMapsSymbols[t.sym] : void 0;
		if (t.sym && sym) return mapSymHtml(sym, null, ".8rem");
		if (t.emoji) return kcHtml`<span style="font-size:.8rem">${t.emoji}\uFE0F</span>`;
		if (t.dot) return kcHtml`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.dot};vertical-align:0"></span>`;
		if (t.badge) return mapRaceBadgeHtml(t.badge);
		return "";
	};
	bar.innerHTML = String(kcHtml`${MAP_ICON_TYPES.map((t) => kcHtml`<button type="button" data-icon="${t.key}" onclick="toggleMapIcon(${kcArg(t.key)})" title="Show/hide ${t.label}" style="background:#241810;color:#e8b84b;border:1px solid #4a3418;border-radius:2px;padding:2px 6px;cursor:pointer;font-size:.62rem;line-height:1.3;display:inline-flex;align-items:center;gap:4px">${swatch(t)}${t.label}</button>`)}`);
	applyMapIconVisibility();
}
function renderPlayerMap(report) {
	const svg = document.getElementById("report-map-svg");
	const r = report ?? viewingReport ?? currentReport;
	if (!svg || !r) return;
	buildMapIconToggles();
	applyMapSymLegend();
	renderMapIntoSvg(svg, r);
	applyMapIconVisibility();
	applyMapZoom();
}
function showFullscreenMap() {
	const old = document.getElementById("map-fullscreen-modal");
	if (old) old.remove();
	const modal = document.createElement("div");
	modal.id = "map-fullscreen-modal";
	modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:10000;display:flex;flex-direction:column";
	const hdr = document.createElement("div");
	hdr.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:#1a1208;border-bottom:1px solid #c8922a;flex-shrink:0";
	hdr.innerHTML = "<span style=\"font-family:Cinzel,serif;color:#e8b84b;font-size:.85rem\">Known World</span><button onclick=\"_closeMapTip();document.getElementById('map-fullscreen-modal').remove()\" style=\"background:#7a1c1c;color:#fff;border:none;padding:7px 16px;cursor:pointer;font-family:Cinzel,serif;font-size:.72rem;border-radius:2px\">✕ Close</button>";
	const body = document.createElement("div");
	body.className = "kc-map-scroll";
	body.style.cssText = "flex:1;overflow:auto;padding:12px;background:#0e0a04;display:flex;align-items:flex-start;justify-content:flex-start";
	const fsSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	const fsW = Math.max(window.innerWidth || 0, 1500);
	fsSvg.style.cssText = "display:block;width:" + String(fsW) + "px;flex:0 0 auto";
	body.appendChild(fsSvg);
	modal.appendChild(hdr);
	modal.appendChild(body);
	document.body.appendChild(modal);
	const shown = viewingReport ?? currentReport;
	if (shown) renderMapIntoSvg(fsSvg, shown);
	if (fitMapSvgHeight(fsSvg, fsW) == null) fsSvg.style.height = String(Math.max(200, (window.innerHeight || 400) - 80)) + "px";
	modal.addEventListener("click", (ev) => {
		if (ev.target === modal) {
			_closeMapTip();
			modal.remove();
		}
	});
}
var _mapZoom = 1;
function fitMapSvgHeight(svgEl, widthPx) {
	if (!svgEl) return null;
	const vb = (svgEl.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
	if (vb.length !== 4 || !(Number(vb[2]) > 0) || !(Number(vb[3]) > 0) || !(widthPx > 0)) {
		svgEl.style.height = "";
		return null;
	}
	const h = Math.round(widthPx * Number(vb[3]) / Number(vb[2]));
	svgEl.style.height = String(h) + "px";
	return h;
}
var MOBILE_MAP_WIDTH = 700;
function applyMapZoom() {
	const svg = document.getElementById("report-map-svg");
	const cont = document.getElementById("report-map-container");
	const wrap = document.getElementById("report-map-zoomwrap");
	if (!svg) return;
	if (window.innerWidth < 821) {
		if (wrap) {
			wrap.style.width = "";
			wrap.style.height = "";
		}
		svg.style.width = "";
		svg.style.maxWidth = "";
		svg.style.maxHeight = "";
		if (cont) {
			cont.style.overflow = "";
			cont.style.flex = "none";
			cont.style.minHeight = "60vh";
			cont.style.height = "60vh";
		}
		fitMapSvgHeight(svg, MOBILE_MAP_WIDTH);
		return;
	}
	if (cont) {
		cont.style.minHeight = "0";
		cont.style.minWidth = "0";
		cont.style.overflow = "auto";
		cont.style.flex = "";
		cont.style.flexGrow = "1";
		cont.style.flexShrink = "1";
		cont.style.flexBasis = "0";
		cont.style.height = "";
	}
	const setW = (w, h) => {
		if (wrap) {
			wrap.style.width = w;
			wrap.style.height = h;
		}
		svg.style.width = "100%";
		svg.style.height = "100%";
		svg.style.maxWidth = "none";
		svg.style.maxHeight = "none";
	};
	if (_mapZoom <= 1) {
		setW("100%", "100%");
		return;
	}
	const pad = 12;
	const cw = Math.max(50, (Number(cont?.clientWidth) || 320) - pad);
	const ch = Math.max(50, (Number(cont?.clientHeight) || 320) - pad);
	setW(String(cw * _mapZoom) + "px", String(ch * _mapZoom) + "px");
}
function mapZoom(delta) {
	_mapZoom = delta === 0 ? 1 : Math.max(1, Math.min(4, _mapZoom + delta));
	applyMapZoom();
}
function moveHeroBlock(charId, dir) {
	const blocks = heroBlocksP();
	const i = blocks.findIndex((b) => b.getAttribute("data-hero") === String(charId));
	const j = i + dir;
	if (i < 0 || j < 0 || j >= blocks.length) return;
	const gA = heroGroupP(theBlockAt(blocks, i)), gB = heroGroupP(theBlockAt(blocks, j));
	if (dir > 0) {
		let ref = theBlockAt(gB, gB.length - 1);
		gA.forEach((n) => {
			ref.after(n);
			ref = n;
		});
	} else {
		const anchor = theBlockAt(gB, 0);
		gA.forEach((n) => theParentOfTheBlock(anchor).insertBefore(n, anchor));
	}
	_heroOrder = heroBlocksP().map((b) => b.getAttribute("data-hero"));
	refreshHeroMoveButtonsP();
	try {
		theBlockAt(blocks, i).scrollIntoView({
			block: "nearest",
			behavior: "smooth"
		});
	} catch {}
	persistHeroOrder();
}
function groupHeroesByLocation() {
	const blocks = heroBlocksP();
	if (blocks.length < 2) return;
	const chars = currentReport?.characters ?? [];
	const locOf = (id) => {
		const c = chars.find((x) => String(x.id) === String(id));
		return c ? String(c.locationId ?? ((c.locationName ?? "") || "?")) : "?";
	};
	const firstSeen = /* @__PURE__ */ new Map();
	blocks.forEach((b) => {
		const k = locOf(b.getAttribute("data-hero"));
		if (!firstSeen.has(k)) firstSeen.set(k, firstSeen.size);
	});
	const sorted = blocks.map((b, i) => ({
		b,
		i,
		k: firstSeen.get(locOf(b.getAttribute("data-hero")))
	})).sort((x, y) => Number(x.k) - Number(y.k) || x.i - y.i);
	if (sorted.every((s, i) => s.i === i)) return;
	const parent = theParentOfTheBlock(theBlockAt(blocks, 0));
	sorted.map((s) => heroGroupP(s.b)).flat().forEach((n) => parent.appendChild(n));
	_heroOrder = heroBlocksP().map((b) => b.getAttribute("data-hero"));
	refreshHeroMoveButtonsP();
	persistHeroOrder();
}
async function persistHeroOrder() {
	const gp = currentGamePlayer;
	if (!gp?.id) return;
	const heroOrder = _heroOrder;
	if (heroOrder == null) throw new TypeError("Cannot read properties of null (reading the hero order's length)");
	if (!heroOrder.length) return;
	if (document.getElementById("prev-report-banner")?.style.display === "block") return;
	let parsed;
	try {
		parsed = typeof gp.orders === "string" ? JSON.parse(gp.orders || "{}") : theOrdersHeldOrNone(gp.orders);
	} catch {
		parsed = {};
	}
	const raw = parsed && typeof parsed === "object" ? parsed : {};
	if (Reflect.get(raw, "orders") === void 0) Reflect.set(raw, "orders", {});
	if (Reflect.get(raw, "encounterPlans") === void 0) Reflect.set(raw, "encounterPlans", {});
	if (Reflect.get(raw, "forTurn") == null) Reflect.set(raw, "forTurn", Number(currentReport ? Number(currentReport._liveTurn) || currentReport.turn : currentReport) || 1);
	Reflect.set(raw, "heroOrder", heroOrder.slice());
	const payload = JSON.stringify(raw);
	const { error } = await thePagesDb.theOrders.saveThisRealmsHeroOrder(gp.id, payload);
	if (error) {
		console.warn("persistHeroOrder:", error.message);
		return;
	}
	gp.orders = payload;
}
// src/ui/shared/the-pages-element-with-the-id.ts
/** The element of `page` with the id `id`, of the kind `kind`. Throws a TypeError naming the id when the page holds no
*  element with it, or holds one of another kind. `page` is the page's own document unless a test hands another. */
function theElementWithTheId(id, kind, page = document) {
	const found = page.getElementById(id);
	if (found === null) throw new TypeError(`the page holds no element with the id "${id}"`);
	if (!(found instanceof kind)) throw new TypeError(`the page's element with the id "${id}" is a <${found.tagName.toLowerCase()}>, not of the kind asked for`);
	return found;
}
// src/ui/player/dispatches.ts
var MSG_POLL_MS = 8e3;
var MSG_SLOW_EVERY = 4;
var MSG_MAX_LEN = 500;
var MSG_PAGE = 400;
globalThis._msgGameId = null;
globalThis._msgMyIndex = null;
var _msgMyName = "";
var _msgMyColor = null;
globalThis._msgRows = [];
var _msgIds = /* @__PURE__ */ new Set();
var _msgMaxId = 0;
var _msgMinId = 0;
globalThis._msgMoreOlder = false;
globalThis._msgLoadingOlder = false;
var _msgReported = /* @__PURE__ */ new Set();
var _msgReads = {};
globalThis._msgRealms = {};
globalThis._msgChannel = "public";
var _msgExtraGroups = [];
var _msgTimer = null;
var _msgTick = 0;
var _msgBusy = false;
var _msgSending = false;
globalThis._msgTableOk = null;
globalThis._msgErr = null;
var _msgReadsDirty = false;
var _msgReadSaveTimer = null;
globalThis._msgOut = null;
var _msgGameOver = false;
globalThis._msgBlockOut = false;
function _msgNum(v) {
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}
function _msgArr(v) {
	return Array.isArray(v) ? v : [];
}
function theWordsOfWhatTheDispatchesMet(e) {
	let words = e;
	if (e) {
		const message = Reflect.get(Object(e), "message");
		if (message) words = message;
	}
	return String(words);
}
function theRefusalAsThrown(error) {
	return error;
}
function theLiveTurnHeldBy(holder) {
	return holder && Reflect.get(Object(holder), "_liveTurn");
}
function msgChannelKeyOf(row) {
	if (!row) return "public";
	if (row.scope === "public" || !_msgArr(row.to_indexes).length) return "public";
	return msgGroupKey([_msgNum(row.from_index), ..._msgArr(row.to_indexes).map(_msgNum)]);
}
function msgGroupKey(indices) {
	return "p:" + [...new Set(_msgArr(indices).map(_msgNum).filter((i) => i != null))].sort((a, b) => a - b).join("-");
}
function msgParticipantsOf(key) {
	if (!key || key === "public") return [];
	return key.slice(2).split("-").map(_msgNum).filter((i) => i != null);
}
function msgRealmName(i) {
	return (_msgRealms[String(i)]?.name ?? "") || `Realm ${String((_msgNum(i) ?? 0) + 1)}`;
}
function msgRealmColour(i) {
	const hex = (_msgRealms[String(i)]?.color ?? "") || null;
	if (!hex) return "#c9b189";
	try {
		return _tintForDarkTooltip(hex);
	} catch {
		return hex;
	}
}
async function loadMessageRoster(gameId, report) {
	const known = {};
	_msgArr(report?.diplomacy?.known).forEach((k) => {
		const i = _msgNum(k.index);
		if (i == null) return;
		known[i] = {
			index: i,
			name: (k.name ?? "") || `Realm ${String(i + 1)}`,
			color: (k.color ?? "") || null,
			alignment: (k.alignment ?? "") || null,
			conceded: !!k.conceded,
			eliminated: !!k.eliminated,
			relation: (k.relation ?? "") || "neutral"
		};
	});
	const humans = /* @__PURE__ */ new Set();
	let total = 0;
	try {
		const { data: slots, error } = await fetchGameSlots([gameId]);
		if (error) throw theRefusalAsThrown(error);
		_msgArr(slots).forEach((s) => {
			const i = _msgNum(s.player_index);
			if (i == null) return;
			total++;
			if (!s.is_bot) humans.add(i);
		});
	} catch (e) {
		_msgErr = "Could not read the realm roster: " + theWordsOfWhatTheDispatchesMet(e);
	}
	_msgRealms = {};
	Object.values(known).forEach((k) => {
		_msgRealms[k.index] = {
			...k,
			human: humans.has(k.index),
			met: true
		};
	});
	if (_msgMyIndex != null) _msgRealms[_msgMyIndex] = {
		index: _msgMyIndex,
		name: _msgMyName || msgRealmName(_msgMyIndex),
		color: _msgMyColor,
		human: true,
		met: true,
		conceded: false,
		eliminated: false,
		mine: true
	};
	_msgEnabled = humans.size >= 2;
	return {
		humans: humans.size,
		total
	};
}
function msgContacts() {
	return Object.values(_msgRealms).filter((r) => r !== void 0 && r.met && r.human && r.index !== _msgMyIndex).sort((a, b) => a.index - b.index);
}
function msgChannelIsSendable(key) {
	return msgChannelOpen(key) && !msgOutReason(key);
}
function msgChannelOpen(key) {
	if (key === "public") return true;
	const others = msgParticipantsOf(key).filter((i) => i !== _msgMyIndex);
	if (!others.length) return false;
	return others.some((i) => {
		const r = _msgRealms[i];
		return r?.human && (_msgGameOver || !r.conceded && !r.eliminated);
	});
}
function msgOutReason(key) {
	if (!_msgOut || _msgGameOver) return null;
	if (_msgBlockOut) return msgOutWho() + ", and your GM has blocked conceded and extinguished realms from sending any dispatches until the game is over.";
	if (key !== "public") return msgOutPrivateOff() + " You can still write to 📣 All Realms.";
	return null;
}
function msgOutWho() {
	return _msgOut === "eliminated" ? "Your dynasty is extinguished" : "Your realm has conceded";
}
function msgOutPrivateOff() {
	return _msgOut && !_msgGameOver ? msgOutWho() + ", so you send no private dispatches until the game is over." : "";
}
function msgChannelLabel(key) {
	if (key === "public") return "📣 All Realms";
	const others = msgParticipantsOf(key).filter((i) => i !== _msgMyIndex);
	if (!others.length) return "Private note";
	if (others.length === 1) return msgRealmName(others[0]);
	return others.map((i) => msgRealmName(i)).join(" + ");
}
async function initMessaging(gameId, myIndex, report, game) {
	const same = String(_msgGameId) === String(gameId) && _msgMyIndex === _msgNum(myIndex);
	_msgGameId = gameId ?? null;
	_msgMyIndex = _msgNum(myIndex);
	_msgMyName = report?.playerName ?? "";
	_msgMyColor = (report?.kingdom?.color ?? "") || null;
	{
		const k = report?.kingdom ?? {};
		_msgOut = k.conceded ? "conceded" : k.eliminated ? "eliminated" : null;
		_msgGameOver = !!(game?.status === "complete" || report?.titles?.gameOver);
		_msgBlockOut = !!game?.block_eliminated_msgs;
	}
	if (!same) {
		_msgRows = [];
		_msgIds = /* @__PURE__ */ new Set();
		_msgMaxId = 0;
		_msgMinId = 0;
		_msgMoreOlder = false;
		_msgReported = /* @__PURE__ */ new Set();
		_msgReads = {};
		_msgChannel = "public";
		_msgExtraGroups = [];
		_msgErr = null;
	}
	await loadMessageRoster(gameId, report);
	{
		const h = document.getElementById("msg-col-title");
		if (h) h.textContent = "✉ Dispatches — " + (_msgMyName || "your realm");
	}
	const mt = document.getElementById("mt-messages");
	if (mt) mt.style.display = _msgEnabled ? "" : "none";
	const dt = document.getElementById("desk-msg-tab");
	if (dt) dt.style.display = _msgEnabled ? "" : "none";
	try {
		applyDeskViews();
	} catch {}
	if (!_msgEnabled) {
		stopMessagePolling();
		updateMsgBadges();
		return;
	}
	if (_msgTableOk === null) await probeMessagesTable();
	if (!same) await loadMessageReads();
	_msgBindChannelClicks();
	_msgBindComposerKeys();
	renderMessageChannels();
	renderMessageThread();
	await loadMyReports();
	await refreshMessages(true);
	startMessagePolling();
}
async function probeMessagesTable() {
	try {
		const { error } = await thePagesDb.theDispatches.oneDispatchsId();
		_msgTableOk = !error;
		if (error) _msgErr = error.message;
	} catch (e) {
		_msgTableOk = false;
		_msgErr = theWordsOfWhatTheDispatchesMet(e);
	}
	return _msgTableOk;
}
async function loadMessageReads() {
	if (!_msgGameId || _msgMyIndex == null) return;
	try {
		const { data, error } = await thePagesDb.theDispatches.thisRealmsReadMarksInThisGame(_msgGameId, _msgMyIndex);
		if (error) throw theRefusalAsThrown(error);
		const r = data?.reads;
		_msgReads = r && typeof r === "object" && !Array.isArray(r) ? { ...r } : {};
	} catch {
		_msgReads = {};
	}
}
function queueMessageReadSave() {
	_msgReadsDirty = true;
	if (_msgReadSaveTimer) return;
	_msgReadSaveTimer = setTimeout(() => {
		_msgReadSaveTimer = null;
		saveMessageReads();
	}, 1200);
}
async function saveMessageReads() {
	if (!_msgReadsDirty || !_msgGameId || _msgMyIndex == null || !currentUser) return;
	_msgReadsDirty = false;
	try {
		await thePagesDb.theDispatches.writeTheseReadMarks({
			game_id: _msgGameId,
			player_index: _msgMyIndex,
			user_id: currentUser.id,
			reads: _msgReads,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		});
	} catch {}
}
function startMessagePolling() {
	if (_msgTimer) return;
	_msgTimer = setInterval(() => {
		_msgTick++;
		if (document.hidden) return;
		if (!_msgEnabled || !_msgGameId) return;
		if (_activeSectionId() !== "sec-report") return;
		if (!_msgViewVisible() && _msgTick % MSG_SLOW_EVERY !== 0) return;
		refreshMessages(false);
	}, MSG_POLL_MS);
}
function refreshMsgBadgeSoon() {
	try {
		if (_msgEnabled && _msgGameId && _activeSectionId() === "sec-report") refreshMessages(false);
	} catch {}
}
function stopMessagePolling() {
	if (_msgTimer) {
		clearInterval(_msgTimer);
		_msgTimer = null;
	}
}
function _msgViewVisible() {
	if (_activeSectionId() !== "sec-report") return false;
	const lay = document.getElementById("rp-layout");
	if (!lay) return false;
	if (lay.classList.contains("desk")) return _deskLeftView === "messages";
	return lay.classList.contains("mv-messages");
}
async function refreshMessages(force) {
	if (!_msgEnabled || !_msgGameId) return;
	if (_msgBusy && !force) return;
	if (_msgTableOk === null) await probeMessagesTable();
	if (!_msgTableOk) {
		renderMessageThread();
		return;
	}
	_msgBusy = true;
	try {
		const { data, error } = await (_msgMaxId > 0 ? thePagesDb.theDispatches.theDispatchesOfThisGameAfterThisOne(_msgGameId, _msgMaxId, MSG_PAGE) : thePagesDb.theDispatches.theNewestDispatchesOfThisGame(_msgGameId, MSG_PAGE));
		if (error) throw theRefusalAsThrown(error);
		let rows = _msgArr(data);
		if (_msgMaxId <= 0) {
			rows = rows.slice().reverse();
			_msgMoreOlder = rows.length >= MSG_PAGE;
		}
		const added = _msgAbsorb(rows);
		_msgErr = null;
		if (added || force) {
			renderMessageChannels();
			renderMessageThread();
		}
		updateMsgBadges();
	} catch (e) {
		_msgErr = theWordsOfWhatTheDispatchesMet(e);
		renderMessageThread();
	} finally {
		_msgBusy = false;
	}
}
function _msgAbsorb(rows) {
	let added = 0;
	_msgArr(rows).forEach((r) => {
		const id = _msgNum(r.id);
		if (id == null || _msgIds.has(id)) return;
		_msgIds.add(id);
		_msgRows.push(r);
		added++;
		if (id > _msgMaxId) _msgMaxId = id;
		if (_msgMinId === 0 || id < _msgMinId) _msgMinId = id;
	});
	if (added) _msgRows.sort((a, b) => Number(_msgNum(a.id)) - Number(_msgNum(b.id)));
	return added;
}
async function loadOlderMessages() {
	if (_msgLoadingOlder || !_msgMoreOlder || !_msgGameId || _msgMinId <= 0) return;
	_msgLoadingOlder = true;
	renderMessageThread();
	try {
		const { data, error } = await thePagesDb.theDispatches.theDispatchesOfThisGameBeforeThisOne(_msgGameId, _msgMinId, MSG_PAGE);
		if (error) throw theRefusalAsThrown(error);
		const page = _msgArr(data);
		_msgMoreOlder = page.length >= MSG_PAGE;
		_msgAbsorb(page.slice().reverse());
	} catch (e) {
		_msgErr = theWordsOfWhatTheDispatchesMet(e);
	} finally {
		_msgLoadingOlder = false;
		renderMessageChannels();
		renderMessageThread();
	}
}
function msgRowsOf(key) {
	return _msgRows.filter((r) => msgChannelKeyOf(r) === key);
}
function msgUnreadIn(key) {
	const seen = _msgNum(_msgReads[key]) ?? 0;
	return msgRowsOf(key).filter((r) => (_msgNum(r.id) ?? 0) > seen && _msgNum(r.from_index) !== _msgMyIndex).length;
}
function msgUnreadTotal() {
	return msgChannelKeys().reduce((n, k) => n + msgUnreadIn(k), 0);
}
function markChannelRead(key) {
	const rows = msgRowsOf(key);
	if (!rows.length) return;
	const top = rows.reduce((m, r) => Math.max(m, _msgNum(r.id) ?? 0), 0);
	if ((_msgNum(_msgReads[key]) ?? 0) >= top) return;
	_msgReads[key] = top;
	queueMessageReadSave();
	updateMsgBadges();
	renderMessageChannels();
}
function updateMsgBadges() {
	const n = _msgEnabled ? msgUnreadTotal() : 0;
	const txt = n ? n > 99 ? "99+" : String(n) : "";
	["desk-msg-badge", "mt-msg-badge"].forEach((id) => {
		const el = document.getElementById(id);
		if (!el) return;
		el.className = txt ? "msg-tabbadge" : "";
		el.textContent = txt;
	});
}
function msgChannelKeys() {
	const keys = ["public"];
	msgContacts().forEach((r) => {
		const k = msgGroupKey([_msgMyIndex, r.index]);
		if (!keys.includes(k)) keys.push(k);
	});
	const groups = /* @__PURE__ */ new Set();
	_msgRows.forEach((r) => {
		const k = msgChannelKeyOf(r);
		if (k !== "public" && !keys.includes(k)) groups.add(k);
	});
	_msgExtraGroups.forEach((k) => {
		if (k !== "public" && !keys.includes(k)) groups.add(k);
	});
	return keys.concat([...groups].sort());
}
function setMsgChannel(key) {
	_msgChannel = key || "public";
	renderMessageChannels();
	renderMessageThread();
	if (_msgViewVisible()) markChannelRead(_msgChannel);
	const ta = document.getElementById("msg-input");
	if (ta) try {
		ta.focus();
	} catch {}
}
function renderMessageChannels() {
	const el = document.getElementById("msg-channels");
	if (!el) return;
	const keys = msgChannelKeys();
	if (!keys.includes(_msgChannel)) _msgChannel = "public";
	el.innerHTML = String(kcHtml`${keys.map((k) => {
		const others = msgParticipantsOf(k).filter((i) => i !== _msgMyIndex);
		const gone = k !== "public" && !msgChannelIsSendable(k);
		const dot = k === "public" ? kcHtml`<span class="mc-dot" style="background:#7d5fb5"></span>` : others.length === 1 ? kcHtml`<span class="mc-dot" style="background:${msgRealmColour(others[0])}"></span>` : kcHtml`<span class="mc-dot" style="background:linear-gradient(90deg,${others.slice(0, 3).map((i) => msgRealmColour(i)).join(",")})"></span>`;
		const u = msgUnreadIn(k);
		return kcHtml`<button type="button" class="msg-chan${k === _msgChannel ? " active" : ""}${gone ? " gone" : ""}" data-ch="${k}" title="${msgChannelLabel(k)}${gone ? " — no longer in the game" : ""}">${dot}<span class="mc-label">${msgChannelLabel(k)}</span>${u ? kcHtml`<span class="mc-unread">${u > 99 ? "99+" : u}</span>` : ""}</button>`;
	})}`);
	updateMsgComposer();
}
function _msgBindChannelClicks() {
	const el = document.getElementById("msg-channels");
	if (!el || Reflect.get(el, "_bound")) return;
	Reflect.set(el, "_bound", true);
	el.addEventListener("click", (ev) => {
		const b = ev.target instanceof Element ? ev.target.closest(".msg-chan") : null;
		if (b instanceof HTMLElement && b.dataset["ch"]) setMsgChannel(b.dataset["ch"]);
	});
}
function _msgWhen(iso) {
	const d = new Date(iso);
	if (isNaN(d.getTime())) return "";
	return d.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function _msgDay(iso) {
	const d = new Date(iso);
	if (isNaN(d.getTime())) return "";
	return d.toLocaleDateString([], {
		weekday: "short",
		day: "numeric",
		month: "short"
	});
}
function renderMessageThread() {
	const el = document.getElementById("msg-thread");
	if (!el) return;
	if (!_msgEnabled) {
		el.innerHTML = "<div class=\"msg-empty\">This game has only one human realm, so there is no one to send dispatches to.</div>";
		return;
	}
	if (_msgTableOk === false) {
		el.innerHTML = String(kcHtml`<div class="msg-empty">Dispatches are not switched on for this server yet — the <strong>game_messages</strong> table is missing. Ask your GM to run the messaging SQL shown on their portal.${_msgErr ? kcHtml`<br><span style="font-size:.72rem;opacity:.7">${_msgErr}</span>` : ""}</div>`);
		updateMsgComposer();
		return;
	}
	const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
	const rows = msgRowsOf(_msgChannel);
	const older = _msgMoreOlder ? kcHtml`<button type="button" class="msg-chan" style="align-self:center" onclick="loadOlderMessages()"${_msgLoadingOlder ? kcHtml` disabled` : ""}>${_msgLoadingOlder ? "Loading…" : "↑ Earlier dispatches"}</button>` : "";
	if (!rows.length) {
		const who = _msgChannel === "public" ? "every realm in the game" : msgChannelLabel(_msgChannel);
		el.innerHTML = String(kcHtml`${older}<div class="msg-empty">No dispatches here yet.<br>Anything you write goes to <strong>${who}</strong>.</div>`);
		updateMsgComposer();
		return;
	}
	const seen = _msgNum(_msgReads[_msgChannel]) ?? 0;
	let lastDay = null;
	const html = [older];
	rows.forEach((r) => {
		const day = _msgDay(r.created_at);
		if (day && day !== lastDay) {
			lastDay = day;
			html.push(kcHtml`<div class="msg-day">${day}</div>`);
		}
		const from = _msgNum(r.from_index);
		const mine = from === _msgMyIndex;
		const pub = r.scope === "public" || !_msgArr(r.to_indexes).length;
		const others = _msgArr(r.to_indexes).map(_msgNum).filter((i) => i != null && i !== from);
		const showTo = pub ? "to all realms" : others.length > 1 ? "to " + others.map((i) => msgRealmName(i)).join(", ") : "";
		const fresh = !mine && (_msgNum(r.id) ?? 0) > seen;
		const meta = [
			kcHtml`<span class="msg-from" style="color:${msgRealmColour(from)}">${mine ? msgRealmName(from) + " (you)" : msgRealmName(from)}</span>`,
			showTo ? kcHtml`<span class="msg-to">${showTo}</span>` : "",
			kcHtml`<span class="msg-when">${r.turn != null ? `T${String(r.turn)} · ` : ""}${_msgWhen(r.created_at)}</span>`,
			fresh ? kcHtml`<span class="mc-unread" title="New since you last read this thread">new</span>` : "",
			mine ? "" : _msgReported.has(String(r.id)) ? kcHtml`<span class="msg-reported" title="Your GM (or the Overlord) can see this dispatch">⚑ Reported</span>` : kcHtml`<button type="button" class="msg-report" title="Show this dispatch to your GM" onclick="reportMessage(${kcArg(_msgNum(r.id) ?? 0)})">⚑ Report</button>`
		];
		html.push(kcHtml`<div class="msg-bubble${mine ? " mine" : ""}${pub && !mine ? " pub" : ""}"><div class="msg-meta">${meta}</div>${r.body}</div>`);
	});
	el.innerHTML = String(kcHtml`${html}`);
	if (atBottom) el.scrollTop = el.scrollHeight;
	updateMsgComposer();
}
function onMessagesShown() {
	_msgBindChannelClicks();
	renderMessageChannels();
	renderMessageThread();
	const el = document.getElementById("msg-thread");
	if (el) el.scrollTop = el.scrollHeight;
	markChannelRead(_msgChannel);
	refreshMessages(true);
}
async function loadMyReports() {
	if (!_msgGameId) return;
	const { data, error } = await thePagesDb.theReportedDispatches.theDispatchesThisAccountReportedInThisGame(_msgGameId);
	if (!error) _msgReported = new Set(_msgArr(data).map((r) => String(r.message_id)));
}
async function reportMessage(id) {
	const r = _msgRows.find((x) => _msgNum(x.id) === _msgNum(id));
	const messageId = _msgNum(id);
	if (!r || messageId === null || _msgMyIndex == null || _msgNum(r.from_index) === _msgMyIndex) return;
	const why = prompt("Report this dispatch?\n\nYour GM will see it, with your reason (or the Overlord will, if your GM plays in this game). The sender isn't told.\n\nReason (optional):", "");
	if (why == null) return;
	const { error } = await thePagesDb.theReportedDispatches.reportThisDispatch({
		message_id: messageId,
		game_id: String(_msgGameId),
		reporter_index: _msgMyIndex,
		reason: why.trim().slice(0, 500) || null
	});
	if (error && Reflect.get(error, "code") !== "23505") {
		_msgErr = "Report not sent: " + theWordsOfWhatTheDispatchesMet(error);
		updateMsgComposer();
		return;
	}
	_msgReported.add(String(id));
	_msgErr = null;
	renderMessageThread();
}
function updateMsgComposer() {
	const btn = document.getElementById("msg-send-btn"), ta = document.getElementById("msg-input"), hint = document.getElementById("msg-hint"), note = document.getElementById("msg-note");
	if (!(btn instanceof HTMLButtonElement) || !(ta instanceof HTMLTextAreaElement)) return;
	const sendable = _msgEnabled && _msgTableOk !== false && msgChannelIsSendable(_msgChannel);
	const len = (ta.value || "").trim().length;
	btn.disabled = !sendable || !len || _msgSending;
	ta.disabled = !sendable;
	if (hint) hint.innerHTML = String(!sendable ? kcHtml`${_msgTableOk === false ? "Messaging is not active on this server." : (msgOutReason(_msgChannel) ?? "") || "Every realm in this conversation has left the game."}` : kcHtml`${_msgChannel === "public" ? kcHtml`Public — <strong>every realm in this game</strong> will read this.${msgOutPrivateOff() ? " " + msgOutPrivateOff() : ""}` : "Private to " + msgChannelLabel(_msgChannel) + "."} <span style="opacity:.75">Ctrl+Enter sends. ${MSG_MAX_LEN - len} left.</span>`);
	if (note) {
		note.style.display = _msgErr && _msgTableOk !== false ? "block" : "none";
		note.textContent = _msgErr ?? "";
	}
}
function onMsgInput() {
	updateMsgComposer();
}
function _msgBindComposerKeys() {
	const ta = document.getElementById("msg-input");
	if (!ta || Reflect.get(ta, "_bound")) return;
	Reflect.set(ta, "_bound", true);
	ta.addEventListener("keydown", (ev) => {
		if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
			ev.preventDefault();
			sendMessage();
		}
	});
}
async function sendMessage() {
	const ta = document.getElementById("msg-input");
	if (!(ta instanceof HTMLTextAreaElement)) return;
	const body = (ta.value || "").trim();
	if (!body || _msgSending || !_msgEnabled || !_msgGameId || _msgMyIndex == null) return;
	if (!msgChannelIsSendable(_msgChannel)) return;
	const key = _msgChannel;
	const pub = key === "public";
	const to = pub ? [] : msgParticipantsOf(key).filter((i) => i !== _msgMyIndex);
	if (!pub && !to.length) return;
	_msgSending = true;
	updateMsgComposer();
	const turn = (_msgNum(theLiveTurnHeldBy(currentGamePlayer)) ?? 0) || _msgNum(theLiveTurnHeldBy(currentReport));
	try {
		const { error } = await thePagesDb.theDispatches.sendThisDispatch({
			game_id: _msgGameId,
			turn,
			from_index: _msgMyIndex,
			from_user_id: (currentUser?.id ?? "") || null,
			to_indexes: to,
			scope: pub ? "public" : "private",
			body: body.slice(0, MSG_MAX_LEN)
		});
		if (error) throw theRefusalAsThrown(error);
		ta.value = "";
		_msgErr = null;
		await refreshMessages(true);
		const th = document.getElementById("msg-thread");
		if (th) th.scrollTop = th.scrollHeight;
		markChannelRead(key);
	} catch (e) {
		const m = theWordsOfWhatTheDispatchesMet(e);
		_msgErr = e && Reflect.get(Object(e), "hint") === "kc_dispatch_rate" ? m : m.includes("game_messages_body_len") ? `A dispatch can be at most ${String(MSG_MAX_LEN)} characters. Shorten it and send again.` : "Dispatch not sent: " + m;
	} finally {
		_msgSending = false;
		updateMsgComposer();
	}
}
function toggleMsgGroupPicker(force) {
	const p = document.getElementById("msg-group-pick");
	if (!p) return;
	const open = force === void 0 ? p.style.display !== "block" : !!force;
	p.style.display = open ? "block" : "none";
	if (!open) return;
	const list = document.getElementById("msg-group-list");
	const cs = msgContacts();
	if (list) list.innerHTML = cs.length ? String(kcHtml`${cs.map((r) => kcHtml`<label><input type="checkbox" value="${r.index}"><span style="color:${msgRealmColour(r.index)}">${r.name}</span>${r.conceded || r.eliminated ? kcHtml` <span style="opacity:.6;font-size:.72rem">(out)</span>` : ""}</label>`)}`) : "<span style=\"font-size:.76rem;color:#8a7a5c\">You have not met another player's realm yet.</span>";
}
function createMsgGroup() {
	const list = document.getElementById("msg-group-list");
	if (!list) return;
	const picked = [...list.querySelectorAll("input[type=checkbox]:checked")].filter((c) => c instanceof HTMLInputElement).map((c) => _msgNum(c.value)).filter((i) => i != null);
	if (!picked.length) return;
	const key = msgGroupKey([_msgMyIndex, ...picked]);
	if (!_msgExtraGroups.includes(key)) _msgExtraGroups.push(key);
	toggleMsgGroupPicker(false);
	setMsgChannel(key);
}
window.addEventListener("pagehide", () => {
	try {
		saveMessageReads();
	} catch {}
});
document.addEventListener("visibilitychange", () => {
	if (document.hidden) try {
		saveMessageReads();
	} catch {}
	else if (_msgEnabled && _msgViewVisible()) try {
		refreshMessages(true);
	} catch {}
	else refreshMsgBadgeSoon();
});
function _activeSectionId() {
	const s = document.querySelector("section.section-active");
	return s ? s.id : null;
}
async function fetchGameSlots(gameIds) {
	const ids = [...new Set((gameIds ?? []).filter((id) => Boolean(id)))];
	if (!ids.length) return {
		data: [],
		error: null
	};
	const { data, error } = await thePagesDb.thePlayersRealms.theSlotsOfTheseGames(ids);
	return {
		data: Array.isArray(data) ? data : [],
		error
	};
}
var _deskRightView = "report";
var _ordersAvailable = true;
function setDeskView(side, view) {
	if (side === "left") {
		if (view === "messages" && !_msgEnabled) view = "map";
		_deskLeftView = view;
		if (view === "report" && _deskRightView === "report") _deskRightView = "orders";
	} else {
		_deskRightView = view;
		if (view === "report" && _deskLeftView === "report") _deskLeftView = "map";
	}
	applyDeskViews();
	if (side === "left" && view === "messages") try {
		onMessagesShown();
	} catch {}
	else refreshMsgBadgeSoon();
}
function applyDeskViews() {
	const map = document.getElementById("rp-map-col"), rep = document.getElementById("rp-report-col"), msg = document.getElementById("rp-msg-col"), ord = document.getElementById("orders-column");
	const lb = document.getElementById("desk-left-body"), rb = document.getElementById("desk-right-body");
	if (!map || !rep || !ord || !lb || !rb) return;
	if (_deskLeftView === "messages" && !_msgEnabled) _deskLeftView = "map";
	if (_deskLeftView === "report" && _deskRightView === "report") _deskRightView = "orders";
	const repLeft = _deskLeftView === "report";
	if (repLeft) {
		if (rep.parentNode !== lb) lb.appendChild(rep);
	} else if (rep.parentNode !== rb) rb.appendChild(rep);
	if (msg && msg.parentNode !== lb) lb.appendChild(msg);
	const mt = document.getElementById("desk-msg-tab");
	if (mt) mt.style.display = _msgEnabled ? "" : "none";
	map.style.display = _deskLeftView === "map" ? "flex" : "none";
	if (msg) msg.style.display = _deskLeftView === "messages" ? "flex" : "none";
	ord.style.display = (repLeft || _deskRightView === "orders") && _ordersAvailable ? "" : "none";
	rep.style.display = repLeft || _deskRightView === "report" || _deskRightView === "orders" && !_ordersAvailable ? "" : "none";
	const none = document.getElementById("desk-right-none");
	if (none) none.style.display = repLeft && !_ordersAvailable ? "" : "none";
	const rightTab = repLeft ? "orders" : _deskRightView;
	document.querySelectorAll("#desk-left .desk-tabs button").forEach((b) => b.classList.toggle("active", b.getAttribute("data-view") === _deskLeftView));
	document.querySelectorAll("#desk-right .desk-tabs button").forEach((b) => b.classList.toggle("active", b.getAttribute("data-view") === rightTab));
	if (_deskLeftView === "map") try {
		renderPlayerMap();
	} catch {}
}
function refreshOrdersVisibility(available) {
	_ordersAvailable = !!available;
	const lay = document.getElementById("rp-layout");
	const oc = document.getElementById("orders-column");
	if (lay?.classList.contains("desk")) {
		if (!_ordersAvailable && _deskRightView === "orders" && _deskLeftView !== "report") _deskRightView = "report";
		applyDeskViews();
	} else if (oc) oc.style.display = _ordersAvailable ? "flex" : "none";
}
// src/ui/player/layout.ts
function setMobileView(view) {
	const lay = document.getElementById("rp-layout");
	if (!lay) return;
	if (view === "messages" && !_msgEnabled) view = "report";
	if (window.innerWidth < 821) {
		const _mc = document.getElementById("rp-msg-col");
		if (_mc) _mc.style.display = "";
	}
	lay.classList.remove("mv-map", "mv-report", "mv-messages", "mv-orders");
	lay.classList.add("mv-" + view);
	try {
		_closeMapTip();
	} catch {}
	document.querySelectorAll("#mobile-tabbar button").forEach((b) => b.classList.toggle("active", b.getAttribute("data-mv") === view));
	if (view === "map") try {
		applyMapZoom();
	} catch {}
	if (view === "messages") try {
		onMessagesShown();
	} catch {}
	else refreshMsgBadgeSoon();
	try {
		window.scrollTo(0, 0);
	} catch {}
}
globalThis._msgEnabled = false;
globalThis._deskLeftView = "map";
function setupDeskLayout() {
	const lay = document.getElementById("rp-layout");
	const map = document.getElementById("rp-map-col");
	const rep = document.getElementById("rp-report-col");
	const msg = document.getElementById("rp-msg-col");
	const ord = document.getElementById("orders-column");
	if (!lay || !map || !rep || !ord) return;
	if (window.innerWidth < 821) return;
	if (!document.getElementById("desk-left")) {
		const left = document.createElement("div");
		left.id = "desk-left";
		left.innerHTML = "<div class=\"desk-tabs\"><button data-side=\"left\" data-view=\"map\" onclick=\"setDeskView('left','map')\">🗺 Map</button><button data-side=\"left\" data-view=\"report\" onclick=\"setDeskView('left','report')\">📜 Report</button><button data-side=\"left\" data-view=\"messages\" id=\"desk-msg-tab\" style=\"display:none\" onclick=\"setDeskView('left','messages')\">✉ Dispatches<span id=\"desk-msg-badge\"></span></button></div><div class=\"desk-body\" id=\"desk-left-body\"></div>";
		const right = document.createElement("div");
		right.id = "desk-right";
		right.innerHTML = "<div class=\"desk-tabs\"><button data-side=\"right\" data-view=\"report\" onclick=\"setDeskView('right','report')\">📜 Report</button><button data-side=\"right\" data-view=\"orders\" onclick=\"setDeskView('right','orders')\">📋 Orders</button></div><div class=\"desk-body\" id=\"desk-right-body\"><div id=\"desk-right-none\" style=\"display:none;padding:22px;font-family:'Crimson Text',Georgia,serif;font-size:.9rem;color:#dccba8\">The Report is open in the left panel. There are no orders to give for this turn — choose 📜 Report here to bring it back to this side.</div></div>";
		lay.appendChild(left);
		lay.appendChild(right);
		theElementWithTheId("desk-left-body", HTMLElement).appendChild(map);
		if (msg) theElementWithTheId("desk-left-body", HTMLElement).appendChild(msg);
		theElementWithTheId("desk-right-body", HTMLElement).appendChild(ord);
		theElementWithTheId("desk-right-body", HTMLElement).appendChild(rep);
		injectMapZoomBar();
	}
	lay.classList.add("desk");
	applyDeskViews();
	fitDeskPanels();
}
var _deskFitObs = null;
function fitDeskPanels() {
	const l = document.getElementById("desk-left"), r = document.getElementById("desk-right");
	if (!l || !r) return;
	if (window.innerWidth < 821) {
		l.style.height = "";
		r.style.height = "";
		return;
	}
	const top = l.getBoundingClientRect().top + (window.scrollY || 0);
	const h = `${String(Math.max(360, Math.floor(window.innerHeight - top - 8)))}px`;
	if (l.style.height !== h) l.style.height = h;
	if (r.style.height !== h) r.style.height = h;
	if (!_deskFitObs && typeof ResizeObserver === "function") {
		const observer = new ResizeObserver(() => {
			fitDeskPanels();
		});
		_deskFitObs = observer;
		document.querySelectorAll("#sec-report > .detail-header, #new-turn-banner").forEach((el) => {
			observer.observe(el);
		});
	}
}
function teardownDeskLayout() {
	const lay = document.getElementById("rp-layout");
	const dl = document.getElementById("desk-left"), dr = document.getElementById("desk-right");
	if (!lay || !dl) return;
	[
		document.getElementById("rp-map-col"),
		document.getElementById("rp-report-col"),
		document.getElementById("rp-msg-col"),
		document.getElementById("orders-column")
	].forEach((el) => {
		if (el) {
			el.style.display = "";
			lay.appendChild(el);
		}
	});
	dl.remove();
	if (dr) dr.remove();
	lay.classList.remove("desk");
}
function injectMapZoomBar() {
	const hdr = document.querySelector("#rp-map-col > div");
	if (!hdr || document.getElementById("map-zoom-bar")) return;
	const bar = document.createElement("span");
	bar.id = "map-zoom-bar";
	bar.innerHTML = "<button title=\"Zoom out\" onclick=\"mapZoom(-0.25)\">−</button><button title=\"Reset zoom\" onclick=\"mapZoom(0)\">⤢</button><button title=\"Zoom in\" onclick=\"mapZoom(0.25)\">+</button>";
	const fs = hdr.querySelector("button");
	if (fs) hdr.insertBefore(bar, fs);
	else hdr.appendChild(bar);
}
window.addEventListener("resize", () => {
	if (window.innerWidth < 821) teardownDeskLayout();
	else setupDeskLayout();
	applyMapZoom();
});
function ensureMobileDefault() {
	const lay = document.getElementById("rp-layout");
	if (lay && !/\bmv-(map|report|messages|orders)\b/.test(lay.className)) setMobileView("report");
}
function _makeProvLinkEl(id, name) {
	const sp = document.createElement("span");
	sp.className = "prov-link prov-auto";
	sp.setAttribute("data-prov-link", String(id));
	sp.title = `Hover to light up ${name} on the map — click or tap to show it`;
	sp.textContent = name;
	sp.onmouseenter = () => {
		highlightMapProv(id, true);
	};
	sp.onmouseleave = () => {
		highlightMapProv(id, false);
	};
	sp.onclick = (ev) => {
		ev.stopPropagation();
		locateOnMap(id);
	};
	return sp;
}
var _provLinking = false;
function linkProvinceNames(root) {
	if (!root || _provLinking) return;
	_buildProvNameIndex(viewingReport ?? currentReport);
	const provNameRe = _provNameRe, provNameMap = _provNameMap;
	if (!provNameRe) return;
	_provLinking = true;
	try {
		const walker = document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT, { acceptNode(n) {
			if (!n.nodeValue || n.nodeValue.length < 3) return window.NodeFilter.FILTER_REJECT;
			for (let el = n.parentNode; el && el !== root; el = el.parentNode) {
				if (_PROV_LINK_SKIP.has(el.nodeName) || el instanceof Element && el.namespaceURI === "http://www.w3.org/2000/svg") return window.NodeFilter.FILTER_REJECT;
				if (el instanceof Element && (el.classList.contains("prov-link") || el.classList.contains("no-prov-link"))) return window.NodeFilter.FILTER_REJECT;
				if (el instanceof HTMLElement && el.isContentEditable) return window.NodeFilter.FILTER_REJECT;
			}
			provNameRe.lastIndex = 0;
			return provNameRe.test(n.nodeValue) ? window.NodeFilter.FILTER_ACCEPT : window.NodeFilter.FILTER_REJECT;
		} });
		const hits = [];
		let n;
		while (n = walker.nextNode()) hits.push(n);
		hits.forEach((t) => {
			const txt = theWordsOfTheTextAccepted(t);
			const frag = document.createDocumentFragment();
			let last = 0, m;
			provNameRe.lastIndex = 0;
			while (m = provNameRe.exec(txt)) {
				if (m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
				const name = theProvinceNameMatched(m);
				if (provNameMap === null) throw new TypeError("Cannot read properties of null (reading 'get')");
				frag.appendChild(_makeProvLinkEl(provNameMap.get(name), name));
				last = m.index + name.length;
			}
			if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
			theParentOfTheTextAccepted(t).replaceChild(frag, t);
		});
	} catch {} finally {
		_provLinking = false;
	}
}
function theWordsOfTheTextAccepted(t) {
	const words = t.nodeValue;
	if (words === null) throw new TypeError("Cannot read properties of null (reading 'slice')");
	return words;
}
function theParentOfTheTextAccepted(t) {
	const parent = t.parentNode;
	if (parent === null) throw new TypeError("Cannot read properties of null (reading 'replaceChild')");
	return parent;
}
function theProvinceNameMatched(m) {
	const name = m[1];
	if (name === void 0) throw new TypeError("Cannot read properties of undefined (reading 'length')");
	return name;
}
var _provLinkObs = null;
var _provLinkTimer = null;
function ensureProvinceLinking() {
	const col = document.getElementById("rp-report-col");
	if (!col) return;
	linkProvinceNames(col);
	if (_provLinkObs || typeof MutationObserver === "undefined") return;
	const observer = new MutationObserver(() => {
		if (_provLinking) return;
		clearTimeout(_provLinkTimer ?? void 0);
		_provLinkTimer = setTimeout(() => {
			linkProvinceNames(document.getElementById("rp-report-col"));
		}, 60);
	});
	_provLinkObs = observer;
	observer.observe(col, {
		childList: true,
		subtree: true
	});
}
var _provHlTimer = null;
function locateOnMap(id) {
	try {
		if (window.innerWidth < 821) setMobileView("map");
		else if (typeof _deskLeftView !== "undefined" && _deskLeftView !== "map") setDeskView("left", "map");
	} catch {}
	setTimeout(() => {
		highlightMapProv(id, true);
		const g = document.querySelector(`#report-map-svg g[data-prov="${String(id)}"]`);
		try {
			const box = document.getElementById("report-map-container");
			if (g && box) {
				const r = g.getBoundingClientRect(), b = box.getBoundingClientRect();
				box.scrollLeft += r.left + r.width / 2 - (b.left + b.width / 2);
				box.scrollTop += r.top + r.height / 2 - (b.top + b.height / 2);
			}
		} catch {}
		clearTimeout(_provHlTimer ?? void 0);
		_provHlTimer = setTimeout(() => {
			highlightMapProv(id, false);
		}, 4e3);
	}, 60);
}
// src/ui/player/init.ts
function collectMessages() {
	return [];
}
globalThis.currentGamePlayerId = null;
globalThis.viewingReport = null;
globalThis.viewedTurn = null;
function snapshotTurnLabel(key) {
	return (parseInt(String(key)) || 0) + 1;
}
function refreshTurnNavHighlight() {
	const navEl = document.getElementById("turn-nav-btns");
	if (!navEl) return;
	const resolved = parseInt(navEl.dataset["resolved"] ?? "-1");
	[...navEl.children].filter((child) => child instanceof HTMLElement).forEach((btn) => {
		const d = parseInt(String(btn.dataset["turn"]));
		const isCurrent = d === resolved;
		const isViewed = viewedTurn != null && d === viewedTurn && !isCurrent;
		let bg = "transparent", border = "var(--stone)", color = "var(--stone)";
		if (isCurrent) {
			bg = "var(--crimson)";
			border = "var(--crimson)";
			color = "#fff";
		} else if (isViewed) {
			bg = "#b34a4a";
			border = "var(--crimson)";
			color = "#fff";
		}
		btn.style.cssText = `font-size:.68rem;padding:2px 8px;border:1px solid ${border};background:${bg};color:${color};cursor:pointer;border-radius:2px`;
	});
}
function jumpToReportSection(id) {
	const tgt = document.getElementById(id);
	if (!tgt) return;
	if (tgt.style.display === "none") return;
	const col = document.getElementById("rp-report-col");
	const bar = document.getElementById("report-jumpbar");
	const barH = bar ? bar.offsetHeight : 0;
	if (col && col.scrollHeight > col.clientHeight && getComputedStyle(col).overflowY !== "visible") {
		const top = col.scrollTop + tgt.getBoundingClientRect().top - col.getBoundingClientRect().top - barH;
		col.scrollTo({
			top: Math.max(0, top),
			behavior: "smooth"
		});
	} else {
		tgt.style.scrollMarginTop = `${String(barH)}px`;
		tgt.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}
}
function show(id) {
	try {
		_closeMapTip();
	} catch {}
	if (id !== "sec-report" && (location.hash || "").startsWith("#game=")) try {
		history.replaceState(null, "", location.pathname + location.search);
	} catch {}
	if (id !== "sec-report") try {
		stopMessagePolling();
		saveMessageReads();
	} catch {}
	document.querySelectorAll("section").forEach((s) => {
		s.classList.remove("section-active");
	});
	document.getElementById(id)?.classList.add("section-active");
	if (id === "sec-report") {
		ensureMobileDefault();
		if (window.innerWidth < 821) teardownDeskLayout();
		else setupDeskLayout();
	}
}
// src/ui/player/game-lists.ts
/** `value[key]` as JavaScript reads it (a game's state as parsed from JSON): for none, the TypeError that read throws. */
function theField(value, key) {
	if (value === null || value === void 0) throw new TypeError(`Cannot read properties of ${String(value)} (reading '${String(key)}')`);
	return Reflect.get(Object(value), key);
}
/** `a || b` on values of any kind (a game's state as parsed): `a` where it is truthy, else `b`. */
function thisOrElse$1(a, b) {
	if (a) return a;
	return b;
}
/** A game's state parsed from its JSON text: any value. */
function theStateParsed(text) {
	return JSON.parse(text);
}
/** `new Date(value)` on a value of any kind (a deadline as a game's state holds it), as the constructor reads it. */
function theDateOf(value) {
	const made = Reflect.construct(Date, [value]);
	if (made instanceof Date) return made;
	throw new TypeError("the Date constructor made no date");
}
/** Whether a value is a list (of values of any kind). */
function isAList(value) {
	return Array.isArray(value);
}
/** A list a value of a game's state holds, as `.some` reads it: any other value throws the TypeError `.some` threw. */
function theListToSearch(value) {
	if (isAList(value)) return value;
	throw new TypeError("the value searched is not a list");
}
/** The signed-in account's id, as `currentUser.id` read it: before sign-in, the TypeError that read threw. */
function theSignedInAccountsId() {
	if (currentUser === null) throw new TypeError("Cannot read properties of null (reading 'id')");
	return currentUser.id;
}
/** An element the page looked up and writes into, as the write read it: none throws the TypeError writing it threw. */
function theElementFound$1(el) {
	if (el === null) throw new TypeError("the page holds no element of the game lists");
	return el;
}
globalThis._pollTimer = null;
var _lastMyGamesSig = null;
var POLL_MS = 2e4;
function startUpdatePolling() {
	if (_pollTimer) return;
	_pollTimer = setInterval(() => {
		pollForUpdates();
	}, POLL_MS);
}
async function pollForUpdates() {
	if (!currentUser) return;
	if (document.hidden) return;
	try {
		const { data: mySlots } = await thePagesDb.thePlayersRealms.thisAccountsRealmsAndTheirOrdersFlags(currentUser.id);
		if (!mySlots?.length) return;
		const gameIds = [...new Set(mySlots.map((s) => s.game_id))];
		const { data: games } = await thePagesDb.thePlayersGames.theTurnAndStateOfTheseGames(gameIds);
		const gById = Object.fromEntries((games ?? []).map((g) => [g.id, g]));
		const { data: pollSlots } = await fetchGameSlots(gameIds);
		const _tally = {};
		pollSlots.forEach((r) => {
			if (r.is_bot) return;
			const t = _tally[r.game_id] = _tally[r.game_id] ?? [0, 0];
			t[1]++;
			if (r.orders_submitted) t[0]++;
		});
		const active = _activeSectionId();
		const _unread = active === "sec-games" ? await fetchUnreadDispatchCounts(mySlots, pollSlots) : {};
		const sig = mySlots.map((s) => {
			const g = gById[s.game_id] ?? {};
			const t = _tally[s.game_id] ?? [0, 0];
			return `${s.id}:${String(Number(g.turn) || 0)}:${g.status ?? ""}:${String(s.orders_submitted ? 1 : 0)}:${String(t[0])}/${String(t[1])}:u${String(_unread[s.game_id] ?? 0)}`;
		}).sort().join("|");
		if (active === "sec-games") {
			if (sig !== _lastMyGamesSig) {
				_lastMyGamesSig = sig;
				loadMyGames();
			}
		} else if (active === "sec-report" && currentGamePlayer) {
			const g = gById[String(currentGamePlayer.game_id)];
			const openLiveTurn = Number(currentGamePlayer._liveTurn) || 0;
			if (g && (g.turn || 0) > openLiveTurn) {
				const b = document.getElementById("new-turn-banner");
				if (b) b.style.display = "flex";
			}
		}
		_lastMyGamesSig = sig;
	} catch {}
}
async function loadMyGames() {
	const el = document.getElementById("my-games-list");
	const { data: mySlots, error } = await thePagesDb.thePlayersRealms.everyRealmOfThisAccount(theSignedInAccountsId());
	if (error) {
		theElementFound$1(el).innerHTML = String(kcHtml`<div class="msg-error">${error.message}</div>`);
		return;
	}
	if (!mySlots || mySlots.length === 0) {
		theElementFound$1(el).innerHTML = "<div style=\"color:#3a3224;font-size:.85rem;font-style:italic\">You are not enrolled in any games yet. Join an open game below.</div>";
		return;
	}
	const gameIds = mySlots.map((s) => s.game_id);
	const { data: games, error: gErr } = await fetchGamesLite(gameIds);
	if (gErr) {
		theElementFound$1(el).innerHTML = String(kcHtml`<div class="msg-error">${gErr.message}</div>`);
		return;
	}
	const gamesById = Object.fromEntries((games ?? []).map((g) => [g.id, g]));
	const { data: allSlots } = await fetchGameSlots(gameIds);
	const slotsByGame = {};
	allSlots.forEach((s) => {
		(slotsByGame[s.game_id] = slotsByGame[s.game_id] ?? []).push(s);
	});
	const unreadByGame = await fetchUnreadDispatchCounts(mySlots, allSlots);
	const cardOf = (slot) => {
		const g = gamesById[slot.game_id];
		if (!g) return kcHtml`<div class="msg-info">Game data not available yet — the GM may still be setting up.</div>`;
		const statusLabel = slot.orders_submitted ? "Orders submitted" : g.status === "active" ? "Orders needed" : g.status === "setup" ? "Waiting to start" : "Complete";
		const pillClass = slot.orders_submitted ? "pill-blue" : g.status === "active" ? "pill-amber" : g.status === "setup" ? "pill-green" : "";
		const _arch = gameArchivedP(g) ? kcHtml` <span class="pill" style="background:#e4d4b0;color:#4a3105">🗄 Archived by the GM</span>` : "";
		const tally = ordersInTextP(g, slotsByGame[slot.game_id]), deadline = turnDeadlineText(g);
		return kcHtml`<div class="game-card clickable" onclick="openGameFresh(${kcArg(slot.id)})"${gameArchivedP(g) ? kcHtml` style="opacity:.85"` : ""}>
      <div class="gc-name">${g.name} <span class="pill ${pillClass}">${statusLabel}</span>${_arch}${unreadDispatchPillP(unreadByGame[slot.game_id])}</div>
      <div class="gc-meta">
        Your realm: <strong>${slot.display_name || "(joining…)"}</strong> ·
        Turn ${g.turn || 0}
      </div>
      ${tally ? kcHtml`<div class="gc-meta" style="margin-top:3px">${tally}</div>` : ""}
      ${deadline ? kcHtml`<div class="gc-meta" style="margin-top:3px">${deadline}</div>` : ""}
    </div>`;
	};
	const _liveSlots = mySlots.filter((slot) => {
		const g = gamesById[slot.game_id];
		return !(g && gameArchivedP(g));
	});
	const _archSlots = mySlots.filter((slot) => {
		const g = gamesById[slot.game_id];
		return !!(g && gameArchivedP(g));
	});
	const theLiveCards = _liveSlots.length ? String(kcHtml`${_liveSlots.map(cardOf)}`) : "<div style=\"color:#3a3224;font-size:.85rem;font-style:italic\">No active games — your archived games are listed further down.</div>";
	theElementFound$1(el).innerHTML = theLiveCards;
	renderArchivedGamesCard(_archSlots.map(cardOf));
}
var ARCH_CARD_KEY = "kc_archived_games_min";
function archivedCardMinimised() {
	try {
		return localStorage.getItem(ARCH_CARD_KEY) === "1";
	} catch {
		return false;
	}
}
function renderArchivedGamesCard(cards) {
	const card = document.getElementById("archived-games-card");
	if (!card) return;
	if (!cards.length) {
		card.style.display = "none";
		return;
	}
	card.style.display = "";
	const cnt = document.getElementById("archived-games-count");
	if (cnt) cnt.textContent = `(${String(cards.length)})`;
	const list = document.getElementById("archived-games-list");
	if (list) list.innerHTML = String(kcHtml`${cards}`);
	applyArchivedCardState();
}
function applyArchivedCardState() {
	const min = archivedCardMinimised();
	const list = document.getElementById("archived-games-list");
	if (list) list.style.display = min ? "none" : "";
	const b = document.getElementById("archived-games-toggle");
	if (b) {
		b.innerHTML = min ? "&#9656; show" : "&#9662; minimise";
		b.setAttribute("aria-expanded", min ? "false" : "true");
	}
}
function toggleArchivedGamesCard() {
	const min = !archivedCardMinimised();
	try {
		if (min) localStorage.setItem(ARCH_CARD_KEY, "1");
		else localStorage.removeItem(ARCH_CARD_KEY);
	} catch {}
	applyArchivedCardState();
}
async function fetchUnreadDispatchCounts(mySlots, allSlots) {
	const out = {};
	try {
		const humans = {};
		_msgArr(allSlots).forEach((s) => {
			if (s && !s.is_bot) {
				const k = s.game_id;
				humans[k] = (humans[k] ?? 0) + 1;
			}
		});
		const mine = {};
		_msgArr(mySlots).forEach((s) => {
			const k = s.game_id;
			if ((humans[k] ?? 0) >= 2 && _msgNum(s.player_index) != null) mine[k] = _msgNum(s.player_index);
		});
		const ids = Object.keys(mine);
		if (!ids.length) return out;
		const { data: rows, error } = await thePagesDb.theDispatches.theNewestDispatchesOfTheseGamesGamesAndRealms(ids);
		if (error || !rows) return out;
		let reads = [];
		try {
			const r = await thePagesDb.theDispatches.thisAccountsReadMarksInTheseGames(ids, theSignedInAccountsId());
			if (!r.error) reads = _msgArr(r.data);
		} catch {}
		const seenBy = {};
		reads.forEach((r) => {
			const k = r.game_id;
			if (mine[k] !== _msgNum(r.player_index)) return;
			const m = r.reads;
			seenBy[k] = m && typeof m === "object" && !Array.isArray(m) ? m : {};
		});
		rows.forEach((r) => {
			const k = r.game_id;
			if (!(k in mine)) return;
			if (_msgNum(r.from_index) === mine[k]) return;
			const ch = msgChannelKeyOf(r);
			const seen = _msgNum(Reflect.get(seenBy[k] ?? {}, ch)) ?? 0;
			if ((_msgNum(r.id) ?? 0) > seen) out[k] = (out[k] ?? 0) + 1;
		});
	} catch {}
	return out;
}
function unreadDispatchPillP(n) {
	if (!n) return "";
	return kcHtml` <span class="pill" style="background:#a32020;color:#fff" title="${n} unread dispatch${n !== 1 ? "es" : ""} — open the game and choose ✉ Dispatches">✉ ${n > 99 ? "99+" : n} new</span>`;
}
function parseGameStateP(g) {
	try {
		return typeof g.game_state === "string" ? theStateParsed(g.game_state) : thisOrElse$1(g.game_state, {});
	} catch {
		return {};
	}
}
function gameArchivedP(g) {
	const m = gameMetaOf(g);
	if (m?.["archived"] !== void 0) return !!m["archived"];
	return !!theField(parseGameStateP(g), "archived");
}
async function fetchGamesLite(ids) {
	let r = await thePagesDb.thePlayersGames.theseGamesForTheirCards(ids);
	if (r.error && /meta/i.test(r.error.message || "")) r = await thePagesDb.thePlayersGames.theseGamesEveryColumn(ids);
	return r;
}
function realmExemptFromOrdersP(G, idx) {
	const pl = theField(thisOrElse$1(G ? theField(G, "players") : G, []), idx);
	if (!pl) return false;
	if (theField(pl, "conceded") || theField(pl, "_eliminated")) return true;
	const hasProv = Number(theField(thisOrElse$1(theField(pl, "provinces"), []), "length")) > 0;
	const hasChar = theListToSearch(thisOrElse$1(G ? theField(G, "characters") : G, [])).some((c) => Boolean(c) && Boolean(theField(c, "alive")) && theField(c, "player") === idx);
	return !hasProv && !hasChar;
}
function realmExemptInP(g, idx) {
	const m = gameMetaOf(g);
	const exempt = m ? m["exempt"] : void 0;
	if (isAList(exempt)) return exempt.includes(idx);
	return realmExemptFromOrdersP(parseGameStateP(g), idx);
}
function ordersInTextP(g, slots) {
	if (g?.status !== "active") return "";
	const need = (slots ?? []).filter((p) => Boolean(p && !p.is_bot && !realmExemptInP(g, p.player_index)));
	if (need.length === 0) return "";
	const inN = need.filter((p) => p.orders_submitted).length;
	const waiting = need.length - inN;
	const head = kcHtml`📜 <strong>${inN} of ${need.length}</strong> realm${need.length !== 1 ? "s" : ""} have sent orders`;
	return waiting === 0 ? kcHtml`${head} — every realm is in, so the turn can be run.` : kcHtml`${head} — still waiting on ${waiting} more.`;
}
function turnModeOfGame(g) {
	let gs = gameMetaOf(g);
	if (!gs) try {
		gs = typeof g.game_state === "string" ? theStateParsed(g.game_state) : thisOrElse$1(g.game_state, {});
	} catch {
		gs = {};
	}
	const held = gs ? theField(gs, "turnMode") : gs;
	const tm = held && typeof held === "object" ? held : {};
	const mode = Reflect.get(tm, "mode");
	return {
		mode: [
			"manual",
			"auto",
			"deadline"
		].includes(mode) ? mode : "manual",
		nextDeadlineAt: thisOrElse$1(Reflect.get(tm, "nextDeadlineAt"), null)
	};
}
function fmtDeadlineP(iso) {
	if (!iso) return "";
	try {
		return theDateOf(iso).toLocaleString(void 0, {
			weekday: "short",
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit"
		});
	} catch {
		return inWords(iso);
	}
}
function turnDeadlineText(g) {
	if (g?.status !== "active") return "";
	const tm = turnModeOfGame(g);
	if (tm.mode === "auto") return kcHtml`⚙️ Turn ${g.turn} resolves automatically as soon as every realm has sent its orders.`;
	if (tm.mode === "deadline" && tm.nextDeadlineAt) {
		const late = Date.now() >= theDateOf(tm.nextDeadlineAt).getTime();
		return kcHtml`⏱ Turn ${g.turn} deadline: <strong>${fmtDeadlineP(tm.nextDeadlineAt)}</strong> (your local time)${late ? " — passed; the turn is being resolved" : ""}. It resolves at that time, or sooner if every realm has sent its orders. Orders not in by then hold (Defend).`;
	}
	return "";
}
async function loadOpenGames() {
	const el = document.getElementById("open-games-list");
	const { data: mySlots } = await thePagesDb.thePlayersRealms.theGamesOfThisAccountsRealms(theSignedInAccountsId());
	const myGameIds = new Set((mySlots ?? []).map((s) => s.game_id));
	const { data: games, error } = await thePagesDb.thePlayersGames.theGamesInSetup();
	if (error) {
		theElementFound$1(el).innerHTML = String(kcHtml`<div class="msg-error">${error.message}</div>`);
		return;
	}
	if (!games || games.length === 0) {
		theElementFound$1(el).innerHTML = "<div style=\"color:#3a3224;font-size:.85rem;font-style:italic\">No open games at the moment. Ask your GM to create one.</div>";
		return;
	}
	const { data: allSlots } = await fetchGameSlots(games.map((g) => g.id));
	const slotsByGame = {};
	allSlots.forEach((s) => {
		const list = slotsByGame[s.game_id] ?? [];
		slotsByGame[s.game_id] = list;
		list.push(s);
	});
	const gmIds = [...new Set(games.map((g) => g.gm_user_id).filter((id) => Boolean(id)))];
	const gmNameById = {};
	if (gmIds.length) {
		const { data: gmProfiles } = await thePagesDb.theAccountsNames.theNamesOfTheseAccounts(gmIds);
		(gmProfiles ?? []).forEach((pr) => {
			gmNameById[pr.id] = pr.name;
		});
	}
	const SIZE_LABEL = {
		p2: "2 realms (8×5)",
		p3: "3 realms (8×7)",
		p4: "4 realms (9×7)",
		p5: "5 realms (12×7)",
		p6: "6 realms (15×7)",
		p7: "7 realms (16×7)",
		p8: "8 realms (17×8)",
		p9: "9 realms (16×11)",
		p10: "10 realms (16×11)"
	};
	const gameInfo = (g) => {
		let cfg = {};
		try {
			cfg = typeof g.game_state === "string" ? theStateParsed(g.game_state) : thisOrElse$1(g.game_state, {});
		} catch {}
		const _sp = parseInt(String(theField(cfg, "seaPct")));
		const seaPct = Number.isFinite(_sp) ? Math.max(20, Math.min(80, _sp)) : 35;
		return {
			gm: (gmNameById[String(g.gm_user_id)] ?? "") || "the Game Master",
			size: (SIZE_LABEL[String(theField(cfg, "mapSize"))] ?? "—") + ", " + String(seaPct) + "% sea"
		};
	};
	const humanCapOf = (g) => {
		let cfg = {};
		try {
			cfg = typeof g.game_state === "string" ? theStateParsed(g.game_state) : thisOrElse$1(g.game_state, {});
		} catch {}
		const maxP = g.max_players || 4;
		if (theField(cfg, "allBot") === true) return 0;
		const bots = Math.max(0, Math.min(parseInt(String(theField(cfg, "botCount"))) || 0, maxP));
		return Math.max(0, maxP - bots);
	};
	const visOf = (g) => {
		let cfg = {};
		try {
			cfg = typeof g.game_state === "string" ? theStateParsed(g.game_state) : thisOrElse$1(g.game_state, {});
		} catch {}
		const isPrivate = theField(cfg, "visibility") === "private";
		const invited = isPrivate ? theField(cfg, "invited") : void 0;
		return {
			private: isPrivate,
			invited: isPrivate && isAList(invited) ? invited : []
		};
	};
	const canSee = (g) => {
		const v = visOf(g);
		return !v.private || v.invited.includes(theSignedInAccountsId());
	};
	const openGames = games.filter((g) => {
		if (myGameIds.has(g.id)) return false;
		if (!canSee(g)) return false;
		return (slotsByGame[g.id] ?? []).filter((p) => !p.is_bot).length < humanCapOf(g);
	});
	if (openGames.length === 0) {
		theElementFound$1(el).innerHTML = "<div style=\"color:#3a3224;font-size:.85rem;font-style:italic\">No open games at the moment. Ask your GM to create one.</div>";
		return;
	}
	const theOpenCards = String(kcHtml`${openGames.map((g) => {
		const joined = (slotsByGame[g.id] ?? []).filter((p) => !p.is_bot).length;
		const maxP = humanCapOf(g);
		const info = gameInfo(g);
		const privBadge = visOf(g).private ? kcHtml` <span class="pill pill-blue">🔒 Invited</span>` : "";
		return kcHtml`<div class="game-card clickable" onclick="showJoinGame(${kcArg(g.id)},${kcArg(g.name)},${kcArg(maxP)},${kcArg(joined)},${kcArg(info.gm)},${kcArg(info.size)})">
      <div class="gc-name">${g.name} <span class="pill pill-green">Open</span>${privBadge}</div>
      <div class="gc-meta">GM: <strong>${info.gm}</strong> · World: ${info.size} · ${joined}/${maxP} players joined</div>
      <div class="gc-meta" style="opacity:.7">Click to join this game</div>
    </div>`;
	})}`);
	theElementFound$1(el).innerHTML = theOpenCards;
}
async function loadAllGames() {
	await Promise.all([
		loadMyGames(),
		loadOpenGames(),
		loadGmOffer()
	]);
}
async function loadGmOffer() {
	const el = document.getElementById("gm-offer-banner");
	const { data, error } = await thePagesDb.theRoles.theGameMasterOfferMadeToThisAccount(theSignedInAccountsId());
	const open = !error && data && !data.accepted_at;
	if (open) {
		theElementWithTheId("gm-offer-ask", HTMLElement).style.display = "block";
		theElementWithTheId("gm-offer-done", HTMLElement).style.display = "none";
	}
	theElementFound$1(el).style.display = open ? "block" : "none";
}
// src/ui/player/briefing-and-submit.ts
/** The realm's seat the page holds now (`currentGamePlayer`), read again after an await: another handler may have
*  changed it meanwhile, which the compiler's narrowing of a global doesn't see. */
function theSeatOpenNow() {
	return currentGamePlayer;
}
/** `a || b` on values of any kind (a field's value, a hero's mark): `a` where it is truthy, else `b`. */
function thisOrElse(a, b) {
	if (a) return a;
	return b;
}
function updateAlignmentDesc() {
	const sel = document.getElementById("join-alignment");
	const desc = document.getElementById("join-alignment-desc");
	if (!(sel instanceof HTMLSelectElement) || !desc) return;
	desc.innerHTML = String(bulletizeDesc({
		Divine: "✨ **Divine:** The holy crown. Best battle fervour in the game (50% chance your host fights fanatically). Your king may **Consecrate** provinces: +50% tax and much stiffer defence. A fallen character returns to life one turn later on consecrated ground — no other realm can do that. Heroes heal twice as fast resting. Will not hire Undead heroes, and dark ones cost extra. One Divine realm per game.",
		Good: "⚔ **Good:** The steady defender. 40% fervour, +10% strength defending land you own, and better odds that your armies join up for a combined attack. **Call to Arms** gives the king a free garrison unit in one of your provinces every turn. Heroes of most alignments are cheap to hire. A forgiving choice.",
		Druidic: "🌿 **Druidic:** The wild crown. Your king starts with Druid +1, and every character leads **Creature** armies (thunderbirds, ents, bears, giants, unicorns, mammoths, rocs, whales and great turtles) with no Druid penalty, and every level of Druid they do hold makes those beasts stronger; a hero leads at most as many beasts as his Druid level. Creature armies fight at ×1.5 in forest and jungle.",
		Neutral: "⚖ **Neutral:** The merchant crown, and the easiest to learn. **+20% tax from every province**, the cheapest heroes in the world (2–3g whatever their alignment), and Sage discoveries come twice as often. **Broker** lets the king hire a distant wandering hero, or buy a spy report on anywhere you have seen, without leaving home.",
		Pagan: "🔥 **Pagan:** The old gods, for a price. King starts with Explorer +1. At a discovered ritual site you may **Perform Rite**: the **Wild Hunt** binds two of that province's beasts to your host — the only way to field Creatures or Monsters with no Druid magic — or a **Blood Offering** sacrifices units to make an equal number far better. You also earn +1g for every enemy unit you destroy in a victory.",
		Evil: "💀 **Evil:** The tyrant. Your king starts with Druid +1, and every character leads **Monster** armies (trolls, basilisks, manticores, dragons, krakens) with no Druid penalty, at most as many as his Druid level; a Monster in the host lifts the whole host to ×1.25 in every battle. A crushing win leaves the enemy in Terror (−10% in their next fight), and your Monsters fight ×1.5 attacking ground your Terror grips (**Reign of Fear**). Each conquest is either **looted** for half the province's tax value in gold, or **enslaved** for a free garrison unit at the cost of its tax for three turns — your choice, character by character.",
		Undead: "💀 **Undead:** The deathless. King starts with Necromancy +1 and a free skeletal unit. Skeletal armies cost just 1g, need no Druid skill, **always** fight fanatically (+50% under the king, +30% under a hero), and never lose men fleeing a lost battle. **Harvest the Field** raises a grave as a soldier for 2g with no magic at all. Will not hire Divine heroes. One Undead realm per game."
	}[sel.value] ?? ""));
}
function unitAbilityText(type) {
	return UNIT_ABILITIES[type] ?? "";
}
function itemLoreTip(it, inner) {
	return inner;
}
function itemAcquiredTagP(it) {
	if (!it || !Reflect.get(Object(it), "acquiredThisTurn")) return "";
	return kcHtml`<span title="Acquired this turn" style="display:inline-block;font-size:.7rem;color:#123008;background:#eaf5e2;border:1px solid #5d8a3c;border-radius:2px;padding:0 5px;margin-right:5px;vertical-align:1px;white-space:nowrap">🆕 Acquired this turn</span>`;
}
function unitAbilityTip(type, inner) {
	const ab = unitAbilityText(type);
	if (!ab) return inner;
	return kcHtml`<span title="${ab}" style="cursor:help;border-bottom:1px dotted var(--stone)">${inner}</span>`;
}
function updateRaceDesc() {
	const sel = document.getElementById("join-race");
	const desc = document.getElementById("join-race-desc");
	if (!(sel instanceof HTMLSelectElement) || !desc) return;
	desc.innerHTML = String(bulletizeDesc({
		Human: "🛡 **Human:** The all-rounders — the widest choice of troops (Levies and sturdy Men-at-Arms, Longbows, the best horse in the game) and the strongest navy (the Galleons). Their units also **learn twice as fast**, so a Human army improves quickly with drilling and battle. No terrain is closed to them. Feud with Orcs. The easiest race to play.",
		Elven: "🏹 **Elven:** Archers and woodsmen. Elven troops fight at **×1.5 in forest and jungle**, and an Elven unit that would be destroyed often slips away home instead of dying. Swift Eagle Riders scout and strike, and Stag Riders are the one cavalry at home among the trees. Weakest in the open. Feud with Dwarves.",
		Dwarven: "⛏ **Dwarven:** The anvil. Dwarven troops fight at **×1.5 whenever they defend**, and every Dwarven character of a Dwarven realm wears **Mithril Armour** — 2 less damage from every blow and arrow they take. Mountain Guns and armoured Ironclads hit very hard, and Ironhoof Rams are the one cavalry sure-footed in the mountains. Slow to march. Feud with Elves.",
		Orcish: "⚔ **Orcish:** The horde. Cheap, fast troops you can afford in numbers — Goblin Hordes (two a turn), Black Arrows, Warg Riders, Berserkers and flying Wyvern Riders. Orcish characters start with **18 HP instead of 15** and harden faster. Quality is poor; you win by numbers and speed. Feud with Humans."
	}[sel.value] ?? ""));
}
function updateTemperDesc() {
	const sel = document.getElementById("join-temper");
	const desc = document.getElementById("join-temper-desc");
	if (!(sel instanceof HTMLSelectElement) || !desc) return;
	desc.innerHTML = String(bulletizeDesc({
		Berserk: "🔥 **Berserk:** The hammer. +18% to hit and +3 damage in melee — far the hardest hitter — and shrugs off 12% of every blow and arrow. But enemies hit them 10% more easily, and they fight on until nearly dead. The most likely of all to be killed.",
		Brave: "🦁 **Brave:** The soldier. Good at everything (+12% melee, +8% archery, +1 damage) and, once per fight, **Second Wind**: when first badly wounded they recover about a quarter of their health. No weakness. The safe default.",
		Cautious: "🧭 **Cautious:** The survivor. Enemies are 14% less likely to hit them (and can never beat 66% however skilled), every melee blow that does land does 2 less damage, and a missed attack draws a **40% riposte**. No attack bonus — they win by outlasting. The hardest king to kill.",
		Cowardly: "🏃 **Cowardly:** The archer and the spy. +22% archery, +15% to Steal, best in the game at breaking off and fleeing, and if struck down they may beg for mercy and be spared. Poor with a blade. The sensible choice for a king you cannot afford to lose."
	}[sel.value] ?? ""));
}
function normalSubmitWrapHtml(verb) {
	const turn = (currentReport?._liveTurn ?? 0) || (currentReport?.turn ?? 0) || 1;
	return kcHtml`
    <button class="btn btn-ghost" onclick="doSaveOrders()" style="flex:0 0 auto;padding:10px 16px">💾 Save Draft</button>
    <button class="btn btn-crimson btn-full" id="submit-btn" onclick="submitOrders()" style="flex:1;padding:12px;font-size:.85rem">
      ${verb || "Submit"} Orders for Turn ${turn}
    </button>`;
}
function setOrdersSubmittedUI(submitted) {
	if (currentGamePlayer) currentGamePlayer.orders_submitted = !!submitted;
	const pill = document.getElementById("report-status-pill");
	if (pill) pill.innerHTML = submitted ? "<span class=\"pill pill-blue\">✓ Orders submitted</span>" : "<span class=\"pill pill-amber\">⏳ Orders needed</span>";
}
function restoreSubmitWrap(verb) {
	const w = document.getElementById("orders-submit-wrap");
	if (!w) return;
	w.innerHTML = String(normalSubmitWrapHtml(verb));
	w.style.display = "flex";
	w.style.gap = "8px";
}
function cancelSubmit() {
	theElementWithTheId("orders-msg", HTMLElement).innerHTML = "";
	restoreSubmitWrap("Submit");
}
async function doSaveOrders() {
	const chars = currentReport?.characters ?? [];
	const orders = {};
	const encounterPlans = {};
	chars.forEach((c) => {
		orders[c.id] = SEASONS.map((_, ph) => {
			const action = theFieldOrNoWords(theValueOfThePagesField(`po-action-${String(c.id)}-${String(ph)}`));
			const target = getOrderTarget(c.id, ph);
			return {
				action,
				target,
				extra: getOrderExtra(c.id, ph),
				desc: inWords(action) + (target ? " — " + inWords(target) : "")
			};
		});
		const tacHidden = document.getElementById(`ep-tactics-${String(c.id)}`);
		const notesEl = document.getElementById(`ep-notes-${String(c.id)}`);
		const preSchool = theWordsAFieldHolds(theFieldOrNoWords(theValueOfThePagesField(`ep-preschool-${String(c.id)}`))).toLowerCase();
		if (tacHidden instanceof HTMLInputElement) {
			const tacts = (tacHidden.value || "ME").split(",").filter(Boolean);
			if (preSchool) tacts.push(`CS:${preSchool}`);
			encounterPlans[c.id] = {
				tactics: tacts,
				notes: theFieldOrNoWords(notesEl ? theValueOfAField(notesEl) : void 0),
				duelStance: thisOrElse(theValueOfThePagesField(`ep-duel-${String(c.id)}`), "refuse"),
				evilMode: thisOrElse(theValueOfThePagesField(`ep-evilmode-${String(c.id)}`), void 0)
			};
		}
	});
	const gp = currentGamePlayer;
	if (!gp?.id) {
		console.warn("doSaveOrders: no currentGamePlayer");
		return;
	}
	if (document.getElementById("prev-report-banner")?.style.display === "block") {
		console.warn("doSaveOrders: blocked — viewing past turn report");
		return;
	}
	const kingSkills = {};
	chars.forEach((c) => {
		if (c._isHeir) kingSkills[c.id] = {
			skills: c.skills ?? {},
			pending: thisOrElse(c._pendingSkillAllocation, 0),
			name: c.name ?? "",
			temper: c.temper ?? "",
			base: c._heirBase ?? c.skills ?? {}
		};
	});
	const _draftTurn = (currentReport?._liveTurn ?? 0) || (currentReport?.turn ?? 0) || 1;
	const _payload = JSON.stringify({
		orders,
		encounterPlans,
		kingSkills,
		diplomacy: diploChoices,
		discoveryChoices,
		callReckoning: reckoningCall,
		concede: concedeGame,
		messages: collectMessages(),
		heroOrder: currentHeroOrderP(),
		forTurn: _draftTurn
	});
	const { error: saveErr } = await thePagesDb.theOrders.saveThisRealmsDraft(gp.id, _payload);
	if (saveErr) {
		console.error("Save draft error:", saveErr.message);
		return;
	}
	if (currentGamePlayer) currentGamePlayer.orders = _payload;
	setOrdersSubmittedUI(false);
	const msg = document.getElementById("save-msg");
	if (msg) {
		msg.style.display = "block";
		setTimeout(() => {
			msg.style.display = "none";
		}, 3e3);
	}
}
async function doSubmitOrders() {
	const chars = currentReport?.characters ?? [];
	const btn = document.getElementById("submit-btn");
	if (btn instanceof HTMLButtonElement) {
		btn.disabled = true;
		btn.textContent = "Saving…";
	}
	const { data: freshGame } = await thePagesDb.theOrders.theTurnOfThisGame(String(currentGamePlayer?.game_id));
	const expectedTurn = (currentReport?._liveTurn ?? 0) || (currentReport?.turn ?? 0) || 1;
	if (freshGame && freshGame.turn !== expectedTurn) {
		const resolved = String(kcHtml`<div class="msg-error">⚠ The GM has already resolved this turn. Your orders were not saved — please reload the page to see your new turn report.</div>`);
		theElementWithTheId("orders-msg", HTMLElement).innerHTML = resolved;
		restoreSubmitWrap("Submit");
		return;
	}
	if (!currentGamePlayer?.id) {
		theElementWithTheId("orders-msg", HTMLElement).innerHTML = "<div class=\"msg-error\">Session error — please reload the page.</div>";
		restoreSubmitWrap("Submit");
		return;
	}
	const orders = {};
	const encounterPlans = {};
	chars.forEach((c) => {
		orders[c.id] = SEASONS.map((_, ph) => {
			const action = thisOrElse(theValueOfThePagesField(`po-action-${String(c.id)}-${String(ph)}`), "Defend");
			const target = getOrderTarget(c.id, ph);
			const extra = getOrderExtra(c.id, ph);
			const _spyName = action === "Spy" && inWords(theFieldOrNoWords(target)).startsWith("char:") ? ((currentReport?.visibleChars ?? []).find((x) => inWords(x.id) === inWords(target).slice(5))?.name ?? "") || null : null;
			const desc = inWords(action) + (target && action !== "Move" && action !== "Defend" && action !== "Rest" && action !== "Spy" && action !== "Explore" ? ` — ${inWords(target)}` : "") + (_spyName ? ` — on ${_spyName}` : "");
			if (action === "Search Lair" || action === "Search Feature") {
				const _pl = predictedLocation(c.id, ph);
				if (_pl?.id != null) return {
					action,
					target,
					extra,
					desc,
					prov: _pl.id
				};
			}
			return {
				action,
				target,
				extra,
				desc
			};
		});
		const tacHidden = document.getElementById(`ep-tactics-${String(c.id)}`);
		const notesEl = document.getElementById(`ep-notes-${String(c.id)}`);
		const preSchool = theWordsAFieldHolds(theFieldOrNoWords(theValueOfThePagesField(`ep-preschool-${String(c.id)}`))).toLowerCase();
		if (tacHidden instanceof HTMLInputElement) {
			const tacts = (tacHidden.value || "ME").split(",").filter(Boolean);
			if (preSchool) tacts.push(`CS:${preSchool}`);
			encounterPlans[c.id] = {
				tactics: tacts,
				notes: theFieldOrNoWords(notesEl ? theValueOfAField(notesEl) : void 0),
				duelStance: thisOrElse(theValueOfThePagesField(`ep-duel-${String(c.id)}`), "refuse"),
				evilMode: thisOrElse(theValueOfThePagesField(`ep-evilmode-${String(c.id)}`), void 0)
			};
		}
	});
	document.querySelectorAll("[id^=\"hired-hero-orders-\"]").forEach((card) => {
		const sel = card.querySelector("select[id^=\"po-action-hired_\"]");
		if (!sel) return;
		const cid = sel.id.replace(/^po-action-/, "").replace(/-\d+$/, "");
		orders[cid] = SEASONS.map((_, ph) => ({
			action: thisOrElse(theValueOfThePagesField(`po-action-${cid}-${String(ph)}`), "Defend"),
			target: getOrderTarget(cid, ph),
			extra: getOrderExtra(cid, ph),
			desc: ""
		}));
		const hTac = document.getElementById(`ep-tactics-${cid}`);
		if (hTac instanceof HTMLInputElement) {
			const hTacts = (hTac.value || "ME").split(",").filter(Boolean);
			const hPre = theWordsAFieldHolds(theFieldOrNoWords(theValueOfThePagesField(`ep-preschool-${cid}`))).toLowerCase();
			if (hPre) hTacts.push(`CS:${hPre}`);
			encounterPlans[cid] = {
				tactics: hTacts,
				notes: theFieldOrNoWords(theValueOfThePagesField(`ep-notes-${cid}`)),
				duelStance: thisOrElse(theValueOfThePagesField(`ep-duel-${cid}`), "refuse"),
				evilMode: thisOrElse(theValueOfThePagesField(`ep-evilmode-${cid}`), void 0)
			};
		}
	});
	document.querySelectorAll("[id^=\"resurrect-orders-\"]").forEach((card) => {
		const sel = card.querySelector("select[id^=\"po-action-resurrect_\"]");
		if (!sel) return;
		const rid = sel.id.replace(/^po-action-/, "").replace(/-\d+$/, "");
		orders[rid] = SEASONS.map((_, ph) => ({
			action: thisOrElse(theValueOfThePagesField(`po-action-${rid}-${String(ph)}`), "Defend"),
			target: getOrderTarget(rid, ph),
			extra: getOrderExtra(rid, ph),
			desc: ""
		}));
		const rTac = document.getElementById(`ep-tactics-${rid}`);
		if (rTac instanceof HTMLInputElement) encounterPlans[rid] = {
			tactics: (rTac.value || "ME").split(",").filter(Boolean),
			notes: theFieldOrNoWords(theValueOfThePagesField(`ep-notes-${rid}`)),
			duelStance: thisOrElse(theValueOfThePagesField(`ep-duel-${rid}`), "refuse")
		};
	});
	document.querySelectorAll("[id^=\"charm-orders-\"]").forEach((card) => {
		const sel = card.querySelector("select[id^=\"po-action-charm_\"]");
		if (!sel) return;
		const cid = sel.id.replace(/^po-action-/, "").replace(/-\d+$/, "");
		orders[cid] = SEASONS.map((_, ph) => ({
			action: thisOrElse(theValueOfThePagesField(`po-action-${cid}-${String(ph)}`), "Defend"),
			target: getOrderTarget(cid, ph),
			extra: getOrderExtra(cid, ph),
			desc: ""
		}));
		const cTac = document.getElementById(`ep-tactics-${cid}`);
		if (cTac instanceof HTMLInputElement) encounterPlans[cid] = {
			tactics: (cTac.value || "ME").split(",").filter(Boolean),
			notes: theFieldOrNoWords(theValueOfThePagesField(`ep-notes-${cid}`)),
			duelStance: thisOrElse(theValueOfThePagesField(`ep-duel-${cid}`), "refuse")
		};
	});
	const kingSkills = {};
	chars.forEach((c) => {
		if (c._isHeir) kingSkills[c.id] = {
			skills: c.skills ?? {},
			pending: thisOrElse(c._pendingSkillAllocation, 0),
			name: c.name ?? "",
			temper: c.temper ?? "",
			base: c._heirBase ?? c.skills ?? {}
		};
	});
	const _subPayload = JSON.stringify({
		orders,
		encounterPlans,
		kingSkills,
		diplomacy: diploChoices,
		discoveryChoices,
		callReckoning: reckoningCall,
		concede: concedeGame,
		messages: collectMessages(),
		heroOrder: currentHeroOrderP(),
		forTurn: expectedTurn
	});
	const { error } = await thePagesDb.theOrders.submitThisRealmsOrders(currentGamePlayer.id, _subPayload, (/* @__PURE__ */ new Date()).toISOString());
	if (error) {
		const refused = String(kcHtml`<div class="msg-error">Error: ${error.message}</div>`);
		theElementWithTheId("orders-msg", HTMLElement).innerHTML = refused;
		restoreSubmitWrap("Submit");
		return;
	}
	const seat = theSeatOpenNow();
	if (seat) seat.orders = _subPayload;
	theElementWithTheId("orders-msg", HTMLElement).innerHTML = "";
	const sent = String(kcHtml`
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;width:100%">
      <span style="color:var(--forest);font-size:.85rem;flex:1">✓ Orders submitted successfully! The GM will be notified.</span>
      <button class="btn btn-ghost" style="padding:8px 16px;font-size:.8rem" onclick="resubmitOrders()">↺ Resubmit Orders</button>
    </div>`);
	theElementWithTheId("orders-submit-wrap", HTMLElement).innerHTML = sent;
	setOrdersSubmittedUI(true);
	setMobileView("report");
}
// src/ui/player/join-and-chronicle.ts
async function showJoinGame(gameId, gameName, maxP, joined, gmName, worldSize) {
	joiningGame = {
		id: gameId,
		name: gameName,
		maxP,
		joined,
		gmName,
		worldSize
	};
	joinSkills = {};
	document.getElementById("join-game-title").textContent = `Join: ${gameName}`;
	document.getElementById("join-king-name").value = "";
	document.getElementById("join-msg").innerHTML = "";
	renderSkillGrid();
	show("sec-join");
	const { data: slots } = await fetchGameSlots([gameId]);
	const takenAlignments = new Set((slots || []).map((s) => s.alignment).filter(Boolean));
	const alignSel = document.getElementById("join-alignment");
	const UNIQUE_ALIGNS = ["Divine", "Undead"];
	let warningParts = [];
	Array.from(alignSel.options).forEach((opt) => {
		if (UNIQUE_ALIGNS.includes(opt.value) && takenAlignments.has(opt.value)) {
			opt.disabled = true;
			opt.text = `${opt.value} (taken)`;
			if (alignSel.value === opt.value) alignSel.value = "Neutral";
			warningParts.push(opt.value);
		} else {
			opt.disabled = false;
			opt.text = opt.value;
		}
	});
	const infoEl = document.getElementById("join-game-info");
	const takenNote = warningParts.length > 0 ? kcHtml`<div class="msg-warning" style="margin-top:6px">⚠ <strong>${warningParts.join(" and ")}</strong> alignment${warningParts.length > 1 ? "s are" : " is"} already taken in this game — only one player per game may be Divine or Undead.</div>` : "";
	infoEl.innerHTML = kcHtml`${kcHtml`<div style="background:#f5f0e8;border:1px solid var(--gold);border-radius:3px;padding:8px 12px;font-size:.82rem;line-height:1.6;margin-bottom:8px">
      <div>\u{1F451} <strong>Game Master:</strong> ${joiningGame?.gmName || "the Game Master"}</div>
      <div>\u{1F5FA}\uFE0F <strong>World size:</strong> ${joiningGame?.worldSize || "—"}</div>
    </div>`}<div class="msg-info">${joined}/${maxP} players have already joined. There ${maxP - joined === 1 ? "is" : "are"} ${maxP - joined} open slot${maxP - joined === 1 ? "" : "s"}.</div>${takenNote}`;
	updateAlignmentDesc();
	updateRaceDesc();
	updateTemperDesc();
}
var SKILL_INFO = {
	melee: "Close-quarters fighting. Raises your hit chance and damage in duels and monster encounters, and strengthens your character leading front-line troops. The King starts with Melee 2.",
	archery: kcHtml`Ranged combat. In an army battle it sharpens the <strong>pre-battle volley</strong> your ranged units loose before the lines close (each shot does 30% of the shooting unit's own strength, +10% per Archery level, doubled against winged riders; no unit can lose more than 40% of its strength to arrows, 80% for a winged rider) — and every level lifts the missile units you lead by <strong>+5% strength</strong> in the battle itself (Archery 5 = +25%). In personal combat a Fire action hits at 30% + 10% per level (then +5% a level past 5, capped 80%) for 1–3 damage plus half your Archery; at <strong>Archery 3 and above you loose two arrows per Fire action</strong>. A Fire action must first reach bow range — from spell range that is a speed check, from melee you must break away — and <strong>every level of Archery adds +5% to both of those checks</strong> (fieldcraft). An archer standing at bow range also gets a free <strong>parting shot</strong> at any foe who closes into melee. The King starts with Archery 1.`,
	tactical: "Battlefield command. Adds roughly +20% strength per level to your land armies in a battle — the single biggest force multiplier when attacking or defending provinces (land and air units — flyers included; fleets use Naval instead; land battles only).",
	march: "Marching & coordination. Improves the chance that your other armies link up as reinforcements (\"contingent unify\") when you attack the same province, and speeds your march: every unit you lead except flyers gains +0/+0/+1/+1/+2/+3 movement at March 0-5, and the column moves at its slowest unit's pace.",
	naval: kcHtml`Seamanship. Boosts the strength of your fleets and sea creatures in every battle, on land or at sea (+20% per level), and speeds them across the water. <strong>Sea movement points = the SLOWEST sea unit you lead, after each unit is improved by your Naval bonus</strong> — a squadron sails at the pace of its worst ship, just as a land column marches at the pace of its slowest army. The Naval bonus works like March: every ship and sea-beast gains +0/+0/+1/+1/+2/+3 at Naval 0-5, whatever its speed. A hero leading <em>no</em> armies always has 5 sea movement points — Naval skill is command of a fleet, not of a rowing boat. Essential for a maritime power.`,
	sage: "Scholarship. Unlocks the Research order (Sage 1+): each level gives a 5% chance per Research to make a permanent Sage Discovery (realm-wide bonuses). Also raises your chance of encounters while exploring. The King starts with Sage 1.",
	spy: "Espionage. Higher Spy reveals more detail on enemy provinces and characters, and lets your Spy orders reach further. Your best defence against being spied on, too.",
	thief: "Larceny. Improves success when stealing gold or magic items — via the Steal order (a hero's pack, their strongbox, or a garrison paymaster), by pickpocketing during encounters, and when lifting a lair's hoard (10% of the original hoard per level, capped at 5).",
	druid: kcHtml`Beast mastery. Required to command creature and monster armies without penalty — each level you fall short of an army's requirement costs it ~20% strength, and <strong>each level you hold above a Creature or Monster unit's requirement adds +20%</strong> (Druid counted to 9, up to +100%; where your realm waives the requirement every level counts). From Druid 3 a natural beast's blows land at half force against you in a personal encounter. Higher Druid unlocks the most powerful Creatures and Monsters.`,
	explorer: "Pathfinding. Speeds up how quickly you explore your provinces each turn, revealing hidden lairs and terrain sooner so you can search and settle faster.",
	white: "White Magic — holy spells: heal and bless, resurrect fallen heroes, and smite the undead and evil. Your level sets how many spells you can cast (Divine realms start with White 1).",
	psychic: "Psychic Magic — mind spells: Psychic Blast (direct damage that ignores armies), Telekinetic Storm, and Clairvoyance for long-range intelligence.",
	illusory: "Illusory Magic — deception spells: Mirror Image, Phantasmal Armies, Illusory Terrain, Invisibility and Hide Lairs. Confuse enemy intelligence and battles.",
	elemental: "Elemental Magic — destruction spells: Lightning Bolt, Fireball, Earthquake, Flood and Elemental Summon. Raw offensive power against armies and provinces.",
	necromancy: "Necromancy — death magic: raise Skeletal Armies from battlefield graves, Control Undead, Curse, Hand of Death and Plague (Undead realms start with Necromancy 1)."
};
function renderSkillGrid() {
	const remaining = 4 - Object.values(joinSkills).reduce((s, v) => s + v, 0);
	document.getElementById("join-pts-remaining").textContent = `${remaining} point${remaining !== 1 ? "s" : ""} remaining`;
	const pip = (skill) => {
		const lvl = joinSkills[skill] || 0;
		const displayName = SKILL_LABELS[skill] || skill;
		return kcHtml`<div class="skill-pip">
      <button onclick="adjustSkill(${kcArg(skill)},-1)" ${lvl <= 0 ? "disabled" : ""}>−</button>
      <span class="sk-name" onmousemove="showSkillTip(event,${kcArg(skill)})" onmouseleave="hideSkillTip()">${displayName}</span>
      <span class="sk-val">${lvl}</span>
      <button onclick="adjustSkill(${kcArg(skill)},1)" ${remaining <= 0 || lvl >= 2 ? "disabled" : ""}>+</button>
    </div>`;
	};
	document.getElementById("join-skills-grid").innerHTML = kcHtml`<div class="skill-cols">${SKILL_COLUMNS.map((col) => kcHtml`<div class="skill-col"><div class="skill-col-head">${col.head}</div>${col.skills.map(pip)}</div>`)}</div>`;
}
function showSkillTip(ev, skill) {
	let tip = document.getElementById("skill-info-tip");
	if (!tip) {
		tip = document.createElement("div");
		tip.id = "skill-info-tip";
		document.body.appendChild(tip);
	}
	tip.innerHTML = kcHtml`<strong>${SKILL_LABELS[skill] || skill}</strong><br>${SKILL_INFO[skill] || ""}`;
	tip.style.display = "block";
	const pad = 14, w = tip.offsetWidth || 250, h = tip.offsetHeight || 80;
	let x = ev.clientX + pad, y = ev.clientY + pad;
	if (x + w > window.innerWidth - 8) x = ev.clientX - w - pad;
	if (y + h > window.innerHeight - 8) y = ev.clientY - h - pad;
	tip.style.left = Math.max(8, x) + "px";
	tip.style.top = Math.max(8, y) + "px";
}
function hideSkillTip() {
	const tip = document.getElementById("skill-info-tip");
	if (tip) tip.style.display = "none";
}
function adjustSkill(skill, delta) {
	const spent = Object.values(joinSkills).reduce((s, v) => s + v, 0);
	const current = joinSkills[skill] || 0;
	if (delta > 0) {
		if (spent >= 4 || current >= 2) return;
	} else if (current <= 0) return;
	joinSkills[skill] = current + delta;
	if (joinSkills[skill] === 0) delete joinSkills[skill];
	renderSkillGrid();
}
async function joinGame() {
	const kingName = document.getElementById("join-king-name").value.trim();
	const kingdomName = document.getElementById("join-kingdom-name").value.trim();
	document.getElementById("join-race").value;
	document.getElementById("join-alignment").value;
	document.getElementById("join-temper").value;
	const msg = document.getElementById("join-msg");
	if (!kingName) {
		msg.innerHTML = "<div class=\"msg-error\">Please enter your King's name.</div>";
		return;
	}
	if (!kingdomName) {
		msg.innerHTML = "<div class=\"msg-error\">Please name your Realm.</div>";
		return;
	}
	const spent = Object.values(joinSkills).reduce((s, v) => s + v, 0);
	if (spent < 4) {
		msg.innerHTML = kcHtml`<div class="msg-warning">You still have ${4 - spent} skill point${4 - spent !== 1 ? "s" : ""} to spend. Are you sure? <button class="btn btn-gold" style="padding:4px 10px;margin-left:8px" onclick="doJoinGame(${kcArg(String(joiningGame.id))})">Join Anyway</button></div>`;
		return;
	}
	await doJoinGame(joiningGame.id);
}
var _joinInFlight = false;
var JOIN_DUP_MSG = kcHtml`You have already joined this game — a player may hold only one realm in any game. Open it from <strong>My Games</strong> instead.`;
async function doJoinGame(gameId) {
	if (_joinInFlight) return;
	const kingName = document.getElementById("join-king-name").value.trim();
	const kingdomName = document.getElementById("join-kingdom-name").value.trim() || kingName;
	const race = document.getElementById("join-race").value;
	const alignment = document.getElementById("join-alignment").value;
	const temper = document.getElementById("join-temper").value;
	const msg = document.getElementById("join-msg");
	if (["Divine", "Undead"].includes(alignment)) {
		const { data: slots2 } = await fetchGameSlots([gameId]);
		if (new Set((slots2 || []).map((s) => s.alignment).filter(Boolean)).has(alignment)) {
			msg.innerHTML = kcHtml`<div class="msg-error">⚠ The <strong>${alignment}</strong> alignment is already taken in this game. Only one player per game may choose Divine or Undead. Please choose a different alignment.</div>`;
			return;
		}
	}
	{
		const { data: mine, error: meErr } = await thePagesDb.thePlayersRealms.thisAccountsRealmsInThisGame(gameId, currentUser.id);
		if (meErr) {
			msg.innerHTML = kcHtml`<div class="msg-error">${meErr.message}</div>`;
			return;
		}
		if (mine && mine.length) {
			msg.innerHTML = kcHtml`<div class="msg-error">${JOIN_DUP_MSG}</div>`;
			setTimeout(() => {
				show("sec-games");
				loadAllGames();
			}, 2500);
			return;
		}
	}
	_joinInFlight = true;
	msg.innerHTML = "<div class=\"msg-info\">Joining game…</div>";
	{
		const { data: gRow } = await thePagesDb.thePlayersGames.thisGamesWorldAndState(gameId);
		let cfg = {};
		try {
			cfg = typeof gRow?.game_state === "string" ? JSON.parse(gRow.game_state) : gRow?.game_state || {};
		} catch (e) {}
		if (gRow?.status === "setup" && cfg.visibility === "private") {
			if (!(Array.isArray(cfg.invited) ? cfg.invited : []).includes(currentUser.id)) {
				_joinInFlight = false;
				msg.innerHTML = "<div class=\"msg-error\">This is a private game and you are not on its invite list. Ask the GM to invite you.</div>";
				return;
			}
		}
	}
	const { data: existingSlots, error: slotsErr } = await fetchGameSlots([gameId]);
	if (slotsErr) {
		_joinInFlight = false;
		msg.innerHTML = "<div class=\"msg-error\"></div>";
		msg.firstChild.textContent = slotsErr.message;
		return;
	}
	const takenIndices = new Set((existingSlots || []).map((s) => s.player_index));
	const maxP = joiningGame.maxP || 4;
	let nextIndex = 0;
	while (takenIndices.has(nextIndex) && nextIndex < maxP) nextIndex++;
	if (nextIndex >= maxP) {
		_joinInFlight = false;
		msg.innerHTML = "<div class=\"msg-error\">This game is now full.</div>";
		return;
	}
	const playerSetup = {
		kingName,
		kingdomName,
		race,
		alignment,
		temper,
		skills: joinSkills
	};
	const { data: slot, error } = await thePagesDb.thePlayersRealms.joinWithThisRealm({
		game_id: gameId,
		user_id: currentUser.id,
		player_index: nextIndex,
		display_name: kingdomName,
		orders_submitted: false,
		turn_report: JSON.stringify({
			playerSetup,
			status: "joined",
			waitingForTurn0: true
		})
	});
	_joinInFlight = false;
	if (error) {
		if (/one_per_number/.test(error.message || "")) {
			msg.innerHTML = "<div class=\"msg-error\">Another player joined this game at the same moment. Please press Join again.</div>";
			return;
		}
		if (error.code === "23505" || /duplicate key|unique constraint|one_per_user/i.test(error.message || "")) {
			msg.innerHTML = kcHtml`<div class="msg-error">${JOIN_DUP_MSG}</div>`;
			setTimeout(() => {
				show("sec-games");
				loadAllGames();
			}, 2500);
			return;
		}
		msg.innerHTML = kcHtml`<div class="msg-error">${error.message}<br><small>If this keeps happening, try refreshing the page and joining again.</small></div>`;
		return;
	}
	msg.innerHTML = "<div class=\"msg-success\">You have joined the game! Waiting for the GM to start Turn 0.</div>";
	setTimeout(() => {
		show("sec-games");
		loadAllGames();
	}, 2e3);
}
function intelSectionShell(inner) {
	const host = viewedTurn == null ? kcHtml`<div id="report-intel"></div>` : "";
	return kcHtml`<div class="char-chronicle intel-plain" id="intel-reports-section" style="margin-bottom:22px;border:1px solid #c8922a;border-radius:3px;overflow:hidden">
        <div class="cc-head" style="font-family:'Cinzel',serif;font-size:.88rem;color:#fff;
          padding:7px 12px;background:#c8922a;display:flex;align-items:center;gap:8px">
          <span style="font-size:1rem">👁</span>
          <span style="font-weight:600">Intelligence Reports</span>
          <button type="button" class="cc-toggle" title="Minimise / maximise" aria-expanded="true" onclick="toggleSection(this)">&#9662;</button>
        </div>
        <div style="padding:6px 8px">${inner || ""}${host}</div></div>`;
}
function buildChronicle(log, chars_for_log) {
	const PHASE_NAMES = KC_PHASE_NAMES.slice();
	const PHASE_COLORS = KC_PHASE_COLORS.slice();
	const _goActive = !!(currentReport && currentReport.titles && currentReport.titles.gameOver);
	const _GE_HEAD_RE = /^\s*(👑 THE RECKONING IS CALLED —|🏆 THE GAME IS DECIDED —)/;
	const _GE_STAND_RE = /^\s+\d+\.\s.+ — -?\d+ Legacy\b/;
	const _isGameEnd = (e) => !!e && (e.gameEnd || _goActive && e.charId == null && (_GE_HEAD_RE.test(e.text || "") || _GE_STAND_RE.test(e.text || "")));
	const _markRuns = (nodes, re, wrap) => nodes.flatMap((n) => {
		if (typeof n !== "string") return [{
			wrap: n.wrap,
			kids: _markRuns(n.kids, re, wrap)
		}];
		const out = [];
		let last = 0, m;
		re.lastIndex = 0;
		while (m = re.exec(n)) {
			if (!m[0]) {
				re.lastIndex++;
				continue;
			}
			out.push(n.slice(last, m.index), {
				wrap,
				kids: [m[0]]
			});
			last = m.index + m[0].length;
		}
		out.push(n.slice(last));
		return out.filter((x) => x !== "");
	});
	const _showRuns = (nodes) => nodes.map((n) => typeof n === "string" ? n : n.wrap(_showRuns(n.kids)));
	const _reText = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const _gameEndLines = (log || []).filter(_isGameEnd);
	if (_gameEndLines.length) log = log.filter((e) => !_isGameEnd(e));
	const _gameEndHtml = (() => {
		if (!_gameEndLines.length) return "";
		const _realms = (currentReport && currentReport.allKingdoms || []).filter((k) => k && k.name).sort((a, b) => b.name.length - a.name.length);
		const _tint = (txt) => {
			let h = [String(txt == null ? "" : txt)];
			_realms.forEach((k) => {
				if (!k.color) return;
				h = _markRuns(h, new RegExp(_reText(k.name), "g"), (x) => kcHtml`<strong style="color:${reportColour(k.color)}">${x}</strong>`);
			});
			return _showRuns(h);
		};
		const heads = _gameEndLines.filter((e) => !_GE_STAND_RE.test(e.text || ""));
		const rows = _gameEndLines.filter((e) => _GE_STAND_RE.test(e.text || ""));
		return kcHtml`${heads.map((e) => kcHtml`<div style="font-size:.8rem;color:#231e16;margin-top:6px;line-height:1.5">${_tint((e.text || "").trim())}</div>`)}${rows.length ? kcHtml`<div style="margin-top:8px;border-top:1px solid #d9c48f;padding-top:6px"><div style="font-family:'Cinzel',serif;font-size:.8rem;color:#5a4410;margin-bottom:3px">Final Legacy standings</div>${rows.map((e, i) => kcHtml`<div style="font-size:.8rem;color:#231e16;line-height:1.55;${i === 0 ? "font-weight:600;" : ""}">${_tint((e.text || "").trim())}</div>`)}</div>` : ""}`;
	})();
	const _reckoningBanner = (() => {
		const t = currentReport && currentReport.titles || {};
		if (t.gameOver) {
			const go = t.gameOver;
			return kcHtml`<div style="background:#fdf3d8;border:2px solid var(--gold);border-radius:3px;padding:9px 12px;margin-bottom:12px">
        <div style="font-family:'Cinzel',serif;font-size:.92rem;color:var(--crimson)">🏆 ${go.byConcession ? "The game is decided" : "The Reckoning is complete"} — ${go.winnerName || "No-one"} ${go.byElimination ? "is the last realm standing" : go.byConcession ? "holds the field as every rival concedes" : "is judged supreme"}!</div>
        ${_gameEndHtml || kcHtml`<div style="font-size:.76rem;color:#231e16;margin-top:3px">The game is over. See Titles &amp; Victory for the final standings.</div>`}
      </div>`;
		}
		if (_gameEndHtml) return kcHtml`<div style="background:#fdf3d8;border:2px solid var(--gold);border-radius:3px;padding:9px 12px;margin-bottom:12px">
        <div style="font-family:'Cinzel',serif;font-size:.92rem;color:var(--crimson)">🏆 The game is decided</div>${_gameEndHtml}</div>`;
		if (t.reckoning) {
			const r = t.reckoning;
			return kcHtml`<div style="background:#fdeaea;border:2px solid var(--crimson);border-radius:3px;padding:9px 12px;margin-bottom:12px">
        <div style="font-family:'Cinzel',serif;font-size:.9rem;color:var(--crimson)">👑 The Reckoning has been called${r.byName ? ` by ${r.byName}` : ""}!</div>
        <div style="font-size:.78rem;color:#444;margin-top:3px;line-height:1.5">The world will be judged at the end of <strong>Turn ${r.resolveAtTurn}</strong> unless the claim is broken before then. ${r.mine ? kcHtml`<strong>This is your claim — hold your dominance to the end.</strong>` : "Drive the claimant’s bloc below the threshold to shatter it and play on."}</div>
      </div>`;
		}
		return "";
	})();
	if (!log.length) document.getElementById("report-log").innerHTML = kcHtml`${_reckoningBanner}<em style="color:#3a3224;font-size:.85rem">No events yet.</em>${viewedTurn == null ? intelSectionShell("") : ""}`;
	else {
		const charEntries = {};
		const systemByPhase = {
			0: [],
			1: [],
			2: [],
			3: [],
			4: [],
			99: []
		};
		const intelByPhase = {
			0: [],
			1: [],
			2: [],
			3: [],
			4: [],
			99: []
		};
		const titleIntel = [];
		const dispatches = [];
		const TITLE_INTEL_RE = /^\[(The [^\]]+)\]\s*/;
		const orderedChars = [...chars_for_log].sort((a, b) => (b.isKing ? 1 : 0) - (a.isKing ? 1 : 0));
		orderedChars.forEach((c) => {
			charEntries[c.id] = {
				id: c.id,
				name: c.name,
				isKing: c.isKing,
				phases: [
					[],
					[],
					[],
					[],
					[],
					[]
				]
			};
		});
		log.forEach((e) => {
			if (e.env && !(e.charId != null && e.charId in charEntries)) return;
			const ph = e.phase != null && e.phase >= 0 && e.phase <= 4 ? e.phase : 99;
			const _txt = e.text || "";
			const isIntel = _txt.startsWith("[Intelligence]");
			const isTitleIntel = TITLE_INTEL_RE.test(_txt);
			let _secCharId = e.charId != null && e.charId in charEntries ? e.charId : Array.isArray(e.charIds) ? e.charIds.find((id) => id in charEntries) : void 0;
			const hasChar = _secCharId != null && _secCharId !== void 0;
			if (e.type === "message") dispatches.push(e);
			else if (isTitleIntel) titleIntel.push(e);
			else if (isIntel) {
				intelByPhase[ph] = intelByPhase[ph] || [];
				intelByPhase[ph].push(e);
			} else if (hasChar) charEntries[_secCharId].phases[ph >= 0 && ph <= 4 ? ph : e.phase === 99 ? 5 : 0].push(e);
			else {
				systemByPhase[ph] = systemByPhase[ph] || [];
				systemByPhase[ph].push(e);
			}
		});
		const NEUTRAL_COLOR = "#555";
		const nameColors = /* @__PURE__ */ new Map();
		function _registerName(nm, color, neutral, guard) {
			if (!nm) return;
			const add = (k) => {
				if (k && !nameColors.has(k)) nameColors.set(k, {
					color: guard ? CHIEFTAIN_MARKER_COLOR : neutral ? null : reportColour(color),
					neutral: !!neutral && !guard
				});
			};
			add(nm);
			add(String(nm).replace(/\s*\(.*?\)\s*$/, "").trim());
			const km = String(nm).match(/\(([^)]+)\)\s*$/);
			if (km) add(km[1]);
		}
		log.forEach((e) => {
			const t = e.text || "";
			if (t.startsWith("⚑FORCE⚑")) try {
				const f = JSON.parse(t.slice(7));
				_registerName(f.name, f.color, f.neutral, !!f.guard);
				(f.armies || []).forEach((a) => {
					const un = a && a.unitName;
					if (un && un !== a.type && !String(un).startsWith("undefined")) _registerName(un, f.color, f.neutral, !!f.guard);
				});
			} catch (_) {}
		});
		const _ownColor = viewingReport && viewingReport.kingdom && viewingReport.kingdom.color || null;
		if (_ownColor) (chars_for_log || []).forEach((c) => _registerName(c.name, _ownColor, false));
		const _chronRep = viewingReport || currentReport || {};
		const _GUARD_POWER_COLORS = { ...GUARD_POWER_COLORS_P };
		(_chronRep.knownFeatures || []).forEach((f) => {
			if (!f) return;
			const _pcol = _GUARD_POWER_COLORS[f.monsterPower] || null;
			if (!_pcol) return;
			if (f.monster && f.monster !== "unknown guardian") _registerName(f.monster, _pcol, false);
			if (f.name) _registerName(f.name, _pcol, false);
		});
		(_chronRep.heroSightings || []).forEach((s) => {
			if (s.type === "enemy") _registerName(s.name, s.kingdomColor || null, false);
			else _registerName(s.name, null, true, s.type === "neutral_guard");
		});
		(_chronRep.worldMeta && _chronRep.worldMeta.provinces || []).forEach((p) => {
			(p.characters || []).forEach((ch) => {
				if (ch.isOwn) return;
				if (ch.ownerColor && !ch.isWanderer && !ch.isNeutralGuard) _registerName(ch.name, ch.ownerColor, false);
				else _registerName(ch.name, null, true, !!ch.isNeutralGuard);
			});
		});
		(_chronRep.allKingdoms || []).forEach((k) => {
			if (k && k.name && k.color) _registerName(k.name, k.color, false);
		});
		(_chronRep.nameColors || []).forEach((n) => {
			if (n && n.name) _registerName(n.name, n.color || null, !!n.neutral, !!n.guard);
		});
		const _nameKeys = [...nameColors.keys()].filter(Boolean).sort((a, b) => b.length - a.length);
		function colorizeNames(nodes, bold) {
			const wt = bold ? ";font-weight:700" : "";
			_nameKeys.forEach((nm) => {
				const info = nameColors.get(nm);
				const col = info.neutral ? NEUTRAL_COLOR : info.color;
				if (!col) return;
				const re = new RegExp("\\b" + _reText(nm) + "\\b", "g");
				nodes = _markRuns(nodes, re, (m) => kcHtml`<span style="color:${col}${wt}">${m}</span>`);
			});
			return nodes;
		}
		function renderForceBlock(f, compact) {
			const col = f.guard ? CHIEFTAIN_MARKER_COLOR : f.neutral ? NEUTRAL_COLOR : reportColour(f.color) || NEUTRAL_COLOR;
			if (compact) {
				const cnt = {};
				(f.armies || []).forEach((a) => {
					const k = a.type || "unit";
					cnt[k] = (cnt[k] || 0) + 1;
				});
				const n = (f.armies || []).length;
				const verb = String(f.verb || "").replace(/,\s*(with|leading)\s*$/, "").replace(/\s*—\s*\d+ defending units?\s*$/, "");
				const kinds = Object.keys(cnt).map((k) => `${unitEmoji(k)} ${cnt[k] > 1 ? cnt[k] + "× " : ""}${k}`).join(", ");
				return kcHtml`<div class="log-entry combat" style="border-left-width:4px;background:#fdf0f0;margin-top:3px;font-size:.8rem">⚔ <span style="color:${col};font-weight:700">${f.name}</span> ${verb} — ${n ? `${n} unit${n !== 1 ? "s" : ""}: ${kinds}` : "no armies"}</div>`;
			}
			return kcHtml`<div class="log-entry combat" style="border-left-width:4px;background:#fdf0f0;margin-top:6px"><div>${kcHtml`⚔ <span style="color:${col};font-weight:700">${f.name}</span> ${f.verb || ""}:`}</div>${(f.armies || []).length ? f.armies.map((a) => kcHtml`<div style="padding-left:16px;font-size:.82rem${a.phantom ? ";opacity:.75;font-style:italic" : ""}">${a.phantom ? "✨" : unitEmoji(a.type)} <span style="color:${col}">${armyLabel(a)}</span></div>`) : kcHtml`<div style="padding-left:16px;font-size:.82rem;opacity:.7">— no armies —</div>`}</div>`;
		}
		function renderEntry(e, opt) {
			opt = opt || {};
			const raw0 = e.text || "";
			if (raw0.startsWith("⚑FORCE⚑")) try {
				return renderForceBlock(JSON.parse(raw0.slice(7)), !!opt.compact);
			} catch (_) {}
			const _ind = (raw0.match(/^ +/) || [""])[0].length;
			const rawText = roundReportNumbers(raw0.replace(/^ +/, ""));
			const isStat = rawText.startsWith("📊");
			const isTally = rawText.startsWith("⚰");
			const isBattleHeader = rawText.startsWith("⚔") || rawText.startsWith("⚠");
			const bold = rawText.split(/\*\*(.+?)\*\*/).map((s, i) => i % 2 ? {
				wrap: (k) => kcHtml`<strong>${k}</strong>`,
				kids: [s]
			} : s).filter((x) => x !== "");
			const text = _showRuns(colorizeNames(bold));
			const tail = opt.tail ? kcHtml`<span style="flex:1"></span>${opt.tail}` : "";
			const flex = opt.tail ? "display:flex;align-items:flex-start;gap:6px;" : "";
			const inner = opt.tail ? kcHtml`<span style="min-width:0">${text}</span>${tail}` : text;
			const sub = _ind > 0 && !opt.compact ? `margin-left:${Math.min(4, Math.ceil(_ind / 2)) * 12}px;font-size:.76rem;padding-top:2px;padding-bottom:2px;margin-bottom:1px;` : "";
			const _gridLine = /│/.test(rawText) ? "white-space:pre;overflow-x:auto;" : "";
			if (isStat) return kcHtml`<div class="log-entry stat" style="${flex}${sub}${_gridLine}">${inner}</div>`;
			if (isTally) return kcHtml`<div class="log-entry combat" style="${flex}border-left-width:4px;background:#f6ecdf;font-weight:600">${inner}</div>`;
			if (isBattleHeader && !sub) return kcHtml`<div class="log-entry combat" style="${flex}border-left-width:4px;background:#fdf0f0;margin-top:6px;font-weight:600">${inner}</div>`;
			return kcHtml`<div class="log-entry ${e.type || ""}" style="${flex}${sub}">${inner}</div>`;
		}
		function renderBattleGroup(g) {
			if (!g.some((e) => e.bTier === "d")) return g.filter((e) => e.bTier !== "t").map((e) => renderEntry(e));
			const shortE = g.filter((e) => e.bTier === "k" || e.bTier === "t"), fullE = g.filter((e) => e.bTier !== "t" && e.bTier !== "s");
			const btn = (open) => kcHtml`<button type="button" class="secall-btn bf-toggle" style="flex-shrink:0;font-weight:400" aria-expanded="${open ? "true" : "false"}" onclick="toggleBattleFold(this)">${open ? "▾ short summary" : "▸ full report"}</button>`;
			const view = (list, open, compact) => {
				let hi = list.findIndex((e) => /^\s*⚔ \*\*Battle for /.test(e.text || ""));
				if (hi < 0) hi = 0;
				return list.map((e, i) => renderEntry(e, {
					compact,
					tail: i === hi ? btn(open) : null
				}));
			};
			return kcHtml`<div class="battle-fold"><div class="bf-short">${view(shortE, false, true)}</div><div class="bf-full" style="display:none">${view(fullE, true, false)}</div></div>`;
		}
		function renderEntryList(list) {
			let out = [];
			for (let i = 0; i < list.length;) {
				const e = list[i];
				if (e && e.battleId != null) {
					let j = i;
					while (j < list.length && list[j] && list[j].battleId === e.battleId) j++;
					out.push(renderBattleGroup(list.slice(i, j)));
					i = j;
					continue;
				}
				out.push(renderEntry(e));
				i++;
			}
			return out;
		}
		function phaseHeader(ph, color) {
			return kcHtml`<div style="font-family:'Cinzel',serif;font-size:.68rem;color:${color || "var(--stone)"};
        text-transform:uppercase;letter-spacing:.1em;padding:3px 8px;
        border-bottom:1px dotted var(--parchment-dark);margin:6px 0 4px;
        display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${color || "var(--stone)"}"></span>
        ${PHASE_NAMES[ph]}
      </div>`;
		}
		let html = [];
		orderedChars.forEach((c) => {
			const ce = charEntries[c.id];
			if (!ce) return;
			if (!ce.phases.some((ph) => ph.length > 0)) return;
			const accentColor = c.isKing ? "var(--crimson)" : "var(--forest)";
			html.push(kcHtml`<div class="char-chronicle" style="margin-bottom:22px;border:1px solid ${c.isKing ? "var(--crimson)" : "var(--stone)"};border-radius:3px;overflow:hidden">
        <div class="cc-head" style="font-family:'Cinzel',serif;font-size:.88rem;color:#fff;
          padding:7px 12px;background:${accentColor};
          display:flex;align-items:center;gap:8px">
          <span style="font-size:1rem">${c.isKing ? "👑" : "⚔"}</span>
          <span style="font-weight:600">${c.name}</span>
          ${c.isKing ? kcHtml`<span style="font-size:.68rem;opacity:.8;margin-left:auto">King</span>` : ""}
          <button type="button" class="cc-toggle" title="Minimise / maximise this character" aria-expanded="true" onclick="toggleSection(this)" style="${c.isKing ? "margin-left:8px" : ""}">&#9662;</button>
        </div>
        <div style="padding:6px 8px">`);
			let hasContent = false;
			ce.phases.forEach((entries, ph) => {
				if (!entries.length) return;
				hasContent = true;
				const ordered = [...entries].sort((a, b) => (b.pinNotice ? 1 : 0) - (a.pinNotice ? 1 : 0));
				html.push(phaseHeader(ph, PHASE_COLORS[ph]));
				html.push(renderEntryList(ordered));
			});
			if (!hasContent) html.push(kcHtml`<em style="color:#aaa;font-size:.8rem;padding:4px 8px;display:block">No activity this turn.</em>`);
			html.push(kcHtml`</div></div>`);
		});
		if (dispatches.length > 0) {
			html.push(kcHtml`<div class="char-chronicle" style="margin-bottom:22px;border:1px solid #6b8ec8;border-radius:3px;overflow:hidden">
        <div class="cc-head" style="font-family:'Cinzel',serif;font-size:.88rem;color:#fff;
          padding:7px 12px;background:#4a6ea5;display:flex;align-items:center;gap:8px">
          <span style="font-size:1rem">📨</span>
          <span style="font-weight:600">Dispatches</span>
          <button type="button" class="cc-toggle" title="Minimise / maximise" aria-expanded="true" onclick="toggleSection(this)">&#9662;</button>
        </div>
        <div style="padding:6px 10px">`);
			dispatches.forEach((e) => {
				html.push(kcHtml`<div class="log-entry" style="padding:5px 4px;border-bottom:1px dotted var(--parchment-dark)">${e.text || ""}</div>`);
			});
			html.push(kcHtml`</div></div>`);
		}
		if (Object.values(systemByPhase).some((a) => a.length > 0)) {
			html.push(kcHtml`<div class="char-chronicle" style="margin-bottom:22px;border:1px solid var(--stone);border-radius:3px;overflow:hidden">
        <div class="cc-head" style="font-family:'Cinzel',serif;font-size:.88rem;color:#fff;
          padding:7px 12px;background:var(--stone);display:flex;align-items:center;gap:8px">
          <span style="font-size:1rem">⚙</span>
          <span style="font-weight:600">Realm Events</span>
          <span style="font-size:.7rem;opacity:.7;margin-left:auto">Battles · Conquests · Tax &amp; Wages</span>
          <button type="button" class="cc-toggle" title="Minimise / maximise" aria-expanded="true" onclick="toggleSection(this)" style="margin-left:8px">&#9662;</button>
        </div>
        <div style="padding:6px 8px">`);
			[
				0,
				1,
				2,
				3,
				4
			].forEach((ph) => {
				const entries = systemByPhase[ph] || [];
				if (!entries.length) return;
				html.push(phaseHeader(ph, PHASE_COLORS[ph]));
				html.push(renderEntryList(entries));
			});
			const unphased = systemByPhase[99] || [];
			if (unphased.length) {
				html.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.68rem;color:var(--stone);
          text-transform:uppercase;letter-spacing:.1em;padding:3px 8px;
          border-bottom:1px dotted var(--parchment-dark);margin:6px 0 4px">
          End of Turn
        </div>`);
				html.push(renderEntryList(unphased));
			}
			html.push(kcHtml`</div></div>`);
		}
		if (Object.values(intelByPhase).some((a) => a.length > 0) || titleIntel.length > 0 || viewedTurn == null) {
			let html0 = html;
			html = [];
			const _intelLine = (t) => {
				const i = t.indexOf("[Intelligence]");
				return i < 0 ? t : kcHtml`${t.slice(0, i)}<span style="color:#c8922a;font-family:Cinzel,serif;font-size:.68rem">[Intel]</span>${t.slice(i + 14)}`;
			};
			const _subHead = (t) => kcHtml`<div style="font-family:'Cinzel',serif;font-size:.68rem;color:#9a6a1a;
          text-transform:uppercase;letter-spacing:.1em;padding:3px 8px;
          border-bottom:1px dotted var(--parchment-dark);margin:2px 0 4px">${t}</div>`;
			if (titleIntel.length) {
				html.push(_subHead("👑 Imperial Titles"));
				const byTitle = /* @__PURE__ */ new Map();
				titleIntel.forEach((e) => {
					const m = TITLE_INTEL_RE.exec(e.text || "");
					const k = m ? m[1] : "Titles";
					if (!byTitle.has(k)) byTitle.set(k, []);
					byTitle.get(k).push((e.text || "").replace(TITLE_INTEL_RE, ""));
				});
				byTitle.forEach((parts, k) => {
					const tag = kcHtml`<span style="color:#9a6a1a;font-family:Cinzel,serif;font-weight:700;font-size:.72rem">[${k}]</span>`;
					const body = parts.map((t) => kcHtml`<div class="ti-line">${_showRuns(colorizeNames([t], true))}</div>`);
					html.push(kcHtml`<div class="log-entry system">${tag}${body}</div>`);
				});
			}
			[
				0,
				1,
				2,
				3,
				4
			].forEach((ph) => {
				const entries = intelByPhase[ph] || [];
				if (!entries.length) return;
				html.push(phaseHeader(ph, "#c8922a"));
				entries.forEach((e) => {
					html.push(kcHtml`<div class="log-entry system">${_intelLine(e.text || "")}</div>`);
				});
			});
			const unphased = intelByPhase[99] || [];
			if (unphased.length) {
				html.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.68rem;color:#c8922a;
          text-transform:uppercase;letter-spacing:.1em;padding:3px 8px;
          border-bottom:1px dotted var(--parchment-dark);margin:6px 0 4px">General</div>`);
				unphased.forEach((e) => {
					html.push(kcHtml`<div class="log-entry system">${_intelLine(e.text || "")}</div>`);
				});
			}
			html = [...html0, intelSectionShell(html)];
		}
		document.getElementById("report-log").innerHTML = kcHtml`${_reckoningBanner}${html.length ? html : kcHtml`<em style="color:#3a3224;font-size:.85rem">No events yet.</em>`}`;
	}
}
// src/ui/player/the-hints-the-order-form-shows-below-each-spell.ts
var FIREBALL = SPELL_EFFECTS_THE_REGISTRY_HOLDS.fireball.combat;
var HOLY_SYMBOL = SPELL_EFFECTS_THE_REGISTRY_HOLDS["holy-symbol"].combat;
var SPIRITWRACK = SPELL_EFFECTS_THE_REGISTRY_HOLDS.spiritwrack.combat;
var PSYCHIC_BLAST = SPELL_EFFECTS_THE_REGISTRY_HOLDS["psychic-blast"].combat;
var INVISIBILITY = SPELL_EFFECTS_THE_REGISTRY_HOLDS.invisibility.combat;
/** The hint shown below the order form for each spell, by its name. */
var SPELL_HINTS = {
	Resurrect: "Target: a dead hero whose body lies in your caster’s province. Revives at full HP, stripped of all items and armies, and joins your command. Only a hero who never served ANOTHER realm can be raised — your own fallen, or a wanderer who was never in a rival’s pay; a hero who ever served another crown (even one later released or who deserted) will not answer. Your own fallen KING can also be recalled — their body is borne to your home province (or wealthiest if home is lost); only your most recently fallen monarch may be raised, and only by your realm. A resurrected king reclaims the throne; any reigning heir steps down to a normal hero.",
	"Part Sea": "Target: any sea OR land province you’re in or next to (so you can pre-empt a Flood). A sea province — including a land province flooded to sea earlier this turn — becomes dry plains for the rest of the turn (land armies may cross); no fleet may enter or leave from the next phase on. Cast on still-dry land it simply finds no sea to part. Cancels Flood.",
	"Bless Province": "Target: a province you’re in or adjacent to. +60% tax base at collection this turn (+80% for Divine realms; +100% when the Divine KING casts it). The ground is also warded — 50% + 5% per White level (counted to 5, so 50–75%) to turn aside each enemy Flood, Earthquake, Plague or Part Sea cast here this turn. One Bless per province — does not stack.",
	"Holy Symbol": `Action: no target \u2014 cleanses the province you stand in of ALL its battlefield dead. Every grave there is laid to rest and can never be raised by a necromancer. Combat: enemy \u2212${String(HOLY_SYMBOL.theCutToTheTargetsAimALevel.value)}%/level to hit and seared for ${String(HOLY_SYMBOL.theShareOfMaximumHpItSears.value)}% of its health, both \u00d7${String(HOLY_SYMBOL.theMultiplierAgainstTheUndeadAndFiends.value)} against undead and fiends; you recover ${String(HOLY_SYMBOL.theShareOfHisOwnMaximumHpTheCasterRecovers.value)}% of your health. Battle: enemy undead units fight at 75% strength.`,
	Spiritwrack: `Combat: silences the target for ${String(SPIRITWRACK.theRoundsItSilences.value)} round + 1 per two White levels (max ${String(SPIRITWRACK.theMostRounds.value)}) \u2014 it can\u2019t cast or use archery (it attacks instead) and its melee is halved. Against a guardian weak to White Magic it takes at 95% and lasts ${String(SPIRITWRACK.theRoundsLongerAgainstAGuardianWeakToWhite.value)} round longer (max 4); Powerful and Legendary guardians may shrug it off each round after the first. Battle: all missile units fight at half strength.`,
	Charm: "Target: a lone hero (wandering or enemy) leading NO armies, in your province. Wandering joins you free (you still pay upkeep); enemy comes under your command until end of turn, then returns to their lord (and will not attack their own lord's heroes). On success you learn their skills and magic items. Kings and army-leaders are immune; each past Charm gives a hero +30% resistance (cumulative). A Charm that fails may provoke a personal encounter with the target — unless either leads their encounter plan with Flee. Combat: doubles a later Flee attempt.",
	Oratory: "Target: yourself or an ally in your province. Every army travelling with them fights one quality tier higher for the rest of the turn. Not cumulative.",
	Clairvoyance: "Target: any enemy character you’ve ever seen, anywhere (not neutral or wandering heroes). You learn all that happens to them this turn — reported in your Realm Events — and see their full skills. At turn’s end you also know exactly where they stand: they are marked on your map and open to Encounter, even through Invisibility. Only one active at a time.",
	"Psychic Blast": `Target: an enemy/neutral hero in your province. They permanently lose TWO skill levels, each taken from a randomly chosen skill they hold (both picks can land on the same skill, dropping it by 2). Combat: they can do nothing at all for ${String(PSYCHIC_BLAST.theRoundsItStuns.value)} round + 1 per two Psychic levels (3 at Psychic 5; doubled against a foe weak to Psychic; Dreamstone +1, after any doubling), unless a stun ward turns it. Battle: negates the enemy commander\u2019s Druid.`,
	"Telekinetic Storm": "Target: an enemy hero leading armies in your province. A number of their units equal to your skill level (counted to 5) are struck: Green units are destroyed, skeletal units shatter outright, and every other struck unit PERMANENTLY drops one experience level. Combat: 12% of the target’s max HP, +3% per Psychic level (15% at 1, 27% at 5), as damage (you take a quarter of that). Battle: halves the enemy commander’s Tactical bonus, on land, if he has any.",
	"Illusory Terrain": "Target: a province you’re in or adjacent to. Cloaks it in a false, ever-shifting terrain: enemies who fight there are disoriented, each unit fighting as if in the worst terrain for its kind (at least −15%). An enemy hero who enters dispels it at the end of that turn; 20%/turn natural fade.",
	"Phantasmal Armies": "Target: yourself or any friendly hero in your province. Spectral duplicates of their humanoid armies — 10% of the host per caster level, counted to level 5, at least one — march and fight with the real host for the rest of the turn. The doubles never appear in the roster, need no berth aboard ship, and melt away if their originals fall or the force is beaten.",
	"Hide Lairs": "Target: a province you’re in or adjacent to. Hides every lair there from all other players — they cannot discover any lair in it while the glamour holds (one already found stays theirs). 20% chance to fade each turn.",
	Invisibility: `Combat: enemies suffer \u2212${String(INVISIBILITY.theCutToHisFoesAim.value)}%, and a further \u2212${String(INVISIBILITY.theCutMoreALevel.value)}% per Illusory level (\u221214% at 1, \u221230% at 5), to hit you (melee and arrows) for the fight, +${String(INVISIBILITY.theFlightAdded.value)}% to Flee, and +${String(INVISIBILITY.theStealAdded.value)}% to a following Steal. Action: cast on yourself — 80% chance no enemy player sees you (sightings, spies, Encounter targeting, the map) for the rest of the turn, and every enemy order and ambush aimed at you misses you.`,
	"Lightning Bolt": "Combat: 1–3 damage per caster level (counted to 5) to your opponent. Battle: as many enemy armies as your level (counted to 5) each lose 20% strength.",
	Fireball: `Combat: burns the target for ${String(FIREBALL.theShareOfMaximumHpItBurnsARound.value)}% of its health each round, +${String(FIREBALL.theShareMoreALevel.value)}% per Elemental level (12% at 1, 20% at 5), for ${String(FIREBALL.theRoundsItBurns.value)} rounds. Battle: the strongest enemy unit\u2019s strength is halved.`,
	Earthquake: "Target: a province you’re in or adjacent to. It yields no tax at the end of this turn.",
	Flood: "Target: a land province you’re in or adjacent to. It acts as a sea province for the rest of the turn (land armies stranded). Cancels Part Sea.",
	"Elemental Summon": "Summons a random elemental (Air/Fire/Earth/Water/Darkness, Veteran) to fight under you for the rest of the turn, then it dissolves. One per turn.",
	"Control Undead": "Target: an enemy/neutral hero here to seize one random undead unit — OR cast on THIS province to reveal the dead army units lying here one by one, AND to sense which surrounding provinces hold graves of their own (that they do, not how many or what). All of it is filed under Graveyards Known in your report. Combat: an undead foe is frozen for a round per Necromancy level (counted to 5), unless a stun ward turns it. Battle: one enemy undead unit defects.",
	"Skeletal Armies": "Raises the most experienced battlefield-grave units in your province as Skeletal (Undead) units under your command (1g upkeep each): 1 unit at Necromancy 1–2, 2 at Necromancy 3–4, 3 at Necromancy 5+ — never more than lie buried there. Needs fallen armies present.",
	Curse: "Target: an enemy/neutral hero here. EVERY skill they have is halved (rounded down) for the rest of the turn. Combat: their best combat ability halved. Battle: the enemy commander’s best combat skill (Tactical/Druid/Naval) halved.",
	"Hand of Death": "Combat: 10% per Necromancy level (counted to 5), at most 60%, to strike for 40% of the target’s max HP (×1.1 with Death’s Finger Ring).",
	Plague: "Target: your province or an adjacent one. Each humanoid unit has a (10% + 5%/level, the level counted to 5) chance to lose a level; a unit that faced a plague before rolls at half the chance. Spreads to neighbours over the turn. Not cumulative."
};
// src/ui/player/titles.ts
/** The tables read by a key of words: the skills' names, the masteries by skill and level. */
var theSkillsNames$1 = SKILL_LABELS;
var theMasteries = MASTERY_UNLOCKS;
/** A title of the holders' table by its key, which `Object.keys` has just found: a TypeError for none, as the read did. */
/** A skill's masteries by level, for a skill the filter has just found in the table: a TypeError for none, as the read
*  did. */
function theMasteryOf(k) {
	const m = theMasteries[k];
	if (m === void 0) throw new TypeError(`Cannot read properties of undefined (reading the mastery of ${k})`);
	return m;
}
function theTitleHeld(holders, k) {
	const h = holders[k];
	if (h === void 0) throw new TypeError(`Cannot read properties of undefined (reading the title ${k})`);
	return h;
}
function renderMastery(report) {
	const card = document.getElementById("mastery-card");
	const el = document.getElementById("report-mastery");
	if (!card || !el) return;
	const chars = (report.characters ?? []).filter((c) => Boolean(c) && c?.alive !== false);
	const rows = [];
	chars.forEach((c) => {
		const sk = c.skills ?? {};
		const mastered = Object.keys(sk).filter((k) => Number(sk[k]) >= 6 && theMasteries[k]).sort((a, b) => Number(sk[b]) - Number(sk[a]) || a.localeCompare(b));
		if (mastered.length === 0) return;
		const skillBlocks = mastered.map((k) => {
			const lvl = sk[k];
			const effs = [];
			for (let L = 6; L <= Number(lvl); L++) {
				const d = theMasteryOf(k)[L];
				if (d) effs.push({
					L,
					d
				});
			}
			const lines = effs.map((e) => kcHtml`<div style="font-size:.76rem;padding:1px 0 1px 10px"><span style="color:var(--gold);font-family:Cinzel,serif;font-size:.68rem">L${e.L}</span> ${e.d}</div>`);
			return kcHtml`<div style="margin:3px 0 5px">
        <div style="font-size:.8rem"><strong>${(theSkillsNames$1[k] ?? "") || k} ${lvl}</strong></div>
        ${lines}
      </div>`;
		});
		rows.push(kcHtml`<div class="intel-entry" style="border-left-color:#8a6a1a">
      <div style="font-family:'Cinzel',serif;font-size:.82rem;color:#6a4a10">${c.isKing ? "👑" : "⚔"} ${c.name}</div>
      ${skillBlocks}
    </div>`);
	});
	const _rjM = document.getElementById("rj-mastery");
	if (rows.length === 0) {
		card.style.display = "none";
		el.innerHTML = "";
		if (_rjM) _rjM.style.display = "none";
		return;
	}
	card.style.display = "";
	if (_rjM) _rjM.style.display = "";
	el.innerHTML = String(kcHtml`<div style="font-size:.72rem;color:#332c20;margin-bottom:6px">A standing reference to the mastery each of your characters has earned — consult it whenever you plan their orders.</div>${rows}`);
}
var _TITLE_ORDER = [
	[
		"throne",
		"The Throne",
		20
	],
	[
		"vault",
		"The Vaultkeeper",
		10
	],
	[
		"marshal",
		"The Grand Marshal",
		10
	],
	[
		"sea",
		"The Sea Lord",
		10
	],
	[
		"monster",
		"The Monster-Bane",
		10
	],
	[
		"lore",
		"The Loremaster",
		10
	],
	[
		"arch",
		"The Archmage",
		10
	],
	[
		"hiero",
		"The Hierophant",
		10
	],
	[
		"necro",
		"The Deathpriest",
		10
	]
];
function titleRaceLine(r) {
	if (!r) return "";
	const who = r.charName ? kcHtml`<strong>${r.charName}</strong>` : "";
	if (r.mine) return r.unchallenged ? kcHtml`${who || "Your realm"} holds this title <strong>unchallenged</strong> — no rival has any standing.` : kcHtml`${who || "Your realm"} holds this title, <strong>${r.leadPct} percentage point${r.leadPct === 1 ? "" : "s"}</strong> ahead of the closest rival${r.leadPct === 0 ? " — level with them, and holding it only by precedence" : ""}.`;
	if (r.vacant) return `Vacant — no character in the world has any standing yet.`;
	if (!r.charName || !(Number(r.pct) > 0)) return `None of your characters has any standing toward this title yet.`;
	return kcHtml`Your best: ${who} — at <strong>${r.pct}%</strong> of the holder's standing.`;
}
function renderTitles(report) {
	const el = document.getElementById("report-titles");
	if (!el) return;
	const t = report?.titles ?? {};
	if (t.gameOver) {
		const go = t.gameOver;
		const board = (go.standings ?? []).slice().sort((a, b) => b.score - a.score).map((s, i) => kcHtml`<tr style="${s.index === go.winner ? "font-weight:700;background:#fdf3d8" : ""}"><td style="padding:3px 8px">${i + 1}</td><td style="padding:3px 8px;color:${(reportColour(s.color) ?? "") || "#333"}">${s.name}</td><td style="padding:3px 8px;text-align:right">${s.score}</td><td style="padding:3px 8px;font-size:.75rem;color:#2f281c">${(s.titleNames ?? []).join(", ")}${s.relics ? `${s.titleNames?.length ? " · " : ""}${String(s.relics)} relic${s.relics !== 1 ? "s" : ""}` : ""}</td></tr>`);
		el.innerHTML = String(kcHtml`<div style="background:#fdf3d8;border:1px solid var(--gold);border-radius:3px;padding:10px 12px;margin-bottom:8px">
      <div style="font-family:'Cinzel',serif;font-size:1rem;color:var(--crimson)">🏆 ${(go.winnerName ?? "") || "No-one"} ${go.byElimination ? "is the last realm standing" : go.byConcession ? "holds the field — every rival has conceded" : "is judged supreme at the Reckoning"}!</div></div>
      <table style="width:100%;border-collapse:collapse;font-size:.85rem"><thead><tr style="color:#332c20;font-size:.72rem;text-align:left"><th style="padding:3px 8px">#</th><th style="padding:3px 8px">Realm</th><th style="padding:3px 8px;text-align:right">Legacy</th><th style="padding:3px 8px">Titles held</th></tr></thead><tbody>${board}</tbody></table>`);
		return;
	}
	if (!t.public) {
		el.innerHTML = String(kcHtml`<em style="color:#3a3224;font-size:.85rem">The Imperial Titles are contested in secret until Turn ${Number(t.publicFromTurn) || 5}. Standings appear then.</em>`);
		return;
	}
	const nPlayers = (t.standings ?? []).length || 2;
	const pct = dispFloor((Number(t.myShare) || 0) * 100), thr = Math.ceil(dispFloor((Number(t.threshold) || 0) * 100 * 1e6) / 1e6);
	const ownPct = dispFloor((t.myOwnShare ?? (Number(t.myShare) || 0)) * 100), minPct = Math.ceil(dispFloor((Number(t.callerMin) || 0) * 100 * 1e6) / 1e6);
	let gainsHtml = "";
	const gains = t.gains ?? [];
	if (gains.length) {
		const initial = gains.some((g) => g.initial);
		const header = initial ? `🏅 The Imperial Titles are now public — title${gains.length !== 1 ? "s" : ""} you hold` : `🎉 New title${gains.length !== 1 ? "s" : ""} won this turn`;
		const verb = initial ? "Earned by" : "Won by";
		gainsHtml = kcHtml`<div style="background:#fdf3d8;border:1px solid var(--gold);border-radius:3px;padding:8px 10px;margin-bottom:10px">
      <div style="font-family:'Cinzel',serif;font-size:.8rem;color:var(--crimson);margin-bottom:4px">${header}</div>
      ${gains.map((g) => kcHtml`<div style="font-size:.78rem;color:#444;margin-bottom:5px;line-height:1.45">
        <strong>${g.scope === "minor" ? "🎖" : "🏆"} ${g.name}</strong> — ${g.charName ? `${g.charName} of ` : ""}<span style="color:var(--forest)">${(g.kingdomName ?? "") || "your realm"}</span>.
        <br><span style="color:#2a2419">${verb}: ${g.req ?? ""}</span>
        <br><span style="color:#1d541d">Effect: ${g.perk ?? ""}</span></div>`)}</div>`;
	}
	let lossesHtml = "";
	const losses = t.losses ?? [];
	if (losses.length) lossesHtml = kcHtml`<div style="background:#f6e0e0;border:1px solid var(--crimson);border-radius:3px;padding:8px 10px;margin-bottom:10px">
      <div style="font-family:'Cinzel',serif;font-size:.8rem;color:var(--crimson);margin-bottom:4px">⚔ Title${losses.length !== 1 ? "s" : ""} lost this turn</div>
      ${losses.map((l) => kcHtml`<div style="font-size:.78rem;color:#444;margin-bottom:5px;line-height:1.45">
        <strong>${l.scope === "minor" ? "🎖" : "🏆"} ${l.name}</strong> — ${l.vacant ? kcHtml`now stands <span style="color:#3a3224">vacant</span>.` : kcHtml`claimed by ${l.newCharName ? `${l.newCharName} of ` : ""}<span style="color:var(--crimson)">${(l.newHolderName ?? "") || "a rival"}</span>.`}</div>`)}</div>`;
	let banner = "";
	if (t.reckoning) banner = kcHtml`<div style="background:#f7e9d0;border:1px solid var(--gold);border-radius:3px;padding:8px 10px;margin-bottom:10px;font-size:.85rem">
      👑 <strong>The Reckoning has been called${t.reckoning.byName ? ` by ${t.reckoning.byName}` : ""}.</strong> The world is judged at the end of <strong>Turn ${t.reckoning.resolveAtTurn}</strong> unless the claim is broken. ${t.reckoning.mine ? "This is your claim — hold your dominance." : "Drive the claimant's bloc below the threshold to shatter it."}</div>`;
	const _unmetStyle = "color:#5a5348;font-style:italic";
	const board = (t.standings ?? []).slice().sort((a, b) => b.score - a.score).map((s, i) => kcHtml`<tr style="${s.index === (currentReport ? currentReport.playerIndex : currentReport) ? "font-weight:700" : ""}"><td style="padding:2px 8px">${i + 1}</td><td style="padding:2px 8px;${s.unmet ? _unmetStyle : `color:${(reportColour(s.color) ?? "") || "#333"}`}">${s.name}${s.unmet ? kcHtml` <span style="font-size:.66rem;opacity:.8">(not yet encountered)</span>` : ""}</td><td style="padding:2px 8px;text-align:right">${s.score}</td></tr>`);
	const holders = t.holders ?? {};
	const _titleRows = _TITLE_ORDER.map((r) => r.slice()).concat(Object.keys(holders).filter((k) => !_TITLE_ORDER.some((r) => r[0] === k)).map((k) => [
		k,
		(theTitleHeld(holders, k).name ?? "") || k,
		Number(theTitleHeld(holders, k).prize) || 0
	]));
	const _heldBy = (k) => {
		const h = holders[String(k)] ?? {};
		return Boolean(h.race ? h.race.mine : h.mine);
	};
	const _closeness = (k) => {
		const r = holders[String(k)]?.race;
		if (!r) return -1;
		if (r.vacant) return 1e3;
		return typeof r.pct === "number" ? r.pct : 0;
	};
	_titleRows.forEach((row, i) => {
		row._i = i;
	});
	_titleRows.sort((a, b) => {
		const ha = _heldBy(a[0]);
		if (ha !== _heldBy(b[0])) return ha ? -1 : 1;
		if (ha) return Number(a._i) - Number(b._i);
		const ca = _closeness(a[0]), cb = _closeness(b[0]);
		if (ca !== cb) return cb - ca;
		return Number(a._i) - Number(b._i);
	});
	const majorHtml = _titleRows.map(([k, name, prize]) => {
		const h = holders[String(k)] ?? {};
		const r = h.race ?? null;
		const raceLine = r ? titleRaceLine(r) : kcHtml`<span style="color:#3a3224">Standing percentages are missing from this turn report — it was resolved by ${report?.engineStamp ? kcHtml`<strong>the GM portal's build ${report.engineStamp}</strong>, which predates them` : "a GM portal build that predates them"}. They appear once a turn is resolved by a GM portal build from 20 September 2026 or later.</span>`;
		const raceHtml = raceLine ? kcHtml`<div style="font-size:.74rem;margin:1px 0;color:${r?.mine ? "var(--forest)" : "#5a4a2a"}">📊 ${raceLine}</div>` : "";
		return kcHtml`<div style="border-bottom:1px solid var(--parchment-dark);padding:5px 0">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">
        <strong style="font-size:.82rem">🏆 ${name}</strong>
        <span style="color:#3a3224;font-size:.72rem;white-space:nowrap">${prize} pts</span>
      </div>
      <div style="font-size:.78rem;margin:1px 0">Held by: ${h.holderName ? h.unmet ? kcHtml`<span style="${_unmetStyle}">${h.charName ? `${h.charName} of ` : ""}${h.holderName}</span> <span style="font-size:.66rem;color:#5a5348">— a realm you have not yet encountered</span>` : h.kingdomLevel ? kcHtml`${h.charName ? `${h.charName} — ` : ""}<span style="color:${h.mine ? "var(--forest)" : "#333"};font-weight:${h.mine ? "700" : "400"}">${h.holderName}</span>` : kcHtml`${(h.charName ?? "") || "—"} <span style="color:${h.mine ? "var(--forest)" : "#777"};font-weight:${h.mine ? "700" : "400"}">(${h.holderName})</span>` : kcHtml`<span style="color:#3a3224">— vacant —</span>`}</div>
      ${raceHtml}
      <div style="font-size:.7rem;color:#2f281c;line-height:1.4">Earn: ${h.req ?? ""}<br><span style="color:#1d541d">While held: ${h.perk ?? ""}</span></div>
    </div>`;
	});
	const _minTurn = Number(t.reckoningMinTurn) || 10;
	const _solo = Math.ceil(dispFloor((t.soloThreshold ?? (Number(t.threshold) || 0)) * 100 * 1e6) / 1e6);
	const _step = Math.round((Number(t.allyStep) || 0) * 100);
	const _nAllies = Math.max(0, (Number(t.blocSize) || 1) - 1);
	const reckoningInfo = kcHtml`<div style="background:#f5f0e8;border:1px solid var(--parchment-dark);border-radius:3px;padding:8px 10px;margin-top:12px;font-size:.74rem;color:#231e16;line-height:1.5">
    <div style="font-family:'Cinzel',serif;font-size:.72rem;color:var(--crimson);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;font-weight:700">Calling the Reckoning</div>
    There is no turn limit — the game ends only when one realm is left standing, or when a dominant realm <strong>Calls the Reckoning</strong> and forces a final scoring. To call it:
    <ul style="margin:4px 0 4px 16px;padding:0">
      <li>it must be <strong>Turn ${_minTurn}</strong> or later — the throne cannot be claimed while the realms are still settling; and</li>
      <li>your <strong>King must be alive</strong> — it is a King-only act; and</li>
      <li>your realm, <strong>together with the realms you are directly allied to</strong>, must control at least <strong>${thr}%</strong> of the world's total tax base.</li>
      <li><strong>Every ally raises the bar.</strong> A realm standing alone needs <strong>${_solo}%</strong> in a ${nPlayers}-realm game; each ally in your bloc adds <strong>${_step} points</strong> to that (you have ${_nAllies} all${_nAllies === 1 ? "y" : "ies"}, so your bar is ${thr}%). An alliance is a way to reach the endgame, never a cheaper one — and an ally who brings less than ${_step}% of the world makes your claim harder, not easier.</li>
      <li><strong>Your bloc is yours alone.</strong> It is you and the realms YOU are allied to. An ally's other alliances are their business and count for nothing here — so if you are allied to B and B is allied to D, D is not in your bloc.</li>
      <li>if the bar is carried by an alliance, <strong>you must personally hold at least ${minPct}%</strong> — half your bloc's bar — in your own right. The throne is claimed by a realm, not by a passenger in someone else's bloc, so it is the bloc's greatest realm that lodges the claim. (If the claimant is later cut below ${minPct}% the claim collapses, even if the bloc still clears ${thr}%.)</li>
    </ul>
    Calling it announces the claim to every realm and begins a <strong>2-turn grace period</strong>. The bar is fixed at the moment you lodge the claim, so breaking off an alliance afterwards costs you your ally's lands without lowering what you must hold. If rivals drive your bloc back below ${thr}% before it resolves, the claim lapses and play continues. If you still hold the threshold at the end of the second turn, Legacy is scored and the highest total wins. Allies end the game together but still compete for every Title — an alliance is a route to the endgame, not a shared victory.
  </div>`;
	let callCtrl = "";
	if (t.canCallReckoning) callCtrl = reckoningCall ? kcHtml`<div style="background:#fdeaea;border:1px solid var(--crimson);border-radius:3px;padding:8px 10px;margin-top:10px;font-size:.85rem">👑 <strong>You will Call the Reckoning this turn.</strong> If your bloc still holds ${thr}%+ when orders resolve, the endgame begins (a 2-turn grace, then the world is judged). <button onclick="setReckoningCall(false)" style="font-size:.66rem;padding:2px 8px;border:1px solid #999;background:#eee;border-radius:2px;cursor:pointer;margin-left:6px">cancel</button></div>` : kcHtml`<div style="margin-top:10px"><button onclick="setReckoningCall(true)" style="font-family:'Cinzel',serif;font-size:.72rem;padding:7px 14px;border:1px solid #5a1010;background:var(--crimson);color:#fff;border-radius:2px;cursor:pointer">👑 Call the Reckoning</button>
        <div style="font-size:.72rem;color:#2f281c;margin-top:4px">Your bloc commands <strong>${pct}%</strong> of the world (need ${thr}%). Calling it forces a final scoring in two turns — submit orders to lodge the claim.</div></div>`;
	else if (!t.reckoning && t.callBlockedReason === "tooEarly") callCtrl = kcHtml`<div style="font-size:.72rem;color:#3a3224;margin-top:10px">The throne cannot be claimed before <strong>Turn ${Number(t.reckoningMinTurn) || 10}</strong>. Your bloc commands ${pct}% of the world; ${thr}% will be needed when the claim opens.</div>`;
	else if (!t.reckoning) callCtrl = t.callBlockedReason === "callerShort" ? kcHtml`<div style="font-size:.72rem;color:#3a3224;margin-top:10px">Your bloc commands ${pct}% of the world — enough to Call the Reckoning — but your own realm holds just ${ownPct}% of it, and a claimant must personally hold ${minPct}%. The claim must be lodged by the greatest realm in your alliance.</div>` : kcHtml`<div style="font-size:.72rem;color:#3a3224;margin-top:10px">Your bloc commands ${pct}% of the world; ${thr}% is needed to Call the Reckoning.</div>`;
	const throneMine = Boolean(t.holders?.["throne"]?.mine);
	const _gap = thr - pct;
	const shareLine = kcHtml`<div style="background:#f0f4ea;border:1px solid #cdd8bf;border-radius:3px;padding:7px 10px;margin-bottom:10px;font-size:.78rem;color:#3a4a2a;line-height:1.5">
    ${throneMine ? kcHtml`👑 <strong>You hold The Throne</strong> — the largest tax base in the world. ` : ""}Your bloc commands <strong>${pct}%</strong> of the world's tax base; the Reckoning can be called at <strong>${thr}%</strong>.${_gap > 0 ? kcHtml` <span style="color:#2f281c">(${_gap} more percentage point${_gap !== 1 ? "s" : ""} to go.)</span>` : t.callBlockedReason === "callerShort" ? kcHtml` <span style="color:#654c0c">Your bloc meets the threshold, but your own realm holds ${ownPct}% and a claimant must personally hold ${minPct}% — your strongest ally must lodge the claim.</span>` : kcHtml` <span style="color:#1d541d">You meet the threshold.</span>`}
  </div>`;
	el.innerHTML = String(kcHtml`${gainsHtml}${lossesHtml}${banner}${shareLine}<div style="font-size:.75rem;color:#332c20;margin-bottom:3px">Standings (Legacy)</div>
       <table style="width:100%;border-collapse:collapse;font-size:.85rem;margin-bottom:12px"><tbody>${board}</tbody></table>
       <div style="font-size:.75rem;color:#332c20;margin-bottom:2px">The Imperial Titles — who holds them &amp; how they are won <span style="color:#aaa">(yours first, then the ones you stand closest to winning)</span></div>
       ${majorHtml}${callCtrl}${reckoningInfo}${renderMinorTitles(t)}`);
}
function renderMinorTitles(t) {
	const m = t?.minor;
	if (!m) return "";
	const mine = m.mine ?? [];
	return kcHtml`<div style="margin-top:14px;border-top:1px dashed var(--parchment-dark);padding-top:8px">
    <div style="font-size:.8rem;color:#332c20;margin-bottom:4px">🎖 Your minor titles <span style="font-size:.72rem">(honorary — each grants a perk but never counts toward victory)</span></div>
    ${mine.length ? mine.map((x) => kcHtml`<div style="border-bottom:1px dotted var(--parchment-dark);padding:4px 0;font-size:.76rem">
        <span class="pill" style="background:#eef3e6;color:#3a5a2a;margin:0">🎖 ${x.name}</span>
        <span style="color:#231e16"> — ${x.holderName ?? ""}</span>
        <div style="font-size:.68rem;color:#2f281c;line-height:1.4">Earn: ${x.req ?? ""}<br><span style="color:#1d541d">Perk: ${x.perk ?? ""}</span></div>
      </div>`) : kcHtml`<div style="font-size:.78rem;color:#3a3224;margin-top:4px">Your characters hold no minor titles yet. Each is awarded to the single best character in the world by its measure — win one and it appears here.</div>`}
  </div>`;
}
function setReckoningCall(v) {
	reckoningCall = Boolean(v);
	if (currentReport) renderTitles(currentReport);
	renderReckoningOrders();
}
function renderReckoningOrders() {
	const w = document.getElementById("reckoning-wrap");
	if (!w) return;
	const t = currentReport?.titles ?? {};
	const pct = dispFloor((Number(t.myShare) || 0) * 100), thr = Math.ceil(dispFloor((Number(t.threshold) || 0) * 100 * 1e6) / 1e6);
	const ownPct = dispFloor((t.myOwnShare ?? (Number(t.myShare) || 0)) * 100), minPct = Math.ceil(dispFloor((Number(t.callerMin) || 0) * 100 * 1e6) / 1e6);
	if (t.gameOver) {
		w.innerHTML = String(kcHtml`<div style="color:#2f281c">The game is over — there is nothing left to call.</div>`);
		return;
	}
	if (t.reckoning) {
		w.innerHTML = String(kcHtml`<div style="background:#f7e9d0;border:1px solid var(--gold);border-radius:3px;padding:6px 8px">👑 <strong>The Reckoning has already been called${t.reckoning.byName ? ` by ${t.reckoning.byName}` : ""}.</strong> The world is judged at the end of Turn ${t.reckoning.resolveAtTurn} unless the claim is broken.</div>`);
		return;
	}
	if (t.canCallReckoning) {
		w.innerHTML = String(reckoningCall ? kcHtml`<div style="background:#fdeaea;border:1px solid var(--crimson);border-radius:3px;padding:6px 8px;font-size:.78rem">👑 <strong>You will Call the Reckoning with these orders.</strong> If your bloc still holds ${thr}%+ when orders resolve, the endgame begins (a 2-turn grace, then the world is judged). <button type="button" onclick="setReckoningCall(false)" style="margin-left:6px;font-size:.66rem;padding:2px 8px;border:1px solid #999;background:#eee;border-radius:2px;cursor:pointer">cancel</button></div>` : kcHtml`<div><button type="button" onclick="setReckoningCall(true)" style="font-family:'Cinzel',serif;font-size:.72rem;padding:6px 12px;border:1px solid #5a1010;background:var(--crimson);color:#fff;border-radius:2px;cursor:pointer">👑 Call the Reckoning</button>
          <div style="color:#2f281c;margin-top:4px">Your bloc commands <strong>${pct}%</strong> of the world's tax base (need ${thr}%). Calling it forces a final scoring in two turns — submit orders to lodge the claim.</div></div>`);
		return;
	}
	let why;
	if (t.callBlockedReason === "tooEarly") why = kcHtml`The throne cannot be claimed before <strong>Turn ${Number(t.reckoningMinTurn) || 10}</strong> — the realms are still settling and the world will not yet be judged.`;
	else if (t.public === false) why = `The Imperial Titles are contested in secret until Turn ${String(Number(t.publicFromTurn) || 5)} — the Reckoning cannot be called before then.`;
	else if (t.kingAlive === false) why = kcHtml`Only a living <strong>King</strong> may call it — your king is dead, so the call must wait for the heir.`;
	else if (t.callBlockedReason === "callerShort") why = kcHtml`Your bloc commands <strong>${pct}%</strong> of the world's tax base — enough to call it — but the claim belongs to whoever lodges it, and your own realm holds only <strong>${ownPct}%</strong>. A claimant must personally hold <strong>${minPct}%</strong> (half the ${thr}% bar), so the greatest realm in your alliance must be the one to call it.`;
	else if (pct < thr) {
		const _na = Math.max(0, (Number(t.blocSize) || 1) - 1), _so = Math.ceil(dispFloor((t.soloThreshold ?? (Number(t.threshold) || 0)) * 100 * 1e6) / 1e6);
		why = kcHtml`Your bloc commands <strong>${pct}%</strong> of the world's tax base; <strong>${thr}%</strong> is needed <span style="color:#2f281c">(${thr - pct} more percentage point${thr - pct !== 1 ? "s" : ""} to go)</span>.${_na > 0 ? kcHtml` <span style="color:#654c0c">Standing alone the bar would be ${_so}% — each of your ${_na} all${_na === 1 ? "y" : "ies"} raises it by ${Math.round((Number(t.allyStep) || 0) * 100)} points.</span>` : ""}`;
	} else why = kcHtml`Your bloc commands <strong>${pct}%</strong> of the world's tax base (need ${thr}%).`;
	w.innerHTML = String(kcHtml`<div style="color:#231e16;line-height:1.5">${why} The <strong>👑 Call the Reckoning</strong> button will appear here when you qualify.</div>`);
}
function spellSecondaryHtml(report, c, ph, selSpell, extra) {
	const NEEDS_PROV = theActionSpellsAimedAtAProvince();
	const NEEDS_CHAR = theActionSpellsAimedAtAHero();
	const theSpellsHints = SPELL_HINTS;
	let secondaryHtml;
	if (NEEDS_PROV.has(selSpell)) {
		const wmProvs = report.worldMeta?.provinces ?? [];
		const curLoc = predictedLocation(c.id, ph);
		const curId = curLoc ? curLoc.id : c.locationId;
		const candIds = [curId, ...wmProvs.find((p) => p.id === curId)?.neighbors ?? []];
		const kfNames = new Set((report.knownFeatures ?? []).filter((f) => !f.cleared).map((f) => f.province));
		const provOpts = candIds.map((pid) => {
			const p = wmProvs.find((x) => x.id === pid);
			if (!p) return "";
			const t = p.terrain;
			if (selSpell === "Flood" && (t === "sea" || t == null)) return "";
			if (selSpell === "Hide Lairs") {
				if (!((p.features ?? []).length > 0 || p.name && kfNames.has(p.name))) return "";
			}
			const taxLbl = selSpell === "Bless Province" && p.tax != null ? ` · tax base ${String(p.tax)}g` : "";
			const label = ((p.name ?? "") || `Unknown province (${(provDirectionLabel(curId, pid, wmProvs, report.worldMeta?.cols) ?? "") || "?"})`) + (pid === curId ? " (here)" : "") + (t ? ` — ${t}` : "") + taxLbl;
			return kcHtml`<option value="${pid}" ${extra == pid ? "selected" : ""}>${label}</option>`;
		}).filter(Boolean);
		secondaryHtml = provOpts.length ? kcHtml`<select id="po-extra-${c.id}-${ph}" style="margin-top:4px"><option value="">— Target province —</option>${provOpts}</select>
          <div style="font-size:.72rem;color:var(--stone);margin-top:2px">${theSpellsHints[selSpell] ?? ""}</div>` : kcHtml`<input id="po-extra-${c.id}-${ph}" type="text" value="" placeholder="${selSpell === "Part Sea" ? "No province here or adjacent" : selSpell === "Flood" ? "No land province here or adjacent" : selSpell === "Hide Lairs" ? "No discovered lairs here or adjacent" : "No valid target province in reach"}" disabled>
          <div style="font-size:.72rem;color:var(--stone);margin-top:2px">${theSpellsHints[selSpell] ?? ""}</div>`;
	} else if (NEEDS_CHAR.has(selSpell)) {
		const casterLoc = predictedLocation(c.id, ph)?.id ?? c.locationId;
		const theMarkMustStandHere = theMarkOfThisSpellMustStandInTheCastersProvince(selSpell);
		const standsWhereTheMarkMust = (whereHeStands) => !theMarkMustStandHere || whereHeStands === casterLoc;
		let charOpts;
		if (selSpell === "Resurrect") {
			const casterHereName = (predictedLocation(c.id, ph) ?? { name: void 0 }).name;
			charOpts = (report.knownDeadHeroes ?? report.deadHeroes ?? []).filter((x) => {
				if (x.locationId != null && casterLoc != null) return String(x.locationId) === String(casterLoc);
				return casterHereName && x.locationName === casterHereName;
			}).map((x) => {
				const _r = x.raisable !== void 0 ? Boolean(x.raisable) : !x.isKing || Boolean(x.isMonarch);
				const _w = (x.whyNot ?? "") || (x.isKing && !x.isMonarch ? "kings cannot be resurrected" : "not a legal target");
				return {
					...x,
					_r,
					_w
				};
			}).sort((a, b) => (b._r ? 1 : 0) - (a._r ? 1 : 0)).map((x) => {
				const who = x.isMonarch ? " 👑 (your fallen monarch — reclaims the throne)" : x.wasOwnHero ? "" : ` ⚔ (${x.player != null ? String(realmNameP(x.player, report)) + " hero" : "wandering hero"})`;
				if (!x._r) return kcHtml`<option value="" disabled>${x.isMonarch ? "👑 " : ""}${x.name} — cannot be raised: ${x._w}</option>`;
				return kcHtml`<option value="${x.id}"${x.wasOwnHero ? "" : realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.isMonarch ? "👑 " : ""}${x.name}${who} — died turn ${Number(x.killedOnTurn) || "?"}</option>`;
			});
			if (!charOpts.length) charOpts = kcHtml`<option value="" disabled>No fallen hero lies in ${(casterHereName ?? "") || "this province"} — only bodies in the caster's province can be raised; move there first</option>`;
		} else if (selSpell === "Charm") {
			charOpts = (report.visibleChars ?? []).filter((x) => x.alive !== false && standsWhereTheMarkMust(x.locationId) && !x.isKing && !leadsArmiesP(x) && !x.charmImmune && (x.player === null || x.player !== c.player)).map((x) => kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.name}${x.player === null ? " (wandering — joins you free)" : ` ⚔ (${String(realmNameP(x.player, report))}, no armies — yours for the turn)`} — ${(x.locationName ?? "") || "?"}</option>`);
			if (!charOpts.length) charOpts = kcHtml`<option value="" disabled>No valid target — needs a lone hero (wandering or enemy, leading no armies) in this province (kings are immune, and so is anyone charmed last turn)</option>`;
		} else if (selSpell === "Oratory") charOpts = [kcHtml`<option value="${c.id}" ${extra == c.id ? "selected" : ""}>${c.name} (self)</option>`, ...orderTargetCharsP(report, ph, { allowCharmEnemy: true }).filter((x) => x.id !== c.id && standsWhereTheMarkMust(predictedLocation(x.id, ph)?.id ?? x.locationId)).map((x) => kcHtml`<option value="${x.id}" ${extra == x.id ? "selected" : ""}>${x.name} — ${(x.locationName ?? "") || "?"}${preOrderTagP(x)}</option>`)];
		else if (selSpell === "Phantasmal Armies") charOpts = [kcHtml`<option value="${c.id}" ${extra == c.id ? "selected" : ""}>${c.name} (self)</option>`, ...orderTargetCharsP(report, ph, { allowCharmEnemy: true }).filter((x) => x.id !== c.id && standsWhereTheMarkMust(predictedLocation(x.id, ph)?.id ?? x.locationId)).map((x) => kcHtml`<option value="${x.id}" ${extra == x.id ? "selected" : ""}>${x.name} — ${(x.locationName ?? "") || "?"}${preOrderTagP(x)}</option>`)];
		else if (selSpell === "Clairvoyance") {
			charOpts = (report.everSeenChars?.length ? report.everSeenChars : report.visibleChars ?? []).filter((x) => Boolean(x) && x?.player != null && !x.isWandering).slice().sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")).map((x) => kcHtml`<option value="${x.id}"${x.player === c.player ? "" : realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.name}${x.player === c.player ? " (yours)" : ` ⚔ (${String(realmNameP(x.player, report))})`} — last seen: ${(x.lastLocName ?? "") || (x.locationName ?? "") || "?"}${x.lastSeenTurn ? ` (turn ${String(x.lastSeenTurn)})` : ""}</option>`);
			if (!charOpts.length) charOpts = kcHtml`<option value="" disabled>You have not seen any enemy characters yet</option>`;
		} else if (selSpell === "Control Undead") charOpts = [kcHtml`<option value="__scan__" ${extra === "__scan__" || extra === "" || extra == null ? "selected" : ""}>🔍 Cast on THIS province — reveal the dead army units here</option>`, ...(report.visibleChars ?? []).filter((x) => x.player !== c.player && standsWhereTheMarkMust(x.locationId)).map((x) => kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.name}${x.player === null ? " (wandering)" : ` ⚔ (${String(realmNameP(x.player, report))})`} — seize one undead unit from them</option>`)];
		else if (selSpell === "Telekinetic Storm") {
			charOpts = (report.visibleChars ?? []).filter((x) => x.player !== c.player && standsWhereTheMarkMust(x.locationId) && leadsArmiesP(x)).map((x) => kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.name}${x.player === null ? " (wandering)" : ` ⚔ (${String(realmNameP(x.player, report))})`} — ${(x.armyBand ?? "") || String(x.armies) + " unit" + (x.armies !== 1 ? "s" : "")} — ${(x.locationName ?? "") || "?"}</option>`);
			if (!charOpts.length) charOpts = kcHtml`<option value="" disabled>No enemy/neutral hero leading armies in this province</option>`;
		} else {
			charOpts = (report.visibleChars ?? []).filter((x) => x.player !== c.player && standsWhereTheMarkMust(x.locationId)).map((x) => kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.name}${x.player === null ? " (wandering)" : ` ⚔ (${String(realmNameP(x.player, report))})`} — ${(x.locationName ?? "") || "?"}</option>`);
			if (!charOpts.length) charOpts = kcHtml`<option value="" disabled>No enemy/neutral heroes in this province</option>`;
		}
		const _ph0 = selSpell === "Control Undead" ? "— Choose what to cast it on —" : "— Target character —";
		secondaryHtml = kcHtml`<select id="po-extra-${c.id}-${ph}" style="margin-top:4px" onchange="syncResurrectCard(${kcArg(String(c.id))},${kcArg(ph)});syncCharmCard(${kcArg(String(c.id))},${kcArg(ph)})"><option value="">${_ph0}</option>${charOpts}</select>
          <div style="font-size:.72rem;color:var(--stone);margin-top:2px">${theSpellsHints[selSpell] ?? ""}</div>`;
	} else secondaryHtml = kcHtml`<input id="po-extra-${c.id}-${ph}" type="hidden" value=""><div style="font-size:.72rem;color:var(--stone);margin-top:2px">${theSpellsHints[selSpell] ?? ""}</div>`;
	return secondaryHtml;
}
// src/ui/player/order-targets.ts
/** Whether the saved choice `saved` is the option's value `value`, as `saved == value` compares them (a saved id as words
*  against a province's or a hero's number). */
function isTheSavedChoice(saved, value) {
	return saved == value;
}
/** A value the code reads a field of: itself, or for none the TypeError the read threw. */
function thereOrTheTypeError(x, what) {
	if (x === null || x === void 0) throw new TypeError(`Cannot read properties of ${String(x)} (reading ${what})`);
	return x;
}
/** `value[key]` as JavaScript reads it (a value parsed from JSON): for none, the TypeError that read throws. */
function fieldAsJavaScriptReadsIt(value, key) {
	if (value === null || value === void 0) throw new TypeError(`Cannot read properties of ${String(value)} (reading '${key}')`);
	return Reflect.get(Object(value), key);
}
/** `value?.[key]`: none for none, else the field as JavaScript reads it. */
function fieldIfThere(value, key) {
	return value === null || value === void 0 ? void 0 : fieldAsJavaScriptReadsIt(value, key);
}
/** `a || b` on values of any kind: `a` where it is truthy, else `b`. */
function itOrElse(a, b) {
	if (a) return a;
	return b;
}
/** A value the code splits, trims or tests the start of: words, handed back as they are; any other value throws the
*  TypeError the old `.split` on it threw. */
function theWordsToSplit(value) {
	if (typeof value === "string") return value;
	throw new TypeError(`${typeof value} has no split: not words`);
}
/** An alignment order's row (ALIGN_ACTIONS' by its name): none throws the TypeError reading it threw. */
function theAlignmentOrdersRow(name) {
	return thereOrTheTypeError(ALIGN_ACTIONS[name], `the row of ${name}`);
}
/** The number `what` of an alignment order's row, as `row.theNumbers[what].value` read it (a grade is words): one the
*  row doesn't state throws the TypeError that read threw. */
function theRowsNumber(row, what) {
	return thereOrTheTypeError(row.theNumbers[what], "'value'").value;
}
/** A province's neighbours as the consecration's checks read them: the numbers among them (the checks only ask whether
*  a province's number is one of them, which no other value is). */
function theNumbersAmong(list) {
	return list.filter((x) => typeof x === "number");
}
/** Where a hero will stand, as the consecration's checks read its id: a forecast with none reads as NaN, which matches
*  no province (the checks compare it with the provinces' numbers, as `undefined` did). */
function theIdOrNoProvince(id) {
	return id ?? NaN;
}
/** A hero's companies, each as the code's guard reads it (`c.armies || []`). */
function theCompaniesOrNone(armies) {
	return armies ?? [];
}
/** The value of the page's field with the id `id` (`document.getElementById(id)?.value`): none where no element has the
*  id, or the element holds no value. */
function theValueOfTheField(id) {
	const el = document.getElementById(id);
	return el ? theValueOfAField(el) : void 0;
}
function exploreGainFor(c, terr) {
	const report = currentReport ?? {};
	const disc = report.discoveries ?? [];
	const explorerSkill = effSkillP(c, "explorer");
	let discMult = 1;
	const theMultOnTheGround = report.exploreDiscMult?.[String(terr)];
	if (theMultOnTheGround != null) discMult = theMultOnTheGround;
	else disc.forEach((d) => {
		const theWords = thereOrTheTypeError(d, "'desc'").desc;
		const m = /map(?:s)? (\d+)% more/i.exec(theWords ?? "");
		if (m && (!/mountain/i.test(String(theWords)) || terr === "mountain")) discMult *= 1 + parseInt(m[1] ?? "") / 100;
	});
	return theShareOfAProvinceAnExploreOrderMaps(terr, explorerSkill, (c.minorHeld ?? []).some((t) => /Trailblazer/i.test(thereOrTheTypeError(t, "'name'").name ?? "")), discMult);
}
function exploreQueuedBefore(charId, ph, provId) {
	let sum = 0;
	(currentReport?.characters ?? []).forEach((o) => {
		if (!o || o.alive === false) return;
		for (let p = 0; p <= 4; p++) {
			const isSelf = String(o.id) === String(charId);
			if (isSelf && p >= ph) break;
			if (!isSelf && p > ph) break;
			if (theValueOfTheField(`po-action-${String(o.id)}-${String(p)}`) !== "Explore") continue;
			const loc = predictedLocation(o.id, p);
			if (!loc || loc.id !== provId) continue;
			const pd = currentReport?.provinceOrderData?.[String(provId)];
			sum += exploreGainFor(o, (pd?.terrain ?? "") || null);
		}
	});
	return sum;
}
function exploreMoveGainBefore(c, upToPhaseExclusive, provId) {
	const worldMeta = currentReport?.worldMeta ?? null;
	const provinces = worldMeta?.provinces ?? [];
	const theCoast = provinces.find((p) => p.id === provId);
	let gain = 0;
	for (let p = 0; p < upToPhaseExclusive; p++) {
		const act = theValueOfTheField(`po-action-${String(c.id)}-${String(p)}`);
		if (act !== "Move" && act !== "Forced March") continue;
		const dest = predictedLocation(c.id, p + 1);
		const from = predictedLocation(c.id, p);
		if (!dest || !from || dest.id === from.id) continue;
		if (dest.id === provId) {
			const worn = c.theShareHisWornItemsAddToAMarchIn;
			gain += theShareOfAProvinceAMarchIntoItMaps(Math.min(5, effSkillP(c, "explorer")), typeof worn === "number" ? worn : 0, Number(c.skills?.["march"]) >= 6, (c.armies ?? []).length);
			continue;
		}
		const theSea = provinces.find((x) => x.id === dest.id);
		if (!worldMeta || !theSea || !theCoast || !aProvinceBesideTheSeaIsACoastAVoyageCharts(theCoast.terrain)) continue;
		if (!KC_HEX_DIRS.some((d) => theHexNextToAProvinceInADirection(theSea, d, worldMeta.cols, worldMeta.rows) === provId)) continue;
		gain += theShareAVoyageChartsOfEachCoastBesideTheSea(theSea.terrain, Number(c.skills?.["naval"]) >= 6, theCompaniesOrNone(c.armies).some((a) => a && PO_SEA_TYPES.has(a.type)));
	}
	return gain;
}
function exploreProjectionNote(c, ph) {
	const loc = predictedLocation(c.id, ph);
	const report = currentReport ?? {};
	const pd = loc ? report.provinceOrderData?.[String(loc.id)] : null;
	const wm = loc ? (report.worldMeta?.provinces ?? []).find((x) => x.id === loc.id) : null;
	const terr = (pd?.terrain ?? "") || (wm?.terrain ?? "") || null;
	if (!loc) return kcHtml`🧭 Explores the province ${c.name} stands in.`;
	if (skillsUnseenP(c)) return kcHtml`🧭 Explores ${loc.name}. The gain depends on an Explorer level ${c._unknownSkills ? `not known until ${String(c.name)} has joined` : `hidden from you`}.`;
	if (!terr) return kcHtml`🧭 Explores ${(loc.name ?? "") || "the province"} — its ground is still unknown to you, so how much it will yield cannot be judged from here.`;
	const gain = exploreGainFor(c, terr);
	const known = Math.min(100, Number(pd?.explored ?? wm?.explored) || 0);
	const moved = exploreMoveGainBefore(c, ph, loc.id);
	const queued = exploreQueuedBefore(c.id, ph, loc.id);
	const before = Math.min(100, known + moved + queued);
	const after = Math.min(100, before + gain);
	const priorBits = [];
	if (moved > 0) priorBits.push(`+${String(moved)}% from marching in`);
	if (queued > 0) priorBits.push(`+${String(queued)}% from earlier Explore orders this turn`);
	const prior = priorBits.length ? ` (${String(known)}% mapped now, ${priorBits.join(", ")})` : "";
	if (before >= 100) return kcHtml`🧭 ${loc.name} is already fully mapped${prior ? ` ${prior}` : ""} — this Explore order would add nothing.`;
	return kcHtml`🧭 ${loc.name} (${capitalise(terr)}) is <strong>${before}%</strong> mapped; this order adds about <strong>+${gain}%</strong> → <strong>${after}%</strong>${after >= 100 ? " — fully explored" : ""}${prior}.`;
}
function refreshExploreNotes() {
	(currentReport?.characters ?? []).forEach((c) => {
		if (!c || c.alive === false) return;
		for (let p = 0; p <= 4; p++) {
			const el = document.getElementById(`po-explore-note-${String(c.id)}-${String(p)}`);
			if (el) el.innerHTML = String(exploreProjectionNote(c, p));
		}
	});
}
function getAlreadyRecruitedThisTurn(charId, upToPhaseExclusive) {
	const recruited = {};
	const savedOrders = currentGamePlayer?.orders;
	let parsedOrders = {};
	if (savedOrders) try {
		const raw = typeof savedOrders === "string" ? JSON.parse(savedOrders) : savedOrders;
		parsedOrders = itOrElse(fieldAsJavaScriptReadsIt(itOrElse(fieldAsJavaScriptReadsIt(raw, "orders"), raw), String(charId)), []);
	} catch {}
	for (let ph = 0; ph < upToPhaseExclusive; ph++) {
		const domAction = theValueOfTheField(`po-action-${String(charId)}-${String(ph)}`);
		const theSavedPhase = fieldAsJavaScriptReadsIt(parsedOrders, String(ph));
		if (itOrElse(itOrElse(domAction, fieldIfThere(theSavedPhase, "action")), "") !== "Recruit Armies") continue;
		const tgt = domAction ? getOrderTarget(charId, ph) : itOrElse(fieldIfThere(theSavedPhase, "target"), "");
		if (!tgt) continue;
		const loc = predictedLocation(charId, ph);
		const provKey = loc ? String(loc.id) : "unknown" + String(ph);
		theWordsToSplit(tgt).split(",").forEach((sel) => {
			const s = sel.trim();
			if (s.startsWith("merc:")) return;
			if (s.startsWith("to:")) return;
			const parts = s.split("|");
			if (parts[0]) {
				const key = `${provKey}:${parts[0].trim()}`;
				recruited[key] = (recruited[key] ?? 0) + 1;
			}
		});
	}
	return recruited;
}
globalThis._draftOrdersSnapshot = {};
function draftOrderAt(charId, ph) {
	const actEl = document.getElementById(`po-action-${String(charId)}-${String(ph)}`);
	if (actEl) return {
		action: itOrElse(theValueOfAField(actEl), ""),
		target: getOrderTarget(charId, ph)
	};
	const sv = fieldAsJavaScriptReadsIt(fieldIfThere(_draftOrdersSnapshot, String(charId)) ?? [], String(ph)) ?? {};
	return {
		action: itOrElse(fieldAsJavaScriptReadsIt(sv, "action"), ""),
		target: itOrElse(fieldAsJavaScriptReadsIt(sv, "target"), "")
	};
}
var LAIR_POWER_RANK = {
	Weak: 0,
	Moderate: 1,
	Powerful: 2,
	Legendary: 3
};
/** The skills' names, read by any skill; the tables the item fields read by any slot or tier; a mastery spell's level,
*  read by any spell; a rumour's price, by any grade. */
var theSkillsLabels = SKILL_LABELS;
var theSlotsCaps = ITEM_SLOT_CAP_P;
var theSlotsLabels = ITEM_SLOT_LABEL_P;
var theTiersNames = ITEM_TIER_NAME_P;
var theLevelsTheMasterySpellsNeed = SPELL_REQ_LEVEL;
var theSchoolsOfTheSpells = SPELL_TO_SCHOOL;
var theRumoursPrices = RUMOUR_COST_BY_POWER_P;
/** The lairs' ranks, read by any grade. */
var theLairsRanks = LAIR_POWER_RANK;
/** The heroes the report lists, each as the code's guard reads it (`report.characters || []`). */
function theHeroesOrNone(report) {
	return report?.characters ?? [];
}
function defaultLairTarget(c, ph, provId, feats) {
	const taken = /* @__PURE__ */ new Set();
	theHeroesOrNone(currentReport).forEach((o) => {
		if (!o || o.alive === false) return;
		for (let q = 0; q < SEASONS.length; q++) {
			if (o.id === c.id && q >= ph) continue;
			const d = draftOrderAt(o.id, q);
			if (d.action !== "Search Lair" && d.action !== "Search Feature") continue;
			if (d.target === "") continue;
			const loc = predictedLocation(o.id, q);
			if ((loc ? loc.id : o.locationId) !== provId) continue;
			taken.add(String(d.target));
		}
	});
	const theFirst = (feats ?? []).filter((f) => !f.ritualSite && !taken.has(String(f.idx))).sort((a, b) => (a.ritualSite ? 9 : theLairsRanks[String(a.monsterPower)] ?? 5) - (b.ritualSite ? 9 : theLairsRanks[String(b.monsterPower)] ?? 5) || Number(a.idx) - Number(b.idx))[0];
	return theFirst ? String(theFirst.idx) : "";
}
function defaultResearchField(c, ph) {
	const here = predictedLocation(c.id, ph);
	const hereId = here ? here.id : c.locationId;
	const chars = theHeroesOrNone(currentReport).filter((o) => !!o && o.alive !== false);
	const counts = {};
	let best = "", bestN = 0;
	chars.forEach((o) => {
		if (o.id === c.id) return;
		const d = draftOrderAt(o.id, ph);
		if (d.action !== "Research" || !d.target) return;
		const loc = predictedLocation(o.id, ph);
		if ((loc ? loc.id : o.locationId) !== hereId) return;
		const theField = inWords(d.target);
		const theCount = (counts[theField] ?? 0) + 1;
		counts[theField] = theCount;
		if (theCount > bestN) {
			bestN = theCount;
			best = d.target;
		}
	});
	if (best) return best;
	for (let q = ph - 1; q >= 0; q--) {
		const d = draftOrderAt(c.id, q);
		if (d.action === "Research" && d.target) return d.target;
	}
	for (const o of chars) {
		if (o.id === c.id) continue;
		for (let q = 0; q < SEASONS.length; q++) {
			const d = draftOrderAt(o.id, q);
			if (d.action === "Research" && d.target) return d.target;
		}
	}
	return "";
}
function practiceCompanionSkill(c, ph) {
	const report = currentReport ?? {};
	const here = predictedLocation(c.id, ph);
	const hereId = here ? here.id : c.locationId;
	const counts = {};
	let best = "", bestN = 0;
	theHeroesOrNone(report).forEach((o) => {
		if (!o || o.id === c.id || o.alive === false) return;
		const d = draftOrderAt(o.id, ph);
		if (d.action !== "Practice Skill") return;
		const sk = d.target;
		if (typeof sk !== "string" || !sk || !ALL_SKILLS.includes(sk)) return;
		const loc = predictedLocation(o.id, ph);
		if ((loc ? loc.id : o.locationId) !== hereId) return;
		const theCount = (counts[sk] ?? 0) + 1;
		counts[sk] = theCount;
		if (theCount > bestN) {
			bestN = theCount;
			best = sk;
		}
	});
	return best;
}
function practiceOwnEarlierSkill(c, ph) {
	for (let q = ph - 1; q >= 0; q--) {
		const d = draftOrderAt(c.id, q);
		if (d.action !== "Practice Skill") continue;
		const sk = d.target;
		if (typeof sk === "string" && sk && ALL_SKILLS.includes(sk)) return sk;
	}
	return "";
}
function theBloodOfferingsHint(army, sac, ben) {
	const grades = theRowsNumber(theAlignmentOrdersRow("Perform Rite"), "theBloodOfferingsGrades");
	const offered = theCompaniesABloodOfferingGivesAndRaises(army, `S:${sac.join(",")}|E:${ben.join(",")}`, (a) => a);
	if (!offered) return {
		words: `⚠ No offering will be made: the rite needs two companies it can take.`,
		colour: "#b04a4a"
	};
	const names = (places) => places.map((i) => String(armyLabel(thereOrTheTypeError(army[i], "'unitName'"), { short: true }))).join(", ");
	const what = `sacrifice ${names(offered.given)} to empower ${names(offered.raised)} by +${String(grades)} tiers`;
	if (sac.length === 0 && ben.length === 0) return {
		words: `Nothing marked: the turn will ${what} (the first two companies the rite can take). Mark units to choose others.`,
		colour: "#7a4a00"
	};
	if (sac.length === 0 || ben.length === 0) return {
		words: `⚠ A side is left empty, so the turn ignores the marks: it will ${what} (the first two companies the rite can take).`,
		colour: "#b04a4a"
	};
	if (sac.length !== ben.length) return {
		words: `⚠ The sides don't match (${String(sac.length)} and ${String(ben.length)}): each sacrifice funds one empowerment, so the turn will ${what}.`,
		colour: "#b04a4a"
	};
	return {
		words: `✓ The turn will ${what}.`,
		colour: "#2d6a2d"
	};
}
function theMoveFieldsDirectionsFromWhereAHeroStandsInAPhase(c, ph, action, target, report) {
	const worldMeta_ = report.worldMeta;
	const wCols = (worldMeta_?.cols ?? 0) || 20;
	const wRows = (worldMeta_?.rows ?? 0) || 10;
	const wProvs = worldMeta_?.provinces ?? [];
	const curLocObj = predictedLocation(c.id, ph);
	const curProv_ = curLocObj ? wProvs.find((p) => p.id === curLocObj.id) : null;
	let blockedNorth = false, blockedSouth = false;
	const _defaultDir = action === "Move" && !target ? lastMoveDirOf(c.id, ph) : null;
	const dirOpts = Object.entries(DIRECTIONS).map(([v, l]) => {
		let provLabel = "", offMap = false;
		const nidOut = curProv_ ? theHexNextToAProvinceInADirection(curProv_, v, wCols, wRows) : null;
		if (curProv_) {
			if (nidOut !== null) {
				const nbProv = wProvs.find((p) => p.id === nidOut);
				if (nbProv?.name) provLabel = ` (${nbProv.name})`;
				else if (!nbProv) offMap = true;
			} else {
				offMap = true;
				if (v === "NW" || v === "NE") blockedNorth = true;
				else blockedSouth = true;
			}
		}
		if (offMap) return null;
		const valOut = nidOut != null ? `prov:${String(nidOut)}` : `dir:${v}`;
		return kcHtml`<option value="${valOut}" ${target === valOut || target === "dir:" + v ? "selected" : !target && _defaultDir === v ? "selected" : ""}>${l}${provLabel}</option>`;
	}).filter((o) => Boolean(o));
	return {
		wProvs,
		curProv_,
		blockedNorth,
		blockedSouth,
		dirOpts
	};
}
function theSpellsTheCastSpellFieldOffersAHeroInAPhase(c, ph, report) {
	const PHASE_SPELLS = theActionSpells();
	const { practising: practisingSchools, projected: _projLvl, trained: _trainedLvl } = projectedMagicLevels(c, ph);
	const _warlock = (c?.minorHeld ?? []).some((t) => t?.key === "warlock");
	const _castsAllowed = (school) => actionSpellsAHeroMayCastInASchoolEachTurn({ skills: {
		...c?.skills ?? {},
		..._trainedLvl
	} }, school, Number(_projLvl[school]), _warlock);
	const _cathedral = Boolean(report.kingdom?.itsGrandCathedralStands);
	const _costsNoSlot = (spell) => typeof spell === "string" && theSpellCostsItsCasterNoCastingSlot(spell, _cathedral);
	const schoolCastCount = {};
	for (let prevPh = 0; prevPh < ph; prevPh++) {
		const hisId = thereOrTheTypeError(c, "'id'").id;
		if (itOrElse(theValueOfTheField(`po-action-${String(hisId)}-${String(prevPh)}`), "") !== "Cast Spell") continue;
		const prevSpell = getOrderTarget(hisId, prevPh);
		if (prevSpell && _costsNoSlot(prevSpell)) continue;
		const prevSchool = prevSpell ? theSchoolsOfTheSpells[inWords(prevSpell)] : null;
		if (prevSchool) schoolCastCount[prevSchool] = (schoolCastCount[prevSchool] ?? 0) + 1;
	}
	return {
		practisingSchools,
		_castsAllowed,
		schoolCastCount,
		_spellRows: Object.entries(SPELLS_BY_SCHOOL).filter(([school]) => effMagicLvl(c, school) >= 1 || practisingSchools.has(school)).flatMap(([school, list]) => list.filter((s) => {
			const theLevelItNeeds = theLevelsTheMasterySpellsNeed[s];
			return PHASE_SPELLS.has(s) && (!theLevelItNeeds || rawMagicLvl(c, school) >= theLevelItNeeds);
		}).map((s) => {
			const currentLvl = effMagicLvl(c, school);
			const projLvl = _projLvl[school];
			const isPractising = practisingSchools.has(school) && currentLvl === 0;
			const limit = _castsAllowed(school);
			const used = schoolCastCount[school] ?? 0;
			const atLimit = used >= limit && !_costsNoSlot(s);
			const lvlTxt = projLvl !== void 0 && projLvl > currentLvl ? `Lv${String(currentLvl)}→${String(projLvl)} if practice succeeds` : `Lv${String(currentLvl)}`;
			const theSchoolsName = String(theSkillsLabels[school]);
			const usedOfLimit = `${String(used)}/${String(limit)}`;
			let label;
			if (isPractising && !atLimit) label = `${s} (${theSchoolsName} — practising, may unlock: Lv${String(projLvl)}, ${usedOfLimit} used)`;
			else if (atLimit) label = `${s} (${theSchoolsName} ${lvlTxt} — limit reached: ${usedOfLimit} this turn)`;
			else label = `${s} (${theSchoolsName} ${lvlTxt} — ${usedOfLimit} used)`;
			return {
				spell: s,
				atLimit,
				label
			};
		}))
	};
}
function buildTargetField(c, ph, saved) {
	const action = saved.action ?? "";
	const target = itOrElse(saved.target, "");
	const extra = itOrElse(saved.extra, "");
	const report = currentReport ?? {};
	const provOrderData = report.provinceOrderData ?? {};
	const cfg = L79_ORDERS[inWords(action)];
	if (cfg) {
		const hintHtml = kcHtml`<div style="font-size:.68rem;color:var(--stone);margin-top:2px">${action === "Grand Design" ? gdHintFor(report) : cfg.hint}</div>${orderChanceNote(c, action, ph)}`;
		if (cfg.target === "none") return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${action} — no target needed" readonly>${hintHtml}`;
		if (cfg.target === "province") {
			const wmProvs = report.worldMeta?.provinces ?? [];
			if (cfg.provKind === "move_adjacent") {
				const curLoc = predictedLocation(c.id, ph);
				const curId = curLoc ? curLoc.id : c.locationId;
				const opts = (wmProvs.find((p) => p.id === curId)?.neighbors ?? []).map((pid) => {
					const p = wmProvs.find((x) => x.id === pid);
					if (!p) return "";
					return kcHtml`<option value="${pid}" ${isTheSavedChoice(target, pid) ? "selected" : ""}>${(p.name ?? "") || "Unknown province (" + ((provDirectionLabel(curId, pid, wmProvs, report.worldMeta?.cols) ?? "") || "?") + ")"}${p.ownerName ? ` — ${p.ownerName}` : ""}</option>`;
				}).filter(Boolean);
				return opts.length ? kcHtml`<select id="po-target-${c.id}-${ph}">${opts}</select>${hintHtml}` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No adjacent province to march into" disabled>${hintHtml}`;
			}
			if (cfg.provKind === "sea_adjacent") {
				const curLoc = predictedLocation(c.id, ph);
				const curId = curLoc ? curLoc.id : c.locationId;
				const opts = [curId, ...wmProvs.find((p) => p.id === curId)?.neighbors ?? []].map((pid) => {
					const p = wmProvs.find((x) => x.id === pid);
					if (p?.terrain !== "sea") return "";
					return kcHtml`<option value="${pid}" ${isTheSavedChoice(target, pid) ? "selected" : ""}>${(p.name ?? "") || "Sea (" + String(pid) + ")"}${pid === curId ? " (here)" : ""}</option>`;
				}).filter(Boolean);
				return opts.length ? kcHtml`<select id="po-target-${c.id}-${ph}">${opts}</select>${hintHtml}` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No sea province here or adjacent to seal" disabled>${hintHtml}`;
			}
			const opts = wmProvs.filter((p) => p.name && p.terrain && p.terrain !== "sea" && p.owner != null && p.owner !== c.player).map((p) => kcHtml`<option value="${p.id}" ${isTheSavedChoice(target, p.id) ? "selected" : ""}>${p.name}${p.ownerName ? ` — ${p.ownerName}` : ""}</option>`);
			return opts.length ? kcHtml`<select id="po-target-${c.id}-${ph}">${opts}</select>${hintHtml}` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No enemy province in view to strike" disabled>${hintHtml}`;
		}
		if (cfg.target === "here_or_adjacent") {
			const here = predictedLocation(c.id, ph)?.id ?? c.locationId;
			const wm = report.worldMeta?.provinces ?? [];
			const opts = [here, ...wm.find((p) => p.id === here)?.neighbors ?? []].map((pid) => {
				const p = wm.find((x) => x.id === pid);
				const nm = (p?.name ?? "") || (pid === here ? "this province" : `Unknown province (${(provDirectionLabel(here, pid, wm, report.worldMeta?.cols) ?? "") || "?"})`);
				return kcHtml`<option value="${pid}" ${String(target) === String(pid) || !target && pid === here ? "selected" : ""}>${nm}${pid === here ? " (here)" : ""}${p?.explored != null ? ` — ${String(Math.min(100, p.explored))}% mapped` : ""}</option>`;
			});
			return kcHtml`<select id="po-target-${c.id}-${ph}">${opts}</select>${hintHtml}`;
		}
		if (cfg.target === "lair_tier") {
			const opts = [
				["Weak", "Weak lairs"],
				["Moderate", "Moderate lairs"],
				["Powerful", "Powerful lairs"],
				["Legendary", "Legendary lairs"],
				["Ritual", "Ritual sites (the old stones)"]
			].map(([v, lbl]) => kcHtml`<option value="${v}" ${target === v || !target && v === "Weak" ? "selected" : ""}>${lbl}</option>`);
			return kcHtml`<select id="po-target-${c.id}-${ph}">${opts}</select>${hintHtml}`;
		}
		if (cfg.target === "here") {
			const here = predictedLocation(c.id, ph)?.id ?? c.locationId;
			const hp = (report.worldMeta?.provinces ?? []).find((p) => p.id === here);
			const atWar = (pi) => (report.diplomacy?.known ?? []).some((k) => k.index === pi && k.relation === "enemy");
			const owner = hp ? hp.owner : null;
			const rich = !!hp && (hp.wealth === "Rich" || hp.tax != null && hp.tax >= 7);
			const home = Boolean(hp?.isHomeCapitalOfOwner);
			const no = (why) => kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${why}" disabled>${hintHtml}`;
			if (!hp || owner == null || owner === c.player) return no("A Grand Heist needs enemy ground — this province is not held by a rival realm");
			if (!atWar(owner)) return no(`You are not at war with ${(hp.ownerName ?? "") || "this realm"} — declare war first`);
			if (!rich && !home) return no(`${(hp.name ?? "") || "This province"} is not worth robbing — a heist needs their capital or rich country (tax 7+)`);
			return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${hp.name} — ${(hp.ownerName ?? "") || "the enemy realm"}" readonly>
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">🏦 You will crack the vaults of <strong>${hp.name}</strong> — ${home ? `${(hp.ownerName ?? "") || "the enemy"}'s home capital` : "rich country"}.</div>${hintHtml}`;
		}
		if (cfg.target === "character") {
			const here = predictedLocation(c.id, ph)?.id ?? c.locationId;
			const opts = (report.visibleChars ?? []).filter((x) => x.locationId === here && (x.player === null || x.player !== c.player)).map((x) => kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${isTheSavedChoice(target, x.id) ? "selected" : ""}>${x.name}${x.isKing ? " 👑" : ""}${x.player === null ? " (wandering)" : ` ⚔ (${String(realmNameP(x.player, report))})`} — ${(x.locationName ?? "") || "?"}</option>`);
			return opts.length ? kcHtml`<select id="po-target-${c.id}-${ph}">${opts}</select>${hintHtml}` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No enemy hero in your province this phase" disabled>${hintHtml}`;
		}
	}
	const { wProvs, curProv_, blockedNorth, blockedSouth, dirOpts } = theMoveFieldsDirectionsFromWhereAHeroStandsInAPhase(c, ph, action, target, report);
	const stayOpt = curProv_ ? kcHtml`<option value="prov:${curProv_.id}" ${target === `prov:${String(curProv_.id)}` ? "selected" : ""}>Stay in ${(curProv_.name ?? "") || "this province"} (return here if displaced)</option>` : "";
	switch (action) {
		case "Move": {
			const edgeNote = blockedNorth || blockedSouth ? kcHtml`<div style="font-size:.72rem;color:var(--stone);margin-top:3px">\u2744 The impassable icy wastelands to the ${blockedNorth && blockedSouth ? "north and south" : blockedNorth ? "north" : "south"} bar any further movement in that direction — the world does not extend beyond them.</div>` : "";
			const _allOpts = String(kcHtml`${dirOpts}${stayOpt}`);
			const _initSel = (() => {
				const m = /<option value="([^"]+)" selected>/.exec(_allOpts);
				if (m) return m[1] ?? "";
				const f = /<option value="([^"]+)"/.exec(_allOpts);
				return f ? f[1] ?? "" : "";
			})();
			const _initDest = (() => {
				if (!_initSel.startsWith("prov:")) return null;
				const id = parseInt(_initSel.slice(5));
				return isNaN(id) ? null : wProvs.find((p) => p.id === id) ?? null;
			})();
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="onMoveEdited(${kcArg(String(c.id))},${kcArg(ph)})">${dirOpts}${stayOpt}</select>${edgeNote}
        <div id="po-move-mode-${c.id}-${ph}">${poMoveModeNote(c, _initDest, projectedMoveHost(c.id, ph), moveOriginProv(c.id, ph))}</div>
        <div id="po-move-note-${c.id}-${ph}" style="display:none;font-size:.72rem;color:#8a4a00;background:#fff3e0;border:1px solid #e0b070;border-radius:2px;padding:3px 6px;margin-top:3px"></div>`;
		}
		case "Explore": return kcHtml`<input type="hidden" id="po-target-${c.id}-${ph}" value="">
        <div id="po-explore-note-${c.id}-${ph}" style="font-size:.72rem;color:var(--forest)">${exploreProjectionNote(c, ph)}</div>
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">Higher Explorer skill and better terrain reveal more each time; lairs surface as the map fills.</div>`;
		case "Spy": {
			const here = predictedLocation(c.id, ph);
			const hereId = here ? here.id : c.locationId;
			const foes = (report.visibleChars ?? []).filter((x) => x.id !== c.id && x.locationId === hereId && (x.player === null || x.player !== c.player));
			const spyLvl = effSkillP(c, "spy");
			const charPct = Math.max(5, Math.min(95, 25 + 10 * spyLvl));
			const _spHide = skillsUnseenP(c);
			const opts = foes.map((x) => kcHtml`<option value="char:${x.id}"${realmOptStyleP(x.player, report)} ${target === `char:${String(x.id)}` ? "selected" : ""}>Spy on ${x.name}${x.isKing ? " 👑 (king)" : ""}${x.isWandering ? " (wandering)" : x.player != null ? ` ⚔ (${String(realmNameP(x.player, report))})` : ""}${_spHide ? " — learns their skills, items and army" : ` — ~${String(charPct)}% to learn their skills, items and army`}</option>`);
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="rebuildTargetWrap(${kcArg(String(c.id))},${kcArg(ph)})"><option value="" ${!target ? "selected" : ""}>Spy on the province (${here ? here.name : "here"})</option>${opts}</select>
        ${_spHide ? kcHtml`<div style="font-size:.72rem;color:var(--stone);margin-top:3px">Success: 25% +10% per Spy level — ${unseenSuffixP(c)}.</div>` : inWords(itOrElse(target, "")).startsWith("char:") ? kcHtml`<div style="font-size:.72rem;color:var(--stone);margin-top:3px">Success: <strong>${charPct}%</strong> (25% +10% per Spy level) — reveals every skill level, magic item and army unit. Win or lose, you may be <strong>caught</strong>: 20% +10% per level of their Spy, −10% per level of yours, +15% in their realm's land, −15% in yours. A caught spy is brought to a personal fight unless the target's Encounter Plan is set to Refuse — put <strong>Flee</strong> at the head of your plan if you would rather not fight.</div>` : orderChanceNote(c, "Spy", ph)}`;
		}
		case "Rest": return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="(acts in current province)" disabled>`;
		case "Defend":
			if ((c.armies ?? []).length === 0) return kcHtml`<input type="hidden" id="po-target-${c.id}-${ph}" value="">
          <div style="font-size:.72rem;color:var(--forest)">🗡 Lies in wait around ${curProv_ ? curProv_.name : "the province they stand in"} and its neighbours.</div>
          <div style="font-size:.7rem;color:var(--stone);margin-top:3px">With no column at their back they cannot bar a road, but they will try to <em>ambush</em> any enemy character who marches into their province or one adjacent — springing a personal battle. Their <strong>Spy</strong> skill decides the odds of catching them (harder against a commander leading an army). A crowned king cannot be ambushed this way unless the ambusher is also a king. Done once an ambush is sprung (a Defend order in a later season sets a new watch); cancelled by a later Move or Encounter order.</div>`;
			return kcHtml`<input type="hidden" id="po-target-${c.id}-${ph}" value="">
        <div style="font-size:.72rem;color:var(--forest)">🛡 Guards ${curProv_ ? curProv_.name : "the province they stand in"} and its neighbours.</div>
        <div style="font-size:.7rem;color:var(--stone);margin-top:3px">Keeps watch for the rest of the turn, starting this phase. If an enemy army marches into a neighbouring province <em>of yours</em> — or an enemy hero <strong>raises, summons or seizes troops</strong> inside one — they march there at once (1 movement point) and are in the line <em>before</em> the enemy can take it, fighting as the <strong>defender</strong> with the garrison at their side, however strong the foe. A column with ships or sea-beasts in it can only answer by sea — it never rides overland from one land province to another. One ride-out per phase; if their own province is attacked they hold it instead. The watch then carries on from wherever they stand — until it brings them to a battle: win or lose, the Defend order is then done, and only a Defend order in a <em>later</em> season sets a new watch. Also ended by a later Move or Encounter order.</div>
        <div style="font-size:.7rem;color:var(--stone);margin-top:3px">They ride out only <em>after</em> every non-moving order of the phase has resolved — so a spell cast on them, a column handed over or an item passed to them <strong>in the same phase</strong> reaches them first, and they still arrive before any invader marches in. Only support ordered for a phase <em>after</em> they have gone misses them: a spell on them is then never worked (no casting slot lost), a transfer is refused with the troops kept, and a Send Item follows by courier.</div>`;
		case "Encounter Character": {
			const allSeen = (report.encounterTargets ?? []).filter((x) => x.id !== c.id);
			const reasonOf = (x) => x.untargetable === "faceless" ? "no face anyone can remember — cannot be hunted" : x.isKing && !c.isKing ? "only your king may hunt a king" : null;
			const targets = allSeen.filter((x) => !reasonOf(x));
			if (allSeen.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No enemy characters in sight (own / occupied / spied provinces)" disabled>`;
			const opts = allSeen.map((x) => {
				const why = reasonOf(x);
				return kcHtml`<option value="${why ? "" : x.id}"${realmOptStyleP(x.player, report)} ${why ? "disabled" : ""} ${!why && isTheSavedChoice(target, x.id) ? "selected" : ""}>${x.name}${x.isKing ? " 👑 (king)" : ""}${x.player === null ? " (wandering)" : ` ⚔ (${String(realmNameP(x.player, report))})`} — ${(x.locationName ?? "") || "?"}${x.leadsArmy ? " (leads troops)" : ""}${why ? ` — ${why}` : ""}</option>`;
			});
			if (targets.length === 0) return kcHtml`<select id="po-target-${c.id}-${ph}"><option value="" selected>— No character here can be hunted by ${c.name} —</option>${opts}</select>`;
			return kcHtml`<select id="po-target-${c.id}-${ph}"><option value="">— Choose character to hunt down —</option>${opts}</select>
        <div style="font-size:.72rem;color:var(--stone);margin-top:3px">Your hero sets out after this character and chases them across provinces — one province per phase, a movement point each (the chase stalls if they run out of movement). Once you share a province, the chance to corner them each phase is 70%, +5% per level of your Spy, −5% per level of theirs (5–100%). When they catch up: two columns give battle; otherwise it is a personal duel — but to reach a quarry leading troops your hero must first slip through their camp: 60% less 8% per unit they lead, plus 5% per level of your Spy, less 5% per level of their Tactical (5–95%). Turned away by the sentries, the chase ends. Talk/Steal/Scout tactics don't apply — only combat tactics.</div>`;
		}
		case "Steal": {
			const thiefLvl = effSkillP(c, "thief");
			const loc = predictedLocation(c.id, ph);
			const _allVisEnemy = (report.visibleChars ?? []).filter((x) => x.player !== null && x.player !== c.player);
			const visibleEnemyChars = loc ? _allVisEnemy.filter((x) => x.locationId === loc.id) : [];
			const _elsewhere = _allVisEnemy.length - visibleEnemyChars.length;
			const pdS = loc ? provOrderData[String(loc.id)] : null;
			const garrN = pdS?.owner != null && pdS.owner !== c.player ? (pdS.garrisonArmies ?? []).length : 0;
			if (visibleEnemyChars.length === 0 && garrN === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Nothing to steal from in ${loc ? loc.name : "this province"}${_elsewhere > 0 ? ` (${String(_elsewhere)} rival${_elsewhere !== 1 ? "s" : ""} in sight elsewhere — a thief must stand in the same province; move there first)` : " — you need a rival character or an enemy garrison"}" disabled>`;
			const base = 50 + 10 * Math.min(thiefLvl, 5);
			const _stHide = skillsUnseenP(c);
			const _stPct = (halved) => _stHide ? "" : ` — ~${String(halved ? Math.floor(base / 2) : base)}% chance`;
			const opts = visibleEnemyChars.map((x) => {
				return kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${isTheSavedChoice(target, x.id) ? "selected" : ""}>${x.name}${x.isKing ? " 👑" : ""} ⚔ (${realmNameP(x.player, report)})${Number(x.armies) > 0 ? " — leads troops (halved)" : ""}${_stPct(Number(x.armies) > 0)}</option>`;
			});
			const garrOpt = garrN > 0 ? kcHtml`<option value="garrison" ${target === "garrison" ? "selected" : ""}>The garrison paymaster of ${(pdS?.name ?? "") || "this province"} (${garrN} unit${garrN !== 1 ? "s" : ""})${_stPct(true)}</option>` : "";
			const _stNote = _stHide ? kcHtml`<div style="font-size:.72rem;color:var(--stone);margin-top:3px">Success: 50% +10% per Thief level (halved if the mark leads troops or the paymaster is guarded) — ${unseenSuffixP(c)}, and without Thief training the attempt fails.</div>` : "";
			return kcHtml`<select id="po-target-${c.id}-${ph}"><option value="">— Choose target —</option>${opts}${garrOpt}</select>
        <div style="font-size:.72rem;color:var(--stone);margin-top:3px">Only characters in ${loc ? loc.name : "the same province"} are listed — a thief never chases; move there in an earlier phase first.${_elsewhere > 0 ? ` (${String(_elsewhere)} other rival${_elsewhere !== 1 ? "s" : ""} in sight elsewhere.)` : ""} You cannot tell what a rival carries: a successful theft lifts one of their magic items at random (the lesser trinkets come to hand far more readily than a legendary relic), or 5% of their realm's treasury if they carry no magic. <strong>If you fail and are spotted, the victim draws steel</strong> — put <strong>Flee</strong> at the head of this character's Encounter Plan if you would rather not fight.</div>${_stNote}${orderChanceNote(c, "Steal", ph)}`;
		}
		case "Search Feature":
		case "Search Lair": {
			const loc = predictedLocation(c.id, ph);
			const pd = (loc ? provOrderData[String(loc.id)] : null) ?? provOrderData[String(c.locationId)] ?? null;
			const _provId = loc ? loc.id : c.locationId;
			const _lairSel = target !== "" && target != null ? inWords(target) : defaultLairTarget(c, ph, _provId, pd?.features ?? []);
			const feats = (pd?.features ?? []).filter((f) => !f.ritualSite).map((f) => {
				const diff = f.ritualSite ? "Ritual Site" : f.monsterPower ?? "";
				const _g = f.ritualSite ? "" : [f.monster, f.monsterCat ? f.monsterCat.toLowerCase() : ""].filter(Boolean).join(", ");
				return kcHtml`<option value="${f.idx}" ${_lairSel === String(f.idx) ? "selected" : ""}>${f.name}${diff ? ` (${diff})` : ""}${_g ? ` — ${_g}` : ""}</option>`;
			});
			return feats.length ? kcHtml`<select id="po-target-${c.id}-${ph}">${feats}</select>` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No known lairs in current province" disabled>`;
		}
		case "Hunting Rumours": {
			const loc = predictedLocation(c.id, ph);
			const feats = (((loc ? provOrderData[String(loc.id)] : null) ?? provOrderData[String(c.locationId)] ?? null)?.features ?? []).filter((f) => !f.ritualSite && f.monster);
			if (!feats.length) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No known lairs in ${loc ? loc.name : "this province"} to ask about — explore, or move to a province with a known lair" disabled>`;
			const chosen = new Set(inWords(itOrElse(target, "")).split(",").map((t) => t.trim()).filter(Boolean));
			const gold = report.kingdom?.gold ?? null;
			const rows = feats.map((f) => {
				const price = (theRumoursPrices[String(f.monsterPower)] ?? 0) || 1;
				const kind = [f.monster, f.monsterCat ? f.monsterCat.toLowerCase() : ""].filter(Boolean).join(", ");
				return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:.78rem;cursor:pointer"><input type="checkbox" value="${f.idx}" ${chosen.has(String(f.idx)) ? "checked" : ""} onchange="updateRumourTarget(${kcArg(String(c.id))},${kcArg(ph)})"> <span>${f.name} <span style="color:var(--stone)">(${(f.monsterPower ?? "") || "?"})</span> — ${kind} — <strong>${price}g</strong></span></label>`;
			});
			const total = [...chosen].reduce((s, ix) => {
				const f = feats.find((x) => String(x.idx) === ix);
				return s + (f ? (theRumoursPrices[String(f.monsterPower)] ?? 0) || 1 : 0);
			}, 0);
			return kcHtml`<div id="po-rumour-wrap-${c.id}-${ph}" style="background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px 6px">${rows}
        <div id="po-rumour-total-${c.id}-${ph}" style="font-size:.72rem;color:var(--stone);margin-top:3px">Cost of the ticked lairs: <strong>${total}g</strong>${gold != null ? ` (treasury ${String(gold)}g)` : ""} — paid per lair, in the order listed, until the purse runs dry.</div>
        <div style="font-size:.72rem;color:var(--stone);margin-top:3px">For every lair paid for, ${c.name} learns all three: the guardian's <strong>weakness</strong> (marked on your Known Lairs for good), its <strong>hoard</strong> (exact gold and the magic that lies there), and <strong>your own odds</strong> of defeating it as you stand today — told as one of five bands, from no chance to almost certain.</div>
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${[...chosen].join(",")}"></div>`;
		}
		case "Equip Items": {
			const held = predictedItems(c.id, ph).filter((it) => Boolean(it && itemSlot(it) && itemUsableBy(it, c)));
			if (held.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${skillsUnseenP(c) ? `What ${String(c.name)} carries is not yours to see — they wear and wield their own gear as they see fit` : "Nothing to wear or wield (no weapon, armour, shield, cloak, helm, ring, amulet or combat items)"}" disabled>`;
			const chosen = theWordsToSplit(itOrElse(target, "")).split(",").map((t) => t.trim()).filter(Boolean);
			const rows = ITEM_SLOT_ORDER_P.map((sl) => {
				const opts = held.filter((it) => itemSlot(it) === sl);
				if (opts.length === 0) return "";
				const cap = theSlotsCaps[sl] ?? 0;
				const pre = chosen.length ? chosen.filter((n) => opts.some((o) => o.name === n)) : opts.filter((o) => o.equipped !== false).map((o) => o.name);
				const sels = Array.from({ length: cap }, (_, k) => kcHtml`<select data-slot="${sl}" onchange="updateEquipTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="font-size:.75rem;flex:1"><option value="">— none —</option>${opts.map((o) => kcHtml`<option value="${o.name}" ${pre[k] === o.name ? "selected" : ""}>${o.name}${isLegendaryItem(o) ? "✨ " : ""}</option>`)}</select>`);
				return kcHtml`<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:'Cinzel',serif;font-size:.68rem;color:var(--stone);min-width:110px">${theSlotsLabels[sl]}</span>${sels}</div>`;
			});
			const init = chosen.length ? chosen : held.filter((o) => o.equipped !== false).map((o) => o.name);
			return kcHtml`<div id="po-equip-wrap-${c.id}-${ph}" style="background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px 6px">${rows}
        <div style="font-size:.68rem;color:#2f281c;margin-top:3px">Only equipped items in these slots give their bonus; everything else you carry is always active. Equipped items can still be sent to other characters.</div>
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${init.join(",")}"></div>`;
		}
		case "Use Item": {
			const ACTIVE_ITEM_STATS = /* @__PURE__ */ new Set(["massPromote", "castSpell"]);
			const active = predictedItems(c.id, ph).filter((it) => Boolean(it?.effect && ACTIVE_ITEM_STATS.has(it.effect.stat) && !it._spent));
			if (active.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${skillsUnseenP(c) ? `Whatever ${String(c.name)} carries is hidden from you — you cannot order the use of an item you cannot see` : "No usable (active) items — most items are passive"}" disabled>`;
			const opts = active.map((it) => kcHtml`<option value="${it.id}" ${isTheSavedChoice(target, it.id) ? "selected" : ""}>${isLegendaryItem(it) ? "✨ Legendary — " : String(theTiersNames[String((it.tier ?? 0) || 1)]) + " — "}${it.name} — ${it.desc}</option>`);
			const selIt = active.find((it) => String(it.id) === String(target)) ?? active[0];
			const theItemsSpell = String(selIt?.effect?.spell);
			const sec = selIt?.effect?.stat === "castSpell" ? kcHtml`${castChanceNote(c, theItemsSpell, { itemCast: true })}${spellSecondaryHtml(report, c, ph, theItemsSpell, extra)}` : "";
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="onSpellChange(${kcArg(String(c.id))},${kcArg(ph)},this.value)">${opts}</select>${sec}`;
		}
		case "Consecrate": {
			if (!aRealmOfThisCreedMayGiveTheAlignmentOrder(theAlignmentOrdersRow("Consecrate"), report.kingdom?.alignment)) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only Divine realms may consecrate" disabled>`;
			if (!aHeroMayGiveTheAlignmentOrderAsKingOrNot(theAlignmentOrdersRow("Consecrate"), c.isKing)) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="King only" disabled>`;
			const loc = predictedLocation(c.id, ph);
			const wmP = report.worldMeta?.provinces ?? [];
			const curP = loc ? wmP.find((p) => p.id === loc.id) : null;
			const ownedHere = curP?.tier === "owned";
			const homeId = report.kingdom?.homeProvinceId ?? wmP.find((p) => p.tier === "owned" && p.isHomeCapitalOfOwner)?.id ?? null;
			const consecIds = wmP.filter((p) => p.consecrated && p.tier === "owned").map((p) => p.id);
			const nbrs = theNumbersAmong(curP?.neighbors ?? []);
			const theAnswer = loc ? whyAKingMayNotConsecrateAProvince({
				theProvinceId: theIdOrNoProvince(loc.id),
				itIsHisRealms: ownedHere,
				theHomeMarches: () => ({
					theHomeId: homeId,
					theProvincesBesideIt: theNumbersAmong((homeId != null ? wmP.find((p) => p.id === homeId)?.neighbors : void 0) ?? [])
				}),
				theConsecrated: () => consecIds,
				theProvincesBesideIt: () => nbrs,
				theConsecrationsHeMayHold: () => report.kingdom?.theConsecrationsItsKingMayHold ?? rawSkillLvl(c, "white")
			}) : null;
			const limit = theAnswer && "theLimit" in theAnswer ? theAnswer.theLimit : 0;
			let warn = "";
			if (!loc || !theAnswer) warn = "Province unknown this phase.";
			else if (theAnswer.refused === "it is not a province of his realm") warn = `${String(loc.name)} is not yours this phase — you may only consecrate land you hold.`;
			else if (theAnswer.refused === "it lies in the home marches") warn = loc.id === homeId ? `${String(loc.name)} is your home province — already anointed at the coronation. Carry the light outward.` : `${String(loc.name)} borders your home province — the crown's hearth already shelters it. Consecrate ground beyond the home marches.`;
			else if (theAnswer.refused === "it is consecrated already") warn = `${String(loc.name)} is already consecrated.`;
			else if (theAnswer.refused === "a consecrated province lies beside it") warn = `${String(loc.name)} borders one of your consecrated provinces — two may not lie side by side. Choose ground set apart.`;
			else if (theAnswer.refused === "he knows no White") warn = `Consecration flows from the White arts — learn White magic before you can sanctify ground.`;
			else if (theAnswer.refused === "he holds as many as he may") warn = `You already hold ${String(consecIds.length)}/${String(limit)} consecrated province${limit !== 1 ? "s" : ""} (the most your king may hold). One must be lost or captured first, or raise White to hold more.`;
			const okMsg = `Consecrates ${loc ? String(loc.name) : "current province"} — holy ground (${String(consecIds.length)}/${String(limit)} held).`;
			return kcHtml`${warn ? kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="⚠ ${warn}" readonly style="border-color:var(--crimson);color:var(--crimson)">` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${okMsg}" readonly>`}
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">Sanctifies the province ${c.name} stands in: +50% tax, defenders twice as likely to fight fanatically, Undead/Evil invaders −15%. Your fallen characters can ONLY be restored on consecrated ground — they rise in the nearest consecrated province, which then loses its consecration. Rules: it must be a province you own; <strong>not</strong> your home province or any province next to it; and <strong>no two consecrated provinces may be adjacent</strong>. You may hold up to your king's trained <strong>White skill level</strong> at once (one more with Holy Sites, from White 3); a consecrated province that is captured loses its consecration at once and frees a slot (an Undead conqueror's units each gain an experience level for the sacrilege; an Evil conqueror's have a 50% chance; other realms gain nothing).</div>`;
		}
		case "Call to Arms": {
			if (!aRealmOfThisCreedMayGiveTheAlignmentOrder(theAlignmentOrdersRow("Call to Arms"), report.kingdom?.alignment)) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only Good realms may call the folk to arms" disabled>`;
			if (!aHeroMayGiveTheAlignmentOrderAsKingOrNot(theAlignmentOrdersRow("Call to Arms"), c.isKing)) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only the KING's voice carries the Call" disabled>`;
			const theGrade = theRowsNumber(theAlignmentOrdersRow("Call to Arms"), "theGradeMustered");
			const human = (report.ownedProvinces ?? []).filter((p) => p.terrain !== "sea" && !(p.race ?? "").startsWith("Primal"));
			if (!human.length) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No owned humanoid provinces to raise" disabled>`;
			const ctaOpts = human.map((p) => kcHtml`<option value="${p.id}" ${isTheSavedChoice(target, p.id) ? "selected" : ""}>${p.name} — raises a ${theGrade} ${theCompanyACallToArmsMusters(p).type}</option>`);
			return kcHtml`<select id="po-target-${c.id}-${ph}">${ctaOpts}</select>
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">Free ${theGrade} garrison unit of the province's native type. The king need not be present — the province just has to be yours when the order resolves. Once per turn.</div>`;
		}
		case "Broker": {
			if (!aRealmOfThisCreedMayGiveTheAlignmentOrder(theAlignmentOrdersRow("Broker"), report.kingdom?.alignment)) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only Neutral realms keep brokers" disabled>`;
			if (!aHeroMayGiveTheAlignmentOrderAsKingOrNot(theAlignmentOrdersRow("Broker"), c.isKing)) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only the KING commands the brokers" disabled>`;
			const thePriceOfWord = theRowsNumber(theAlignmentOrdersRow("Broker"), "thePriceOfWordFromAProvince");
			const hireOpts = Object.values(provOrderData).flatMap((pd) => thereOrTheTypeError(pd, "'availableHeroes'").availableHeroes ?? []).map((h) => {
				const w = heroHireWageOfP(h, report);
				if (w == null) return "";
				return kcHtml`<option value="hire:${h.id}" ${target === "hire:" + String(h.id) ? "selected" : ""}>🤝 Hire remotely: ${h.name} (${h.race}/${h.alignment}) in ${h.locationName} — ${heroFameTextP(h)} — ${w}g/turn</option>`;
			}).filter(Boolean);
			const spyOpts = (report.worldMeta?.provinces ?? []).filter((p) => p.name && p.terrain).map((p) => kcHtml`<option value="spy:${p.id}" ${target === "spy:" + String(p.id) ? "selected" : ""}>🕵 Buy word from ${p.name} (${thePriceOfWord}g — full Spy result)</option>`);
			if (!hireOpts.length && !spyOpts.length) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Your brokers have nothing within reach" disabled>`;
			const _bPh = kcHtml`<option value="" ${typeof target === "string" && (target.startsWith("hire:") || target.startsWith("spy:")) ? "" : "selected"}>— choose what the brokers are to buy —</option>`;
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="syncHiredHeroCard(${kcArg(String(c.id))},${kcArg(ph)})">${_bPh}${hireOpts}${spyOpts}</select>
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">Money moves what armies cannot: hire any wandering hero the realm can see (they stay where they are and act next phase), or buy a guaranteed Spy report on any province the realm has seen — ${thePriceOfWord}g.</div>`;
		}
		case "Harvest the Field": {
			if (!aRealmOfThisCreedMayGiveTheAlignmentOrder(theAlignmentOrdersRow("Harvest the Field"), report.kingdom?.alignment)) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only Undead realms keep corpse-carters" disabled>`;
			const loc = predictedLocation(c.id, ph);
			const theCartersPrice = report.orderPrices?.harvest ?? theRowsNumber(theAlignmentOrdersRow("Harvest the Field"), "thePrice");
			return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Harvests the graves of ${loc ? loc.name : "current province"}" readonly>
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">No magic required: ${theCartersPrice}g raises the most experienced battlefield grave in the province ${c.name} stands in as a Skeletal unit (keeps its type and quality, a grade higher while your realm holds its Wonder; 1g upkeep). Needs battlefield dead present — fields where armies have fallen.</div>`;
		}
		case "Perform Rite": {
			if (!aRealmOfThisCreedMayGiveTheAlignmentOrder(theAlignmentOrdersRow("Perform Rite"), (report.kingdom?.alignment ?? "") || "Neutral")) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only Pagan realms keep the old rites" disabled>`;
			const loc = predictedLocation(c.id, ph);
			const pd = loc ? report.provinceOrderData?.[String(loc.id)] : null;
			const site = (pd?.features ?? []).find((f) => f.ritualSite);
			if (!site) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${loc ? `No known ritual site in ${String(loc.name)} — Explore to find standing stones` : "Province unknown"}" disabled>`;
			const canHunt = !!pd?.wildHuntType;
			const theRitesRow = theAlignmentOrdersRow("Perform Rite");
			const huntCost = pd?.wildHuntCost;
			const huntTurns = report.kingdom?.theTurnsAWildHuntServesBeyondThisOne ?? theRowsNumber(theRitesRow, "theWildHuntsTurnsMore");
			const huntUntil = huntTurns === 1 ? "NEXT turn" : huntTurns === 2 ? "the turn after next" : `${String(huntTurns)} turns after this one`;
			const _boArmy = projectedLedArmies(c.id, ph);
			const _boSaved = {
				S: /* @__PURE__ */ new Set(),
				E: /* @__PURE__ */ new Set()
			};
			{
				const m = /S:([0-9,]*)\|E:([0-9,]*)/.exec(inWords(itOrElse(extra, "")));
				if (m) {
					(m[1] ?? "").split(",").filter(Boolean).forEach((x) => _boSaved.S.add(+x));
					(m[2] ?? "").split(",").filter(Boolean).forEach((x) => _boSaved.E.add(+x));
				}
			}
			const _boLocked = (i) => !aBloodOfferingMayTakeTheCompany(thereOrTheTypeError(_boArmy[i], "'temporary'"));
			const _boMarked = (side) => _boArmy.map((a, i) => i).filter((i) => !_boLocked(i) && _boSaved[side].has(i));
			const _boHint = theBloodOfferingsHint(_boArmy, _boMarked("S"), _boMarked("E"));
			const _boRows = _boArmy.length ? _boArmy.map((a, i) => _boLocked(i) ? kcHtml`<div style="display:flex;align-items:center;gap:6px;font-size:.72rem;padding:1px 0;opacity:.6">
            <span style="flex:1">${unitEmoji(a.type)} ${armyLabel(a)}</span>
            <select class="bo-sel" data-cid="${c.id}" data-ph="${ph}" data-idx="${i}" disabled title="The old gods take no ${a.wildHunt ? "beast bound by the Wild Hunt" : a.skeletal ? "risen dead" : "summoned or charmed company"}" style="font-size:.7rem">
              <option value="K" selected>Keep (the rite can't take it)</option>
            </select></div>` : kcHtml`<div style="display:flex;align-items:center;gap:6px;font-size:.72rem;padding:1px 0">
            <span style="flex:1">${unitEmoji(a.type)} ${armyLabel(a)}</span>
            <select class="bo-sel" data-cid="${c.id}" data-ph="${ph}" data-idx="${i}" onchange="updateBloodOffering(${kcArg(String(c.id))},${kcArg(ph)})" style="font-size:.7rem">
              <option value="K" ${!_boSaved.S.has(i) && !_boSaved.E.has(i) ? "selected" : ""}>Keep</option>
              <option value="S" ${_boSaved.S.has(i) ? "selected" : ""}>Sacrifice ✝</option>
              <option value="E" ${_boSaved.E.has(i) ? "selected" : ""}>Empower +${theRowsNumber(theRitesRow, "theBloodOfferingsGrades")}</option>
            </select></div>`) : kcHtml`<div style="font-size:.72rem;color:var(--stone)">This character leads no army units to offer.</div>`;
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="updateBloodOffering(${kcArg(String(c.id))},${kcArg(ph)})">
        ${canHunt ? kcHtml`<option value="Wild Hunt" ${target === "Wild Hunt" ? "selected" : ""}>\u{1F525} Rite of the Wild Hunt — bind ${theRowsNumber(theRitesRow, "theWildHuntsBeasts")} VETERAN ${pd.wildHuntType} (${huntCost}g — the price of one, no wages, serve until end of ${huntUntil})</option>` : ""}
        <option value="Blood Offering" ${target === "Blood Offering" || !target ? "selected" : ""}>\u{1FA78} Blood Offering — sacrifice units to empower others (+${theRowsNumber(theRitesRow, "theBloodOfferingsGrades")} tiers each)</option>
      </select>
      <input id="po-extra-${c.id}-${ph}" type="hidden" value="${itOrElse(extra, "")}">
      <div id="bo-block-${c.id}-${ph}" style="margin-top:5px;border:1px solid var(--parchment-dark);border-radius:3px;padding:6px;background:#fdf5e0">
        <div style="font-size:.7rem;font-weight:600;color:#7a4a00;margin-bottom:3px">Blood Offering — mark units to Sacrifice, and an equal number to Empower (+${theRowsNumber(theRitesRow, "theBloodOfferingsGrades")} quality tiers each, max Elite):</div>
        ${_boRows}
        ${_boArmy.some((a, i) => _boLocked(i)) ? kcHtml`<div style="font-size:.68rem;color:var(--stone);margin-top:2px">Bound beasts, summoned or charmed companies and risen dead can be neither sacrificed nor empowered.</div>` : ""}
        <div id="bo-hint-${c.id}-${ph}" style="font-size:.7rem;color:${_boHint.colour};margin-top:3px">${_boHint.words}</div>
      </div>
      <div style="font-size:.68rem;color:#7a4a00;margin-top:3px">At the ${site.name}. The old gods always take payment.</div>
      <div style="font-size:.68rem;color:var(--stone);margin-top:2px">Only one rite per province per turn — if anyone (your own characters included) performs a rite here earlier in the turn, this one fails.</div>`;
		}
		case "Cast Spell": {
			if (skillsUnseenP(c)) {
				const _hsPhase = theActionSpellsNoMasteryLevelGates();
				const _hsList = Object.entries(SPELLS_BY_SCHOOL).flatMap(([school, list]) => list.filter((sp) => _hsPhase.has(sp) && !theLevelsTheMasterySpellsNeed[sp]).map((sp) => [sp, school]));
				const _hsSel = (target ? _hsList.find(([sp]) => sp === target)?.[0] : void 0) ?? _hsList[0]?.[0] ?? "";
				return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="onSpellChange(${kcArg(String(c.id))},${kcArg(ph)},this.value)">${_hsList.map(([sp, school]) => kcHtml`<option value="${sp}" ${sp === _hsSel ? "selected" : ""}>${sp} (${theSkillsLabels[school]})</option>`)}</select>
          <div style="font-size:.7rem;color:var(--stone)">${c._unknownSkills ? `${String(c.name)}'s training is unknown until they have joined — every base spell is offered; one from a school they have not learned simply fails.` : `You cannot see this hero's skills — a spell from a school they have not learned simply fails.`}</div>${spellSecondaryHtml(report, c, ph, _hsSel, _hsSel === target ? extra : "")}`;
			}
			const { practisingSchools, _castsAllowed, schoolCastCount, _spellRows } = theSpellsTheCastSpellFieldOffersAHeroInAPhase(c, ph, report);
			const _castable = _spellRows.filter((r) => !r.atLimit);
			const _selSpell = (target ? _castable.find((r) => r.spell === target)?.spell : void 0) ?? ((_castable[0]?.spell ?? "") || (_spellRows[0]?.spell ?? ""));
			const spells = _spellRows.map((r) => kcHtml`<option value="${r.spell}" ${r.spell === _selSpell ? "selected" : ""} ${r.atLimit ? "disabled" : ""} style="${r.atLimit ? "color:#aaa;" : ""}">  ${r.label}</option>`);
			const knownOrPractisingSchools = Object.entries(SPELLS_BY_SCHOOL).filter(([school]) => effMagicLvl(c, school) >= 1 || practisingSchools.has(school));
			const allAtLimit = knownOrPractisingSchools.length > 0 && knownOrPractisingSchools.every(([school]) => (schoolCastCount[school] ?? 0) >= _castsAllowed(school)) && _spellRows.every((r) => r.atLimit);
			if (!spells.length) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No spells known — need a magic skill ≥ 1, or practise one earlier this turn" disabled>`;
			if (allAtLimit) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="All magic school casting limits reached for this turn" disabled>`;
			const selSpell = _selSpell;
			const secondaryHtml = spellSecondaryHtml(report, c, ph, selSpell, selSpell === target ? extra : "");
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="onSpellChange(${kcArg(String(c.id))},${kcArg(ph)},this.value)">${spells}</select>${castChanceNote(c, selSpell)}${secondaryHtml}`;
		}
		case "Practice Skill": {
			let defaultSk = target;
			if (defaultSk === "") defaultSk = practiceCompanionSkill(c, ph) || practiceOwnEarlierSkill(c, ph) || "";
			const skillOpts = ALL_SKILLS.map((sk) => kcHtml`<option value="${sk}" ${defaultSk === sk ? "selected" : ""}>${theSkillsLabels[sk]}${skillsUnseenP(c) ? "" : ` (Lv ${String(Number(c.skills?.[sk]) || 0)})`}</option>`);
			if (skillsUnseenP(c)) return kcHtml`<select id="po-target-${c.id}-${ph}">${skillOpts}</select><div style="font-size:.7rem;color:var(--stone)">${c._unknownSkills ? `${String(c.name)}'s skill levels are not known until they have joined.` : `A charmed hero's skill levels are hidden from you.`}</div>`;
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="rebuildTargetWrap(${kcArg(String(c.id))},${kcArg(ph)})">${skillOpts}</select>${orderChanceNote(c, "Practice Skill", ph)}`;
		}
		case "Research": {
			const sg = Math.min(5, effSkillP(c, "sage"));
			const per = 5;
			const neutral = report.kingdom?.alignment === "Neutral" ? sg * 5 : 0;
			const chance = sg * per + neutral;
			const cats = report.researchCategories ?? [];
			let _rsel = target;
			if (_rsel === "") _rsel = defaultResearchField(c, ph);
			if (_rsel && cats.some((k) => k.name === _rsel && k.known >= k.total)) _rsel = "";
			const catOpts = [kcHtml`<option value="" ${!_rsel ? "selected" : ""}>Any field of study</option>`, ...cats.map((k) => {
				const done = k.known >= k.total;
				return kcHtml`<option value="${k.name}" ${done ? "disabled" : ""} ${_rsel === k.name ? "selected" : ""}>${k.name} (${k.known}/${k.total} found${done ? " — all discoveries in this field have been found" : ""})</option>`;
			})];
			return kcHtml`<select id="po-target-${c.id}-${ph}">${catOpts}</select>
        <div style="font-size:.72rem;color:var(--forest)">📜 ${skillsUnseenP(c) ? `Rolls for a Sage discovery: 5% per Sage level${neutral ? " (doubled for Neutral scholars)" : ""} — ${unseenSuffixP(c)}; without Sage training the search fails.` : kcHtml`Rolls for a Sage discovery: about <strong>${chance}%</strong> (Sage ${sg}${neutral ? ", Neutral scholars" : ""}).`}</div>
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">Discoveries are permanent realm-wide upgrades. A successful roll turns up <strong>two</strong> discoveries in the field; in next turn's orders you keep one and the other is forgotten for good. Research trains Sage only when it makes a discovery — use Practice Skill to train it reliably. A scholar sometimes turns up a find from a field you never chose; when that happens it is the discovery you make this season <em>instead</em> of an ordinary one, not as well as it.</div>${orderChanceNote(c, "Research", ph)}`;
		}
		case "Recruit Armies": {
			const loc = predictedLocation(c.id, ph);
			const pd = loc ? provOrderData[String(loc.id)] : null;
			const mercsAvail = (report.mercIntel ?? []).filter((m) => m.locationId === loc?.id);
			const conditionalRecruit = !!(pd && !pd.canRecruit && (pd.armyTypes ?? []).length > 0 && loc);
			const savedSelsM = theWordsToSplit(itOrElse(target, "")).split(",").filter(Boolean);
			const mercRows = mercsAvail.map((m) => {
				const val = `merc:${String(m.id)}`;
				return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer;background:#fbeeee;border-radius:2px">
          <input type="checkbox" value="${val}" ${savedSelsM.includes(val) ? "checked" : ""} onchange="updateRecruitTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="width:auto;margin:0">
          \u2694 ${(m.unitName ?? "") || m.type} (${m.quality} ${m.type}, ${m.cost ?? "?"}g) <span style="color:#701010;font-size:.72rem">[mercenary]</span>
        </label>`;
			});
			const _destSaved = theWordsToSplit(itOrElse(target, "")).split(",").map((t) => t.trim()).find((t) => t.startsWith("to:")) ?? "to:self";
			const _destAllies = orderTargetCharsP(report, ph).filter((x) => x.id !== c.id && (predictedLocation(x.id, ph)?.id ?? x.locationId) === (loc ? loc.id : loc));
			const _destRow = (allowGarrison) => kcHtml`<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;font-size:.75rem">
          <span style="color:var(--stone)">Muster to:</span>
          <select class="po-recruit-dest" onchange="updateRecruitTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="flex:1;font-size:.75rem;padding:1px 3px">
            <option value="to:self" ${_destSaved === "to:self" ? "selected" : ""}>${c.name} (this character)</option>
            ${_destAllies.map((x) => kcHtml`<option value="to:${x.id}" ${_destSaved === "to:" + String(x.id) ? "selected" : ""}>${x.name} (also here this phase${preOrderTagP(x)})</option>`)}
            ${allowGarrison ? kcHtml`<option value="to:garrison" ${_destSaved === "to:garrison" ? "selected" : ""}>Province garrison (defends ${loc ? loc.name : "the province"})</option>` : ""}
          </select>
        </div>${allowGarrison ? kcHtml`<div style="font-size:.68rem;color:var(--stone);margin:-2px 0 4px;line-height:1.35">Garrison units always muster straight into the province garrison, whoever is named above.</div>` : ""}`;
			const mercWrap = (inner) => kcHtml`<div id="po-target-wrap-inner-${c.id}-${ph}" style="max-height:160px;overflow-y:auto;background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px">
        ${_destRow(false)}
        ${inner}
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${itOrElse(target, "")}">
      </div>`;
			if (!pd || !pd.canRecruit && !conditionalRecruit) {
				if (mercRows.length) return mercWrap(kcHtml`<div style="font-size:.68rem;color:#6a3030;margin-bottom:4px;line-height:1.35">Mercenaries can be hired anywhere. Native troops need control of the province.</div>${mercRows}`);
				const why = !pd ? "Province unknown" : (pd.armyTypes ?? []).length === 0 ? `${String(thereOrTheTypeError(loc, "'name'").name)} is not your territory — cannot recruit here` : `${String(thereOrTheTypeError(loc, "'name'").name)} is not yours yet — move in with an army in an earlier phase to recruit here if you take control`;
				return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${why}" disabled>`;
			}
			const alreadyRecruited = getAlreadyRecruitedThisTurn(c.id, ph);
			const theLoc = thereOrTheTypeError(loc, "'id'");
			if (!(pd.armyTypes ?? []).some((at) => at.maxPerTurn - (alreadyRecruited[`${String(theLoc.id)}:${at.type}`] ?? 0) > 0)) {
				if (mercRows.length) return mercWrap(mercRows);
				const why = (pd.armyTypes ?? []).length === 0 ? `No native recruitable armies in ${String(pd.name)}` : `Already recruited the maximum in ${String(pd.name)} this turn`;
				return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${why}" disabled>`;
			}
			const savedSels = theWordsToSplit(itOrElse(target, "")).split(",").filter(Boolean);
			return kcHtml`<div id="po-target-wrap-inner-${c.id}-${ph}" style="max-height:160px;overflow-y:auto;background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px">
        ${conditionalRecruit ? kcHtml`<div style="font-size:.68rem;color:#6a3030;background:#f7ece0;border-radius:2px;padding:3px 5px;margin-bottom:4px;line-height:1.35">⚑ ${theLoc.name} is not yours yet — plan freely. This recruit only takes effect if you <strong>control the province</strong> when the order resolves (e.g. this character seizes it in an earlier phase); otherwise it is skipped.</div>` : ""}
        ${""}
        ${_destRow(true)}
        ${mercRows}
        ${(pd.armyTypes ?? []).flatMap((at) => {
				const done = alreadyRecruited[`${String(theLoc.id)}:${at.type}`] ?? 0;
				const remaining = at.maxPerTurn - done;
				if (remaining <= 0) return [];
				const costEach = (at.cost ?? 0) || 2;
				const _savedOfType = savedSels.filter((v) => (v.split("|")[0] ?? "").trim() === at.type).length;
				return Array.from({ length: remaining }, (_, i) => {
					return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer">
              <input type="checkbox" value="${`${at.type}|1`}" ${_savedOfType > i ? "checked" : ""} onchange="updateRecruitTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="width:auto;margin:0">
              1× ${at.type} (${costEach}g)${CREATURE_ARMIES.has(at.type) ? kcHtml` <span style="color:#1d5a1d;font-size:.72rem">[Creature]</span>` : MONSTER_ARMIES.has(at.type) ? kcHtml` <span style="color:#701010;font-size:.72rem">[Monster]</span>` : ""}
            </label>`;
				});
			})}
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${itOrElse(target, "")}">
      </div>`;
		}
		case "Hire Hero": {
			const loc = predictedLocation(c.id, ph);
			const heroes = (loc ? provOrderData[String(loc.id)] : null)?.availableHeroes ?? [];
			if (heroes.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${loc ? `No wandering heroes in ${String(loc.name)}` : "No heroes available"}" disabled>`;
			const opts = heroes.map((h) => {
				const topSkill = heroFameTextP(h);
				const kAlign = (report.kingdom?.alignment ?? "") || "Neutral";
				const wage = heroHireWageOfP(h, report);
				if (wage == null) return kcHtml`<option value="" disabled>${h.name} (${h.race}/${h.alignment}) — will NOT serve a ${kAlign} crown</option>`;
				const d = alignDistP(kAlign, String(h.alignment));
				const _base = heroHireWage(kAlign, String(h.alignment)), _prem = _base != null && wage > _base ? wage - _base : 0;
				const costNote = (d <= 1 ? "(kindred outlook" : `(${String(d)} steps from ${kAlign}`) + (_prem ? `, +${String(_prem)}g for proven skill)` : d <= 1 ? " — base rate)" : ")");
				return kcHtml`<option value="${h.id}" ${isTheSavedChoice(target, h.id) ? "selected" : ""}>${h.name} (${h.race}/${h.alignment}) — best: ${topSkill} — ${wage}g/turn ${costNote}</option>`;
			});
			const _ph = kcHtml`<option value="" ${heroes.some((h) => String(h.id) === String(target) && heroHireWageOfP(h, report) != null) ? "" : "selected"}>— choose a hero to hire —</option>`;
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="syncHiredHeroCard(${kcArg(String(c.id))},${kcArg(ph)})">${_ph}${opts}</select>`;
		}
		case "Send Item":
		case "Give Item": {
			const items = predictedItems(c.id, ph);
			const startNames = new Set((c.items ?? []).map((it) => it ? it.name : it));
			if (items.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${skillsUnseenP(c) ? `What ${String(c.name)} carries is not known to you until they have joined — you can only send on something you handed them yourself this turn` : "No items to give (none held, or all given away earlier this turn)"}" disabled>`;
			const _giByName = skillsUnseenP(c);
			const _giSaved = theWordsToSplit(itOrElse(target, "")).split(",").filter(Boolean);
			const _giAll = !_giByName && _giSaved.includes("all");
			const _giBoxes = items.map((it, i) => {
				const _bound = anItemIsTheMithrilSuitGrantedToItsWearer(it);
				const theItem = thereOrTheTypeError(it, "'name'");
				const _val = _giByName ? theItem.name || "" : String(i);
				const chk = !_bound && (_giAll || _giSaved.includes(_val)) ? "checked" : "";
				return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:${_bound ? "not-allowed" : "pointer"};${_bound ? "opacity:.55" : ""}">
          <input type="checkbox" value="${_val}" ${chk} ${_bound ? "disabled" : ""} onchange="updateLeaveTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="width:auto;margin:0">
          🔮 ${theItem.name}${itemTierTagP(theItem)}${_bound ? kcHtml` <span style="color:var(--stone)">— bound to its wearer, cannot be sent</span>` : startNames.has(theItem.name) ? "" : " (received earlier this turn)"}
        </label>`;
			});
			const _giWrap = kcHtml`<div style="background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px;max-height:120px;overflow-y:auto">
        ${_giByName ? kcHtml`<div style="font-size:.68rem;color:var(--stone);padding:2px 4px;border-bottom:1px solid var(--parchment-dark);margin-bottom:2px">Only what you handed ${c.name} this turn is listed — the rest of their pack is not yours to see, or to send on.</div>` : kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer;border-bottom:1px solid var(--parchment-dark);margin-bottom:2px">
          <input type="checkbox" value="all" id="po-leave-all-${c.id}-${ph}" ${_giAll ? "checked" : ""} onchange="leaveToggleAll(${kcArg(String(c.id))},${kcArg(ph)},this.checked)" style="width:auto;margin:0">
          <strong>All items (${items.length})</strong>
        </label>`}
        ${_giBoxes}
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${itOrElse(target, "")}">
      </div>`;
			const loc4 = predictedLocation(c.id, ph);
			const chars = orderTargetCharsP(report, ph).filter((x) => x.id !== c.id && x.player === c.player && !x._hiddenSkills);
			if (chars.length === 0) return kcHtml`${_giWrap}
        <input id="po-extra-${c.id}-${ph}" type="text" value="" placeholder="No other characters to send to" disabled>`;
			const recipOpts = chars.map((x) => {
				const _xl = predictedLocation(x.id, ph), _xn = (_xl?.name ?? "") || "unknown province";
				const _where = _xl?.id === loc4?.id ? `here in ${_xn} — at once` : `in ${_xn} — arrives end of turn`;
				return kcHtml`<option value="${x.id}" ${isTheSavedChoice(extra, x.id) ? "selected" : ""}>${x.name} (${_where}${preOrderTagP(x)})</option>`;
			});
			return kcHtml`${_giWrap}
        <select id="po-extra-${c.id}-${ph}" style="margin-top:4px">${recipOpts}</select>`;
		}
		case "Leave/Transfer Army": {
			const baseArmies = projectedLedArmies(c.id, ph);
			const savedTgts = theWordsToSplit(itOrElse(target, "")).split(",").filter(Boolean);
			const cLoc = predictedLocation(c.id, ph);
			const cLocId = cLoc ? cLoc.id : null;
			const ownedIds = new Set((report.ownedProvinces ?? []).map((p) => p.id));
			const ownsHere = cLocId != null && ownedIds.has(cLocId);
			const canGarrison = cLocId != null;
			const othersHere = orderTargetCharsP(report, ph).filter((x) => {
				if (x.id === c.id) return false;
				const xl = predictedLocation(x.id, ph);
				return xl && cLocId != null && xl.id === cLocId;
			});
			const recipParts = [];
			if (canGarrison) {
				const theName = (thereOrTheTypeError(cLoc, "'name'").name ?? "") || "province";
				recipParts.push(kcHtml`<option value="-1" ${extra === "-1" || !extra ? "selected" : ""}>${ownsHere ? `Garrison in ${theName}` : `Garrison in ${theName} \u2691 (only if you control it when this resolves)`}</option>`);
			}
			othersHere.forEach((x) => recipParts.push(kcHtml`<option value="${x.id}" ${isTheSavedChoice(extra, x.id) ? "selected" : ""}>${x.name}${preOrderTagP(x)}</option>`));
			if (recipParts.length === 0) recipParts.push(kcHtml`<option value="" disabled selected>No valid recipient here — place another of your characters here first</option>`);
			const recipOpts = recipParts;
			const allChk = savedTgts.includes("all") ? "checked" : "";
			if (baseArmies.length === 0) return kcHtml`<div style="background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px">
          <div style="font-size:.68rem;color:#6a3030;margin-bottom:4px;line-height:1.35">No armies to leave right now, but you can still queue <strong>All armies</strong> in case this character gains a force earlier this phase (e.g. Skeletal Armies).</div>
          <label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer">
            <input type="checkbox" value="all" id="po-leave-all-${c.id}-${ph}" ${allChk} onchange="leaveToggleAll(${kcArg(String(c.id))},${kcArg(ph)},this.checked)" style="width:auto;margin:0">
            <strong>All armies</strong>
          </label>
          <input type="hidden" id="po-target-${c.id}-${ph}" value="${itOrElse(target, "")}">
        </div>
        <select id="po-extra-${c.id}-${ph}" style="margin-top:4px" onchange="setTimeout(refreshAllMoveModeNotes,0)">${recipOpts}</select>`;
			const checkboxes = baseArmies.map((a) => {
				const val = (a.unitName ?? "") || a.type;
				return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer">
          <input type="checkbox" value="${val}" ${savedTgts.includes(val) || savedTgts.includes("all") ? "checked" : ""} onchange="updateLeaveTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="width:auto;margin:0">
          ${armyLabel(a)}
        </label>`;
			});
			return kcHtml`<div style="background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px;max-height:120px;overflow-y:auto">
        <label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer;border-bottom:1px solid var(--parchment-dark);margin-bottom:2px">
          <input type="checkbox" value="all" id="po-leave-all-${c.id}-${ph}" ${allChk} onchange="leaveToggleAll(${kcArg(String(c.id))},${kcArg(ph)},this.checked)" style="width:auto;margin:0">
          <strong>All armies</strong>
        </label>
        ${checkboxes}
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${itOrElse(target, "")}">
      </div>
      <select id="po-extra-${c.id}-${ph}" style="margin-top:4px" onchange="setTimeout(refreshAllMoveModeNotes,0)">${recipOpts}</select>`;
		}
		case "Release Hero": {
			if (c.isKing) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="A king cannot release himself" disabled>`;
			const led = projectedLedArmies(c.id, ph);
			const warn = led.length ? kcHtml`<div style="font-size:.72rem;color:#a33;margin-top:2px">⚠ ${c.name} is still leading ${led.length} unit${led.length !== 1 ? "s" : ""} at this phase — the release will be refused unless they are handed off (Leave/Transfer Army) or disbanded in an earlier phase.</div>` : "";
			return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Releases ${c.name} from your service — no wage from next turn" readonly>
        <div style="font-size:.72rem;color:var(--stone);margin-top:2px">${c.name} becomes a wandering hero, keeping their magic items, and cannot be re-hired this turn. Later phases' orders for them are dropped.</div>${warn}`;
		}
		case "Disband Army": {
			const armies = projectedLedArmies(c.id, ph);
			if (armies.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No armies to disband" disabled>`;
			const savedTgts = theWordsToSplit(itOrElse(target, "")).split(",").filter(Boolean);
			const checkboxes = armies.map((a) => {
				const val = (a.unitName ?? "") || a.type;
				return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer">
          <input type="checkbox" value="${val}" ${savedTgts.includes(val) || savedTgts.includes("all") ? "checked" : ""} onchange="updateLeaveTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="width:auto;margin:0">
          ${armyLabel(a)}
        </label>`;
			});
			const allChk = savedTgts.includes("all") ? "checked" : "";
			return kcHtml`<div style="background:#fff0f0;border:1px solid #c84a4a;border-radius:2px;padding:4px">
        <div style="font-size:.72rem;color:#701010;margin-bottom:4px">⚠ Disbanded armies become wandering mercenaries — they may move away or retire (25% chance/turn).</div>
        <label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer;border-bottom:1px solid #f0c0c0;margin-bottom:2px">
          <input type="checkbox" value="all" id="po-leave-all-${c.id}-${ph}" ${allChk} onchange="leaveToggleAll(${kcArg(String(c.id))},${kcArg(ph)},this.checked)" style="width:auto;margin:0">
          <strong>All armies</strong>
        </label>
        ${checkboxes}
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${itOrElse(target, "")}">
      </div>`;
		}
		case "Pick Up Army": {
			const loc2 = predictedLocation(c.id, ph);
			const garrArr = loc2 ? projectedGarrison(loc2.id, ph, true, c.id) : [];
			if (garrArr.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No garrison armies here to pick up (hire mercenaries via Recruit Armies)" disabled>`;
			const savedTgts = theWordsToSplit(itOrElse(target, "")).split(",").filter(Boolean);
			const allSel = savedTgts.includes("all");
			const checkboxes = garrArr.map((a, i) => {
				const val = `g:${String(i)}`;
				return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer">
          <input type="checkbox" value="${val}" ${allSel || savedTgts.includes(val) ? "checked" : ""} onchange="updateLeaveTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="width:auto;margin:0">
          ${armyLabel(a)} — garrison
        </label>`;
			});
			return kcHtml`<div style="background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px;max-height:120px;overflow-y:auto">
        <label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer;border-bottom:1px solid var(--parchment-dark);margin-bottom:2px">
          <input type="checkbox" value="all" id="po-leave-all-${c.id}-${ph}" ${allSel ? "checked" : ""} onchange="leaveToggleAll(${kcArg(String(c.id))},${kcArg(ph)},this.checked)" style="width:auto;margin:0">
          <strong>All garrison armies (${garrArr.length})</strong>
        </label>
        ${checkboxes}
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${itOrElse(target, "")}">
      </div>`;
		}
		default: return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="${itOrElse(target, "")}" placeholder="Details / notes">`;
	}
}
function updateLeaveTarget(charId, ph) {
	const wrap = document.querySelector(`#po-target-${String(charId)}-${String(ph)}`)?.parentElement;
	if (!wrap) return;
	const allChk = document.getElementById(`po-leave-all-${String(charId)}-${String(ph)}`);
	if (allChk instanceof HTMLInputElement) allChk.checked = false;
	const checked = [...wrap.querySelectorAll("input[type=checkbox]:not([value=all]):checked")].filter((cb) => cb instanceof HTMLInputElement).map((cb) => cb.value);
	const hidden = document.getElementById(`po-target-${String(charId)}-${String(ph)}`);
	if (hidden instanceof HTMLInputElement) hidden.value = checked.join(",");
	setTimeout(refreshAllMoveModeNotes, 0);
}
function leaveToggleAll(charId, ph, checked) {
	const wrap = document.querySelector(`#po-target-${String(charId)}-${String(ph)}`)?.parentElement;
	if (!wrap) return;
	wrap.querySelectorAll("input[type=checkbox]:not([value=all])").forEach((cb) => {
		if (cb instanceof HTMLInputElement) cb.checked = false;
	});
	const hidden = document.getElementById(`po-target-${String(charId)}-${String(ph)}`);
	if (hidden instanceof HTMLInputElement) hidden.value = checked ? "all" : "";
	setTimeout(refreshAllMoveModeNotes, 0);
}
function updateRecruitTarget(charId, ph) {
	const wrap = document.getElementById(`po-target-wrap-inner-${String(charId)}-${String(ph)}`);
	if (!wrap) return;
	const checked = [...wrap.querySelectorAll("input[type=checkbox]:checked")].filter((cb) => cb instanceof HTMLInputElement).map((cb) => cb.value);
	const destSel = wrap.querySelector(".po-recruit-dest");
	if (destSel instanceof HTMLSelectElement && destSel.value && destSel.value !== "to:self") checked.push(destSel.value);
	const hidden = document.getElementById(`po-target-${String(charId)}-${String(ph)}`);
	if (hidden instanceof HTMLInputElement) hidden.value = checked.join(",");
	setTimeout(refreshAllMoveModeNotes, 0);
}
// src/ui/player/pre-orders.ts
var ONCE_PER_TURN_ACTIONS = /* @__PURE__ */ new Set([...Object.keys(L79_ORDERS), theNameTheFormWritesOfTheAlignmentOrder("call-to-arms")]);
function refreshOncePerTurnOptions(charId) {
	const taken = /* @__PURE__ */ new Set();
	for (let ph = 0; ph < 5; ph++) {
		const sel = document.getElementById(`po-action-${String(charId)}-${String(ph)}`);
		if (!(sel instanceof HTMLSelectElement)) continue;
		const allOptsHeld = sel.dataset["allOpts"];
		if (allOptsHeld === void 0 || allOptsHeld === "") sel.dataset["allOpts"] = JSON.stringify([...sel.options].map((o) => o.value).filter(Boolean));
		const want = theListParsed(JSON.parse(theWordsHeld(sel.dataset["allOpts"]))).filter((a) => !taken.has(a));
		const have = [...sel.options].map((o) => o.value).filter(Boolean);
		let cur = sel.value;
		let cleared = false;
		if (cur && taken.has(cur)) {
			cleared = cur;
			cur = "";
		}
		if (want.join("|") !== have.join("|")) {
			const firstOption = sel.options[0];
			const blank = firstOption && !firstOption.value ? firstOption.textContent : "— Choose —";
			sel.innerHTML = String(kcHtml`<option value="">${blank}</option>${want.map((a) => kcHtml`<option value="${a}">${a}</option>`)}`);
			sel.value = cur;
		}
		if (cleared) {
			const wrap = document.getElementById(`po-target-wrap-${String(charId)}-${String(ph)}`);
			const ch = (currentReport?.characters ?? []).find((c) => String(c.id) === String(charId));
			if (wrap) try {
				wrap.innerHTML = String(kcHtml`${ch ? buildTargetField(ch, ph, { action: "" }) : ""}<div style="font-size:.72rem;color:#8a2a2a;margin-top:3px">${cleared} can be ordered only once a turn and is already set in an earlier phase \u2014 choose another action here.</div>`);
			} catch {}
		}
		if (ONCE_PER_TURN_ACTIONS.has(sel.value)) taken.add(sel.value);
	}
}
/** Words a select's mark holds (`data-all-opts`, set just before it is read), or the TypeError `JSON.parse` threw for
*  none, when it read `undefined` as words. */
function theWordsHeld(held) {
	if (held === void 0) throw new TypeError("the select holds no list of its options");
	return held;
}
/** A list the page wrote as JSON, as `.filter` read it: anything else throws the TypeError the call threw. */
function theListParsed(parsed) {
	if (!Array.isArray(parsed)) throw new TypeError("the select’s list of its options is not a list");
	return parsed;
}
function refreshAllOncePerTurn() {
	new Set([...document.querySelectorAll("select[id^=\"po-action-\"]")].map((el) => el.id.replace(/^po-action-/, "").replace(/-\d+$/, ""))).forEach((id) => {
		try {
			refreshOncePerTurnOptions(id);
		} catch {}
	});
}
function onActionChange(charId, ph, charIdx) {
	const action = theValueOfThePagesField(`po-action-${String(charId)}-${String(ph)}`);
	const wrap = document.getElementById(`po-target-wrap-${String(charId)}-${String(ph)}`);
	if (!wrap) return;
	const char = theHeroOrTheOneAtHisPlace(charId, charIdx);
	const saved = { action: theActionOrNone(action) };
	wrap.innerHTML = String(buildTargetField(char, ph, saved));
	refreshOncePerTurnOptions(charId);
	refreshLaterCastSpells(charId, ph);
	setTimeout(refreshExploreNotes, 0);
	setTimeout(refreshAllMoveModeNotes, 0);
	setTimeout(() => {
		syncHiredHeroCard(charId, ph);
	}, 100);
	setTimeout(() => {
		syncResurrectCard();
	}, 100);
	setTimeout(() => {
		syncCharmCard(charId, ph);
	}, 100);
}
/** The hero with the id `charId`, else the one at `charIdx` in the report's list, else an empty hero, as
*  `find(…) || list[charIdx] || {}` gave him: the empty hero's id is unread by the field built for him. */
function theHeroOrTheOneAtHisPlace(charId, charIdx) {
	const found = (currentReport?.characters ?? []).find((c) => String(c.id) === String(charId));
	if (found) return found;
	const atHisPlace = (currentReport?.characters ?? [])[charIdx];
	if (atHisPlace) return atHisPlace;
	return theEmptyHero();
}
/** `{}`, the hero the form builds a field for when the report holds none: an object of no fields, its id read as
*  `undefined` as `{}.id` was. */
function theEmptyHero() {
	const none = void 0;
	return Object.defineProperties({ id: "" }, { id: {
		get: () => none,
		enumerable: false
	} });
}
/** An action as the saved order holds it: words, or none where the field held none. */
function theActionOrNone(action) {
	if (action === void 0 || typeof action === "string") return action;
	throw new TypeError("an order’s action is not words");
}
function onMoveEdited(charId, ph) {
	const char = (currentReport?.characters ?? []).find((c) => String(c.id) === String(charId));
	if (!char) return;
	setTimeout(refreshExploreNotes, 0);
	setTimeout(refreshAllMoveModeNotes, 0);
	refreshMoveModeNote(charId, ph);
	const ownNote = document.getElementById(`po-move-note-${String(charId)}-${String(ph)}`);
	if (ownNote) {
		ownNote.style.display = "none";
		ownNote.innerHTML = "";
	}
	for (let later = ph + 1; later <= 4; later++) {
		const laterAction = theFieldOrNoWords(theValueOfThePagesField(`po-action-${String(charId)}-${String(later)}`));
		if (laterAction !== "Move" && laterAction !== "Forced March") continue;
		const wrap = document.getElementById(`po-target-wrap-${String(charId)}-${String(later)}`);
		if (!wrap) continue;
		const savedT = getOrderTarget(charId, later);
		wrap.innerHTML = String(buildTargetField(char, later, {
			action: laterAction,
			target: savedT
		}));
		if (savedT) {
			const note = document.getElementById(`po-move-note-${String(charId)}-${String(later)}`);
			if (note) {
				note.style.display = "block";
				note.innerHTML = "⚠ <strong>Update me</strong> — an earlier move changed, so this order now sets out from a different province. Re-check its direction.";
			}
		}
	}
}
function _fillSyntheticOrderCard(fakeId, savedPhases, savedEP) {
	const fake = (currentReport?.characters ?? []).find((c) => String(c.id) === String(fakeId));
	if (!fake) return;
	const first = (fake.hiredInPhase ?? -1) + 1;
	for (let p = first; p < 5; p++) {
		const o = aFieldOfTheDraft(savedPhases ?? [], String(p));
		const action = o === null || o === void 0 ? void 0 : aFieldOfTheDraft(o, "action");
		if (!action) continue;
		const sel = document.getElementById(`po-action-${String(fakeId)}-${String(p)}`);
		if (!(sel instanceof HTMLSelectElement) || typeof action !== "string" || ![...sel.options].some((x) => x.value === action)) continue;
		sel.value = action;
		const wrap = document.getElementById(`po-target-wrap-${String(fakeId)}-${String(p)}`);
		if (wrap) try {
			wrap.innerHTML = String(buildTargetField(fake, p, {
				action,
				target: theFieldOrNoWords(aFieldOfTheDraft(o, "target")),
				extra: theFieldOrNoWords(aFieldOfTheDraft(o, "extra"))
			}));
		} catch {}
	}
	try {
		refreshOncePerTurnOptions(fakeId);
	} catch {}
	if (!savedEP) return;
	const allTac = theTacticsOf(savedEP).map(String);
	const tac = allTac.filter((t) => !t.toUpperCase().startsWith("CS:"));
	const cs = allTac.find((t) => t.toUpperCase().startsWith("CS:"));
	const h = document.getElementById(`ep-tactics-${String(fakeId)}`);
	if (h instanceof HTMLInputElement && tac.length) {
		h.value = tac.join(",");
		try {
			refreshEncounterPlan(fakeId, tac);
		} catch {}
	}
	if (cs) {
		const pre = document.getElementById(`ep-preschool-${String(fakeId)}`);
		if (pre instanceof HTMLInputElement) {
			pre.value = cs.slice(3).toLowerCase();
			try {
				renderPreSchool(fakeId);
			} catch {}
		}
	}
	const n = document.getElementById(`ep-notes-${String(fakeId)}`);
	if (n instanceof HTMLInputElement) n.value = inWords(theFieldOrNoWords(aFieldOfTheDraft(savedEP, "notes")));
	const d = document.getElementById(`ep-duel-${String(fakeId)}`);
	if (d instanceof HTMLSelectElement && aFieldOfTheDraft(savedEP, "duelStance")) d.value = inWords(aFieldOfTheDraft(savedEP, "duelStance"));
}
/** `value[key]` on a saved draft's part, parsed from JSON (any value: a hero's phases, a phase's order, an encounter
*  plan), as JavaScript reads it: for none, the TypeError that read throws. */
function aFieldOfTheDraft(value, key) {
	if (value === null || value === void 0) throw new TypeError(`Cannot read properties of ${String(value)} (reading '${key}')`);
	return Reflect.get(Object(value), key);
}
/** The plan's tactics as `(plan.tactics || [])` read them for `.map`: a list, none for a falsy value, and the TypeError
*  `.map` threw for anything else. */
function theTacticsOf(plan) {
	const tactics = aFieldOfTheDraft(plan, "tactics");
	if (!tactics) return [];
	if (!Array.isArray(tactics)) throw new TypeError("a saved encounter plan’s tactics are not a list");
	return tactics;
}
function syncAllPreOrderCards(savedOrdersHeld, savedEncounterPlansHeld) {
	const savedOrders = savedOrdersHeld ?? {};
	const savedEncounterPlans = savedEncounterPlansHeld ?? {};
	const SEL = "[id^=\"hired-hero-orders-\"],[id^=\"charm-orders-\"]";
	for (let round = 0; round < 3; round++) {
		const before = document.querySelectorAll(SEL).length;
		[...new Set([...document.querySelectorAll("select[id^=\"po-action-\"]")].map((el) => el.id.replace(/^po-action-/, "").replace(/-\d+$/, "")))].forEach((cid) => {
			for (let ph = 0; ph < 5; ph++) [["hired-hero-orders", syncHiredHeroCard], ["charm-orders", syncCharmCard]].forEach(([prefix, fn]) => {
				const cardId = `${prefix}-${cid}-${String(ph)}`;
				if (document.getElementById(cardId)) return;
				try {
					fn(cid, ph);
				} catch {
					return;
				}
				const fid = document.getElementById(cardId)?.getAttribute("data-fakeid");
				if (fid) _fillSyntheticOrderCard(fid, aFieldOfTheDraft(savedOrders, fid), aFieldOfTheDraft(savedEncounterPlans, fid));
			});
		});
		if (document.querySelectorAll(SEL).length === before) break;
	}
}
function syncHiredHeroCard(charId, ph) {
	const containerId = `hired-hero-orders-${String(charId)}-${String(ph)}`;
	const existing = document.getElementById(containerId);
	const action = theFieldOrNoWords(theValueOfThePagesField(`po-action-${String(charId)}-${String(ph)}`));
	const rawTarget = getOrderTarget(charId, ph);
	const isHire = action === "Hire Hero" && rawTarget;
	const isBrokerHire = action === "Broker" && typeof rawTarget === "string" && rawTarget.startsWith("hire:");
	if (!(Boolean(isHire) || isBrokerHire)) {
		if (existing) {
			const stale = existing.getAttribute("data-fakeid");
			if (stale && currentReport) currentReport.characters = (currentReport.characters ?? []).filter((c) => c.id !== stale);
			existing.remove();
		}
		return;
	}
	injectHiredHeroOrders(charId, ph);
}
function syncResurrectCard() {
	syncAllResurrectCards();
}
function _resurrectCastersByHero() {
	const out = {};
	(currentReport?.characters ?? []).forEach((c) => {
		if (!c || c.alive === false || !/^\d+$/.test(String(c.id))) return;
		for (let ph = 0; ph < 5; ph++) {
			if (theFieldOrNoWords(theValueOfThePagesField(`po-action-${String(c.id)}-${String(ph)}`)) !== "Cast Spell") continue;
			if (getOrderTarget(c.id, ph) !== "Resurrect") continue;
			const hid = inWords(theFieldOrNoWords(theValueOfThePagesField(`po-extra-${String(c.id)}-${String(ph)}`)));
			if (!/^\d+$/.test(hid)) continue;
			(out[hid] ??= []).push({
				charId: String(c.id),
				ph,
				name: c.name
			});
		}
	});
	Object.values(out).forEach((list) => list.sort((x, y) => x.ph - y.ph));
	return out;
}
function _readResurrectCardOrders(fakeId) {
	return {
		phases: [
			0,
			1,
			2,
			3,
			4
		].map((p) => ({
			action: theActionOrNone(theFieldOrNoWords(theValueOfThePagesField(`po-action-${String(fakeId)}-${String(p)}`))),
			target: getOrderTarget(fakeId, p),
			extra: getOrderExtra(fakeId, p)
		})),
		tactics: theFieldOrNoWords(theValueOfThePagesField(`ep-tactics-${String(fakeId)}`)),
		notes: theFieldOrNoWords(theValueOfThePagesField(`ep-notes-${String(fakeId)}`)),
		duel: theFieldOrNoWords(theValueOfThePagesField(`ep-duel-${String(fakeId)}`))
	};
}
function _teardownResurrectCard(card) {
	const stale = card.getAttribute("data-fakeid");
	if (stale && currentReport) currentReport.characters = (currentReport.characters ?? []).filter((c) => c.id !== stale);
	card.remove();
}
function _fillResurrectCard(fakeId, saved) {
	const fake = (currentReport?.characters ?? []).find((c) => c.id === fakeId);
	if (!fake || !saved) return;
	const first = (fake.hiredInPhase ?? -1) + 1;
	for (let p = first; p < 5; p++) {
		const o = aFieldOfTheDraft(saved.phases ?? [], String(p));
		const action = o === null || o === void 0 ? void 0 : aFieldOfTheDraft(o, "action");
		if (!action) continue;
		const sel = document.getElementById(`po-action-${String(fakeId)}-${String(p)}`);
		if (!(sel instanceof HTMLSelectElement) || typeof action !== "string" || ![...sel.options].some((x) => x.value === action)) continue;
		sel.value = action;
		const wrap = document.getElementById(`po-target-wrap-${String(fakeId)}-${String(p)}`);
		if (wrap) try {
			wrap.innerHTML = String(buildTargetField(fake, p, {
				action,
				target: theFieldOrNoWords(aFieldOfTheDraft(o, "target")),
				extra: theFieldOrNoWords(aFieldOfTheDraft(o, "extra"))
			}));
		} catch {}
	}
	if (saved.tactics) {
		const tactics = saved.tactics;
		const h = document.getElementById(`ep-tactics-${String(fakeId)}`);
		if (h instanceof HTMLInputElement) {
			h.value = inWords(tactics);
			try {
				refreshEncounterPlan(fakeId, theWordsSplit(tactics).filter(Boolean));
			} catch {}
		}
	}
	if (saved.notes) {
		const n = document.getElementById(`ep-notes-${String(fakeId)}`);
		if (n instanceof HTMLInputElement) n.value = inWords(saved.notes);
	}
	if (saved.duel) {
		const d = document.getElementById(`ep-duel-${String(fakeId)}`);
		if (d instanceof HTMLSelectElement) d.value = inWords(saved.duel);
	}
}
/** Words split at their commas, as `.split(',')` read them: anything else throws the TypeError the call threw. */
function theWordsSplit(words) {
	if (typeof words !== "string") throw new TypeError("a card’s saved tactics are not words");
	return words.split(",");
}
function _setResurrectCasterNote(card, casters) {
	const el = card.querySelector(".resurrect-casters");
	if (!el) return;
	const SEASONS_R = KC_SEASONS.slice();
	const who = casters.map((x) => `${String(x.name)} (${SEASONS_R[x.ph] ?? "?"})`);
	el.textContent = casters.length > 1 ? `Raised by any of: ${who.join(", ")} — whichever succeeds, these orders apply.` : `Raised by ${String(who[0])}.`;
}
function syncAllResurrectCards(savedByHeroHeld) {
	const savedByHero = savedByHeroHeld ?? {};
	document.querySelectorAll("[id^=\"resurrect-note-\"]").forEach((n) => {
		n.remove();
	});
	const groups = _resurrectCastersByHero();
	const kept = {};
	document.querySelectorAll("[id^=\"resurrect-orders-\"]").forEach((card) => {
		const hid = card.getAttribute("data-heroid");
		const g = hid ? groups[hid] : null;
		if (!hid || !g || kept[hid]) {
			_teardownResurrectCard(card);
			return;
		}
		const earliest = theFirstCaster(g);
		if (card.getAttribute("data-firstph") !== String(earliest.ph) || card.getAttribute("data-anchor") !== earliest.charId) {
			savedByHero[hid] ??= _readResurrectCardOrders(card.getAttribute("data-fakeid"));
			_teardownResurrectCard(card);
			return;
		}
		kept[hid] = card;
		_setResurrectCasterNote(card, g);
	});
	if (currentReport) {
		const live = new Set([...document.querySelectorAll("[id^=\"resurrect-orders-\"]")].map((c) => c.getAttribute("data-fakeid")));
		currentReport.characters = (currentReport.characters ?? []).filter((c) => !(typeof c.id === "string" && c.id.startsWith("resurrect_") && !live.has(c.id)));
	}
	Object.entries(groups).forEach(([hid, g]) => {
		if (kept[hid]) return;
		const earliest = theFirstCaster(g);
		const card = injectResurrectOrders(earliest.charId, earliest.ph, hid, g);
		if (card && savedByHero[hid]) _fillResurrectCard(card.getAttribute("data-fakeid"), savedByHero[hid]);
	});
}
/** The earliest of a fallen hero's casters (the list is never empty: a caster starts it); none throws the TypeError
*  reading his phase threw. */
function theFirstCaster(casters) {
	const first = casters[0];
	if (!first) throw new TypeError("a fallen hero with no caster");
	return first;
}
/** A card's body, the `.orders-char-body` its markup has just written; none throws the TypeError appending a row to it
*  threw. */
function theCardsBody(card) {
	const body = card.querySelector(".orders-char-body");
	if (!body) throw new TypeError("the card holds no body");
	return body;
}
function injectResurrectOrders(charId, ph, heroId, casters) {
	const report = currentReport ?? {};
	if (!/^\d+$/.test(String(charId)) || !/^\d+$/.test(String(heroId))) return null;
	const dead = (report.knownDeadHeroes ?? report.deadHeroes ?? []).find((x) => String(x.id) === String(heroId));
	if (!dead) return null;
	const firstActable = ph + 1;
	const containerId = `resurrect-orders-${String(heroId)}`;
	document.getElementById(containerId)?.remove();
	const casterBlock = document.getElementById(`po-action-${String(charId)}-0`)?.closest(".orders-char-block");
	if (!casterBlock) return null;
	if (firstActable > 4) {
		const note = document.createElement("div");
		note.id = `resurrect-note-${String(heroId)}`;
		note.className = "orders-char-block";
		note.style.cssText = "border:2px dashed #b9a7c9;opacity:0.85;margin-top:8px";
		note.innerHTML = String(kcHtml`
      <div class="orders-char-head" style="background:#f5eeff;color:#2e2e2e">
        \u2728 ${dead.name}
        <span style="color:#46275f;font-size:.7rem;margin-left:6px">(raised in Early Winter \u2014 no orders to give)</span>
      </div>
      <div style="padding:6px 10px 8px;background:#f5eeff;font-size:.76rem;line-height:1.6;color:#46275f">
        Early Winter is the last phase of the turn, so ${dead.name} returns with no phase left in which to act.
        There are no orders to pre-write. If the cast succeeds they stand in your caster's province at full
        health, stripped of items and armies, and take your orders normally from Spring next turn.
      </div>`);
		casterBlock.after(note);
		return null;
	}
	const SEASONS_R = KC_SEASONS.slice();
	const fakeId = `resurrect_${String(heroId)}_via_${String(charId)}_ph${String(ph)}`;
	const _casterLoc = predictedLocation(charId, ph);
	const fakeChar = {
		id: fakeId,
		name: dead.name,
		isKing: false,
		race: (dead.race ?? "") || "Unknown",
		alignment: (dead.alignment ?? "") || "Neutral",
		temper: (dead.temper ?? "") || "Brave",
		skills: dead.skills ?? {},
		armies: [],
		items: [],
		pay: 1,
		locationId: dead.locationId ?? (_casterLoc ? _casterLoc.id : null),
		locationName: (_casterLoc?.name ?? "") || (dead.locationName ?? "") || "(raised where they fell)",
		effectiveSpeed: 5,
		effectiveSeaSpeed: 0,
		hiredInPhase: ph,
		encounterPlan: {
			tactics: ["ME"],
			notes: ""
		},
		hp: null,
		maxHp: null
	};
	if (currentReport) {
		currentReport.characters = (currentReport.characters ?? []).filter((c) => !(typeof c.id === "string" && c.id.startsWith(`resurrect_${String(heroId)}_via_`)));
		currentReport.characters.push(fakeChar);
	}
	const card = document.createElement("div");
	card.id = containerId;
	card.setAttribute("data-fakeid", fakeId);
	card.setAttribute("data-heroid", String(heroId));
	card.setAttribute("data-anchor", String(charId));
	card.setAttribute("data-firstph", String(ph));
	card.className = "orders-char-block";
	card.style.cssText = "border:2px dashed #5a3a7a;opacity:0.9;margin-top:8px";
	card.innerHTML = String(kcHtml`
    <div class="orders-char-head" style="background:#f5eeff;color:#2e2e2e">
      <button type="button" class="sec-toggle" aria-expanded="true" title="Minimise / maximise" onclick="toggleSection(this)">&#9662;</button>
      \u2728 ${dead.name}
      <span style="color:#46275f;font-size:.7rem;margin-left:6px">(if raised \u2014 can act from ${SEASONS_R[firstActable] ?? "next turn"})</span>
      <span style="margin-left:auto;font-size:.7rem;color:#231e16">📍 ${provLinkHtml(fakeChar.locationId, fakeChar.locationName || "?")} · Land: 5/turn · Sea: 5/turn</span>
    </div>
    <div style="padding:5px 10px 6px;background:#f5eeff;border-bottom:1px solid var(--parchment-dark);font-size:.76rem;line-height:1.6">
      <div class="resurrect-casters" style="color:#46275f;font-weight:600"></div>
      <div style="color:#46275f">These orders only take effect if one of your Resurrect casts succeeds. If every cast
      fails, or another realm raises ${dead.name} first, they are simply ignored. A phase before the hero is actually raised is skipped.</div>
      <div style="color:var(--stone);margin-top:2px">Returns at full health, stripped of all items and armies.</div>
    </div>
    <div class="orders-char-body"></div>`);
	casterBlock.after(card);
	_setResurrectCasterNote(card, casters?.length ? casters : [{
		charId: String(charId),
		ph,
		name: ((report.characters ?? []).find((x) => String(x.id) === String(charId))?.name ?? "") || "your caster"
	}]);
	const body = theCardsBody(card);
	SEASONS_R.forEach((season, phIdx) => {
		const row = document.createElement("div");
		row.className = "phase-order";
		if (phIdx < firstActable) {
			row.style.cssText = "opacity:.35;pointer-events:none";
			row.innerHTML = String(kcHtml`<div class="phase-label">${season}</div>
        <div style="font-size:.76rem;color:var(--stone);font-style:italic;grid-column:2/-1">(still dead)</div>`);
		} else row.innerHTML = String(kcHtml`
        <div class="phase-label">${season}</div>
        <select id="po-action-${fakeId}-${phIdx}" onchange="onActionChange(${kcArg(fakeId)},${kcArg(phIdx)},99)">
          <option value="">\u2014 Choose \u2014</option>
          ${actionsFor(fakeChar).map((a) => kcHtml`<option value="${a}">${a}</option>`)}
        </select>
        <div id="po-target-wrap-${fakeId}-${phIdx}">
          <input id="po-target-${fakeId}-${phIdx}" type="text" placeholder="Details">
        </div>`);
		body.appendChild(row);
	});
	const epDiv = document.createElement("div");
	epDiv.style.cssText = "padding:10px;border-top:1px solid var(--parchment-dark);background:#faf6ff";
	epDiv.innerHTML = String(kcHtml`
    <div style="font-family:Cinzel,serif;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">\u2694 Encounter Plan</div>
    <div id="ep-list-${fakeId}" style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px">
      <div style="font-size:.8rem;padding:4px 8px;background:#faf6ff;border:1px solid var(--stone);border-radius:2px">ME \u2014 Melee</div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${ENCOUNTER_TACTICS.filter((t) => t.code !== "CS" && !t.retired).map((t) => kcHtml`<button onclick="addEncounterTactic(${kcArg(fakeId)},${kcArg(t.code)})"
        style="font-size:.7rem;padding:3px 8px;border:1px solid var(--stone);background:var(--parchment-dark);cursor:pointer;border-radius:2px"
        title="${t.label}">+ ${t.code}</button>`)}
    </div>
    <input type="hidden" id="ep-tactics-${fakeId}" value="ME">
    <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #cdb8e0">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;color:#46275f;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">\u{1F93A} Duel stance</div>
      <select id="ep-duel-${fakeId}" style="font-size:.8rem;width:100%">
        ${DUEL_STANCES.map((d) => kcHtml`<option value="${d.code}"${d.code === "refuse" ? " selected" : ""}>${d.label}</option>`)}
      </select>
    </div>
    <input type="hidden" id="ep-preschool-${fakeId}" value="">
    <div style="margin-top:6px">
      <label style="font-size:.72rem">Describe their battlecry:</label>
      <input type="text" id="ep-notes-${fakeId}" placeholder="e.g. Death held me only briefly." style="font-size:.8rem;margin-top:2px">
    </div>`);
	card.appendChild(epDiv);
	return card;
}
function syncCharmCard(charId, ph) {
	const containerId = `charm-orders-${String(charId)}-${String(ph)}`;
	const existing = document.getElementById(containerId);
	const action = theFieldOrNoWords(theValueOfThePagesField(`po-action-${String(charId)}-${String(ph)}`));
	const spell = getOrderTarget(charId, ph);
	const heroId = theFieldOrNoWords(theValueOfThePagesField(`po-extra-${String(charId)}-${String(ph)}`));
	const tgt = ((currentReport ?? {}).visibleChars ?? []).find((x) => String(x.id) === String(heroId));
	if (!(action === "Cast Spell" && spell === "Charm" && heroId && tgt && !tgt.isKing && !leadsArmiesP(tgt))) {
		if (existing) {
			const stale = existing.getAttribute("data-fakeid");
			if (stale && currentReport) currentReport.characters = (currentReport.characters ?? []).filter((c) => c.id !== stale);
			existing.remove();
		}
		return;
	}
	injectCharmOrders(charId, ph, heroId, containerId);
}
function injectCharmOrders(charId, ph, heroId, containerId) {
	const report = currentReport ?? {};
	if (!/^\d+$/.test(String(charId)) || !/^\d+$/.test(String(heroId))) return;
	const wanderer = (report.visibleChars ?? []).find((x) => String(x.id) === String(heroId) && !x.isKing && !leadsArmiesP(x));
	if (!wanderer) return;
	const isEnemy = wanderer.player != null;
	const firstActable = ph + 1;
	if (firstActable > 4) return;
	document.getElementById(containerId)?.remove();
	const casterBlock = document.getElementById(`po-action-${String(charId)}-0`)?.closest(".orders-char-block");
	if (!casterBlock) return;
	const SEASONS_C = KC_SEASONS.slice();
	const fakeId = `charm_${String(heroId)}_via_${String(charId)}_ph${String(ph)}`;
	const fakeChar = {
		id: fakeId,
		name: wanderer.name,
		isKing: false,
		race: (wanderer.race ?? "") || "Unknown",
		alignment: (wanderer.alignment ?? "") || "Neutral",
		temper: (wanderer.temper ?? "") || "Brave",
		skills: {},
		_hiddenSkills: true,
		armies: [],
		items: [],
		pay: (wanderer.pay ?? 0) || 1,
		_charmEnemy: isEnemy,
		locationId: wanderer.locationId ?? null,
		locationName: (wanderer.locationName ?? "") || "(in your province)",
		effectiveSpeed: 5,
		effectiveSeaSpeed: 0,
		hiredInPhase: ph,
		encounterPlan: {
			tactics: ["ME"],
			notes: ""
		},
		hp: wanderer.hp ?? null,
		maxHp: wanderer.maxHp ?? null
	};
	if (currentReport) {
		const slotSuffix = `_via_${String(charId)}_ph${String(ph)}`;
		currentReport.characters = (currentReport.characters ?? []).filter((c) => !(typeof c.id === "string" && c.id.startsWith("charm_") && c.id.endsWith(slotSuffix)));
		currentReport.characters.push(fakeChar);
	}
	const card = document.createElement("div");
	card.id = containerId;
	card.setAttribute("data-fakeid", fakeId);
	card.className = "orders-char-block";
	card.style.cssText = "border:2px dashed #2a7a8a;opacity:0.9;margin-top:8px";
	card.innerHTML = String(kcHtml`
    <div class="orders-char-head" style="background:#eaf6f8;color:#2e2e2e">
      <button type="button" class="sec-toggle" aria-expanded="true" title="Minimise / maximise" onclick="toggleSection(this)">&#9662;</button>
      \u2728 ${wanderer.name}
      <span style="color:#185562;font-size:.7rem;margin-left:6px">(if charmed \u2014 can act from ${SEASONS_C[firstActable] ?? "next turn"})</span>
      <span style="margin-left:auto;font-size:.7rem;color:#231e16">📍 ${provLinkHtml(fakeChar.locationId, fakeChar.locationName || "?")} · Land: 5/turn · Sea: 5/turn</span>
    </div>
    <div style="padding:5px 10px 6px;background:#eaf6f8;border-bottom:1px solid var(--parchment-dark);font-size:.76rem;line-height:1.6">
      <div style="color:#185562">These orders only take effect if the Charm succeeds. If the cast fails,
      or another realm charms ${wanderer.name} first, they are simply ignored.</div>
      <div style="color:var(--stone);margin-top:2px">${isEnemy ? "Their command is seized for the rest of this turn; at the season’s end they return to their own lord (who still pays their wages). They will not attack their own lord’s heroes, and they handle no items at all while enchanted — you cannot give them anything, have them use anything, or have them hand anything over. They keep their own gear and fight with it." : "Joins your service at no hiring cost (you still pay their upkeep). For the rest of this turn the enchantment still holds them, so they handle no items — nothing given to them, nothing used, nothing handed over. From next turn they are an ordinary hero of your realm and all of it is open to them."}</div>
    </div>
    <div class="orders-char-body"></div>`);
	casterBlock.after(card);
	const body = theCardsBody(card);
	SEASONS_C.forEach((season, phIdx) => {
		const row = document.createElement("div");
		row.className = "phase-order";
		if (phIdx < firstActable) {
			row.style.cssText = "opacity:.35;pointer-events:none";
			row.innerHTML = String(kcHtml`<div class="phase-label">${season}</div>
        <div style="font-size:.76rem;color:var(--stone);font-style:italic;grid-column:2/-1">(not yet charmed)</div>`);
		} else row.innerHTML = String(kcHtml`
        <div class="phase-label">${season}</div>
        <select id="po-action-${fakeId}-${phIdx}" onchange="onActionChange(${kcArg(fakeId)},${kcArg(phIdx)},99)">
          <option value="">\u2014 Choose \u2014</option>
          ${actionsFor(fakeChar).map((a) => kcHtml`<option value="${a}">${a}</option>`)}
        </select>
        <div id="po-target-wrap-${fakeId}-${phIdx}">
          <input id="po-target-${fakeId}-${phIdx}" type="text" placeholder="Details">
        </div>`);
		body.appendChild(row);
	});
	const epDiv = document.createElement("div");
	epDiv.style.cssText = "padding:10px;border-top:1px solid var(--parchment-dark);background:#f2fafb";
	epDiv.innerHTML = String(kcHtml`
    <div style="font-family:Cinzel,serif;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">\u2694 Encounter Plan</div>
    <div id="ep-list-${fakeId}" style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px">
      <div style="font-size:.8rem;padding:4px 8px;background:#f2fafb;border:1px solid var(--stone);border-radius:2px">ME \u2014 Melee</div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${ENCOUNTER_TACTICS.filter((t) => t.code !== "CS" && !t.retired).map((t) => kcHtml`<button onclick="addEncounterTactic(${kcArg(fakeId)},${kcArg(t.code)})"
        style="font-size:.7rem;padding:3px 8px;border:1px solid var(--stone);background:var(--parchment-dark);cursor:pointer;border-radius:2px"
        title="${t.label}">+ ${t.code}</button>`)}
    </div>
    <input type="hidden" id="ep-tactics-${fakeId}" value="ME">
    <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #b8dde0">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;color:#185562;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">\u{1F93A} Duel stance</div>
      <select id="ep-duel-${fakeId}" style="font-size:.8rem;width:100%">
        ${DUEL_STANCES.map((d) => kcHtml`<option value="${d.code}"${d.code === "refuse" ? " selected" : ""}>${d.label}</option>`)}
      </select>
    </div>
    <input type="hidden" id="ep-preschool-${fakeId}" value="">
    <div style="margin-top:6px">
      <label style="font-size:.72rem">Describe their battlecry:</label>
      <input type="text" id="ep-notes-${fakeId}" placeholder="e.g. Your cause is mine now." style="font-size:.8rem;margin-top:2px">
    </div>`);
	card.appendChild(epDiv);
}
function injectHiredHeroOrders(charId, ph) {
	let heroId = getOrderTarget(charId, ph);
	if (!heroId) return;
	if (typeof heroId === "string" && heroId.startsWith("hire:")) heroId = heroId.slice(5);
	if (!/^\d+$/.test(String(heroId))) return;
	const report = currentReport ?? {};
	const firstActable = ph + 1;
	const theHeroFound = { hero: null };
	Object.values(report.provinceOrderData ?? {}).forEach((pd) => {
		if (!pd) throw new TypeError("a province with no order data");
		(pd.availableHeroes ?? []).forEach((h) => {
			if (String(h.id) === String(heroId)) theHeroFound.hero = h;
		});
	});
	const heroData = theHeroFound.hero;
	if (!heroData) return;
	const containerId = `hired-hero-orders-${String(charId)}-${String(ph)}`;
	document.getElementById(containerId)?.remove();
	let charBlock = document.getElementById(`po-action-${String(charId)}-0`)?.closest(".orders-char-block");
	if (!charBlock) {
		for (let _p = 0; _p < 5 && !charBlock; _p++) {
			const el = document.getElementById(`po-action-${String(charId)}-${String(_p)}`);
			if (el) charBlock = el.closest(".orders-char-block");
		}
		if (!charBlock) {
			const fake = document.querySelector(`[data-fakeid="${String(charId)}"]`);
			if (fake) charBlock = fake;
		}
	}
	if (!charBlock) return;
	const SEASONS_H = KC_SEASONS.slice();
	const hiredCharId = `hired_${String(heroId)}_via_${String(charId)}_ph${String(ph)}`;
	const fakeChar = {
		id: hiredCharId,
		name: heroData.name,
		isKing: false,
		race: heroData.race,
		alignment: heroData.alignment,
		temper: heroData.temper,
		skills: {},
		_unknownSkills: true,
		armies: [],
		items: [],
		pay: heroHireWageOfP(heroData, currentReport) ?? heroData.pay,
		locationId: heroData.locationId ?? null,
		locationName: (heroData.locationName ?? "") || "(joining after hire)",
		effectiveSpeed: 5,
		effectiveSeaSpeed: 0,
		hiredInPhase: ph,
		encounterPlan: {
			tactics: ["ME"],
			notes: ""
		},
		hp: (heroData.hp ?? 0) || 14,
		maxHp: (heroData.maxHp ?? 0) || 14
	};
	if (currentReport) {
		const slotSuffix = `_via_${String(charId)}_ph${String(ph)}`;
		currentReport.characters = (currentReport.characters ?? []).filter((c) => !(typeof c.id === "string" && c.id.startsWith("hired_") && c.id.endsWith(slotSuffix)));
		currentReport.characters.push(fakeChar);
	}
	const card = document.createElement("div");
	card.id = containerId;
	card.className = "orders-char-block";
	card.style.cssText = "border:2px dashed #c8922a;opacity:0.9;margin-top:8px";
	card.setAttribute("data-fakeid", hiredCharId);
	let hireTop = heroData.topSkill ?? null;
	if (!hireTop) {
		const best = Object.entries(heroData.skills ?? {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0];
		if (best) hireTop = {
			skill: best[0],
			level: best[1]
		};
	}
	const skillStr = hireTop ? kcHtml`<span style="color:var(--forest)"><strong>${skillFameLabelM(hireTop.level)}</strong> ${theSkillsLabel(hireTop.skill)}</span>` : kcHtml`<span style="color:#aaa">No notable skills</span>`;
	card.innerHTML = String(kcHtml`
    <div class="orders-char-head" style="background:#fdf5e0;color:#2e2e2e">
      <button type="button" class="sec-toggle" aria-expanded="true" title="Minimise / maximise this hero's orders" onclick="toggleSection(this)">&#9662;</button>
      ⚔ ${heroData.name}
      <span style="color:#c8922a;font-size:.7rem;margin-left:6px">(newly hired — can act from ${SEASONS_H[firstActable] ?? "next turn"})</span>
      <span style="margin-left:auto;font-size:.7rem;color:#231e16">📍 ${provLinkHtml(fakeChar.locationId, fakeChar.locationName || "?")} · Land: 5/turn · Sea: 5/turn</span>
    </div>
    <div style="padding:5px 10px 6px;background:#fdf5e0;border-bottom:1px solid var(--parchment-dark);font-size:.76rem;display:flex;flex-wrap:wrap;gap:8px">
      <span><strong>Race:</strong> ${heroData.race}</span>
      ${skillStr}
    </div>
    <div class="orders-char-body" id="hired-body-${hiredCharId}">
    </div>`);
	charBlock.after(card);
	const body = theCardsBody(card);
	SEASONS_H.forEach((season, phIdx) => {
		const row = document.createElement("div");
		row.className = "phase-order";
		if (phIdx < firstActable) {
			row.style.cssText = "opacity:.35;pointer-events:none";
			row.innerHTML = String(kcHtml`<div class="phase-label">${season}</div>
        <div style="font-size:.76rem;color:var(--stone);font-style:italic;grid-column:2/-1">(not yet hired)</div>`);
		} else {
			const actionSelId = `po-action-${hiredCharId}-${String(phIdx)}`;
			const targetWrapId = `po-target-wrap-${hiredCharId}-${String(phIdx)}`;
			row.innerHTML = String(kcHtml`
        <div class="phase-label">${season}</div>
        <select id="${actionSelId}" onchange="onActionChange(${kcArg(hiredCharId)},${kcArg(phIdx)},99)">
          <option value="">— Choose —</option>
          ${actionsFor(fakeChar).map((a) => kcHtml`<option value="${a}">${a}</option>`)}
        </select>
        <div id="${targetWrapId}">
          <input id="po-target-${hiredCharId}-${phIdx}" type="text" placeholder="Details">
        </div>`);
		}
		body.appendChild(row);
	});
	const epDiv = document.createElement("div");
	epDiv.style.cssText = "padding:10px;border-top:1px solid var(--parchment-dark);background:#fdf8ee";
	epDiv.innerHTML = String(kcHtml`
    <div style="font-family:Cinzel,serif;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">⚔ Encounter Plan</div>
    <div id="ep-list-${hiredCharId}" style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px">
      <div style="font-size:.8rem;padding:4px 8px;background:#fdf8ee;border:1px solid var(--stone);border-radius:2px">ME — Melee</div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${ENCOUNTER_TACTICS.filter((t) => t.code !== "CS" && !t.retired).map((t) => kcHtml`<button onclick="addEncounterTactic(${kcArg(hiredCharId)},${kcArg(t.code)})"
        style="font-size:.7rem;padding:3px 8px;border:1px solid var(--stone);background:var(--parchment-dark);cursor:pointer;border-radius:2px"
        title="${t.label}">+ ${t.code}</button>`)}
    </div>
    <input type="hidden" id="ep-tactics-${hiredCharId}" value="ME">
    <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #d8c48a">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;color:#5a4208;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">
        🤺 Duel stance <span style="font-weight:normal;font-family:serif;text-transform:none;letter-spacing:0;font-size:.72rem;color:#3a3224">— single combat at the start of an army battle</span>
      </div>
      <select id="ep-duel-${hiredCharId}" style="font-size:.8rem;width:100%">
        ${DUEL_STANCES.map((d) => kcHtml`<option value="${d.code}"${d.code === "refuse" ? " selected" : ""}>${d.label}</option>`)}
      </select>
    </div>
    <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #d8c48a">
      <div style="font-family:'Cinzel',serif;font-size:.68rem;color:#5a4208;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">
        ✨ Pre-battle magic <span style="font-weight:normal;font-family:serif;text-transform:none;letter-spacing:0;font-size:.72rem;color:#3a3224">— one random spell cast in army battles (not encounters)</span>
      </div>
      <input type="hidden" id="ep-preschool-${hiredCharId}" value="">
      <div id="ep-preschool-display-${hiredCharId}" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"></div>
    </div>
    <div style="margin-top:6px">
      <label style="font-size:.72rem">Describe your battlecry:</label>
      <input type="text" id="ep-notes-${hiredCharId}" placeholder="e.g. For glory and the fallen — none shall pass!"
        style="font-size:.8rem;margin-top:2px">
    </div>`);
	card.appendChild(epDiv);
	renderPreSchool(hiredCharId);
}
function updateBloodOffering(charId, ph) {
	const rite = theFieldOrNoWords(theValueOfThePagesField(`po-target-${String(charId)}-${String(ph)}`));
	const block = document.getElementById(`bo-block-${String(charId)}-${String(ph)}`);
	const extra = document.getElementById(`po-extra-${String(charId)}-${String(ph)}`);
	const hint = document.getElementById(`bo-hint-${String(charId)}-${String(ph)}`);
	if (block) block.style.display = rite === "Blood Offering" ? "block" : "none";
	if (rite !== "Blood Offering") {
		if (extra instanceof HTMLInputElement) extra.value = "";
		return;
	}
	const sels = [...document.querySelectorAll(`.bo-sel[data-cid="${String(charId)}"][data-ph="${String(ph)}"]`)].filter((s) => s instanceof HTMLSelectElement);
	const sac = [];
	const ben = [];
	sels.forEach((s) => {
		const idx = parseInt(String(s.getAttribute("data-idx")));
		if (s.value === "S") sac.push(idx);
		else if (s.value === "E") ben.push(idx);
	});
	if (extra instanceof HTMLInputElement) extra.value = `S:${sac.join(",")}|E:${ben.join(",")}`;
	if (hint) {
		const said = theBloodOfferingsHint(projectedLedArmies(charId, ph), sac, ben);
		hint.textContent = said.words;
		hint.style.color = said.colour;
	}
	doSaveOrders();
}
async function submitOrders() {
	const chars = currentReport?.characters ?? [];
	const btn = theElementWithTheId("submit-btn", HTMLButtonElement);
	const msg = document.getElementById("orders-msg");
	btn.disabled = true;
	btn.textContent = "Saving…";
	let missingCount = 0;
	chars.filter((c) => c.alive !== false).forEach((c) => {
		const hiredPh = c.hiredInPhase ?? -1;
		SEASONS.forEach((_, ph) => {
			if (ph <= hiredPh) return;
			if (!theFieldOrNoWords(theValueOfThePagesField(`po-action-${String(c.id)}-${String(ph)}`))) missingCount++;
		});
	});
	const _dcUnpicked = _pendingDiscChoices().filter((pc) => !theLeadsOf(pc).some((o) => o.id === discoveryChoices[String(pc.key)])).length;
	if (missingCount > 0 || _dcUnpicked > 0) {
		theElementFound(msg, "orders-msg").innerHTML = String(kcHtml`<div class="msg-warning">${missingCount > 0 ? `⚠ ${String(missingCount)} phase${missingCount !== 1 ? "s" : ""} still have no action selected. You can submit anyway, and the GM will treat unfilled phases as Defend.` : ""}${_dcUnpicked > 0 ? kcHtml`${missingCount > 0 ? kcHtml`<br>` : ""}⚠ ${_dcUnpicked} research discover${_dcUnpicked !== 1 ? "ies are" : "y is"} still unchosen (💡 Research box near the top of your orders). If you submit anyway, one of each pair will be kept at random.` : ""}</div>`);
		const w = document.getElementById("orders-submit-wrap");
		if (w) {
			w.innerHTML = String(kcHtml`
        <button class="btn btn-crimson btn-full" style="flex:1;padding:12px;font-size:.85rem" onclick="doSubmitOrders()">Submit Anyway</button>
        <button class="btn btn-ghost" style="flex:0 0 auto;padding:10px 16px" onclick="cancelSubmit()">← Go Back</button>`);
			w.style.display = "flex";
			w.style.gap = "8px";
		}
		return;
	}
	await doSubmitOrders();
}
function setHeirName(charId, value) {
	if (!currentReport) return;
	const c = theHeroesOf(currentReport).find((x) => x.id === charId);
	if (!c?._isHeir) return;
	c.name = inWords(theFieldOrNoWords(value)).slice(0, 40);
	doSaveOrders();
}
function setHeirTemper(charId, value) {
	if (!currentReport) return;
	const c = theHeroesOf(currentReport).find((x) => x.id === charId);
	if (!c?._isHeir) return;
	if (typeof value !== "string" || !HEIR_TEMPERS_LIST.includes(value)) return;
	c.temper = value;
	doSaveOrders();
}
/** The element `el` looked up by the id `id`, read where the old code read it unguarded: none throws the TypeError
*  that read threw. */
function theElementFound(el, id) {
	if (!el) throw new TypeError(`the page holds no element with the id "${id}"`);
	return el;
}
/** The report's heroes, read where the old code read `.find` on them unguarded: none throws the TypeError that read
*  threw. */
function theHeroesOf(report) {
	const heroes = report.characters;
	if (!heroes) throw new TypeError("the report lists no heroes");
	return heroes;
}
/** A pair of leads' options, read where `.some` read them unguarded: none throws the TypeError that read threw. */
function theLeadsOf(pair) {
	const options = pair.options;
	if (!options) throw new TypeError("a pair of leads with no options");
	return options;
}
/** A skill's label (the skills' labels are never empty words), else its own name, as `LABELS[s] || s` gave it. */
function theSkillsLabel(skill) {
	return SKILL_LABELS[skill] ?? skill;
}
function resubmitOrders() {
	if (!currentGamePlayer) return;
	restoreSubmitWrap("Resubmit");
	theElementWithTheId("orders-msg", HTMLElement).innerHTML = "<div class=\"msg-info\">✏ Update your orders below and hit Resubmit — your new orders will replace the previous submission.</div>";
	document.querySelectorAll("#orders-form select, #orders-form input, #orders-form button").forEach((el) => {
		if (!el.id.includes("po-leave-all") && "disabled" in el) el.disabled = false;
	});
}
function rebuildTargetWrap(charId, ph) {
	const wrap = document.getElementById(`po-target-wrap-${String(charId)}-${String(ph)}`);
	const c = (currentReport?.characters ?? []).find((x) => String(x.id) === String(charId));
	if (!wrap || !c) return;
	const saved = {
		action: theActionOrNone(theFieldOrNoWords(theValueOfThePagesField(`po-action-${String(charId)}-${String(ph)}`))),
		target: getOrderTarget(charId, ph),
		extra: getOrderExtra(charId, ph)
	};
	try {
		wrap.innerHTML = String(buildTargetField(c, ph, saved));
	} catch (e) {
		console.warn("target rebuild failed", e);
	}
	if (saved.action === "Practice Skill") refreshLaterCastSpells(charId, ph);
}
function refreshLaterCastSpells(charId, fromPh) {
	const c = (currentReport?.characters ?? []).find((x) => String(x.id) === String(charId));
	if (!c) return;
	for (let later = fromPh + 1; later <= 4; later++) {
		if (theFieldOrNoWords(theValueOfThePagesField(`po-action-${String(charId)}-${String(later)}`)) !== "Cast Spell") continue;
		const wrap = document.getElementById(`po-target-wrap-${String(charId)}-${String(later)}`);
		if (!wrap) continue;
		const before = getOrderTarget(charId, later);
		const known = Object.keys(SPELL_TO_SCHOOL), at = known.findIndex((k) => k === before);
		const spell = at >= 0 ? known[at] : "";
		const savedExtra = getOrderExtra(charId, later);
		try {
			wrap.innerHTML = String(buildTargetField(c, later, {
				action: "Cast Spell",
				target: spell,
				extra: ""
			}));
		} catch (e) {
			console.warn("cast refresh failed", e);
		}
		const ex = document.getElementById(`po-extra-${String(charId)}-${String(later)}`);
		if (ex && savedExtra && getOrderTarget(charId, later) === spell && (ex.tagName !== "SELECT" || ex instanceof HTMLSelectElement && [...ex.options].some((o) => o.value === savedExtra))) Reflect.set(ex, "value", savedExtra);
		if (getOrderTarget(charId, later) !== before) {
			const l = later;
			setTimeout(() => {
				syncResurrectCard();
				syncCharmCard(charId, l);
			}, 0);
		}
	}
}
// src/ui/player/orders-form.ts
/** `value[key]` as JavaScript reads it (a draft parsed from JSON): for none, the TypeError that read throws. */
function theDraftsField(value, key) {
	if (value === null || value === void 0) throw new TypeError(`Cannot read properties of ${String(value)} (reading '${key}')`);
	return Reflect.get(Object(value), key);
}
/** `a || b` on values of any kind: `a` where it is truthy, else `b`. */
function thisOrThat(a, b) {
	if (a) return a;
	return b;
}
/** `x || {}` on a draft's part: itself where it is truthy, else an empty object. */
function itOrAnEmptyRecord(value) {
	if (value) return value;
	return {};
}
/** A saved list the form calls a list's method on: itself, and for any other value the TypeError that call threw. */
function theSavedList(value, what) {
	if (Array.isArray(value)) return value;
	throw new TypeError(`${what} is not a function`);
}
/** A phase's saved order as the target field reads it (its action, target and extra): an object as it is; any other
*  value reads none of them, as an empty object does. */
function theSavedOrderAsTheFieldReadsIt(saved) {
	return typeof saved === "object" ? saved : {};
}
/** A saved tactic the code slices or tests the start of: words, handed back as they are; any other value throws the
*  TypeError that call on it threw. */
function theSavedWords(value) {
	if (typeof value === "string") return value;
	throw new TypeError(`${typeof value} is not words: it has no startsWith or toLowerCase`);
}
/** The value of the page's field with the id `id`, as `document.getElementById(id)?.value` read it. */
function theValueOfThePagesFieldOrNone(id) {
	const el = document.getElementById(id);
	return el ? theValueOfAField(el) : void 0;
}
/** The skills' names, read by any school. */
var theSkillsNames = SKILL_LABELS;
/** A value the code reads a field of: itself, and for none the TypeError that read threw. */
function thereForItsField(value, what) {
	if (value === null || value === void 0) throw new TypeError(`Cannot read properties of ${String(value)} (reading '${what}')`);
	return value;
}
function renderOrderLedgerP() {
	const el = document.getElementById("orders-ledger");
	if (!el) return;
	if (!currentReport?.kingdom || !document.querySelector("#orders-form select[id^=\"po-action-\"]")) {
		el.style.display = "none";
		return;
	}
	const L = computeOrderLedgerP();
	const LBL = {
		armies: "⚔ Armies",
		mercs: "🗡 Mercenaries",
		heroes: "🧙 Heroes",
		intel: "🕵 Intelligence",
		other: "✦ Rites"
	};
	const parts = Object.entries(L.cats).filter(([, x]) => x.g > 0).map(([key, x]) => kcHtml`<span style="white-space:nowrap">${LBL[key]} <strong>${x.g}g</strong>${x.n > 1 ? kcHtml` <span style="color:var(--stone)">(${x.n})</span>` : ""}</span>`);
	const neg = L.left < 0, pneg = L.projected < 0;
	el.style.display = "block";
	el.innerHTML = String(kcHtml`<div style="font-size:.78rem;line-height:1.45;padding:3px 2px 6px">
    <div style="display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline">
      <span>💰 Treasury <strong>${L.gold}g</strong></span>
      <span>Spent in orders <strong style="color:${L.spend > 0 ? "#8a1c1c" : "inherit"}">${L.spend}g</strong></span>
      <span>Left <strong style="color:${neg ? "#c00" : "var(--forest)"}">${L.left}g</strong></span>
    </div>
    ${parts.length ? kcHtml`<div style="display:flex;flex-wrap:wrap;gap:2px 10px;font-size:.72rem;margin-top:1px">${parts}</div>` : ""}
    ${neg ? kcHtml`<div style="font-size:.7rem;color:#c00;margin-top:2px">⚠ These orders cost more than the treasury holds — tax only arrives at the end of the turn, so whatever is paid for last will fail for want of gold.</div>` : ""}
    <div style="font-size:.72rem;color:#4a3a1a;margin-top:2px" title="Estimate: treasury − orders + this turn's tax − army wages − hero wages − the wages of units and heroes these orders add. Failed orders cost nothing; disbanding or releasing lowers wages.">📅 End of turn ≈ <strong style="color:${pneg ? "#c00" : "inherit"}">${L.projected}g</strong> <span style="color:var(--stone)">(+${L.tax} tax − ${L.armyW} army wages − ${L.heroW} hero wages${L.newWages ? ` − ${String(L.newWages)} new wages` : ""})</span></div>
    ${L.notes.length ? kcHtml`<div style="font-size:.66rem;color:var(--stone)">${L.notes.join(" · ")}</div>` : ""}
  </div>`);
}
var _ledgerT = null;
function scheduleOrderLedgerP() {
	clearTimeout(_ledgerT ?? void 0);
	_ledgerT = setTimeout(() => {
		try {
			renderOrderLedgerP();
		} catch (e) {
			console.warn("ledger", e);
		}
	}, 120);
}
document.addEventListener("change", (ev) => {
	if (ev.target instanceof Element && ev.target.closest("#orders-column")) scheduleOrderLedgerP();
}, true);
document.addEventListener("input", (ev) => {
	if (ev.target instanceof Element && ev.target.closest("#orders-column")) scheduleOrderLedgerP();
}, true);
function buildOrdersForm(charsHanded, alreadySubmitted, existingOrders, turnNum) {
	const report = currentReport ?? {};
	let chars = (charsHanded ?? []).filter((c) => !(asItsGuardReadsIt(c) && isPreOrderIdP(c.id)));
	if (currentReport && Array.isArray(currentReport.characters)) currentReport.characters = currentReport.characters.filter((c) => !(asItsGuardReadsIt(c) && isPreOrderIdP(c.id)));
	chars = applyHeroOrderP(chars, heroOrderFromOrdersP(existingOrders) ?? (Array.isArray(report.heroOrder) && report.heroOrder.length ? report.heroOrder.map(String) : null));
	if (currentReport && Array.isArray(currentReport.characters)) currentReport.characters = chars;
	_heroOrder = chars.filter((c) => asItsGuardReadsIt(c) && c.alive !== false).map((c) => String(c.id));
	if (alreadySubmitted) {
		theElementWithTheId("orders-msg", HTMLElement).innerHTML = String(kcHtml`<div class="msg-success" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span>✓ Orders submitted — awaiting the GM to run the turn.</span>
      <button class="btn btn-ghost" style="padding:6px 14px;font-size:.8rem" onclick="reviseOrders()">✏ Revise Orders</button>
    </div>`);
		{
			const _w = document.getElementById("orders-submit-wrap");
			if (_w) {
				_w.innerHTML = String(kcHtml`<button class="btn btn-crimson btn-full" id="submit-btn" disabled style="flex:1;padding:12px;font-size:.85rem;opacity:.7;cursor:default">Orders Submitted ✓</button>`);
				_w.style.display = "flex";
			}
		}
		{
			const _lg = document.getElementById("orders-ledger");
			if (_lg) _lg.style.display = "none";
		}
		const savedOrders = typeof existingOrders === "string" ? JSON.parse(existingOrders) : thisOrThat(existingOrders, {});
		const savedO = itOrAnEmptyRecord(thisOrThat(theDraftsField(savedOrders, "orders"), savedOrders));
		const SEASONS_RO = KC_SEASONS.slice();
		const theSubmittedOrders = String(kcHtml`<div style="opacity:.65;pointer-events:none;user-select:none">
      <div style="font-family:Cinzel,serif;font-size:.72rem;color:var(--stone);text-transform:uppercase;letter-spacing:.08em;padding:6px 0 8px">Submitted orders (read-only):</div>
      ${chars.filter((c) => c.alive !== false).map((c) => {
			const cOrders = theSavedList(thisOrThat(theDraftsField(savedO, String(c.id)), []), "cOrders.some");
			return kcHtml`<div style="margin-bottom:12px;border:1px solid var(--stone);border-radius:3px;overflow:hidden">
          <div style="font-family:Cinzel,serif;font-size:.85rem;padding:6px 10px;background:var(--parchment-dark)">${c.isKing ? "👑" : "⚔"} ${c.name}</div>
          <div style="padding:6px 10px">
            ${SEASONS_RO.map((season, ph) => {
				const o = cOrders[ph];
				const action = o ? theDraftsField(o, "action") : void 0;
				if (!o || !action || action === "Defend" || action === "defend") return kcHtml`<div style="font-size:.78rem;padding:2px 0;color:var(--stone)">${season}: <em>Defend</em></div>`;
				const target = theDraftsField(o, "target");
				return kcHtml`<div style="font-size:.78rem;padding:2px 0">${season}: <strong>${action}</strong>${target ? " — " + inWords(target) : ""}</div>`;
			})}
          </div>
        </div>`;
		})}
      ${(() => {
			const SEASONS_SY = SEASONS_RO;
			const rows = Object.entries(savedO).filter(([k]) => /^(?:hired|resurrect|charm)_\d+_via_.+_ph\d+$/.test(k));
			if (!rows.length) return "";
			const LABEL = {
				hired: "newly hired",
				resurrect: "if raised",
				charm: "if charmed"
			};
			return rows.map(([k, ords]) => {
				const kind = k.split("_")[0];
				const heroId = k.split("_")[1];
				const _rp = currentReport ?? {};
				const nm = ((_rp.visibleChars ?? []).find((x) => String(x.id) === heroId)?.name ?? "") || (Object.values(_rp.provinceOrderData ?? {}).flatMap((pd) => thereForItsField(pd, "availableHeroes").availableHeroes ?? []).find((x) => String(x.id) === heroId)?.name ?? "") || ((_rp.knownDeadHeroes ?? _rp.graveyard ?? []).find((x) => String(x.id) === heroId)?.name ?? "") || "Hero";
				const from = parseInt((/_ph(\d+)$/.exec(k)?.[1] ?? "") || "0");
				return kcHtml`<div style="margin-bottom:12px;border:1px dashed var(--stone);border-radius:3px;overflow:hidden">
            <div style="font-family:Cinzel,serif;font-size:.85rem;padding:6px 10px;background:var(--parchment-dark)">\u2694 ${nm} <span style="font-size:.68rem;color:var(--stone)">(${((kind === void 0 ? void 0 : LABEL[kind]) ?? "") || kind})</span></div>
            <div style="padding:6px 10px">
              ${SEASONS_SY.map((season, ph) => {
					if (ph <= from) return kcHtml`<div style="font-size:.78rem;padding:2px 0;color:var(--stone)"><em>${season}: \u2014</em></div>`;
					const o = theDraftsField(thisOrThat(ords, []), String(ph));
					const action = o ? theDraftsField(o, "action") : void 0;
					if (!o || !action || action === "Defend" || action === "defend") return kcHtml`<div style="font-size:.78rem;padding:2px 0;color:var(--stone)">${season}: <em>Defend</em></div>`;
					const target = theDraftsField(o, "target");
					return kcHtml`<div style="font-size:.78rem;padding:2px 0">${season}: <strong>${action}</strong>${target ? " — " + inWords(target) : ""}</div>`;
				})}
            </div>
          </div>`;
			});
		})()}
    </div>`);
		theElementWithTheId("orders-form", HTMLElement).innerHTML = theSubmittedOrders;
		return;
	}
	restoreSubmitWrap("Submit");
	let rawSaved;
	try {
		rawSaved = typeof existingOrders === "string" ? JSON.parse(existingOrders || "{}") : thisOrThat(existingOrders, {});
	} catch {
		rawSaved = {};
	}
	{
		const _liveTurn = thisOrThat(thisOrThat(currentReport ? thisOrThat(currentReport._liveTurn, currentReport.turn) : currentReport, turnNum), 1);
		if (theDraftsField(rawSaved, "forTurn") != null && theDraftsField(rawSaved, "forTurn") !== _liveTurn) {
			const _staleTurn = theDraftsField(rawSaved, "forTurn");
			console.warn("Discarding draft written for turn", _staleTurn, "— this is turn", _liveTurn);
			rawSaved = {};
			const _m = document.getElementById("orders-msg");
			if (_m) _m.innerHTML = String(kcHtml`<div class="msg-info">Your saved draft was written for Turn ${_staleTurn} and has been set aside — the GM has resolved that turn since. These orders start fresh.</div>`);
		}
	}
	const savedOrders = thisOrThat(theDraftsField(rawSaved, "orders"), rawSaved);
	_draftOrdersSnapshot = itOrAnEmptyRecord(savedOrders);
	const savedEncounterPlans = itOrAnEmptyRecord(theDraftsField(rawSaved, "encounterPlans"));
	const theDiplomacySaved = theDraftsField(rawSaved, "diplomacy");
	if (theDiplomacySaved && typeof theDiplomacySaved === "object") diploChoices = { ...theDiplomacySaved };
	if (theDraftsField(rawSaved, "callReckoning") === true) reckoningCall = true;
	const theDiscoveryChoicesSaved = theDraftsField(rawSaved, "discoveryChoices");
	if (theDiscoveryChoicesSaved && typeof theDiscoveryChoicesSaved === "object") discoveryChoices = { ...theDiscoveryChoicesSaved };
	setTimeout(renderDiscoveryChoices, 0);
	concedeGame = theDraftsField(rawSaved, "concede") === true;
	setTimeout(renderConcede, 0);
	setTimeout(renderReckoningOrders, 0);
	const _realmTop = kcHtml`<div id="orders-realm-top" class="orders-char-block" style="background:#fdf8ee">
      <div class="orders-char-head" style="background:#5c3d14">
        <button type="button" class="sec-toggle" aria-expanded="true" title="Minimise / maximise" onclick="toggleSection(this)">&#9662;</button>
        🏰 Realm — diplomacy &amp; concession
      </div>
      <div style="padding:6px 10px 10px">
        <div style="font-family:Cinzel,serif;font-size:.8rem;color:var(--ink);display:flex;align-items:center;gap:8px;padding:2px 0 4px">
          <span style="font-size:1rem">🤝</span><span style="font-weight:600">Diplomacy — declarations this turn</span></div>
        <div id="orders-diplomacy"></div>
        <div style="font-family:Cinzel,serif;font-size:.8rem;color:var(--ink);display:flex;align-items:center;gap:8px;padding:8px 0 4px;border-top:1px solid var(--parchment-dark);margin-top:8px">
          <span style="font-size:1rem">👑</span><span style="font-weight:600">Call the Reckoning</span></div>
        <div id="reckoning-wrap" style="font-size:.72rem"></div>
        <div style="font-family:Cinzel,serif;font-size:.8rem;color:var(--ink);display:flex;align-items:center;gap:8px;padding:8px 0 4px;border-top:1px solid var(--parchment-dark);margin-top:8px">
          <span style="font-size:1rem">🏳</span><span style="font-weight:600">Concede</span></div>
        <div id="concede-wrap" style="font-size:.72rem"></div>
      </div>
    </div>`;
	const _orderChars = chars.filter((c) => c.alive !== false);
	const _reorderNote = _orderChars.length > 1 ? kcHtml`<div style="font-size:.72rem;color:var(--stone);padding:2px 2px 8px">Use the <strong>▲ ▼</strong> arrows on a hero's header to move them up or down this column — group your heroes however suits your planning. The arrangement is kept from turn to turn.</div>` : "";
	const theForm = String(kcHtml`${_realmTop}${discoveryChoiceBlockHTML()}${_reorderNote}${heirSelectorHTML(chars)}${_orderChars.map((c, _hi) => {
		const _hn = _orderChars.length;
		const hiredPh = c.hiredInPhase ?? -1;
		const savedEP = itOrAnEmptyRecord(thisOrThat(thisOrThat(theDraftsField(savedEncounterPlans, String(c.id)), c.encounterPlan), {
			tactics: ["ME"],
			notes: ""
		}));
		const currentTactics = theSavedList(thisOrThat(theDraftsField(savedEP, "tactics"), ["ME"]), "currentTactics.filter");
		const epOrdered = currentTactics.filter((t) => !String(t).toUpperCase().startsWith("CS:"));
		const epPreSchool = theSavedWords(thisOrThat(currentTactics.find((t) => String(t).toUpperCase().startsWith("CS:")), "")).slice(3).toLowerCase();
		return kcHtml`
    <div class="orders-char-block" data-hero="${c.id}">
      <div class="orders-char-head">
        <button type="button" class="sec-toggle" aria-expanded="true" title="Minimise / maximise this hero's orders" onclick="toggleSection(this)">&#9662;</button>
        ${c.isKing ? "👑" : "⚔"} ${c.name}
        ${hiredPh >= 0 ? kcHtml`<span style="background:#c8922a;color:#1a1208;font-size:.65rem;padding:1px 6px;border-radius:2px;margin-left:6px">Hired ${SEASONS[hiredPh]} — acts from ${SEASONS[hiredPh + 1] ?? "next turn"}</span>` : ""}
        <span style="margin-left:auto;font-size:.7rem;opacity:.85">📍 ${provLinkHtml(c.locationId, (c.locationName ?? "") || "?", "on-dark")} · Land: ${(c.effectiveSpeed ?? 0) || 3}/turn${(c.skills?.["march"] ?? 0) > 0 ? ` (March ${String(c.skills?.["march"])})` : ""}${c.effectiveSeaSpeed ? ` · Sea: ${String(c.effectiveSeaSpeed)}/turn${(c.skills?.["naval"] ?? 0) > 0 ? ` (Naval ${String(c.skills?.["naval"])})` : ""}` : ""}</span>
        <button type="button" class="hero-move hero-move-up" ${_hi === 0 ? "disabled" : ""} title="Move this hero up the orders column" onclick="moveHeroBlock(${kcArg(String(c.id))},-1)">&#9650;</button>
        <button type="button" class="hero-move hero-move-down" ${_hi >= _hn - 1 ? "disabled" : ""} title="Move this hero down the orders column" onclick="moveHeroBlock(${kcArg(String(c.id))},1)">&#9660;</button>
      </div>
      <div style="padding:5px 10px 6px;background:#fdf5e0;border-bottom:1px solid var(--parchment-dark);font-size:.76rem;display:flex;flex-wrap:wrap;gap:8px;line-height:1.6">
        <span style="flex-basis:100%;width:100%;color:var(--stone)">${formatRace(c.race)} · ${(c.alignment ?? "") || "—"} · ${(c.temper ?? "") || "—"}</span>
        <span><strong>HP:</strong> ${thisOrThat(c.hp, "?")}/${thisOrThat(c.maxHp, "?")}</span>
        ${skillRowHTML(c, "inline")}
        ${(() => {
			const armies = c.armies ?? [];
			if (armies.length === 0) return kcHtml`<span style="color:#aaa">No armies</span>`;
			return armies.map((a) => {
				const { req, effDru, shortfall } = druidNeedP(a, c);
				const penalty = shortfall > 0 ? kcHtml` <span style="color:var(--crimson);font-size:.7rem">−${shortfall * 20}% str (Druid ${effDru}/${req})</span>` : "";
				return kcHtml`<div style="flex-basis:100%;width:100%;color:var(--crimson)">${unitEmoji(a.type)} ${armyLabel(a)}${penalty}</div>`;
			});
		})()}
        ${itemsForDisplayP(c).map((itHeld) => {
			const it = thereForItsField(itHeld, "name");
			return kcHtml`<div style="flex-basis:100%;width:100%;color:var(--item-ink);font-weight:600">${itemAcquiredTagP(it)}🔮 ${itemLoreTip(it, it.name)}${itemTierTagP(it)}${itemBoundTag(it, c)}${itemUsableBy(it, c) ? itemSlotTag(it, c) : ""}${it.desc ? kcHtml` <span style="color:var(--item-desc);font-weight:400">(${it.desc})</span>` : ""}</div>`;
		})}
      </div>
      <div class="orders-char-body">
        ${SEASONS.map((season, ph) => {
			const locked = hiredPh >= 0 && ph <= hiredPh;
			const saved = itOrAnEmptyRecord(theDraftsField(thisOrThat(theDraftsField(savedOrders, String(c.id)), []), String(ph)));
			if (locked) return kcHtml`<div class="phase-order" style="opacity:.45;pointer-events:none">
              <div class="phase-label">${season}</div>
              <div style="font-size:.78rem;color:var(--stone);font-style:italic;grid-column:2/-1;padding:5px 0">
                (Not yet hired this phase)
              </div>
            </div>`;
			return kcHtml`<div class="phase-order">
            <div class="phase-label">${season}</div>
            <select id="po-action-${c.id}-${ph}" onchange="onActionChange(${kcArg(String(c.id))},${kcArg(ph)},${kcArg(chars.indexOf(c))})">
              <option value="">— Choose —</option>
              ${actionsFor(c).map((a) => kcHtml`<option value="${a}" ${theDraftsField(saved, "action") === a ? "selected" : ""}>${a}</option>`)}
            </select>
            <div id="po-target-wrap-${c.id}-${ph}" style="position:relative">
              ${buildTargetField(c, ph, theSavedOrderAsTheFieldReadsIt(saved))}
            </div>
          </div>`;
		})}

        <!-- Encounter Plan -->
        <div style="margin-top:10px;padding:8px;background:#fdf5e0;border:1px solid #c8922a;border-radius:2px">
          <div style="font-family:'Cinzel',serif;font-size:.72rem;color:#5a4208;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">
            ⚔ Encounter Plan <span style="font-weight:normal;font-family:serif;text-transform:none;letter-spacing:0;font-size:.75rem;color:#3a3224">— used when searching lairs or in random encounters</span>
          </div>
          <div style="font-size:.78rem;color:var(--stone);margin-bottom:6px">
            Drag a tactic (or use ▲ ▼) to reorder. The plan is executed in order until the encounter ends. If you run out of tactics, Melee is used.
          </div>
          <div id="ep-list-${c.id}" style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px"
            ondragover="event.preventDefault()"
            ondrop="epDropTactic(event,${kcArg(String(c.id))})">
            ${epOrdered.map((t, i) => epRowHtml(String(c.id), theSavedWords(t), i, epOrdered.length))}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${ENCOUNTER_TACTICS.filter((t) => t.code !== "CS" && !t.retired).map((t) => {
			const noThief = t.code === "ST" && ((c.skills?.["thief"] ?? 0) || 0) < 1 && !skillsUnseenP(c);
			return kcHtml`<button onclick="addEncounterTactic(${kcArg(String(c.id))},${kcArg(t.code)})" ${noThief ? "disabled" : ""}
              style="font-size:.7rem;padding:3px 8px;border:1px solid ${noThief ? "#ddd" : "var(--stone)"};background:${noThief ? "#f0f0f0" : "var(--parchment-dark)"};color:${noThief ? "#bbb" : "inherit"};cursor:${noThief ? "not-allowed" : "pointer"};border-radius:2px"
              title="${noThief ? "Requires Thief skill (level 1+)" : t.label}">+ ${t.code}</button>`;
		})}
          </div>
          <input type="hidden" id="ep-tactics-${c.id}" value="${epOrdered.join(",")}">

          <!-- Pre-battle magic (army battles) — separate from the round-by-round encounter tactics -->
          <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #d8c48a">
            <div style="font-family:'Cinzel',serif;font-size:.68rem;color:#5a4208;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">
              ✨ Pre-battle magic <span style="font-weight:normal;font-family:serif;text-transform:none;letter-spacing:0;font-size:.72rem;color:#3a3224">— one random spell cast in army battles (not encounters)</span>
            </div>
            <input type="hidden" id="ep-preschool-${c.id}" value="${epPreSchool || ""}">
            <div id="ep-preschool-display-${c.id}" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"></div>
          </div>

          <!-- Duel stance (army battles) — sits beside pre-battle magic, as both are battle-only -->
          <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #d8c48a">
            <div style="font-family:'Cinzel',serif;font-size:.68rem;color:#5a4208;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">
              🤺 Duel stance <span style="font-weight:normal;font-family:serif;text-transform:none;letter-spacing:0;font-size:.72rem;color:#3a3224">— single combat at the start of an army battle (not encounters)</span>
            </div>
            <select id="ep-duel-${c.id}" style="font-size:.8rem;width:100%">
              ${DUEL_STANCES.map((d) => kcHtml`<option value="${d.code}"${thisOrThat(theDraftsField(savedEP, "duelStance"), "refuse") === d.code ? " selected" : ""}>${d.label}</option>`)}
            </select>
            <div style="font-size:.68rem;color:#2f281c;margin-top:2px">
              A refused challenge costs the refusing commander's force <strong>20% strength</strong>. So does losing the duel — whether by falling or by breaking off.
            </div>
          </div>
          ${report.kingdom?.alignment === "Evil" ? kcHtml`
          <!-- EVIL — conquest doctrine: Terror (loot + fear) or Enslave (chained garrisons) -->
          <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #d8c48a">
            <div style="font-family:'Cinzel',serif;font-size:.68rem;color:#7a1010;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">
              ⛓ Conquest doctrine <span style="font-weight:normal;font-family:serif;text-transform:none;letter-spacing:0;font-size:.72rem;color:#3a3224">— how ${c.name} treats the conquered</span>
            </div>
            <select id="ep-evilmode-${c.id}" style="font-size:.8rem;width:100%">
              <option value="terror" ${thisOrThat(theDraftsField(savedEP, "evilMode"), "terror") === "terror" ? "selected" : ""}>Terror — plunder 50% of the province's tax; decisive wins spread Terror (−10% to the next defenders)</option>
              <option value="enslave" ${thisOrThat(theDraftsField(savedEP, "evilMode"), "terror") === "enslave" ? "selected" : ""}>Enslave — no plunder; a free Green native garrison unit is pressed into service, but the province pays −1 tax for 3 turns (humanoid provinces only)</option>
            </select>
          </div>` : ""}

          <div style="margin-top:6px">
            <label style="font-size:.72rem">Describe your battlecry:</label>
            <input type="text" id="ep-notes-${c.id}" value="${thisOrThat(theDraftsField(savedEP, "notes"), "")}"
              placeholder="e.g. For glory and the fallen — none shall pass!"
              style="font-size:.8rem;margin-top:2px">
            <div style="font-size:.68rem;color:#2f281c;margin-top:2px">Shouted at any enemy — monster or rival — as combat begins.</div>
          </div>
        </div>

      </div>
    </div>`;
	})}`);
	theElementWithTheId("orders-form", HTMLElement).innerHTML = theForm;
	renderDiplomacy(report);
	renderConcede();
	const _liveChars = chars.filter((c) => c.alive !== false);
	for (let pass = 0; pass < 2; pass++) for (let ph = 0; ph < SEASONS.length; ph++) _liveChars.forEach((c) => {
		const hiredPh = c.hiredInPhase ?? -1;
		if (hiredPh >= 0 && ph <= hiredPh) return;
		const wrap = document.getElementById(`po-target-wrap-${String(c.id)}-${String(ph)}`);
		if (!wrap) return;
		const saved = itOrAnEmptyRecord(theDraftsField(thisOrThat(theDraftsField(savedOrders, String(c.id)), []), String(ph)));
		const action = thisOrThat(thisOrThat(theValueOfThePagesFieldOrNone(`po-action-${String(c.id)}-${String(ph)}`), theDraftsField(saved, "action")), "");
		if (!action) return;
		try {
			wrap.innerHTML = String(buildTargetField(c, ph, {
				...theSavedOrderAsTheFieldReadsIt(saved),
				action
			}));
		} catch (e) {
			console.warn("target field rebuild failed", c.id, ph, e);
		}
	});
	refreshExploreNotes();
	refreshAllMoveModeNotes();
	setTimeout(refreshAllOncePerTurn, 0);
	{
		const _savedRes = {};
		Object.entries(itOrAnEmptyRecord(savedOrders)).forEach(([k, v]) => {
			const m = /^resurrect_(\d+)_via_\d+_ph\d+$/.exec(k);
			if (!m || !Array.isArray(v)) return;
			const phases = v;
			const ep = itOrAnEmptyRecord(theDraftsField(savedEncounterPlans, k));
			_savedRes[String(m[1])] = {
				phases: phases.map((o) => thisOrThat(o, {})),
				tactics: theSavedList(thisOrThat(theDraftsField(ep, "tactics"), []), "(ep.tactics || []).join").join(","),
				notes: thisOrThat(theDraftsField(ep, "notes"), ""),
				duel: thisOrThat(theDraftsField(ep, "duelStance"), "")
			};
		});
		try {
			syncAllResurrectCards(_savedRes);
		} catch (e) {
			console.warn("resurrect card rebuild failed", e);
		}
	}
	try {
		syncAllPreOrderCards(savedOrders, savedEncounterPlans);
	} catch (e) {
		console.warn("pre-order card rebuild failed", e);
	}
	setTimeout(scheduleOrderLedgerP, 300);
	chars.filter((c) => c.alive !== false).forEach((c) => {
		renderPreSchool(c.id);
	});
	const btn = document.getElementById("submit-btn");
	if (btn instanceof HTMLButtonElement) {
		btn.disabled = false;
		btn.textContent = `Submit Orders for Turn ${inWords(thisOrThat(turnNum, 1))}`;
	}
}
function openPreSchoolPicker(charId) {
	const char = (currentReport?.characters ?? []).find((c) => String(c.id) === String(charId));
	const skills = char?.skills ?? {};
	const BATTLE_SCHOOLS = [
		["white", "White"],
		["elemental", "Elemental"],
		["psychic", "Psychic"],
		["necromancy", "Necromancy"]
	];
	const MAGIC_SCHOOLS_CS = /* @__PURE__ */ new Set([
		"white",
		"elemental",
		"psychic",
		"necromancy"
	]);
	const practisingCS = /* @__PURE__ */ new Set();
	for (let prevPh = 0; prevPh < 5; prevPh++) if (thisOrThat(theValueOfThePagesFieldOrNone(`po-action-${String(charId)}-${String(prevPh)}`), "") === "Practice Skill") {
		const prevTarget = getOrderTarget(charId, prevPh);
		if (prevTarget && MAGIC_SCHOOLS_CS.has(prevTarget)) practisingCS.add(prevTarget);
	}
	const _csUnknown = skillsUnseenP(char);
	const options = BATTLE_SCHOOLS.map(([key, label]) => {
		const lvl = (skills[key] ?? 0) || 0;
		const practising = practisingCS.has(key) && lvl === 0;
		const known = _csUnknown || lvl >= 1 || practisingCS.has(key);
		return {
			key,
			label,
			lvl: _csUnknown ? null : lvl,
			practising: _csUnknown ? false : practising,
			known
		};
	}).filter((o) => o.known);
	if (options.length === 0) {
		alert("This character knows no battle-magic school (White, Elemental, Psychic or Necromancy).\n\nTip: Practise one of these schools earlier in your orders to unlock it.");
		return;
	}
	const disp = document.getElementById(`ep-preschool-display-${String(charId)}`);
	if (!disp) return;
	const existingS = document.getElementById(`ep-school-picker-${String(charId)}`);
	if (existingS) existingS.remove();
	const spicker = document.createElement("div");
	spicker.id = `ep-school-picker-${String(charId)}`;
	spicker.style.cssText = "background:#fff8e8;border:1px solid #c8922a;border-radius:3px;padding:8px 10px;margin:4px 0;flex-basis:100%";
	spicker.innerHTML = String(kcHtml`<div style="font-family:Cinzel,serif;font-size:.7rem;color:#5a4208;margin-bottom:6px">Choose a school — a random battle spell from it is cast in the pre-battle magic phase:${_csUnknown ? kcHtml`<div style="font-weight:normal;font-family:serif;color:var(--stone);font-size:.68rem;margin-top:3px">All four are offered — ${(char?.name ?? "") || "this hero"}’s training is not known to you, and a school they never learned yields no spell.</div>` : ""}</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px">
      ${options.map((o) => kcHtml`<button onclick="confirmEPSchool(${kcArg(String(charId))},${kcArg(o.key)})"
          style="font-size:.75rem;padding:4px 9px;border:1px solid ${o.practising ? "#c8922a" : "var(--stone)"};background:${o.practising ? "#fffbef" : "#fdf8ee"};cursor:pointer;border-radius:2px">
          ${o.label}${o.lvl == null && !o.practising ? "" : kcHtml` <span style="color:var(--stone);font-size:.63rem">(${o.practising ? "practising" : "Lv " + String(o.lvl)})</span>`}
        </button>`)}
      <button onclick="document.getElementById(${kcArg(`ep-school-picker-${String(charId)}`)}).remove()"
        style="font-size:.75rem;padding:4px 9px;border:1px solid var(--stone);background:#f0e8d8;cursor:pointer;border-radius:2px;color:var(--stone)">Cancel</button>
    </div>`);
	disp.after(spicker);
}
function clearPreSchool(charId) {
	const hidden = document.getElementById(`ep-preschool-${String(charId)}`);
	if (hidden instanceof HTMLInputElement) hidden.value = "";
	const picker = document.getElementById(`ep-school-picker-${String(charId)}`);
	if (picker) picker.remove();
	renderPreSchool(charId);
}
function addEncounterTactic(charId, code) {
	const hidden = document.getElementById(`ep-tactics-${String(charId)}`);
	if (!(hidden instanceof HTMLInputElement)) return;
	const current = hidden.value ? hidden.value.split(",").filter(Boolean) : [];
	if (current.length >= 6) {
		alert("Maximum 6 tactics per encounter plan.");
		return;
	}
	if (code === "CA") {
		const char = (currentReport?.characters ?? []).find((c) => String(c.id) === String(charId));
		const MAGIC_SCHOOLS_EP = new Set(KC_MAGIC_SCHOOLS);
		const practisingSchoolsEP = /* @__PURE__ */ new Set();
		for (let prevPh = 0; prevPh < 5; prevPh++) if (thisOrThat(theValueOfThePagesFieldOrNone(`po-action-${String(charId)}-${String(prevPh)}`), "") === "Practice Skill") {
			const prevTarget = getOrderTarget(charId, prevPh);
			if (prevTarget && MAGIC_SCHOOLS_EP.has(prevTarget)) practisingSchoolsEP.add(prevTarget);
		}
		const epHidden = document.getElementById(`ep-tactics-${String(charId)}`);
		const existingTactics = theSavedWords(thisOrThat(epHidden ? theValueOfAField(epHidden) : void 0, "")).split(",").filter(Boolean);
		const epSchoolCount = {};
		const epSpellsUsed = /* @__PURE__ */ new Set();
		existingTactics.forEach((t) => {
			if (!t.startsWith("CA:")) return;
			const spellName = t.slice(3);
			epSpellsUsed.add(spellName);
			const school = SPELL_TO_SCHOOL[spellName];
			if (school) epSchoolCount[school] = ((epSchoolCount[school] ?? 0) || 0) + 1;
		});
		const _epUnknown = skillsUnseenP(char);
		const availSpells = _epUnknown ? Object.entries(ENCOUNTER_VALID).flatMap(([school, spells]) => spells.map((s) => {
			const limit = combatSpellsAllowedPerSchoolEachFight(1);
			const used = (epSchoolCount[school] ?? 0) || 0;
			const isDuplicate = epSpellsUsed.has(s);
			const atSchoolLimit = used >= limit;
			return {
				school,
				spell: s,
				level: null,
				practising: false,
				blocked: isDuplicate || atSchoolLimit,
				reason: isDuplicate ? "already in plan" : atSchoolLimit ? `school limit ${String(used)}/${String(limit)}` : "",
				used,
				limit
			};
		})) : Object.entries(ENCOUNTER_VALID).filter(([school]) => effMagicLvl(char, school) >= 1 || practisingSchoolsEP.has(school)).flatMap(([school, spells]) => spells.map((s) => {
			const lvl = effMagicLvl(char, school);
			const practisingThis = practisingSchoolsEP.has(school);
			const practising = practisingThis && lvl === 0;
			const limit = combatSpellsAllowedPerSchoolEachFight(practisingThis ? Math.min(5, lvl + 1) : lvl);
			const used = (epSchoolCount[school] ?? 0) || 0;
			const isDuplicate = epSpellsUsed.has(s);
			const atSchoolLimit = used >= limit;
			return {
				school,
				spell: s,
				level: lvl,
				practising,
				blocked: isDuplicate || atSchoolLimit,
				reason: isDuplicate ? "already in plan" : atSchoolLimit ? `school limit ${String(used)}/${String(limit)}` : "",
				used,
				limit
			};
		}));
		if (availSpells.length === 0) {
			alert("This character has no magic skills and cannot cast spells in encounters.\n\nTip: if you set a Practice Skill order for a magic school earlier in your orders, those spells will become available here.");
			return;
		}
		const _epUnknownNote = _epUnknown ? kcHtml`<div style="font-size:.68rem;color:var(--stone);margin-top:6px">Every school is offered — ${(char?.name ?? "") || "this hero"}’s training is not known to you, and a spell from a school they never learned simply fails when the encounter comes.</div>` : "";
		const wrap = document.getElementById(`ep-list-${String(charId)}`);
		if (!wrap) return;
		const existing = document.getElementById(`ep-spell-picker-${String(charId)}`);
		if (existing) existing.remove();
		const picker = document.createElement("div");
		picker.id = `ep-spell-picker-${String(charId)}`;
		picker.style.cssText = "background:#fff8e8;border:1px solid #c8922a;border-radius:3px;padding:8px 10px;margin:4px 0";
		const _epTally = {};
		availSpells.forEach((x) => {
			_epTally[x.school] ??= {
				limit: x.limit,
				used: x.used
			};
		});
		const _epTallyHtml = kcJoinP(Object.entries(_epTally).map(([sch, t]) => {
			const full = t.used >= t.limit;
			return kcHtml`<span style="font-size:.62rem;padding:1px 6px;border-radius:2px;background:${full ? "#f2dede" : "#e8f0e0"};color:${full ? "#a33" : "#3a5a2a"};border:1px solid ${full ? "#d8a0a0" : "#b8c9a8"}">${(theSkillsNames[sch] ?? "") || sch} ${t.used}/${t.limit}${full ? " — full" : ""}</span>`;
		}), " ");
		picker.innerHTML = String(kcHtml`<div style="font-family:Cinzel,serif;font-size:.7rem;color:#5a4208;margin-bottom:4px">Choose a combat spell — casts used this encounter, per school:</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:7px">${_epTallyHtml}</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">
        ${availSpells.map(({ school, spell, level, practising, blocked, reason, used, limit }) => {
			const limitNote = ` ${String(used)}/${String(limit)}`;
			const labelExtra = practising ? kcHtml`<span style="color:#5a3f08;font-size:.63rem">(${(theSkillsNames[school] ?? "") || school} — practising${limitNote})</span>` : kcHtml`<span style="color:${blocked ? "#bbb" : "var(--stone)"};font-size:.63rem">(${(theSkillsNames[school] ?? "") || school}${level == null ? "" : " " + String(level)}${limitNote})</span>`;
			const blockedNote = blocked ? kcHtml`<span style="color:#c44;font-size:.6rem"> ✗ ${reason}</span>` : "";
			return blocked ? kcHtml`<button disabled style="font-size:.75rem;padding:4px 9px;border:1px solid #ddd;background:#f5f5f5;color:#bbb;border-radius:2px;cursor:not-allowed">
                ${spell} ${labelExtra}${blockedNote}
              </button>` : kcHtml`<button onclick="confirmEPSpell(${kcArg(String(charId))},${kcArg(spell)},${kcArg(school)},${kcArg(level)},${kcArg(limit)})" 
                style="font-size:.75rem;padding:4px 9px;border:1px solid ${practising ? "#c8922a" : "var(--stone)"};background:${practising ? "#fffbef" : "#fdf8ee"};cursor:pointer;border-radius:2px">
                ${spell} ${labelExtra}
              </button>`;
		})}
        <button onclick="document.getElementById(${kcArg(`ep-spell-picker-${String(charId)}`)}).remove()" 
          style="font-size:.75rem;padding:4px 9px;border:1px solid var(--stone);background:#f0e8d8;cursor:pointer;border-radius:2px;color:var(--stone)">
          Cancel
        </button>
      </div>
      ${practisingSchoolsEP.size > 0 ? kcHtml`<div style="font-size:.68rem;color:#5a3f08;margin-top:6px">⚠ Spells marked "practising, may unlock" are only available if your practice order succeeds this turn.</div>` : ""}${_epUnknownNote}`);
		wrap.after(picker);
		return;
	}
	if (code === "ST") {
		const char = (currentReport?.characters ?? []).find((c) => String(c.id) === String(charId));
		if (effSkillP(char, "thief") < 1 && !skillsUnseenP(char)) {
			alert("This character has no Thief skill and cannot attempt to steal.\n\nThe Steal tactic requires at least Thief level 1. Practise the Thief skill first.");
			return;
		}
	}
	current.push(code);
	hidden.value = current.join(",");
	refreshEncounterPlan(charId, current);
}
function confirmEPSpell(charId, spell, school, level, limitShown) {
	const picker = document.getElementById(`ep-spell-picker-${String(charId)}`);
	if (picker) picker.remove();
	const hidden = document.getElementById(`ep-tactics-${String(charId)}`);
	if (!(hidden instanceof HTMLInputElement)) return;
	const current = hidden.value ? hidden.value.split(",").filter(Boolean) : [];
	if (current.length >= 6) {
		alert("Maximum 6 tactics in an encounter plan.");
		return;
	}
	if (current.includes(`CA:${spell}`)) {
		alert(`${spell} is already in your encounter plan. The same combat spell cannot be cast more than once per encounter.`);
		return;
	}
	const limit = limitShown != null && isFinite(limitShown) ? limitShown : combatSpellsAllowedPerSchoolEachFight(level ?? 0);
	if (current.filter((t) => t.startsWith("CA:") && SPELL_TO_SCHOOL[t.slice(3)] === school).length >= limit) {
		alert(`${(theSkillsNames[school] ?? "") || school}${(level ?? 0) > 0 ? ` Lv${String(level)}` : ""}: you can cast at most ${String(limit)} combat spell${limit !== 1 ? "s" : ""} of this school per encounter. Remove one first.`);
		return;
	}
	current.push(`CA:${spell}`);
	hidden.value = current.join(",");
	refreshEncounterPlan(charId, current);
}
function confirmEPSchool(charId, school) {
	const picker = document.getElementById(`ep-school-picker-${String(charId)}`);
	if (picker) picker.remove();
	const hidden = document.getElementById(`ep-preschool-${String(charId)}`);
	if (!(hidden instanceof HTMLInputElement)) return;
	hidden.value = school;
	renderPreSchool(charId);
}
function epMoveTactic(charId, idx, dir) {
	const hidden = document.getElementById(`ep-tactics-${String(charId)}`);
	if (!(hidden instanceof HTMLInputElement)) return;
	const tactics = hidden.value ? hidden.value.split(",").filter(Boolean) : [];
	const j = idx + dir;
	if (idx < 0 || idx >= tactics.length || j < 0 || j >= tactics.length) return;
	const theOne = tactics[idx];
	const theOther = tactics[j];
	if (theOne === void 0 || theOther === void 0) return;
	[tactics[idx], tactics[j]] = [theOther, theOne];
	hidden.value = tactics.join(",");
	refreshEncounterPlan(charId, tactics);
}
function epDragStart(event, charId, fromIdx) {
	thereForItsField(event.dataTransfer, "setData").setData("text/plain", JSON.stringify({
		charId: String(charId),
		fromIdx
	}));
	thereForItsField(event.dataTransfer, "effectAllowed").effectAllowed = "move";
}
function epDropTactic(event, charId, toIdx) {
	event.preventDefault();
	let data;
	try {
		data = JSON.parse(thereForItsField(event.dataTransfer, "getData").getData("text/plain"));
	} catch {
		return;
	}
	if (inWords(theDraftsField(data, "charId")) !== String(charId)) return;
	const fromIdx = theDraftsField(data, "fromIdx");
	const hidden = document.getElementById(`ep-tactics-${String(charId)}`);
	if (!(hidden instanceof HTMLInputElement)) return;
	const tactics = hidden.value ? hidden.value.split(",").filter(Boolean) : [];
	if (Number(fromIdx) < 0 || Number(fromIdx) >= tactics.length) return;
	toIdx ??= tactics.length - 1;
	if (fromIdx === toIdx) return;
	const moved = thereForItsField(tactics.splice(Number(fromIdx), 1)[0], "the tactic moved");
	tactics.splice(Math.min(toIdx, tactics.length), 0, moved);
	hidden.value = tactics.join(",");
	refreshEncounterPlan(charId, tactics);
}
function removeEncounterTactic(charId, idx) {
	const hidden = document.getElementById(`ep-tactics-${String(charId)}`);
	if (!(hidden instanceof HTMLInputElement)) return;
	const current = hidden.value ? hidden.value.split(",").filter(Boolean) : [];
	current.splice(idx, 1);
	hidden.value = current.join(",");
	refreshEncounterPlan(charId, current);
}
function onSpellChange(charId, ph, selectedSpell) {
	setTimeout(() => {
		syncResurrectCard();
	}, 0);
	const wrap = document.getElementById(`po-target-wrap-${String(charId)}-${String(ph)}`);
	if (!wrap) return;
	const char = (currentReport?.characters ?? []).find((c) => String(c.id) === String(charId)) ?? theEmptyHero();
	const liveAction = thisOrThat(theValueOfThePagesFieldOrNone(`po-action-${String(charId)}-${String(ph)}`), "Cast Spell");
	wrap.innerHTML = String(buildTargetField(char, ph, {
		action: liveAction === "Use Item" ? "Use Item" : "Cast Spell",
		target: selectedSpell
	}));
	if (liveAction === "Cast Spell") refreshLaterCastSpells(charId, ph);
}
async function allocateHeirSkill(charId, skill, delta) {
	if (!currentReport) return;
	const c = thereForItsField(currentReport.characters, "find").find((x) => x.id === charId);
	if (!c?._isHeir) return;
	const theSkills = c.skills ?? {};
	c.skills = theSkills;
	const cur = (theSkills[skill] ?? 0) || 0;
	const added = heirAddedTo(c, skill);
	if ((delta || 0) > 0) {
		if (heirTotalAdded(c) >= 4) return;
		if (added >= 2) return;
		theSkills[skill] = cur + 1;
	} else {
		if (added <= 0) return;
		theSkills[skill] = cur - 1;
		if (theSkills[skill] === 0) Reflect.deleteProperty(theSkills, skill);
	}
	c._pendingSkillAllocation = heirPointsRemaining(c);
	await doSaveOrders();
	buildOrdersForm(currentReport.characters, false, currentGamePlayer?.orders, thisOrThat(thisOrThat(currentReport._liveTurn, currentReport.turn), 1));
}
async function reviseOrders() {
	const gp = currentGamePlayer;
	if (!gp) return;
	const { error } = await thePagesDb.theOrders.reopenThisRealmsOrders(String(gp.id));
	if (error) {
		console.error(error);
		return;
	}
	setOrdersSubmittedUI(false);
	buildOrdersForm(currentReport?.characters ?? [], false, gp.orders, thisOrThat(currentReport?.turn, 1));
	theElementWithTheId("orders-msg", HTMLElement).innerHTML = "<div class=\"msg-warning\">✏ Revising orders — your previous orders are pre-filled. Make changes and resubmit.</div>";
	theElementWithTheId("submit-btn", HTMLButtonElement).disabled = false;
	theElementWithTheId("submit-btn", HTMLButtonElement).textContent = `Resubmit Orders for Turn ${inWords(thisOrThat(thisOrThat(currentReport?._liveTurn, currentReport?.turn), 1))}`;
}
// src/ui/player/report.ts
async function openReport(gamePlayerId) {
	currentGamePlayerId = gamePlayerId;
	try {
		history.replaceState(null, "", location.pathname + location.search + "#game=" + encodeURIComponent(gamePlayerId));
	} catch (e) {}
	show("sec-report");
	{
		const _ntb = document.getElementById("new-turn-banner");
		if (_ntb) _ntb.style.display = "none";
	}
	document.getElementById("report-title").textContent = "Loading…";
	const { data: gp, error } = await thePagesDb.thePlayersRealms.thisRealm(gamePlayerId);
	if (error) {
		document.getElementById("report-title").textContent = "Error: " + error.message;
		return;
	}
	const { data: g, error: gErr } = await thePagesDb.thePlayersGames.thisGameForItsReport(gp.game_id);
	if (gErr) {
		document.getElementById("report-title").textContent = "Error loading game: " + gErr.message;
		return;
	}
	gp.games = g;
	currentGamePlayer = gp;
	currentGamePlayer._liveTurn = g.turn || 1;
	const report = typeof gp.turn_report === "string" ? JSON.parse(gp.turn_report) : gp.turn_report || {};
	currentReport = report;
	currentReport._liveTurn = g.turn || 1;
	try {
		const _draft = typeof gp.orders === "string" ? JSON.parse(gp.orders || "{}") : gp.orders || {};
		const _ks = _draft && _draft.kingSkills;
		(currentReport.characters || []).forEach((c) => {
			if (!c._isHeir) return;
			const a = _ks && _ks[c.id];
			if (a) {
				if (a.base) c._heirBase = { ...a.base };
				if (a.skills) c.skills = { ...a.skills };
				if (typeof a.pending === "number") c._pendingSkillAllocation = a.pending;
				if (a.name) c.name = a.name;
				if (a.temper) c.temper = a.temper;
			}
			if (!c._heirBase) c._heirBase = { ...c.skills || {} };
		});
	} catch (e) {}
	diploChoices = {};
	discoveryChoices = {};
	reckoningCall = false;
	concedeGame = false;
	viewingReport = report;
	initMessaging(gp.game_id, gp.player_index, report, g).catch((e) => console.warn("Dispatches:", e));
	const liveTurn = g.turn != null ? g.turn : 1;
	const resolvedTurn = Math.max(0, (g.turn || 1) - 1);
	document.getElementById("report-title").textContent = `${g.name} — Turn ${liveTurn}`;
	document.getElementById("orders-turn-num").textContent = Math.max(1, liveTurn);
	const navEl = document.getElementById("turn-nav-btns");
	if (navEl) {
		navEl.innerHTML = "";
		if ((g.turn || 0) >= 1) {
			for (let d = 0; d <= resolvedTurn; d++) {
				const btn = document.createElement("button");
				const lbl = snapshotTurnLabel(d);
				btn.textContent = `T${lbl}`;
				btn.dataset.turn = d;
				btn.title = d === 0 ? `Turn ${lbl} — the founding report, your starting position` : `Turn ${lbl} — the report you received then`;
				btn.onclick = (() => {
					const turn = d;
					const pi = gp.player_index;
					const cur = resolvedTurn;
					return () => turn === cur ? returnToCurrentReport() : loadPastReport(gp.game_id, pi, turn);
				})();
				navEl.appendChild(btn);
			}
			navEl.dataset.resolved = resolvedTurn;
			viewedTurn = null;
			refreshTurnNavHighlight();
		}
	}
	document.getElementById("prev-report-banner").style.display = "none";
	const submitted = gp.orders_submitted;
	document.getElementById("report-status-pill").innerHTML = submitted ? "<span class=\"pill pill-blue\">✓ Orders submitted</span>" : g.status === "active" ? "<span class=\"pill pill-amber\">⏳ Orders needed</span>" : "<span class=\"pill pill-green\">Waiting to start</span>";
	{
		const _dl = document.getElementById("turn-deadline-line");
		if (_dl) {
			const t = turnDeadlineText(g);
			_dl.style.display = t ? "block" : "none";
			_dl.innerHTML = t;
		}
	}
	if (report.waitingForTurn0 || g.turn === 0) {
		document.getElementById("report-kingdom").innerHTML = "<div class=\"msg-info\">The GM is setting up the game world. Check back soon — your turn report will appear here once Turn 0 has been run.</div>";
		document.getElementById("report-provinces").innerHTML = "";
		{
			const _ri = document.getElementById("report-intel");
			if (_ri) _ri.innerHTML = "";
		}
		{
			const _of = document.getElementById("report-other-forces");
			if (_of) _of.innerHTML = "";
			const _lr = document.getElementById("report-lairs");
			if (_lr) _lr.innerHTML = "";
		}
		document.getElementById("orders-card").style.display = "none";
		refreshOrdersVisibility(false);
		return;
	}
	document.getElementById("orders-card").style.display = "block";
	refreshOrdersVisibility(true);
	currentGamePlayer = gp;
	buildOrdersForm(report.characters || [], gp.orders_submitted, gp.orders, g.turn);
	renderReportView(report);
}
function renderReportView(report) {
	buildChronicle(report.lastTurnLog || [], report.characters || []);
	const kingdom = report.kingdom || {};
	const chars = report.characters || [];
	const taxIncome = kingdom.taxIncome || 0;
	const armyWages = kingdom.armyWages || 0;
	const heroWages = kingdom.heroWages || 0;
	const netIncome = taxIncome - armyWages - heroWages;
	const playerAlignment = kingdom.alignment || "Neutral";
	const alignSummary = {
		Divine: `Your realm walks in the light of the divine. All heroes recover twice as much HP when they Rest (60% of maximum HP rather than the usual 30%). Your White Magic spells draw on deeper power — Bless Province adds 80% of a province's tax value rather than 60%, and when the KING works the blessing in person, the province yields a full 100% more. Should any of your characters — king or hero — fall, divine grace will return them to life after one full turn in death, restored to half health but stripped of armies and items — but ONLY upon consecrated ground: they rise in the nearest consecrated province you still hold, and the miracle spends that province's consecration. If the realm holds no consecrated province when the time comes, the grace is lost (a fallen king is then succeeded by an heir). Consecrate: your king may sanctify owned provinces, up to his White skill level at once (not the home province or its neighbours, and never two side by side — the crown's hearth was already anointed at the coronation, and the gods bid you carry the light outward). Consecrated ground yields +50% tax, its defenders are twice as likely to fight with fanatical zeal, Undead and Evil hosts attacking it fight at −15%, and it is where your fallen are restored. Guard it: a consecrated province that is captured loses its consecration at once, and each unit of the army that takes it has a 50% chance to gain an experience level. Your armies fight with a 50% chance of fanatical zeal — the highest of any alignment. But beware: your court is priced at the far end of the alignment spectrum — dark-hearted heroes cost dearly, and Undead heroes will never serve you at all.`,
		Good: `Your realm is known for honour and fellowship. Your armies fight with a solid 40% chance of fanaticism — second only to the Divine. Banner of Fellowship: allied contingents converging on the same battle unify 15% more readily under your honourable cause. Righteous Defence: any army defending a province you own fights at +10% — your soldiers know the ground they hold is held justly. Call to Arms: once per turn your king may summon the folk of any owned humanoid province — wherever they happen to be — and a free Green garrison unit of that province's native type musters to defend it. Sitting close to the centre of the alignment spectrum, most wandering heroes serve you cheaply.`,
		Druidic: `Your realm is bound to the living world. Your king commands Druid 1 from the outset, and all Creature armies — Thunderbirds, Forest Ents, Great Bears, Stone Giants, Unicorn Herd, Mammoth Host, Crimson Rocs, Whale Cohort and Great Turtles — follow your heroes without any Druid skill requirement, though a hero leads at most as many Creature and Monster units as his Druid level. There is always at least one Creature province within two provinces of your home. Home of the Wild: in forest and jungle, your Creature armies fight at ×1.5 strength. Your armies fight with a 20% chance of fanaticism, and your central place on the spectrum keeps most heroes affordable.`,
		Neutral: `Your realm prizes pragmatism above all. Province tax income flows 20% richer than other realms — traders and merchants gravitate toward your neutral courts. Standing at the exact centre of the alignment spectrum, EVERY wandering hero costs you at most 3g/turn — and most cost the base 2g — the cheapest court in the world. Mercenary bands cost 2g less to hire than the going rate. Broker: your king trades in influence rather than marches — they may hire any wandering hero the realm can see without leaving their hall (they serve from wherever they stand), or buy a guaranteed full Spy report on any province the realm has ever seen for 2g. Your scholars are twice as effective — each level of Sage skill doubles your chance of making a discovery. Your armies fight with a 10% chance of fanaticism.`,
		Pagan: `Your realm draws on ancient and forgotten powers. Your king walks the wild places from birth — Explorer 1 from the outset. Perform Rite at discovered ritual sites (now found across much of the world, commonest in wild Creature and Monster country): the Wild Hunt binds two of the province's creatures to your host as Veterans until the end of the following turn, and a Blood Offering sacrifices units to empower an equal number of others (+2 quality tiers each, to Elite). Blood Harvest: +1g per enemy unit your characters destroy in victory. Your armies fight with a 15% chance of fanaticism.`,
		Evil: `Your realm rules through fear and domination. Your king commands Druid 1 from the outset, and all Monster armies follow your heroes without any Druid skill requirement (every level of Druid a commander does hold adds +20% to them), though a hero leads at most as many Creature and Monster units as his Druid level. You begin beside a Monster province you can lead from turn one, and there is always at least one within two provinces of your home. When your forces win decisively, a Terror effect lingers — any army defending that province in the next battle fights at −10% strength, broken by what they witnessed — and by Reign of Fear your Monsters fight at ×1.5 when they attack a province your own Terror still grips. Monster armies — Cave Trolls, Manticore Pride, Basilisk Brood, Sea Giants, Eldritch Kraken, Elder Dragons, Titan Warbeasts, Dread Hydras and Shark Shoals — fight with savage fury under your command — a host with any of them in it fights at ×1.25 in every battle (no roll; it does not stack with zeal, the stronger counts). When one of your heroes conquers a province, he treats it by the conquest doctrine set on his orders: Terror plunders 50% of the province's tax value in gold at once; Enslave takes no gold but presses the beaten folk into a free Green garrison unit, and the province pays 1g less tax for 3 turns (only where the folk are humanoid: anywhere else, he plunders). Your armies fight with a 25% base chance of fanaticism.`,
		Undead: `Your realm defies death itself. Your king commands Necromancy 1 from the outset and begins with a unit of Skeletal Shieldwall Levies at their side. All skeletal armies under your banner are exempt from the Druid penalty, cost only 1g upkeep each, and fight with undying fanaticism in EVERY battle — ×1.5 (+50%) when the king leads them in person, ×1.3 (+30%) under any other commander — the whole host is lifted. Harvest the Field: any of your characters standing where armies have fallen may raise one grave as a Skeletal unit for 2g — no magic, no Necromancy skill, just corpse-carters and cold work. Deathless March: a force of skeletons alone can never be cut down in flight — with no line of retreat they simply stand and hold the ground, because the dead do not panic. Battlefield graves in your provinces decay at half the normal rate, preserving more fallen armies for the Skeletal Armies spell. But beware: your court is priced at the far end of the alignment spectrum — righteous heroes cost dearly, and Divine heroes will never serve you at all.`
	}[playerAlignment] || "";
	const alignColours = {
		Divine: "#c8922a",
		Good: "#2d6a2d",
		Druidic: "#1a5e1a",
		Neutral: "#555",
		Pagan: "#7a4a00",
		Evil: "#8a1c1c",
		Undead: "#3a1a6a"
	};
	const alignBanner = alignSummary ? kcHtml`
    <div style="background:#fdf8ee;border-left:4px solid ${alignColours[playerAlignment] || "#888"};padding:8px 12px;margin-bottom:10px;border-radius:0 3px 3px 0">
      <div style="font-family:'Cinzel',serif;font-size:.72rem;color:${alignColours[playerAlignment] || "#888"};text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;font-weight:700">${{
		Divine: "✨",
		Good: "⚔",
		Druidic: "🌿",
		Neutral: "⚖",
		Pagan: "🔥",
		Evil: "💀",
		Undead: "💀"
	}[playerAlignment] || ""} ${playerAlignment} Realm</div>
      <div style="font-size:.78rem;color:#444;line-height:1.5">${bulletizeDesc(alignSummary)}</div>
    </div>` : "";
	const cmGuide = playerAlignment === "Druidic" || playerAlignment === "Evil" ? kcHtml`
    <div style="font-size:.72rem;color:var(--stone);background:#f5f0e8;border:1px solid var(--stone);border-radius:2px;padding:5px 8px;margin-bottom:8px">
      ${playerAlignment === "Druidic" ? kcHtml`🌿 <strong>Druidic bonuses</strong> — <span style="color:#1d5a1d"><strong>[C] Creature</strong></span> armies get no Druid penalty and fight at ×1.5 in forest/jungle; every level of Druid your commander holds adds +20% to them. Your king starts with Druid +1.` : ""}
      ${playerAlignment === "Evil" ? kcHtml`💀 <strong>Evil bonuses</strong> — <span style="color:#701010"><strong>[M] Monster</strong></span> armies get no Druid penalty and lift the whole host to ×1.25 in every battle (not stacking with zeal); every level of Druid your commander holds adds +20% to them. Your king starts with Druid +1. On decisive wins: Terror effect, and Reign of Fear — your Monsters fight ×1.5 attacking ground your Terror grips. On province conquest, by each hero's doctrine: Terror plunders 50% of its tax; Enslave presses a free Green garrison unit, and the province pays 1g less tax for 3 turns.` : ""}
      <br><span style="color:#1d5a1d;font-weight:600">[C] Creatures:</span> Thunderbirds, Forest Ents, Great Bears, Stone Giants, Unicorn Herd, Mammoth Host, Crimson Rocs, Whale Cohort, Great Turtles
      ${playerAlignment === "Evil" ? kcHtml`<br><span style="color:#701010;font-weight:600">[M] Monsters:</span> Cave Trolls, Manticore Pride, Basilisk Brood, Sea Giants, Eldritch Kraken, Elder Dragons, Titan Warbeasts, Dread Hydras, Shark Shoals` : ""}
    </div>` : "";
	document.getElementById("report-kingdom").innerHTML = kcHtml`${alignBanner}${cmGuide}
    <div class="report-grid">
      <div class="stat-box"><div class="stat-label">Treasury</div><div class="stat-value">${kingdom.gold || 0}g</div></div>
      <div class="stat-box"><div class="stat-label">Tax Income</div><div class="stat-value">${taxIncome}g/turn</div>${(() => {
		const K = (k) => kingdom[k] || 0;
		const sage = kingdom.sageDiscG != null ? kingdom.sageDiscG : K("sdRecords") + K("sdAgri") + K("sdMining") + K("sdAqueduct") + K("sdCreed") + K("interestBonus");
		const bonuses = [
			[K("consecG"), "consecrated ground"],
			[K("neutralTradeBonus"), "Neutral trade"],
			[sage, "Sage Discoveries"],
			[K("sdGrand"), "Grand Design"],
			[K("taxBonus"), "magic items (tax bonus)"],
			[K("perProvBonus"), "Merchant's Ledger"],
			[K("thiefStipend"), "master Thief stipend"],
			[K("cutpurseG"), "the Cutpurse"],
			[K("championG"), "Champion of the People"],
			[K("castellanG"), "the Castellan"]
		].filter((b) => b[0] > 0);
		const eq = K("earthquakeReduction"), ens = K("enslaveReduction");
		const bonusSum = bonuses.reduce((a, b) => a + b[0], 0);
		const rawBase = kingdom.rawTaxBase != null ? kingdom.rawTaxBase : Math.max(0, taxIncome - bonusSum + eq + ens);
		const row = (txt, col) => kcHtml`<div style="font-size:.62rem;color:${col};margin-top:1px;line-height:1.3">${txt}</div>`;
		return kcHtml`${[
			row(`Base province tax: ${rawBase}g`, "var(--stone)"),
			bonuses.map((b) => row(`+${b[0]}g ${b[1]}`, "#2d7a2d")),
			bonuses.length ? "" : row("no bonuses", "var(--stone)"),
			K("taxBonusCutG") > 0 ? row(`−${K("taxBonusCutG")}g of item tax gold above the ${K("taxBonusCapG")}g cap (5% of base tax)`, "#8a6d1f") : ""
		]}${eq > 0 ? row(`−${eq}g lost to earthquake damage`, "#c00") : ""}${ens > 0 ? row(`−${ens}g enslaved provinces seethe`, "#c00") : ""}${kcHtml`<div style="font-size:.6rem;color:var(--stone);margin-top:2px;line-height:1.3">projected for next turn — this turn's actual take is under Kingdom Events</div>`}`;
	})()}</div>
      <div class="stat-box"><div class="stat-label">Army Wages</div><div class="stat-value" style="color:${armyWages > 0 ? "#c00" : "inherit"}">${armyWages}g/turn</div>${(kingdom.hostLeaderG || 0) > 0 ? kcHtml`<div style="font-size:.62rem;color:#1d5a1d;margin-top:2px;line-height:1.3">after −${kingdom.hostLeaderG}g the Host-Leader</div>` : ""}${(kingdom.orcSpoilsG || 0) > 0 ? kcHtml`<div style="font-size:.62rem;color:#1d5a1d;margin-top:2px;line-height:1.3">after −${kingdom.orcSpoilsG}g Orcish war-spoils</div>` : ""}${kingdom.nextArmyWages != null && kingdom.nextArmyWages !== kingdom.armyWages ? kcHtml`<div style="font-size:.62rem;color:#2a2419;margin-top:2px;line-height:1.3">next turn: ${kingdom.nextArmyWages}g</div>` : ""}</div>
      <div class="stat-box"><div class="stat-label">Hero Wages</div><div class="stat-value" style="color:${heroWages > 0 ? "#c00" : "inherit"}">${heroWages}g/turn</div>${(kingdom.heroWageDisc || 0) > 0 ? kcHtml`<div style="font-size:.62rem;color:#1d5a1d;margin-top:2px;line-height:1.3">after −${kingdom.heroWageDisc}g wage discounts</div>` : ""}${kingdom.nextHeroWages != null && kingdom.nextHeroWages !== kingdom.heroWages ? kcHtml`<div style="font-size:.62rem;color:#2a2419;margin-top:2px;line-height:1.3">next turn: ${kingdom.nextHeroWages}g</div>` : ""}</div>
      <div class="stat-box"><div class="stat-label">Net Income</div><div class="stat-value" style="color:${netIncome >= 0 ? "#2d7a2d" : "#c00"}">${netIncome >= 0 ? "+" : ""}${netIncome}g/turn</div></div>
      <div class="stat-box"><div class="stat-label">Provinces</div><div class="stat-value">${(report.ownedProvinces || []).length}</div></div>
    </div>
    ${chars.filter((c) => c.alive !== false).map((c) => {
		const hpPct = dispFloor(c.hp / c.maxHp * 100) || 0;
		const skillRow = skillRowHTML(c, "inline");
		const effSpd = (c.armies || []).length === 0 ? 5 : c.effectiveSpeed != null ? c.effectiveSpeed : Math.min(...(c.armies || []).map((a) => a.speed || 3));
		return kcHtml`<div class="char-card">
        <div class="char-card-head">
          <span style="font-size:.9rem">${c.isKing ? "👑" : "⚔"}</span>
          <span class="cname">${c.name} ${c.isKing ? "(Your King)" : "(Hero)"}</span>
          <div class="char-hp-wrap"><div class="char-hp-bar" style="width:${hpPct}%"></div></div>
          <span style="font-size:.7rem;color:var(--stone)">HP ${c.hp}/${c.maxHp}</span>
        </div>
        <div class="char-detail" style="background:#fdf5e0;border:1px solid var(--parchment-dark);border-radius:2px;padding:5px 10px 6px;font-size:.76rem;line-height:1.6;display:flex;flex-wrap:wrap;gap:8px">
          <span style="flex-basis:100%;width:100%;color:var(--stone)">${formatRace(c.race)} · ${c.alignment || "—"} · ${c.temper || "—"}${c.temperEff && c.temperEff !== c.temper ? kcHtml` <span style="color:#6a4a9a">(fights as ${c.temperEff} — equipped item)</span>` : ""}</span>
          <span><strong>HP:</strong> ${c.hp}/${c.maxHp}</span>
          <span>📍 In ${provLinkHtml(c.locationId, c.locationName || "Unknown")}</span>
          <span style="color:var(--forest)" title="1 province per phase used to move, +1 per province conquered"><strong>Move:</strong> ${effSpd} province${effSpd !== 1 ? "s" : ""}/turn</span>
          ${!c.isKing ? kcHtml`<span><strong>Pay:</strong> ${c.pay || 1}g/turn</span>` : ""}
          ${skillRow}
          ${itemsForDisplayP(c).map((i) => kcHtml`<div style="flex-basis:100%;width:100%;color:var(--item-ink);font-weight:600">${itemAcquiredTagP(i)}🔮 ${itemLoreTip(i, i.name)}${itemTierTagP(i)}${itemBoundTag(i, c)}${itemUsableBy(i, c) ? itemSlotTag(i, c) : ""}${i.desc ? kcHtml` <span style="color:var(--item-desc);font-weight:400">(${i.desc})</span>` : ""}</div>`)}
          ${(() => {
			const maj = c.titlesHeld || [], min = c.minorHeld || [];
			if (!maj.length && !min.length) return "";
			return kcHtml`<div style="flex-basis:100%;width:100%;margin-top:5px;border-top:1px dashed var(--parchment-dark);padding-top:4px"><div style="font-size:.64rem;color:var(--stone);text-transform:uppercase;letter-spacing:.05em">Titles &amp; perks</div>${maj.map((tt) => kcHtml`<div style="font-size:.72rem;margin-top:3px"><span style="background:#fdf3d8;border:1px solid var(--gold);border-radius:2px;padding:0 4px;font-family:'Cinzel',serif;color:#5a3f08">🏆 ${tt.name}</span> <span style="color:#231e16">${tt.perk || ""}</span></div>`)}${min.map((tt) => kcHtml`<div style="font-size:.72rem;margin-top:2px"><span style="background:#eef3e6;border:1px solid #b8c9a8;border-radius:2px;padding:0 4px;color:#3a5a2a">🎖 ${tt.name}</span> <span style="color:#231e16">${tt.perk || ""}</span></div>`)}</div>`;
		})()}
          ${(() => {
			const arr = c.armies || [];
			const head = kcHtml`<div style="flex-basis:100%;width:100%;margin-top:5px;border-top:1px dashed var(--parchment-dark);padding-top:4px"><div style="font-size:.64rem;color:var(--stone);text-transform:uppercase;letter-spacing:.05em">Armies leading</div>`;
			if (arr.length === 0) return kcHtml`${head}<div style="font-size:.75rem;color:#3a3224">No armies led — moves 5 provinces/turn on its own.</div></div>`;
			const { druLevel, units, totalStr, totalCost, druidUnits, druidShort } = theArmyCardsFiguresOfAColumn(arr, c, report);
			const lines = arr.map((a, i) => {
				const { creature, monster, req, effDru, shortfall, mastery, kingRaceMatch, leadRaceMatch, feudLed, bs } = units[i];
				const mast = mastery > 0 ? kcHtml` <span style="color:#1d5a1d;font-size:.66rem">+${mastery}% Druid mastery</span>` : "";
				const pen = shortfall > 0 ? kcHtml` <span style="color:var(--crimson);font-size:.68rem">−${shortfall * 20}% str (Druid ${effDru}/${req})</span>` : "";
				const raceBoost = kingRaceMatch || leadRaceMatch ? kcHtml` <span style="color:#1d5a1d;font-size:.66rem">+${kingRaceMatch && leadRaceMatch ? 44 : 20}% kin</span>` : "";
				const feudTag = feudLed ? kcHtml` <span style="color:var(--crimson);font-size:.66rem">−20% feud</span>` : "";
				const tag = creature || monster ? kcHtml` <span style="color:#1d5a1d;font-size:.62rem">[${creature ? "Creature" : "Monster"}]</span>` : "";
				return kcHtml`<div style="font-size:.75rem">${unitAbilityTip(a.type, kcHtml`${unitEmoji(a.type)} <span style="color:${reportColour(kingdom.color) || "var(--ink)"}">${armyLabel(a, { noMove: true })}</span>`)} <span style="color:var(--stone);font-size:.66rem">str ${bs}${a.moveRate != null ? ` · move ${a.moveRate}${a.moveKind === "sea" ? " (sea)" : a.moveKind === "air" ? " (air)" : ""}` : ""}</span>${tag}${raceBoost}${feudTag}${mast}${pen}</div>`;
			});
			const effSpd2 = c.effectiveSpeed != null ? c.effectiveSpeed : Math.min(...arr.map((a) => a.speed || 3));
			const { _airNote, _seaNote } = theArmyCardsAirAndSeaNotesOfAColumn(arr, c);
			const druNote = druidUnits > 0 ? kcHtml` · 🌿 ${druidUnits} unit${druidUnits !== 1 ? "s" : ""} need Druid ${druidShort > 0 ? kcHtml`<span style="color:var(--crimson)">(${druidShort} under-led — losing strength)</span>` : kcHtml`<span style="color:#1d5a1d">(${c.name.split(" ")[0]} qualifies)</span>`}` : "";
			const summary = kcHtml`<div style="margin-top:3px;font-size:.7rem;color:var(--stone);border-top:1px dotted var(--parchment-dark);padding-top:2px">⚔ Total strength <strong>${totalStr}</strong> <span style="font-size:.64rem">(before your discoveries, the ground, the foe and the battle's tactics)</span> · 🏃 Move <strong>${effSpd2}</strong> province${effSpd2 !== 1 ? "s" : ""}/turn · 💰 Upkeep <strong>${totalCost}g/turn</strong>${druNote}${_airNote}${_seaNote}</div>`;
			const _typeCounts = {};
			arr.forEach((a) => {
				const k = a.type || "unit";
				_typeCounts[k] = (_typeCounts[k] || 0) + 1;
			});
			const _typeLine = Object.keys(_typeCounts).map((k) => `${unitEmoji(k)} ${_typeCounts[k] > 1 ? _typeCounts[k] + "× " : ""}${k}`).join(", ");
			const _airSpd = c.effectiveAirSpeed != null ? c.effectiveAirSpeed : 0;
			const _seaSpd = c.effectiveSeaSpeed != null ? c.effectiveSeaSpeed : 0;
			const _paceBits = [kcHtml`🏃 Land <strong>${effSpd2}</strong>`];
			if (_airSpd > 0) _paceBits.push(kcHtml`🦅 Flying <strong>${_airSpd}</strong>`);
			if (_seaSpd > 0) _paceBits.push(kcHtml`⚓ Sea <strong>${_seaSpd}</strong>`);
			const _bLed = arr.filter(countsAgainstBeastCommand).length;
			const _bNote = _bLed > 0 ? kcHtml` · <span style="color:${_bLed > druLevel ? "var(--crimson)" : "#1d5a1d"}" title="A hero may lead only as many Creature and Monster units as his Druid level">🐾 beasts ${_bLed}/${druLevel}${_bLed > druLevel ? " — over his Druid, he takes on no more" : ""}</span>` : "";
			return kcHtml`${head}${kcHtml`<div style="font-size:.74rem;line-height:1.5;display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap">
              <span style="flex:1;min-width:0">⚔ <strong>${arr.length}</strong> unit${arr.length !== 1 ? "s" : ""} · strength <strong>${totalStr}</strong>${druidShort > 0 ? kcHtml` <span style="color:var(--crimson);font-size:.66rem">(${druidShort} under-led)</span>` : ""}${_bNote} · ${_typeLine} · ${kcJoinP(_paceBits, " · ")}</span>
              <button type="button" class="secall-btn" style="flex-shrink:0" aria-expanded="false" onclick="var d=this.parentNode.nextElementSibling;var open=d.style.display==='none';d.style.display=open?'block':'none';this.setAttribute('aria-expanded',open?'true':'false');this.textContent=open?'▾ hide units':'▸ show units'">&#9656; show units</button>
            </div>`}<div style="display:none">${lines}${summary}</div></div>`;
		})()}
        </div>
      </div>`;
	})}`;
	const provs = [...report.ownedProvinces || []].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
	document.getElementById("report-provinces").innerHTML = provs.length ? provs.map((p) => kcHtml`<div class="prov-entry">
        <div class="prov-name">${p.name} <span style="font-size:.7rem;color:var(--stone);font-family:serif">${capitalise(p.terrain)}</span></div>
        <div class="prov-detail">
          Tax: ${p.tax}g/turn · ${formatRace(p.race)} · Explored: ${p.explored || 0}%<br>
          ${(p.features || []).filter((f) => f.discovered && !f.cleared).length > 0 ? kcHtml`Known lairs: ${kcJoinP(p.features.filter((f) => f.discovered && !f.cleared).map((f) => _lairName(f)), ", ")}` : "No lairs discovered yet"}
          ${(p.features || []).filter((f) => f.cleared).length > 0 ? kcHtml`<br>Cleared: ${kcJoinP(p.features.filter((f) => f.cleared).map((f) => _lairName(f)), ", ")}` : ""}
          <br>Recruitable: ${(p.armyTypes || []).length ? kcJoinP(p.armyTypes.map((t) => unitAbilityTip(t, `${unitEmoji(t)} ${t}`)), " · ") : "none"}
          ${(p.garrisonArmies || []).length ? kcHtml`<br><strong>Garrisoned (unled):</strong>${p.garrisonArmies.map((a) => kcHtml`<br>${unitAbilityTip(a.type, kcHtml`${unitEmoji(a.type)} <span style="color:${reportColour(kingdom.color) || "var(--ink)"}">${armyLabel(a)}</span>`)}`)}` : ""}
          ${(p.neutralDefenders || []).length ? kcHtml`<br><strong>Defenders:</strong>${p.neutralDefenders.map((d) => kcHtml`<br>${unitAbilityTip(d.type, kcHtml`${unitEmoji(d.type)} <span style="color:#231e16">${armyLabel(d)}</span>`)}`)}` : ""}
          ${provinceGrandDesignHTML(p)}
          ${terrorNoteP(p, true)}
        </div>
      </div>`) : kcHtml`<div style="color:#3a3224;font-size:.85rem">No provinces owned yet.</div>`;
	report.intel;
	const sightings = report.heroSightings || [];
	const knownFeatures = report.knownFeatures || [];
	const mercs = report.mercIntel || [];
	let intelHtml = [];
	let otherForcesHtml = [];
	let lairsHtml = [];
	const visDeadHeroes = report.visibleDeadHeroes || [];
	if (visDeadHeroes.length > 0) {
		otherForcesHtml.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.72rem;color:#46275f;margin:0 0 4px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">💀 Fallen Heroes</div>`);
		otherForcesHtml.push(visDeadHeroes.map((h) => kcHtml`<div class="intel-entry" style="border-left-color:#5a3a7a;background:#f8f0ff">
      <strong>${h.name}</strong> <span style="color:#701010">(dead)</span>${h.race || h.alignment ? ` (${[h.race, h.alignment].filter(Boolean).join(", ")})` : ""} ${deadHeroRealmTagP(h, report)} when they fell — body lies in ${h.locationName} (fell turn ${h.killedOnTurn})<br>
      <span style="font-size:.78rem">${h.topSkill ? kcHtml`${skillFameLabelM(h.topSkill.level)} <span style="color:var(--gold)">${SKILL_LABELS[h.topSkill.skill] || h.topSkill.skill}</span>` : "No notable skills"}</span><br>
      ${(h.servedOther !== void 0 ? h.servedOther : h.player != null && !h.isOwn) ? kcHtml`<span style="font-size:.72rem;color:#701010">⛔ Sworn to another crown in life — Resurrect will not raise them for you. Only your own fallen and heroes who never served a rival can be brought back.</span>` : h.inVisibleProv ? kcHtml`<span style="font-size:.72rem;color:#46275f">💀 A hero with the Resurrect spell can raise them from this province.</span>` : kcHtml`<span style="font-size:.72rem;color:#332c20">Last known location — send a caster with the Resurrect spell to their province to raise them.</span>`}
    </div>`));
	}
	const graveIntel = (report.graveIntel || []).filter((g) => g && g.detail && g.detail.length > 0);
	if (graveIntel.length > 0) {
		otherForcesHtml.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.72rem;color:#2e2e2e;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">💀 Graveyards Known</div>`);
		otherForcesHtml.push(graveIntel.map((g) => {
			const det = g.detail && g.detail.length ? kcHtml`<span style="color:#46275f">The dead:</span> ${g.detailPartial ? "at least " : ""}${g.detail.map((d) => `${d.n}× ${d.k}`).join(", ")}${g.detailPartial ? kcHtml` <span style="color:#332c20">— Grave-sight names only the crack and elite; lesser dead may lie here unseen.</span>` : ""}${g.detailTurn && g.detailTurn !== g.turn ? kcHtml` <span style="color:#3a3224">(read turn ${g.detailTurn})</span>` : ""}` : kcHtml`<span style="color:#2f281c">Graves lie here — how many, and what they hold, is unknown.</span>`;
			return kcHtml`<div class="intel-entry" style="border-left-color:#4a4a4a;background:#f6f6f4">
        <strong>${g.name}</strong> <span style="color:#332c20;font-size:.78rem">(seen on turn ${g.turn != null ? g.turn : "?"})</span><br>
        <span style="font-size:.78rem">${det}</span><br>
        <span style="font-size:.72rem;color:#332c20">Older knowledge — these graves may since have been raised or rotted away.</span>
      </div>`;
		}));
	}
	if (mercs.length > 0) {
		otherForcesHtml.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.72rem;color:#701010;margin:0 0 4px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Mercenary Bands</div>`);
		otherForcesHtml.push(mercs.map((m) => kcHtml`<div class="intel-entry" style="border-left-color:#8a1c1c;background:#fff8f8">
      <strong>${m.unitName || m.type}</strong> (${m.quality} ${m.type}) — ${m.location}<br>
      <span style="font-size:.72rem;color:#6a3030">Available for hire — use Recruit Armies in ${m.location}.</span>
    </div>`));
	}
	if (sightings.length > 0) {
		const wanderers = sightings.filter((s) => s.type === "wandering");
		const chieftains = sightings.filter((s) => s.type === "neutral_guard");
		const enemies = sightings.filter((s) => s.type === "enemy");
		if (wanderers.length > 0) {
			otherForcesHtml.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.72rem;color:var(--gold);margin:8px 0 4px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Wandering Heroes</div>`);
			otherForcesHtml.push(wanderers.map((s) => {
				const topStr = s.topSkill ? kcHtml`<span style="color:var(--gold)">${SKILL_LABELS[s.topSkill.skill] || s.topSkill.skill}</span>` : "no known skills";
				const skillLine = s.spiedSkills && Object.keys(s.spiedSkills).some((k) => s.spiedSkills[k] > 0) ? kcHtml`<span style="color:#1d5a1d">🔍 Skills (spied turn ${s.spiedTurn}):</span> ${Object.entries(s.spiedSkills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${SKILL_LABELS[k] || k} ${v}`).join(", ")}` : s.topSkill ? kcHtml`${skillFameLabelM(s.topSkill.level)} ${topStr}` : "No known skills";
				return kcHtml`<div class="intel-entry" style="border-left-color:#c8922a">
          ⚔ <strong>${s.name}</strong> (${s.race}, ${s.alignment}) — ${s.locationName}<br>
          <span style="font-size:.78rem">${skillLine}${spiedExtraP(s)}${s.armyBand ? kcHtml` · <span style="color:#2f281c">${s.armyBand}</span>` : ""} · ${s.pay != null ? kcHtml`Hire for <strong>${s.pay}g/turn</strong>` : kcHtml`<span style="color:#a33">Will not serve your crown (alignment gulf)</span>`}${s.inOwnedProvince ? kcHtml` · <span style="color:#8fbc5a">In your province</span>` : ""}</span>
        </div>`;
			}));
		}
		if (chieftains.length > 0) {
			otherForcesHtml.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.72rem;color:#8a6a2a;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Local Chieftains</div>`);
			otherForcesHtml.push(chieftains.map((s) => {
				const topStr = s.topSkill ? kcHtml`<span style="color:var(--gold)">${SKILL_LABELS[s.topSkill.skill] || s.topSkill.skill}</span>` : "no known skills";
				const skillLine = s.spiedSkills && Object.keys(s.spiedSkills).some((k) => s.spiedSkills[k] > 0) ? kcHtml`<span style="color:#1d5a1d">🔍 Skills (spied turn ${s.spiedTurn}):</span> ${Object.entries(s.spiedSkills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${SKILL_LABELS[k] || k} ${v}`).join(", ")}` : s.topSkill ? kcHtml`${skillFameLabelM(s.topSkill.level)} ${topStr}` : "No known skills";
				return kcHtml`<div class="intel-entry" style="border-left-color:#8a6a2a">
          🛡 <strong style="color:${CHIEFTAIN_MARKER_COLOR}">${s.name}</strong> (local chieftain — ${s.race}, ${s.alignment}) — ${s.locationName}<br>
          <span style="font-size:.78rem">${skillLine}${spiedExtraP(s)}${s.armyBand ? kcHtml` · <span style="color:#2f281c">${s.armyBand}</span>` : ""}${s.inOwnedProvince ? kcHtml` · <span style="color:#8fbc5a">In your province</span>` : ""}</span>
        </div>`;
			}));
		}
		if (enemies.length > 0) {
			otherForcesHtml.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.72rem;color:#7a1c1c;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Enemy Heroes</div>`);
			otherForcesHtml.push(enemies.map((s) => {
				const topStr = s.topSkill ? kcHtml`<span style="color:var(--gold)">${SKILL_LABELS[s.topSkill.skill] || s.topSkill.skill}</span>` : "no known skills";
				const skillLine = s.spiedSkills && Object.keys(s.spiedSkills).some((k) => s.spiedSkills[k] > 0) ? kcHtml`<span style="color:#1d5a1d">🔍 Skills (spied turn ${s.spiedTurn}):</span> ${Object.entries(s.spiedSkills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${SKILL_LABELS[k] || k} ${v}`).join(", ")}` : s.topSkill ? kcHtml`${skillFameLabelM(s.topSkill.level)} ${topStr}` : "No known skills";
				return kcHtml`<div class="intel-entry" style="border-left-color:#7a1c1c">
          👁 <strong>${s.name}</strong> of ${s.kingdom}${s.race || s.alignment ? ` (${[s.race, s.alignment].filter(Boolean).join(", ")})` : ""} — ${s.locationName}<br>
          <span style="font-size:.78rem">${skillLine}${spiedExtraP(s)}${s.armyBand ? kcHtml` · <span style="color:#2f281c">${s.armyBand}</span>` : ""}${s.inOwnedProvince ? kcHtml` · <span style="color:#e05050">In your territory</span>` : ""}</span>
        </div>`;
			}));
		}
	}
	const provinceEvents = report.provinceEvents || [];
	if (provinceEvents.length > 0) {
		intelHtml.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.72rem;color:var(--stone);margin:8px 0 4px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Province Reports</div>`);
		const SEASONS_E = KC_SEASONS.slice();
		const _evByProv = /* @__PURE__ */ new Map();
		provinceEvents.forEach((ev) => {
			const key = ev.provName || "Unknown province";
			if (!_evByProv.has(key)) _evByProv.set(key, []);
			_evByProv.get(key).push(ev);
		});
		[..._evByProv.keys()].sort((a, b) => a.localeCompare(b)).forEach((prov) => {
			const rows = _evByProv.get(prov).slice().sort((a, b) => (a.phase ?? 99) - (b.phase ?? 99)).map((ev) => {
				const phLbl = ev.phase != null && ev.phase >= 0 && ev.phase <= 4 ? SEASONS_E[ev.phase] : null;
				return kcHtml`<div style="padding:1px 0;font-size:.76rem">${phLbl ? kcHtml`<span style="color:var(--stone);font-size:.66rem">${phLbl}: </span>` : ""}${ev.text}</div>`;
			});
			intelHtml.push(kcHtml`<div class="intel-entry" style="border-left-color:#7a4fa0">
        <strong style="font-family:'Cinzel',serif;font-size:.76rem">${prov}</strong>
        ${rows}
      </div>`);
		});
	}
	const spiedProvIntel = (report.provinceCharIntel || []).filter((p) => p.spied);
	if (spiedProvIntel.length > 0) {
		intelHtml.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.72rem;color:#1d5a1d;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">🔍 Spied Provinces</div>`);
		spiedProvIntel.forEach((pc) => {
			const others = (pc.characters || []).filter((ch) => ch.category !== "own");
			const roster = others.length > 0 ? others.map((ch) => {
				return kcHtml`<div style="padding:1px 0;font-size:.78rem">${ch.category === "enemy" ? kcHtml`<strong${ch.color ? kcHtml` style="color:${reportColour(ch.color)}"` : ""}>${ch.name}</strong>${ch.isKing ? " 👑" : ""} of ${ch.kingdom || "an enemy realm"}` : kcHtml`<strong${ch.isNeutralGuard ? kcHtml` style="color:${CHIEFTAIN_MARKER_COLOR}"` : ""}>${ch.name}</strong>${ch.isNeutralGuard ? " (local chieftain)" : " (wandering)"}`}${ch.armies && ch.armies.length > 0 ? ` — ${ch.armies.map((a) => armyLabel(a, { short: true })).join(", ")}` : ch.armyBand ? ch.armyBand === "no armies" ? "" : ` — leads ${ch.armyBand}` : ch.armyCount > 0 ? ` — leads ${ch.armyCount} unit${ch.armyCount !== 1 ? "s" : ""}` : ""}${ch.spiedSkills && Object.keys(ch.spiedSkills).some((k) => ch.spiedSkills[k] > 0) ? kcHtml`<br><span style="font-size:.72rem;color:#1d5a1d">🔍 Skills:</span> ${Object.entries(ch.spiedSkills).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${SKILL_LABELS[k] || k} ${v}`).join(", ")}` : ""}</div>`;
			}) : kcHtml`<div style="padding:1px 0;font-size:.76rem;color:#2f281c">No other characters present at turn's end.</div>`;
			intelHtml.push(kcHtml`<div class="intel-entry" style="border-left-color:#2d7a2d;background:#f2faf2">
        <strong style="font-family:'Cinzel',serif;font-size:.76rem">${pc.provName}</strong>
        ${roster}
      </div>`);
		});
	}
	const spyActivity = report.spyActivity || [];
	if (spyActivity.length > 0) {
		const SEASONS_SA = KC_SEASONS.slice();
		intelHtml.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.72rem;color:#2d6a7a;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">🔍 Spy Activity Reports</div>`);
		spyActivity.forEach((sa) => {
			const rows = (sa.lines || []).map((l) => {
				const phLbl = l.phase != null && l.phase >= 0 && l.phase <= 4 ? SEASONS_SA[l.phase] : null;
				return kcHtml`<div style="padding:1px 0;font-size:.76rem">${phLbl ? kcHtml`<span style="color:var(--stone);font-size:.66rem">${phLbl}: </span>` : ""}${l.text}</div>`;
			});
			intelHtml.push(kcHtml`<div class="intel-entry" style="border-left-color:#2d6a7a;background:#f2f8fa">
        <strong style="font-family:'Cinzel',serif;font-size:.76rem">${sa.provName}</strong>
        <div style="font-size:.68rem;color:#2f281c;margin-bottom:2px">Watched by your agent from ${SEASONS_SA[sa.sincePhase] || "later that turn"} onward:</div>
        ${rows}
      </div>`);
		});
	}
	if (knownFeatures.length > 0) {
		lairsHtml.push(kcHtml`<div style="font-family:'Cinzel',serif;font-size:.72rem;color:var(--forest);margin:10px 0 4px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Known Lairs</div>`);
		lairsHtml.push(kcHtml`<div style="font-size:.73rem;color:var(--stone);margin-bottom:6px;line-height:1.8">
      Guardian difficulty: 
      <span style="background:#4a8a4a;color:#fff;padding:1px 5px;border-radius:2px;font-size:.65rem">🐾 Weak</span> can be handled by a lone hero ·
      <span style="background:#c8922a;color:#fff;padding:1px 5px;border-radius:2px;font-size:.65rem">⚔ Moderate</span> needs skill or good tactics ·
      <span style="background:#8a1c1c;color:#fff;padding:1px 5px;border-radius:2px;font-size:.65rem">💀 Powerful</span> very dangerous, prepare carefully ·
      <span style="background:#5a0a9a;color:#fff;padding:1px 5px;border-radius:2px;font-size:.65rem">🔥 Legendary</span> near-impossible alone
    </div>`);
		const POWER_COLORS = { ...GUARD_POWER_COLORS_P };
		const POWER_ICONS = {
			Weak: "🐾",
			Moderate: "⚔",
			Powerful: "💀",
			Legendary: "🔥"
		};
		const _knownWeak = report && report.knownGuardianWeaknesses || {};
		const featureCard = (f) => {
			const pColor = POWER_COLORS[f.monsterPower] || "#7a5510";
			const pIcon = POWER_ICONS[f.monsterPower] || "?";
			const powerBadge = f.monsterPower && !f.cleared ? kcHtml`<span style="background:${pColor};color:#fff;font-size:.65rem;padding:1px 5px;border-radius:2px;margin-left:4px">${pIcon} ${f.monsterPower}</span>` : "";
			if (f.ritualSite) return kcHtml`<div class="intel-entry" style="border-left-color:#5a0a9a">
          🌙 <strong>${f.name}</strong>
          <br><span style="font-size:.78rem;color:#5a0a9a">A sacred site of the old faith — only a Pagan realm may Perform Rites here.</span>
        </div>`;
			return kcHtml`<div class="intel-entry" style="border-left-color:${f.cleared ? "#888" : f.isOwned ? "#2d7a2d" : "#c8922a"}">
        ${f.cleared ? "✓" : "⭐"} <strong${f.cleared ? "" : kcHtml` style="color:${pColor}"`}>${f.name}</strong>${powerBadge}
        ${f.cleared ? kcHtml`<span style="color:#332c20">(cleared — no guardian)</span>` : kcHtml`<br><span style="font-size:.78rem;color:${pColor}">Guardian: ${f.monster}${f.monsterCat ? kcHtml` <span style="opacity:.8">(${f.monsterCat.toLowerCase()})</span>` : ""}</span>${!f.cleared && _knownWeak[f.monster] ? kcHtml`<br><span style="font-size:.76rem;color:#7a1c7a">\u{1F4A5} Weakness known \u2014 <strong>${_knownWeak[f.monster].name}</strong>: ${_knownWeak[f.monster].desc}.</span>` : ""}${_rumourLine(f)}`}
      </div>`;
		};
		const _rumourLine = (f) => {
			const r = f.rumour;
			if (!r || f.cleared) return "";
			const items = (r.items || []).length ? `, and ${(r.items || []).join(", ")}` : (r.stolen || []).length ? ` \u2014 its magic (${r.stolen.join(", ")}) was already lifted by a thief` : " — no magic lies there";
			const wield = (r.wields || []).length ? kcHtml` <span style="color:#701010">It wields ${r.wields.join(", ")} against all comers.</span>` : "";
			return kcHtml`<br><span style="font-size:.76rem;color:#6b5a2a">\u{1F4B0} Hoard known (turn ${r.turn}) \u2014 exactly <strong>${r.gold}g</strong>${items}.${wield}</span>`;
		};
		const featuresByProvince = {};
		knownFeatures.forEach((f) => {
			const key = f.province || "Unknown province";
			(featuresByProvince[key] = featuresByProvince[key] || []).push(f);
		});
		lairsHtml.push(Object.keys(featuresByProvince).sort((a, b) => a.localeCompare(b)).map((prov) => {
			const feats = featuresByProvince[prov];
			const cards = feats.map(featureCard);
			return kcHtml`<div style="font-family:'Cinzel',serif;font-size:.76rem;color:#3a2a10;font-weight:700;margin:8px 0 2px;letter-spacing:.03em">📍 ${prov} <span style="color:var(--stone);font-weight:normal;font-size:.68rem">(${feats.length} lair${feats.length !== 1 ? "s" : ""})</span></div>${cards}`;
		}));
	}
	{
		const _ri = document.getElementById("report-intel");
		if (_ri) {
			const _sec = document.getElementById("intel-reports-section");
			const _other = _sec ? _sec.querySelectorAll(".log-entry").length : 0;
			_ri.innerHTML = intelHtml.length ? kcHtml`${intelHtml}` : _other ? "" : kcHtml`<em style="color:#3a3224;font-size:.85rem">No intelligence gathered yet. Visit or spy provinces to learn more.</em>`;
		}
	}
	const _ofEl = document.getElementById("report-other-forces");
	if (_ofEl) _ofEl.innerHTML = otherForcesHtml.length ? kcHtml`${otherForcesHtml}` : kcHtml`<em style="color:#3a3224;font-size:.85rem">No mercenary bands or loose heroes sighted yet.</em>`;
	const _lrEl = document.getElementById("report-lairs");
	if (_lrEl) _lrEl.innerHTML = lairsHtml.length ? kcHtml`${lairsHtml}` : kcHtml`<em style="color:#3a3224;font-size:.85rem">No lairs discovered yet. Explore or scout provinces to find them.</em>`;
	const discoveries = report.discoveries || [];
	const discEl = document.getElementById("report-discoveries");
	if (discEl) {
		if (discoveries.length === 0) discEl.innerHTML = kcHtml`<em style="color:#3a3224;font-size:.85rem">No discoveries yet. Give Research orders to your scholars (Sage 1+).</em>`;
		else {
			const catMap = {};
			discoveries.forEach((d) => {
				if (!catMap[d.category]) catMap[d.category] = [];
				catMap[d.category].push(d);
			});
			const catColors = {
				Military: "#7a1c1c",
				Economy: "#2d7a2d",
				Espionage: "#1a4a6e",
				Scholarship: "#6a3a9a",
				Heroic: "#8a6a1a",
				Special: "#3a7a6a"
			};
			discEl.innerHTML = Object.entries(catMap).map(([cat, discs]) => kcHtml`
        <div style="margin-bottom:12px">
          <div style="font-family:Cinzel,serif;font-size:.72rem;color:${catColors[cat] || "#555"};text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">
            ${cat}
          </div>
          ${discs.map((d) => kcHtml`<div class="intel-entry" style="border-left-color:${catColors[cat] || "#555"}">
            <strong>${d.name}</strong> <span style="color:#3a3224;font-size:.72rem">(Turn ${d.turnDiscovered})</span><br>
            <span style="font-size:.8rem">${d.desc}</span>
          </div>`)}
        </div>`);
		}
	}
	renderDiplomacy(report);
	renderTitles(report);
	renderMastery(report);
	initReportCollapsers();
	renderPlayerMap(report);
	const _repaintMap = () => {
		try {
			renderPlayerMap(report);
		} catch (e) {}
	};
	if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => requestAnimationFrame(_repaintMap));
	else setTimeout(_repaintMap, 0);
	try {
		ensureProvinceLinking();
	} catch (e) {}
}
function setDiploChoice(idx, val) {
	if (val == null || val === "null") delete diploChoices[idx];
	else diploChoices[idx] = val;
	if (currentReport) renderDiplomacy(currentReport);
}
function _setSecCollapsed(sec, collapse) {
	sec.classList.toggle("sec-collapsed", collapse);
	const b = sec.querySelector(".sec-toggle, .cc-toggle");
	if (b) {
		b.innerHTML = collapse ? "&#9656;" : "&#9662;";
		b.setAttribute("aria-expanded", collapse ? "false" : "true");
	}
}
function toggleBattleFold(btn) {
	const box = btn && btn.closest(".battle-fold");
	if (!box) return;
	const full = box.querySelector(".bf-full"), short = box.querySelector(".bf-short");
	if (!full || !short) return;
	const open = full.style.display === "none";
	full.style.display = open ? "block" : "none";
	short.style.display = open ? "none" : "block";
	box.querySelectorAll(".bf-toggle").forEach((b) => b.setAttribute("aria-expanded", open ? "true" : "false"));
}
function toggleSection(btn) {
	const sec = btn.closest(".card, .orders-char-block, .char-chronicle");
	if (!sec) return;
	_setSecCollapsed(sec, !sec.classList.contains("sec-collapsed"));
}
function collapseAllSections(scopeSel, collapse) {
	const scope = document.querySelector(scopeSel);
	if (!scope) return;
	scope.querySelectorAll(".card, .orders-char-block, .char-chronicle").forEach((sec) => {
		if (sec.id === "orders-card") return;
		_setSecCollapsed(sec, collapse);
	});
}
function collapseAllChronicle(collapse) {
	document.querySelectorAll("#report-log .char-chronicle").forEach((sec) => _setSecCollapsed(sec, collapse));
}
function initReportCollapsers() {
	const col = document.getElementById("rp-report-col");
	if (!col) return;
	col.querySelectorAll(".card").forEach((card) => {
		const h = card.querySelector("h2");
		if (!h || h.querySelector(".sec-toggle")) return;
		const b = document.createElement("button");
		b.className = "sec-toggle";
		b.type = "button";
		b.innerHTML = "&#9662;";
		b.setAttribute("aria-expanded", "true");
		b.title = "Minimise / maximise this section";
		b.addEventListener("click", () => toggleSection(b));
		h.appendChild(b);
	});
}
function refreshOpenReport() {
	const b = document.getElementById("new-turn-banner");
	if (b) b.style.display = "none";
	if (currentGamePlayerId) openReport(currentGamePlayerId);
}
async function loadPastReport(gameId, playerIndex, turn) {
	viewedTurn = turn;
	refreshTurnNavHighlight();
	const banner = document.getElementById("prev-report-banner");
	banner.style.display = "block";
	const pi = playerIndex;
	document.getElementById("orders-card").style.display = "none";
	refreshOrdersVisibility(false);
	const sw = document.getElementById("orders-submit-wrap");
	if (sw) sw.style.display = "none";
	document.getElementById("orders-msg").innerHTML = "";
	document.getElementById("save-msg").style.display = "none";
	let snapshot = null;
	try {
		const { data: snapRows } = await thePagesDb.theChroniclesLogs.theLogOfThisRealmInThisTurn(gameId, turn, pi);
		if (snapRows && snapRows[0] && snapRows[0].entries) {
			const e = snapRows[0].entries;
			snapshot = typeof e === "string" ? JSON.parse(e) : e;
		}
	} catch (err) {
		snapshot = null;
	}
	banner.innerHTML = kcHtml`Viewing Turn ${snapshotTurnLabel(turn)}${turn === 0 ? " (founding)" : ""} — read only. <button onclick="returnToCurrentReport()" style="margin-left:8px;font-size:.72rem;padding:2px 7px;border:1px solid #c8922a;background:transparent;color:#5a3f08;cursor:pointer;border-radius:2px">← Current Turn</button>`;
	if (snapshot) {
		viewingReport = snapshot;
		renderReportView(snapshot);
		return;
	}
	const { data: logs } = await thePagesDb.theChroniclesLogs.theLogOfThisRealmInThisTurn(gameId, turn, -1);
	const { data: g } = await thePagesDb.thePlayersGames.thisGameEveryColumn(gameId);
	const allChars = (g?.game_state || {}).characters || [];
	const ownCharIds = new Set(allChars.filter((c) => c.player === pi).map((c) => c.id));
	const entries = (logs && logs[0]?.entries || []).filter((e) => {
		if ((e.targets || []).includes(pi)) return true;
		if (e.actor === pi) return true;
		if (e.charId != null && ownCharIds.has(e.charId)) return true;
		if (Array.isArray(e.charIds) && e.charIds.some((id) => ownCharIds.has(id))) return true;
		return false;
	}).map((e) => {
		let cid = e.charId != null && ownCharIds.has(e.charId) ? e.charId : Array.isArray(e.charIds) ? e.charIds.find((id) => ownCharIds.has(id)) ?? null : null;
		return {
			type: e.type,
			text: e.text,
			charId: cid,
			phase: e.phase ?? null
		};
	});
	if (entries.length > 0) buildChronicle(entries, allChars.filter((c) => c.player === pi));
	else if (turn === 0) document.getElementById("report-log").innerHTML = kcHtml`<div class="log-entry system">Your realm is founded. The realm awaits your first commands.</div>`;
	banner.innerHTML = kcHtml`Viewing Turn ${snapshotTurnLabel(turn)} — read only. <span style="opacity:.8">(map history isn't available for this turn — showing the current map)</span> <button onclick="returnToCurrentReport()" style="margin-left:8px;font-size:.72rem;padding:2px 7px;border:1px solid #c8922a;background:transparent;color:#5a3f08;cursor:pointer;border-radius:2px">← Current Turn</button>`;
}
function returnToCurrentReport() {
	viewedTurn = null;
	refreshTurnNavHighlight();
	document.getElementById("prev-report-banner").style.display = "none";
	document.getElementById("orders-card").style.display = "block";
	refreshOrdersVisibility(true);
	const submitWrap = document.getElementById("orders-submit-wrap");
	const _submitted = !!(currentGamePlayer && currentGamePlayer.orders_submitted);
	if (submitWrap && !_submitted && !submitWrap.querySelector("#submit-btn")) restoreSubmitWrap("Submit");
	if (submitWrap) submitWrap.style.display = "flex";
	viewingReport = currentReport;
	if (currentReport) renderReportView(currentReport);
}
// src/ui/player/sign-in.ts
function setAuthTab(tab) {
	document.getElementById("tab-signin").classList.toggle("active", tab === "signin");
	document.getElementById("tab-signup").classList.toggle("active", tab === "signup");
	document.getElementById("auth-signin").style.display = tab === "signin" ? "block" : "none";
	document.getElementById("auth-signup").style.display = tab === "signup" ? "block" : "none";
	document.getElementById("auth-msg").innerHTML = "";
}
async function doSignIn() {
	const email = document.getElementById("si-email").value.trim();
	const pwd = document.getElementById("si-password").value;
	const msg = document.getElementById("auth-msg");
	if (!email || !pwd) {
		msg.innerHTML = "<div class=\"msg-error\">Please enter your email and password.</div>";
		return;
	}
	msg.innerHTML = "<div class=\"msg-info\">Signing in…</div>";
	const { data, error } = await thePagesDb.signingIn.signInWithEmailAndPassword(email, pwd);
	if (error) {
		let m = error.message;
		if (m.includes("Email not confirmed")) m = "Account not confirmed yet. Ask your GM, or check your email for a confirmation link.";
		if (m.includes("Invalid login")) m = "Email or password incorrect. Check your details and try again.";
		msg.innerHTML = kcHtml`<div class="msg-error">${m}</div>`;
		return;
	}
	currentUser = data.user;
	await onSignedIn();
}
async function doSignUp() {
	const name = document.getElementById("su-name").value.trim();
	const email = document.getElementById("su-email").value.trim();
	const pwd = document.getElementById("su-password").value;
	const pwd2 = document.getElementById("su-password2").value;
	const msg = document.getElementById("auth-msg");
	if (!name || !email || !pwd) {
		msg.innerHTML = "<div class=\"msg-error\">Please fill in all fields.</div>";
		return;
	}
	if (pwd !== pwd2) {
		msg.innerHTML = "<div class=\"msg-error\">Passwords do not match.</div>";
		return;
	}
	if (pwd.length < 6) {
		msg.innerHTML = "<div class=\"msg-error\">Password must be at least 6 characters.</div>";
		return;
	}
	msg.innerHTML = "<div class=\"msg-info\">Creating account…</div>";
	const { data, error } = await thePagesDb.signingIn.signUpWithEmailPasswordAndName(email, pwd, name);
	if (error) {
		msg.innerHTML = kcHtml`<div class="msg-error">${error.message}</div>`;
		return;
	}
	if (data.user && !data.session) {
		msg.innerHTML = "<div class=\"msg-success\">Account created! Check your email for a confirmation link, then sign in.</div>";
		setTimeout(() => setAuthTab("signin"), 3e3);
	} else if (data.user) {
		currentUser = data.user;
		await onSignedIn();
	}
}
async function doSignOut() {
	try {
		stopMessagePolling();
		await saveMessageReads();
	} catch (e) {}
	await thePagesDb.signingIn.signOut();
	currentUser = null;
	currentProfile = null;
	currentGamePlayer = null;
	currentReport = null;
	location.reload();
}
function changeDisplayName() {
	if (document.getElementById("dn-overlay")) return;
	const cur = currentProfile && currentProfile.name || currentUser?.user_metadata?.display_name || "";
	const ov = document.createElement("div");
	ov.id = "dn-overlay";
	ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999";
	ov.innerHTML = kcHtml`
    <div style="background:#f5ecd8;color:#1a1208;border:2px solid #c8922a;border-radius:6px;padding:20px;max-width:380px;width:90%">
      <div style="font-family:'Cinzel',serif;font-size:1rem;margin-bottom:6px;color:#7a1c1c">✏ Change Display Name</div>
      <div style="font-size:.8rem;margin-bottom:12px;color:#4a3a22">This is <strong>you</strong>, not your realm. Your realm is named afresh in every game you join; this name follows you across all of them and is what the Hall of Fame records your wins under. Changing it updates your name on every game you have played.</div>
      <label style="font-size:.75rem;display:block;margin-bottom:2px">Display name</label>
      <input type="text" id="dn-name" maxlength="40" value="${cur}" placeholder="How other players will see you" style="width:100%;padding:7px;margin-bottom:8px;border:1px solid #c8922a;border-radius:3px;box-sizing:border-box" onkeydown="if(event.key==='Enter')submitDisplayName()">
      <div id="dn-msg" style="font-size:.78rem;margin-bottom:10px;min-height:16px"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="closeDisplayName()" style="padding:7px 14px;border:1px solid #999;background:#eee;border-radius:3px;cursor:pointer">Cancel</button>
        <button onclick="submitDisplayName()" style="padding:7px 14px;border:none;background:#7a1c1c;color:#fff;border-radius:3px;cursor:pointer">Save Name</button>
      </div>
    </div>`;
	document.body.appendChild(ov);
	const f = document.getElementById("dn-name");
	f.focus();
	f.select();
}
function closeDisplayName() {
	const o = document.getElementById("dn-overlay");
	if (o) o.remove();
}
async function submitDisplayName() {
	const msg = document.getElementById("dn-msg");
	const name = (document.getElementById("dn-name").value || "").trim();
	if (name.length < 2) {
		msg.innerHTML = "<span style=\"color:#c00\">Please give a name of at least two characters.</span>";
		return;
	}
	msg.innerHTML = "<span style=\"color:#231e16\">Saving…</span>";
	try {
		const { error } = await thePagesDb.theAccountsNames.giveThisAccountItsName(currentUser.id, name);
		if (error) {
			msg.innerHTML = kcHtml`<span style="color:#c00">${error.message}</span>`;
			return;
		}
		try {
			await thePagesDb.signingIn.changeTheNameKeptWithTheSignIn(name);
		} catch (e) {}
		currentProfile = Object.assign({}, currentProfile || {}, {
			id: currentUser.id,
			name
		});
		const el = document.getElementById("player-name-display");
		if (el) el.textContent = name;
		msg.innerHTML = "<span style=\"color:#1d5a1d\">✓ Saved — this is your name on every game you have played.</span>";
		setTimeout(closeDisplayName, 1400);
	} catch (e) {
		msg.innerHTML = kcHtml`<span style="color:#c00">${e.message || "Could not save the name."}</span>`;
	}
}
function changePassword() {
	if (document.getElementById("cp-overlay")) return;
	const ov = document.createElement("div");
	ov.id = "cp-overlay";
	ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999";
	ov.innerHTML = `
    <div style="background:#f5ecd8;color:#1a1208;border:2px solid #c8922a;border-radius:6px;padding:20px;max-width:360px;width:90%">
      <div style="font-family:'Cinzel',serif;font-size:1rem;margin-bottom:12px;color:#7a1c1c">🔑 Change Password</div>
      <label style="font-size:.75rem;display:block;margin-bottom:2px">New password</label>
      <input type="password" id="cp-new" placeholder="At least 6 characters" style="width:100%;padding:7px;margin-bottom:8px;border:1px solid #c8922a;border-radius:3px;box-sizing:border-box" onkeydown="if(event.key==='Enter')document.getElementById('cp-new2').focus()">
      <label style="font-size:.75rem;display:block;margin-bottom:2px">Confirm new password</label>
      <input type="password" id="cp-new2" placeholder="Repeat password" style="width:100%;padding:7px;margin-bottom:8px;border:1px solid #c8922a;border-radius:3px;box-sizing:border-box" onkeydown="if(event.key==='Enter')submitChangePassword()">
      <div id="cp-msg" style="font-size:.78rem;margin-bottom:10px;min-height:16px"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="closeChangePassword()" style="padding:7px 14px;border:1px solid #999;background:#eee;border-radius:3px;cursor:pointer">Cancel</button>
        <button onclick="submitChangePassword()" style="padding:7px 14px;border:none;background:#7a1c1c;color:#fff;border-radius:3px;cursor:pointer">Update Password</button>
      </div>
    </div>`;
	document.body.appendChild(ov);
	document.getElementById("cp-new").focus();
}
function closeChangePassword() {
	const o = document.getElementById("cp-overlay");
	if (o) o.remove();
}
async function submitChangePassword() {
	const p1 = document.getElementById("cp-new").value;
	const p2 = document.getElementById("cp-new2").value;
	const msg = document.getElementById("cp-msg");
	if (!p1 || p1.length < 6) {
		msg.innerHTML = "<span style=\"color:#c00\">Password must be at least 6 characters.</span>";
		return;
	}
	if (p1 !== p2) {
		msg.innerHTML = "<span style=\"color:#c00\">Passwords do not match.</span>";
		return;
	}
	msg.innerHTML = "<span style=\"color:#231e16\">Updating…</span>";
	try {
		const { error } = await thePagesDb.signingIn.changeThePassword(p1);
		if (error) {
			msg.innerHTML = kcHtml`<span style="color:#c00">${error.message}</span>`;
			return;
		}
		msg.innerHTML = "<span style=\"color:#1d5a1d\">✓ Password updated.</span>";
		setTimeout(closeChangePassword, 1200);
	} catch (e) {
		msg.innerHTML = kcHtml`<span style="color:#c00">${e.message || "Update failed."}</span>`;
	}
}
async function onSignedIn() {
	const { data: profile } = await thePagesDb.theAccountsNames.theNameOfThisAccount(currentUser.id);
	currentProfile = profile;
	const displayName = profile?.name || currentUser.user_metadata?.display_name || currentUser.email.split("@")[0];
	document.getElementById("player-name-display").textContent = displayName;
	const _gm = (location.hash || "").match(/^#game=([A-Za-z0-9_-]+)$/);
	if (_gm) {
		show("sec-report");
		loadAllGames().then(() => startUpdatePolling()).catch(() => {});
		await openReport(_gm[1]);
		return;
	}
	show("sec-games");
	await loadAllGames();
	startUpdatePolling();
}
function openGameFresh(gamePlayerId) {
	try {
		history.replaceState(null, "", location.pathname + location.search + "#game=" + encodeURIComponent(gamePlayerId));
	} catch (e) {}
	location.reload();
}
async function answerGmOffer(fn) {
	const ask = document.getElementById("gm-offer-ask"), msg = document.getElementById("gm-offer-msg");
	ask.querySelectorAll("button").forEach((b) => {
		b.disabled = true;
	});
	msg.innerHTML = "";
	const { error } = await thePagesDb.theRoles.answerTheGameMasterOffer(fn);
	ask.querySelectorAll("button").forEach((b) => {
		b.disabled = false;
	});
	if (error) {
		msg.className = "msg-error";
		msg.textContent = error.message;
		return false;
	}
	return true;
}
async function acceptGmOffer() {
	if (!await answerGmOffer("gm_accept_offer")) return;
	document.getElementById("gm-offer-ask").style.display = "none";
	document.getElementById("gm-offer-done").style.display = "block";
}
async function declineGmOffer() {
	if (!confirm("Turn down the offer to become a Game Master? The Overlord would have to offer again.")) return;
	if (await answerGmOffer("gm_decline_offer")) document.getElementById("gm-offer-banner").style.display = "none";
}
async function init() {
	try {
		document.getElementById("spinner").style.display = "none";
		const { data: { session }, error } = await thePagesDb.signingIn.theSessionKeptInThisBrowser();
		if (error) throw error;
		if (session) {
			currentUser = session.user;
			await onSignedIn();
		} else show("sec-auth");
	} catch (e) {
		document.getElementById("spinner").style.display = "block";
		document.getElementById("spinner").textContent = "Connection error: " + e.message + ". Check your internet connection and refresh.";
		console.error("Init failed:", e);
	}
}
// src/ui/player/start.ts
kcDbGuard(thePagesDb, KC_DB_MIN).then(() => init().catch((err) => {
	console.error("Init error:", err);
	theElementWithTheId("spinner", HTMLElement).textContent = "Error loading — please refresh. (" + theMessageOf(err) + ")";
}));
/** What was thrown's message, in words, as `'…' + err.message` wrote it: an error's message; `undefined` for a value
*  with none; nothing thrown (`null`, `undefined`) throws the TypeError reading its message threw. */
function theMessageOf(err) {
	if (err === null || err === void 0) throw new TypeError(`reading the message of ${String(err)}`);
	return String(Reflect.get(Object(err), "message"));
}
// src/ui/shared/a-newer-version-of-this-page.ts
/** The file each deploy publishes beside the pages. */
var VERSION_FILE = "version.json";
/** How often an open page checks it. */
var CHECK_EVERY_MS = 3e5;
/** A tab shown again checks it, but not more often than this. */
var CHECK_WHEN_SHOWN_AT_MOST_EVERY_MS = 6e4;
/** A newer version counts this long after this page first sees it. */
var COUNTS_AFTER_MS = 6e5;
var isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
/** `value` as version.json, or null if it isn't one. Read by hand: Zod isn't in the pages' bundles yet (P1-15). */
function publishedVersionFrom(value) {
	if (!isRecord(value) || typeof value["commit"] !== "string" || !isRecord(value["pages"])) return null;
	const time = value["time"];
	if (time !== null && typeof time !== "string") return null;
	const pages = {};
	for (const [page, fingerprint] of Object.entries(value["pages"])) {
		if (typeof fingerprint !== "string") return null;
		pages[page] = fingerprint;
	}
	return {
		commit: value["commit"],
		time,
		pages
	};
}
var metaOf = (name) => typeof document === "undefined" ? null : document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? null;
/** This page's fingerprint, from its kc-page-version meta (null on the dev server, or a page without it). */
var thisPagesFingerprint = () => metaOf("kc-page-version");
/** This page's file name in version.json: the last part of its address ("index.html" for the folder itself). */
function thisPagesName() {
	const last = location.pathname.split("/").pop() ?? "";
	return last === "" ? "index.html" : decodeURIComponent(last);
}
/** The decision, on plain values: version.json names a newer version of this page when the fingerprint it gives the
*  page differs from the page's own; it counts once `now` is at least 10 minutes after this page first saw that
*  fingerprint (`firstSeen`: when this page first saw each fingerprint; one not in it was never seen, so it doesn't
*  count yet). A page without a fingerprint (the dev server), or one version.json doesn't name, has no newer version. */
function whatVersionJsonSaysOf(page, published, firstSeen, now) {
	const theirs = published.pages[page.name];
	if (page.fingerprint === null || theirs === void 0 || theirs === page.fingerprint) return {
		newer: null,
		counts: false
	};
	const seen = firstSeen.get(theirs);
	return {
		newer: theirs,
		counts: seen !== void 0 && now - seen >= COUNTS_AFTER_MS
	};
}
var firstSeen = /* @__PURE__ */ new Map();
var lastCheckedAt = -Infinity;
/** The newer version of this page that `published` names, if it has counted for 10 minutes by `now`: the deploy's
*  version.json, else null. Records when this page first saw it. */
function newerVersionIn(published, now) {
	const news = whatVersionJsonSaysOf({
		name: thisPagesName(),
		fingerprint: thisPagesFingerprint()
	}, published, firstSeen, now);
	if (news.newer !== null && !firstSeen.has(news.newer)) firstSeen.set(news.newer, now);
	return news.counts ? published : null;
}
/** Whether this page can read version.json at all: served over HTTP(S), in a browser that has fetch. Not on file://,
*  nor in jsdom, which has no fetch unless a test gives it one. */
var versionJsonCanBeRead = () => typeof location !== "undefined" && /^https?:$/.test(location.protocol) && typeof fetch === "function";
/** Reads version.json now (never from the browser's cache): the deploy's version.json when it names a newer version
*  of this page that has counted for 10 minutes, else null (also when version.json can't be read). */
async function checkForANewerVersion() {
	lastCheckedAt = Date.now();
	if (!versionJsonCanBeRead()) return null;
	let published;
	try {
		const answer = await fetch(VERSION_FILE, { cache: "no-store" });
		published = answer.ok ? publishedVersionFrom(await answer.json()) : null;
	} catch {
		return null;
	}
	return published === null ? null : newerVersionIn(published, Date.now());
}
var watching = false;
/** Checks version.json now, then every 5 minutes, and when the tab is shown again (at most once a minute), and calls
*  `whenANewerVersionCounts` with the deploy's version.json each time a check finds a newer version of this page that
*  counts. Once per page: a second call does nothing. Where version.json can't be read, it watches nothing. */
function watchForANewerVersion(whenANewerVersionCounts) {
	if (watching || !versionJsonCanBeRead()) return;
	watching = true;
	const check = async () => {
		const newer = await checkForANewerVersion();
		if (newer !== null) whenANewerVersionCounts(newer);
	};
	check();
	setInterval(() => void check(), CHECK_EVERY_MS);
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible" && Date.now() - lastCheckedAt >= CHECK_WHEN_SHOWN_AT_MOST_EVERY_MS) check();
	});
}
// src/ui/shared/the-reload-banner.ts
/** The bar's id: there is never more than one. */
var RELOAD_BANNER_ID = "kc-reload-banner";
/** Shows the bar at the top of the page, once; a second call leaves the one there. */
function showTheReloadBanner() {
	if (document.getElementById(RELOAD_BANNER_ID)) return;
	const bar = document.createElement("div");
	bar.id = RELOAD_BANNER_ID;
	bar.setAttribute("role", "status");
	bar.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;padding:10px 16px;background:#2b2118;color:#f5e6c8;border-bottom:2px solid #c9a227;font:15px/1.4 Georgia,serif;box-shadow:0 2px 8px rgba(0,0,0,.4)";
	bar.innerHTML = String(kcHtml`<span>A new version of Kingdoms Call is ready. Save what you're doing, then reload.</span>
<button type="button" style="font:inherit;font-weight:bold;padding:4px 14px;cursor:pointer;background:#c9a227;color:#2b2118;border:1px solid #f5e6c8;border-radius:4px">Reload</button>`);
	bar.querySelector("button")?.addEventListener("click", () => {
		location.reload();
	});
	document.body.prepend(bar);
}
watchForANewerVersion(showTheReloadBanner);
// src/ui/player/globals.ts
Object.assign(window, {
	_closeMapTip,
	acceptGmOffer,
	addEncounterTactic,
	adjustSkill,
	allocateHeirSkill,
	cancelSubmit,
	changeDisplayName,
	changePassword,
	clearPreSchool,
	closeChangePassword,
	closeDisplayName,
	collapseAllChronicle,
	collapseAllSections,
	confirmEPSchool,
	confirmEPSpell,
	createMsgGroup,
	declineGmOffer,
	doJoinGame,
	doSaveOrders,
	doSignIn,
	doSignOut,
	doSignUp,
	doSubmitOrders,
	epDragStart,
	epDropTactic,
	epMoveTactic,
	groupHeroesByLocation,
	hideSkillTip,
	highlightMapProv,
	joinGame,
	jumpToReportSection,
	leaveToggleAll,
	loadAllGames,
	loadOlderMessages,
	locateOnMap,
	mapZoom,
	moveHeroBlock,
	onActionChange,
	onMoveEdited,
	onMsgInput,
	onSpellChange,
	openGameFresh,
	openPreSchoolPicker,
	rebuildTargetWrap,
	refreshAllMoveModeNotes,
	refreshMessages,
	refreshOpenReport,
	removeEncounterTactic,
	reportMessage,
	resubmitOrders,
	returnToCurrentReport,
	reviseOrders,
	sendMessage,
	setAuthTab,
	setConcede,
	setDeskView,
	setDiploChoice,
	setDiscoveryChoice,
	setHeirName,
	setHeirTemper,
	setMobileView,
	setReckoningCall,
	show,
	showFullscreenMap,
	showJoinGame,
	showSkillTip,
	submitChangePassword,
	submitDisplayName,
	submitOrders,
	syncCharmCard,
	syncHiredHeroCard,
	syncResurrectCard,
	toggleArchivedGamesCard,
	toggleBattleFold,
	toggleMapIcon,
	toggleMsgGroupPicker,
	toggleSection,
	updateAlignmentDesc,
	updateBloodOffering,
	updateEquipTarget,
	updateLeaveTarget,
	updateRaceDesc,
	updateRecruitTarget,
	updateRumourTarget,
	updateTemperDesc
});
Object.assign(window, {
	_renderDiplomacyInto,
	buildOrdersForm,
	buildTargetField,
	computeOrderLedgerP,
	druidNeedP,
	getDruidLevel,
	initMessaging,
	loadMessageRoster,
	loadMyGames,
	loadMyReports,
	loadOpenGames,
	loadPastReport,
	msgChannelKeyOf,
	msgContacts,
	openReport,
	pollForUpdates,
	popupKnownChars,
	poSeaAnalysis,
	PRIMAL_ARMY_SPEEDS,
	renderDiplomacy,
	renderMessageThread,
	renderReckoningOrders,
	renderReportView,
	renderTitles,
	sb,
	setMsgChannel,
	terrorNoteP,
	unitTypeOf,
	updateMsgComposer
});
