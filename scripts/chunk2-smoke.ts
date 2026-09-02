import { sanitizeSymbol, InvalidSymbolError } from '../src/lib/validators';
import { formatPrice, toISTParts, checkCircuit } from '../src/lib/utils';
import { isMarketOpen } from '../src/services/market/status';

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? `  -> ${detail}` : ''}`);
  }
}

console.log('== sanitizeSymbol ==');
check(
  "sanitizeSymbol('RELIANCE.NS') -> 'RELIANCE.NS'",
  sanitizeSymbol('RELIANCE.NS') === 'RELIANCE.NS'
);
check(
  "sanitizeSymbol(' reliance.ns ') -> 'RELIANCE.NS'",
  sanitizeSymbol(' reliance.ns ') === 'RELIANCE.NS'
);
check(
  "sanitizeSymbol('reliance.ns') -> 'RELIANCE.NS'",
  sanitizeSymbol('reliance.ns') === 'RELIANCE.NS'
);
let threw = false;
try {
  sanitizeSymbol('INVALID!');
} catch (e) {
  threw = e instanceof InvalidSymbolError;
}
check("sanitizeSymbol('INVALID!') throws InvalidSymbolError", threw);
threw = false;
try {
  sanitizeSymbol(123 as unknown);
} catch (e) {
  threw = e instanceof InvalidSymbolError;
}
check('sanitizeSymbol(non-string) throws InvalidSymbolError', threw);
check(
  "sanitizeSymbol('TOOLONGSYMBOLNAME1234.XS') throws",
  (() => {
    try {
      sanitizeSymbol('TOOLONGSYMBOLNAME1234.XS');
      return false;
    } catch {
      return true;
    }
  })()
);

console.log('\n== formatPrice ==');
check(
  "formatPrice(1234.5, 'RELIANCE.NS') -> '1234.50'",
  formatPrice(1234.5, 'RELIANCE.NS') === '1234.50'
);
check(
  "formatPrice(0, 'RELIANCE.NS') -> '0.00'",
  formatPrice(0, 'RELIANCE.NS') === '0.00'
);
check(
  "formatPrice(1234.5, 'TATASTEEL.NS') -> '1234.5'",
  formatPrice(1234.5, 'TATASTEEL.NS') === '1234.5'
);
check(
  "formatPrice(NaN, 'RELIANCE.NS') -> '—'",
  formatPrice(Number.NaN, 'RELIANCE.NS') === '—'
);

console.log('\n== isMarketOpen (IST boundary tests) ==');
// 2026-09-02 is a Wednesday. Use 09:30 IST as a known open moment.
const open = new Date('2026-09-02T04:00:00.000Z'); // 09:30 IST
const s1 = isMarketOpen(open);
check('09:30 IST weekday -> open', s1.open === true, s1.message);

const pre = new Date('2026-09-02T03:44:00.000Z'); // 09:14 IST
const s2 = isMarketOpen(pre);
check('09:14 IST weekday -> closed (pre-market)', s2.open === false, s2.message);

const sat = new Date('2026-09-05T05:00:00.000Z'); // Saturday 10:30 IST
const s3 = isMarketOpen(sat);
check('Saturday -> closed (weekend)', s3.open === false, s3.message);
check('Saturday reason is WEEKEND', s3.reason === 'WEEKEND');

const sun = new Date('2026-09-06T05:00:00.000Z');
const s4 = isMarketOpen(sun);
check('Sunday -> closed (weekend)', s4.open === false);

const holiday = new Date('2026-01-25T18:30:00.000Z'); // 2026-01-26 00:00 IST
const s5 = isMarketOpen(holiday);
check('Republic Day 2026-01-26 -> closed (HOLIDAY)', s5.open === false && s5.reason === 'HOLIDAY', s5.message);

const post = new Date('2026-09-02T10:01:00.000Z'); // 15:31 IST
const s6 = isMarketOpen(post);
check('15:31 IST weekday -> closed (post-market)', s6.open === false && s6.reason === 'POST_MARKET', s6.message);

const close = new Date('2026-09-02T10:00:00.000Z'); // 15:30 IST
const s7 = isMarketOpen(close);
check('15:30 IST -> closed (boundary, exclusive close)', s7.open === false, s7.message);

const openBoundary = new Date('2026-09-02T03:45:00.000Z'); // 09:15 IST
const s8 = isMarketOpen(openBoundary);
check('09:15 IST -> open (boundary, inclusive open)', s8.open === true, s8.message);

console.log('\n== toISTParts ==');
const p = toISTParts(new Date('2026-09-02T04:00:00.000Z'));
check('toISTParts UTC 04:00 -> IST 09:30', p.hour === 9 && p.minute === 30);
check('toISTParts weekday for 2026-09-02 is 3 (Wed)', p.weekday === 3);

console.log('\n== checkCircuit ==');
const c1 = checkCircuit(100, 125, 20);
check('+25% change hits upper circuit', c1.hit && c1.direction === 'upper');
const c2 = checkCircuit(100, 75, 20);
check('-25% change hits lower circuit', c2.hit && c2.direction === 'lower');
const c3 = checkCircuit(100, 105, 20);
check('+5% no circuit', !c3.hit && c3.direction === null);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
