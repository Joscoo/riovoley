jest.mock('@capacitor/app',()=>({App:{addListener:jest.fn(),getState:jest.fn().mockResolvedValue({isActive:true})}}));
jest.mock('@capacitor/push-notifications',()=>({PushNotifications:{addListener:jest.fn(),createChannel:jest.fn().mockResolvedValue(undefined),requestPermissions:jest.fn(),register:jest.fn(),unregister:jest.fn().mockResolvedValue(undefined)}}));
jest.mock('./runtime',()=>({isAndroidPlatform:jest.fn(()=>true),isNativePlatform:jest.fn(()=>true)}));

function load(){
 jest.resetModules();
 const push=require('./push');
 const {PushNotifications:plugin}=require('@capacitor/push-notifications');
 plugin.requestPermissions.mockResolvedValue({receive:'granted'});plugin.register.mockResolvedValue(undefined);
 return {push,plugin,runtime:require('./runtime')};
}
async function started(read){for(let i=0;i<20&&!read();i++)await Promise.resolve();expect(read()).toBe(true);}

test('cerrar sesión sin registrar push no invoca el plugin nativo de Firebase',async()=>{
 const {push,plugin}=load();await push.teardownPushForAuthenticatedUser();expect(plugin.unregister).not.toHaveBeenCalled();
});
test('permiso denegado permite cerrar sesión sin unregister nativo',async()=>{
 const {push,plugin}=load();plugin.requestPermissions.mockResolvedValue({receive:'denied'});
 await push.initializePushForAuthenticatedUser({id:'local-user'});await push.teardownPushForAuthenticatedUser();
 expect(plugin.register).not.toHaveBeenCalled();expect(plugin.unregister).not.toHaveBeenCalled();
});
test('un registro completado se elimina una sola vez al cerrar sesión',async()=>{
 const {push,plugin}=load();await push.initializePushForAuthenticatedUser({id:'local-user'});
 await push.teardownPushForAuthenticatedUser();await push.teardownPushForAuthenticatedUser();
 expect(plugin.register).toHaveBeenCalledTimes(1);expect(plugin.unregister).toHaveBeenCalledTimes(1);
});
test('un registro rechazado no habilita unregister',async()=>{
 const {push,plugin}=load();plugin.register.mockRejectedValue(new Error('registration unavailable'));
 await expect(push.initializePushForAuthenticatedUser({id:'local-user'})).rejects.toThrow('registration unavailable');
 await push.teardownPushForAuthenticatedUser();expect(plugin.unregister).not.toHaveBeenCalled();
});
test('cerrar sesión mientras se solicita permiso impide registrar al usuario anterior',async()=>{
 const {push,plugin}=load();let allow;plugin.requestPermissions.mockReturnValue(new Promise(resolve=>{allow=resolve;}));
 const pending=push.initializePushForAuthenticatedUser({id:'local-user'});
 await started(()=>plugin.requestPermissions.mock.calls.length>0);await push.teardownPushForAuthenticatedUser();allow({receive:'granted'});await pending;
 expect(plugin.register).not.toHaveBeenCalled();expect(plugin.unregister).not.toHaveBeenCalled();
});
test('cerrar sesión durante register espera su resolución y elimina el registro',async()=>{
 const {push,plugin}=load();let complete;plugin.register.mockReturnValue(new Promise(resolve=>{complete=resolve;}));
 const pending=push.initializePushForAuthenticatedUser({id:'local-user'});await started(()=>plugin.register.mock.calls.length>0);
 const logout=push.teardownPushForAuthenticatedUser();expect(plugin.unregister).not.toHaveBeenCalled();
 complete();await pending;await logout;expect(plugin.unregister).toHaveBeenCalledTimes(1);
});
test('el perfil web no solicita registro ni cancelación nativos',async()=>{
 const {push,plugin,runtime}=load();runtime.isNativePlatform.mockReturnValue(false);
 await push.initializePushForAuthenticatedUser({id:'local-user'});await push.teardownPushForAuthenticatedUser();
 expect(plugin.register).not.toHaveBeenCalled();expect(plugin.unregister).not.toHaveBeenCalled();
});
test('un logout pendiente no cancela el registro de una nueva sesión',async()=>{
 const {push,plugin}=load();let complete;plugin.register.mockReturnValueOnce(new Promise(resolve=>{complete=resolve;}));
 const first=push.initializePushForAuthenticatedUser({id:'first-local-user'});await started(()=>plugin.register.mock.calls.length>0);
 const logout=push.teardownPushForAuthenticatedUser();await push.initializePushForAuthenticatedUser({id:'second-local-user'});
 complete();await first;await logout;expect(plugin.unregister).not.toHaveBeenCalled();
 await push.teardownPushForAuthenticatedUser();expect(plugin.unregister).toHaveBeenCalledTimes(1);
});
test('permite reintentar la cancelación si el puente nativo la rechaza',async()=>{
 const {push,plugin}=load();await push.initializePushForAuthenticatedUser({id:'local-user'});
 plugin.unregister.mockRejectedValueOnce(new Error('bridge unavailable'));
 const log=jest.spyOn(console,'error').mockImplementation(()=>{});
 try{await push.teardownPushForAuthenticatedUser();await push.teardownPushForAuthenticatedUser();expect(plugin.unregister).toHaveBeenCalledTimes(2);}finally{log.mockRestore();}
});
