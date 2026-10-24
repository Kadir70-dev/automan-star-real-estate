// Shared validation and form encoding for general property enquiries.
// Keep this dependency-free for Node unit tests and reuse in the API route.
export type EnquiryField = 'name' | 'email' | 'message' | 'property' | 'consent';
export type EnquiryErrors = Partial<Record<EnquiryField,string>>;
export type EnquiryLead = {name:string;email:string;message:string;property:string};
export type EnquiryResult = {ok:true;lead:EnquiryLead}|{ok:false;errors:EnquiryErrors};

const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEnquiry(value:unknown):EnquiryResult {
 const v=(value&&typeof value==='object'&&!Array.isArray(value)?value:{}) as Record<string,unknown>;
 const errors:EnquiryErrors={};
 const name=typeof v.name==='string'?v.name.trim().replace(/\s+/g,' '):'';
 const email=typeof v.email==='string'?v.email.trim().toLowerCase():'';
 const message=typeof v.message==='string'?v.message.trim():'';
 const property=typeof v.property==='string'?v.property.trim():'';
 if(name.length<2||name.length>120||/[<>{}\\]|https?:\/\//i.test(name))errors.name='Enter a valid name (2–120 characters).';
 if(email.length>254||!EMAIL.test(email))errors.email='Enter a valid email address.';
 if(message.length>3000)errors.message='Message must be no longer than 3,000 characters.';
 if(!property||property.length>160||/[<>{}]/.test(property))errors.property='Property enquiry type is invalid.';
 if(v.consent!==true)errors.consent='Please agree to be contacted about your enquiry.';
 if(Object.keys(errors).length)return {ok:false,errors};
 return {ok:true,lead:{name,email,message,property}};
}

export function enquiryFormBody(lead:EnquiryLead,sourceUrl:string,submittedAt:string):URLSearchParams {
 return new URLSearchParams({
  'form-name':'enquiry',name:lead.name,email:lead.email,message:lead.message,
  property:lead.property,source_url:sourceUrl,submitted_at:submittedAt,consent:'yes',
 });
}
