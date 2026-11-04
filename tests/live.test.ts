// Live tests: need the public node. They compare our encoder and call builders with polkadot.js on live V3 metadata.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { u8aToHex } from '@polkadot/util';
import * as S from '../watch/scale.mjs';
import { api, closeApi, setFriendGroups, initiate, approve, finish, cancel, slash, bringHome, sortFriends, remark, revokeInheritor } from '../apps/web/lib/kedge/purser';

after(async () => { await closeApi(); });
const A = (n: number) => new Uint8Array(32).fill(n); const H = (n: number) => u8aToHex(A(n));

test('scale.mjs equals polkadot.js byte for byte on live metadata', async () => {
  const a = await api();
  const lost = H(1), dest = H(2);
  assert.equal(S.remarkWithEvent('0x6b6564676520' + '70726f6265'), a.tx.system.remarkWithEvent('0x6b6564676520' + '70726f6265').method.toHex());
  assert.equal(S.transferKeepAlive(dest, 5n * 10n ** 14n), a.tx.balances.transferKeepAlive({ Id: dest }, 5n * 10n ** 14n).method.toHex());
  assert.equal(S.transferAll(dest, false), a.tx.balances.transferAll({ Id: dest }, false).method.toHex());
  assert.equal(S.assetsTransfer(20261104, dest, 150000000n), a.tx.assets.transfer(20261104, { Id: dest }, 150000000n).method.toHex());
  const group = { friends: [H(5), H(6), H(7)], friendsNeeded: 2, inheritor: H(8), inheritanceDelay: 10, inheritancePriority: 1, cancelDelay: 2 };
  assert.equal(S.setFriendGroups([group]), a.tx.recovery.setFriendGroups([group]).method.toHex());
  assert.equal(S.initiateAttempt(lost, 0), a.tx.recovery.initiateAttempt({ Id: lost }, 0).method.toHex());
  assert.equal(S.approveAttempt(lost, 3), a.tx.recovery.approveAttempt({ Id: lost }, 3).method.toHex());
  assert.equal(S.finishAttempt(lost, 0), a.tx.recovery.finishAttempt({ Id: lost }, 0).method.toHex());
  assert.equal(S.cancelAttempt(lost, 1), a.tx.recovery.cancelAttempt({ Id: lost }, 1).method.toHex());
  assert.equal(S.slashAttempt(2), a.tx.recovery.slashAttempt(2).method.toHex());
  assert.equal(S.revokeInheritor(), a.tx.recovery.revokeInheritor().method.toHex());
  const inner = S.transferKeepAlive(dest, 1n);
  assert.equal(S.controlInheritedAccount(lost, inner), a.tx.recovery.controlInheritedAccount({ Id: lost }, a.tx.balances.transferKeepAlive({ Id: dest }, 1n)).method.toHex());
  assert.equal(S.forceBatch([inner, S.transferAll(dest, true)]), a.tx.utility.forceBatch([a.tx.balances.transferKeepAlive({ Id: dest }, 1n), a.tx.balances.transferAll({ Id: dest }, true)]).method.toHex());
  for (const n of [0n, 63n, 64n, 16383n, 16384n, 2n ** 30n - 1n, 2n ** 30n, 10n ** 20n]) assert.equal(u8aToHex(S.compact(n)), u8aToHex(a.createType('Compact<u128>', n).toU8a()), `compact ${n}`);
});

test('purser: every builder equals the raw encoder, friends are sorted, duplicates refused, sweep order is revive, asset, native', async () => {
  const a = await api();
  const lost = A(1);
  assert.deepEqual(sortFriends([A(9), A(3), A(5)]).map((x) => x[0]), [3, 5, 9]);
  assert.throws(() => sortFriends([A(3), A(3)]), /duplicate/);
  const spec = { friends: [A(7), A(5), A(6)], friendsNeeded: 2, inheritor32: A(8), inheritanceDelay: 10, priority: 1, cancelDelay: 2 };
  assert.equal(await setFriendGroups([spec]), S.setFriendGroups([{ friends: [H(5), H(6), H(7)], friendsNeeded: 2, inheritor: H(8), inheritanceDelay: 10, inheritancePriority: 1, cancelDelay: 2 }]));
  assert.equal(await initiate(lost, 0), S.initiateAttempt(H(1), 0)); assert.equal(await approve(lost, 0), S.approveAttempt(H(1), 0));
  assert.equal(await finish(lost, 0), S.finishAttempt(H(1), 0)); assert.equal(await cancel(lost, 0), S.cancelAttempt(H(1), 0));
  assert.equal(await slash(1), S.slashAttempt(1)); assert.equal(await revokeInheritor(), S.revokeInheritor());
  assert.equal(await remark('0x00'), S.remarkWithEvent('0x00'));
  const hex = await bringHome(lost, A(2), [{ kind: 'native', keepAlive: false }, { kind: 'asset', assetId: 20261104, amount: 5n },
    { kind: 'revive', dest: '0x92cD058Cb7E4d69476bFc7Cbb7630C50f13B57D4', weightLimit: { refTime: 1000n, proofSize: 2000n }, depositLimit: 10n ** 13n, data: '0xdeadbeef' }]);
  const decoded = a.createType('Call', hex) as any; const batch = decoded.args[1]; const order = batch.args[0].map((c: any) => `${c.section}.${c.method}`);
  assert.deepEqual(order, ['revive.call', 'assets.transfer', 'balances.transferAll']);
  assert.equal(batch.method, 'forceBatch');
});

test('live chain still matches the pinned platform facts', async () => {
  const a = await api();
  assert.equal(a.runtimeVersion.specName.toString(), 'portaldot-v3'); assert.equal(a.runtimeVersion.specVersion.toNumber(), 3002);
  assert.equal(a.tx.recovery.setFriendGroups.callIndex.toString(), '30,2'); assert.equal(a.consts.recovery.securityDeposit.toString(), '0');
});
