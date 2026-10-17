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
