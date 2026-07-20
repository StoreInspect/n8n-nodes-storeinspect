import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { contactDescription } from './resources/contact';
import { storeDescription } from './resources/store';
import { usageDescription } from './resources/usage';

export class StoreInspect implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'StoreInspect',
		name: 'storeInspect',
		icon: {
			light: 'file:storeinspect.svg',
			dark: 'file:storeinspect.dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Search and enrich Shopify stores and decision-maker contacts',
		defaults: {
			name: 'StoreInspect',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'storeInspectApi', required: true }],
		requestDefaults: {
			baseURL: 'https://storeinspect.com/api/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Contact', value: 'contact' },
					{ name: 'Store', value: 'store' },
					{ name: 'Usage', value: 'usage' },
				],
				default: 'store',
			},
			...contactDescription,
			...storeDescription,
			...usageDescription,
		],
	};
}
