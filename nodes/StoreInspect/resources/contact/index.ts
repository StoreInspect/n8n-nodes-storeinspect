import type { INodeProperties } from 'n8n-workflow';
import {
	cursorPagination,
	prepareContactReveal,
	prepareContactSearch,
	splitRevealResponse,
} from '../../GenericFunctions';
import {
	limitProperty,
	maxContactsPerStoreProperty,
	personFilterOptions,
	returnAllProperty,
	storeFilterOptions,
} from '../../descriptions';

const operation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['contact'] } },
	options: [
		{
			name: 'Reveal',
			value: 'reveal',
			action: 'Reveal contacts',
			description: 'Reveal contact details using StoreInspect credits',
			routing: {
				request: { method: 'POST', url: '/contacts/reveal' },
				send: { preSend: [prepareContactReveal] },
				output: { postReceive: [splitRevealResponse] },
			},
		},
		{
			name: 'Search',
			value: 'search',
			action: 'Search contacts',
			description: 'Search decision-maker contact previews',
			routing: {
				request: { method: 'POST', url: '/contacts/search' },
				send: { paginate: true, preSend: [prepareContactSearch] },
				operations: { pagination: cursorPagination },
			},
		},
	],
	default: 'search',
};

const contactSearchProperties: INodeProperties[] = [
	{
		...returnAllProperty,
		displayOptions: { show: { resource: ['contact'], operation: ['search'] } },
	},
	{
		...limitProperty,
		displayOptions: {
			show: { resource: ['contact'], operation: ['search'], returnAll: [false] },
		},
	},
	{
		...maxContactsPerStoreProperty,
		displayOptions: { show: { resource: ['contact'], operation: ['search'] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		options: [
			{
				displayName: 'Store Domains',
				name: 'domains',
				type: 'string',
				default: '',
				description: 'Comma-separated Shopify store domains',
			},
			...personFilterOptions,
			...storeFilterOptions,
		],
		displayOptions: { show: { resource: ['contact'], operation: ['search'] } },
	},
];

const contactRevealProperties: INodeProperties[] = [
	{
		displayName: 'Contact IDs',
		name: 'contactIds',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		description: 'Up to 10 StoreInspect contact IDs, separated by commas or new lines',
		displayOptions: { show: { resource: ['contact'], operation: ['reveal'] } },
	},
	{
		displayName: 'Idempotency Key',
		name: 'idempotencyKey',
		type: 'string',
		default: '',
		description:
			'Optional stable key that prevents duplicate credit spending when the same reveal request is retried',
		displayOptions: { show: { resource: ['contact'], operation: ['reveal'] } },
	},
];

export const contactDescription: INodeProperties[] = [
	operation,
	...contactSearchProperties,
	...contactRevealProperties,
];
