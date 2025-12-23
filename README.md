# YCDLE - YC Company Wordle

A daily wordle-style game where you guess YC (Y Combinator) companies.

## Daily Function Caching

The `/.netlify/functions/daily` endpoint provides the daily company selection. It uses a predictable caching strategy to ensure consistent results across all users.

### Caching Behavior

- **Daily Selection**: The `yc_id` is stable for the entire UTC day
- **Cache Duration**: Responses are cached until the next UTC midnight (00:00 UTC)
- **Automatic Refresh**: The daily company automatically changes after UTC midnight without requiring users to clear their browser cache
- **Cache Headers**: 
  - `Cache-Control: public, max-age=<seconds-until-midnight>, s-maxage=<seconds-until-midnight>, stale-while-revalidate=3600`
  - `Expires: <next-utc-midnight>`

### Debug Mode

To bypass caching and always see the current logic, use the `debug=1` query parameter:
```
/.netlify/functions/daily?debug=1
```

Debug mode sets `Cache-Control: no-store` to ensure no caching occurs, making it useful for development and troubleshooting.

### Response Headers

The daily function includes helpful headers to verify which version a client is seeing:

- `X-YCDLE-Day`: The UTC day number (days since epoch) used for the selection
- `X-YCDLE-Seed-Hash`: A short hash (first 8 characters) of the seed value used for selection

These headers allow you to quickly confirm what version a client is seeing without exposing the full seed value.

### How It Works

1. The function computes a UTC day number (days since epoch)
2. A deterministic hash is generated from the secret seed and day number
3. This hash is used to select a company from the top companies list
4. The response is cached until the next UTC midnight
5. After UTC midnight, a new day number is computed, resulting in a different company selection

### Testing

**Acceptance Tests:**
- ✅ Reloading the site multiple times on the same day returns the same `yc_id`
- ✅ After UTC midnight, the `yc_id` changes without needing to clear browser cache
- ✅ `/.netlify/functions/daily?debug=1` always reflects current logic (no caching confusion)

