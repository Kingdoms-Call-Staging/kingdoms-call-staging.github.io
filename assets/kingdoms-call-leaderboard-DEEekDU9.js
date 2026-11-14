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
// src/db/the-db-interface-and-its-areas.ts
var A_GAME_IN_THE_GAME_MASTERS_LIST = "id,name,gm_user_id,status,turn,max_players,max_turns,created_at,meta, game_players(id,game_id,user_id,player_index,display_name,orders_submitted)";
var EVERY_COLUMN_OF_A_GAME_IN_THE_GAME_MASTERS_LIST = "*, game_players(*)";
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
			deleteTheseGamesTurnRecords: (games) => client.from("turn_events").delete().in("game_id", games),
			writeTheseResults: (results) => client.from("game_results").upsert(results, { onConflict: "game_id,player_index" }),
			writeTheseTurnRecords: (records) => client.from("turn_events").upsert(records, { onConflict: "game_id,turn,player_index" }),
			theGamesOfTheseGamesResults: (games) => client.from("game_results").select("game_id").in("game_id", games)
		},
		theHallOfFamesGames: {
			oneGameThisGameMasterRuns: (gameMaster) => client.from("games").select("id").eq("gm_user_id", gameMaster).limit(1),
			thisGameWithItsWorldAndRealms: (game) => client.from("games").select("id,name,gm_user_id,created_at,max_turns,meta,game_state,game_players(id,player_index,user_id,display_name)").eq("id", game).maybeSingle(),
			theFinishedGamesThisGameMasterRuns: (gameMaster) => client.from("games").select("id,name,gm_user_id,created_at,max_turns,meta").eq("gm_user_id", gameMaster).eq("status", "complete"),
			everyGamesNameStatusAndTurn: () => client.from("games").select("id,name,status,turn"),
			theNameStatusAndTurnOfTheGamesThisGameMasterRuns: (gameMaster) => client.from("games").select("id,name,status,turn").eq("gm_user_id", gameMaster),
			whichOfTheseGamesStillExist: (games) => client.from("games").select("id").in("id", games),
			theIdNameAndStateOfTheFinishedGamesThisGameMasterRuns: (gameMaster) => client.from("games").select("id,name,status").eq("gm_user_id", gameMaster).eq("status", "complete"),
			thisGamesIdNameAndWorldWithEveryColumnOfItsRealms: (game) => client.from("games").select("id,name,game_state,game_players(*)").eq("id", game).single()
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
		},
		theGameMastersGames: {
			oneGamesMeta: () => client.from("games").select("id,meta").limit(1),
			theGamesThisGameMasterRunsNewestFirst: (gameMaster) => client.from("games").select(A_GAME_IN_THE_GAME_MASTERS_LIST).eq("gm_user_id", gameMaster).order("created_at", { ascending: false }),
			theGamesThisGameMasterRunsNewestFirstEveryColumn: (gameMaster) => client.from("games").select(EVERY_COLUMN_OF_A_GAME_IN_THE_GAME_MASTERS_LIST).eq("gm_user_id", gameMaster).order("created_at", { ascending: false }),
			everyGameNewestFirstFromRowToRow: (from, to) => client.from("games").select(A_GAME_IN_THE_GAME_MASTERS_LIST).order("created_at", { ascending: false }).range(from, to),
			everyGameNewestFirstFromRowToRowEveryColumn: (from, to) => client.from("games").select(EVERY_COLUMN_OF_A_GAME_IN_THE_GAME_MASTERS_LIST).order("created_at", { ascending: false }).range(from, to),
			theActiveGamesThisGameMasterRuns: (gameMaster) => client.from("games").select(A_GAME_IN_THE_GAME_MASTERS_LIST).eq("gm_user_id", gameMaster).eq("status", "active"),
			theActiveGamesThisGameMasterRunsEveryColumn: (gameMaster) => client.from("games").select(EVERY_COLUMN_OF_A_GAME_IN_THE_GAME_MASTERS_LIST).eq("gm_user_id", gameMaster).eq("status", "active"),
			thisGameWithItsRealms: (game) => client.from("games").select("*, game_players(*)").eq("id", game).single(),
			makeThisGame: (game) => client.from("games").insert(game).select().single(),
			thisGamesTurnAndWorld: (game) => client.from("games").select("id,turn,game_state").eq("id", game).single(),
			theGamesThisGameMasterRunsWithNoMeta: (gameMaster) => client.from("games").select("id,game_state").eq("gm_user_id", gameMaster).is("meta", null),
			changeThisGame: (game, change) => client.from("games").update(change).eq("id", game),
			changeThisGameAndAnswerItsId: (game, change) => client.from("games").update(change).eq("id", game).select("id").maybeSingle(),
			changeThisGameWhileOnThisTurnAndAnswerItsId: (game, turn, change) => client.from("games").update(change).eq("id", game).eq("turn", turn).select("id").maybeSingle(),
			keepTheRealmsThatAreOutOfThisGameFromSendingDispatches: (game, keep) => client.from("games").update({ block_eliminated_msgs: keep }).eq("id", game).select("id,block_eliminated_msgs").maybeSingle()
		},
		theGameMastersRealms: { removeThisRealm: (realm) => client.from("game_players").delete().eq("id", realm) },
		theGameMastersTurnLogs: { theWholeLogOfThisGameInThisTurn: (game, turn) => client.from("turn_logs").select("*").eq("game_id", game).eq("turn", turn).eq("player_index", -1) },
		theDeletionOfAGame: {
			removeThisGamesTurnLogs: (game) => client.from("turn_logs").delete().eq("game_id", game),
			removeThisGamesDispatches: (game) => client.from("game_messages").delete().eq("game_id", game),
			removeThisGamesReadMarks: (game) => client.from("game_message_reads").delete().eq("game_id", game),
			removeThisGamesTurnEvents: (game) => client.from("turn_events").delete().eq("game_id", game),
			removeThisGamesResults: (game) => client.from("game_results").delete().eq("game_id", game),
			removeThisGamesHallOfFameEntry: (game) => client.from("game_records").delete().eq("game_id", game),
			removeThisGamesRealms: (game) => client.from("game_players").delete().eq("game_id", game),
			removeThisGame: (game) => client.from("games").delete().eq("id", game)
		},
		theTurnAsTheGameMasterRunsIt: {
			thisGameEveryColumn: (game) => client.from("games").select("*").eq("id", game).single(),
			everyRealmOfThisGame: (game) => client.from("game_players").select("*").eq("game_id", game),
			clearTheOrdersOfEveryRealmOfThisGame: (game) => client.from("game_players").update({
				orders: null,
				orders_submitted: false
			}).eq("game_id", game),
			saveThisGameWhileOnThisTurnAndAnswerItsId: (game, turn, change) => client.from("games").update(change).eq("id", game).eq("turn", turn).select("id").maybeSingle(),
			giveThisRealmItsTurnReport: (realm, report) => client.from("game_players").update({ turn_report: report }).eq("id", realm),
			writeThisLog: (log) => client.from("turn_logs").insert(log),
			theTurnOfThisGameIfItIsThere: (game) => client.from("games").select("turn").eq("id", game).maybeSingle(),
			putBackThisRealmsOrders: (realm, orders, submitted) => client.from("game_players").update({
				orders,
				orders_submitted: submitted
			}).eq("id", realm)
		},
		theTurnZeroAsTheGameMasterRunsIt: {
			everyRealmOfThisGame: (game) => client.from("game_players").select("*").eq("game_id", game),
			removeEveryBotsRealmOfThisGame: (game) => client.from("game_players").delete().eq("game_id", game).is("user_id", null),
			makeThisBotsRealm: (realm) => client.from("game_players").insert(realm).select().single(),
			startThisGame: (game, change) => client.from("games").update(change).eq("id", game),
			giveThisRealmItsFirstReport: (realm, report) => client.from("game_players").update({
				turn_report: report,
				orders: null,
				orders_submitted: false
			}).eq("id", realm),
			writeThisLog: (log) => client.from("turn_logs").insert(log),
			thisGameWithItsRealms: (game) => client.from("games").select("*, game_players(*)").eq("id", game).single()
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
// src/ui/shared/a-value-of-any-kind-read-as-javascript-reads-it.ts
/** `value[key]` as JavaScript reads it (a game's state as parsed from JSON): for none, the TypeError that read throws. */
function theField(value, key) {
	if (value === null || value === void 0) throw new TypeError(`Cannot read properties of ${String(value)} (reading '${String(key)}')`);
	return Reflect.get(Object(value), key);
}
/** `a || b` on values of any kind (a game's state as parsed): `a` where it is truthy, else `b`. */
function thisOrElse(a, b) {
	if (a) return a;
	return b;
}
/** Whether a value is a list (of values of any kind). */
function isAList(value) {
	return Array.isArray(value);
}
/** `new Date(value)` on a value of any kind (a deadline as a game's state holds it), as the constructor reads it. */
function theDateOf(value) {
	const made = Reflect.construct(Date, [value]);
	if (made instanceof Date) return made;
	throw new TypeError("the Date constructor made no date");
}
/**
* `a + b` on values of any kind (a game's record as parsed from JSON: a score, a count, a name), as JavaScript adds
* them: words where either side is words once read as a `+` reads it, else the two read as numbers. An object or a list
* (all JSON holds besides words, numbers, flags and none) reads as its words (`[object Object]`, its elements joined),
* as `+` reads one; JSON holds no date, symbol or big number, the kinds a `+` reads otherwise.
*/
function theSumAsJavaScriptMakesIt(a, b) {
	const left = aSideAsAPlusReadsIt(a);
	const right = aSideAsAPlusReadsIt(b);
	if (typeof left === "string" || typeof right === "string") return String(left) + String(right);
	return Number(left) + Number(right);
}
/** One side of a `+` as it reads it: an object or a list as its words, any other value as it is. */
function aSideAsAPlusReadsIt(side) {
	if (typeof side !== "object" || side === null) return side;
	return String(side);
}
// src/ui/leaderboard/a-game-in-the-hall-of-fame-as-the-board-reads-it.ts
/** `x.field` as JavaScript reads it on a value that isn't none (`Object` boxes words, numbers and flags). */
function theFieldOfSomething(held, field) {
	return Reflect.get(Object(held), field);
}
/** A JSON column as the database client hands it, or as an older row held it in words: words parsed (none for words
*  that aren't JSON), none as none, any other value as it is. */
function theColumnParsed(column) {
	if (column === null || column === void 0) return null;
	if (typeof column === "string") try {
		return JSON.parse(column);
	} catch {
		return null;
	}
	return column;
}
/** A JSON column parsed, else `otherwise` where it parsed to nothing `||` passes over: `jp(column) || otherwise`. */
function theColumnParsedOrElse(column, otherwise) {
	return thisOrElse(theColumnParsed(column), otherwise);
}
/** A game's setup, `jp(setup) || {}` read field by field. */
function theSetUpAsTheBoardReadsIt(column) {
	const setup = theColumnParsedOrElse(column, {});
	return {
		bots: theFieldOfSomething(setup, "bots"),
		realms: theFieldOfSomething(setup, "realms"),
		humans: theFieldOfSomething(setup, "humans"),
		cols: theFieldOfSomething(setup, "cols"),
		rows: theFieldOfSomething(setup, "rows"),
		mapSize: theFieldOfSomething(setup, "mapSize"),
		diplomacy: theFieldOfSomething(setup, "diplomacy"),
		seaPct: theFieldOfSomething(setup, "seaPct")
	};
}
/** A game's totals, `jp(totals) || {}` read field by field. */
function theTotalsAsTheBoardReadsThem(column) {
	const totals = theColumnParsedOrElse(column, {});
	return {
		battles: theFieldOfSomething(totals, "battles"),
		casualties: theFieldOfSomething(totals, "casualties"),
		captures: theFieldOfSomething(totals, "captures"),
		lairs: theFieldOfSomething(totals, "lairs"),
		spells: theFieldOfSomething(totals, "spells"),
		deaths: theFieldOfSomething(totals, "deaths")
	};
}
/** Whether an element of a list is one `!x` reads as nothing (JSON's falsy values). */
function isNothing(held) {
	return held === null || held === void 0 || held === false || held === 0 || held === "";
}
/** A standing read field by field where the board reads it without testing it first: for none (`null`), the
*  TypeError the first field read threw; for any other nothing (`0`, `false`, `''`), each field `undefined`. */
function theStandingAsItsFieldsRead(standing) {
	if (standing === null || standing === void 0) throw new TypeError(`Cannot read properties of ${String(standing)} (reading a standing's field)`);
	if (isNothing(standing)) return aStandingRead(standing);
	return standing;
}
/** One element of a list of standings: a nothing kept as it was, anything else read field by field. */
function aStandingRead(held) {
	return {
		pi: theFieldOfSomething(held, "pi"),
		realm: theFieldOfSomething(held, "realm"),
		player: theFieldOfSomething(held, "player"),
		uid: theFieldOfSomething(held, "uid"),
		bot: theFieldOfSomething(held, "bot"),
		race: theFieldOfSomething(held, "race"),
		al: theFieldOfSomething(held, "al"),
		winner: theFieldOfSomething(held, "winner"),
		rank: theFieldOfSomething(held, "rank"),
		score: theFieldOfSomething(held, "score"),
		prov: theFieldOfSomething(held, "prov"),
		str: theFieldOfSomething(held, "str"),
		gold: theFieldOfSomething(held, "gold"),
		titles: theFieldOfSomething(held, "titles"),
		outHow: theFieldOfSomething(held, "outHow"),
		outTurn: theFieldOfSomething(held, "outTurn")
	};
}
/** A game's standings, `jp(standings) || []`: a list's elements read (each nothing kept), any other value kept. */
function theStandingsAsTheBoardHoldsThem(column) {
	const standings = theColumnParsedOrElse(column, []);
	if (!isAList(standings)) return { heldAsItWas: standings };
	return standings.map((held) => isNothing(held) ? held : aStandingRead(held));
}
/** The standings `(g.standings || []).forEach(…)` walked: for standings that are no list, the TypeError it threw. */
function theStandingsOf(game) {
	if (isAList(game.standings)) return game.standings;
	throw new TypeError("a game's standings are not a list");
}
/** A game's records, `Object.entries(jp(records) || {})`: each record's entries (one entry, or a list of them, as the
*  rows before lb3 and after wrote them), those that are something with a value read field by field. */
function theRecordsAsTheBoardReadsThem(column) {
	const held = theColumnParsedOrElse(column, {});
	if (held === null || held === void 0) return [];
	return Object.entries(held).map(([key, record]) => {
		const each = isAList(record) ? record : [record];
		const entries = [];
		for (const entry of each) {
			if (isNothing(entry)) continue;
			const v = theFieldOfSomething(entry, "v");
			if (v === null || v === void 0) continue;
			entries.push({
				v,
				pi: theFieldOfSomething(entry, "pi"),
				d: theFieldOfSomething(entry, "d"),
				lbl: theFieldOfSomething(entry, "lbl"),
				who: theFieldOfSomething(entry, "who"),
				t: theFieldOfSomething(entry, "t"),
				det: theFieldOfSomething(entry, "det"),
				realm: theFieldOfSomething(entry, "realm"),
				player: theFieldOfSomething(entry, "player"),
				race: theFieldOfSomething(entry, "race"),
				al: theFieldOfSomething(entry, "al"),
				bot: theFieldOfSomething(entry, "bot")
			});
		}
		return {
			key,
			entries
		};
	});
}
/** A game's entry as the database gives it, held as the board reads it: its columns kept, the four JSON ones read. */
function theGameAsTheBoardHoldsIt(row) {
	return {
		...row,
		setup: theSetUpAsTheBoardReadsIt(row.setup),
		standings: theStandingsAsTheBoardHoldsThem(row.standings),
		records: theRecordsAsTheBoardReadsThem(row.records),
		totals: theTotalsAsTheBoardReadsThem(row.totals)
	};
}
// src/ui/leaderboard/main.ts
if (typeof KC_CONFIG === "undefined") throw new Error("kc-config.js did not load: reload the page.");
var SUPABASE_URL = KC_CONFIG.supabaseUrl;
var SUPABASE_ANON_KEY = KC_CONFIG.supabaseKey;
var thePagesDb = makeThePagesDatabase(SUPABASE_URL, SUPABASE_ANON_KEY).db;
var KC_DB_MIN = "20261012064100";
globalThis.GAMES = [];
var TAB = "champions";
var GM = false;
var OVERLORD = false;
var ME = null;
var PEOPLE = {};
var canEdit = (g) => OVERLORD || ME !== null && g.gm_user_id === ME.id;
var personName = (st) => {
	if (!st) return null;
	const known = st.uid ? PEOPLE[theKeyOf(st.uid)] : void 0;
	if (known) return known;
	if (st.player && st.player !== st.realm) return st.player;
	return null;
};
var isLegacyRow = (g) => !/lb[2-9]/.test(g.build ?? "") || !theStandingsOf(g).some((st) => st && !st.bot && st.uid);
function whoOf(e) {
	const st = theStandingsOf(e.g).find((x) => x && x.pi === e.pi);
	if (st) return {
		realm: st.realm,
		player: personName(st),
		race: st.race,
		al: st.al,
		bot: !!st.bot,
		uid: thisOrElse(st.uid, null)
	};
	return {
		realm: thisOrElse(e.realm, null),
		player: thisOrElse(e.player, null),
		race: thisOrElse(e.race, null),
		al: thisOrElse(e.al, null),
		bot: !!e.bot,
		uid: null
	};
}
var $ = (id) => document.getElementById(id);
/** An element looked up earlier, where the page reads it without a test: for none, the TypeError that read threw. */
function theElementFound(found, id) {
	if (found === null) throw new TypeError(`the page holds no element with the id "${id}"`);
	return found;
}
/** The value of one of the filters' or the edit box's controls (an `<input>` or a `<select>`), by its id. */
function theControl(id) {
	const found = $(id);
	if (found instanceof HTMLInputElement || found instanceof HTMLSelectElement) return found;
	throw new TypeError(`the page's element with the id "${id}" is no input or select`);
}
/** A value read as a key of a table, as JavaScript reads one: in words (an object's, its `[object Object]`). */
function theKeyOf(value) {
	return String(value);
}
/** `a.localeCompare(b)` on a label of any kind (a record's own label, as its row holds it): words compared, any other
*  value the TypeError the call threw (only words have localeCompare). */
function theLabelsCompared(a, b) {
	if (typeof a !== "string") throw new TypeError("a.localeCompare is not a function");
	return a.localeCompare(String(b));
}
var nf = (n) => n === null || n === void 0 || !isFinite(Number(n)) ? "—" : Number(n).toLocaleString("en-NZ", { maximumFractionDigits: 2 });
var dstr = (s) => {
	if (!s) return "—";
	const d = theDateOf(s);
	return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-NZ", {
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
	const known = KC_ACH[key];
	if (known) return known;
	if (key.startsWith("sk_")) return {
		c: "skills",
		l: null,
		f: "int"
	};
	if (key.startsWith("title_")) return {
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
	if (rec?.lbl) return rec.lbl;
	const d = KC_ACH[key];
	if (d?.l) return d.l;
	return key.replace(/^sk_/, "Highest ").replace(/^title_/, "Title: ").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
function fmtVal(v, f) {
	if (v === null || v === void 0) return "—";
	switch (f) {
		case "pct": return nf(v) + "%";
		case "x": return nf(v) + "×";
		case "power": return (POWER_WORD[Math.max(0, Math.min(4, Math.round(Number(v))))] ?? "") || nf(v);
		case "hp": return nf(v) + " hp";
		case "turn": return "turn " + nf(v);
		default: return nf(v);
	}
}
async function loadAll() {
	const msg = $("msg");
	try {
		const { data: { session } } = await thePagesDb.signingIn.theSessionKeptInThisBrowser();
		ME = session ? session.user : null;
	} catch {
		ME = null;
	}
	GM = false;
	OVERLORD = false;
	if (ME && new URLSearchParams(location.search).get("gm") === "1") try {
		const [{ data }, ov] = await Promise.all([thePagesDb.theHallOfFamesGames.oneGameThisGameMasterRuns(ME.id), thePagesDb.theRoles.isTheSignedInAccountTheOverlord()]);
		OVERLORD = !ov.error && ov.data === true;
		GM = OVERLORD || !!data?.length;
	} catch {
		GM = false;
		OVERLORD = false;
	}
	theElementWithTheId("gm-pill", HTMLElement).innerHTML = GM ? "<span class=\"btn btn-gold\" style=\"cursor:default\">✏ GM editing on</span>" : "";
	theElementWithTheId("show-hidden-wrap", HTMLElement).style.display = GM ? "inline-flex" : "none";
	const rows = [];
	try {
		for (let from = 0;; from += 200) {
			const { data, error } = await thePagesDb.theHallOfFame.everyEntryNewestFinishedFirstFromRowToRow(from, from + 199);
			if (error) throw error;
			rows.push(...data ?? []);
			if (!data || data.length < 200) break;
		}
	} catch (e) {
		theElementWithTheId("spinner", HTMLElement).style.display = "none";
		theElementWithTheId("main", HTMLElement).style.display = "block";
		theElementFound(msg, "msg").innerHTML = String(kcHtml`<div class="msg-error"><strong>The Hall of Fame could not be read.</strong> ${thisOrElse(theField(e, "message"), e)}<br>If you are the Game Master, open the GM portal — the game list shows the one statement to run in Supabase that creates the <code>game_records</code> table.</div>`);
		theElementWithTheId("body", HTMLElement).innerHTML = "";
		return;
	}
	GAMES = rows.map(theGameAsTheBoardHoldsIt);
	PEOPLE = {};
	try {
		const { data: profs } = await thePagesDb.theAccountsNames.theNameOfEveryAccount();
		(profs ?? []).forEach((r) => {
			if (r.id && r.name) PEOPLE[r.id] = r.name;
		});
	} catch {}
	theElementFound(msg, "msg").innerHTML = GAMES.length ? "" : "<div class=\"msg-info\">No finished games have been recorded yet. A game joins the Hall of Fame the moment it ends; the GM can also add older games from the GM portal’s Stats tab.</div>";
	buildFilterOptions();
	theElementWithTheId("spinner", HTMLElement).style.display = "none";
	theElementWithTheId("main", HTMLElement).style.display = "block";
	render();
}
function buildFilterOptions() {
	const opt = (sel, vals) => {
		const el = theElementWithTheId(sel, HTMLSelectElement), cur = el.value;
		const any = el.options.item(0);
		if (any === null) throw new TypeError(`the select "${sel}" holds no first option`);
		el.replaceChildren(any, ...vals.map((v) => new Option(String(v), String(v))));
		el.value = cur;
	};
	const uniqNum = (k) => [...new Set(GAMES.map((g) => g.setup[k]).filter((v) => v !== null && v !== void 0))].sort((a, b) => Number(a) - Number(b));
	opt("f-bots", uniqNum("bots"));
	opt("f-realms", uniqNum("realms"));
	opt("f-humans", uniqNum("humans"));
	opt("f-map", [...new Set(GAMES.map((g) => mapKey(g)).filter(Boolean))].sort(asTheDefaultSortOrdersThem));
}
/** The order `.sort()` with no comparer gives values of any kind (none here: a filter has taken it out): by their words. */
function asTheDefaultSortOrdersThem(a, b) {
	const x = String(a), y = String(b);
	return x < y ? -1 : x > y ? 1 : 0;
}
function mapKey(g) {
	const s = g.setup;
	return s.cols && s.rows ? theSumAsJavaScriptMakesIt(theSumAsJavaScriptMakesIt(s.cols, "×"), s.rows) : thisOrElse(s.mapSize, null);
}
/** How many bots a game had, and how many humans: `s.bots || 0`, and `s.humans`, else the realms less the bots. */
function theBotsAndHumansOf(g) {
	const s = g.setup, bots = thisOrElse(s.bots, 0);
	return {
		bots,
		humans: s.humans ?? Number(thisOrElse(s.realms, 0)) - Number(bots)
	};
}
function filtered() {
	const v = (id) => theControl(id).value, q = (v("f-q") || "").trim().toLowerCase();
	const from = v("f-from") ? /* @__PURE__ */ new Date(v("f-from") + "T00:00:00") : null;
	const to = v("f-to") ? /* @__PURE__ */ new Date(v("f-to") + "T23:59:59") : null;
	const showHidden = GM && theElementWithTheId("f-hidden", HTMLInputElement).checked;
	return GAMES.filter((g) => {
		const s = g.setup, { bots, humans } = theBotsAndHumansOf(g);
		if (g.hidden && !showHidden) return false;
		const kind = v("f-kind");
		if (kind === "human" && Number(bots) > 0) return false;
		if (kind === "withbots" && Number(bots) < 1) return false;
		if (kind === "allbot" && Number(humans) > 0) return false;
		if (kind === "mixed" && !(Number(bots) > 0 && Number(humans) > 0)) return false;
		if (v("f-bots") !== "" && String(bots) !== v("f-bots")) return false;
		if (v("f-diplo") !== "" && thisOrElse(s.diplomacy, "normal") !== v("f-diplo")) return false;
		if (v("f-realms") !== "" && String(thisOrElse(s.realms, "")) !== v("f-realms")) return false;
		if (v("f-humans") !== "" && String(humans) !== v("f-humans")) return false;
		if (v("f-map") !== "" && mapKey(g) !== v("f-map")) return false;
		const sp = s.seaPct, some = sp !== null && sp !== void 0;
		if (v("f-sea") === "lo" && !(some && Number(sp) < 30)) return false;
		if (v("f-sea") === "mid" && !(some && Number(sp) >= 30 && Number(sp) <= 45)) return false;
		if (v("f-sea") === "hi" && !(some && Number(sp) > 45)) return false;
		if (v("f-vic") !== "" && (g.victory ?? "") !== v("f-vic")) return false;
		const t = g.turns ?? 0;
		if (v("f-len") === "s" && !(t <= 10)) return false;
		if (v("f-len") === "m" && !(t > 10 && t <= 20)) return false;
		if (v("f-len") === "l" && !(t > 20)) return false;
		if (from && new Date((g.finished_at ?? "") || 0) < from) return false;
		if (to && new Date((g.finished_at ?? "") || 0) > to) return false;
		if (q) {
			if (![
				g.game_name,
				g.winner_realm,
				g.note
			].concat(theStandingsOf(g).map((x) => {
				const st = theStandingAsItsFieldsRead(x);
				return [
					st.realm,
					st.player,
					personName(x)
				].filter(Boolean).join(" ");
			})).join(" ").toLowerCase().includes(q)) return false;
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
	].forEach((i) => {
		theControl(i).value = "";
	});
	theControl("f-from").value = "";
	theControl("f-to").value = "";
	theControl("f-q").value = "";
	if ($("f-hidden")) theElementWithTheId("f-hidden", HTMLInputElement).checked = false;
	render();
}
function setTab(t) {
	TAB = t;
	[
		"champions",
		"achievements",
		"peoples",
		"games"
	].forEach((x) => {
		theElementWithTheId("tb-" + x, HTMLElement).classList.toggle("active", x === t);
	});
	render();
}
function render() {
	const G = filtered();
	theElementWithTheId("filter-count", HTMLElement).textContent = `${String(G.length)} of ${String(GAMES.length)} recorded game${GAMES.length === 1 ? "" : "s"}`;
	const el = theElementWithTheId("body", HTMLElement);
	if (!GAMES.length) {
		el.innerHTML = "";
		theElementWithTheId("foot", HTMLElement).textContent = "";
		return;
	}
	if (!G.length) {
		el.innerHTML = "<div class=\"card\"><div class=\"msg-warning\">No recorded game matches these filters.</div></div>";
		return;
	}
	if (TAB === "champions") el.innerHTML = String(renderChampions(G));
	else if (TAB === "achievements") el.innerHTML = String(renderAchievements(G));
	else if (TAB === "peoples") el.innerHTML = String(renderPeoples(G));
	else el.innerHTML = String(renderGames(G));
	const last = G.map((g) => g.finished_at).filter((d) => Boolean(d)).sort().slice(-1)[0];
	theElementWithTheId("foot", HTMLElement).textContent = "Kingdoms Call — Hall of Fame · most recent game recorded " + dstr(last);
}
function lbDiagnostics(G) {
	const legacy = G.filter(isLegacyRow);
	let humanSlots = 0, withUid = 0, named = 0;
	G.forEach((g) => {
		theStandingsOf(g).forEach((st) => {
			if (!st || st.bot) return;
			humanSlots++;
			if (st.uid) withUid++;
			if (personName(st)) named++;
		});
	});
	const builds = [...new Set(G.map((g) => (g.build ?? "") || "unknown"))];
	const newest = (G.slice().sort((a, b) => (b.finished_at ?? "").localeCompare(a.finished_at ?? ""))[0]?.build ?? "") || "—";
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
	const st = theStandingsOf(g).find((x) => x && x.winner);
	return thisOrElse(thisOrElse(st ? personName(st) : st, g.winner_player), null);
}
function pctBar(n, d) {
	const p = d ? Math.round(100 * n / d) : 0;
	return kcHtml`<div class="bar" title="${p}%"><i style="width:${p}%"></i></div>`;
}
/** A champion's key, `st.uid || (nm ? 'name:' + nm : null)`: the account, else the name (the `+` only then). */
function theChampionsKey(uid, nm) {
	if (uid) return uid;
	return nm ? theSumAsJavaScriptMakesIt("name:", nm) : null;
}
function renderChampions(G) {
	const byPlayer = {};
	G.forEach((g) => {
		theStandingsOf(g).forEach((st) => {
			if (!st || st.bot) return;
			const nm = personName(st);
			const key = theChampionsKey(st.uid, nm);
			if (!key) return;
			const a = byPlayer[theKeyOf(key)] ??= {
				key,
				uid: thisOrElse(st.uid, null),
				name: thisOrElse(nm, "(name not recorded)"),
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
				a.rankSum = theSumAsJavaScriptMakesIt(a.rankSum, st.rank);
				if (Number(st.rank) <= 3) a.podium++;
			}
			a.score = theSumAsJavaScriptMakesIt(a.score, thisOrElse(st.score, 0));
			a.best = Math.max(a.best, Number(thisOrElse(st.score, 0)));
			a.titles = theSumAsJavaScriptMakesIt(a.titles, theField(thisOrElse(st.titles, []), "length"));
			if (st.realm) a.realms.add(st.realm);
		});
	});
	const rows = Object.values(byPlayer).filter((r) => r !== void 0).sort((a, b) => b.wins - a.wins || b.wins / b.games - a.wins / a.games || Number(b.score) - Number(a.score));
	const out = [];
	if (GM) out.push(lbDiagnostics(G));
	out.push(kcHtml`<div class="card"><h2>🏆 Champions — the players</h2>`);
	out.push(kcHtml`<div class="muted" style="margin-bottom:9px">One line per person, however many realms they have ruled. Realm names change from game to game; the player does not.${OVERLORD ? " As the Overlord you can correct a player’s name here — it changes their name everywhere on the board, past games included." : ""}</div>`);
	if (!rows.length) out.push(kcHtml`<div class="msg-info">No human players in the games that match these filters.</div>`);
	else {
		out.push(kcHtml`<table class="kc" id="champ-table"><tr><th>#</th><th>Player</th><th class="num">Games</th><th class="num">Wins</th><th>Win rate</th><th class="num">Top 3</th><th class="num">Avg rank</th><th class="num">Best score</th><th class="num">Titles</th><th>Realms ruled</th>${OVERLORD ? kcHtml`<th></th>` : ""}</tr>`);
		rows.forEach((r, i) => {
			const rl = [...r.realms];
			out.push(kcHtml`<tr><td>${i + 1}</td><td><strong>${r.name}</strong></td><td class="num">${r.games}</td><td class="num">${r.wins}</td>`, kcHtml`<td style="min-width:90px">${pctBar(r.wins, r.games)}<span class="muted">${Math.round(100 * r.wins / r.games)}%</span></td>`, kcHtml`<td class="num">${r.podium}</td><td class="num">${r.ranked ? (Number(r.rankSum) / r.ranked).toFixed(1) : "—"}</td>`, kcHtml`<td class="num">${nf(r.best)}</td><td class="num">${r.titles}</td>`, kcHtml`<td class="muted">${rl.slice(0, 4).join(", ")}${rl.length > 4 ? " +" + String(rl.length - 4) : ""}</td>`, OVERLORD ? kcHtml`<td>${r.uid ? kcHtml`<button class="btn btn-ghost" style="font-size:.6rem;padding:3px 8px" onclick="renamePlayer(${kcArg(r.uid)})">✏</button>` : kcHtml`<span class="muted" title="This player has no account on record — nothing to rename">—</span>`}</td>` : "", kcHtml`</tr>`);
		});
		out.push(kcHtml`</table><div id="rename-msg"></div>`);
	}
	out.push(kcHtml`</div>`);
	let hG = 0, hW = 0, bG = 0, bW = 0;
	G.forEach((g) => {
		theStandingsOf(g).forEach((held) => {
			const st = theStandingAsItsFieldsRead(held);
			if (st.bot) {
				bG++;
				if (st.winner) bW++;
			} else {
				hG++;
				if (st.winner) hW++;
			}
		});
	});
	out.push(kcHtml`<div class="card"><h2>⚖ Humans against the bots</h2><table class="kc">`, kcHtml`<tr><th>Side</th><th class="num">Realms played</th><th class="num">Wins</th><th>Win rate</th></tr>`, kcHtml`<tr><td>Human realms</td><td class="num">${hG}</td><td class="num">${hW}</td><td style="min-width:110px">${pctBar(hW, hG)}<span class="muted">${hG ? Math.round(100 * hW / hG) : 0}%</span></td></tr>`, kcHtml`<tr><td>Bot realms</td><td class="num">${bG}</td><td class="num">${bW}</td><td>${pctBar(bW, bG)}<span class="muted">${bG ? Math.round(100 * bW / bG) : 0}%</span></td></tr>`, kcHtml`</table><div class="muted" style="margin-top:7px">A win rate is per realm, so in a fair four-realm race every realm sits at 25%.</div></div>`);
	const perf = [];
	G.forEach((g) => {
		theStandingsOf(g).forEach((st) => perf.push({
			g,
			st
		}));
	});
	perf.sort((a, b) => Number(thisOrElse(theStandingAsItsFieldsRead(b.st).score, 0)) - Number(thisOrElse(theStandingAsItsFieldsRead(a.st).score, 0)));
	out.push(kcHtml`<div class="card"><h2>⭐ Finest single campaigns</h2><table class="kc">`, kcHtml`<tr><th>#</th><th>Realm</th><th>Player</th><th class="num">Score</th><th class="num">Provinces</th><th class="num">Strength</th><th class="num">Titles</th><th>Game</th><th>Date</th></tr>`);
	perf.slice(0, 20).forEach((p, i) => {
		const st = theStandingAsItsFieldsRead(p.st);
		out.push(kcHtml`<tr><td>${i + 1}</td><td><strong>${st.realm}</strong>${st.winner ? kcHtml`<span class="pill pill-green">won</span>` : ""}</td>`, kcHtml`<td>${st.bot ? kcHtml`<span class="pill pill-grey">bot</span>` : thisOrElse(personName(p.st), "—")}</td>`, kcHtml`<td class="num">${nf(st.score)}</td><td class="num">${nf(st.prov)}</td><td class="num">${nf(st.str)}</td><td class="num">${theField(thisOrElse(st.titles, []), "length")}</td>`, kcHtml`<td class="muted">${p.g.game_name}</td><td class="muted">${dstr(p.g.finished_at)}</td></tr>`);
	});
	out.push(kcHtml`</table></div>`);
	return kcHtml`${out}`;
}
function renderAchievements(G) {
	const q = ($("f-q") ? theControl("f-q").value : "").trim().toLowerCase();
	const whoMatch = (st) => !!q && [
		st.realm,
		st.player,
		personName(st)
	].filter(Boolean).join(" ").toLowerCase().includes(q);
	const byKey = {};
	let narrowed = false;
	for (const g of G) {
		const mine = new Set(theStandingsOf(g).filter((st) => st ? whoMatch(st) : false).map((st) => st.pi));
		if (mine.size) narrowed = true;
		g.records.forEach(({ key: k, entries }) => {
			entries.forEach((e) => {
				if (mine.size && !mine.has(e.pi)) return;
				(byKey[k] ??= []).push({
					...e,
					g
				});
			});
		});
	}
	const cats = {};
	Object.keys(byKey).forEach((k) => {
		const d = achDef(k);
		(cats[d.c] ??= []).push(k);
	});
	const out = [];
	out.push(kcHtml`<div class="card"><h2>🎖 Achievements</h2><div class="muted">${narrowed ? "Showing only the realms and players matching your search — every one of their bests, in every game that matches your filters." : "Every record below is among the best ever recorded in a game matching your filters. Each realm's best in each game counts. Type a realm or player into Search to see all of their own records."}</div></div>`);
	KC_CAT.forEach(([cat, title]) => {
		const keys = (cats[cat] ?? []).sort((a, b) => theLabelsCompared(achLabel(a, byKey[a]?.[0]), achLabel(b, byKey[b]?.[0])));
		if (!keys.length) return;
		out.push(kcHtml`<div class="card"><h2>${title}</h2><div class="ach-grid">`);
		keys.forEach((k) => {
			const held = byKey[k] ?? [];
			const def = achDef(k), dir = held[0]?.d === "min" || def.d === "min" ? "min" : "max";
			const list = held.slice().sort((a, b) => dir === "min" ? Number(a.v) - Number(b.v) : Number(b.v) - Number(a.v)).slice(0, 8);
			out.push(kcHtml`<div class="ach"><div class="t">${achLabel(k, list[0])}</div>`);
			if (def.n) out.push(kcHtml`<div class="n">${def.n}</div>`);
			out.push(kcHtml`<ol>`);
			list.forEach((e, i) => {
				const id = whoOf(e);
				const who = e.who ? kcHtml`${e.who} · ` : "";
				const realm = thisOrElse(id.realm, e.pi === null || e.pi === void 0 ? kcHtml`<span class="muted">the game itself</span>` : "—");
				const owner = id.player ? kcHtml` <span class="muted">(${id.player})</span>` : id.bot ? kcHtml` <span class="pill pill-grey">bot</span>` : "";
				const bits = [];
				if (id.race) bits.push(id.race);
				if (id.al) bits.push(id.al);
				if (e.t !== null && e.t !== void 0) bits.push(theSumAsJavaScriptMakesIt("turn ", e.t));
				if (e.det) bits.push(e.det);
				bits.push((e.g.game_name ?? "") + " · " + dstr(e.g.finished_at));
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
		G.forEach((g) => {
			theStandingsOf(g).forEach((held) => {
				const st = theStandingAsItsFieldsRead(held);
				const k = pick(st);
				if (!k) return;
				const a = m[theKeyOf(k)] ??= {
					k,
					n: 0,
					w: 0,
					score: 0,
					prov: 0
				};
				a.n++;
				if (st.winner) a.w++;
				a.score = theSumAsJavaScriptMakesIt(a.score, thisOrElse(st.score, 0));
				a.prov = theSumAsJavaScriptMakesIt(a.prov, thisOrElse(st.prov, 0));
			});
		});
		return Object.values(m).filter((a) => a !== void 0).sort((a, b) => b.w / b.n - a.w / a.n || b.n - a.n);
	};
	const tbl = (title, rows, head) => {
		if (!rows.length) return "";
		const out = [kcHtml`<div class="card"><h2>${title}</h2><table class="kc"><tr><th>${head}</th><th class="num">Realms</th><th class="num">Wins</th><th>Win rate</th><th class="num">Avg score</th><th class="num">Avg provinces</th></tr>`];
		rows.forEach((r) => {
			out.push(kcHtml`<tr><td><strong>${r.k}</strong></td><td class="num">${r.n}</td><td class="num">${r.w}</td>`, kcHtml`<td style="min-width:100px">${pctBar(r.w, r.n)}<span class="muted">${Math.round(100 * r.w / r.n)}%</span></td>`, kcHtml`<td class="num">${nf(Math.round(Number(r.score) / r.n))}</td><td class="num">${nf(Math.round(10 * Number(r.prov) / r.n) / 10)}</td></tr>`);
		});
		out.push(kcHtml`</table></div>`);
		return kcHtml`${out}`;
	};
	return kcHtml`${[
		tbl("🧭 By race", tally((s) => s.race), "Race"),
		tbl("☯ By creed", tally((s) => s.al), "Alignment"),
		tbl("🔀 By race and creed", tally((s) => s.race && s.al ? theSumAsJavaScriptMakesIt(theSumAsJavaScriptMakesIt(s.race, " · "), s.al) : null), "Race · Alignment"),
		tbl("🎲 By how the game ended", (() => {
			const m = {};
			G.forEach((g) => {
				const k = (g.victory ?? "") || "unfinished";
				const a = m[k] ??= {
					k,
					n: 0,
					w: 0,
					score: 0,
					prov: 0
				};
				a.n++;
				a.w += 0;
				a.score = theSumAsJavaScriptMakesIt(a.score, g.turns ?? 0);
				a.prov = theSumAsJavaScriptMakesIt(a.prov, thisOrElse(g.setup.realms, 0));
			});
			return Object.values(m).filter((a) => a !== void 0).map((a) => ({
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
		const s = g.setup, { bots, humans } = theBotsAndHumansOf(g);
		const dip = s.diplomacy === "hostile" ? kcHtml`<span class="pill pill-red">aggressive</span>` : bots ? kcHtml`<span class="pill pill-grey">normal</span>` : "";
		out.push(kcHtml`<tr class="gamerow${g.hidden ? " hidden-row" : ""}" onclick="toggleGame(${kcArg(g.game_id)})">`, kcHtml`<td class="muted">${dstr(g.finished_at)}</td>`, kcHtml`<td><strong>${g.game_name}</strong>${g.hidden ? kcHtml`<span class="pill pill-amber">hidden</span>` : ""}${g.note ? kcHtml`<span class="sm muted"> · ${g.note}</span>` : ""}</td>`, kcHtml`<td class="num">${(g.turns ?? 0) || "—"}</td>`, kcHtml`<td>${thisOrElse(s.realms, "—")} <span class="muted">(${humans}👤 ${bots}🤖)</span></td>`, kcHtml`<td>${bots ? kcHtml`${bots}${dip}` : kcHtml`<span class="pill pill-green">all human</span>`}</td>`, kcHtml`<td class="muted">${thisOrElse(mapKey(g), "—")}${s.seaPct !== null && s.seaPct !== void 0 ? theSumAsJavaScriptMakesIt(theSumAsJavaScriptMakesIt(" · ", s.seaPct), "% sea") : ""}</td>`, kcHtml`<td>${(g.winner_realm ?? "") || "—"}${winnerName(g) ? kcHtml` <span class="muted">(${winnerName(g)})</span>` : g.winner_is_bot ? kcHtml` <span class="pill pill-grey">bot</span>` : ""}</td>`, kcHtml`<td class="muted">${(g.victory ?? "") || "—"}</td>`, GM ? kcHtml`<td>${canEdit(g) ? kcHtml`<button class="btn btn-ghost" style="font-size:.6rem;padding:3px 8px" onclick="event.stopPropagation();toggleEdit(${kcArg(g.game_id)})">✏</button>` : ""}</td>` : "", kcHtml`</tr>`);
		out.push(kcHtml`<tr id="det-${g.game_id}" style="display:none"><td colspan="${GM ? 9 : 8}">${gameDetail(g)}</td></tr>`);
	});
	out.push(kcHtml`</table></div>`);
	return kcHtml`${out}`;
}
function gameDetail(g) {
	const out = [kcHtml`<div style="padding:4px 0 8px">`];
	out.push(kcHtml`<table class="kc"><tr><th class="num">Rank</th><th>Realm</th><th>Player</th><th>Race</th><th>Creed</th><th class="num">Score</th><th class="num">Provinces</th><th class="num">Gold</th><th class="num">Strength</th><th class="num">Titles</th><th>Fate</th></tr>`);
	theStandingsOf(g).forEach((held) => {
		const st = theStandingAsItsFieldsRead(held);
		out.push(kcHtml`<tr><td class="num">${thisOrElse(st.rank, "—")}</td><td><strong>${st.realm}</strong>${st.winner ? kcHtml`<span class="pill pill-green">victor</span>` : ""}</td>`, kcHtml`<td>${st.bot ? kcHtml`<span class="pill pill-grey">bot</span>` : thisOrElse(personName(held), "—")}</td><td>${thisOrElse(st.race, "—")}</td><td>${thisOrElse(st.al, "—")}</td>`, kcHtml`<td class="num">${nf(st.score)}</td><td class="num">${nf(st.prov)}</td><td class="num">${nf(st.gold)}</td><td class="num">${nf(st.str)}</td><td class="num">${theField(thisOrElse(st.titles, []), "length")}</td>`, kcHtml`<td class="muted">${st.outHow ? theSumAsJavaScriptMakesIt(st.outHow, st.outTurn ? theSumAsJavaScriptMakesIt(" turn ", st.outTurn) : "") : "survived"}</td></tr>`);
	});
	out.push(kcHtml`</table>`);
	const t = g.totals;
	out.push(kcHtml`<div class="muted" style="margin-top:7px">${nf(thisOrElse(t.battles, 0))} battles · ${nf(thisOrElse(t.casualties, 0))} units destroyed · ${nf(thisOrElse(t.captures, 0))} provinces changed hands · ${nf(thisOrElse(t.lairs, 0))} lair fights · ${nf(thisOrElse(t.spells, 0))} spells cast · ${nf(thisOrElse(t.deaths, 0))} characters killed · started ${dstr(g.started_at)}${GM ? kcHtml` · recorded by <code>${(g.build ?? "") || "unknown"}</code>` : ""}</div>`);
	if (GM && canEdit(g)) {
		const d = (g.finished_at ?? "").slice(0, 10);
		out.push(kcHtml`<div class="gmbox" id="edit-${g.game_id}" style="display:none">
      <h4>Game Master — edit this record</h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px">
        <div><label>Name on the board</label><input type="text" id="e-name-${g.game_id}" value="${g.game_name}"></div>
        <div><label>Date played</label><input type="date" id="e-date-${g.game_id}" value="${d}"></div>
        <div style="grid-column:1/-1"><label>Note</label><input type="text" id="e-note-${g.game_id}" value="${g.note ?? ""}" placeholder="e.g. the first Reckoning played to the wire"></div>
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
	if (r?.style.display === "none") r.style.display = "table-row";
	const b = $("edit-" + id);
	if (b) b.style.display = b.style.display === "none" ? "block" : "none";
}
async function saveGame(id) {
	const msg = $("e-msg-" + id);
	const name = theControl("e-name-" + id).value.trim(), note = theControl("e-note-" + id).value.trim(), date = theControl("e-date-" + id).value;
	const patch = {
		game_name: name || null,
		note: note || null
	};
	if (date) patch.finished_at = (/* @__PURE__ */ new Date(date + "T12:00:00")).toISOString();
	const { error } = await thePagesDb.theHallOfFame.changeThisGamesEntry(id, patch);
	if (error) {
		theElementFound(msg, "e-msg-" + id).innerHTML = String(kcHtml`<div class="msg-error">${error.message}</div>`);
		return;
	}
	theElementFound(msg, "e-msg-" + id).innerHTML = "<div class=\"msg-success\">Saved.</div>";
	const g = GAMES.find((x) => x.game_id === id);
	if (g) Object.assign(g, patch);
	setTimeout(() => {
		render();
	}, 500);
}
async function setHidden(id, hide) {
	const { error } = await thePagesDb.theHallOfFame.changeThisGamesEntry(id, { hidden: hide });
	if (error) {
		alert(error.message);
		return;
	}
	const g = GAMES.find((x) => x.game_id === id);
	if (g) g.hidden = hide;
	render();
}
async function renamePlayer(uid) {
	const cur = PEOPLE[uid] ?? "";
	const name = prompt("Player name on the leaderboard.\n\nThis is the person, not their realm — it changes on every game they have played.", cur);
	if (name === null) return;
	const t = name.trim();
	const msg = $("rename-msg");
	if (!t) {
		if (msg) msg.innerHTML = "<div class=\"msg-warning\">A player needs a name — nothing changed.</div>";
		return;
	}
	const { error } = await thePagesDb.theHallOfFame.renameThisPlayer(uid, t);
	if (error) {
		if (msg) msg.innerHTML = String(kcHtml`<div class="msg-error"><strong>Could not rename that player.</strong> ${error.message}</div>`);
		return;
	}
	PEOPLE[uid] = t;
	render();
	const m2 = $("rename-msg");
	if (m2) m2.innerHTML = String(kcHtml`<div class="msg-success">Renamed to ${t} — on every game they have played.</div>`);
}
async function deleteRecord(id, purge) {
	const g = GAMES.find((x) => x.game_id === id);
	const nm = g ? g.game_name : id;
	const q = purge ? `Delete EVERYTHING recorded about “${String(nm)}” — its Hall-of-Fame entry, its result rows and every recorded turn? This cannot be undone.` : `Remove “${String(nm)}” from the Hall of Fame? Its recorded turns are kept, so the GM portal can rebuild the entry later.`;
	if (!confirm(q)) return;
	let err = (await thePagesDb.theHallOfFame.deleteThisGamesEntry(id)).error;
	if (purge) {
		const r2 = await thePagesDb.theStatistics.deleteThisGamesResults(id);
		err = err ?? r2.error;
		const r3 = await thePagesDb.theStatistics.deleteThisGamesTurnRecords(id);
		err = err ?? r3.error;
	}
	if (err) {
		alert(err.message);
		return;
	}
	GAMES = GAMES.filter((x) => x.game_id !== id);
	buildFilterOptions();
	render();
}
kcDbGuard(thePagesDb, KC_DB_MIN).then(() => loadAll());
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
// src/ui/leaderboard/globals.ts
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
