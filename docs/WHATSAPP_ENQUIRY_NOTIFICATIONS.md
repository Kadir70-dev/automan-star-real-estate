# Automan Star Realty — WhatsApp enquiry alerts

## Scope

The server can send **one WhatsApp Business template alert** to **+971 52 135 7286**
after either (1) the website consultation popup successfully stores a lead
in Netlify Forms or the existing Go CRM, or (2) the regular enquiry form
receives a successful response from the Go CRM.

The visitor's form submission must still succeed if the WhatsApp provider is
unconfigured, temporarily unavailable or rejects the alert. This is a staff
notification, **not a WhatsApp reply to the visitor**. No user-facing WhatsApp
button, frontend phone number or client-side API token is introduced.

## Activation — configure only in Netlify server-side environment

An authorized administrator must connect an official Meta WhatsApp Business
Cloud API sender and obtain a **valid sender Phone Number ID** and **server-side
access token**. The staff recipient number must be permitted to receive
WhatsApp Business messages, with required permission/opt-in as applicable.
Sending business-initiated alerts requires an **approved template**.
A normal WhatsApp account or a `wa.me` link alone cannot automate delivery.

Set these production environment variables in the **existing** Netlify site:

- `WHATSAPP_ACCESS_TOKEN`: Meta API access token (secret, never commit).
- `WHATSAPP_PHONE_NUMBER_ID`: Meta **sender** phone number ID (not the recipient number).
- `WHATSAPP_ENQUIRY_TEMPLATE_NAME=automan_new_enquiry`: only after Meta approves this template name.
- `WHATSAPP_TEMPLATE_LANGUAGE=en_US` (optional; must match approved template locale).
- `WHATSAPP_GRAPH_API_VERSION=v24.0` (optional; choose an API version supported by your Meta app).

**Recipient is fixed in the server module** to `971521357286`; do not
confuse this with the WhatsApp **sender** phone number ID. If required
provider variables are absent, WhatsApp sending remains disabled.

## WhatsApp template content to submit for Meta approval

Template name: `automan_new_enquiry`, language `en_US`.
Create a text **body** with exactly **five ordered text variables**:

```text
New Automan Star Realty website enquiry

Name: {{1}}
Email: {{2}}
Phone: {{3}}
Enquiry: {{4}}
Notes: {{5}}
```

Example sample values for approval: `Example Visitor`,
`visitor@example.com`, `+971501234567`, `Buying Property`,
`Please call regarding availability`.

Meta determines template approval and classification. If the template is not
approved, sending will fail; submitting a website form will still succeed
if its storage succeeds. WhatsApp delivery is asynchronous and requires
provider delivery-status confirmation before claiming a message was received.

## Verification with test-only enquiries

1. On a **nonproduction preview**, configure a test sender/recipient and an approved template.
2. Submit one valid consultation popup request; verify lead storage success, no
   duplicate alert and WhatsApp API acceptance.
3. Submit one valid regular enquiry form request; verify the Go CRM accepted it
   and a staff WhatsApp alert was initiated.
4. Submit validation failures and bot honeypot input; verify no WhatsApp sends.
5. Temporarily remove the access token and repeat an enquiry; verify storage
   succeeds but no WhatsApp message is sent.
6. Confirm delivery in Meta's messaging logs and on the authorized receiving
   WhatsApp account. Keep tokens and customer PII out of logs/screenshots.

No live messages can be sent until the authorized Meta/Netlify credentials,
approved template and recipient permission are configured. There are no
credentials or activation changes in this code PR.
