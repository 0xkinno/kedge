//! A seafarer's savings held natively in tPOT inside an ink! (WASM) contract on `pallet-contracts`.
//! Only the saver can withdraw. A Kedge rescue runs `withdraw_all_to` as the lost account, so the caller is the
//! lost account and the savings come home. Deliberately tiny: this chain charges 0.06 tPOT for every byte of
//! contract code, so there are no events and no error type; a refused call reverts.
#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod allotment_ink {
    use ink::storage::Mapping;

    #[ink(storage)]
    #[derive(Default)]
    pub struct AllotmentInk {
        savings: Mapping<AccountId, Balance>,
    }

    /// Revert without pulling in the panic formatting code (this chain charges 0.06 tPOT per byte of code).
    fn revert() -> ! {
        ink::env::return_value::<()>(ink::env::ReturnFlags::REVERT, &())
    }

    impl AllotmentInk {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }

        /// Save the attached value under the caller. Reverts if nothing is attached.
        #[ink(message, payable)]
        pub fn save(&mut self) {
            let who = self.env().caller();
            let v = self.env().transferred_value();
            if v == 0 {
                revert();
            }
            let now = self.savings.get(who).unwrap_or(0);
            self.savings.insert(who, &now.saturating_add(v));
        }

        #[ink(message)]
        pub fn savings_of(&self, who: AccountId) -> Balance {
            self.savings.get(who).unwrap_or(0)
        }

        /// Pay the caller's whole position to `to`. Reverts if the caller has nothing saved.
        #[ink(message)]
        pub fn withdraw_all_to(&mut self, to: AccountId) {
            let who = self.env().caller();
            let a = self.savings.take(who).unwrap_or(0);
            if a == 0 || self.env().transfer(to, a).is_err() {
                revert();
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        type Env = ink::env::DefaultEnvironment;
        fn caller(a: AccountId) { ink::env::test::set_caller::<Env>(a); }
        fn pay(v: Balance) { ink::env::test::set_value_transferred::<Env>(v); }

        #[ink::test]
        fn save_records_under_the_caller() {
            let a = ink::env::test::default_accounts::<Env>();
            let mut c = AllotmentInk::new();
            caller(a.alice); pay(500); c.save();
            assert_eq!(c.savings_of(a.alice), 500);
            assert_eq!(c.savings_of(a.bob), 0);
        }

        #[ink::test]
        fn saves_add_up() {
            let a = ink::env::test::default_accounts::<Env>();
            let mut c = AllotmentInk::new();
            caller(a.alice); pay(100); c.save(); pay(250); c.save();
            assert_eq!(c.savings_of(a.alice), 350);
        }

        #[ink::test]
        #[should_panic]
        fn saving_nothing_reverts() {
            let a = ink::env::test::default_accounts::<Env>();
            let mut c = AllotmentInk::new();
            caller(a.alice); pay(0); c.save();
        }

        #[ink::test]
        #[should_panic]
        fn a_non_saver_cannot_withdraw() {
            let a = ink::env::test::default_accounts::<Env>();
            let mut c = AllotmentInk::new();
            caller(a.alice); pay(500); c.save();
            caller(a.bob); c.withdraw_all_to(a.bob);
        }

        #[ink::test]
        fn a_non_saver_leaves_the_saver_untouched() {
            let a = ink::env::test::default_accounts::<Env>();
            let mut c = AllotmentInk::new();
            caller(a.alice); pay(500); c.save();
            assert_eq!(c.savings_of(a.alice), 500);
            assert_eq!(c.savings_of(a.charlie), 0);
        }
    }
}
