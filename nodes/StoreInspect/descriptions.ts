import type { INodeProperties } from 'n8n-workflow';

export const returnAllProperty: INodeProperties = {
	displayName: 'Return All',
	name: 'returnAll',
	type: 'boolean',
	default: false,
	description: 'Whether to return all results or only up to a given limit',
};

export const limitProperty: INodeProperties = {
	displayName: 'Limit',
	name: 'limit',
	type: 'number',
	typeOptions: { minValue: 1, maxValue: 100 },
	default: 50,
	description: 'Max number of results to return',
};

export const maxContactsPerStoreProperty: INodeProperties = {
	displayName: 'Max Contacts per Store',
	name: 'maxContactsPerStore',
	type: 'number',
	typeOptions: { minValue: 1, maxValue: 10 },
	default: 1,
	description: 'Maximum number of matching contacts to return for each store',
};

const triStateOptions = [
	{ name: 'Any', value: 'any' },
	{ name: 'Yes', value: 'yes' },
	{ name: 'No', value: 'no' },
];

export const storeFilterOptions: INodeProperties[] = [
	{
		displayName: 'Apps (All)',
		name: 'appsAll',
		type: 'string',
		default: '',
		description: 'Comma-separated app slugs that every result must use',
	},
	{
		displayName: 'Apps (Any)',
		name: 'appsAny',
		type: 'string',
		default: '',
		description: 'Comma-separated app slugs; results may use any listed app',
	},
	{
		displayName: 'Apps (None)',
		name: 'appsNone',
		type: 'string',
		default: '',
		description: 'Comma-separated app slugs that results must not use',
	},
	{
		displayName: 'Categories',
		name: 'categories',
		type: 'string',
		default: '',
		description: 'Comma-separated StoreInspect category slugs',
	},
	{
		displayName: 'Countries',
		name: 'countries',
		type: 'string',
		default: '',
		description: 'Comma-separated ISO country codes, such as US, GB, or AU',
	},
	{
		displayName: 'Minimum Active Meta Ads',
		name: 'minimumActiveAds',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 100000 },
		default: 0,
		description: 'Minimum number of active Meta ads',
	},
	{
		displayName: 'Pixels (All)',
		name: 'pixelsAll',
		type: 'string',
		default: '',
		description: 'Comma-separated tracking pixel slugs every result must use',
	},
	{
		displayName: 'Pixels (Any)',
		name: 'pixelsAny',
		type: 'string',
		default: '',
		description: 'Comma-separated tracking pixel slugs; results may use any listed pixel',
	},
	{
		displayName: 'Pixels (None)',
		name: 'pixelsNone',
		type: 'string',
		default: '',
		description: 'Comma-separated tracking pixel slugs that results must not use',
	},
	{
		displayName: 'Revenue Tiers',
		name: 'revenueTiers',
		type: 'string',
		default: '',
		description: 'Comma-separated StoreInspect revenue-tier slugs',
	},
	{
		displayName: 'Shopify Plus',
		name: 'shopifyPlus',
		type: 'options',
		options: triStateOptions,
		default: 'any',
		description: 'Filter by Shopify Plus status',
	},
	{
		displayName: 'Theme Types',
		name: 'themeTypes',
		type: 'multiOptions',
		options: [
			{ name: 'Custom', value: 'custom' },
			{ name: 'Free', value: 'free' },
			{ name: 'Paid', value: 'paid' },
		],
		default: [],
		description: 'Theme types to include',
	},
	{
		displayName: 'Traffic Tiers',
		name: 'trafficTiers',
		type: 'string',
		default: '',
		description: 'Comma-separated StoreInspect traffic-tier slugs',
	},
];

export const contactAvailabilityFilterOptions: INodeProperties[] = [
	{
		displayName: 'Has Revealable Contacts',
		name: 'hasRevealableContacts',
		type: 'options',
		options: triStateOptions,
		default: 'any',
		description: 'Whether stores must have contacts with revealable details',
	},
	{
		displayName: 'Contact Roles',
		name: 'contactRoles',
		type: 'string',
		default: '',
		description: 'Comma-separated contact role slugs',
	},
];

export const personFilterOptions: INodeProperties[] = [
	{
		displayName: 'Has LinkedIn',
		name: 'hasLinkedIn',
		type: 'options',
		options: triStateOptions,
		default: 'any',
		description: 'Filter contacts by LinkedIn availability',
	},
	{
		displayName: 'Has Phone',
		name: 'hasPhone',
		type: 'options',
		options: triStateOptions,
		default: 'any',
		description: 'Filter contacts by phone availability',
	},
	{
		displayName: 'Has Verified Email',
		name: 'hasVerifiedEmail',
		type: 'options',
		options: triStateOptions,
		default: 'any',
		description: 'Filter contacts by verified email availability',
	},
	{
		displayName: 'Roles',
		name: 'roles',
		type: 'string',
		default: '',
		description: 'Comma-separated contact role slugs',
	},
	{
		displayName: 'Seniority Groups',
		name: 'seniority',
		type: 'string',
		default: '',
		description: 'Comma-separated seniority-group slugs',
	},
];
