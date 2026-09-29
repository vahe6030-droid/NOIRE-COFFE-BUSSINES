(function () {
  "use strict";
  const fallback = "ru";
  const storageKey = "noireVisitorLanguage";
  const languages = [
    ["ru", "Русский"],
    ["en", "English"],
    ["hy", "Հայերեն"],
  ];
  const valid = new Set(languages.map((x) => x[0]));

  const roleLabels = {
    ru: {
      owner: "Владелец",
      director: "Директор",
      administrator: "Администратор",
      manager: "Менеджер",
      waiter: "Официант",
      cook: "Повар",
      delivery: "Курьер",
    },
    en: {
      owner: "Owner",
      director: "Director",
      administrator: "Administrator",
      manager: "Manager",
      waiter: "Waiter",
      cook: "Cook",
      delivery: "Courier",
    },
    hy: {
      owner: "Սեփականատեր",
      director: "Տնօրեն",
      administrator: "Ադմինիստրատոր",
      manager: "Մենեջեր",
      waiter: "Մատուցող",
      cook: "Խոհարար",
      delivery: "Առաքիչ",
    },
    fr: {
      owner: "Propriétaire",
      director: "Directeur",
      administrator: "Administrateur",
      manager: "Manager",
      waiter: "Serveur",
      cook: "Cuisinier",
      delivery: "Livreur",
    },
    de: {
      owner: "Inhaber",
      director: "Direktor",
      administrator: "Administrator",
      manager: "Manager",
      waiter: "Kellner",
      cook: "Koch",
      delivery: "Kurier",
    },
    es: {
      owner: "Propietario",
      director: "Director",
      administrator: "Administrador",
      manager: "Gerente",
      waiter: "Camarero",
      cook: "Cocinero",
      delivery: "Repartidor",
    },
    it: {
      owner: "Titolare",
      director: "Direttore",
      administrator: "Amministratore",
      manager: "Manager",
      waiter: "Cameriere",
      cook: "Cuoco",
      delivery: "Corriere",
    },
    pt: {
      owner: "Proprietário",
      director: "Diretor",
      administrator: "Administrador",
      manager: "Gerente",
      waiter: "Garçom",
      cook: "Cozinheiro",
      delivery: "Entregador",
    },
    tr: {
      owner: "Sahip",
      director: "Direktör",
      administrator: "Yönetici",
      manager: "Müdür",
      waiter: "Garson",
      cook: "Aşçı",
      delivery: "Kurye",
    },
    ar: {
      owner: "المالك",
      director: "المدير",
      administrator: "المسؤول",
      manager: "المدير",
      waiter: "النادل",
      cook: "الطاهي",
      delivery: "مندوب التوصيل",
    },
    fa: {
      owner: "مالک",
      director: "مدیر",
      administrator: "مدیر سیستم",
      manager: "مدیر",
      waiter: "پیشخدمت",
      cook: "آشپز",
      delivery: "پیک",
    },
    he: {
      owner: "בעלים",
      director: "מנהל",
      administrator: "מנהל מערכת",
      manager: "מנהל",
      waiter: "מלצר",
      cook: "טבח",
      delivery: "שליח",
    },
    ja: {
      owner: "オーナー",
      director: "ディレクター",
      administrator: "管理者",
      manager: "マネージャー",
      waiter: "ウェイター",
      cook: "シェフ",
      delivery: "配達員",
    },
    ko: {
      owner: "소유자",
      director: "이사",
      administrator: "관리자",
      manager: "매니저",
      waiter: "웨이터",
      cook: "요리사",
      delivery: "배달원",
    },
    "zh-CN": {
      owner: "所有者",
      director: "总监",
      administrator: "管理员",
      manager: "经理",
      waiter: "服务员",
      cook: "厨师",
      delivery: "配送员",
    },
    "zh-TW": {
      owner: "擁有者",
      director: "總監",
      administrator: "管理員",
      manager: "經理",
      waiter: "服務員",
      cook: "廚師",
      delivery: "外送員",
    },
    uk: {
      owner: "Власник",
      director: "Директор",
      administrator: "Адміністратор",
      manager: "Менеджер",
      waiter: "Офіціант",
      cook: "Кухар",
      delivery: "Кур’єр",
    },
    pl: {
      owner: "Właściciel",
      director: "Dyrektor",
      administrator: "Administrator",
      manager: "Menedżer",
      waiter: "Kelner",
      cook: "Kucharz",
      delivery: "Kurier",
    },
    ka: {
      owner: "მფლობელი",
      director: "დირექტორი",
      administrator: "ადმინისტრატორი",
      manager: "მენეჯერი",
      waiter: "მიმტანი",
      cook: "მზარეული",
      delivery: "კურიერი",
    },
  };
  // Complete role coverage for every language offered by the selector. These labels are
  // intentionally local (rather than translated by the browser) so role names stay stable
  // in cards, filters and API-driven content even when Google Translate is unavailable.
  Object.assign(roleLabels, {
    bn: {
      owner: "মালিক",
      director: "পরিচালক",
      administrator: "প্রশাসক",
      manager: "ম্যানেজার",
      waiter: "ওয়েটার",
      cook: "রাঁধুনি",
      delivery: "ডেলিভারি কর্মী",
    },
    ur: {
      owner: "مالک",
      director: "ڈائریکٹر",
      administrator: "منتظم",
      manager: "مینیجر",
      waiter: "ویٹر",
      cook: "باورچی",
      delivery: "ڈیلیوری نمائندہ",
    },
    hi: {
      owner: "मालिक",
      director: "निदेशक",
      administrator: "प्रशासक",
      manager: "प्रबंधक",
      waiter: "वेटर",
      cook: "रसोइया",
      delivery: "डिलीवरी कर्मी",
    },
    id: {
      owner: "Pemilik",
      director: "Direktur",
      administrator: "Administrator",
      manager: "Manajer",
      waiter: "Pelayan",
      cook: "Koki",
      delivery: "Kurir",
    },
    ms: {
      owner: "Pemilik",
      director: "Pengarah",
      administrator: "Pentadbir",
      manager: "Pengurus",
      waiter: "Pelayan",
      cook: "Tukang Masak",
      delivery: "Penghantar",
    },
    th: {
      owner: "เจ้าของ",
      director: "ผู้อำนวยการ",
      administrator: "ผู้ดูแลระบบ",
      manager: "ผู้จัดการ",
      waiter: "พนักงานเสิร์ฟ",
      cook: "พ่อครัว",
      delivery: "พนักงานส่งของ",
    },
    vi: {
      owner: "Chủ sở hữu",
      director: "Giám đốc",
      administrator: "Quản trị viên",
      manager: "Quản lý",
      waiter: "Phục vụ",
      cook: "Đầu bếp",
      delivery: "Nhân viên giao hàng",
    },
    nl: {
      owner: "Eigenaar",
      director: "Directeur",
      administrator: "Beheerder",
      manager: "Manager",
      waiter: "Ober",
      cook: "Kok",
      delivery: "Bezorger",
    },
    cs: {
      owner: "Majitel",
      director: "Ředitel",
      administrator: "Administrátor",
      manager: "Manažer",
      waiter: "Číšník",
      cook: "Kuchař",
      delivery: "Kurýr",
    },
    sk: {
      owner: "Majiteľ",
      director: "Riaditeľ",
      administrator: "Administrátor",
      manager: "Manažér",
      waiter: "Čašník",
      cook: "Kuchár",
      delivery: "Kuriér",
    },
    ro: {
      owner: "Proprietar",
      director: "Director",
      administrator: "Administrator",
      manager: "Manager",
      waiter: "Ospătar",
      cook: "Bucătar",
      delivery: "Curier",
    },
    hu: {
      owner: "Tulajdonos",
      director: "Igazgató",
      administrator: "Adminisztrátor",
      manager: "Menedzser",
      waiter: "Pincér",
      cook: "Szakács",
      delivery: "Futár",
    },
    el: {
      owner: "Ιδιοκτήτης",
      director: "Διευθυντής",
      administrator: "Διαχειριστής",
      manager: "Υπεύθυνος",
      waiter: "Σερβιτόρος",
      cook: "Μάγειρας",
      delivery: "Διανομέας",
    },
    bg: {
      owner: "Собственик",
      director: "Директор",
      administrator: "Администратор",
      manager: "Мениджър",
      waiter: "Сервитьор",
      cook: "Готвач",
      delivery: "Куриер",
    },
    sr: {
      owner: "Власник",
      director: "Директор",
      administrator: "Администратор",
      manager: "Менаџер",
      waiter: "Конобар",
      cook: "Кувар",
      delivery: "Курир",
    },
    hr: {
      owner: "Vlasnik",
      director: "Direktor",
      administrator: "Administrator",
      manager: "Menadžer",
      waiter: "Konobar",
      cook: "Kuhar",
      delivery: "Dostavljač",
    },
    sl: {
      owner: "Lastnik",
      director: "Direktor",
      administrator: "Administrator",
      manager: "Vodja",
      waiter: "Natakar",
      cook: "Kuhar",
      delivery: "Dostavljavec",
    },
    sv: {
      owner: "Ägare",
      director: "Direktör",
      administrator: "Administratör",
      manager: "Chef",
      waiter: "Servitör",
      cook: "Kock",
      delivery: "Bud",
    },
    da: {
      owner: "Ejer",
      director: "Direktør",
      administrator: "Administrator",
      manager: "Manager",
      waiter: "Tjener",
      cook: "Kok",
      delivery: "Bud",
    },
    no: {
      owner: "Eier",
      director: "Direktør",
      administrator: "Administrator",
      manager: "Leder",
      waiter: "Servitør",
      cook: "Kokk",
      delivery: "Bud",
    },
    fi: {
      owner: "Omistaja",
      director: "Johtaja",
      administrator: "Ylläpitäjä",
      manager: "Esimies",
      waiter: "Tarjoilija",
      cook: "Kokki",
      delivery: "Kuljettaja",
    },
    et: {
      owner: "Omanik",
      director: "Direktor",
      administrator: "Administraator",
      manager: "Juht",
      waiter: "Kelner",
      cook: "Kokk",
      delivery: "Kuller",
    },
    lv: {
      owner: "Īpašnieks",
      director: "Direktors",
      administrator: "Administrators",
      manager: "Vadītājs",
      waiter: "Viesmīlis",
      cook: "Pavārs",
      delivery: "Kurjers",
    },
    lt: {
      owner: "Savininkas",
      director: "Direktorius",
      administrator: "Administratorius",
      manager: "Vadovas",
      waiter: "Padavėjas",
      cook: "Virėjas",
      delivery: "Kurjeris",
    },
    is: {
      owner: "Eigandi",
      director: "Framkvæmdastjóri",
      administrator: "Stjórnandi",
      manager: "Stjórnandi",
      waiter: "Þjónn",
      cook: "Kokkur",
      delivery: "Sendill",
    },
    ga: {
      owner: "Úinéir",
      director: "Stiúrthóir",
      administrator: "Riarthóir",
      manager: "Bainisteoir",
      waiter: "Freastalaí",
      cook: "Cócaire",
      delivery: "Seachadóir",
    },
    cy: {
      owner: "Perchennog",
      director: "Cyfarwyddwr",
      administrator: "Gweinyddwr",
      manager: "Rheolwr",
      waiter: "Gweinydd",
      cook: "Cogydd",
      delivery: "Dosbarthwr",
    },
    mt: {
      owner: "Sid",
      director: "Direttur",
      administrator: "Amministratur",
      manager: "Maniġer",
      waiter: "Wejter",
      cook: "Kok",
      delivery: "Kurrier",
    },
    sq: {
      owner: "Pronar",
      director: "Drejtor",
      administrator: "Administrator",
      manager: "Menaxher",
      waiter: "Kamerier",
      cook: "Kuzhinier",
      delivery: "Korrier",
    },
    mk: {
      owner: "Сопственик",
      director: "Директор",
      administrator: "Администратор",
      manager: "Менаџер",
      waiter: "Келнер",
      cook: "Готвач",
      delivery: "Курир",
    },
    bs: {
      owner: "Vlasnik",
      director: "Direktor",
      administrator: "Administrator",
      manager: "Menadžer",
      waiter: "Konobar",
      cook: "Kuhar",
      delivery: "Dostavljač",
    },
    ca: {
      owner: "Propietari",
      director: "Director",
      administrator: "Administrador",
      manager: "Gerent",
      waiter: "Cambrer",
      cook: "Cuiner",
      delivery: "Repartidor",
    },
    eu: {
      owner: "Jabea",
      director: "Zuzendaria",
      administrator: "Administratzailea",
      manager: "Kudeatzailea",
      waiter: "Zerbitzaria",
      cook: "Sukaldaria",
      delivery: "Banatzailea",
    },
    gl: {
      owner: "Propietario",
      director: "Director",
      administrator: "Administrador",
      manager: "Xerente",
      waiter: "Camareiro",
      cook: "Cociñeiro",
      delivery: "Repartidor",
    },
    af: {
      owner: "Eienaar",
      director: "Direkteur",
      administrator: "Administrateur",
      manager: "Bestuurder",
      waiter: "Kelner",
      cook: "Kok",
      delivery: "Afleweraar",
    },
    sw: {
      owner: "Mmiliki",
      director: "Mkurugenzi",
      administrator: "Msimamizi",
      manager: "Meneja",
      waiter: "Mhudumu",
      cook: "Mpishi",
      delivery: "Mtoa huduma",
    },
    am: {
      owner: "ባለቤት",
      director: "ዳይሬክተር",
      administrator: "አስተዳዳሪ",
      manager: "ሥራ አስኪያጅ",
      waiter: "አስተናጋጅ",
      cook: "ምግብ አብሳይ",
      delivery: "አቅራቢ",
    },
    az: {
      owner: "Sahib",
      director: "Direktor",
      administrator: "Administrator",
      manager: "Menecer",
      waiter: "Ofisiant",
      cook: "Aşpaz",
      delivery: "Kuryer",
    },
    be: {
      owner: "Уладальнік",
      director: "Дырэктар",
      administrator: "Адміністратар",
      manager: "Менеджар",
      waiter: "Афіцыянт",
      cook: "Кухар",
      delivery: "Курʼер",
    },
    kk: {
      owner: "Иесі",
      director: "Директор",
      administrator: "Әкімші",
      manager: "Менеджер",
      waiter: "Даяшы",
      cook: "Аспаз",
      delivery: "Курьер",
    },
    ky: {
      owner: "Ээси",
      director: "Директор",
      administrator: "Администратор",
      manager: "Менеджер",
      waiter: "Официант",
      cook: "Ашпозчу",
      delivery: "Курьер",
    },
    lo: {
      owner: "ເຈົ້າຂອງ",
      director: "ຜູ້ອໍານວຍການ",
      administrator: "ຜູ້ດູແລ",
      manager: "ຜູ້ຈັດການ",
      waiter: "ພະນັກງານເສີບ",
      cook: "ພໍ່ຄົວ",
      delivery: "ຜູ້ສົ່ງ",
    },
    mn: {
      owner: "Эзэмшигч",
      director: "Захирал",
      administrator: "Администратор",
      manager: "Менежер",
      waiter: "Зөөгч",
      cook: "Тогооч",
      delivery: "Хүргэгч",
    },
    my: {
      owner: "ပိုင်ရှင်",
      director: "ဒါရိုက်တာ",
      administrator: "အုပ်ချုပ်ရေးမှူး",
      manager: "မန်နေဂျာ",
      waiter: "စားပွဲထိုး",
      cook: "ချက်ပြုတ်သူ",
      delivery: "ပို့ဆောင်သူ",
    },
    ne: {
      owner: "मालिक",
      director: "निर्देशक",
      administrator: "प्रशासक",
      manager: "प्रबन्धक",
      waiter: "वेटर",
      cook: "भान्से",
      delivery: "डेलिभरी कर्मचारी",
    },
    ps: {
      owner: "مالک",
      director: "رییس",
      administrator: "مدیر",
      manager: "مدیر",
      waiter: "ویټر",
      cook: "اشپز",
      delivery: "رسوونکی",
    },
    pa: {
      owner: "ਮਾਲਕ",
      director: "ਡਾਇਰੈਕਟਰ",
      administrator: "ਪ੍ਰਸ਼ਾਸਕ",
      manager: "ਮੈਨੇਜਰ",
      waiter: "ਵੇਟਰ",
      cook: "ਰਸੋਈਆ",
      delivery: "ਡਿਲਿਵਰੀ ਕਰਮਚਾਰੀ",
    },
    ta: {
      owner: "உரிமையாளர்",
      director: "இயக்குநர்",
      administrator: "நிர்வாகி",
      manager: "மேலாளர்",
      waiter: "பணியாளர்",
      cook: "சமையல்காரர்",
      delivery: "விநியோக ஊழியர்",
    },
    te: {
      owner: "యజమాని",
      director: "డైరెక్టర్",
      administrator: "నిర్వాహకుడు",
      manager: "మేనేజర్",
      waiter: "వెయిటర్",
      cook: "వంటవాడు",
      delivery: "డెలివరీ సిబ్బంది",
    },
    mr: {
      owner: "मालक",
      director: "संचालक",
      administrator: "प्रशासक",
      manager: "व्यवस्थापक",
      waiter: "वेटर",
      cook: "स्वयंपाकी",
      delivery: "डिलिव्हरी कर्मचारी",
    },
    gu: {
      owner: "માલિક",
      director: "નિર્દેશક",
      administrator: "વહીવટદાર",
      manager: "મેનેજર",
      waiter: "વેઈટર",
      cook: "રસોઈયા",
      delivery: "ડિલિવરી કર્મચારી",
    },
    kn: {
      owner: "ಮಾಲೀಕ",
      director: "ನಿರ್ದೇಶಕ",
      administrator: "ನಿರ್ವಾಹಕ",
      manager: "ವ್ಯವಸ್ಥಾಪಕ",
      waiter: "ವೇಟರ್",
      cook: "ಅಡುಗೆಗಾರ",
      delivery: "ವಿತರಣಾ ಸಿಬ್ಬಂದಿ",
    },
    ml: {
      owner: "ഉടമ",
      director: "ഡയറക്ടർ",
      administrator: "അഡ്മിനിസ്ട്രേറ്റർ",
      manager: "മാനേജർ",
      waiter: "വെയിറ്റർ",
      cook: "പാചകക്കാരൻ",
      delivery: "ഡെലിവറി ജീവനക്കാരൻ",
    },
    si: {
      owner: "හිමිකරු",
      director: "අධ්‍යක්ෂ",
      administrator: "පරිපාලක",
      manager: "කළමනාකරු",
      waiter: "වේටර්",
      cook: "අරක්කැමියා",
      delivery: "බෙදාහැරීමේ සේවකයා",
    },
    km: {
      owner: "ម្ចាស់",
      director: "នាយក",
      administrator: "អ្នកគ្រប់គ្រង",
      manager: "អ្នកចាត់ការ",
      waiter: "អ្នកបម្រើ",
      cook: "ចុងភៅ",
      delivery: "អ្នកដឹកជញ្ជូន",
    },
    ceb: {
      owner: "Tag-iya",
      director: "Direktor",
      administrator: "Administrador",
      manager: "Manehista",
      waiter: "Waiter",
      cook: "Kusiner",
      delivery: "Magpahatod",
    },
    tl: {
      owner: "May-ari",
      director: "Direktor",
      administrator: "Tagapangasiwa",
      manager: "Tagapamahala",
      waiter: "Waiter",
      cook: "Kusinero",
      delivery: "Delivery staff",
    },
    jv: {
      owner: "Sing duwe",
      director: "Direktur",
      administrator: "Administrator",
      manager: "Manajer",
      waiter: "Pelayan",
      cook: "Koki",
      delivery: "Kurir",
    },
    su: {
      owner: "Nu boga",
      director: "Diréktur",
      administrator: "Administrator",
      manager: "Manajer",
      waiter: "Palayan",
      cook: "Tukang masak",
      delivery: "Kurir",
    },
    zu: {
      owner: "Umnikazi",
      director: "Umqondisi",
      administrator: "Umphathi",
      manager: "Imenenja",
      waiter: "Uweta",
      cook: "Umpheki",
      delivery: "Umlethi",
    },
    xh: {
      owner: "Umnini",
      director: "UMlawuli",
      administrator: "UMlawuli wenkqubo",
      manager: "UMphathi",
      waiter: "Umlindi",
      cook: "Umpheki",
      delivery: "Umthumeli",
    },
    yo: {
      owner: "Olùní",
      director: "Olùdarí",
      administrator: "Alákóso",
      manager: "Alákóso",
      waiter: "Olùsinṣẹ́",
      cook: "Aláṣèjẹ",
      delivery: "Olùfiránṣẹ́",
    },
    ig: {
      owner: "Onye nwe",
      director: "Onye isi",
      administrator: "Onye nchịkwa",
      manager: "Onye njikwa",
      waiter: "Onye na-eje ozi",
      cook: "Onye osi nri",
      delivery: "Onye na-ebuga",
    },
    ha: {
      owner: "Mai shi",
      director: "Darakta",
      administrator: "Mai gudanarwa",
      manager: "Manaja",
      waiter: "Ma’aikacin hidima",
      cook: "Mai dafa abinci",
      delivery: "Mai kai kaya",
    },
  });

  window.noireRoleLabel = function (role) {
    const r =
      String(role || "").toLowerCase() === "kitchen"
        ? "cook"
        : String(role || "").toLowerCase();
    const lang = document.documentElement.lang || fallback;
    return (roleLabels[lang] && roleLabels[lang][r]) || roleLabels.en[r] || r;
  };
  window.noireFormatDate = function (value) {
    const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return value || "—";
    return `${m[3]}.${m[2]}.${m[1]}`;
  };
  let businessTimezone = "Asia/Yerevan";
  window.noireFormatDateTime = function (value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value || "—";
    const lang = document.documentElement.lang || fallback;
    return new Intl.DateTimeFormat(lang, {
      timeZone: businessTimezone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };
  fetch("/api/site-settings")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.timezone) businessTimezone = d.timezone;
    })
    .catch(() => {});
  window.noireNormalizeTime = function (value) {
    const raw = String(value ?? "")
      .trim()
      .replace(/[.]/g, ":");
    if (!raw) return "";
    let h, m;
    if (/^\d{1,2}:\d{1,2}$/.test(raw)) {
      [h, m] = raw.split(":").map(Number);
    } else if (/^\d{3,4}$/.test(raw)) {
      const digits = raw;
      h = Number(digits.slice(0, -2));
      m = Number(digits.slice(-2));
    } else if (/^\d{1,2}$/.test(raw)) {
      h = Number(raw);
      m = 0;
    } else return null;
    if (h < 0 || h > 23 || m < 0 || m > 59 || m % 15 !== 0) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  window.noireInitTimeInputs = function (root = document) {
    root.querySelectorAll("input[data-noire-time]").forEach((input) => {
      if (input.dataset.noireReady) return;
      input.dataset.noireReady = "1";
      const wrap = document.createElement("div");
      wrap.className = "noire-time-picker";
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "noire-time-toggle";
      toggle.setAttribute("aria-label", "Выбрать время");
      toggle.textContent = "▾";
      wrap.appendChild(toggle);
      const menu = document.createElement("div");
      menu.className = "noire-time-menu";
      menu.hidden = true;
      menu.setAttribute("role", "listbox");
      for (let h = 0; h < 24; h++)
        for (let m = 0; m < 60; m += 15) {
          const v = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const o = document.createElement("button");
          o.type = "button";
          o.className = "noire-time-option";
          o.textContent = v;
          o.dataset.value = v;
          o.addEventListener("click", () => {
            input.value = v;
            input.setCustomValidity("");
            menu.hidden = true;
            input.dispatchEvent(new Event("change", { bubbles: true }));
          });
          menu.appendChild(o);
        }
      wrap.appendChild(menu);
      const close = () => {
        menu.hidden = true;
      };
      const open = () => {
        document.querySelectorAll(".noire-time-menu").forEach((x) => {
          if (x !== menu) x.hidden = true;
        });
        menu.hidden = false;
      };
      toggle.addEventListener("click", () => (menu.hidden ? open() : close()));
      input.addEventListener("focus", open);
      document.addEventListener("click", (e) => {
        if (!wrap.contains(e.target)) close();
      });
      const normalize = () => {
        const n = noireNormalizeTime(input.value);
        if (n) input.value = n;
        else if (input.value.trim())
          input.setCustomValidity("Введите корректное время, например 19:30");
        else input.setCustomValidity("");
      };
      input.addEventListener("blur", normalize);
      input.addEventListener("change", normalize);
      input.form?.addEventListener("submit", normalize);
    });
  };

  let current = fallback;
  let ownerDefault = fallback;

  const I18N = {
    ru: {
      Главная: "Главная",
      Меню: "Меню",
      Галерея: "Галерея",
      "О нас": "О нас",
      Контакты: "Контакты",
      Бронь: "Бронь",
      Бронирование: "Бронирование",
      Доставка: "Доставка",
      "Личный кабинет": "Личный кабинет",
      Корзина: "Корзина",

      Войти: "Войти",
      Вход: "Вход",
      Регистрация: "Регистрация",
      Выйти: "Выйти",

      Имя: "Имя",
      Телефон: "Телефон",
      Email: "Email",
      Пароль: "Пароль",
      Адрес: "Адрес",
      Подъезд: "Подъезд",
      Этаж: "Этаж",
      Комментарий: "Комментарий",
      Дата: "Дата",
      Время: "Время",
      Гостей: "Гостей",

      Добавить: "Добавить",
      Удалить: "Удалить",
      Сохранить: "Сохранить",
      Отмена: "Отмена",
      Назад: "Назад",

      "Оформить заказ": "Оформить заказ",
      "Оформляем…": "Оформляем…",
      "Оформляем...": "Оформляем...",
      "Заказ принят": "Заказ принят",
      "Номер заказа:": "Номер заказа:",
      "Мы уже начали его готовить.": "Мы уже начали его готовить.",
      "НА ГЛАВНУЮ": "НА ГЛАВНУЮ",

      Наличные: "Наличные",
      Картой: "Картой",
      Оплата: "Оплата",

      Забронировать: "Забронировать",
      "Забронировать столик": "Забронировать столик",

      "По умолчанию": "По умолчанию",
      "Язык сайта": "Язык сайта",
      "Ваш язык": "Ваш язык",

      Профиль: "Профиль",
      "Мои заказы": "Мои заказы",
      "Мои бронирования": "Мои бронирования",

      Завтраки: "Завтраки",
      Блюда: "Блюда",
      Закуски: "Закуски",
      Десерты: "Десерты",
      Напитки: "Напитки",
      Кофе: "Кофе",
      Чай: "Чай",
      Соусы: "Соусы",
      Пиво: "Пиво",

      Ошибка: "Ошибка",
      "Не указан": "Не указан",
      Фамилия: "Фамилия",
      Отчество: "Отчество",
      "Добро пожаловать, {name}": "Добро пожаловать, {name}",
      "Заказ #{number}": "Заказ #{number}",
      "Бронь #{number}": "Бронь #{number}",
      "Заказов пока нет.": "Заказов пока нет.",
      "Бронирований пока нет.": "Бронирований пока нет.",
      "{count} гостей": "{count} гостей",
      "Стол T{number}": "Стол T{number}",
      "стол не указан": "стол не указан",
      "Корзина пуста": "Корзина пуста",
      "Добавьте что-нибудь вкусное": "Добавьте что-нибудь вкусное",
      "{name} добавлен в корзину": "{name} добавлен в корзину",
      "Предыдущих заказов пока нет": "Предыдущих заказов пока нет",
      "Предыдущий заказ добавлен в корзину":
        "Предыдущий заказ добавлен в корзину",
      "Выбран стол T{number}.": "Выбран стол T{number}.",
      "Выбранный стол уже занят на это время.":
        "Выбранный стол уже занят на это время.",
      "Для такого количества гостей выберите более большой стол.":
        "Для такого количества гостей выберите более большой стол.",
      "Не удалось обновить доступность столов":
        "Не удалось обновить доступность столов",
      "Столы временно недоступны. Обновите страницу.":
        "Столы временно недоступны. Обновите страницу.",
      "Не удалось загрузить столы": "Не удалось загрузить столы",
      "Сначала выберите стол": "Сначала выберите стол",
      "Бронируем…": "Бронируем…",
      "Стол забронирован": "Стол забронирован",
      "Не удалось создать бронь": "Не удалось создать бронь",
      "Показать пароль": "Показать пароль",
      "Скрыть пароль": "Скрыть пароль",
      "Заказ домой": "Заказ домой",
      "Повторить заказ": "Повторить заказ",
      "Улица, дом, квартира": "Улица, дом, квартира",
      "Способ оплаты": "Способ оплаты",
      "Картой курьеру": "Картой курьеру",
      "Оплата при получении": "Оплата при получении",
      Наличными: "Наличными",
      "Способ оплаты для заказа": "Способ оплаты для заказа",
      "Как можно скорее": "Как можно скорее",
      "Через 30 минут": "Через 30 минут",
      "Через 60 минут": "Через 60 минут",
      "Комментарий для курьера": "Комментарий для курьера",
      "ОФОРМИТЬ ЗАКАЗ": "ОФОРМИТЬ ЗАКАЗ",
      "ОТКРЫТЬ МЕНЮ": "ОТКРЫТЬ МЕНЮ",
      "Ваш заказ": "Ваш заказ",
      Итого: "Итого",
      "Сначала добавьте блюда": "Сначала добавьте блюда",
      "Сервер вернул некорректный ответ.": "Сервер вернул некорректный ответ.",
      "Ошибка сервера ({status}).": "Ошибка сервера ({status}).",
      "Не удалось оформить заказ. Проверьте соединение и повторите попытку.":
        "Не удалось оформить заказ. Проверьте соединение и повторите попытку.",
      "Не удалось оформить заказ": "Не удалось оформить заказ",
      "Бронь #{number}. Менеджер видит имя, телефон, гостей, бюджет, стол и комментарий.":
        "Бронь #{number}. Менеджер видит имя, телефон, гостей, бюджет, стол и комментарий.",
      "Код для разработки выводится в консоли сервера.":
        "Код для разработки выводится в консоли сервера.",
      "Введите email или телефон": "Введите email или телефон",
      "Бронируем…": "Бронируем…",
      "Заказов пока нет.": "Заказов пока нет.",
      "Бронирований пока нет.": "Бронирований пока нет.",
      Имя: "Имя",
      Телефон: "Телефон",
      Кофе: "Кофе",
      Чай: "Чай",
      Завтраки: "Завтраки",
      Закуски: "Закуски",
      "Основные блюда": "Основные блюда",
      Десерты: "Десерты",
      Напитки: "Напитки",
      Пиво: "Пиво",
      Соусы: "Соусы",

      "Не удалось загрузить меню": "Не удалось загрузить меню",
      Добавить: "Добавить",
      "Ничего не найдено": "Ничего не найдено",
      "Попробуйте изменить запрос": "Попробуйте изменить запрос",

      "ВАШ ПОМОЩНИК": "ВАШ ПОМОЩНИК",
      "Привет! Чем могу помочь?": "Привет! Чем могу помочь?",
      Меню: "Меню",
      "Добавить кофе": "Добавить кофе",
      Бронь: "Бронь",
      "Напишите что угодно...": "Напишите что угодно...",
      Отправить: "Отправить",
      "Готово.": "Готово.",
      "AI сейчас недоступен. Проверьте OPENAI_API_KEY в файле .env и перезапустите сервер.":
        "AI сейчас недоступен. Проверьте OPENAI_API_KEY в файле .env и перезапустите сервер.",
      "Личный кабинет": "Личный кабинет",
    },

    en: {
      Главная: "Home",
      Меню: "Menu",
      Галерея: "Gallery",
      "О нас": "About us",
      Контакты: "Contacts",
      Бронь: "Reservations",
      Бронирование: "Reservation",
      Доставка: "Delivery",
      "Личный кабинет": "Account",
      Корзина: "Cart",

      Войти: "Sign in",
      Вход: "Sign in",
      Регистрация: "Register",
      Выйти: "Sign out",

      Имя: "Name",
      Телефон: "Phone",
      Email: "Email",
      Пароль: "Password",
      Адрес: "Address",
      Подъезд: "Entrance",
      Этаж: "Floor",
      Комментарий: "Comment",
      Дата: "Date",
      Время: "Time",
      Гостей: "Guests",

      Добавить: "Add",
      Удалить: "Delete",
      Сохранить: "Save",
      Отмена: "Cancel",
      Назад: "Back",

      "Оформить заказ": "Place order",
      "Оформляем…": "Placing order…",
      "Оформляем...": "Placing order...",
      "Заказ принят": "Order confirmed",
      "Номер заказа:": "Order number:",
      "Мы уже начали его готовить.": "We have already started preparing it.",
      "НА ГЛАВНУЮ": "BACK TO HOME",

      Наличные: "Cash",
      Картой: "Card",
      Оплата: "Payment",

      Забронировать: "Reserve",
      "Забронировать столик": "Reserve a table",

      "По умолчанию": "Default",
      "Язык сайта": "Site language",
      "Ваш язык": "Your language",

      Профиль: "Profile",
      "Мои заказы": "My orders",
      "Мои бронирования": "My reservations",

      Завтраки: "Breakfast",
      Блюда: "Dishes",
      Закуски: "Appetizers",
      Десерты: "Desserts",
      Напитки: "Drinks",
      Кофе: "Coffee",
      Чай: "Tea",
      Соусы: "Sauces",
      Пиво: "Beer",

      Ошибка: "Error",
      "Не указан": "Not specified",
      Фамилия: "Last name",
      Отчество: "Middle name",
      "Добро пожаловать, {name}": "Welcome, {name}",
      "Заказ #{number}": "Order #{number}",
      "Бронь #{number}": "Reservation #{number}",
      "Заказов пока нет.": "No orders yet.",
      "Бронирований пока нет.": "No reservations yet.",
      "{count} гостей": "{count} guests",
      "Стол T{number}": "Table T{number}",
      "стол не указан": "table not specified",
      "Корзина пуста": "Your cart is empty",
      "Добавьте что-нибудь вкусное": "Add something delicious",
      "{name} добавлен в корзину": "{name} added to cart",
      "Предыдущих заказов пока нет": "No previous orders yet",
      "Предыдущий заказ добавлен в корзину": "Previous order added to cart",
      "Выбран стол T{number}.": "Table T{number} selected.",
      "Выбранный стол уже занят на это время.":
        "The selected table is already occupied at this time.",
      "Для такого количества гостей выберите более большой стол.":
        "Please choose a larger table for this number of guests.",
      "Не удалось обновить доступность столов":
        "Could not update table availability",
      "Столы временно недоступны. Обновите страницу.":
        "Tables are temporarily unavailable. Please refresh the page.",
      "Не удалось загрузить столы": "Could not load tables",
      "Сначала выберите стол": "Please select a table first",
      "Бронируем…": "Reserving…",
      "Стол забронирован": "Table reserved",
      "Не удалось создать бронь": "Could not create reservation",
      "Показать пароль": "Show password",
      "Скрыть пароль": "Hide password",
      "Заказ домой": "Home delivery",
      "Повторить заказ": "Repeat order",
      "Улица, дом, квартира": "Street, building, apartment",
      "Способ оплаты": "Payment method",
      "Картой курьеру": "Card to courier",
      "Оплата при получении": "Pay on delivery",
      Наличными: "Cash",
      "Способ оплаты для заказа": "Payment method for your order",
      "Как можно скорее": "As soon as possible",
      "Через 30 минут": "In 30 minutes",
      "Через 60 минут": "In 60 minutes",
      "Комментарий для курьера": "Comment for the courier",
      "ОФОРМИТЬ ЗАКАЗ": "PLACE ORDER",
      "ОТКРЫТЬ МЕНЮ": "OPEN MENU",
      "Ваш заказ": "Your order",
      Итого: "Total",
      "Сначала добавьте блюда": "Add items to your cart first",
      "Сервер вернул некорректный ответ.":
        "The server returned an invalid response.",
      "Ошибка сервера ({status}).": "Server error ({status}).",
      "Не удалось оформить заказ. Проверьте соединение и повторите попытку.":
        "Could not place the order. Check your connection and try again.",
      "Не удалось оформить заказ": "Could not place the order",
      "Бронь #{number}. Менеджер видит имя, телефон, гостей, бюджет, стол и комментарий.":
        "Reservation #{number}. The manager can see the name, phone number, number of guests, budget, table and comment.",
      "Введите email или телефон": "Enter email or phone number",
      "Код для разработки выводится в консоли сервера.":
        "The development code is displayed in the server console.",
      "Бронируем…": "Booking…",
      "Заказов пока нет.": "No orders yet.",
      "Бронирований пока нет.": "No reservations yet.",
      Имя: "First name",
      Телефон: "Phone",
      Кофе: "Coffee",
      Чай: "Tea",
      Завтраки: "Breakfast",
      Закуски: "Snacks",
      "Основные блюда": "Main Courses",
      Десерты: "Desserts",
      Напитки: "Drinks",
      Пиво: "Beer",
      Соусы: "Sauces",

      "Не удалось загрузить меню": "Could not load the menu",
      Добавить: "Add",
      "Ничего не найдено": "Nothing found",
      "Попробуйте изменить запрос": "Try changing your search",
      "ВАШ ПОМОЩНИК": "YOUR TABLE ASSISTANT",
      "Привет! Чем могу помочь?": "Hello! How can I help?",
      Меню: "Menu",
      "Добавить кофе": "Add coffee",
      Бронь: "Reservation",
      "Напишите что угодно...": "Type anything...",
      Отправить: "Send",
      "Готово.": "Done.",
      "AI сейчас недоступен. Проверьте OPENAI_API_KEY в файле .env и перезапустите сервер.":
        "AI is currently unavailable. Check OPENAI_API_KEY in the .env file and restart the server.",
      "Личный кабинет": "My Account",
      "Ваш новый": "Your new",
"ритуал.": "ritual.",
"NOIRÉ — место, где аромат свежего кофе, авторская кухня и атмосфера большого города встречаются в одном пространстве.": "NOIRÉ is where the aroma of freshly brewed coffee, signature cuisine and the atmosphere of a big city come together in one space.",

"ОТКРЫТЬ МЕНЮ": "OPEN MENU",
"ЗАБРОНИРОВАТЬ СТОЛИК": "RESERVE A TABLE",

"Signature selection": "Signature selection",
"Любимое у наших гостей": "Guest favorites",
"От идеального эспрессо до десерта, который хочется заказать ещё до того, как принесут меню.": "From the perfect espresso to a dessert you'll want to order before the menu even arrives.",

"Вечер начинается с правильного столика.": "The evening starts with the right table.",
"Забронируйте место заранее и просто наслаждайтесь вечером.": "Reserve your table in advance and simply enjoy the evening.",
"ЗАБРОНИРОВАТЬ": "RESERVE",

"Premium coffee, kitchen and atmosphere for people who appreciate beautiful moments.": "Premium coffee, kitchen and atmosphere for people who appreciate beautiful moments.",
"Навигация": "Navigation",
"Сервис": "Service",
"Мы в сети": "Follow us",
"Crafted with taste.": "Crafted with taste.",

"Ваша корзина": "Your cart",
"Итого": "Total",
"ОФОРМИТЬ ЗАКАЗ": "PLACE ORDER",
"Gallery": "Gallery",
"Поиск блюда...": "Search dishes...",
"Всё": "All",
"ОФОРМИТЬ": "CHECKOUT",
"Menu": "Menu",
"Tables": "Tables",
"Order": "Order",
"THE SPACE": "THE SPACE",
"Inside NOIRÉ.": "Inside NOIRÉ.",
"Галерея только о самом месте: интерьер, свет, столики, детали и настроение вечера.": "A gallery dedicated to the space itself: the interior, lighting, tables, details and the mood of the evening.",
"Галерея временно недоступна.": "The gallery is temporarily unavailable.",
"OUR STORY": "OUR STORY",
"Больше, чем кофе.": "More than coffee.",
"NOIRÉ создан для тех моментов, которые хочется запомнить. Утренний кофе, встреча с друзьями, деловой разговор или долгий вечер за любимым блюдом — мы сделали пространство, в котором каждый момент становится особенным.": "NOIRÉ was created for moments worth remembering. Morning coffee, meeting friends, a business conversation or a long evening with your favorite dish — we created a space where every moment becomes special.",

"Coffee": "Coffee",
"Спешелти кофе и внимательное отношение к каждой чашке.": "Specialty coffee and careful attention to every cup.",

"Kitchen": "Kitchen",
"Большое меню для завтрака, обеда и красивого вечера.": "An extensive menu for breakfast, lunch and a beautiful evening.",

"Atmosphere": "Atmosphere",
"Тёплый свет, музыка и интерьер, в котором хочется задержаться.": "Warm lighting, music and an interior that makes you want to stay.",

"People": "People",
"Команда, которая любит то, что делает.": "A team that loves what they do.",
"FIND US": "FIND US",
"Адрес": "Address",
"Yerevan, Armenia": "Yerevan, Armenia",
"Работаем": "Opening hours",
"Каждый день · 08:00 — 00:00": "Every day · 08:00 — 00:00",
"Instagram": "Instagram",
"RESERVE YOUR TABLE": "RESERVE YOUR TABLE",
"Ваш вечер в NOIRÉ.": "Your evening at NOIRÉ.",
"Выберите дату, время, количество гостей и конкретный стол. Всё, что вы отправите, появится у менеджера.": "Choose the date, time, number of guests and a specific table. Everything you submit will be sent to the manager.",

"Бюджет, ֏": "Budget, ֏",
"Повод": "Occasion",
"Без повода": "No special occasion",
"День рождения": "Birthday",
"Деловая встреча": "Business meeting",
"Свидание": "Date",
"Вечер с друзьями": "Evening with friends",

"Выбранный стол": "Selected table",
"Выберите справа": "Select on the right",
"Комментарий / пожелания": "Comments / requests",
"Например: тихий угол, у окна, детский стул...": "For example: a quiet corner, by the window, a high chair...",
"Забронировать стол": "Reserve a table",
"Выберите стол на плане.": "Select a table on the floor plan.",

"NOIRÉ FLOOR PLAN": "NOIRÉ FLOOR PLAN",
"Выберите место": "Choose a table",
"Свободные столы подсвечены. При выборе даты и времени занятые столы блокируются автоматически.": "Available tables are highlighted. When you select a date and time, occupied tables are automatically blocked.",
"С возвращением": "Welcome back",
"Войдите, чтобы видеть заказы и управлять своим профилем.": "Sign in to view your orders and manage your profile.",
"Email или телефон": "Email or phone",
"Создать аккаунт": "Create an account",
"Забыли пароль?": "Forgot your password?",

"Сохраняйте адреса, заказы и историю посещений в одном месте.": "Keep your addresses, orders and visit history in one place.",
"Зарегистрироваться": "Register",
"У меня уже есть аккаунт": "I already have an account",
"Добро пожаловать": "Welcome",
"Закрытый кабинет NOIRÉ COFFEE. Введите рабочий логин и пароль.": "Private NOIRÉ COFFEE management area. Enter your work login and password.",
"Логин": "Login",
"Войти в кабинет": "Sign in",

"Обзор": "Dashboard",
"Заказы": "Orders",
"Бронирования": "Reservations",
"Столы": "Tables",
"Аналитика": "Analytics",
"Клиенты": "Customers",
"История": "History",
"Сотрудники": "Employees",
"График смен": "Shift schedule",
"Настройки": "Settings",
"Сайт": "Website",

"Всё важное о NOIRÉ — на одном экране.": "Everything important about NOIRÉ on one screen.",

"Выручка": "Revenue",
"за всё время": "all time",
"в базе": "in database",
"активные и завершённые": "active and completed",
"Гости": "Guests",
"клиентов": "customers",
"Средний чек": "Average order value",
"на заказ": "per order",
"Сегодня": "Today",
"заказов": "orders",

"День": "Day",
"Неделя": "Week",
"Месяц": "Month",
"Год": "Year",

"Мои показатели": "My performance",
"Личная статистика сотрудника за текущий месяц.": "Employee personal statistics for the current month.",
"Смена": "Shift",

"Последние заказы": "Recent orders",
"Все заказы": "All orders",
"Заказывают чаще": "Most ordered",
"Меню NOIRÉ": "NOIRÉ Menu",
"Добавляйте, редактируйте и удаляйте позиции. Фото можно выбрать прямо с телефона, планшета или компьютера.": "Add, edit and delete items. Photos can be selected directly from your phone, tablet or computer.",
"+ Добавить позицию": "+ Add item",

"+ Новый заказ в зале": "+ New dine-in order",
"+ Новая доставка": "+ New delivery",
"Поиск по имени, телефону или №": "Search by name, phone or number",
"Мои заказы": "My orders",
"Выполненные заказы": "Completed orders",

"Видно время, стол, имя, телефон, гостей, бюджет, повод, комментарий и связанный заказ.": "View the time, table, name, phone, number of guests, budget, occasion, comment and linked order.",
"+ Новая бронь": "+ New reservation",
"Поиск по имени, телефону, № или поводу": "Search by name, phone, number or occasion",
"№ / создано": "No. / created",
"Гость": "Guest",
"Стол": "Table",
"Бюджет": "Budget",
"Пожелания": "Requests",
"Статус": "Status",
"Заказ": "Order",

"Система показывает свободные, занятые, зарезервированные и сервисные столы на выбранное время.": "The system shows available, occupied, reserved and service tables for the selected time.",
"Свободен": "Available",
"Занят": "Occupied",
"Сервис": "Service",
"Интерьер, атмосфера, столики и само пространство NOIRÉ. Фото можно загрузить прямо с устройства.": "The interior, atmosphere, tables and the NOIRÉ space itself. Photos can be uploaded directly from your device.",
"+ Добавить фото": "+ Add photo",

"Плановые смены отдельно от фактического времени работы.": "Scheduled shifts are separate from actual working hours.",
"+ Добавить смену": "+ Add shift",
"Сотрудник": "Employee",
"Все сотрудники": "All employees",
"Роль": "Role",
"Все роли": "All roles",
"Повар": "Cook",
"Выбрано: 0": "Selected: 0",
"Удалить выбранные": "Delete selected",
"Удалить все": "Delete all",

"Смены, роли, доступы, выручка и рабочие показатели каждого человека.": "Shifts, roles, access, revenue and performance metrics for each employee.",
"+ Добавить сотрудника": "+ Add employee",

"Настройки NOIRÉ COFFEE": "NOIRÉ COFFEE Settings",
"Owner и Director могут менять название и подпись сайта без редактирования кода.": "Owner and Director can change the site name and subtitle without editing the code.",
"Название сайта": "Site name",
"Подпись": "Subtitle",
"Язык общего сайта": "Public site language",
"Язык выбирается владельцем здесь и применяется для посетителей всего сайта.": "The language is selected here by the owner and applied to visitors across the entire site.",
"Сохранить настройки": "Save settings",
"Закрытые месяцы сохраняются здесь. После архивации их заказы и прошедшие бронирования убираются из текущей базы, но остаются доступными в истории.": "Closed months are stored here. After archiving, their orders and past reservations are removed from the current database but remain available in history.",
"Архивировать прошлый месяц": "Archive previous month",
"Удалить историю": "Delete history",
"Удаление касается только архивов. Системный журнал аудита сохраняется.": "Deletion applies only to archives. The system audit log is preserved.",
"Все годы": "All years",

"Зарегистрированные клиенты и связанные с ними заказы и бронирования.": "Registered customers and their associated orders and reservations.",
"Удалить выбранных": "Delete selected",
"Удалить всех": "Delete all",

"Динамика продаж": "Sales performance",
"Что продаётся чаще": "Best-selling items",
"Категории": "Categories",

"AI Assistant": "AI Assistant",
"Можно спрашивать о продажах, заказах, бронях, столах и сотрудниках. Ассистент также выполняет безопасные команды, например изменение статуса заказа.": "You can ask about sales, orders, reservations, tables and employees. The assistant can also perform safe actions, such as changing an order status.",
"Например: какая выручка за месяц? или покажи свободные столы": "For example: what is the revenue this month? or show available tables",
"Спросить": "Ask",
"Выручка сегодня": "Revenue today",
"Топ за месяц": "Top items this month",
"Свободные столы": "Available tables",
"Брони сегодня": "Reservations today",
"Кто на смене": "Who is on shift",
"Новый": "New",
"Подтверждён": "Confirmed",
"Готовится": "Preparing",
"Готов": "Ready",
"В пути": "In transit",
"Гость пришёл": "Guest arrived",
"Завершён": "Completed",
"Доставлен": "Delivered",
"Отменён": "Cancelled",
"Комментария нет": "No comment",
"Нет позиций": "No items",
"Ответственный": "Assigned employee",
"Не принят": "Unassigned",
"Принять заказ": "Accept order",
"Заказ завершён": "Order completed",
"Отменить": "Cancel",
"Сотрудник…": "Employee…",
"Доступных заказов нет": "No available orders",
"Вы пока не приняли заказов": "You haven't accepted any orders yet",
"У вас нет завершённых заказов": "You have no completed orders",
"Выполненных заказов нет": "No completed orders",
"Тип": "Type",
"Дата и время": "Date and time",
"Не назначен": "Not assigned",
"Время доставки": "Delivery time",
"Комментарий клиента": "Customer comment",
"Состав заказа": "Order items",
"Нет позиций.": "No items.",
"Детали": "Details",
"Ничего не найдено.": "Nothing found.",
"Не выбран": "Not selected",
"Связанные заказы": "Linked orders",
"Не привязан": "Not linked",
"Сохранить связь": "Save link",
"Изменить": "Edit",
"Меню пока пустое.": "The menu is empty.",
"{count} места": "{count} seats",
"На смене": "On shift",
"Не работает": "Off shift",
"День": "Day",
"Неделя": "Week",
"Месяц": "Month",
"{count} заказов": "{count} orders",
"Контакты не указаны": "No contact information",
"Закрыть смену": "End shift",
"Начать смену": "Start shift",
"Сотрудников пока нет.": "No employees yet.",
"Недостаточно прав": "Insufficient permissions",
"Редактировать сотрудника": "Edit employee",
"Новый сотрудник": "New employee",
"Логин": "Username",
"Роль": "Role",
"Оставьте пустым, если не меняете": "Leave blank if unchanged",
"Аккаунт активен": "Account active",
"Сохранить изменения": "Save changes",
"Создать аккаунт": "Create account",
"На выбранную дату смен нет.": "No shifts for the selected date.",
"Сотрудник": "Employee",
"Редактировать смену": "Edit shift",
"Выбрано: {count}": "Selected: {count}",
    },

    hy: {
  "Главная": "Գլխավոր",
  "Меню": "Մենյու",
  "Галерея": "Պատկերասրահ",
  "О нас": "Մեր մասին",
  "Контакты": "Կապ",
  "Бронь": "Ամրագրում",
  "Бронирование": "Ամրագրում",
  "Доставка": "Առաքում",
  "Личный кабинет": "Անձնական էջ",
  "Корзина": "Զամբյուղ",

  "Войти": "Մուտք գործել",
  "Вход": "Մուտք",
  "Регистрация": "Գրանցում",
  "Выйти": "Դուրս գալ",

  "Имя": "Անուն",
  "Телефон": "Հեռախոս",
  "Email": "Էլ. փոստ",
  "Пароль": "Գաղտնաբառ",
  "Адрес": "Հասցե",
  "Подъезд": "Մուտք",
  "Этаж": "Հարկ",
  "Комментарий": "Մեկնաբանություն",
  "Дата": "Ամսաթիվ",
  "Время": "Ժամ",
  "Гостей": "Հյուրեր",

  "Добавить": "Ավելացնել",
  "Удалить": "Հեռացնել",
  "Сохранить": "Պահպանել",
  "Отмена": "Չեղարկել",
  "Назад": "Հետ",

  "Оформить заказ": "Ձևակերպել պատվերը",
  "Оформляем…": "Պատվերը ձևակերպվում է…",
  "Оформляем...": "Պատվերը ձևակերպվում է...",
  "Заказ принят": "Պատվերն ընդունված է",
  "Номер заказа:": "Պատվերի համարը՝",
  "Мы уже начали его готовить.": "Մենք արդեն սկսել ենք պատրաստել այն։",
  "НА ГЛАВНУЮ": "ԳԼԽԱՎՈՐ ԷՋ",

  "Наличные": "Կանխիկ",
  "Картой": "Քարտով",
  "Оплата": "Վճարում",

  "Забронировать": "Ամրագրել",
  "Забронировать столик": "Ամրագրել սեղան",

  "По умолчанию": "Ըստ լռելյայնի",
  "Язык сайта": "Կայքի լեզուն",
  "Ваш язык": "Ձեր լեզուն",

  "Профиль": "Պրոֆիլ",
  "Мои заказы": "Իմ պատվերները",
  "Мои бронирования": "Իմ ամրագրումները",

  "Завтраки": "Նախաճաշ",
  "Блюда": "Ուտեստներ",
  "Закуски": "Նախուտեստներ",
  "Основные блюда": "Հիմնական ուտեստներ",
  "Десерты": "Աղանդեր",
  "Напитки": "Ըմպելիքներ",
  "Кофе": "Սուրճ",
  "Чай": "Թեյ",
  "Соусы": "Սոուսներ",
  "Пиво": "Գարեջուր",

  "Ошибка": "Սխալ",
  "Не указан": "Նշված չէ",
  "Фамилия": "Ազգանուն",
  "Отчество": "Հայրանուն",

  "Добро пожаловать, {name}": "Բարի գալուստ, {name}",
  "Заказ #{number}": "Պատվեր #{number}",
  "Бронь #{number}": "Ամրագրում #{number}",
  "Заказов пока нет.": "Դեռ պատվերներ չկան։",
  "Бронирований пока нет.": "Դեռ ամրագրումներ չկան։",
  "{count} гостей": "{count} հյուր",
  "Стол T{number}": "Սեղան T{number}",
  "стол не указан": "սեղանը նշված չէ",

  "Корзина пуста": "Զամբյուղը դատարկ է",
  "Добавьте что-нибудь вкусное": "Ավելացրեք որևէ համեղ բան",
  "{name} добавлен в корзину": "{name}-ն ավելացվել է զամբյուղում",
  "Предыдущих заказов пока нет": "Նախորդ պատվերներ դեռ չկան",
  "Предыдущий заказ добавлен в корзину": "Նախորդ պատվերն ավելացվել է զամբյուղում",

  "Выбран стол T{number}.": "Ընտրված է T{number} սեղանը։",
  "Выбранный стол уже занят на это время.": "Ընտրված սեղանն այս ժամին արդեն զբաղված է։",
  "Для такого количества гостей выберите более большой стол.": "Այս քանակի հյուրերի համար ընտրեք ավելի մեծ սեղան։",
  "Не удалось обновить доступность столов": "Չհաջողվեց թարմացնել սեղանների հասանելիությունը",
  "Столы временно недоступны. Обновите страницу.": "Սեղանները ժամանակավորապես հասանելի չեն։ Թարմացրեք էջը։",
  "Не удалось загрузить столы": "Չհաջողվեց բեռնել սեղանները",
  "Сначала выберите стол": "Նախ ընտրեք սեղան",
  "Бронируем…": "Ամրագրվում է…",
  "Стол забронирован": "Սեղանն ամրագրված է",
  "Не удалось создать бронь": "Չհաջողվեց կատարել ամրագրումը",

  "Показать пароль": "Ցույց տալ գաղտնաբառը",
  "Скрыть пароль": "Թաքցնել գաղտնաբառը",

  "Заказ домой": "Առաքում տուն",
  "Повторить заказ": "Կրկնել պատվերը",
  "Улица, дом, квартира": "Փողոց, շենք, բնակարան",
  "Способ оплаты": "Վճարման եղանակ",
  "Картой курьеру": "Քարտով՝ առաքիչին",
  "Оплата при получении": "Վճարում ստանալիս",
  "Наличными": "Կանխիկ",
  "Способ оплаты для заказа": "Պատվերի վճարման եղանակ",
  "Как можно скорее": "Հնարավորինս շուտ",
  "Через 30 минут": "30 րոպեից",
  "Через 60 минут": "60 րոպեից",
  "Комментарий для курьера": "Մեկնաբանություն առաքիչի համար",

  "ОФОРМИТЬ ЗАКАЗ": "ՁԵՎԱԿԵՐՊԵԼ ՊԱՏՎԵՐԸ",
  "ОТКРЫТЬ МЕНЮ": "ԲԱՑԵԼ ՄԵՆՅՈՒՆ",
  "Ваш заказ": "Ձեր պատվերը",
  "Итого": "Ընդամենը",
  "Сначала добавьте блюда": "Նախ ավելացրեք ուտեստներ",

  "Сервер вернул некорректный ответ.": "Սերվերը վերադարձրել է սխալ պատասխան։",
  "Ошибка сервера ({status}).": "Սերվերի սխալ ({status})։",
  "Не удалось оформить заказ. Проверьте соединение и повторите попытку.": "Չհաջողվեց ձևակերպել պատվերը։ Ստուգեք կապը և կրկին փորձեք։",
  "Не удалось оформить заказ": "Չհաջողվեց ձևակերպել պատվերը",

  "Бронь #{number}. Менеджер видит имя, телефон, гостей, бюджет, стол и комментарий.": "Ամրագրում #{number}։ Մենեջերը տեսնում է անունը, հեռախոսահամարը, հյուրերի քանակը, բյուջեն, սեղանը և մեկնաբանությունը։",

  "Код для разработки выводится в консоли сервера.": "Մշակման կոդը ցուցադրվում է սերվերի կոնսոլում։",
  "Введите email или телефон": "Մուտքագրեք էլ. փոստը կամ հեռախոսահամարը",

  "Не удалось загрузить меню": "Չհաջողվեց բեռնել մենյուն",
  "Ничего не найдено": "Ոչինչ չի գտնվել",
  "Попробуйте изменить запрос": "Փորձեք փոխել որոնման հարցումը",

  "ВАШ ПОМОЩНИК": "ՁԵՐ ՕԳՆԱԿԱՆԸ",
  "Привет! Чем могу помочь?": "Բարև։ Ինչո՞վ կարող եմ օգնել։",
  "Добавить кофе": "Ավելացնել սուրճ",
  "Напишите что угодно...": "Գրեք ցանկացած բան...",
  "Отправить": "Ուղարկել",
  "Готово.": "Պատրաստ է։",

  "AI сейчас недоступен. Проверьте OPENAI_API_KEY в файле .env и перезапустите сервер.": "AI-ն այժմ հասանելի չէ։ Ստուգեք OPENAI_API_KEY-ը .env ֆայլում և վերագործարկեք սերվերը։",
  "Ваш новый": "Ձեր նոր",
"ритуал.": "ծեսը։",
"NOIRÉ — место, где аромат свежего кофе, авторская кухня и атмосфера большого города встречаются в одном пространстве.": "NOIRÉ-ն մի վայր է, որտեղ թարմ սուրճի բույրը, հեղինակային խոհանոցն ու մեծ քաղաքի մթնոլորտը միավորվում են մեկ տարածքում։",

"ОТКРЫТЬ МЕНЮ": "ԲԱՑԵԼ ՄԵՆՅՈՒՆ",
"ЗАБРОНИРОВАТЬ СТОЛИК": "ԱՄՐԱԳՐԵԼ ՍԵՂԱՆ",

"Signature selection": "Հատուկ ընտրանի",
"Любимое у наших гостей": "Մեր հյուրերի սիրելիները",
"От идеального эспрессо до десерта, который хочется заказать ещё до того, как принесут меню.": "Կատարյալ էսպրեսսոյից մինչև այն աղանդերը, որը կցանկանաք պատվիրել դեռ մինչև մենյուն բերելը։",

"Вечер начинается с правильного столика.": "Երեկոն սկսվում է ճիշտ ընտրված սեղանից։",
"Забронируйте место заранее и просто наслаждайтесь вечером.": "Նախապես ամրագրեք ձեր տեղը և պարզապես վայելեք երեկոն։",
"ЗАБРОНИРОВАТЬ": "ԱՄՐԱԳՐԵԼ",

"Premium coffee, kitchen and atmosphere for people who appreciate beautiful moments.": "Բարձրակարգ սուրճ, խոհանոց և մթնոլորտ նրանց համար, ովքեր գնահատում են գեղեցիկ պահերը։",
"Навигация": "Նավիգացիա",
"Сервис": "Ծառայություններ",
"Мы в сети": "Մենք առցանց",
"Crafted with taste.": "Ստեղծված է ճաշակով։",

"Ваша корзина": "Ձեր զամբյուղը",
"Итого": "Ընդամենը",
"ОФОРМИТЬ ЗАКАЗ": "ՁԵՎԱԿԵՐՊԵԼ ՊԱՏՎԵՐԸ",
"Gallery": "Պատկերասրահ",
"Поиск блюда...": "Որոնել ուտեստ...",
"Всё": "Բոլորը",
"ОФОРМИТЬ": "ՁԵՎԱԿԵՐՊԵԼ",
"Menu": "Մենյու",
"Tables": "Սեղաններ",
"Order": "Պատվեր",
"THE SPACE": "ՏԱՐԱԾՔԸ",
"Inside NOIRÉ.": "NOIRÉ-ի ներսում։",
"Галерея только о самом месте: интерьер, свет, столики, детали и настроение вечера.": "Պատկերասրահը նվիրված է հենց տարածքին՝ ինտերիերին, լուսավորությանը, սեղաններին, մանրամասներին և երեկոյի մթնոլորտին։",
"Галерея временно недоступна.": "Պատկերասրահը ժամանակավորապես հասանելի չէ։",
"OUR STORY": "ՄԵՐ ՊԱՏՄՈՒԹՅՈՒՆԸ",
"Больше, чем кофе.": "Ավելին, քան սուրճը։",
"NOIRÉ создан для тех моментов, которые хочется запомнить. Утренний кофе, встреча с друзьями, деловой разговор или долгий вечер за любимым блюдом — мы сделали пространство, в котором каждый момент становится особенным.": "NOIRÉ-ն ստեղծվել է այն պահերի համար, որոնք ցանկանում եք հիշել։ Առավոտյան սուրճ, հանդիպում ընկերների հետ, գործնական զրույց կամ երկար երեկո սիրելի ուտեստի շուրջ՝ մենք ստեղծել ենք մի տարածք, որտեղ յուրաքանչյուր պահ դառնում է առանձնահատուկ։",

"Coffee": "Սուրճ",
"Спешелти кофе и внимательное отношение к каждой чашке.": "Սփեշելթի սուրճ և առանձնահատուկ ուշադրություն յուրաքանչյուր բաժակի նկատմամբ։",

"Kitchen": "Խոհանոց",
"Большое меню для завтрака, обеда и красивого вечера.": "Ընդարձակ մենյու՝ նախաճաշի, ճաշի և գեղեցիկ երեկոյի համար։",

"Atmosphere": "Մթնոլորտ",
"Тёплый свет, музыка и интерьер, в котором хочется задержаться.": "Ջերմ լուսավորություն, երաժշտություն և ինտերիեր, որտեղ ցանկանում ես ավելի երկար մնալ։",

"People": "Մարդիկ",
"Команда, которая любит то, что делает.": "Թիմ, որը սիրում է իր աշխատանքը։",
"FIND US": "ԳՏԵՔ ՄԵԶ",
"Адрес": "Հասցե",
"Yerevan, Armenia": "Երևան, Հայաստան",
"Работаем": "Աշխատանքային ժամեր",
"Каждый день · 08:00 — 00:00": "Ամեն օր · 08:00 — 00:00",
"Instagram": "Instagram",
"RESERVE YOUR TABLE": "ԱՄՐԱԳՐԵՔ ՁԵՐ ՍԵՂԱՆԸ",
"Ваш вечер в NOIRÉ.": "Ձեր երեկոն NOIRÉ-ում։",
"Выберите дату, время, количество гостей и конкретный стол. Всё, что вы отправите, появится у менеджера.": "Ընտրեք ամսաթիվը, ժամը, հյուրերի քանակը և կոնկրետ սեղանը։ Ձեր ուղարկած ամբողջ տեղեկությունը կփոխանցվի մենեջերին։",

"Бюджет, ֏": "Բյուջե, ֏",
"Повод": "Առիթ",
"Без повода": "Առանց հատուկ առիթի",
"День рождения": "Ծննդյան օր",
"Деловая встреча": "Գործնական հանդիպում",
"Свидание": "Ժամադրություն",
"Вечер с друзьями": "Երեկո ընկերների հետ",

"Выбранный стол": "Ընտրված սեղան",
"Выберите справа": "Ընտրեք աջ կողմում",
"Комментарий / пожелания": "Մեկնաբանություն / ցանկություններ",
"Например: тихий угол, у окна, детский стул...": "Օրինակ՝ հանգիստ անկյուն, պատուհանի մոտ, մանկական աթոռ...",
"Забронировать стол": "Ամրագրել սեղան",
"Выберите стол на плане.": "Ընտրեք սեղանը հատակագծի վրա։",

"NOIRÉ FLOOR PLAN": "NOIRÉ-Ի ՀԱՏԱԿԱԳԻԾ",
"Выберите место": "Ընտրեք սեղան",
"Свободные столы подсвечены. При выборе даты и времени занятые столы блокируются автоматически.": "Ազատ սեղաններն ընդգծված են։ Ամսաթիվն ու ժամը ընտրելիս զբաղված սեղաններն ավտոմատ արգելափակվում են։",
"С возвращением": "Բարի վերադարձ",
"Войдите, чтобы видеть заказы и управлять своим профилем.": "Մուտք գործեք՝ ձեր պատվերները տեսնելու և պրոֆիլը կառավարելու համար։",
"Email или телефон": "Էլ. փոստ կամ հեռախոս",
"Создать аккаунт": "Ստեղծել հաշիվ",
"Забыли пароль?": "Մոռացե՞լ եք գաղտնաբառը։",

"Сохраняйте адреса, заказы и историю посещений в одном месте.": "Պահպանեք հասցեները, պատվերները և այցելությունների պատմությունը մեկ վայրում։",
"Зарегистрироваться": "Գրանցվել",
"У меня уже есть аккаунт": "Ես արդեն ունեմ հաշիվ",
"Добро пожаловать": "Բարի գալուստ",
"Закрытый кабинет NOIRÉ COFFEE. Введите рабочий логин и пароль.": "NOIRÉ COFFEE-ի փակ կառավարման բաժին։ Մուտքագրեք աշխատանքային մուտքանունը և գաղտնաբառը։",
"Логин": "Մուտքանուն",
"Войти в кабинет": "Մուտք գործել",

"Обзор": "Ընդհանուր",
"Заказы": "Պատվերներ",
"Бронирования": "Ամրագրումներ",
"Столы": "Սեղաններ",
"Аналитика": "Վերլուծություն",
"Клиенты": "Հաճախորդներ",
"История": "Պատմություն",
"Сотрудники": "Աշխատակիցներ",
"График смен": "Հերթափոխերի գրաֆիկ",
"Настройки": "Կարգավորումներ",
"Сайт": "Կայք",

"Всё важное о NOIRÉ — на одном экране.": "NOIRÉ-ի մասին ամբողջ կարևոր տեղեկությունը՝ մեկ էկրանին։",

"Выручка": "Հասույթ",
"за всё время": "ամբողջ ժամանակահատվածում",
"в базе": "տվյալների բազայում",
"активные и завершённые": "ակտիվ և ավարտված",
"Гости": "Հյուրեր",
"клиентов": "հաճախորդ",
"Средний чек": "Միջին հաշիվ",
"на заказ": "մեկ պատվերի համար",
"Сегодня": "Այսօր",
"заказов": "պատվեր",

"День": "Օր",
"Неделя": "Շաբաթ",
"Месяц": "Ամիս",
"Год": "Տարի",

"Мои показатели": "Իմ ցուցանիշները",
"Личная статистика сотрудника за текущий месяц.": "Աշխատակցի անձնական վիճակագրությունը ընթացիկ ամսվա համար։",
"Смена": "Հերթափոխ",

"Последние заказы": "Վերջին պատվերները",
"Все заказы": "Բոլոր պատվերները",
"Заказывают чаще": "Ամենաշատ պատվիրվողները",
"Меню NOIRÉ": "NOIRÉ-ի մենյու",
"Добавляйте, редактируйте и удаляйте позиции. Фото можно выбрать прямо с телефона, планшета или компьютера.": "Ավելացրեք, խմբագրեք և ջնջեք դիրքերը։ Լուսանկարը կարող եք ընտրել անմիջապես հեռախոսից, պլանշետից կամ համակարգչից։",
"+ Добавить позицию": "+ Ավելացնել դիրք",

"+ Новый заказ в зале": "+ Նոր պատվեր սրահում",
"+ Новая доставка": "+ Նոր առաքում",
"Поиск по имени, телефону или №": "Որոնում ըստ անվան, հեռախոսի կամ համարի",
"Мои заказы": "Իմ պատվերները",
"Выполненные заказы": "Կատարված պատվերներ",

"Видно время, стол, имя, телефон, гостей, бюджет, повод, комментарий и связанный заказ.": "Ցուցադրվում են ժամը, սեղանը, անունը, հեռախոսը, հյուրերի քանակը, բյուջեն, առիթը, մեկնաբանությունը և կապված պատվերը։",
"+ Новая бронь": "+ Նոր ամրագրում",
"Поиск по имени, телефону, № или поводу": "Որոնում ըստ անվան, հեռախոսի, համարի կամ առիթի",
"№ / создано": "№ / ստեղծվել է",
"Гость": "Հյուր",
"Стол": "Սեղան",
"Бюджет": "Բյուջե",
"Пожелания": "Ցանկություններ",
"Статус": "Կարգավիճակ",
"Заказ": "Պատվեր",

"Система показывает свободные, занятые, зарезервированные и сервисные столы на выбранное время.": "Համակարգը ցույց է տալիս ընտրված ժամի ազատ, զբաղված, ամրագրված և սպասարկման սեղանները։",
"Свободен": "Ազատ",
"Занят": "Զբաղված",
"Сервис": "Սպասարկում",
"Интерьер, атмосфера, столики и само пространство NOIRÉ. Фото можно загрузить прямо с устройства.": "NOIRÉ-ի ինտերիերը, մթնոլորտը, սեղանները և ամբողջ տարածքը։ Լուսանկարները կարելի է վերբեռնել անմիջապես սարքից։",
"+ Добавить фото": "+ Ավելացնել լուսանկար",

"Плановые смены отдельно от фактического времени работы.": "Պլանավորված հերթափոխերը ցուցադրվում են փաստացի աշխատաժամանակից առանձին։",
"+ Добавить смену": "+ Ավելացնել հերթափոխ",
"Сотрудник": "Աշխատակից",
"Все сотрудники": "Բոլոր աշխատակիցները",
"Роль": "Դեր",
"Все роли": "Բոլոր դերերը",
"Повар": "Խոհարար",
"Выбрано: 0": "Ընտրված է՝ 0",
"Удалить выбранные": "Ջնջել ընտրվածները",
"Удалить все": "Ջնջել բոլորը",

"Смены, роли, доступы, выручка и рабочие показатели каждого человека.": "Յուրաքանչյուր աշխատակցի հերթափոխերը, դերերը, հասանելիությունները, հասույթը և աշխատանքային ցուցանիշները։",
"+ Добавить сотрудника": "+ Ավելացնել աշխատակից",

"Настройки NOIRÉ COFFEE": "NOIRÉ COFFEE-ի կարգավորումներ",
"Owner и Director могут менять название и подпись сайта без редактирования кода.": "Owner-ը և Director-ը կարող են փոխել կայքի անվանումն ու ենթավերնագիրը՝ առանց կոդը խմբագրելու։",
"Название сайта": "Կայքի անվանում",
"Подпись": "Ենթավերնագիր",
"Язык общего сайта": "Հանրային կայքի լեզու",
"Язык выбирается владельцем здесь и применяется для посетителей всего сайта.": "Լեզուն այստեղ ընտրում է սեփականատերը, և այն կիրառվում է ամբողջ կայքի այցելուների համար։",
"Сохранить настройки": "Պահպանել կարգավորումները",
"Закрытые месяцы сохраняются здесь. После архивации их заказы и прошедшие бронирования убираются из текущей базы, но остаются доступными в истории.": "Փակված ամիսները պահպանվում են այստեղ։ Արխիվացումից հետո դրանց պատվերներն ու անցած ամրագրումները հեռացվում են ընթացիկ բազայից, սակայն մնում են հասանելի պատմության մեջ։",
"Архивировать прошлый месяц": "Արխիվացնել նախորդ ամիսը",
"Удалить историю": "Ջնջել պատմությունը",
"Удаление касается только архивов. Системный журнал аудита сохраняется.": "Ջնջումը վերաբերում է միայն արխիվներին։ Համակարգային աուդիտի մատյանը պահպանվում է։",
"Все годы": "Բոլոր տարիները",

"Зарегистрированные клиенты и связанные с ними заказы и бронирования.": "Գրանցված հաճախորդները և նրանց հետ կապված պատվերներն ու ամրագրումները։",
"Удалить выбранных": "Ջնջել ընտրվածներին",
"Удалить всех": "Ջնջել բոլորին",

"Динамика продаж": "Վաճառքների դինամիկա",
"Что продаётся чаще": "Ամենաշատ վաճառվողները",
"Категории": "Կատեգորիաներ",

"AI Assistant": "AI օգնական",
"Можно спрашивать о продажах, заказах, бронях, столах и сотрудниках. Ассистент также выполняет безопасные команды, например изменение статуса заказа.": "Կարող եք հարցնել վաճառքների, պատվերների, ամրագրումների, սեղանների և աշխատակիցների մասին։ Օգնականը կարող է նաև կատարել անվտանգ գործողություններ, օրինակ՝ փոխել պատվերի կարգավիճակը։",
"Например: какая выручка за месяц? или покажи свободные столы": "Օրինակ՝ որքա՞ն է ամսվա հասույթը կամ ցույց տուր ազատ սեղանները",
"Спросить": "Հարցնել",
"Выручка сегодня": "Այսօրվա հասույթը",
"Топ за месяц": "Ամսվա լավագույնները",
"Свободные столы": "Ազատ սեղաններ",
"Брони сегодня": "Այսօրվա ամրագրումները",
"Кто на смене": "Ով է հերթափոխում",
"Новый": "Նոր",
"Подтверждён": "Հաստատված",
"Готовится": "Պատրաստվում է",
"Готов": "Պատրաստ է",
"В пути": "Ճանապարհին",
"Гость пришёл": "Հյուրը ժամանել է",
"Завершён": "Ավարտված",
"Доставлен": "Առաքված",
"Отменён": "Չեղարկված",
"Комментария нет": "Մեկնաբանություն չկա",
"Нет позиций": "Դիրքեր չկան",
"Ответственный": "Պատասխանատու",
"Не принят": "Չի ընդունվել",
"Принять заказ": "Ընդունել պատվերը",
"Заказ завершён": "Պատվերն ավարտված է",
"Отменить": "Չեղարկել",
"Сотрудник…": "Աշխատակից…",
"Доступных заказов нет": "Հասանելի պատվերներ չկան",
"Вы пока не приняли заказов": "Դուք դեռ պատվերներ չեք ընդունել",
"У вас нет завершённых заказов": "Դուք ավարտված պատվերներ չունեք",
"Выполненных заказов нет": "Կատարված պատվերներ չկան",
"Тип": "Տեսակ",
"Дата и время": "Ամսաթիվ և ժամ",
"Не назначен": "Նշանակված չէ",
"Время доставки": "Առաքման ժամ",
"Комментарий клиента": "Հաճախորդի մեկնաբանություն",
"Состав заказа": "Պատվերի կազմ",
"Нет позиций.": "Դիրքեր չկան։",
"Детали": "Մանրամասներ",
"Ничего не найдено.": "Ոչինչ չի գտնվել։",
"Не выбран": "Ընտրված չէ",
"Связанные заказы": "Կապված պատվերներ",
"Не привязан": "Կապված չէ",
"Сохранить связь": "Պահպանել կապը",
"Изменить": "Փոփոխել",
"Меню пока пустое.": "Մենյուն դեռ դատարկ է։",
"{count} места": "{count} տեղ",
"На смене": "Հերթափոխում է",
"Не работает": "Չի աշխատում",
"День": "Օր",
"Неделя": "Շաբաթ",
"Месяц": "Ամիս",
"{count} заказов": "{count} պատվեր",
"Контакты не указаны": "Կոնտակտային տվյալներ նշված չեն",
"Закрыть смену": "Ավարտել հերթափոխը",
"Начать смену": "Սկսել հերթափոխը",
"Сотрудников пока нет.": "Աշխատակիցներ դեռ չկան։",
"Недостаточно прав": "Բավարար իրավունքներ չկան",
"Редактировать сотрудника": "Խմբագրել աշխատակցին",
"Новый сотрудник": "Նոր աշխատակից",
"Логин": "Մուտքանուն",
"Роль": "Դեր",
"Оставьте пустым, если не меняете": "Թողեք դատարկ, եթե չեք փոխում",
"Аккаунт активен": "Հաշիվն ակտիվ է",
"Сохранить изменения": "Պահպանել փոփոխությունները",
"Создать аккаунт": "Ստեղծել հաշիվ",
"На выбранную дату смен нет.": "Ընտրված ամսաթվի համար հերթափոխեր չկան։",
"Сотрудник": "Աշխատակից",
"Редактировать смену": "Խմբագրել հերթափոխը",
"Выбрано: {count}": "Ընտրված է՝ {count}",
}
  };
  function t(key, vars = {}) {
    const dictionary = I18N[current] || I18N.ru;
    let text = dictionary[key] || I18N.ru[key] || key;

    Object.entries(vars).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value));
    });

    return text;
  }

  window.noireT = t;

  function getVisitorLanguage() {
    try {
      const value = localStorage.getItem(storageKey);
      return valid.has(value) ? value : null;
    } catch {
      return null;
    }
  }

  function saveVisitorLanguage(code) {
    try {
      localStorage.setItem(storageKey, code);
    } catch {}
  }

  function removeVisitorLanguage() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }

  function translateString(text) {
    const value = String(text || "").trim();

    if (!value) return null;

    const ruDictionary = I18N.ru;
    const dictionary = I18N[current] || ruDictionary;

    /*
     * Элемент уже мог быть переведён с русского на другой язык.
     * Поэтому сначала ищем исходный русский ключ.
     */
    if (dictionary[value]) {
      return dictionary[value];
    }

    for (const language of ["en", "hy"]) {
      const entries = Object.entries(I18N[language]);

      for (const [original, translated] of entries) {
        if (translated === value) {
          return dictionary[original] || original;
        }
      }
    }

    return null;
  }

  function translateTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;

    const parent = node.parentElement;

    if (!parent) return;

    if (
      parent.closest(
        "script, style, code, pre, textarea, [data-noire-no-translate]",
      )
    ) {
      return;
    }

    const raw = node.nodeValue;
    const trimmed = raw.trim();

    if (!trimmed) return;

    const translated = translateString(trimmed);

    if (!translated || translated === trimmed) return;

    const start = raw.match(/^\s*/)?.[0] || "";
    const end = raw.match(/\s*$/)?.[0] || "";

    node.nodeValue = `${start}${translated}${end}`;
  }

  function translateElementAttributes(element) {
    if (!(element instanceof Element)) return;

    if (element.matches("input[placeholder], textarea[placeholder]")) {
      if (!element.dataset.noireOriginalPlaceholder) {
        element.dataset.noireOriginalPlaceholder =
          element.getAttribute("placeholder") || "";
      }

      const original = element.dataset.noireOriginalPlaceholder;

      const dictionary = PLACEHOLDERS[current] || PLACEHOLDERS.ru;

      element.setAttribute("placeholder", dictionary[original] || original);
    }

    if (element.hasAttribute("title")) {
      if (!element.dataset.noireOriginalTitle) {
        element.dataset.noireOriginalTitle =
          element.getAttribute("title") || "";
      }

      const original = element.dataset.noireOriginalTitle;
      const translated = translateString(original);

      element.setAttribute("title", translated || original);
    }

    if (element.hasAttribute("aria-label")) {
      if (!element.dataset.noireOriginalAria) {
        element.dataset.noireOriginalAria =
          element.getAttribute("aria-label") || "";
      }

      const original = element.dataset.noireOriginalAria;
      const translated = translateString(original);

      if (translated) {
        element.setAttribute("aria-label", translated);
      }
    }
  }

  function translateElement(element) {
    if (!(element instanceof Element)) return;

    if (element.closest("[data-noire-no-translate]")) {
      return;
    }

    translateElementAttributes(element);

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach(translateTextNode);
  }

  let translationScheduled = false;

  function translatePage() {
    if (translationScheduled) return;

    translationScheduled = true;

    requestAnimationFrame(() => {
      translationScheduled = false;

      document.documentElement.lang = current;
      document.documentElement.dir = "ltr";

      translateElement(document.body);

      updateSwitcher();
    });
  }

  function updateSwitcher() {
    const select = document.getElementById("noireLanguageSelect");

    const hint = document.getElementById("noireLanguageHint");

    if (!select) return;

    const personal = getVisitorLanguage();

    select.value = personal || "__default__";

    const defaultOption = select.querySelector('option[value="__default__"]');

    if (defaultOption) {
      defaultOption.textContent =
        current === "en"
          ? "Default"
          : current === "hy"
            ? "Ըստ լռելյայնի"
            : "По умолчанию";
    }

    select.setAttribute(
      "aria-label",
      current === "en" ? "Language" : current === "hy" ? "Լեզու" : "Язык",
    );

    if (hint) {
      if (personal) {
        hint.textContent =
          current === "en"
            ? "Your language"
            : current === "hy"
              ? "Ձեր լեզուն"
              : "Ваш язык";
      } else {
        hint.textContent =
          current === "en"
            ? "Site language"
            : current === "hy"
              ? "Կայքի լեզուն"
              : "Язык сайта";
      }
    }
  }

  function applyLanguage(code) {
    current = valid.has(code) ? code : fallback;

    document.documentElement.lang = current;
    document.documentElement.dir = "ltr";

    translatePage();

    document.dispatchEvent(
      new CustomEvent("noire:languagechange", {
        detail: {
          language: current,
          ownerDefault,
          personal: Boolean(getVisitorLanguage()),
        },
      }),
    );
  }

  function chooseVisitor(code) {
    if (code === "__default__") {
      removeVisitorLanguage();
      applyLanguage(ownerDefault);
      return;
    }

    if (!valid.has(code)) return;

    saveVisitorLanguage(code);
    applyLanguage(code);
  }

  window.noireSetLanguage = function (code) {
    if (!valid.has(code)) return;

    saveVisitorLanguage(code);
    applyLanguage(code);
  };

  window.noireResetLanguage = function () {
    removeVisitorLanguage();
    applyLanguage(ownerDefault);
  };

  window.noireGetLanguage = function () {
    return current;
  };

  window.noireGetOwnerLanguage = function () {
    return ownerDefault;
  };

  function createSwitcher() {
    if (document.getElementById("noireLanguageSwitcher")) {
      return;
    }

    const wrap = document.createElement("div");

    wrap.id = "noireLanguageSwitcher";
    wrap.className = "noire-language-switcher";

    wrap.setAttribute("data-noire-no-translate", "true");

    wrap.innerHTML = `
    <span
      class="noire-language-mark"
      aria-hidden="true"
    >◎</span>

    <div class="noire-language-fields">

      <select
        id="noireLanguageSelect"
        aria-label="Язык"
      >
        <option value="__default__">
          По умолчанию
        </option>

        <option value="ru">
          Русский
        </option>

        <option value="en">
          English
        </option>

        <option value="hy">
          Հայերեն
        </option>
      </select>

      <small id="noireLanguageHint">
        Язык сайта
      </small>

    </div>
  `;

    wrap
      .querySelector("#noireLanguageSelect")
      .addEventListener("change", function () {
        chooseVisitor(this.value);
      });

    const mobileNav = document.querySelector(".nav-menu");

    const actions = document.querySelector(".nav-actions, .admin-top-actions");

    if (mobileNav && window.matchMedia("(max-width: 850px)").matches) {
      mobileNav.appendChild(wrap);
    } else if (actions) {
      actions.insertBefore(wrap, actions.firstChild);
    } else {
      document.body.appendChild(wrap);
    }
  }

  function observeDynamicContent() {
    if (!document.body) return;

    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;

      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          shouldTranslate = true;
          break;
        }
      }

      if (shouldTranslate) {
        translatePage();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  async function initLanguage() {
    createSwitcher();

    const personal = getVisitorLanguage();

    try {
      const response = await fetch("/api/site-settings", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Site settings unavailable");
      }

      const settings = await response.json();

      ownerDefault = valid.has(settings?.language)
        ? settings.language
        : fallback;
    } catch (error) {
      console.warn("NOIRÉ language settings:", error);

      ownerDefault = fallback;
    }

    current = personal || ownerDefault;

    applyLanguage(current);

    observeDynamicContent();

    setTimeout(() => {
      if (window.noireInitTimeInputs) {
        window.noireInitTimeInputs(document);
      }
    }, 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLanguage);
  } else {
    initLanguage();
  }
})();
