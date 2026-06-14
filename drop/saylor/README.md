# SAYLOR / MSTR — Drop #1 (THOMQU)

128 works, baked through the real `engine.js` at 1800×2400, frozen at the clean press state (t=0.50).
Token IDs **1–128**. Everything hosted on your own domain (thomqu.com via Cloudflare Pages).

## Paste into your OpenSea / Base contract

| field | value |
|---|---|
| **baseURI** (token URI prefix) | `https://thomqu.com/drop/saylor/meta/` |
| **contractURI** (collection meta) | `https://thomqu.com/drop/saylor/collection.json` |
| **max supply** | `128` |
| **token IDs** | `1` … `128` |

`tokenURI(7)` → `https://thomqu.com/drop/saylor/meta/7`. Both extensionless (`/meta/7`) and
`.json` (`/meta/7.json`) resolve and return `application/json`, so it works whether your contract
appends `.json` or not. CORS is open (`_headers`) so OpenSea/marketplaces can fetch.

> ⚠️ Token IDs start at **1**. If your contract mints token **0** first (some ERC721A do),
> tell me and I'll add a `0` file or renumber 0–127.

## Layout
```
drop/saylor/
  img/1.png … 128.png        full-res artwork
  meta/1 … 128               metadata (no extension)
  meta/1.json … 128.json     same metadata (with extension)
  collection.json            contract-level metadata (name, logo, banner)
```

## Each token's metadata
`name`, `description`, `image` (→ img/N.png), `external_url` (→ live token viewer on thomqu.com),
and `attributes`: Series, Ticker, Base Finish, Overprints, Databend, Press State, Effect,
Edition (N/128), Press No. (original engine seed index — provenance).

## Go live
These files deploy with the site. After `git push`, they're live at the URLs above (Cloudflare
Pages auto-build), then set the contract's baseURI. To re-bake (different resolution or press
temperature): `python3 scripts/bake_drop.py saylor --res 2400 --temp 0.5`.
