const socket = io('http://localhost:3000/'); // Initialize socket.io client

const backToDashboardBtn = document.getElementById('dashboard-btn');
const reloadMenuBtn = document.getElementById('reload-menu-btn');

reloadMenuBtn.addEventListener('click', () => {
  location.reload();
});


backToDashboardBtn.addEventListener('click', () => {
  location.href = 'admin.html';
});








const openModalBtn = document.getElementById('create-new-item');
const modal = document.getElementById('itemModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const itemForm = document.getElementById('itemForm');

closeModalBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; }

itemForm.onsubmit = function(e) {
  e.preventDefault();
  // Get form data
  const formData = new FormData(itemForm);
  const newItem = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: parseFloat(formData.get('price')),
    hidden: !!formData.get('hidden'),
    category: formData.get('category')
  };
  // Do something with data (e.g., send to server or display)
  socket.emit('add-menu-item', newItem);
  modal.style.display = 'none';
  itemForm.reset();


  // Add new item to the menu data
  allMenuData.push(newItem);
  
  // Update the grouped data
  if (!menuDataByCategories[newItem.category]) {
    menuDataByCategories[newItem.category] = [];
  }
  menuDataByCategories[newItem.category].push(newItem);

  // Re-render the menu
  renderMenu(menuDataByCategories);
};



