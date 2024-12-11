document.addEventListener('DOMContentLoaded',()=>{

  const modes = {
    weather:{name:"天気モード",desc:"天気によって売上が増減します"},
    event:{name:"経済イベントモード",desc:"好景気/不景気など経済変動が起こる"},
    forex:{name:"為替モード",desc:"外国産材料が為替影響でコスト変動"},
    inflation:{name:"インフレモード",desc:"高価格商品有利"},
    tax:{name:"税金モード",desc:"利益に応じて税金が発生"},
    staff:{name:"スタッフモード",desc:"スタッフ雇用で特定条件で+皿、給与コスト"},
    ad:{name:"広告モード",desc:"広告で+皿、有料"},
    insurance:{name:"保険モード",desc:"悪いイベント軽減用保険"},
    materialCalc:{name:"材料算定モード",desc:"タグでコスト増減(野菜高騰,輸入規制等)"}
  };

  const tagInfo = {
    "野菜":"野菜タグは野菜高騰や雨続きで品質低下イベントで売上/コスト影響。",
    "外国産":"外国産は為替や輸入規制でコスト上昇。",
    "米":"米タグで米不作時+2000円コスト。",
    "はちみつ":"はちみつタグでブーム時+30皿。",
    "鶏肉":"鶏肉タグで鳥インフル時-50皿。"
  };

  const ingredients = [
    {name:"お米",price:4000,tags:["米"],must:true},
    {name:"カレールー(国産)",price:1000,tags:[],must:true},
    {name:"カレールー(外国産)",price:2000,tags:["外国産"],must:false},
    {name:"牛肉(国産)",price:3000,tags:[],must:false},
    {name:"牛肉(外国産)",price:2500,tags:["外国産"],must:false},
    {name:"鶏肉",price:1500,tags:["鶏肉"],must:false},
    {name:"豚肉",price:2000,tags:[],must:false},
    {name:"ほたて",price:1500,tags:[],must:false},
    {name:"なす",price:500,tags:["野菜"],must:false},
    {name:"トマト",price:500,tags:["野菜"],must:false},
    {name:"まいたけ",price:500,tags:["野菜"],must:false},
    {name:"たまねぎ",price:1000,tags:["野菜"],must:false},
    {name:"人参",price:1000,tags:["野菜"],must:false},
    {name:"じゃがいも",price:1000,tags:["野菜"],must:false},
    {name:"はちみつ",price:500,tags:["はちみつ"],must:false},
    {name:"ヨーグルト",price:500,tags:[],must:false},
    {name:"エビ",price:2000,tags:["外国産"],must:false},
    {name:"ほうれん草",price:500,tags:["野菜"],must:false},
    {name:"しょうが",price:500,tags:["野菜"],must:false},
    {name:"ピーマン",price:500,tags:["野菜"],must:false}
  ];

  const weatherEvents = [
    {roll:[2], name:"台風", desc:"休業(売上0)", multiplier:0},
    {roll:[3], name:"大雨", desc:"売上半減", multiplier:0.5},
    {roll:[4], name:"雨", desc:"少し来客減", multiplier:0.7},
    {roll:[5,6], name:"曇り", desc:"やや来客減", multiplier:0.9},
    {roll:[7,8,9,10], name:"晴れ", desc:"普通", multiplier:1.0},
    {roll:[11,12], name:"快晴", desc:"来客増", multiplier:1.2}
  ];

  const economicEvents = [
    {name:"なし", desc:"特に変化なし",
      effect:(price,tags,modes,chosenM,paymode)=>({})},
    {name:"不景気", desc:"500円以下+10皿/500円超-10皿",
      effect:(p)=>{if(p<=500)return{salesMod:10};else return{salesMod:-10};}},
    {name:"ガソリン高",desc:"材料費+1000円",effect:()=>({costMod:1000})},
    {name:"大雪発生",desc:"材料費+1000円",effect:()=>({costMod:1000})},
    {name:"ハッカー",desc:"キャッシュレス-20皿",effect:(p,t,m,c,pay)=>{if(pay==='cashless')return{salesMod:-20};return{};}},
    {name:"鳥インフルエンザ",desc:"鶏肉使用-50皿",effect:(p,t,m,c)=>{let chk=c.some(x=>x.tags.includes('鶏肉'));if(chk)return{salesMod:-50};return{};}},
    {name:"はちみつブーム",desc:"はちみつ使用+30皿",effect:(p,t,m,c)=>{let h=c.some(x=>x.tags.includes('はちみつ'));if(h)return{salesMod:30};return{};}},
    {name:"米不作",desc:"米使用+2000円材料費",effect:(p,t,m,c)=>{let r=c.some(x=>x.tags.includes('米'));if(r)return{costMod:2000};return{};}},
    {name:"戦争",desc:"-10皿",effect:()=>({salesMod:-10})},
    {name:"インフレ",desc:"500円超+10皿",effect:(p)=>{if(p>500)return{salesMod:10};return{};}},
    {name:"デフレ",desc:"500円以下+20皿/500円超-20皿",effect:(p)=>{if(p<=500)return{salesMod:20};else return{salesMod:-20};}},
    {name:"家賃上昇",desc:"家賃+2000円",effect:()=>({rentMod:2000})},
    {name:"玉ねぎ不作",desc:"玉ねぎ使用+2000円",effect:(p,t,m,c)=>{
      let o=c.some(x=>x.name==="たまねぎ");
      if(o)return{costMod:2000};return{};
    }},
    {name:"ストライキ",desc:"-50皿",effect:()=>({salesMod:-50})},
    {name:"好景気",desc:"+30皿",effect:()=>({salesMod:30})},
    {name:"大統領交代",desc:"-10皿",effect:()=>({salesMod:-10})},
    {name:"金利上昇",desc:"利子+1000円",effect:()=>({interestMod:1000})},
    {name:"増税",desc:"家賃+500、材料費+500",effect:()=>({rentMod:500,costMod:500})},
    {name:"消費税減税",desc:"+10皿",effect:()=>({salesMod:10})},
    {name:"パンデミック",desc:"-30皿",effect:()=>({salesMod:-30})},
    {name:"輸入規制強化",desc:"材料費+2000円",effect:()=>({costMod:2000})},
    {name:"SNSでのバズり",desc:"+20皿",effect:()=>({salesMod:20})},
    {name:"エネルギー価格下落",desc:"材料費-1000円",effect:()=>({costMod:-1000})},
    {name:"農産物豊作",desc:"野菜使用で+20皿",effect:(p,t,m,c)=>{
      let veg=c.some(x=>x.tags.includes('野菜'));
      if(veg)return{salesMod:20};return{};
    }},
    {name:"ライバル店閉店",desc:"+10皿",effect:()=>({salesMod:10})}
  ];

  const modeSelectionArea=document.getElementById('mode-selection-area');
  const modeExplanationArea=document.getElementById('mode-explanation-area');
  const modeCheckEls=document.querySelectorAll('.modeCheck');
  const confirmModesBtn=document.getElementById('confirmModesBtn');
  const modeExplanationList=document.getElementById('modeExplanationList');
  const nextModeExpBtn=document.getElementById('nextModeExpBtn');
  const startGameBtn=document.getElementById('startGameBtn');
  const app=document.getElementById('app');
  const selectedModesTitle=document.getElementById('selectedModesTitle');

  const forexInfo=document.getElementById('forexInfo');
  const inflationInfo=document.getElementById('inflationInfo');
  const taxInfo=document.getElementById('taxInfo');
  const interestInfo=document.getElementById('interestInfo');

  const decideWeatherBtn=document.getElementById('decideWeatherBtn');
  const countdownArea=document.getElementById('countdownArea');

  const weatherDisplay=document.getElementById('weatherDisplay');
  const eventDisplay=document.getElementById('eventDisplay');
  const digitalButtons=document.getElementById('digitalButtons');

  const priceSelect=document.getElementById('priceSelect');
  const materialsArea=document.getElementById('materials-area');
  const ingredientTotalEl=document.getElementById('ingredient-total');
  const ingredientNotice=document.getElementById('ingredientNotice');

  const staffSection=document.getElementById('staffSection');
  const staffSelect=document.getElementById('staffSelect');
  const adSection=document.getElementById('adSection');
  const adSelect=document.getElementById('adSelect');
  const snsAdArea=document.getElementById('snsAdArea');
  const snsAdCostSelect=document.getElementById('snsAdCost');
  const insuranceSection=document.getElementById('insuranceSection');
  const insuranceSelect=document.getElementById('insuranceSelect');

  const nextTurnBtn=document.getElementById('nextTurnBtn');
  const moneyEl=document.getElementById('money');
  const turnCountEl=document.getElementById('turnCount');
  const maxTurnEl=document.getElementById('maxTurn');
  const turnSalesEl=document.getElementById('turnSales');
  const turnRevenueEl=document.getElementById('turnRevenue');
  const turnCostEl=document.getElementById('turnCost');
  const turnProfitEl=document.getElementById('turnProfit');
  const turnMoneyEl=document.getElementById('turnMoney');
  const salesDetailArea=document.getElementById('salesDetailArea');
  const historyEl=document.getElementById('history');

  const costSummary=document.getElementById('costSummary');
  const costDetailsEl=document.getElementById('costDetails');
  const prevCostEl=document.getElementById('prevCost');
  const thisCostEl=document.getElementById('thisCost');

  const tagModal=document.getElementById('tagModal');
  const tagModalClose=document.getElementById('tagModalClose');
  const tagTitle=document.getElementById('tagTitle');
  const tagDesc=document.getElementById('tagDesc');

  const infoModal=document.getElementById('infoModal');
  const infoModalClose=document.getElementById('infoModalClose');
  const infoModalTitle=document.getElementById('infoModalTitle');
  const infoModalText=document.getElementById('infoModalText');

  const paymodeEls=document.querySelectorAll('input[name="paymode"]');

  let selectedModes=[];
  let mode='cash';
  let turn=0;
  let turnCount=5;
  let money=100000;
  let pendingSales=0;
  let showMoney=true;
  let showSalesDetail=false;
  let prevCostValue=null; //ここで一度だけ宣言
  let chosenIngredients=[];
  let currentPlayMode='analog';
  let modeExpIndex=0;
  let turnHistory=[];

  confirmModesBtn.addEventListener('click',()=>{
    selectedModes = Array.from(modeCheckEls).filter(el=>el.checked).map(el=>el.dataset.mode);
    mode = document.querySelector('input[name="paymode"]:checked').value;
    if(selectedModes.includes('digital')) currentPlayMode='digital';
    modeSelectionArea.classList.add('hidden');
    showModeExplanations();
  });

  function showModeExplanations(){
    modeExplanationArea.classList.remove('hidden');
    modeExplanationList.innerHTML="";
    let modesToExplain=selectedModes;
    if(modeExpIndex<modesToExplain.length){
      let m=modesToExplain[modeExpIndex];
      let div=document.createElement('div');
      div.innerHTML=`<h3>${modes[m].name}</h3><p>${modes[m].desc}</p>`;
      modeExplanationList.appendChild(div);
      nextModeExpBtn.classList.remove('hidden');
      startGameBtn.classList.add('hidden');
    } else {
      modeExplanationList.innerHTML="<p>モード確認完了！</p>";
      nextModeExpBtn.classList.add('hidden');
      startGameBtn.classList.remove('hidden');
    }
  }

  nextModeExpBtn.addEventListener('click',()=>{
    modeExpIndex++;
    showModeExplanations();
  });

  startGameBtn.addEventListener('click',()=>{
    modeExplanationArea.classList.add('hidden');
    initGameStart();
  });

  function initGameStart(){
    app.classList.remove('hidden');
    selectedModesTitle.textContent="選択モード:"+selectedModes.map(m=>modes[m].name).join(" / ");
    turn=0;

    forexInfo.style.display=selectedModes.includes('forex')?'block':'none';
    inflationInfo.style.display=selectedModes.includes('inflation')?'block':'none';
    taxInfo.style.display=selectedModes.includes('tax')?'block':'none';

    staffSection.style.display=selectedModes.includes('staff')?'block':'none';
    staffSelect.style.display=selectedModes.includes('staff')?'inline':'none';

    adSection.style.display=selectedModes.includes('ad')?'block':'none';
    adSelect.style.display=selectedModes.includes('ad')?'inline':'none';
    snsAdArea.style.display='none';

    insuranceSection.style.display=selectedModes.includes('insurance')?'block':'none';
    insuranceSelect.style.display=selectedModes.includes('insurance')?'inline':'none';

    digitalButtons.style.display=selectedModes.includes('digital')?'block':'none';

    renderMaterialsList();

    document.querySelectorAll('.eye-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        let span=btn.previousElementSibling;
        if(span.classList.contains('toggle-num')){
          span.style.display=(span.style.display==='none'?'inline':'none');
        }
      });
    });

    nextTurnBtn.disabled=false;
  }

  function renderMaterialsList(){
    materialsArea.innerHTML="";
    ingredients.forEach(ing=>{
      let div=document.createElement('div');
      div.className='material-item';
      let mustAttr=ing.must?'checked disabled':'';
      div.innerHTML=`<label><input type="checkbox" ${mustAttr} data-name="${ing.name}" data-tags="${ing.tags.join(',')}" value="${ing.price}">${ing.name}(${ing.price}円) ${ing.tags.map(t=>`<button type="button" class="tag-btn" data-tag="${t}">${t}</button>`).join('') }</label>`;
      let c=div.querySelector('input[type=checkbox]');
      c.addEventListener('change',updateIngredientTotal);
      div.querySelectorAll('.tag-btn').forEach(tb=>{
        tb.addEventListener('click',()=>showTagInfo(tb.dataset.tag));
      });
      materialsArea.appendChild(div);
    });
    updateIngredientTotal();
  }

  function updateIngredientTotal(){
    let sum=0;
    chosenIngredients=[];
    materialsArea.querySelectorAll('input[type=checkbox]').forEach(ch=>{
      if(ch.checked){
        let t=(ch.dataset.tags)?ch.dataset.tags.split(','):[];
        chosenIngredients.push({name:ch.dataset.name,price:parseInt(ch.value),tags:t});
        sum+=parseInt(ch.value);
      }
    });
    ingredientTotalEl.textContent="合計:"+sum+"円";
    if(sum>10000){
      ingredientTotalEl.style.color='red';
      ingredientNotice.textContent="予算オーバー！10000円以内にしてね";
    } else {
      ingredientTotalEl.style.color='black';
      ingredientNotice.textContent="";
    }
  }

  adSelect.addEventListener('change',()=>{
    if(adSelect.value==='snsAd') snsAdArea.style.display='block'; else snsAdArea.style.display='none';
  });

  function showTagInfo(tag){
    tagTitle.textContent=tag+"タグ";
    tagDesc.textContent=tagInfo[tag]||"特記事項なし";
    tagModal.classList.remove('hidden');
  }

  tagModalClose.addEventListener('click',()=>{tagModal.classList.add('hidden');});
  infoModalClose.addEventListener('click',()=>{infoModal.classList.add('hidden');});

  document.querySelectorAll('.info-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      let t=btn.dataset.type;
      if(t==='weather'){
        infoModalTitle.textContent="天気説明";
        infoModalText.textContent="天気で来客数が変動します。";
      }else if(t==='event'){
        infoModalTitle.textContent="イベント説明";
        infoModalText.textContent="経済イベントで売上や費用が変動します。";
      }
      infoModal.classList.remove('hidden');
    });
  });

  decideWeatherBtn.addEventListener('click',()=>{
    if(currentPlayMode==='digital'){
      digitalGetWeatherEvent((w,e)=>{
        nextTurnProcedure(w,e);
      });
    } else {
      alert("デジタルモードでないため使えません");
    }
  });

  function digitalGetWeatherEvent(callback){
    countdownArea.textContent="3...";
    let c=3;
    let intv=setInterval(()=>{
      c--;
      if(c>0){
        countdownArea.textContent=c+"...";
      }else{
        clearInterval(intv);
        let w=pickRandomWeather();
        countdownArea.textContent="天気は…"+w.name+"("+w.desc+")";
        setTimeout(()=>{
          countdownArea.textContent="3...";
          let c2=3;
          let intv2=setInterval(()=>{
            c2--;
            if(c2>0){
              countdownArea.textContent=c2+"...";
            }else{
              clearInterval(intv2);
              let ev=pickRandomEvent();
              countdownArea.textContent="イベントは…"+ev.name+"("+ev.desc+")";
              setTimeout(()=>{
                countdownArea.textContent="";
                callback(w,ev);
              },1000);
            }
          },1000);
        },1500);
      }
    },1000);
  }

  function pickRandomWeather(){
    let sum=rollDice(2);
    for(let w of weatherEvents){
      if(w.roll.includes(sum)) return w;
    }
    return weatherEvents[4]; //デフォ晴れ
  }

  function pickRandomEvent(){
    let ev= economicEvents[Math.floor(Math.random()*economicEvents.length)];
    return {name:ev.name,desc:ev.desc,raw:ev};
  }

  nextTurnBtn.addEventListener('click',()=>{
    if(currentPlayMode==='analog'){
      let sum=0;chosenIngredients.forEach(m=>sum+=m.price);
      if(sum>10000){alert("予算オーバー修正して");return;}
      alert("アナログモードならカードで天気イベント決めて、その結果をプログラムに入力(省略)");
    }else{
      alert("デジタルモードは天気・イベント決定後に進んでください");
    }
  });

  function rollDice(count){
    let sum=0;
    for(let i=0;i<count;i++){
      sum+=Math.floor(Math.random()*6)+1;
    }
    return sum;
  }

  let turnHistory=[];
  let prevCostValue=null;

  function getPaymentMode(){
    let pm=document.querySelector('input[name="paymode"]:checked');
    return pm?pm.value:'cash';
  }

  function getPrice(){
    return parseInt(priceSelect.value);
  }

  function getActiveModes(){
    return selectedModes;
  }

  function calcBaseSalesByPrice(p){
    if(p==300)return 130;
    if(p==400)return 120;
    if(p==500)return 100;
    if(p==600)return 90;
    if(p==700)return 80;
    return 100;
  }

  function getAllTags(){
    let tags=[];
    chosenIngredients.forEach(m=>m.tags.forEach(t=>tags.push(t)));
    return tags;
  }

  function applyEventEffects(eObj,price,cMats,paymode){
    if(!eObj||!eObj.raw)return {};
    return eObj.raw.effect(price,getAllTags(),getActiveModes(),cMats,paymode);
  }

  function nextTurnProcedure(weatherObj,eventObj){
    if(turn>=turnCount){
      endGame();
      return;
    }
    turn++;
    processTurn(weatherObj,eventObj);
  }

  function processTurn(weatherObj,eventObj){
    // 基本費用
    const MATERIAL_COST=10000;
    const RENT=10000;
    const REPAY=10000;
    const INTEREST=1000;
    const OTHER_COST=2000;

    let price=getPrice();
    let paymode=getPaymentMode();

    // cashless入金処理
    if(mode==='cashless'&&turn>1){
      money+=Math.floor(pendingSales*0.95);
      pendingSales=0;
    }

    let matCost=(turn===1)?MATERIAL_COST:0;
    let baseCost=matCost+RENT+REPAY+INTEREST+OTHER_COST;

    // 広告
    let adCost=0,salesModFromAd=0;
    if(selectedModes.includes('ad') && adSelect.value!=='none'){
      let opt=adSelect.options[adSelect.selectedIndex];
      adCost=parseInt(opt.dataset.cost||0);
      if(adSelect.value==='flyer') salesModFromAd=10;
      if(adSelect.value==='posting') salesModFromAd=15;
      if(adSelect.value==='station') salesModFromAd=25;
      if(adSelect.value==='snsAd'){
        let snsc=parseInt(snsAdCostSelect.value||0);
        adCost=snsc;
        salesModFromAd=(snsc/1000)*5;
      }
    }

    // スタッフ給与・効果後で適用
    // 保険費
    let insuranceFee=0;
    if(selectedModes.includes('insurance')&&insuranceSelect.value!=='none'){
      let iopt=insuranceSelect.options[insuranceSelect.selectedIndex];
      insuranceFee=parseInt(iopt.dataset.cost||0);
    }

    // タグコスト
    let tags=getAllTags();
    let foreignCount=tags.filter(t=>t==='外国産').length;
    let vegCount=tags.filter(t=>t==='野菜').length;
    let tagCost=0;
    if(selectedModes.includes('materialCalc')){
      tagCost=foreignCount*500+vegCount*500;
    }

    // イベント適用前にweather
    let sum=0;chosenIngredients.forEach(m=>sum+=m.price);
    if(sum>10000){alert("予算オーバーです");return;}

    let w=weatherObj;
    let baseSales=calcBaseSalesByPrice(price);
    let priceDiff=price-500;
    let priceAdjust=Math.floor(priceDiff/100)*(-10);
    let sales=baseSales+priceAdjust;
    sales=Math.floor(sales*w.multiplier);

    let eventEff=applyEventEffects(eventObj,price,chosenIngredients,paymode);

    if(eventEff.salesMod) sales+=eventEff.salesMod;
    if(salesModFromAd>0) sales+=salesModFromAd;

    //スタッフ
    if(selectedModes.includes('staff')&&staffSelect.value!=='none'){
      if(staffSelect.value==='aya'&&w.name==="晴れ")sales+=5;
      if(staffSelect.value==='satoru'&&salesModFromAd>0)sales+=5;
    }

    if(sales<0)sales=0;
    let revenue=sales*price;

    let cost=baseCost+adCost+insuranceFee+tagCost;

    if(eventEff.costMod) cost+=eventEff.costMod;
    let RENT_NEW=RENT+(eventEff.rentMod||0);
    let INTEREST_NEW=INTEREST+(eventEff.interestMod||0);
    if(eventEff.rentMod) cost+=eventEff.rentMod;
    if(eventEff.interestMod) cost+=eventEff.interestMod;

    //税金
    if(selectedModes.includes('tax')){
      let profit=revenue-cost;
      cost+=(profit>0)?2000:1000;
    }

    if(eventEff.moneyChange) money+=eventEff.moneyChange;

    // final計算
    let profit=revenue-cost;
    if(mode==='cash'){
      money=money-cost+revenue;
    } else {
      money=money-cost;
      pendingSales+=revenue;
    }

    // 結果表示
    turnCountEl.textContent=turn;
    turnSalesEl.textContent=sales;
    turnRevenueEl.textContent=revenue;
    turnCostEl.textContent=cost;
    turnProfitEl.textContent=profit;
    turnMoneyEl.textContent=money;
    moneyEl.textContent=money;

    renderCostDetails(MATERIAL_COST,RENT_NEW,REPAY,INTEREST_NEW,OTHER_COST,adCost,insuranceFee,tagCost,(eventEff.costMod||0),(eventEff.rentMod||0),(eventEff.interestMod||0),profit);
    if(prevCostValue!==null && prevCostValue!==cost) thisCostEl.classList.add('cost-changed'); else thisCostEl.classList.remove('cost-changed');
    prevCostValue=cost;
    thisCostEl.textContent=cost;

    showSalesProcess(sales,price,priceAdjust,w,eventObj,eventEff,salesModFromAd,staffSelect.value,profit);

    recordTurnHistory(turn,w.name,eventObj.name,sales,revenue,money);
    renderHistory();

    if(turn>=turnCount){
      alert("ゲーム終了！最終残金:"+money+"円");
      nextTurnBtn.disabled=true;
    }
  }

  function renderCostDetails(MAT,RENT,REPAY,INTER,OTHER,adC,insC,tagC,cMod,rMod,iMod,profit){
    costDetailsEl.innerHTML="";
    function addCLine(name,base,delta=0){
      let val=base+delta;
      let line=`${name}:${val}円`;
      if(delta>0)line+=` <span class="cost-up">(+${delta})</span>`;
      else if(delta<0)line+=` <span class="cost-changed">(${delta})</span>`;
      costDetailsEl.innerHTML+=`<p>${line}</p>`;
    }

    addCLine("材料費基礎",MAT);
    if(tagC!=0)addCLine("タグコスト",0,tagC);
    addCLine("家賃",10000,(RENT-10000));
    addCLine("返済",REPAY);
    addCLine("利子",1000,(INTER-1000));
    addCLine("諸費用",OTHER);
    if(adC>0) addCLine("広告費",0,adC);
    if(insC>0)addCLine("保険費",0,insC);
    if(cMod) addCLine("イベント追加費",0,cMod);

    if(selectedModes.includes('tax')){
      // 税金(利益>0:2000, else1000)
      let tax=(profit>0)?2000:1000;
      costDetailsEl.innerHTML+=`<p>税金:${tax}円</p>`;
    }
  }

  function showSalesProcess(sales,price,priceAdjust,w,eventObj,eff,salesModFromAd,staffVal,profit){
    salesDetailArea.innerHTML="";
    salesDetailArea.classList.add('show');
    let lines=[];
    lines.push(`基本皿数:100皿`);
    lines.push(`価格差(${price}円→${priceAdjust}皿変動)`);
    lines.push(`天気(${w.name}):×${w.multiplier}`);
    if(eff.salesMod) lines.push(`イベント(${eventObj.name}):${eff.salesMod>0?'+':''}${eff.salesMod}皿`);
    if(salesModFromAd>0) lines.push(`広告:+${salesModFromAd}皿`);
    if(selectedModes.includes('staff')&&staffVal==='aya'&&w.name==="晴れ")lines.push(`スタッフ(アヤ):+5皿(晴れ)`);
    if(selectedModes.includes('staff')&&staffVal==='satoru'&&salesModFromAd>0)lines.push(`スタッフ(サトル):広告+5皿`);
    lines.push(`最終販売数:${sales}皿`);
    lines.push(`売上=販売数×価格=${sales}×${price}円=${sales*price}円`);
    lines.push(`費用計算済、利益=売上-費用=${profit}円`);
    salesDetailArea.innerHTML=lines.join('<br>');
  }

  function recordTurnHistory(turn,weather,event,sales,revenue,moneyEnd){
    turnHistory.push({turn,weather,event,sales,revenue,moneyEnd});
  }

  function renderHistory(){
    historyEl.innerHTML="";
    if(turnHistory.length>0){
      const h2=document.createElement('h2');
      h2.textContent="ターン履歴";
      historyEl.appendChild(h2);

      const table=document.createElement('table');
      const thead=document.createElement('thead');
      const trh=document.createElement('tr');
      ["ターン","天気","イベント","販売数","売上","残金"].forEach(hd=>{
        let th=document.createElement('th');
        th.textContent=hd;
        trh.appendChild(th);
      });
      thead.appendChild(trh);
      table.appendChild(thead);

      const tbody=document.createElement('tbody');
      turnHistory.forEach(h=>{
        let tr=document.createElement('tr');
        [h.turn,h.weather,h.event,h.sales,h.revenue,h.moneyEnd].forEach(val=>{
          let td=document.createElement('td');
          td.textContent=val;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      historyEl.appendChild(table);
    }
  }

  // モード関連
  let selectedModes=[];
  let mode='cash';

  const confirmModesBtn=document.getElementById('confirmModesBtn');
  const modeCheckEls=document.querySelectorAll('.modeCheck');
  const nextModeExpBtn=document.getElementById('nextModeExpBtn');
  const startGameBtn=document.getElementById('startGameBtn');

  // 上部で定義済みなので重複宣言なし
  // 全機能は上で実装済み

});
