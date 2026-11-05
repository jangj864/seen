'use strict';
// One idempotent run id is shared by retries; only completed runs reach the API.
const SeenScores=(()=>{
 let client;
 const pending=new Map();
 function connection(){
  const config=window.SEEN_COMMUNITY;
  if(!config?.url||!config.key||!window.supabase)throw Error('Score service unavailable');
  return client||(client=supabase.createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}));
 }
 async function save({mode,answers,runId,nickname:submittedName}){
  if(!['all','eyes','films'].includes(mode)||!Array.isArray(answers)||answers.length!==5||answers.some(a=>!Number.isInteger(a)||a<0||a>3)||typeof runId!=='string')throw Error('Incomplete quiz run');
  const nickname=String(submittedName??(typeof SeenHub!=='undefined'?SeenHub.name:'')).trim().replace(/\s+/g,' ');
  if([...nickname].length<2||[...nickname].length>32||/[\u0000-\u001f\u007f<>]/.test(nickname))throw Error('Invalid nickname');
  const api=connection();
  const {error}=await api.from('seen_quiz_scores').insert({id:runId,nickname,quiz_mode:mode,answers});
  if(error&&error.code!=='23505')throw error;
  const {data,error:readError}=await api.rpc('seen_quiz_leaderboard',{p_mode:mode,p_run_id:runId});
  if(readError)throw readError;
  if(!data||!Array.isArray(data.entries)||!data.current)throw Error('Score record unavailable');
  return data;
 }
 function submit(run){
  if(pending.has(run.runId))return pending.get(run.runId);
  const request=save(run).catch(error=>{pending.delete(run.runId);throw error});
  if(pending.size>=50)pending.delete(pending.keys().next().value);
  pending.set(run.runId,request);return request;
 }
 return Object.freeze({submit});
})();
