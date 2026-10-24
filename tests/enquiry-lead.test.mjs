import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateEnquiry} from '../lib/enquiry-lead.ts';

const valid={name:'  Dubai Buyer  ',email:'  Buyer@Example.com ',message:'Looking for an apartment in Business Bay.',property:'Business Bay apartment'};

test('enquiry normalises valid property lead',()=>{
  const result=validateEnquiry(valid);
  assert.equal(result.ok,true);
  if(result.ok)assert.deepEqual(result.lead,{
    name:'Dubai Buyer',email:'buyer@example.com',
    message:'Looking for an apartment in Business Bay.',
    property:'Business Bay apartment',
  });
});

test('general enquiry without property label is permitted',()=>{
  const r=validateEnquiry({name:'Sample Lead',email:'lead@example.com',message:''});
  assert.equal(r.ok,true);
  if(r.ok)assert.equal(r.lead.property,'General enquiry');
});

test('missing name, invalid email and malformed bodies are rejected',()=>{
  for(const payload of [null,{},[],{'name':'A',email:'lead@example.com'},{
    name:'Client Name',email:'not-an-email',message:'Want a viewing',
  }]){
    assert.equal(validateEnquiry(payload).ok,false);
  }
});

test('oversized message and malicious input are rejected',()=>{
  for(const payload of [
    {...valid,message:'m'.repeat(3001)},
    {...valid,name:'https://spam.example'},
    {...valid,property:'<script>alert(1)</script>'},
    {...valid,name:'a'.repeat(121)},
    {...valid,email:'email@example.com'.repeat(30)},
  ]){
    assert.equal(validateEnquiry(payload).ok,false);
  }
});

test('static form blueprint defines every field used by the enquiry endpoint',()=>{
  const staticForms=readFileSync(new URL('../public/__forms.html',import.meta.url),'utf8');
  const route=readFileSync(new URL('../app/api/crm/leads/route.ts',import.meta.url),'utf8');
  assert.match(staticForms,/<form name="enquiry"[^>]*data-netlify="true"/);
  assert.match(route,/'form-name':'enquiry'/);
  for(const field of ['name','email','message','property','submitted_at','source_url','company']){
    assert.match(staticForms,new RegExp('name="'+field+'"'),field);
  }
  assert.match(route,/if\(stored\.length===0\)return reply\(/);
  assert.match(route,/error:'We could not save your enquiry/);
});
