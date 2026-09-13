document.addEventListener('DOMContentLoaded', () => {
    const search = document.querySelector('#menuSearch');
    const buttons = document.querySelectorAll('.category');
    const grid = document.querySelector('#menuGrid');
    const order = ['all','coffee','tea','breakfast','snacks','food','desserts','drinks','beer','sauces'];
    let activeCategory = 'all';
    const hashCategory = decodeURIComponent(window.location.hash.replace('#','')).toLowerCase();
    if(order.includes(hashCategory)) activeCategory = hashCategory;
    let turnTimer = null;

    const setMenuScene = category => {
        const scenes = document.querySelectorAll('.menu-scene');
        const sceneCategory = category === 'all' ? 'coffee' : category;
        scenes.forEach(scene => scene.classList.toggle('is-active', scene.classList.contains(`scene-${sceneCategory}`)));
    };

    const clearTurnClasses = () => {
        grid?.classList.remove('page-turn-out-next','page-turn-in-next','page-turn-out-prev','page-turn-in-prev');
    };

    const renderWithPageTurn = (nextCategory, searchValue = '') => {
        if (!grid || nextCategory === activeCategory) {
            renderMenu(nextCategory, searchValue);
            return;
        }

        const from = order.indexOf(activeCategory);
        const to = order.indexOf(nextCategory);
        const direction = to >= from ? 'next' : 'prev';

        clearTimeout(turnTimer);
        clearTurnClasses();
        grid.classList.add(`page-turn-out-${direction}`);

        turnTimer = setTimeout(() => {
            activeCategory = nextCategory;
            setMenuScene(activeCategory);
            renderMenu(activeCategory, searchValue);
            grid.classList.remove(`page-turn-out-${direction}`);
            grid.classList.add(`page-turn-in-${direction}`);

            turnTimer = setTimeout(() => clearTurnClasses(), 560);
        }, 300);
    };

    buttons.forEach(item => item.classList.toggle('active', item.dataset.category === activeCategory));
    setMenuScene(activeCategory);
    renderMenu(activeCategory, search?.value || '');

    search?.addEventListener('input', () => renderMenu(activeCategory, search.value));

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const nextCategory = button.dataset.category || 'all';
            if (nextCategory === activeCategory) return;

            buttons.forEach(item => item.classList.remove('active'));
            button.classList.add('active');
            renderWithPageTurn(nextCategory, search?.value || '');
        });
    });
});
