menuContainer.addEventListener('click', function(e) {
  if (e.target.classList.contains('edit-btn')) {
    const parentDiv = e.target.closest('.menu-item');
    if (parentDiv) {
      const id = parentDiv.id;
      // console.log('Div ID:', id);
      editItemModal.style.display = 'flex';
      editItemForm.reset(); // Reset form fields
      const item = allMenuData.find(item => item.id === id);
      if (item) {
        // Populate the edit form with item data
        editItemForm.querySelector('input[name="name"]').value = item.name;
        editItemForm.querySelector('textarea[name="description"]').value = item.description;
        editItemForm.querySelector('input[name="price"]').value = item.price;
        editItemForm.querySelector('input[name="category"]').value = item.category;
        editItemForm.querySelector('input[name="hidden"]').checked = item.hidden;
        editItemForm.dataset.itemId = id; // Store the ID for later use
      }
    }
  }
});




menuContainer.addEventListener('click', function(e) {
  if (e.target.classList.contains('hide-checkbox')) {
    const parentDiv = e.target.closest('.menu-item');
    console.log('Checkbox clicked for item:', parentDiv.id);
    if (parentDiv) {
      const id = parentDiv.id;
      socket.emit('toggle-item-visibility', id, e.target.checked);
      const item = allMenuData.find(item => item.id === id);
      if (item) {
        item.hidden = e.target.checked; // Update the item's hidden status
      }
      // update the menuDataByCategories variable
      if (menuDataByCategories[item.category]) {
        const index = menuDataByCategories[item.category].findIndex(i => i.id === id);
        if (index !== -1) {
          menuDataByCategories[item.category][index].hidden = item.hidden; // Update the hidden status in the category array
        }
      }
    }
  }
});
