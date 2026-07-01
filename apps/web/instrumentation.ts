export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Next.js 15's HTML-level font optimizer intercepts <link> tags pointing to Google Fonts,
    // downloads the woff files to /_next/static/media/, then calls fetch() with those relative
    // paths to inspect them. Node's Undici rejects relative URLs → noisy unhandledRejection logs.
    // Patching globalThis.fetch here prevents the error at the source.
    const _fetch = globalThis.fetch;
    (globalThis as any).fetch = function patchedFetch(
      input: Parameters<typeof fetch>[0],
      init?: Parameters<typeof fetch>[1],
    ): ReturnType<typeof fetch> {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;
      if (typeof url === 'string' && url.startsWith('/_next/static/media/')) {
        return Promise.resolve(new Response('', { status: 200 }));
      }
      return _fetch.call(globalThis, input, init);
    };
  }
}
