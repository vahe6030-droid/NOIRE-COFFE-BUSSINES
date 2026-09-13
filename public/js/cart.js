const CART_KEY = "noireCart";

function getCart() {
    try {
        const value = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        return Array.isArray(value) ? value.filter(item => item && Number.isFinite(Number(item.id)) && Number(item.quantity) > 0) : [];
    } catch {
        localStorage.removeItem(CART_KEY);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
    );

    updateCartUI();
}

function addToCart(product) {
    const cart = getCart();

    const existing = cart.find(
        item => item.id === product.id
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart(cart);

    showToast(
        `${product.name} добавлен в корзину`
    );
}

function removeFromCart(id) {
    const cart = getCart().filter(
        item => item.id !== id
    );

    saveCart(cart);
}

function changeQuantity(id, change) {
    const cart = getCart();

    const item = cart.find(
        item => item.id === id
    );

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(id);
        return;
    }

    saveCart(cart);
}

function cartTotal() {
    return getCart().reduce(
        (sum, item) =>
            sum + item.price * item.quantity,
        0
    );
}

function cartCount() {
    return getCart().reduce(
        (sum, item) =>
            sum + item.quantity,
        0
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat("ru-RU")
        .format(value) + " ֏";
}

function updateCartUI() {
    const count = document.querySelector(".cart-count");

    if (count) {
        count.textContent = cartCount();
    }

    const container =
        document.querySelector("#cartItems");

    const total =
        document.querySelector("#cartTotal");

    if (!container) return;

    const cart = getCart();

    if (!cart.length) {
        container.innerHTML = `
            <div class="empty-cart">
                <div style="font-size:45px;margin-bottom:15px">
                    ☕
                </div>

                <h3>Корзина пуста</h3>

                <p style="margin-top:8px">
                    Добавьте что-нибудь вкусное
                </p>
            </div>
        `;

        if (total) {
            total.textContent = formatMoney(0);
        }

        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">

            <img
                class="cart-item-image"
                src="${item.image}"
                alt="${String(item.name).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\'":"&#039;"}[c]))}"
            >

            <div>
                <div class="cart-item-name">
                    ${String(item.name).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\'":"&#039;"}[c]))}
                </div>

                <div class="cart-item-price">
                    ${formatMoney(item.price)}
                </div>

                <div class="quantity">
                    <button
                        onclick="changeQuantity(${item.id}, -1)"
                    >
                        −
                    </button>

                    <span>${item.quantity}</span>

                    <button
                        onclick="changeQuantity(${item.id}, 1)"
                    >
                        +
                    </button>
                </div>
            </div>

            <button
                class="icon-button"
                onclick="removeFromCart(${item.id})"
            >
                ×
            </button>

        </div>
    `).join("");

    if (total) {
        total.textContent =
            formatMoney(cartTotal());
    }
}

function openCart() {
    document
        .querySelector("#cartOverlay")
        ?.classList.add("open");
}

function closeCart() {
    document
        .querySelector("#cartOverlay")
        ?.classList.remove("open");
}

function repeatLastOrder() {
    let last = null;
    try { last = JSON.parse(localStorage.getItem("noireLastOrder") || "null"); } catch { localStorage.removeItem("noireLastOrder"); }

    if (!last || !last.items?.length) {
        showToast("Предыдущих заказов пока нет");
        return;
    }

    saveCart(
        last.items.map(item => ({
            ...item
        }))
    );

    showToast("Предыдущий заказ добавлен в корзину");

    setTimeout(() => {
        window.location.href = "/checkout.html";
    }, 700);
}

document.addEventListener(
    "DOMContentLoaded",
    updateCartUI
);

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.openCart = openCart;
window.closeCart = closeCart;
window.repeatLastOrder = repeatLastOrder;
window.getCart = getCart;
window.cartTotal = cartTotal;
window.formatMoney = formatMoney;
