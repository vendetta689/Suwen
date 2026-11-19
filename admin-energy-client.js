(()=>{
const dialog=document.getElementById('adminEnergyDialog'),frame=document.getElementById('adminEnergyFrame'),message=document.getElementById('adminEnergyStatus');let data=null,sequence=0;
const clear=()=>{sequence++;data=null;frame.contentWindow?.postMessage({type:'suwen-energy-clear'},location.origin);if(dialog.open)dialog.close();};
document.addEventListener('suwen-session',clear);
function send(){if(data&&isAdminAccount())frame.contentWindow.postMessage({type:'suwen-energy-data',data},location.origin);}
frame.addEventListener('load',send);
document.getElementById('adminEnergyClose').onclick=()=>dialog.close();
document.getElementById('adminEnergyOpen').onclick=async()=>{
 if(!isAdminAccount())return;const seq=++sequence;data=null;frame.contentWindow.postMessage({type:'suwen-energy-clear'},location.origin);dialog.showModal();message.textContent='正在读取当前参数并进行分时测算…';
 try{const result=await api('admin-energy',{input:getInputs()});if(seq!==sequence||!isAdminAccount())return;data=result;send();message.textContent='按当前页面参数计算 · 仅管理员可访问';}catch(error){if(seq===sequence)message.textContent=error.message;}
};
})();
