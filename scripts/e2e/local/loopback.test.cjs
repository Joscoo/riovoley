const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loopbackConfig}=require('./loopback.cjs');
test('enlaza puertos publicados a loopback y conserva imagen, volumen y entorno',()=>{
  const original={Config:{Image:'image:1',Env:['EXAMPLE=local']},HostConfig:{NetworkMode:'riovoley-e2e-loopback',Binds:['test-volume:/data'],PortBindings:{'8000/tcp':[{HostIp:'',HostPort:'55321'}]}},NetworkSettings:{Networks:{'riovoley-e2e-loopback':{Aliases:['supabase_kong_riovoley-e2e-local'],NetworkID:'network-id'}}}};
  const config=loopbackConfig(original);
  assert.equal(config.HostConfig.PortBindings['8000/tcp'][0].HostIp,'127.0.0.1');
  assert.deepEqual(config.HostConfig.Binds,original.HostConfig.Binds);
  assert.deepEqual(config.Env,original.Config.Env);
  assert.equal(original.HostConfig.PortBindings['8000/tcp'][0].HostIp,'');
});
