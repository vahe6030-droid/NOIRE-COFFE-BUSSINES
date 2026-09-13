document.addEventListener('DOMContentLoaded',()=>{
    const toggle=document.querySelector('#mobileToggle');
    const nav=document.querySelector('.nav-menu');
    if(toggle&&nav){toggle.addEventListener('click',()=>{nav.classList.toggle('open');toggle.setAttribute('aria-expanded',nav.classList.contains('open')?'true':'false')});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));}
    document.addEventListener('click',e=>{const btn=e.target.closest('[data-product-id]');if(!btn)return;const item=menuData.find(x=>Number(x.id)===Number(btn.dataset.productId));if(item&&typeof window.addToCart==='function')window.addToCart(item);});
});
let menuData = [];
function escHtml(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;');}
function safeImageUrl(v,fallback){const value=String(v||'').trim();if(/^data:image\/(jpeg|jpg|png|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/i.test(value))return value;try{const u=new URL(value,location.origin);return ['http:','https:'].includes(u.protocol)?u.href:fallback;}catch{return fallback;}}

const categoryNames = {
    coffee: "Кофе",
    tea: "Чай",
    breakfast: "Завтраки",
    snacks: "Закуски",
    food: "Основные блюда",
    desserts: "Десерты",
    drinks: "Напитки",
    beer: "Пиво",
    sauces: "Соусы"
};

const categoryImageFallbacks = {
    coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85',
    tea: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=85',
    breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=85',
    snacks: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=900&q=85',
    food: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=85',
    desserts: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=85',
    drinks: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85',
    beer: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85',
    sauces: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85'
};

async function loadMenu() {
    try {
        const response =
            await fetch("/api/menu");

        menuData =
            await response.json();

        window.noireMenu = menuData;

        renderFeatured();

        if (
            document.querySelector("#menuGrid")
        ) {
            renderMenu();
        }
    } catch (error) {
        console.error(error);

        showToast(
            "Не удалось загрузить меню"
        );
    }
}

function foodCard(item) {
    return `
        <article class="food-card reveal">

            <div class="food-image-wrap">

                <img
                    class="food-image"
                    src="${safeImageUrl(item.image,categoryImageFallbacks[item.category] || categoryImageFallbacks.food)}"
                    alt="${escHtml(item.name)}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${categoryImageFallbacks[item.category] || categoryImageFallbacks.food}'"
                >

                <div class="food-category">
                    ${escHtml(categoryNames[item.category] || item.category)}
                </div>

            </div>

            <div class="food-content">

                <h3 class="food-name">
                    ${escHtml(item.name)}
                </h3>

                <p class="food-description">
                    ${escHtml(item.description)}
                </p>

                <div class="food-bottom">

                    <div class="food-price">
                        ${formatMoney(item.price)}
                    </div>

                    <button
                        class="add-button"
                        data-product-id="${Number(item.id)}"
                        aria-label="Добавить"
                    >
                        +
                    </button>

                </div>

            </div>

        </article>
    `;
}

function renderFeatured() {
    const container =
        document.querySelector("#featuredMenu");

    if (!container) return;

    const popular =
        menuData
            .filter(item => item.popular)
            .slice(0, 8);

    container.innerHTML =
        popular.map(foodCard).join("");

    initReveal();
}

function renderMenu(
    category = "all",
    search = ""
) {
    const container =
        document.querySelector("#menuGrid");

    if (!container) return;

    const query =
        search.trim().toLowerCase();

    const filtered =
        menuData.filter(item => {

            const categoryMatch =
                category === "all" ||
                item.category === category;

            const searchMatch =
                !query ||
                item.name.toLowerCase().includes(query) ||
                item.description
                    .toLowerCase()
                    .includes(query);

            return categoryMatch && searchMatch;
        });

    if (!filtered.length) {
        container.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:80px;
                color:#9e9389;
            ">
                <div style="font-size:50px">
                    🔎
                </div>

                <h3 style="
                    margin-top:15px;
                    color:white;
                ">
                    Ничего не найдено
                </h3>

                <p style="margin-top:8px">
                    Попробуйте изменить запрос
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        filtered.map(foodCard).join("");

    initReveal();
}

function showToast(message) {
    let toast =
        document.querySelector("#toast");

    if (!toast) {
        toast =
            document.createElement("div");

        toast.id = "toast";
        toast.className = "toast";

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(window.noireToastTimer);

    window.noireToastTimer =
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2600);
}

function initReveal() {
    const elements =
        document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        elements.forEach(el =>
            el.classList.add("visible")
        );

        return;
    }

    const observer =
        new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );
                    }
                });
            },
            {
                threshold: .12
            }
        );

    elements.forEach(element =>
        observer.observe(element)
    );
}

function setupNavbar() {
    const header =
        document.querySelector(".header");

    window.addEventListener(
        "scroll",
        () => {
            header?.classList.toggle(
                "scrolled",
                window.scrollY > 30
            );
        }
    );

    const toggle =
        document.querySelector("#mobileToggle");

    const nav =
        document.querySelector(".nav-menu");

    toggle?.addEventListener(
        "click",
        () => {
            nav?.classList.toggle("open");
        }
    );
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        setupNavbar();
        loadMenu();
        initReveal();

        document
            .querySelector("#cartButton")
            ?.addEventListener(
                "click",
                openCart
            );

        document
            .querySelector("#closeCart")
            ?.addEventListener(
                "click",
                closeCart
            );

        document
            .querySelector("#cartOverlay")
            ?.addEventListener(
                "click",
                event => {
                    if (
                        event.target.id ===
                        "cartOverlay"
                    ) {
                        closeCart();
                    }
                }
            );
    }
);

window.renderMenu = renderMenu;
window.showToast = showToast;

// NOIRÉ AI Assistant — natural chat, restaurant actions and optional general AI provider.
function initNoireAI(){
    if(document.querySelector('#noireAiPanel')) return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<button id="noireAiLaunch" class="noire-ai-launch" aria-label="NOIRÉ AI">✦</button><section id="noireAiPanel" class="noire-ai-panel"><header class="noire-ai-head"><div><strong>NOIRÉ AI</strong><small>YOUR TABLE ASSISTANT</small></div><button class="noire-ai-close" id="noireAiClose">×</button></header><div id="noireAiMessages" class="noire-ai-messages"><div class="noire-ai-msg">Привет! Чем могу помочь?</div></div><div class="noire-ai-suggestions"><button data-aiq="Что есть в меню?">Меню</button><button data-aiq="Что посоветуешь из десертов?">Десерты</button><button data-aiq="Добавь капучино в корзину">Добавить кофе</button><button data-aiq="Хочу забронировать столик">Бронь</button></div><form id="noireAiForm" class="noire-ai-form"><input id="noireAiInput" placeholder="Напишите что угодно..." autocomplete="off"><button aria-label="Отправить">→</button></form></section>`;
    document.body.appendChild(wrap);
    const panel=document.querySelector('#noireAiPanel');
    const messages=document.querySelector('#noireAiMessages');
    const history=[];
    const money=n=>new Intl.NumberFormat('ru-RU').format(Number(n||0))+' ֏';

    function add(text,user=false){
        const el=document.createElement('div');
        el.className='noire-ai-msg'+(user?' user':'');
        el.textContent=text;
        messages.appendChild(el);
        messages.scrollTop=messages.scrollHeight;
    }

    function runAction(action){
        if(!action) return;
        if(action.type==='add_to_cart' && action.item && typeof window.addToCart==='function'){
            const qty=Math.max(1,Math.min(50,Number(action.item.quantity)||1));
            for(let i=0;i<qty;i++) window.addToCart({...action.item,quantity:1});
            add(`${action.item.name} добавлен в корзину${qty>1?` ×${qty}`:''}.`);
        }
        if(action.type==='open_reservation') setTimeout(()=>{window.location.href='/reservation.html'},180);
        if(action.type==='open_checkout') setTimeout(()=>{window.location.href='/checkout.html'},180);
        if(action.type==='open_menu') setTimeout(()=>{window.location.href=`/menu.html#${action.category||'all'}`},180);
    }

    async function ask(q){
        add(q,true);
        history.push({role:'user',content:q});
        try{
            const r=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,history:history.slice(-10)})});
            const d=await r.json();
            if(!r.ok) throw new Error(d.message||'AI error');
            add(d.answer||'Готово.');
            history.push({role:'assistant',content:d.answer||''});
            runAction(d.action);
        }catch(e){
            add('AI сейчас недоступен. Проверьте OPENAI_API_KEY в файле .env и перезапустите сервер.');
        }
    }

    document.querySelector('#noireAiLaunch').onclick=()=>panel.classList.toggle('open');
    document.querySelector('#aiOpenTop')?.addEventListener('click',()=>panel.classList.add('open'));
    document.querySelector('#noireAiClose').onclick=()=>panel.classList.remove('open');
    document.querySelector('#noireAiForm').onsubmit=e=>{
        e.preventDefault();
        const input=document.querySelector('#noireAiInput');
        const q=input.value.trim();
        if(q){input.value='';ask(q)}
    };
    document.querySelectorAll('[data-aiq]').forEach(b=>b.onclick=()=>ask(b.dataset.aiq));
}
document.addEventListener('DOMContentLoaded',initNoireAI);

function initNoireIntro(){
    const intro=document.querySelector('#noireIntro');
    if(!intro) return;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let seen=false;
    try{seen=sessionStorage.getItem('noireIntroSeen')==='1';}catch{}
    if(seen || reduced){intro.remove();return;}
    try{sessionStorage.setItem('noireIntroSeen','1');}catch{}
    const finish=()=>{intro.classList.add('is-done');setTimeout(()=>intro.remove(),900)};
    const timer=setTimeout(finish,3600);
    intro.addEventListener('click',()=>{clearTimeout(timer);finish()},{once:true});
}
document.addEventListener('DOMContentLoaded',initNoireIntro);

(async()=>{try{const r=await fetch('/api/site-settings');const s=await r.json();if(s.success){document.title=s.siteName||document.title;document.querySelectorAll('.logo-main,.auth-brand b').forEach(x=>x.textContent=(s.siteName||'NOIRÉ COFFEE').replace(/\s+COFFEE$/i,''));document.querySelectorAll('.logo-sub,.auth-brand span').forEach(x=>x.textContent=s.siteSubtitle||'COFFEE & KITCHEN')}}catch{}})();

async function initPublicAccountUI(){
    const navs=document.querySelectorAll('.nav-menu');
    navs.forEach(nav=>{
        if(nav.querySelector('[data-account-link]')) return;
        const a=document.createElement('a'); a.href='/account.html'; a.className='nav-link'; a.dataset.accountLink='1'; a.textContent='Личный кабинет'; nav.appendChild(a);
    });
    
    try{
        const r=await fetch('/api/auth/me',{credentials:'same-origin'});
        const d=await r.json(); if(!r.ok||!d.user)throw 0;
        const u=d.user; const initials=[u.firstName||String(u.name||'').trim().split(/\s+/)[0],u.lastName||''].filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'◎';
        document.querySelectorAll('[data-account-link]').forEach(a=>{a.textContent=initials;a.title='Личный кабинет';a.setAttribute('aria-label','Личный кабинет');a.classList.add('account-initials');});
        document.querySelectorAll('.nav-actions').forEach(actions=>{let link=actions.querySelector('.account-initials');if(!link){link=document.createElement('a');link.href='/account.html';link.className='icon-button account-initials';link.title='Личный кабинет';link.setAttribute('aria-label','Личный кабинет');link.textContent=initials;actions.prepend(link);}});
        document.querySelectorAll('.nav-actions > a[href="/account.html"]').forEach(a=>{a.textContent=initials;a.classList.add('account-initials');});
    }catch{}
}
document.addEventListener('DOMContentLoaded',initPublicAccountUI);
