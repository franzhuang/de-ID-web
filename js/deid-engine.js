/**
 * 臺灣法律文書 / 病歷 / 財務個資 瀏覽器端離線去識別化引擎 (Pure JavaScript)
 * 100% 在用戶端瀏覽器記憶體中運算，絕無任何網路請求或伺服器外洩風險。
 */

// 臺灣身分證英文字母數值對照表
const TW_ID_LETTER_MAP = {
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17,
  'I': 34, 'J': 18, 'K': 19, 'L': 20, 'M': 21, 'N': 22, 'O': 35, 'P': 23,
  'Q': 24, 'R': 25, 'S': 26, 'T': 27, 'U': 28, 'V': 29, 'W': 32, 'X': 30,
  'Y': 31, 'Z': 33
};

function isValidTwId(idStr) {
  idStr = idStr.toUpperCase();
  if (!/^[A-Z][1289]\d{8}$/.test(idStr)) return false;
  const n = TW_ID_LETTER_MAP[idStr[0]];
  const n1 = Math.floor(n / 10);
  const n2 = n % 10;
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const digits = [n1, n2, parseInt(idStr[1]), parseInt(idStr[2]), parseInt(idStr[3]),
                  parseInt(idStr[4]), parseInt(idStr[5]), parseInt(idStr[6]), parseInt(idStr[7]), parseInt(idStr[8])];
  const total = digits.reduce((sum, d, i) => sum + d * weights[i], 0);
  const checkDigit = (10 - (total % 10)) % 10;
  return checkDigit === parseInt(idStr[9]);
}

function isValidLuhn(ccStr) {
  const digits = ccStr.replace(/\D/g, '').split('').map(Number);
  if (digits.length < 15 || digits.length > 16) return false;
  let sum = 0;
  const reversed = digits.reverse();
  for (let i = 0; i < reversed.length; i++) {
    let d = reversed[i];
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function isValidTaxId(taxId) {
  if (!/^\d{8}$/.test(taxId)) return false;
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  const digits = taxId.split('').map(Number);
  const products = digits.map((d, i) => d * weights[i]);
  const sum = products.reduce((acc, p) => acc + Math.floor(p / 10) + (p % 10), 0);
  if (sum % 10 === 0) return true;
  if (digits[6] === 7) {
    const altSum = sum - (Math.floor(products[6] / 10) + (products[6] % 10)) + 1;
    if (altSum % 10 === 0) return true;
  }
  return false;
}

// 臺灣常見姓氏 (含複姓)
const COMMON_SURNAMES = new Set([
  "陳", "林", "黃", "張", "李", "王", "吳", "劉", "蔡", "楊",
  "許", "鄭", "謝", "郭", "洪", "曾", "邱", "廖", "賴", "周",
  "徐", "蘇", "葉", "莊", "呂", "江", "何", "蕭", "羅", "高",
  "潘", "簡", "朱", "鍾", "彭", "游", "詹", "胡", "施", "沈",
  "余", "盧", "梁", "顏", "柯", "孫", "魏", "翁", "戴", "范",
  "方", "鄧", "杜", "傅", "侯", "鄒", "覃", "石", "古", "姚",
  "田", "廖", "馮", "陸", "湯", "童", "白", "毛", "鄒", "熊",
  "歐陽", "司徒", "諸葛", "上官"
]);

// 訴訟角色
const LEGAL_ROLES = [
  "原告", "被告", "上訴人", "被上訴人", "聲請人", "相對人",
  "告訴人", "被害人", "受刑人", "受處分人", "受告知人",
  "訴訟代理人", "選任辯護人", "辯護人", "複代理人", "送達代收人",
  "法定代理人", "指定辯護人", "特別代理人",
  "法官", "審判長", "受命法官", "陪席法官", "檢察官", "書記官", "公證人", "調解委員",
  "證人", "鑑定人", "輔佐人",
  "債權人", "債務人", "連帶保證人", "保證人", "被繼承人", "繼承人", "受僱人",
  "具狀人", "撰狀人", "聲請人", "抗告人", "異議人",
  "主治醫師", "主治大夫", "醫師", "院長", "護理師", "護士", "放射師", "心理師"
];

// 排除詞
const LEGAL_EXCLUDE_WORDS = new Set([
  "原告", "被告", "上訴人", "法院", "裁判", "判決", "裁定", "檢察官", "書記官", "辯護人",
  "律師", "法官", "審判長", "代理人", "中華民國", "司法院", "最高法院", "地方法院",
  "高等法院", "高等行政法院", "憲法法庭", "地檢署", "高等檢察署", "最高檢察署",
  "民法", "刑法", "民事訴訟法", "刑事訴訟法", "行政訴訟法", "強制執行法",
  "主文", "事實", "理由", "本件", "系爭", "前開", "上開", "業經", "足認", "審酌",
  "原審", "上訴", "抗告", "再審", "聲請", "告訴", "起訴", "答辯", "抗辯", "主張",
  "陳述", "證述", "供稱", "勘驗", "言詞辯論", "準備程序", "調查證據",
  "民國", "西元", "年月日", "附表", "附件", "證據", "證物", "被證", "原證", "甲證", "乙證",
  "新臺幣", "美金", "日圓", "利息", "違約金", "損害賠償", "精神慰撫金", "慰撫金",
  "住院", "出院", "門診", "急診", "診斷", "手術", "病情", "用藥", "處方",
  "車輛", "事故", "車禍", "撞擊", "受傷", "死亡", "骨折", "挫傷", "擦傷", "撕裂傷"
]);

const VERB_SUFFIXES = new Set(["診", "斷", "認", "稱", "問", "告", "辯", "答", "訴", "判", "諭", "指", "主", "張", "請", "求", "辦", "開", "立"]);

const TAIWAN_CITIES = [
  "臺北市", "台北市", "新北市", "桃園市", "臺中市", "台中市", "臺南市", "台南市", "高雄市",
  "基隆市", "新竹市", "嘉義市", "新竹縣", "苗栗縣", "彰化縣", "南投縣", "雲林縣", "嘉義縣",
  "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣", "台東縣", "澎湖縣", "金門縣", "連江縣"
];

const HOSPITAL_KEYWORDS = [
  "國立臺灣大學醫學院附設醫院", "臺大醫院", "台大醫院", "長庚醫療財團法人林口長庚紀念醫院", "林口長庚紀念醫院",
  "長庚紀念醫院", "長庚醫院", "臺北榮民總醫院", "榮民總醫院", "榮總", "馬偕紀念醫院", "馬偕醫院",
  "三軍總醫院", "三總", "新光醫院", "國泰綜合醫院", "國泰醫院", "亞東紀念醫院", "亞東醫院",
  "中國醫藥大學附設醫院", "中山醫學大學附設醫院", "奇美醫院", "高雄醫學大學附設中和紀念醫院", "高醫",
  "慈濟醫院", "義大醫院", "雙和醫院", "振興醫院", "耕莘醫院", "輔大醫院"
];

// 優先級定義
const ENTITY_PRIORITY = {
  "身分證號": 100,
  "居留證號": 100,
  "護照號": 95,
  "健保卡號": 95,
  "信用卡號": 90,
  "金融帳號": 85,
  "統一編號": 80,
  "手機": 75,
  "電話": 70,
  "電子郵件": 70,
  "IP位址": 65,
  "車牌號": 65,
  "地號建號": 60,
  "地址": 55,
  "病歷號": 50,
  "醫療機構": 45,
  "法院遮蔽代號": 40,
  "出生年月日": 35,
  "訴訟關係人": 30,
  "自然人": 20
};

class DeidEngine {
  constructor(options = {}) {
    this.keepCityPrefix = options.keepCityPrefix !== undefined ? options.keepCityPrefix : true;
    this.maskAllDates = options.maskAllDates || false;
  }

  detectEntities(text) {
    const spans = [];

    // 1. 身分證號、居留證號
    const twIdRegex = /(?<![A-Za-z0-9])([A-Za-z][1289]\d{8})(?![A-Za-z0-9])/g;
    let m;
    while ((m = twIdRegex.exec(text)) !== null) {
      spans.push({
        start: m.index,
        end: m.index + m[1].length,
        text: m[1],
        type: "身分證號",
        valid: isValidTwId(m[1])
      });
    }

    const arcOldRegex = /(?<![A-Za-z0-9])([A-Za-z][A-Da-d]\d{8})(?![A-Za-z0-9])/g;
    while ((m = arcOldRegex.exec(text)) !== null) {
      spans.push({
        start: m.index,
        end: m.index + m[1].length,
        text: m[1],
        type: "居留證號"
      });
    }

    // 健保卡號
    const healthCardRegex = /(?:健保(?:卡)?(?:卡號|號碼)?|IC卡號)[：:\s]*(?<!\d)(\d{12})(?!\d)/g;
    while ((m = healthCardRegex.exec(text)) !== null) {
      const offset = m[0].indexOf(m[1]);
      spans.push({
        start: m.index + offset,
        end: m.index + offset + m[1].length,
        text: m[1],
        type: "健保卡號"
      });
    }

    // 護照號
    const passportRegex = /(?:護照(?:號碼|字號)?|Passport\s*(?:No\.?)?)[：:\s]*(?<![A-Za-z0-9])([A-Za-z0-9]{8,10})(?![A-Za-z0-9])/gi;
    while ((m = passportRegex.exec(text)) !== null) {
      const offset = m[0].indexOf(m[1]);
      spans.push({
        start: m.index + offset,
        end: m.index + offset + m[1].length,
        text: m[1],
        type: "護照號"
      });
    }

    // 2. 信用卡號 (涵蓋 Visa, Master, JCB, AE)
    const ccRegex = /(?:信用卡(?:卡號)?|卡號)?[：:\s]*(?<!\d)((?:4[0-9]{3}|5[1-5][0-9]{2}|2[2-7][0-9]{2}|3[457][0-9]{2})[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{3,4})(?!\d)/g;
    while ((m = ccRegex.exec(text)) !== null) {
      const rawStr = m[1];
      const prefixText = text.substring(Math.max(0, m.index - 10), m.index + m[0].indexOf(rawStr));
      const hasPrefix = /信用卡|卡號/.test(prefixText);
      if (hasPrefix || isValidLuhn(rawStr)) {
        const offset = m[0].indexOf(rawStr);
        spans.push({
          start: m.index + offset,
          end: m.index + offset + rawStr.length,
          text: rawStr,
          type: "信用卡號"
        });
      }
    }

    // 統一編號 (8碼)
    const taxRegex = /(?:統一編號|統編|公司統編)?[：:\s]*(?<!\d)(\d{8})(?!\d)/g;
    while ((m = taxRegex.exec(text)) !== null) {
      const numStr = m[1];
      const prefixText = text.substring(Math.max(0, m.index - 10), m.index + m[0].indexOf(numStr));
      const hasPrefix = /統一編號|統編/.test(prefixText);
      if (hasPrefix || isValidTaxId(numStr)) {
        const offset = m[0].indexOf(numStr);
        spans.push({
          start: m.index + offset,
          end: m.index + offset + numStr.length,
          text: numStr,
          type: "統一編號"
        });
      }
    }

    // 銀行/郵局帳號 (10~16碼)
    const bankAcctRegex = /(?:帳號|帳戶|金融帳號|存款帳號|郵局帳號|行庫帳號|轉入帳號|匯入帳號|扣款帳號|戶名[\s\S]{0,10}帳號)[：:\s]*(?<!\d)([0-9-]{10,18})(?!\d)/g;
    while ((m = bankAcctRegex.exec(text)) !== null) {
      const rawStr = m[1];
      const digitsOnly = rawStr.replace(/\D/g, '');
      if (digitsOnly.length >= 10 && digitsOnly.length <= 16) {
        const offset = m[0].indexOf(rawStr);
        spans.push({
          start: m.index + offset,
          end: m.index + offset + rawStr.length,
          text: rawStr,
          type: "金融帳號"
        });
      }
    }

    // 3. 通訊
    const mobileRegex = /(?:\+886-?|0)9\d{2}[-\s]?\d{3}[-\s]?\d{3}\b/g;
    while ((m = mobileRegex.exec(text)) !== null) {
      spans.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        type: "手機"
      });
    }

    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/g;
    while ((m = emailRegex.exec(text)) !== null) {
      spans.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        type: "電子郵件"
      });
    }

    // 4. 地址與地政
    const cityPattern = TAIWAN_CITIES.join('|');
    const addrRegex = new RegExp(`(${cityPattern})?([\\u4e00-\\u9fa5]{1,4}(?:區|鄉|鎮|市))?([\\u4e00-\\u9fa50-9０-９一二三四五六七八九十]{1,10}(?:村|里))?([\\u4e00-\\u9fa50-9０-９一二三四五六七八九十]{1,15}(?:路|街|大道|段))([0-9０-９一二三四五六七八九十]{1,5}巷)?([0-9０-９一二三四五六七八九十]{1,5}弄)?([0-9０-９]{1,5}號)(?:之[0-9０-９]{1,3})?(?:[0-9０-９]{1,3}樓(?:之[0-9０-９]{1,3})?)?(?:[0-9０-９]{1,3}室)?`, 'g');
    while ((m = addrRegex.exec(text)) !== null) {
      const fullMatch = m[0];
      if (fullMatch.includes('號') && (fullMatch.includes('路') || fullMatch.includes('街') || fullMatch.includes('段') || fullMatch.includes('大道'))) {
        let start = m.index;
        let end = m.index + fullMatch.length;
        const cityPart = m[1];
        if (this.keepCityPrefix && cityPart) {
          start += cityPart.length;
        }
        const sliceText = text.substring(start, end).trim();
        if (sliceText.length > 0) {
          spans.push({
            start: start,
            end: end,
            text: sliceText,
            type: "地址"
          });
        }
      }
    }

    // 5. 醫療機構與病歷號
    const chartNoRegex = /(?:病歷號(?:碼)?|病歷字號|門診號|住院號|Chart\s*(?:No\.?|Number)|MRN)[：:\s]*\b([A-Za-z0-9-]{4,15})\b/gi;
    while ((m = chartNoRegex.exec(text)) !== null) {
      const offset = m[0].indexOf(m[1]);
      spans.push({
        start: m.index + offset,
        end: m.index + offset + m[1].length,
        text: m[1],
        type: "病歷號"
      });
    }

    for (const kw of HOSPITAL_KEYWORDS) {
      let idx = 0;
      while ((idx = text.indexOf(kw, idx)) !== -1) {
        spans.push({
          start: idx,
          end: idx + kw.length,
          text: kw,
          type: "醫療機構"
        });
        idx += kw.length;
      }
    }

    const generalHospitalRegex = /(?:(?:醫療財團法人|財團法人|社團法人)?[\u4e00-\u9fa5]{1,4}(?:縣|市|區))?[\u4e00-\u9fa5]{2,6}(?:附設)?(?:紀念醫院|綜合醫院|醫院|診所|衛生所)/g;
    while ((m = generalHospitalRegex.exec(text)) !== null) {
      let name = m[0].replace(/^(?:前往|至|於|自|在|被告|原告|該)/, '');
      if (name.length >= 4 && !["出院手續", "住院治療", "依據醫院"].includes(name)) {
        const start = m.index + m[0].length - name.length;
        spans.push({
          start: start,
          end: m.index + m[0].length,
          text: name,
          type: "醫療機構"
        });
      }
    }

    // 6. 法院歷史遮蔽與出生年月日
    const tianganRegex = /(?:甲|乙|丙|丁|戊|己|庚|辛|壬|癸)[○O0]{1,3}/g;
    while ((m = tianganRegex.exec(text)) !== null) {
      spans.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        type: "法院遮蔽代號",
        role: "當事人"
      });
    }

    const alphaAliasRegex = /(?<![A-Za-z0-9])([A-Z](?:女|男|[○O0]{1,3}|童))(?![A-Za-z0-9])/g;
    while ((m = alphaAliasRegex.exec(text)) !== null) {
      spans.push({
        start: m.index,
        end: m.index + m[1].length,
        text: m[1],
        type: "法院遮蔽代號",
        role: "代號當事人"
      });
    }

    const birthRegex = /(?:出生年月日|出生日期|生日|生於|民國)?[：:\s]*(?:(?:民國|西元)?\s*\d{1,4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日)(?:\s*出生|\s*生)?/g;
    while ((m = birthRegex.exec(text)) !== null) {
      const matchStr = m[0];
      const prevContext = text.substring(Math.max(0, m.index - 6), m.index);
      if (matchStr.includes('出生') || matchStr.includes('生日') || matchStr.includes('生於') || prevContext.includes('出生') || prevContext.includes('生於')) {
        spans.push({
          start: m.index,
          end: m.index + matchStr.length,
          text: matchStr.trim(),
          type: "出生年月日"
        });
      }
    }

    // 7. 自然人與法律訴訟關係人
    const rolesPattern = LEGAL_ROLES.join('|');
    const rolePersonRegex = new RegExp(`(${rolesPattern})[：:\\s]*([\\u4e00-\\u9fa5]{2,4})`, 'g');
    while ((m = rolePersonRegex.exec(text)) !== null) {
      const roleName = m[1];
      let rawName = m[2];
      if (LEGAL_EXCLUDE_WORDS.has(rawName)) continue;

      let candidate = rawName;
      if (candidate.length === 4) {
        const isCompound = ["歐陽", "司徒", "諸葛", "上官"].includes(candidate.substring(0, 2));
        if (!isCompound) candidate = candidate.substring(0, 3);
      }
      if (candidate.length >= 3 && VERB_SUFFIXES.has(candidate[candidate.length - 1])) {
        if (COMMON_SURNAMES.has(candidate[0])) candidate = candidate.substring(0, candidate.length - 1);
      }

      const isValidName = (COMMON_SURNAMES.has(candidate[0]) && candidate.length >= 2 && candidate.length <= 3) ||
                          (["歐陽", "司徒", "諸葛", "上官"].includes(candidate.substring(0, 2)) && candidate.length <= 4);

      if (isValidName && !LEGAL_EXCLUDE_WORDS.has(candidate)) {
        const nameStart = m.index + m[0].indexOf(candidate);
        spans.push({
          start: nameStart,
          end: nameStart + candidate.length,
          text: candidate,
          type: "訴訟關係人",
          role: roleName
        });
      }
    }

    // 8. 衝突消解 (Non-overlapping Span Selection via Uint8Array mask)
    spans.sort((a, b) => {
      const pA = ENTITY_PRIORITY[a.type] || 0;
      const pB = ENTITY_PRIORITY[b.type] || 0;
      if (pA !== pB) return pB - pA;
      const lenA = a.end - a.start;
      const lenB = b.end - b.start;
      if (lenA !== lenB) return lenB - lenA;
      return a.start - b.start;
    });

    const occupied = new Uint8Array(text.length);
    const selected = [];
    for (const span of spans) {
      let isOverlapping = false;
      for (let k = span.start; k < span.end; k++) {
        if (occupied[k] === 1) {
          isOverlapping = true;
          break;
        }
      }
      if (!isOverlapping) {
        selected.push(span);
        for (let k = span.start; k < span.end; k++) occupied[k] = 1;
      }
    }

    selected.sort((a, b) => a.start - b.start);
    return selected;
  }

  maskText(text, mappingStore = null) {
    if (!mappingStore) mappingStore = new MappingStore();
    const spans = this.detectEntities(text);
    const stats = {};

    let modified = text;
    // 由後往前替換
    for (let i = spans.length - 1; i >= 0; i--) {
      const span = spans[i];
      const token = mappingStore.getOrCreateToken(span.text, span.type, span.role);
      stats[span.type] = (stats[span.type] || 0) + 1;
      modified = modified.substring(0, span.start) + token + modified.substring(span.end);
    }

    return { maskedText: modified, mappingStore, stats, detectedSpans: spans };
  }

  static restoreText(maskedText, mappingStore) {
    let restored = maskedText;
    const sortedTokens = Object.keys(mappingStore.reverseMap).sort((a, b) => b.length - a.length);
    for (const token of sortedTokens) {
      const original = mappingStore.reverseMap[token];
      restored = restored.replaceAll(token, original);
    }
    return restored;
  }
}

class MappingStore {
  constructor() {
    this.forwardMap = {};
    this.reverseMap = {};
    this.typeCounters = {};
    this.entities = [];
  }

  getOrCreateToken(text, entityType, role = null) {
    const cleanText = text.trim();
    if (this.forwardMap[cleanText]) {
      return this.forwardMap[cleanText];
    }

    const prefix = role ? `${role}_${entityType}` : entityType;
    const count = (this.typeCounters[prefix] || 0) + 1;
    this.typeCounters[prefix] = count;

    const token = `[${prefix}_${count}]`;
    this.forwardMap[cleanText] = token;
    this.reverseMap[token] = cleanText;
    this.entities.push({
      token,
      original: cleanText,
      type: entityType,
      role: role || "-"
    });

    return token;
  }

  toJSON() {
    return JSON.stringify({
      version: "1.0",
      forwardMap: this.forwardMap,
      reverseMap: this.reverseMap,
      typeCounters: this.typeCounters,
      entities: this.entities
    }, null, 2);
  }

  static fromJSON(jsonStr) {
    const data = JSON.parse(jsonStr);
    const store = new MappingStore();
    store.forwardMap = data.forwardMap || {};
    store.reverseMap = data.reverseMap || {};
    store.typeCounters = data.typeCounters || {};
    store.entities = data.entities || [];
    return store;
  }
}

if (typeof window !== 'undefined') {
  window.DeidEngine = DeidEngine;
  window.MappingStore = MappingStore;
}
