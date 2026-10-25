//#region src/ui/shared/kc-safe.ts
function kcEsc(v) {
	return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[c]);
}
var KcSafeHtml = class {
	constructor(s) {
		this.s = s;
	}
	toString() {
		return this.s;
	}
};
function kcHtml(strings, ...values) {
	const show = (v) => v instanceof KcSafeHtml ? v.s : Array.isArray(v) ? v.map(show).join("") : kcEsc(v);
	let out = strings[0];
	for (let i = 0; i < values.length; i++) out += show(values[i]) + strings[i + 1];
	return new KcSafeHtml(out);
}
function kcArg(v) {
	return new KcSafeHtml(kcEsc(JSON.stringify(v === void 0 ? null : v)));
}
//#endregion
//#region src/db/kc-db-guard.ts
async function kcDbGuard(sb, min) {
	const ask = async () => {
		try {
			return await sb.rpc("kc_db_version");
		} catch (e) {
			return {
				data: null,
				error: { message: String(e && e.message || e) },
				status: 0
			};
		}
	};
	let r = await ask();
	if (r.error && !r.status) r = await ask();
	const v = !r.error && typeof r.data === "string" && /^\d{14}$/.test(r.data) ? r.data : null;
	if (!v || v < min) {
		const why = r.error ? r.status ? "no version check in the database" : "the database didn't answer" : `database ${v || "unknown"}`;
		window.dispatchEvent(new ErrorEvent("error", { message: `The game is being updated. Try again in a few minutes. (${why}; this page needs ${min})` }));
		return new Promise(() => {});
	}
	document.documentElement.setAttribute("data-kc-db", v);
	document.dispatchEvent(new CustomEvent("kc-db-version", { detail: v }));
	return v;
}
//#endregion
//#region src/content/kingdoms-call-data.ts
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
//#endregion
//#region src/ui/player/startup.ts
var KC_DB_MIN = "20261015062128";
if (typeof KC_CONFIG === "undefined") throw new Error("kc-config.js did not load: reload the page.");
var SUPABASE_URL = KC_CONFIG.supabaseUrl;
var SUPABASE_ANON_KEY = KC_CONFIG.supabaseKey;
var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
function kcJoinP(list, sep) {
	return list.flatMap((x, i) => i ? [sep, x] : [x]);
}
//#endregion
//#region src/ui/player/l79-orders.ts
var L79_ORDERS = {
	Sabotage: {
		skill: "spy",
		lvl: 7,
		target: "province",
		provKind: "enemy",
		hint: "Spy 7: wreck an enemy province you can see — it yields no tax next turn and loses a garrison unit."
	},
	"Forced March": {
		skill: "march",
		lvl: 7,
		target: "province",
		provKind: "move_adjacent",
		hint: "March 7: march to an adjacent province — if an enemy army or a Defend order awaits, a 50% chance to slip in without a battle this phase (the fight comes next phase if you stay, or at turn end)."
	},
	"Grand Heist": {
		skill: "thief",
		lvl: 7,
		target: "here",
		hint: "Thief 7 · ONE attempt per thief per turn (spent win or lose). You crack the vaults of THE PROVINCE YOU STAND IN — no hero is targeted. Where: the province must be held by a realm you are AT WAR with, and be their HOME CAPITAL or RICH country (tax 7+). Take: 25% of that realm's treasury (doubled at Thief 8, even past what they can cover) AND one magic item — cut from a courier still on the road inside their realm, from a Send Item order made earlier this turn (a heist never touches what a hero carries in their own pack — that is the Steal order). Odds: 60% +5% per Thief level past 5, halved if the vaults are guarded (a garrison stands there, or an enemy commander of that realm is present with troops). Fail and you are seen unless you slip away (Thief × 20%) — then a hero of that realm draws steel on you (lead with Flee in your Encounter Plan if you would rather not fight), or if none is there the guards beat you off."
	},
	"Awaken Grove": {
		skill: "druid",
		lvl: 7,
		target: "none",
		hint: "Druid 7: while in an owned forest, jungle or wild (Creature or Monster) province, raise a temporary Creature host that fights until turn’s end."
	},
	"Chart the Unknown": {
		skill: "explorer",
		lvl: 7,
		target: "here_or_adjacent",
		hint: "Explorer 7: fully chart the province you stand in OR one bordering it — 100% mapped, every lair in it revealed, and all ITS neighbours glimpsed at 25%."
	},
	"Discover Lost Ruin": {
		skill: "explorer",
		lvl: 9,
		target: "lair_tier",
		hint: "Explorer 9: name a class of lair. EVERY lair of that class in your province and in each bordering province is laid bare at once. A rival's Hide Lairs glamour still conceals what it covers."
	},
	Blockade: {
		skill: "naval",
		lvl: 7,
		target: "province",
		provKind: "sea_adjacent",
		hint: "Naval 7: seal a sea province you are in or adjacent to — enemy fleets may not cross it this turn."
	},
	"Research Breakthrough": {
		skill: "sage",
		lvl: 7,
		target: "none",
		hint: "Sage 7: a guaranteed scholarly discovery this turn (if any remain undiscovered by your realm)."
	},
	Assassinate: {
		skill: "spy",
		lvl: 9,
		target: "character",
		hint: "Spy 9: attempt to slay an enemy hero in the province you stand in — a spy-level chance to kill."
	},
	Vanish: {
		skill: "thief",
		lvl: 9,
		target: "none",
		hint: "Thief 9: melt into the shadows — for the rest of this turn no pursuit, Encounter or ambush can bring you to bay, and no thief caught in the act can be cornered."
	},
	Challenge: {
		skill: "melee",
		lvl: 7,
		target: "character",
		hint: "Melee 7: call out a LONE enemy hero in your province to single combat — the loser is wounded, or slain."
	},
	Rampage: {
		skill: "melee",
		lvl: 9,
		target: "character",
		hint: "Melee 9: hurl yourself at an enemy force in your province — cut down several of its units and wound its commander."
	},
	"Rain of Arrows": {
		skill: "archery",
		lvl: 7,
		target: "character",
		hint: "Archery 7: loose a volley on an enemy force in your province, felling several of its units."
	},
	"Sniper's Mark": {
		skill: "archery",
		lvl: 9,
		target: "character",
		hint: "Archery 9: mark an enemy commander in your province — a telling shot that wounds, and may slay."
	},
	"Feigned Retreat": {
		skill: "tactical",
		lvl: 7,
		target: "none",
		hint: "Tactical 7: bait your attacker — if you are attacked this turn, your defence counters at +25% strength."
	},
	"Grand Stratagem": {
		skill: "tactical",
		lvl: 9,
		target: "none",
		hint: "Tactical 9: dictate the terms of battle — your next battle this turn is fought at +20% strength."
	},
	"Lightning Advance": {
		skill: "march",
		lvl: 9,
		target: "none",
		hint: "March 9: strike before they can set — enemies you attack this turn lose their defensive footing (−20%)."
	},
	"Raid the Coast": {
		skill: "naval",
		lvl: 9,
		target: "none",
		hint: "Naval 9: an amphibious assault — when you come ashore from the sea this turn and fight for the coast you land on, you hit at +25% strength (the whole landing does, even if another hero takes command of it)."
	},
	"Wild Calling": {
		skill: "druid",
		lvl: 9,
		target: "none",
		hint: "Druid 9: while standing in a wild (Creature or Monster) province, call its wild host to your banner — several of its beasts defect to you."
	},
	"Grand Design": {
		skill: "sage",
		lvl: 9,
		target: "none",
		hint: "Sage 9: complete your realm’s Grand Design — a unique, once-ever Wonder whose blessing is set by your realm’s alignment."
	}
};
//#endregion
//#region src/engine/rules-on-plain-values/a-games-settings-read-from-its-row.ts
function gameMetaOf(game) {
	if (!game || game.meta == null) return null;
	try {
		const m = typeof game.meta === "string" ? JSON.parse(game.meta) : game.meta;
		return m && typeof m === "object" && m.v ? m : null;
	} catch (e) {
		return null;
	}
}
//#endregion
//#region src/engine/rules-on-plain-values/a-number-shown-to-a-player-rounded-down.ts
function dispFloor(v) {
	const n = Number(v) || 0;
	const r = Math.round(n);
	return Math.abs(n - r) < 1e-9 ? r : Math.trunc(n);
}
//#endregion
//#region src/engine/rules-on-plain-values/alignments-and-a-wandering-heros-hire-wage.ts
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
//#endregion
//#region src/engine/rules-on-plain-values/units-that-fly-sail-or-can-be-carried-through-the-air.ts
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
//#endregion
//#region src/engine/rules-on-plain-values/beasts-a-hero-may-lead-and-the-druid-each-unit-needs.ts
var BEAST_CMD_TYPES = /* @__PURE__ */ new Set([...KC_UNIT_CLASS.creature, ...KC_UNIT_CLASS.monster]);
/** Whether the unit counts against its hero's beast command: a living Creature or Monster that stays. */
function countsAgainstBeastCommand(a) {
	return !!a && BEAST_CMD_TYPES.has(a.type) && !a.skeletal && !a.temporary && !a.wildHunt && !a.phantom;
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
//#endregion
//#region src/engine/rules-on-plain-values/items-slots-races-and-who-may-use-them.ts
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
	if (it.effect && it.effect.stat === "combatUse") return "combat";
	if (it.effect && it.effect.stat === "mithrilArmour") return "armour";
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
//#endregion
//#region src/engine/rules-on-plain-values/ships-and-flyers-that-carry-a-column-across-the-sea.ts
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
//#endregion
//#region src/engine/rules-on-plain-values/skills-in-order-and-a-heros-fame-in-words.ts
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
//#endregion
//#region src/engine/rules-on-plain-values/spells-each-school-allows-a-turn-and-a-fight.ts
/** Action spells of one school a hero may cast in a turn, by his effective level in it: 1 at level 1 or 2, 2 at
*  level 3, 3 at level 4 or more (AK rules). The Warlock's extra cast in his best school is added by the caller. */
function actionSpellsAllowedPerSchoolEachTurn(level) {
	return level >= 4 ? 3 : level >= 3 ? 2 : 1;
}
/** Combat spells of one school a hero may cast in one personal combat, by his level in it: 1 at level 1, 2 at
*  level 2 or more. */
function combatSpellsAllowedPerSchoolEachFight(level) {
	return level >= 2 ? 2 : 1;
}
//#endregion
//#region src/engine/rules-on-plain-values/unit-types-and-base-strength.ts
var UNIT_TYPE_WORD_OF = KC_UNIT_TYPE;
function unitTypeOf(armyType) {
	return typeof KC_UNIT_TYPE !== "undefined" && UNIT_TYPE_WORD_OF[armyType] || "infantry";
}
var UNIT_BASE_STR = { ...KC_UNIT_BASE_STR };
var UNIT_Q_MULT = { ...KC_UNIT_Q_MULT };
function unitBaseStrength(army) {
	return (UNIT_BASE_STR[army.type] || 4) * (UNIT_Q_MULT[army.quality || "Average"] || 2);
}
//#endregion
//#region src/ui/player/dispatches.ts
var KC_MSG_TABLE = "game_messages";
var KC_MSG_READS = "game_message_reads";
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
	return String(key).slice(2).split("-").map(_msgNum).filter((i) => i != null);
}
function msgRealmName(i) {
	const r = _msgRealms[i];
	return r && r.name || "Realm " + ((_msgNum(i) || 0) + 1);
}
function msgRealmColour(i) {
	const r = _msgRealms[i];
	const hex = r && r.color || null;
	if (!hex) return "#c9b189";
	try {
		return _tintForDarkTooltip ? _tintForDarkTooltip(hex) : hex;
	} catch (e) {
		return hex;
	}
}
async function loadMessageRoster(gameId, report) {
	const known = {};
	_msgArr(report && report.diplomacy && report.diplomacy.known).forEach((k) => {
		const i = _msgNum(k && k.index);
		if (i == null) return;
		known[i] = {
			index: i,
			name: k.name || "Realm " + (i + 1),
			color: k.color || null,
			alignment: k.alignment || null,
			conceded: !!k.conceded,
			eliminated: !!k.eliminated,
			relation: k.relation || "neutral"
		};
	});
	let humans = /* @__PURE__ */ new Set(), total = 0;
	try {
		const { data: slots, error } = await fetchGameSlots([gameId]);
		if (error) throw error;
		_msgArr(slots).forEach((s) => {
			const i = _msgNum(s.player_index);
			if (i == null) return;
			total++;
			if (!s.is_bot) humans.add(i);
		});
	} catch (e) {
		_msgErr = "Could not read the realm roster: " + (e && e.message || e);
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
	return Object.values(_msgRealms).filter((r) => r && r.met && r.human && r.index !== _msgMyIndex).sort((a, b) => a.index - b.index);
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
		return r && r.human && (_msgGameOver || !r.conceded && !r.eliminated);
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
	_msgGameId = gameId != null ? String(gameId) : null;
	_msgMyIndex = _msgNum(myIndex);
	_msgMyName = report && report.playerName || "";
	_msgMyColor = report && report.kingdom && report.kingdom.color || null;
	{
		const k = report && report.kingdom || {};
		_msgOut = k.conceded ? "conceded" : k.eliminated ? "eliminated" : null;
		_msgGameOver = !!(game && game.status === "complete" || report && report.titles && report.titles.gameOver);
		_msgBlockOut = !!(game && game.block_eliminated_msgs);
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
	} catch (e) {}
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
		const { error } = await sb.from(KC_MSG_TABLE).select("id").limit(1);
		_msgTableOk = !error;
		if (error) _msgErr = error.message;
	} catch (e) {
		_msgTableOk = false;
		_msgErr = String(e && e.message || e);
	}
	return _msgTableOk;
}
async function loadMessageReads() {
	if (!_msgGameId || _msgMyIndex == null) return;
	try {
		const { data, error } = await sb.from(KC_MSG_READS).select("reads").eq("game_id", _msgGameId).eq("player_index", _msgMyIndex).maybeSingle();
		if (error) throw error;
		const r = data && data.reads;
		_msgReads = r && typeof r === "object" && !Array.isArray(r) ? { ...r } : {};
	} catch (e) {
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
		await sb.from(KC_MSG_READS).upsert({
			game_id: _msgGameId,
			player_index: _msgMyIndex,
			user_id: currentUser.id,
			reads: _msgReads,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}, { onConflict: "game_id,player_index" });
	} catch (e) {}
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
	} catch (e) {}
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
		let q = sb.from(KC_MSG_TABLE).select("id,turn,from_index,to_indexes,scope,body,created_at").eq("game_id", _msgGameId);
		q = _msgMaxId > 0 ? q.gt("id", _msgMaxId).order("id", { ascending: true }).limit(MSG_PAGE) : q.order("id", { ascending: false }).limit(MSG_PAGE);
		const { data, error } = await q;
		if (error) throw error;
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
		_msgErr = String(e && e.message || e);
		renderMessageThread();
	} finally {
		_msgBusy = false;
	}
}
function _msgAbsorb(rows) {
	let added = 0;
	_msgArr(rows).forEach((r) => {
		const id = _msgNum(r && r.id);
		if (id == null || _msgIds.has(id)) return;
		_msgIds.add(id);
		_msgRows.push(r);
		added++;
		if (id > _msgMaxId) _msgMaxId = id;
		if (_msgMinId === 0 || id < _msgMinId) _msgMinId = id;
	});
	if (added) _msgRows.sort((a, b) => _msgNum(a.id) - _msgNum(b.id));
	return added;
}
async function loadOlderMessages() {
	if (_msgLoadingOlder || !_msgMoreOlder || !_msgGameId || _msgMinId <= 0) return;
	_msgLoadingOlder = true;
	renderMessageThread();
	try {
		const { data, error } = await sb.from(KC_MSG_TABLE).select("id,turn,from_index,to_indexes,scope,body,created_at").eq("game_id", _msgGameId).lt("id", _msgMinId).order("id", { ascending: false }).limit(MSG_PAGE);
		if (error) throw error;
		const page = _msgArr(data);
		_msgMoreOlder = page.length >= MSG_PAGE;
		_msgAbsorb(page.slice().reverse());
	} catch (e) {
		_msgErr = String(e && e.message || e);
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
	const seen = _msgNum(_msgReads[key]) || 0;
	return msgRowsOf(key).filter((r) => (_msgNum(r.id) || 0) > seen && _msgNum(r.from_index) !== _msgMyIndex).length;
}
function msgUnreadTotal() {
	return msgChannelKeys().reduce((n, k) => n + msgUnreadIn(k), 0);
}
function markChannelRead(key) {
	const rows = msgRowsOf(key);
	if (!rows.length) return;
	const top = rows.reduce((m, r) => Math.max(m, _msgNum(r.id) || 0), 0);
	if ((_msgNum(_msgReads[key]) || 0) >= top) return;
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
	} catch (e) {}
}
function renderMessageChannels() {
	const el = document.getElementById("msg-channels");
	if (!el) return;
	const keys = msgChannelKeys();
	if (!keys.includes(_msgChannel)) _msgChannel = "public";
	el.innerHTML = kcHtml`${keys.map((k) => {
		const others = msgParticipantsOf(k).filter((i) => i !== _msgMyIndex);
		const gone = k !== "public" && !msgChannelIsSendable(k);
		const dot = k === "public" ? kcHtml`<span class="mc-dot" style="background:#7d5fb5"></span>` : others.length === 1 ? kcHtml`<span class="mc-dot" style="background:${msgRealmColour(others[0])}"></span>` : kcHtml`<span class="mc-dot" style="background:linear-gradient(90deg,${others.slice(0, 3).map((i) => msgRealmColour(i)).join(",")})"></span>`;
		const u = msgUnreadIn(k);
		return kcHtml`<button type="button" class="msg-chan${k === _msgChannel ? " active" : ""}${gone ? " gone" : ""}" data-ch="${k}" title="${msgChannelLabel(k)}${gone ? " — no longer in the game" : ""}">${dot}<span class="mc-label">${msgChannelLabel(k)}</span>${u ? kcHtml`<span class="mc-unread">${u > 99 ? "99+" : u}</span>` : ""}</button>`;
	})}`;
	updateMsgComposer();
}
function _msgBindChannelClicks() {
	const el = document.getElementById("msg-channels");
	if (!el || el._bound) return;
	el._bound = true;
	el.addEventListener("click", (ev) => {
		const b = ev.target && ev.target.closest ? ev.target.closest(".msg-chan") : null;
		if (b && b.dataset && b.dataset.ch) setMsgChannel(b.dataset.ch);
	});
}
function _msgWhen(iso) {
	const d = new Date(iso);
	if (isNaN(d)) return "";
	return d.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function _msgDay(iso) {
	const d = new Date(iso);
	if (isNaN(d)) return "";
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
		el.innerHTML = kcHtml`<div class="msg-empty">Dispatches are not switched on for this server yet — the <strong>game_messages</strong> table is missing. Ask your GM to run the messaging SQL shown on their portal.${_msgErr ? kcHtml`<br><span style="font-size:.72rem;opacity:.7">${_msgErr}</span>` : ""}</div>`;
		updateMsgComposer();
		return;
	}
	const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
	const rows = msgRowsOf(_msgChannel);
	const older = _msgMoreOlder ? kcHtml`<button type="button" class="msg-chan" style="align-self:center" onclick="loadOlderMessages()"${_msgLoadingOlder ? kcHtml` disabled` : ""}>${_msgLoadingOlder ? "Loading…" : "↑ Earlier dispatches"}</button>` : "";
	if (!rows.length) {
		el.innerHTML = kcHtml`${older}<div class="msg-empty">No dispatches here yet.<br>Anything you write goes to <strong>${_msgChannel === "public" ? "every realm in the game" : msgChannelLabel(_msgChannel)}</strong>.</div>`;
		updateMsgComposer();
		return;
	}
	const seen = _msgNum(_msgReads[_msgChannel]) || 0;
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
		const fresh = !mine && (_msgNum(r.id) || 0) > seen;
		const meta = [
			kcHtml`<span class="msg-from" style="color:${msgRealmColour(from)}">${mine ? msgRealmName(from) + " (you)" : msgRealmName(from)}</span>`,
			showTo ? kcHtml`<span class="msg-to">${showTo}</span>` : "",
			kcHtml`<span class="msg-when">${r.turn != null ? "T" + r.turn + " · " : ""}${_msgWhen(r.created_at)}</span>`,
			fresh ? kcHtml`<span class="mc-unread" title="New since you last read this thread">new</span>` : "",
			mine ? "" : _msgReported.has(String(r.id)) ? kcHtml`<span class="msg-reported" title="Your GM (or the Overlord) can see this dispatch">⚑ Reported</span>` : kcHtml`<button type="button" class="msg-report" title="Show this dispatch to your GM" onclick="reportMessage(${kcArg(_msgNum(r.id) || 0)})">⚑ Report</button>`
		];
		html.push(kcHtml`<div class="msg-bubble${mine ? " mine" : ""}${pub && !mine ? " pub" : ""}"><div class="msg-meta">${meta}</div>${r.body}</div>`);
	});
	el.innerHTML = kcHtml`${html}`;
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
	const { data, error } = await sb.from("message_reports").select("message_id").eq("game_id", String(_msgGameId));
	if (!error) _msgReported = new Set(_msgArr(data).map((r) => String(r.message_id)));
}
async function reportMessage(id) {
	const r = _msgRows.find((x) => _msgNum(x.id) === _msgNum(id));
	if (!r || _msgMyIndex == null || _msgNum(r.from_index) === _msgMyIndex) return;
	const why = prompt("Report this dispatch?\n\nYour GM will see it, with your reason (or the Overlord will, if your GM plays in this game). The sender isn't told.\n\nReason (optional):", "");
	if (why == null) return;
	const { error } = await sb.from("message_reports").insert({
		message_id: _msgNum(id),
		game_id: String(_msgGameId),
		reporter_index: _msgMyIndex,
		reason: String(why).trim().slice(0, 500) || null
	});
	if (error && error.code !== "23505") {
		_msgErr = "Report not sent: " + String(error.message || error);
		updateMsgComposer();
		return;
	}
	_msgReported.add(String(id));
	_msgErr = null;
	renderMessageThread();
}
function updateMsgComposer() {
	const btn = document.getElementById("msg-send-btn"), ta = document.getElementById("msg-input"), hint = document.getElementById("msg-hint"), note = document.getElementById("msg-note");
	if (!btn || !ta) return;
	const sendable = _msgEnabled && _msgTableOk !== false && msgChannelIsSendable(_msgChannel);
	const len = (ta.value || "").trim().length;
	btn.disabled = !sendable || !len || _msgSending;
	ta.disabled = !sendable;
	if (hint) hint.innerHTML = !sendable ? kcHtml`${_msgTableOk === false ? "Messaging is not active on this server." : msgOutReason(_msgChannel) || "Every realm in this conversation has left the game."}` : kcHtml`${_msgChannel === "public" ? kcHtml`Public — <strong>every realm in this game</strong> will read this.${msgOutPrivateOff() ? " " + msgOutPrivateOff() : ""}` : "Private to " + msgChannelLabel(_msgChannel) + "."} <span style="opacity:.75">Ctrl+Enter sends. ${MSG_MAX_LEN - len} left.</span>`;
	if (note) {
		note.style.display = _msgErr && _msgTableOk !== false ? "block" : "none";
		note.textContent = _msgErr || "";
	}
}
function onMsgInput() {
	updateMsgComposer();
}
function _msgBindComposerKeys() {
	const ta = document.getElementById("msg-input");
	if (!ta || ta._bound) return;
	ta._bound = true;
	ta.addEventListener("keydown", (ev) => {
		if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
			ev.preventDefault();
			sendMessage();
		}
	});
}
async function sendMessage() {
	const ta = document.getElementById("msg-input");
	if (!ta) return;
	const body = (ta.value || "").trim();
	if (!body || _msgSending || !_msgEnabled || !_msgGameId || _msgMyIndex == null) return;
	if (!msgChannelIsSendable(_msgChannel)) return;
	const key = _msgChannel;
	const pub = key === "public";
	const to = pub ? [] : msgParticipantsOf(key).filter((i) => i !== _msgMyIndex);
	if (!pub && !to.length) return;
	_msgSending = true;
	updateMsgComposer();
	const turn = _msgNum(currentGamePlayer && currentGamePlayer._liveTurn) || _msgNum(currentReport && currentReport._liveTurn);
	try {
		const { error } = await sb.from(KC_MSG_TABLE).insert({
			game_id: _msgGameId,
			turn,
			from_index: _msgMyIndex,
			from_user_id: currentUser && currentUser.id || null,
			to_indexes: to,
			scope: pub ? "public" : "private",
			body: body.slice(0, MSG_MAX_LEN)
		});
		if (error) throw error;
		ta.value = "";
		_msgErr = null;
		await refreshMessages(true);
		const th = document.getElementById("msg-thread");
		if (th) th.scrollTop = th.scrollHeight;
		markChannelRead(key);
	} catch (e) {
		const m = String(e && e.message || e);
		_msgErr = e && e.hint === "kc_dispatch_rate" ? m : /game_messages_body_len/.test(m) ? "A dispatch can be at most 500 characters. Shorten it and send again." : "Dispatch not sent: " + m;
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
	if (list) list.innerHTML = cs.length ? kcHtml`${cs.map((r) => kcHtml`<label><input type="checkbox" value="${r.index}"><span style="color:${msgRealmColour(r.index)}">${r.name}</span>${r.conceded || r.eliminated ? kcHtml` <span style="opacity:.6;font-size:.72rem">(out)</span>` : ""}</label>`)}` : "<span style=\"font-size:.76rem;color:#8a7a5c\">You have not met another player's realm yet.</span>";
}
function createMsgGroup() {
	const list = document.getElementById("msg-group-list");
	if (!list) return;
	const picked = [...list.querySelectorAll("input[type=checkbox]:checked")].map((c) => _msgNum(c.value)).filter((i) => i != null);
	if (!picked.length) return;
	const key = msgGroupKey([_msgMyIndex, ...picked]);
	if (!_msgExtraGroups.includes(key)) _msgExtraGroups.push(key);
	toggleMsgGroupPicker(false);
	setMsgChannel(key);
}
window.addEventListener("pagehide", () => {
	try {
		saveMessageReads();
	} catch (e) {}
});
document.addEventListener("visibilitychange", () => {
	if (document.hidden) try {
		saveMessageReads();
	} catch (e) {}
	else if (_msgEnabled && _msgViewVisible()) try {
		refreshMessages(true);
	} catch (e) {}
	else refreshMsgBadgeSoon();
});
//#endregion
//#region src/ui/player/sign-in.ts
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
	const { data, error } = await sb.auth.signInWithPassword({
		email,
		password: pwd
	});
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
	const { data, error } = await sb.auth.signUp({
		email,
		password: pwd,
		options: { data: { display_name: name } }
	});
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
	await sb.auth.signOut();
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
		const { error } = await sb.from("profiles").upsert({
			id: currentUser.id,
			name
		}, { onConflict: "id" });
		if (error) {
			msg.innerHTML = kcHtml`<span style="color:#c00">${error.message}</span>`;
			return;
		}
		try {
			await sb.auth.updateUser({ data: { display_name: name } });
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
		const { error } = await sb.auth.updateUser({ password: p1 });
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
	const { data: profile } = await sb.from("profiles").select("id,name").eq("id", currentUser.id).single();
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
async function fetchGameSlots(gameIds) {
	const ids = [...new Set((gameIds || []).filter(Boolean))];
	if (!ids.length) return {
		data: [],
		error: null
	};
	const { data, error } = await sb.rpc("get_game_slots", { p_games: ids });
	return {
		data: Array.isArray(data) ? data : [],
		error
	};
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
	const { data, error } = await sb.from("game_masters").select("accepted_at").eq("user_id", currentUser.id).maybeSingle();
	const open = !error && data && !data.accepted_at;
	if (open) {
		document.getElementById("gm-offer-ask").style.display = "block";
		document.getElementById("gm-offer-done").style.display = "none";
	}
	el.style.display = open ? "block" : "none";
}
async function answerGmOffer(fn) {
	const ask = document.getElementById("gm-offer-ask"), msg = document.getElementById("gm-offer-msg");
	ask.querySelectorAll("button").forEach((b) => {
		b.disabled = true;
	});
	msg.innerHTML = "";
	const { error } = await sb.rpc(fn);
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
//#endregion
//#region src/ui/player/game-lists.ts
globalThis._pollTimer = null;
var _lastMyGamesSig = null;
var POLL_MS = 2e4;
function _activeSectionId() {
	const s = document.querySelector("section.section-active");
	return s ? s.id : null;
}
function startUpdatePolling() {
	if (_pollTimer) return;
	_pollTimer = setInterval(pollForUpdates, POLL_MS);
}
async function pollForUpdates() {
	if (!currentUser) return;
	if (document.hidden) return;
	try {
		const { data: mySlots } = await sb.from("game_players").select("id,game_id,player_index,orders_submitted").eq("user_id", currentUser.id);
		if (!mySlots || !mySlots.length) return;
		const gameIds = [...new Set(mySlots.map((s) => s.game_id))];
		const { data: games } = await sb.from("games").select("id,turn,status").in("id", gameIds);
		const gById = Object.fromEntries((games || []).map((g) => [g.id, g]));
		const { data: pollSlots } = await fetchGameSlots(gameIds);
		const _tally = {};
		(pollSlots || []).forEach((r) => {
			if (r.is_bot) return;
			const t = _tally[r.game_id] = _tally[r.game_id] || [0, 0];
			t[1]++;
			if (r.orders_submitted) t[0]++;
		});
		const active = _activeSectionId();
		const _unread = active === "sec-games" ? await fetchUnreadDispatchCounts(mySlots, pollSlots) : {};
		const sig = mySlots.map((s) => {
			const g = gById[s.game_id] || {};
			const t = _tally[s.game_id] || [0, 0];
			return `${s.id}:${g.turn || 0}:${g.status || ""}:${s.orders_submitted ? 1 : 0}:${t[0]}/${t[1]}:u${_unread[String(s.game_id)] || 0}`;
		}).sort().join("|");
		if (active === "sec-games") {
			if (sig !== _lastMyGamesSig) {
				_lastMyGamesSig = sig;
				loadMyGames();
			}
		} else if (active === "sec-report" && currentGamePlayer) {
			const g = gById[currentGamePlayer.game_id];
			const openLiveTurn = currentGamePlayer._liveTurn || 0;
			if (g && (g.turn || 0) > openLiveTurn) {
				const b = document.getElementById("new-turn-banner");
				if (b) b.style.display = "flex";
			}
		}
		_lastMyGamesSig = sig;
	} catch (e) {}
}
function refreshOpenReport() {
	const b = document.getElementById("new-turn-banner");
	if (b) b.style.display = "none";
	if (currentGamePlayerId) openReport(currentGamePlayerId);
}
async function loadMyGames() {
	const el = document.getElementById("my-games-list");
	const { data: mySlots, error } = await sb.from("game_players").select("*").eq("user_id", currentUser.id);
	if (error) {
		el.innerHTML = kcHtml`<div class="msg-error">${error.message}</div>`;
		return;
	}
	if (!mySlots || mySlots.length === 0) {
		el.innerHTML = "<div style=\"color:#3a3224;font-size:.85rem;font-style:italic\">You are not enrolled in any games yet. Join an open game below.</div>";
		return;
	}
	const gameIds = mySlots.map((s) => s.game_id);
	const { data: games, error: gErr } = await fetchGamesLite(gameIds);
	if (gErr) {
		el.innerHTML = kcHtml`<div class="msg-error">${gErr.message}</div>`;
		return;
	}
	const gamesById = Object.fromEntries((games || []).map((g) => [g.id, g]));
	const { data: allSlots } = await fetchGameSlots(gameIds);
	const slotsByGame = {};
	(allSlots || []).forEach((s) => {
		(slotsByGame[s.game_id] = slotsByGame[s.game_id] || []).push(s);
	});
	const unreadByGame = await fetchUnreadDispatchCounts(mySlots, allSlots);
	const cardOf = (slot) => {
		const g = gamesById[slot.game_id];
		if (!g) return kcHtml`<div class="msg-info">Game data not available yet — the GM may still be setting up.</div>`;
		const statusLabel = slot.orders_submitted ? "Orders submitted" : g.status === "active" ? "Orders needed" : g.status === "setup" ? "Waiting to start" : "Complete";
		const pillClass = slot.orders_submitted ? "pill-blue" : g.status === "active" ? "pill-amber" : g.status === "setup" ? "pill-green" : "";
		const _arch = gameArchivedP(g) ? kcHtml` <span class="pill" style="background:#e4d4b0;color:#4a3105">🗄 Archived by the GM</span>` : "";
		const tally = ordersInTextP(g, slotsByGame[slot.game_id]), deadline = turnDeadlineText(g);
		return kcHtml`<div class="game-card clickable" onclick="openGameFresh(${kcArg(String(slot.id))})"${gameArchivedP(g) ? kcHtml` style="opacity:.85"` : ""}>
      <div class="gc-name">${g.name} <span class="pill ${pillClass}">${statusLabel}</span>${_arch}${unreadDispatchPillP(unreadByGame[String(slot.game_id)])}</div>
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
	el.innerHTML = _liveSlots.length ? kcHtml`${_liveSlots.map(cardOf)}` : "<div style=\"color:#3a3224;font-size:.85rem;font-style:italic\">No active games — your archived games are listed further down.</div>";
	renderArchivedGamesCard(_archSlots.map(cardOf));
}
var ARCH_CARD_KEY = "kc_archived_games_min";
function archivedCardMinimised() {
	try {
		return localStorage.getItem(ARCH_CARD_KEY) === "1";
	} catch (e) {
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
	if (cnt) cnt.textContent = `(${cards.length})`;
	const list = document.getElementById("archived-games-list");
	if (list) list.innerHTML = kcHtml`${cards}`;
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
	} catch (e) {}
	applyArchivedCardState();
}
async function fetchUnreadDispatchCounts(mySlots, allSlots) {
	const out = {};
	try {
		const humans = {};
		_msgArr(allSlots).forEach((s) => {
			if (s && !s.is_bot) {
				const k = String(s.game_id);
				humans[k] = (humans[k] || 0) + 1;
			}
		});
		const mine = {};
		_msgArr(mySlots).forEach((s) => {
			const k = String(s.game_id);
			if ((humans[k] || 0) >= 2 && _msgNum(s.player_index) != null) mine[k] = _msgNum(s.player_index);
		});
		const ids = Object.keys(mine);
		if (!ids.length) return out;
		const { data: rows, error } = await sb.from(KC_MSG_TABLE).select("id,game_id,from_index,to_indexes,scope").in("game_id", ids).order("id", { ascending: false }).limit(3e3);
		if (error || !rows) return out;
		let reads = [];
		try {
			const r = await sb.from(KC_MSG_READS).select("game_id,player_index,reads").in("game_id", ids).eq("user_id", currentUser.id);
			if (!r.error) reads = _msgArr(r.data);
		} catch (e) {}
		const seenBy = {};
		reads.forEach((r) => {
			const k = String(r.game_id);
			if (mine[k] !== _msgNum(r.player_index)) return;
			const m = r.reads;
			seenBy[k] = m && typeof m === "object" && !Array.isArray(m) ? m : {};
		});
		rows.forEach((r) => {
			const k = String(r.game_id);
			if (!(k in mine)) return;
			if (_msgNum(r.from_index) === mine[k]) return;
			const ch = msgChannelKeyOf(r);
			const seen = _msgNum((seenBy[k] || {})[ch]) || 0;
			if ((_msgNum(r.id) || 0) > seen) out[k] = (out[k] || 0) + 1;
		});
	} catch (e) {}
	return out;
}
function unreadDispatchPillP(n) {
	if (!n) return "";
	return kcHtml` <span class="pill" style="background:#a32020;color:#fff" title="${n} unread dispatch${n !== 1 ? "es" : ""} — open the game and choose ✉ Dispatches">✉ ${n > 99 ? "99+" : n} new</span>`;
}
function parseGameStateP(g) {
	try {
		return typeof g.game_state === "string" ? JSON.parse(g.game_state) : g.game_state || {};
	} catch (e) {
		return {};
	}
}
var GAME_LITE_COLS_P = "id,name,gm_user_id,status,turn,max_players,created_at,meta";
function gameArchivedP(g) {
	const m = gameMetaOf(g);
	if (m && m.archived !== void 0) return !!m.archived;
	return !!parseGameStateP(g).archived;
}
async function fetchGamesLite(ids) {
	let r = await sb.from("games").select(GAME_LITE_COLS_P).in("id", ids);
	if (r.error && /meta/i.test(r.error.message || "")) r = await sb.from("games").select("*").in("id", ids);
	return r;
}
function realmExemptFromOrdersP(G, idx) {
	const pl = (G && G.players || [])[idx];
	if (!pl) return false;
	if (pl.conceded || pl._eliminated) return true;
	const hasProv = (pl.provinces || []).length > 0;
	const hasChar = (G && G.characters || []).some((c) => c && c.alive && c.player === idx);
	return !hasProv && !hasChar;
}
function realmExemptInP(g, idx) {
	const m = gameMetaOf(g);
	if (m && Array.isArray(m.exempt)) return m.exempt.includes(idx);
	return realmExemptFromOrdersP(parseGameStateP(g), idx);
}
function ordersInTextP(g, slots) {
	if (!g || g.status !== "active") return "";
	const need = (slots || []).filter((p) => p && !p.is_bot && !realmExemptInP(g, p.player_index));
	if (need.length === 0) return "";
	const inN = need.filter((p) => p.orders_submitted).length;
	const waiting = need.length - inN;
	const head = kcHtml`📜 <strong>${inN} of ${need.length}</strong> realm${need.length !== 1 ? "s" : ""} have sent orders`;
	return waiting === 0 ? kcHtml`${head} — every realm is in, so the turn can be run.` : kcHtml`${head} — still waiting on ${waiting} more.`;
}
function turnModeOfGame(g) {
	let gs = gameMetaOf(g);
	if (!gs) try {
		gs = typeof g.game_state === "string" ? JSON.parse(g.game_state) : g.game_state || {};
	} catch (e) {
		gs = {};
	}
	const tm = gs && gs.turnMode && typeof gs.turnMode === "object" ? gs.turnMode : {};
	return {
		mode: [
			"manual",
			"auto",
			"deadline"
		].includes(tm.mode) ? tm.mode : "manual",
		nextDeadlineAt: tm.nextDeadlineAt || null
	};
}
function fmtDeadlineP(iso) {
	if (!iso) return "";
	try {
		return new Date(iso).toLocaleString(void 0, {
			weekday: "short",
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit"
		});
	} catch (e) {
		return String(iso);
	}
}
function turnDeadlineText(g) {
	if (!g || g.status !== "active") return "";
	const tm = turnModeOfGame(g);
	if (tm.mode === "auto") return kcHtml`⚙️ Turn ${g.turn} resolves automatically as soon as every realm has sent its orders.`;
	if (tm.mode === "deadline" && tm.nextDeadlineAt) {
		const late = Date.now() >= new Date(tm.nextDeadlineAt).getTime();
		return kcHtml`⏱ Turn ${g.turn} deadline: <strong>${fmtDeadlineP(tm.nextDeadlineAt)}</strong> (your local time)${late ? " — passed; the turn is being resolved" : ""}. It resolves at that time, or sooner if every realm has sent its orders. Orders not in by then hold (Defend).`;
	}
	return "";
}
async function loadOpenGames() {
	const el = document.getElementById("open-games-list");
	const { data: mySlots } = await sb.from("game_players").select("game_id").eq("user_id", currentUser.id);
	const myGameIds = new Set((mySlots || []).map((s) => s.game_id));
	const { data: games, error } = await sb.from("games").select("*").eq("status", "setup");
	if (error) {
		el.innerHTML = kcHtml`<div class="msg-error">${error.message}</div>`;
		return;
	}
	if (!games || games.length === 0) {
		el.innerHTML = "<div style=\"color:#3a3224;font-size:.85rem;font-style:italic\">No open games at the moment. Ask your GM to create one.</div>";
		return;
	}
	const { data: allSlots } = await fetchGameSlots(games.map((g) => g.id));
	const slotsByGame = {};
	(allSlots || []).forEach((s) => {
		if (!slotsByGame[s.game_id]) slotsByGame[s.game_id] = [];
		slotsByGame[s.game_id].push(s);
	});
	const gmIds = [...new Set(games.map((g) => g.gm_user_id).filter(Boolean))];
	const gmNameById = {};
	if (gmIds.length) {
		const { data: gmProfiles } = await sb.from("profiles").select("id,name").in("id", gmIds);
		(gmProfiles || []).forEach((pr) => {
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
			cfg = typeof g.game_state === "string" ? JSON.parse(g.game_state) : g.game_state || {};
		} catch (e) {}
		const _sp = parseInt(cfg.seaPct);
		const seaPct = Number.isFinite(_sp) ? Math.max(20, Math.min(80, _sp)) : 35;
		return {
			gm: gmNameById[g.gm_user_id] || "the Game Master",
			size: (SIZE_LABEL[cfg.mapSize] || "—") + ", " + seaPct + "% sea"
		};
	};
	const humanCapOf = (g) => {
		let cfg = {};
		try {
			cfg = typeof g.game_state === "string" ? JSON.parse(g.game_state) : g.game_state || {};
		} catch (e) {}
		const maxP = g.max_players || 4;
		if (cfg.allBot === true) return 0;
		const bots = Math.max(0, Math.min(parseInt(cfg.botCount) || 0, maxP));
		return Math.max(0, maxP - bots);
	};
	const visOf = (g) => {
		let cfg = {};
		try {
			cfg = typeof g.game_state === "string" ? JSON.parse(g.game_state) : g.game_state || {};
		} catch (e) {}
		const isPrivate = cfg.visibility === "private";
		return {
			private: isPrivate,
			invited: isPrivate && Array.isArray(cfg.invited) ? cfg.invited : []
		};
	};
	const canSee = (g) => {
		const v = visOf(g);
		return !v.private || v.invited.includes(currentUser.id);
	};
	const openGames = games.filter((g) => {
		if (myGameIds.has(g.id)) return false;
		if (!canSee(g)) return false;
		return (slotsByGame[g.id] || []).filter((p) => !p.is_bot).length < humanCapOf(g);
	});
	if (openGames.length === 0) {
		el.innerHTML = "<div style=\"color:#3a3224;font-size:.85rem;font-style:italic\">No open games at the moment. Ask your GM to create one.</div>";
		return;
	}
	el.innerHTML = kcHtml`${openGames.map((g) => {
		const joined = (slotsByGame[g.id] || []).filter((p) => !p.is_bot).length;
		const maxP = humanCapOf(g);
		const info = gameInfo(g);
		const privBadge = visOf(g).private ? kcHtml` <span class="pill pill-blue">🔒 Invited</span>` : "";
		return kcHtml`<div class="game-card clickable" onclick="showJoinGame(${kcArg(String(g.id))},${kcArg(g.name)},${kcArg(maxP)},${kcArg(joined)},${kcArg(info.gm)},${kcArg(info.size)})">
      <div class="gc-name">${g.name} <span class="pill pill-green">Open</span>${privBadge}</div>
      <div class="gc-meta">GM: <strong>${info.gm}</strong> · World: ${info.size} · ${joined}/${maxP} players joined</div>
      <div class="gc-meta" style="opacity:.7">Click to join this game</div>
    </div>`;
	})}`;
}
//#endregion
//#region src/ui/player/pre-orders.ts
var ONCE_PER_TURN_ACTIONS = /* @__PURE__ */ new Set([...Object.keys(L79_ORDERS), "Call to Arms"]);
function refreshOncePerTurnOptions(charId) {
	const taken = /* @__PURE__ */ new Set();
	for (let ph = 0; ph < 5; ph++) {
		const sel = document.getElementById(`po-action-${charId}-${ph}`);
		if (!sel) continue;
		if (!sel.dataset.allOpts) sel.dataset.allOpts = JSON.stringify([...sel.options].map((o) => o.value).filter(Boolean));
		const want = JSON.parse(sel.dataset.allOpts).filter((a) => !taken.has(a));
		const have = [...sel.options].map((o) => o.value).filter(Boolean);
		let cur = sel.value, cleared = false;
		if (cur && taken.has(cur)) {
			cleared = cur;
			cur = "";
		}
		if (want.join("|") !== have.join("|")) {
			sel.innerHTML = kcHtml`<option value="">${sel.options[0] && !sel.options[0].value ? sel.options[0].textContent : "— Choose —"}</option>${want.map((a) => kcHtml`<option value="${a}">${a}</option>`)}`;
			sel.value = cur;
		}
		if (cleared) {
			const wrap = document.getElementById(`po-target-wrap-${charId}-${ph}`);
			const ch = (currentReport?.characters || []).find((c) => String(c.id) === String(charId));
			if (wrap) try {
				wrap.innerHTML = kcHtml`${ch ? buildTargetField(ch, ph, { action: "" }) : ""}<div style="font-size:.72rem;color:#8a2a2a;margin-top:3px">${cleared} can be ordered only once a turn and is already set in an earlier phase \u2014 choose another action here.</div>`;
			} catch (_) {}
		}
		if (ONCE_PER_TURN_ACTIONS.has(sel.value)) taken.add(sel.value);
	}
}
function refreshAllOncePerTurn() {
	new Set([...document.querySelectorAll("select[id^=\"po-action-\"]")].map((el) => el.id.replace(/^po-action-/, "").replace(/-\d+$/, ""))).forEach((id) => {
		try {
			refreshOncePerTurnOptions(id);
		} catch (_) {}
	});
}
function onActionChange(charId, ph, charIdx) {
	const action = document.getElementById(`po-action-${charId}-${ph}`)?.value;
	const wrap = document.getElementById(`po-target-wrap-${charId}-${ph}`);
	if (!wrap) return;
	wrap.innerHTML = buildTargetField((currentReport?.characters || []).find((c) => String(c.id) === String(charId)) || (currentReport?.characters || [])[charIdx] || {}, ph, { action });
	refreshOncePerTurnOptions(charId);
	refreshLaterCastSpells(charId, ph);
	setTimeout(refreshExploreNotes, 0);
	setTimeout(refreshAllMoveModeNotes, 0);
	setTimeout(() => syncHiredHeroCard(charId, ph), 100);
	setTimeout(() => syncResurrectCard(charId, ph), 100);
	setTimeout(() => syncCharmCard(charId, ph), 100);
}
function onMoveEdited(charId, ph) {
	const char = (currentReport?.characters || []).find((c) => String(c.id) === String(charId));
	if (!char) return;
	setTimeout(refreshExploreNotes, 0);
	setTimeout(refreshAllMoveModeNotes, 0);
	refreshMoveModeNote(charId, ph);
	const ownNote = document.getElementById(`po-move-note-${charId}-${ph}`);
	if (ownNote) {
		ownNote.style.display = "none";
		ownNote.innerHTML = "";
	}
	for (let later = ph + 1; later <= 4; later++) {
		const laterAction = document.getElementById(`po-action-${charId}-${later}`)?.value || "";
		if (laterAction !== "Move" && laterAction !== "Forced March") continue;
		const wrap = document.getElementById(`po-target-wrap-${charId}-${later}`);
		if (!wrap) continue;
		const savedT = getOrderTarget(charId, later);
		wrap.innerHTML = buildTargetField(char, later, {
			action: laterAction,
			target: savedT
		});
		if (savedT) {
			const note = document.getElementById(`po-move-note-${charId}-${later}`);
			if (note) {
				note.style.display = "block";
				note.innerHTML = "⚠ <strong>Update me</strong> — an earlier move changed, so this order now sets out from a different province. Re-check its direction.";
			}
		}
	}
}
function _fillSyntheticOrderCard(fakeId, savedPhases, savedEP) {
	const fake = (currentReport && currentReport.characters || []).find((c) => String(c.id) === String(fakeId));
	if (!fake) return;
	const first = (fake.hiredInPhase ?? -1) + 1;
	for (let p = first; p < 5; p++) {
		const o = (savedPhases || [])[p];
		if (!o || !o.action) continue;
		const sel = document.getElementById(`po-action-${fakeId}-${p}`);
		if (!sel || ![...sel.options].some((x) => x.value === o.action)) continue;
		sel.value = o.action;
		const wrap = document.getElementById(`po-target-wrap-${fakeId}-${p}`);
		if (wrap) try {
			wrap.innerHTML = buildTargetField(fake, p, {
				action: o.action,
				target: o.target || "",
				extra: o.extra || ""
			});
		} catch (_) {}
	}
	try {
		refreshOncePerTurnOptions(fakeId);
	} catch (_) {}
	if (!savedEP) return;
	const allTac = (savedEP.tactics || []).map(String);
	const tac = allTac.filter((t) => !t.toUpperCase().startsWith("CS:"));
	const cs = allTac.find((t) => t.toUpperCase().startsWith("CS:"));
	const h = document.getElementById(`ep-tactics-${fakeId}`);
	if (h && tac.length) {
		h.value = tac.join(",");
		try {
			refreshEncounterPlan(fakeId, tac);
		} catch (_) {}
	}
	if (cs) {
		const pre = document.getElementById(`ep-preschool-${fakeId}`);
		if (pre) {
			pre.value = cs.slice(3).toLowerCase();
			try {
				renderPreSchool(fakeId);
			} catch (_) {}
		}
	}
	const n = document.getElementById(`ep-notes-${fakeId}`);
	if (n) n.value = savedEP.notes || "";
	const d = document.getElementById(`ep-duel-${fakeId}`);
	if (d && savedEP.duelStance) d.value = savedEP.duelStance;
}
function syncAllPreOrderCards(savedOrders, savedEncounterPlans) {
	savedOrders = savedOrders || {};
	savedEncounterPlans = savedEncounterPlans || {};
	const SEL = "[id^=\"hired-hero-orders-\"],[id^=\"charm-orders-\"]";
	for (let round = 0; round < 3; round++) {
		const before = document.querySelectorAll(SEL).length;
		[...new Set([...document.querySelectorAll("select[id^=\"po-action-\"]")].map((el) => el.id.replace(/^po-action-/, "").replace(/-\d+$/, "")))].forEach((cid) => {
			for (let ph = 0; ph < 5; ph++) [["hired-hero-orders", syncHiredHeroCard], ["charm-orders", syncCharmCard]].forEach(([prefix, fn]) => {
				const cardId = `${prefix}-${cid}-${ph}`;
				if (document.getElementById(cardId)) return;
				try {
					fn(cid, ph);
				} catch (_) {
					return;
				}
				const card = document.getElementById(cardId);
				const fid = card && card.getAttribute("data-fakeid");
				if (fid) _fillSyntheticOrderCard(fid, savedOrders[fid], savedEncounterPlans[fid]);
			});
		});
		if (document.querySelectorAll(SEL).length === before) break;
	}
}
function syncHiredHeroCard(charId, ph) {
	const containerId = `hired-hero-orders-${charId}-${ph}`;
	const existing = document.getElementById(containerId);
	const action = document.getElementById(`po-action-${charId}-${ph}`)?.value || "";
	const rawTarget = getOrderTarget(charId, ph);
	const isHire = action === "Hire Hero" && rawTarget;
	const isBrokerHire = action === "Broker" && typeof rawTarget === "string" && rawTarget.startsWith("hire:");
	if (!(isHire || isBrokerHire)) {
		if (existing) {
			const stale = existing.getAttribute("data-fakeid");
			if (stale && currentReport) currentReport.characters = (currentReport.characters || []).filter((c) => c.id !== stale);
			existing.remove();
		}
		return;
	}
	injectHiredHeroOrders(charId, ph, 99);
}
function syncResurrectCard(charId, ph) {
	syncAllResurrectCards();
}
function _resurrectCastersByHero() {
	const out = {};
	(currentReport && currentReport.characters || []).forEach((c) => {
		if (!c || c.alive === false || !/^\d+$/.test(String(c.id))) return;
		for (let ph = 0; ph < 5; ph++) {
			if ((document.getElementById(`po-action-${c.id}-${ph}`)?.value || "") !== "Cast Spell") continue;
			if (getOrderTarget(c.id, ph) !== "Resurrect") continue;
			const hid = String(document.getElementById(`po-extra-${c.id}-${ph}`)?.value || "");
			if (!/^\d+$/.test(hid)) continue;
			(out[hid] = out[hid] || []).push({
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
			action: document.getElementById(`po-action-${fakeId}-${p}`)?.value || "",
			target: getOrderTarget(fakeId, p),
			extra: getOrderExtra(fakeId, p)
		})),
		tactics: document.getElementById(`ep-tactics-${fakeId}`)?.value || "",
		notes: document.getElementById(`ep-notes-${fakeId}`)?.value || "",
		duel: document.getElementById(`ep-duel-${fakeId}`)?.value || ""
	};
}
function _teardownResurrectCard(card) {
	const stale = card.getAttribute("data-fakeid");
	if (stale && currentReport) currentReport.characters = (currentReport.characters || []).filter((c) => c.id !== stale);
	card.remove();
}
function _fillResurrectCard(fakeId, saved) {
	const fake = (currentReport && currentReport.characters || []).find((c) => c.id === fakeId);
	if (!fake || !saved) return;
	const first = (fake.hiredInPhase ?? -1) + 1;
	for (let p = first; p < 5; p++) {
		const o = (saved.phases || [])[p];
		if (!o || !o.action) continue;
		const sel = document.getElementById(`po-action-${fakeId}-${p}`);
		if (!sel || ![...sel.options].some((x) => x.value === o.action)) continue;
		sel.value = o.action;
		const wrap = document.getElementById(`po-target-wrap-${fakeId}-${p}`);
		if (wrap) try {
			wrap.innerHTML = buildTargetField(fake, p, {
				action: o.action,
				target: o.target || "",
				extra: o.extra || ""
			});
		} catch (_) {}
	}
	if (saved.tactics) {
		const h = document.getElementById(`ep-tactics-${fakeId}`);
		if (h) {
			h.value = saved.tactics;
			try {
				refreshEncounterPlan(fakeId, saved.tactics.split(",").filter(Boolean));
			} catch (_) {}
		}
	}
	if (saved.notes) {
		const n = document.getElementById(`ep-notes-${fakeId}`);
		if (n) n.value = saved.notes;
	}
	if (saved.duel) {
		const d = document.getElementById(`ep-duel-${fakeId}`);
		if (d) d.value = saved.duel;
	}
}
function _setResurrectCasterNote(card, casters) {
	const el = card.querySelector(".resurrect-casters");
	if (!el) return;
	const SEASONS_R = KC_SEASONS.slice();
	const who = casters.map((x) => `${x.name} (${SEASONS_R[x.ph] || "?"})`);
	el.textContent = casters.length > 1 ? `Raised by any of: ${who.join(", ")} — whichever succeeds, these orders apply.` : `Raised by ${who[0]}.`;
}
function syncAllResurrectCards(savedByHero) {
	savedByHero = savedByHero || {};
	document.querySelectorAll("[id^=\"resurrect-note-\"]").forEach((n) => n.remove());
	const groups = _resurrectCastersByHero();
	const kept = {};
	document.querySelectorAll("[id^=\"resurrect-orders-\"]").forEach((card) => {
		const hid = card.getAttribute("data-heroid");
		const g = hid ? groups[hid] : null;
		if (!g || kept[hid]) {
			_teardownResurrectCard(card);
			return;
		}
		if (card.getAttribute("data-firstph") !== String(g[0].ph) || card.getAttribute("data-anchor") !== g[0].charId) {
			if (!savedByHero[hid]) savedByHero[hid] = _readResurrectCardOrders(card.getAttribute("data-fakeid"));
			_teardownResurrectCard(card);
			return;
		}
		kept[hid] = card;
		_setResurrectCasterNote(card, g);
	});
	if (currentReport) {
		const live = new Set([...document.querySelectorAll("[id^=\"resurrect-orders-\"]")].map((c) => c.getAttribute("data-fakeid")));
		currentReport.characters = (currentReport.characters || []).filter((c) => !(typeof c.id === "string" && c.id.startsWith("resurrect_") && !live.has(c.id)));
	}
	Object.entries(groups).forEach(([hid, g]) => {
		if (kept[hid]) return;
		const card = injectResurrectOrders(g[0].charId, g[0].ph, hid, g);
		if (card && savedByHero[hid]) _fillResurrectCard(card.getAttribute("data-fakeid"), savedByHero[hid]);
	});
}
function injectResurrectOrders(charId, ph, heroId, casters) {
	const report = currentReport || {};
	if (!/^\d+$/.test(String(charId)) || !/^\d+$/.test(String(heroId))) return null;
	const dead = (report.knownDeadHeroes || report.deadHeroes || []).find((x) => String(x.id) === String(heroId));
	if (!dead) return null;
	const firstActable = ph + 1;
	const containerId = `resurrect-orders-${heroId}`;
	document.getElementById(containerId)?.remove();
	const casterBlock = document.getElementById(`po-action-${charId}-0`)?.closest(".orders-char-block");
	if (!casterBlock) return null;
	if (firstActable > 4) {
		const note = document.createElement("div");
		note.id = `resurrect-note-${heroId}`;
		note.className = "orders-char-block";
		note.style.cssText = "border:2px dashed #b9a7c9;opacity:0.85;margin-top:8px";
		note.innerHTML = kcHtml`
      <div class="orders-char-head" style="background:#f5eeff;color:#2e2e2e">
        \u2728 ${dead.name}
        <span style="color:#46275f;font-size:.7rem;margin-left:6px">(raised in Early Winter \u2014 no orders to give)</span>
      </div>
      <div style="padding:6px 10px 8px;background:#f5eeff;font-size:.76rem;line-height:1.6;color:#46275f">
        Early Winter is the last phase of the turn, so ${dead.name} returns with no phase left in which to act.
        There are no orders to pre-write. If the cast succeeds they stand in your caster's province at full
        health, stripped of items and armies, and take your orders normally from Spring next turn.
      </div>`;
		casterBlock.after(note);
		return null;
	}
	const SEASONS_R = KC_SEASONS.slice();
	const fakeId = `resurrect_${heroId}_via_${charId}_ph${ph}`;
	const _casterLoc = predictedLocation(charId, ph);
	const fakeChar = {
		id: fakeId,
		name: dead.name,
		isKing: false,
		race: dead.race || "Unknown",
		alignment: dead.alignment || "Neutral",
		temper: dead.temper || "Brave",
		skills: dead.skills || {},
		armies: [],
		items: [],
		pay: 1,
		locationId: dead.locationId != null ? dead.locationId : _casterLoc ? _casterLoc.id : null,
		locationName: _casterLoc && _casterLoc.name ? _casterLoc.name : dead.locationName || "(raised where they fell)",
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
		currentReport.characters = (currentReport.characters || []).filter((c) => !(typeof c.id === "string" && c.id.startsWith(`resurrect_${heroId}_via_`)));
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
	card.innerHTML = kcHtml`
    <div class="orders-char-head" style="background:#f5eeff;color:#2e2e2e">
      <button type="button" class="sec-toggle" aria-expanded="true" title="Minimise / maximise" onclick="toggleSection(this)">&#9662;</button>
      \u2728 ${dead.name}
      <span style="color:#46275f;font-size:.7rem;margin-left:6px">(if raised \u2014 can act from ${SEASONS_R[firstActable] || "next turn"})</span>
      <span style="margin-left:auto;font-size:.7rem;color:#231e16">📍 ${provLinkHtml(fakeChar.locationId, fakeChar.locationName || "?")} · Land: 5/turn · Sea: 5/turn</span>
    </div>
    <div style="padding:5px 10px 6px;background:#f5eeff;border-bottom:1px solid var(--parchment-dark);font-size:.76rem;line-height:1.6">
      <div class="resurrect-casters" style="color:#46275f;font-weight:600"></div>
      <div style="color:#46275f">These orders only take effect if one of your Resurrect casts succeeds. If every cast
      fails, or another realm raises ${dead.name} first, they are simply ignored. A phase before the hero is actually raised is skipped.</div>
      <div style="color:var(--stone);margin-top:2px">Returns at full health, stripped of all items and armies.</div>
    </div>
    <div class="orders-char-body"></div>`;
	casterBlock.after(card);
	_setResurrectCasterNote(card, casters && casters.length ? casters : [{
		charId: String(charId),
		ph,
		name: ((report.characters || []).find((x) => String(x.id) === String(charId)) || {}).name || "your caster"
	}]);
	const body = card.querySelector(".orders-char-body");
	SEASONS_R.forEach((season, phIdx) => {
		const row = document.createElement("div");
		row.className = "phase-order";
		if (phIdx < firstActable) {
			row.style.cssText = "opacity:.35;pointer-events:none";
			row.innerHTML = kcHtml`<div class="phase-label">${season}</div>
        <div style="font-size:.76rem;color:var(--stone);font-style:italic;grid-column:2/-1">(still dead)</div>`;
		} else row.innerHTML = kcHtml`
        <div class="phase-label">${season}</div>
        <select id="po-action-${fakeId}-${phIdx}" onchange="onActionChange(${kcArg(String(fakeId))},${kcArg(phIdx)},99)">
          <option value="">\u2014 Choose \u2014</option>
          ${actionsFor(fakeChar).map((a) => kcHtml`<option value="${a}">${a}</option>`)}
        </select>
        <div id="po-target-wrap-${fakeId}-${phIdx}">
          <input id="po-target-${fakeId}-${phIdx}" type="text" placeholder="Details">
        </div>`;
		body.appendChild(row);
	});
	const epDiv = document.createElement("div");
	epDiv.style.cssText = "padding:10px;border-top:1px solid var(--parchment-dark);background:#faf6ff";
	epDiv.innerHTML = kcHtml`
    <div style="font-family:Cinzel,serif;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">\u2694 Encounter Plan</div>
    <div id="ep-list-${fakeId}" style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px">
      <div style="font-size:.8rem;padding:4px 8px;background:#faf6ff;border:1px solid var(--stone);border-radius:2px">ME \u2014 Melee</div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${ENCOUNTER_TACTICS.filter((t) => t.code !== "CS" && !t.retired).map((t) => kcHtml`<button onclick="addEncounterTactic(${kcArg(String(fakeId))},${kcArg(String(t.code))})"
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
    </div>`;
	card.appendChild(epDiv);
	return card;
}
function syncCharmCard(charId, ph) {
	const containerId = `charm-orders-${charId}-${ph}`;
	const existing = document.getElementById(containerId);
	const action = document.getElementById(`po-action-${charId}-${ph}`)?.value || "";
	const spell = getOrderTarget(charId, ph);
	const heroId = document.getElementById(`po-extra-${charId}-${ph}`)?.value || "";
	const tgt = ((currentReport || {}).visibleChars || []).find((x) => String(x.id) === String(heroId));
	if (!(action === "Cast Spell" && spell === "Charm" && heroId && tgt && !tgt.isKing && !leadsArmiesP(tgt))) {
		if (existing) {
			const stale = existing.getAttribute("data-fakeid");
			if (stale && currentReport) currentReport.characters = (currentReport.characters || []).filter((c) => c.id !== stale);
			existing.remove();
		}
		return;
	}
	injectCharmOrders(charId, ph, heroId, containerId);
}
function injectCharmOrders(charId, ph, heroId, containerId) {
	const report = currentReport || {};
	if (!/^\d+$/.test(String(charId)) || !/^\d+$/.test(String(heroId))) return;
	const wanderer = (report.visibleChars || []).find((x) => String(x.id) === String(heroId) && !x.isKing && !leadsArmiesP(x));
	if (!wanderer) return;
	const isEnemy = wanderer.player != null;
	const firstActable = ph + 1;
	if (firstActable > 4) return;
	document.getElementById(containerId)?.remove();
	const casterBlock = document.getElementById(`po-action-${charId}-0`)?.closest(".orders-char-block");
	if (!casterBlock) return;
	const SEASONS_C = KC_SEASONS.slice();
	const fakeId = `charm_${heroId}_via_${charId}_ph${ph}`;
	const fakeChar = {
		id: fakeId,
		name: wanderer.name,
		isKing: false,
		race: wanderer.race || "Unknown",
		alignment: wanderer.alignment || "Neutral",
		temper: wanderer.temper || "Brave",
		skills: {},
		_hiddenSkills: true,
		armies: [],
		items: [],
		pay: wanderer.pay || 1,
		_charmEnemy: isEnemy,
		locationId: wanderer.locationId != null ? wanderer.locationId : null,
		locationName: wanderer.locationName || "(in your province)",
		effectiveSpeed: 5,
		effectiveSeaSpeed: 0,
		hiredInPhase: ph,
		encounterPlan: {
			tactics: ["ME"],
			notes: ""
		},
		hp: wanderer.hp != null ? wanderer.hp : null,
		maxHp: wanderer.maxHp != null ? wanderer.maxHp : null
	};
	if (currentReport) {
		const slotSuffix = `_via_${charId}_ph${ph}`;
		currentReport.characters = (currentReport.characters || []).filter((c) => !(typeof c.id === "string" && c.id.startsWith("charm_") && c.id.endsWith(slotSuffix)));
		currentReport.characters.push(fakeChar);
	}
	const card = document.createElement("div");
	card.id = containerId;
	card.setAttribute("data-fakeid", fakeId);
	card.className = "orders-char-block";
	card.style.cssText = "border:2px dashed #2a7a8a;opacity:0.9;margin-top:8px";
	card.innerHTML = kcHtml`
    <div class="orders-char-head" style="background:#eaf6f8;color:#2e2e2e">
      <button type="button" class="sec-toggle" aria-expanded="true" title="Minimise / maximise" onclick="toggleSection(this)">&#9662;</button>
      \u2728 ${wanderer.name}
      <span style="color:#185562;font-size:.7rem;margin-left:6px">(if charmed \u2014 can act from ${SEASONS_C[firstActable] || "next turn"})</span>
      <span style="margin-left:auto;font-size:.7rem;color:#231e16">📍 ${provLinkHtml(fakeChar.locationId, fakeChar.locationName || "?")} · Land: 5/turn · Sea: 5/turn</span>
    </div>
    <div style="padding:5px 10px 6px;background:#eaf6f8;border-bottom:1px solid var(--parchment-dark);font-size:.76rem;line-height:1.6">
      <div style="color:#185562">These orders only take effect if the Charm succeeds. If the cast fails,
      or another realm charms ${wanderer.name} first, they are simply ignored.</div>
      <div style="color:var(--stone);margin-top:2px">${isEnemy ? "Their command is seized for the rest of this turn; at the season’s end they return to their own lord (who still pays their wages). They will not attack their own lord’s heroes, and they handle no items at all while enchanted — you cannot give them anything, have them use anything, or have them hand anything over. They keep their own gear and fight with it." : "Joins your service at no hiring cost (you still pay their upkeep). For the rest of this turn the enchantment still holds them, so they handle no items — nothing given to them, nothing used, nothing handed over. From next turn they are an ordinary hero of your realm and all of it is open to them."}</div>
    </div>
    <div class="orders-char-body"></div>`;
	casterBlock.after(card);
	const body = card.querySelector(".orders-char-body");
	SEASONS_C.forEach((season, phIdx) => {
		const row = document.createElement("div");
		row.className = "phase-order";
		if (phIdx < firstActable) {
			row.style.cssText = "opacity:.35;pointer-events:none";
			row.innerHTML = kcHtml`<div class="phase-label">${season}</div>
        <div style="font-size:.76rem;color:var(--stone);font-style:italic;grid-column:2/-1">(not yet charmed)</div>`;
		} else row.innerHTML = kcHtml`
        <div class="phase-label">${season}</div>
        <select id="po-action-${fakeId}-${phIdx}" onchange="onActionChange(${kcArg(String(fakeId))},${kcArg(phIdx)},99)">
          <option value="">\u2014 Choose \u2014</option>
          ${actionsFor(fakeChar).map((a) => kcHtml`<option value="${a}">${a}</option>`)}
        </select>
        <div id="po-target-wrap-${fakeId}-${phIdx}">
          <input id="po-target-${fakeId}-${phIdx}" type="text" placeholder="Details">
        </div>`;
		body.appendChild(row);
	});
	const epDiv = document.createElement("div");
	epDiv.style.cssText = "padding:10px;border-top:1px solid var(--parchment-dark);background:#f2fafb";
	epDiv.innerHTML = kcHtml`
    <div style="font-family:Cinzel,serif;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">\u2694 Encounter Plan</div>
    <div id="ep-list-${fakeId}" style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px">
      <div style="font-size:.8rem;padding:4px 8px;background:#f2fafb;border:1px solid var(--stone);border-radius:2px">ME \u2014 Melee</div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${ENCOUNTER_TACTICS.filter((t) => t.code !== "CS" && !t.retired).map((t) => kcHtml`<button onclick="addEncounterTactic(${kcArg(String(fakeId))},${kcArg(String(t.code))})"
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
    </div>`;
	card.appendChild(epDiv);
}
function injectHiredHeroOrders(charId, ph, charIdx) {
	let heroId = getOrderTarget(charId, ph);
	if (!heroId) return;
	if (typeof heroId === "string" && heroId.startsWith("hire:")) heroId = heroId.slice(5);
	if (!/^\d+$/.test(String(heroId))) return;
	const report = currentReport || {};
	const firstActable = ph + 1;
	let heroData = null;
	Object.values(report.provinceOrderData || {}).forEach((pd) => {
		(pd.availableHeroes || []).forEach((h) => {
			if (String(h.id) === String(heroId)) heroData = h;
		});
	});
	if (!heroData) return;
	const containerId = `hired-hero-orders-${charId}-${ph}`;
	document.getElementById(containerId)?.remove();
	let charBlock = document.getElementById(`po-action-${charId}-0`)?.closest(".orders-char-block");
	if (!charBlock) {
		for (let _p = 0; _p < 5 && !charBlock; _p++) {
			const el = document.getElementById(`po-action-${charId}-${_p}`);
			if (el) charBlock = el.closest(".orders-char-block");
		}
		if (!charBlock) {
			const fake = document.querySelector(`[data-fakeid="${charId}"]`);
			if (fake) charBlock = fake;
		}
	}
	if (!charBlock) return;
	const SEASONS_H = KC_SEASONS.slice();
	const hiredCharId = `hired_${heroId}_via_${charId}_ph${ph}`;
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
		pay: heroHireWageOfP(heroData) ?? heroData.pay,
		locationId: heroData.locationId != null ? heroData.locationId : null,
		locationName: heroData.locationName || "(joining after hire)",
		effectiveSpeed: 5,
		effectiveSeaSpeed: 0,
		hiredInPhase: ph,
		encounterPlan: {
			tactics: ["ME"],
			notes: ""
		},
		hp: heroData.hp || 14,
		maxHp: heroData.maxHp || 14
	};
	if (currentReport) {
		const slotSuffix = `_via_${charId}_ph${ph}`;
		currentReport.characters = (currentReport.characters || []).filter((c) => !(typeof c.id === "string" && c.id.startsWith("hired_") && c.id.endsWith(slotSuffix)));
		currentReport.characters.push(fakeChar);
	}
	const card = document.createElement("div");
	card.id = containerId;
	card.className = "orders-char-block";
	card.style.cssText = "border:2px dashed #c8922a;opacity:0.9;margin-top:8px";
	card.setAttribute("data-fakeid", hiredCharId);
	let hireTop = heroData.topSkill || null;
	if (!hireTop) {
		const sk = Object.entries(heroData.skills || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
		if (sk.length) hireTop = {
			skill: sk[0][0],
			level: sk[0][1]
		};
	}
	const skillStr = hireTop ? kcHtml`<span style="color:var(--forest)"><strong>${skillFameLabelM(hireTop.level)}</strong> ${SKILL_LABELS[hireTop.skill] || hireTop.skill}</span>` : kcHtml`<span style="color:#aaa">No notable skills</span>`;
	card.innerHTML = kcHtml`
    <div class="orders-char-head" style="background:#fdf5e0;color:#2e2e2e">
      <button type="button" class="sec-toggle" aria-expanded="true" title="Minimise / maximise this hero's orders" onclick="toggleSection(this)">&#9662;</button>
      ⚔ ${heroData.name}
      <span style="color:#c8922a;font-size:.7rem;margin-left:6px">(newly hired — can act from ${SEASONS_H[firstActable] || "next turn"})</span>
      <span style="margin-left:auto;font-size:.7rem;color:#231e16">📍 ${provLinkHtml(fakeChar.locationId, fakeChar.locationName || "?")} · Land: 5/turn · Sea: 5/turn</span>
    </div>
    <div style="padding:5px 10px 6px;background:#fdf5e0;border-bottom:1px solid var(--parchment-dark);font-size:.76rem;display:flex;flex-wrap:wrap;gap:8px">
      <span><strong>Race:</strong> ${heroData.race}</span>
      ${skillStr}
    </div>
    <div class="orders-char-body" id="hired-body-${hiredCharId}">
    </div>`;
	charBlock.after(card);
	const body = card.querySelector(".orders-char-body");
	SEASONS_H.forEach((season, phIdx) => {
		const row = document.createElement("div");
		row.className = "phase-order";
		if (phIdx < firstActable) {
			row.style.cssText = "opacity:.35;pointer-events:none";
			row.innerHTML = kcHtml`<div class="phase-label">${season}</div>
        <div style="font-size:.76rem;color:var(--stone);font-style:italic;grid-column:2/-1">(not yet hired)</div>`;
		} else {
			const actionSelId = `po-action-${hiredCharId}-${phIdx}`;
			const targetWrapId = `po-target-wrap-${hiredCharId}-${phIdx}`;
			row.innerHTML = kcHtml`
        <div class="phase-label">${season}</div>
        <select id="${actionSelId}" onchange="onActionChange(${kcArg(String(hiredCharId))},${kcArg(phIdx)},99)">
          <option value="">— Choose —</option>
          ${actionsFor(fakeChar).map((a) => kcHtml`<option value="${a}">${a}</option>`)}
        </select>
        <div id="${targetWrapId}">
          <input id="po-target-${hiredCharId}-${phIdx}" type="text" placeholder="Details">
        </div>`;
		}
		body.appendChild(row);
	});
	const epDiv = document.createElement("div");
	epDiv.style.cssText = "padding:10px;border-top:1px solid var(--parchment-dark);background:#fdf8ee";
	epDiv.innerHTML = kcHtml`
    <div style="font-family:Cinzel,serif;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">⚔ Encounter Plan</div>
    <div id="ep-list-${hiredCharId}" style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px">
      <div style="font-size:.8rem;padding:4px 8px;background:#fdf8ee;border:1px solid var(--stone);border-radius:2px">ME — Melee</div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${ENCOUNTER_TACTICS.filter((t) => t.code !== "CS" && !t.retired).map((t) => kcHtml`<button onclick="addEncounterTactic(${kcArg(String(hiredCharId))},${kcArg(String(t.code))})"
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
    </div>`;
	card.appendChild(epDiv);
	renderPreSchool(hiredCharId);
}
function getOrderTarget(charId, ph) {
	const hidden = document.getElementById(`po-target-${charId}-${ph}`);
	if (hidden) return hidden.value || "";
	return "";
}
function getOrderExtra(charId, ph) {
	return document.getElementById(`po-extra-${charId}-${ph}`)?.value || "";
}
function updateBloodOffering(charId, ph) {
	const rite = document.getElementById(`po-target-${charId}-${ph}`)?.value || "";
	const block = document.getElementById(`bo-block-${charId}-${ph}`);
	const extra = document.getElementById(`po-extra-${charId}-${ph}`);
	const hint = document.getElementById(`bo-hint-${charId}-${ph}`);
	if (block) block.style.display = rite === "Blood Offering" ? "block" : "none";
	if (rite !== "Blood Offering") {
		if (extra) extra.value = "";
		return;
	}
	const sels = document.querySelectorAll(`.bo-sel[data-cid="${charId}"][data-ph="${ph}"]`);
	const sac = [], ben = [];
	sels.forEach((s) => {
		const idx = parseInt(s.getAttribute("data-idx"));
		if (s.value === "S") sac.push(idx);
		else if (s.value === "E") ben.push(idx);
	});
	if (extra) extra.value = `S:${sac.join(",")}|E:${ben.join(",")}`;
	if (hint) {
		if (sac.length === 0 && ben.length === 0) {
			hint.textContent = "Mark units to sacrifice and an equal number to empower.";
			hint.style.color = "var(--stone)";
		} else if (sac.length !== ben.length) {
			hint.textContent = `⚠ ${sac.length} to sacrifice vs ${ben.length} to empower — only ${Math.min(sac.length, ben.length)} pair(s) will take effect (each sacrifice funds one empowerment).`;
			hint.style.color = "#b04a4a";
		} else {
			hint.textContent = `✓ ${sac.length} unit(s) sacrificed to empower ${ben.length} other(s) by +2 tiers.`;
			hint.style.color = "#2d6a2d";
		}
	}
	if (typeof doSaveOrders === "function") doSaveOrders();
}
async function submitOrders() {
	const chars = currentReport?.characters || [];
	const btn = document.getElementById("submit-btn");
	const msg = document.getElementById("orders-msg");
	btn.disabled = true;
	btn.textContent = "Saving…";
	let missingCount = 0;
	chars.filter((c) => c.alive !== false).forEach((c) => {
		const hiredPh = c.hiredInPhase ?? -1;
		SEASONS.forEach((_, ph) => {
			if (ph <= hiredPh) return;
			if (!(document.getElementById(`po-action-${c.id}-${ph}`)?.value || "")) missingCount++;
		});
	});
	const _dcUnpicked = _pendingDiscChoices().filter((pc) => !pc.options.some((o) => o.id === discoveryChoices[pc.key])).length;
	if (missingCount > 0 || _dcUnpicked > 0) {
		msg.innerHTML = kcHtml`<div class="msg-warning">${missingCount > 0 ? `⚠ ${missingCount} phase${missingCount !== 1 ? "s" : ""} still have no action selected. You can submit anyway, and the GM will treat unfilled phases as Defend.` : ""}${_dcUnpicked > 0 ? kcHtml`${missingCount > 0 ? kcHtml`<br>` : ""}⚠ ${_dcUnpicked} research discover${_dcUnpicked !== 1 ? "ies are" : "y is"} still unchosen (💡 Research box near the top of your orders). If you submit anyway, one of each pair will be kept at random.` : ""}</div>`;
		const w = document.getElementById("orders-submit-wrap");
		if (w) {
			w.innerHTML = kcHtml`
        <button class="btn btn-crimson btn-full" style="flex:1;padding:12px;font-size:.85rem" onclick="doSubmitOrders()">Submit Anyway</button>
        <button class="btn btn-ghost" style="flex:0 0 auto;padding:10px 16px" onclick="cancelSubmit()">← Go Back</button>`;
			w.style.display = "flex";
			w.style.gap = "8px";
		}
		return;
	}
	await doSubmitOrders();
}
function setHeirName(charId, value) {
	if (!currentReport) return;
	const c = currentReport.characters.find((x) => x.id === charId);
	if (!c || !c._isHeir) return;
	c.name = String(value || "").slice(0, 40);
	doSaveOrders();
}
function setHeirTemper(charId, value) {
	if (!currentReport) return;
	const c = currentReport.characters.find((x) => x.id === charId);
	if (!c || !c._isHeir) return;
	if (!HEIR_TEMPERS_LIST.includes(value)) return;
	c.temper = value;
	doSaveOrders();
}
async function allocateHeirSkill(charId, skill, delta) {
	if (!currentReport) return;
	const c = currentReport.characters.find((x) => x.id === charId);
	if (!c || !c._isHeir) return;
	c.skills = c.skills || {};
	const cur = c.skills[skill] || 0;
	const added = heirAddedTo(c, skill);
	if ((delta || 0) > 0) {
		if (heirTotalAdded(c) >= 4) return;
		if (added >= 2) return;
		c.skills[skill] = cur + 1;
	} else {
		if (added <= 0) return;
		c.skills[skill] = cur - 1;
		if (c.skills[skill] === 0) delete c.skills[skill];
	}
	c._pendingSkillAllocation = heirPointsRemaining(c);
	await doSaveOrders();
	buildOrdersForm(currentReport.characters, false, currentGamePlayer?.orders, currentReport?._liveTurn || currentReport?.turn || 1);
}
async function resubmitOrders() {
	if (!currentGamePlayer) return;
	restoreSubmitWrap("Resubmit");
	document.getElementById("orders-msg").innerHTML = "<div class=\"msg-info\">✏ Update your orders below and hit Resubmit — your new orders will replace the previous submission.</div>";
	document.querySelectorAll("#orders-form select, #orders-form input, #orders-form button").forEach((el) => {
		if (!el.id?.includes("po-leave-all")) el.disabled = false;
	});
}
//#endregion
//#region src/ui/player/order-targets.ts
function projectedLedArmies(charId, upToPhaseExclusive, _memo) {
	const report = currentReport || {};
	const char = (report.characters || []).find((x) => x.id === charId);
	if (!char) return [];
	const memo = _memo instanceof Map ? _memo : /* @__PURE__ */ new Map();
	const _ck = `c|${String(charId)}|${upToPhaseExclusive}`;
	if (memo.has(_ck)) return memo.get(_ck).map((a) => ({ ...a }));
	memo.set(_ck, []);
	let armies = (char.armies || []).map((a) => ({
		type: a.type,
		quality: a.quality,
		unitName: a.unitName,
		race: a.race,
		_isSkeletal: a._isSkeletal
	}));
	report.provinceOrderData;
	for (let prevPh = 0; prevPh < upToPhaseExclusive; prevPh++) {
		const prevAction = document.getElementById(`po-action-${charId}-${prevPh}`)?.value || "";
		const prevTarget = document.getElementById(`po-target-${charId}-${prevPh}`)?.value || "";
		(report.characters || []).forEach((o) => {
			if (o.id === charId) return;
			const oAct = document.getElementById(`po-action-${o.id}-${prevPh}`)?.value || "";
			const oTgt = document.getElementById(`po-target-${o.id}-${prevPh}`)?.value || "";
			if (oAct === "Recruit Armies" && oTgt.split(",").map((t) => t.trim()).includes("to:" + charId)) _projRecruitUnits(oTgt.split(",").map((t) => t.trim())).forEach((u) => {
				if (!_isAutoGarrisonRecruit(u)) armies.push(u);
			});
			else if (oAct === "Leave/Transfer Army") {
				const oExtra = document.getElementById(`po-extra-${o.id}-${prevPh}`)?.value || "";
				if (String(oExtra) !== String(charId)) return;
				const oArm = projectedLedArmies(o.id, prevPh, memo);
				if (oTgt.split(",").includes("all")) oArm.forEach((a) => armies.push(a));
				else oTgt.split(",").filter(Boolean).forEach((val) => {
					val = val.trim();
					const a = oArm.find((x) => (x.unitName || x.type) === val);
					if (a) armies.push(a);
				});
			}
		});
		if (prevAction === "Recruit Armies") {
			const wrap = document.getElementById(`po-target-wrap-${charId}-${prevPh}`);
			if (wrap) {
				const destSel = wrap.querySelector(".po-recruit-dest");
				const destTok = destSel ? destSel.value : "to:self";
				if (!(destTok === "to:garrison" || destTok && destTok.startsWith("to:") && destTok !== "to:self")) _projRecruitUnits([...wrap.querySelectorAll("input[type=\"checkbox\"]:checked")].map((cb) => cb.value || "")).forEach((u) => {
					if (!_isAutoGarrisonRecruit(u)) armies.push(u);
				});
			}
		} else if (prevAction === "Pick Up Army") {
			const ploc = predictedLocation(charId, prevPh);
			const pgarr = ploc ? projectedGarrison(ploc.id, prevPh, true, charId, memo) : [];
			if (prevTarget === "all") pgarr.forEach((a) => armies.push({
				type: a.type,
				quality: a.quality,
				unitName: a.unitName
			}));
			else prevTarget.split(",").filter(Boolean).forEach((sel) => {
				sel = sel.trim();
				let gi = null;
				if (sel.startsWith("g:")) gi = parseInt(sel.slice(2));
				else if (sel.startsWith("-1:")) gi = parseInt(sel.slice(3));
				if (gi != null && pgarr[gi]) armies.push({
					type: pgarr[gi].type,
					quality: pgarr[gi].quality,
					unitName: pgarr[gi].unitName
				});
			});
		} else if (prevAction === "Leave/Transfer Army" || prevAction === "Disband Army") {
			if (prevTarget === "all") armies = [];
			else prevTarget.split(",").filter(Boolean).forEach((val) => {
				val = val.trim();
				const idx = armies.findIndex((a) => (a.unitName || a.type) === val);
				if (idx >= 0) armies.splice(idx, 1);
			});
		}
	}
	memo.set(_ck, armies.map((a) => ({ ...a })));
	return armies;
}
function exploreGainFor(c, terr) {
	const report = currentReport || {};
	const basicRate = { ...KC_BASIC_EXPLORE }[terr] || 15;
	const disc = report.discoveries || [];
	const explorerSkill = Math.min(5, effSkillP(c, "explorer"));
	const scoutBonus = 1, compass = 1;
	let discMult = 1;
	if (report.exploreDiscMult && report.exploreDiscMult[terr] != null) discMult = report.exploreDiscMult[terr];
	else disc.forEach((d) => {
		const m = /map(?:s)? (\d+)% more/i.exec(d.desc || "");
		if (m && (!/mountain/i.test(d.desc) || terr === "mountain")) discMult *= 1 + parseInt(m[1]) / 100;
	});
	const hasLore = (c.titlesHeld || []).some((t) => /Loremaster/i.test(t.name || ""));
	const hasTrail = (c.minorHeld || []).some((t) => /Trailblazer/i.test(t.name || ""));
	const loreMult = (hasLore ? 1.05 : 1) * (hasTrail ? 1.05 : 1);
	return Math.min(100, Math.floor(basicRate * (explorerSkill + 1) * scoutBonus * compass * discMult * loreMult));
}
function exploreQueuedBefore(charId, ph, provId) {
	let sum = 0;
	(currentReport && currentReport.characters || []).forEach((o) => {
		if (!o || o.alive === false) return;
		for (let p = 0; p <= 4; p++) {
			const isSelf = String(o.id) === String(charId);
			if (isSelf && p >= ph) break;
			if (!isSelf && p > ph) break;
			if (document.getElementById(`po-action-${o.id}-${p}`)?.value !== "Explore") continue;
			const loc = predictedLocation(o.id, p);
			if (!loc || loc.id !== provId) continue;
			const pd = (currentReport && currentReport.provinceOrderData || {})[provId];
			sum += exploreGainFor(o, pd && pd.terrain || null);
		}
	});
	return sum;
}
function exploreMoveGainBefore(c, upToPhaseExclusive, provId) {
	let gain = 0;
	for (let p = 0; p < upToPhaseExclusive; p++) {
		const act = document.getElementById(`po-action-${c.id}-${p}`)?.value;
		if (act !== "Move" && act !== "Forced March") continue;
		const dest = predictedLocation(c.id, p + 1);
		const from = predictedLocation(c.id, p);
		if (!dest || !from || dest.id === from.id || dest.id !== provId) continue;
		const lvl = Math.min(5, effSkillP(c, "explorer"));
		const cloak = (c.items || []).some((it) => it && /Traveller's Cloak/i.test(it.name || "")) ? 20 : 0;
		const marchPerk = ((c.skills || {}).march || 0) >= 6 ? 2 * (c.armies || []).length : 0;
		gain += 10 + 5 * lvl + cloak + marchPerk;
	}
	return gain;
}
function exploreProjectionNote(c, ph) {
	const loc = predictedLocation(c.id, ph);
	const report = currentReport || {};
	const pd = loc ? (report.provinceOrderData || {})[loc.id] : null;
	const wm = loc ? (report.worldMeta && report.worldMeta.provinces || []).find((x) => x.id === loc.id) : null;
	const terr = pd && pd.terrain || wm && wm.terrain || null;
	if (!loc) return kcHtml`🧭 Explores the province ${c.name} stands in.`;
	if (skillsUnseenP(c)) return kcHtml`🧭 Explores ${loc.name}. The gain depends on an Explorer level ${c._unknownSkills ? `not known until ${c.name} has joined` : `hidden from you`}.`;
	if (!terr) return kcHtml`🧭 Explores ${loc.name || "the province"} — its ground is still unknown to you, so how much it will yield cannot be judged from here.`;
	const gain = exploreGainFor(c, terr);
	const known = Math.min(100, (pd && pd.explored != null ? pd.explored : wm && wm.explored) || 0);
	const moved = exploreMoveGainBefore(c, ph, loc.id);
	const queued = exploreQueuedBefore(c.id, ph, loc.id);
	const before = Math.min(100, known + moved + queued);
	const after = Math.min(100, before + gain);
	const priorBits = [];
	if (moved > 0) priorBits.push(`+${moved}% from marching in`);
	if (queued > 0) priorBits.push(`+${queued}% from earlier Explore orders this turn`);
	const prior = priorBits.length ? ` (${known}% mapped now, ${priorBits.join(", ")})` : "";
	if (before >= 100) return kcHtml`🧭 ${loc.name} is already fully mapped${prior ? ` ${prior}` : ""} — this Explore order would add nothing.`;
	return kcHtml`🧭 ${loc.name} (${capitalise(terr)}) is <strong>${before}%</strong> mapped; this order adds about <strong>+${gain}%</strong> → <strong>${after}%</strong>${after >= 100 ? " — fully explored" : ""}${prior}.`;
}
function refreshExploreNotes() {
	(currentReport && currentReport.characters || []).forEach((c) => {
		if (!c || c.alive === false) return;
		for (let p = 0; p <= 4; p++) {
			const el = document.getElementById(`po-explore-note-${c.id}-${p}`);
			if (el) el.innerHTML = exploreProjectionNote(c, p);
		}
	});
}
function predictedLocation(charId, upToPhaseExclusive) {
	const report = currentReport;
	if (!report) return null;
	const char = (report.characters || []).find((c) => c.id === charId);
	if (!char) return null;
	let locId = char.locationId;
	const worldMeta = report.worldMeta;
	if (!worldMeta) return {
		id: locId,
		name: char.locationName
	};
	for (let ph = 0; ph < upToPhaseExclusive; ph++) {
		const action = document.getElementById(`po-action-${charId}-${ph}`)?.value;
		if (action === "Forced March") {
			const fmT = (getOrderTarget(charId, ph) || "").trim();
			const fmId = parseInt(fmT.startsWith("prov:") ? fmT.slice(5) : fmT);
			if (!isNaN(fmId) && worldMeta.provinces.some((p) => p.id === fmId)) locId = fmId;
			continue;
		}
		if (action !== "Move") continue;
		const tgt = getOrderTarget(charId, ph);
		if (!tgt) continue;
		if (tgt.startsWith("prov:")) {
			const pid = parseInt(tgt.slice(5));
			if (!isNaN(pid) && worldMeta.provinces.some((p) => p.id === pid)) locId = pid;
			continue;
		}
		if (!tgt.startsWith("dir:")) continue;
		const dir = tgt.slice(4);
		const curProv = worldMeta.provinces.find((p) => p.id === locId);
		if (!curProv) continue;
		const HEX_DIRS = KC_HEX_DIRS.slice();
		const even = [
			[-1, -1],
			[-1, 0],
			[0, -1],
			[0, 1],
			[1, -1],
			[1, 0]
		];
		const odd = [
			[-1, 0],
			[-1, 1],
			[0, -1],
			[0, 1],
			[1, 0],
			[1, 1]
		];
		const idx = HEX_DIRS.indexOf(dir);
		if (idx < 0) continue;
		const [dr, dc] = (curProv.row % 2 === 0 ? even : odd)[idx];
		const nr = curProv.row + dr;
		const cols = worldMeta.cols, rows = worldMeta.rows;
		if (nr < 0 || nr >= rows) continue;
		const nc = ((curProv.col + dc) % cols + cols) % cols;
		const nid = nr * cols + nc;
		if (worldMeta.provinces.find((p) => p.id === nid)) locId = nid;
	}
	const prov = worldMeta.provinces.find((p) => p.id === locId);
	return prov ? {
		id: locId,
		name: prov.name || "Unknown"
	} : {
		id: locId,
		name: "Unknown"
	};
}
function provDirectionLabel(fromId, toId, provs, cols) {
	if (!Array.isArray(provs)) return null;
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
function getAlreadyRecruitedThisTurn(charId, upToPhaseExclusive) {
	const recruited = {};
	const savedOrders = currentGamePlayer?.orders;
	let parsedOrders = {};
	if (savedOrders) try {
		const raw = typeof savedOrders === "string" ? JSON.parse(savedOrders) : savedOrders;
		parsedOrders = (raw.orders || raw)[charId] || [];
	} catch (e) {}
	for (let ph = 0; ph < upToPhaseExclusive; ph++) {
		const domAction = document.getElementById(`po-action-${charId}-${ph}`)?.value;
		if ((domAction || parsedOrders[ph]?.action || "") !== "Recruit Armies") continue;
		const tgt = domAction ? getOrderTarget(charId, ph) : parsedOrders[ph]?.target || "";
		if (!tgt) continue;
		const loc = predictedLocation(charId, ph);
		const provKey = loc ? loc.id : "unknown" + ph;
		tgt.split(",").forEach((sel) => {
			const s = sel.trim();
			if (s.startsWith("merc:")) return;
			if (s.startsWith("to:")) return;
			const parts = s.split("|");
			if (parts[0]) {
				const key = `${provKey}:${parts[0].trim()}`;
				recruited[key] = (recruited[key] || 0) + 1;
			}
		});
	}
	return recruited;
}
globalThis._draftOrdersSnapshot = {};
function draftOrderAt(charId, ph) {
	const actEl = document.getElementById(`po-action-${charId}-${ph}`);
	if (actEl) return {
		action: actEl.value || "",
		target: getOrderTarget(charId, ph)
	};
	const sv = ((_draftOrdersSnapshot || {})[charId] || [])[ph] || {};
	return {
		action: sv.action || "",
		target: sv.target || ""
	};
}
var LAIR_POWER_RANK = {
	Weak: 0,
	Moderate: 1,
	Powerful: 2,
	Legendary: 3
};
function defaultLairTarget(c, ph, provId, feats) {
	const taken = /* @__PURE__ */ new Set();
	(currentReport && currentReport.characters || []).forEach((o) => {
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
	const ranked = (feats || []).filter((f) => !f.ritualSite && !taken.has(String(f.idx))).sort((a, b) => (a.ritualSite ? 9 : LAIR_POWER_RANK[a.monsterPower] ?? 5) - (b.ritualSite ? 9 : LAIR_POWER_RANK[b.monsterPower] ?? 5) || a.idx - b.idx);
	return ranked.length ? String(ranked[0].idx) : "";
}
function defaultResearchField(c, ph) {
	const here = predictedLocation(c.id, ph);
	const hereId = here ? here.id : c.locationId;
	const chars = (currentReport && currentReport.characters || []).filter((o) => o && o.alive !== false);
	const counts = {};
	let best = "", bestN = 0;
	chars.forEach((o) => {
		if (o.id === c.id) return;
		const d = draftOrderAt(o.id, ph);
		if (d.action !== "Research" || !d.target) return;
		const loc = predictedLocation(o.id, ph);
		if ((loc ? loc.id : o.locationId) !== hereId) return;
		counts[d.target] = (counts[d.target] || 0) + 1;
		if (counts[d.target] > bestN) {
			bestN = counts[d.target];
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
	const report = currentReport || {};
	const here = predictedLocation(c.id, ph);
	const hereId = here ? here.id : c.locationId;
	const counts = {};
	let best = "", bestN = 0;
	(report.characters || []).forEach((o) => {
		if (!o || o.id === c.id || o.alive === false) return;
		const d = draftOrderAt(o.id, ph);
		if (d.action !== "Practice Skill") return;
		const sk = d.target;
		if (!sk || !ALL_SKILLS.includes(sk)) return;
		const loc = predictedLocation(o.id, ph);
		if ((loc ? loc.id : o.locationId) !== hereId) return;
		counts[sk] = (counts[sk] || 0) + 1;
		if (counts[sk] > bestN) {
			bestN = counts[sk];
			best = sk;
		}
	});
	return best;
}
function practiceOwnEarlierSkill(c, ph) {
	for (let q = ph - 1; q >= 0; q--) {
		const d = draftOrderAt(c.id, q);
		if (d.action !== "Practice Skill") continue;
		if (d.target && ALL_SKILLS.includes(d.target)) return d.target;
	}
	return "";
}
function buildTargetField(c, ph, saved) {
	const action = saved.action || "";
	const target = saved.target || "";
	const extra = saved.extra || "";
	const report = currentReport || {};
	const provOrderData = report.provinceOrderData || {};
	if (L79_ORDERS[action]) {
		const cfg = L79_ORDERS[action];
		const hintHtml = kcHtml`<div style="font-size:.68rem;color:var(--stone);margin-top:2px">${action === "Grand Design" ? gdHintFor(report) : cfg.hint}</div>${orderChanceNote(c, action, ph)}`;
		if (cfg.target === "none") return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${action} — no target needed" readonly>${hintHtml}`;
		if (cfg.target === "province") {
			const wmProvs = report.worldMeta?.provinces || [];
			if (cfg.provKind === "move_adjacent") {
				const curLoc = predictedLocation(c.id, ph);
				const curId = curLoc ? curLoc.id : c.locationId;
				const curP = wmProvs.find((p) => p.id === curId);
				const opts = (curP && curP.neighbors || []).map((pid) => {
					const p = wmProvs.find((x) => x.id === pid);
					if (!p) return "";
					return kcHtml`<option value="${pid}" ${target == pid ? "selected" : ""}>${p.name || "Unknown province (" + (provDirectionLabel(curId, pid, wmProvs, report.worldMeta?.cols) || "?") + ")"}${p.ownerName ? ` — ${p.ownerName}` : ""}</option>`;
				}).filter(Boolean);
				return opts.length ? kcHtml`<select id="po-target-${c.id}-${ph}">${opts}</select>${hintHtml}` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No adjacent province to march into" disabled>${hintHtml}`;
			}
			if (cfg.provKind === "sea_adjacent") {
				const curLoc = predictedLocation(c.id, ph);
				const curId = curLoc ? curLoc.id : c.locationId;
				const curP = wmProvs.find((p) => p.id === curId);
				const opts = [curId, ...curP && curP.neighbors || []].map((pid) => {
					const p = wmProvs.find((x) => x.id === pid);
					if (!p || p.terrain !== "sea") return "";
					return kcHtml`<option value="${pid}" ${target == pid ? "selected" : ""}>${p.name || "Sea (" + pid + ")"}${pid === curId ? " (here)" : ""}</option>`;
				}).filter(Boolean);
				return opts.length ? kcHtml`<select id="po-target-${c.id}-${ph}">${opts}</select>${hintHtml}` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No sea province here or adjacent to seal" disabled>${hintHtml}`;
			}
			const opts = wmProvs.filter((p) => p.name && p.terrain && p.terrain !== "sea" && p.owner != null && p.owner !== c.player).map((p) => kcHtml`<option value="${p.id}" ${target == p.id ? "selected" : ""}>${p.name}${p.ownerName ? ` — ${p.ownerName}` : ""}</option>`);
			return opts.length ? kcHtml`<select id="po-target-${c.id}-${ph}">${opts}</select>${hintHtml}` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No enemy province in view to strike" disabled>${hintHtml}`;
		}
		if (cfg.target === "here_or_adjacent") {
			const here = predictedLocation(c.id, ph)?.id ?? c.locationId;
			const wm = report.worldMeta?.provinces || [];
			const hp = wm.find((p) => p.id === here);
			const opts = [here, ...hp && hp.neighbors || []].map((pid) => {
				const p = wm.find((x) => x.id === pid);
				const nm = p && p.name || (pid === here ? "this province" : `Unknown province (${provDirectionLabel(here, pid, wm, report.worldMeta?.cols) || "?"})`);
				return kcHtml`<option value="${pid}" ${String(target) === String(pid) || !target && pid === here ? "selected" : ""}>${nm}${pid === here ? " (here)" : ""}${p && p.explored != null ? ` — ${Math.min(100, p.explored)}% mapped` : ""}</option>`;
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
			const hp = (report.worldMeta?.provinces || []).find((p) => p.id === here);
			const atWar = (pi) => (report.diplomacy && report.diplomacy.known || []).some((k) => k.index === pi && k.relation === "enemy");
			const owner = hp ? hp.owner : null;
			const rich = !!hp && (hp.wealth === "Rich" || hp.tax != null && hp.tax >= 7);
			const home = !!(hp && hp.isHomeCapitalOfOwner);
			const no = (why) => kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${why}" disabled>${hintHtml}`;
			if (owner == null || owner === c.player) return no("A Grand Heist needs enemy ground — this province is not held by a rival realm");
			if (!atWar(owner)) return no(`You are not at war with ${hp.ownerName || "this realm"} — declare war first`);
			if (!rich && !home) return no(`${hp.name || "This province"} is not worth robbing — a heist needs their capital or rich country (tax 7+)`);
			return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${hp.name} — ${hp.ownerName || "the enemy realm"}" readonly>
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">🏦 You will crack the vaults of <strong>${hp.name}</strong> — ${home ? `${hp.ownerName || "the enemy"}'s home capital` : "rich country"}.</div>${hintHtml}`;
		}
		if (cfg.target === "character") {
			const here = predictedLocation(c.id, ph)?.id ?? c.locationId;
			const opts = (report.visibleChars || []).filter((x) => x.locationId === here && (x.player === null || x.player !== c.player)).map((x) => kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${target == x.id ? "selected" : ""}>${x.name}${x.isKing ? " 👑" : ""}${x.player === null ? " (wandering)" : ` ⚔ (${realmNameP(x.player, report)})`} — ${x.locationName || "?"}</option>`);
			return opts.length ? kcHtml`<select id="po-target-${c.id}-${ph}">${opts}</select>${hintHtml}` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No enemy hero in your province this phase" disabled>${hintHtml}`;
		}
	}
	const HEX_DIRS_BUILD = KC_HEX_DIRS.slice();
	const EVEN_OFF = [
		[-1, -1],
		[-1, 0],
		[0, -1],
		[0, 1],
		[1, -1],
		[1, 0]
	];
	const ODD_OFF = [
		[-1, 0],
		[-1, 1],
		[0, -1],
		[0, 1],
		[1, 0],
		[1, 1]
	];
	const worldMeta_ = report.worldMeta || {};
	const wCols = worldMeta_.cols || 20;
	const wRows = worldMeta_.rows || 10;
	const wProvs = worldMeta_.provinces || [];
	const curLocObj = predictedLocation(c.id, ph);
	const curProv_ = curLocObj ? wProvs.find((p) => p.id === curLocObj.id) : null;
	let blockedNorth = false, blockedSouth = false;
	const _defaultDir = action === "Move" && !target ? lastMoveDirOf(c.id, ph) : null;
	const dirOpts = Object.entries(DIRECTIONS).map(([v, l]) => {
		let provLabel = "", offMap = false;
		if (curProv_) {
			const idx2 = HEX_DIRS_BUILD.indexOf(v);
			if (idx2 >= 0) {
				const [dr, dc] = (curProv_.row % 2 === 0 ? EVEN_OFF : ODD_OFF)[idx2];
				const nr = curProv_.row + dr;
				const nc = ((curProv_.col + dc) % wCols + wCols) % wCols;
				if (nr >= 0 && nr < wRows) {
					const nid = nr * wCols + nc;
					const nbProv = wProvs.find((p) => p.id === nid);
					if (nbProv && nbProv.name) provLabel = ` (${nbProv.name})`;
					else if (!nbProv) offMap = true;
				} else {
					offMap = true;
					if (dr < 0) blockedNorth = true;
					else blockedSouth = true;
				}
			}
		}
		if (offMap) return null;
		const nidOut = curProv_ ? (curProv_.row + (curProv_.row % 2 === 0 ? EVEN_OFF : ODD_OFF)[HEX_DIRS_BUILD.indexOf(v)][0]) * wCols + ((curProv_.col + (curProv_.row % 2 === 0 ? EVEN_OFF : ODD_OFF)[HEX_DIRS_BUILD.indexOf(v)][1]) % wCols + wCols) % wCols : null;
		const valOut = nidOut != null ? `prov:${nidOut}` : `dir:${v}`;
		return kcHtml`<option value="${valOut}" ${target === valOut || target === "dir:" + v ? "selected" : !target && _defaultDir === v ? "selected" : ""}>${l}${provLabel}</option>`;
	}).filter(Boolean);
	const stayOpt = curProv_ ? kcHtml`<option value="prov:${curProv_.id}" ${target === `prov:${curProv_.id}` ? "selected" : ""}>Stay in ${curProv_.name || "this province"} (return here if displaced)</option>` : "";
	switch (action) {
		case "Move": {
			const edgeNote = blockedNorth || blockedSouth ? kcHtml`<div style="font-size:.72rem;color:var(--stone);margin-top:3px">\u2744 The impassable icy wastelands to the ${blockedNorth && blockedSouth ? "north and south" : blockedNorth ? "north" : "south"} bar any further movement in that direction — the world does not extend beyond them.</div>` : "";
			const _allOpts = String(kcHtml`${dirOpts}${stayOpt}`);
			const _initSel = (() => {
				const m = _allOpts.match(/<option value="([^"]+)" selected>/);
				if (m) return m[1];
				const f = _allOpts.match(/<option value="([^"]+)"/);
				return f ? f[1] : "";
			})();
			const _initDest = (() => {
				if (!_initSel.startsWith("prov:")) return null;
				const id = parseInt(_initSel.slice(5));
				return isNaN(id) ? null : wProvs.find((p) => p.id === id) || null;
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
			const foes = (report.visibleChars || []).filter((x) => x.id !== c.id && x.locationId === hereId && (x.player === null || x.player !== c.player));
			const spyLvl = effSkillP(c, "spy");
			const charPct = Math.max(5, Math.min(95, 25 + 10 * spyLvl));
			const _spHide = skillsUnseenP(c);
			const opts = foes.map((x) => kcHtml`<option value="char:${x.id}"${realmOptStyleP(x.player, report)} ${target === `char:${x.id}` ? "selected" : ""}>Spy on ${x.name}${x.isKing ? " 👑 (king)" : ""}${x.isWandering ? " (wandering)" : x.player != null ? ` ⚔ (${realmNameP(x.player, report)})` : ""}${_spHide ? " — learns their skills, items and army" : ` — ~${charPct}% to learn their skills, items and army`}</option>`);
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="rebuildTargetWrap(${kcArg(String(c.id))},${kcArg(ph)})"><option value="" ${!target ? "selected" : ""}>Spy on the province (${here ? here.name : "here"})</option>${opts}</select>
        ${_spHide ? kcHtml`<div style="font-size:.72rem;color:var(--stone);margin-top:3px">Success: 25% +10% per Spy level — ${unseenSuffixP(c)}.</div>` : String(target || "").startsWith("char:") ? kcHtml`<div style="font-size:.72rem;color:var(--stone);margin-top:3px">Success: <strong>${charPct}%</strong> (25% +10% per Spy level) — reveals every skill level, magic item and army unit. Win or lose, you may be <strong>caught</strong>: 20% +10% per level of their Spy, −10% per level of yours, +15% in their realm's land, −15% in yours. A caught spy is brought to a personal fight unless the target's Encounter Plan is set to Refuse — put <strong>Flee</strong> at the head of your plan if you would rather not fight.</div>` : orderChanceNote(c, "Spy", ph)}`;
		}
		case "Rest": return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="(acts in current province)" disabled>`;
		case "Defend":
			if ((c.armies || []).length === 0) return kcHtml`<input type="hidden" id="po-target-${c.id}-${ph}" value="">
          <div style="font-size:.72rem;color:var(--forest)">🗡 Lies in wait around ${curProv_ ? curProv_.name : "the province they stand in"} and its neighbours.</div>
          <div style="font-size:.7rem;color:var(--stone);margin-top:3px">With no column at their back they cannot bar a road, but they will try to <em>ambush</em> any enemy character who marches into their province or one adjacent — springing a personal battle. Their <strong>Spy</strong> skill decides the odds of catching them (harder against a commander leading an army). A crowned king cannot be ambushed this way unless the ambusher is also a king. Done once an ambush is sprung (a Defend order in a later season sets a new watch); cancelled by a later Move or Encounter order.</div>`;
			return kcHtml`<input type="hidden" id="po-target-${c.id}-${ph}" value="">
        <div style="font-size:.72rem;color:var(--forest)">🛡 Guards ${curProv_ ? curProv_.name : "the province they stand in"} and its neighbours.</div>
        <div style="font-size:.7rem;color:var(--stone);margin-top:3px">Keeps watch for the rest of the turn, starting this phase. If an enemy army marches into a neighbouring province <em>of yours</em> — or an enemy hero <strong>raises, summons or seizes troops</strong> inside one — they march there at once (1 movement point) and are in the line <em>before</em> the enemy can take it, fighting as the <strong>defender</strong> with the garrison at their side, however strong the foe. A column with ships or sea-beasts in it can only answer by sea — it never rides overland from one land province to another. One ride-out per phase; if their own province is attacked they hold it instead. The watch then carries on from wherever they stand — until it brings them to a battle: win or lose, the Defend order is then done, and only a Defend order in a <em>later</em> season sets a new watch. Also ended by a later Move or Encounter order.</div>
        <div style="font-size:.7rem;color:var(--stone);margin-top:3px">They ride out only <em>after</em> every non-moving order of the phase has resolved — so a spell cast on them, a column handed over or an item passed to them <strong>in the same phase</strong> reaches them first, and they still arrive before any invader marches in. Only support ordered for a phase <em>after</em> they have gone misses them: a spell on them is then never worked (no casting slot lost), a transfer is refused with the troops kept, and a Send Item follows by courier.</div>`;
		case "Encounter Character": {
			const allSeen = (report.encounterTargets || []).filter((x) => x.id !== c.id);
			const reasonOf = (x) => x.untargetable === "faceless" ? "no face anyone can remember — cannot be hunted" : x.isKing && !c.isKing ? "only your king may hunt a king" : null;
			const targets = allSeen.filter((x) => !reasonOf(x));
			if (allSeen.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No enemy characters in sight (own / occupied / spied provinces)" disabled>`;
			const opts = allSeen.map((x) => {
				const why = reasonOf(x);
				return kcHtml`<option value="${why ? "" : x.id}"${realmOptStyleP(x.player, report)} ${why ? "disabled" : ""} ${!why && target == x.id ? "selected" : ""}>${x.name}${x.isKing ? " 👑 (king)" : ""}${x.player === null ? " (wandering)" : ` ⚔ (${realmNameP(x.player, report)})`} — ${x.locationName || "?"}${x.leadsArmy ? " (leads troops)" : ""}${why ? ` — ${why}` : ""}</option>`;
			});
			if (targets.length === 0) return kcHtml`<select id="po-target-${c.id}-${ph}"><option value="" selected>— No character here can be hunted by ${c.name} —</option>${opts}</select>`;
			return kcHtml`<select id="po-target-${c.id}-${ph}"><option value="">— Choose character to hunt down —</option>${opts}</select>
        <div style="font-size:.72rem;color:var(--stone);margin-top:3px">Your hero sets out after this character and chases them across provinces — one province per phase, a movement point each (the chase stalls if they run out of movement). Once you share a province, the chance to corner them each phase is 70%, +5% per level of your Spy, −5% per level of theirs (5–100%). When they catch up: two columns give battle; otherwise it is a personal duel — but to reach a quarry leading troops your hero must first slip through their camp: 60% less 8% per unit they lead, plus 5% per level of your Spy, less 5% per level of their Tactical (5–95%). Turned away by the sentries, the chase ends. Talk/Steal/Scout tactics don't apply — only combat tactics.</div>`;
		}
		case "Steal": {
			const thiefLvl = effSkillP(c, "thief");
			const loc = predictedLocation(c.id, ph);
			const _allVisEnemy = (report.visibleChars || []).filter((x) => x.player !== null && x.player !== c.player);
			const visibleEnemyChars = loc ? _allVisEnemy.filter((x) => x.locationId === loc.id) : [];
			const _elsewhere = _allVisEnemy.length - visibleEnemyChars.length;
			const pdS = loc ? provOrderData[loc.id] : null;
			const garrN = pdS && pdS.owner != null && pdS.owner !== c.player ? (pdS.garrisonArmies || []).length : 0;
			if (visibleEnemyChars.length === 0 && garrN === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Nothing to steal from in ${loc ? loc.name : "this province"}${_elsewhere > 0 ? ` (${_elsewhere} rival${_elsewhere !== 1 ? "s" : ""} in sight elsewhere — a thief must stand in the same province; move there first)` : " — you need a rival character or an enemy garrison"}" disabled>`;
			const base = 50 + 10 * Math.min(thiefLvl, 5);
			const _stHide = skillsUnseenP(c);
			const _stPct = (halved) => _stHide ? "" : ` — ~${halved ? Math.floor(base / 2) : base}% chance`;
			const opts = visibleEnemyChars.map((x) => {
				return kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${target == x.id ? "selected" : ""}>${x.name}${x.isKing ? " 👑" : ""} ⚔ (${realmNameP(x.player, report)})${x.armies > 0 ? " — leads troops (halved)" : ""}${_stPct(x.armies > 0)}</option>`;
			});
			const garrOpt = garrN > 0 ? kcHtml`<option value="garrison" ${target === "garrison" ? "selected" : ""}>The garrison paymaster of ${pdS.name || "this province"} (${garrN} unit${garrN !== 1 ? "s" : ""})${_stPct(true)}</option>` : "";
			const _stNote = _stHide ? kcHtml`<div style="font-size:.72rem;color:var(--stone);margin-top:3px">Success: 50% +10% per Thief level (halved if the mark leads troops or the paymaster is guarded) — ${unseenSuffixP(c)}, and without Thief training the attempt fails.</div>` : "";
			return kcHtml`<select id="po-target-${c.id}-${ph}"><option value="">— Choose target —</option>${opts}${garrOpt}</select>
        <div style="font-size:.72rem;color:var(--stone);margin-top:3px">Only characters in ${loc ? loc.name : "the same province"} are listed — a thief never chases; move there in an earlier phase first.${_elsewhere > 0 ? ` (${_elsewhere} other rival${_elsewhere !== 1 ? "s" : ""} in sight elsewhere.)` : ""} You cannot tell what a rival carries: a successful theft lifts one of their magic items at random (the lesser trinkets come to hand far more readily than a legendary relic), or 5% of their realm's treasury if they carry no magic. <strong>If you fail and are spotted, the victim draws steel</strong> — put <strong>Flee</strong> at the head of this character's Encounter Plan if you would rather not fight.</div>${_stNote}${orderChanceNote(c, "Steal", ph)}`;
		}
		case "Search Feature":
		case "Search Lair": {
			const loc = predictedLocation(c.id, ph);
			const pd = (loc ? provOrderData[loc.id] : null) || provOrderData[c.locationId] || null;
			const _provId = loc ? loc.id : c.locationId;
			const _lairSel = target !== "" && target != null ? String(target) : defaultLairTarget(c, ph, _provId, pd?.features || []);
			const feats = (pd?.features || []).filter((f) => !f.ritualSite).map((f) => {
				const diff = f.ritualSite ? "Ritual Site" : f.monsterPower || "";
				const _g = f.ritualSite ? "" : [f.monster, f.monsterCat ? f.monsterCat.toLowerCase() : ""].filter(Boolean).join(", ");
				return kcHtml`<option value="${f.idx}" ${_lairSel === String(f.idx) ? "selected" : ""}>${f.name}${diff ? ` (${diff})` : ""}${_g ? ` — ${_g}` : ""}</option>`;
			});
			return feats.length ? kcHtml`<select id="po-target-${c.id}-${ph}">${feats}</select>` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No known lairs in current province" disabled>`;
		}
		case "Hunting Rumours": {
			const loc = predictedLocation(c.id, ph);
			const feats = (((loc ? provOrderData[loc.id] : null) || provOrderData[c.locationId] || null)?.features || []).filter((f) => !f.ritualSite && f.monster);
			if (!feats.length) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No known lairs in ${loc ? loc.name : "this province"} to ask about — explore, or move to a province with a known lair" disabled>`;
			const chosen = new Set(String(target || "").split(",").map((t) => t.trim()).filter(Boolean));
			const gold = report.kingdom && report.kingdom.gold != null ? report.kingdom.gold : null;
			const rows = feats.map((f) => {
				const price = RUMOUR_COST_BY_POWER_P[f.monsterPower] || 1;
				const kind = [f.monster, f.monsterCat ? f.monsterCat.toLowerCase() : ""].filter(Boolean).join(", ");
				return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:.78rem;cursor:pointer"><input type="checkbox" value="${f.idx}" ${chosen.has(String(f.idx)) ? "checked" : ""} onchange="updateRumourTarget(${kcArg(String(c.id))},${kcArg(ph)})"> <span>${f.name} <span style="color:var(--stone)">(${f.monsterPower || "?"})</span> — ${kind} — <strong>${price}g</strong></span></label>`;
			});
			const total = [...chosen].reduce((s, ix) => {
				const f = feats.find((x) => String(x.idx) === String(ix));
				return s + (f ? RUMOUR_COST_BY_POWER_P[f.monsterPower] || 1 : 0);
			}, 0);
			return kcHtml`<div id="po-rumour-wrap-${c.id}-${ph}" style="background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px 6px">${rows}
        <div id="po-rumour-total-${c.id}-${ph}" style="font-size:.72rem;color:var(--stone);margin-top:3px">Cost of the ticked lairs: <strong>${total}g</strong>${gold != null ? ` (treasury ${gold}g)` : ""} — paid per lair, in the order listed, until the purse runs dry.</div>
        <div style="font-size:.72rem;color:var(--stone);margin-top:3px">For every lair paid for, ${c.name} learns all three: the guardian's <strong>weakness</strong> (marked on your Known Lairs for good), its <strong>hoard</strong> (exact gold and the magic that lies there), and <strong>your own odds</strong> of defeating it as you stand today — told as one of five bands, from no chance to almost certain.</div>
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${[...chosen].join(",")}"></div>`;
		}
		case "Equip Items": {
			const held = predictedItems(c.id, ph).filter((it) => it && itemSlot(it) && itemUsableBy(it, c));
			if (held.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${skillsUnseenP(c) ? `What ${c.name} carries is not yours to see — they wear and wield their own gear as they see fit` : "Nothing to wear or wield (no weapon, armour, shield, cloak, helm, ring, amulet or combat items)"}" disabled>`;
			const chosen = (target || "").split(",").map((t) => t.trim()).filter(Boolean);
			const rows = ITEM_SLOT_ORDER_P.map((sl) => {
				const opts = held.filter((it) => itemSlot(it) === sl);
				if (opts.length === 0) return "";
				const cap = ITEM_SLOT_CAP_P[sl];
				const pre = chosen.length ? chosen.filter((n) => opts.some((o) => o.name === n)) : opts.filter((o) => o.equipped !== false).map((o) => o.name);
				const sels = Array.from({ length: cap }, (_, k) => kcHtml`<select data-slot="${sl}" onchange="updateEquipTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="font-size:.75rem;flex:1"><option value="">— none —</option>${opts.map((o) => kcHtml`<option value="${o.name}" ${pre[k] === o.name ? "selected" : ""}>${o.name}${isLegendaryItem(o) ? "✨ " : ""}</option>`)}</select>`);
				return kcHtml`<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:'Cinzel',serif;font-size:.68rem;color:var(--stone);min-width:110px">${ITEM_SLOT_LABEL_P[sl]}</span>${sels}</div>`;
			});
			const init = chosen.length ? chosen : held.filter((o) => o.equipped !== false).map((o) => o.name);
			return kcHtml`<div id="po-equip-wrap-${c.id}-${ph}" style="background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px 6px">${rows}
        <div style="font-size:.68rem;color:#2f281c;margin-top:3px">Only equipped items in these slots give their bonus; everything else you carry is always active. Equipped items can still be sent to other characters.</div>
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${init.join(",")}"></div>`;
		}
		case "Use Item": {
			const ACTIVE_ITEM_STATS = /* @__PURE__ */ new Set(["massPromote", "castSpell"]);
			const active = predictedItems(c.id, ph).filter((it) => it && it.effect && ACTIVE_ITEM_STATS.has(it.effect.stat) && !it._spent);
			if (active.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${skillsUnseenP(c) ? `Whatever ${c.name} carries is hidden from you — you cannot order the use of an item you cannot see` : "No usable (active) items — most items are passive"}" disabled>`;
			const opts = active.map((it) => kcHtml`<option value="${it.id}" ${target == it.id ? "selected" : ""}>${isLegendaryItem(it) ? "✨ Legendary — " : ITEM_TIER_NAME_P[it.tier || 1] + " — "}${it.name} — ${it.desc}</option>`);
			const selIt = active.find((it) => String(it.id) === String(target)) || active[0];
			const sec = selIt && selIt.effect && selIt.effect.stat === "castSpell" ? kcHtml`${castChanceNote(c, selIt.effect.spell, { itemCast: true })}${spellSecondaryHtml(report, c, ph, selIt.effect.spell, extra, selIt.effect.spell)}` : "";
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="onSpellChange(${kcArg(String(c.id))},${kcArg(ph)},this.value)">${opts}</select>${sec}`;
		}
		case "Consecrate": {
			if (report.kingdom?.alignment !== "Divine") return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only Divine realms may consecrate" disabled>`;
			if (!c.isKing) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="King only" disabled>`;
			const loc = predictedLocation(c.id, ph);
			const wmP = report.worldMeta && report.worldMeta.provinces || [];
			const curP = loc ? wmP.find((p) => p.id === loc.id) : null;
			const ownedHere = !!(curP && curP.tier === "owned");
			const homeP = wmP.find((p) => p.tier === "owned" && p.tax >= 10);
			const homeId = homeP ? homeP.id : null;
			const consecIds = new Set(wmP.filter((p) => p.consecrated && p.tier === "owned").map((p) => p.id));
			const nbrs = curP && curP.neighbors || [];
			const white = effSkillP(c, "white");
			let warn = "";
			if (!loc) warn = "Province unknown this phase.";
			else if (!ownedHere) warn = `${loc.name} is not yours this phase — you may only consecrate land you hold.`;
			else if (homeId != null && loc.id === homeId) warn = `${loc.name} is your home province — already anointed at the coronation. Carry the light outward.`;
			else if (homeId != null && nbrs.includes(homeId)) warn = `${loc.name} borders your home province — the crown's hearth already shelters it. Consecrate ground beyond the home marches.`;
			else if (curP && curP.consecrated) warn = `${loc.name} is already consecrated.`;
			else if (nbrs.some((id) => consecIds.has(id))) warn = `${loc.name} borders one of your consecrated provinces — two may not lie side by side. Choose ground set apart.`;
			else if (white <= 0) warn = `Consecration flows from the White arts — learn White magic before you can sanctify ground.`;
			else if (consecIds.size >= white) warn = `You already hold ${consecIds.size}/${white} consecrated province${white !== 1 ? "s" : ""} (your White limit). One must be lost or captured first, or raise White to hold more.`;
			const okMsg = `Consecrates ${loc ? loc.name : "current province"} — holy ground (${consecIds.size}/${white || 0} held).`;
			return kcHtml`${warn ? kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="⚠ ${warn}" readonly style="border-color:var(--crimson);color:var(--crimson)">` : kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${okMsg}" readonly>`}
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">Sanctifies the province ${c.name} stands in: +50% tax, defenders twice as likely to fight fanatically, Undead/Evil invaders −15%. Your fallen characters can ONLY be restored on consecrated ground — they rise in the nearest consecrated province, which then loses its consecration. Rules: it must be a province you own; <strong>not</strong> your home province or any province next to it; and <strong>no two consecrated provinces may be adjacent</strong>. You may hold up to your <strong>White skill level</strong> at once; a consecrated province that is captured loses its consecration at once and frees a slot (an Undead conqueror's units each gain an experience level for the sacrilege; an Evil conqueror's have a 50% chance; other realms gain nothing).</div>`;
		}
		case "Call to Arms": {
			if (report.kingdom?.alignment !== "Good") return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only Good realms may call the folk to arms" disabled>`;
			if (!c.isKing) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only the KING's voice carries the Call" disabled>`;
			const human = (report.ownedProvinces || []).filter((p) => p.terrain !== "sea" && !(p.race || "").startsWith("Primal"));
			if (!human.length) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No owned humanoid provinces to raise" disabled>`;
			const ctaOpts = human.map((p) => kcHtml`<option value="${p.id}" ${target == p.id ? "selected" : ""}>${p.name} — raises a Green ${p.armyTypes && p.armyTypes[0] && (p.armyTypes[0].type || p.armyTypes[0]) || "levy"}</option>`);
			return kcHtml`<select id="po-target-${c.id}-${ph}">${ctaOpts}</select>
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">Free Green garrison unit of the province's native type. The king need not be present — the province just has to be yours when the order resolves. Once per turn.</div>`;
		}
		case "Broker": {
			if (report.kingdom?.alignment !== "Neutral") return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only Neutral realms keep brokers" disabled>`;
			if (!c.isKing) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only the KING commands the brokers" disabled>`;
			const hireOpts = Object.values(provOrderData || {}).flatMap((pd) => pd.availableHeroes || []).map((h) => {
				const w = heroHireWageOfP(h, report);
				if (w == null) return "";
				return kcHtml`<option value="hire:${h.id}" ${target === "hire:" + h.id ? "selected" : ""}>🤝 Hire remotely: ${h.name} (${h.race}/${h.alignment}) in ${h.locationName} — ${heroFameTextP(h)} — ${w}g/turn</option>`;
			}).filter(Boolean);
			const spyOpts = (report.worldMeta?.provinces || []).filter((p) => p.name && p.terrain).map((p) => kcHtml`<option value="spy:${p.id}" ${target === "spy:" + p.id ? "selected" : ""}>🕵 Buy word from ${p.name} (2g — full Spy result)</option>`);
			if (!hireOpts.length && !spyOpts.length) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Your brokers have nothing within reach" disabled>`;
			const _bPh = kcHtml`<option value="" ${typeof target === "string" && (target.startsWith("hire:") || target.startsWith("spy:")) ? "" : "selected"}>— choose what the brokers are to buy —</option>`;
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="syncHiredHeroCard(${kcArg(String(c.id))},${kcArg(ph)})">${_bPh}${hireOpts}${spyOpts}</select>
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">Money moves what armies cannot: hire any wandering hero the realm can see (they stay where they are and act next phase), or buy a guaranteed Spy report on any province the realm has seen — 2g.</div>`;
		}
		case "Harvest the Field": {
			if (report.kingdom?.alignment !== "Undead") return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only Undead realms keep corpse-carters" disabled>`;
			const loc = predictedLocation(c.id, ph);
			return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Harvests the graves of ${loc ? loc.name : "current province"}" readonly>
        <div style="font-size:.68rem;color:var(--stone);margin-top:2px">No magic required: 2g raises ONE random battlefield grave in the province ${c.name} stands in as a Skeletal unit (keeps its type and quality; 1g upkeep). Needs battlefield dead present — fields where armies have fallen.</div>`;
		}
		case "Perform Rite": {
			if ((report.kingdom?.alignment || "Neutral") !== "Pagan") return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="Only Pagan realms keep the old rites" disabled>`;
			const loc = predictedLocation(c.id, ph);
			const pd = loc ? (report.provinceOrderData || {})[loc.id] : null;
			const site = (pd?.features || []).find((f) => f.ritualSite);
			if (!site) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${loc ? `No known ritual site in ${loc.name} — Explore to find standing stones` : "Province unknown"}" disabled>`;
			const canHunt = !!pd?.wildHuntType;
			const huntCost = pd?.wildHuntCost;
			const _boArmy = projectedLedArmies(c.id, ph);
			const _boSaved = {
				S: /* @__PURE__ */ new Set(),
				E: /* @__PURE__ */ new Set()
			};
			{
				const m = /S:([0-9,]*)\|E:([0-9,]*)/.exec(extra || "");
				if (m) {
					m[1].split(",").filter(Boolean).forEach((x) => _boSaved.S.add(+x));
					m[2].split(",").filter(Boolean).forEach((x) => _boSaved.E.add(+x));
				}
			}
			const _boRows = _boArmy.length ? _boArmy.map((a, i) => kcHtml`<div style="display:flex;align-items:center;gap:6px;font-size:.72rem;padding:1px 0">
            <span style="flex:1">${typeof unitEmoji === "function" ? unitEmoji(a.type) : ""} ${armyLabel(a)}</span>
            <select class="bo-sel" data-cid="${c.id}" data-ph="${ph}" data-idx="${i}" onchange="updateBloodOffering(${kcArg(String(c.id))},${kcArg(ph)})" style="font-size:.7rem">
              <option value="K" ${!_boSaved.S.has(i) && !_boSaved.E.has(i) ? "selected" : ""}>Keep</option>
              <option value="S" ${_boSaved.S.has(i) ? "selected" : ""}>Sacrifice ✝</option>
              <option value="E" ${_boSaved.E.has(i) ? "selected" : ""}>Empower +2</option>
            </select></div>`) : kcHtml`<div style="font-size:.72rem;color:var(--stone)">This character leads no army units to offer.</div>`;
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="updateBloodOffering(${kcArg(String(c.id))},${kcArg(ph)})">
        ${canHunt ? kcHtml`<option value="Wild Hunt" ${target === "Wild Hunt" ? "selected" : ""}>\u{1F525} Rite of the Wild Hunt — bind 2 VETERAN ${pd?.wildHuntType || "wild creatures"} (${huntCost}g — the price of one, no wages, serve until end of NEXT turn)</option>` : ""}
        <option value="Blood Offering" ${target === "Blood Offering" || !target ? "selected" : ""}>\u{1FA78} Blood Offering — sacrifice units to empower others (+2 tiers each)</option>
      </select>
      <input id="po-extra-${c.id}-${ph}" type="hidden" value="${extra || ""}">
      <div id="bo-block-${c.id}-${ph}" style="margin-top:5px;border:1px solid var(--parchment-dark);border-radius:3px;padding:6px;background:#fdf5e0">
        <div style="font-size:.7rem;font-weight:600;color:#7a4a00;margin-bottom:3px">Blood Offering — mark units to Sacrifice, and an equal number to Empower (+2 quality tiers each, max Elite):</div>
        ${_boRows}
        <div id="bo-hint-${c.id}-${ph}" style="font-size:.7rem;color:var(--stone);margin-top:3px"></div>
      </div>
      <div style="font-size:.68rem;color:#7a4a00;margin-top:3px">At the ${site.name}. The old gods always take payment.</div>
      <div style="font-size:.68rem;color:var(--stone);margin-top:2px">Only one rite per province per turn — if anyone (your own characters included) performs a rite here earlier in the turn, this one fails.</div>`;
		}
		case "Cast Spell": {
			c.skills;
			if (skillsUnseenP(c)) {
				const _hsPhase = /* @__PURE__ */ new Set([
					"Resurrect",
					"Part Sea",
					"Bless Province",
					"Holy Symbol",
					"Charm",
					"Oratory",
					"Clairvoyance",
					"Psychic Blast",
					"Telekinetic Storm",
					"Illusory Terrain",
					"Phantasmal Armies",
					"Hide Lairs",
					"Invisibility",
					"Earthquake",
					"Flood",
					"Elemental Summon",
					"Control Undead",
					"Skeletal Armies",
					"Curse",
					"Plague"
				]);
				const _hsList = Object.entries(SPELLS_BY_SCHOOL).flatMap(([school, list]) => list.filter((sp) => _hsPhase.has(sp) && !SPELL_REQ_LEVEL[sp]).map((sp) => [sp, school]));
				const _hsSel = target && _hsList.some(([sp]) => sp === target) ? target : _hsList[0] && _hsList[0][0] || "";
				return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="onSpellChange(${kcArg(String(c.id))},${kcArg(ph)},this.value)">${_hsList.map(([sp, school]) => kcHtml`<option value="${sp}" ${sp === _hsSel ? "selected" : ""}>${sp} (${SKILL_LABELS[school]})</option>`)}</select>
          <div style="font-size:.7rem;color:var(--stone)">${c._unknownSkills ? `${c.name}'s training is unknown until they have joined — every base spell is offered; one from a school they have not learned simply fails.` : `You cannot see this hero's skills — a spell from a school they have not learned simply fails.`}</div>${spellSecondaryHtml(report, c, ph, _hsSel, _hsSel === target ? extra : "", target)}`;
			}
			const PHASE_SPELLS = /* @__PURE__ */ new Set([
				"Resurrect",
				"Part Sea",
				"Bless Province",
				"Holy Symbol",
				"Charm",
				"Oratory",
				"Clairvoyance",
				"Psychic Blast",
				"Telekinetic Storm",
				"Illusory Terrain",
				"Phantasmal Armies",
				"Hide Lairs",
				"Invisibility",
				"Earthquake",
				"Flood",
				"Elemental Summon",
				"Control Undead",
				"Skeletal Armies",
				"Curse",
				"Plague",
				"Sanctuary",
				"Divine Judgment",
				"Mass Confusion",
				"Dominate",
				"Phantom Host",
				"Veil",
				"Chain Lightning",
				"Cataclysm",
				"Raise Wraiths",
				"Death's Dominion"
			]);
			const { practising: practisingSchools, projected: _projLvl } = projectedMagicLevels(c, ph);
			const schoolCastCount = {};
			for (let prevPh = 0; prevPh < ph; prevPh++) {
				if ((document.getElementById(`po-action-${c.id}-${prevPh}`)?.value || "") !== "Cast Spell") continue;
				const prevSpell = getOrderTarget(c.id, prevPh);
				const prevSchool = prevSpell ? SPELL_TO_SCHOOL[prevSpell] : null;
				if (prevSchool) schoolCastCount[prevSchool] = (schoolCastCount[prevSchool] || 0) + 1;
			}
			const _spellRows = Object.entries(SPELLS_BY_SCHOOL).filter(([school]) => effMagicLvl(c, school) >= 1 || practisingSchools.has(school)).flatMap(([school, list]) => list.filter((s) => PHASE_SPELLS.has(s) && (!SPELL_REQ_LEVEL[s] || rawMagicLvl(c, school) >= SPELL_REQ_LEVEL[s])).map((s) => {
				const currentLvl = effMagicLvl(c, school);
				const projLvl = _projLvl[school];
				const isPractising = practisingSchools.has(school) && currentLvl === 0;
				const limit = actionSpellsAllowedPerSchoolEachTurn(projLvl);
				const used = schoolCastCount[school] || 0;
				const atLimit = used >= limit;
				const lvlTxt = projLvl > currentLvl ? `Lv${currentLvl}→${projLvl} if practice succeeds` : `Lv${currentLvl}`;
				let label;
				if (isPractising && !atLimit) label = `${s} (${SKILL_LABELS[school]} — practising, may unlock: Lv${projLvl}, ${used}/${limit} used)`;
				else if (atLimit) label = `${s} (${SKILL_LABELS[school]} ${lvlTxt} — limit reached: ${used}/${limit} this turn)`;
				else label = `${s} (${SKILL_LABELS[school]} ${lvlTxt} — ${used}/${limit} used)`;
				return {
					spell: s,
					atLimit,
					label
				};
			}));
			const _castable = _spellRows.filter((r) => !r.atLimit);
			const _selSpell = target && _castable.some((r) => r.spell === target) ? target : _castable[0] && _castable[0].spell || _spellRows[0] && _spellRows[0].spell || "";
			const spells = _spellRows.map((r) => kcHtml`<option value="${r.spell}" ${r.spell === _selSpell ? "selected" : ""} ${r.atLimit ? "disabled" : ""} style="${r.atLimit ? "color:#aaa;" : ""}">  ${r.label}</option>`);
			const knownOrPractisingSchools = Object.entries(SPELLS_BY_SCHOOL).filter(([school]) => effMagicLvl(c, school) >= 1 || practisingSchools.has(school));
			const allAtLimit = knownOrPractisingSchools.length > 0 && knownOrPractisingSchools.every(([school]) => (schoolCastCount[school] || 0) >= actionSpellsAllowedPerSchoolEachTurn(_projLvl[school]));
			if (!spells.length) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No spells known — need a magic skill ≥ 1, or practise one earlier this turn" disabled>`;
			if (allAtLimit) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="All magic school casting limits reached for this turn" disabled>`;
			const selSpell = _selSpell;
			const secondaryHtml = spellSecondaryHtml(report, c, ph, selSpell, selSpell === target ? extra : "", target);
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="onSpellChange(${kcArg(String(c.id))},${kcArg(ph)},this.value)">${spells}</select>${castChanceNote(c, selSpell)}${secondaryHtml}`;
		}
		case "Practice Skill": {
			const defaultSk = target || practiceCompanionSkill(c, ph) || practiceOwnEarlierSkill(c, ph) || "";
			const skillOpts = ALL_SKILLS.map((sk) => kcHtml`<option value="${sk}" ${defaultSk === sk ? "selected" : ""}>${SKILL_LABELS[sk]}${skillsUnseenP(c) ? "" : ` (Lv ${(c.skills || {})[sk] || 0})`}</option>`);
			if (skillsUnseenP(c)) return kcHtml`<select id="po-target-${c.id}-${ph}">${skillOpts}</select><div style="font-size:.7rem;color:var(--stone)">${c._unknownSkills ? `${c.name}'s skill levels are not known until they have joined.` : `A charmed hero's skill levels are hidden from you.`}</div>`;
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="rebuildTargetWrap(${kcArg(String(c.id))},${kcArg(ph)})">${skillOpts}</select>${orderChanceNote(c, "Practice Skill", ph)}`;
		}
		case "Research": {
			const sg = Math.min(5, effSkillP(c, "sage"));
			report.discoveries;
			const per = 5;
			const neutral = report.kingdom?.alignment === "Neutral" ? sg * 5 : 0;
			const chance = sg * per + neutral;
			const cats = report.researchCategories || [];
			let _rsel = target || defaultResearchField(c, ph);
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
			const pd = loc ? provOrderData[loc.id] : null;
			const mercsAvail = (report.mercIntel || []).filter((m) => m.locationId === loc?.id);
			report.kingdom?.gold;
			const conditionalRecruit = !!(pd && !pd.canRecruit && (pd.armyTypes || []).length > 0 && loc);
			const savedSelsM = (target || "").split(",").filter(Boolean);
			const mercRows = mercsAvail.map((m) => {
				const val = `merc:${m.id}`;
				return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer;background:#fbeeee;border-radius:2px">
          <input type="checkbox" value="${val}" ${savedSelsM.includes(val) ? "checked" : ""} onchange="updateRecruitTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="width:auto;margin:0">
          \u2694 ${m.unitName || m.type} (${m.quality} ${m.type}, ${m.cost ?? "?"}g) <span style="color:#701010;font-size:.72rem">[mercenary]</span>
        </label>`;
			});
			const _destSaved = (target || "").split(",").map((t) => t.trim()).find((t) => t.startsWith("to:")) || "to:self";
			const _destAllies = orderTargetCharsP(report, ph).filter((x) => x.id !== c.id && (predictedLocation(x.id, ph)?.id ?? x.locationId) === (loc && loc.id));
			const _destRow = (allowGarrison) => kcHtml`<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;font-size:.75rem">
          <span style="color:var(--stone)">Muster to:</span>
          <select class="po-recruit-dest" onchange="updateRecruitTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="flex:1;font-size:.75rem;padding:1px 3px">
            <option value="to:self" ${_destSaved === "to:self" ? "selected" : ""}>${c.name} (this character)</option>
            ${_destAllies.map((x) => kcHtml`<option value="to:${x.id}" ${_destSaved === "to:" + x.id ? "selected" : ""}>${x.name} (also here this phase${preOrderTagP(x)})</option>`)}
            ${allowGarrison ? kcHtml`<option value="to:garrison" ${_destSaved === "to:garrison" ? "selected" : ""}>Province garrison (defends ${loc ? loc.name : "the province"})</option>` : ""}
          </select>
        </div>${allowGarrison ? kcHtml`<div style="font-size:.68rem;color:var(--stone);margin:-2px 0 4px;line-height:1.35">Garrison units always muster straight into the province garrison, whoever is named above.</div>` : ""}`;
			const mercWrap = (inner) => kcHtml`<div id="po-target-wrap-inner-${c.id}-${ph}" style="max-height:160px;overflow-y:auto;background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px">
        ${_destRow(false)}
        ${inner}
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${target || ""}">
      </div>`;
			if (!pd || !pd.canRecruit && !conditionalRecruit) {
				if (mercRows.length) return mercWrap(kcHtml`<div style="font-size:.68rem;color:#6a3030;margin-bottom:4px;line-height:1.35">Mercenaries can be hired anywhere. Native troops need control of the province.</div>${mercRows}`);
				const why = !pd ? "Province unknown" : (pd.armyTypes || []).length === 0 ? `${loc.name} is not your territory — cannot recruit here` : `${loc.name} is not yours yet — move in with an army in an earlier phase to recruit here if you take control`;
				return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${why}" disabled>`;
			}
			const alreadyRecruited = getAlreadyRecruitedThisTurn(c.id, ph);
			if (!(pd.armyTypes || []).some((at) => at.maxPerTurn - (alreadyRecruited[`${loc.id}:${at.type}`] || 0) > 0)) {
				if (mercRows.length) return mercWrap(mercRows);
				const why = (pd.armyTypes || []).length === 0 ? `No native recruitable armies in ${pd.name}` : `Already recruited the maximum in ${pd.name} this turn`;
				return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${why}" disabled>`;
			}
			`${c.id}${ph}`;
			const savedSels = (target || "").split(",").filter(Boolean);
			return kcHtml`<div id="po-target-wrap-inner-${c.id}-${ph}" style="max-height:160px;overflow-y:auto;background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px">
        ${conditionalRecruit ? kcHtml`<div style="font-size:.68rem;color:#6a3030;background:#f7ece0;border-radius:2px;padding:3px 5px;margin-bottom:4px;line-height:1.35">⚑ ${loc.name} is not yours yet — plan freely. This recruit only takes effect if you <strong>control the province</strong> when the order resolves (e.g. this character seizes it in an earlier phase); otherwise it is skipped.</div>` : ""}
        ${""}
        ${_destRow(true)}
        ${mercRows}
        ${(pd.armyTypes || []).flatMap((at) => {
				const done = alreadyRecruited[`${loc.id}:${at.type}`] || 0;
				const remaining = at.maxPerTurn - done;
				if (remaining <= 0) return [];
				const costEach = at.cost || 2;
				const _savedOfType = savedSels.filter((v) => v.split("|")[0].trim() === at.type).length;
				return Array.from({ length: remaining }, (_, i) => {
					return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer">
              <input type="checkbox" value="${`${at.type}|1`}" ${_savedOfType > i ? "checked" : ""} onchange="updateRecruitTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="width:auto;margin:0">
              1× ${at.type} (${costEach}g)${CREATURE_ARMIES_UI.has(at.type) ? kcHtml` <span style="color:#1d5a1d;font-size:.72rem">[Creature]</span>` : MONSTER_ARMIES_UI.has(at.type) ? kcHtml` <span style="color:#701010;font-size:.72rem">[Monster]</span>` : ""}
            </label>`;
				});
			})}
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${target || ""}">
      </div>`;
		}
		case "Hire Hero": {
			const loc = predictedLocation(c.id, ph);
			const heroes = (loc ? provOrderData[loc.id] : null)?.availableHeroes || [];
			if (heroes.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${loc ? `No wandering heroes in ${loc.name}` : "No heroes available"}" disabled>`;
			const opts = heroes.map((h) => {
				const topSkill = heroFameTextP(h);
				const kAlign = report.kingdom?.alignment || "Neutral";
				const wage = heroHireWageOfP(h, report);
				if (wage == null) return kcHtml`<option value="" disabled>${h.name} (${h.race}/${h.alignment}) — will NOT serve a ${kAlign} crown</option>`;
				const d = alignDistP(kAlign, h.alignment);
				const _base = heroHireWage(kAlign, h.alignment), _prem = _base != null && wage > _base ? wage - _base : 0;
				const costNote = (d <= 1 ? "(kindred outlook" : `(${d} steps from ${kAlign}`) + (_prem ? `, +${_prem}g for proven skill)` : d <= 1 ? " — base rate)" : ")");
				return kcHtml`<option value="${h.id}" ${target == h.id ? "selected" : ""}>${h.name} (${h.race}/${h.alignment}) — best: ${topSkill} — ${wage}g/turn ${costNote}</option>`;
			});
			const _ph = kcHtml`<option value="" ${heroes.some((h) => String(h.id) === String(target) && heroHireWageOfP(h, report) != null) ? "" : "selected"}>— choose a hero to hire —</option>`;
			return kcHtml`<select id="po-target-${c.id}-${ph}" onchange="syncHiredHeroCard(${kcArg(String(c.id))},${kcArg(ph)})">${_ph}${opts}</select>`;
		}
		case "Send Item":
		case "Give Item": {
			const items = predictedItems(c.id, ph);
			const startNames = new Set((c.items || []).map((it) => it && it.name));
			if (items.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="${skillsUnseenP(c) ? `What ${c.name} carries is not known to you until they have joined — you can only send on something you handed them yourself this turn` : "No items to give (none held, or all given away earlier this turn)"}" disabled>`;
			const _giByName = skillsUnseenP(c);
			const _giSaved = (target || "").split(",").filter(Boolean);
			const _giAll = !_giByName && _giSaved.includes("all");
			const _giBoxes = items.map((it, i) => {
				const _bound = !!(it && it.effect && it.effect.stat === "mithrilArmour");
				const _val = _giByName ? String(it.name || "") : String(i);
				const chk = !_bound && (_giAll || _giSaved.includes(_val)) ? "checked" : "";
				return kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:${_bound ? "not-allowed" : "pointer"};${_bound ? "opacity:.55" : ""}">
          <input type="checkbox" value="${_val}" ${chk} ${_bound ? "disabled" : ""} onchange="updateLeaveTarget(${kcArg(String(c.id))},${kcArg(ph)})" style="width:auto;margin:0">
          🔮 ${it.name}${itemTierTagP(it)}${_bound ? kcHtml` <span style="color:var(--stone)">— bound to its wearer, cannot be sent</span>` : startNames.has(it.name) ? "" : " (received earlier this turn)"}
        </label>`;
			});
			const _giWrap = kcHtml`<div style="background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px;max-height:120px;overflow-y:auto">
        ${_giByName ? kcHtml`<div style="font-size:.68rem;color:var(--stone);padding:2px 4px;border-bottom:1px solid var(--parchment-dark);margin-bottom:2px">Only what you handed ${c.name} this turn is listed — the rest of their pack is not yours to see, or to send on.</div>` : kcHtml`<label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer;border-bottom:1px solid var(--parchment-dark);margin-bottom:2px">
          <input type="checkbox" value="all" id="po-leave-all-${c.id}-${ph}" ${_giAll ? "checked" : ""} onchange="leaveToggleAll(${kcArg(String(c.id))},${kcArg(ph)},this.checked)" style="width:auto;margin:0">
          <strong>All items (${items.length})</strong>
        </label>`}
        ${_giBoxes}
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${target || ""}">
      </div>`;
			const loc4 = predictedLocation(c.id, ph);
			const chars = orderTargetCharsP(report, ph).filter((x) => x.id !== c.id && x.player === c.player && !x._hiddenSkills);
			if (chars.length === 0) return kcHtml`${_giWrap}
        <input id="po-extra-${c.id}-${ph}" type="text" value="" placeholder="No other characters to send to" disabled>`;
			const recipOpts = chars.map((x) => {
				const _xl = predictedLocation(x.id, ph), _xn = _xl && _xl.name || "unknown province";
				const _where = _xl?.id === loc4?.id ? `here in ${_xn} — at once` : `in ${_xn} — arrives end of turn`;
				return kcHtml`<option value="${x.id}" ${extra == x.id ? "selected" : ""}>${x.name} (${_where}${preOrderTagP(x)})</option>`;
			});
			return kcHtml`${_giWrap}
        <select id="po-extra-${c.id}-${ph}" style="margin-top:4px">${recipOpts}</select>`;
		}
		case "Leave/Transfer Army": {
			const baseArmies = projectedLedArmies(c.id, ph);
			const savedTgts = (target || "").split(",").filter(Boolean);
			const cLoc = predictedLocation(c.id, ph);
			const cLocId = cLoc ? cLoc.id : null;
			const ownedIds = new Set((report.ownedProvinces || []).map((p) => p.id));
			const ownsHere = cLocId != null && ownedIds.has(cLocId);
			const canGarrison = cLocId != null;
			const othersHere = orderTargetCharsP(report, ph).filter((x) => {
				if (x.id === c.id) return false;
				const xl = predictedLocation(x.id, ph);
				return xl && cLocId != null && xl.id === cLocId;
			});
			const recipParts = [];
			if (canGarrison) recipParts.push(kcHtml`<option value="-1" ${extra === "-1" || !extra ? "selected" : ""}>${ownsHere ? `Garrison in ${cLoc.name || "province"}` : `Garrison in ${cLoc.name || "province"} \u2691 (only if you control it when this resolves)`}</option>`);
			othersHere.forEach((x) => recipParts.push(kcHtml`<option value="${x.id}" ${extra == x.id ? "selected" : ""}>${x.name}${preOrderTagP(x)}</option>`));
			if (recipParts.length === 0) recipParts.push(kcHtml`<option value="" disabled selected>No valid recipient here — place another of your characters here first</option>`);
			const recipOpts = recipParts;
			const allChk = savedTgts.includes("all") ? "checked" : "";
			if (baseArmies.length === 0) return kcHtml`<div style="background:#fdf8ee;border:1px solid var(--stone);border-radius:2px;padding:4px">
          <div style="font-size:.68rem;color:#6a3030;margin-bottom:4px;line-height:1.35">No armies to leave right now, but you can still queue <strong>All armies</strong> in case this character gains a force earlier this phase (e.g. Skeletal Armies).</div>
          <label style="display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:.8rem;cursor:pointer">
            <input type="checkbox" value="all" id="po-leave-all-${c.id}-${ph}" ${allChk} onchange="leaveToggleAll(${kcArg(String(c.id))},${kcArg(ph)},this.checked)" style="width:auto;margin:0">
            <strong>All armies</strong>
          </label>
          <input type="hidden" id="po-target-${c.id}-${ph}" value="${target || ""}">
        </div>
        <select id="po-extra-${c.id}-${ph}" style="margin-top:4px" onchange="setTimeout(refreshAllMoveModeNotes,0)">${recipOpts}</select>`;
			const checkboxes = baseArmies.map((a, i) => {
				const val = a.unitName || a.type;
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
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${target || ""}">
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
			const savedTgts = (target || "").split(",").filter(Boolean);
			const checkboxes = armies.map((a, i) => {
				const val = a.unitName || a.type;
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
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${target || ""}">
      </div>`;
		}
		case "Pick Up Army": {
			const loc2 = predictedLocation(c.id, ph);
			const garrArr = loc2 ? projectedGarrison(loc2.id, ph, true, c.id) : [];
			if (garrArr.length === 0) return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="" placeholder="No garrison armies here to pick up (hire mercenaries via Recruit Armies)" disabled>`;
			const savedTgts = (target || "").split(",").filter(Boolean);
			const allSel = savedTgts.includes("all");
			const checkboxes = garrArr.map((a, i) => {
				const val = `g:${i}`;
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
        <input type="hidden" id="po-target-${c.id}-${ph}" value="${target || ""}">
      </div>`;
		}
		default: return kcHtml`<input id="po-target-${c.id}-${ph}" type="text" value="${target || ""}" placeholder="Details / notes">`;
	}
}
function updateLeaveTarget(charId, ph) {
	const wrap = document.querySelector(`#po-target-${charId}-${ph}`)?.parentElement;
	if (!wrap) return;
	const allChk = document.getElementById(`po-leave-all-${charId}-${ph}`);
	if (allChk) allChk.checked = false;
	const checked = [...wrap.querySelectorAll("input[type=checkbox]:not([value=all]):checked")].map((cb) => cb.value);
	const hidden = document.getElementById(`po-target-${charId}-${ph}`);
	if (hidden) hidden.value = checked.join(",");
	if (typeof refreshAllMoveModeNotes === "function") setTimeout(refreshAllMoveModeNotes, 0);
}
function leaveToggleAll(charId, ph, checked) {
	const wrap = document.querySelector(`#po-target-${charId}-${ph}`)?.parentElement;
	if (!wrap) return;
	wrap.querySelectorAll("input[type=checkbox]:not([value=all])").forEach((cb) => {
		cb.checked = false;
	});
	const hidden = document.getElementById(`po-target-${charId}-${ph}`);
	if (hidden) hidden.value = checked ? "all" : "";
	if (typeof refreshAllMoveModeNotes === "function") setTimeout(refreshAllMoveModeNotes, 0);
}
function updateRecruitTarget(charId, ph) {
	const wrap = document.getElementById(`po-target-wrap-inner-${charId}-${ph}`);
	if (!wrap) return;
	const checked = [...wrap.querySelectorAll("input[type=checkbox]:checked")].map((cb) => cb.value);
	const destSel = wrap.querySelector(".po-recruit-dest");
	if (destSel && destSel.value && destSel.value !== "to:self") checked.push(destSel.value);
	const hidden = document.getElementById(`po-target-${charId}-${ph}`);
	if (hidden) hidden.value = checked.join(",");
	if (typeof refreshAllMoveModeNotes === "function") setTimeout(refreshAllMoveModeNotes, 0);
}
//#endregion
//#region src/ui/player/titles.ts
var MASTERY_EFFECTS = MASTERY_UNLOCKS;
function renderMastery(report) {
	const card = document.getElementById("mastery-card");
	const el = document.getElementById("report-mastery");
	if (!card || !el) return;
	const chars = (report.characters || []).filter((c) => c && c.alive !== false);
	const rows = [];
	chars.forEach((c) => {
		const sk = c.skills || {};
		const mastered = Object.keys(sk).filter((k) => sk[k] >= 6 && MASTERY_EFFECTS[k]).sort((a, b) => sk[b] - sk[a] || a.localeCompare(b));
		if (mastered.length === 0) return;
		const skillBlocks = mastered.map((k) => {
			const lvl = sk[k];
			const effs = [];
			for (let L = 6; L <= lvl; L++) {
				const d = MASTERY_EFFECTS[k][L];
				if (d) effs.push({
					L,
					d
				});
			}
			const lines = effs.map((e) => kcHtml`<div style="font-size:.76rem;padding:1px 0 1px 10px"><span style="color:var(--gold);font-family:Cinzel,serif;font-size:.68rem">L${e.L}</span> ${e.d}</div>`);
			return kcHtml`<div style="margin:3px 0 5px">
        <div style="font-size:.8rem"><strong>${SKILL_LABELS[k] || k} ${lvl}</strong></div>
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
	el.innerHTML = kcHtml`<div style="font-size:.72rem;color:#332c20;margin-bottom:6px">A standing reference to the mastery each of your characters has earned — consult it whenever you plan their orders.</div>${rows}`;
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
	if (!r.charName || !(r.pct > 0)) return `None of your characters has any standing toward this title yet.`;
	return kcHtml`Your best: ${who} — at <strong>${r.pct}%</strong> of the holder's standing.`;
}
function renderTitles(report) {
	const el = document.getElementById("report-titles");
	if (!el) return;
	const t = report && report.titles || {};
	if (t.gameOver) {
		const go = t.gameOver;
		const board = (go.standings || []).slice().sort((a, b) => b.score - a.score).map((s, i) => kcHtml`<tr style="${s.index === go.winner ? "font-weight:700;background:#fdf3d8" : ""}"><td style="padding:3px 8px">${i + 1}</td><td style="padding:3px 8px;color:${reportColour(s.color) || "#333"}">${s.name}</td><td style="padding:3px 8px;text-align:right">${s.score}</td><td style="padding:3px 8px;font-size:.75rem;color:#2f281c">${(s.titleNames || []).join(", ")}${s.relics ? `${s.titleNames && s.titleNames.length ? " · " : ""}${s.relics} relic${s.relics !== 1 ? "s" : ""}` : ""}</td></tr>`);
		el.innerHTML = kcHtml`<div style="background:#fdf3d8;border:1px solid var(--gold);border-radius:3px;padding:10px 12px;margin-bottom:8px">
      <div style="font-family:'Cinzel',serif;font-size:1rem;color:var(--crimson)">🏆 ${go.winnerName || "No-one"} ${go.byElimination ? "is the last realm standing" : go.byConcession ? "holds the field — every rival has conceded" : "is judged supreme at the Reckoning"}!</div></div>
      <table style="width:100%;border-collapse:collapse;font-size:.85rem"><thead><tr style="color:#332c20;font-size:.72rem;text-align:left"><th style="padding:3px 8px">#</th><th style="padding:3px 8px">Realm</th><th style="padding:3px 8px;text-align:right">Legacy</th><th style="padding:3px 8px">Titles held</th></tr></thead><tbody>${board}</tbody></table>`;
		return;
	}
	if (!t.public) {
		el.innerHTML = kcHtml`<em style="color:#3a3224;font-size:.85rem">The Imperial Titles are contested in secret until Turn ${t.publicFromTurn || 5}. Standings appear then.</em>`;
		return;
	}
	const nPlayers = (t.standings || []).length || 2;
	const pct = dispFloor((t.myShare || 0) * 100), thr = Math.ceil(dispFloor((t.threshold || 0) * 100 * 1e6) / 1e6);
	const ownPct = dispFloor((t.myOwnShare != null ? t.myOwnShare : t.myShare || 0) * 100), minPct = Math.ceil(dispFloor((t.callerMin || 0) * 100 * 1e6) / 1e6);
	let gainsHtml = "";
	const gains = t.gains || [];
	if (gains.length) {
		const initial = gains.some((g) => g.initial);
		const header = initial ? `🏅 The Imperial Titles are now public — title${gains.length !== 1 ? "s" : ""} you hold` : `🎉 New title${gains.length !== 1 ? "s" : ""} won this turn`;
		const verb = initial ? "Earned by" : "Won by";
		gainsHtml = kcHtml`<div style="background:#fdf3d8;border:1px solid var(--gold);border-radius:3px;padding:8px 10px;margin-bottom:10px">
      <div style="font-family:'Cinzel',serif;font-size:.8rem;color:var(--crimson);margin-bottom:4px">${header}</div>
      ${gains.map((g) => kcHtml`<div style="font-size:.78rem;color:#444;margin-bottom:5px;line-height:1.45">
        <strong>${g.scope === "minor" ? "🎖" : "🏆"} ${g.name}</strong> — ${g.charName ? `${g.charName} of ` : ""}<span style="color:var(--forest)">${g.kingdomName || "your realm"}</span>.
        <br><span style="color:#2a2419">${verb}: ${g.req || ""}</span>
        <br><span style="color:#1d541d">Effect: ${g.perk || ""}</span></div>`)}</div>`;
	}
	let lossesHtml = "";
	const losses = t.losses || [];
	if (losses.length) lossesHtml = kcHtml`<div style="background:#f6e0e0;border:1px solid var(--crimson);border-radius:3px;padding:8px 10px;margin-bottom:10px">
      <div style="font-family:'Cinzel',serif;font-size:.8rem;color:var(--crimson);margin-bottom:4px">⚔ Title${losses.length !== 1 ? "s" : ""} lost this turn</div>
      ${losses.map((l) => kcHtml`<div style="font-size:.78rem;color:#444;margin-bottom:5px;line-height:1.45">
        <strong>${l.scope === "minor" ? "🎖" : "🏆"} ${l.name}</strong> — ${l.vacant ? kcHtml`now stands <span style="color:#3a3224">vacant</span>.` : kcHtml`claimed by ${l.newCharName ? `${l.newCharName} of ` : ""}<span style="color:var(--crimson)">${l.newHolderName || "a rival"}</span>.`}</div>`)}</div>`;
	let banner = "";
	if (t.reckoning) banner = kcHtml`<div style="background:#f7e9d0;border:1px solid var(--gold);border-radius:3px;padding:8px 10px;margin-bottom:10px;font-size:.85rem">
      👑 <strong>The Reckoning has been called${t.reckoning.byName ? ` by ${t.reckoning.byName}` : ""}.</strong> The world is judged at the end of <strong>Turn ${t.reckoning.resolveAtTurn}</strong> unless the claim is broken. ${t.reckoning.mine ? "This is your claim — hold your dominance." : "Drive the claimant's bloc below the threshold to shatter it."}</div>`;
	const _unmetStyle = "color:#5a5348;font-style:italic";
	const board = (t.standings || []).slice().sort((a, b) => b.score - a.score).map((s, i) => kcHtml`<tr style="${s.index === (currentReport && currentReport.playerIndex) ? "font-weight:700" : ""}"><td style="padding:2px 8px">${i + 1}</td><td style="padding:2px 8px;${s.unmet ? _unmetStyle : `color:${reportColour(s.color) || "#333"}`}">${s.name}${s.unmet ? kcHtml` <span style="font-size:.66rem;opacity:.8">(not yet encountered)</span>` : ""}</td><td style="padding:2px 8px;text-align:right">${s.score}</td></tr>`);
	const holders = t.holders || {};
	const _titleRows = _TITLE_ORDER.map((r) => r.slice()).concat(Object.keys(holders).filter((k) => !_TITLE_ORDER.some((r) => r[0] === k)).map((k) => [
		k,
		holders[k].name || k,
		holders[k].prize || 0
	]));
	const _heldBy = (k) => {
		const h = holders[k] || {};
		return !!(h.race ? h.race.mine : h.mine);
	};
	const _closeness = (k) => {
		const r = (holders[k] || {}).race;
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
		if (ha) return a._i - b._i;
		const ca = _closeness(a[0]), cb = _closeness(b[0]);
		if (ca !== cb) return cb - ca;
		return a._i - b._i;
	});
	const majorHtml = _titleRows.map(([k, name, prize]) => {
		const h = holders[k] || {};
		const r = h.race || null;
		const raceLine = r ? titleRaceLine(r) : kcHtml`<span style="color:#3a3224">Standing percentages are missing from this turn report — it was resolved by ${report && report.engineStamp ? kcHtml`<strong>the GM portal's build ${report.engineStamp}</strong>, which predates them` : "a GM portal build that predates them"}. They appear once a turn is resolved by a GM portal build from 20 September 2026 or later.</span>`;
		const raceHtml = raceLine ? kcHtml`<div style="font-size:.74rem;margin:1px 0;color:${r && r.mine ? "var(--forest)" : "#5a4a2a"}">📊 ${raceLine}</div>` : "";
		return kcHtml`<div style="border-bottom:1px solid var(--parchment-dark);padding:5px 0">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">
        <strong style="font-size:.82rem">🏆 ${name}</strong>
        <span style="color:#3a3224;font-size:.72rem;white-space:nowrap">${prize} pts</span>
      </div>
      <div style="font-size:.78rem;margin:1px 0">Held by: ${h.holderName ? h.unmet ? kcHtml`<span style="${_unmetStyle}">${h.charName ? `${h.charName} of ` : ""}${h.holderName}</span> <span style="font-size:.66rem;color:#5a5348">— a realm you have not yet encountered</span>` : h.kingdomLevel ? kcHtml`${h.charName ? `${h.charName} — ` : ""}<span style="color:${h.mine ? "var(--forest)" : "#333"};font-weight:${h.mine ? "700" : "400"}">${h.holderName}</span>` : kcHtml`${h.charName || "—"} <span style="color:${h.mine ? "var(--forest)" : "#777"};font-weight:${h.mine ? "700" : "400"}">(${h.holderName})</span>` : kcHtml`<span style="color:#3a3224">— vacant —</span>`}</div>
      ${raceHtml}
      <div style="font-size:.7rem;color:#2f281c;line-height:1.4">Earn: ${h.req || ""}<br><span style="color:#1d541d">While held: ${h.perk || ""}</span></div>
    </div>`;
	});
	const _minTurn = t.reckoningMinTurn || 10;
	const _solo = Math.ceil(dispFloor((t.soloThreshold != null ? t.soloThreshold : t.threshold || 0) * 100 * 1e6) / 1e6);
	const _step = Math.round((t.allyStep || 0) * 100);
	const _nAllies = Math.max(0, (t.blocSize || 1) - 1);
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
	else if (!t.reckoning && t.callBlockedReason === "tooEarly") callCtrl = kcHtml`<div style="font-size:.72rem;color:#3a3224;margin-top:10px">The throne cannot be claimed before <strong>Turn ${t.reckoningMinTurn || 10}</strong>. Your bloc commands ${pct}% of the world; ${thr}% will be needed when the claim opens.</div>`;
	else if (!t.reckoning) callCtrl = t.callBlockedReason === "callerShort" ? kcHtml`<div style="font-size:.72rem;color:#3a3224;margin-top:10px">Your bloc commands ${pct}% of the world — enough to Call the Reckoning — but your own realm holds just ${ownPct}% of it, and a claimant must personally hold ${minPct}%. The claim must be lodged by the greatest realm in your alliance.</div>` : kcHtml`<div style="font-size:.72rem;color:#3a3224;margin-top:10px">Your bloc commands ${pct}% of the world; ${thr}% is needed to Call the Reckoning.</div>`;
	const throneMine = !!(t.holders && t.holders.throne && t.holders.throne.mine);
	const _gap = thr - pct;
	const shareLine = kcHtml`<div style="background:#f0f4ea;border:1px solid #cdd8bf;border-radius:3px;padding:7px 10px;margin-bottom:10px;font-size:.78rem;color:#3a4a2a;line-height:1.5">
    ${throneMine ? kcHtml`👑 <strong>You hold The Throne</strong> — the largest tax base in the world. ` : ""}Your bloc commands <strong>${pct}%</strong> of the world's tax base; the Reckoning can be called at <strong>${thr}%</strong>.${_gap > 0 ? kcHtml` <span style="color:#2f281c">(${_gap} more percentage point${_gap !== 1 ? "s" : ""} to go.)</span>` : t.callBlockedReason === "callerShort" ? kcHtml` <span style="color:#654c0c">Your bloc meets the threshold, but your own realm holds ${ownPct}% and a claimant must personally hold ${minPct}% — your strongest ally must lodge the claim.</span>` : kcHtml` <span style="color:#1d541d">You meet the threshold.</span>`}
  </div>`;
	el.innerHTML = kcHtml`${gainsHtml}${lossesHtml}${banner}${shareLine}<div style="font-size:.75rem;color:#332c20;margin-bottom:3px">Standings (Legacy)</div>
       <table style="width:100%;border-collapse:collapse;font-size:.85rem;margin-bottom:12px"><tbody>${board}</tbody></table>
       <div style="font-size:.75rem;color:#332c20;margin-bottom:2px">The Imperial Titles — who holds them &amp; how they are won <span style="color:#aaa">(yours first, then the ones you stand closest to winning)</span></div>
       ${majorHtml}${callCtrl}${reckoningInfo}${renderMinorTitles(t)}`;
}
function renderMinorTitles(t) {
	const m = t && t.minor;
	if (!m) return "";
	const mine = m.mine || [];
	return kcHtml`<div style="margin-top:14px;border-top:1px dashed var(--parchment-dark);padding-top:8px">
    <div style="font-size:.8rem;color:#332c20;margin-bottom:4px">🎖 Your minor titles <span style="font-size:.72rem">(honorary — each grants a perk but never counts toward victory)</span></div>
    ${mine.length ? mine.map((x) => kcHtml`<div style="border-bottom:1px dotted var(--parchment-dark);padding:4px 0;font-size:.76rem">
        <span class="pill" style="background:#eef3e6;color:#3a5a2a;margin:0">🎖 ${x.name}</span>
        <span style="color:#231e16"> — ${x.holderName || ""}</span>
        <div style="font-size:.68rem;color:#2f281c;line-height:1.4">Earn: ${x.req || ""}<br><span style="color:#1d541d">Perk: ${x.perk || ""}</span></div>
      </div>`) : kcHtml`<div style="font-size:.78rem;color:#3a3224;margin-top:4px">Your characters hold no minor titles yet. Each is awarded to the single best character in the world by its measure — win one and it appears here.</div>`}
  </div>`;
}
function setReckoningCall(v) {
	reckoningCall = !!v;
	if (currentReport) renderTitles(currentReport);
	renderReckoningOrders();
}
function renderReckoningOrders() {
	const w = document.getElementById("reckoning-wrap");
	if (!w) return;
	const t = currentReport && currentReport.titles || {};
	const pct = dispFloor((t.myShare || 0) * 100), thr = Math.ceil(dispFloor((t.threshold || 0) * 100 * 1e6) / 1e6);
	const ownPct = dispFloor((t.myOwnShare != null ? t.myOwnShare : t.myShare || 0) * 100), minPct = Math.ceil(dispFloor((t.callerMin || 0) * 100 * 1e6) / 1e6);
	if (t.gameOver) {
		w.innerHTML = kcHtml`<div style="color:#2f281c">The game is over — there is nothing left to call.</div>`;
		return;
	}
	if (t.reckoning) {
		w.innerHTML = kcHtml`<div style="background:#f7e9d0;border:1px solid var(--gold);border-radius:3px;padding:6px 8px">👑 <strong>The Reckoning has already been called${t.reckoning.byName ? ` by ${t.reckoning.byName}` : ""}.</strong> The world is judged at the end of Turn ${t.reckoning.resolveAtTurn} unless the claim is broken.</div>`;
		return;
	}
	if (t.canCallReckoning) {
		w.innerHTML = reckoningCall ? kcHtml`<div style="background:#fdeaea;border:1px solid var(--crimson);border-radius:3px;padding:6px 8px;font-size:.78rem">👑 <strong>You will Call the Reckoning with these orders.</strong> If your bloc still holds ${thr}%+ when orders resolve, the endgame begins (a 2-turn grace, then the world is judged). <button type="button" onclick="setReckoningCall(false)" style="margin-left:6px;font-size:.66rem;padding:2px 8px;border:1px solid #999;background:#eee;border-radius:2px;cursor:pointer">cancel</button></div>` : kcHtml`<div><button type="button" onclick="setReckoningCall(true)" style="font-family:'Cinzel',serif;font-size:.72rem;padding:6px 12px;border:1px solid #5a1010;background:var(--crimson);color:#fff;border-radius:2px;cursor:pointer">👑 Call the Reckoning</button>
          <div style="color:#2f281c;margin-top:4px">Your bloc commands <strong>${pct}%</strong> of the world's tax base (need ${thr}%). Calling it forces a final scoring in two turns — submit orders to lodge the claim.</div></div>`;
		return;
	}
	let why;
	if (t.callBlockedReason === "tooEarly") why = kcHtml`The throne cannot be claimed before <strong>Turn ${t.reckoningMinTurn || 10}</strong> — the realms are still settling and the world will not yet be judged.`;
	else if (t.public === false) why = `The Imperial Titles are contested in secret until Turn ${t.publicFromTurn || 5} — the Reckoning cannot be called before then.`;
	else if (t.kingAlive === false) why = kcHtml`Only a living <strong>King</strong> may call it — your king is dead, so the call must wait for the heir.`;
	else if (t.callBlockedReason === "callerShort") why = kcHtml`Your bloc commands <strong>${pct}%</strong> of the world's tax base — enough to call it — but the claim belongs to whoever lodges it, and your own realm holds only <strong>${ownPct}%</strong>. A claimant must personally hold <strong>${minPct}%</strong> (half the ${thr}% bar), so the greatest realm in your alliance must be the one to call it.`;
	else if (pct < thr) {
		const _na = Math.max(0, (t.blocSize || 1) - 1), _so = Math.ceil(dispFloor((t.soloThreshold != null ? t.soloThreshold : t.threshold || 0) * 100 * 1e6) / 1e6);
		why = kcHtml`Your bloc commands <strong>${pct}%</strong> of the world's tax base; <strong>${thr}%</strong> is needed <span style="color:#2f281c">(${thr - pct} more percentage point${thr - pct !== 1 ? "s" : ""} to go)</span>.${_na > 0 ? kcHtml` <span style="color:#654c0c">Standing alone the bar would be ${_so}% — each of your ${_na} all${_na === 1 ? "y" : "ies"} raises it by ${Math.round((t.allyStep || 0) * 100)} points.</span>` : ""}`;
	} else why = kcHtml`Your bloc commands <strong>${pct}%</strong> of the world's tax base (need ${thr}%).`;
	w.innerHTML = kcHtml`<div style="color:#231e16;line-height:1.5">${why} The <strong>👑 Call the Reckoning</strong> button will appear here when you qualify.</div>`;
}
function spellSecondaryHtml(report, c, ph, selSpell, extra, target) {
	const NEEDS_PROV = /* @__PURE__ */ new Set([
		"Bless Province",
		"Part Sea",
		"Illusory Terrain",
		"Hide Lairs",
		"Earthquake",
		"Flood",
		"Plague",
		"Sanctuary",
		"Cataclysm"
	]);
	const NEEDS_CHAR = /* @__PURE__ */ new Set([
		"Resurrect",
		"Psychic Blast",
		"Telekinetic Storm",
		"Clairvoyance",
		"Phantasmal Armies",
		"Control Undead",
		"Curse",
		"Charm",
		"Oratory",
		"Divine Judgment",
		"Mass Confusion",
		"Dominate",
		"Chain Lightning"
	]);
	let secondaryHtml = "";
	if (NEEDS_PROV.has(selSpell)) {
		const wmProvs = report.worldMeta?.provinces || [];
		const curLoc = predictedLocation(c.id, ph);
		const curId = curLoc ? curLoc.id : c.locationId;
		const curP = wmProvs.find((p) => p.id === curId);
		const candIds = [curId, ...curP && curP.neighbors || []];
		const kfNames = new Set((report.knownFeatures || []).filter((f) => !f.cleared).map((f) => f.province));
		const provOpts = candIds.map((pid) => {
			const p = wmProvs.find((x) => x.id === pid);
			if (!p) return "";
			const t = p.terrain;
			if (selSpell === "Flood" && (t === "sea" || t == null)) return "";
			if (selSpell === "Hide Lairs") {
				if (!((p.features || []).length > 0 || p.name && kfNames.has(p.name))) return "";
			}
			const taxLbl = selSpell === "Bless Province" && p.tax != null ? ` · tax base ${p.tax}g` : "";
			const label = (p.name || `Unknown province (${provDirectionLabel(curId, pid, wmProvs, report.worldMeta?.cols) || "?"})`) + (pid === curId ? " (here)" : "") + (t ? ` — ${t}` : "") + taxLbl;
			return kcHtml`<option value="${pid}" ${extra == pid ? "selected" : ""}>${label}</option>`;
		}).filter(Boolean);
		secondaryHtml = provOpts.length ? kcHtml`<select id="po-extra-${c.id}-${ph}" style="margin-top:4px"><option value="">— Target province —</option>${provOpts}</select>
          <div style="font-size:.72rem;color:var(--stone);margin-top:2px">${SPELL_HINTS[selSpell] || ""}</div>` : kcHtml`<input id="po-extra-${c.id}-${ph}" type="text" value="" placeholder="${selSpell === "Part Sea" ? "No province here or adjacent" : selSpell === "Flood" ? "No land province here or adjacent" : selSpell === "Hide Lairs" ? "No discovered lairs here or adjacent" : "No valid target province in reach"}" disabled>
          <div style="font-size:.72rem;color:var(--stone);margin-top:2px">${SPELL_HINTS[selSpell] || ""}</div>`;
	} else if (NEEDS_CHAR.has(selSpell)) {
		const casterLoc = predictedLocation(c.id, ph)?.id ?? c.locationId;
		let charOpts = "";
		if (selSpell === "Resurrect") {
			const casterHereName = (predictedLocation(c.id, ph) || {}).name;
			charOpts = (report.knownDeadHeroes || report.deadHeroes || []).filter((x) => {
				if (x.locationId != null && casterLoc != null) return String(x.locationId) === String(casterLoc);
				return casterHereName && x.locationName === casterHereName;
			}).map((x) => {
				const _r = x.raisable !== void 0 ? !!x.raisable : !x.isKing || !!x.isMonarch;
				const _w = x.whyNot || (x.isKing && !x.isMonarch ? "kings cannot be resurrected" : "not a legal target");
				return {
					...x,
					_r,
					_w
				};
			}).sort((a, b) => (b._r ? 1 : 0) - (a._r ? 1 : 0)).map((x) => {
				const who = x.isMonarch ? " 👑 (your fallen monarch — reclaims the throne)" : x.wasOwnHero ? "" : ` ⚔ (${x.player != null ? realmNameP(x.player, report) + " hero" : "wandering hero"})`;
				if (!x._r) return kcHtml`<option value="" disabled>${x.isMonarch ? "👑 " : ""}${x.name} — cannot be raised: ${x._w}</option>`;
				return kcHtml`<option value="${x.id}"${x.wasOwnHero ? "" : realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.isMonarch ? "👑 " : ""}${x.name}${who} — died turn ${x.killedOnTurn || "?"}</option>`;
			});
			if (!charOpts.length) charOpts = kcHtml`<option value="" disabled>No fallen hero lies in ${casterHereName || "this province"} — only bodies in the caster's province can be raised; move there first</option>`;
		} else if (selSpell === "Charm") {
			charOpts = (report.visibleChars || []).filter((x) => x.alive !== false && x.locationId === casterLoc && !x.isKing && !leadsArmiesP(x) && !x.charmImmune && (x.player === null || x.player !== c.player)).map((x) => kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.name}${x.player === null ? " (wandering — joins you free)" : ` ⚔ (${realmNameP(x.player, report)}, no armies — yours for the turn)`} — ${x.locationName || "?"}</option>`);
			if (!charOpts.length) charOpts = kcHtml`<option value="" disabled>No valid target — needs a lone hero (wandering or enemy, leading no armies) in this province (kings are immune, and so is anyone charmed last turn)</option>`;
		} else if (selSpell === "Oratory") charOpts = [kcHtml`<option value="${c.id}" ${extra == c.id ? "selected" : ""}>${c.name} (self)</option>`, ...orderTargetCharsP(report, ph, { allowCharmEnemy: true }).filter((x) => x.id !== c.id && (predictedLocation(x.id, ph)?.id ?? x.locationId) === casterLoc).map((x) => kcHtml`<option value="${x.id}" ${extra == x.id ? "selected" : ""}>${x.name} — ${x.locationName || "?"}${preOrderTagP(x)}</option>`)];
		else if (selSpell === "Phantasmal Armies") charOpts = [kcHtml`<option value="${c.id}" ${extra == c.id ? "selected" : ""}>${c.name} (self)</option>`, ...orderTargetCharsP(report, ph, { allowCharmEnemy: true }).filter((x) => x.id !== c.id && (predictedLocation(x.id, ph)?.id ?? x.locationId) === casterLoc).map((x) => kcHtml`<option value="${x.id}" ${extra == x.id ? "selected" : ""}>${x.name} — ${x.locationName || "?"}${preOrderTagP(x)}</option>`)];
		else if (selSpell === "Clairvoyance") {
			charOpts = (report.everSeenChars && report.everSeenChars.length ? report.everSeenChars : report.visibleChars || []).filter((x) => x && x.player != null && !x.isWandering).slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")).map((x) => kcHtml`<option value="${x.id}"${x.player === c.player ? "" : realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.name}${x.player === c.player ? " (yours)" : ` ⚔ (${realmNameP(x.player, report)})`} — last seen: ${x.lastLocName || x.locationName || "?"}${x.lastSeenTurn ? ` (turn ${x.lastSeenTurn})` : ""}</option>`);
			if (!charOpts.length) charOpts = kcHtml`<option value="" disabled>You have not seen any enemy characters yet</option>`;
		} else if (selSpell === "Control Undead") charOpts = [kcHtml`<option value="__scan__" ${extra === "__scan__" || extra === "" || extra == null ? "selected" : ""}>🔍 Cast on THIS province — reveal the dead army units here</option>`, ...(report.visibleChars || []).filter((x) => x.player !== c.player && x.locationId === casterLoc).map((x) => kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.name}${x.player === null ? " (wandering)" : ` ⚔ (${realmNameP(x.player, report)})`} — seize one undead unit from them</option>`)];
		else if (selSpell === "Telekinetic Storm") {
			charOpts = (report.visibleChars || []).filter((x) => x.player !== c.player && x.locationId === casterLoc && leadsArmiesP(x)).map((x) => kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.name}${x.player === null ? " (wandering)" : ` ⚔ (${realmNameP(x.player, report)})`} — ${x.armyBand || x.armies + " unit" + (x.armies !== 1 ? "s" : "")} — ${x.locationName || "?"}</option>`);
			if (!charOpts.length) charOpts = kcHtml`<option value="" disabled>No enemy/neutral hero leading armies in this province</option>`;
		} else {
			charOpts = (report.visibleChars || []).filter((x) => x.player !== c.player && x.locationId === casterLoc).map((x) => kcHtml`<option value="${x.id}"${realmOptStyleP(x.player, report)} ${extra == x.id ? "selected" : ""}>${x.name}${x.player === null ? " (wandering)" : ` ⚔ (${realmNameP(x.player, report)})`} — ${x.locationName || "?"}</option>`);
			if (!charOpts.length) charOpts = kcHtml`<option value="" disabled>No enemy/neutral heroes in this province</option>`;
		}
		const _ph0 = selSpell === "Control Undead" ? "— Choose what to cast it on —" : "— Target character —";
		secondaryHtml = kcHtml`<select id="po-extra-${c.id}-${ph}" style="margin-top:4px" onchange="syncResurrectCard(${kcArg(String(c.id))},${kcArg(ph)});syncCharmCard(${kcArg(String(c.id))},${kcArg(ph)})"><option value="">${_ph0}</option>${charOpts}</select>
          <div style="font-size:.72rem;color:var(--stone);margin-top:2px">${SPELL_HINTS[selSpell] || ""}</div>`;
	} else secondaryHtml = kcHtml`<input id="po-extra-${c.id}-${ph}" type="hidden" value=""><div style="font-size:.72rem;color:var(--stone);margin-top:2px">${SPELL_HINTS[selSpell] || ""}</div>`;
	return secondaryHtml;
}
//#endregion
//#region src/ui/player/report.ts
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
	const { data: gp, error } = await sb.from("game_players").select("*").eq("id", gamePlayerId).single();
	if (error) {
		document.getElementById("report-title").textContent = "Error: " + error.message;
		return;
	}
	const { data: g, error: gErr } = await sb.from("games").select("id,name,gm_user_id,status,turn,max_players,block_eliminated_msgs").eq("id", gp.game_id).single();
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
		Pagan: `Your realm draws on ancient and forgotten powers. Your king walks the wild places from birth — Explorer 1 from the outset. Perform Rite at discovered ritual sites (now found across much of the world, commonest in wild Creature and Monster country): the Wild Hunt binds a province's creatures to your host, and a Blood Offering sacrifices units to empower an equal number of others (+2 quality tiers each, to Elite). Blood Harvest: +1g per enemy unit your characters destroy in victory. Your armies fight with a 15% chance of fanaticism.`,
		Evil: `Your realm rules through fear and domination. Your king commands Druid 1 from the outset, and all Monster armies follow your heroes without any Druid skill requirement (every level of Druid a commander does hold adds +20% to them), though a hero leads at most as many Creature and Monster units as his Druid level. You begin beside a Monster province you can lead from turn one, and there is always at least one within two provinces of your home. When your forces win decisively, a Terror effect lingers — any army defending that province in the next battle fights at −10% strength, broken by what they witnessed — and by Reign of Fear your Monsters fight at ×1.5 when they attack a province your own Terror still grips. Monster armies — Cave Trolls, Manticore Pride, Basilisk Brood, Sea Giants, Eldritch Kraken, Elder Dragons, Titan Warbeasts, Dread Hydras and Shark Shoals — fight with savage fury under your command — a host with any of them in it fights at ×1.25 in every battle (no roll; it does not stack with zeal, the stronger counts). When you conquer a province, your forces immediately plunder 50% of the province's tax value in gold. Your armies fight with a 25% base chance of fanaticism.`,
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
      ${playerAlignment === "Evil" ? kcHtml`💀 <strong>Evil bonuses</strong> — <span style="color:#701010"><strong>[M] Monster</strong></span> armies get no Druid penalty and lift the whole host to ×1.25 in every battle (not stacking with zeal); every level of Druid your commander holds adds +20% to them. Your king starts with Druid +1. On decisive wins: Terror effect, and Reign of Fear — your Monsters fight ×1.5 attacking ground your Terror grips. On province conquest: instant 50% loot.` : ""}
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
			const druLevel = effSkillP(c, "druid");
			let totalStr = 0, totalCost = 0, druidUnits = 0, druidShort = 0;
			const lines = arr.map((a) => {
				const rawBs = unitBaseStrength(a);
				const kingRaceMatch = !!(a.race && kingdom.race && a.race === kingdom.race);
				const leadRaceMatch = !!(a.race && a.race === c.race);
				const _RIVAL_RACE_UI = { ...KC_RIVAL_RACE };
				const feudLed = !!(a.race && c.race && _RIVAL_RACE_UI[a.race] === c.race);
				let bs = rawBs;
				if (kingRaceMatch) bs = Math.round(bs * 1.2);
				if (leadRaceMatch) bs = Math.round(bs * 1.2);
				if (feudLed) bs = Math.round(bs * .8);
				const creature = CREATURE_ARMIES_UI.has(a.type), monster = MONSTER_ARMIES_UI.has(a.type);
				const _dn = druidNeedP(a, c, report);
				const req = _dn.req;
				if (_dn.counts) druidUnits++;
				const effDru = _dn.effDru;
				const shortfall = _dn.shortfall;
				if (shortfall > 0) {
					druidShort++;
					bs = Math.max(1, Math.round(bs * strengthLeftByADruidShortfall(shortfall)));
				}
				const mastery = !a.skeletal && (creature || monster) ? Math.round(druidMasteryGainOver(druidLevelTheMasteryCounts(druLevel), req) * 100) : 0;
				if (mastery > 0) bs = Math.round(bs * (1 + mastery / 100));
				totalStr += bs;
				totalCost += a.cost != null ? a.cost : 2;
				const mast = mastery > 0 ? kcHtml` <span style="color:#1d5a1d;font-size:.66rem">+${mastery}% Druid mastery</span>` : "";
				const pen = shortfall > 0 ? kcHtml` <span style="color:var(--crimson);font-size:.68rem">−${shortfall * 20}% str (Druid ${effDru}/${req})</span>` : "";
				const raceBoost = kingRaceMatch || leadRaceMatch ? kcHtml` <span style="color:#1d5a1d;font-size:.66rem">+${kingRaceMatch && leadRaceMatch ? 44 : 20}% kin</span>` : "";
				const feudTag = feudLed ? kcHtml` <span style="color:var(--crimson);font-size:.66rem">−20% feud</span>` : "";
				const tag = creature || monster ? kcHtml` <span style="color:#1d5a1d;font-size:.62rem">[${creature ? "Creature" : "Monster"}]</span>` : "";
				return kcHtml`<div style="font-size:.75rem">${unitAbilityTip(a.type, kcHtml`${unitEmoji(a.type)} <span style="color:${reportColour(kingdom.color) || "var(--ink)"}">${armyLabel(a, { noMove: true })}</span>`)} <span style="color:var(--stone);font-size:.66rem">str ${bs}${a.moveRate != null ? ` · move ${a.moveRate}${a.moveKind === "sea" ? " (sea)" : a.moveKind === "air" ? " (air)" : ""}` : ""}</span>${tag}${raceBoost}${feudTag}${mast}${pen}</div>`;
			});
			const effSpd2 = c.effectiveSpeed != null ? c.effectiveSpeed : Math.min(...arr.map((a) => a.speed || 3));
			const _FLY_UI2 = new Set(KC_UNIT_CLASS.flying);
			const _SEA_UI2 = new Set(KC_UNIT_CLASS.sea);
			const _AER_UI2 = new Set(KC_UNIT_CLASS.aerial);
			const _hasFlyer = arr.some((a) => _FLY_UI2.has(a.type));
			const _hasFoot = arr.some((a) => !_AER_UI2.has(a.type) && !_SEA_UI2.has(a.type));
			const _airborne = _hasFlyer && _hasFoot && !arr.some((a) => _SEA_UI2.has(a.type)) && c.effectiveSeaSpeed > 0;
			const _airNote = _airborne ? kcHtml` · <span style="color:#2d6a8a">🦅 Airborne — the flyers carry the foot soldiers, so the whole force flies (crosses sea, moves at the flyers' pace)</span>` : "";
			const _CARRIER_UI2 = new Set(KC_UNIT_CLASS.carrier);
			const _LIGHT_UI2 = new Set(KC_UNIT_CLASS.lightFoot);
			const _landUnits = arr.filter((a) => !_AER_UI2.has(a.type) && !_SEA_UI2.has(a.type));
			let _hullNeed = _landUnits.reduce((n, a) => n + (_LIGHT_UI2.has(a.type) ? .5 : 1), 0);
			if (effSkillP(c, "naval") >= 8) _hullNeed /= 2;
			const _hullNeedShown = Math.ceil(_hullNeed);
			const _hullHave = arr.reduce((n, a) => n + (_CARRIER_UI2.has(a.type) ? KC_CARRIER_BERTHS && KC_CARRIER_BERTHS[a.type] || 1 : 0), 0);
			let _seaNote = "";
			if (_landUnits.length === 0) _seaNote = kcHtml` · ⚓ <span style="color:#2d6a8a">Sea: every unit sails or flies on its own</span>`;
			else if (_airborne) _seaNote = "";
			else if (_hullHave >= _hullNeed) _seaNote = kcHtml` · ⚓ <span style="color:#1d5a1d">Sea transport: needs ${_hullNeedShown} hull${_hullNeedShown !== 1 ? "s" : ""}, has ${_hullHave} — can put to sea</span>`;
			else _seaNote = kcHtml` · ⚓ <span style="color:var(--crimson)">Sea transport: needs ${_hullNeedShown} hull${_hullNeedShown !== 1 ? "s" : ""}, has ${_hullHave} — ${_hullNeedShown - _hullHave} more fleet unit${_hullNeedShown - _hullHave !== 1 ? "s" : ""} to carry the whole force</span>`;
			const druNote = druidUnits > 0 ? kcHtml` · 🌿 ${druidUnits} unit${druidUnits !== 1 ? "s" : ""} need Druid ${druidShort > 0 ? kcHtml`<span style="color:var(--crimson)">(${druidShort} under-led — losing strength)</span>` : kcHtml`<span style="color:#1d5a1d">(${c.name.split(" ")[0]} qualifies)</span>`}` : "";
			const summary = kcHtml`<div style="margin-top:3px;font-size:.7rem;color:var(--stone);border-top:1px dotted var(--parchment-dark);padding-top:2px">⚔ Total strength <strong>${totalStr}</strong> <span style="font-size:.64rem">(base, before terrain/tactics/fanaticism)</span> · 🏃 Move <strong>${effSpd2}</strong> province${effSpd2 !== 1 ? "s" : ""}/turn · 💰 Upkeep <strong>${totalCost}g/turn</strong>${druNote}${_airNote}${_seaNote}</div>`;
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
function renderDiplomacy(report) {
	_renderDiplomacyInto(document.getElementById("report-diplomacy"), report, false);
	_renderDiplomacyInto(document.getElementById("orders-diplomacy"), report, true);
}
function _renderDiplomacyInto(el, report, withControls) {
	if (!el) return;
	const known = report && report.diplomacy && report.diplomacy.known || [];
	const alliancesAllowed = !report || !report.diplomacy || report.diplomacy.alliancesAllowed !== false;
	const _ssUntil = Number(report && report.diplomacy && report.diplomacy.safeStartUntil) || 0;
	const _ssLive = Number(report && (report._liveTurn || report.turn)) || 1;
	const safeLocked = _ssUntil > 0 && _ssLive < _ssUntil;
	if (!known.length) {
		el.innerHTML = kcHtml`<em style="color:#3a3224;font-size:.85rem">You have not yet encountered another realm. Once you see a rival's province or one of their characters, you may treat with them here.</em>`;
		return;
	}
	const relBadge = (r) => r === "allied" ? kcHtml`<span class="pill" style="background:#dff0d8;color:#1d541d">🤝 Allied</span>` : r === "enemy" ? kcHtml`<span class="pill" style="background:#f7d7d7;color:#701010">⚔ At war</span>` : kcHtml`<span class="pill" style="background:#efe6cc;color:#3a2e18">🕊 Neutral</span>`;
	const btn = (idx, val, label, bg) => kcHtml`<button onclick="setDiploChoice(${kcArg(idx)},${kcArg(val)})" style="font-family:'Cinzel',serif;font-size:.68rem;padding:5px 10px;border:1px solid ${bg};background:transparent;color:${bg};border-radius:2px;cursor:pointer">${label}</button>`;
	const pendingLabel = (k) => {
		const p = diploChoices[k.index];
		if (p === "enemy") return k.relation === "allied" ? "Break Alliance" : "Declare War";
		if (p === "treat") return k.relation === "enemy" ? "Propose Peace" : "Propose Alliance";
		return "";
	};
	el.innerHTML = kcHtml`${known.map((k) => {
		const pending = diploChoices[k.index];
		let controls;
		if (k.conceded || k.eliminated) {
			if (pending != null) delete diploChoices[k.index];
			controls = kcHtml`<div style="font-size:.78rem;color:#3a3224"><em>${k.eliminated && !k.conceded ? "This dynasty is extinguished" : "This realm has withdrawn from the game"} — there is no court left to treat with, and no declaration can be made against it.</em></div>`;
		} else if (safeLocked) {
			if (pending != null) delete diploChoices[k.index];
			controls = withControls ? kcHtml`<div style="font-size:.78rem;color:#3a3224"><em>🕊 Safe Start — no Treat or declaration of war may be made until the orders for Turn ${_ssUntil}.</em></div>` : "";
		} else if (!withControls) controls = pending ? kcHtml`<div style="font-size:.78rem;color:#7a1c1c">Pending this turn: <strong>${pendingLabel(k)}</strong> <span style="color:#3a3224">(change it at the top of your Orders)</span></div>` : "";
		else if (pending) controls = kcHtml`<div style="font-size:.8rem;color:#7a1c1c">Pending this turn: <strong>${pendingLabel(k)} — ${k.name}</strong> &nbsp;<button onclick="setDiploChoice(${kcArg(k.index)},null)" style="font-size:.66rem;padding:2px 8px;border:1px solid #999;background:#eee;border-radius:2px;cursor:pointer">cancel</button></div>`;
		else if (k.relation === "neutral") controls = kcHtml`${alliancesAllowed ? kcHtml`${btn(k.index, "treat", "Propose Alliance", "#2d6a2d")} ` : ""}${btn(k.index, "enemy", "Declare War", "#8a1c1c")}`;
		else if (k.relation === "enemy") controls = btn(k.index, "treat", "Propose Peace", "#2d6a2d");
		else {
			const _darkSelf = ["Evil", "Undead"].includes((report.kingdom || {}).alignment);
			controls = btn(k.index, "enemy", _darkSelf ? "Break Alliance — War" : "Break Alliance", "#8a1c1c");
		}
		return kcHtml`<div style="border:1px solid var(--parchment-dark);border-radius:2px;padding:8px 10px;margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="color:${reportColour(k.color) || "#333"}">${k.name}</strong>
        <span style="font-size:.72rem;color:#332c20">${k.alignment || ""}</span>
        ${k.conceded || k.eliminated ? kcHtml`<span class="pill" style="background:#e6ded0;color:#3a2e18">${k.eliminated && !k.conceded ? "☠ Extinguished" : "🏳 Conceded"}${k.conceded && k.concededTurn ? ` (turn ${k.concededTurn})` : ""}</span>` : relBadge(k.relation)}
        ${!k.conceded && !k.eliminated && k.offeredUs ? kcHtml`<span class="pill" style="background:#e3eefa;color:#1c3e6a" title="They proposed this last turn. Propose it back this turn to seal it.">🕊 Offered ${k.offeredUs === "peace" ? "peace" : "an alliance"} last turn</span>` : ""}
      </div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${controls}</div>
    </div>`;
	})}${withControls && safeLocked ? kcHtml`<div style="font-size:.72rem;color:#3a3224;margin-top:6px">🕊 <strong>Safe Start:</strong> this is a Safe Start game — diplomacy opens with the orders for <strong>Turn ${_ssUntil}</strong> (this is Turn ${_ssLive}).</div>` : ""}${withControls && !safeLocked ? kcHtml`<div style="font-size:.72rem;color:#3a3224;margin-top:6px">${alliancesAllowed ? kcHtml`An <strong>alliance</strong> or <strong>peace</strong> is sealed only if <em>both</em> realms propose it in the same turn; a <strong>declaration of war</strong> takes effect on its own.` : kcHtml`In a realm of so few kings <strong>no alliances</strong> may be forged — you may make <strong>peace</strong> (both must propose it) or <strong>declare war</strong> (on its own).`} Changes apply at the start of next turn — except that an <strong>Evil</strong> or <strong>Undead</strong> realm's declaration of war takes effect at the <strong>start of this very turn</strong>: its armies may attack the moment the orders run. <strong>Breaking an alliance</strong> returns the two realms to <strong>Neutral</strong> — only an Evil or Undead crown goes straight from alliance to war. Submit your orders to lodge these declarations.</div>` : ""}`;
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
//#endregion
//#region src/ui/player/orders-form.ts
function computeOrderLedgerP() {
	const rep = currentReport || {};
	const k = rep.kingdom || {};
	const P = rep.orderPrices || {};
	const wageOf = (t) => P.unitWage && P.unitWage[t] != null ? P.unitWage[t] : (P.unitCost || {})[t] || 2;
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
	const heroesAvail = Object.values(rep.provinceOrderData || {}).flatMap((pd) => pd.availableHeroes || []);
	const hired = /* @__PURE__ */ new Set(), mercsTaken = /* @__PURE__ */ new Set();
	const hireHero = (hid) => {
		hid = String(hid);
		if (!/^\d+$/.test(hid) || hired.has(hid)) return;
		const h = heroesAvail.find((x) => String(x.id) === hid);
		if (!h) return;
		const w = heroHireWageOfP(h, rep);
		if (w == null) return;
		hired.add(hid);
		cats.heroes.g += w;
		cats.heroes.n++;
		cats.heroes.wage += w;
	};
	(rep.characters || []).filter((c) => c && c.alive !== false).forEach((c) => {
		for (let ph = 0; ph < 5; ph++) {
			const act = document.getElementById(`po-action-${c.id}-${ph}`)?.value || "";
			if (!act) continue;
			const tgt = String(getOrderTarget(c.id, ph) || "");
			if (act === "Recruit Armies") {
				const loc = predictedLocation(c.id, ph);
				const pd = loc ? (rep.provinceOrderData || {})[loc.id] : null;
				tgt.split(",").map((x) => x.trim()).filter(Boolean).forEach((tok) => {
					if (tok.startsWith("to:")) return;
					if (tok.startsWith("merc:")) {
						if (mercsTaken.has(tok)) return;
						const m = (rep.mercIntel || []).find((x) => "merc:" + x.id === tok);
						if (!m) return;
						mercsTaken.add(tok);
						cats.mercs.g += m.cost || 0;
						cats.mercs.n++;
						cats.mercs.wage += wageOf(m.type);
						return;
					}
					const [type, q] = tok.split("|");
					const n = Math.max(1, parseInt(q) || 1);
					const at = (pd && pd.armyTypes || []).find((a) => a.type === type);
					const cost = at && at.cost != null ? at.cost : (P.unitCost || {})[type] || 2;
					cats.armies.g += cost * n;
					cats.armies.n += n;
					cats.armies.wage += wageOf(type) * n;
				});
			} else if (act === "Hire Hero") hireHero(tgt);
			else if (act === "Broker") {
				if (tgt.startsWith("hire:")) hireHero(tgt.slice(5));
				else if (tgt.startsWith("spy:")) {
					cats.intel.g += P.brokerSpy != null ? P.brokerSpy : 2;
					cats.intel.n++;
				}
			} else if (act === "Harvest the Field") {
				cats.armies.g += P.harvest != null ? P.harvest : 2;
				cats.armies.n++;
				cats.armies.wage += 1;
			} else if (act === "Perform Rite" && /^wild/i.test(tgt)) {
				const loc = predictedLocation(c.id, ph);
				const pd = loc ? (rep.provinceOrderData || {})[loc.id] : null;
				if (pd && pd.wildHuntCost != null) {
					cats.other.g += pd.wildHuntCost;
					cats.other.n++;
				}
			} else if (act === "Hunting Rumours") {
				const loc = predictedLocation(c.id, ph);
				const pd = (loc ? (rep.provinceOrderData || {})[loc.id] : null) || (rep.provinceOrderData || {})[c.locationId] || null;
				const feats = (pd && pd.features || []).filter((f) => !f.ritualSite && f.monster);
				tgt.split(",").map((x) => x.trim()).filter(Boolean).forEach((ix) => {
					const f = feats.find((x) => String(x.idx) === ix);
					if (!f) return;
					cats.intel.g += RUMOUR_COST_BY_POWER_P[f.monsterPower] || 1;
					cats.intel.n++;
				});
			}
		}
	});
	const spend = Object.values(cats).reduce((s, x) => s + x.g, 0);
	const newWages = Object.values(cats).reduce((s, x) => s + x.wage, 0);
	const gold = k.gold || 0, tax = k.taxIncome || 0;
	const armyW = k.nextArmyWages != null ? k.nextArmyWages : k.armyWages || 0, heroW = k.nextHeroWages != null ? k.nextHeroWages : k.heroWages || 0;
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
function renderOrderLedgerP() {
	const el = document.getElementById("orders-ledger");
	if (!el) return;
	if (!currentReport || !currentReport.kingdom || !document.querySelector("#orders-form select[id^=\"po-action-\"]")) {
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
	el.innerHTML = kcHtml`<div style="font-size:.78rem;line-height:1.45;padding:3px 2px 6px">
    <div style="display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline">
      <span>💰 Treasury <strong>${L.gold}g</strong></span>
      <span>Spent in orders <strong style="color:${L.spend > 0 ? "#8a1c1c" : "inherit"}">${L.spend}g</strong></span>
      <span>Left <strong style="color:${neg ? "#c00" : "var(--forest)"}">${L.left}g</strong></span>
    </div>
    ${parts.length ? kcHtml`<div style="display:flex;flex-wrap:wrap;gap:2px 10px;font-size:.72rem;margin-top:1px">${parts}</div>` : ""}
    ${neg ? kcHtml`<div style="font-size:.7rem;color:#c00;margin-top:2px">⚠ These orders cost more than the treasury holds — tax only arrives at the end of the turn, so whatever is paid for last will fail for want of gold.</div>` : ""}
    <div style="font-size:.72rem;color:#4a3a1a;margin-top:2px" title="Estimate: treasury − orders + this turn's tax − army wages − hero wages − the wages of units and heroes these orders add. Failed orders cost nothing; disbanding or releasing lowers wages.">📅 End of turn ≈ <strong style="color:${pneg ? "#c00" : "inherit"}">${L.projected}g</strong> <span style="color:var(--stone)">(+${L.tax} tax − ${L.armyW} army wages − ${L.heroW} hero wages${L.newWages ? ` − ${L.newWages} new wages` : ""})</span></div>
    ${L.notes.length ? kcHtml`<div style="font-size:.66rem;color:var(--stone)">${L.notes.join(" · ")}</div>` : ""}
  </div>`;
}
var _ledgerT = null;
function scheduleOrderLedgerP() {
	clearTimeout(_ledgerT);
	_ledgerT = setTimeout(() => {
		try {
			renderOrderLedgerP();
		} catch (e) {
			console.warn("ledger", e);
		}
	}, 120);
}
document.addEventListener("change", (ev) => {
	if (ev.target && ev.target.closest && ev.target.closest("#orders-column")) scheduleOrderLedgerP();
}, true);
document.addEventListener("input", (ev) => {
	if (ev.target && ev.target.closest && ev.target.closest("#orders-column")) scheduleOrderLedgerP();
}, true);
function buildOrdersForm(chars, alreadySubmitted, existingOrders, turnNum) {
	const report = currentReport || {};
	chars = (chars || []).filter((c) => !(c && isPreOrderIdP(c.id)));
	if (currentReport && Array.isArray(currentReport.characters)) currentReport.characters = currentReport.characters.filter((c) => !(c && isPreOrderIdP(c.id)));
	chars = applyHeroOrderP(chars, heroOrderFromOrdersP(existingOrders) || (Array.isArray(report.heroOrder) && report.heroOrder.length ? report.heroOrder.map(String) : null));
	if (currentReport && Array.isArray(currentReport.characters)) currentReport.characters = chars;
	_heroOrder = chars.filter((c) => c && c.alive !== false).map((c) => String(c.id));
	const el = document.getElementById("orders-form");
	const msg = document.getElementById("orders-msg");
	if (alreadySubmitted) {
		msg.innerHTML = kcHtml`<div class="msg-success" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span>✓ Orders submitted — awaiting the GM to run the turn.</span>
      <button class="btn btn-ghost" style="padding:6px 14px;font-size:.8rem" onclick="reviseOrders()">✏ Revise Orders</button>
    </div>`;
		{
			const _w = document.getElementById("orders-submit-wrap");
			if (_w) {
				_w.innerHTML = kcHtml`<button class="btn btn-crimson btn-full" id="submit-btn" disabled style="flex:1;padding:12px;font-size:.85rem;opacity:.7;cursor:default">Orders Submitted ✓</button>`;
				_w.style.display = "flex";
			}
		}
		{
			const _lg = document.getElementById("orders-ledger");
			if (_lg) _lg.style.display = "none";
		}
		const savedOrders = typeof existingOrders === "string" ? JSON.parse(existingOrders) : existingOrders || {};
		const savedO = savedOrders.orders || savedOrders || {};
		const SEASONS_RO = KC_SEASONS.slice();
		el.innerHTML = kcHtml`<div style="opacity:.65;pointer-events:none;user-select:none">
      <div style="font-family:Cinzel,serif;font-size:.72rem;color:var(--stone);text-transform:uppercase;letter-spacing:.08em;padding:6px 0 8px">Submitted orders (read-only):</div>
      ${chars.filter((c) => c.alive !== false).map((c) => {
			const cOrders = savedO[c.id] || [];
			cOrders.some((o) => o && o.action && o.action !== "Defend" && o.action !== "defend");
			return kcHtml`<div style="margin-bottom:12px;border:1px solid var(--stone);border-radius:3px;overflow:hidden">
          <div style="font-family:Cinzel,serif;font-size:.85rem;padding:6px 10px;background:var(--parchment-dark)">${c.isKing ? "👑" : "⚔"} ${c.name}</div>
          <div style="padding:6px 10px">
            ${SEASONS_RO.map((season, ph) => {
				const o = cOrders[ph];
				if (!o || !o.action || o.action === "Defend" || o.action === "defend") return kcHtml`<div style="font-size:.78rem;padding:2px 0;color:var(--stone)">${season}: <em>Defend</em></div>`;
				return kcHtml`<div style="font-size:.78rem;padding:2px 0">${season}: <strong>${o.action}</strong>${o.target ? " — " + o.target : ""}</div>`;
			})}
          </div>
        </div>`;
		})}
      ${(() => {
			const SEASONS_SY = SEASONS_RO;
			const rows = Object.entries(savedO).filter(([k]) => /^(?:hired|resurrect|charm)_\d+_via_.+_ph\d+$/.test(String(k)));
			if (!rows.length) return "";
			const LABEL = {
				hired: "newly hired",
				resurrect: "if raised",
				charm: "if charmed"
			};
			return rows.map(([k, ords]) => {
				const kind = String(k).split("_")[0];
				const heroId = String(k).split("_")[1];
				const _rp = currentReport || {};
				const nm = (_rp.visibleChars || []).find((x) => String(x.id) === heroId)?.name || Object.values(_rp.provinceOrderData || {}).flatMap((pd) => pd.availableHeroes || []).find((x) => String(x.id) === heroId)?.name || ((_rp.knownDeadHeroes || _rp.graveyard || []).find((x) => String(x.id) === heroId) || {}).name || "Hero";
				const from = parseInt(String(k).match(/_ph(\d+)$/)?.[1] || "0");
				return kcHtml`<div style="margin-bottom:12px;border:1px dashed var(--stone);border-radius:3px;overflow:hidden">
            <div style="font-family:Cinzel,serif;font-size:.85rem;padding:6px 10px;background:var(--parchment-dark)">\u2694 ${nm} <span style="font-size:.68rem;color:var(--stone)">(${LABEL[kind] || kind})</span></div>
            <div style="padding:6px 10px">
              ${SEASONS_SY.map((season, ph) => {
					if (ph <= from) return kcHtml`<div style="font-size:.78rem;padding:2px 0;color:var(--stone)"><em>${season}: \u2014</em></div>`;
					const o = (ords || [])[ph];
					if (!o || !o.action || o.action === "Defend" || o.action === "defend") return kcHtml`<div style="font-size:.78rem;padding:2px 0;color:var(--stone)">${season}: <em>Defend</em></div>`;
					return kcHtml`<div style="font-size:.78rem;padding:2px 0">${season}: <strong>${o.action}</strong>${o.target ? " — " + o.target : ""}</div>`;
				})}
            </div>
          </div>`;
			});
		})()}
    </div>`;
		return;
	}
	restoreSubmitWrap("Submit");
	let rawSaved = {};
	try {
		rawSaved = typeof existingOrders === "string" ? JSON.parse(existingOrders || "{}") : existingOrders || {};
	} catch (e) {
		rawSaved = {};
	}
	{
		const _liveTurn = currentReport && (currentReport._liveTurn || currentReport.turn) || turnNum || 1;
		if (rawSaved.forTurn != null && rawSaved.forTurn !== _liveTurn) {
			const _staleTurn = rawSaved.forTurn;
			console.warn("Discarding draft written for turn", _staleTurn, "— this is turn", _liveTurn);
			rawSaved = {};
			const _m = document.getElementById("orders-msg");
			if (_m) _m.innerHTML = kcHtml`<div class="msg-info">Your saved draft was written for Turn ${_staleTurn} and has been set aside — the GM has resolved that turn since. These orders start fresh.</div>`;
		}
	}
	const savedOrders = rawSaved.orders || rawSaved;
	_draftOrdersSnapshot = savedOrders || {};
	const savedEncounterPlans = rawSaved.encounterPlans || {};
	if (rawSaved.diplomacy && typeof rawSaved.diplomacy === "object") diploChoices = { ...rawSaved.diplomacy };
	if (rawSaved.callReckoning === true) reckoningCall = true;
	if (rawSaved.discoveryChoices && typeof rawSaved.discoveryChoices === "object") discoveryChoices = { ...rawSaved.discoveryChoices };
	setTimeout(renderDiscoveryChoices, 0);
	concedeGame = rawSaved.concede === true;
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
	el.innerHTML = kcHtml`${_realmTop}${discoveryChoiceBlockHTML()}${_reorderNote}${heirSelectorHTML(chars)}${_orderChars.map((c, _hi) => {
		const _hn = _orderChars.length;
		const hiredPh = c.hiredInPhase ?? -1;
		const savedEP = savedEncounterPlans[c.id] || c.encounterPlan || {
			tactics: ["ME"],
			notes: ""
		};
		const currentTactics = savedEP.tactics || ["ME"];
		const epOrdered = currentTactics.filter((t) => !String(t).toUpperCase().startsWith("CS:"));
		const epPreSchool = (currentTactics.find((t) => String(t).toUpperCase().startsWith("CS:")) || "").slice(3).toLowerCase();
		return kcHtml`
    <div class="orders-char-block" data-hero="${c.id}">
      <div class="orders-char-head">
        <button type="button" class="sec-toggle" aria-expanded="true" title="Minimise / maximise this hero's orders" onclick="toggleSection(this)">&#9662;</button>
        ${c.isKing ? "👑" : "⚔"} ${c.name}
        ${hiredPh >= 0 ? kcHtml`<span style="background:#c8922a;color:#1a1208;font-size:.65rem;padding:1px 6px;border-radius:2px;margin-left:6px">Hired ${SEASONS[hiredPh]} — acts from ${SEASONS[hiredPh + 1] || "next turn"}</span>` : ""}
        <span style="margin-left:auto;font-size:.7rem;opacity:.85">📍 ${provLinkHtml(c.locationId, c.locationName || "?", "on-dark")} · Land: ${c.effectiveSpeed || 3}/turn${(c.skills?.march || 0) > 0 ? ` (March ${c.skills.march})` : ""}${c.effectiveSeaSpeed ? ` · Sea: ${c.effectiveSeaSpeed}/turn${(c.skills?.naval || 0) > 0 ? ` (Naval ${c.skills.naval})` : ""}` : ""}</span>
        <button type="button" class="hero-move hero-move-up" ${_hi === 0 ? "disabled" : ""} title="Move this hero up the orders column" onclick="moveHeroBlock(${kcArg(String(c.id))},-1)">&#9650;</button>
        <button type="button" class="hero-move hero-move-down" ${_hi >= _hn - 1 ? "disabled" : ""} title="Move this hero down the orders column" onclick="moveHeroBlock(${kcArg(String(c.id))},1)">&#9660;</button>
      </div>
      <div style="padding:5px 10px 6px;background:#fdf5e0;border-bottom:1px solid var(--parchment-dark);font-size:.76rem;display:flex;flex-wrap:wrap;gap:8px;line-height:1.6">
        <span style="flex-basis:100%;width:100%;color:var(--stone)">${formatRace(c.race)} · ${c.alignment || "—"} · ${c.temper || "—"}</span>
        <span><strong>HP:</strong> ${c.hp || "?"}/${c.maxHp || "?"}</span>
        ${skillRowHTML(c, "inline")}
        ${(() => {
			const armies = c.armies || [];
			if (armies.length === 0) return kcHtml`<span style="color:#aaa">No armies</span>`;
			effSkillP(c, "druid");
			return armies.map((a) => {
				const { req, effDru, shortfall } = druidNeedP(a, c);
				const penalty = shortfall > 0 ? kcHtml` <span style="color:var(--crimson);font-size:.7rem">−${shortfall * 20}% str (Druid ${effDru}/${req})</span>` : "";
				return kcHtml`<div style="flex-basis:100%;width:100%;color:var(--crimson)">${unitEmoji(a.type)} ${armyLabel(a)}${penalty}</div>`;
			});
		})()}
        ${itemsForDisplayP(c).map((it) => kcHtml`<div style="flex-basis:100%;width:100%;color:var(--item-ink);font-weight:600">${itemAcquiredTagP(it)}🔮 ${itemLoreTip(it, it.name)}${itemTierTagP(it)}${itemBoundTag(it, c)}${itemUsableBy(it, c) ? itemSlotTag(it, c) : ""}${it.desc ? kcHtml` <span style="color:var(--item-desc);font-weight:400">(${it.desc})</span>` : ""}</div>`)}
      </div>
      <div class="orders-char-body">
        ${SEASONS.map((season, ph) => {
			const locked = hiredPh >= 0 && ph <= hiredPh;
			const saved = (savedOrders[c.id] || [])[ph] || {};
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
              ${actionsFor(c).map((a) => kcHtml`<option value="${a}" ${saved.action === a ? "selected" : ""}>${a}</option>`)}
            </select>
            <div id="po-target-wrap-${c.id}-${ph}" style="position:relative">
              ${buildTargetField(c, ph, saved)}
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
            ${epOrdered.map((t, i) => epRowHtml(String(c.id), t, i, epOrdered.length))}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${ENCOUNTER_TACTICS.filter((t) => t.code !== "CS" && !t.retired).map((t) => {
			const noThief = t.code === "ST" && (c.skills?.thief || 0) < 1 && !skillsUnseenP(c);
			return kcHtml`<button onclick="addEncounterTactic(${kcArg(String(c.id))},${kcArg(String(t.code))})" ${noThief ? "disabled" : ""}
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
              ${DUEL_STANCES.map((d) => kcHtml`<option value="${d.code}"${(savedEP.duelStance || "refuse") === d.code ? " selected" : ""}>${d.label}</option>`)}
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
              <option value="terror" ${(savedEP.evilMode || "terror") === "terror" ? "selected" : ""}>Terror — plunder 50% of the province's tax; decisive wins spread Terror (−10% to the next defenders)</option>
              <option value="enslave" ${(savedEP.evilMode || "terror") === "enslave" ? "selected" : ""}>Enslave — no plunder; a free Green native garrison unit is pressed into service, but the province pays −1 tax for 3 turns (humanoid provinces only)</option>
            </select>
          </div>` : ""}

          <div style="margin-top:6px">
            <label style="font-size:.72rem">Describe your battlecry:</label>
            <input type="text" id="ep-notes-${c.id}" value="${savedEP.notes || ""}"
              placeholder="e.g. For glory and the fallen — none shall pass!"
              style="font-size:.8rem;margin-top:2px">
            <div style="font-size:.68rem;color:#2f281c;margin-top:2px">Shouted at any enemy — monster or rival — as combat begins.</div>
          </div>
        </div>

      </div>
    </div>`;
	})}`;
	renderDiplomacy(report);
	renderConcede();
	const _liveChars = chars.filter((c) => c.alive !== false);
	for (let pass = 0; pass < 2; pass++) for (let ph = 0; ph < SEASONS.length; ph++) _liveChars.forEach((c) => {
		const hiredPh = c.hiredInPhase ?? -1;
		if (hiredPh >= 0 && ph <= hiredPh) return;
		const wrap = document.getElementById(`po-target-wrap-${c.id}-${ph}`);
		if (!wrap) return;
		const saved = (savedOrders[c.id] || [])[ph] || {};
		const action = document.getElementById(`po-action-${c.id}-${ph}`)?.value || saved.action || "";
		if (!action) return;
		try {
			wrap.innerHTML = buildTargetField(c, ph, {
				...saved,
				action
			});
		} catch (e) {
			console.warn("target field rebuild failed", c.id, ph, e);
		}
	});
	if (typeof refreshExploreNotes === "function") refreshExploreNotes();
	if (typeof refreshAllMoveModeNotes === "function") refreshAllMoveModeNotes();
	setTimeout(refreshAllOncePerTurn, 0);
	{
		const _savedRes = {};
		Object.entries(savedOrders || {}).forEach(([k, v]) => {
			const m = String(k).match(/^resurrect_(\d+)_via_\d+_ph\d+$/);
			if (!m || !Array.isArray(v)) return;
			const ep = (savedEncounterPlans || {})[k] || {};
			_savedRes[m[1]] = {
				phases: v.map((o) => o || {}),
				tactics: (ep.tactics || []).join(","),
				notes: ep.notes || "",
				duel: ep.duelStance || ""
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
	chars.filter((c) => c.alive !== false).forEach((c) => renderPreSchool(c.id));
	const btn = document.getElementById("submit-btn");
	if (btn) {
		btn.disabled = false;
		btn.textContent = `Submit Orders for Turn ${turnNum || 1}`;
	}
}
function renderPreSchool(charId) {
	const disp = document.getElementById(`ep-preschool-display-${charId}`);
	const hidden = document.getElementById(`ep-preschool-${charId}`);
	if (!disp || !hidden) return;
	const school = (hidden.value || "").toLowerCase();
	if (school) disp.innerHTML = kcHtml`<span style="display:inline-flex;align-items:center;gap:6px;background:#fff8e8;border:1px solid #c8922a;border-radius:2px;padding:3px 8px;font-size:.78rem">
        <span style="color:#5a4208">Random <strong>${SKILL_LABELS[school] || school}</strong> spell</span>
        <button onclick="clearPreSchool(${kcArg(String(charId))})" title="Remove" style="background:var(--crimson);color:#fff;border:none;border-radius:2px;padding:0 6px;cursor:pointer;font-size:.7rem">✕</button>
      </span>
      <button onclick="openPreSchoolPicker(${kcArg(String(charId))})" style="font-size:.7rem;padding:3px 8px;border:1px solid var(--stone);background:var(--parchment-dark);cursor:pointer;border-radius:2px">Change</button>`;
	else disp.innerHTML = kcHtml`<button onclick="openPreSchoolPicker(${kcArg(String(charId))})" style="font-size:.72rem;padding:3px 10px;border:1px solid var(--stone);background:var(--parchment-dark);cursor:pointer;border-radius:2px">+ Choose spell school</button>
      <span style="font-size:.72rem;color:#aaa">None set</span>`;
}
function openPreSchoolPicker(charId) {
	const char = (currentReport?.characters || []).find((c) => String(c.id) === String(charId));
	const skills = char?.skills || {};
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
	for (let prevPh = 0; prevPh < 5; prevPh++) if ((document.getElementById(`po-action-${charId}-${prevPh}`)?.value || "") === "Practice Skill") {
		const prevTarget = getOrderTarget(charId, prevPh);
		if (prevTarget && MAGIC_SCHOOLS_CS.has(prevTarget)) practisingCS.add(prevTarget);
	}
	const _csUnknown = skillsUnseenP(char);
	const options = BATTLE_SCHOOLS.map(([key, label]) => {
		const lvl = skills[key] || 0;
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
	const disp = document.getElementById(`ep-preschool-display-${charId}`);
	if (!disp) return;
	const existingS = document.getElementById(`ep-school-picker-${charId}`);
	if (existingS) existingS.remove();
	const spicker = document.createElement("div");
	spicker.id = `ep-school-picker-${charId}`;
	spicker.style.cssText = "background:#fff8e8;border:1px solid #c8922a;border-radius:3px;padding:8px 10px;margin:4px 0;flex-basis:100%";
	spicker.innerHTML = kcHtml`<div style="font-family:Cinzel,serif;font-size:.7rem;color:#5a4208;margin-bottom:6px">Choose a school — a random battle spell from it is cast in the pre-battle magic phase:${_csUnknown ? kcHtml`<div style="font-weight:normal;font-family:serif;color:var(--stone);font-size:.68rem;margin-top:3px">All four are offered — ${char && char.name || "this hero"}’s training is not known to you, and a school they never learned yields no spell.</div>` : ""}</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px">
      ${options.map((o) => kcHtml`<button onclick="confirmEPSchool(${kcArg(String(charId))},${kcArg(String(o.key))})"
          style="font-size:.75rem;padding:4px 9px;border:1px solid ${o.practising ? "#c8922a" : "var(--stone)"};background:${o.practising ? "#fffbef" : "#fdf8ee"};cursor:pointer;border-radius:2px">
          ${o.label}${o.lvl == null && !o.practising ? "" : kcHtml` <span style="color:var(--stone);font-size:.63rem">(${o.practising ? "practising" : "Lv " + o.lvl})</span>`}
        </button>`)}
      <button onclick="document.getElementById(${kcArg(`ep-school-picker-${charId}`)}).remove()"
        style="font-size:.75rem;padding:4px 9px;border:1px solid var(--stone);background:#f0e8d8;cursor:pointer;border-radius:2px;color:var(--stone)">Cancel</button>
    </div>`;
	disp.after(spicker);
}
function clearPreSchool(charId) {
	const hidden = document.getElementById(`ep-preschool-${charId}`);
	if (hidden) hidden.value = "";
	const picker = document.getElementById(`ep-school-picker-${charId}`);
	if (picker) picker.remove();
	renderPreSchool(charId);
}
function addEncounterTactic(charId, code) {
	const hidden = document.getElementById(`ep-tactics-${charId}`);
	if (!hidden) return;
	const current = hidden.value ? hidden.value.split(",").filter(Boolean) : [];
	if (current.length >= 6) {
		alert("Maximum 6 tactics per encounter plan.");
		return;
	}
	if (code === "CA") {
		const char = (currentReport?.characters || []).find((c) => String(c.id) === String(charId));
		char?.skills;
		const ENCOUNTER_VALID = {
			white: ["Holy Symbol", "Spiritwrack"],
			psychic: [
				"Psychic Blast",
				"Telekinetic Storm",
				"Charm"
			],
			illusory: ["Mirror Image", "Invisibility"],
			elemental: ["Lightning Bolt", "Fireball"],
			necromancy: [
				"Curse",
				"Hand of Death",
				"Control Undead"
			]
		};
		const MAGIC_SCHOOLS_EP = new Set(KC_MAGIC_SCHOOLS);
		const practisingSchoolsEP = /* @__PURE__ */ new Set();
		for (let prevPh = 0; prevPh < 5; prevPh++) if ((document.getElementById(`po-action-${charId}-${prevPh}`)?.value || "") === "Practice Skill") {
			const prevTarget = getOrderTarget(charId, prevPh);
			if (prevTarget && MAGIC_SCHOOLS_EP.has(prevTarget)) practisingSchoolsEP.add(prevTarget);
		}
		const existingTactics = (document.getElementById(`ep-tactics-${charId}`)?.value || "").split(",").filter(Boolean);
		const epSchoolCount = {};
		const epSpellsUsed = /* @__PURE__ */ new Set();
		existingTactics.forEach((t) => {
			if (!t.startsWith("CA:")) return;
			const spellName = t.slice(3);
			epSpellsUsed.add(spellName);
			const school = SPELL_TO_SCHOOL[spellName];
			if (school) epSchoolCount[school] = (epSchoolCount[school] || 0) + 1;
		});
		const _epUnknown = skillsUnseenP(char);
		const availSpells = _epUnknown ? Object.entries(ENCOUNTER_VALID).flatMap(([school, spells]) => spells.map((s) => {
			const limit = combatSpellsAllowedPerSchoolEachFight(1);
			const used = epSchoolCount[school] || 0;
			const isDuplicate = epSpellsUsed.has(s);
			const atSchoolLimit = used >= limit;
			return {
				school,
				spell: s,
				level: null,
				practising: false,
				blocked: isDuplicate || atSchoolLimit,
				reason: isDuplicate ? "already in plan" : atSchoolLimit ? `school limit ${used}/${limit}` : "",
				used,
				limit
			};
		})) : Object.entries(ENCOUNTER_VALID).filter(([school]) => effMagicLvl(char, school) >= 1 || practisingSchoolsEP.has(school)).flatMap(([school, spells]) => spells.map((s) => {
			const lvl = effMagicLvl(char, school);
			const practisingThis = practisingSchoolsEP.has(school);
			const practising = practisingThis && lvl === 0;
			const limit = combatSpellsAllowedPerSchoolEachFight(practisingThis ? Math.min(5, lvl + 1) : lvl);
			const used = epSchoolCount[school] || 0;
			const isDuplicate = epSpellsUsed.has(s);
			const atSchoolLimit = used >= limit;
			return {
				school,
				spell: s,
				level: lvl,
				practising,
				blocked: isDuplicate || atSchoolLimit,
				reason: isDuplicate ? "already in plan" : atSchoolLimit ? `school limit ${used}/${limit}` : "",
				used,
				limit
			};
		}));
		if (availSpells.length === 0) {
			alert("This character has no magic skills and cannot cast spells in encounters.\n\nTip: if you set a Practice Skill order for a magic school earlier in your orders, those spells will become available here.");
			return;
		}
		const _epUnknownNote = _epUnknown ? kcHtml`<div style="font-size:.68rem;color:var(--stone);margin-top:6px">Every school is offered — ${char && char.name || "this hero"}’s training is not known to you, and a spell from a school they never learned simply fails when the encounter comes.</div>` : "";
		const wrap = document.getElementById(`ep-list-${charId}`);
		if (!wrap) return;
		const existing = document.getElementById(`ep-spell-picker-${charId}`);
		if (existing) existing.remove();
		const picker = document.createElement("div");
		picker.id = `ep-spell-picker-${charId}`;
		picker.style.cssText = "background:#fff8e8;border:1px solid #c8922a;border-radius:3px;padding:8px 10px;margin:4px 0";
		const _epTally = {};
		availSpells.forEach((x) => {
			if (!_epTally[x.school]) _epTally[x.school] = {
				limit: x.limit,
				used: x.used
			};
		});
		picker.innerHTML = kcHtml`<div style="font-family:Cinzel,serif;font-size:.7rem;color:#5a4208;margin-bottom:4px">Choose a combat spell — casts used this encounter, per school:</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:7px">${kcJoinP(Object.entries(_epTally).map(([sch, t]) => {
			const full = t.used >= t.limit;
			return kcHtml`<span style="font-size:.62rem;padding:1px 6px;border-radius:2px;background:${full ? "#f2dede" : "#e8f0e0"};color:${full ? "#a33" : "#3a5a2a"};border:1px solid ${full ? "#d8a0a0" : "#b8c9a8"}">${SKILL_LABELS[sch] || sch} ${t.used}/${t.limit}${full ? " — full" : ""}</span>`;
		}), " ")}</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">
        ${availSpells.map(({ school, spell, level, practising, blocked, reason, used, limit }) => {
			const limitNote = ` ${used}/${limit}`;
			const labelExtra = practising ? kcHtml`<span style="color:#5a3f08;font-size:.63rem">(${SKILL_LABELS[school] || school} — practising${limitNote})</span>` : kcHtml`<span style="color:${blocked ? "#bbb" : "var(--stone)"};font-size:.63rem">(${SKILL_LABELS[school] || school}${level == null ? "" : " " + level}${limitNote})</span>`;
			const blockedNote = blocked ? kcHtml`<span style="color:#c44;font-size:.6rem"> ✗ ${reason}</span>` : "";
			return blocked ? kcHtml`<button disabled style="font-size:.75rem;padding:4px 9px;border:1px solid #ddd;background:#f5f5f5;color:#bbb;border-radius:2px;cursor:not-allowed">
                ${spell} ${labelExtra}${blockedNote}
              </button>` : kcHtml`<button onclick="confirmEPSpell(${kcArg(String(charId))},${kcArg(String(spell))},${kcArg(String(school))},${kcArg(level)},${kcArg(limit)})" 
                style="font-size:.75rem;padding:4px 9px;border:1px solid ${practising ? "#c8922a" : "var(--stone)"};background:${practising ? "#fffbef" : "#fdf8ee"};cursor:pointer;border-radius:2px">
                ${spell} ${labelExtra}
              </button>`;
		})}
        <button onclick="document.getElementById(${kcArg(`ep-spell-picker-${charId}`)}).remove()" 
          style="font-size:.75rem;padding:4px 9px;border:1px solid var(--stone);background:#f0e8d8;cursor:pointer;border-radius:2px;color:var(--stone)">
          Cancel
        </button>
      </div>
      ${practisingSchoolsEP.size > 0 ? kcHtml`<div style="font-size:.68rem;color:#5a3f08;margin-top:6px">⚠ Spells marked "practising, may unlock" are only available if your practice order succeeds this turn.</div>` : ""}${_epUnknownNote}`;
		wrap.after(picker);
		return;
	}
	if (code === "ST") {
		const char = (currentReport?.characters || []).find((c) => String(c.id) === String(charId));
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
	const picker = document.getElementById(`ep-spell-picker-${charId}`);
	if (picker) picker.remove();
	const hidden = document.getElementById(`ep-tactics-${charId}`);
	if (!hidden) return;
	const current = hidden.value ? hidden.value.split(",").filter(Boolean) : [];
	if (current.length >= 6) {
		alert("Maximum 6 tactics in an encounter plan.");
		return;
	}
	if (current.includes(`CA:${spell}`)) {
		alert(`${spell} is already in your encounter plan. The same combat spell cannot be cast more than once per encounter.`);
		return;
	}
	const limit = limitShown != null && isFinite(limitShown) ? limitShown : combatSpellsAllowedPerSchoolEachFight(level);
	if (current.filter((t) => t.startsWith("CA:") && SPELL_TO_SCHOOL[t.slice(3)] === school).length >= limit) {
		alert(`${SKILL_LABELS[school] || school}${level > 0 ? ` Lv${level}` : ""}: you can cast at most ${limit} combat spell${limit !== 1 ? "s" : ""} of this school per encounter. Remove one first.`);
		return;
	}
	current.push(`CA:${spell}`);
	hidden.value = current.join(",");
	refreshEncounterPlan(charId, current);
}
function confirmEPSchool(charId, school) {
	const picker = document.getElementById(`ep-school-picker-${charId}`);
	if (picker) picker.remove();
	const hidden = document.getElementById(`ep-preschool-${charId}`);
	if (!hidden) return;
	hidden.value = school;
	renderPreSchool(charId);
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
function epMoveTactic(charId, idx, dir) {
	const hidden = document.getElementById(`ep-tactics-${charId}`);
	if (!hidden) return;
	const tactics = hidden.value ? hidden.value.split(",").filter(Boolean) : [];
	const j = idx + dir;
	if (idx < 0 || idx >= tactics.length || j < 0 || j >= tactics.length) return;
	[tactics[idx], tactics[j]] = [tactics[j], tactics[idx]];
	hidden.value = tactics.join(",");
	refreshEncounterPlan(charId, tactics);
}
function epDragStart(event, charId, fromIdx) {
	event.dataTransfer.setData("text/plain", JSON.stringify({
		charId: String(charId),
		fromIdx
	}));
	event.dataTransfer.effectAllowed = "move";
}
function epDropTactic(event, charId, toIdx) {
	event.preventDefault();
	let data;
	try {
		data = JSON.parse(event.dataTransfer.getData("text/plain"));
	} catch (e) {
		return;
	}
	if (String(data.charId) !== String(charId)) return;
	const fromIdx = data.fromIdx;
	const hidden = document.getElementById(`ep-tactics-${charId}`);
	if (!hidden) return;
	const tactics = hidden.value ? hidden.value.split(",").filter(Boolean) : [];
	if (fromIdx < 0 || fromIdx >= tactics.length) return;
	if (toIdx === void 0) toIdx = tactics.length - 1;
	if (fromIdx === toIdx) return;
	const moved = tactics.splice(fromIdx, 1)[0];
	tactics.splice(Math.min(toIdx, tactics.length), 0, moved);
	hidden.value = tactics.join(",");
	refreshEncounterPlan(charId, tactics);
}
function removeEncounterTactic(charId, idx) {
	const hidden = document.getElementById(`ep-tactics-${charId}`);
	if (!hidden) return;
	const current = hidden.value ? hidden.value.split(",").filter(Boolean) : [];
	current.splice(idx, 1);
	hidden.value = current.join(",");
	refreshEncounterPlan(charId, current);
}
function tacticLabel(code) {
	if (code.startsWith("CA:")) return `Cast Spell — ${code.slice(3)}`;
	if (code.startsWith("CS:")) {
		const school = code.slice(3);
		return `Pre-battle: random ${SKILL_LABELS[school] || school} spell`;
	}
	const baseCode = code.split(":")[0];
	return ENCOUNTER_TACTICS.find((et) => et.code === baseCode)?.label || code;
}
function refreshEncounterPlan(charId, tactics) {
	const list = document.getElementById(`ep-list-${charId}`);
	if (!list) return;
	list.innerHTML = kcHtml`${tactics.map((t, i) => epRowHtml(String(charId), t, i, tactics.length))}`;
}
function onSpellChange(charId, ph, selectedSpell) {
	setTimeout(() => syncResurrectCard(charId, ph), 0);
	const wrap = document.getElementById(`po-target-wrap-${charId}-${ph}`);
	if (!wrap) return;
	const char = (currentReport?.characters || []).find((c) => String(c.id) === String(charId)) || {};
	const liveAction = document.getElementById(`po-action-${charId}-${ph}`)?.value || "Cast Spell";
	wrap.innerHTML = buildTargetField(char, ph, {
		action: liveAction === "Use Item" ? "Use Item" : "Cast Spell",
		target: selectedSpell
	});
	if (liveAction === "Cast Spell") refreshLaterCastSpells(charId, ph);
}
//#endregion
//#region src/ui/player/briefing-and-submit.ts
function updateAlignmentDesc() {
	const sel = document.getElementById("join-alignment");
	const desc = document.getElementById("join-alignment-desc");
	if (!sel || !desc) return;
	desc.innerHTML = bulletizeDesc({
		Divine: "✨ **Divine:** The holy crown. Best battle fervour in the game (50% chance your host fights fanatically). Your king may **Consecrate** provinces: +50% tax and much stiffer defence. A fallen character returns to life one turn later on consecrated ground — no other realm can do that. Heroes heal twice as fast resting. Will not hire Undead heroes, and dark ones cost extra. One Divine realm per game.",
		Good: "⚔ **Good:** The steady defender. 40% fervour, +10% strength defending land you own, and better odds that your armies join up for a combined attack. **Call to Arms** gives the king a free garrison unit in one of your provinces every turn. Heroes of most alignments are cheap to hire. A forgiving choice.",
		Druidic: "🌿 **Druidic:** The wild crown. Your king starts with Druid +1, and every character leads **Creature** armies (thunderbirds, ents, bears, giants, unicorns, mammoths, rocs, whales and great turtles) with no Druid penalty, and every level of Druid they do hold makes those beasts stronger; a hero leads at most as many beasts as his Druid level. Creature armies fight at ×1.5 in forest and jungle.",
		Neutral: "⚖ **Neutral:** The merchant crown, and the easiest to learn. **+20% tax from every province**, the cheapest heroes in the world (2–3g whatever their alignment), and Sage discoveries come twice as often. **Broker** lets the king hire a distant wandering hero, or buy a spy report on anywhere you have seen, without leaving home.",
		Pagan: "🔥 **Pagan:** The old gods, for a price. King starts with Explorer +1. At a discovered ritual site you may **Perform Rite**: the **Wild Hunt** binds that province's beasts to your host — the only way to field Creatures or Monsters with no Druid magic — or a **Blood Offering** sacrifices units to make an equal number far better. You also earn +1g for every enemy unit you destroy in a victory.",
		Evil: "💀 **Evil:** The tyrant. Your king starts with Druid +1, and every character leads **Monster** armies (trolls, basilisks, manticores, dragons, krakens) with no Druid penalty, at most as many as his Druid level; a Monster in the host lifts the whole host to ×1.25 in every battle. A crushing win leaves the enemy in Terror (−10% in their next fight), and your Monsters fight ×1.5 attacking ground your Terror grips (**Reign of Fear**). Each conquest is either **looted** for half the province's tax value in gold, or **enslaved** for a free garrison unit at the cost of its tax for three turns — your choice, character by character.",
		Undead: "💀 **Undead:** The deathless. King starts with Necromancy +1 and a free skeletal unit. Skeletal armies cost just 1g, need no Druid skill, **always** fight fanatically (+50% under the king, +30% under a hero), and never lose men fleeing a lost battle. **Harvest the Field** raises a grave as a soldier for 2g with no magic at all. Will not hire Divine heroes. One Undead realm per game."
	}[sel.value] || "");
}
function unitAbilityText(type) {
	return UNIT_ABILITIES[type] || "";
}
function itemLoreTip(it, inner) {
	return inner;
}
function itemAcquiredTagP(it) {
	if (!it || !it.acquiredThisTurn) return "";
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
	if (!sel || !desc) return;
	desc.innerHTML = bulletizeDesc({
		Human: "🛡 **Human:** The all-rounders — the widest choice of troops (Levies and sturdy Men-at-Arms, Longbows, the best horse in the game) and the strongest navy (the Galleons). Their units also **learn twice as fast**, so a Human army improves quickly with drilling and battle. No terrain is closed to them. Feud with Orcs. The easiest race to play.",
		Elven: "🏹 **Elven:** Archers and woodsmen. Elven troops fight at **×1.5 in forest and jungle**, and an Elven unit that would be destroyed often slips away home instead of dying. Swift Eagle Riders scout and strike, and Stag Riders are the one cavalry at home among the trees. Weakest in the open. Feud with Dwarves.",
		Dwarven: "⛏ **Dwarven:** The anvil. Dwarven troops fight at **×1.5 whenever they defend**, and every Dwarven character of a Dwarven realm wears **Mithril Armour** — 2 less damage from every blow and arrow they take. Mountain Guns and armoured Ironclads hit very hard, and Ironhoof Rams are the one cavalry sure-footed in the mountains. Slow to march. Feud with Elves.",
		Orcish: "⚔ **Orcish:** The horde. Cheap, fast troops you can afford in numbers — Goblin Hordes (two a turn), Black Arrows, Warg Riders, Berserkers and flying Wyvern Riders. Orcish characters start with **18 HP instead of 15** and harden faster. Quality is poor; you win by numbers and speed. Feud with Humans."
	}[sel.value] || "");
}
function updateTemperDesc() {
	const sel = document.getElementById("join-temper");
	const desc = document.getElementById("join-temper-desc");
	if (!sel || !desc) return;
	desc.innerHTML = bulletizeDesc({
		Berserk: "🔥 **Berserk:** The hammer. +18% to hit and +3 damage in melee — far the hardest hitter — and shrugs off 12% of every blow and arrow. But enemies hit them 10% more easily, and they fight on until nearly dead. The most likely of all to be killed.",
		Brave: "🦁 **Brave:** The soldier. Good at everything (+12% melee, +8% archery, +1 damage) and, once per fight, **Second Wind**: when first badly wounded they recover about a quarter of their health. No weakness. The safe default.",
		Cautious: "🧭 **Cautious:** The survivor. Enemies are 14% less likely to hit them (and can never beat 66% however skilled), every melee blow that does land does 2 less damage, and a missed attack draws a **40% riposte**. No attack bonus — they win by outlasting. The hardest king to kill.",
		Cowardly: "🏃 **Cowardly:** The archer and the spy. +22% archery, +15% to Steal, best in the game at breaking off and fleeing, and if struck down they may beg for mercy and be spared. Poor with a blade. The sensible choice for a king you cannot afford to lose."
	}[sel.value] || "");
}
function normalSubmitWrapHtml(verb) {
	const turn = currentReport?._liveTurn || currentReport?.turn || 1;
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
	w.innerHTML = normalSubmitWrapHtml(verb);
	w.style.display = "flex";
	w.style.gap = "8px";
}
function cancelSubmit() {
	document.getElementById("orders-msg").innerHTML = "";
	restoreSubmitWrap("Submit");
}
async function doSaveOrders() {
	const chars = currentReport?.characters || [];
	const orders = {};
	const encounterPlans = {};
	chars.forEach((c) => {
		orders[c.id] = SEASONS.map((_, ph) => {
			const action = document.getElementById(`po-action-${c.id}-${ph}`)?.value || "";
			const target = getOrderTarget(c.id, ph);
			return {
				action,
				target,
				extra: getOrderExtra(c.id, ph),
				desc: action + (target ? " — " + target : "")
			};
		});
		const tacHidden = document.getElementById(`ep-tactics-${c.id}`);
		const notesEl = document.getElementById(`ep-notes-${c.id}`);
		const preSchool = (document.getElementById(`ep-preschool-${c.id}`)?.value || "").toLowerCase();
		if (tacHidden) {
			const tacts = (tacHidden.value || "ME").split(",").filter(Boolean);
			if (preSchool) tacts.push(`CS:${preSchool}`);
			encounterPlans[c.id] = {
				tactics: tacts,
				notes: notesEl?.value || "",
				duelStance: document.getElementById(`ep-duel-${c.id}`)?.value || "refuse",
				evilMode: document.getElementById(`ep-evilmode-${c.id}`)?.value || void 0
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
			skills: c.skills || {},
			pending: c._pendingSkillAllocation || 0,
			name: c.name || "",
			temper: c.temper || "",
			base: c._heirBase || c.skills || {}
		};
	});
	const _draftTurn = currentReport?._liveTurn || currentReport?.turn || 1;
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
	const { error: saveErr } = await sb.from("game_players").update({
		orders: _payload,
		orders_submitted: false
	}).eq("id", gp.id);
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
async function reviseOrders() {
	const gp = currentGamePlayer;
	if (!gp) return;
	const { error } = await sb.from("game_players").update({ orders_submitted: false }).eq("id", gp.id);
	if (error) {
		console.error(error);
		return;
	}
	setOrdersSubmittedUI(false);
	buildOrdersForm(currentReport?.characters || [], false, gp.orders, currentReport?.turn || 1);
	document.getElementById("orders-msg").innerHTML = "<div class=\"msg-warning\">✏ Revising orders — your previous orders are pre-filled. Make changes and resubmit.</div>";
	document.getElementById("submit-btn").disabled = false;
	document.getElementById("submit-btn").textContent = `Resubmit Orders for Turn ${currentReport?._liveTurn || currentReport?.turn || 1}`;
}
async function doSubmitOrders() {
	const chars = currentReport?.characters || [];
	const btn = document.getElementById("submit-btn");
	if (btn) {
		btn.disabled = true;
		btn.textContent = "Saving…";
	}
	const { data: freshGame } = await sb.from("games").select("turn").eq("id", currentGamePlayer?.game_id).single();
	const expectedTurn = currentReport?._liveTurn || currentReport?.turn || 1;
	if (freshGame && freshGame.turn !== expectedTurn) {
		document.getElementById("orders-msg").innerHTML = kcHtml`<div class="msg-error">⚠ The GM has already resolved this turn. Your orders were not saved — please reload the page to see your new turn report.</div>`;
		restoreSubmitWrap("Submit");
		return;
	}
	if (!currentGamePlayer?.id) {
		document.getElementById("orders-msg").innerHTML = "<div class=\"msg-error\">Session error — please reload the page.</div>";
		restoreSubmitWrap("Submit");
		return;
	}
	const orders = {};
	const encounterPlans = {};
	chars.forEach((c) => {
		orders[c.id] = SEASONS.map((_, ph) => {
			const action = document.getElementById(`po-action-${c.id}-${ph}`)?.value || "Defend";
			const target = getOrderTarget(c.id, ph);
			const extra = getOrderExtra(c.id, ph);
			const _spyName = action === "Spy" && String(target || "").startsWith("char:") ? ((currentReport || {}).visibleChars || []).find((x) => String(x.id) === String(target).slice(5))?.name || null : null;
			const desc = action + (target && action !== "Move" && action !== "Defend" && action !== "Rest" && action !== "Spy" && action !== "Explore" ? ` — ${target}` : "") + (_spyName ? ` — on ${_spyName}` : "");
			if (action === "Search Lair" || action === "Search Feature") {
				const _pl = predictedLocation(c.id, ph);
				if (_pl && _pl.id != null) return {
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
		const tacHidden = document.getElementById(`ep-tactics-${c.id}`);
		const notesEl = document.getElementById(`ep-notes-${c.id}`);
		const preSchool = (document.getElementById(`ep-preschool-${c.id}`)?.value || "").toLowerCase();
		if (tacHidden) {
			const tacts = (tacHidden.value || "ME").split(",").filter(Boolean);
			if (preSchool) tacts.push(`CS:${preSchool}`);
			encounterPlans[c.id] = {
				tactics: tacts,
				notes: notesEl?.value || "",
				duelStance: document.getElementById(`ep-duel-${c.id}`)?.value || "refuse",
				evilMode: document.getElementById(`ep-evilmode-${c.id}`)?.value || void 0
			};
		}
	});
	document.querySelectorAll("[id^=\"hired-hero-orders-\"]").forEach((card) => {
		const sel = card.querySelector("select[id^=\"po-action-hired_\"]");
		if (!sel) return;
		const cid = sel.id.replace(/^po-action-/, "").replace(/-\d+$/, "");
		orders[cid] = SEASONS.map((_, ph) => ({
			action: document.getElementById(`po-action-${cid}-${ph}`)?.value || "Defend",
			target: getOrderTarget(cid, ph),
			extra: getOrderExtra(cid, ph),
			desc: ""
		}));
		const hTac = document.getElementById(`ep-tactics-${cid}`);
		if (hTac) {
			const hTacts = (hTac.value || "ME").split(",").filter(Boolean);
			const hPre = (document.getElementById(`ep-preschool-${cid}`)?.value || "").toLowerCase();
			if (hPre) hTacts.push(`CS:${hPre}`);
			encounterPlans[cid] = {
				tactics: hTacts,
				notes: document.getElementById(`ep-notes-${cid}`)?.value || "",
				duelStance: document.getElementById(`ep-duel-${cid}`)?.value || "refuse",
				evilMode: document.getElementById(`ep-evilmode-${cid}`)?.value || void 0
			};
		}
	});
	document.querySelectorAll("[id^=\"resurrect-orders-\"]").forEach((card) => {
		const sel = card.querySelector("select[id^=\"po-action-resurrect_\"]");
		if (!sel) return;
		const rid = sel.id.replace(/^po-action-/, "").replace(/-\d+$/, "");
		orders[rid] = SEASONS.map((_, ph) => ({
			action: document.getElementById(`po-action-${rid}-${ph}`)?.value || "Defend",
			target: getOrderTarget(rid, ph),
			extra: getOrderExtra(rid, ph),
			desc: ""
		}));
		const rTac = document.getElementById(`ep-tactics-${rid}`);
		if (rTac) encounterPlans[rid] = {
			tactics: (rTac.value || "ME").split(",").filter(Boolean),
			notes: document.getElementById(`ep-notes-${rid}`)?.value || "",
			duelStance: document.getElementById(`ep-duel-${rid}`)?.value || "refuse"
		};
	});
	document.querySelectorAll("[id^=\"charm-orders-\"]").forEach((card) => {
		const sel = card.querySelector("select[id^=\"po-action-charm_\"]");
		if (!sel) return;
		const cid = sel.id.replace(/^po-action-/, "").replace(/-\d+$/, "");
		orders[cid] = SEASONS.map((_, ph) => ({
			action: document.getElementById(`po-action-${cid}-${ph}`)?.value || "Defend",
			target: getOrderTarget(cid, ph),
			extra: getOrderExtra(cid, ph),
			desc: ""
		}));
		const cTac = document.getElementById(`ep-tactics-${cid}`);
		if (cTac) encounterPlans[cid] = {
			tactics: (cTac.value || "ME").split(",").filter(Boolean),
			notes: document.getElementById(`ep-notes-${cid}`)?.value || "",
			duelStance: document.getElementById(`ep-duel-${cid}`)?.value || "refuse"
		};
	});
	const kingSkills = {};
	chars.forEach((c) => {
		if (c._isHeir) kingSkills[c.id] = {
			skills: c.skills || {},
			pending: c._pendingSkillAllocation || 0,
			name: c.name || "",
			temper: c.temper || "",
			base: c._heirBase || c.skills || {}
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
	const { error } = await sb.from("game_players").update({
		orders: _subPayload,
		orders_submitted: true,
		last_submitted_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", currentGamePlayer.id);
	if (error) {
		document.getElementById("orders-msg").innerHTML = kcHtml`<div class="msg-error">Error: ${error.message}</div>`;
		restoreSubmitWrap("Submit");
		return;
	}
	if (currentGamePlayer) currentGamePlayer.orders = _subPayload;
	document.getElementById("orders-msg").innerHTML = "";
	document.getElementById("orders-submit-wrap").innerHTML = kcHtml`
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;width:100%">
      <span style="color:var(--forest);font-size:.85rem;flex:1">✓ Orders submitted successfully! The GM will be notified.</span>
      <button class="btn btn-ghost" style="padding:8px 16px;font-size:.8rem" onclick="resubmitOrders()">↺ Resubmit Orders</button>
    </div>`;
	setOrdersSubmittedUI(true);
	setMobileView("report");
}
function effSkillP(c, k) {
	const e = c && c.skillEff && c.skillEff[k];
	if (e && typeof e.total === "number") return e.total;
	return (c && c.skills || {})[k] || 0;
}
//#endregion
//#region src/ui/player/skills-and-projections.ts
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
function _bonusKindP(k) {
	return BONUS_KIND_P[k] || {
		c: "#555",
		bg: "#eeeeee",
		label: "Other"
	};
}
var _kindFallbackP = (delta, pos) => (delta || 0) < 0 ? "curse" : pos;
function _skillSourcesP(c, k) {
	const e = c && c.skillEff && c.skillEff[k] || null;
	const out = [];
	if (e && Array.isArray(e.sources)) e.sources.forEach((x) => out.push({
		label: x.label,
		delta: x.delta,
		kind: x.kind || _kindFallbackP(x.delta, "item"),
		scope: "always"
	}));
	((c && (c.skillExtra || c.combatSkillBonus) || {})[k] || []).forEach((x) => out.push({
		label: x.label,
		delta: x.delta,
		kind: x.kind || _kindFallbackP(x.delta, "title"),
		scope: x.scope || "combat"
	}));
	return out;
}
function skillRowHTML(c, style) {
	const eff = c && c.skillEff, raw = c && c.skills || {};
	const extra = c && (c.skillExtra || c.combatSkillBonus) || {};
	const keys = eff ? Object.keys(eff) : Object.keys(raw).filter((k) => (raw[k] || 0) > 0);
	Object.keys(extra).forEach((k) => {
		if (!keys.includes(k)) keys.push(k);
	});
	const legendKinds = /* @__PURE__ */ new Set();
	const detail = [];
	const rows = keys.map((k) => {
		const e = eff ? eff[k] : null;
		const base = e ? e.base : raw[k] || 0;
		const bonus = e ? e.bonus || 0 : 0;
		const srcs = _skillSourcesP(c, k);
		const cb = srcs.filter((s) => s.scope !== "always").reduce((sm, x) => sm + (x.delta || 0), 0);
		if (base <= 0 && bonus <= 0 && cb <= 0) return "";
		const label = SKILL_LABELS[k] || k;
		const always = srcs.filter((s) => s.scope === "always");
		const rawTotal = always.reduce((s, x) => s + (x.delta || 0), 0);
		const chips = [];
		if (always.length && bonus !== 0) {
			const byKind = {};
			const order = [];
			always.forEach((s) => {
				if (byKind[s.kind] === void 0) {
					byKind[s.kind] = 0;
					order.push(s.kind);
				}
				byKind[s.kind] += s.delta || 0;
			});
			const posRaw = order.filter((x) => byKind[x] > 0).reduce((s, x) => s + byKind[x], 0);
			const neg = order.filter((x) => byKind[x] < 0).reduce((s, x) => s + byKind[x], 0);
			const posShown = Math.max(0, bonus - neg);
			let left = posShown;
			order.forEach((kind) => {
				const v = byKind[kind];
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
			if (!scoped[s.scope]) {
				scoped[s.scope] = {};
				scOrder.push(s.scope);
			}
			scoped[s.scope][s.kind] = (scoped[s.scope][s.kind] || 0) + (s.delta || 0);
		});
		scOrder.forEach((sc) => Object.keys(scoped[sc]).forEach((kind) => {
			const v = scoped[sc][kind];
			if (!v) return;
			const st = _bonusKindP(kind);
			legendKinds.add(kind);
			chips.push(kcHtml`<span style="color:${st.c};font-weight:600">(${v > 0 ? "+" : ""}${v}${BONUS_SCOPE_MARK_P[sc] || ""})</span>`);
		}));
		if (srcs.length) {
			const bits = srcs.map((s) => {
				const st = _bonusKindP(s.kind);
				return kcHtml`<span style="background:${st.bg};color:${st.c};border-radius:2px;padding:0 4px;white-space:nowrap">${s.delta > 0 ? "+" : ""}${s.delta} ${s.label}${s.scope !== "always" ? ` ${BONUS_SCOPE_MARK_P[s.scope] || ""}` : ""}</span>`;
			});
			if (rawTotal > 0 && bonus < rawTotal) bits.push(kcHtml`<span style="color:#3a3224">(capped at ${ITEM_UNCAPPED_SKILLS_P.has(k) || k === "druid" ? 9 : 5})</span>`);
			detail.push(kcHtml`<span style="white-space:normal"><strong style="color:#231e16">${label}</strong> ${kcJoinP(bits, " ")}</span>`);
		}
		const _ceil = ITEM_UNCAPPED_SKILLS_P.has(k) || k === "druid" ? 9 : 5;
		const parts = srcs.map((s) => `${s.delta > 0 ? "+" : ""}${s.delta} ${s.label}${s.scope !== "always" ? ` (${BONUS_SCOPE_TEXT_P[s.scope] || ""})` : ""}`);
		if (rawTotal > 0 && bonus < rawTotal) parts.push("capped at " + _ceil);
		const tip = parts.length ? kcHtml` title="${label + " " + base + " — " + parts.join(", ")}"` : "";
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
	return s ? s[0].toUpperCase() + s.slice(1) : "";
}
var HUMANOID_RACES_UI = new Set(KC_HUMANOID_RACES);
var CREATURE_ARMIES_UI = new Set(KC_UNIT_CLASS.creature);
var MONSTER_ARMIES_UI = new Set(KC_UNIT_CLASS.monster);
function druidNeedP(a, c, report) {
	const rep = report || currentReport || {};
	if (!a || a.skeletal || a._isSkeletal) return {
		req: 0,
		effDru: 0,
		shortfall: 0,
		counts: false
	};
	const realmAlign = rep.kingdom && rep.kingdom.alignment || null;
	const tamed = TAMED_FLYER_TYPES_D.has(a.type) && (rep.discoveries || []).some((d) => d && d.id === "sd40");
	const req = druidLevelALeaderNeeds(a.type, realmAlign, c && c.alignment, tamed);
	const druLevel = effSkillP(c, "druid");
	const sameRace = !!(a.race && c && a.race === c.race);
	const effDru = druidALeaderBringsToAUnit(druLevel, sameRace);
	return {
		req,
		effDru,
		shortfall: druidShortfall(req, effDru),
		counts: req > 0 && !(sameRace && req <= 1)
	};
}
var PRIMAL_SUBRACE_CLASS = {
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
		if (sub) return PRIMAL_SUBRACE_CLASS[sub] || "Creature";
		if (unitType) return MONSTER_ARMIES_UI.has(unitType) ? "Monster" : "Creature";
		return "Creature";
	}
	return race;
}
var PRIMAL_ARMY_SPEEDS = Object.fromEntries(Object.entries(PRIMAL_ARMY_DEFS_P).map(([t, d]) => [t, d.speed]));
function heroHireWageOfP(h, report) {
	if (h && Object.prototype.hasOwnProperty.call(h, "hireWage")) return h.hireWage;
	return heroHireWage(((report || currentReport || {}).kingdom || {}).alignment || "Neutral", h && h.alignment);
}
function predictedItems(charId, upToPhaseExclusive) {
	const report = currentReport;
	if (!report) return [];
	const cid = String(charId);
	const items = /* @__PURE__ */ new Map();
	const byKey = /* @__PURE__ */ new Map();
	(report.characters || []).forEach((x) => {
		items.set(String(x.id), [...x.items || []]);
		byKey.set(String(x.id), x);
	});
	for (let p = 0; p < upToPhaseExclusive; p++) (report.characters || []).forEach((x) => {
		const action = document.getElementById(`po-action-${x.id}-${p}`)?.value || "";
		if (action !== "Send Item" && action !== "Give Item") return;
		const recipKey = String(document.getElementById(`po-extra-${x.id}-${p}`)?.value || "").trim();
		const arr = items.get(String(x.id)) || [];
		if (!recipKey || !items.has(recipKey)) return;
		const recipCh = byKey.get(recipKey);
		if (!recipCh) return;
		const rawT = (document.getElementById(`po-target-${x.id}-${p}`)?.value || "").trim();
		let idxs;
		if (rawT.toLowerCase() === "all") idxs = arr.map((_, i) => i);
		else idxs = rawT.split(",").map((s) => s.trim()).filter(Boolean).map((t) => {
			const n = parseInt(t);
			if (Number.isInteger(n) && String(n) === t && n >= 0 && n < arr.length) return n;
			return arr.findIndex((it) => it && (String(it.id) === t || it.name === t));
		}).filter((n) => Number.isInteger(n) && n >= 0 && n < arr.length);
		const uniq = [...new Set(idxs)].sort((a, b) => b - a);
		const _same = predictedLocation(x.id, p)?.id === predictedLocation(recipCh.id, p)?.id;
		uniq.forEach((i) => {
			const [it] = arr.splice(i, 1);
			if (_same) (items.get(recipKey) || []).push(it);
		});
	});
	return items.get(cid) || [];
}
var GARRISON_UNIT_TYPES_P = new Set(KC_UNIT_CLASS.garrison);
function _isAutoGarrisonRecruit(u) {
	return !!u && !u._merc && GARRISON_UNIT_TYPES_P.has(u.type);
}
function _projRecruitUnits(tokens) {
	const out = [];
	const mercs = (currentReport || {}).mercIntel || [];
	const toks = (tokens || []).map((t) => String(t || "").trim()).filter(Boolean);
	const _picked = new Set(toks.filter((t) => t.startsWith("merc:")));
	mercs.forEach((m) => {
		if (_picked.has("merc:" + m.id)) out.push({
			type: m.type,
			quality: m.quality || "Average",
			unitName: m.unitName,
			race: m.race || null,
			_merc: true
		});
	});
	const _known = new Set(mercs.map((m) => "merc:" + m.id));
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
function projectedGarrison(provId, phase, includeSamePhase, excludeCharId, _memo) {
	const memo = _memo instanceof Map ? _memo : /* @__PURE__ */ new Map();
	const _gk = `g|${provId}|${phase}|${includeSamePhase ? 1 : 0}|${String(excludeCharId)}`;
	if (memo.has(_gk)) return memo.get(_gk).map((a) => ({ ...a }));
	const report = currentReport || {};
	const pd = (report.provinceOrderData || {})[provId];
	let garr = (pd && pd.garrisonArmies || []).map((a) => ({
		type: a.type,
		quality: a.quality,
		unitName: a.unitName,
		race: a.race
	}));
	const chars = (report.characters || []).filter((x) => x && x.alive !== false);
	const lastPh = includeSamePhase ? phase : phase - 1;
	for (let ph = 0; ph <= lastPh; ph++) {
		chars.forEach((o) => {
			if (ph === phase && String(o.id) === String(excludeCharId)) return;
			const act = document.getElementById(`po-action-${o.id}-${ph}`)?.value || "";
			const tgt = document.getElementById(`po-target-${o.id}-${ph}`)?.value || "";
			const loc = predictedLocation(o.id, ph);
			if (!loc || loc.id !== provId) return;
			if (act === "Leave/Transfer Army") {
				const extra = document.getElementById(`po-extra-${o.id}-${ph}`)?.value;
				if (extra !== "" && extra != null && String(extra) !== "-1") return;
				const led = projectedLedArmies(o.id, ph, memo);
				if (tgt.split(",").map((t) => t.trim()).includes("all")) led.forEach((a) => garr.push(a));
				else {
					const pool = led.slice();
					tgt.split(",").map((t) => t.trim()).filter(Boolean).forEach((val) => {
						const i = pool.findIndex((a) => a.type === val || a.unitName === val);
						if (i >= 0) garr.push(pool.splice(i, 1)[0]);
					});
				}
			} else if (act === "Recruit Armies") {
				const wrap = document.getElementById(`po-target-wrap-${o.id}-${ph}`);
				if (!wrap) return;
				const destSel = wrap.querySelector(".po-recruit-dest");
				const _toG = !!destSel && destSel.value === "to:garrison";
				_projRecruitUnits([...wrap.querySelectorAll("input[type=\"checkbox\"]:checked")].map((cb) => cb.value || "")).forEach((u) => {
					if (_toG || _isAutoGarrisonRecruit(u)) garr.push(u);
				});
			}
		});
		if (ph < phase) chars.forEach((o) => {
			if ((document.getElementById(`po-action-${o.id}-${ph}`)?.value || "") !== "Pick Up Army") return;
			const loc = predictedLocation(o.id, ph);
			if (!loc || loc.id !== provId) return;
			const tgt = document.getElementById(`po-target-${o.id}-${ph}`)?.value || "";
			if (tgt.split(",").map((t) => t.trim()).includes("all")) {
				garr = [];
				return;
			}
			[...new Set(tgt.split(",").map((t) => t.trim()).filter((t) => /^(g:|-1:)\d+$/.test(t)).map((t) => parseInt(t.slice(t.indexOf(":") + 1))))].filter((i) => i >= 0 && i < garr.length).sort((a, b) => b - a).forEach((i) => garr.splice(i, 1));
		});
	}
	memo.set(_gk, garr.map((a) => ({ ...a })));
	return garr;
}
//#endregion
//#region src/ui/player/map.ts
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
	(report && report.worldMeta && report.worldMeta.provinces || []).forEach((p) => add(p.id, p.name));
	(report && report.ownedProvinces || []).forEach((p) => add(p.id, p.name));
	const key = [...map.keys()].sort().join("|");
	if (key === _provNameKey) return;
	_provNameKey = key;
	_provNameMap = map;
	const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const names = [...map.keys()].sort((a, b) => b.length - a.length).map(esc);
	_provNameRe = names.length ? new RegExp("(?<![A-Za-zÀ-ɏ])(" + names.join("|") + ")(?![A-Za-zÀ-ɏ])", "g") : null;
}
function _makeProvLinkEl(id, name) {
	const sp = document.createElement("span");
	sp.className = "prov-link prov-auto";
	sp.setAttribute("data-prov-link", String(id));
	sp.title = `Hover to light up ${name} on the map — click or tap to show it`;
	sp.textContent = name;
	sp.onmouseenter = () => highlightMapProv(id, true);
	sp.onmouseleave = () => highlightMapProv(id, false);
	sp.onclick = (ev) => {
		ev.stopPropagation();
		locateOnMap(id);
	};
	return sp;
}
var _provLinking = false;
function linkProvinceNames(root) {
	if (!root || _provLinking) return;
	_buildProvNameIndex(viewingReport || currentReport);
	if (!_provNameRe) return;
	_provLinking = true;
	try {
		const walker = document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT, { acceptNode(n) {
			if (!n.nodeValue || n.nodeValue.length < 3) return window.NodeFilter.FILTER_REJECT;
			for (let el = n.parentNode; el && el !== root; el = el.parentNode) {
				if (_PROV_LINK_SKIP.has(el.nodeName) || el.namespaceURI === "http://www.w3.org/2000/svg") return window.NodeFilter.FILTER_REJECT;
				if (el.classList && (el.classList.contains("prov-link") || el.classList.contains("no-prov-link"))) return window.NodeFilter.FILTER_REJECT;
				if (el.isContentEditable) return window.NodeFilter.FILTER_REJECT;
			}
			_provNameRe.lastIndex = 0;
			return _provNameRe.test(n.nodeValue) ? window.NodeFilter.FILTER_ACCEPT : window.NodeFilter.FILTER_REJECT;
		} });
		const hits = [];
		let n;
		while (n = walker.nextNode()) hits.push(n);
		hits.forEach((t) => {
			const txt = t.nodeValue;
			const frag = document.createDocumentFragment();
			let last = 0, m;
			_provNameRe.lastIndex = 0;
			while (m = _provNameRe.exec(txt)) {
				if (m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
				frag.appendChild(_makeProvLinkEl(_provNameMap.get(m[1]), m[1]));
				last = m.index + m[1].length;
			}
			if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
			t.parentNode.replaceChild(frag, t);
		});
	} catch (e) {} finally {
		_provLinking = false;
	}
}
var _provLinkObs = null;
var _provLinkTimer = null;
function ensureProvinceLinking() {
	const col = document.getElementById("rp-report-col");
	if (!col) return;
	linkProvinceNames(col);
	if (_provLinkObs || typeof MutationObserver === "undefined") return;
	_provLinkObs = new MutationObserver(() => {
		if (_provLinking) return;
		clearTimeout(_provLinkTimer);
		_provLinkTimer = setTimeout(() => linkProvinceNames(document.getElementById("rp-report-col")), 60);
	});
	_provLinkObs.observe(col, {
		childList: true,
		subtree: true
	});
}
var _provHlTimer = null;
function highlightMapProv(id, on) {
	document.querySelectorAll(".prov-hl").forEach((n) => n.remove());
	if (!on) return;
	const ns = "http://www.w3.org/2000/svg";
	document.querySelectorAll(`svg g[data-prov="${id}"]`).forEach((g) => {
		const poly = g.querySelector("polygon");
		const svg = g.ownerSVGElement;
		if (!poly || !svg) return;
		const hl = document.createElementNS(ns, "polygon");
		hl.setAttribute("points", poly.getAttribute("points"));
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
function locateOnMap(id) {
	try {
		if (window.innerWidth < 821) setMobileView("map");
		else if (typeof _deskLeftView !== "undefined" && _deskLeftView !== "map" && typeof setDeskView === "function") setDeskView("left", "map");
	} catch (e) {}
	setTimeout(() => {
		highlightMapProv(id, true);
		const g = document.querySelector(`#report-map-svg g[data-prov="${id}"]`);
		try {
			const box = document.getElementById("report-map-container");
			if (g && box) {
				const r = g.getBoundingClientRect(), b = box.getBoundingClientRect();
				box.scrollLeft += r.left + r.width / 2 - (b.left + b.width / 2);
				box.scrollTop += r.top + r.height / 2 - (b.top + b.height / 2);
			}
		} catch (e) {}
		clearTimeout(_provHlTimer);
		_provHlTimer = setTimeout(() => highlightMapProv(id, false), 4e3);
	}, 60);
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
	if (!provs || provs.length === 0) return;
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
		r = r || 20.5;
		return Array.from({ length: 6 }, (_, i) => {
			const a = Math.PI / 180 * (60 * i - 30);
			return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
		}).join(" ");
	}
	const c0 = hexCentre(0, 0), c1 = hexCentre(cols - 1, rows - 1);
	const pad = HS * 1.5;
	svgEl.setAttribute("viewBox", `${c0.x - pad} ${c0.y - pad} ${c1.x - c0.x + 66 + HS} ${c1.y - c0.y + 66 + HS}`);
	const playerColor = report.kingdom?.color || "#fcb4c0";
	report.kingdom && report.kingdom.alignment || report.playerSetup && report.playerSetup.alignment;
	const ownedIds = new Set((report.ownedProvinces || []).map((p) => p.id));
	const visitedIds = /* @__PURE__ */ new Set([...report.visitedProvinceIds || [], ...ownedIds]);
	const adjacentIds = /* @__PURE__ */ new Set();
	provs.forEach((p) => {
		if (visitedIds.has(p.id)) (p.neighbors || []).forEach((nid) => {
			if (!visitedIds.has(nid)) adjacentIds.add(nid);
		});
	});
	const provById = {};
	provs.forEach((p) => provById[p.id] = p);
	(report.ownedProvinces || []).forEach((op) => {
		const _wm = provById[op.id];
		provById[op.id] = {
			..._wm,
			...op,
			characters: _wm && Array.isArray(_wm.characters) ? _wm.characters : op.characters
		};
	});
	let tt = document.getElementById("map-tooltip");
	if (!tt) {
		tt = document.createElement("div");
		tt.id = "map-tooltip";
		tt.style.cssText = "position:fixed;background:#1a1208;color:#f2e8d0;border:1px solid #c8922a;padding:8px 12px;font-size:.78rem;line-height:1.6;pointer-events:none;z-index:99999;max-width:220px;display:none;border-radius:2px;font-family:\"Crimson Text\",serif;box-shadow:0 4px 16px rgba(0,0,0,.6)";
		document.body.appendChild(tt);
	}
	const symbolLayer = document.createElementNS(svgNS, "g");
	symbolLayer.setAttribute("pointer-events", "none");
	provs.forEach((p) => {
		if (p.row === void 0 || p.col === void 0) return;
		const { x, y } = hexCentre(displayCol(p.col), p.row);
		const pd = provById[p.id] || p;
		const tier = pd.tier || (ownedIds.has(p.id) ? "owned" : "unknown");
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
			fill.setAttribute("fill", TERRAIN_COLORS_MAP[pd.terrain] || "#555");
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
			const ownerBorderColor = pd.ownerColor || "rgba(255,255,255,0.45)";
			ol.setAttribute("stroke", ownerBorderColor);
			ol.setAttribute("stroke-width", isVisited ? "2" : "1.2");
			ol.setAttribute("opacity", isVisited ? "0.8" : "0.5");
			ol.setAttribute("pointer-events", "none");
			g.appendChild(ol);
		}
		if (pd.name && known) {
			const lbl = document.createElementNS(svgNS, "text");
			const lblY = pd.explored !== void 0 && pd.explored > 0 ? y + HS - 10 : y + HS - 7;
			lbl.setAttribute("x", x);
			lbl.setAttribute("y", lblY);
			lbl.setAttribute("text-anchor", "middle");
			lbl.setAttribute("dominant-baseline", "middle");
			lbl.setAttribute("font-size", "4.2");
			lbl.setAttribute("fill", isOwned ? "#fff" : isVisited ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)");
			lbl.setAttribute("pointer-events", "none");
			lbl.setAttribute("font-family", "Cinzel,serif");
			lbl.textContent = pd.name.length > 10 ? pd.name.substring(0, 9) + "…" : pd.name;
			g.appendChild(lbl);
			if (pd.explored !== void 0 && pd.explored > 0) {
				const el = document.createElementNS(svgNS, "text");
				el.setAttribute("x", x);
				el.setAttribute("y", y + HS - 3);
				el.setAttribute("text-anchor", "middle");
				el.setAttribute("font-size", "3.5");
				el.setAttribute("fill", isOwned ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.4)");
				el.setAttribute("pointer-events", "none");
				el.textContent = pd.explored + "%";
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
			const ws = wStyles[pd.wealth] || wStyles.Poor;
			const dotX = x - HS * .477;
			const dotY = y - HS * .5;
			const dot = document.createElementNS(svgNS, "circle");
			dot.setAttribute("cx", dotX);
			dot.setAttribute("cy", dotY);
			dot.setAttribute("r", "1.75");
			dot.setAttribute("fill", ws.fill);
			dot.setAttribute("stroke", ws.stroke);
			dot.setAttribute("stroke-width", "0.5");
			if (ws.glow) dot.setAttribute("filter", ws.glow);
			dot.setAttribute("pointer-events", "none");
			dot.setAttribute("class", "sym-prosper");
			symbolLayer.appendChild(dot);
		}
		if ((isOwned || isVisited) && pd.characters?.length > 0) {
			const ownChars = pd.characters.filter((c) => c.isOwn);
			const enemyChars = pd.characters.filter((c) => !c.isOwn && !c.isWanderer && !c.isNeutralGuard && c.ownerColor);
			const chieftains = pd.characters.filter((c) => !c.isOwn && c.isNeutralGuard);
			const wanderers = pd.characters.filter((c) => !c.isOwn && !c.isNeutralGuard && (c.isWanderer || !c.ownerColor));
			let markerX = x + HS - 11;
			if (ownChars.length > 0) {
				const mx = markerX, my = y - HS + 12;
				const mg = document.createElementNS(svgNS, "g");
				mg.setAttribute("transform", `translate(${mx} ${my}) scale(0.75) translate(${-mx} ${-my})`);
				const circ = document.createElementNS(svgNS, "circle");
				circ.setAttribute("cx", mx);
				circ.setAttribute("cy", my);
				circ.setAttribute("r", "5");
				circ.setAttribute("fill", playerColor);
				circ.setAttribute("stroke", "#fff");
				circ.setAttribute("stroke-width", "1");
				circ.setAttribute("pointer-events", "none");
				const clbl = document.createElementNS(svgNS, "text");
				clbl.setAttribute("x", mx);
				clbl.setAttribute("y", my + 2);
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
					hd.setAttribute("cx", mx);
					hd.setAttribute("cy", my - 1.5);
					hd.setAttribute("r", "1.8");
					hd.setAttribute("fill", "#fff");
					hd.setAttribute("pointer-events", "none");
					const sh = document.createElementNS(svgNS, "path");
					sh.setAttribute("d", `M${mx - 2.8},${my + 2.2} Q${mx},${my + .5} ${mx + 2.8},${my + 2.2}`);
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
				mg.setAttribute("transform", `translate(${mx} ${my}) scale(0.75) translate(${-mx} ${-my})`);
				const realmCols = [...new Set(enemyChars.map((c) => c.ownerColor || "#7a1c1c"))];
				const ec = document.createElementNS(svgNS, "g");
				ec.setAttribute("pointer-events", "none");
				if (realmCols.length === 1) {
					const c1 = document.createElementNS(svgNS, "circle");
					c1.setAttribute("cx", mx);
					c1.setAttribute("cy", my);
					c1.setAttribute("r", "4.5");
					c1.setAttribute("fill", realmCols[0]);
					c1.setAttribute("stroke", "#fff");
					c1.setAttribute("stroke-width", "0.8");
					ec.appendChild(c1);
				} else {
					const R = 4.5, n = realmCols.length;
					realmCols.forEach((col, i) => {
						const a0 = -Math.PI / 2 + 2 * Math.PI * i / n, a1 = -Math.PI / 2 + 2 * Math.PI * (i + 1) / n;
						const x0 = mx + R * Math.cos(a0), y0 = my + R * Math.sin(a0), x1 = mx + R * Math.cos(a1), y1 = my + R * Math.sin(a1);
						const w = document.createElementNS(svgNS, "path");
						w.setAttribute("d", `M${mx},${my} L${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 ${a1 - a0 > Math.PI ? 1 : 0},1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`);
						w.setAttribute("fill", col);
						ec.appendChild(w);
					});
					const ring = document.createElementNS(svgNS, "circle");
					ring.setAttribute("cx", mx);
					ring.setAttribute("cy", my);
					ring.setAttribute("r", "4.5");
					ring.setAttribute("fill", "none");
					ring.setAttribute("stroke", "#fff");
					ring.setAttribute("stroke-width", "0.8");
					ec.appendChild(ring);
				}
				const elbl = document.createElementNS(svgNS, "text");
				elbl.setAttribute("x", mx);
				elbl.setAttribute("y", my + 2);
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
					ehd.setAttribute("cx", mx);
					ehd.setAttribute("cy", my - 1.5);
					ehd.setAttribute("r", "1.8");
					ehd.setAttribute("fill", "#fff");
					ehd.setAttribute("pointer-events", "none");
					const esh = document.createElementNS(svgNS, "path");
					esh.setAttribute("d", `M${mx - 2.8},${my + 2.2} Q${mx},${my + .5} ${mx + 2.8},${my + 2.2}`);
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
				mg.setAttribute("transform", `translate(${mx} ${my}) scale(0.75) translate(${-mx} ${-my})`);
				const wc = document.createElementNS(svgNS, "circle");
				wc.setAttribute("cx", mx);
				wc.setAttribute("cy", my);
				wc.setAttribute("r", "4.5");
				wc.setAttribute("fill", "#888");
				wc.setAttribute("stroke", "#fff");
				wc.setAttribute("stroke-width", "1");
				wc.setAttribute("pointer-events", "none");
				const wlbl = document.createElementNS(svgNS, "text");
				wlbl.setAttribute("x", mx);
				wlbl.setAttribute("y", my + 2);
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
				mg.setAttribute("transform", `translate(${mx} ${my}) scale(0.75) translate(${-mx} ${-my})`);
				const gc = document.createElementNS(svgNS, "circle");
				gc.setAttribute("cx", mx);
				gc.setAttribute("cy", my);
				gc.setAttribute("r", "4.5");
				gc.setAttribute("fill", CHIEFTAIN_MARKER_COLOR);
				gc.setAttribute("stroke", "#fff");
				gc.setAttribute("stroke-width", "1");
				gc.setAttribute("pointer-events", "none");
				const glbl = document.createElementNS(svgNS, "text");
				glbl.setAttribute("x", mx);
				glbl.setAttribute("y", my + 2);
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
			if ((report.visibleDeadHeroes || []).filter((d) => d.locationId === pd.id).length > 0) {
				const dx = x - HS + 8, dy = y + HS - 10;
				const dt = document.createElementNS(svgNS, "text");
				dt.setAttribute("x", dx);
				dt.setAttribute("y", dy);
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
			const rb = MAP_RACE_BADGE[formatRace(pd.race)];
			if (rb) {
				const rx = x + HS - 7.5, ry = y + HS - 16.5;
				const rg = document.createElementNS(svgNS, "g");
				const rc = document.createElementNS(svgNS, "circle");
				rc.setAttribute("cx", rx);
				rc.setAttribute("cy", ry);
				rc.setAttribute("r", "3");
				rc.setAttribute("fill", rb.fill);
				rc.setAttribute("stroke", "none");
				rc.setAttribute("opacity", known && !isOwned && !isVisited ? "0.7" : "1");
				const rt = document.createElementNS(svgNS, "text");
				rt.setAttribute("x", rx);
				rt.setAttribute("y", ry + 1.4);
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
		if (isOwned && (pd.garrisonArmies || []).length > 0) {
			const gx = x + HS - 13, gy = y + HS - 10;
			const gtxt = document.createElementNS(svgNS, "text");
			gtxt.setAttribute("x", gx);
			gtxt.setAttribute("y", gy);
			gtxt.setAttribute("text-anchor", "middle");
			gtxt.setAttribute("font-size", "5.5");
			gtxt.setAttribute("fill", "#2c3e6a");
			gtxt.setAttribute("stroke", "#f4ead8");
			gtxt.setAttribute("stroke-width", "0.25");
			gtxt.setAttribute("pointer-events", "none");
			const _gn = (pd.garrisonArmies || []).length;
			const _tt = document.createElementNS(svgNS, "title");
			_tt.textContent = `Garrison: ${_gn} unit${_gn !== 1 ? "s" : ""} holding this province`;
			gtxt.setAttribute("pointer-events", "auto");
			gtxt.appendChild(_tt);
			mapSymSvg(gtxt, MAP_SYM.garrison);
			gtxt.setAttribute("class", "sym-garrison");
			symbolLayer.appendChild(gtxt);
		}
		if (pd.hadBattle || pd.battleUnresolved) {
			const bx = x, by = y - HS + 12;
			const btxt = document.createElementNS(svgNS, "text");
			btxt.setAttribute("x", bx);
			btxt.setAttribute("y", by);
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
			ctx2.setAttribute("x", cx2);
			ctx2.setAttribute("y", cy2);
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
			ctxt.setAttribute("x", x + HS * .42);
			ctxt.setAttribute("y", y - HS * .2);
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
			ktxt.setAttribute("x", kx);
			ktxt.setAttribute("y", ky);
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
		if (_graveIntelById && pd.id != null && _graveIntelById[pd.id]) {
			const _gi = _graveIntelById[pd.id];
			const _fresh = _gi.turn != null && report.turnNumber != null && _gi.turn === report.turnNumber;
			const vx = x - HS * .62, vy = y + HS * .227;
			const vtxt = document.createElementNS(svgNS, "text");
			vtxt.setAttribute("x", vx);
			vtxt.setAttribute("y", vy);
			vtxt.setAttribute("text-anchor", "middle");
			vtxt.setAttribute("font-size", "6.4");
			vtxt.setAttribute("font-weight", "700");
			vtxt.setAttribute("stroke", "#000");
			vtxt.setAttribute("stroke-width", "0.3");
			vtxt.setAttribute("paint-order", "stroke");
			vtxt.setAttribute("filter", "drop-shadow(0 0 1px rgba(0,0,0,.7))");
			vtxt.setAttribute("pointer-events", "auto");
			const _vt = document.createElementNS(svgNS, "title");
			_vt.textContent = _fresh ? "Battlefield graves lie here — read this turn, so the dead are certainly still in the ground." : `Battlefield graves were here as of turn ${_gi.turn != null ? _gi.turn : "?"} — they may since have been raised or rotted away.`;
			vtxt.appendChild(_vt);
			const vnode = mapSymSvg(vtxt, _fresh ? MAP_SYM.gravesFresh : MAP_SYM.gravesStale);
			vnode.setAttribute("class", "sym-graves");
			symbolLayer.appendChild(vnode);
		}
		if (pd.ownArmyHere || (pd.characters || []).some((c) => c.isOwn && (c.armyCount || 0) > 0)) {
			const _deadBL = (report.visibleDeadHeroes || []).some((d) => d.locationId === pd.id);
			const lx = x - HS + 8 + (_deadBL ? 9 : 0), ly = y + HS - 10;
			const ltxt = document.createElementNS(svgNS, "text");
			ltxt.setAttribute("x", lx);
			ltxt.setAttribute("y", ly);
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
			const _flagGD = pd.ownArmyHere || (pd.characters || []).some((c) => c.isOwn && (c.armyCount || 0) > 0);
			const _deadGD = (report.visibleDeadHeroes || []).some((d) => d.locationId === pd.id);
			const _ritGD = (pd.features || []).some((f) => f.ritualSite);
			const gx = x - HS + 8 + ((_deadGD ? 9 : 0) + (_flagGD ? 9 : 0) + (_ritGD ? 9 : 0)), gy = y + HS - 10;
			const gtxt = document.createElementNS(svgNS, "text");
			gtxt.setAttribute("x", gx);
			gtxt.setAttribute("y", gy);
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
		if ((pd.features || []).some((f) => f.ritualSite)) {
			const hasFlag = pd.ownArmyHere || (pd.characters || []).some((c) => c.isOwn && (c.armyCount || 0) > 0);
			const _deadBL2 = (report.visibleDeadHeroes || []).some((d) => d.locationId === pd.id);
			const mnx = x - HS + 8 + ((_deadBL2 ? 9 : 0) + (hasFlag ? 9 : 0) + (pd.grandDesign ? 9 : 0)), mny = y + HS - 10;
			const mtxt = document.createElementNS(svgNS, "text");
			mtxt.setAttribute("x", mnx);
			mtxt.setAttribute("y", mny);
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
				const h = [kcHtml`<strong style="font-family:'Cinzel',serif;font-size:.8rem">${pd.name || capitalise(pd.terrain) || "Unknown"}</strong><br>`];
				const natives = () => pd.armyTypes?.length ? pd.armyTypes.map((t) => kcHtml`<br>${unitEmoji(t)} ${t}`) : kcHtml`<br>${txtGlyph("⚔")} <span style="opacity:.7;font-style:italic">No native recruitable armies</span>`;
				const lairsAndRites = () => {
					const kf = (pd.features || []).filter((f) => !f.cleared);
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
					h.push(`${capitalise(pd.terrain || "?")} · ${pd.wealth || "?"}`);
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
					h.push(`${capitalise(pd.terrain || "?")} terrain · ${pd.wealth || "unknown wealth"}`);
					h.push(kcHtml`<br>${_ownerLineP(pd)}`);
					h.push(_grandDesignNote(pd));
					h.push(terrorNoteP(pd));
					h.push(natives());
					h.push(_graveNote(pd));
				}
				tt.innerHTML = kcHtml`${h}<div style="text-align:right;margin-top:8px;border-top:1px solid #4a3a1a;padding-top:6px"><button onclick="_closeMapTip(event)" style="background:#7a1c1c;color:#fff;border:none;padding:6px 14px;border-radius:2px;cursor:pointer;font-family:Cinzel,serif;font-size:.72rem;pointer-events:auto">\u2715 Close</button></div>`;
				tt.style.display = "block";
				tt.style.left = ev.clientX + 16 + "px";
				tt.style.top = ev.clientY + 16 + "px";
				_clampMapTip(tt);
			};
			g.addEventListener("mousemove", showTip);
			g.addEventListener("mouseleave", () => {
				if (!tt._sticky) tt.style.display = "none";
			});
			g.addEventListener("click", (ev) => {
				showTip(ev);
				tt._sticky = true;
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
		tt._sticky = false;
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
		tt.style.left = l + "px";
		tt.style.top = t + "px";
		tt.style.maxHeight = Math.max(120, vh - 16) + "px";
		tt.style.overflowY = "auto";
	} catch (e) {}
}
document.addEventListener("click", (ev) => {
	const tt = document.getElementById("map-tooltip");
	if (!tt || tt.style.display === "none" || !tt._sticky) return;
	if (tt.contains(ev.target)) return;
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
	document.querySelectorAll("#map-icon-toggles button[data-icon]").forEach((b) => {
		const off = _mapIconOff.has(b.getAttribute("data-icon"));
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
	if (!bar || bar._built) return;
	bar._built = true;
	const swatch = (t) => {
		if (t.sym && MAP_SYM[t.sym]) return mapSymHtml(MAP_SYM[t.sym], null, ".8rem");
		if (t.emoji) return kcHtml`<span style="font-size:.8rem">${t.emoji}\uFE0F</span>`;
		if (t.dot) return kcHtml`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.dot};vertical-align:0"></span>`;
		if (t.badge) return mapRaceBadgeHtml(t.badge);
		return "";
	};
	bar.innerHTML = kcHtml`${MAP_ICON_TYPES.map((t) => kcHtml`<button type="button" data-icon="${t.key}" onclick="toggleMapIcon(${kcArg(t.key)})" title="Show/hide ${t.label}" style="background:#241810;color:#e8b84b;border:1px solid #4a3418;border-radius:2px;padding:2px 6px;cursor:pointer;font-size:.62rem;line-height:1.3;display:inline-flex;align-items:center;gap:4px">${swatch(t)}${t.label}</button>`)}`;
	applyMapIconVisibility();
}
function renderPlayerMap(report) {
	const svg = document.getElementById("report-map-svg");
	const r = report || viewingReport || currentReport;
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
	fsSvg.style.cssText = "display:block;width:" + fsW + "px;flex:0 0 auto";
	body.appendChild(fsSvg);
	modal.appendChild(hdr);
	modal.appendChild(body);
	document.body.appendChild(modal);
	if (viewingReport || currentReport) renderMapIntoSvg(fsSvg, viewingReport || currentReport);
	if (fitMapSvgHeight(fsSvg, fsW) == null) fsSvg.style.height = Math.max(200, (window.innerHeight || 400) - 80) + "px";
	modal.addEventListener("click", (ev) => {
		if (ev.target === modal) {
			_closeMapTip();
			modal.remove();
		}
	});
}
//#endregion
//#region src/ui/player/layout.ts
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
	} catch (e) {}
	document.querySelectorAll("#mobile-tabbar button").forEach((b) => b.classList.toggle("active", b.getAttribute("data-mv") === view));
	if (view === "map") try {
		applyMapZoom();
	} catch (e) {}
	if (view === "messages") try {
		onMessagesShown();
	} catch (e) {}
	else refreshMsgBadgeSoon();
	try {
		window.scrollTo(0, 0);
	} catch (e) {}
}
globalThis._msgEnabled = false;
globalThis._deskLeftView = "map";
var _deskRightView = "report";
var _ordersAvailable = true;
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
		document.getElementById("desk-left-body").appendChild(map);
		if (msg) document.getElementById("desk-left-body").appendChild(msg);
		document.getElementById("desk-right-body").appendChild(ord);
		document.getElementById("desk-right-body").appendChild(rep);
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
	const h = Math.max(360, Math.floor(window.innerHeight - top - 8)) + "px";
	if (l.style.height !== h) l.style.height = h;
	if (r.style.height !== h) r.style.height = h;
	if (!_deskFitObs && typeof ResizeObserver === "function") {
		_deskFitObs = new ResizeObserver(() => fitDeskPanels());
		document.querySelectorAll("#sec-report > .detail-header, #new-turn-banner").forEach((el) => _deskFitObs.observe(el));
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
	} catch (e) {}
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
	} catch (e) {}
}
function refreshOrdersVisibility(available) {
	_ordersAvailable = !!available;
	const lay = document.getElementById("rp-layout");
	const oc = document.getElementById("orders-column");
	if (lay && lay.classList.contains("desk")) {
		if (!_ordersAvailable && _deskRightView === "orders" && _deskLeftView !== "report") _deskRightView = "report";
		applyDeskViews();
	} else if (oc) oc.style.display = _ordersAvailable ? "flex" : "none";
}
var _mapZoom = 1;
function fitMapSvgHeight(svgEl, widthPx) {
	if (!svgEl) return null;
	const vb = (svgEl.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
	if (vb.length !== 4 || !(vb[2] > 0) || !(vb[3] > 0) || !(widthPx > 0)) {
		svgEl.style.height = "";
		return null;
	}
	const h = Math.round(widthPx * vb[3] / vb[2]);
	svgEl.style.height = h + "px";
	return h;
}
var MOBILE_MAP_WIDTH = 700;
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
	const cw = Math.max(50, (cont && cont.clientWidth || 320) - pad);
	const ch = Math.max(50, (cont && cont.clientHeight || 320) - pad);
	setW(cw * _mapZoom + "px", ch * _mapZoom + "px");
}
function mapZoom(delta) {
	_mapZoom = delta === 0 ? 1 : Math.max(1, Math.min(4, _mapZoom + delta));
	applyMapZoom();
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
//#endregion
//#region src/ui/player/init.ts
function collectMessages() {
	return [];
}
globalThis.currentGamePlayerId = null;
globalThis.viewingReport = null;
globalThis.viewedTurn = null;
function snapshotTurnLabel(key) {
	return (parseInt(key) || 0) + 1;
}
function refreshTurnNavHighlight() {
	const navEl = document.getElementById("turn-nav-btns");
	if (!navEl) return;
	const resolved = parseInt(navEl.dataset.resolved ?? "-1");
	[...navEl.children].forEach((btn) => {
		const d = parseInt(btn.dataset.turn);
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
async function init() {
	try {
		document.getElementById("spinner").style.display = "none";
		const { data: { session }, error } = await sb.auth.getSession();
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
		tgt.style.scrollMarginTop = barH + "px";
		tgt.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}
}
function show(id) {
	try {
		_closeMapTip();
	} catch (e) {}
	if (id !== "sec-report" && /^#game=/.test(location.hash || "")) try {
		history.replaceState(null, "", location.pathname + location.search);
	} catch (e) {}
	if (id !== "sec-report") try {
		stopMessagePolling();
		saveMessageReads();
	} catch (e) {}
	document.querySelectorAll("section").forEach((s) => s.classList.remove("section-active"));
	document.getElementById(id)?.classList.add("section-active");
	if (id === "sec-report") {
		ensureMobileDefault();
		if (window.innerWidth < 821) teardownDeskLayout();
		else setupDeskLayout();
	}
}
//#endregion
//#region src/ui/player/join-and-chronicle.ts
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
		const { data: mine, error: meErr } = await sb.from("game_players").select("id,player_index").eq("game_id", gameId).eq("user_id", currentUser.id);
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
		const { data: gRow } = await sb.from("games").select("game_state,status").eq("id", gameId).single();
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
	const { data: slot, error } = await sb.from("game_players").insert({
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
	}).select().single();
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
		const { data: snapRows } = await sb.from("turn_logs").select("*").eq("game_id", gameId).eq("turn", turn).eq("player_index", pi).limit(1);
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
	const { data: logs } = await sb.from("turn_logs").select("*").eq("game_id", gameId).eq("turn", turn).eq("player_index", -1).limit(1);
	const { data: g } = await sb.from("games").select("*").eq("id", gameId).single();
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
//#endregion
//#region src/ui/player/move-analysis.ts
var PO_SEA_TYPES = new Set(KC_UNIT_CLASS.sea);
var PO_CARRIER_TYPES = new Set(KC_UNIT_CLASS.carrier);
var PO_AERIAL_TYPES = new Set(KC_UNIT_CLASS.aerial);
var PO_PROJECTED_FOOT = "__projected foot__";
var takesHalfAHullAboardOrIsYetToBeRaised = (a) => a.type === PO_PROJECTED_FOOT || takesHalfAHullAboard(a);
function poSeaAnalysis(armies, navalRaw) {
	const A = (armies || []).filter(Boolean);
	const navalL8 = (navalRaw || 0) >= 8;
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
		shortNames: lift.unitsLeftAshore.map((a) => a.unitName || a.type)
	};
}
var PO_UNCOUNTABLE_ACTIONS = /* @__PURE__ */ new Set(["Awaken Grove", "Wild Calling"]);
var PO_UNCOUNTABLE_SPELLS = /* @__PURE__ */ new Set([
	"Control Undead",
	"Raise Wraiths",
	"Death's Dominion",
	"Phantom Host"
]);
function projectedMoveHost(charId, ph) {
	const report = currentReport || {};
	const ch = (report.characters || []).find((x) => String(x.id) === String(charId));
	const out = {
		armies: [],
		uncounted: [],
		gained: 0,
		base: 0
	};
	if (!ch) return out;
	out.armies = typeof projectedLedArmies === "function" ? projectedLedArmies(ch.id, ph) : (ch.armies || []).map((a) => ({ ...a }));
	out.base = (ch.armies || []).length;
	out.sameFrom = [];
	const pod = report.provinceOrderData || {};
	const add = (a) => {
		out.armies.push(a);
		out.gained++;
	};
	{
		const myLoc = typeof predictedLocation === "function" ? predictedLocation(ch.id, ph) : null;
		const _memo = /* @__PURE__ */ new Map();
		(report.characters || []).forEach((o) => {
			if (!o || o.alive === false || String(o.id) === String(ch.id)) return;
			const oAct = (document.getElementById(`po-action-${o.id}-${ph}`) || {}).value || "";
			if (oAct !== "Recruit Armies" && oAct !== "Leave/Transfer Army") return;
			const oLoc = predictedLocation(o.id, ph);
			if (!myLoc || !oLoc || oLoc.id !== myLoc.id) return;
			const toks = String((document.getElementById(`po-target-${o.id}-${ph}`) || {}).value || "").split(",").map((t) => t.trim()).filter(Boolean);
			let got = [];
			if (oAct === "Recruit Armies") {
				if (!toks.includes("to:" + ch.id)) return;
				got = (typeof _projRecruitUnits === "function" ? _projRecruitUnits(toks) : []).filter((u) => !_isAutoGarrisonRecruit(u));
			} else {
				const oExtra = (document.getElementById(`po-extra-${o.id}-${ph}`) || {}).value || "";
				if (String(oExtra) !== String(ch.id)) return;
				const oArm = projectedLedArmies(o.id, ph, _memo);
				if (toks.includes("all")) got = oArm.slice();
				else {
					const pool = oArm.slice();
					toks.forEach((val) => {
						const i = pool.findIndex((x) => (x.unitName || x.type) === val || x.type === val);
						if (i >= 0) got.push(pool.splice(i, 1)[0]);
					});
				}
			}
			if (!got.length) return;
			got.forEach((u) => add({
				...u,
				_projected: true
			}));
			out.sameFrom.push(`${got.length} unit${got.length !== 1 ? "s" : ""} ${oAct === "Recruit Armies" ? "recruited for him" : "handed over"} by ${o.name}`);
		});
	}
	for (let p = 0; p < ph; p++) {
		const act = (document.getElementById(`po-action-${charId}-${p}`) || {}).value || "";
		if (!act) continue;
		const tgt = String((document.getElementById(`po-target-${charId}-${p}`) || {}).value || "").trim();
		if (act === "Perform Rite") {
			if (tgt === "Wild Hunt") {
				const loc = predictedLocation(charId, p);
				const wt = loc ? (pod[loc.id] || {}).wildHuntType : null;
				if (wt) {
					add({
						type: wt,
						quality: "Veteran",
						unitName: `${wt} (bound by the Wild Hunt)`,
						_projected: true
					});
					add({
						type: wt,
						quality: "Veteran",
						unitName: `${wt} (bound by the Wild Hunt)`,
						_projected: true
					});
				} else out.uncounted.push("the Wild Hunt");
			} else {
				const ex = String((document.getElementById(`po-extra-${charId}-${p}`) || {}).value || "");
				const m = /S:([0-9,]*)\|E:/.exec(ex);
				if (m) {
					const atThen = typeof projectedLedArmies === "function" ? projectedLedArmies(charId, p) : [];
					m[1].split(",").filter(Boolean).map(Number).forEach((i) => {
						const a = atThen[i];
						if (!a) return;
						const j = out.armies.findIndex((x) => (x.unitName || x.type) === (a.unitName || a.type));
						if (j >= 0) out.armies.splice(j, 1);
					});
				}
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
				const lv = Math.max(0, Math.min(5, Math.round((typeof effSkillP === "function" ? effSkillP(ch, "necromancy") : (ch.skills || {}).necromancy || 0) || 0)));
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
		if (PO_UNCOUNTABLE_ACTIONS.has(act)) out.uncounted.push(act);
	}
	out.uncounted = [...new Set(out.uncounted)];
	return out;
}
function poMoveModeNote(ch, destProv, host, fromProv) {
	const H = host || {
		armies: (ch && ch.armies || []).map((a) => ({ ...a })),
		uncounted: [],
		gained: 0,
		base: (ch && ch.armies || []).length
	};
	const A = H.armies || [];
	const an = poSeaAnalysis(A, (ch && ch.skills || {}).naval || 0);
	const destSea = !!(destProv && destProv.terrain === "sea");
	const destKnown = !!(destProv && destProv.terrain);
	const fromSea = !!(fromProv && fromProv.terrain === "sea");
	const fromKnown = !!(fromProv && fromProv.terrain);
	const _foot = (() => {
		const bits = [];
		const diff = A.length - (H.base || 0);
		const _same = H.sameFrom || [];
		if (diff !== 0 || H.gained) bits.push(`counting your ${_same.length ? `orders this turn, including this phase's hand-overs (${_same.join("; ")} — these resolve before any move)` : "earlier orders this turn"} — ${A.length} unit${A.length !== 1 ? "s" : ""} under command by then${diff > 0 ? ` (${diff} more than now)` : diff < 0 ? ` (${-diff} fewer than now)` : ""}`);
		if ((H.uncounted || []).length) bits.push(kcHtml`<strong>not counted:</strong> ${H.uncounted.join(", ")} — there is no telling in advance what they will bring`);
		return bits.length ? kcHtml`<div style="opacity:.85;margin-top:2px">${kcJoinP(bits, " · ")}.</div>` : "";
	})();
	const box = (bg, bd, fg, html) => kcHtml`<div style="font-size:.72rem;color:${fg};background:${bg};border:1px solid ${bd};border-radius:2px;padding:3px 6px;margin-top:3px">${html}${_foot}</div>`;
	const good = (h) => box("#eaf5e2", "#7ea45f", "#1f4410", h);
	const warn = (h) => box("#fff3e0", "#e0b070", "#7a3c00", h);
	const bad = (h) => box("#fdeaea", "#c06060", "#7a1010", h);
	const where = destProv ? kcHtml` into <strong>${destProv.name || "that province"}</strong>` : "";
	if (!A.length) return good(kcHtml`🚶 <strong>Solo ride</strong> — ${ch.name} leads no troops${where}, and travels by land or takes passage over water freely.`);
	const _navalAboard = an.hulls + an.seaBeasts;
	if (_navalAboard > 0 && !fromSea && !destSea && fromKnown && destKnown) {
		const _names = [...new Set(A.filter((a) => PO_SEA_TYPES.has(a.type)).map((a) => a.unitName || a.type))];
		return bad(kcHtml`⛔ <strong>This move will be refused — ships cannot cross land.</strong> ${ch.name} would be marching from one land province${fromProv ? kcHtml` (<strong>${fromProv.name || "here"}</strong>)` : ""} to another${where} while leading ${_navalAboard} naval unit${_navalAboard !== 1 ? "s" : ""} (${_names.slice(0, 3).join(", ")}${_names.length > 3 ? "…" : ""}). There is no coast-to-coast march for a fleet. Either <strong>Leave/Transfer</strong> the ships into this province's garrison in an earlier phase and march without them, or sail instead — from a land province a fleet may only move to an <strong>adjacent sea province</strong>.`);
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
			return good(kcHtml`⛵ <strong>Naval move</strong> — ${an.hulls} hull${an.hulls !== 1 ? "s" : ""}${an.navalL8 ? " (Naval 8: each carries double)" : ""}${an.flyers ? ` and ${an.flyers} flyer${an.flyers !== 1 ? "s" : ""}` : ""} carry ${carried} land unit${carried !== 1 ? "s" : ""} out to sea.`);
		}
		return bad(kcHtml`⚠ <strong>Not enough lift for a sea crossing.</strong> ${ch.name} leads ${an.landCount} land unit${an.landCount !== 1 ? "s" : ""} but only ${an.hulls} hull${an.hulls !== 1 ? "s" : ""}${an.flyers ? ` and ${an.flyers} humanoid flyer${an.flyers !== 1 ? "s" : ""}` : " and no flyers"}. About ${an.short} unit${an.short !== 1 ? "s" : ""} would be left ashore${an.shortNames.length ? ` (${an.shortNames.slice(0, 3).join(", ")}${an.shortNames.length > 3 ? "…" : ""})` : ""}. Recruit or bring more ships, send the surplus elsewhere, or choose a land province.`);
	}
	const bits = [];
	if (an.aerial && !an.allAerial) bits.push(`${an.aerial} winged unit${an.aerial !== 1 ? "s" : ""} march with the rest`);
	if (_navalAboard > 0) {
		if (fromSea) return good(kcHtml`⛵ <strong>Coastal landing</strong>${where} — the ships put in and the land units come ashore.${bits.length ? ` (${bits.join("; ")}.)` : ""} Once ashore the column cannot march on while it still leads ships: leave them in the garrison first.`);
		return warn(kcHtml`⚠ <strong>Land march with ships in the column.</strong> ${ch.name} leads ${_navalAboard} naval unit${_navalAboard !== 1 ? "s" : ""}, and a column carrying ships or sea-beasts <strong>cannot step from one land province to another</strong> — if this leg turns out to start and end on land the order will be refused. Leave the hulls behind to march, or sail to an adjacent sea province.${bits.length ? ` (${bits.join("; ")}.)` : ""}`);
	}
	return good(kcHtml`🛡 <strong>Land march</strong>${where}${destKnown ? "" : " (destination not yet mapped)"}${bits.length ? ` — ${bits.join("; ")}.` : "."}`);
}
function moveOriginProv(charId, ph) {
	const provs = currentReport && currentReport.worldMeta && currentReport.worldMeta.provinces || [];
	const loc = typeof predictedLocation === "function" ? predictedLocation(charId, ph) : null;
	if (!loc) return null;
	return provs.find((p) => p.id === loc.id) || {
		id: loc.id,
		name: loc.name
	};
}
function refreshMoveModeNote(charId, ph) {
	const host = document.getElementById(`po-move-mode-${charId}-${ph}`);
	if (!host) return;
	const ch = (currentReport && currentReport.characters || []).find((c) => String(c.id) === String(charId));
	if (!ch) {
		host.innerHTML = "";
		return;
	}
	const tgt = (getOrderTarget(charId, ph) || "").trim();
	const provs = currentReport && currentReport.worldMeta && currentReport.worldMeta.provinces || [];
	let dest = null;
	if (tgt.startsWith("prov:")) {
		const id = parseInt(tgt.slice(5));
		if (!isNaN(id)) dest = provs.find((p) => p.id === id) || null;
	}
	host.innerHTML = poMoveModeNote(ch, dest, projectedMoveHost(charId, ph), moveOriginProv(charId, ph));
}
function refreshAllMoveModeNotes() {
	(currentReport && currentReport.characters || []).forEach((c) => {
		if (!c || c.alive === false) return;
		for (let p = 0; p <= 4; p++) if (document.getElementById(`po-move-mode-${c.id}-${p}`)) refreshMoveModeNote(c.id, p);
	});
}
function lastMoveDirOf(charId, beforePhase) {
	const report = currentReport;
	if (!report || !report.worldMeta) return null;
	const wm = report.worldMeta, cols = wm.cols, rows = wm.rows, provs = wm.provinces || [];
	const HEX = KC_HEX_DIRS.slice();
	const EV = [
		[-1, -1],
		[-1, 0],
		[0, -1],
		[0, 1],
		[1, -1],
		[1, 0]
	];
	const OD = [
		[-1, 0],
		[-1, 1],
		[0, -1],
		[0, 1],
		[1, 0],
		[1, 1]
	];
	let found = null;
	for (let ph = 0; ph < beforePhase; ph++) {
		if (document.getElementById(`po-action-${charId}-${ph}`)?.value !== "Move") continue;
		const tgt = (getOrderTarget(charId, ph) || "").trim();
		if (!tgt) continue;
		if (tgt.startsWith("dir:")) {
			const d = tgt.slice(4);
			if (HEX.indexOf(d) >= 0) found = d;
			continue;
		}
		if (!tgt.startsWith("prov:")) continue;
		const toId = parseInt(tgt.slice(5));
		if (isNaN(toId)) continue;
		const from = predictedLocation(charId, ph);
		if (!from) continue;
		const fp = provs.find((p) => p.id === from.id);
		if (!fp || fp.row == null) continue;
		if (toId === fp.id) continue;
		const offs = fp.row % 2 === 0 ? EV : OD;
		for (let i = 0; i < 6; i++) {
			const nr = fp.row + offs[i][0];
			if (nr < 0 || nr >= rows) continue;
			const nc = ((fp.col + offs[i][1]) % cols + cols) % cols;
			if (nr * cols + nc === toId) {
				found = HEX[i];
				break;
			}
		}
	}
	return found;
}
var SKILL_LABELS = { ...KC_SKILL_LABELS };
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
var HEIR_TEMPERS_LIST = KC_TEMPERS.slice();
function heirBaseSkills(c) {
	return c && c._heirBase || c && c.skills || {};
}
function heirAddedTo(c, skill) {
	const b = heirBaseSkills(c);
	return ((c.skills || {})[skill] || 0) - (b[skill] || 0);
}
function heirTotalAdded(c) {
	const b = heirBaseSkills(c), s = c.skills || {}, keys = /* @__PURE__ */ new Set([...Object.keys(s), ...Object.keys(b)]);
	let t = 0;
	keys.forEach((k) => {
		t += Math.max(0, (s[k] || 0) - (b[k] || 0));
	});
	return t;
}
function heirPointsRemaining(c) {
	return 4 - heirTotalAdded(c);
}
function heirSelectorHTML(chars) {
	const heir = (chars || []).find((c) => c._isHeir);
	if (!heir) return "";
	const remaining = heirPointsRemaining(heir);
	const pip = (skill) => {
		const lvl = (heir.skills || {})[skill] || 0;
		const added = heirAddedTo(heir, skill);
		const displayName = SKILL_LABELS[skill] || skill;
		const minusOff = added <= 0;
		const plusOff = remaining <= 0 || added >= 2;
		return kcHtml`<div class="skill-pip">
      <button onclick="allocateHeirSkill(${kcArg(heir.id)},${kcArg(String(skill))},-1)" ${minusOff ? "disabled" : ""}>−</button>
      <span class="sk-name" onmousemove="showSkillTip(event,${kcArg(String(skill))})" onmouseleave="hideSkillTip()">${displayName}</span>
      <span class="sk-val">${lvl}</span>
      <button onclick="allocateHeirSkill(${kcArg(heir.id)},${kcArg(String(skill))},1)" ${plusOff ? "disabled" : ""}>+</button>
    </div>`;
	};
	const grid = kcHtml`<div class="skill-cols">${SKILL_COLUMNS.map((col) => kcHtml`<div class="skill-col"><div class="skill-col-head">${col.head}</div>${col.skills.map(pip)}</div>`)}</div>`;
	return kcHtml`<div style="background:#fff8e8;border:2px solid var(--gold);border-radius:3px;padding:10px 12px;margin-bottom:14px">
    <div style="font-family:'Cinzel',serif;font-size:.82rem;color:var(--gold);margin-bottom:4px">👑 Royal Succession — Name, Temper &amp; Skills</div>
    <div style="font-size:.76rem;color:#444;margin-bottom:8px">A new monarch has risen. Name them, choose their Temper, and spend their <strong>${remaining}</strong> remaining skill point${remaining !== 1 ? "s" : ""} before submitting orders. New skills take effect this turn — buy a magic school and you can cast from it right away.</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px">
      <label style="font-size:.74rem;color:#231e16">Name
        <input id="heir-name" value="${heir.name || ""}" maxlength="40" oninput="setHeirName(${kcArg(heir.id)},this.value)"
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
		const r = typeof existingOrders === "string" ? JSON.parse(existingOrders || "{}") : existingOrders || {};
		return Array.isArray(r.heroOrder) && r.heroOrder.length ? r.heroOrder.map(String) : null;
	} catch (e) {
		return null;
	}
}
function applyHeroOrderP(chars, order) {
	const list = [...chars || []];
	if (order && order.length) {
		const rank = new Map(order.map((id, i) => [String(id), i]));
		list.sort((a, b) => (rank.has(String(a.id)) ? rank.get(String(a.id)) : 1e9) - (rank.has(String(b.id)) ? rank.get(String(b.id)) : 1e9));
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
	return fromDom.length ? fromDom : (_heroOrder || []).slice();
}
function moveHeroBlock(charId, dir) {
	const blocks = heroBlocksP();
	const i = blocks.findIndex((b) => b.getAttribute("data-hero") === String(charId));
	const j = i + dir;
	if (i < 0 || j < 0 || j >= blocks.length) return;
	const gA = heroGroupP(blocks[i]), gB = heroGroupP(blocks[j]);
	if (dir > 0) {
		let ref = gB[gB.length - 1];
		gA.forEach((n) => {
			ref.after(n);
			ref = n;
		});
	} else {
		const anchor = gB[0];
		gA.forEach((n) => anchor.parentNode.insertBefore(n, anchor));
	}
	_heroOrder = heroBlocksP().map((b) => b.getAttribute("data-hero"));
	refreshHeroMoveButtonsP();
	try {
		blocks[i].scrollIntoView({
			block: "nearest",
			behavior: "smooth"
		});
	} catch (e) {}
	persistHeroOrder();
}
function groupHeroesByLocation() {
	const blocks = heroBlocksP();
	if (blocks.length < 2) return;
	const chars = currentReport && currentReport.characters || [];
	const locOf = (id) => {
		const c = chars.find((x) => String(x.id) === String(id));
		return c ? String(c.locationId != null ? c.locationId : c.locationName || "?") : "?";
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
	})).sort((x, y) => x.k - y.k || x.i - y.i);
	if (sorted.every((s, i) => s.i === i)) return;
	const parent = blocks[0].parentNode;
	sorted.map((s) => heroGroupP(s.b)).flat().forEach((n) => parent.appendChild(n));
	_heroOrder = heroBlocksP().map((b) => b.getAttribute("data-hero"));
	refreshHeroMoveButtonsP();
	persistHeroOrder();
}
function refreshHeroMoveButtonsP() {
	const blocks = heroBlocksP();
	blocks.forEach((b, i) => {
		const up = b.querySelector(".hero-move-up"), dn = b.querySelector(".hero-move-down");
		if (up) up.disabled = i === 0;
		if (dn) dn.disabled = i >= blocks.length - 1;
	});
}
async function persistHeroOrder() {
	const gp = currentGamePlayer;
	if (!gp || !gp.id || !_heroOrder.length) return;
	if (document.getElementById("prev-report-banner")?.style.display === "block") return;
	let raw = {};
	try {
		raw = typeof gp.orders === "string" ? JSON.parse(gp.orders || "{}") : gp.orders || {};
	} catch (e) {
		raw = {};
	}
	if (!raw || typeof raw !== "object") raw = {};
	if (raw.orders === void 0) raw.orders = {};
	if (raw.encounterPlans === void 0) raw.encounterPlans = {};
	if (raw.forTurn == null) raw.forTurn = currentReport && (currentReport._liveTurn || currentReport.turn) || 1;
	raw.heroOrder = _heroOrder.slice();
	const payload = JSON.stringify(raw);
	const { error } = await sb.from("game_players").update({ orders: payload }).eq("id", gp.id);
	if (error) {
		console.warn("persistHeroOrder:", error.message);
		return;
	}
	gp.orders = payload;
}
//#endregion
//#region src/ui/player/order-chances.ts
var SPELLS_BY_SCHOOL = {
	white: [
		"Resurrect",
		"Part Sea",
		"Bless Province",
		"Holy Symbol",
		"Spiritwrack",
		"Sanctuary",
		"Divine Judgment"
	],
	psychic: [
		"Charm",
		"Oratory",
		"Clairvoyance",
		"Psychic Blast",
		"Telekinetic Storm",
		"Mass Confusion",
		"Dominate"
	],
	illusory: [
		"Illusory Terrain",
		"Phantasmal Armies",
		"Hide Lairs",
		"Invisibility",
		"Mirror Image",
		"Phantom Host",
		"Veil"
	],
	elemental: [
		"Lightning Bolt",
		"Fireball",
		"Earthquake",
		"Flood",
		"Elemental Summon",
		"Chain Lightning",
		"Cataclysm"
	],
	necromancy: [
		"Control Undead",
		"Skeletal Armies",
		"Curse",
		"Hand of Death",
		"Plague",
		"Raise Wraiths",
		"Death's Dominion"
	]
};
function castChanceNote(c, spellName, opts) {
	opts = opts || {};
	const school = SPELL_TO_SCHOOL[spellName];
	if (!school) return "";
	const rec = c && c.castChance && c.castChance[school] || null;
	if (opts.itemCast) return kcHtml`<div style="font-size:.72rem;color:var(--forest);margin-top:2px">🎲 Cast chance: <strong>95%</strong> — worked from the item, whatever your own skill.</div>`;
	const lvl = rec ? rec.level : effMagicLvl(c, school);
	if (lvl <= 0) return kcHtml`<div style="font-size:.72rem;color:var(--crimson);margin-top:2px">🎲 No ${SKILL_LABELS[school] || school} skill yet — this cast will fail unless a Practice order earlier this turn raises it.</div>`;
	if (school === "necromancy" && c && c.necroAutoReady) return kcHtml`<div style="font-size:.72rem;color:var(--forest);margin-top:2px">🎲 Cast chance: <strong>100%</strong> — your Wailing Phylactery makes this turn's first Necromancy spell certain.</div>`;
	const chance = rec ? rec.chance : Math.min(95, 30 + lvl * 10);
	const bits = [`${SKILL_LABELS[school] || school} ${lvl}`];
	if (rec && rec.arcane) bits.push(`+${rec.arcane}% Arcane Codex`);
	if (rec && rec.mastery) bits.push(`+${rec.mastery}% school mastery`);
	if (rec && rec.discovery) bits.push(`+${rec.discovery}% discoveries`);
	const capped = chance >= 95 ? " — the 95% cap" : "";
	return kcHtml`<div style="font-size:.72rem;color:var(--forest);margin-top:2px">🎲 Cast chance: <strong>${chance}%</strong> (${bits.join(", ")}${capped}). A failed cast is spent — the spell fizzles and the phase is used.</div>`;
}
function chanceLine(txt, tone) {
	return kcHtml`<div style="font-size:.72rem;color:${tone === "bad" ? "var(--crimson)" : tone === "sure" ? "#2d6a2d" : "var(--forest)"};margin-top:2px">🎲 ${txt}</div>`;
}
function rebuildTargetWrap(charId, ph) {
	const wrap = document.getElementById(`po-target-wrap-${charId}-${ph}`);
	const c = (currentReport && currentReport.characters || []).find((x) => String(x.id) === String(charId));
	if (!wrap || !c) return;
	const saved = {
		action: document.getElementById(`po-action-${charId}-${ph}`)?.value || "",
		target: getOrderTarget(charId, ph),
		extra: getOrderExtra(charId, ph)
	};
	try {
		wrap.innerHTML = buildTargetField(c, ph, saved);
	} catch (e) {
		console.warn("target rebuild failed", e);
	}
	if (saved.action === "Practice Skill") refreshLaterCastSpells(charId, ph);
}
function orderChanceNote(c, action, ph) {
	const oc = c && c.orderChance || null;
	if (!oc) return "";
	const pct = (n) => kcHtml`<strong>${Math.max(0, Math.min(100, dispFloor(n)))}%</strong>`;
	switch (action) {
		case "Spy": {
			const o = oc.spy || {};
			if (o.auto) return chanceLine(kcHtml`Success is <strong>certain</strong> — ${o.autoWhy || "your craft"} never fails. Only an enemy's counter-espionage could trouble it.`, "sure");
			if (!o.level) return chanceLine(kcHtml`No Spy skill — ${pct(o.chance || 20)} at best. Espionage rewards training.`, "bad");
			return chanceLine(kcHtml`Success: ${pct(o.chance)} (Spy ${o.level}). A realm with Cipher Scripts is up to 25% harder to spy on.`);
		}
		case "Research": {
			const o = oc.research || {};
			if ((o.rawLevel || 0) < 1) return chanceLine("Research needs Sage 1+ — without it the archives yield nothing.", "bad");
			return chanceLine(kcHtml`Discovery: ${pct(o.chance)} (Sage ${o.level}). A failed search still passes the season; nothing else is lost. Each failed Research this turn makes the hero's next one ×1.2 likelier (a discovery resets it).`);
		}
		case "Assassinate": {
			const o = oc.assassinate || {};
			return chanceLine(kcHtml`Success: ${pct(o.chance)} (Spy ${o.level}) — but only ${pct(Math.max(0, o.chance - (o.kingPenalty || 25)))} against a king, who is heavily guarded. Failure is noticed.`);
		}
		case "Steal": {
			const o = oc.steal || {};
			return chanceLine(kcHtml`Success: ${pct(o.chance)} (Thief ${o.level}), halved if the target leads troops or the paymaster is guarded. Fail and you are seen unless you slip away (${pct(o.escape)}).`);
		}
		case "Grand Heist": {
			const o = oc.grandHeist || {};
			return chanceLine(kcHtml`Success: ${pct(o.chance)} (Thief ${o.level}), halved if the vaults are guarded — a garrison, or an enemy commander here with troops. Fail and you are seen unless you slip away (${pct(o.escape)}).`);
		}
		case "Blockade": return chanceLine(kcHtml`The blockade forms ${pct((oc.blockade || {}).chance || 50)} of the time — wind and tide decide the rest.`);
		case "Practice Skill": {
			const o = oc.practice || {};
			const by = o.byLevel || [
				25,
				20,
				15,
				10,
				5
			];
			const _pick = KC_SKILLS.indexOf(document.getElementById(`po-target-${c.id}-${ph}`)?.value || "");
			const sel = _pick >= 0 ? KC_SKILLS[_pick] : "";
			const lvl = sel ? Math.min(4, (c.skills || {})[sel] || 0) : null;
			const base = lvl == null ? null : by[lvl] + (o.astro || 0) + (o.discovery || 0) + (o.bySkill && sel ? o.bySkill[sel] || 0 : 0);
			const scale = `Chance falls as mastery grows: ${by.map((v, i) => `${v}% at ${i}`).join(", ")}.`;
			const extra = `Practising alongside someone of equal level adds half again; anyone of HIGHER level teaches you, and the lesson cannot fail. A run of failures makes the next attempt likelier.`;
			return chanceLine(base == null ? `${scale} ${extra}` : kcHtml`Improvement: ${pct(base)} at ${SKILL_LABELS[sel] || sel} ${lvl}. ${extra}`);
		}
		default: return "";
	}
}
var SPELL_TO_SCHOOL = {};
Object.entries(SPELLS_BY_SCHOOL).forEach(([school, list]) => list.forEach((s) => {
	SPELL_TO_SCHOOL[s] = school;
}));
var SPELL_REQ_LEVEL = {
	Sanctuary: 7,
	"Divine Judgment": 9,
	"Mass Confusion": 7,
	Dominate: 9,
	"Phantom Host": 7,
	Veil: 9,
	"Chain Lightning": 7,
	Cataclysm: 9,
	"Raise Wraiths": 7,
	"Death's Dominion": 9
};
var rawMagicLvl = (charObj, school) => (charObj && charObj.skills || {})[school] || 0;
var ITEM_UNCAPPED_SKILLS_P = new Set(KC_ITEM_UNCAPPED_SKILLS);
function effMagicLvl(charObj, school) {
	const base = (charObj && charObj.skills || {})[school] || 0;
	const bonus = (charObj && charObj.items || []).reduce((s, it) => s + (it && it.effect && it.effect.stat === school && itemUsableBy(it, charObj) && (!itemSlot(it) || it.equipped !== false) ? it.effect.bonus || 0 : 0), 0);
	return Math.max(0, Math.min(ITEM_UNCAPPED_SKILLS_P.has(school) ? 9 : 5, base + bonus));
}
function projectedMagicLevels(c, ph) {
	const practice = {};
	for (let prevPh = 0; prevPh < ph; prevPh++) {
		if ((document.getElementById(`po-action-${c.id}-${prevPh}`)?.value || "") !== "Practice Skill") continue;
		const t = getOrderTarget(c.id, prevPh);
		if (t && KC_MAGIC_SCHOOLS.includes(t)) practice[t] = (practice[t] || 0) + 1;
	}
	const projected = {};
	KC_MAGIC_SCHOOLS.forEach((school) => {
		const raw = rawMagicLvl(c, school), n = practice[school] || 0;
		const rawProj = raw >= 5 ? raw : Math.min(5, raw + n);
		projected[school] = effMagicLvl({
			...c,
			skills: {
				...c && c.skills || {},
				[school]: rawProj
			}
		}, school);
	});
	return {
		practising: new Set(Object.keys(practice)),
		projected,
		practice
	};
}
function refreshLaterCastSpells(charId, fromPh) {
	const c = (currentReport && currentReport.characters || []).find((x) => String(x.id) === String(charId));
	if (!c) return;
	for (let later = fromPh + 1; later <= 4; later++) {
		if ((document.getElementById(`po-action-${charId}-${later}`)?.value || "") !== "Cast Spell") continue;
		const wrap = document.getElementById(`po-target-wrap-${charId}-${later}`);
		if (!wrap) continue;
		const before = getOrderTarget(charId, later);
		const known = Object.keys(SPELL_TO_SCHOOL), at = known.indexOf(before);
		const spell = at >= 0 ? known[at] : "";
		const savedExtra = getOrderExtra(charId, later);
		try {
			wrap.innerHTML = buildTargetField(c, later, {
				action: "Cast Spell",
				target: spell,
				extra: ""
			});
		} catch (e) {
			console.warn("cast refresh failed", e);
		}
		const ex = document.getElementById(`po-extra-${charId}-${later}`);
		if (ex && savedExtra && getOrderTarget(charId, later) === spell && (ex.tagName !== "SELECT" || [...ex.options].some((o) => o.value === savedExtra))) ex.value = savedExtra;
		if (getOrderTarget(charId, later) !== before) {
			const l = later;
			setTimeout(() => {
				syncResurrectCard(charId, l);
				syncCharmCard(charId, l);
			}, 0);
		}
	}
}
var SPELL_HINTS = {
	Resurrect: "Target: a dead hero whose body lies in your caster’s province. Revives at full HP, stripped of all items and armies, and joins your command. Only a hero who never served ANOTHER realm can be raised — your own fallen, or a wanderer who was never in a rival’s pay; a hero who ever served another crown (even one later released or who deserted) will not answer. Your own fallen KING can also be recalled — their body is borne to your home province (or wealthiest if home is lost); only your most recently fallen monarch may be raised, and only by your realm. A resurrected king reclaims the throne; any reigning heir steps down to a normal hero.",
	"Part Sea": "Target: any sea OR land province you’re in or next to (so you can pre-empt a Flood). A sea province — including a land province flooded to sea earlier this turn — becomes dry plains for the rest of the turn (land armies may cross); no fleet may enter or leave from the next phase on. Cast on still-dry land it simply finds no sea to part. Cancels Flood.",
	"Bless Province": "Target: a province you’re in or adjacent to. +60% tax base at collection this turn (+80% for Divine realms; +100% when the Divine KING casts it). The ground is also warded — 50% + 5% per White level (counted to 5, so 50–75%) to turn aside each enemy Flood, Earthquake, Plague or Part Sea cast here this turn. One Bless per province — does not stack.",
	"Holy Symbol": "Action: no target — cleanses the province you stand in of ALL its battlefield dead. Every grave there is laid to rest and can never be raised by a necromancer. Combat: enemy −8%/level to hit and seared for 6% of its health, both ×1.5 against undead and fiends; you recover 10% of your health. Battle: enemy undead units fight at 75% strength.",
	Spiritwrack: "Combat: silences the target for 1 round + 1 per two White levels (max 3) — it can’t cast or use archery (it attacks instead) and its melee is halved. Against a guardian weak to White Magic it takes at 95% and lasts 1 round longer (max 4); Powerful and Legendary guardians may shrug it off each round after the first. Battle: all missile units fight at half strength.",
	Charm: "Target: a lone hero (wandering or enemy) leading NO armies, in your province. Wandering joins you free (you still pay upkeep); enemy comes under your command until end of turn, then returns to their lord (and will not attack their own lord's heroes). On success you learn their skills and magic items. Kings and army-leaders are immune; each past Charm gives a hero +30% resistance (cumulative). A Charm that fails may provoke a personal encounter with the target — unless either leads their encounter plan with Flee. Combat: doubles a later Flee attempt.",
	Oratory: "Target: yourself or an ally in your province. Every army travelling with them fights one quality tier higher for the rest of the turn. Not cumulative.",
	Clairvoyance: "Target: any enemy character you’ve ever seen, anywhere (not neutral or wandering heroes). You learn all that happens to them this turn — reported in your Realm Events — and see their full skills. At turn’s end you also know exactly where they stand: they are marked on your map and open to Encounter, even through Invisibility. Only one active at a time.",
	"Psychic Blast": "Target: an enemy/neutral hero in your province. They permanently lose TWO skill levels, each taken from a randomly chosen skill they hold (both picks can land on the same skill, dropping it by 2). Combat: they can do nothing at all for 1 round + 1 per two Psychic levels (3 at Psychic 5; doubled against a foe weak to Psychic; Dreamstone +1, after any doubling), unless a stun ward turns it. Battle: negates the enemy commander’s Druid.",
	"Telekinetic Storm": "Target: an enemy hero leading armies in your province. A number of their units equal to your skill level are struck: Green units are destroyed and every other struck unit PERMANENTLY drops one experience level (skeletal units unaffected). Combat: 12% of the target’s max HP, +3% per Psychic level (15% at 1, 27% at 5), as damage (you take a quarter of that). Battle: negates the enemy commander’s Tactical.",
	"Illusory Terrain": "Target: a province you’re in or adjacent to. Cloaks it in a false, ever-shifting terrain: enemies who fight there are disoriented, each unit fighting as if in the worst terrain for its kind (at least −15%). An enemy hero who enters dispels it at the end of that turn; 20%/turn natural fade.",
	"Phantasmal Armies": "Target: yourself or any friendly hero in your province. Spectral duplicates of their humanoid armies — 10% of the host per caster level, counted to level 5, at least one — march and fight with the real host for the rest of the turn. The doubles never appear in the roster, need no berth aboard ship, and melt away if their originals fall or the force is beaten.",
	"Hide Lairs": "Target: a province you’re in or adjacent to. Hides every lair there from all other players — they cannot discover any lair in it while the glamour holds (one already found stays theirs). 20% chance to fade each turn.",
	Invisibility: "Combat: enemies suffer −10%, and a further −4% per Illusory level (−14% at 1, −30% at 5), to hit you (melee and arrows) for the fight, +30% to Flee, and +15% to a following Steal. Action: cast on yourself — 80% chance no enemy player sees you (sightings, spies, Encounter targeting, the map) for the rest of the turn.",
	"Lightning Bolt": "Combat: 1–3 damage per caster level to your opponent. Battle: your-level enemy armies each lose 20% strength.",
	Fireball: "Combat: burns the target for 10% of its health each round, +2% per Elemental level (12% at 1, 20% at 5), for 3 rounds. Battle: the strongest enemy unit’s strength is halved.",
	Earthquake: "Target: a province you’re in or adjacent to. It yields no tax at the end of this turn.",
	Flood: "Target: a land province you’re in or adjacent to. It acts as a sea province for the rest of the turn (land armies stranded). Cancels Part Sea.",
	"Elemental Summon": "Summons a random elemental (Air/Fire/Earth/Water/Darkness, Veteran) to fight under you for the rest of the turn, then it dissolves. One per turn.",
	"Control Undead": "Target: an enemy/neutral hero here to seize one random undead unit — OR cast on THIS province to reveal the dead army units lying here one by one, AND to sense which surrounding provinces hold graves of their own (that they do, not how many or what). All of it is filed under Graveyards Known in your report. Combat: an undead foe is frozen for a round per Necromancy level (counted to 5), unless a stun ward turns it. Battle: one enemy undead unit defects.",
	"Skeletal Armies": "Raises the most experienced battlefield-grave units in your province as Skeletal (Undead) units under your command (1g upkeep each): 1 unit at Necromancy 1–2, 2 at Necromancy 3–4, 3 at Necromancy 5+ — never more than lie buried there. Needs fallen armies present.",
	Curse: "Target: an enemy/neutral hero here. EVERY skill they have is halved (rounded down) for the rest of the turn. Combat: their best combat ability halved. Battle: the enemy commander’s best combat skill (Tactical/Druid/Naval) halved.",
	"Hand of Death": "Combat: 10% per Necromancy level (at most 60%) to strike for 40% of the target’s max HP (×1.1 with Death’s Finger Ring).",
	Plague: "Target: your province or an adjacent one. Each humanoid unit has a (10% + 5%/level) chance to lose a level; survivors are immunised. Spreads to neighbours over the turn. Not cumulative."
};
function roundReportNumbers(text) {
	return String(text || "").replace(/(\u00d7\s*)?(?<![\d.])(\d+)\.(\d+)(?![.\d\u00d7])/g, (m, mult, whole, frac) => mult ? m : String(dispFloor(Number(whole + "." + frac))));
}
function armyLabel(a, opts = {}) {
	const name = a.unitName ? `${a.unitName}` : "";
	if (opts.short) return name ? `${name}` : `${a.quality} ${a.type}`;
	const primalWord = CREATURE_ARMIES_UI.has(a.type) ? "Creature" : MONSTER_ARMIES_UI.has(a.type) ? "Monster" : null;
	const race = a.race ? formatRace(a.race, a.type) : null;
	const lead = !!(a.race && HUMANOID_RACES_UI.has(a.race)) ? primalWord ? `${race} (${primalWord})` : race : primalWord || race;
	const str = unitBaseStrength(a);
	const _mv = a.moveRate != null && !opts.noMove ? `Move ${a.moveRate}${a.moveKind === "sea" ? " (sea)" : a.moveKind === "air" ? " (air)" : ""}` : null;
	const detail = [
		lead,
		a.type,
		a.quality,
		`Base str ${str}`,
		_mv
	].filter(Boolean).join(", ");
	const wild = a.wildHunt || a._wildHuntUntilTurn != null ? kcHtml` <span style="color:#7a4a10;font-size:.72rem">[Wild Hunt — bound until end of turn ${a.wildHuntUntil != null ? a.wildHuntUntil : a._wildHuntUntilTurn != null ? a._wildHuntUntilTurn : "?"}, no wages]</span>` : "";
	return kcHtml`${name ? `${name} (${detail})` : detail}${wild}`;
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
//#endregion
//#region src/ui/player/map-symbols.ts
var TERRAIN_COLORS_MAP = { ...KC_TERRAIN_COLORS };
function makeTerrainIcon(svgNS, cx, cy, terrain) {
	const els = [];
	const mk = (tag, attrs) => {
		const el = document.createElementNS(svgNS, tag);
		Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
		el.setAttribute("pointer-events", "none");
		return el;
	};
	switch (terrain) {
		case "sea":
			els.push(mk("path", {
				d: `M${cx - 8},${cy - 1} q4,-4 8,0 q4,4 8,0`,
				stroke: "rgba(255,255,255,0.55)",
				"stroke-width": "1.5",
				fill: "none"
			}));
			els.push(mk("path", {
				d: `M${cx - 6},${cy + 3} q3,-3 6,0 q3,3 6,0`,
				stroke: "rgba(255,255,255,0.35)",
				"stroke-width": "1",
				fill: "none"
			}));
			break;
		case "forest":
			[[cx - 8.5, cy - 3], [cx + .5, cy - 3]].forEach(([tx, ty]) => {
				els.push(mk("polygon", {
					points: `${tx},${ty + 6} ${tx + 4},${ty - 2} ${tx + 8},${ty + 6}`,
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
				points: `${cx - 10},${cy + 5} ${cx - 4},${cy - 5} ${cx + 2},${cy + 5}`,
				fill: "rgba(255,255,255,0.2)",
				stroke: "rgba(255,255,255,0.45)",
				"stroke-width": "0.8"
			}));
			els.push(mk("polygon", {
				points: `${cx - 2},${cy + 5} ${cx + 4},${cy - 4} ${cx + 10},${cy + 5}`,
				fill: "rgba(255,255,255,0.12)",
				stroke: "rgba(255,255,255,0.35)",
				"stroke-width": "0.8"
			}));
			break;
		case "desert":
			els.push(mk("path", {
				d: `M${cx - 12},${cy + 2} q6,-8 12,0 q6,8 12,0`,
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
	const parts = String(text).trim().split(/\.\s+/).map((s) => s.trim()).filter(Boolean);
	if (parts.length <= 1) return kcHtml`${bold(String(text))}`;
	return kcHtml`<ul style="margin:2px 0 0;padding-left:1.15em;line-height:1.45">${parts.map((p) => {
		const needsDot = !/[.!?]$/.test(p);
		return kcHtml`<li style="margin-bottom:4px">${bold(p)}${needsDot ? "." : ""}</li>`;
	})}</ul>`;
}
function neutralCharLabel(c) {
	return `${String(c && c.name || "").replace(/\s*\(wandering\)/gi, "").trim()} (${c && c.isNeutralGuard ? "local chieftain" : "wandering"})`;
}
function _hexRgb(hex) {
	if (!hex || typeof hex !== "string" || hex[0] !== "#" || hex.length !== 7) return null;
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
	return .2126 * f(rgb[0]) + .7152 * f(rgb[1]) + .0722 * f(rgb[2]);
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
	if (!pd || !pd.ownerName) return "Unclaimed";
	const r = currentReport || {};
	const known = r.diplomacy && r.diplomacy.known || [];
	const k = known.find((x) => pd.owner != null && x.index === pd.owner) || known.find((x) => x.name === pd.ownerName);
	const col = _tintForDarkTooltip(pd.ownerColor || k && k.color) || "#f2e8d0";
	const rel = k ? k.relation : null;
	const REL = {
		neutral: ["Neutral", "#e8d8b0"],
		allied: ["Allied", "#9be07a"],
		enemy: ["Enemy", "#ff7a6a"]
	};
	const tag = rel && REL[rel] ? kcHtml` <span style="color:${REL[rel][1]};font-weight:600">(${REL[rel][0]})</span>` : "";
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
function mapSymSvg(el, sym, fill) {
	const f = fill != null ? fill : sym.fill;
	if (sym.path) {
		const ns = "http://www.w3.org/2000/svg";
		const size = parseFloat(el.getAttribute("font-size")) || 8, sc = size / (sym.box || 10);
		const x = parseFloat(el.getAttribute("x")) || 0, y = parseFloat(el.getAttribute("y")) || 0;
		const g = document.createElementNS(ns, "g");
		g.setAttribute("transform", `translate(${x} ${y - size * .4}) scale(${sc})`);
		[
			"filter",
			"pointer-events",
			"opacity"
		].forEach((a) => {
			if (el.hasAttribute(a)) g.setAttribute(a, el.getAttribute(a));
		});
		const p = document.createElementNS(ns, "path");
		p.setAttribute("d", sym.path);
		p.setAttribute("fill-rule", "evenodd");
		if (f != null) p.setAttribute("fill", f);
		if (el.hasAttribute("stroke")) {
			p.setAttribute("stroke", el.getAttribute("stroke"));
			p.setAttribute("stroke-width", String((parseFloat(el.getAttribute("stroke-width")) || .3) / sc));
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
		const raw = colour != null ? colour : sym.fill || sym.legend;
		const col = raw ? _tintForDarkTooltip(raw) : "currentColor";
		const b = sym.box || 10, sz = size || "1em";
		return kcHtml`<svg viewBox="${-b / 2} ${-b / 2} ${b} ${b}" style="width:${sz};height:${sz};vertical-align:-0.15em" aria-hidden="true"><path d="${sym.path}" fill="${col}" fill-rule="evenodd" stroke="#000" stroke-width="0.4" paint-order="stroke" stroke-linejoin="round"></path></svg>`;
	}
	const vs = sym.text ? "︎" : "️";
	const raw = colour != null ? colour : sym.fill || sym.legend;
	return kcHtml`<span style="${sym.text && raw ? `color:${_tintForDarkTooltip(raw)};` : ""}font-family:${MAP_SYMBOL_FONT}${size ? ";font-size:" + size : ""}">${sym.glyph}${vs}</span>`;
}
function txtGlyph(ch, colour) {
	return kcHtml`<span style="${colour ? `color:${colour};` : ""}font-family:${MAP_SYMBOL_FONT}">${ch}︎</span>`;
}
function applyMapSymLegend(root) {
	(root || document).querySelectorAll("[data-mapsym]").forEach((el) => {
		const sym = MAP_SYM[el.getAttribute("data-mapsym")];
		if (!sym) return;
		el.innerHTML = mapSymHtml(sym, el.getAttribute("data-mapcolour") || null, el.getAttribute("data-mapsize") || "1rem");
		if (!el.getAttribute("title")) el.setAttribute("title", sym.label);
	});
}
function mapRaceBadgeHtml(race) {
	const rb = MAP_RACE_BADGE[race];
	if (!rb) return "";
	return kcHtml`<svg width="13" height="13" viewBox="0 0 13 13" style="vertical-align:-2px" aria-hidden="true"><circle cx="6.5" cy="6.5" r="6" fill="${rb.fill}"></circle><text x="6.5" y="9.2" text-anchor="middle" font-size="8" font-weight="700" font-family="Cinzel,serif" fill="${rb.text}">${rb.glyph}</text></svg>`;
}
function _lairStar(f) {
	const _pw = f.monsterPower || f.power;
	const col = _tintForDarkTooltip(GUARD_POWER_COLORS_P[_pw] || "#7a5510");
	const _tag = _pw ? kcHtml` <span style="font-size:.68rem;opacity:.8">(${_pw})</span>` : "";
	const _cat = !f.cleared && f.monsterCat ? kcHtml` <span style="font-size:.68rem;opacity:.7">${f.monsterCat.toLowerCase()}</span>` : "";
	return kcHtml`<span style="color:${col}">\u2b50 ${f.name}${_tag}${_cat}</span>`;
}
function _lairsClearedNote(pd) {
	if (!pd || pd.explored == null || pd.explored < 100) return "";
	const lairs = (pd.features || []).filter((f) => f && !f.ritualSite);
	if (lairs.length === 0) return kcHtml`<br><span style="color:${_tintForDarkTooltip("#6a7f5a")};font-style:italic">\u{1F5FA} Fully mapped \u2014 no lair was ever found in this province.</span>`;
	if (lairs.some((f) => !f.cleared)) return "";
	return kcHtml`<br><span style="color:${_tintForDarkTooltip("#4a8a4a")};font-weight:600">\u2705 Cleared of all lairs \u2014 ${lairs.length === 1 ? "its lair has" : `all ${lairs.length} lairs have`} been put to the sword. Nothing is left to fight here.</span>`;
}
var _graveIntelById = null;
var _graveIntelTurn = null;
function _rebuildGraveIntelIndex(report) {
	_graveIntelById = {};
	_graveIntelTurn = report && report.turnNumber != null ? report.turnNumber : null;
	(report && report.graveIntel || []).forEach((g) => {
		if (g && g.provinceId != null) _graveIntelById[g.provinceId] = g;
	});
}
function _garrisonNote(pd) {
	if (!pd || !(pd.tier === "owned" || pd.tier === "live")) return "";
	const g = pd.garrisonArmies || [];
	if (!g.length) return "";
	const col = _tintForDarkTooltip(pd.ownerColor) || "#e8d8b0";
	const counts = {};
	g.forEach((a) => {
		const k = a.type || "unit";
		counts[k] = (counts[k] || 0) + 1;
	});
	const list = Object.keys(counts).map((k) => `${unitEmoji(k)} ${counts[k] > 1 ? counts[k] + "× " : ""}${k}`).join(", ");
	return kcHtml`<br>\u{1F6E1} <span style="color:${col}">${g.length} unit${g.length !== 1 ? "s" : ""} garrisoned${pd.tier === "live" && pd.ownerName ? ` (${pd.ownerName})` : ""}</span> <span style="opacity:.8;font-size:.9em">— ${list}</span>`;
}
function _graveNote(pd) {
	if (!pd || pd.id == null || !_graveIntelById) return "";
	const g = _graveIntelById[pd.id];
	if (!g) return "";
	const sym = g.turn != null && _graveIntelTurn != null && g.turn === _graveIntelTurn ? MAP_SYM.gravesFresh : MAP_SYM.gravesStale;
	const gcol = _tintForDarkTooltip(sym.fill);
	const stamp = kcHtml`<span style="opacity:.75">(known turn ${g.turn != null ? g.turn : "?"})</span>`;
	if (g.detail && g.detail.length) {
		const list = g.detail.map((d) => `${d.n}× ${d.k}`).join(", ");
		return kcHtml`<br>${mapSymHtml(sym)} <span style="color:${gcol}">Battlefield graves: ${g.detailPartial ? "at least " : ""}${list}</span> ${stamp}${g.detailPartial ? kcHtml`<br><span style="opacity:.7;font-style:italic">Grave-sight names only the crack and elite — lesser dead may lie here unseen.</span>` : ""}`;
	}
	return kcHtml`<br>${mapSymHtml(sym)} <span style="color:${gcol}">Battlefield graves lie here</span> <span style="opacity:.7;font-style:italic">— how many, and what they hold, is unknown</span> ${stamp}`;
}
function _lairName(f) {
	if (!f) return "";
	const col = GUARD_POWER_COLORS_P[f.monsterPower || f.power] || null;
	return col ? kcHtml`<span style="color:${col}">${f.name}</span>` : f.name || "";
}
function terrorNoteP(pd, light) {
	const t = pd && pd.terror;
	if (!t || !(t.pct > 0)) return "";
	return kcHtml`<br><span style="color:${light ? "#701010" : "#e08a8a"}">\u{1F480} Terror ${t.pct}% \u2014 ${t.stacks} stack${t.stacks !== 1 ? "s" : ""}${t.byYou ? " of your own" : ""}: its next defenders fight at \u2212${t.pct}%${t.byYou ? " (yours are spared where you hold the ground)" : ""}</span>`;
}
function _grandDesignNote(pd) {
	const gd = pd && pd.grandDesign;
	if (!gd) return "";
	return kcHtml`<br><span style="color:#d8a63a;font-weight:600">\u{1F3DB} ${gd.name}</span><span style="opacity:.85"> \u2014 a Grand Design raised by <strong>${gd.ownerName || "a fallen realm"}</strong>${gd.active ? "." : ", dormant while another crown holds this ground."}</span>`;
}
var _GD_DESC_BY_NAME = null;
function grandDesignDesc(name) {
	if (!_GD_DESC_BY_NAME) {
		_GD_DESC_BY_NAME = {};
		try {
			Object.values(GD_BY_ALIGNMENT || {}).forEach((d) => {
				if (d && d.name) _GD_DESC_BY_NAME[d.name] = d.desc || "";
			});
		} catch (e) {}
	}
	return _GD_DESC_BY_NAME[name] || "";
}
function provinceGrandDesignHTML(p) {
	const gd = p && p.grandDesign;
	if (!gd) return "";
	const desc = grandDesignDesc(gd.name);
	const mine = !!gd.active;
	return kcHtml`<div style="margin-top:4px;border-left:3px solid ${mine ? "#8a6208" : "#7a7160"};background:${mine ? "#fdf3d8" : "#efe9dc"};border-radius:2px;padding:4px 7px">
      <div style="font-family:Cinzel,serif;font-size:.76rem;color:#4a3105;font-weight:700">\u{1F3DB} ${gd.name}
        <span style="font-weight:400;font-size:.7rem;color:${mine ? "#1d541d" : "#7a1010"}">\u2014 ${mine ? "active" : "dormant"}</span></div>
      ${desc ? kcHtml`<div style="font-size:.73rem;color:#2a2419;line-height:1.45;margin-top:1px">${desc}</div>` : ""}
      <div style="font-size:.68rem;color:#4a4335;margin-top:1px">Raised by <strong>${gd.ownerName || "a fallen realm"}</strong>.
        ${mine ? "A realm may raise only one Grand Design, and its powers last while that realm holds this province." : "Its powers serve only the realm that built it — while another crown holds this ground it is dormant stonework."}</div>
    </div>`;
}
function leadsArmiesP(x) {
	return x && x.leadsArmies != null ? !!x.leadsArmies : (x && x.armies || 0) > 0;
}
function spiedExtraP(s) {
	if (!s) return "";
	const h = [];
	if (Array.isArray(s.spiedItems)) h.push(kcHtml`<br><span style="color:#1d5a1d">🔍 Items:</span> ${s.spiedItems.length ? s.spiedItems.join(", ") : "none"}`);
	if (Array.isArray(s.spiedArmies)) h.push(kcHtml`<br><span style="color:#1d5a1d">🔍 Leads:</span> ${s.spiedArmies.length ? kcJoinP(s.spiedArmies.map((a) => armyLabel(a, { short: true })), ", ") : "no armies"}`);
	return h.length ? kcHtml`${h}` : "";
}
function popupKnownChars(pd, deadHeroes) {
	const chars = pd && pd.characters || [];
	const _deadSeen = /* @__PURE__ */ new Set();
	const dead = (deadHeroes || []).filter((d) => d.locationId === (pd && pd.id)).filter((d) => {
		if (_deadSeen.has(d.id)) return false;
		_deadSeen.add(d.id);
		return true;
	});
	const deadIds = new Set(dead.map((d) => d.id));
	if (!chars.length && !dead.length) return "";
	const cnt = (c) => c.armyBand ? c.armyBand === "no armies" ? "" : kcHtml` <span style="opacity:.7">(${c.armyBand})</span>` : c.armyCount > 0 ? kcHtml` <span style="opacity:.7">(${c.armyCount} unit${c.armyCount !== 1 ? "s" : ""})</span>` : "";
	const crown = (c) => c.isKing ? kcHtml`${txtGlyph("♛")} ` : "";
	const own = chars.filter((c) => c.isOwn && !deadIds.has(c.id));
	const enemy = chars.filter((c) => !c.isOwn && !c.isWanderer && !deadIds.has(c.id));
	const wand = chars.filter((c) => c.isWanderer && !deadIds.has(c.id));
	const s = [];
	const NEUTRAL_GREY = "#9a9a9a";
	own.forEach((c) => {
		const col = _tintForDarkTooltip(c.ownerColor) || "#f2e8d0";
		s.push(kcHtml`<br>\u{1F464} <span style="color:${col}">${crown(c)}${c.name}</span>${cnt(c)}`);
	});
	enemy.forEach((c) => {
		const col = _tintForDarkTooltip(c.ownerColor) || "#e05050";
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
	const ts = h && h.topSkill || topSkillOf(h);
	return ts ? `${skillFameLabelM(ts.level)} ${SKILL_LABELS[ts.skill] || ts.skill}` : "no notable skills";
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
var CHIEFTAIN_MARKER_COLOR = "#8f6a38";
function provLinkHtml(id, name, extraCls) {
	if (id == null || id === "") return name;
	return kcHtml`<span class="prov-link${extraCls ? " " + extraCls : ""}" onmouseenter="highlightMapProv(${kcArg(Number(id))},true)" onmouseleave="highlightMapProv(${kcArg(Number(id))},false)" onclick="locateOnMap(${kcArg(Number(id))})" title="Hover to light up ${name} on the map — click or tap to show it">${name}</span>`;
}
//#endregion
//#region src/ui/player/items-and-heroes.ts
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
	return (report && report.characters || []).filter((x) => {
		if (!x || x.alive === false) return false;
		if (isPreOrderIdP(x.id)) {
			if (ph == null) return false;
			if (ph <= (x.hiredInPhase ?? -1)) return false;
			if (x._charmEnemy && !(opts && opts.allowCharmEnemy)) return false;
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
	const rep = report || currentReport || {};
	if (playerIdx == null) return null;
	return (rep.allKingdoms || []).find((k) => k && k.index === playerIdx) || null;
}
function realmNameP(playerIdx, report) {
	const k = realmOfP(playerIdx, report);
	return k ? k.name : "enemy";
}
function realmOptStyleP(playerIdx, report) {
	const k = realmOfP(playerIdx, report);
	return k && k.color ? kcHtml` style="color:${reportColour(k.color)};font-weight:600"` : "";
}
function deadHeroRealmTagP(h, report, opts) {
	opts = opts || {};
	const rep = report || currentReport || {};
	const own = rep.playerIndex != null ? rep.playerIndex : null;
	const lead = opts.bare ? "" : "— ";
	if (h && h.player == null) return `${lead}a neutral hero, sworn to no crown`;
	if (h && own != null && h.player === own) return `${lead}your own hero`;
	const k = realmOfP(h ? h.player : null, rep);
	const nm = k && k.name || "another realm";
	const col = k && k.color ? opts.dark ? _tintForDarkTooltip(k.color) || "#e8b84b" : reportColour(k.color) : null;
	return kcHtml`${lead}a hero of <span style="${col ? `color:${col};` : ""}font-weight:600">${nm}</span>`;
}
function itemsForDisplayP(c) {
	const src = c && c.items || [];
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
	const n = it && it.tier || 1;
	const leg = n === 4;
	return kcHtml`<span style="color:${ITEM_TIER_COLOUR_P[n]};font-weight:${leg ? 700 : 600};font-size:.9em">${leg ? " ✨ Legendary" : " · " + ITEM_TIER_NAME_P[n]}</span>`;
}
function itemBoundTag(it, c) {
	if (!it || !it.race && !it.alignment) return "";
	const who = it.race ? `${itemRaceOf(it)} characters` : `${it.alignment} characters`;
	return itemUsableBy(it, c) ? "" : kcHtml` <span style="color:#7a1010;font-size:.72rem">[${who} only — unusable by this character]</span>`;
}
function itemSlotTag(it, c) {
	const sl = itemSlot(it);
	if (!sl) return kcHtml` <span style="color:#2a2419;font-size:.72rem">[carried — needs no slot]</span>`;
	const cap = ITEM_SLOT_CAP_P[sl] || 1;
	const used = c ? (c.items || []).filter((o) => o && itemSlot(o) === sl && o.equipped !== false && itemUsableBy(o, c)).length : it.equipped === false ? 0 : 1;
	const free = Math.max(0, cap - used);
	const st = it.equipped === false ? "not equipped" : "equipped";
	return kcHtml` <span style="color:${it.equipped === false ? "#5b5b5b" : "#43350f"};font-size:.72rem">[${ITEM_SLOT_LABEL_P[sl]} slot — ${st} · ${free} of ${cap} free]</span>`;
}
var RUMOUR_COST_BY_POWER_P = { ...KC_RUMOUR_COST_BY_POWER };
function updateRumourTarget(charId, ph) {
	const wrap = document.getElementById(`po-rumour-wrap-${charId}-${ph}`);
	const hidden = document.getElementById(`po-target-${charId}-${ph}`);
	if (!wrap || !hidden) return;
	const boxes = [...wrap.querySelectorAll("input[type=checkbox]")];
	hidden.value = boxes.filter((b) => b.checked).map((b) => b.value).join(",");
	const tot = document.getElementById(`po-rumour-total-${charId}-${ph}`);
	if (tot) {
		let sum = 0;
		boxes.filter((b) => b.checked).forEach((b) => {
			const m = (b.parentNode.textContent || "").match(/(\d+)g\s*$/);
			if (m) sum += parseInt(m[1]);
		});
		const cost = tot.querySelector("strong");
		if (cost) cost.textContent = `${sum}g`;
	}
}
function updateEquipTarget(charId, ph) {
	const wrap = document.getElementById(`po-equip-wrap-${charId}-${ph}`);
	const hidden = document.getElementById(`po-target-${charId}-${ph}`);
	if (!wrap || !hidden) return;
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
	"Perform Rite",
	"Consecrate",
	"Call to Arms",
	"Broker",
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
	"Defend",
	"Rest"
];
var ALIGN_ACTIONS = {
	"Perform Rite": "Pagan",
	Consecrate: "Divine",
	"Call to Arms": "Good",
	Broker: "Neutral",
	"Harvest the Field": "Undead"
};
var KING_ONLY_ACTIONS = /* @__PURE__ */ new Set([
	"Call to Arms",
	"Broker",
	"Consecrate"
]);
var GD_BY_ALIGNMENT = { ...KC_GRAND_DESIGNS };
function gdAlreadyBuiltP(report) {
	return ((report || currentReport || {}).discoveries || []).some((d) => d && d.id === "gd");
}
function gdHintFor(report) {
	const r = report || currentReport || {};
	const al = r.kingdom && r.kingdom.alignment || null;
	const gd = al ? GD_BY_ALIGNMENT[al] : null;
	if (!gd) return L79_ORDERS["Grand Design"].hint;
	return kcHtml`Sage 9 · ONCE EVER, and only in a province you hold. Your ${al} realm raises the <strong>${gd.name}</strong> — ${gd.desc} The Wonder stands in the province it is built in: hold that ground and its blessing flows, lose the province and the blessing lapses until you take it back. The Wonder itself is never destroyed, and a conqueror gains nothing from it but the view.`;
}
var rawSkillLvl = (charObj, sk) => (charObj && charObj.skills || {})[sk] || 0;
var skillsUnseenP = (c) => !!(c && (c._hiddenSkills || c._unknownSkills));
var unseenSuffixP = (c) => c && c._unknownSkills ? `${c && c.name || "this hero"}’s level is not known until they have joined` : `${c && c.name || "this hero"}’s level is hidden from you`;
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
function actionsFor(c) {
	const align = currentReport?.kingdom?.alignment;
	return ACTIONS.filter((a) => {
		if (ALIGN_ACTIONS[a] && ALIGN_ACTIONS[a] !== align) return false;
		if (KING_ONLY_ACTIONS.has(a) && !(c && c.isKing)) return false;
		if (L79_ORDERS[a] && skillsUnseenP(c)) return false;
		if (a === "Grand Design" && gdAlreadyBuiltP(currentReport)) return false;
		if (L79_ORDERS[a] && !skillsUnseenP(c) && rawSkillLvl(c, L79_ORDERS[a].skill) < L79_ORDERS[a].lvl) return false;
		if (a === "Research" && !skillsUnseenP(c) && rawSkillLvl(c, "sage") < 1) return false;
		if (a === "Steal" && !skillsUnseenP(c) && rawSkillLvl(c, "thief") < 1) return false;
		if (a === "Release Hero" && c && c.isKing) return false;
		if (c && c._hiddenSkills && (a === "Send Item" || a === "Give Item" || a === "Use Item" || a === "Release Hero")) return false;
		if (c && c._charmEnemy && (L79_ORDERS[a] || ALIGN_ACTIONS[a] || a === "Disband Army")) return false;
		return true;
	}).sort((a, b) => _actionRank(a) - _actionRank(b));
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
	return (currentReport && currentReport.pendingDiscoveryChoices || []).filter((p) => p && p.key && Array.isArray(p.options) && p.options.length);
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
	w.innerHTML = kcHtml`<div style="font-size:.72rem;color:var(--stone);margin-bottom:6px">Your scholars turned up two leads for each discovery below, but only one can be pursued. Keep one — the other is <strong>forgotten for good</strong> and will never come up again. Left unchosen, one is kept at random.</div>${_pendingDiscChoices().map((p, i) => kcHtml`<div style="${i ? "border-top:1px solid var(--parchment-dark);margin-top:8px;padding-top:8px;" : ""}">
      <div style="font-family:Cinzel,serif;font-size:.78rem;font-weight:600;color:var(--ink);margin-bottom:4px">Found by ${p.charName || "a scholar"}${p.category ? ` — ${p.category} research` : ""}${p.turn ? ` (turn ${p.turn})` : ""}</div>
      ${p.options.map((o) => kcHtml`<label style="display:flex;align-items:flex-start;gap:8px;padding:5px 6px;margin:3px 0;border:1px solid ${discoveryChoices[p.key] === o.id ? "var(--forest)" : "var(--parchment-dark)"};border-radius:3px;background:${discoveryChoices[p.key] === o.id ? "#e8f1dc" : "#fffdf6"};cursor:pointer;font-size:.76rem;line-height:1.4">
          <input type="radio" name="dc-${p.key}" value="${o.id}" ${discoveryChoices[p.key] === o.id ? "checked" : ""} onchange="setDiscoveryChoice(${kcArg(String(p.key))},${kcArg(String(o.id))})" style="margin-top:3px">
          <span><strong>${o.name}</strong> <span style="color:var(--stone)">(${o.category})</span><br>${o.desc}</span>
        </label>`)}
    </div>`)}`;
}
function setDiscoveryChoice(key, id) {
	discoveryChoices[key] = id;
	renderDiscoveryChoices();
}
function renderConcede() {
	const w = document.getElementById("concede-wrap");
	if (!w) return;
	if ((currentReport?.kingdom || {}).conceded) {
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
//#endregion
//#region src/ui/player/start.ts
kcDbGuard(sb, KC_DB_MIN).then(() => init().catch((err) => {
	console.error("Init error:", err);
	document.getElementById("spinner").textContent = "Error loading — please refresh. (" + err.message + ")";
}));
//#endregion
//#region src/ui/shared/a-newer-version-of-this-page.ts
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
//#endregion
//#region src/ui/shared/the-reload-banner.ts
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
//#endregion
//#region src/ui/player/globals.ts
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
//#endregion
