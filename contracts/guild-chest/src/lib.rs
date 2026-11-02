//! RobinHoot Guild Chest: the Hold & Win prize pots, run by code instead of by the founder.
//!
//! Money in: the 2% trading tax (in NEAR) is sent to `deposit_tax`. The contract splits it at once:
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
use near_sdk::{env, log, near, require, AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault, Promise, PromiseResult};

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
    pub draws: u64,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
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
    draws: Vector<Draw>,
}

#[near]
impl Contract {
    /// `cycle_start_ms`: the first draw (a Sunday at 20:00 UTC, in ms). Everything is fixed here, forever.
    #[init]
    pub fn new(dev_wallet: AccountId, reserve_wallet: AccountId, drawer: AccountId, cycle_start_ms: u64) -> Self {
        require!(cycle_start_ms % (24 * 3600 * 1000) == 20 * 3600 * 1000, "The cycle starts at 20:00 UTC");
        require!(((cycle_start_ms / (24 * 3600 * 1000)) + 4) % 7 == 0, "The cycle starts on a Sunday");
        Self {
            dev_wallet, reserve_wallet, drawer, cycle_start_ms,
            weekly_pot: 0, grand_pot: 0, next_draw_index: 0, last_activity_ms: env::block_timestamp_ms(),
            taxed: 0, to_dev: 0, to_reserve: 0, topped_up: 0, paid: 0,
            draws: Vector::new(Key::Draws),
        }
    }

    // ---------------- money in ----------------

    /// The trading tax, in NEAR. Split at once: 20% dev, then of the Guild's 80%: 30% weekly, 50% Grand, 20% reserve.
    #[payable]
    pub fn deposit_tax(&mut self) {
        let amount = env::attached_deposit().as_yoctonear();
        require!(amount > 0, "Attach the tax in NEAR");
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
        let _ = Promise::new(self.dev_wallet.clone()).transfer(NearToken::from_yoctonear(dev));
        let _ = Promise::new(self.reserve_wallet.clone()).transfer(NearToken::from_yoctonear(reserve));
        log!("EVENT_JSON:{}", near_sdk::serde_json::json!({"standard":"guildchest","version":"1.0.0","event":"tax","data":[{"from": env::predecessor_account_id(), "amount": U128(amount), "dev": U128(dev), "weekly": U128(weekly), "grand": U128(grand), "reserve": U128(reserve)}]}));
    }

    /// Anyone (usually the reserve wallet, in quiet weeks) can add NEAR straight to a pot. It never comes back out.
    #[payable]
    pub fn top_up(&mut self, pot: String) {
        let amount = env::attached_deposit().as_yoctonear();
        require!(amount > 0, "Attach NEAR");
        match pot.as_str() { "weekly" => self.weekly_pot += amount, "grand" => self.grand_pot += amount, _ => env::panic_str("pot must be weekly or grand") }
        self.topped_up += amount;
        log!("EVENT_JSON:{}", near_sdk::serde_json::json!({"standard":"guildchest","version":"1.0.0","event":"top_up","data":[{"from": env::predecessor_account_id(), "pot": pot, "amount": U128(amount)}]}));
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
        for w in &winners {
            let _ = Promise::new(w.account.clone()).transfer(NearToken::from_yoctonear(w.amount.0))
                .then(Self::ext(env::current_account_id()).with_static_gas(Gas::from_tgas(5)).on_paid(w.account.clone(), w.amount, grand));
        }

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

    /// A payment that bounced (for example an account that does not exist) goes back into its pot.
    #[private]
    #[allow(deprecated)]
    pub fn on_paid(&mut self, account: AccountId, amount: U128, grand: bool) {
        if !matches!(env::promise_result(0), PromiseResult::Successful(_)) {
            if grand { self.grand_pot += amount.0; } else { self.weekly_pot += amount.0; }
            self.paid -= amount.0;
            log!("Payment to {} failed: {} back in the pot", account, amount.0);
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
        let _ = Promise::new(self.reserve_wallet.clone()).transfer(NearToken::from_yoctonear(amount));
        log!("EVENT_JSON:{}", near_sdk::serde_json::json!({"standard":"guildchest","version":"1.0.0","event":"released","data":[{"to": self.reserve_wallet, "amount": U128(amount)}]}));
    }

    // ---------------- views ----------------

    pub fn get_chest(&self) -> ChestView {
        let now = env::block_timestamp_ms();
        let mut i = self.next_draw_index;
        while self.cycle_start_ms + i * WEEK_MS + WEEK_MS <= now { i += 1; } // skip Sundays already gone
        let grand = i % 4 == 3;
        ChestView {
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

pub fn hex(bytes: &[u8]) -> String { bytes.iter().map(|b| format!("{b:02x}")).collect() }

#[cfg(test)]
mod tests;
