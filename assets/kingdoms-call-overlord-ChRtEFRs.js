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
// src/ui/shared/the-pages-element-with-the-id.ts
/** The element of `page` with the id `id`, of the kind `kind`. Throws a TypeError naming the id when the page holds no
*  element with it, or holds one of another kind. `page` is the page's own document unless a test hands another. */
function theElementWithTheId(id, kind, page = document) {
	const found = page.getElementById(id);
	if (found === null) throw new TypeError(`the page holds no element with the id "${id}"`);
	if (!(found instanceof kind)) throw new TypeError(`the page's element with the id "${id}" is a <${found.tagName.toLowerCase()}>, not of the kind asked for`);
	return found;
}
// src/ui/overlord/main.ts
if (typeof KC_CONFIG === "undefined") throw new Error("kc-config.js did not load: reload the page.");
var thePagesDb = makeThePagesDatabase(KC_CONFIG.supabaseUrl, KC_CONFIG.supabaseKey, { auth: { storageKey: "kc-overlord-auth" } }).db;
var KC_DB_MIN = "20261015051826";
var ME = null;
var ACCOUNTS = [];
var ACCOUNTS_ERROR = "";
var GAMES = [];
var GAMES_ERROR = "";
var REPORTS = [];
var REALMS = {};
var REVOKING = null;
var DELETING = null;
var $ = (id) => theElementWithTheId(id, HTMLElement);
/** A value of any kind handed to el() as a child (a summary's turn mode), as el() reads it: a list's items each in turn,
*  any other object or a symbol as its words. */
function theChildAsElReadsIt(v) {
	if (Array.isArray(v)) return v.map(theChildAsElReadsIt);
	if (v instanceof Node || v == null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
	return theWordsOf(v);
}
/** A value of any kind in words, as String() writes it. */
function theWordsOf(v) {
	return String(v);
}
/** Whether a child is a list of children. */
function isAListOfChildren(c) {
	return Array.isArray(c);
}
/** The listener an `on…` attribute holds; for anything else, the TypeError addEventListener threw for it. */
function theListenerIn(v) {
	if (typeof v === "function") return v;
	throw new TypeError("Failed to execute 'addEventListener' on 'EventTarget': parameter 2 is not of type 'Object'.");
}
/** The children handed in, flattened, nothing left out, each a node or its words (what append and replaceChildren
*  make of a child that isn't a node). */
function theNodesAndWordsOf(kids) {
	const out = [];
	const add = (c) => {
		if (isAListOfChildren(c)) c.forEach(add);
		else if (c instanceof Node) out.push(c);
		else if (c != null && c !== false) out.push(String(c));
	};
	kids.forEach(add);
	return out;
}
function el(tag, props, ...kids) {
	const e = document.createElement(tag);
	for (const [k, v] of Object.entries(props ?? {})) {
		if (v == null || v === false) continue;
		if (k === "class") e.className = String(v);
		else if (k.startsWith("on")) e.addEventListener(k.slice(2), theListenerIn(v));
		else e.setAttribute(k, v === true ? "" : String(v));
	}
	theNodesAndWordsOf(kids).forEach((c) => {
		e.append(c);
	});
	return e;
}
var fill = (id, ...kids) => {
	$(id).replaceChildren(...theNodesAndWordsOf(kids));
};
var day = (v) => v ? theWordsOf(v).slice(0, 10) : "—";
function say(kind, text) {
	fill("msg", text ? el("div", { class: "msg-" + kind }, text) : null);
}
function section(id) {
	[
		"sec-auth",
		"sec-denied",
		"sec-main"
	].forEach((s) => $(s).classList.toggle("on", s === id));
}
async function init() {
	$("spinner").style.display = "none";
	const { data: { session } } = await thePagesDb.signingIn.theSessionKeptInThisBrowser();
	if (session?.user) {
		ME = session.user;
		onSignedIn();
	} else section("sec-auth");
}
async function doSignIn() {
	const email = theElementWithTheId("si-email", HTMLInputElement).value.trim(), password = theElementWithTheId("si-password", HTMLInputElement).value;
	if (!email || !password) {
		fill("auth-msg", el("div", { class: "msg-error" }, "Enter your email and password."));
		return;
	}
	fill("auth-msg", el("div", { class: "msg-info" }, "Signing in…"));
	const { data, error } = await thePagesDb.signingIn.signInWithEmailAndPassword(email, password);
	if (error) {
		fill("auth-msg", el("div", { class: "msg-error" }, error.message.includes("Invalid login") ? "Email or password incorrect." : error.message));
		return;
	}
	fill("auth-msg");
	ME = theAccountSignedIn(data) ?? (await thePagesDb.signingIn.theSessionKeptInThisBrowser()).data.session?.user ?? null;
	if (ME) onSignedIn();
}
async function doSignOut() {
	await thePagesDb.signingIn.signOut();
	ME = null;
	ACCOUNTS = [];
	GAMES = [];
	REPORTS = [];
	REALMS = {};
	REVOKING = null;
	DELETING = null;
	section("sec-auth");
}
async function onSignedIn() {
	const { data, error } = await thePagesDb.theRoles.isTheSignedInAccountTheOverlord();
	if (error || data !== true) {
		const m = $("denied-msg");
		m.className = error ? "msg-error" : "msg-info";
		m.textContent = error ? `Couldn't check whether you're the Overlord (${error.message}). Reload to try again.` : "This page is for the Overlord.";
		section("sec-denied");
		return;
	}
	$("me-email").textContent = theSignedInAccount().email ?? "";
	section("sec-main");
	await loadAll();
}
function theAccountSignedIn(answer) {
	return answer?.user ?? null;
}
function theSignedInAccount() {
	if (ME === null) throw new TypeError("Cannot read properties of null (reading 'email')");
	return ME;
}
async function loadAll() {
	fill("accounts", el("div", { class: "msg-info" }, "Loading…"));
	fill("games", el("div", { class: "msg-info" }, "Loading…"));
	fill("reports", el("div", { class: "msg-info" }, "Loading…"));
	await Promise.all([loadAccounts(), loadGames()]);
	renderAccounts();
	renderGames();
	await loadReports();
}
async function loadAccounts() {
	const { data, error } = await thePagesDb.theOverlordsAccounts.everyAccountAsTheOverlordSeesIt();
	ACCOUNTS = error ? null : data ?? [];
	ACCOUNTS_ERROR = error ? error.message : "";
}
async function loadGames() {
	const rows = [];
	for (let from = 0;; from += 200) {
		const { data, error } = await thePagesDb.theOverlordsGames.everyGameNewestFirstFromRowToRow(from, from + 199);
		if (error) {
			GAMES = null;
			GAMES_ERROR = error.message;
			return;
		}
		rows.push(...data ?? []);
		if (!data || data.length < 200) break;
	}
	GAMES = rows;
}
async function loadReports() {
	const { data, error } = await thePagesDb.theReportedDispatches.theDispatchesReportedToThisAccount(null);
	if (error) {
		fill("reports", el("div", { class: "msg-error" }, error.message));
		return;
	}
	REPORTS = Array.isArray(data) ? data : [];
	const ids = [...new Set(REPORTS.map((r) => r.game_id))];
	REALMS = {};
	if (ids.length) {
		const { data: slots } = await thePagesDb.theOverlordsGames.theRealmsNamesOfTheseGames(ids);
		(slots ?? []).forEach((s) => {
			(REALMS[s.game_id] ??= {})[s.player_index] = s.display_name;
		});
	}
	renderReports();
}
var account = (id) => (ACCOUNTS ?? []).find((a) => a.user_id === id) ?? null;
var nameOf = (id) => {
	const a = account(id);
	return a ? (a.name ?? "") || (a.email ?? "") || "(no name)" : id ? "(unknown account)" : "(no GM)";
};
var gameMasters = (except) => (ACCOUNTS ?? []).filter((a) => a.gm_status === "game_master" && a.user_id !== except).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
var unfinished = (gm) => (GAMES ?? []).filter((g) => g.gm_user_id === gm && g.status !== "complete");
function metaOf$1(g) {
	try {
		const m = typeof g.meta === "string" ? JSON.parse(g.meta) : g.meta;
		return m && typeof m === "object" ? m : {};
	} catch {
		return {};
	}
}
var TURN_MODES = {
	manual: "By hand",
	auto: "When all orders are in",
	deadline: "Orders in, or the deadline"
};
function renderAccounts() {
	if (ACCOUNTS == null) {
		fill("accounts", el("div", { class: "msg-error" }, ACCOUNTS_ERROR));
		return;
	}
	const q = theElementWithTheId("acct-q", HTMLInputElement).value.trim().toLowerCase();
	const list = ACCOUNTS.filter((a) => !q || (a.name ?? "").toLowerCase().includes(q) || (a.email ?? "").toLowerCase().includes(q));
	if (!list.length) {
		fill("accounts", el("div", { class: "muted" }, q ? "No account matches." : "No accounts."));
		return;
	}
	const rows = list.map((a) => {
		const self = a.user_id === ME?.id;
		const status = self ? el("span", { class: "pill pill-blue" }, "Overlord") : a.gm_status === "game_master" ? el("span", { class: "pill pill-green" }, "Game Master") : a.gm_status === "offered" ? el("span", { class: "pill pill-amber" }, "Offered") : el("span", { class: "pill pill-grey" }, "Player");
		const gmAction = self ? null : a.gm_status === "game_master" ? el("button", {
			class: "btn btn-crimson btn-sm",
			"data-act": "revoke",
			onclick: () => {
				REVOKING = REVOKING === a.user_id ? null : a.user_id;
				DELETING = null;
				renderAccounts();
			}
		}, "Revoke GM…") : a.gm_status === "offered" ? el("button", {
			class: "btn btn-ghost btn-sm",
			"data-act": "withdraw",
			onclick: () => withdrawOffer(a)
		}, "Withdraw offer") : el("button", {
			class: "btn btn-forest btn-sm",
			"data-act": "offer",
			onclick: () => offerGm(a)
		}, "Offer GM");
		const tr = el("tr", { "data-user": a.user_id }, el("td", null, (a.name ?? "") || "(no name)"), el("td", null, a.email ?? ""), el("td", null, day(a.joined)), el("td", null, day(a.last_sign_in)), el("td", null, status, a.suspended_until ? [" ", el("span", {
			class: "pill pill-red",
			"data-suspended": ""
		}, suspendedText(a))] : null), el("td", { class: "num" }, a.games_run || 0), el("td", { class: "num" }, a.games_played || 0), el("td", null, el("div", { class: "actions" }, gmAction, self ? null : accountActions(a))));
		if (self) return [tr];
		if (REVOKING === a.user_id) return [tr, el("tr", null, el("td", { colspan: 8 }, revokePanel(a)))];
		if (DELETING === a.user_id) return [tr, el("tr", null, el("td", { colspan: 8 }, deletePanel(a)))];
		return [tr];
	});
	fill("accounts", el("table", { class: "kc" }, el("thead", null, el("tr", null, [
		"Name",
		"Email",
		"Joined",
		"Last sign-in",
		"Status"
	].map((h) => el("th", null, h)), el("th", { class: "num" }, "Games run"), el("th", { class: "num" }, "Played"), el("th", null, ""))), el("tbody", null, rows)));
}
function revokePanel(a) {
	const left = unfinished(a.user_id);
	return el("div", {
		class: "revoke",
		id: "revoke-panel"
	}, el("div", { style: "margin-bottom:6px" }, "Revoke Game Master from ", el("strong", null, (a.name ?? "") || (a.email ?? "")), "."), left.length ? [el("div", {
		class: "muted",
		style: "margin-bottom:6px"
	}, `They run ${String(left.length)} unfinished game${left.length > 1 ? "s" : ""}. Hand ${left.length > 1 ? "each" : "it"} to another Game Master first.`), el("table", { class: "kc" }, el("tbody", null, left.map((g) => el("tr", { "data-game": g.id }, el("td", null, g.name), el("td", null, handOver(g))))))] : el("div", {
		class: "muted",
		style: "margin-bottom:6px"
	}, "They run no unfinished game."), el("div", {
		class: "actions",
		style: "margin-top:8px"
	}, el("button", {
		class: "btn btn-crimson btn-sm",
		id: "revoke-confirm",
		disabled: left.length > 0,
		onclick: () => revokeGm(a)
	}, "Revoke GM"), el("button", {
		class: "btn btn-ghost btn-sm",
		onclick: () => {
			REVOKING = null;
			renderAccounts();
		}
	}, "Cancel")));
}
var label = (a) => (a.name ?? "") || (a.email ?? "") || "(no name)";
function suspendedText(a) {
	const t = new Date(a.suspended_until ?? 0);
	return t.getTime() - Date.now() > 15768e8 ? "Suspended until lifted" : "Suspended until " + t.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}
var SUSPEND_FOR = {
	day: ["for a day", 864e5],
	week: ["for a week", 6048e5],
	lifted: ["until you lift it", null]
};
function accountActions(a) {
	return [a.suspended_until ? el("button", {
		class: "btn btn-ghost btn-sm",
		"data-act": "unsuspend",
		onclick: () => unsuspend(a)
	}, "Lift suspension") : (() => {
		const pick = el("select", { "data-act": "suspend-for" }, el("option", { value: "day" }, "For a day"), el("option", { value: "week" }, "For a week"), el("option", { value: "lifted" }, "Until lifted"));
		return [pick, el("button", {
			class: "btn btn-ghost btn-sm",
			"data-act": "suspend",
			onclick: () => suspend(a, pick.value)
		}, "Suspend")];
	})(), el("button", {
		class: "btn btn-crimson btn-sm",
		"data-act": "delete",
		onclick: () => {
			DELETING = DELETING === a.user_id ? null : a.user_id;
			REVOKING = null;
			renderAccounts();
		}
	}, "Delete…")];
}
async function suspend(a, how) {
	const [words, ms] = SUSPEND_FOR[how] ?? SUSPEND_FOR.day;
	if (!confirm(`Suspend ${label(a)} ${words}? They can't sign in until then. If they're signed in now, that session lasts until it expires, up to an hour. They keep their realms and games.`)) return;
	await act(thePagesDb.theOverlordsAccounts.suspendThisAccountUntil(a.user_id, ms == null ? null : new Date(Date.now() + ms).toISOString()), `${label(a)} is suspended ${words}.`);
}
async function unsuspend(a) {
	await act(thePagesDb.theOverlordsAccounts.liftThisAccountsSuspension(a.user_id), `${label(a)} can sign in again.`);
}
function deletePanel(a) {
	const word = (a.email ?? "") || (a.name ?? "");
	const runs = unfinished(a.user_id);
	const typed = el("input", {
		type: "text",
		id: "delete-typed",
		autocomplete: "off",
		placeholder: word,
		style: "max-width:320px"
	});
	const go = el("button", {
		class: "btn btn-crimson btn-sm",
		id: "delete-confirm",
		disabled: true,
		onclick: () => deleteAccount(a)
	}, "Delete this account");
	typed.addEventListener("input", () => {
		go.disabled = typed.value.trim().toLowerCase() !== word.toLowerCase();
	});
	return el("div", {
		class: "revoke",
		id: "delete-panel"
	}, el("div", { style: "margin-bottom:6px" }, "Delete ", el("strong", null, label(a)), ". This can't be undone."), el("div", { class: "muted" }, "Goes: their sign-in, their profile, any Game Master role or offer, and their unread-dispatch markers."), el("div", {
		class: "muted",
		style: "margin-bottom:6px"
	}, "Stays: their finished games, with their realms in them (no longer linked to an account), any game they ran (with no GM), their dispatches and their Hall of Fame records."), runs.length ? el("div", { class: "msg-info" }, `They run ${String(runs.length)} unfinished game${runs.length > 1 ? "s" : ""}: hand ${runs.length > 1 ? "them" : "it"} over first (Revoke GM… lists them).`) : null, el("div", {
		class: "muted",
		style: "margin-bottom:6px"
	}, "An account playing in an unfinished game can't be deleted either: suspend it until the game ends."), el("label", { for: "delete-typed" }, `Type ${a.email ? "their email" : "their name"} to confirm`), typed, el("div", {
		class: "actions",
		style: "margin-top:8px"
	}, go, el("button", {
		class: "btn btn-ghost btn-sm",
		onclick: () => {
			DELETING = null;
			renderAccounts();
		}
	}, "Cancel")));
}
async function deleteAccount(a) {
	DELETING = null;
	await act(thePagesDb.theOverlordsAccounts.deleteThisAccount(a.user_id), `${label(a)}'s account is deleted.`);
}
async function offerGm(a) {
	await act(thePagesDb.theOverlordsAccounts.offerThisAccountGameMaster(a.user_id), `Offered Game Master to ${String((a.name ?? "") || a.email)}. They'll see it at the top of their player portal.`);
}
async function withdrawOffer(a) {
	await act(thePagesDb.theOverlordsAccounts.withdrawTheGameMasterOfferToThisAccount(a.user_id), `Withdrew the offer to ${String((a.name ?? "") || a.email)}.`);
}
async function revokeGm(a) {
	if (!confirm(`Revoke Game Master from ${String((a.name ?? "") || a.email)}? They can still play.`)) return;
	REVOKING = null;
	await act(thePagesDb.theOverlordsAccounts.revokeThisAccountsGameMaster(a.user_id), `${String((a.name ?? "") || a.email)} is no longer a Game Master.`);
}
function handOver(g) {
	const pick = el("select", { "data-act": "pick" }, el("option", { value: "" }, "Hand over to…"), gameMasters(g.gm_user_id).map((a) => el("option", { value: a.user_id }, (a.name ?? "") || (a.email ?? "") || "(no name)")));
	return el("div", { class: "actions" }, pick, el("button", {
		class: "btn btn-gold btn-sm",
		"data-act": "handover",
		onclick: () => reassign(g, pick.value)
	}, "Hand over"));
}
async function reassign(g, to) {
	if (!to) {
		say("error", "Choose the Game Master to hand the game to.");
		return;
	}
	if (!confirm(`Hand ${g.name} to ${nameOf(to)}? Their GM portal picks it up; ${nameOf(g.gm_user_id)}'s can no longer save it.`)) return;
	await act(thePagesDb.theOverlordsGames.handThisGameToThisGameMaster(g.id, to), `${g.name} is now run by ${nameOf(to)}.`);
}
function theModeOrByHand(held) {
	if (held) return held;
	return "manual";
}
function renderGames() {
	if (GAMES == null) {
		fill("games", el("div", { class: "msg-error" }, GAMES_ERROR));
		return;
	}
	if (!GAMES.length) {
		fill("games", el("div", { class: "muted" }, "No games."));
		return;
	}
	fill("games", el("table", { class: "kc" }, el("thead", null, el("tr", null, [
		"Game",
		"GM",
		"Status",
		"Turn",
		"Turns run",
		""
	].map((h) => el("th", null, h)))), el("tbody", null, GAMES.map((g) => {
		const m = metaOf$1(g), turnMode = Reflect.get(m, "turnMode"), mode = theModeOrByHand(turnMode ? Reflect.get(Object(turnMode), "mode") : turnMode);
		return el("tr", { "data-game": g.id }, el("td", null, g.name), el("td", null, nameOf(g.gm_user_id)), el("td", null, g.status, Reflect.get(m, "archived") ? el("span", {
			class: "pill pill-grey",
			style: "margin-left:5px"
		}, "Archived") : null), el("td", { class: "num" }, g.status === "setup" ? "—" : g.turn), el("td", null, TURN_MODES[String(mode)] ?? theChildAsElReadsIt(mode)), el("td", null, el("div", { class: "actions" }, handOver(g), el("a", {
			class: "btn btn-ghost btn-sm",
			href: "kingdoms-call-gm-portal.html?game=" + encodeURIComponent(g.id),
			target: "_blank",
			rel: "noopener"
		}, "Open in the GM portal"))));
	}))));
}
function renderReports() {
	if (!REPORTS.length) {
		fill("reports", el("div", { class: "muted" }, "No dispatches reported."));
		return;
	}
	const gameName = (id) => ((GAMES ?? []).find((g) => g.id === id)?.name ?? "") || "(a deleted game)";
	const realm = (gid, i) => (REALMS[gid]?.[i] ?? "") || "Realm " + String(i + 1);
	fill("reports", REPORTS.map((r) => el("div", {
		class: "report",
		"data-message": r.message_id
	}, el("div", { class: "muted" }, el("strong", null, gameName(r.game_id)), " · ", r.turn != null ? `Turn ${String(r.turn)} · ` : "", "from ", el("strong", null, realm(r.game_id, r.from_index)), " to ", r.scope === "public" ? "every realm" : (r.to_indexes ?? []).map((i) => realm(r.game_id, i)).join(", "), " · reported by ", el("strong", null, realm(r.game_id, r.reporter_index)), r.reason ? [
		" · “",
		r.reason,
		"”"
	] : null), el("div", { class: "body" }, r.body), el("button", {
		class: "btn btn-crimson btn-sm",
		"data-act": "delete-dispatch",
		onclick: () => deleteDispatch(r)
	}, "Delete this dispatch"))));
}
async function deleteDispatch(r) {
	if (!confirm("Delete this dispatch for everyone in the game? Its reports go with it.")) return;
	const { error } = await thePagesDb.theDispatches.deleteThisDispatch(r.message_id);
	if (error) {
		say("error", error.message);
		return;
	}
	say("success", "Dispatch deleted.");
	await loadReports();
}
async function act(call, done) {
	const { error } = await call;
	if (error) {
		say("error", error.message);
		return false;
	}
	say("success", done);
	await loadAll();
	return true;
}
kcDbGuard(thePagesDb, KC_DB_MIN).then(() => init());
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
// src/ui/overlord/globals.ts
Object.assign(window, {
	doSignIn,
	doSignOut,
	loadAll,
	renderAccounts
});
Object.assign(window, { $ });
