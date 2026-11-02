// Marks the English labels of the generated API reference (lib/reference.ts).
import { defineMiddleware } from 'astro:middleware';
import { markEnglishLabels } from './lib/reference.ts';
import { REFERENCE_PATH } from './lib/site.ts';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (
    !context.url.pathname.startsWith(REFERENCE_PATH) ||
    !response.headers.get('content-type')?.startsWith('text/html')
  ) {
    return response;
  }
  return new Response(markEnglishLabels(await response.text()), response);
});
