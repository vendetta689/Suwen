const HOUR_LABELS=Array.from({length:24},(_,i)=>`${i}-${i+1}`);
const HOUR_SHARE_KEYS=HOUR_LABELS.map((_,i)=>`hourShare${i}`);
const MONTH_DAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
const MODEL_DEFAULTS={};
const PROVINCE_CONFIGS={};
    const PROVINCE_NAMES = {
      jiangsu: "江苏",
      zhejiang: "浙江",
      chongqing: "重庆",
      guangdong: "广东",
      sichuan: "四川",
      anhui: "安徽",
      hunan: "湖南",
      shanghai: "上海"
    };

    const fmt = (n, d = 1) => Number.isFinite(n) ? n.toLocaleString("zh-CN", { minimumFractionDigits: d, maximumFractionDigits: d }) : "-";
    const wan = n => `${fmt(n, 1)}`;
    const yuanToWan = n => n / 10000;
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const provinceConfig = x => PROVINCE_CONFIGS[x.province] || PROVINCE_CONFIGS.jiangsu;


    function getInputs() {
      const inputs = Object.fromEntries([...document.querySelectorAll("input[data-key]")].map(input => [input.dataset.key, Number(input.value) || 0]));
      const selects = Object.fromEntries([...document.querySelectorAll("select[data-key]")].map(select => [select.dataset.key, select.value]));
      return { ...MODEL_DEFAULTS, ...inputs, ...selects };
    }


    function hourShares(x) {
      const hasManualShares = HOUR_SHARE_KEYS.some(key => Object.prototype.hasOwnProperty.call(x, key));
      const manualShares = HOUR_SHARE_KEYS.map(key => Math.max(Number(x[key]) || 0, 0));
      const defaultShares = provinceConfig(x).hourShares.map(v => Math.max(v, 0));
      const raw = hasManualShares && manualShares.some(value => value > 0) ? manualShares : defaultShares;
      const total = raw.reduce((a, b) => a + b, 0) || 1;
      return raw.map(v => v / total);
    }

    function updateHourShareStatus() {
      const totalEl = document.getElementById("hourShareTotal");
      if (!totalEl) return;
      const values = HOUR_SHARE_KEYS.map(key => {
        const input = document.querySelector(`input[data-key="${key}"]`);
        return Math.max(Number(input?.value) || 0, 0);
      });
      const total = values.reduce((sum, value) => sum + value, 0);
      const isExact = Math.abs(total - 100) < 0.005;
      totalEl.classList.toggle("warn", !isExact);
      totalEl.textContent = total <= 0
        ? "合计0%，测算使用本省默认比例"
        : isExact
          ? `合计${fmt(total, 2)}%`
          : `合计${fmt(total, 2)}%，测算时归一为100%`;
    }

    function resetHourShares(shouldRender = true) {
      const province = document.querySelector('select[data-key="province"]')?.value || "jiangsu";
      const defaults = (PROVINCE_CONFIGS[province] || PROVINCE_CONFIGS.jiangsu).hourShares;
      HOUR_SHARE_KEYS.forEach((key, index) => {
        const input = document.querySelector(`input[data-key="${key}"]`);
        if (input) input.value = Number(defaults[index] || 0).toFixed(6);
      });
      updateHourShareStatus();
      if (shouldRender) render();
    }


    function applyProvinceDefaults() {
      const x = getInputs();
      const prices = provinceConfig(x).prices;
      Object.entries(prices).forEach(([key, value]) => {
        const input = document.querySelector(`input[data-key="${key}"]`);
        if (input) input.value = value;
      });
      const opDefaults = {
        lightingCount: 1,
        networkCount: 1,
        barrierCount: 1,
        storeManagerCount: ["zhejiang", "guangdong", "anhui", "hunan"].includes(x.province) ? 1 : 0,
        cleaningCount: 1,
        dayManagerCount: 0,
        nightManagerCount: 0,
        septicCleanCount: 0,
        contingencyCount: 1,
        interconnectRate: 0,
        interconnectUnitFee: 0.15
      };
      Object.entries(opDefaults).forEach(([key, value]) => {
        const input = document.querySelector(`input[data-key="${key}"]`);
        if (input) input.value = value;
      });
      resetHourShares(false);
    }


    function renderSensitivity(base) {
      const scenarios = [
        ["单枪日充电量", "-10%", { singleGunDailyKwh: base.x.singleGunDailyKwh * 0.9 }],
        ["单枪日充电量", "+10%", { singleGunDailyKwh: base.x.singleGunDailyKwh * 1.1 }],
        ["服务费", "-0.10元", { serviceFee: Math.max(base.x.serviceFee - 0.1, 0) }],
        ["服务费", "+0.10元", { serviceFee: base.x.serviceFee + 0.1 }],
        ["储能台数", "-2台", { batteryUnits: Math.max(base.x.batteryUnits - 2, 0) }],
        ["储能台数", "+2台", { batteryUnits: base.x.batteryUnits + 2 }],
        ["峰谷价差", "扩大20%", { peakPrice: base.x.peakPrice * 1.1, valleyPrice: base.x.valleyPrice * 0.9 }],
        ["土地首年成本", "+20万", { firstLandCost: base.x.firstLandCost + 20 }]
      ];
      document.getElementById("sensitivityRows").innerHTML = scenarios.map(([name, change, patch], index) => {
        const r = serverReport.sensitivity[index];
        const y1 = r.rows[0];
        return `<tr><td>${name}</td><td>${change}</td><td>${r.payback ? fmt(r.payback, 1) + " 年" : "未回本"}</td><td class="${y1.net >= 0 ? "positive" : "negative"}">${wan(y1.net)}</td></tr>`;
      }).join("");
    }


    function paintReport() {
      updateHourShareStatus();
      const r = serverReport.result;
      const first = r.rows[0];
      document.getElementById("totalCost").textContent = `${wan(r.costs.total)} 万`;
      document.getElementById("cashflowYear1").textContent = `${wan(first.net)} 万`;
      document.getElementById("cashflowYear1").className = `value ${first.net >= 0 ? "positive" : "negative"}`;
      document.getElementById("payback").textContent = r.payback ? `${fmt(r.payback, 2)} 年` : "未回本";
      document.getElementById("energyGain").textContent = `${wan(first.totalGain)} 万`;

      const costRows = [["基础设施", r.costs.civil, "场地面积 × 单价"], ["箱变", r.costs.transformer, "变压器功率 × 单价"], ["外线工程", r.costs.grid, "场地配置输入"], ["光伏系统", r.costs.pv, "光伏功率 × 单价"], ["钢结构", r.costs.steel, "光伏面积 × 单价"], ["储能系统", r.costs.battery, "容量 × 台数 × 单价"], ["充电枪", r.costs.guns, "枪数 × 综合单价"], ["休息区", r.costs.lounge, "面积 × 单价"], ["其他成本", r.costs.other, "场地配置输入"], ["合计", r.costs.total, ""]];
      document.getElementById("costRows").innerHTML = costRows.map(([name, value, logic]) => `<tr><td>${name}</td><td><strong>${wan(value)}</strong></td><td class="muted">${logic}</td></tr>`).join("");

      const op = first.opBreakdown;
      const opRows = op.fixedOps !== undefined ? [
        ["Excel年度运维成本", op.fixedOps, "新版模板预设年度运维成本"],
        ["合计", op.total, "SUM"]
      ] : [
        ["充电桩运维费用", op.transformerOps, "2000kVA：1台5，2台7.5，3台10"],
        ["光伏巡检、清洗", op.pvInspect, "江苏/浙江0.2，其他省份0.7"],
        ["照明", op.lighting, "数量 × 0.1"],
        ["网络", op.network, "数量 × 0.1"],
        ["道闸", op.barrier, "数量 × 0.1"],
        ["软件系统", op.software, "变压器功率 / 2000 × 3"],
        ["店长", op.storeManager, "人数 × 省份人工单价"],
        ["卫生", op.cleaning, "人数 × 5.2"],
        ["管理员（日）", op.dayManager, "人数 × 8.346"],
        ["管理员（夜）", op.nightManager, "人数 × 9.102"],
        ["化粪池、沉砂池清污", op.septic, "次数 × 0.15"],
        ["零星维修", op.contingency, "项数 × 1"],
        ["清分通道费", op.clearing, "电费收入+服务费收入 × 6‰"],
        ["互联互通通道费", op.interconnect, "比例 × 单价 × 电费+服务费"],
        ["财产险", op.propertyInsurance, "建设总成本 / 1000"],
        ["公责险", op.liabilityInsurance, "固定0.5"],
        ["合计", op.total, "SUM"]
      ];
      document.getElementById("opRows").innerHTML = opRows.map(([name, value, note]) => `<tr><td>${name}</td><td><strong>${wan(value)}</strong></td><td class="muted">${note}</td></tr>`).join("");

      const profitRows = [["电费收入", first.electricityIncome, "无光储购电量 × 分时电价 / 损耗"], ["实际购电成本", -first.storageCost, "光伏+储能后实际购电成本"], ["服务费收入", first.serviceIncome, "年充电量 × 服务费"], ["品牌收入", first.brand, "按所选省份现金流表年限计入"], ["车生活收入", first.carLife, "按年计入其他经营收入"], ["光伏增效", first.pvGain, "按Excel逐小时光伏后购电成本差额"], ["储能增效", first.storageGain, "按省份逐月时段与两充两放规则模拟"], ["土地成本", -first.landCost, "首年成本，按周期涨幅递增"], ["运维成本", -first.ops, "按年度运维成本输入"], ["设备更换成本", -first.replacementCost, "充电枪5年、储能10年更换"], ["增值税及附加税", -first.tax, "(电费收入 + 服务费收入 - 实际购电成本) / 1.13 × 13% × 1.12"], ["首年净现金流", first.net, "收入 - 电费成本 - 土地 - 运维 - 更换 - 税费"]];
      document.getElementById("profitRows").innerHTML = profitRows.map(([name, value, note]) => `<tr><td>${name}</td><td class="${value >= 0 ? "positive" : "negative"}">${wan(value)}</td><td class="muted">${note}</td></tr>`).join("");

      const storageCycleRate = shiftedKwh => shiftedKwh / Math.max(r.x.batteryKwh * r.x.batteryUnits * r.x.storageEfficiency * 365, 1);
      document.getElementById("storageCompareRows").innerHTML = [
        ["省级Excel规则", first.ruleStorageGain, first.ruleShiftedKwh, "按省份逐月时段、两充两放及剩余电量连续计算"],
        ["自动时段模拟", first.autoStorageGain, first.autoShiftedKwh, "按当前峰谷类型自动识别充放电窗口"]
      ].map(([name, gain, shift, note]) => `<tr><td>${name}</td><td>${wan(gain)}</td><td>${fmt(shift / 10000, 1)} 万kWh</td><td>${fmt(storageCycleRate(shift) * 100, 1)}%</td><td class="muted">${note}</td></tr>`).join("");

      document.getElementById("energyRows").innerHTML = [["光伏发电量（万kWh）", first.annualPv / 10000, r.rows.reduce((s, y) => s + y.annualPv, 0) / 10000], ["光伏自用电量（万kWh）", first.selfUse / 10000, r.rows.reduce((s, y) => s + y.selfUse, 0) / 10000], ["余电上网（万kWh）", first.exportKwh / 10000, r.rows.reduce((s, y) => s + y.exportKwh, 0) / 10000], ["储能转移电量（万kWh）", first.shiftedKwh / 10000, r.rows.reduce((s, y) => s + y.shiftedKwh, 0) / 10000], ["光伏增效（万元）", first.pvGain, r.pvGainTotal], ["储能增效（万元）", first.storageGain, r.storageGainTotal]].map(([name, y1, total]) => `<tr><td>${name}</td><td>${fmt(y1, 1)}</td><td>${fmt(total, 1)}</td></tr>`).join("");

      const avg = values => values.reduce((s, v) => s + v, 0) / Math.max(values.length, 1);
      const pct = value => `${fmt(value * 100, 1)}%`;
      const utilizationRows = [
        ["光伏自用率", first.selfUse / Math.max(first.annualPv, 1), avg(r.rows.map(y => y.selfUse / Math.max(y.annualPv, 1))), "自用光伏电量 / 光伏发电量"],
        ["光伏余电率", first.exportKwh / Math.max(first.annualPv, 1), avg(r.rows.map(y => y.exportKwh / Math.max(y.annualPv, 1))), "余电上网电量 / 光伏发电量"],
        ["储能利用率", first.shiftedKwh / Math.max(first.storagePotentialKwh, 1), avg(r.rows.map(y => y.shiftedKwh / Math.max(y.storagePotentialKwh, 1))), "实际放电替代电量 / 理论可放电量"],
        ["储能等效循环", first.shiftedKwh / Math.max(r.x.batteryKwh * r.x.batteryUnits * r.x.storageEfficiency, 1), avg(r.rows.map(y => y.shiftedKwh / Math.max(r.x.batteryKwh * r.x.batteryUnits * r.x.storageEfficiency, 1))), "按年放电量折算的满充满放次数"]
      ];
      document.getElementById("utilizationRows").innerHTML = utilizationRows.map(([name, y1, avgValue, note], index) => `<tr><td>${name}</td><td>${index < 3 ? pct(y1) : fmt(y1, 0)}</td><td>${index < 3 ? pct(avgValue) : fmt(avgValue, 0)}</td><td class="muted">${note}</td></tr>`).join("");

      const maxNet = Math.max(...r.rows.slice(0, 10).map(y => Math.abs(y.net)), 1);
      document.getElementById("bars").innerHTML = r.rows.slice(0, 10).map(y => `<div class="bar-row"><div>第${y.year}年</div><div class="bar-track"><div class="bar-fill" style="width:${clamp(Math.abs(y.net) / maxNet * 100, 2, 100)}%;background:${y.net >= 0 ? "linear-gradient(90deg, var(--brand), var(--blue))" : "#b42318"}"></div></div><div>${wan(y.net)}</div></div>`).join("");

      renderSensitivity(r);
    }


let serverReport=null, activeProfile=null, session=null, accounts=[], timer, requestNumber=0;
const sessionKey='suwen-secure-session';
const status=message=>{document.getElementById('calculationStatus').textContent=message;};
function exportReady(ready){for(const id of ['exportPptBtn','exportScreenshotBtn'])document.getElementById(id).disabled=!ready;}
function currentUser(){return activeProfile?.username||'';}
function currentAccount(){return activeProfile;}
function isAdminAccount(){return activeProfile?.role==='admin';}
function calculate(){if(!serverReport)throw new Error('请等待测算完成');return serverReport.result;}
function priceTypeMatrix(){if(!serverReport)throw new Error('请先测算');return serverReport.priceTypes;}
function saveSession(value){session=value;if(value)sessionStorage.setItem(sessionKey,JSON.stringify(value));else sessionStorage.removeItem(sessionKey);}
async function api(route,body={},authenticated=true,retry=true){
  const base=window.SUWEN_SETTINGS?.apiUrl?.replace(/\/$/,'');
  if(!base)throw new Error('账号服务尚未配置，请联系管理员完成部署');
  const response=await fetch(`${base}/${route}`,{method:'POST',headers:{'Content-Type':'application/json',...(authenticated&&session?{Authorization:`Bearer ${session.access_token}`}:{})},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({error:'服务响应错误'}));
  if(response.status===401&&authenticated&&retry&&session?.refresh_token){
    try{saveSession(await api('refresh',{refresh_token:session.refresh_token},false,false));return await api(route,body,true,false);}catch(error){localLogout();throw error;}
  }
  if(!response.ok){if(authenticated&&(response.status===401||response.status===403))localLogout();throw new Error(data.error||'请求失败');}
  return data;
}
function setAuthVisible(visible){
  document.getElementById('loginView').classList.toggle('hidden',visible);
  document.getElementById('appShell').classList.toggle('hidden',!visible);
  document.getElementById('accountToggleBtn').classList.toggle('hidden',!isAdminAccount());
  document.getElementById('currentUser').textContent=visible?`${currentUser()} · ${isAdminAccount()?'管理员':PROVINCE_NAMES[activeProfile.province]}`:'';
}
function localLogout(){clearTimeout(timer);requestNumber++;saveSession(null);activeProfile=null;serverReport=null;accounts=[];exportReady(false);document.getElementById('accountPanel').classList.add('hidden');document.getElementById('loginPassword').value='';setAuthVisible(false);document.dispatchEvent(new Event('suwen-session'));}
async function logout(){if(!document.dispatchEvent(new Event('suwen-before-logout',{cancelable:true})))return;try{if(session)await api('logout');}finally{localLogout();}}
async function startSession(){
  const me=await api('me');activeProfile=me.profile;
  Object.keys(PROVINCE_CONFIGS).forEach(key=>delete PROVINCE_CONFIGS[key]);Object.assign(PROVINCE_CONFIGS,me.metadata);
  const select=document.querySelector('select[data-key="province"]');
  for(const option of select.options){option.disabled=!Object.hasOwn(PROVINCE_CONFIGS,option.value);option.hidden=option.disabled;}
  if(!isAdminAccount())select.value=activeProfile.province;
  else if(!Object.hasOwn(PROVINCE_CONFIGS,select.value))select.value=Object.keys(PROVINCE_CONFIGS)[0];
  select.disabled=!isAdminAccount();applyProvinceDefaults();setAuthVisible(true);document.dispatchEvent(new Event('suwen-session'));await refreshReport();
}
async function login(){
  const button=document.getElementById('loginBtn'),error=document.getElementById('loginError');button.disabled=true;error.textContent='';
  try{const username=document.getElementById('loginUsername').value.trim().toLowerCase(),password=document.getElementById('loginPassword').value;saveSession(await api('login',{username,password},false));document.getElementById('loginPassword').value='';await startSession();}
  catch(e){localLogout();error.textContent=e.message;}finally{button.disabled=false;}
}
async function refreshReport(){
  if(!activeProfile)return;
  const id=++requestNumber;serverReport=null;exportReady(false);status('正在测算…');
  try{
    const report=await api('calculate',{input:getInputs()});
    if(id!==requestNumber||!activeProfile)return;
    serverReport=report;paintReport();status('测算已更新');exportReady(true);
  }catch(error){if(id===requestNumber){status(error.message);serverReport=null;exportReady(false);}}
}
function render(){updateHourShareStatus();clearTimeout(timer);requestNumber++;serverReport=null;exportReady(false);status('参数已修改，等待测算…');timer=setTimeout(refreshReport,350);}
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
async function renderAccounts(){
  if(!isAdminAccount())return;
  const data=await api('accounts');accounts=data.accounts;
  document.getElementById('accountRows').innerHTML=accounts.map(account=>`<tr><td>${escapeHtml(account.username)}</td><td>${escapeHtml(PROVINCE_NAMES[account.province]||'管理员')}</td><td>${account.enabled?'启用':'停用'}</td><td><input class="mini-input account-password" type="password" data-user-id="${escapeHtml(account.user_id)}" placeholder="12位以上新密码" autocomplete="new-password"></td><td><button data-action="update" data-user-id="${escapeHtml(account.user_id)}">改密</button><button data-action="toggle" data-user-id="${escapeHtml(account.user_id)}" ${account.user_id===activeProfile.user_id?'disabled':''}>${account.enabled?'停用':'启用'}</button><button data-action="delete" data-user-id="${escapeHtml(account.user_id)}" ${account.user_id===activeProfile.user_id?'disabled':''}>删除</button></td></tr>`).join('');
}
async function addAccount(){
  const button=document.getElementById('addAccountBtn');button.disabled=true;
  try{await api('create-account',{username:document.getElementById('newAccountName').value.trim().toLowerCase(),password:document.getElementById('newAccountPassword').value,province:document.getElementById('newAccountProvince').value});document.getElementById('newAccountName').value='';document.getElementById('newAccountPassword').value='';await renderAccounts();}catch(e){alert(e.message);}finally{button.disabled=false;}
}
async function handleAccountAction(event){
  const button=event.target.closest('button[data-action]');if(!button)return;
  const account=accounts.find(a=>a.user_id===button.dataset.userId);if(!account)return;
  const op=button.dataset.action;button.disabled=true;
  try{
    if(op==='update'){
      const input=[...document.querySelectorAll('.account-password')].find(el=>el.dataset.userId===account.user_id);
      await api('reset-password',{user_id:account.user_id,password:input.value});input.value='';
      if(account.user_id===activeProfile.user_id){await logout();return;}
    }else if(op==='toggle')await api('toggle-account',{user_id:account.user_id,enabled:!account.enabled});
    else if(op==='delete'){if(!confirm(`确认删除账户 ${account.username}？`))return;await api('delete-account',{user_id:account.user_id});}
    await renderAccounts();
  }catch(e){alert(e.message);}finally{button.disabled=false;}
}
document.getElementById('loginBtn').addEventListener('click',login);
document.getElementById('loginPassword').addEventListener('keydown',event=>{if(event.key==='Enter')login();});
document.getElementById('logoutBtn').addEventListener('click',()=>logout().catch(()=>localLogout()));
document.getElementById('exportScreenshotBtn').addEventListener('click',exportScreenshot);
document.getElementById('accountToggleBtn').addEventListener('click',async()=>{if(!isAdminAccount())return;document.getElementById('accountPanel').classList.toggle('hidden');try{await renderAccounts();}catch(e){alert(e.message);}});
document.getElementById('addAccountBtn').addEventListener('click',addAccount);
document.getElementById('accountRows').addEventListener('click',handleAccountAction);
document.getElementById('resetHourSharesBtn').addEventListener('click',()=>resetHourShares(true));
document.querySelectorAll('input[data-key]').forEach(el=>el.addEventListener('input',render));
document.querySelectorAll('select[data-key]').forEach(el=>el.addEventListener('change',()=>{if(el.dataset.key==='province')applyProvinceDefaults();render();}));
// Remove the legacy plaintext account cache on this origin during migration.
localStorage.removeItem('ev-calc-accounts');sessionStorage.removeItem('ev-calc-current-user');
try{session=JSON.parse(sessionStorage.getItem(sessionKey)||'null');}catch{saveSession(null);}
setAuthVisible(false);exportReady(false);
if(session)startSession().catch(error=>{localLogout();document.getElementById('loginError').textContent=error.message;});
if(!window.SUWEN_SETTINGS?.apiUrl)document.getElementById('loginError').textContent='账号服务尚未配置，请联系管理员完成部署';
