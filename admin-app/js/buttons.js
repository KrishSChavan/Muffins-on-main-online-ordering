const editMenuBtn = document.getElementById('edit-menu-btn');
const reloadOrdersBtn = document.getElementById('reload-orders-btn');


reloadOrdersBtn.addEventListener('click', () => {
  location.reload();
});


editMenuBtn.addEventListener('click', () => {
  location.href = 'edit-menu.html';
});
