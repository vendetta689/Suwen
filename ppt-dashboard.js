(() => {
  const button = document.getElementById('exportPptBtn');
  const num = (v, d = 1) => Number.isFinite(v) ? v.toLocaleString('zh-CN', {minimumFractionDigits:d, maximumFractionDigits:d}) : '--';
  const c = {ink:'12233A', muted:'738092', orange:'F46B25', green:'138C70', blue:'397A9F', bg:'F3F5F7', white:'FFFFFF', line:'E0E6EC'};
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      if (typeof PptxGenJS === 'undefined') throw new Error('PPT组件未加载，请检查 pptxgen.bundle.js 是否与网页放在同一目录。');
      const r=calculate(), x=r.x, y=r.rows[0];
      const province=document.querySelector('select[data-key="province"] option:checked').textContent;
      const ppt=new PptxGenJS(); ppt.layout='LAYOUT_WIDE'; ppt.author='光储充场站投资测算工具'; ppt.title=`${province}场站投资测算看板`;
      const s=ppt.addSlide(); s.background={color:c.bg};
      const text=(t,x,y,w,h,size=10,color=c.ink,extra={})=>s.addText(String(t),{x,y,w,h,fontFace:'Microsoft YaHei',fontSize:size,color,margin:0,fit:'shrink',...extra});
      const box=(x,y,w,h)=>s.addShape(ppt.ShapeType.roundRect,{x,y,w,h,radius:0.06,rectRadius:0.06,line:{color:c.line,width:0.5},fill:{color:c.white}});
      const row=(label,value,x,y,w)=>{text(label,x,y,w*0.48,0.2,9,c.muted);text(value,x+w*0.48,y,w*0.52,0.2,9,c.ink,{bold:true,align:'right'});};
      const title=(label,x,y)=>text(label,x,y,4,0.25,12,c.ink,{bold:true});
      s.addShape(ppt.ShapeType.rect,{x:0,y:0,w:13.333,h:0.09,line:{color:c.orange},fill:{color:c.orange}});
      text('光储充 · 场站投资测算',0.32,0.23,7,0.35,20,c.ink,{bold:true});
      text(`${province}  |  ${new Date().toLocaleDateString('zh-CN')}  |  首年口径`,8.0,0.31,5,0.2,9,c.muted,{align:'right'});
      const kpis=[['静态回本周期',r.payback ? `${num(r.payback,2)} 年`:'未回本'],['首年净现金流',`${num(y.net)} 万元`],['总建设成本',`${num(r.costs.total)} 万元`],['首年光储增效',`${num(y.pvGain+y.storageGain)} 万元`],['品牌年收入',`${num(x.brandIncome)} 万元`]];
      kpis.forEach(([label,value],i)=>{const xx=0.32+i*2.55;box(xx,0.79,2.42,0.92);text(label,xx+0.14,0.94,2.14,0.18,9,c.muted);text(value,xx+0.14,1.21,2.14,0.32,17,i===0?c.orange:c.ink,{bold:true});});
      box(0.32,1.88,4.1,2.14); title('场站配置与成本',0.52,2.07);
      const configurationGroups=[
        {name:'场地',height:.25,lines:[`面积 ${num(x.siteArea,0)} ㎡    首年租金 ${num(y.landCost)} 万元`]},
        {name:'设备',height:.44,lines:[`变压器 ${num(x.transformerKva,0)} kVA`, `光伏 ${num(x.pvArea,0)} ㎡ / ${num(x.pvKw,1)} kW`, `储能 ${num(x.batteryUnits,0)} 台 × ${num(x.batteryKwh,0)} kWh/台`]},
        {name:'休息区及车生活',height:.25,lines:[`休息区 ${num(x.loungeArea,0)} ㎡    车生活 ${num(x.carLifeIncome)} 万元/年`]},
        {name:'外线及其他成本',height:.25,lines:[`外线 ${num(r.costs.grid)} 万元    其他 ${num(r.costs.other)} 万元`]},
        {name:'年运维成本',height:.25,lines:[`${num(y.ops)} 万元/年`]}
      ];
      let configurationY=2.42;
      configurationGroups.forEach(group=>{
        text(group.name,.52,configurationY+.015,1.05,.19,7.5,'71849A',{bold:true});
        group.lines.forEach((value,i)=>text(value,1.62,configurationY+.01+i*.137,2.59,.16,7.7,'193F69',{bold:true}));
        s.addShape(ppt.ShapeType.line,{x:.52,y:configurationY+group.height,w:3.7,h:0,line:{color:'E5ECF3',width:.4}});
        configurationY+=group.height+.025;
      });
      const guns=x.fastGuns+x.slowGuns, daily=guns*x.singleGunDailyKwh;
      box(4.56,1.88,3.62,2.14); title('市场假设',4.76,2.07);
      row('单枪日充电量',`${num(x.singleGunDailyKwh,0)} kWh/枪`,4.76,2.45,3.22);
      row('充电枪数',`${num(guns,0)} 把（快${num(x.fastGuns,0)} / 慢${num(x.slowGuns,0)}）`,4.76,2.76,3.22);
      row('服务费',`${num(x.serviceFee,2)} 元/kWh`,4.76,3.07,3.22);
      row('场站日充电量',`${num(daily,0)} kWh`,4.76,3.38,3.22);
      row('场站年充电量',`${num(y.annualLoad/10000,2)} 万kWh`,4.76,3.69,3.22);
      box(8.32,1.88,4.69,2.14); title('光伏与储能增效',8.52,2.07);
      row('光伏年发电 / 日均',`${num(y.annualPv/10000,2)} 万kWh / ${num(y.annualPv/365,0)} kWh`,8.52,2.43,4.29);
      row('光伏年增效 / 每度',`${num(y.pvGain)} 万元 / ${num(y.annualLoad?y.pvGain*10000/y.annualLoad:0,3)} 元`,8.52,2.72,4.29);
      row('储能年转移电量',`${num(y.shiftedKwh/10000,2)} 万kWh`,8.52,3.01,4.29);
      row('储能年增效 / 每度',`${num(y.storageGain)} 万元 / ${num(y.annualLoad?y.storageGain*10000/y.annualLoad:0,3)} 元`,8.52,3.30,4.29);
      text('每度收益按场站全年充电量折算',8.52,3.65,4.1,0.18,8,c.muted);
      const current=hourShares(x);
      const weighted=fn=>{const a=current.map((v,i)=>v*fn(i)), sum=a.reduce((p,v)=>p+v,0);return a.map(v=>sum?v/sum:1/24);};
      const shapes=[['当前',current],['均匀',Array(24).fill(1/24)],['日间',weighted(i=>i>=8&&i<18?2:0.5)],['夜间',weighted(i=>i<8||i>=22?2:0.5)]];
      const scenarios=serverReport.pptScenarios;
      box(0.32,4.18,12.69,2.78); title('24小时充电分布与光储收益',0.52,4.38);
      text('示例情景：总充电量及其他参数保持不变',0.52,4.68,7,0.18,8,c.muted);
      const types=priceTypeMatrix(x), monthTypes=types[0];
      const typeLabels={sharp:'尖峰',peak:'峰',flat:'平',valley:'谷',deepValley:'深谷'};
      const bandColors={sharp:'D76778',peak:'F39D70',flat:'A6B6CD',valley:'83C9B5',deepValley:'88BFD8'};
      const activeTypes=['sharp','peak','flat','valley','deepValley'].filter(type=>types.some(month=>month.includes(type)));
      const periodShares=shares=>activeTypes.map(type=>{
        const share=types.reduce((sum,month,m)=>sum+month.reduce((v,t,h)=>v+(t===type?shares[h]:0),0)*MONTH_DAYS[m],0)/MONTH_DAYS.reduce((a,b)=>a+b,0);
        return `${typeLabels[type]} ${num(share*100)}%`;
      }).join('  ');
      const gx=.81,gy=5.19,gw=3.85,gh=1.00;
      const maxShare=Math.max(...scenarios.flatMap(a=>a.shares))*100;
      const maxY=Math.max(10,Math.ceil(maxShare/5)*5);
      const line=(x1,y1,x2,y2,color,width=1)=>s.addShape(ppt.ShapeType.line,{x:x1,y:Math.min(y1,y2),w:Math.max(x2-x1,.0001),h:Math.abs(y2-y1),flipV:y2<y1,line:{color,width,beginArrowType:'none',endArrowType:'none'}});
      let start=0;
      while(start<24){let end=start+1;while(end<24&&monthTypes[end]===monthTypes[start])end++;const type=monthTypes[start];s.addShape(ppt.ShapeType.rect,{x:gx+start*gw/24,y:gy,w:(end-start)*gw/24,h:gh,line:{transparency:100},fill:{color:bandColors[type]||'A6B6CD',transparency:89}});if(end-start>=2)text(typeLabels[type]||type,gx+start*gw/24,gy-.18,(end-start)*gw/24,.15,7,c.muted,{align:'center'});start=end;}
      for(let tick=0;tick<=maxY;tick+=5){const yy=gy+gh-tick/maxY*gh;line(gx,yy,gx+gw,yy,'E3E9EF',.4);text(`${tick}%`,gx-.32,yy-.05,.27,.12,6,c.muted,{align:'right'});}
      // Monotone cubic interpolation preserves hourly values without negative overshoot.
      const curveColors=[c.orange,c.blue,c.green,'9266B1'];
      scenarios.forEach((a,index)=>{
        const v=a.shares.map(n=>n*100), slopes=v.slice(1).map((n,i)=>n-v[i]);
        const tangent=v.map((_,i)=>i===0?slopes[0]:i===23?slopes[22]:slopes[i-1]*slopes[i]<=0?0:2*slopes[i-1]*slopes[i]/(slopes[i-1]+slopes[i]));
        let previous=[gx+.5*gw/24,gy+gh-v[0]/maxY*gh];
        for(let h=0;h<23;h++)for(let step=1;step<=8;step++){
          const t=step/8,t2=t*t,t3=t2*t;
          const value=(2*t3-3*t2+1)*v[h]+(t3-2*t2+t)*tangent[h]+(-2*t3+3*t2)*v[h+1]+(t3-t2)*tangent[h+1];
          const next=[gx+(h+t+.5)*gw/24,gy+gh-value/maxY*gh];line(...previous,...next,curveColors[index],index===0?1.5:1.15);previous=next;
        }
      });
      [0,6,12,18,24].forEach(h=>text(String(h).padStart(2,'0'),gx+h*gw/24-.12,gy+gh+.04,.3,.16,7,c.muted,{align:'center'}));
      scenarios.forEach((a,i)=>{const xx=gx+i*.98;line(xx,6.53,xx+.17,6.53,curveColors[i],1.5);text(a.name,xx+.21,6.45,.63,.17,8,c.muted);});
      text('底色：1月电价时段；曲线：各小时占全天电量。',.62,6.73,4.1,.15,7,c.muted);
      text('情景及各时段负荷占比（全年加权）',5.12,4.96,4.5,.2,9,c.muted,{bold:true});text('光伏',9.65,4.96,.7,.2,9,c.muted,{align:'right'});text('储能',10.5,4.96,.8,.2,9,c.muted,{align:'right'});text('合计',11.6,4.96,1,.2,9,c.muted,{align:'right'});
      scenarios.forEach((a,i)=>{const yy=5.29+i*.30;s.addShape(ppt.ShapeType.roundRect,{x:5.05,y:yy-.035,w:7.66,h:.27,radius:.03,rectRadius:.03,line:{color:i===0?'FBE4D8':'EDF0F3',width:.4},fill:{color:i===0?'FFF4ED':'F8FAFC'}});text(a.name,5.17,yy,.45,.18,8,c.ink,{bold:true});text(periodShares(a.shares),5.77,yy,3.7,.18,activeTypes.length>3?6.5:8,c.muted);text(num(a.pv),9.65,yy,.7,.18,9,c.ink,{align:'right'});text(num(a.storage),10.5,yy,.8,.18,9,c.ink,{align:'right'});text(num(a.pv+a.storage),11.6,yy,1,.18,9,i===0?c.orange:c.ink,{align:'right',bold:true});});
      text('金额：万元/年。光伏受白天消纳影响；储能受放电窗口负荷和容量约束。',5.16,6.65,7.4,.25,7,c.muted);
      text('品牌收入为输入年额，实际计入年份以测算模型为准。',0.34,7.12,12.5,0.16,8,c.muted);
      await ppt.writeFile({fileName:`场站投资测算看板-${province}.pptx`});
    } catch(error) { console.error(error); alert(`导出PPT失败：${error.message || error}`); }
    finally { button.disabled=false; }
  });
})();
