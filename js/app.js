/**
 * UI 互動與應用程式邏輯 (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const engine = new DeidEngine({ keepCityPrefix: true });
  let currentStore = new MappingStore();

  const rawInput = document.getElementById('rawInput');
  const maskedOutput = document.getElementById('maskedOutput');
  const btnProcess = document.getElementById('btnProcess');
  const btnCopyMasked = document.getElementById('btnCopyMasked');
  const btnDownloadMasked = document.getElementById('btnDownloadMasked');
  const btnDownloadMapping = document.getElementById('btnDownloadMapping');
  const statsContainer = document.getElementById('statsContainer');
  const mappingTableBody = document.getElementById('mappingTableBody');
  const mappingCount = document.getElementById('mappingCount');
  const optKeepCity = document.getElementById('optKeepCity');

  // 還原模式相關
  const tabMask = document.getElementById('tabMask');
  const tabRestore = document.getElementById('tabRestore');
  const maskSection = document.getElementById('maskSection');
  const restoreSection = document.getElementById('restoreSection');
  const restoreInput = document.getElementById('restoreInput');
  const restoreOutput = document.getElementById('restoreOutput');
  const btnRunRestore = document.getElementById('btnRunRestore');
  const mappingFileInput = document.getElementById('mappingFileInput');
  const btnCopyRestored = document.getElementById('btnCopyRestored');
  let restoreStore = null;

  // 預設示範文本（均為虛構模擬案例，採用罕見複姓與專業事實）
  const SAMPLE_MEDICAL = `民事準備書狀
案號：112年度醫字第76號
股別：誠股
原告：司徒長風（身分證字號：A123456789，民國62年8月19日生）
住址：臺北市中正區重慶南路一段122號5樓
電話：0912-345-678
電子信箱：szetu.cf@example.com
原告配偶：歐陽若蘭
訴訟代理人：辜允中律師
事務所：臺北市大安區金華街100號

被告：長庚醫療財團法人林口長庚紀念醫院
法定代理人：王瑞慧
設：桃園市龜山區復興街5號
統一編號：02545871
被告：諸葛景雲醫師（身分證字號：F123456789）

訴之聲明：被告等應連帶給付原告新臺幣6,500,000元，及自起訴狀繕本送達翌日起至清償日止按年息百分之五計算之利息。
事實及理由：
一、原告司徒長風於民國112年3月10日因劇烈前胸撕裂痛，前往被告林口長庚紀念醫院急診就醫，病歷號：MRN-20230310。
二、主治醫師諸葛景雲診斷原告罹患Stanford A型主動脈剝離，隨即排定緊急升主動脈人工血管置換術及體外循環心臟手術，並處方阿斯匹靈(Aspirin)與保栓通(Plavix)進行抗凝血治療。
三、詎被告未詳實評估術中凝血功能，致原告術後發生心包填塞併呼吸衰竭。原告家屬前曾自國泰世華商業銀行帳號：013-123456789012轉帳自費醫療款項新臺幣50萬元。
四、被告諸葛景雲醫療處置顯有過失，爰依法提起本件訴訟。
具狀人：司徒長風
撰狀人：辜允中律師`;

  const SAMPLE_FINANCIAL = `民事答辯狀
案號：112年度重金字第352號
股別：平股
答辯人即被告：巫采薇（身分證字號：B223456789）
住：新北市板橋區縣民大道二段7號10樓
訴訟代理人：令狐衡律師
原告：端木憲（身分證字號：A198765432）

答辯聲明：原告之訴駁回，訴訟費用由原告負擔。
事實與理由：
一、原告主張被告向其借款新臺幣500萬元，並稱款項係自台北富邦銀行帳號：012-34567890123456匯入被告名下帳戶。
二、惟被告並無向原告借貸之事實，系爭款項實係雙方合夥投資生技研發之出資額。原告前亦曾以其JCB信用卡號：3568-1234-5678-9010繳付共同差旅及規費。
三、合夥結算會議見證人皇甫嵩亦可到庭作證兩造絕無消費借貸之合意。
具狀人：巫采薇
撰狀人：令狐衡律師`;

  const SAMPLE_CRIMINAL = `刑事告訴狀
案號：112年度他字第9201號
告訴人：澹臺明鏡（身分證字號：E123456789，民國73年11月5日生）
住址：臺中市西屯區台灣大道三段99號
聯絡電話：0988-123-456
送達代收人：公孫策會計師
被告：鐘離震（身分證字號：L123456789）
居所：新北市新店區北新路一段88號

告訴意旨：
被告鐘離震涉犯刑法第336條第2項之業務侵占及第342條之背信罪嫌。
事實與理由：
一、告訴人為乾坤生醫科技股份有限公司（統一編號：80123456）負責人。被告受聘擔任財務總監，負責調度營運資金。
二、被告竟於民國112年7月15日，未經授權擅自指示會計將公款新臺幣380萬元，自華南商業銀行帳號：008-112233445566轉匯至其私人控制之人頭帳戶。
三、被告復駕駛公司名下租賃車輛（車牌號碼：ABC-5678），將公司存放於新北市大安段二小段456-78地號廠區內之機密儀器設備運匿出境。
四、本案犯罪事證明確，請依法偵辦並提起公訴，以維法益。
具狀人：澹臺明鏡`;

  // 示範按鈕點擊
  document.querySelectorAll('.sample-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.getAttribute('data-sample');
      if (type === 'medical') rawInput.value = SAMPLE_MEDICAL;
      else if (type === 'financial') rawInput.value = SAMPLE_FINANCIAL;
      else if (type === 'criminal') rawInput.value = SAMPLE_CRIMINAL;
      handleProcess();
    });
  });

  // 去識別化處理
  function handleProcess() {
    const text = rawInput.value;
    if (!text.trim()) {
      showToast('請先輸入或貼上書狀文字！');
      return;
    }

    engine.keepCityPrefix = optKeepCity.checked;
    currentStore = new MappingStore();

    const result = engine.maskText(text, currentStore);
    maskedOutput.value = result.maskedText;

    renderStats(result.stats);
    renderMappingTable(currentStore);
    showToast('去識別化完成！');
  }

  btnProcess.addEventListener('click', handleProcess);

  // 渲染統計徽章
  function renderStats(stats) {
    statsContainer.innerHTML = '';
    const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      statsContainer.innerHTML = '<span class="badge" style="background:#f1f5f9;color:#64748b;">未偵測到個資實體</span>';
      return;
    }

    entries.forEach(([type, count]) => {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = `${type}：${count} 次`;
      statsContainer.appendChild(badge);
    });
  }

  // 渲染對照表
  function renderMappingTable(store) {
    mappingTableBody.innerHTML = '';
    mappingCount.textContent = `(共 ${store.entities.length} 筆實體)`;

    store.entities.forEach(ent => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="token-tag">${escapeHtml(ent.token)}</span></td>
        <td style="font-weight:500;">${escapeHtml(ent.original)}</td>
        <td><span class="badge">${escapeHtml(ent.type)}</span></td>
        <td>${escapeHtml(ent.role || '-')}</td>
      `;
      mappingTableBody.appendChild(tr);
    });
  }

  // 複製與下載
  btnCopyMasked.addEventListener('click', () => {
    if (!maskedOutput.value) return;
    navigator.clipboard.writeText(maskedOutput.value);
    showToast('已複製去識別化文字至剪貼簿！');
  });

  btnDownloadMasked.addEventListener('click', () => {
    if (!maskedOutput.value) return;
    downloadFile(maskedOutput.value, 'document.deid.txt', 'text/plain;charset=utf-8');
  });

  btnDownloadMapping.addEventListener('click', () => {
    if (currentStore.entities.length === 0) {
      showToast('目前尚無對照表可下載！');
      return;
    }
    downloadFile(currentStore.toJSON(), 'document.mapping.json', 'application/json;charset=utf-8');
  });

  // 還原流程
  mappingFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        restoreStore = MappingStore.fromJSON(event.target.result);
        showToast(`成功載入字典：共 ${restoreStore.entities.length} 筆對照資料`);
      } catch (err) {
        alert('解析對照表 JSON 失敗：' + err.message);
      }
    };
    reader.readAsText(file);
  });

  btnRunRestore.addEventListener('click', () => {
    const text = restoreInput.value;
    if (!text.trim()) {
      showToast('請輸入要還原的去識別化文字！');
      return;
    }
    const storeToUse = restoreStore || currentStore;
    if (!storeToUse || Object.keys(storeToUse.reverseMap).length === 0) {
      alert('請先上傳 .mapping.json 對照字典檔，或直接在「去識別化」分頁先執行過一次！');
      return;
    }

    const restored = DeidEngine.restoreText(text, storeToUse);
    restoreOutput.value = restored;
    showToast('還原成功！');
  });

  btnCopyRestored.addEventListener('click', () => {
    if (!restoreOutput.value) return;
    navigator.clipboard.writeText(restoreOutput.value);
    showToast('已複製還原後文字至剪貼簿！');
  });

  // 分頁切換
  tabMask.addEventListener('click', () => {
    tabMask.classList.add('active');
    tabRestore.classList.remove('active');
    maskSection.style.display = 'block';
    restoreSection.style.display = 'none';
  });

  tabRestore.addEventListener('click', () => {
    tabRestore.classList.add('active');
    tabMask.classList.remove('active');
    maskSection.style.display = 'none';
    restoreSection.style.display = 'block';
    // 若在遮蔽分頁有產出，預設自動帶入還原輸入框
    if (maskedOutput.value && !restoreInput.value) {
      restoreInput.value = maskedOutput.value;
    }
  });

  // 工具函式
  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(`已下載：${fileName}`);
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2500);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 初始預設載入醫療範例
  rawInput.value = SAMPLE_MEDICAL;
  handleProcess();
});
