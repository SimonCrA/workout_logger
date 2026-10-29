import { describe, expect, it } from 'vitest';
import type { Workout } from '#lib/log/types.js';
import { attachToAccount, mergeRemote, ownsOtherAccountData, serverAccepts } from './rules';

function row(partial: Partial<Workout> = {}): Workout {
	return {
		id: 'w1',
		userId: 'u1',
		startedAt: '2026-10-28T18:00:00.000Z',
		endedAt: null,
		createdAt: '2026-10-28T18:00:00.000Z',
		updatedAt: '2026-10-28T18:00:00.000Z',
		deletedAt: null,
		pending: 1,
		...partial
	};
}

describe('serverAccepts (spec: accept if new or more recently updated, ignore the rest)', () => {
	it('accepts a row the server does not have', () => {
		expect(serverAccepts(undefined, row())).toBe(true);
	});

	it('accepts a newer update and ignores an older or equal one', () => {
		const stored = row({ updatedAt: '2026-10-28T19:00:00.000Z' });

		expect(serverAccepts(stored, row({ updatedAt: '2026-10-28T19:00:01.000Z' }))).toBe(true);
		expect(serverAccepts(stored, row({ updatedAt: '2026-10-28T19:00:00.000Z' }))).toBe(false);
		expect(serverAccepts(stored, row({ updatedAt: '2026-10-28T18:59:59.000Z' }))).toBe(false);
	});

	it('treats a deletion as one more update: the most recent change wins in both orders', () => {
		const edited = row({
			endedAt: '2026-10-28T20:00:00.000Z',
			updatedAt: '2026-10-28T20:00:00.000Z'
		});
		const deleted = row({
			deletedAt: '2026-10-28T21:00:00.000Z',
			updatedAt: '2026-10-28T21:00:00.000Z'
		});

		expect(serverAccepts(edited, deleted)).toBe(true);
		expect(serverAccepts(deleted, edited)).toBe(false);
	});
});

describe('mergeRemote (the same rule on the device, keeping local changes that are newer)', () => {
	it('takes a remote row the device does not have, not pending', () => {
		expect(mergeRemote(undefined, row({ pending: 0 }))).toEqual(row({ pending: 0 }));
	});

	it('replaces an older local row and clears its pending mark', () => {
		const local = row({ updatedAt: '2026-10-28T19:00:00.000Z', pending: 1 });
		const remote = row({
			endedAt: '2026-10-28T20:00:00.000Z',
			updatedAt: '2026-10-28T20:00:00.000Z',
			pending: 0
		});

		expect(mergeRemote(local, remote)).toEqual(remote);
	});

	it('keeps a newer local row, still pending, so it gets pushed', () => {
		const local = row({ updatedAt: '2026-10-28T21:00:00.000Z', pending: 1 });
		const remote = row({ updatedAt: '2026-10-28T20:00:00.000Z', pending: 0 });

		expect(mergeRemote(local, remote)).toBe(local);
	});

	it('clears the pending mark when both sides hold the same version', () => {
		const local = row({ pending: 1 });

		expect(mergeRemote(local, row({ pending: 0 }))).toEqual(row({ pending: 0 }));
	});
});

describe('attachToAccount (spec: anonymous rows join the account and get pushed)', () => {
	it('gives anonymous rows the account and marks them pending', () => {
		expect(attachToAccount(row({ userId: null, pending: 0 }), 'u9')).toEqual(
			row({ userId: 'u9', pending: 1 })
		);
	});

	it('leaves rows that already have an owner untouched', () => {
		const owned = row({ userId: 'u1', pending: 0 });

		expect(attachToAccount(owned, 'u9')).toBe(owned);
	});
});

describe('ownsOtherAccountData (spec: warn before mixing two accounts on one device)', () => {
	it('is true only when some local row belongs to a different account', () => {
		expect(ownsOtherAccountData([null, 'u1'], 'u1')).toBe(false);
		expect(ownsOtherAccountData([null, null], 'u1')).toBe(false);
		expect(ownsOtherAccountData(['u1', 'u2'], 'u1')).toBe(true);
	});
});
