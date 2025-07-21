// Modal logic for Add to Order
const modal = document.getElementById('addToOrderModal');
const modalItemInfo = document.getElementById('modalItemInfo');
const modalPriceButtons = document.getElementById('modalPriceButtons');
const closeModalBtn = document.getElementById('closeModalBtn');


function showAddToOrderModal(item) {
  modalItemInfo.innerHTML = 
    `<div class="menu-catagory-name">${item.category}:</div>
    <div class="menu-item-name">${item.name}</div>` +
    (item.description ? `<div class="menu-item-description">${item.description}</div>` : '') +
    (item.notes ? `<div class="menu-item-note">${item.notes}</div>` : '');

  modalPriceButtons.innerHTML = '';

  const createPriceButton = (label, size, basePrice) => {
    const btn = document.createElement('button');
    btn.className = 'price-button';
    btn.textContent = `Add to Order: $${basePrice}`;

    btn.onclick = () => {
      const itemCopy = {
        ...item,
        price: `$${basePrice}`
      };

      addToOrder(itemCopy);
      closeModal();
    };

    modalPriceButtons.appendChild(btn);
  };

  createPriceButton('', 'default', item.price);
  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
}

closeModalBtn.onclick = closeModal;
window.onclick = function(event) {
  if (event.target === modal) {
    closeModal();
  }
};

function addToOrder(item) {
  let itemText = `${item.name}`;
  let priceText = item.price;

  const order = {
    item: itemText,
    price: priceText,
  };

  addToCart(order);
}

window.showAddToOrderModal = showAddToOrderModal;
window.addToOrder = addToOrder;
