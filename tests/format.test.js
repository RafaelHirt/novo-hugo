import test from 'node:test';
import assert from 'node:assert/strict';
import { currency, signedCurrency, parseCurrency } from '../format.js';

const spaces = text => text.replace(/\u00a0/g, ' ');

test('Valores em reais têm milhares, vírgula decimal e duas casas', () => {
  assert.equal(spaces(currency(27261236.24)), 'R$ 27.261.236,24');
  assert.equal(spaces(currency(27261236.24 * 12)), 'R$ 327.134.834,88');
  assert.equal(spaces(currency(308)), 'R$ 308,00');
});

test('Variações arredondadas a zero não exibem sinal', () => {
  assert.equal(spaces(signedCurrency(0.00000001)), 'R$ 0,00');
  assert.equal(spaces(signedCurrency(-0.00000001)), 'R$ 0,00');
  assert.equal(spaces(signedCurrency(-1234.56)), '-R$ 1.234,56');
  assert.equal(spaces(signedCurrency(1234.56)), '+R$ 1.234,56');
});

test('A edição aceita valores brasileiros e colagem de moeda', () => {
  assert.equal(parseCurrency('R$ 1.234,56'), 1234.56);
  assert.equal(parseCurrency('1234,56'), 1234.56);
  assert.equal(parseCurrency('1.234'), 1234);
  assert.equal(parseCurrency('999.23'), 999.23);
  assert.equal(parseCurrency('0,00'), 0);
  for (const value of ['', '-15', 'abc', '1,2,3', '1.23.4', 'Infinity']) {
    assert.equal(parseCurrency(value), null);
  }
});
