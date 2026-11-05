jest.mock('../../../../config/supabase',()=>({supabase:{rpc:jest.fn()}}));
const {supabase}=require('../../../../config/supabase');
const {SupabaseGamificationRepository}=require('./supabaseGamificationRepository');
const {createGamificationFoundationUseCases}=require('../../application/useCases/createGamificationFoundationUseCases');
const {createGamificationUseCases}=require('../../application/useCases/createGamificationUseCases');

test('el repositorio declara las consultas del panel sin escrituras derivadas',()=>{
  expect(new SupabaseGamificationRepository().canWriteDerivedState).toBe(false);
});
test('la recompensa del repositorio invoca una RPC sin actor, fecha ni XP del cliente',async()=>{
  const expected={awarded:true,xpDelta:8,studentId:'s1',rewardDate:'2026-10-29'};
  supabase.rpc.mockResolvedValue({data:expected,error:null});
  expect(await new SupabaseGamificationRepository().claimDailyLoginReward()).toEqual(expected);
  expect(supabase.rpc).toHaveBeenLastCalledWith('claim_daily_login_reward');
});
test('el caso de uso real delega la recompensa a la operación atómica',async()=>{
  const expected={awarded:false,xpDelta:0};
  const repo={claimDailyLoginReward:jest.fn().mockResolvedValue(expected),findStudentByUserId:jest.fn(),upsertLoginRewardState:jest.fn(),appendXpLedgerEntry:jest.fn()};
  const result=await createGamificationFoundationUseCases(repo).registerDailyLoginRewardUseCase.execute({userId:'no-confiar-en-este-id'});
  expect(result).toEqual(expected);expect(repo.claimDailyLoginReward).toHaveBeenCalledWith();
  expect(repo.findStudentByUserId).not.toHaveBeenCalled();expect(repo.upsertLoginRewardState).not.toHaveBeenCalled();expect(repo.appendXpLedgerEntry).not.toHaveBeenCalled();
});
test('cargar el panel conserva las proyecciones visuales sin persistir resultados',async()=>{
  const methods=new Map();
  const repo=new Proxy({canWriteDerivedState:false},{get(target,name){
    if(name in target)return target[name];
    if(!methods.has(name))methods.set(name,jest.fn(async()=>{
      if(name==='findStudentById')return {id:'s1',categoria:'iniciacion_hombres',users:{nombre:'Fixture',apellido:'Seguridad',fecha_nacimiento:'2010-01-01'}};
      if(name==='getAthleteStageCatalog')return [{slug:'semilla',name:'Semilla',sort_order:1,is_active:true}];
      if(/^get/.test(name))return null;
      return [];
    }));
    return methods.get(name);
  }});
  const result=await createGamificationUseCases(repo,{getEcuadorDate:()=> '2026-10-29',getEcuadorISOString:()=> '2026-10-29T12:00:00Z'}).loadStudentGamificationByStudentIdUseCase.execute({studentId:'s1'});
  expect(result.profile).toBeTruthy();
  for(const name of ['replaceCampaignProgress','replaceHiddenRewards','upsertCurrentStage','insertStageHistory'])expect(repo[name]).not.toHaveBeenCalled();
});
