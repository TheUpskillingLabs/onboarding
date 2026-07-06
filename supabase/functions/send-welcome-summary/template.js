/* The welcome-summary email — the same summary the thank-you screen shows,
   sent once when onboarding completes. Pure ESM so the Edge Function (Deno)
   imports it AND node can render docs/welcome-email-preview.html from it:

     node --input-type=module -e "import('./template.js').then(...)"

   Voice: benefit first, plain words, exact terms. Style: the OLOS email
   register (dark #00141B, teal #0094A0 CTA, inline styles only). */

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** kind: 'welcome' (first signup) | 'update' (any later profile change) */
export function welcomeSummarySubject(kind = 'welcome') {
  return kind === 'update'
    ? 'Your Upskilling Labs profile changed: here’s what’s on file now'
    : 'Welcome to The Upskilling Labs: here’s what you signed up for';
}

/**
 * @param {Object} p
 * @param {string} p.firstName
 * @param {Array<[string,string]>} p.rows  — [label, value] pairs, the thank-you screen's summary
 * @param {string} [p.ctaUrl]   — where "Explore The Labs" points
 */
export function welcomeSummaryHtml({ firstName, rows, kind = 'welcome', ctaUrl = 'https://theupskillinglabs.org' }) {
  const isUpdate = kind === 'update';
  const eyebrow = isUpdate ? 'Profile updated &#10003;' : 'You’re a member &#10003;';
  const heading = isUpdate ? `Your profile changed, ${esc(firstName)}.` : `Welcome to The Labs, ${esc(firstName)}.`;
  const lede = isUpdate
    ? 'You made a change, so here’s the fresh copy of what’s on file. If this wasn’t you, reply to this email and we’ll look into it.'
    : 'We’re glad you’re here. This is your copy of everything you signed up for, in one place. Keep it.';
  const footerWhy = isUpdate
    ? 'You’re getting this because your Labs profile changed. It’s a receipt, not a subscription.'
    : 'You’re getting this one email because you created a Labs account. It’s a receipt, not a subscription.';
  const rowHtml = rows.map(([k, v]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(200,210,230,0.12);vertical-align:top;width:150px;">
            <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#0094a0;">${esc(k)}</span>
          </td>
          <td style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(200,210,230,0.12);">
            <span style="font-size:14px;line-height:1.5;color:rgba(200,210,230,0.85);">${esc(v)}</span>
          </td>
        </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#00141b;">
  <table cellpadding="0" cellspacing="0" width="100%" style="background-color:#00141b;padding:32px 16px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 8px 24px;">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;">The Upskilling Labs</span>
        </td></tr>
        <tr><td style="background-color:#03232a;border-radius:14px;padding:36px 32px;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#0094a0;">${eyebrow}</p>
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#ffffff;letter-spacing:-0.01em;">${heading}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:rgba(200,210,230,0.75);">
            ${lede}
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">${rowHtml}
          </table>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="border-radius:8px;background-color:#0094a0;">
              <a href="${esc(ctaUrl)}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;border-radius:8px;">Explore The Labs</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(200,210,230,0.45);">
            Signed something and want to read it again? Every document you agreed to lives at
            <a href="https://theupskillinglabs.org" style="color:#0094a0;text-decoration:none;">theupskillinglabs.org</a> — and you can change how you take part any time by signing back in.
          </p>
        </td></tr>
        <tr><td style="padding:20px 8px 0;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:rgba(200,210,230,0.35);">
            The Upskilling Labs · Washington, DC · <a href="https://theupskillinglabs.org" style="color:rgba(200,210,230,0.45);">theupskillinglabs.org</a><br/>
            ${footerWhy}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function welcomeSummaryText({ firstName, rows, kind = 'welcome', ctaUrl = 'https://theupskillinglabs.org' }) {
  const isUpdate = kind === 'update';
  return `${isUpdate ? `Your profile changed, ${firstName}.` : `Welcome to The Labs, ${firstName}.`}

${isUpdate
    ? 'You made a change, so here’s the fresh copy of what’s on file. If this wasn’t you, reply to this email and we’ll look into it.'
    : 'We’re glad you’re here. This is your copy of everything you signed up for, in one place. Keep it.'}

${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}

Explore The Labs: ${ctaUrl}

${isUpdate
    ? 'You’re getting this because your Labs profile changed. It’s a receipt, not a subscription.'
    : 'You’re getting this one email because you created a Labs account. It’s a receipt, not a subscription.'}
The Upskilling Labs · Washington, DC · theupskillinglabs.org`;
}
