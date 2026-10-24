import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateEnquiry,enquiryFormBody} from '../lib/enquiry-lead.ts';

const sample={name:' Dubai Buyer ',email:'BUYER@EXAMPLE.COM ',message:'I am interested in a two-bedroom apartment.',property:'General enquiry',consent:true};

test('valid enquiry is trimmed, normalized and ready for storage',()=>{
 const r=validateEnquiry(sample);
 assert.equal(r.ok,true);
 assert.deepEqual(r.lead,{name:'Dubai Buyer',email:'buyer@example.com',message:sample.message,property:'General enquiry'});
});

test('enquiry must include genuine consent, name, email and property',()=>{
 for(const update of [{consent:false},{consent:'true'},{name:'A'},{name:'<script>alert(1)</script>'},{email:'broken'},{property:''}]){
  const result=validateEnquiry({...sample,...update});
  assert.equal(result.ok,false,JSON.stringify(update));
 }
});

test('enquiry rejects huge text and invalid object payloads',()=>{
 assert.equal(validateEnquiry({...sample,message:'x'.repeat(3001)}).ok,false);
 assert.equal(validateEnquiry({...sample,property:'x'.repeat(161)}).ok,false);
 assert.equal(validateEnquiry(null).ok,false);
 assert.equal(validateEnquiry([]).ok,false);
});

test('Netlify form body matches canonical static enquiry definition',()=>{
 const r=validateEnquiry(sample);
 assert.equal(r.ok,true);
 const fields=enquiryFormBody(r.lead,'https://automanstarrealty.com/contact','2026-10-24T16:00:00.000Z');
 const html=readFileSync(new URL('../public/__forms.html',import.meta.url),'utf8');
 assert.match(html,/<form name="consultation" data-netlify="true"/);
 assert.match(html,/<form name="enquiry" data-netlify="true"/);
 const part=html.split('<form name="enquiry"')[1].split('</form>')[0];
 for(const [field,value] of fields.entries()){
  if(field==='form-name'){assert.equal(value,'enquiry');continue;}
  assert.ok(part.includes(`name="${field}"`),`Static form blueprint missing ${field}`);
 }
 assert.equal(fields.get('consent'),'yes');
 assert.equal(fields.get('email'),'buyer@example.com');
});

test('route uses stable production URL and requires confirmed storage',()=>{
 const route=readFileSync(new URL('../app/api/crm/leads/route.ts',import.meta.url),'utf8');
 assert.match(route,/process\.env\.URL/);
 assert.match(route,/Promise\.allSettled/);
 assert.match(route,/if\(!stored\)/);
 assert.match(route,/return response\(\{ok:true\},201\)/);
});
