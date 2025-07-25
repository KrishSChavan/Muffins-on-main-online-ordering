const deleteModal = document.getElementById('confirmDeleteModal');
const completeModal = document.getElementById('confirmCompleteModal');

const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');
const confirmComplete = document.getElementById('confirmComplete');
const cancelComplete = document.getElementById('cancelComplete');

let cardIdToComplete = null;
let cardIdToDelete = null;

cancelDelete.addEventListener('click', () => {
  deleteModal.style.display = 'none';
  cardIdToDelete = null; // Reset the ID when canceling
});


cancelComplete.addEventListener('click', () => {
  completeModal.style.display = 'none';
  cardIdToComplete = null; // Reset the ID when canceling
});





confirmDelete.addEventListener('click', () => {
  deleteModal.style.display = 'none';
  // Place your delete logic here, e.g.:
  const card = document.getElementById(cardIdToDelete);
  card.remove();
  if (!document.querySelector('.order-card')) {
    ordersContainer.innerHTML = `<div class="no-orders">No orders</div>`;
  }
});


confirmComplete.addEventListener('click', () => {
  completeModal.style.display = 'none';
  // Place your complete logic here, e.g.:
  const card = document.getElementById(cardIdToComplete);
  
  const name = card.querySelector('.order-info h2').innerText;
  const phone = card.querySelector('.order-info .phone').innerText.split('Phone: ')[1];
  socket.emit('order-complete', card.id, name, phone);
  card.remove();

  if (!document.querySelector('.order-card')) {
    ordersContainer.innerHTML = `<div class="no-orders">No orders</div>`;
  }
});


