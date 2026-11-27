// Approved one-page cost and sensitivity layout. Display-only: all results come from the authenticated server report.
(()=>{const button=document.getElementById('exportPptBtn');button.addEventListener('click',async()=>{button.disabled=true;try{
if(typeof PptxGenJS==='undefined')throw new Error('PPT组件未加载');if(!serverReport)throw new Error('请先等待测算完成');
const report=serverReport,r=report.result,x=r.x,y=r.rows[0],n=(v,d=1)=>Number.isFinite(v)?v.toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d}):'--';
const province=document.querySelector('select[data-key="province"] option:checked').textContent;
const ppt=new PptxGenJS();ppt.layout='LAYOUT_WIDE';ppt.author='光储充场站投资测算工具';ppt.title=province+'场站投资测算看板';
const s=ppt.addSlide();s.background={color:'F3F5F7'};
const ink='#14263D',muted='#738297',orange='#F3702B';
let compact=false;
const color=value=>value.replace('#','');
function rect(x,y,w,h,fill='#FFFFFF',stroke='#E1E7ED',round=true){if(compact){y=214+(y-214)*.86;h*=.86;}s.addShape(round?ppt.ShapeType.roundRect:ppt.ShapeType.rect,{x:x/120,y:y/120,w:w/120,h:h/120,rectRadius:.04,radius:.04,line:{color:color(stroke),width:.5},fill:{color:color(fill)}});}
function text(v,x,y,w,h,size=17,fill=ink,bold=false,align='left'){if(compact){y=214+(y-214)*.86;h*=.86;}s.addText(String(v),{x:x/120,y:y/120,w:w/120,h:h/120,fontFace:'Microsoft YaHei',fontSize:size*.75,color:color(fill),bold,align,margin:0,breakLine:false,fit:'shrink',valign:'mid'});}
function curve(points,fill){for(let j=1;j<points.length;j++){const [x1,y1]=points[j-1],[x2,y2]=points[j];s.addShape(ppt.ShapeType.line,{x:(gx+x1)/120,y:(gy+Math.min(y1,y2))/120,w:Math.max(x2-x1,.0001)/120,h:Math.abs(y2-y1)/120,flipV:y2<y1,line:{color:color(fill),width:1.1,beginArrowType:'none',endArrowType:'none'}});}}
function rows(items,x,y,w,gap=28,size=16){items.forEach(([a,b,red],i)=>{text(a,x,y+i*gap,w*.45,gap-3,size,red?'#D53434':muted);text(b,x+w*.45,y+i*gap,w*.55,gap-3,size,red?'#D53434':ink,true,'right');});}
rect(0,0,1600,9,orange,orange,false);text('光储充 · 场站投资测算',38,27,900,45,30,ink,true);text(province+' | '+new Date().toLocaleDateString('zh-CN')+' | 首年口径',1050,37,510,24,16,muted,false,'right');
const metrics=[['静态回本周期',n(r.payback,2)+' 年'],['首年净现金流',n(y.net)+' 万元'],['总建设成本',n(r.costs.total)+' 万元'],['首年光储增效',n(y.pvGain+y.storageGain)+' 万元'],['品牌年收入',n(x.brandIncome)+' 万元']];
metrics.forEach(([a,b],i)=>{const xx=38+i*308;rect(xx,92,292,105);if(i===4){
 text(a,xx+14,105,132,22,13,muted);text(b,xx+14,134,132,31,23,ink,true);
 text('首年土地成本',xx+150,105,132,22,13,muted);text(n(y.landCost)+' 万元',xx+150,134,132,31,23,ink,true);
 text('品牌收入覆盖率',xx+18,178,130,16,12,muted);text(y.landCost>0?n(x.brandIncome/y.landCost*100)+'%':'不适用（土地为0）',xx+143,178,130,16,12,y.landCost>0?'#138C70':muted,true,'right');
}else{text(a,xx+18,105,260,26,17,muted);text(b,xx+18,140,265,38,27,i===0?orange:ink,true);}});
compact=true;
rect(38,214,795,435);text('建设成本全项拆解',60,230,560,30,22,ink,true);text('金额：万元',650,236,158,22,14,muted,false,'right');
const costData=[
 ['基础设施',n(x.siteArea,0)+' ㎡','',n(r.costs.civil)],
 ['箱变',n(x.transformerKva,0)+' kVA','450 元/kVA',n(r.costs.transformer)],
 ['外线工程','按场地配置输入','—',n(r.costs.grid)],
 ['光伏系统',n(x.pvKw,0)+' kW','1,910 元/kW',n(r.costs.pv)],
 ['钢结构',n(x.pvArea,0)+' ㎡','566 元/㎡',n(r.costs.steel)],
 ['储能系统',`${x.batteryUnits}台 × ${x.batteryKwh}kWh`,'680 元/kWh',n(r.costs.battery)],
 ['充电枪',`${x.fastGuns+x.slowGuns} 把`,'1.9 万元/把',n(r.costs.guns)],
 ['休息区',n(x.loungeArea,0)+' ㎡','5,500 元/㎡',n(r.costs.lounge)],
 ['其他成本','按场地配置输入','—',n(r.costs.other)],
 ['总建设成本','','',n(r.costs.total)]
];
const values=[['项目','配置 / 计价基数','投资金额'],...costData.map(([item,base,unit,amount])=>[item,base,amount])];
s.addTable(values.map((row,ri)=>row.map((value,ci)=>({text:String(value),options:{fill:ri===0?'F3F6F9':ri===10?'FFF2E9':'FFFFFF',color:ri===0?'738297':ri===10?'F3702B':'14263D',bold:ri===0||ri===10||ci===2,align:ci===2?'right':'left',fontSize:ri===10?13.5:12}}))),{x:60/120,y:265/120,w:750/120,colW:[180,355,215].map(v=>v/120),rowH:27.5/120,fontFace:'Microsoft YaHei',fontSize:12,margin:[1,5,1,5],border:{type:'solid',pt:.3,color:'E8EDF2'},autoPage:false});
rect(850,214,712,240);text('场站配置与市场假设',872,230,610,30,21,ink,true);
rows([['场地面积 / 首年租金',`${n(x.siteArea,0)} ㎡ / ${n(y.landCost)} 万元`],['变压器 / 光伏',`${n(x.transformerKva,0)} kVA / ${n(x.pvArea,0)} ㎡ · ${x.pvKw} kW`],['储能 / 休息区',`${x.batteryUnits}台 × ${x.batteryKwh}kWh / ${x.loungeArea}㎡`],['单枪电量 / 枪数 / 服务费',`${x.singleGunDailyKwh} kWh / ${x.fastGuns+x.slowGuns}把 / ${n(x.serviceFee,2)}元`,true],['场站日充电量',`${n((x.fastGuns+x.slowGuns)*x.singleGunDailyKwh,0)} kWh`],['场站年充电量',`${n(y.annualLoad/10000,2)} 万kWh`],['车生活年收入',`${n(x.carLifeIncome)} 万元`]],872,270,666,23,15);
rect(850,470,712,220);text('光储增效与运营成本',872,486,610,30,21,ink,true);
rows([['光伏年发电 / 日均发电',`${n(y.annualPv/10000,2)} 万kWh / ${n(y.annualPv/365,0)} kWh`],['光伏年增效 / 每度收益',`${n(y.pvGain)} 万元 / ${n(y.pvGain*10000/y.annualLoad,3)} 元`],['储能年转移电量',`${n(y.shiftedKwh/10000,2)} 万kWh`],['储能年增效 / 每度收益',`${n(y.storageGain)} 万元 / ${n(y.storageGain*10000/y.annualLoad,3)} 元`],['年运维成本 / 首年土地成本',`${n(y.ops)} 万元 / ${n(y.landCost)} 万元`]],872,524,666,25,16);
text('每度收益均按场站全年充电量折算',872,666,660,18,12,muted);
compact=false;
rect(38,600,795,248);text('24小时充电比例与光储增效',60,612,600,25,18,ink,true);
rect(850,642,712,206);text('敏感性分析',872,654,430,25,18,ink,true);
const gx=92,gy=667,gw=365,gh=100,types=priceTypeMatrix(x)[0];
for(let h=0;h<24;h++){const col={peak:'#FFF0E5',valley:'#EAF6F1',flat:'#F0F4F8'}[types[h]]||'#F0F4F8';rect(gx+h*gw/24,gy,gw/24,gh,col,col,false);}
const max=Math.max(...report.pptScenarios.flatMap(a=>a.shares))*1.08,colors=['#F3702B','#397AAB','#16977C','#9266B1'];
for(let i=0;i<4;i++){const a=report.pptScenarios[i],v=a.shares,slopes=v.slice(1).map((n,j)=>n-v[j]),t=v.map((_,j)=>j===0?slopes[0]:j===23?slopes[22]:slopes[j-1]*slopes[j]<=0?0:2*slopes[j-1]*slopes[j]/(slopes[j-1]+slopes[j]));const pts=[[gw/48,gh-v[0]/max*gh]];for(let h=0;h<23;h++)for(let k=1;k<=6;k++){const z=k/6,z2=z*z,z3=z2*z;const value=(2*z3-3*z2+1)*v[h]+(z3-2*z2+z)*t[h]+(-2*z3+3*z2)*v[h+1]+(z3-z2)*t[h+1];pts.push([(h+z+.5)*gw/24,gh-value/max*gh]);}curve(pts,colors[i]);}
[0,6,12,18,24].forEach(h=>text(String(h).padStart(2,'0'),gx+h*gw/24-16,768,44,18,10,muted));
report.pptScenarios.forEach((a,i)=>{text('━ '+a.name,100+(i%2)*160,794+Math.floor(i/2)*22,145,19,13,colors[i]);});
text('每小时占全天电量 · 底色为1月峰平谷时段',60,639,730,18,11,muted);
text('情景',490,657,65,22,12,muted);text('光伏',553,657,70,22,12,muted,false,'right');text('储能',634,657,80,22,12,muted,false,'right');text('合计',727,657,80,22,12,muted,false,'right');
report.pptScenarios.forEach((a,i)=>{const yy=688+i*29;if(i===0)rect(486,yy,326,27,'#FFF2E9','#FFF2E9',false);text(a.name,490,yy,65,24,14,colors[i],true);text(n(a.pv),553,yy,70,24,14,ink,true,'right');text(n(a.storage),634,yy,80,24,14,ink,true,'right');text(n(a.pv+a.storage),727,yy,80,24,14,i===0?orange:ink,true,'right');});
text('金额：万元/年；总充电量及配置不变',490,813,320,20,11,muted);
const maxTick=Math.ceil(max*100/5)*5;
for(const tick of [0,5,10,15])if(tick<max*100)text(tick+'%',44,gy+gh-tick/100/max*gh-8,52,18,10,muted);
text('变量',872,686,176,19,12,muted);text('变化',1045,686,135,19,12,muted);text('回本年限',1184,686,135,19,12,muted,false,'right');text('首年净现金流',1332,686,204,19,12,muted,false,'right');
const sensitivityLabels=[['单枪日充电量','−10%'],['单枪日充电量','+10%'],['服务费','−0.10元'],['服务费','+0.10元'],['储能台数','−2台'],['储能台数','+2台'],['峰谷价差','扩大20%'],['土地首年成本','+20万元']];
report.sensitivity.forEach((a,i)=>{const yy=708+i*16.5;rect(868,yy,672,16.5,i%2?'#FFFFFF':'#F5F7FA','#F5F7FA',false);text(sensitivityLabels[i][0],872,yy,176,16,12,ink);text(sensitivityLabels[i][1],1045,yy,135,16,12,muted);if(!a){text('未测算',1184,yy,135,16,12,muted,false,'right');text('未测算',1332,yy,204,16,12,muted,false,'right');return;}text(a.payback===null?'未回本':n(a.payback,2)+' 年',1184,yy,135,16,12,ink,true,'right');text(n(a.rows[0].net)+' 万元',1332,yy,204,16,12,a.rows[0].net>=y.net?'#138C70':'#B04D42',true,'right');});
text('品牌收入按第2–7年计入；敏感性分析每次仅改变一个变量。建设成本不含年度租金、运维成本。',42,863,1510,21,13,muted);

await ppt.writeFile({fileName:'场站投资测算看板-'+province+'.pptx'});
}catch(error){console.error(error);alert('导出PPT失败：'+(error.message||error));}finally{button.disabled=!serverReport;}});})();
