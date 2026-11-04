use super::*;
use near_sdk::test_utils::{accounts, get_logs, VMContextBuilder};
use near_sdk::testing_env;

const START: u64 = 1_794_168_000_000; // Sunday 8 Nov 2026, 20:00 UTC
const NEAR: u128 = 1_000_000_000_000_000_000_000_000;

fn ctx(pred: AccountId, ms: u64, deposit: u128, seed: u8) -> VMContextBuilder {
    let mut b = VMContextBuilder::new();
    b.current_account_id("chest.near".parse().unwrap()).predecessor_account_id(pred)
        .block_timestamp(ms * 1_000_000).attached_deposit(NearToken::from_yoctonear(deposit))
        .random_seed([seed; 32]).account_balance(NearToken::from_near(10_000));
    b
}
fn dev() -> AccountId { "dev.near".parse().unwrap() }
fn reserve() -> AccountId { "reserve.near".parse().unwrap() }
fn bot() -> AccountId { "drawbot.near".parse().unwrap() }
fn chest() -> Contract {
    testing_env!(ctx(accounts(0), START - 10 * WEEK_MS, 0, 1).build());
    Contract::new(dev(), reserve(), bot(), START, None)
}
fn entries(n: usize) -> Vec<Entry> {
    (0..n).map(|i| Entry { account: format!("holder{i:03}.near").parse().unwrap(), tickets: (i % 10 + 1) as u32 }).collect()
}
fn tax(c: &mut Contract, near: u128, ms: u64) {
    testing_env!(ctx(accounts(1), ms, near * NEAR, 1).build());
    c.deposit_tax();
}

#[test]
fn the_cycle_must_start_on_a_sunday_evening() {
    testing_env!(ctx(accounts(0), START, 0, 1).build());
    for bad in [START + 3600_000, START + 24 * 3600_000] {
        assert!(std::panic::catch_unwind(|| Contract::new(dev(), reserve(), bot(), bad, None)).is_err());
    }
}

#[test]
fn the_tax_is_split_20_dev_then_30_50_20() {
    let mut c = chest();
    tax(&mut c, 100, START - WEEK_MS);
    let v = c.get_chest();
    assert_eq!(v.to_dev.0, 20 * NEAR);
    assert_eq!(v.weekly_pot.0, 24 * NEAR); // 30% of 80
    assert_eq!(v.grand_pot.0, 40 * NEAR); // 50% of 80
    assert_eq!(v.to_reserve.0, 16 * NEAR); // 20% of 80
    assert!(get_logs().iter().any(|l| l.contains("\"event\":\"tax\"")));
}

#[test]
fn a_weekly_draw_pays_the_whole_weekly_pot_40_30_30() {
    let mut c = chest();
    tax(&mut c, 100, START - WEEK_MS);
    testing_env!(ctx(bot(), START + 600_000, 0, 7).build());
    let d = c.draw(0, entries(50));
    assert_eq!(d.kind, "weekly");
    assert_eq!(d.prize.0, 24 * NEAR);
    let amounts: Vec<u128> = d.winners.iter().map(|w| w.amount.0).collect();
    assert_eq!(amounts, vec![24 * NEAR * 40 / 100, 24 * NEAR * 30 / 100, 24 * NEAR * 30 / 100]);
    let mut names: Vec<_> = d.winners.iter().map(|w| w.account.clone()).collect();
    names.dedup();
    assert_eq!(names.len(), 3, "three different winners");
    assert_eq!(c.get_chest().weekly_pot.0, 0);
    assert_eq!(c.get_chest().grand_pot.0, 40 * NEAR);
}

#[test]
fn the_fourth_sunday_is_the_grand_prize_and_keeps_40_percent() {
    let mut c = chest();
    tax(&mut c, 100, START - WEEK_MS);
    for i in 0..3u64 {
        testing_env!(ctx(bot(), START + i * WEEK_MS + 1, 0, i as u8).build());
        c.draw(i, entries(20));
    }
    testing_env!(ctx(bot(), START + 3 * WEEK_MS + 1, 0, 9).build());
    let d = c.draw(3, entries(20));
    assert_eq!(d.kind, "grand");
    assert_eq!(d.prize.0, 24 * NEAR); // 60% of 40
    assert_eq!(d.winners.len(), 5);
    assert_eq!(d.winners[0].amount.0, 12 * NEAR);
    assert_eq!(d.winners[4].amount.0, 3 * NEAR);
    assert_eq!(c.get_chest().grand_pot.0, 16 * NEAR);
}

#[test]
fn only_the_bot_on_time_and_never_twice() {
    let mut c = chest();
    tax(&mut c, 10, START - WEEK_MS);
    let mut fails = |pred: AccountId, ms: u64, index: u64| {
        testing_env!(ctx(pred, ms, 0, 3).build());
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| { c.draw(index, entries(5)); })).is_err()
    };
    assert!(fails(accounts(2), START + 1, 0), "not the bot");
    assert!(fails(bot(), START - 1, 0), "too early");
    assert!(fails(bot(), START + WEEK_MS, 0), "too late");
    assert!(!fails(bot(), START + 1, 0), "on time");
    assert!(fails(bot(), START + 2, 0), "never twice");
    assert!(!fails(bot(), START + 2 * WEEK_MS + 1, 2), "a missed Sunday can be skipped");
    assert!(fails(bot(), START + 2 * WEEK_MS + 2, 1), "and never replayed");
}

#[test]
fn few_entries_pay_only_who_is_there_the_rest_stays() {
    let mut c = chest();
    tax(&mut c, 100, START - WEEK_MS);
    testing_env!(ctx(bot(), START + 1, 0, 4).build());
    let mut list = entries(1);
    list.push(list[0].clone()); // a duplicate is ignored
    list.push(Entry { account: "zero.near".parse().unwrap(), tickets: 0 }); // zero tickets cannot win
    let d = c.draw(0, list);
    assert_eq!(d.entries, 1);
    assert_eq!(d.winners.len(), 1);
    assert_eq!(c.get_chest().weekly_pot.0, 24 * NEAR * 60 / 100);
}

#[test]
fn more_tickets_win_more_often() {
    let mut wins_big = 0;
    for seed in 0..200u8 {
        let mut c = chest();
        tax(&mut c, 10, START - WEEK_MS);
        testing_env!(ctx(bot(), START + 1, 0, seed).build());
        let d = c.draw(0, vec![
            Entry { account: "big.near".parse().unwrap(), tickets: 10 },
            Entry { account: "a.near".parse().unwrap(), tickets: 1 }, Entry { account: "b.near".parse().unwrap(), tickets: 1 },
            Entry { account: "c.near".parse().unwrap(), tickets: 1 }, Entry { account: "d.near".parse().unwrap(), tickets: 1 },
            Entry { account: "e.near".parse().unwrap(), tickets: 1 }, Entry { account: "f.near".parse().unwrap(), tickets: 1 },
            Entry { account: "g.near".parse().unwrap(), tickets: 1 }, Entry { account: "h.near".parse().unwrap(), tickets: 1 },
            Entry { account: "i.near".parse().unwrap(), tickets: 1 }, Entry { account: "j.near".parse().unwrap(), tickets: 1 },
        ]);
        if d.winners[0].account.as_str() == "big.near" { wins_big += 1; }
    }
    // 10 of 20 tickets: about half of the first prizes.
    assert!((70..=130).contains(&wins_big), "big won {wins_big} of 200");
}

#[test]
fn top_ups_add_and_nothing_comes_out_until_the_bot_is_dead() {
    let mut c = chest();
    testing_env!(ctx(reserve(), START - WEEK_MS, 5 * NEAR, 1).build());
    c.top_up("grand".into());
    assert_eq!(c.get_chest().grand_pot.0, 5 * NEAR);
    testing_env!(ctx(accounts(3), START - 6 * WEEK_MS, 0, 1).build());
    assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| c.release_abandoned())).is_err());
    testing_env!(ctx(accounts(3), START - 10 * WEEK_MS + ABANDONED_MS + 1, 0, 1).build());
    c.release_abandoned();
    assert_eq!(c.get_chest().grand_pot.0, 0);
}

// ---------------- PEARL (or any NEP-141 token) chest ----------------

fn pearl() -> AccountId { "pearl.near".parse().unwrap() }
fn token_chest() -> Contract {
    testing_env!(ctx(accounts(0), START - 10 * WEEK_MS, 0, 1).build());
    Contract::new(dev(), reserve(), bot(), START, Some(pearl()))
}
fn send_pearl(c: &mut Contract, from_token: AccountId, amount: u128, msg: &str) {
    testing_env!(ctx(from_token, START - WEEK_MS, 0, 1).build());
    let _ = c.ft_on_transfer(accounts(1), U128(amount), msg.into());
}

#[test]
fn a_token_chest_splits_pearl_the_same_way() {
    let mut c = token_chest();
    send_pearl(&mut c, pearl(), 1000, "tax");
    let v = c.get_chest();
    assert_eq!(v.token, Some(pearl()));
    assert_eq!((v.weekly_pot.0, v.grand_pot.0), (240, 400));
    assert_eq!((v.pending_dev.0, v.pending_reserve.0), (200, 160));
    testing_env!(ctx(accounts(4), START - WEEK_MS, 0, 1).build());
    c.flush();
    let v = c.get_chest();
    assert_eq!((v.pending_dev.0, v.pending_reserve.0), (0, 0), "flush sends dev and reserve");
    send_pearl(&mut c, pearl(), 50, "grand");
    assert_eq!(c.get_chest().grand_pot.0, 450);
}

#[test]
fn a_token_chest_refuses_other_tokens_and_native_near() {
    let mut c = token_chest();
    let other: AccountId = "fake-pearl.near".parse().unwrap();
    assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| send_pearl(&mut c, other.clone(), 1000, "tax"))).is_err());
    testing_env!(ctx(accounts(1), START - WEEK_MS, NEAR, 1).build());
    assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| c.deposit_tax())).is_err());
    assert_eq!(c.get_chest().taxed.0, 0);
}

#[test]
fn a_token_chest_draws_and_pays_in_pearl() {
    let mut c = token_chest();
    send_pearl(&mut c, pearl(), 10_000, "");
    testing_env!(ctx(bot(), START + 1, 0, 5).build());
    let d = c.draw(0, entries(30));
    assert_eq!(d.prize.0, 2400);
    assert_eq!(d.winners.iter().map(|w| w.amount.0).collect::<Vec<_>>(), vec![960, 720, 720]);
    let v = c.get_chest();
    assert_eq!(v.weekly_pot.0, 0);
    assert_eq!((v.pending_dev.0, v.pending_reserve.0), (0, 0), "the draw also sends dev and reserve");
}

#[test]
fn a_bounced_payment_goes_back() {
    let mut c = token_chest();
    send_pearl(&mut c, pearl(), 10_000, "tax");
    testing_env!(ctx(bot(), START + 1, 0, 5).build());
    let d = c.draw(0, entries(30));
    let w = d.winners[0].clone();
    let mut b = ctx("chest.near".parse().unwrap(), START + 2, 0, 1);
    b.current_account_id("chest.near".parse().unwrap());
    testing_env!(b.build(), near_sdk::test_vm_config(), near_sdk::RuntimeFeesConfig::test(), Default::default(), vec![PromiseResult::Failed]);
    c.on_paid(w.account, w.amount, "weekly".into());
    assert_eq!(c.get_chest().weekly_pot.0, 960);
    testing_env!(b.build(), near_sdk::test_vm_config(), near_sdk::RuntimeFeesConfig::test(), Default::default(), vec![PromiseResult::Failed]);
    c.on_paid(dev(), U128(2000), "dev".into());
    assert_eq!(c.get_chest().pending_dev.0, 2000);
}
