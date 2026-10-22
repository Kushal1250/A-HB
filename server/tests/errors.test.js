import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localErrorHandler } from '../src/middleware/errors.js';
function response(extra = {}) {
  return {headersSent:false, destroyed:false, writableEnded:false,
    status(code){this.statusCode=code;return this;},
    json(body){this.body=body;return this;},...extra};
}
test('disconnected file transfers are quiet and never write another response', t => {
  const log=t.mock.method(console,'error',()=>{});
  for (const code of ['ECONNABORTED','ECANCELED','ECONNRESET','EPIPE','ERR_STREAM_PREMATURE_CLOSE']) {
    for (const state of [{aborted:true},{socket:{destroyed:true}}]) {
      const res=response();
      localErrorHandler(Object.assign(new Error('Request aborted'),{code}),state,res,()=>assert.fail('forwarded cancellation'));
      assert.equal(res.body,undefined);
    }
    const res=response({destroyed:true,headersSent:true});
    localErrorHandler(Object.assign(new Error('write '+code),{code}),{},res,()=>assert.fail('forwarded cancellation'));
  }
  localErrorHandler({type:'request.aborted'}, {aborted:true},response(),()=>assert.fail());
  assert.equal(log.mock.callCount(),0);
});
test('transport errors on a live connection remain visible', t=>{
  const log=t.mock.method(console,'error',()=>{});
  const res=response();
  localErrorHandler({code:'ECANCELED',message:'Unexpected cancellation'}, {},res,()=>assert.fail());
  assert.equal(res.statusCode,500);
  assert.equal(log.mock.callCount(),1);
});
test('real storage errors remain logged, even after disconnection', t=>{
  const log=t.mock.method(console,'error',()=>{});
  const res=response({destroyed:true});
  localErrorHandler({code:'EACCES',message:'Permission denied'}, {aborted:true},res,()=>assert.fail());
  assert.equal(log.mock.callCount(),1);
  assert.equal(res.body,undefined);
});
test('missing files and upload validation keep their original responses',()=>{
  for (const [error,status] of [[{status:404,message:'File not found.'},404],[{code:'LIMIT_FILE_SIZE'},413],[{name:'MulterError'},422]]) {
    const res=response();localErrorHandler(error,{},res,()=>assert.fail());assert.equal(res.statusCode,status);
  }
});
test('streaming failures after headers are forwarded without rewriting the response',t=>{
  t.mock.method(console,'error',()=>{});
  const error=new Error('Disk read failed'),res=response({headersSent:true});let forwarded;
  localErrorHandler(error,{},res,e=>{forwarded=e;});
  assert.equal(forwarded,error);assert.equal(res.body,undefined);
});
