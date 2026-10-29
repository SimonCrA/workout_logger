import { describe, expect, it } from 'vitest';
import { formatKg, formatWeight } from './labels';

describe('kilos as read in Spanish', () => {
	it('uses a decimal comma, a thousands dot from five digits and at most two decimals', () => {
		expect(formatKg(57.5)).toBe('57,5 kg');
		expect(formatKg(1225)).toBe('1225 kg');
		expect(formatKg(12000)).toBe('12.000 kg');
		expect(formatKg(61.254)).toBe('61,25 kg');
	});

	it('signs the weight by load mode: external as is, additional with +, assistance with −', () => {
		expect(formatWeight(60, 'external')).toBe('60 kg');
		expect(formatWeight(5, 'bodyweight')).toBe('+5 kg');
		expect(formatWeight(20, 'assisted')).toBe('−20 kg');
	});
});
