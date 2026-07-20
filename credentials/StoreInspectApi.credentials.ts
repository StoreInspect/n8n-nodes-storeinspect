import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class StoreInspectApi implements ICredentialType {
	name = 'storeInspectApi';

	displayName = 'StoreInspect API';

	icon = 'file:../nodes/StoreInspect/storeinspect.svg' as const;

	documentationUrl = 'https://storeinspect.com/docs/integrations/n8n';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Create an API key under Settings > API in StoreInspect. API access requires a paid plan.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://storeinspect.com/api/v1',
			url: '/usage',
			method: 'GET',
		},
	};
}
