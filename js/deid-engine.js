/**
 * Taiwan Legal & Medical De-identification Engine (Pure JavaScript Client-Side)
 * 專為臺灣法院、訴訟書狀、醫療病歷與金融交易設計之純前端去識別化引擎
 */

// 臺灣身分證驗證演算法 (Rule 01)
const ID_LETTER_MAP = {
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17,
  'I': 34, 'J': 18, 'K': 19, 'L': 20, 'M': 21, 'N': 22, 'O': 35, 'P': 23,
  'Q': 24, 'R': 25, 'S': 26, 'T': 27, 'U': 28, 'V': 29, 'W': 32, 'X': 30,
  'Y': 31, 'Z': 33
};

function isValidTaiwanID(idStr) {
  if (!idStr || idStr.length !== 10) return false;
  const upper = idStr.toUpperCase();
  const firstCode = ID_LETTER_MAP[upper[0]];
  if (!firstCode) return false;
  if (upper[1] !== '1' && upper[1] !== '2') return false;

  const n1 = Math.floor(firstCode / 10);
  const n2 = firstCode % 10;
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  const digits = [n1, n2, ...upper.slice(1).split('').map(Number)];

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * weights[i];
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[10];
}

// 臺灣營利事業統一編號驗證演算法 (Rule 03)
function isValidTaxID(taxIdStr) {
  if (!taxIdStr || taxIdStr.length !== 8 || !/^\d{8}$/.test(taxIdStr)) return false;
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  const digits = taxIdStr.split('').map(Number);
  const products = digits.map((d, i) => d * weights[i]);
  const sum = products.reduce((acc, p) => acc + Math.floor(p / 10) + (p % 10), 0);

  if (sum % 10 === 0) return true;
  if (digits[6] === 7) {
    const altSum = sum - (Math.floor(products[6] / 10) + (products[6] % 10)) + 1;
    if (altSum % 10 === 0) return true;
  }
  return false;
}

// 臺灣完整百家姓、常見單姓與罕見複姓庫
const COMMON_SURNAMES = new Set([
  "趙", "錢", "孫", "李", "周", "吳", "鄭", "王", "馮", "陳", "褚", "衛", "蔣", "沈", "韓", "楊",
  "朱", "秦", "尤", "許", "何", "呂", "施", "張", "孔", "曹", "嚴", "華", "金", "魏", "陶", "姜",
  "戚", "謝", "鄒", "喻", "柏", "水", "竇", "章", "雲", "蘇", "潘", "葛", "奚", "范", "彭", "郎",
  "魯", "韋", "昌", "馬", "苗", "鳳", "花", "方", "俞", "任", "袁", "柳", "酆", "鮑", "史", "唐",
  "費", "廉", "岑", "薛", "雷", "賀", "倪", "湯", "滕", "殷", "羅", "畢", "郝", "鄔", "安", "常",
  "樂", "于", "時", "傅", "皮", "卞", "齊", "康", "伍", "余", "元", "卜", "顧", "孟", "平", "黃",
  "和", "穆", "蕭", "尹", "姚", "邵", "湛", "汪", "祁", "毛", "禹", "狄", "米", "貝", "明", "臧",
  "計", "伏", "成", "戴", "談", "宋", "茅", "龐", "熊", "紀", "舒", "屈", "項", "祝", "董", "梁",
  "杜", "阮", "藍", "閔", "席", "季", "麻", "強", "賈", "路", "婁", "危", "江", "童", "顏", "郭",
  "梅", "盛", "林", "刁", "鍾", "徐", "邱", "駱", "高", "夏", "蔡", "田", "樊", "胡", "凌", "霍",
  "虞", "萬", "支", "柯", "昝", "管", "盧", "莫", "經", "房", "裘", "繆", "干", "解", "應", "宗",
  "丁", "宣", "賁", "鄧", "郁", "單", "杭", "洪", "包", "諸", "左", "石", "崔", "吉", "鈕", "龔",
  "程", "嵇", "邢", "滑", "裴", "陸", "榮", "翁", "荀", "羊", "於", "惠", "甄", "麴", "家", "封",
  "芮", "羿", "儲", "靳", "汲", "邴", "糜", "松", "井", "段", "富", "巫", "烏", "焦", "巴", "弓",
  "牧", "隗", "山", "谷", "車", "侯", "宓", "蓬", "全", "郗", "班", "仰", "秋", "仲", "伊", "宮",
  "寧", "仇", "欒", "暴", "甘", "郜", "祖", "武", "符", "劉", "景", "詹", "束", "龍", "葉", "幸",
  "司", "韶", "郜", "黎", "薊", "薄", "印", "宿", "白", "懷", "蒲", "邰", "從", "鄂", "索", "咸",
  "籍", "賴", "卓", "藺", "屠", "蒙", "池", "喬", "陰", "胥", "能", "蒼", "雙", "聞", "莘", "黨",
  "翟", "譚", "貢", "勞", "逄", "姬", "申", "扶", "堵", "冉", "宰", "酈", "雍", "郤", "璩", "桑",
  "桂", "濮", "牛", "壽", "通", "邊", "扈", "燕", "冀", "郟", "浦", "尚", "農", "溫", "別", "莊",
  "晏", "柴", "瞿", "閻", "充", "慕", "連", "茹", "習", "宦", "艾", "魚", "容", "向", "古", "易",
  "慎", "戈", "廖", "庾", "終", "暨", "居", "衡", "步", "都", "耿", "滿", "弘", "匡", "國", "文",
  "寇", "廣", "祿", "闕", "東", "歐", "殳", "沃", "利", "蔚", "越", "夔", "隆", "師", "鞏", "庫",
  "聶", "晁", "勾", "敖", "融", "冷", "訾", "辛", "闞", "那", "簡", "饒", "空", "曾", "毋", "沙",
  "乜", "養", "鞠", "須", "豐", "巢", "關", "蒯", "相", "查", "後", "荊", "紅", "游", "竺", "權",
  "逯", "蓋", "益", "桓", "公", "辜",
  "歐陽", "司徒", "諸葛", "上官", "端木", "皇甫", "令狐", "澹臺", "鐘離", "公孫", "夏侯", "軒轅"
]);

const COMPOUND_SURNAMES = [
  "歐陽", "司徒", "諸葛", "上官", "端木", "皇甫", "令狐", "澹臺", "鐘離", "公孫", "夏侯", "軒轅"
];

// 法律訴訟、行政公職與親屬角色（依長度降序匹配）
const LEGAL_ROLES = [
  "原告配偶", "被告配偶", "告訴人配偶", "被害人配偶", "當事人配偶", "配偶兼承受訴訟人", "承受訴訟人",
  "選任辯護人", "指定辯護人", "特別代理人", "法定代理人", "訴訟代理人", "告訴代理人", "送達代收人", "複代理人",
  "公訴人", "上訴人", "被上訴人", "聲請人", "相對人", "抗告人", "異議人", "告訴人", "被害人", "受刑人",
  "受處分人", "受告知人", "辯護人", "審判長", "受命法官", "陪席法官", "檢察官", "書記官", "公證人", "調解委員",
  "鑑定人", "輔佐人", "債權人", "債務人", "連帶保證人", "保證人", "被繼承人", "繼承人", "受僱人",
  "具狀人", "撰狀人", "負責人", "代表人", "代理人", "董事長", "總經理", "見證人", "關係人",
  "局長", "副局長", "科長", "股長", "處長", "司長", "署長", "部長", "次長",
  "市長", "副市長", "秘書長", "副秘書長", "主任秘書", "秘書", "承辦人員", "承辦公務員", "承辦人", "總工程司", "幫工程司", "技士",
  "議員", "議長", "副議長", "立法委員", "委員", "助理", "友人", "同居人",
  "主治醫師", "主治大夫", "醫師", "院長", "護理師", "護士", "放射師", "心理師", "會計師", "建築師", "地政士", "代書",
  "原告", "被告", "法官", "證人", "配偶", "家屬", "父親", "母親",
  // 警政、公文、查詢與表單常見欄位標籤
  "姓名", "當事人姓名", "受查詢人", "查詢對象", "被查詢人", "受查人", "被查人", "受訊人"
];

// 職稱後綴
const TITLES = [
  "會計師", "建築師", "公證人", "書記官", "地政士", "檢察官", "審判長", "主治醫師", "主治大夫",
  "律師", "醫師", "法官", "教授", "院長", "主任", "大夫", "代書",
  "先生", "女士", "小姐", "君", "氏"
];

// 法律排除詞
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
  "車輛", "事故", "車禍", "撞擊", "受傷", "死亡", "骨折", "挫傷", "擦傷", "撕裂傷",
  "臺灣臺北", "臺灣高等", "臺北地檢", "臺北市政府", "都市計畫", "行政程序",
  "沈春池", "財團法人", "行政事務", "依法令", "主管事務", "土地使用", "細部計畫", "公共環境", "監察院"
]);

const VERB_SUFFIXES = new Set([
  "診", "斷", "認", "稱", "問", "告", "辯", "答", "訴", "判", "諭", "指",
  "主", "張", "請", "求", "辦", "開", "立", "涉", "犯", "遭", "被", "提",
  "到", "自", "向", "與", "及", "同", "往", "隨", "為", "退", "證", "經",
  "駕", "駛", "乘", "坐", "騎", "轉", "匯", "存", "領", "簽", "署", "具",
  "送", "受", "取", "得", "付", "給", "買", "賣", "侵", "占", "背", "信",
  "偽", "造", "毀", "損", "害", "傷", "殺", "打", "毆", "偷", "竊", "搶",
  "奪", "索", "逃", "避", "匿", "詐", "騙", "貪", "賄", "押"
]);

const CONNECTING_PARTICLES = new Set([
  "亦", "乃", "即", "均", "並", "且", "或", "復", "更", "再",
  "隨", "已", "曾", "未", "常", "定", "共", "互", "各", "自", "由", "向",
  "在", "於", "至", "與", "及", "同"
]);

// 易產生語法衝突之百家姓字（不作為獨立無前綴掃描姓氏）
const GRAMMATICAL_CHARS = new Set([
  "公", "全", "任", "利", "勞", "包", "印", "危", "古", "司", "向", "元", "充", "別", "儲",
  "冀", "常", "平", "強", "空", "解", "經", "管", "相", "方", "成", "文", "安", "東", "居",
  "國", "師", "水", "雲", "雷", "萬", "單", "石", "白", "同", "正", "自", "由", "尚", "容",
  "後", "左", "通", "邊", "長", "過", "進", "行", "受", "取", "得", "將", "隨", "中", "大",
  "小", "上", "下", "開", "關", "問", "見", "命", "令", "法", "理", "新", "老", "先", "生",
  "應", "從", "於", "支", "明", "易", "喬", "廉", "能", "信", "和", "花", "山", "谷", "車",
  "步", "都", "廣", "金", "宗", "宣", "家", "康", "懷", "施", "時", "扶", "房", "費", "樂",
  "暴", "甘", "皮", "計", "毛", "狄", "米", "伏", "麻", "路", "農", "溫", "柴", "習",
  "那", "查", "諸", "終", "蓋", "黨", "權", "衡", "符", "項", "益", "段", "雙", "索", "闕"
]);

const STANDALONE_NAME_SURNAMES = Array.from(COMMON_SURNAMES).filter(
  s => !GRAMMATICAL_CHARS.has(s) && !COMPOUND_SURNAMES.includes(s)
).sort((a, b) => b.length - a.length);

const NON_NAME_WORDS = new Set([
  "陳情", "陳述", "陳報", "陳明", "黃金", "周遭", "周全", "周旋", "周詳", "周密", "周轉",
  "何時", "何地", "何人", "何處", "何以", "何須", "何者", "何事", "何物", "何故",
  "柯案", "沈案", "彭案", "應案", "李案",
  "高層", "高等", "高度", "高達", "高額", "高價", "高階",
  "童工", "童年", "童心", "錢財", "金錢", "費用"
]);

const INVALID_NAME_ENDINGS = new Set([
  "說", "稱", "指", "述", "問", "答", "辯", "告", "認", "道", "謂", "云", "表", "示", "提", "出",
  "想", "知", "至", "往", "於", "向", "自", "與", "和", "經", "遭", "被", "因", "由", "將", "隨",
  "即", "曾", "未", "亦", "乃", "均", "並", "且", "共", "互", "各", "也", "去", "來", "到", "在",
  "返", "回", "進", "入", "借", "貸", "還", "付", "給", "收", "受", "買", "賣", "取", "領", "存",
  "匯", "轉", "簽", "署", "立", "駕", "駛", "乘", "開", "騎", "行", "走", "住", "居", "生", "死",
  "亡", "傷", "殺", "害", "打", "毆", "偷", "竊", "涉", "犯", "前", "往", "他", "她", "其", "等",
  "之", "的", "得", "地", "了", "著", "過", "是", "有", "無", "非", "副", "長", "官", "員", "董",
  "師", "君", "老", "先", "案",
  ...Array.from(VERB_SUFFIXES),
  ...Array.from(CONNECTING_PARTICLES)
]);

const FOLLOW_CHARS = new Set(Array.from(
  "及暨說稱指述問答辯告認道謂云表示提出想知至往於向自與和經遭被因由將隨即曾未亦乃均並且共互各也去來到在返回進入借貸還付給收受買賣取領存匯轉簽署立駕駛乘開騎行走住居生死亡傷殺害打毆偷竊涉犯前往他她其等之，、。；：！？（()[]\\n\\r " +
  "·・•‧●○:;,\t/／|｜\\~～-_—「」『』“”\"'《》〈〉【】〔〕{}（）()"
));

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
  "病歷號": 85,
  "統一編號": 80,
  "手機": 75,
  "電話": 70,
  "電子郵件": 70,
  "IP位址": 65,
  "車牌號": 65,
  "地號建號": 60,
  "地址": 55,
  "醫療機構": 45,
  "法院遮蔽代號": 40,
  "出生年月日": 35,
  "訴訟關係人": 30,
  "自然人": 20
};

// ---------------------------------------------------------------------------
// 法律語義邊界演算法（Hard Immunity / 動態職銜 / 否定語法檢驗 / 頭部錨定）
// 與 Python 端 src/deid/rules/person_ner.py 同步實作
// ---------------------------------------------------------------------------

// 以姓氏起頭、實為一般詞彙的字串（詞典衍生），不得視為人名
const COMMON_WORDS = new Set((
  "丁卯 于是 井冈山 井口 仇人 仇恨 仰慕 仰望 仲裁 任何 任何人 任免 任免权 任务 任命 任性 任意 任意球 任教 任期 任用 任由 任职 伊利 伊斯兰 " +
  "伊朗 伊犁 何不 何事 何人 何以 何况 何在 何处 何如 何尝 何必 何故 何方 何时 何用 何种 何等 何者 何苦 余万 余万元 余下 余亩 余地 " +
  "余处 余家 余年 余种 余米 余脉 余部 余额 元代 元件 元大都 元年 元旦 元朝 元气 元素 元首 充任 充军 充分 充实 充当 充斥 充沛 充满 " +
  "充电 充裕 充足 全世界 全书 全会 全体 全党 全军 全力 全区 全县 全国 全国性 全场 全城 全境 全天 全天候 全家 全局 全岛 全州 全市 全年 " +
  "全文 全新 全方位 全景 全权 全村 全校 全歼 全民 全然 全球 全球化 全球性 全球通 全盘 全省 全真 全称 全程 全线 全能 全身 全过程 全邦 全部 " +
  "全都 全长 全队 全集 全面 公主 公事 公交 公人 公众 公众网 公众股 公使 公元 公元前 公公 公共 公关 公凸 公办 公务 公务员 公司 公司法 公告 " +
  "公园 公国 公子 公孙 公安 公安局 公安部 公室 公家 公寓 公差 公布 公平 公开 公式 公报 公文 公斤 公有 公有制 公案 公款 公正性 公民 公然 " +
  "公爵 公牛 公理 公生桥 公用 公益 公益性 公社 公私 公积金 公立 公约 公职 公认 公证 公路 公路桥 公路网 公道 公里 公顷 公馆 公鸡 冀求 冷冷的 " +
  "冷却 冷战 冷气 冷水 冷淡 冷漠 冷落 冷酷 冷门 冷静 凌晨 利于 利亚 利刃 利器 利害 利川市 利息 利息率 利比亚 利润 利润率 利物浦 利率 利用 " +
  "利用率 利益 利税 勾当 勾结 包含 包围 包扎 包括 包机 包袱 包装 包裹 包金 卓著 印刷 印尼 印度 印度人 印度教 印度河 印度洋 印欧语 印章 印第安 " +
  "印记 印证 印象 危亡 危及 危品 危害 危急 危机 危险 危险性 危难 古三国 古人 古人类 古今 古代 古典 古城 古墓 古墓群 古尸 古山 古巴 古希腊 " +
  "古怪 古时 古月 古朴 古物 古玩 古琴台 古称 古籍 古罗马 古诗 古迹 古都 古镇 史书 史册 史学 史学家 史料 史方 史籍 史记 司令 司令员 司令部 " +
  "司徒 司机 司法 司法部 司空 司长 吉利 吉林省 吉象 吉象牌 向上 向下 向前 向导 向往 向来 向着 向量 吳顧 吳顧問 周一 周三 周二 周五 周代 " +
  "周六 周刊 周到 周四 周围 周坤仁 周家 周岁 周年 周恩来 周日 周期 周期性 周末 周身 周边 周长 和丰 和县 和平 和田 和约 和解 和谈 和谐 " +
  "咸丰 咸丰县 咸宁 咸宁市 咸安区 咸阳 唐代 唐宋 唐朝 單前後 單附件 堵住 堵塞 堵截 夏商周 夏天 夏季 夏日 季度 季梁 季节 季节性 季风 季风性 安七州 " +
  "安乡 安全 安全局 安内 安南 安宁 安定 安定性 安定门 安庆 安徽 安徽省 安心 安息 安慰 安排 安放 安歇 安理会 安稳 安置 安葬 安装 安阳 安陆 " +
  "安陆市 安顿 宋代 宋朝 宗人府 宗室 宗教 宗族 宗旨 宗法 宗派 宣传 宣傳 宣告 宣布 宣战 宣扬 宣称 宣统 宣誓 宣讲会 宣读 宦官 宰牲亭 宰相 " +
  "家丁 家业 家中 家主 家乡 家产 家人 家伙 家具 家务 家园 家境 家家 家属 家庙 家庭 家当 家教 家族 家电 家畜 家禽 家里 家长 家门 " +
  "家门口 容器 容忍 容易 容水量 容积 容许 容貌 容量 宿主 宿舍 富于 富人 富农 富含 富强 富户 富有 富水 富裕 富贵 富集 富饶 封冻 封口 " +
  "封存 封建 封闭 封闭式 封面 尚且 尚书 尚可 尚无 尚有 尚未 尤为 尤其 居中 居于 居住 居士 居多 居委会 居民 居然 居留 屈原 屈服 屈辱 " +
  "屠刀 屠杀 山上 山下 山丘 山东 山东省 山中 山体 山前 山势 山区 山南 山口 山地 山坡 山墙 山头 山寨 山岭 山峰 山川 山庄 山影 山林 " +
  "山水 山沟 山河 山洞 山海关 山石 山羊 山羊肉 山脉 山脚下 山自西 山西 山西省 山谷 山路 山道 山里 山野 山镇 山门 山间 山顶 山麓 左侧 左右 " +
  "左岸 左手 左派 左脚 左腿 左臂 左边 巫山 巴不得 巴东 巴东县 巴拉圭 巴拿马 巴比伦 巴西 巴西队 巴黎 師法 席位 席卷 常人 常任 常住 常务 常委 " +
  "常委会 常州 常常 常年 常数 常有 常用 常绿 常见 常规 常规赛 常言道 常设 常识 常驻 干事 干什么 干净 干吗 干尸 干扰 干旱 干活 干流 干涉 " +
  "干燥 干粮 干系 干线 干脆 干贝 干部 干重 干面 干预 平儿 平凡 平原 平反 平台 平和 平地 平均 平坦 平壤 平安 平定 平常 平平 平底 " +
  "平庸 平息 平整 平方 平方米 平日 平时 平板 平民 平津 平淡 平生 平稳 平等 平米 平素 平缓 平行 平衡 平遥 平静 平面 幸亏 幸好 幸福 " +
  "幸而 幸运 廉价 廉洁 弓箭 彭副 後才發 徐州 徐海 慎重 應於 應申報 成为 成书 成交 成交量 成亲 成人 成像 成分 成功 成功率 成化 成名 成员 " +
  "成员国 成品 成因 成型 成天 成婚 成就 成年 成年人 成形 成排 成效 成文 成方 成本 成果 成熟 成立 成绩 成群 成色 成虫 成行 成败 成都 " +
  "成都市 成长 房中 房产 房价 房县 房地产 房基 房子 房屋 房舍 房里 房门 房间 扶持 扶植 扶贫 支书 支付 支出 支持 支援 支撑 支架 支柱 " +
  "支气管 支流 支票 支线 支行 支部 支配 支队 文中 文书 文人 文件 文体 文凭 文化 文化史 文化局 文化层 文化路 文化部 文华 文史 文坛 文字 文学 " +
  "文学史 文学家 文官 文峰 文工团 文帝 文库 文教 文昌市 文本 文汇 文物 文献 文盲 文科 文章 文职 文联 文臣 文艺 文选 文集 文革 方丈 方位 " +
  "方便 方可 方向 方圆 方城 方始 方式 方形 方才 方案 方法 方法论 方略 方程 方解石 方言 方针 方面 方面军 於前揭 於審 於該日 施主 施加 施壓 " +
  "施展 施工 施用量 施行 明亮 明代 明儿 明史 明器 明天 明年 明教 明日 明明 明显 明晃晃 明月 明朝 明末 明清 明知 明确 易于 易明細 時任 " +
  "時期 景区 景山 景点 景物 景致 景色 景观 景象 暴力 暴动 暴徒 暴行 暴躁 暴雨 暴露 曾经 曾都区 朱漆 束缚 杭州 杭汉 松山 松开 松弛 " +
  "松手 松散 松林 松林山 松江 松滋 松滋市 松花 松花江 松软 林业 林中 林兆枢 林区 查出 查处 查找 查核 查核報 查理 查看 查询 查阅 柴油 柴油机 " +
  "樊城区 權力 權益 權限 步伐 步入 步兵 步兵师 步子 步枪 步步 步行 步骤 武力 武器 武士 武备 武大 武官 武将 武当 武当山 武昌 武昌区 武术 " +
  "武汉 武汉市 武汉队 武穴市 武职 武艺 武装 武警 武陵 武陵山 武麻 毛尖 毛病 毛皮 毛笔 水上 水下 水中 水乡 水产 水产业 水产品 水产局 水位 水体 " +
  "水军 水准 水分 水利 水力 水土 水域 水声 水壶 水师 水平 水库 水底 水性 水手 水文 水族 水晶 水果 水泡 水泥 水泵 水洞 水流 水深 " +
  "水温 水源 水源地 水溶液 水生 水电 水电站 水稻 水系 水肿 水能 水草 水解 水质 水资源 水路 水运 水道 水量 水银 水陆 水雷 水面 江东 江中 " +
  "江北 江南 江南西 江城 江夏 江夏区 江家岔 江山 江岸区 江底 江段 江水 江汉 江汉区 江河 江流 江浙 江海 江淮 江湖 江猪 江苏 江苏省 江西 江西省 " +
  "江豚 江边 江道 江阴 江陵 江陵县 江面 池塘 池河 池际尚 汲取 沈阳 沙俄 沙包 沙发 沙口 沙咀 沙土 沙子 沙市 沙市区 沙市市 沙河 沙洋县 沙洲 " +
  "沙湖 沙湾 沙漠 沙鱼 洪山区 洪流 洪涝 洪湖市 浦东 游人 游击 游击战 游击队 游动 游历 游子 游客 游戏 游戏机 游泳 游牧 游玩 游离 游荡 游行 " +
  "游街 游览 游记 滑稽 滿千元 滿足民 焦山河 焦急 焦点 焦虑 焦躁 燕京 燕山 牛奶 牛市 牛皮 牛筋 牛肉 牛车 牧业 牧区 牧场 牧师 牧民 牧草 " +
  "王位 王国 王室 王家 王者 班主任 班子 班级 班长 甘心 甘愿 甘泉 甘肃 甘肃省 甘蔗 甘薯 田地 田径 田间 申報 申報時 申报 申花 申花队 申诉 " +
  "申请 畢竟 白人 白夜 白天 白嫩 白家 白带 白族 白果 白沙洲 白洋 白纸 白细胞 白色 白菜 白血病 白衣 白酒 白马 白骨 白鳍豚 皮下 皮子 皮层 " +
  "皮毛 皮球 皮肉 皮肤 皮质 皮革 皮鞋 盛产 盛京 盛会 盛名 盛大 盛开 盛行 相互 相交 相会 相传 相伴 相似 相信 相关 相助 相反 相同 " +
  "相处 相宜 相容 相对 相对论 相差 相干 相应 相异 相当 相当于 相待 相持 相接 相救 相望 相机 相比 相称 相符 相等 相繼 相继 相聚 相见 " +
  "相识 相貌 相距 相近 相连 相通 相逢 相遇 相邻 相间 相隔 石兽 石刻 石化 石匠 石华堰 石器 石块 石墨 石壁 石头 石子 石安 石室 石料 " +
  "石板 石桥 石棉 石榴石 石油 石湖 石灰 石灰岩 石灰石 石牌岭 石碑 石窟 石膏 石膏矿 石门 石雕 石首 石首市 祖上 祖国 祖坟 祖师 祖父 祖籍 祝愿 " +
  "秋天 秋季 秋审 秦国 秦家洲 秦属南 秦腔 程序 程序上 程度 程志 穆斯林 空中 空军 空前 空地 空姐 空战 空手 空投 空气 空洞 空白 空缺 空荡荡 " +
  "空虚 空袭 空调 空运 空间 空降 空降兵 空隙 章程 童年 童装 童话 符号 符合 符號 管事 管制 管子 管家 管教 管理 管理员 管理局 管理层 管理权 " +
  "管理者 管线 管辖 管道 簡報 簡訊 米业 米兰 米饭 紀方 紀錄 索取 索性 索資 終而 經大 羊毛 羊皮 羊肉 胡乱 胡须 能力 能否 能够 能源 " +
  "能级 能耐 能量 舒展 舒服 舒畅 舒适 艾滋病 花儿 花卉 花厅 花园 花坛 花山 花木 花朵 花样 花灯 花瓣 花生 花粉 花纹 花色 花草 花菇 " +
  "花费 花钱 花鸟 苗族 范围 茅屋 茅箭区 莫不 莫名 莫大 莫过于 莫非 萬元正 葛洲坝 董事 董事会 董事长 董家 蒙古 蒙古国 蒙古族 蒙古语 蓋章 蔡甸区 薄弱 " +
  "薄膜 融入 融化 融合 融洽 融资 衡山 衡諸 衡酌 衡量 解体 解决 解剖 解围 解开 解放 解放军 解放区 解放后 解放路 解救 解散 解析 解毒 解答 " +
  "解脱 解说 解读 解释 解除 解题 諸如 謝謝 謝謝您 谷主 谷地 谷城 谷城县 谷子 谷底 谷物 貢獻 越南 越发 越国 越是 越来越 越野 路上 路口 " +
  "路子 路径 路旁 路桥 路灯 路程 路线 路边 路过 路途 路面 辛苦 辜负 通俗 通信 通史 通向 通告 通商 通城 通城县 通天 通宵 通山县 通州 " +
  "通常 通往 通报 通用 通知 通称 通红 通缉 通航 通行 通衢 通讯 通讯员 通讯社 通话 通货 通车 通过 通道 通风 通高 連結 邢台 那个 那么 " +
  "那些 那会儿 那位 那個 那儿 那双 那场 那大 那天 那年 那日 那时 那時候 那末 那条 那样 那根 那次 那段 那种 那般 那边 那里 那马 郁闷 " +
  "都城 都察院 都市 都督 都督府 都统 鄂三州 鄂东 鄂南 鄂城区 鄂州 鄂州市 鄂皖 鄂西 鄂西北 鄂豫皖 金丝 金丝猴 金代 金元 金冠 金利 金华 金台 金子 " +
  "金属 金星 金正日 金沙江 金牌 金牙 金箔 金色 金花 金蛇 金融 金轮 金针 金钱 金银 金锣 金额 金黄色 闕如 關說 陳情書 陳請人 陶器 陶瓷 隆中 " +
  "隆冬 隆庆 隆起 隆重 隆隆 雙方 雷击 雷电 項目 須接 顧問 顧問而 高一 高中 高举 高于 高亢 高产 高价 高位 高低 高兴 高出 高分 高分子 " +
  "高利贷 高压 高原 高台 高呼 高地 高声 高处 高大 高官 高家 高尚 高层 高山 高山族 高峰期 高度 高手 高效 高新 高校 高档 高检 高法 高涨 " +
  "高温 高炮 高程 高空 高端 高等 高粱 高级 高考 高职 高能 高血压 高贵 高速 高铁 高频 高额 高高 高龄 麻城市 麻将 麻布 麻烦 麻痹 麻糖 " +
  "麻袋 麻辣酱 麻雀 黃台 黃局長 黃金級 黎族 黨務 黨派 龍局長"
).split(" "));

const EXTRA_TITLES = [
  "機要秘書", "代理局長", "代理課長", "代理科長", "代理處長", "代理組長", "代理主任",
  "會計", "出納", "稽查", "課員", "科員", "專員", "組長", "課長", "司機", "經理", "副總經理", "副總",
  "董事", "監察人", "理事長", "校長", "廠長", "工程師", "技師", "護理長", "里長", "村長",
  "主任", "主計", "承辦員", "辦事員", "業務員", "職員", "員工", "受判決人", "受判決人即被告",
  "代表", "股東", "出資人", "實際負責人", "實際經營者", "登記負責人"
];

// 句型連接詞：允許夾在職銜與姓名之間（身份疊加、主觀陳述等）
const ROLE_FILLERS = ["即", "兼", "又名", "暨", "明知", "知悉", "並", "亦", "仍", "而", "與", "及", "之"];

// 硬性免疫：法律專用語、訴訟名詞。人名不得與其重疊
const IMMUNE_REGEXES = [
  /應受(?:無罪|有罪|免刑|免訴|刑之宣告|科刑|緩刑)?(?:之)?(?:判決|宣告|裁判)?/g,
  /(?:無罪|有罪|免訴|免刑|不受理|管轄錯誤)(?:之)?(?:判決|裁判)?/g,
  /(?:轉帳|現金|匯款|提款|匯出|匯入)支出?/g,
  /[（(]下稱[^）)\n]{1,20}[）)]/g,
  /[（(]以下(?:簡)?稱[^）)\n]{1,20}[）)]/g,
  /[（(]下同[）)]/g
];
const ALIAS_RE = /[（(](?:以?下)(?:簡)?稱([^）)\n]{1,20})[）)]/g;

const IMMUNE_TERMS = [
  "明知", "應受", "應予", "應認", "應得", "足認", "認定", "認為", "受判決人", "受有罪", "受無罪",
  "得為", "得使", "得以", "准予", "准許", "駁回", "判處", "判決", "裁定", "不得", "不應",
  "知悉", "處罰", "處以", "處分", "轉帳", "現金", "免訴", "免刑", "無罪", "有罪",
  "利益", "申請", "聲請", "須知", "經查", "按再審", "核與", "是否", "依據", "依照",
  "高等法院", "地方法院", "最高法院"
];

// 否定語法檢驗：法律助動詞 / 審理動詞不得作為姓氏以外的人名成分
const VETO_NAME_CHARS = new Set(Array.from("應得知受處判准駁認"));
const VETO_END_CHARS = new Set(Array.from("應得知受處判准駁認罪刑訴案行款帳戶長師員官者性度的人司會條項款號類件書單表率化面方期間所事物"));
// 一般語詞用字：不得出現在姓氏之後的名字位置（功能詞、代名詞、連接詞）
const NON_GIVEN_CHARS = new Set(Array.from("於之以及與或而不並是有為其此該這那個的了就都也所出均另等未我你他您們係須"));

const CUE_PREFIXES = [
  "查詢", "詢問", "詢據", "傳喚", "訊問", "約談", "通知", "委託", "交予", "交付予", "指示", "探詢",
  "之子", "之妻", "之夫", "之女", "之父", "之母", "之弟", "之兄", "之姐", "之妹", "之友",
  "函附", "開立", "會同", "偕同", "轉交", "匯予", "匯款予", "轉帳予", "借予", "借款予", "致贈", "告知因", "告知",
  "清查", "稽查", "受查", "受詢", "查獲", "查得", "查訪", "對象", "姓名", "當事人姓名", "受查詢人", "被查詢人", "受處分人", "被查人", "受訊人", "查"
];

const CJK_RUN = /^[\u4e00-\u9fa5]+/;
const CJK_ALL = /^[\u4e00-\u9fa5]+$/;
const ROLE_NAMES_ALL = Array.from(new Set([...LEGAL_ROLES, ...EXTRA_TITLES])).sort((a, b) => b.length - a.length);
const ROLE_ALT_SPACED = ROLE_NAMES_ALL.map(r => Array.from(r).join("[ \\u3000]*")).join("|");
const ROLE_ALT_PLAIN = ROLE_NAMES_ALL.join("|");
const FILL_ALT = [...ROLE_FILLERS].sort((a, b) => b.length - a.length).join("|");

const ROLE_PERSON_RE = new RegExp(`(${ROLE_ALT_SPACED})(?:(?:${FILL_ALT})|(?:${ROLE_ALT_PLAIN}))*[：:\\s\\u3000]*([\\u4e00-\\u9fa5]{2,6})`, "g");
const HEADER_RE = new RegExp(`^[ \\u3000]*(${ROLE_ALT_SPACED})[ \\u3000：:]+([\\u4e00-\\u9fa5]{2,4})(?=[ \\u3000（(，,、\\r\\n]|$)`, "gm");
const SINGLE_SURNAMES = Array.from(COMMON_SURNAMES).filter(x => x.length === 1);
const CUE_RE = new RegExp(`(?:${[...CUE_PREFIXES].sort((a, b) => b.length - a.length).join("|")})[：:\\s\\u3000]*(?=[${SINGLE_SURNAMES.join("")}]|${COMPOUND_SURNAMES.join("|")})`, "g");
const CHAIN_DELIM_RE = /^[ \t\u3000]*[及與和、暨·・•‧●/／,，][ \t\u3000]*/;

const _PUNCT_CLASS = ",，、。；;：:！？!?（()\\[\\]{}〔〕「」『』“”\"'《》〈〉【】\\s\\r\\n\\t·・•‧●○|｜/／\\\\~～\\-_—";
const STANDALONE_PREFIXES = [
  "告知因", "告知", "通知", "獲悉", "據悉", "傳聞", "向", "至", "自", "於", "與", "和", "叫", "見", "由",
  "命", "令", "委", "同", "及", "找", "代", "之", "依", "隨", "經", "遭", "被", "因", "給", "另", "請",
  "使", "讓", "派", "借", "欠", "問", "詢", "連同", "偕同", "陪同"
];
const _STANDALONE_PREFIX_ALT = [...STANDALONE_PREFIXES].sort((a, b) => b.length - a.length).join("|");
const STANDALONE_RE_SRC = `(?:^|[${_PUNCT_CLASS}]|(?:${_STANDALONE_PREFIX_ALT}))(${STANDALONE_NAME_SURNAMES.join("|")})`;
const TITLE_SUFFIX_SRC = `(${Array.from(COMMON_SURNAMES).sort((a, b) => b.length - a.length).join("|")})([\\u4e00-\\u9fa5]{1,2})(${TITLES.join("|")})`;

const TAIWAN_BANKS = [
  "合作金庫", "合庫", "第一銀行", "一銀", "華南銀行", "華銀", "彰化銀行", "彰銀",
  "兆豐銀行", "兆豐", "臺灣銀行", "台銀", "土地銀行", "土銀", "國泰世華", "世華",
  "台北富邦", "富邦銀行", "富邦", "中國信託", "中信銀", "中信", "玉山銀行", "玉山",
  "台新銀行", "台新", "中華郵政", "郵局", "永豐銀行", "永豐", "聯邦銀行", "聯邦",
  "元大銀行", "元大", "凱基銀行", "凱基", "新光銀行", "新光", "上海商銀", "上海商業儲蓄銀行",
  "遠東銀行", "遠東商銀", "渣打銀行", "渣打", "匯豐銀行", "匯豐", "星展銀行", "星展",
  "王道銀行", "王道", "LINE Bank", "連線銀行", "將來銀行", "樂天銀行",
  "高雄銀行", "高銀", "台中銀行", "京城銀行", "陽信銀行", "板信商銀", "華泰銀行", "三信商銀",
  "農會", "漁會", "信用合作社", "信合社"
];
const _BANK_ALT = [...TAIWAN_BANKS].sort((a, b) => b.length - a.length).join("|");
const BANK_HOLDER_RE = new RegExp(`(?:${_BANK_ALT})[,，\\s\\t:：]+(?:戶名[,，\\s\\t:：]*)?([\\u4e00-\\u9fa5]{2,4})(?=[,，\\s\\t·/／0-9]|$)`, "g");

const STOPPERS = new Set([...VERB_SUFFIXES, ...CONNECTING_PARTICLES, ...Array.from("之的等及暨和")]);

function startsWithTitle(s) {
  return TITLES.some(t => s.startsWith(t));
}

function extractNameFromCandidate(candidateText, strict = true) {
  const m0 = CJK_RUN.exec(candidateText || "");
  if (!m0) return null;
  candidateText = m0[0].substring(0, 8);

  let surname = COMPOUND_SURNAMES.find(cs => candidateText.startsWith(cs)) || null;
  if (!surname && COMMON_SURNAMES.has(candidateText[0])) surname = candidateText[0];
  if (!surname) return null;

  const sLen = surname.length;
  for (const l of [sLen + 2, sLen + 1]) {
    if (candidateText.length < l) continue;
    const nameCand = candidateText.substring(0, l);
    const after = candidateText.substring(l);
    if (LEGAL_EXCLUDE_WORDS.has(nameCand) || NON_NAME_WORDS.has(nameCand) || COMMON_WORDS.has(nameCand)) continue;
    if (STOPPERS.has(nameCand[nameCand.length - 1]) || Array.from(nameCand.substring(sLen, nameCand.length - 1)).some(c => NON_GIVEN_CHARS.has(c) || "暨和".includes(c))) continue;
    if (l === sLen + 2 && (startsWithTitle(candidateText.substring(sLen)) || startsWithTitle(candidateText.substring(sLen + 1)))) continue;
    if (startsWithTitle(after) || !after || STOPPERS.has(after[0])) return nameCand;
    if (l === sLen + 2 && !strict && !GRAMMATICAL_CHARS.has(surname)) return nameCand;
  }

  if (!strict && !GRAMMATICAL_CHARS.has(surname) && candidateText.length >= sLen + 1) {
    const cand = candidateText.substring(0, sLen + 1);
    if (!LEGAL_EXCLUDE_WORDS.has(cand) && !NON_NAME_WORDS.has(cand) && !STOPPERS.has(cand[cand.length - 1])) {
      return cand;
    }
  }
  return null;
}

function buildImmuneMask(text) {
  const mask = new Uint8Array(text.length);
  const mark = (a, b) => { for (let k = a; k < b; k++) mask[k] = 1; };
  for (const rx of IMMUNE_REGEXES) {
    for (const m of text.matchAll(rx)) {
      if (m[0].length > 0) mark(m.index, m.index + m[0].length);
    }
  }
  const markAll = (term) => {
    let idx = text.indexOf(term);
    while (idx !== -1) {
      mark(idx, idx + term.length);
      idx = text.indexOf(term, idx + term.length);
    }
  };
  for (const term of IMMUNE_TERMS) markAll(term);
  for (const role of LEGAL_ROLES) {
    if (role.length >= 3) markAll(role);
  }
  const aliases = new Set();
  for (const m of text.matchAll(ALIAS_RE)) aliases.add(m[1].trim());
  for (const alias of aliases) {
    if (alias.length < 2 || !CJK_ALL.test(alias)) continue;
    markAll(alias);
  }
  return mask;
}

// 回傳自然人 / 訴訟關係人候選 span（type: "訴訟關係人" | "自然人"）
function extractPersonSpans(text) {
  const spans = [];
  const knownPersons = new Map();
  const n = text.length;
  const immune = buildImmuneMask(text);
  const occupied = new Uint8Array(n);
  const trustedNames = new Set();

  const anySet = (mask, a, b) => {
    for (let k = a; k < b; k++) if (mask[k]) return true;
    return false;
  };
  const isCompound = (name) => COMPOUND_SURNAMES.includes(name.substring(0, 2));

  const validName = (name, a, b, trusted = false) => {
    if (name.length < 2 || name.length > 4 || !CJK_ALL.test(name)) return false;
    if (LEGAL_EXCLUDE_WORDS.has(name) || NON_NAME_WORDS.has(name)) return false;
    if (!trusted && COMMON_WORDS.has(name)) return false;
    if (anySet(immune, a, b)) return false;
    if (!trusted) {
      const sl = isCompound(name) ? 2 : 1;
      if (VETO_END_CHARS.has(name[name.length - 1])) return false;
      for (const c of name.substring(sl)) {
        if (VETO_NAME_CHARS.has(c) || NON_GIVEN_CHARS.has(c)) return false;
      }
    }
    return true;
  };

  const add = (a, b, name, type, role, trusted = false) => {
    if (!validName(name, a, b, trusted) || anySet(occupied, a, b)) return false;
    spans.push({ start: a, end: b, text: name, type, role: role || undefined });
    for (let k = a; k < b; k++) occupied[k] = 1;
    if (!knownPersons.get(name)) knownPersons.set(name, role || "關係人");
    return true;
  };

  const resolve = (name) => {
    if (name) {
      for (const k of trustedNames) {
        if (name !== k && name.startsWith(k) && name.length - k.length <= 1) return k;
      }
    }
    return name;
  };

  const chain = (end, role, strict = true) => {
    while (end < n) {
      const rest = text.substring(end);
      const mDelim = CHAIN_DELIM_RE.exec(rest);
      if (!mDelim || mDelim.index !== 0) break;
      const delimLen = mDelim[0].length;
      const name = resolve(extractNameFromCandidate(text.substring(end + delimLen, end + delimLen + 8), strict));
      if (!name) return;
      const a = end + delimLen;
      const type = role ? "訴訟關係人" : "自然人";
      if (!add(a, a + name.length, name, type, role)) return;
      end = a + name.length;
    }
  };

  // 0. 判決/書狀頭部錨定：權威當事人
  const head = text.substring(0, 4000);
  for (const m of head.matchAll(HEADER_RE)) {
    const role = m[1].replace(/[\s\u3000]+/g, "");
    const cand = m[2];
    const name = extractNameFromCandidate(cand) || cand;
    if (name && (COMMON_SURNAMES.has(name[0]) || COMPOUND_SURNAMES.some(c => name.startsWith(c)))) {
      const a = m.index + m[0].lastIndexOf(cand);
      if (add(a, a + name.length, name, "訴訟關係人", role, true)) trustedNames.add(name);
    }
  }

  // 1. 動態職銜 + 複合公文句式
  ROLE_PERSON_RE.lastIndex = 0;
  let m;
  while ((m = ROLE_PERSON_RE.exec(text)) !== null) {
    const roleRaw = m[1].replace(/[\s\u3000]+/g, "");
    const isNameField = ["姓名", "當事人姓名", "名"].includes(roleRaw);
    const role = isNameField ? null : roleRaw;
    const type = isNameField ? "自然人" : "訴訟關係人";
    const a = m.index + m[0].length - m[2].length;
    const name = resolve(extractNameFromCandidate(text.substring(a, a + 8), false));
    if (!name) continue;
    if (add(a, a + name.length, name, type, role)) {
      chain(a + name.length, role);
    }
  }

  // 1b. 銀行/行庫名稱引導之戶名（交易明細，如「合庫,李大山,123456789」或「第一銀行,張木川,」）
  BANK_HOLDER_RE.lastIndex = 0;
  while ((m = BANK_HOLDER_RE.exec(text)) !== null) {
    const cand = m[1];
    const name = resolve(extractNameFromCandidate(cand, false)) || cand;
    if (name && (COMMON_SURNAMES.has(name[0]) || COMPOUND_SURNAMES.some(cs => name.startsWith(cs)))) {
      const a = m.index + m[0].lastIndexOf(cand);
      if (add(a, a + name.length, name, "自然人", null)) {
        chain(a + name.length, null, false);
      }
    }
  }

  // 2. 獨立複姓人名
  const compoundRe = new RegExp(`(${COMPOUND_SURNAMES.join("|")})([\\u4e00-\\u9fa5]{1,4})`, "g");
  while ((m = compoundRe.exec(text)) !== null) {
    const name = resolve(extractNameFromCandidate(text.substring(m.index, m.index + 8)));
    if (name) add(m.index, m.index + name.length, name, "自然人", null);
  }

  // 3. 姓氏 + 職稱（黃國昌律師）
  const titleRe = new RegExp(TITLE_SUFFIX_SRC, "g");
  let pos = 0;
  while (true) {
    titleRe.lastIndex = pos;
    m = titleRe.exec(text);
    if (!m) break;
    if (GRAMMATICAL_CHARS.has(m[1])) { pos = m.index + 1; continue; }
    const name = m[1] + m[2];
    add(m.index, m.index + name.length, name, "自然人", "專業人士");
    pos = m.index + m[0].length;
  }

  // 4. 頓號 / 間隔號 / 斜線列舉（例：張木川·張美花 或 張三、李四）
  const enumRe = /(?:[\u4e00-\u9fa5]{2,3}[、·・•‧/／])+[\u4e00-\u9fa5]{2,3}/g;
  while ((m = enumRe.exec(text)) !== null) {
    const items = m[0].split(/[、·・•‧/／]/);
    const allNames = items.length >= 2 && items.every(it =>
      (it.length === 2 || it.length === 3) &&
      (COMMON_SURNAMES.has(it[0]) || COMPOUND_SURNAMES.some(cs => it.startsWith(cs))) &&
      !LEGAL_EXCLUDE_WORDS.has(it)
    ) && (items.some(it => knownPersons.has(it)) || (items.length >= 2 && items.every(it => COMMON_SURNAMES.has(it[0]))));
    if (allNames) {
      let offset = 0;
      for (const it of items) {
        const p = m[0].indexOf(it, offset);
        offset = p + it.length;
        add(m.index + p, m.index + p + it.length, it, "自然人", null);
      }
    }
  }

  // 5. 句中無稱謂：動詞與查詢線索（查：張木川、查詢郭敏及郭莉娟）
  CUE_RE.lastIndex = 0;
  while ((m = CUE_RE.exec(text)) !== null) {
    const a = m.index + m[0].length;
    const name = resolve(extractNameFromCandidate(text.substring(a, a + 8), false));
    if (name && add(a, a + name.length, name, "自然人", null)) {
      chain(a + name.length, null, false);
    }
  }

  // 6. 獨立單姓無前綴或常規前導詞姓名
  const standaloneRe = new RegExp(STANDALONE_RE_SRC, "g");
  while ((m = standaloneRe.exec(text)) !== null) {
    const si = m.index + m[0].length - m[1].length;
    let matched = null;
    for (const length of [3, 2]) {
      const ei = si + length;
      if (ei <= n) {
        const cand = text.substring(si, ei);
        if (!CJK_ALL.test(cand)) continue;
        if (INVALID_NAME_ENDINGS.has(cand[cand.length - 1]) || LEGAL_EXCLUDE_WORDS.has(cand) || NON_NAME_WORDS.has(cand)) continue;
        const nc = ei < n ? text[ei] : "";
        if (length === 3) {
          if (!nc || /\s/.test(nc) || FOLLOW_CHARS.has(nc) || !COMMON_SURNAMES.has(nc)) {
            matched = cand;
            break;
          }
        } else if (length === 2) {
          if (!nc || /\s/.test(nc) || FOLLOW_CHARS.has(nc)) {
            matched = cand;
            break;
          }
        }
      }
    }
    if (matched) add(si, si + matched.length, matched, "自然人", "關係人");
  }

  // 7. 全局傳播（較長姓名優先；不得切入免疫區或已標記區）
  const known = Array.from(knownPersons.entries()).sort((a, b) => b[0].length - a[0].length);
  for (const [name, role] of known) {
    if (name.length < 2) continue;
    let idx = text.indexOf(name);
    while (idx !== -1) {
      const e = idx + name.length;
      if (!anySet(occupied, idx, e) && !anySet(immune, idx, e)) {
        spans.push({ start: idx, end: e, text: name, type: "訴訟關係人", role: role || "關係人" });
        for (let k = idx; k < e; k++) occupied[k] = 1;
      }
      idx = text.indexOf(name, e);
    }
  }
  return spans;
}

class DeidEngine {
  constructor(options = {}) {
    this.keepCityPrefix = options.keepCityPrefix !== undefined ? options.keepCityPrefix : true;
    this.maskAllDates = options.maskAllDates || false;
  }

  detectEntities(text, extraSpans = null, externalEntities = null, mappingStore = null) {
    const spans = [];

    // 1. 身分證號 (Rule 01)
    const idRegex = /(?<![A-Za-z0-9])([A-Z][1289]\d{8})(?![A-Za-z0-9])/g;
    let m;
    while ((m = idRegex.exec(text)) !== null) {
      const rawId = m[1];
      const valid = isValidTaiwanID(rawId);
      spans.push({
        start: m.index,
        end: m.index + rawId.length,
        text: rawId,
        type: "身分證號",
        valid: valid
      });
    }

    // 外來人口居留證號 (Rule 02)
    const permitRegex = /(?<![A-Za-z0-9])([A-Z][A-D89]\d{8})(?![A-Za-z0-9])/g;
    while ((m = permitRegex.exec(text)) !== null) {
      const rawStr = m[1];
      if (!isValidTaiwanID(rawStr)) {
        spans.push({
          start: m.index,
          end: m.index + rawStr.length,
          text: rawStr,
          type: "居留證號"
        });
      }
    }

    // 護照號碼
    const passportRegex = /(?:護照(?:號碼|號)?)[：:\s]*\b([A-Z0-9]{8,10})\b/gi;
    while ((m = passportRegex.exec(text)) !== null) {
      const offset = m[0].indexOf(m[1]);
      spans.push({
        start: m.index + offset,
        end: m.index + offset + m[1].length,
        text: m[1],
        type: "護照號"
      });
    }

    // 2. 金融與財稅
    const creditCardRegex = /(?<!\d)(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})(?!\d)/g;
    while ((m = creditCardRegex.exec(text)) !== null) {
      const rawStr = m[1];
      const digitsOnly = rawStr.replace(/\D/g, '');
      if (digitsOnly.length === 16) {
        spans.push({
          start: m.index,
          end: m.index + rawStr.length,
          text: rawStr,
          type: "信用卡號"
        });
      }
    }

    // 銀行/郵局帳號
    // (a) 前綴關鍵字引導（帳號、帳戶、局號等，放寬至 8~20碼）
    const bankAcctRegex = /(?:帳號|帳戶|金融帳號|存款帳號|郵局帳號|行庫帳號|轉入帳號|匯入帳號|扣款帳號|局號|戶名[\s\S]{0,10}帳號)[：:\s]*(?<!\d)([0-9-]{8,24})(?!\d)/g;
    while ((m = bankAcctRegex.exec(text)) !== null) {
      const rawStr = m[1];
      const digitsOnly = rawStr.replace(/\D/g, '');
      if (digitsOnly.length >= 8 && digitsOnly.length <= 20) {
        const offset = m[0].indexOf(rawStr);
        spans.push({
          start: m.index + offset,
          end: m.index + offset + rawStr.length,
          text: rawStr,
          type: "金融帳號"
        });
      }
    }

    // (b) 銀行/行庫名稱引導（交易明細，如「合庫,李大山,123456789」或「第一銀行,98765432100」）
    const bankContextRegex = new RegExp(`(?:${_BANK_ALT})[,，\\s\\t:：]+(?:[\\u4e00-\\u9fa5]{2,4}[,，\\s\\t:：]+)?(?<!\\d)(\\d{8,16})(?!\\d)`, "g");
    while ((m = bankContextRegex.exec(text)) !== null) {
      const rawStr = m[1];
      const offset = m[0].lastIndexOf(rawStr);
      const start = m.index + offset;
      const end = start + rawStr.length;
      if (!spans.some(s => s.start <= start && end <= s.end)) {
        spans.push({
          start: start,
          end: end,
          text: rawStr,
          type: "金融帳號"
        });
      }
    }

    // 營利事業統一編號 (Rule 03)
    const taxRegex = /(?:統一編號|統編)[：:\s]*\b(\d{8})\b|(?<![A-Za-z0-9-])(\d{8})(?![A-Za-z0-9-])/g;
    while ((m = taxRegex.exec(text)) !== null) {
      const rawStr = m[1] || m[2];
      if (isValidTaxID(rawStr)) {
        const offset = m[0].indexOf(rawStr);
        spans.push({
          start: m.index + offset,
          end: m.index + offset + rawStr.length,
          text: rawStr,
          type: "統一編號"
        });
      }
    }

    // 3. 通訊與聯絡
    const mobileRegex = /(?<!\d)(09\d{2}[-\s]?\d{3}[-\s]?\d{3})(?!\d)/g;
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

    // 4. 地址與地政 (住址、地號建號、車牌號碼)
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

    // 地政不動產：地號、建號（自動剝離前置介系詞）
    const landRegex = new RegExp(`(?:(?:存放|坐落|座落|位於|設於|處)?(?:於|在|至|自))?(${cityPattern})?([\\u4e00-\\u9fa5]{1,4}(?:區|鄉|鎮))?([\\u4e00-\\u9fa5]{1,6}段(?:[一二三四五六七八九十0-9]{1,2}小段)?)([0-9０-９-]+(?:地號|建號))`, 'g');
    while ((m = landRegex.exec(text)) !== null) {
      const city = m[1];
      const dist = m[2] || '';
      const sec = m[3];
      const no = m[4];
      const landCore = (city || '') + dist + sec + no;
      const offset = m[0].indexOf(landCore);
      let start = m.index + offset;
      let end = start + landCore.length;
      if (this.keepCityPrefix && city) {
        start += city.length;
      }
      const sliceText = text.substring(start, end).trim();
      if (sliceText.length > 0) {
        spans.push({
          start: start,
          end: end,
          text: sliceText,
          type: "地號建號"
        });
      }
    }

    // 汽機車車牌號碼 (包含上下文前綴模式與獨立車牌正則)
    const contextPlateRegex = /(?:車牌(?:號碼)?|車號|牌照(?:號碼)?|車輛(?:號碼)?)[：:\s]*\b([A-Z0-9]{2,4}[-－][A-Z0-9]{2,4})\b/g;
    while ((m = contextPlateRegex.exec(text)) !== null) {
      const plateStr = m[1];
      if (/\d/.test(plateStr) && /[A-Za-z]/.test(plateStr)) {
        const offset = m[0].indexOf(plateStr);
        spans.push({
          start: m.index + offset,
          end: m.index + offset + plateStr.length,
          text: plateStr,
          type: "車牌號"
        });
      }
    }

    const plateRegex = /\b(?:[A-Z0-9]{2,4}[-－][A-Z0-9]{2,4}|[A-Z]{3}[-－][0-9]{4}|[0-9]{4}[-－][A-Z]{2}|[A-Z]{2}[-－][0-9]{4})\b/g;
    while ((m = plateRegex.exec(text)) !== null) {
      const plateStr = m[0];
      if (/\d/.test(plateStr) && /[A-Za-z]/.test(plateStr)) {
        spans.push({
          start: m.index,
          end: m.index + plateStr.length,
          text: plateStr,
          type: "車牌號"
        });
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
      } else if (this.maskAllDates) {
        spans.push({
          start: m.index,
          end: m.index + matchStr.length,
          text: matchStr.trim(),
          type: "出生年月日"
        });
      }
    }

    const numDateRegex = /(?<![0-9A-Za-z])((?:1[0-9]{2}|20[0-9]{2}|[0-9]{2})[./-](?:0?[1-9]|1[0-2])[./-](?:0?[1-9]|[12][0-9]|3[01]))(?![0-9A-Za-z])/g;
    while ((m = numDateRegex.exec(text)) !== null) {
      const rawDate = m[1];
      const prevContext = text.substring(Math.max(0, m.index - 10), m.index);
      const isBirth = ['出生', '生日', '生於'].some(kw => prevContext.includes(kw));
      if (isBirth || this.maskAllDates) {
        const start = m.index;
        const end = m.index + rawDate.length;
        if (!spans.some(s => s.start <= start && end <= s.end)) {
          spans.push({
            start: start,
            end: end,
            text: rawDate,
            type: "出生年月日"
          });
        }
      }
    }

    // 7. 自然人與法律訴訟關係人（法律語義邊界演算法，詳見 extractPersonSpans）
    for (const ps of extractPersonSpans(text)) spans.push(ps);

    // 8. 外部注入結構化實體
    if (extraSpans && Array.isArray(extraSpans)) {
      for (const es of extraSpans) spans.push(es);
    }
    if (externalEntities) {
      const verified = DeidEngine.verifyAndLocateEntities(text, externalEntities);
      for (const vs of verified) spans.push(vs);
    }

    // 8b. 既有實體跨檔/跨段落自動傳播（來自共用 MappingStore）
    if (mappingStore && Array.isArray(mappingStore.entities)) {
      for (const ent of mappingStore.entities) {
        const orig = (ent.original || "").trim();
        if (orig.length >= 2) {
          let sPos = 0;
          while (true) {
            const idx = text.indexOf(orig, sPos);
            if (idx === -1) break;
            spans.push({
              start: idx,
              end: idx + orig.length,
              text: orig,
              type: ent.type || "自然人",
              role: ent.role || null,
              metadata: { detectedBy: "cross_file_known_propagation" }
            });
            sPos = idx + orig.length;
          }
        }
      }
    }

    // 9. 衝突消解 (Non-overlapping Span Selection via Uint8Array mask)
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

  /**
   * 結構化實體驗證與定位函數：
   * 以原始文本 text 為準，比對外部抽取的 JSON 實體清單。
   * 若實體字串在原文中完全不存在，自動忽略。
   * 若存在，精確定位 offset (start, end) 並生成 Span。
   */
  static verifyAndLocateEntities(text, externalEntities) {
    if (!externalEntities) return [];
    let data = externalEntities;
    if (typeof data === "string") {
      let clean = data.trim();
      if (clean.startsWith("```")) {
        clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }
      try {
        data = JSON.parse(clean);
      } catch (e) {
        const m = clean.match(/\{[\s\S]*\}/);
        if (m) {
          try { data = JSON.parse(m[0]); } catch (_) { return []; }
        } else {
          return [];
        }
      }
    }

    const typeAliases = {
      "PERSON": "自然人", "自然人": "自然人", "姓名": "自然人", "人名": "自然人", "NAME": "自然人",
      "ROLE_PERSON": "訴訟關係人", "訴訟關係人": "訴訟關係人", "關係人": "訴訟關係人", "當事人": "訴訟關係人",
      "ID_CARD": "身分證號", "身分證": "身分證號", "身分證號": "身分證號",
      "RESIDENCE_PERMIT": "居留證號", "居留證": "居留證號",
      "PASSPORT": "護照號", "護照": "護照號",
      "HEALTH_CARD": "健保卡號", "健保卡": "健保卡號",
      "PHONE": "電話", "電話": "電話", "市話": "電話",
      "MOBILE": "手機", "手機": "手機", "行動電話": "手機",
      "EMAIL": "電子郵件", "電子郵件": "電子郵件",
      "BANK_ACCOUNT": "金融帳號", "金融帳號": "金融帳號", "帳號": "金融帳號",
      "CREDIT_CARD": "信用卡號", "信用卡": "信用卡號",
      "TAX_ID": "統一編號", "統一編號": "統一編號", "統編": "統一編號",
      "ADDRESS": "地址", "地址": "地址",
      "LAND_NUMBER": "地號建號", "地號": "地號建號",
      "LICENSE_PLATE": "車牌號", "車牌": "車牌號",
      "HOSPITAL": "醫療機構", "醫療機構": "醫療機構", "醫院": "醫療機構",
      "MEDICAL_RECORD": "病歷號", "病歷號": "病歷號",
      "BIRTH_DATE": "出生年月日", "出生年月日": "出生年月日"
    };

    const validSpans = [];
    if (Array.isArray(data)) {
      data = { "自然人": data };
    }

    if (typeof data === "object" && data !== null) {
      for (const [key, items] of Object.entries(data)) {
        const type = typeAliases[key.toUpperCase()] || typeAliases[key] || "自然人";
        const list = Array.isArray(items) ? items : [items];
        for (const rawItem of new Set(list)) {
          const item = String(rawItem || "").trim();
          if (!item) continue;
          let startPos = 0;
          while (true) {
            const idx = text.indexOf(item, startPos);
            if (idx === -1) break;
            validSpans.push({
              start: idx,
              end: idx + item.length,
              text: item,
              type: type,
              role: null,
              metadata: { detectedBy: "external_json_verified" }
            });
            startPos = idx + item.length;
          }
        }
      }
    }
    return validSpans;
  }

  maskText(text, mappingStore = null, extraSpans = null, externalEntities = null) {
    if (!mappingStore) mappingStore = new MappingStore();
    const spans = this.detectEntities(text, extraSpans, externalEntities, mappingStore);
    const stats = {};

    // 先依出現順序 (由前往後) 生成 Token，確保編號符合自然閱讀順序
    const tokens = spans.map(span => mappingStore.getOrCreateToken(span.text, span.type, span.role));
    for (const span of spans) {
      stats[span.type] = (stats[span.type] || 0) + 1;
    }

    let modified = text;
    // 由後往前替換避免索引位移
    for (let i = spans.length - 1; i >= 0; i--) {
      const span = spans[i];
      const token = tokens[i];
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DeidEngine, MappingStore };
}
