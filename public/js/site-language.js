(function(){
  'use strict';
  const fallback='ru';
  const storageKey='noireVisitorLanguage';
  const languages=[
    ['ru','Русский'],['en','English'],['hy','Հայերեն'],['fr','Français'],['de','Deutsch'],['es','Español'],['it','Italiano'],['pt','Português'],['tr','Türkçe'],['ar','العربية'],['fa','فارسی'],['he','עברית'],['zh-CN','简体中文'],['zh-TW','繁體中文'],['ja','日本語'],['ko','한국어'],['hi','हिन्दी'],['bn','বাংলা'],['ur','اردو'],['id','Bahasa Indonesia'],['ms','Bahasa Melayu'],['th','ไทย'],['vi','Tiếng Việt'],['nl','Nederlands'],['pl','Polski'],['uk','Українська'],['cs','Čeština'],['sk','Slovenčina'],['ro','Română'],['hu','Magyar'],['el','Ελληνικά'],['bg','Български'],['sr','Српски'],['hr','Hrvatski'],['sl','Slovenščina'],['sv','Svenska'],['da','Dansk'],['no','Norsk'],['fi','Suomi'],['et','Eesti'],['lv','Latviešu'],['lt','Lietuvių'],['is','Íslenska'],['ga','Gaeilge'],['cy','Cymraeg'],['mt','Malti'],['sq','Shqip'],['mk','Македонски'],['bs','Bosanski'],['ca','Català'],['eu','Euskara'],['gl','Galego'],['af','Afrikaans'],['sw','Kiswahili'],['am','አማርኛ'],['az','Azərbaycan'],['be','Беларуская'],['ka','ქართული'],['kk','Қазақша'],['ky','Кыргызча'],['lo','ລາວ'],['mn','Монгол'],['my','မြန်မာ'],['ne','नेपाली'],['ps','پښتو'],['pa','ਪੰਜਾਬੀ'],['ta','தமிழ்'],['te','తెలుగు'],['mr','मराठी'],['gu','ગુજરાતી'],['kn','ಕನ್ನಡ'],['ml','മലയാളം'],['si','සිංහල'],['km','ខ្មែរ'],['ceb','Cebuano'],['tl','Filipino'],['jv','Basa Jawa'],['su','Basa Sunda'],['zu','isiZulu'],['xh','isiXhosa'],['yo','Yorùbá'],['ig','Igbo'],['ha','Hausa']
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

  let current=fallback;
  let initialized=false;
  let ownerDefault=fallback;

  function setCookie(name,value,days){
    document.cookie=name+'='+encodeURIComponent(value)+';path=/;max-age='+(days*86400)+';SameSite=Lax';
  }
  function clearTranslateCookie(){
    document.cookie='googtrans=;path=/;max-age=0;SameSite=Lax';
    document.cookie='googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
  function getVisitorLanguage(){
    try{
      const v=localStorage.getItem(storageKey);
      return v && valid.has(v) ? v : null;
    }catch(e){return null;}
  }
  function saveVisitorLanguage(code){
    try{localStorage.setItem(storageKey,code)}catch(e){}
  }
  function removeVisitorLanguage(){
    try{localStorage.removeItem(storageKey)}catch(e){}
  }
  function updateSwitcher(){
    const select=document.getElementById('noireLanguageSelect');
    if(!select)return;
    select.value=current;
    const personal=!!getVisitorLanguage();
    select.title=personal?'Ваш личный язык':'Язык владельца по умолчанию';
    const hint=document.getElementById('noireLanguageHint');
    if(hint)hint.textContent=personal?'Ваш язык':'По умолчанию';
  }
  function apply(code,reload){
    code=valid.has(code)?code:fallback;
    current=code;
    document.documentElement.lang=code;
    document.documentElement.dir=['ar','fa','he','ur'].includes(code)?'rtl':'ltr';
    updateSwitcher();
    if(code===fallback){
      clearTranslateCookie();
      if(initialized && reload!==false){location.reload();}
      return;
    }
    setCookie('googtrans','/ru/'+code,365);
    const combo=document.querySelector('.goog-te-combo');
    if(combo){
      combo.value=code;
      combo.dispatchEvent(new Event('change'));
      return;
    }
    loadGoogle();
  }
  function chooseVisitor(code){
    if(code==='__default__'){
      removeVisitorLanguage();
      apply(ownerDefault,true);
      return;
    }
    saveVisitorLanguage(code);
    apply(code,true);
  }
  window.noireSetLanguage=function(code){
    saveVisitorLanguage(valid.has(code)?code:fallback);
    apply(code,true);
  };
  window.noireResetLanguage=function(){
    removeVisitorLanguage();
    apply(ownerDefault,true);
  };
  window.googleTranslateElementInit=function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ru',autoDisplay:false,multilanguagePage:true},'google_translate_element');
      initialized=true;
      setTimeout(function(){
        const combo=document.querySelector('.goog-te-combo');
        if(combo && current!==fallback){combo.value=current;combo.dispatchEvent(new Event('change'));}
      },250);
    }catch(e){console.warn('NOIRÉ language init:',e)}
  };
  function loadGoogle(){
    if(document.getElementById('noire-google-translate'))return;
    const s=document.createElement('script');
    s.id='noire-google-translate';
    s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async=true;
    document.head.appendChild(s);
  }
  function createSwitcher(){
    if(document.getElementById('noireLanguageSwitcher'))return;
    const wrap=document.createElement('div');
    wrap.id='noireLanguageSwitcher';
    wrap.className='noire-language-switcher';
    wrap.innerHTML='<span class="noire-language-mark" aria-hidden="true">◎</span><div class="noire-language-fields"><select id="noireLanguageSelect" aria-label="Язык сайта"></select><small id="noireLanguageHint">По умолчанию</small></div>';
    const select=wrap.querySelector('select');
    select.innerHTML='<option value="__default__">По умолчанию</option>'+languages.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('');
    select.addEventListener('change',function(){chooseVisitor(this.value)});
    const actions=document.querySelector('.nav-actions, .admin-top-actions');
    if(actions)actions.insertBefore(wrap,actions.firstChild);
    else document.body.appendChild(wrap);
  }
  async function init(){
    createSwitcher();
    const personal=getVisitorLanguage();
    try{
      const r=await fetch('/api/site-settings',{cache:'no-store'});
      const s=await r.json();
      ownerDefault=valid.has(s.language)?s.language:fallback;
    }catch(e){console.warn('NOIRÉ language settings:',e);ownerDefault=fallback;}
    current=personal||ownerDefault;
    document.documentElement.lang=current;
    document.documentElement.dir=['ar','fa','he','ur'].includes(current)?'rtl':'ltr';
    updateSwitcher();
    if(current!==fallback){
      setCookie('googtrans','/ru/'+current,365);
      loadGoogle();
    }else{
      clearTranslateCookie();
    }
  }
  document.addEventListener('DOMContentLoaded',function(){
    const host=document.createElement('div');
    host.id='google_translate_element';
    host.setAttribute('aria-hidden','true');
    host.style.cssText='position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden';
    document.body.appendChild(host);
    init();
    setTimeout(function(){ if(window.noireInitTimeInputs) window.noireInitTimeInputs(document); },0);
  });
})();
