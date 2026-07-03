export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === 'www.kyunolab.com') {
    url.hostname = 'kyunolab.com';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
