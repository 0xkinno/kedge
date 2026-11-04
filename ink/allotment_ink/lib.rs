//! A seafarer's savings held natively in tPOT inside an ink! (WASM) contract on `pallet-contracts`.
//! Only the saver can withdraw, which is the point: a Kedge rescue runs `withdraw_all_to` as the lost account,
//! so the caller is the lost account and the savings come home. Mirrors the Solidity AllotmentVault.
#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod allotment_ink {
    use ink::storage::Mapping;

    #[ink(storage)]
    #[derive(Default)]
    pub struct AllotmentInk {
        savings: Mapping<AccountId, Balance>,
    }

    #[ink(event)]
    pub struct Saved {
        #[ink(topic)]
        saver: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct Withdrawn {
        #[ink(topic)]
        saver: AccountId,
        #[ink(topic)]
        to: AccountId,
        amount: Balance,
    }

    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        /// Nothing sent, or nothing saved.
        Nothing,
        /// The native transfer failed.
        TransferFailed,
    }

    impl AllotmentInk {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }

        /// Save the attached value under the caller.
        #[ink(message, payable)]
        pub fn save(&mut self) -> Result<(), Error> {
            let saver = self.env().caller();
            let amount = self.env().transferred_value();
            if amount == 0 {
                return Err(Error::Nothing);
            }
            let now = self.savings.get(saver).unwrap_or(0);
            self.savings.insert(saver, &(now.saturating_add(amount)));
            self.env().emit_event(Saved { saver, amount });
            Ok(())
        }

        #[ink(message)]
        pub fn savings_of(&self, who: AccountId) -> Balance {
            self.savings.get(who).unwrap_or(0)
        }

        /// Pay the caller's whole position to `to`. Run by a rescue as the lost account: the caller is the lost account.
        #[ink(message)]
        pub fn withdraw_all_to(&mut self, to: AccountId) -> Result<(), Error> {
            let saver = self.env().caller();
            let amount = self.savings.take(saver).unwrap_or(0); // frees the slot, returns its deposit
            if amount == 0 {
                return Err(Error::Nothing);
            }
            self.env().transfer(to, amount).map_err(|_| Error::TransferFailed)?;
            self.env().emit_event(Withdrawn { saver, to, amount });
            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        fn accounts() -> ink::env::test::DefaultAccounts<ink::env::DefaultEnvironment> {
            ink::env::test::default_accounts::<ink::env::DefaultEnvironment>()
        }
        fn set_caller(a: AccountId) {
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(a);
        }
        fn pay(v: Balance) {
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(v);
        }

        #[ink::test]
        fn save_records_under_the_caller() {
            let a = accounts();
            let mut c = AllotmentInk::new();
            set_caller(a.alice);
            pay(500);
            assert_eq!(c.save(), Ok(()));
            assert_eq!(c.savings_of(a.alice), 500);
            assert_eq!(c.savings_of(a.bob), 0);
        }

        #[ink::test]
        fn saving_nothing_is_refused() {
            let a = accounts();
            let mut c = AllotmentInk::new();
            set_caller(a.alice);
            pay(0);
            assert_eq!(c.save(), Err(Error::Nothing));
        }

        #[ink::test]
        fn saves_add_up() {
            let a = accounts();
            let mut c = AllotmentInk::new();
            set_caller(a.alice);
            pay(100);
            c.save().unwrap();
            pay(250);
            c.save().unwrap();
            assert_eq!(c.savings_of(a.alice), 350);
        }

        #[ink::test]
        fn a_non_saver_gets_nothing() {
            let a = accounts();
            let mut c = AllotmentInk::new();
            set_caller(a.alice);
            pay(500);
            c.save().unwrap();
            set_caller(a.bob);
            assert_eq!(c.withdraw_all_to(a.bob), Err(Error::Nothing));
            assert_eq!(c.savings_of(a.alice), 500);
        }

        #[ink::test]
        fn withdraw_with_no_savings_is_refused() {
            let a = accounts();
            let mut c = AllotmentInk::new();
            set_caller(a.alice);
            assert_eq!(c.withdraw_all_to(a.charlie), Err(Error::Nothing));
        }
    }
}
