import type { INodeProperties } from 'n8n-workflow';
import { cursorPagination, prepareStoreEnrich, prepareStoreSearch, splitDataResponse } from '../../GenericFunctions';
import {
	contactAvailabilityFilterOptions,
	limitProperty,
	maxContactsPerStoreProperty,
	returnAllProperty,
	storeFilterOptions,
} from '../../descriptions';

const storeOperation = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options' as const,
	noDataExpression: true,
	displayOptions: { show: { resource: ['store'] } },
	options: [
		{
			name: 'Enrich',
			value: 'enrich',
			action: 'Enrich Shopify stores',
			description: 'Enrich up to 25 Shopify store domains',
			routing: {
				request: { method: 'POST' as const, url: '/stores/enrich' },
				send: { preSend: [prepareStoreEnrich] },
				output: { postReceive: [splitDataResponse] },
			},
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a Shopify store',
			description: 'Get one Shopify store by domain',
			routing: {
				request: {
					method: 'GET' as const,
					url: '=/stores/{{encodeURIComponent($parameter.domain)}}',
				},
			},
		},
		{
			name: 'Search',
			value: 'search',
			action: 'Search Shopify stores',
			description: 'Search Shopify stores using commerce and technology filters',
			routing: {
				request: { method: 'POST' as const, url: '/stores/search' },
				send: { paginate: true, preSend: [prepareStoreSearch] },
				operations: { pagination: cursorPagination },
			},
		},
	],
	default: 'search',
};

const storeGetProperties: INodeProperties[] = [
	{
		displayName: 'Domain',
		name: 'domain',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'allbirds.com',
		description: 'Shopify store domain or URL',
		displayOptions: { show: { resource: ['store'], operation: ['get'] } },
	},
];

const storeSearchProperties: INodeProperties[] = [
	{
		...returnAllProperty,
		displayOptions: { show: { resource: ['store'], operation: ['search'] } },
	},
	{
		...limitProperty,
		displayOptions: {
			show: { resource: ['store'], operation: ['search'], returnAll: [false] },
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		options: [...storeFilterOptions, ...contactAvailabilityFilterOptions],
		displayOptions: { show: { resource: ['store'], operation: ['search'] } },
	},
];

const storeEnrichProperties: INodeProperties[] = [
	{
		displayName: 'Domains',
		name: 'domains',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		placeholder: 'allbirds.com\ngymshark.com',
		description: 'Up to 25 domains or URLs, separated by commas or new lines',
		displayOptions: { show: { resource: ['store'], operation: ['enrich'] } },
	},
	{
		displayName: 'Include',
		name: 'include',
		type: 'multiOptions',
		options: [
			{ name: 'Contact Previews', value: 'contact_previews' },
			{ name: 'Store', value: 'store' },
			{ name: 'Technologies', value: 'technologies' },
		],
		default: ['store', 'technologies'],
		description: 'Data to include for each enriched domain',
		displayOptions: { show: { resource: ['store'], operation: ['enrich'] } },
	},
	{
		displayName: 'Contact Roles',
		name: 'contactRoles',
		type: 'string',
		default: '',
		description: 'Comma-separated contact role slugs used when contact previews are included',
		displayOptions: { show: { resource: ['store'], operation: ['enrich'] } },
	},
	{
		...maxContactsPerStoreProperty,
		displayOptions: { show: { resource: ['store'], operation: ['enrich'] } },
	},
];

export const storeDescription: INodeProperties[] = [
	storeOperation,
	...storeGetProperties,
	...storeSearchProperties,
	...storeEnrichProperties,
];
