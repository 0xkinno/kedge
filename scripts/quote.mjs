import { connect } from './lib.mjs';
const api = await connect();
console.log(api.tx.assetConversion.swapTokensForExactTokens.meta.args.map((a) => `${a.name}:${a.type}`).join(', '));
console.log('runtime apis:', Object.keys(api.call.assetConversionApi ?? {}).join(','));
const native = { Native: null }; const pusd = { WithId: 7777 };
try {
  const q = await api.call.assetConversionApi.getReserves(native, pusd); console.log('reserves', JSON.stringify(q.toHuman()));
  const need = 200n * 10n ** 6n; // 200 pUSD, 6 decimals
  const inq = await api.call.assetConversionApi.quotePriceTokensForExactTokens(native, pusd, need, true);
  console.log('tPOT planck needed for 200 pUSD:', inq.toString(), '=', Number(inq.toBigInt()) / 1e14, 'tPOT');
} catch (e) { console.log('quote error', e.message.slice(0, 200)); }
await api.disconnect(); process.exit(0);
