document.addEventListener('DOMContentLoaded', ()=>{
  const turnCountEl = document.getElementById('turnCount');
  const maxTurnEl = document.getElementById('maxTurn');
  const weatherDisplay = document.getElementById('weatherDisplay');
  const eventDisplay = document.getElementById('eventDisplay');
  const priceSelect = document.getElementById('priceSelect');
  const moneyEl = document.getElementById('money');
  const turnSalesEl = document.getElementById('turnSales');
  const turnRevenueEl = document.getElementById('turnRevenue');
  const turnCostEl = document.getElementById('turnCost');
  const turnMoneyEl = document.getElementById('turnMoney');
  const staffSelect = document.getElementById('staffSelect');
  const adSelect = document.getElementById('adSelect');
  const snsAdArea = document.getElementById('snsAdArea');
  const snsAdCostInput = document.getElementById('snsAdCost');
  const insuranceSelect = document.getElementById('insuranceSelect');
  const nextTurnBtn = document.getElementById('nextTurnBtn');
  const playModeEls = document.querySelectorAll('input[name="playMode"]');
  const analogInputs = document.getElementById('analogInputs');
  const digitalButtons = document.getElementById('digitalButtons');
  const analogWeatherSelect = document.getElementById('analogWeatherSelect');
  const analogEventSelect = document.getElementById('analogEventSelect');
  const countdownArea = document.getElementById('countdownArea');

  const modeWeather = document.getElementById('modeWeather');
  const modeEvent = document.getElementById('modeEvent');
  const modeForex = document.getElementById('modeForex');
  const modeInflation = document.getElementById('modeInflation');
  const modeTax = document.getElementById('modeTax');
  const modeStaff = document.getElementById('modeStaff');
  const modeAd = document.getElementById('modeAd');
  const modeInsurance = document.getElementById('modeInsurance');

  let turn = 1;
  let maxTurn = 5;
  let money = 100000;

  const baseCost = {
    rent:10000, 
    repay:10000,
    interest:1000, 
    misc:2000, 
    baseMaterial:10000 
  };

  // ラジオで現金orキャッシュレス
  let paymodeEls = document.querySelectorAll('input[name="paymode"]');

  const weatherOptions = ["☀","☔","🌪"];
  const eventsPool = [
    {name:"なし", salesMod:0, hack:false, beefDisease:false},
    {name:"好景気", salesMod:+10, hack:false, beefDisease:false},
    {name:"不景気", salesMod:0, hack:false, beefDisease:false}, //後で価格判定
    {name:"インバウンド増", salesMod:+10, hack:false, beefDisease:false},
    {name:"ハッカー攻撃", salesMod:0, hack:true, beefDisease:false},
    {name:"牛肉病気", salesMod:0, hack:false, beefDisease:true}
  ];

  let currentPlayMode = 'analog'; // default

  function updateModeUI() {
    if(currentPlayMode==='analog') {
      analogInputs.style.display='block';
      digitalButtons.style.display='none';
    } else {
      analogInputs.style.display='none';
      digitalButtons.style.display='block';
    }
  }

  playModeEls.forEach(el=>{
    el.addEventListener('change',()=>{
      currentPlayMode = document.querySelector('input[name="playMode"]:checked').value;
      updateModeUI();
    });
  });

  updateModeUI();

  adSelect.addEventListener('change', ()=>{
    if(adSelect.value==='snsAd') snsAdArea.style.display='block'; else snsAdArea.style.display='none';
  });

  function getPaymentMode(){
    let pm = document.querySelector('input[name="paymode"]:checked');
    return pm?pm.value:'cash';
  }

  function getSelectedMaterials(){
    const mats = document.querySelectorAll('#child-board .materials-grid input[type=checkbox]:checked');
    let tags = [];
    mats.forEach(m=>{
      let t = m.dataset.tags;
      if(t) {
        t.split(",").forEach(tag=>{
          if(tag) tags.push(tag.trim());
        });
      }
    });
    return tags;
  }

  function calcSalesBaseByPrice(price) {
    if(price==300)return 130;
    if(price==400)return 120;
    if(price==500)return 100;
    if(price==600)return 90;
    if(price==700)return 80;
    return 100;
  }

  function analogGetWeatherEvent() {
    let w = analogWeatherSelect.value;
    let evName = analogEventSelect.value;

    let ev = eventsPool.find(e=>e.name===evName);
    if(!ev) ev = eventsPool[0];
    return {weather:w, event:ev};
  }

  function digitalGetWeatherEvent(callback) {
    // ランダム決定 with countdown
    countdownArea.textContent="天気を決めます: 3...";
    let c=3;
    let weatherRand;
    let intv = setInterval(()=>{
      c--;
      if(c>0) {
        countdownArea.textContent="天気を決めます: "+c+"...";
      } else {
        clearInterval(intv);
        // 決定
        weatherRand = weatherOptions[Math.floor(Math.random()*weatherOptions.length)];
        countdownArea.textContent="天気は…"+weatherRand;
        // 次にイベントもランダム決定
        setTimeout(()=>{
          countdownArea.textContent="イベントを決めます: 3...";
          let c2=3;
          let intv2=setInterval(()=>{
            c2--;
            if(c2>0) {
              countdownArea.textContent="イベントを決めます: "+c2+"...";
            } else {
              clearInterval(intv2);
              let ev = eventsPool[Math.floor(Math.random()*eventsPool.length)];
              countdownArea.textContent="イベントは…"+ev.name;
              setTimeout(()=>{
                countdownArea.textContent="";
                callback(weatherRand, ev);
              },1000);
            }
          },1000);
        },1500);
      }
    },1000);
  }

  function nextTurnProcedure(weatherForce, eventForce) {
    if(turn>maxTurn) {
      alert("ゲーム終了！最終残金："+money+"円");
      return;
    }

    let weather;
    let ev;
    if(currentPlayMode==='analog') {
      // アナログモードはUIから取得
      let res = analogGetWeatherEvent();
      weather = res.weather;
      ev = res.event;
      doCalculation(weather,ev);
    } else {
      // デジタルモードは引数があればそれ使う（カウントダウン後コールバック）
      if(weatherForce && eventForce) {
        weather=weatherForce;
        ev=eventForce;
        doCalculation(weather, ev);
      } else {
        alert("デジタルモードでは必ず天気・イベント決定ボタンを使ってください");
      }
    }
  }

  function doCalculation(w, ev) {
    weatherDisplay.textContent = w;
    eventDisplay.textContent = ev.name;

    let price = parseInt(priceSelect.value);
    let sales = calcSalesBaseByPrice(price);
    let paymentMode = getPaymentMode();

    // イベント影響
    if(ev.name==="インバウンド増") sales+=10;
    if(ev.name==="好景気") sales+=10;
    if(ev.name==="不景気"){
      if(price<=500) sales+=10; else sales-=10;
    }
    if(ev.beefDisease){
      // 牛肉チェック
      // 簡易:外国産or国産牛肉が選ばれていれば-10
      let labelText = (txt)=>Array.from(document.querySelectorAll('.materials-grid label')).find(l=>l.textContent.includes(txt) && l.querySelector('input:checked'));
      let beefF=labelText("牛肉(外国産)");
      let beefD=labelText("牛肉(国産)");
      if(beefF||beefD) sales-=10;
    }
    if(ev.hack && paymentMode==='cashless'){
      sales-=20;
      if(modeInsurance.checked && insuranceSelect.value==='sns') {
        sales+=10; 
      }
    }

    // スタッフ
    let staffEff=0;
    if(modeStaff.checked && staffSelect.value!=='none') {
      if(staffSelect.value==='aya' && w==="☀") staffEff+=5;
    }

    // 広告
    let adEff=0; let adCost=0;
    if(modeAd.checked && adSelect.value!=='none') {
      let opt = adSelect.options[adSelect.selectedIndex];
      adCost=parseInt(opt.dataset.cost||0);
      if(adSelect.value==='flyer') adEff=10;
      if(adSelect.value==='posting') adEff=15;
      if(adSelect.value==='station') {
        adEff=25;
        if(w==="☔"||w==="🌪") adEff=Math.floor(adEff/2);
      }
      if(adSelect.value==='snsAd') {
        let snsc = parseInt(snsAdCostInput.value||0);
        adCost=snsc;
        adEff=(snsc/1000)*5;
      }
    }

    // サトルさん広告効果アップ
    if(modeStaff.checked && staffSelect.value==='satoru' && adEff>0) {
      adEff+=5;
    }

    // インフレ
    let inflationBonus=0;
    if(modeInflation.checked && price>500) inflationBonus+=10;

    // タグコスト
    let tags = getSelectedMaterials();
    let foreignCount=tags.filter(t=>t==='外国産').length;
    let vegCount=tags.filter(t=>t==='野菜').length;
    let tagCost = foreignCount*500+vegCount*500;

    // 保険
    let insuranceCost=0;
    if(modeInsurance.checked && insuranceSelect.value!=='none') {
      let opt=insuranceSelect.options[insuranceSelect.selectedIndex];
      insuranceCost=parseInt(opt.dataset.cost||0);
    }

    // 合計売上
    sales=sales+adEff+staffEff+inflationBonus;
    if(sales<0)sales=0;
    let revenue=sales*price;

    // 費用計算
    let cost = baseCost.rent+baseCost.repay+baseCost.interest+baseCost.misc+baseCost.baseMaterial+tagCost+adCost+insuranceCost;

    // 税金
    if(modeTax.checked) {
      let profit=revenue-cost;
      cost+= (profit>0)?2000:1000;
    }

    money=money - cost + revenue;
    if(money<0)money=0;

    turnSalesEl.textContent=sales;
    turnRevenueEl.textContent=revenue;
    turnCostEl.textContent=cost;
    turnMoneyEl.textContent=money;
    moneyEl.textContent=money;

    turn++;
    turnCountEl.textContent=turn;
    if(turn>maxTurn) {
      alert("ゲーム終了！最終残金："+money+"円");
    }
  }

  nextTurnBtn.addEventListener('click',()=>{
    if(currentPlayMode==='analog'){
      // アナログ: 選択済の天気・イベントから計算
      nextTurnProcedure();
    } else {
      // デジタルモードは天気・イベントを事前に決めていない場合はNG
      // デジタルモードでは、decideWeatherBtn & decideEventBtnで決定後、callbackで計算呼び出し
      alert("デジタルモードでは天気・イベント決定ボタンで決めてから進んでください");
    }
  });

  // デジタルモード決定ボタン
  const decideWeatherBtn = document.getElementById('decideWeatherBtn');
  const decideEventBtn = document.getElementById('decideEventBtn');

  // 今回は天気とイベントを一括決定に変更
  // 前回2ボタンあったが簡略し、decideWeatherBtnで天気・イベント両方決める
  // eventBtnを削除しても良いが一応残す(非表示)
  if(decideEventBtn) decideEventBtn.style.display='none';

  decideWeatherBtn.addEventListener('click',()=>{
    // カウントダウン→決定後doCalculationをcallbackで呼び出す
    digitalGetWeatherEvent((w,ev)=>{
      // w, ev確定したので次ターン計算
      nextTurnProcedure(w,ev);
    });
  });

  // モード切替でアナログ/デジタルUI切替
  // 発火
  document.querySelector('input[name="playMode"][value="analog"]').dispatchEvent(new Event('change'));

});
