// Server-side WhatsApp Business Cloud API alert for *successfully stored* website enquiries.
// Requires an approved template with five body placeholders; never import in a client component.
export type EnquiryAlert={name:string;email:string;phone?:string;topic:string;note?:string};

const RECIPIENT='971521357286'; // Approved staff notification destination, not a public contact CTA.
function clean(value:string|undefined,max:number,fallback='Not provided'){
 const v=(value||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
 return v||fallback;
}

/** null = not configured; true = WhatsApp API accepted the message (not proof of delivery). */
export async function notifyEnquiryWhatsApp(lead:EnquiryAlert):Promise<true|null>{
 const token=process.env.WHATSAPP_ACCESS_TOKEN;
 const phoneNumberId=process.env.WHATSAPP_PHONE_NUMBER_ID;
 const templateName=process.env.WHATSAPP_ENQUIRY_TEMPLATE_NAME;
 if(!token||!phoneNumberId||!templateName)return null;
 const version=process.env.WHATSAPP_GRAPH_API_VERSION||'v24.0';
 const language=process.env.WHATSAPP_TEMPLATE_LANGUAGE||'en_US';
 if(!/^\d{8,25}$/.test(phoneNumberId)||!/^v\d{1,2}\.\d+$/.test(version)||
    !/^[a-z][a-z0-9_]{0,511}$/.test(templateName)||!/^[a-z]{2}_[A-Z]{2}$/.test(language)){
  throw new Error('Invalid WhatsApp provider configuration');
 }
 const values=[
  clean(lead.name,120),clean(lead.email,254),clean(lead.phone,20),
  clean(lead.topic,140),clean(lead.note,240,'New website enquiry'),
 ];
 const body={
  messaging_product:'whatsapp',recipient_type:'individual',to:RECIPIENT,type:'template',
  template:{name:templateName,language:{code:language},
   components:[{type:'body',parameters:values.map(text=>({type:'text',text}))}]},
 };
 const response=await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`,{
  method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
  body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(6500),
 });
 if(!response.ok)throw new Error(`WhatsApp API rejected notification (HTTP ${response.status})`);
 return true;
}
