# P0 lead-capture recovery — rollout and validation

## Scope

The live site's general enquiry form currently depends on `BACKEND_INTERNAL_URL` and was confirmed to return 503 when the Go API is not configured. This change allows `/contact` and listing-page enquiries to use **Netlify Forms (form: `enquiry`)** without requiring production Go/PostgreSQL, while retaining an optional Go CRM copy. It also directs production consultation submissions to the stable Netlify site URL instead of an old draft deploy URL.

**This repository branch does not deploy the fix.** Hosting is Netlify, with manual Netlify CLI deployments. Do not claim live success until the exact production site has been updated and an authorized test submission is visible in Netlify Forms.

## Before production deploy

1. Confirm `automan-star-real-estate` is the correct Netlify site and back up its current deploy ID.
2. Check the **two consultation submissions from 23 Oct 2026**, including the Spam submissions tab, and have the sales team follow up if appropriate. Do not expose their private details in tickets or commit history.
3. Netlify UI: **Forms > Submission notifications**. Configure verified-submission email notifications to the client-approved sales mailbox for both `consultation` and (after deployment) `enquiry`. This cannot be completed from source code alone.
4. Check Forms capacity/usage and spam filtering. Netlify Form detection must be enabled.
5. Review the new explicit enquiry consent text with the client.
6. Make sure production `URL` points to the production Netlify site (or set `LEAD_FORMS_ORIGIN` to a trusted production origin). On production, do not target an old `DEPLOY_URL`.
7. Do not change DNS or Google accounts while performing this rollout.

## Deployment steps

1. Ensure the root Next.js app, not legacy `frontend/`, is the build source.
2. Run `npm ci && npx tsc --noEmit && npx eslint app components lib --quiet && npm test && npm run build`.
3. Deploy a new draft of the root app to the existing Netlify site. Netlify must re-scan the updated static `public/__forms.html` so the **enquiry** form is registered.
4. Confirm both `enquiry` and `consultation` appear in Netlify Forms before publishing.
5. Inspect the draft's `/contact` UI and test invalid input (this creates no lead).
6. Get approval for **one clearly labelled real test submission** on the draft, then verify it appears in Netlify Forms and its notification arrives. If not, do not publish.
7. Publish the exact tested draft. Recheck the live `/contact` and existing popup routes; with authorization, run one labelled post-publish test and verify storage/notification.
8. Confirm no unrelated UI changes and preserve 3D, SEO metadata and existing pages.

## Behavior of this patch

- Contact form: same origin JSON POST to `/api/crm/leads`; validates name/email/property/message and requires explicit consent. Server-side honeypot and best-effort per-instance rate limiting.
- First storage: Netlify form `enquiry` via URL-encoded POST to static `/__forms.html`, using production `URL` rather than `DEPLOY_URL`.
- Optional second storage: Go API if `BACKEND_INTERNAL_URL` is configured and healthy.
- 201 success **only if one backend confirms a successful response**. Any storage failures return a 503 with a mailto fallback. This does not guarantee a submission passes Netlify spam filtering.
- No personal data is logged. Notification sending is not claimed as part of the patch.
- Consultation popup keeps its existing validation and storage; only production URL selection changed.

## Remaining client dependencies

- Netlify submission-notification recipient approval and permissions; verify the two prior leads.
- Approval for a labelled test lead on draft and production.
- Google Search Console, Google Business Profile and optional Analytics are separately pending client access/approval.
- Phone/WhatsApp and licence numbers cannot be invented.

## Limits

Without connected Netlify dashboard/deploy credentials, source tests alone cannot prove real Netlify capture or notification delivery. Keep GitHub PR separate from production until tested.
