# KAGZI Government Updates Worker

This worker is scaffolded but is NOT deployed or scheduled yet.

## Safety model
- The D1 `sources` table starts empty. Empty means no automated ingestion and no automatic publication.
- A source must have current, documented permission covering automated fetching and republication, terms URL, attribution, region/category, rate limit and future review date.
- The current parser supports RSS only. JSON API and open-data feeds are stored as snapshots but are not published until a source-specific parser is added and tested.
- RSS item links must be HTTPS and on the same host as the registered source feed. Cross-domain items are withheld.
- No HTML scraping fallback exists.
- The visitor feed only returns records marked published.

## Deployment prerequisites
1. Create a Cloudflare D1 database for KAGZI and apply `schema.sql`.
2. Configure the D1 binding named `DB` in the Worker environment.
3. Review and document each source's actual terms before inserting an approved source row.
4. Add a scheduled trigger only after source-specific cadence/rate limits are set and a dry-run passes.
5. Connect the public updates page to the deployed `/feed` endpoint only after the endpoint is deployed and reviewed.

Do not put account tokens or private keys in this repository. Do not mark a source approved merely because it is an official government website.
