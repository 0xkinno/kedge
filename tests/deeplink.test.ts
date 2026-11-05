import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanDoor, doorQuery } from '../apps/web/lib/deeplink';
const G1 = '0xF75dC959e472419eE6520A39473D3236687844fF', G2 = '0x225B5e89825c49CC7CEc3d53a29748E28019bd6F';
test('deep link: https return accepted, everything else dropped', () => {
  assert.equal(cleanDoor(new URLSearchParams({ return: 'https://example.com/back?x=1' })).ret, 'https://example.com/back?x=1');
  for (const bad of ['http://example.com', 'javascript:alert(1)', 'data:text/html,hi', 'https://user:pw@example.com', 'ftp://x.y', 'not a url', 'https://' + 'a'.repeat(600) + '.com'])
    assert.equal(cleanDoor(new URLSearchParams({ return: bad })).ret, undefined, bad);
});
test('deep link: names are plain text, guardians must be addresses, need is 1 to 3', () => {
  const d = cleanDoor(new URLSearchParams({ app: '<script>Moon Wallet</script>', guardians: `${G1}, nope, ${G2}`, need: '2' }));
  assert.equal(d.app, 'scriptMoon Walletscript'); assert.deepEqual(d.guardians, [G1, G2]); assert.equal(d.need, 2);
  assert.equal(cleanDoor(new URLSearchParams({ need: '9' })).need, undefined); assert.equal(cleanDoor(new URLSearchParams({ need: '0' })).need, undefined);
  assert.equal(doorQuery(cleanDoor({})), '');
});
