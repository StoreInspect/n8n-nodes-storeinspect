# @storeinspect/n8n-nodes-storeinspect

This is the official [n8n](https://n8n.io/) community node for [StoreInspect](https://storeinspect.com). It lets n8n workflows search and enrich Shopify stores, find decision-maker contacts, and reveal verified contact details.

## Installation

Install `@storeinspect/n8n-nodes-storeinspect` from **Settings > Community Nodes** in a self-hosted n8n instance. Once the package is verified, it can also be installed from the n8n nodes panel.

See n8n's [community-node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) for details.

## Operations

### Store

- **Search**: Find Shopify stores using category, country, traffic, revenue, technology, Shopify Plus, theme, Meta ads, and contact-availability filters.
- **Get**: Retrieve one Shopify store by domain.
- **Enrich**: Enrich up to 25 domains with store intelligence, technologies, and optional contact previews.

### Contact

- **Search**: Find decision-maker contact previews using person and company filters.
- **Reveal**: Reveal verified contact details for up to 10 contact IDs. This operation spends StoreInspect contact credits.

### Usage

- **Get**: Retrieve plan, API request, search-row, and contact-credit usage for the authenticated account.

## Credentials

1. Sign in to [StoreInspect](https://storeinspect.com).
2. Open **Settings > API**.
3. Create an API key.
4. In n8n, create a **StoreInspect API** credential and paste the key.

StoreInspect API access requires an active paid plan. n8n encrypts credentials at rest and sends the API key as a Bearer token only to `https://storeinspect.com/api/v1`.

## Usage notes

- Store and contact searches require at least one meaningful filter. This protects API capacity and prevents accidental broad searches.
- Contact search results are previews. Use **Reveal Contacts** only when verified details are needed.
- Set a stable idempotency key on reveal operations that may be retried. Reusing the same key prevents duplicate credit spending for the same request.
- Search pagination uses StoreInspect cursors and can return either a fixed limit or all matching results.

## Compatibility

- Node.js 22 or 24
- Current n8n releases that support community nodes API version 1

## Resources

- [StoreInspect n8n guide](https://storeinspect.com/docs/integrations/n8n)
- [StoreInspect API documentation](https://storeinspect.com/docs/api-reference/introduction)
- [Support](mailto:support@storeinspect.com)
- [Issue tracker](https://github.com/StoreInspect/n8n-nodes-storeinspect/issues)

## License

[MIT](LICENSE)
