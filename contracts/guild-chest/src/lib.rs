//! RobinHoot Guild Chest: the Hold & Win prize pots, run by code instead of by the founder.
//!
//! The chest runs in one coin, fixed at init: native NEAR (`token: None`) or one NEP-141 token such as PEARL.
//!
//! Money in: the 2% trading tax is sent to the chest (NEAR: `deposit_tax`; a token: `ft_transfer_call` with
//! msg "tax"). The contract splits it at once:
//!   20% → the dev wallet,
//!   80% → the Guild: 30% weekly pot · 50% Grand Prize pot · 20% → the reserve wallet.
//! The reserve wallet (the founder's) can only ADD to the pots (`top_up`), in quiet weeks.
//! Nobody can take money out of the pots: there is no owner and no withdraw method.
//!
//! Money out: every Sunday at 20:00 UTC there is a draw. The draw bot submits the list of eligible holders and
//! their tickets (built by scripts/draw.mjs from public chain data; anyone can rebuild it). The contract then
//! rolls the dice itself with NEAR's random seed and pays the winners in the same transaction:
//!   Sundays 1, 2, 3 of each 4-week cycle: the whole weekly pot, 40% / 30% / 30%.
//!   Sunday 4 (Grand Prize): 60% of the Grand pot, 50% / 12.5% × 4; 40% stays for the next cycle.
//! The bot chooses who is eligible (checkable by anyone), never who wins.

use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::store::Vector;
use near_sdk::{env, ext_contract, log, near, require, AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault, Promise, PromiseOrValue, PromiseResult};

pub const WEEK_MS: u64 = 7 * 24 * 3600 * 1000;
/// Shares, fixed forever (percent).
pub const DEV_PCT: u128 = 20;
pub const WEEKLY_PCT: u128 = 30; // of the Guild's 80%
pub const GRAND_PCT: u128 = 50; // of the Guild's 80%
pub const GRAND_PAID_PCT: u128 = 60; // of the Grand pot, on Grand Prize Sundays
pub const WEEKLY_SPLIT: [u128; 3] = [4000, 3000, 3000]; // bps
pub const GRAND_SPLIT: [u128; 5] = [5000, 1250, 1250, 1250, 1250]; // bps
/// If no draw happens for this long (the bot is dead), anyone can send the pots to the reserve wallet.
pub const ABANDONED_MS: u64 = 5 * WEEK_MS;
const MAX_ENTRIES: usize = 3000;
/// NEAR attached to register a winner on the token contract (refunded if already registered).
const STORAGE_DEPOSIT: NearToken = NearToken::from_micronear(2500);

#[ext_contract(ext_ft)]
#[allow(dead_code)]
trait FungibleToken {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
    fn storage_deposit(&mut self, account_id: Option<AccountId>, registration_only: Option<bool>);
}

#[derive(BorshSerialize, BorshStorageKey)]
#[borsh(crate = "near_sdk::borsh")]
enum Key { Draws }

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub struct Entry { pub account: AccountId, pub tickets: u32 }

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug, PartialEq)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Winner { pub account: AccountId, pub tickets: u32, pub amount: U128 }

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug, PartialEq)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Draw {
    pub index: u64,
    pub kind: String, // "weekly" | "grand"
    pub draw_time_ms: u64,
    pub settled_ms: u64,
    pub block: u64,
    pub entries: u32,
    pub tickets: u64,
    /// sha256 of the eligible list as the contract received it, sorted ("account:tickets\n" lines).
    pub list_hash: String,
    /// The random seed the contract rolled with (hex).
    pub seed: String,
    pub prize: U128,
    pub winners: Vec<Winner>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub struct ChestView {
    /// None: the chest runs in NEAR. Some: the NEP-141 token it runs in (e.g. PEARL).
    pub token: Option<AccountId>,
    pub dev_wallet: AccountId,
    pub reserve_wallet: AccountId,
    pub drawer: AccountId,
    pub cycle_start_ms: u64,
    pub weekly_pot: U128,
    pub grand_pot: U128,
    pub next_draw_index: u64,
    pub next_draw_ms: u64,
    pub next_draw_kind: String,
    pub next_prize: U128,
    pub taxed: U128,
    pub to_dev: U128,
    pub to_reserve: U128,
    pub topped_up: U128,
    pub paid: U128,
    /// Dev and reserve shares waiting to be sent (anyone can push them with `flush`).
    pub pending_dev: U128,
    pub pending_reserve: U128,
    /// When the last tax arrived (ms, 0 = never): the site estimates the tax still on its way from here.
    pub last_tax_ms: u64,
    pub draws: u64,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    token: Option<AccountId>,
    dev_wallet: AccountId,
    reserve_wallet: AccountId,
    drawer: AccountId,
    cycle_start_ms: u64,
    weekly_pot: u128,
    grand_pot: u128,
    next_draw_index: u64,
    last_activity_ms: u64,
    taxed: u128,
    to_dev: u128,
    to_reserve: u128,
    topped_up: u128,
    paid: u128,
    pending_dev: u128,
    pending_reserve: u128,
    last_tax_ms: u64,
    draws: Vector<Draw>,
}

#[near]
impl Contract {
    /// `cycle_start_ms`: the first draw (a Sunday at 20:00 UTC, in ms). `token`: None for NEAR, or the NEP-141 token
    /// the chest runs in. Everything is fixed here, forever.
    #[init]
    pub fn new(dev_wallet: AccountId, reserve_wallet: AccountId, drawer: AccountId, cycle_start_ms: u64, token: Option<AccountId>) -> Self {
        require!(cycle_start_ms % (24 * 3600 * 1000) == 20 * 3600 * 1000, "The cycle starts at 20:00 UTC");
        require!(((cycle_start_ms / (24 * 3600 * 1000)) + 4) % 7 == 0, "The cycle starts on a Sunday");
        Self {
            token, dev_wallet, reserve_wallet, drawer, cycle_start_ms,
            weekly_pot: 0, grand_pot: 0, next_draw_index: 0, last_activity_ms: env::block_timestamp_ms(),
            taxed: 0, to_dev: 0, to_reserve: 0, topped_up: 0, paid: 0, pending_dev: 0, pending_reserve: 0, last_tax_ms: 0,
            draws: Vector::new(Key::Draws),
        }
    }

    // ---------------- money in ----------------

    /// The trading tax, in NEAR (NEAR chests only). Split at once: 20% dev, then of the Guild's 80%:
    /// 30% weekly, 50% Grand, 20% reserve. Dev and reserve are sent in the same call.
    #[payable]
    pub fn deposit_tax(&mut self) {
        require!(self.token.is_none(), "This chest runs in a token: send it with ft_transfer_call, msg \"tax\"");
        let amount = env::attached_deposit().as_yoctonear();
        require!(amount > 0, "Attach the tax in NEAR");
        self.book_tax(env::predecessor_account_id(), amount);
        self.flush();
    }

    /// Anyone (usually the reserve wallet, in quiet weeks) can add NEAR straight to a pot (NEAR chests only).
    #[payable]
    pub fn top_up(&mut self, pot: String) {
        require!(self.token.is_none(), "This chest runs in a token: send it with ft_transfer_call, msg \"weekly\" or \"grand\"");
        let amount = env::attached_deposit().as_yoctonear();
        require!(amount > 0, "Attach NEAR");
        self.book_top_up(env::predecessor_account_id(), pot, amount);
    }

    /// Token chests: tokens arrive here through `ft_transfer_call`. msg "tax" (or empty) = trading tax, split at once;
    /// msg "weekly" / "grand" = a top-up of that pot. Only the chest's own token is accepted; others bounce back.
    pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> PromiseOrValue<U128> {
        require!(self.token.as_ref() == Some(&env::predecessor_account_id()), "This chest does not accept this token");
        require!(amount.0 > 0, "Nothing sent");
        match msg.as_str() {
            "" | "tax" => self.book_tax(sender_id, amount.0),
            "weekly" | "grand" => self.book_top_up(sender_id, msg, amount.0),
            _ => env::panic_str("msg must be tax, weekly or grand"),
        }
        // The dev and reserve shares wait in `pending_*`; the next draw (or anyone, with `flush`) sends them.
        PromiseOrValue::Value(U128(0))
    }

    /// Sends the dev and reserve shares that are waiting. Anyone can call it; the money only goes to those two wallets.
    pub fn flush(&mut self) {
        if self.pending_dev > 0 {
            let a = std::mem::take(&mut self.pending_dev);
            self.pay(self.dev_wallet.clone(), a, "dev");
        }
        if self.pending_reserve > 0 {
            let a = std::mem::take(&mut self.pending_reserve);
            self.pay(self.reserve_wallet.clone(), a, "reserve");
        }
    }

    // ---------------- money out ----------------

    /// The draw bot submits the eligible list for draw number `index` (0 = the first Sunday of the cycle).
    /// The contract rolls the dice itself and pays the winners. A missed Sunday can be skipped, never replayed.
    pub fn draw(&mut self, index: u64, entries: Vec<Entry>) -> Draw {
        require!(env::predecessor_account_id() == self.drawer, "Only the draw bot submits the list (it never picks the winners)");
        require!(index >= self.next_draw_index, "This draw already happened or was skipped");
        let draw_time = self.cycle_start_ms + index * WEEK_MS;
        let now = env::block_timestamp_ms();
        require!(now >= draw_time, "Too early: the draw is on Sunday at 20:00 UTC");
        require!(now < draw_time + WEEK_MS, "Too late: this Sunday's draw has passed");
        require!(entries.len() <= MAX_ENTRIES, "Too many entries for one transaction");

        // Canonical list: sorted by account, no duplicates, no zero tickets.
        let mut list = entries;
        list.sort_by(|a, b| a.account.cmp(&b.account));
        list.dedup_by(|a, b| a.account == b.account);
        list.retain(|e| e.tickets > 0);
        let canon: String = list.iter().map(|e| format!("{}:{}\n", e.account, e.tickets)).collect();
        let list_hash = hex(&env::sha256(canon.as_bytes()));

        let grand = index % 4 == 3;
        let (prize, split): (u128, &[u128]) = if grand { (self.grand_pot * GRAND_PAID_PCT / 100, &GRAND_SPLIT) } else { (self.weekly_pot, &WEEKLY_SPLIT) };
        let seed = env::random_seed();
        let kind = if grand { "grand" } else { "weekly" };

        // Pick winners: ticket number sha256(seed:kind:i) mod tickets left; the holder leaves the pot.
        let mut pool = list.clone();
        let mut winners = Vec::new();
        let mut paid = 0u128;
        for (i, bps) in split.iter().enumerate() {
            let total: u64 = pool.iter().map(|e| e.tickets as u64).sum();
            if total == 0 { break; }
            let mut input = seed.clone();
            input.extend_from_slice(format!(":{kind}:{i}").as_bytes());
            let h = env::sha256(&input);
            let mut pick = u64::from_le_bytes(h[..8].try_into().unwrap()) % total;
            let mut at = 0;
            while pick >= pool[at].tickets as u64 { pick -= pool[at].tickets as u64; at += 1; }
            let w = pool.remove(at);
            let amount = prize * bps / 10_000;
            paid += amount;
            winners.push(Winner { account: w.account, tickets: w.tickets, amount: U128(amount) });
        }
        if grand { self.grand_pot -= paid; } else { self.weekly_pot -= paid; }
        self.paid += paid;
        for w in &winners { self.pay(w.account.clone(), w.amount.0, kind); }
        self.flush();

        let d = Draw {
            index, kind: kind.into(), draw_time_ms: draw_time, settled_ms: now, block: env::block_height(),
            entries: list.len() as u32, tickets: list.iter().map(|e| e.tickets as u64).sum(),
            list_hash, seed: hex(&seed), prize: U128(prize), winners,
        };
        self.draws.push(d.clone());
        self.next_draw_index = index + 1;
        self.last_activity_ms = now;
        log!("EVENT_JSON:{}", near_sdk::serde_json::json!({"standard":"guildchest","version":"1.0.0","event":"draw","data":[d]}));
        d
    }

    /// A payment that bounced goes back where it came from: a prize into its pot, a dev/reserve share back to pending.
    #[private]
    #[allow(deprecated)]
    pub fn on_paid(&mut self, account: AccountId, amount: U128, pot: String) {
        if !matches!(env::promise_result(0), PromiseResult::Successful(_)) {
            match pot.as_str() {
                "grand" => { self.grand_pot += amount.0; self.paid -= amount.0; }
                "weekly" => { self.weekly_pot += amount.0; self.paid -= amount.0; }
                "dev" => self.pending_dev += amount.0,
                _ => self.pending_reserve += amount.0,
            }
            log!("Payment to {} failed: {} back in {}", account, amount.0, pot);
        }
    }

    /// Safety valve: if the draw bot has been silent for 5 weeks, anyone can send both pots to the reserve wallet,
    /// so the prizes are never stuck forever. Public and visible to everyone.
    pub fn release_abandoned(&mut self) {
        require!(env::block_timestamp_ms() >= self.last_activity_ms + ABANDONED_MS, "The draws are still running");
        let amount = self.weekly_pot + self.grand_pot;
        require!(amount > 0, "Nothing to release");
        self.weekly_pot = 0;
        self.grand_pot = 0;
        self.last_activity_ms = env::block_timestamp_ms();
        self.pay(self.reserve_wallet.clone(), amount, "reserve");
        log!("EVENT_JSON:{}", near_sdk::serde_json::json!({"standard":"guildchest","version":"1.0.0","event":"released","data":[{"to": self.reserve_wallet, "amount": U128(amount)}]}));
    }

    // ---------------- views ----------------

    pub fn get_chest(&self) -> ChestView {
        let now = env::block_timestamp_ms();
        let mut i = self.next_draw_index;
        while self.cycle_start_ms + i * WEEK_MS + WEEK_MS <= now { i += 1; } // skip Sundays already gone
        let grand = i % 4 == 3;
        ChestView {
            token: self.token.clone(), pending_dev: U128(self.pending_dev), pending_reserve: U128(self.pending_reserve), last_tax_ms: self.last_tax_ms,
            dev_wallet: self.dev_wallet.clone(), reserve_wallet: self.reserve_wallet.clone(), drawer: self.drawer.clone(),
            cycle_start_ms: self.cycle_start_ms, weekly_pot: U128(self.weekly_pot), grand_pot: U128(self.grand_pot),
            next_draw_index: i, next_draw_ms: self.cycle_start_ms + i * WEEK_MS,
            next_draw_kind: if grand { "grand".into() } else { "weekly".into() },
            next_prize: U128(if grand { self.grand_pot * GRAND_PAID_PCT / 100 } else { self.weekly_pot }),
            taxed: U128(self.taxed), to_dev: U128(self.to_dev), to_reserve: U128(self.to_reserve),
            topped_up: U128(self.topped_up), paid: U128(self.paid), draws: self.draws.len() as u64,
        }
    }

    pub fn get_draws(&self, limit: Option<u32>) -> Vec<Draw> {
        let n = self.draws.len();
        let take = limit.unwrap_or(20).min(50).min(n);
        (0..take).map(|k| self.draws[n - 1 - k].clone()).collect()
    }
}

impl Contract {
    fn book_tax(&mut self, from: AccountId, amount: u128) {
        let dev = amount * DEV_PCT / 100;
        let guild = amount - dev;
        let weekly = guild * WEEKLY_PCT / 100;
        let grand = guild * GRAND_PCT / 100;
        let reserve = guild - weekly - grand;
        self.weekly_pot += weekly;
        self.grand_pot += grand;
        self.taxed += amount;
        self.to_dev += dev;
        self.to_reserve += reserve;
        self.pending_dev += dev;
        self.pending_reserve += reserve;
        self.last_tax_ms = env::block_timestamp_ms();
        log!("EVENT_JSON:{}", near_sdk::serde_json::json!({"standard":"guildchest","version":"1.0.0","event":"tax","data":[{"from": from, "amount": U128(amount), "dev": U128(dev), "weekly": U128(weekly), "grand": U128(grand), "reserve": U128(reserve)}]}));
    }

    fn book_top_up(&mut self, from: AccountId, pot: String, amount: u128) {
        match pot.as_str() { "weekly" => self.weekly_pot += amount, "grand" => self.grand_pot += amount, _ => env::panic_str("pot must be weekly or grand") }
        self.topped_up += amount;
        log!("EVENT_JSON:{}", near_sdk::serde_json::json!({"standard":"guildchest","version":"1.0.0","event":"top_up","data":[{"from": from, "pot": pot, "amount": U128(amount)}]}));
    }

    /// Pays `amount` of the chest's coin to `to`. Tokens: register the receiver on the token first (refunded if
    /// already registered), then transfer. Any failure is caught by `on_paid` and put back.
    fn pay(&self, to: AccountId, amount: u128, pot: &str) {
        let back = Self::ext(env::current_account_id()).with_static_gas(Gas::from_tgas(5)).on_paid(to.clone(), U128(amount), pot.to_string());
        let _ = match &self.token {
            None => Promise::new(to).transfer(NearToken::from_yoctonear(amount)).then(back),
            Some(t) => ext_ft::ext(t.clone()).with_attached_deposit(STORAGE_DEPOSIT).with_static_gas(Gas::from_tgas(8))
                .storage_deposit(Some(to.clone()), Some(true))
                .then(ext_ft::ext(t.clone()).with_attached_deposit(NearToken::from_yoctonear(1)).with_static_gas(Gas::from_tgas(12))
                    .ft_transfer(to, U128(amount), Some("RobinHoot Guild Chest".into())))
                .then(back),
        };
    }
}

pub fn hex(bytes: &[u8]) -> String { bytes.iter().map(|b| format!("{b:02x}")).collect() }

#[cfg(test)]
mod tests;
