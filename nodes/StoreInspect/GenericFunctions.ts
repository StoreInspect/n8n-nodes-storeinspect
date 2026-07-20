import type {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	PreSendAction,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type ParameterContext = Pick<IExecuteSingleFunctions, 'getNodeParameter' | 'getNode'>;

const MAX_PAGE_SIZE = 100;

export function parseList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))];
	}

	if (typeof value !== 'string') return [];

	return [
		...new Set(
			value
				.split(/[\n,]/)
				.map((item) => item.trim())
				.filter(Boolean),
		),
	];
}

function asObject(value: unknown): IDataObject {
	return value && typeof value === 'object' && !Array.isArray(value) ? (value as IDataObject) : {};
}

function setList(target: IDataObject, key: string, value: unknown): void {
	const values = parseList(value);
	if (values.length > 0) target[key] = values;
}

function optionalBoolean(value: unknown): boolean | undefined {
	if (value === 'yes' || value === true) return true;
	if (value === 'no' || value === false) return false;
	return undefined;
}

function buildTechnologyFilter(
	filters: IDataObject,
	prefix: 'apps' | 'pixels',
): IDataObject | undefined {
	const result: IDataObject = {};
	setList(result, 'any', filters[`${prefix}Any`]);
	setList(result, 'all', filters[`${prefix}All`]);
	setList(result, 'none', filters[`${prefix}None`]);
	return Object.keys(result).length > 0 ? result : undefined;
}

function buildStoreFilters(filters: IDataObject): IDataObject {
	const result: IDataObject = {};
	setList(result, 'categories', filters.categories);
	setList(result, 'countries', filters.countries);
	setList(result, 'traffic_tiers', filters.trafficTiers);
	setList(result, 'revenue_tiers', filters.revenueTiers);

	const shopifyPlus = optionalBoolean(filters.shopifyPlus);
	if (shopifyPlus !== undefined) result.shopify_plus = shopifyPlus;

	const apps = buildTechnologyFilter(filters, 'apps');
	if (apps) result.apps = apps;
	const pixels = buildTechnologyFilter(filters, 'pixels');
	if (pixels) result.pixels = pixels;

	const themeTypes = parseList(filters.themeTypes);
	if (themeTypes.length > 0) result.themes = { types: themeTypes };

	if (filters.minimumActiveAds !== undefined && filters.minimumActiveAds !== '') {
		result.meta_ads = { active_ads_min: Number(filters.minimumActiveAds) };
	}

	const contactFilters: IDataObject = {};
	const hasRevealableContacts = optionalBoolean(filters.hasRevealableContacts);
	if (hasRevealableContacts !== undefined) {
		contactFilters.has_revealable_contacts = hasRevealableContacts;
	}
	setList(contactFilters, 'roles_any', filters.contactRoles);
	if (Object.keys(contactFilters).length > 0) result.contacts = contactFilters;

	return result;
}

export function buildStoreSearchBody(context: ParameterContext): IDataObject {
	const returnAll = context.getNodeParameter('returnAll', false) as boolean;
	const requestedLimit = Number(context.getNodeParameter('limit', 25));
	return {
		filters: buildStoreFilters(asObject(context.getNodeParameter('filters', {}))),
		limit: returnAll ? MAX_PAGE_SIZE : Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE),
	};
}

export function buildContactSearchBody(context: ParameterContext): IDataObject {
	const filters = asObject(context.getNodeParameter('filters', {}));
	const person: IDataObject = {};
	setList(person, 'roles_any', filters.roles);
	setList(person, 'seniority_any', filters.seniority);

	const hasVerifiedEmail = optionalBoolean(filters.hasVerifiedEmail);
	if (hasVerifiedEmail !== undefined) person.has_verified_email = hasVerifiedEmail;
	const hasPhone = optionalBoolean(filters.hasPhone);
	if (hasPhone !== undefined) person.has_phone = hasPhone;
	const hasLinkedIn = optionalBoolean(filters.hasLinkedIn);
	if (hasLinkedIn !== undefined) person.has_linkedin = hasLinkedIn;

	const store = buildStoreFilters(filters);
	setList(store, 'domains', filters.domains);

	const returnAll = context.getNodeParameter('returnAll', false) as boolean;
	const requestedLimit = Number(context.getNodeParameter('limit', 25));
	const body: IDataObject = {
		max_contacts_per_store: Number(context.getNodeParameter('maxContactsPerStore', 1)),
		limit: returnAll ? MAX_PAGE_SIZE : Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE),
	};
	if (Object.keys(person).length > 0) body.person = person;
	if (Object.keys(store).length > 0) body.store = store;
	return body;
}

export function buildStoreEnrichBody(context: ParameterContext): IDataObject {
	const domains = parseList(context.getNodeParameter('domains'));
	if (domains.length === 0) {
		throw new NodeOperationError(context.getNode(), 'Provide at least one Shopify store domain');
	}
	if (domains.length > 25) {
		throw new NodeOperationError(context.getNode(), 'StoreInspect enriches up to 25 domains per request');
	}

	const body: IDataObject = {
		domains,
		include: context.getNodeParameter('include') as string[],
		max_contacts_per_store: Number(context.getNodeParameter('maxContactsPerStore', 1)),
		reveal_contacts: false,
	};
	const roles = parseList(context.getNodeParameter('contactRoles', ''));
	if (roles.length > 0) body.contact_roles = roles;
	return body;
}

export function buildContactRevealBody(context: ParameterContext): IDataObject {
	const contactIds = parseList(context.getNodeParameter('contactIds'));
	if (contactIds.length === 0) {
		throw new NodeOperationError(context.getNode(), 'Provide at least one StoreInspect contact ID');
	}
	if (contactIds.length > 10) {
		throw new NodeOperationError(context.getNode(), 'StoreInspect reveals up to 10 contacts per request');
	}
	return { contact_ids: contactIds };
}

function prepareBody(builder: (context: ParameterContext) => IDataObject): PreSendAction {
	return async function (this: IExecuteSingleFunctions, requestOptions: IHttpRequestOptions) {
		requestOptions.body = builder(this);
		return requestOptions;
	};
}

export const prepareStoreSearch = prepareBody(buildStoreSearchBody);
export const prepareContactSearch = prepareBody(buildContactSearchBody);
export const prepareStoreEnrich = prepareBody(buildStoreEnrichBody);

export const prepareContactReveal: PreSendAction = async function (
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
) {
	requestOptions.body = buildContactRevealBody(this);
	const idempotencyKey = String(this.getNodeParameter('idempotencyKey', '')).trim();
	if (idempotencyKey) {
		requestOptions.headers = {
			...requestOptions.headers,
			'Idempotency-Key': idempotencyKey,
		};
	}
	return requestOptions;
};

export async function cursorPagination(
	this: IExecutePaginationFunctions,
	requestOptions: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	const returnAll = this.getNodeParameter('returnAll', false) as boolean;
	const requestedLimit = Number(this.getNodeParameter('limit', 25));
	const maximumResults = returnAll ? Number.POSITIVE_INFINITY : requestedLimit;
	const output: INodeExecutionData[] = [];
	const seenCursors = new Set<string>();
	let cursor: string | undefined;

	do {
		const body = asObject(requestOptions.options.body);
		requestOptions.options.body = { ...body, limit: returnAll ? MAX_PAGE_SIZE : requestedLimit };
		if (cursor) {
			(requestOptions.options.body as IDataObject).cursor = cursor;
		} else {
			delete (requestOptions.options.body as IDataObject).cursor;
		}

		const responseData = await this.makeRoutingRequest(requestOptions);
		const page = responseData.length > 0 ? responseData[responseData.length - 1].json : {};
		const data = Array.isArray(page.data) ? (page.data as IDataObject[]) : [];
		const requestId = typeof page.request_id === 'string' ? page.request_id : undefined;
		for (const item of data) {
			output.push({ json: requestId ? { ...item, request_id: requestId } : item });
			if (output.length >= maximumResults) return output.slice(0, maximumResults);
		}

		const nextCursor = page.has_more === true && typeof page.next_cursor === 'string'
			? page.next_cursor
			: undefined;
		if (!returnAll || !nextCursor || seenCursors.has(nextCursor)) break;
		seenCursors.add(nextCursor);
		cursor = nextCursor;
	} while (cursor);

	return output;
}

export async function splitDataResponse(
	this: IExecuteSingleFunctions,
	_items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const body = asObject(response.body);
	const data = Array.isArray(body.data) ? (body.data as IDataObject[]) : [];
	const requestId = typeof body.request_id === 'string' ? body.request_id : undefined;
	return data.map((item) => ({ json: requestId ? { ...item, request_id: requestId } : item }));
}

export async function splitRevealResponse(
	this: IExecuteSingleFunctions,
	_items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const body = asObject(response.body);
	const data = Array.isArray(body.data) ? (body.data as IDataObject[]) : [];
	const credits = asObject(body.credits);
	const requestId = typeof body.request_id === 'string' ? body.request_id : undefined;
	return data.map((item) => ({
		json: {
			...item,
			credits,
			...(requestId ? { request_id: requestId } : {}),
		},
	}));
}
