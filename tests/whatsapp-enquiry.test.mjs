import assert from 'node:assert/strict';
import {test} from 'node:test';
import {notifyEnquiryWhatsApp} from '../lib/whatsapp-enquiry.ts';

const KEYS=['WHATSAPP_ACCESS_TOKEN','WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_ENQUIRY_TEMPLATE_NAME','WHATSAPP_GRAPH_API_VERSION','WHATSAPP_TEMPLATE_LANGUAGE'];
const lead={name:'QA Test',email:'qa@example.com',phone:'+971501234567',topic:'Buying Property',note:'I would like details'};
const previous=Object.fromEntries(KEYS.map(k=>[k,process.env[k]]));
const originalFetch=globalThis.fetch;
function restore(){
 for(const k of KEYS)if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];
 globalThis.fetch=originalFetch;
}
function configure(){
 process.env.WHATSAPP_ACCESS_TOKEN='mock-token';
 process.env.WHATSAPP_PHONE_NUMBER_ID='123456789012345';
 process.env.WHATSAPP_ENQUIRY_TEMPLATE_NAME='automan_new_enquiry';
 process.env.WHATSAPP_GRAPH_API_VERSION='v24.0';
 process.env.WHATSAPP_TEMPLATE_LANGUAGE='en_US';
}

test('WhatsApp notifications are disabled safely when not configured',async()=>{
 try{
  for(const k of KEYS)delete process.env[k];
  globalThis.fetch=async()=>{throw Error('Should not call Meta when unconfigured')};
  assert.equal(await notifyEnquiryWhatsApp(lead),null);
 }finally{restore()}
});

test('sends approved-template notification to exactly one configured staff recipient',async()=>{
 try{
  configure();
  let calls=0;
  globalThis.fetch=async(url,options)=>{
   calls++;
   assert.equal(url,'https://graph.facebook.com/v24.0/123456789012345/messages');
   assert.equal(options.method,'POST');
   assert.equal(options.headers.Authorization,'Bearer mock-token');
   assert.equal(options.cache,'no-store');
   const body=JSON.parse(options.body);
   assert.equal(body.type,'template');
   assert.equal(body.to,'971521357286');
   assert.equal(body.template.name,'automan_new_enquiry');
   assert.equal(body.template.language.code,'en_US');
   assert.deepEqual(body.template.components[0].parameters.map(p=>p.text),
    ['QA Test','qa@example.com','+971501234567','Buying Property','I would like details']);
   return {ok:true,status:200};
  };
  assert.equal(await notifyEnquiryWhatsApp(lead),true);
  assert.equal(calls,1);
 }finally{restore()}
});

test('rejects provider errors without logging or returning sensitive response body',async()=>{
 try{
  configure();
  globalThis.fetch=async()=>({ok:false,status:401});
  await assert.rejects(notifyEnquiryWhatsApp(lead),/HTTP 401/);
 }finally{restore()}
});

test('sanitizes user-controlled template fields and safely defaults absent phone',async()=>{
 try{
  configure();
  globalThis.fetch=async(_url,options)=>{
   const params=JSON.parse(options.body).template.components[0].parameters;
   assert.equal(params[0].text,'Test User');
   assert.equal(params[2].text,'Not provided');
   assert.equal(params[4].text,'Hello team');
   return {ok:true,status:200};
  };
  await notifyEnquiryWhatsApp({name:' Test\n User ',email:'qa@example.com',topic:'General enquiry',note:'Hello\t team'});
 }finally{restore()}
});
