let menuData = [];

axios.get('/api/menu')
  .then(response => {
    menuData = response.data;
    populateCategoryDropdown(menuData);
    renderMenu(menuData); // initial render
  })
  .catch(error => {
    console.error('Error fetching menu:', error);
    document.getElementById('menuContainer').innerHTML = '<p>Failed to load menu.</p>';
  });

function populateCategoryDropdown(data) {
  const select = document.getElementById('categorySelect');
  const search = document.getElementById('searchInput');

  data.forEach(category => {
    const option = document.createElement('option');
    option.value = category.category;
    option.textContent = category.category;
    select.appendChild(option);
  });

  select.addEventListener('change', filterAndRender);
  search.addEventListener('input', filterAndRender);
}

function filterAndRender() {
  const selected = document.getElementById('categorySelect').value;
  const searchText = document.getElementById('searchInput').value.trim().toLowerCase();

  let filteredData = [];

  if (searchText === '') {
    // Basic category filter only
    filteredData = selected === 'all'
      ? menuData
      : menuData.filter(cat => cat.category === selected);
  } else {
    // Fuzzy search across all items
    const fuse = new Fuse(menuData.flatMap(cat =>
      cat.items.map(item => ({
        ...item,
        category: cat.category
      }))
    ), {
      keys: ['name', 'description'],
      threshold: 0.4, // smaller = stricter
    });

    const fuzzyResults = fuse.search(searchText);

    const matchedItems = fuzzyResults.map(result => result.item);

    // Group back by category
    const categoryMap = {};
    matchedItems.forEach(item => {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = [];
      }
      categoryMap[item.category].push(item);
    });

    filteredData = Object.entries(categoryMap).map(([category, items]) => ({
      category,
      items
    }));

    // Also apply category dropdown filter
    if (selected !== 'all') {
      filteredData = filteredData.filter(cat => cat.category === selected);
    }
  }

  renderMenu(filteredData);
}

function renderMenu(data) {
  console.log(data);

  const container = document.getElementById('menuContainer');
  container.innerHTML = ''; // Clear previous content

  if (data.length === 0) {
    const noItems = document.createElement('div');
    noItems.className = 'no-items fade-in';
    noItems.textContent = 'No menu items found.';
    container.appendChild(noItems);
    return;
  }

  data.forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category fade-in';

    const title = document.createElement('h2');
    title.textContent = category.category;
    categoryDiv.appendChild(title);

    // Separate items with and without pricing
    const itemsWithPricing = [];
    const itemsWithoutPricing = [];
    category.items.forEach(item => {
      if (item.price) {
        itemsWithPricing.push(item);
      } else {
        itemsWithoutPricing.push(item);
      }
    });

    // Show notes for items without pricing at the top
    itemsWithoutPricing.forEach(item => {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'menu-item-note';
      noteDiv.textContent = item.name + (item.description ? (': ' + item.description) : '');
      categoryDiv.appendChild(noteDiv);
    });

    // Render regular menu items with pricing
    itemsWithPricing.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'menu-item';

      const name = document.createElement('div');
      name.className = 'menu-item-name';
      name.textContent = item.name;

      const description = document.createElement('div');
      description.className = 'menu-item-description';
      description.textContent = item.description || '';

      const menu_item_info_div = document.createElement('div');
      menu_item_info_div.className = "menu-item-info";
      menu_item_info_div.appendChild(name);
      menu_item_info_div.appendChild(description);

      const prices = document.createElement('div');
      prices.className = 'menu-item-price';
      let priceText = `$${item.price}`;
      prices.textContent = priceText;

      const addToOrderBtn = document.createElement('button');
      addToOrderBtn.className = 'add-to-order-btn';
      addToOrderBtn.textContent = 'Add to Order';
      // You can add an event listener here for order logic if needed

      itemDiv.appendChild(menu_item_info_div);
      itemDiv.appendChild(prices);
      itemDiv.appendChild(addToOrderBtn);
      categoryDiv.appendChild(itemDiv);
    });

    container.appendChild(categoryDiv);
  });

  // Attach event listeners to Add to Order buttons
  const addBtns = container.getElementsByClassName('add-to-order-btn');
  let btnIdx = 0;
  data.forEach(category => {
    category.items.forEach(item => {
      if (item.price) {
        const btn = addBtns[btnIdx];
        if (btn) {
          btn.onclick = () => window.showAddToOrderModal(item, category);
        }
        btnIdx++;
      }
    });
  });
}

// Attach modal logic to Add to Order buttons after menu render
const origRenderMenu = renderMenu;
renderMenu = function(data) {
  origRenderMenu(data);
  // Attach event listeners to Add to Order buttons
  const container = document.getElementById('menuContainer');
  const addBtns = container.getElementsByClassName('add-to-order-btn');
  let btnIdx = 0;
  data.forEach(category => {
    category.items.forEach(item => {
      if (item.price) {
        const btn = addBtns[btnIdx];
        if (btn) {
          btn.onclick = () => window.showAddToOrderModal(item);
        }
        btnIdx++;
      }
    });
  });
};
