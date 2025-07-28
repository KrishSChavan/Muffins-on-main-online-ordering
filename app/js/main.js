const socket = io('http://localhost:3000/'); // Initialize socket.io client

let allMenuData = [];
let menuDataByCategories = {};

axios.get('/api/menu')
  .then(response => {

    allMenuData = response.data.data || [];
    menuDataByCategories = response.data.groupedByCategory || {};

    populateCategoryDropdown(menuDataByCategories);
    renderMenu(menuDataByCategories); // initial render
  })
  .catch(error => {
    console.error('Error fetching menu:', error);
    document.getElementById('menuContainer').innerHTML = '<p>Failed to load menu.</p>';
  });

function populateCategoryDropdown(data) {
  const select = document.getElementById('categorySelect');
  const search = document.getElementById('searchInput');

  Object.keys(data).forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  select.addEventListener('change', filterAndRender);
  search.addEventListener('input', filterAndRender);
}

function filterAndRender() {
  const selected = document.getElementById('categorySelect').value;
  const searchText = document.getElementById('searchInput').value.trim().toLowerCase();

  let filteredData = {};

  if (searchText === '') {
    filteredData = menuDataByCategories; // No search, show all categories
  } else {
    // Fuzzy search across all items
    const options = {
      keys: ['name', 'description'], // fields to search in each object
      threshold: 0.4 // how fuzzy: lower = more strict, higher = more matches
    };


    const fuse = new Fuse(allMenuData, options);
    const fuzzyResults = fuse.search(searchText);
    const matchedItems = fuzzyResults.map(result => result.item);

    // if (matchedItems.length === 0) {
    //   document.getElementById('menuContainer').innerHTML = '<p>No matching items found.</p>';
    //   return;
    // }

    matchedItems.forEach(item => {
      const category = item.category;
      if (!filteredData[category]) {
        filteredData[category] = [];
      }
      filteredData[category].push(item);
    });
  }


  // Also apply category dropdown filter
  if (selected !== 'all') {
    newFilteredData = {};

    newFilteredData[selected] = filteredData[selected];
    renderMenu(newFilteredData);
  } else {
    // If "all" is selected, render all filtered data
    renderMenu(filteredData);
  }
}



function renderMenu(dataGroupedByCategory) {
  const container = document.getElementById('menuContainer');
  container.innerHTML = ''; // Clear previous content

  if (Object.keys(dataGroupedByCategory).length === 0) { 
    const noItems = document.createElement('div');
    noItems.className = 'no-items fade-in';
    noItems.textContent = 'No menu items found.';
    container.appendChild(noItems);
    return;
  }

  Object.keys(dataGroupedByCategory).forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category fade-in';

    const title = document.createElement('h2');
    title.textContent = category;
    categoryDiv.appendChild(title);

    if (!dataGroupedByCategory[category] || dataGroupedByCategory[category].length === 0) {
      const noItems = document.createElement('div');
      noItems.className = 'no-items fade-in';
      noItems.textContent = 'No menu items found.';
      container.appendChild(noItems);
      return;
    }

    dataGroupedByCategory[category].forEach(item => {

      if (item.hidden) return; // Skip hidden items

      const itemDiv = document.createElement('div');
      itemDiv.className = 'menu-item';
      itemDiv.id = item.id; // Set ID for easy updates

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
      addToOrderBtn.onclick = () => window.showAddToOrderModal(item);

      itemDiv.appendChild(menu_item_info_div);
      itemDiv.appendChild(prices);
      itemDiv.appendChild(addToOrderBtn);
      categoryDiv.appendChild(itemDiv);
    });

    container.appendChild(categoryDiv);
  });
}



socket.on('menu-item-added', (newItem) => {
  if (newItem.hidden) return; // Skip rendering if the item is hidden

  allMenuData.push(newItem);

  if (!menuDataByCategories[newItem.category]) {
    menuDataByCategories[newItem.category] = [];
  }
  menuDataByCategories[newItem.category].push(newItem);
  
  filterAndRender();
});


socket.on('menu-item-updated', (updatedItem) => {
  const index = allMenuData.findIndex(item => item.id === updatedItem.id);
  let oldCategory = null;
  if (index !== -1) {
    oldCategory = allMenuData[index].category; // Save old category
    allMenuData[index] = updatedItem;          // Update the item
  }

  // Ensure the new category array exists
  if (!menuDataByCategories[updatedItem.category]) {
    menuDataByCategories[updatedItem.category] = [];
  }

  // Remove from old category if changed
  if (oldCategory && oldCategory !== updatedItem.category) {
    const oldIndex = menuDataByCategories[oldCategory].findIndex(item => item.id === updatedItem.id);
    if (oldIndex !== -1) {
      menuDataByCategories[oldCategory].splice(oldIndex, 1);
    }
  }

  // Remove any existing in the new/current category to prevent duplicates
  const existingIndex = menuDataByCategories[updatedItem.category].findIndex(item => item.id === updatedItem.id);
  if (existingIndex !== -1) {
    menuDataByCategories[updatedItem.category].splice(existingIndex, 1);
  }

  // Now push the updated item once!
  menuDataByCategories[updatedItem.category].push(updatedItem);

  document.getElementById(updatedItem.id).remove(); // Remove the old item from the DOM

  filterAndRender();
});
