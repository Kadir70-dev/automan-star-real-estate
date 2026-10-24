// Run: node --test tests/  (Node >= 22.18 strips TypeScript types natively)
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toE164,validateLead} from '../lib/consultation-lead.ts';

const good={name:'Test Visitor',email:'Test@Example.com ',country:'AE',phone:'050 123 4567',interest:'Buying Property',consent:true};

test('UAE numbers normalise to E.164 in all common input styles',()=>{
 for(const raw of ['050 123 4567','501234567','+971 50 123 4567','00971501234567','(050) 123-4567','+971 (0)50 123 4567'])
  assert.equal(toE164('AE',raw),'+971501234567',raw);
 assert.equal(toE164('AE','04 123 4567'),'+97141234567');
});
test('other countries use their own dial code and length rules',()=>{
 assert.equal(toE164('GB','07700 900123'),'+447700900123');
 assert.equal(toE164('IN','98765 43210'),'+919876543210');
 assert.equal(toE164('US','(415) 555-0132'),'+14155550132');
 assert.equal(toE164('IT','06 1234 5678'),'+390612345678');
});
test('rejects invalid phone numbers',()=>{
 for(const raw of ['','123','50 123 45678 999','+44 7700 900123','abc501234567','5012<34567'])assert.equal(toE164('AE',raw),null,raw);
 assert.equal(toE164('XX','501234567'),null);
});
test('accepts a valid lead and normalises fields',()=>{
 const r=validateLead(good);
 assert.ok(r.ok);
 assert.deepEqual(r.lead,{name:'Test Visitor',email:'test@example.com',phoneE164:'+971501234567',country:'AE',interest:'Buying Property'});
});
test('reports a clear error per invalid field',()=>{
 const r=validateLead({name:'A',email:'bad',country:'AE',phone:'12',interest:'Other',consent:false});
 assert.ok(!r.ok);
 assert.deepEqual(Object.keys(r.errors).sort(),['consent','email','interest','name','phone']);
});
test('rejects links in name and non-boolean consent',()=>{
 assert.ok(!validateLead({...good,name:'Visit https://spam.example'}).ok);
 assert.ok(!validateLead({...good,consent:'true'}).ok);
});
