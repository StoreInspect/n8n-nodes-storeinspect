/// <reference types="vitest/globals" />

import type { IExecutePaginationFunctions, IExecuteSingleFunctions } from 'n8n-workflow';
import {
	buildContactRevealBody,
	buildContactSearchBody,
	buildStoreEnrichBody,
	buildStoreSearchBody,
	cursorPagination,
	parseList,
	splitRevealResponse,
} from '../nodes/StoreInspect/GenericFunctions';

function context(parameters: Record<string, unknown>): IExecuteSingleFunctions {
	return {
		getNodeParameter: (name: string, fallback?: unknown) => parameters[name] ?? fallback,
		getNode: () => ({ name: 'StoreInspect' }),
	} as unknown as IExecuteSingleFunctions;
}

describe('StoreInspect request builders', () => {
	it('normalizes and deduplicates comma- and newline-separated values', () => {
		expect(parseList('fashion, beauty\nfashion,')).toEqual(['fashion', 'beauty']);
	});

	it('builds nested store filters and preserves explicit false values', () => {
		const body = buildStoreSearchBody(
			context({
				returnAll: false,
				limit: 12,
				filters: {
					categories: 'fashion, beauty, fashion',
					shopifyPlus: 'no',
					appsAny: 'klaviyo, recharge',
					minimumActiveAds: 0,
					hasRevealableContacts: 'yes',
				},
			}),
		);

		expect(body).toEqual({
			filters: {
				categories: ['fashion', 'beauty'],
				shopify_plus: false,
				apps: { any: ['klaviyo', 'recharge'] },
				meta_ads: { active_ads_min: 0 },
				contacts: { has_revealable_contacts: true },
			},
			limit: 12,
		});
	});

	it('omits empty optional contact filters', () => {
		const body = buildContactSearchBody(
			context({
				returnAll: true,
				maxContactsPerStore: 2,
				filters: { domains: 'allbirds.com', hasPhone: 'any' },
			}),
		);

		expect(body).toEqual({
			store: { domains: ['allbirds.com'] },
			max_contacts_per_store: 2,
			limit: 100,
		});
	});

	it('enforces enrich and reveal request limits', () => {
		expect(
			buildStoreEnrichBody(
				context({
					domains: 'allbirds.com\ngymshark.com',
					include: ['store', 'technologies'],
					contactRoles: 'founder, marketing',
					maxContactsPerStore: 3,
				}),
			),
		).toEqual({
			domains: ['allbirds.com', 'gymshark.com'],
			include: ['store', 'technologies'],
			contact_roles: ['founder', 'marketing'],
			max_contacts_per_store: 3,
			reveal_contacts: false,
		});

		const tooManyContacts = Array.from({ length: 11 }, (_, index) => `ct_Test_${index}`);
		expect(() =>
			buildContactRevealBody(context({ contactIds: tooManyContacts.join(',') })),
		).toThrow('up to 10 contacts');
	});
});

describe('StoreInspect response handling', () => {
	it('returns every revealed contact with credit and request metadata', async () => {
		const output = await splitRevealResponse.call(
			context({}),
			[],
			{
				body: {
					data: [{ id: 'ct_Test_ABCDEFGHIJKLMNOP' }],
					credits: { spent: 1, remaining: 9 },
					request_id: 'req_test',
				},
				headers: {},
				statusCode: 200,
			},
		);

		expect(output).toEqual([
			{
				json: {
					id: 'ct_Test_ABCDEFGHIJKLMNOP',
					credits: { spent: 1, remaining: 9 },
					request_id: 'req_test',
				},
			},
		]);
	});

	it('paginates with body cursors and avoids repeated cursors', async () => {
		const makeRoutingRequest = vi
			.fn()
			.mockResolvedValueOnce([
				{
					json: {
						data: [{ id: 'one' }],
						has_more: true,
						next_cursor: 'cur_next',
						request_id: 'req_one',
					},
				},
			])
			.mockResolvedValueOnce([
				{
					json: {
						data: [{ id: 'two' }],
						has_more: true,
						next_cursor: 'cur_next',
						request_id: 'req_two',
					},
				},
			]);
		const paginationContext = {
			getNodeParameter: (name: string) => (name === 'returnAll' ? true : 50),
			makeRoutingRequest,
		} as unknown as IExecutePaginationFunctions;
		const requestOptions = { options: { body: { filters: {}, limit: 100 } } };

		const output = await cursorPagination.call(
			paginationContext,
			requestOptions as never,
		);

		expect(output).toEqual([
			{ json: { id: 'one', request_id: 'req_one' } },
			{ json: { id: 'two', request_id: 'req_two' } },
		]);
		expect(makeRoutingRequest).toHaveBeenCalledTimes(2);
		expect(requestOptions.options.body).toMatchObject({ cursor: 'cur_next', limit: 100 });
	});
});
