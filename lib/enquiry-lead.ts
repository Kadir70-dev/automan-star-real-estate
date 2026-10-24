// Runtime-neutral validation for the standard enquiry form.
// Keep this small so it can be exercised by Node's built-in test runner.
export type EnquiryLead = {
  name: string;
  email: string;
  message: string;
  property: string;
};
export type EnquiryValidation =
  | { ok: true; lead: EnquiryLead }
  | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

export function validateEnquiry(input: unknown): EnquiryValidation {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid enquiry.' };
  }
  const data = input as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const property = typeof data.property === 'string' ? data.property.trim() : 'General enquiry';
  if (name.length < 2 || name.length > 120 || CONTROL.test(name) || /[<>{}]|https?:\/\//i.test(name))
    return { ok: false, error: 'Please enter your full name.' };
  if (!email || email.length > 254 || !EMAIL.test(email))
    return { ok: false, error: 'Please enter a valid email address.' };
  if (message.length > 3000 || CONTROL.test(message))
    return { ok: false, error: 'Please shorten your message.' };
  if (!property || property.length > 200 || CONTROL.test(property) || /[<>{}]/.test(property))
    return { ok: false, error: 'Invalid property reference.' };
  return { ok: true, lead: { name, email, message, property } };
}
