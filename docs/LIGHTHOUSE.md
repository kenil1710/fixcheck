# Lighthouse (live site, mobile emulation, Lighthouse 12)

Measured on https://fixcheck-ledger.vercel.app after the pages were warm in the ISR cache.

| Page | Performance | Accessibility | LCP | TBT |
|---|---|---|---|---|
| `/` | 99 | 100 | 1.9 s | 120 ms |
| `/protocols/pooltogether` | 96 | 100 | 2.4 s | 60 ms |
| `/checks/13` | 95 | 100 | 2.4 s | 110 ms |

Best practices and SEO measured 100 on all three in the first run. What got it there: genlayer-js loads only when a transaction is signed (the header's wallet code no longer pulls it in), two Newsreader weights instead of six faces, ISR for finding and protocol pages, and no ARIA labels on generic elements.
