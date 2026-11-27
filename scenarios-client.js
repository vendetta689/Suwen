(()=>{
  const el=id=>document.getElementById(id),dialog=el('scenarioDialog');
  let selected=null,items=[],baseline='',busy=false,epoch=0;
  const fingerprint=input=>JSON.stringify(Object.fromEntries(Object.entries(input).sort(([a],[b])=>a.localeCompare(b))));
  const dirty=()=>baseline!==fingerprint(getInputs());
  const foreign=item=>item?.user_id&&item.user_id!==activeProfile?.user_id;
  const scope=()=>activeProfile?.role==='admin'&&el('scenarioScope').value==='all'?{scope:'all'}:{};
  function current(){el('scenarioCurrent').textContent=selected?`当前方案：${selected.name}${foreign(selected)?' · 来自其他账号，保存将创建我的副本':''}${dirty()?' · 有未保存修改':''}`:'当前为未保存方案';}
  function reset(){epoch++;selected=null;items=[];baseline=fingerprint(getInputs());el('scenarioName').value='';el('scenarioScope').value='mine';el('scenarioSearch').value='';el('scenarioProvince').replaceChildren(new Option('全部省份',''));for(const [key,name] of Object.entries(PROVINCE_NAMES))if(Object.hasOwn(PROVINCE_CONFIGS,key))el('scenarioProvince').add(new Option(name,key));el('scenarioRows').replaceChildren();if(dialog.open)dialog.close();}
  document.addEventListener('suwen-session',reset);
  document.addEventListener('suwen-before-logout',e=>{if(dirty()&&!confirm('当前参数尚未保存，确认退出登录？'))e.preventDefault();});
  function allowed(){return !dirty()||confirm('当前参数尚未保存，是否放弃修改并调用其他方案？');}
  async function task(fn){if(busy||!activeProfile)return;busy=true;const owner=activeProfile.user_id,version=epoch;
    const live=()=>version===epoch&&activeProfile?.user_id===owner;
    dialog.querySelectorAll('button,select').forEach(b=>b.disabled=true);el('scenarioStatus').textContent='正在处理…';
    try{await fn(live);}catch(e){if(live())el('scenarioStatus').textContent=e.message;}finally{busy=false;dialog.querySelectorAll('button,select').forEach(b=>b.disabled=false);if(live())current();}
  }
  function draw(){
    const query=el('scenarioSearch').value.trim().toLowerCase();el('scenarioRows').replaceChildren();
    const visible=items.filter(s=>(s.name+' '+(s.owner_name||'')).toLowerCase().includes(query)&&(!el('scenarioProvince').value||s.province===el('scenarioProvince').value));
    if(!visible.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent=items.length?'没有匹配的方案':'暂无方案';tr.append(td);el('scenarioRows').append(tr);}
    for(const item of visible){const tr=document.createElement('tr');for(const text of [item.name,item.owner_name||'当前账号',PROVINCE_NAMES[item.province]||item.province,new Date(item.updated_at).toLocaleString('zh-CN')]){const td=document.createElement('td');td.textContent=text;tr.append(td);}
      const actions=document.createElement('td');const commands=[['调用',()=>load(item)],...(!foreign(item)?[['重命名',()=>rename(item)],['删除',()=>remove(item)]]:[])];for(const [label,handler] of commands){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',handler);actions.append(b);}tr.append(actions);el('scenarioRows').append(tr);
    }
  }
  async function list(live){const result=await api('list-scenarios',scope());if(!live())return;items=result.scenarios;draw();el('scenarioStatus').textContent=`已保存 ${items.length} 个方案${items.length===1000?'（显示最近1000个）':''}`;}
  async function load(item){if(!allowed())return;await task(async live=>{
    const {scenario}=await api('get-scenario',{id:item.id,...scope()});if(!live())return;
    const select=document.querySelector('select[data-key="province"]');
    if(!Object.hasOwn(PROVINCE_CONFIGS,scenario.province))throw new Error('此账号不能调用该省份方案');
    select.value=scenario.province;applyProvinceDefaults();
    for(const field of document.querySelectorAll('input[data-key]'))if(Object.hasOwn(scenario.input,field.dataset.key))field.value=scenario.input[field.dataset.key];
    selected=scenario;el('scenarioName').value=scenario.name;baseline=fingerprint(getInputs());updateHourShareStatus();
    await refreshReport();if(live()){el('scenarioStatus').textContent='方案已调用';dialog.close();}
  });}
  async function save(copy=false){await task(async live=>{
    const name=el('scenarioName').value.trim();if(!name||name.length>80)throw new Error('请输入1至80字的项目名称');
    const input=getInputs(),snapshot=fingerprint(input),old=copy||foreign(selected)?null:selected;
    const {scenario}=await api('save-scenario',{name,input,...(old?{id:old.id,revision:old.revision}:{})});if(!live())return;
    selected=scenario;baseline=snapshot;el('scenarioName').value=scenario.name;await list(live);if(live())el('scenarioStatus').textContent='方案已保存到云端';
  });}
  async function rename(item){const name=prompt('项目新名称',item.name);if(name===null)return;await task(async live=>{
    const {scenario}=await api('rename-scenario',{id:item.id,revision:item.revision,name});if(!live())return;
    if(selected?.id===item.id){selected=scenario;el('scenarioName').value=scenario.name;}await list(live);
  });}
  async function remove(item){if(!confirm(`确认删除方案“${item.name}”？删除后无法恢复，当前页面参数不受影响。`))return;await task(async live=>{
    await api('delete-scenario',{id:item.id,revision:item.revision});if(!live())return;
    if(selected?.id===item.id){selected=null;el('scenarioName').value='';}await list(live);
  });}
  el('scenarioOpen').addEventListener('click',()=>{if(!activeProfile)return;el('scenarioScope').hidden=activeProfile.role!=='admin';current();dialog.showModal();task(list);});
  el('scenarioScope').addEventListener('change',()=>task(list));el('scenarioProvince').addEventListener('change',draw);
  el('scenarioClose').addEventListener('click',()=>dialog.close());
  el('scenarioSave').addEventListener('click',()=>save());el('scenarioCopy').addEventListener('click',()=>save(true));
  el('scenarioReload').addEventListener('click',()=>task(list));el('scenarioSearch').addEventListener('input',draw);
  document.querySelectorAll('input[data-key],select[data-key]').forEach(field=>field.addEventListener('input',current));
  window.addEventListener('beforeunload',e=>{if(activeProfile&&dirty()){e.preventDefault();e.returnValue='';}});
})();
