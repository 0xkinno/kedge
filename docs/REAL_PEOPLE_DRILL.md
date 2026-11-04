# Real-people drill: protocol and record

Goal: one real rescue, on testnet, of a throwaway wallet, by 2 to 3 consenting people on their own phones. Record what really happened. Do not invent quotes, times or confusion points; if something did not happen, write that.

## Before (owner, about 15 minutes)
1. Pick 2 or 3 guardians. Get each one's consent to be named by first name, to be screen-recorded, and to have their reaction quoted. Write who said yes.
2. Each guardian installs a wallet on their phone (MetaMask mobile, Rabby mobile, or SubWallet for a native account) and adds the network: name Portaldot V3 testnet, chain id `420420777`, RPC `https://test-evm-rpc-v3.portaldot.dev`, symbol `tPOT`, explorer `https://scanner-testnet-v3.portaldot.dev`. (Kedge's Connect button offers to add it.)
3. Each guardian sends the owner their wallet address. The owner sends each guardian about 0.2 tPOT for fees (an approval costs about 0.016 tPOT). Do not send more.
4. The owner makes a throwaway "lost" wallet in MetaMask and funds it with about 3 tPOT. This is the wallet that will be "lost".

## The drill (clock starts at "the phone is lost")
5. **Owner, Harbour:** connect the throwaway wallet, make a Lifeboat key (passphrase), download the card, paste the guardians' addresses, choose "2 of 3" and the drill delay (10 blocks), set the new-phone address to the Lifeboat key's address, press Protect. Note the time.
6. **"Loss":** remove the throwaway wallet from the owner's phone or browser. From now on only the Lifeboat key and the guardians can act.
7. **Owner, new phone:** import the Lifeboat key from the card (QR or keystore plus passphrase) into a wallet, open Rescue for the lost address, connect. Four words appear.
8. **Owner calls guardian 1** by voice or video (not a text message) and reads the four words. **Guardian 1** opens the Crew door link, types the words, presses Start.
9. **Owner calls guardian 2**, same thing, presses Approve.
10. Wait for the delay (about a minute). **Owner:** press Bring it home. Note the time.

## Record (fill in during and after; keep it honest)
| Item | Value |
|---|---|
| Date | |
| Guardians (first names, consent given: yes/no) | |
| Wallets and phones used | |
| Minutes from "lost" (step 6) to "brought home" (step 10) | |
| Every point of confusion or error, in the person's words, with the time | |
| Anything that failed or had to be retried | |
| One-sentence reaction from each guardian (their words, with consent) | |
| Explorer links: set_friend_groups, initiate, approve, finish, control | |
| Screen recordings saved to | |
| Did the call phrase catch anything? (try giving a guardian one wrong word on purpose) | |

After the drill, copy the table into `PROOF.md` under "Real-people drill" and send the explorer links to be added to `EVIDENCE.md`. If nobody can take part, say so in the README instead of leaving a gap.
