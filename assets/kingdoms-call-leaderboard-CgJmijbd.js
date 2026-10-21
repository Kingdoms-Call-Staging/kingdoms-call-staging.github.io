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
//#region src/ui/leaderboard/main.ts
if (typeof KC_CONFIG === "undefined") throw new Error("kc-config.js did not load: reload the page.");
var SUPABASE_URL = KC_CONFIG.supabaseUrl;
var SUPABASE_ANON_KEY = KC_CONFIG.supabaseKey;
var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
var KC_DB_MIN = "20261012064100";
globalThis.GAMES = [];
var TAB = "champions";
var GM = false;
var OVERLORD = false;
var ME = null;
var PEOPLE = {};
var canEdit = (g) => OVERLORD || !!(ME && g && g.gm_user_id === ME.id);
var personName = (st) => {
	if (!st) return null;
	if (st.uid && PEOPLE[st.uid]) return PEOPLE[st.uid];
	if (st.player && st.player !== st.realm) return st.player;
	return null;
};
var isLegacyRow = (g) => !(g && /lb[2-9]/.test(String(g.build || ""))) || !(g && (g.standings || []).some((st) => st && !st.bot && st.uid));
function whoOf(e) {
	const st = (e.g && e.g.standings || []).find((x) => x && x.pi === e.pi);
	if (st) return {
		realm: st.realm,
		player: personName(st),
		race: st.race,
		al: st.al,
		bot: !!st.bot,
		uid: st.uid || null
	};
	return {
		realm: e.realm || null,
		player: e.player || null,
		race: e.race || null,
		al: e.al || null,
		bot: !!e.bot,
		uid: null
	};
}
var $ = (id) => document.getElementById(id);
var nf = (n) => n == null || !isFinite(n) ? "—" : Number(n).toLocaleString("en-NZ", { maximumFractionDigits: 2 });
var dstr = (s) => {
	if (!s) return "—";
	const d = new Date(s);
	return isNaN(d) ? "—" : d.toLocaleDateString("en-NZ", {
		day: "numeric",
		month: "short",
		year: "numeric"
	});
};
var KC_CAT = [
	["realm", "👑 Realm & dominion"],
	["conquest", "⚔ Conquest"],
	["armies", "🛡 Hosts & armies"],
	["battles", "💥 Battles"],
	["lairs", "🐉 Lairs & guardians"],
	["heroes", "🎖 Champions"],
	["skills", "📖 Skills at their height"],
	["titles", "🏅 Imperial Titles"],
	["magic", "✨ Magic"],
	["finish", "🏁 At the final Reckoning"],
	["dubious", "💀 Dubious honours"],
	["games", "🌍 The games themselves"],
	["other", "❓ Other records"]
];
var KC_ACH = {
	most_provinces: {
		c: "realm",
		l: "Widest realm",
		n: "Most provinces held at one moment",
		f: "int"
	},
	most_land: {
		c: "realm",
		l: "Greatest landholder",
		n: "Most land provinces held at once",
		f: "int"
	},
	most_sea: {
		c: "realm",
		l: "Master of the waves",
		n: "Most sea provinces held at once",
		f: "int"
	},
	top_tax_share: {
		c: "realm",
		l: "Shadow over the world",
		n: "Greatest share of the world’s tax base",
		f: "pct"
	},
	richest: {
		c: "realm",
		l: "Fullest treasury",
		n: "Most gold held at one moment",
		f: "int"
	},
	gold_gain_turn: {
		c: "realm",
		l: "Greatest windfall",
		n: "Most gold gained in a single turn",
		f: "int"
	},
	str_gain_turn: {
		c: "realm",
		l: "Fastest muster",
		n: "Most army strength raised in one turn",
		f: "int"
	},
	most_explored: {
		c: "realm",
		l: "Great explorer",
		n: "Most provinces ever seen by a realm",
		f: "int"
	},
	most_discoveries: {
		c: "realm",
		l: "Most learned realm",
		n: "Most discoveries held at once",
		f: "int"
	},
	most_consecrated: {
		c: "realm",
		l: "Most holy ground",
		n: "Most consecrated provinces held",
		f: "int"
	},
	most_relics: {
		c: "realm",
		l: "Greatest relic hoard",
		n: "Most legendary relics held by one realm",
		f: "int"
	},
	most_heroes: {
		c: "realm",
		l: "Largest court",
		n: "Most living heroes serving at once",
		f: "int"
	},
	most_units_realm: {
		c: "realm",
		l: "Most under arms",
		n: "Most units in a realm at one time",
		f: "int"
	},
	largest_garrison: {
		c: "realm",
		l: "Strongest garrisons",
		n: "Greatest garrison strength held",
		f: "int"
	},
	captures_turn: {
		c: "conquest",
		l: "Blitzkrieg",
		n: "Most provinces taken in a single turn",
		f: "int"
	},
	captures_game: {
		c: "conquest",
		l: "Great conqueror",
		n: "Most provinces taken across a game",
		f: "int"
	},
	richest_capture: {
		c: "conquest",
		l: "Richest prize",
		n: "Highest tax value of a province taken",
		f: "int"
	},
	fastest_ten: {
		c: "conquest",
		l: "Fastest to ten provinces",
		n: "Earliest turn a realm reached ten",
		f: "turn",
		d: "min"
	},
	mightiest_host: {
		c: "armies",
		l: "Mightiest realm",
		n: "Greatest total army strength, led and garrisoned",
		f: "int"
	},
	biggest_field_army: {
		c: "armies",
		l: "Greatest army in the field",
		n: "Strongest host under a single commander",
		f: "int"
	},
	most_units_one_char: {
		c: "armies",
		l: "Most units under one banner",
		n: "Most units led by one character",
		f: "int"
	},
	grand_armada: {
		c: "armies",
		l: "Grand armada",
		n: "Strongest fleet and sea-beast host led by one commander",
		f: "int"
	},
	sky_host: {
		c: "armies",
		l: "Host of the air",
		n: "Strongest airborne host led by one commander",
		f: "int"
	},
	beast_host: {
		c: "armies",
		l: "Host of beasts",
		n: "Strongest creature and monster host led by one commander",
		f: "int"
	},
	horse_host: {
		c: "armies",
		l: "Host of horse",
		n: "Strongest cavalry host led by one commander",
		f: "int"
	},
	arrow_storm: {
		c: "armies",
		l: "Storm of arrows",
		n: "Strongest ranged host led by one commander",
		f: "int"
	},
	undead_legion: {
		c: "armies",
		l: "Undead legion",
		n: "Most skeletal units led by one commander",
		f: "int"
	},
	biggest_battle: {
		c: "battles",
		l: "Biggest battle",
		n: "Greatest combined strength on a field",
		f: "int"
	},
	biggest_pvp: {
		c: "battles",
		l: "Greatest clash of realms",
		n: "Biggest battle between two players",
		f: "int"
	},
	bloodiest_battle: {
		c: "battles",
		l: "Bloodiest battle",
		n: "Most units destroyed in one battle",
		f: "int"
	},
	greatest_upset: {
		c: "battles",
		l: "Greatest upset",
		n: "Won a battle at the longest odds of strength",
		f: "x",
		d: "min"
	},
	stubbornest_defence: {
		c: "battles",
		l: "Most stubborn defence",
		n: "Held the field against the heaviest odds",
		f: "x",
		d: "min"
	},
	flawless_victory: {
		c: "battles",
		l: "Flawless victory",
		n: "Most enemy strength broken without losing a unit",
		f: "int"
	},
	longest_siege: {
		c: "battles",
		l: "Longest battle",
		n: "Most carried-over rounds of fighting",
		f: "int"
	},
	battles_turn: {
		c: "battles",
		l: "Busiest turn of war",
		n: "Most battles fought by a realm in one turn",
		f: "int"
	},
	battles_game: {
		c: "battles",
		l: "Most battles in a game",
		n: "By one realm across the whole game",
		f: "int"
	},
	battles_won_game: {
		c: "battles",
		l: "Most victories in a game",
		n: "Battles won by one realm",
		f: "int"
	},
	kills_turn: {
		c: "battles",
		l: "Deadliest turn",
		n: "Most enemy units destroyed in one turn",
		f: "int"
	},
	kills_game: {
		c: "battles",
		l: "Most enemy units destroyed",
		n: "By one realm across a game",
		f: "int"
	},
	best_win_rate: {
		c: "battles",
		l: "Finest record of arms",
		n: "Best battle win rate (four battles or more)",
		f: "pct"
	},
	guardian_slain: {
		c: "lairs",
		l: "Greatest guardian slain",
		n: "Strongest band of guardian beaten in a lair",
		f: "power"
	},
	luckiest_kill: {
		c: "lairs",
		l: "Luckiest guardian kill",
		n: "Beat a Powerful or Legendary guardian with the fewest hit points left",
		f: "hp",
		d: "min"
	},
	narrowest_escape: {
		c: "lairs",
		l: "Narrowest escape",
		n: "Won a lair fight on the fewest hit points",
		f: "hp",
		d: "min"
	},
	hardest_fight: {
		c: "lairs",
		l: "Hardest-won lair",
		n: "Most damage taken and still victorious",
		f: "int"
	},
	lairs_turn: {
		c: "lairs",
		l: "Most lairs cleared in a turn",
		n: "By one realm",
		f: "int"
	},
	lairs_game: {
		c: "lairs",
		l: "Great lair-breaker",
		n: "Most lairs cleared across a game",
		f: "int"
	},
	deadliest_guardian: {
		c: "lairs",
		l: "Deadliest guardian",
		n: "The strongest guardian to slay a champion",
		f: "power"
	},
	greatest_hero: {
		c: "heroes",
		l: "Greatest champion",
		n: "Highest total of all skill levels on one character",
		f: "int"
	},
	most_items_one_char: {
		c: "heroes",
		l: "Best-equipped champion",
		n: "Most magic items carried at once",
		f: "int"
	},
	hardiest: {
		c: "heroes",
		l: "Hardiest champion",
		n: "Highest maximum hit points reached",
		f: "int"
	},
	deadliest_champion: {
		c: "heroes",
		l: "Deadliest champion",
		n: "Most enemy characters slain by one character",
		f: "int"
	},
	champions_slain: {
		c: "heroes",
		l: "Slayer of champions",
		n: "Most enemy characters slain by a realm",
		f: "int"
	},
	kingslayer: {
		c: "heroes",
		l: "Kingslayer",
		n: "Most enemy kings slain by a realm",
		f: "int"
	},
	spells_turn: {
		c: "magic",
		l: "Storm of sorcery",
		n: "Most spells cast by a realm in one turn",
		f: "int"
	},
	spells_game: {
		c: "magic",
		l: "Greatest sorcery",
		n: "Most spells cast across a game",
		f: "int"
	},
	longest_shot: {
		c: "magic",
		l: "Longest shot",
		n: "The least likely casting that still took",
		f: "pct",
		d: "min"
	},
	grandest_casting: {
		c: "magic",
		l: "Grandest casting",
		n: "Highest spell level successfully cast",
		f: "int"
	},
	favourite_spell: {
		c: "magic",
		l: "Signature spell",
		n: "The spell one realm leaned on hardest in a game",
		f: "int"
	},
	final_score: {
		c: "finish",
		l: "Highest final score",
		n: "At the Reckoning",
		f: "int"
	},
	final_provinces: {
		c: "finish",
		l: "Largest realm at the end",
		f: "int"
	},
	final_gold: {
		c: "finish",
		l: "Richest at the end",
		f: "int"
	},
	final_strength: {
		c: "finish",
		l: "Strongest at the end",
		f: "int"
	},
	final_tax_share: {
		c: "finish",
		l: "Greatest share at the end",
		f: "pct"
	},
	losses_turn: {
		c: "dubious",
		l: "Heaviest day",
		n: "Most of a realm’s own units destroyed in one turn",
		f: "int"
	},
	losses_game: {
		c: "dubious",
		l: "Heaviest losses",
		n: "Most of a realm’s own units destroyed across a game",
		f: "int"
	},
	lost_turn: {
		c: "dubious",
		l: "Worst turn",
		n: "Most provinces lost in a single turn",
		f: "int"
	},
	lost_game: {
		c: "dubious",
		l: "Greatest collapse",
		n: "Most provinces lost across a game",
		f: "int"
	},
	worst_rout: {
		c: "dubious",
		l: "Worst rout",
		n: "Most units lost in a single battle",
		f: "int"
	},
	champions_lost: {
		c: "dubious",
		l: "Heaviest toll",
		n: "Most of a realm’s own characters killed in a game",
		f: "int"
	},
	deaths_turn: {
		c: "dubious",
		l: "Blackest day",
		n: "Most of a realm’s characters killed in one turn",
		f: "int"
	},
	flights_game: {
		c: "dubious",
		l: "Better part of valour",
		n: "Most flights from lair fights in a game",
		f: "int"
	},
	failed_spells_game: {
		c: "dubious",
		l: "Fizzled",
		n: "Most failed castings in a game",
		f: "int"
	},
	earliest_out: {
		c: "dubious",
		l: "Shortest reign",
		n: "Earliest turn a realm was eliminated or conceded",
		f: "turn",
		d: "min"
	},
	longest_game: {
		c: "games",
		l: "Longest game",
		f: "int"
	},
	shortest_game: {
		c: "games",
		l: "Shortest game",
		f: "int",
		d: "min"
	},
	most_realms: {
		c: "games",
		l: "Most realms in a game",
		f: "int"
	},
	most_humans: {
		c: "games",
		l: "Most human players",
		f: "int"
	},
	biggest_world: {
		c: "games",
		l: "Biggest world",
		n: "Provinces on the map",
		f: "int"
	},
	most_battles_game: {
		c: "games",
		l: "Most battles in one game",
		f: "int"
	},
	bloodiest_game: {
		c: "games",
		l: "Bloodiest game",
		n: "Units destroyed in total",
		f: "int"
	},
	most_captures_game: {
		c: "games",
		l: "Most provinces changing hands",
		f: "int"
	},
	most_deaths_game: {
		c: "games",
		l: "Most characters killed",
		f: "int"
	},
	most_lairs_game: {
		c: "games",
		l: "Most lairs fought",
		f: "int"
	},
	most_spells_game: {
		c: "games",
		l: "Most spells cast",
		f: "int"
	}
};
var POWER_WORD = [
	"—",
	"Weak",
	"Moderate",
	"Powerful",
	"Legendary"
];
function achDef(key) {
	if (KC_ACH[key]) return KC_ACH[key];
	if (key.indexOf("sk_") === 0) return {
		c: "skills",
		l: null,
		f: "int"
	};
	if (key.indexOf("title_") === 0) return {
		c: "titles",
		l: null,
		f: "int"
	};
	return {
		c: "other",
		l: null,
		f: "int"
	};
}
function achLabel(key, rec) {
	if (rec && rec.lbl) return rec.lbl;
	const d = KC_ACH[key];
	if (d && d.l) return d.l;
	return key.replace(/^sk_/, "Highest ").replace(/^title_/, "Title: ").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
function fmtVal(v, f) {
	if (v == null) return "—";
	switch (f) {
		case "pct": return nf(v) + "%";
		case "x": return nf(v) + "×";
		case "power": return POWER_WORD[Math.max(0, Math.min(4, Math.round(v)))] || nf(v);
		case "hp": return nf(v) + " hp";
		case "turn": return "turn " + nf(v);
		default: return nf(v);
	}
}
async function loadAll(force) {
	const msg = $("msg");
	try {
		const { data: { session } } = await sb.auth.getSession();
		ME = session ? session.user : null;
	} catch (e) {
		ME = null;
	}
	GM = false;
	OVERLORD = false;
	if (ME && new URLSearchParams(location.search).get("gm") === "1") try {
		const [{ data }, ov] = await Promise.all([sb.from("games").select("id").eq("gm_user_id", ME.id).limit(1), sb.rpc("is_site_admin")]);
		OVERLORD = !!(ov && !ov.error && ov.data === true);
		GM = OVERLORD || !!(data && data.length);
	} catch (e) {
		GM = false;
		OVERLORD = false;
	}
	$("gm-pill").innerHTML = GM ? "<span class=\"btn btn-gold\" style=\"cursor:default\">✏ GM editing on</span>" : "";
	$("show-hidden-wrap").style.display = GM ? "inline-flex" : "none";
	const rows = [];
	try {
		for (let from = 0;; from += 200) {
			const { data, error } = await sb.from("game_records").select("*").order("finished_at", { ascending: false }).range(from, from + 199);
			if (error) throw error;
			rows.push(...data || []);
			if (!data || data.length < 200) break;
		}
	} catch (e) {
		$("spinner").style.display = "none";
		$("main").style.display = "block";
		msg.innerHTML = kcHtml`<div class="msg-error"><strong>The Hall of Fame could not be read.</strong> ${e.message || e}<br>If you are the Game Master, open the GM portal — the game list shows the one statement to run in Supabase that creates the <code>game_records</code> table.</div>`;
		$("body").innerHTML = "";
		return;
	}
	GAMES = rows.map((r) => ({
		...r,
		setup: jp(r.setup) || {},
		standings: jp(r.standings) || [],
		records: jp(r.records) || {},
		totals: jp(r.totals) || {}
	}));
	PEOPLE = {};
	try {
		const { data: profs } = await sb.from("profiles").select("id,name");
		(profs || []).forEach((r) => {
			if (r && r.id && r.name) PEOPLE[r.id] = r.name;
		});
	} catch (e) {}
	msg.innerHTML = GAMES.length ? "" : "<div class=\"msg-info\">No finished games have been recorded yet. A game joins the Hall of Fame the moment it ends; the GM can also add older games from the GM portal’s Stats tab.</div>";
	buildFilterOptions();
	$("spinner").style.display = "none";
	$("main").style.display = "block";
	render();
}
function jp(v) {
	if (v == null) return null;
	if (typeof v === "string") try {
		return JSON.parse(v);
	} catch (e) {
		return null;
	}
	return v;
}
function buildFilterOptions() {
	const opt = (sel, vals, fmt) => {
		const el = $(sel), cur = el.value;
		el.replaceChildren(el.options[0], ...vals.map((v) => new Option(String(fmt ? fmt(v) : v), String(v))));
		el.value = cur;
	};
	const uniqNum = (k) => [...new Set(GAMES.map((g) => g.setup[k]).filter((v) => v != null))].sort((a, b) => a - b);
	opt("f-bots", uniqNum("bots"));
	opt("f-realms", uniqNum("realms"));
	opt("f-humans", uniqNum("humans"));
	opt("f-map", [...new Set(GAMES.map(mapKey).filter(Boolean))].sort());
}
function mapKey(g) {
	const s = g.setup || {};
	return s.cols && s.rows ? s.cols + "×" + s.rows : s.mapSize || null;
}
function filtered() {
	const v = (id) => $(id).value, q = (v("f-q") || "").trim().toLowerCase();
	const from = v("f-from") ? /* @__PURE__ */ new Date(v("f-from") + "T00:00:00") : null;
	const to = v("f-to") ? /* @__PURE__ */ new Date(v("f-to") + "T23:59:59") : null;
	const showHidden = GM && $("f-hidden").checked;
	return GAMES.filter((g) => {
		const s = g.setup || {}, bots = s.bots || 0, humans = s.humans != null ? s.humans : (s.realms || 0) - bots;
		if (g.hidden && !showHidden) return false;
		const kind = v("f-kind");
		if (kind === "human" && bots > 0) return false;
		if (kind === "withbots" && bots < 1) return false;
		if (kind === "allbot" && humans > 0) return false;
		if (kind === "mixed" && !(bots > 0 && humans > 0)) return false;
		if (v("f-bots") !== "" && String(bots) !== v("f-bots")) return false;
		if (v("f-diplo") !== "" && (s.diplomacy || "normal") !== v("f-diplo")) return false;
		if (v("f-realms") !== "" && String(s.realms || "") !== v("f-realms")) return false;
		if (v("f-humans") !== "" && String(humans) !== v("f-humans")) return false;
		if (v("f-map") !== "" && mapKey(g) !== v("f-map")) return false;
		const sp = s.seaPct;
		if (v("f-sea") === "lo" && !(sp != null && sp < 30)) return false;
		if (v("f-sea") === "mid" && !(sp != null && sp >= 30 && sp <= 45)) return false;
		if (v("f-sea") === "hi" && !(sp != null && sp > 45)) return false;
		if (v("f-vic") !== "" && (g.victory || "") !== v("f-vic")) return false;
		const t = g.turns || 0;
		if (v("f-len") === "s" && !(t <= 10)) return false;
		if (v("f-len") === "m" && !(t > 10 && t <= 20)) return false;
		if (v("f-len") === "l" && !(t > 20)) return false;
		if (from && new Date(g.finished_at || 0) < from) return false;
		if (to && new Date(g.finished_at || 0) > to) return false;
		if (q) {
			if ([
				g.game_name,
				g.winner_realm,
				g.note
			].concat((g.standings || []).map((x) => [
				x.realm,
				x.player,
				personName(x)
			].filter(Boolean).join(" "))).join(" ").toLowerCase().indexOf(q) < 0) return false;
		}
		return true;
	});
}
function resetFilters() {
	[
		"f-kind",
		"f-bots",
		"f-diplo",
		"f-realms",
		"f-humans",
		"f-map",
		"f-sea",
		"f-vic",
		"f-len"
	].forEach((i) => $(i).value = "");
	$("f-from").value = "";
	$("f-to").value = "";
	$("f-q").value = "";
	if ($("f-hidden")) $("f-hidden").checked = false;
	render();
}
function setTab(t) {
	TAB = t;
	[
		"champions",
		"achievements",
		"peoples",
		"games"
	].forEach((x) => $("tb-" + x).classList.toggle("active", x === t));
	render();
}
function render() {
	const G = filtered();
	$("filter-count").textContent = `${G.length} of ${GAMES.length} recorded game${GAMES.length === 1 ? "" : "s"}`;
	const el = $("body");
	if (!GAMES.length) {
		el.innerHTML = "";
		$("foot").textContent = "";
		return;
	}
	if (!G.length) {
		el.innerHTML = "<div class=\"card\"><div class=\"msg-warning\">No recorded game matches these filters.</div></div>";
		return;
	}
	if (TAB === "champions") el.innerHTML = renderChampions(G);
	else if (TAB === "achievements") el.innerHTML = renderAchievements(G);
	else if (TAB === "peoples") el.innerHTML = renderPeoples(G);
	else el.innerHTML = renderGames(G);
	const last = G.map((g) => g.finished_at).filter(Boolean).sort().slice(-1)[0];
	$("foot").textContent = "Kingdoms Call — Hall of Fame · most recent game recorded " + dstr(last);
}
function lbDiagnostics(G) {
	const legacy = G.filter(isLegacyRow);
	let humanSlots = 0, withUid = 0, named = 0;
	G.forEach((g) => (g.standings || []).forEach((st) => {
		if (!st || st.bot) return;
		humanSlots++;
		if (st.uid) withUid++;
		if (personName(st)) named++;
	}));
	const builds = [...new Set(G.map((g) => String(g.build || "unknown")))];
	const newest = (G.slice().sort((a, b) => String(b.finished_at || "").localeCompare(String(a.finished_at || "")))[0] || {}).build || "—";
	const peopleN = Object.keys(PEOPLE).length;
	const warn = [];
	if (legacy.length) warn.push(kcHtml`<div class="msg-warning" style="margin:8px 0 0"><strong>${legacy.length} of ${G.length} games were recorded by an older build of the GM portal</strong>, which stored the realm name where the player's name belongs. Those games show no player until they are rebuilt.<br>
    In the GM portal: check its footer shows <strong>a build from 27 September 2026 or later</strong> first — if it does not, hard-reload it (Ctrl/Cmd+Shift+R), because a cached copy will rebuild with the same fault. Then 📈 Stats → <strong>↻ Rebuild all</strong>.</div>`);
	if (!peopleN) warn.push(kcHtml`<div class="msg-warning" style="margin:8px 0 0"><strong>No player names could be read from the <code>profiles</code> table on this page</strong> — names stored with each game are being used instead. If you are signed out, sign in to the player or GM portal in this browser first. If you are signed in, the <code>profiles</code> table needs a SELECT policy covering this account.</div>`);
	if (peopleN && withUid && !named) warn.push(kcHtml`<div class="msg-warning" style="margin:8px 0 0"><strong>${withUid} player slots carry an account, but none of them matches a row in <code>profiles</code>.</strong> Those accounts have no profile row, or no name in it. Each player can set one with <strong>✏ Change Display Name</strong> in the player portal; you can set it here with the ✏ beside their line once they appear.</div>`);
	return kcHtml`<div class="card"><h2>🔧 Diagnostics <span class="muted" style="font-weight:400">— only you see this</span></h2>
    <table class="kc">
      <tr><th>Games on the board</th><td class="num">${G.length}</td><td class="muted">${legacy.length} recorded by an older build</td></tr>
      <tr><th>Newest row built by</th><td colspan="2"><code>${newest}</code></td></tr>
      <tr><th>Builds present</th><td colspan="2" class="muted">${builds.join(" · ")}</td></tr>
      <tr><th>Human realms</th><td class="num">${humanSlots}</td><td class="muted">${withUid} carry a player account · ${named} resolve to a name</td></tr>
      <tr><th>Names read from profiles</th><td class="num">${peopleN}</td><td class="muted">${peopleN ? "read live, so a rename shows everywhere at once" : "falling back to the name stored with each game"}</td></tr>
    </table>${warn}</div>`;
}
function winnerName(g) {
	const st = (g.standings || []).find((x) => x && x.winner);
	return st && personName(st) || g.winner_player || null;
}
function pctBar(n, d) {
	const p = d ? Math.round(100 * n / d) : 0;
	return kcHtml`<div class="bar" title="${p}%"><i style="width:${p}%"></i></div>`;
}
function renderChampions(G) {
	const byPlayer = {};
	G.forEach((g) => (g.standings || []).forEach((st) => {
		if (!st || st.bot) return;
		const nm = personName(st);
		const key = st.uid || (nm ? "name:" + nm : null);
		if (!key) return;
		const a = byPlayer[key] = byPlayer[key] || {
			key,
			uid: st.uid || null,
			name: nm || "(name not recorded)",
			games: 0,
			wins: 0,
			podium: 0,
			rankSum: 0,
			ranked: 0,
			score: 0,
			best: 0,
			titles: 0,
			realms: /* @__PURE__ */ new Set()
		};
		a.games++;
		if (st.winner) a.wins++;
		if (st.rank) {
			a.ranked++;
			a.rankSum += st.rank;
			if (st.rank <= 3) a.podium++;
		}
		a.score += st.score || 0;
		a.best = Math.max(a.best, st.score || 0);
		a.titles += (st.titles || []).length;
		if (st.realm) a.realms.add(st.realm);
	}));
	const rows = Object.values(byPlayer).sort((a, b) => b.wins - a.wins || b.wins / b.games - a.wins / a.games || b.score - a.score);
	const out = [];
	if (GM) out.push(lbDiagnostics(G));
	out.push(kcHtml`<div class="card"><h2>🏆 Champions — the players</h2>`);
	out.push(kcHtml`<div class="muted" style="margin-bottom:9px">One line per person, however many realms they have ruled. Realm names change from game to game; the player does not.${OVERLORD ? " As the Overlord you can correct a player’s name here — it changes their name everywhere on the board, past games included." : ""}</div>`);
	if (!rows.length) out.push(kcHtml`<div class="msg-info">No human players in the games that match these filters.</div>`);
	else {
		out.push(kcHtml`<table class="kc" id="champ-table"><tr><th>#</th><th>Player</th><th class="num">Games</th><th class="num">Wins</th><th>Win rate</th><th class="num">Top 3</th><th class="num">Avg rank</th><th class="num">Best score</th><th class="num">Titles</th><th>Realms ruled</th>${OVERLORD ? kcHtml`<th></th>` : ""}</tr>`);
		rows.forEach((r, i) => {
			const rl = [...r.realms];
			out.push(kcHtml`<tr><td>${i + 1}</td><td><strong>${r.name}</strong></td><td class="num">${r.games}</td><td class="num">${r.wins}</td>`, kcHtml`<td style="min-width:90px">${pctBar(r.wins, r.games)}<span class="muted">${Math.round(100 * r.wins / r.games)}%</span></td>`, kcHtml`<td class="num">${r.podium}</td><td class="num">${r.ranked ? (r.rankSum / r.ranked).toFixed(1) : "—"}</td>`, kcHtml`<td class="num">${nf(r.best)}</td><td class="num">${r.titles}</td>`, kcHtml`<td class="muted">${rl.slice(0, 4).join(", ")}${rl.length > 4 ? " +" + (rl.length - 4) : ""}</td>`, OVERLORD ? kcHtml`<td>${r.uid ? kcHtml`<button class="btn btn-ghost" style="font-size:.6rem;padding:3px 8px" onclick="renamePlayer(${kcArg(r.uid)})">✏</button>` : kcHtml`<span class="muted" title="This player has no account on record — nothing to rename">—</span>`}</td>` : "", kcHtml`</tr>`);
		});
		out.push(kcHtml`</table><div id="rename-msg"></div>`);
	}
	out.push(kcHtml`</div>`);
	let hG = 0, hW = 0, bG = 0, bW = 0;
	G.forEach((g) => (g.standings || []).forEach((st) => {
		if (st.bot) {
			bG++;
			if (st.winner) bW++;
		} else {
			hG++;
			if (st.winner) hW++;
		}
	}));
	out.push(kcHtml`<div class="card"><h2>⚖ Humans against the bots</h2><table class="kc">`, kcHtml`<tr><th>Side</th><th class="num">Realms played</th><th class="num">Wins</th><th>Win rate</th></tr>`, kcHtml`<tr><td>Human realms</td><td class="num">${hG}</td><td class="num">${hW}</td><td style="min-width:110px">${pctBar(hW, hG)}<span class="muted">${hG ? Math.round(100 * hW / hG) : 0}%</span></td></tr>`, kcHtml`<tr><td>Bot realms</td><td class="num">${bG}</td><td class="num">${bW}</td><td>${pctBar(bW, bG)}<span class="muted">${bG ? Math.round(100 * bW / bG) : 0}%</span></td></tr>`, kcHtml`</table><div class="muted" style="margin-top:7px">A win rate is per realm, so in a fair four-realm race every realm sits at 25%.</div></div>`);
	const perf = [];
	G.forEach((g) => (g.standings || []).forEach((st) => perf.push({
		g,
		st
	})));
	perf.sort((a, b) => (b.st.score || 0) - (a.st.score || 0));
	out.push(kcHtml`<div class="card"><h2>⭐ Finest single campaigns</h2><table class="kc">`, kcHtml`<tr><th>#</th><th>Realm</th><th>Player</th><th class="num">Score</th><th class="num">Provinces</th><th class="num">Strength</th><th class="num">Titles</th><th>Game</th><th>Date</th></tr>`);
	perf.slice(0, 20).forEach((p, i) => {
		out.push(kcHtml`<tr><td>${i + 1}</td><td><strong>${p.st.realm}</strong>${p.st.winner ? kcHtml`<span class="pill pill-green">won</span>` : ""}</td>`, kcHtml`<td>${p.st.bot ? kcHtml`<span class="pill pill-grey">bot</span>` : personName(p.st) || "—"}</td>`, kcHtml`<td class="num">${nf(p.st.score)}</td><td class="num">${nf(p.st.prov)}</td><td class="num">${nf(p.st.str)}</td><td class="num">${(p.st.titles || []).length}</td>`, kcHtml`<td class="muted">${p.g.game_name}</td><td class="muted">${dstr(p.g.finished_at)}</td></tr>`);
	});
	out.push(kcHtml`</table></div>`);
	return kcHtml`${out}`;
}
function renderAchievements(G) {
	const q = ($("f-q") && $("f-q").value || "").trim().toLowerCase();
	const whoMatch = (st) => !!q && [
		st.realm,
		st.player,
		personName(st)
	].filter(Boolean).join(" ").toLowerCase().indexOf(q) >= 0;
	const byKey = {};
	let narrowed = false;
	G.forEach((g) => {
		const mine = new Set((g.standings || []).filter((st) => st && whoMatch(st)).map((st) => st.pi));
		if (mine.size) narrowed = true;
		Object.entries(g.records || {}).forEach(([k, r]) => {
			(Array.isArray(r) ? r : [r]).forEach((e) => {
				if (!e || e.v == null) return;
				if (mine.size && !mine.has(e.pi)) return;
				(byKey[k] = byKey[k] || []).push({
					...e,
					g
				});
			});
		});
	});
	const cats = {};
	Object.keys(byKey).forEach((k) => {
		const d = achDef(k);
		(cats[d.c] = cats[d.c] || []).push(k);
	});
	const out = [];
	out.push(kcHtml`<div class="card"><h2>🎖 Achievements</h2><div class="muted">${narrowed ? "Showing only the realms and players matching your search — every one of their bests, in every game that matches your filters." : "Every record below is among the best ever recorded in a game matching your filters. Each realm's best in each game counts. Type a realm or player into Search to see all of their own records."}</div></div>`);
	KC_CAT.forEach(([cat, title]) => {
		const keys = (cats[cat] || []).sort((a, b) => achLabel(a, byKey[a][0]).localeCompare(achLabel(b, byKey[b][0])));
		if (!keys.length) return;
		out.push(kcHtml`<div class="card"><h2>${title}</h2><div class="ach-grid">`);
		keys.forEach((k) => {
			const def = achDef(k), dir = byKey[k][0].d === "min" || def.d === "min" ? "min" : "max";
			const list = byKey[k].slice().sort((a, b) => dir === "min" ? a.v - b.v : b.v - a.v).slice(0, 8);
			out.push(kcHtml`<div class="ach"><div class="t">${achLabel(k, list[0])}</div>`);
			if (def.n) out.push(kcHtml`<div class="n">${def.n}</div>`);
			out.push(kcHtml`<ol>`);
			list.forEach((e, i) => {
				const id = whoOf(e);
				const who = e.who ? kcHtml`${e.who} · ` : "";
				const realm = id.realm ? id.realm : e.pi == null ? kcHtml`<span class="muted">the game itself</span>` : "—";
				const owner = id.player ? kcHtml` <span class="muted">(${id.player})</span>` : id.bot ? kcHtml` <span class="pill pill-grey">bot</span>` : "";
				const bits = [];
				if (id.race) bits.push(id.race);
				if (id.al) bits.push(id.al);
				if (e.t != null) bits.push("turn " + e.t);
				if (e.det) bits.push(e.det);
				bits.push((e.g.game_name == null ? "" : e.g.game_name) + " · " + dstr(e.g.finished_at));
				out.push(kcHtml`<li class="${i === 0 ? "top1" : ""}"><span class="v">${fmtVal(e.v, def.f)}</span><span class="w">${who}${realm}${owner}<span class="sm">${bits.join(" · ")}</span></span></li>`);
			});
			out.push(kcHtml`</ol></div>`);
		});
		out.push(kcHtml`</div></div>`);
	});
	return kcHtml`${out}`;
}
function renderPeoples(G) {
	const tally = (pick) => {
		const m = {};
		G.forEach((g) => (g.standings || []).forEach((st) => {
			const k = pick(st);
			if (!k) return;
			const a = m[k] = m[k] || {
				k,
				n: 0,
				w: 0,
				score: 0,
				prov: 0
			};
			a.n++;
			if (st.winner) a.w++;
			a.score += st.score || 0;
			a.prov += st.prov || 0;
		}));
		return Object.values(m).sort((a, b) => b.w / b.n - a.w / a.n || b.n - a.n);
	};
	const tbl = (title, rows, head) => {
		if (!rows.length) return "";
		const out = [kcHtml`<div class="card"><h2>${title}</h2><table class="kc"><tr><th>${head}</th><th class="num">Realms</th><th class="num">Wins</th><th>Win rate</th><th class="num">Avg score</th><th class="num">Avg provinces</th></tr>`];
		rows.forEach((r) => {
			out.push(kcHtml`<tr><td><strong>${r.k}</strong></td><td class="num">${r.n}</td><td class="num">${r.w}</td>`, kcHtml`<td style="min-width:100px">${pctBar(r.w, r.n)}<span class="muted">${Math.round(100 * r.w / r.n)}%</span></td>`, kcHtml`<td class="num">${nf(Math.round(r.score / r.n))}</td><td class="num">${nf(Math.round(10 * r.prov / r.n) / 10)}</td></tr>`);
		});
		out.push(kcHtml`</table></div>`);
		return kcHtml`${out}`;
	};
	return kcHtml`${[
		tbl("🧭 By race", tally((s) => s.race), "Race"),
		tbl("☯ By creed", tally((s) => s.al), "Alignment"),
		tbl("🔀 By race and creed", tally((s) => s.race && s.al ? s.race + " · " + s.al : null), "Race · Alignment"),
		tbl("🎲 By how the game ended", (() => {
			const m = {};
			G.forEach((g) => {
				const k = g.victory || "unfinished";
				const a = m[k] = m[k] || {
					k,
					n: 0,
					w: 0,
					score: 0,
					prov: 0
				};
				a.n++;
				a.w += 0;
				a.score += g.turns || 0;
				a.prov += g.setup.realms || 0;
			});
			return Object.values(m).map((a) => ({
				k: a.k,
				n: a.n,
				w: 0,
				score: a.score,
				prov: a.prov
			})).sort((a, b) => b.n - a.n);
		})(), "Victory")
	]}`;
}
function renderGames(G) {
	const out = [kcHtml`<div class="card"><h2>📜 Every recorded game</h2>`];
	out.push(kcHtml`<div class="muted" style="margin-bottom:9px">Newest first. Click a game to see its final standings.${GM ? OVERLORD ? " As the Overlord you can rename any game, change its date, add a note, hide it from the board, or delete it." : " As a Game Master you can rename your own games, change their date, add a note, hide them from the board, or delete them." : ""}</div>`);
	out.push(kcHtml`<table class="kc"><tr><th>Date</th><th>Game</th><th class="num">Turns</th><th>Realms</th><th>Bots</th><th>Map</th><th>Won by</th><th>How</th>${GM ? kcHtml`<th></th>` : ""}</tr>`);
	G.forEach((g) => {
		const s = g.setup || {}, bots = s.bots || 0, humans = s.humans != null ? s.humans : (s.realms || 0) - bots;
		const dip = s.diplomacy === "hostile" ? kcHtml`<span class="pill pill-red">aggressive</span>` : bots ? kcHtml`<span class="pill pill-grey">normal</span>` : "";
		out.push(kcHtml`<tr class="gamerow${g.hidden ? " hidden-row" : ""}" onclick="toggleGame(${kcArg(g.game_id)})">`, kcHtml`<td class="muted">${dstr(g.finished_at)}</td>`, kcHtml`<td><strong>${g.game_name}</strong>${g.hidden ? kcHtml`<span class="pill pill-amber">hidden</span>` : ""}${g.note ? kcHtml`<span class="sm muted"> · ${g.note}</span>` : ""}</td>`, kcHtml`<td class="num">${g.turns || "—"}</td>`, kcHtml`<td>${s.realms || "—"} <span class="muted">(${humans}👤 ${bots}🤖)</span></td>`, kcHtml`<td>${bots ? kcHtml`${bots}${dip}` : kcHtml`<span class="pill pill-green">all human</span>`}</td>`, kcHtml`<td class="muted">${mapKey(g) || "—"}${s.seaPct != null ? " · " + s.seaPct + "% sea" : ""}</td>`, kcHtml`<td>${g.winner_realm || "—"}${winnerName(g) ? kcHtml` <span class="muted">(${winnerName(g)})</span>` : g.winner_is_bot ? kcHtml` <span class="pill pill-grey">bot</span>` : ""}</td>`, kcHtml`<td class="muted">${g.victory || "—"}</td>`, GM ? kcHtml`<td>${canEdit(g) ? kcHtml`<button class="btn btn-ghost" style="font-size:.6rem;padding:3px 8px" onclick="event.stopPropagation();toggleEdit(${kcArg(g.game_id)})">✏</button>` : ""}</td>` : "", kcHtml`</tr>`);
		out.push(kcHtml`<tr id="det-${g.game_id}" style="display:none"><td colspan="${GM ? 9 : 8}">${gameDetail(g)}</td></tr>`);
	});
	out.push(kcHtml`</table></div>`);
	return kcHtml`${out}`;
}
function gameDetail(g) {
	const out = [kcHtml`<div style="padding:4px 0 8px">`];
	out.push(kcHtml`<table class="kc"><tr><th class="num">Rank</th><th>Realm</th><th>Player</th><th>Race</th><th>Creed</th><th class="num">Score</th><th class="num">Provinces</th><th class="num">Gold</th><th class="num">Strength</th><th class="num">Titles</th><th>Fate</th></tr>`);
	(g.standings || []).forEach((st) => {
		out.push(kcHtml`<tr><td class="num">${st.rank || "—"}</td><td><strong>${st.realm}</strong>${st.winner ? kcHtml`<span class="pill pill-green">victor</span>` : ""}</td>`, kcHtml`<td>${st.bot ? kcHtml`<span class="pill pill-grey">bot</span>` : personName(st) || "—"}</td><td>${st.race || "—"}</td><td>${st.al || "—"}</td>`, kcHtml`<td class="num">${nf(st.score)}</td><td class="num">${nf(st.prov)}</td><td class="num">${nf(st.gold)}</td><td class="num">${nf(st.str)}</td><td class="num">${(st.titles || []).length}</td>`, kcHtml`<td class="muted">${st.outHow ? st.outHow + (st.outTurn ? " turn " + st.outTurn : "") : "survived"}</td></tr>`);
	});
	out.push(kcHtml`</table>`);
	const t = g.totals || {};
	out.push(kcHtml`<div class="muted" style="margin-top:7px">${nf(t.battles || 0)} battles · ${nf(t.casualties || 0)} units destroyed · ${nf(t.captures || 0)} provinces changed hands · ${nf(t.lairs || 0)} lair fights · ${nf(t.spells || 0)} spells cast · ${nf(t.deaths || 0)} characters killed · started ${dstr(g.started_at)}${GM ? kcHtml` · recorded by <code>${g.build || "unknown"}</code>` : ""}</div>`);
	if (GM && canEdit(g)) {
		const d = (g.finished_at || "").slice(0, 10);
		out.push(kcHtml`<div class="gmbox" id="edit-${g.game_id}" style="display:none">
      <h4>Game Master — edit this record</h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px">
        <div><label>Name on the board</label><input type="text" id="e-name-${g.game_id}" value="${g.game_name}"></div>
        <div><label>Date played</label><input type="date" id="e-date-${g.game_id}" value="${d}"></div>
        <div style="grid-column:1/-1"><label>Note</label><input type="text" id="e-note-${g.game_id}" value="${g.note || ""}" placeholder="e.g. the first Reckoning played to the wire"></div>
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">
        <button class="btn btn-gold" style="font-size:.66rem" onclick="saveGame(${kcArg(g.game_id)})">Save</button>
        <button class="btn btn-ghost" style="font-size:.66rem" onclick="setHidden(${kcArg(g.game_id)},${g.hidden ? "false" : "true"})">${g.hidden ? "👁 Show on the board" : "🚫 Hide from the board"}</button>
        <button class="btn btn-crimson" style="font-size:.66rem;margin-left:auto" onclick="deleteRecord(${kcArg(g.game_id)},false)">🗑 Remove from the board</button>
        <button class="btn btn-crimson" style="font-size:.66rem" onclick="deleteRecord(${kcArg(g.game_id)},true)">☠ Delete all of its data</button>
      </div>
      <div class="muted" style="margin-top:6px"><strong>Remove from the board</strong> deletes this Hall-of-Fame entry only; the game’s recorded turns stay, so the GM portal can rebuild it. <strong>Delete all of its data</strong> also deletes its recorded turns and results — that cannot be undone and the entry can never come back.</div>
      <div id="e-msg-${g.game_id}"></div>
    </div>`);
	}
	out.push(kcHtml`</div>`);
	return kcHtml`${out}`;
}
function toggleGame(id) {
	const r = $("det-" + id);
	if (r) r.style.display = r.style.display === "none" ? "table-row" : "none";
}
function toggleEdit(id) {
	const r = $("det-" + id);
	if (r && r.style.display === "none") r.style.display = "table-row";
	const b = $("edit-" + id);
	if (b) b.style.display = b.style.display === "none" ? "block" : "none";
}
async function saveGame(id) {
	const msg = $("e-msg-" + id);
	const name = $("e-name-" + id).value.trim(), note = $("e-note-" + id).value.trim(), date = $("e-date-" + id).value;
	const patch = {
		game_name: name || null,
		note: note || null
	};
	if (date) patch.finished_at = (/* @__PURE__ */ new Date(date + "T12:00:00")).toISOString();
	const { error } = await sb.from("game_records").update(patch).eq("game_id", id);
	if (error) {
		msg.innerHTML = kcHtml`<div class="msg-error">${error.message}</div>`;
		return;
	}
	msg.innerHTML = "<div class=\"msg-success\">Saved.</div>";
	const g = GAMES.find((x) => x.game_id === id);
	if (g) Object.assign(g, patch);
	setTimeout(() => render(), 500);
}
async function setHidden(id, hide) {
	const { error } = await sb.from("game_records").update({ hidden: hide }).eq("game_id", id);
	if (error) {
		alert(error.message);
		return;
	}
	const g = GAMES.find((x) => x.game_id === id);
	if (g) g.hidden = hide;
	render();
}
async function renamePlayer(uid) {
	const cur = PEOPLE[uid] || "";
	const name = prompt("Player name on the leaderboard.\n\nThis is the person, not their realm — it changes on every game they have played.", cur);
	if (name == null) return;
	const t = name.trim();
	const msg = $("rename-msg");
	if (!t) {
		if (msg) msg.innerHTML = "<div class=\"msg-warning\">A player needs a name — nothing changed.</div>";
		return;
	}
	const { error } = await sb.rpc("rename_player", {
		p_user: uid,
		p_name: t
	});
	if (error) {
		if (msg) msg.innerHTML = kcHtml`<div class="msg-error"><strong>Could not rename that player.</strong> ${error.message}</div>`;
		return;
	}
	PEOPLE[uid] = t;
	render();
	const m2 = $("rename-msg");
	if (m2) m2.innerHTML = kcHtml`<div class="msg-success">Renamed to ${t} — on every game they have played.</div>`;
}
async function deleteRecord(id, purge) {
	const g = GAMES.find((x) => x.game_id === id);
	const nm = g ? g.game_name : id;
	const q = purge ? `Delete EVERYTHING recorded about “${nm}” — its Hall-of-Fame entry, its result rows and every recorded turn? This cannot be undone.` : `Remove “${nm}” from the Hall of Fame? Its recorded turns are kept, so the GM portal can rebuild the entry later.`;
	if (!confirm(q)) return;
	let err = null;
	const r1 = await sb.from("game_records").delete().eq("game_id", id);
	err = err || r1.error;
	if (purge) {
		const r2 = await sb.from("game_results").delete().eq("game_id", id);
		err = err || r2.error;
		const r3 = await sb.from("turn_events").delete().eq("game_id", id);
		err = err || r3.error;
	}
	if (err) {
		alert(err.message);
		return;
	}
	GAMES = GAMES.filter((x) => x.game_id !== id);
	buildFilterOptions();
	render();
}
kcDbGuard(sb, KC_DB_MIN).then(() => loadAll());
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
//#region src/ui/leaderboard/globals.ts
Object.assign(window, {
	deleteRecord,
	loadAll,
	renamePlayer,
	render,
	resetFilters,
	saveGame,
	setHidden,
	setTab,
	toggleEdit,
	toggleGame
});
Object.assign(window, {
	$,
	filtered
});
//#endregion
