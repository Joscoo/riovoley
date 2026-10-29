jest.mock('../../../../config/supabase',()=>({supabase:{from:jest.fn()}}));
jest.mock('../../../../shared/infrastructure/auth/deleteAuthUserById',()=>({deleteAuthUserById:jest.fn()}));
jest.mock('../../../user-provisioning',()=>({userProvisioningService:{}}));
jest.mock('../../../../utils/piiCrypto',()=>({withEncryptedUserContactFields:jest.fn(value=>value)}));
const {supabase}=require('../../../../config/supabase');
const {deleteAuthUserById}=require('../../../../shared/infrastructure/auth/deleteAuthUserById');
const {SupabaseUserManagementRepository}=require('./supabaseUserManagementRepository');
beforeEach(()=>jest.resetAllMocks());
const mockDatabase=steps=>supabase.from.mockImplementation(table=>{
 const q={select:()=>q,eq:()=>q,single:async()=>({data:{id:'fixture-user',role:'estudiante'},error:null}),delete:()=>{steps.push(table);return q;},then:resolve=>resolve({error:null})};return q;
});
test('rechazo de autorización Auth deja intactas las tablas de usuario',async()=>{
 deleteAuthUserById.mockRejectedValue(new Error('TARGET_NOT_ALLOWED'));
 const deleted=[];mockDatabase(deleted);
 await expect(new SupabaseUserManagementRepository().deleteUser('fixture-user','atleta')).rejects.toThrow('TARGET_NOT_ALLOWED');
 expect(deleted).toEqual([]);
});
test('objetivo autorizado se comprueba antes de eliminar filas relacionadas',async()=>{
 const steps=[];
 deleteAuthUserById.mockImplementation(async()=>{steps.push('auth');});
 mockDatabase(steps);
 await new SupabaseUserManagementRepository().deleteUser('fixture-user','atleta');
 expect(steps).toEqual(['auth','students','user_profiles','users']);
});
