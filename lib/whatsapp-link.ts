// Click-to-chat hand-off for website enquiries: after the form is stored, the
// visitor's own WhatsApp opens with the enquiry prefilled to the sales number.
export const SALES_WHATSAPP='971521357286';

export type WhatsAppEnquiry={name:string;email:string;phone?:string;topic?:string;message?:string;page?:string};

function line(label:string,value:string|undefined){
 const v=(value||'').replace(/\s+/g,' ').trim().slice(0,600);
 return v?`${label}: ${v}`:'';
}

export function enquiryWhatsAppText(e:WhatsAppEnquiry){
 return ['Hello Automan Star Real Estate, I have a website enquiry.','',
  line('Name',e.name),line('Email',e.email),line('Phone',e.phone),
  line('Interested in',e.topic),line('Message',e.message),line('Page',e.page),
 ].filter((l,i)=>l||i===1).join('\n');
}

export function enquiryWhatsAppHref(e:WhatsAppEnquiry){
 return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(enquiryWhatsAppText(e))}`;
}

// Best effort: browsers may block a pop-up after the async submit, so callers
// always render a visible WhatsApp button as well.
export function openWhatsApp(href:string){
 try{window.open(href,'_blank','noopener,noreferrer')}catch{/* blocked */}
}
