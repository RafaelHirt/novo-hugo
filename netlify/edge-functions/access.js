import { createAccessGuard } from '../../auth/guard.js';

let activePassword;
let guard;
export default async function access(request, context) {
  const password = globalThis.Netlify.env.get('DASHBOARD_PASSWORD');
  if (!guard || password !== activePassword) {
    activePassword = password;
    guard = createAccessGuard({ password });
  }
  return guard(request, context);
}

// A runtime error must never bypass authentication.
export const config = { onError: 'fail', cache: 'off' };
