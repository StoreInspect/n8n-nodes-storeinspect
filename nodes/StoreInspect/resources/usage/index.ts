import type { INodeProperties } from 'n8n-workflow';

export const usageDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['usage'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get account usage',
				description: 'Get plan, API request, search-row, and contact-credit usage',
				routing: { request: { method: 'GET', url: '/usage' } },
			},
		],
		default: 'get',
	},
];
