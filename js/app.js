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

  // 預設示範文本
  const SAMPLE_MEDICAL = `民事起訴狀
案號：112年度重訴字第888號
原告：陳信宏（身分證字號：A123456789，民國68年5月12日生）
住址：臺北市中正區重慶南路一段122號5樓
電話：0912-345-678
電子信箱：ashin@example.com
訴訟代理人：黃國昌律師

被告：長庚醫療財團法人林口長庚紀念醫院
設：桃園市龜山區復興街5號
統一編號：02545871
被告：柯文哲醫師（身分證字號：F123456789）

事實及理由：
一、原告陳信宏於民國112年3月10日因胸悶前往被告林口長庚紀念醫院就診，病歷號：MRN-20230310。
二、主治醫師柯文哲診斷原告罹患急性心肌梗塞，隨即排定緊急心導管擴張手術及置放血管支架，並給予阿斯匹靈治療。
三、原告自國泰世華銀行帳號：013-123456789012 轉帳新臺幣30萬元至被告指定帳戶。
四、被告柯文哲醫療過失情節明確，爰依法提起本件訴訟。
具狀人：陳信宏
撰狀人：黃國昌律師`;

  const SAMPLE_FINANCIAL = `民事答辯狀
案號：111年度金字第352號
答辯人即被告：張惠妹（身分證字號：B223456789）
住：新北市板橋區縣民大道二段7號10樓
原告：周杰倫（身分證字號：A198765432）

答辯聲明：原告之訴駁回。
事實與理由：
一、原告主張被告向其借款新臺幣200萬元，並稱款項係自台北富邦銀行帳號：012-34567890123456匯入被告帳戶。
二、惟被告並無向原告借貸之事實，該筆款項實係原告以信用卡號：4563-1234-5678-9010支付合夥投資款。
三、另原告指稱之見證人李宗盛亦可到庭作證。
具狀人：張惠妹`;

  const SAMPLE_COURT = `裁判字號：最高法院 110 年度台上字第 1234 號民事判決
上訴人：甲○○（民國70年1月1日生）
住址：臺北市大安區信義路二段88號
被上訴人：乙○○
訴訟代理人：陳○○律師

上列當事人間請求返還不當得利事件，上訴人對於中華民國109年12月30日高等法院第二審判決提起上訴。
事實及理由：
上訴人甲○○主張其於民國108年間與被上訴人乙○○協議投資，乙○○承諾保證獲利。證人A女於原審證述屬實。
甲○○遂依指示匯款新臺幣50萬元至乙○○名下之中國信託商業銀行帳戶。詎乙○○嗣後避不見面。
原審判決認事用法顯有違誤，甲○○依法提起上訴。`;

  // 示範按鈕點擊
  document.querySelectorAll('.sample-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.getAttribute('data-sample');
      if (type === 'medical') rawInput.value = SAMPLE_MEDICAL;
      else if (type === 'financial') rawInput.value = SAMPLE_FINANCIAL;
      else if (type === 'court') rawInput.value = SAMPLE_COURT;
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
