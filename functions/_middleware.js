export async function onRequest(context) {
  const url = new URL(context.request.url);
  let shouldRedirect = false;

  if (url.hostname === 'www.kyunolab.com') {
    url.hostname = 'kyunolab.com';
    shouldRedirect = true;
  }

  if (url.pathname.endsWith('.html')) {
    url.pathname = url.pathname.slice(0, -'.html'.length);
    shouldRedirect = true;
  }

  if (shouldRedirect) {
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
