(function(){
  'use strict';
  const fallback='ru';
  const storageKey='noireVisitorLanguage';
  const languages = [
  ['ru', 'Русский'],
  ['en', 'English'],
  ['hy', 'Հայերեն']
];
  const valid=new Set(languages.map(x=>x[0]));

  const roleLabels={
    ru:{owner:'Владелец',director:'Директор',administrator:'Администратор',manager:'Менеджер',waiter:'Официант',cook:'Повар',delivery:'Курьер'},
    en:{owner:'Owner',director:'Director',administrator:'Administrator',manager:'Manager',waiter:'Waiter',cook:'Cook',delivery:'Courier'},
    hy:{owner:'Սեփականատեր',director:'Տնօրեն',administrator:'Ադմինիստրատոր',manager:'Մենեջեր',waiter:'Մատուցող',cook:'Խոհարար',delivery:'Առաքիչ'},
    fr:{owner:'Propriétaire',director:'Directeur',administrator:'Administrateur',manager:'Manager',waiter:'Serveur',cook:'Cuisinier',delivery:'Livreur'},
    de:{owner:'Inhaber',director:'Direktor',administrator:'Administrator',manager:'Manager',waiter:'Kellner',cook:'Koch',delivery:'Kurier'},
    es:{owner:'Propietario',director:'Director',administrator:'Administrador',manager:'Gerente',waiter:'Camarero',cook:'Cocinero',delivery:'Repartidor'},
    it:{owner:'Titolare',director:'Direttore',administrator:'Amministratore',manager:'Manager',waiter:'Cameriere',cook:'Cuoco',delivery:'Corriere'},
    pt:{owner:'Proprietário',director:'Diretor',administrator:'Administrador',manager:'Gerente',waiter:'Garçom',cook:'Cozinheiro',delivery:'Entregador'},
    tr:{owner:'Sahip',director:'Direktör',administrator:'Yönetici',manager:'Müdür',waiter:'Garson',cook:'Aşçı',delivery:'Kurye'},
    ar:{owner:'المالك',director:'المدير',administrator:'المسؤول',manager:'المدير',waiter:'النادل',cook:'الطاهي',delivery:'مندوب التوصيل'},
    fa:{owner:'مالک',director:'مدیر',administrator:'مدیر سیستم',manager:'مدیر',waiter:'پیشخدمت',cook:'آشپز',delivery:'پیک'},
    he:{owner:'בעלים',director:'מנהל',administrator:'מנהל מערכת',manager:'מנהל',waiter:'מלצר',cook:'טבח',delivery:'שליח'},
    ja:{owner:'オーナー',director:'ディレクター',administrator:'管理者',manager:'マネージャー',waiter:'ウェイター',cook:'シェフ',delivery:'配達員'},
    ko:{owner:'소유자',director:'이사',administrator:'관리자',manager:'매니저',waiter:'웨이터',cook:'요리사',delivery:'배달원'},
    "zh-CN":{owner:'所有者',director:'总监',administrator:'管理员',manager:'经理',waiter:'服务员',cook:'厨师',delivery:'配送员'},
    "zh-TW":{owner:'擁有者',director:'總監',administrator:'管理員',manager:'經理',waiter:'服務員',cook:'廚師',delivery:'外送員'},
    uk:{owner:'Власник',director:'Директор',administrator:'Адміністратор',manager:'Менеджер',waiter:'Офіціант',cook:'Кухар',delivery:'Кур’єр'},
    pl:{owner:'Właściciel',director:'Dyrektor',administrator:'Administrator',manager:'Menedżer',waiter:'Kelner',cook:'Kucharz',delivery:'Kurier'},
    ka:{owner:'მფლობელი',director:'დირექტორი',administrator:'ადმინისტრატორი',manager:'მენეჯერი',waiter:'მიმტანი',cook:'მზარეული',delivery:'კურიერი'}
  };
  // Complete role coverage for every language offered by the selector. These labels are
  // intentionally local (rather than translated by the browser) so role names stay stable
  // in cards, filters and API-driven content even when Google Translate is unavailable.
  Object.assign(roleLabels,{
    bn:{owner:'মালিক',director:'পরিচালক',administrator:'প্রশাসক',manager:'ম্যানেজার',waiter:'ওয়েটার',cook:'রাঁধুনি',delivery:'ডেলিভারি কর্মী'},
    ur:{owner:'مالک',director:'ڈائریکٹر',administrator:'منتظم',manager:'مینیجر',waiter:'ویٹر',cook:'باورچی',delivery:'ڈیلیوری نمائندہ'},
    hi:{owner:'मालिक',director:'निदेशक',administrator:'प्रशासक',manager:'प्रबंधक',waiter:'वेटर',cook:'रसोइया',delivery:'डिलीवरी कर्मी'},
    id:{owner:'Pemilik',director:'Direktur',administrator:'Administrator',manager:'Manajer',waiter:'Pelayan',cook:'Koki',delivery:'Kurir'},
    ms:{owner:'Pemilik',director:'Pengarah',administrator:'Pentadbir',manager:'Pengurus',waiter:'Pelayan',cook:'Tukang Masak',delivery:'Penghantar'},
    th:{owner:'เจ้าของ',director:'ผู้อำนวยการ',administrator:'ผู้ดูแลระบบ',manager:'ผู้จัดการ',waiter:'พนักงานเสิร์ฟ',cook:'พ่อครัว',delivery:'พนักงานส่งของ'},
    vi:{owner:'Chủ sở hữu',director:'Giám đốc',administrator:'Quản trị viên',manager:'Quản lý',waiter:'Phục vụ',cook:'Đầu bếp',delivery:'Nhân viên giao hàng'},
    nl:{owner:'Eigenaar',director:'Directeur',administrator:'Beheerder',manager:'Manager',waiter:'Ober',cook:'Kok',delivery:'Bezorger'},
    cs:{owner:'Majitel',director:'Ředitel',administrator:'Administrátor',manager:'Manažer',waiter:'Číšník',cook:'Kuchař',delivery:'Kurýr'},
    sk:{owner:'Majiteľ',director:'Riaditeľ',administrator:'Administrátor',manager:'Manažér',waiter:'Čašník',cook:'Kuchár',delivery:'Kuriér'},
    ro:{owner:'Proprietar',director:'Director',administrator:'Administrator',manager:'Manager',waiter:'Ospătar',cook:'Bucătar',delivery:'Curier'},
    hu:{owner:'Tulajdonos',director:'Igazgató',administrator:'Adminisztrátor',manager:'Menedzser',waiter:'Pincér',cook:'Szakács',delivery:'Futár'},
    el:{owner:'Ιδιοκτήτης',director:'Διευθυντής',administrator:'Διαχειριστής',manager:'Υπεύθυνος',waiter:'Σερβιτόρος',cook:'Μάγειρας',delivery:'Διανομέας'},
    bg:{owner:'Собственик',director:'Директор',administrator:'Администратор',manager:'Мениджър',waiter:'Сервитьор',cook:'Готвач',delivery:'Куриер'},
    sr:{owner:'Власник',director:'Директор',administrator:'Администратор',manager:'Менаџер',waiter:'Конобар',cook:'Кувар',delivery:'Курир'},
    hr:{owner:'Vlasnik',director:'Direktor',administrator:'Administrator',manager:'Menadžer',waiter:'Konobar',cook:'Kuhar',delivery:'Dostavljač'},
    sl:{owner:'Lastnik',director:'Direktor',administrator:'Administrator',manager:'Vodja',waiter:'Natakar',cook:'Kuhar',delivery:'Dostavljavec'},
    sv:{owner:'Ägare',director:'Direktör',administrator:'Administratör',manager:'Chef',waiter:'Servitör',cook:'Kock',delivery:'Bud'},
    da:{owner:'Ejer',director:'Direktør',administrator:'Administrator',manager:'Manager',waiter:'Tjener',cook:'Kok',delivery:'Bud'},
    no:{owner:'Eier',director:'Direktør',administrator:'Administrator',manager:'Leder',waiter:'Servitør',cook:'Kokk',delivery:'Bud'},
    fi:{owner:'Omistaja',director:'Johtaja',administrator:'Ylläpitäjä',manager:'Esimies',waiter:'Tarjoilija',cook:'Kokki',delivery:'Kuljettaja'},
    et:{owner:'Omanik',director:'Direktor',administrator:'Administraator',manager:'Juht',waiter:'Kelner',cook:'Kokk',delivery:'Kuller'},
    lv:{owner:'Īpašnieks',director:'Direktors',administrator:'Administrators',manager:'Vadītājs',waiter:'Viesmīlis',cook:'Pavārs',delivery:'Kurjers'},
    lt:{owner:'Savininkas',director:'Direktorius',administrator:'Administratorius',manager:'Vadovas',waiter:'Padavėjas',cook:'Virėjas',delivery:'Kurjeris'},
    is:{owner:'Eigandi',director:'Framkvæmdastjóri',administrator:'Stjórnandi',manager:'Stjórnandi',waiter:'Þjónn',cook:'Kokkur',delivery:'Sendill'},
    ga:{owner:'Úinéir',director:'Stiúrthóir',administrator:'Riarthóir',manager:'Bainisteoir',waiter:'Freastalaí',cook:'Cócaire',delivery:'Seachadóir'},
    cy:{owner:'Perchennog',director:'Cyfarwyddwr',administrator:'Gweinyddwr',manager:'Rheolwr',waiter:'Gweinydd',cook:'Cogydd',delivery:'Dosbarthwr'},
    mt:{owner:'Sid',director:'Direttur',administrator:'Amministratur',manager:'Maniġer',waiter:'Wejter',cook:'Kok',delivery:'Kurrier'},
    sq:{owner:'Pronar',director:'Drejtor',administrator:'Administrator',manager:'Menaxher',waiter:'Kamerier',cook:'Kuzhinier',delivery:'Korrier'},
    mk:{owner:'Сопственик',director:'Директор',administrator:'Администратор',manager:'Менаџер',waiter:'Келнер',cook:'Готвач',delivery:'Курир'},
    bs:{owner:'Vlasnik',director:'Direktor',administrator:'Administrator',manager:'Menadžer',waiter:'Konobar',cook:'Kuhar',delivery:'Dostavljač'},
    ca:{owner:'Propietari',director:'Director',administrator:'Administrador',manager:'Gerent',waiter:'Cambrer',cook:'Cuiner',delivery:'Repartidor'},
    eu:{owner:'Jabea',director:'Zuzendaria',administrator:'Administratzailea',manager:'Kudeatzailea',waiter:'Zerbitzaria',cook:'Sukaldaria',delivery:'Banatzailea'},
    gl:{owner:'Propietario',director:'Director',administrator:'Administrador',manager:'Xerente',waiter:'Camareiro',cook:'Cociñeiro',delivery:'Repartidor'},
    af:{owner:'Eienaar',director:'Direkteur',administrator:'Administrateur',manager:'Bestuurder',waiter:'Kelner',cook:'Kok',delivery:'Afleweraar'},
    sw:{owner:'Mmiliki',director:'Mkurugenzi',administrator:'Msimamizi',manager:'Meneja',waiter:'Mhudumu',cook:'Mpishi',delivery:'Mtoa huduma'},
    am:{owner:'ባለቤት',director:'ዳይሬክተር',administrator:'አስተዳዳሪ',manager:'ሥራ አስኪያጅ',waiter:'አስተናጋጅ',cook:'ምግብ አብሳይ',delivery:'አቅራቢ'},
    az:{owner:'Sahib',director:'Direktor',administrator:'Administrator',manager:'Menecer',waiter:'Ofisiant',cook:'Aşpaz',delivery:'Kuryer'},
    be:{owner:'Уладальнік',director:'Дырэктар',administrator:'Адміністратар',manager:'Менеджар',waiter:'Афіцыянт',cook:'Кухар',delivery:'Курʼер'},
    kk:{owner:'Иесі',director:'Директор',administrator:'Әкімші',manager:'Менеджер',waiter:'Даяшы',cook:'Аспаз',delivery:'Курьер'},
    ky:{owner:'Ээси',director:'Директор',administrator:'Администратор',manager:'Менеджер',waiter:'Официант',cook:'Ашпозчу',delivery:'Курьер'},
    lo:{owner:'ເຈົ້າຂອງ',director:'ຜູ້ອໍານວຍການ',administrator:'ຜູ້ດູແລ',manager:'ຜູ້ຈັດການ',waiter:'ພະນັກງານເສີບ',cook:'ພໍ່ຄົວ',delivery:'ຜູ້ສົ່ງ'},
    mn:{owner:'Эзэмшигч',director:'Захирал',administrator:'Администратор',manager:'Менежер',waiter:'Зөөгч',cook:'Тогооч',delivery:'Хүргэгч'},
    my:{owner:'ပိုင်ရှင်',director:'ဒါရိုက်တာ',administrator:'အုပ်ချုပ်ရေးမှူး',manager:'မန်နေဂျာ',waiter:'စားပွဲထိုး',cook:'ချက်ပြုတ်သူ',delivery:'ပို့ဆောင်သူ'},
    ne:{owner:'मालिक',director:'निर्देशक',administrator:'प्रशासक',manager:'प्रबन्धक',waiter:'वेटर',cook:'भान्से',delivery:'डेलिभरी कर्मचारी'},
    ps:{owner:'مالک',director:'رییس',administrator:'مدیر',manager:'مدیر',waiter:'ویټر',cook:'اشپز',delivery:'رسوونکی'},
    pa:{owner:'ਮਾਲਕ',director:'ਡਾਇਰੈਕਟਰ',administrator:'ਪ੍ਰਸ਼ਾਸਕ',manager:'ਮੈਨੇਜਰ',waiter:'ਵੇਟਰ',cook:'ਰਸੋਈਆ',delivery:'ਡਿਲਿਵਰੀ ਕਰਮਚਾਰੀ'},
    ta:{owner:'உரிமையாளர்',director:'இயக்குநர்',administrator:'நிர்வாகி',manager:'மேலாளர்',waiter:'பணியாளர்',cook:'சமையல்காரர்',delivery:'விநியோக ஊழியர்'},
    te:{owner:'యజమాని',director:'డైరెక్టర్',administrator:'నిర్వాహకుడు',manager:'మేనేజర్',waiter:'వెయిటర్',cook:'వంటవాడు',delivery:'డెలివరీ సిబ్బంది'},
    mr:{owner:'मालक',director:'संचालक',administrator:'प्रशासक',manager:'व्यवस्थापक',waiter:'वेटर',cook:'स्वयंपाकी',delivery:'डिलिव्हरी कर्मचारी'},
    gu:{owner:'માલિક',director:'નિર્દેશક',administrator:'વહીવટદાર',manager:'મેનેજર',waiter:'વેઈટર',cook:'રસોઈયા',delivery:'ડિલિવરી કર્મચારી'},
    kn:{owner:'ಮಾಲೀಕ',director:'ನಿರ್ದೇಶಕ',administrator:'ನಿರ್ವಾಹಕ',manager:'ವ್ಯವಸ್ಥಾಪಕ',waiter:'ವೇಟರ್',cook:'ಅಡುಗೆಗಾರ',delivery:'ವಿತರಣಾ ಸಿಬ್ಬಂದಿ'},
    ml:{owner:'ഉടമ',director:'ഡയറക്ടർ',administrator:'അഡ്മിനിസ്ട്രേറ്റർ',manager:'മാനേജർ',waiter:'വെയിറ്റർ',cook:'പാചകക്കാരൻ',delivery:'ഡെലിവറി ജീവനക്കാരൻ'},
    si:{owner:'හිමිකරු',director:'අධ්‍යක්ෂ',administrator:'පරිපාලක',manager:'කළමනාකරු',waiter:'වේටර්',cook:'අරක්කැමියා',delivery:'බෙදාහැරීමේ සේවකයා'},
    km:{owner:'ម្ចាស់',director:'នាយក',administrator:'អ្នកគ្រប់គ្រង',manager:'អ្នកចាត់ការ',waiter:'អ្នកបម្រើ',cook:'ចុងភៅ',delivery:'អ្នកដឹកជញ្ជូន'},
    ceb:{owner:'Tag-iya',director:'Direktor',administrator:'Administrador',manager:'Manehista',waiter:'Waiter',cook:'Kusiner',delivery:'Magpahatod'},
    tl:{owner:'May-ari',director:'Direktor',administrator:'Tagapangasiwa',manager:'Tagapamahala',waiter:'Waiter',cook:'Kusinero',delivery:'Delivery staff'},
    jv:{owner:'Sing duwe',director:'Direktur',administrator:'Administrator',manager:'Manajer',waiter:'Pelayan',cook:'Koki',delivery:'Kurir'},
    su:{owner:'Nu boga',director:'Diréktur',administrator:'Administrator',manager:'Manajer',waiter:'Palayan',cook:'Tukang masak',delivery:'Kurir'},
    zu:{owner:'Umnikazi',director:'Umqondisi',administrator:'Umphathi',manager:'Imenenja',waiter:'Uweta',cook:'Umpheki',delivery:'Umlethi'},
    xh:{owner:'Umnini',director:'UMlawuli',administrator:'UMlawuli wenkqubo',manager:'UMphathi',waiter:'Umlindi',cook:'Umpheki',delivery:'Umthumeli'},
    yo:{owner:'Olùní',director:'Olùdarí',administrator:'Alákóso',manager:'Alákóso',waiter:'Olùsinṣẹ́',cook:'Aláṣèjẹ',delivery:'Olùfiránṣẹ́'},
    ig:{owner:'Onye nwe',director:'Onye isi',administrator:'Onye nchịkwa',manager:'Onye njikwa',waiter:'Onye na-eje ozi',cook:'Onye osi nri',delivery:'Onye na-ebuga'},
    ha:{owner:'Mai shi',director:'Darakta',administrator:'Mai gudanarwa',manager:'Manaja',waiter:'Ma’aikacin hidima',cook:'Mai dafa abinci',delivery:'Mai kai kaya'}
  });

  window.noireRoleLabel=function(role){
    const r=String(role||'').toLowerCase()==='kitchen'?'cook':String(role||'').toLowerCase();
    const lang=document.documentElement.lang||fallback;
    return (roleLabels[lang]&&roleLabels[lang][r]) || (roleLabels.en[r]) || r;
  };
  window.noireFormatDate=function(value){
    const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!m)return value||'—';
    return `${m[3]}.${m[2]}.${m[1]}`;
  };
  let businessTimezone='Asia/Yerevan';
  window.noireFormatDateTime=function(value){
    const d=new Date(value); if(Number.isNaN(d.getTime()))return value||'—';
    const lang=document.documentElement.lang||fallback;
    return new Intl.DateTimeFormat(lang,{timeZone:businessTimezone,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);
  };
  fetch('/api/site-settings').then(r=>r.ok?r.json():null).then(d=>{if(d?.timezone)businessTimezone=d.timezone}).catch(()=>{});
  window.noireNormalizeTime=function(value){
    const raw=String(value??'').trim().replace(/[.]/g,':');
    if(!raw)return '';
    let h,m;
    if(/^\d{1,2}:\d{1,2}$/.test(raw)){[h,m]=raw.split(':').map(Number)}
    else if(/^\d{3,4}$/.test(raw)){const digits=raw;h=Number(digits.slice(0,-2));m=Number(digits.slice(-2))}
    else if(/^\d{1,2}$/.test(raw)){h=Number(raw);m=0}
    else return null;
    if(h<0||h>23||m<0||m>59||m%15!==0)return null;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };
  window.noireInitTimeInputs=function(root=document){
    root.querySelectorAll('input[data-noire-time]').forEach(input=>{
      if(input.dataset.noireReady)return; input.dataset.noireReady='1';
      const wrap=document.createElement('div'); wrap.className='noire-time-picker'; input.parentNode.insertBefore(wrap,input); wrap.appendChild(input);
      const toggle=document.createElement('button'); toggle.type='button'; toggle.className='noire-time-toggle'; toggle.setAttribute('aria-label','Выбрать время'); toggle.textContent='▾'; wrap.appendChild(toggle);
      const menu=document.createElement('div'); menu.className='noire-time-menu'; menu.hidden=true; menu.setAttribute('role','listbox');
      for(let h=0;h<24;h++)for(let m=0;m<60;m+=15){const v=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;const o=document.createElement('button');o.type='button';o.className='noire-time-option';o.textContent=v;o.dataset.value=v;o.addEventListener('click',()=>{input.value=v;input.setCustomValidity('');menu.hidden=true;input.dispatchEvent(new Event('change',{bubbles:true}));});menu.appendChild(o)}
      wrap.appendChild(menu);
      const close=()=>{menu.hidden=true}; const open=()=>{document.querySelectorAll('.noire-time-menu').forEach(x=>{if(x!==menu)x.hidden=true});menu.hidden=false};
      toggle.addEventListener('click',()=>menu.hidden?open():close()); input.addEventListener('focus',open);
      document.addEventListener('click',e=>{if(!wrap.contains(e.target))close()});
      const normalize=()=>{const n=noireNormalizeTime(input.value); if(n)input.value=n; else if(input.value.trim())input.setCustomValidity('Введите корректное время, например 19:30'); else input.setCustomValidity('')};
      input.addEventListener('blur',normalize); input.addEventListener('change',normalize); input.form?.addEventListener('submit',normalize);
    });
  };

  let current = fallback;
let ownerDefault = fallback;

const I18N = {
  ru: {
    "Главная": "Главная",
    "Меню": "Меню",
    "Галерея": "Галерея",
    "О нас": "О нас",
    "Контакты": "Контакты",
    "Бронь": "Бронь",
    "Бронирование": "Бронирование",
    "Доставка": "Доставка",
    "Личный кабинет": "Личный кабинет",
    "Корзина": "Корзина",

    "Войти": "Войти",
    "Вход": "Вход",
    "Регистрация": "Регистрация",
    "Выйти": "Выйти",

    "Имя": "Имя",
    "Телефон": "Телефон",
    "Email": "Email",
    "Пароль": "Пароль",
    "Адрес": "Адрес",
    "Подъезд": "Подъезд",
    "Этаж": "Этаж",
    "Комментарий": "Комментарий",
    "Дата": "Дата",
    "Время": "Время",
    "Гостей": "Гостей",

    "Добавить": "Добавить",
    "Удалить": "Удалить",
    "Сохранить": "Сохранить",
    "Отмена": "Отмена",
    "Назад": "Назад",

    "Оформить заказ": "Оформить заказ",
    "Оформляем…": "Оформляем…",
    "Оформляем...": "Оформляем...",
    "Заказ принят": "Заказ принят",
    "Номер заказа:": "Номер заказа:",
    "Мы уже начали его готовить.": "Мы уже начали его готовить.",
    "НА ГЛАВНУЮ": "НА ГЛАВНУЮ",

    "Наличные": "Наличные",
    "Картой": "Картой",
    "Оплата": "Оплата",

    "Забронировать": "Забронировать",
    "Забронировать столик": "Забронировать столик",

    "По умолчанию": "По умолчанию",
    "Язык сайта": "Язык сайта",
    "Ваш язык": "Ваш язык",

    "Профиль": "Профиль",
    "Мои заказы": "Мои заказы",
    "Мои бронирования": "Мои бронирования",

    "Завтраки": "Завтраки",
    "Блюда": "Блюда",
    "Закуски": "Закуски",
    "Десерты": "Десерты",
    "Напитки": "Напитки",
    "Кофе": "Кофе",
    "Чай": "Чай",
    "Соусы": "Соусы",
    "Пиво": "Пиво",

"Ошибка": "Ошибка",
"Не указан": "Не указан",
"Фамилия": "Фамилия",
"Отчество": "Отчество",
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
"Предыдущий заказ добавлен в корзину": "Предыдущий заказ добавлен в корзину",
"Выбран стол T{number}.": "Выбран стол T{number}.",
"Выбранный стол уже занят на это время.": "Выбранный стол уже занят на это время.",
"Для такого количества гостей выберите более большой стол.": "Для такого количества гостей выберите более большой стол.",
"Не удалось обновить доступность столов": "Не удалось обновить доступность столов",
"Столы временно недоступны. Обновите страницу.": "Столы временно недоступны. Обновите страницу.",
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
"Наличными": "Наличными",
"Способ оплаты для заказа": "Способ оплаты для заказа",
"Как можно скорее": "Как можно скорее",
"Через 30 минут": "Через 30 минут",
"Через 60 минут": "Через 60 минут",
"Комментарий для курьера": "Комментарий для курьера",
"ОФОРМИТЬ ЗАКАЗ": "ОФОРМИТЬ ЗАКАЗ",
"ОТКРЫТЬ МЕНЮ": "ОТКРЫТЬ МЕНЮ",
"Ваш заказ": "Ваш заказ",
"Итого": "Итого",
"Сначала добавьте блюда": "Сначала добавьте блюда",
"Сервер вернул некорректный ответ.": "Сервер вернул некорректный ответ.",
"Ошибка сервера ({status}).": "Ошибка сервера ({status}).",
"Не удалось оформить заказ. Проверьте соединение и повторите попытку.": "Не удалось оформить заказ. Проверьте соединение и повторите попытку.",
"Не удалось оформить заказ": "Не удалось оформить заказ",
"Бронь #{number}. Менеджер видит имя, телефон, гостей, бюджет, стол и комментарий.": "Бронь #{number}. Менеджер видит имя, телефон, гостей, бюджет, стол и комментарий.",
"Код для разработки выводится в консоли сервера.": "Код для разработки выводится в консоли сервера.",
"Введите email или телефон": "Введите email или телефон",
"Бронируем…": "Бронируем…",
"Заказов пока нет.": "Заказов пока нет.",
"Бронирований пока нет.": "Бронирований пока нет.",
"Имя": "Имя",
"Телефон": "Телефон",
"Кофе": "Кофе",
"Чай": "Чай",
"Завтраки": "Завтраки",
"Закуски": "Закуски",
"Основные блюда": "Основные блюда",
"Десерты": "Десерты",
"Напитки": "Напитки",
"Пиво": "Пиво",
"Соусы": "Соусы",

"Не удалось загрузить меню": "Не удалось загрузить меню",
"Добавить": "Добавить",
"Ничего не найдено": "Ничего не найдено",
"Попробуйте изменить запрос": "Попробуйте изменить запрос",

"ВАШ ПОМОЩНИК": "ВАШ ПОМОЩНИК",
"Привет! Чем могу помочь?": "Привет! Чем могу помочь?",
"Меню": "Меню",
"Добавить кофе": "Добавить кофе",
"Бронь": "Бронь",
"Напишите что угодно...": "Напишите что угодно...",
"Отправить": "Отправить",
"Готово.": "Готово.",
"AI сейчас недоступен. Проверьте OPENAI_API_KEY в файле .env и перезапустите сервер.": "AI сейчас недоступен. Проверьте OPENAI_API_KEY в файле .env и перезапустите сервер.",
"Личный кабинет": "Личный кабинет",
  },

  en: {
    "Главная": "Home",
    "Меню": "Menu",
    "Галерея": "Gallery",
    "О нас": "About us",
    "Контакты": "Contacts",
    "Бронь": "Reservations",
    "Бронирование": "Reservation",
    "Доставка": "Delivery",
    "Личный кабинет": "Account",
    "Корзина": "Cart",

    "Войти": "Sign in",
    "Вход": "Sign in",
    "Регистрация": "Register",
    "Выйти": "Sign out",

    "Имя": "Name",
    "Телефон": "Phone",
    "Email": "Email",
    "Пароль": "Password",
    "Адрес": "Address",
    "Подъезд": "Entrance",
    "Этаж": "Floor",
    "Комментарий": "Comment",
    "Дата": "Date",
    "Время": "Time",
    "Гостей": "Guests",

    "Добавить": "Add",
    "Удалить": "Delete",
    "Сохранить": "Save",
    "Отмена": "Cancel",
    "Назад": "Back",

    "Оформить заказ": "Place order",
    "Оформляем…": "Placing order…",
    "Оформляем...": "Placing order...",
    "Заказ принят": "Order confirmed",
    "Номер заказа:": "Order number:",
    "Мы уже начали его готовить.": "We have already started preparing it.",
    "НА ГЛАВНУЮ": "BACK TO HOME",

    "Наличные": "Cash",
    "Картой": "Card",
    "Оплата": "Payment",

    "Забронировать": "Reserve",
    "Забронировать столик": "Reserve a table",

    "По умолчанию": "Default",
    "Язык сайта": "Site language",
    "Ваш язык": "Your language",

    "Профиль": "Profile",
    "Мои заказы": "My orders",
    "Мои бронирования": "My reservations",

    "Завтраки": "Breakfast",
    "Блюда": "Dishes",
    "Закуски": "Appetizers",
    "Десерты": "Desserts",
    "Напитки": "Drinks",
    "Кофе": "Coffee",
    "Чай": "Tea",
    "Соусы": "Sauces",
    "Пиво": "Beer",

 "Ошибка": "Error",
"Не указан": "Not specified",
"Фамилия": "Last name",
"Отчество": "Middle name",
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
"Выбранный стол уже занят на это время.": "The selected table is already occupied at this time.",
"Для такого количества гостей выберите более большой стол.": "Please choose a larger table for this number of guests.",
"Не удалось обновить доступность столов": "Could not update table availability",
"Столы временно недоступны. Обновите страницу.": "Tables are temporarily unavailable. Please refresh the page.",
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
"Наличными": "Cash",
"Способ оплаты для заказа": "Payment method for your order",
"Как можно скорее": "As soon as possible",
"Через 30 минут": "In 30 minutes",
"Через 60 минут": "In 60 minutes",
"Комментарий для курьера": "Comment for the courier",
"ОФОРМИТЬ ЗАКАЗ": "PLACE ORDER",
"ОТКРЫТЬ МЕНЮ": "OPEN MENU",
"Ваш заказ": "Your order",
"Итого": "Total",
"Сначала добавьте блюда": "Add items to your cart first",
"Сервер вернул некорректный ответ.": "The server returned an invalid response.",
"Ошибка сервера ({status}).": "Server error ({status}).",
"Не удалось оформить заказ. Проверьте соединение и повторите попытку.": "Could not place the order. Check your connection and try again.",
"Не удалось оформить заказ": "Could not place the order",
"Бронь #{number}. Менеджер видит имя, телефон, гостей, бюджет, стол и комментарий.": "Reservation #{number}. The manager can see the name, phone number, number of guests, budget, table and comment.",
"Введите email или телефон": "Enter email or phone number",
"Код для разработки выводится в консоли сервера.": "The development code is displayed in the server console.",
"Бронируем…": "Booking…",
"Заказов пока нет.": "No orders yet.",
"Бронирований пока нет.": "No reservations yet.",
"Имя": "First name",
"Телефон": "Phone",
"Кофе": "Coffee",
"Чай": "Tea",
"Завтраки": "Breakfast",
"Закуски": "Snacks",
"Основные блюда": "Main Courses",
"Десерты": "Desserts",
"Напитки": "Drinks",
"Пиво": "Beer",
"Соусы": "Sauces",

"Не удалось загрузить меню": "Could not load the menu",
"Добавить": "Add",
"Ничего не найдено": "Nothing found",
"Попробуйте изменить запрос": "Try changing your search",
"ВАШ ПОМОЩНИК": "YOUR TABLE ASSISTANT",
"Привет! Чем могу помочь?": "Hello! How can I help?",
"Меню": "Menu",
"Добавить кофе": "Add coffee",
"Бронь": "Reservation",
"Напишите что угодно...": "Type anything...",
"Отправить": "Send",
"Готово.": "Done.",
"AI сейчас недоступен. Проверьте OPENAI_API_KEY в файле .env и перезапустите сервер.": "AI is currently unavailable. Check OPENAI_API_KEY in the .env file and restart the server.",
"Личный кабинет": "My Account",
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

    "Войти": "Մուտք",
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

    "Оформить заказ": "Պատվիրել",
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
"{name} добавлен в корзину": "{name}-ը ավելացվել է զամբյուղում",
"Предыдущих заказов пока нет": "Նախորդ պատվերներ դեռ չկան",
"Предыдущий заказ добавлен в корзину": "Նախորդ պատվերը ավելացվել է զամբյուղում",
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
"Заказ домой": "Home delivery",
"Повторить заказ": "Repeat order",
"Улица, дом, квартира": "Street, building, apartment",
"Способ оплаты": "Payment method",
"Картой курьеру": "Card to courier",
"Оплата при получении": "Pay on delivery",
"Наличными": "Cash",
"Способ оплаты для заказа": "Payment method for your order",
"Как можно скорее": "As soon as possible",
"Через 30 минут": "In 30 minutes",
"Через 60 минут": "In 60 minutes",
"Комментарий для курьера": "Comment for the courier",
"ОФОРМИТЬ ЗАКАЗ": "PLACE ORDER",
"ОТКРЫТЬ МЕНЮ": "OPEN MENU",
"Ваш заказ": "Your order",
"Итого": "Total",
"Сначала добавьте блюда": "Add items to your cart first",
"Сервер вернул некорректный ответ.": "The server returned an invalid response.",
"Ошибка сервера ({status}).": "Server error ({status}).",
"Не удалось оформить заказ. Проверьте соединение и повторите попытку.": "Could not place the order. Check your connection and try again.",
"Не удалось оформить заказ": "Could not place the order",
"Бронь #{number}. Менеджер видит имя, телефон, гостей, бюджет, стол и комментарий.": "Ամրագրում #{number}։ Մենեջերը տեսնում է անունը, հեռախոսահամարը, հյուրերի քանակը, բյուջեն, սեղանը և մեկնաբանությունը։",
"Код для разработки выводится в консоли сервера.": "Մշակման կոդը ցուցադրվում է սերվերի կոնսոլում։",
"Введите email или телефон": "Մուտքագրեք էլ. փոստը կամ հեռախոսահամարը",
"Бронируем…": "Ամրագրում ենք…",
"Заказов пока нет.": "Պատվերներ դեռ չկան։",
"Бронирований пока нет.": "Ամրագրումներ դեռ չկան։",
"Имя": "Անուն",
"Телефон": "Հեռախոս",
"Кофе": "Սուրճ",
"Чай": "Թեյ",
"Завтраки": "Նախաճաշ",
"Закуски": "Խորտիկներ",
"Основные блюда": "Հիմնական ուտեստներ",
"Десерты": "Աղանդեր",
"Напитки": "Ըմպելիքներ",
"Пиво": "Գարեջուր",
"Соусы": "Սոուսներ",

"Не удалось загрузить меню": "Չհաջողվեց բեռնել մենյուն",
"Добавить": "Ավելացնել",
"Ничего не найдено": "Ոչինչ չի գտնվել",
"Попробуйте изменить запрос": "Փորձեք փոխել որոնման հարցումը",
"ВАШ ПОМОЩНИК": "ՁԵՐ ՕԳՆԱԿԱՆԸ",
"Привет! Чем могу помочь?": "Բարև։ Ինչո՞վ կարող եմ օգնել։",
"Меню": "Մենյու",
"Добавить кофе": "Ավելացնել սուրճ",
"Бронь": "Ամրագրում",
"Напишите что угодно...": "Գրեք ցանկացած բան...",
"Отправить": "Ուղարկել",
"Готово.": "Պատրաստ է։",
"AI сейчас недоступен. Проверьте OPENAI_API_KEY в файле .env и перезапустите сервер.": "AI-ն այժմ հասանելի չէ։ Ստուգեք OPENAI_API_KEY-ը .env ֆայլում և վերագործարկեք սերվերը։",
"Личный кабинет": "Անձնական էջ",
  }
};

const PLACEHOLDERS = {
  ru: {
    "Ваше имя": "Ваше имя",
    "Имя": "Имя",
    "Телефон": "Телефон",
    "Email": "Email",
    "Пароль": "Пароль",
    "Адрес доставки": "Адрес доставки",
    "Комментарий": "Комментарий"
  },

  en: {
    "Ваше имя": "Your name",
    "Имя": "Name",
    "Телефон": "Phone",
    "Email": "Email",
    "Пароль": "Password",
    "Адрес доставки": "Delivery address",
    "Комментарий": "Comment"
  },

  hy: {
    "Ваше имя": "Ձեր անունը",
    "Имя": "Անուն",
    "Телефон": "Հեռախոս",
    "Email": "Էլ. փոստ",
    "Пароль": "Գաղտնաբառ",
    "Адрес доставки": "Առաքման հասցե",
    "Комментарий": "Մեկնաբանություն"
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
      "script, style, code, pre, textarea, [data-noire-no-translate]"
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

  if (
    element.matches(
      "input[placeholder], textarea[placeholder]"
    )
  ) {
    if (!element.dataset.noireOriginalPlaceholder) {
      element.dataset.noireOriginalPlaceholder =
        element.getAttribute("placeholder") || "";
    }

    const original =
      element.dataset.noireOriginalPlaceholder;

    const dictionary =
      PLACEHOLDERS[current] || PLACEHOLDERS.ru;

    element.setAttribute(
      "placeholder",
      dictionary[original] || original
    );
  }

  if (element.hasAttribute("title")) {
    if (!element.dataset.noireOriginalTitle) {
      element.dataset.noireOriginalTitle =
        element.getAttribute("title") || "";
    }

    const original = element.dataset.noireOriginalTitle;
    const translated = translateString(original);

    element.setAttribute(
      "title",
      translated || original
    );
  }

  if (element.hasAttribute("aria-label")) {
    if (!element.dataset.noireOriginalAria) {
      element.dataset.noireOriginalAria =
        element.getAttribute("aria-label") || "";
    }

    const original = element.dataset.noireOriginalAria;
    const translated = translateString(original);

    if (translated) {
      element.setAttribute(
        "aria-label",
        translated
      );
    }
  }
}

function translateElement(element) {
  if (!(element instanceof Element)) return;

  if (
    element.closest(
      "[data-noire-no-translate]"
    )
  ) {
    return;
  }

  translateElementAttributes(element);

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT
  );

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
  const select =
    document.getElementById("noireLanguageSelect");

  const hint =
    document.getElementById("noireLanguageHint");

  if (!select) return;

  const personal = getVisitorLanguage();

  select.value =
    personal || "__default__";

  const defaultOption =
    select.querySelector(
      'option[value="__default__"]'
    );

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
    current === "en"
      ? "Language"
      : current === "hy"
        ? "Լեզու"
        : "Язык"
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
  current = valid.has(code)
    ? code
    : fallback;

  document.documentElement.lang = current;
  document.documentElement.dir = "ltr";

  translatePage();

  document.dispatchEvent(
    new CustomEvent(
      "noire:languagechange",
      {
        detail: {
          language: current,
          ownerDefault,
          personal:
            Boolean(getVisitorLanguage())
        }
      }
    )
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

window.noireSetLanguage = function(code) {
  if (!valid.has(code)) return;

  saveVisitorLanguage(code);
  applyLanguage(code);
};

window.noireResetLanguage = function() {
  removeVisitorLanguage();
  applyLanguage(ownerDefault);
};

window.noireGetLanguage = function() {
  return current;
};

window.noireGetOwnerLanguage = function() {
  return ownerDefault;
};

function createSwitcher() {
  if (
    document.getElementById(
      "noireLanguageSwitcher"
    )
  ) {
    return;
  }

  const wrap =
    document.createElement("div");

  wrap.id = "noireLanguageSwitcher";
  wrap.className =
    "noire-language-switcher";

  wrap.setAttribute(
    "data-noire-no-translate",
    "true"
  );

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
    .addEventListener(
      "change",
      function() {
        chooseVisitor(this.value);
      }
    );

  const mobileNav =
    document.querySelector(".nav-menu");

  const actions =
    document.querySelector(
      ".nav-actions, .admin-top-actions"
    );

  if (
    mobileNav &&
    window
      .matchMedia("(max-width: 850px)")
      .matches
  ) {
    mobileNav.appendChild(wrap);
  } else if (actions) {
    actions.insertBefore(
      wrap,
      actions.firstChild
    );
  } else {
    document.body.appendChild(wrap);
  }
}

function observeDynamicContent() {
  if (!document.body) return;

  const observer =
    new MutationObserver((mutations) => {
      let shouldTranslate = false;

      for (const mutation of mutations) {
        if (
          mutation.type === "childList" &&
          mutation.addedNodes.length
        ) {
          shouldTranslate = true;
          break;
        }
      }

      if (shouldTranslate) {
        translatePage();
      }
    });

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );
}

async function initLanguage() {
  createSwitcher();

  const personal =
    getVisitorLanguage();

  try {
    const response =
      await fetch(
        "/api/site-settings",
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "Site settings unavailable"
      );
    }

    const settings =
      await response.json();

    ownerDefault =
      valid.has(settings?.language)
        ? settings.language
        : fallback;

  } catch (error) {
    console.warn(
      "NOIRÉ language settings:",
      error
    );

    ownerDefault = fallback;
  }

  current =
    personal || ownerDefault;

  applyLanguage(current);

  observeDynamicContent();

  setTimeout(() => {
    if (
      window.noireInitTimeInputs
    ) {
      window.noireInitTimeInputs(
        document
      );
    }
  }, 0);
}

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initLanguage
  );
} else {
  initLanguage();
}

})();