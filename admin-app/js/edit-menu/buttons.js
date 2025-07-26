const backToDashboardBtn = document.getElementById('dashboard-btn');
const reloadMenuBtn = document.getElementById('reload-menu-btn');

reloadMenuBtn.addEventListener('click', () => {
  location.reload();
});


backToDashboardBtn.addEventListener('click', () => {
  location.href = 'admin.html';
});
