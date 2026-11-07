import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SALES_WHATSAPP,enquiryWhatsAppHref,enquiryWhatsAppText} from '../lib/whatsapp-link.ts';

test('enquiries go to the Automan sales WhatsApp number',()=>{
 assert.equal(SALES_WHATSAPP,'971521357286');
 const href=enquiryWhatsAppHref({name:'Test Visitor',email:'t@example.com',phone:'+971 50 123 4567',topic:'Buying Property'});
 assert.ok(href.startsWith('https://wa.me/971521357286?text='));
 const text=decodeURIComponent(href.split('?text=')[1]);
 assert.match(text,/Name: Test Visitor/);assert.match(text,/Phone: \+971 50 123 4567/);assert.match(text,/Interested in: Buying Property/);
});

test('empty fields are dropped and whitespace is flattened',()=>{
 const text=enquiryWhatsAppText({name:' A \n B ',email:'a@b.co',message:''});
 assert.match(text,/Name: A B/);assert.doesNotMatch(text,/Message:|Phone:/);
});
