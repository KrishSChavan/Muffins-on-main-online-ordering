const socket = io('http://localhost:3000/');

const ordersContainer = document.getElementById('ordersContainer');

window.addEventListener('load', () => {
  socket.emit('get-order-data');
});

socket.on('new-order', (order) => {
  console.log('New order received:', order);
  addOrder(order);
});

socket.on('load-order-data', (orderData) => {
  ordersContainer.innerHTML = '';

  if (orderData.length === 0) {
    ordersContainer.innerHTML = `<div class="no-orders">No orders</div>`;
    return;
  }

  orderData.sort((a, b) => {
    const dateA = new Date(a.client_order_pickup.replace(' ', 'T'));
    const dateB = new Date(b.client_order_pickup.replace(' ', 'T'));
    return dateB - dateA;
  });

  orderData.forEach((order) => addOrder(order));
});

function addOrder(order) {
  const orderEl = document.createElement('div');
  orderEl.classList.add('order-card');
  orderEl.id = order.id;

  let noOrderElem = document.querySelector('.no-orders');
  if (noOrderElem) noOrderElem.remove();

  const dateObj = new Date(order.client_order_pickup.replace('+00', '').replace(' ', 'T')); // Replace space with 'T'
  const edtString = dateObj.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // console.log(dateObj);
  // console.log(edtString);

  orderEl.innerHTML = `
    <div class="order-content">
      <div class="order-header">
        <div class="order-info">
          <button id="delete-order">DELETE</button>
          <h2>${order.client_name}</h2>
          <p class="phone"><strong>Phone:</strong> ${order.client_phone_number}</p>
          <p><strong>Pickup:</strong> ${edtString}</p>
          <br>
          <p><strong>Subtotal:</strong> $${order.client_subtotal.toFixed(2)}</p>
          <p><strong>Tax:</strong> $${order.client_tax.toFixed(2)}</p>
          <br>
          <p><strong>Total:</strong> $${order.client_final_total.toFixed(2)}</p>
        </div>
      </div>
      <div class="items">
        <strong>Items:</strong>
        <ul>
          ${order.client_order.map(item => `
            <li>${item.item} - ${item.price}</li>
          `).join('')}
        </ul>
      </div>
    </div>
    <div class="order-buttons">
      <button class="order-details">Print Order Details</button>
      <button class="print-btn">Print Receipt</button>
      <button class="complete-btn">Complete Order</button>
    </div>
  `;

  // Complete order button
  const completeBtn = orderEl.querySelector('.complete-btn');
  completeBtn.addEventListener('click', () => {
    completeModal.style.display = 'flex';
    cardIdToComplete = completeBtn.closest('.order-card').id;
  });

  // Print receipt button
  const printBtn = orderEl.querySelector('.print-btn');
  printBtn.addEventListener('click', () => {
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 200px;
              margin: 0;
              padding: 0;
              font-weight: 600;
            }
            .centered-content {
              /* padding: 10px; */
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .center {
              text-align: center;
            }
            .bold {
              /* font-weight: bold; */
              font-weight: 800;
            }
            .line {
              border-top: 1px dashed #000;
              margin: 8px 0;
              width: 100%;
            }
            .item {
              display: flex;
              justify-content: space-between;
              white-space: nowrap;
              width: 100%;
              padding: 2px 0;
            }
            .toppings {
              margin: 2px 0 5px 10px;
              font-size: 11px;
            }
            .totals {
              margin-top: 10px;
              width: 100%;
            }
            .footer {
              margin-top: 12px;
              font-size: 11px;
              text-align: center;
              margin-bottom: 30px;
            }
            .spacer {
              margin: 8px 0;
            }
          </style>
        </head>
        <body>
          <div class="centered-content">
            <div class="center bold">MUFFINS ON MAIN</div>
            <div class="center">Receipt</div>
            <div class="line"></div>

            <div class="spacer"></div>
            <div><strong>Name:</strong> ${order.client_name}</div>
            <div><strong>Phone:</strong> ${order.client_phone_number}</div>

            <div class="line"></div>
            <div class="bold">Items:</div>

            ${order.client_order.map(item => `
              <div class="item">
                <span>${item.item}</span>
                <span>${item.price}</span>
              </div>
            `).join('')}

            <div class="line"></div>

            <div class="totals">
              <div class="item"><span>Subtotal</span><span>$${order.client_subtotal.toFixed(2)}</span></div>
              <div class="item"><span>Tax</span><span>$${order.client_tax.toFixed(2)}</span></div>
              <div class="item bold"><span>Total</span><span>$${order.client_final_total.toFixed(2)}</span></div>
            </div>

            <div class="line"></div>

            <div class="footer">
              Thank you for your order!<br>
              muffinsonmain.com<br>
              (978) 788-4365
            </div>
            <div class="spacer"></div>
            <div>Powered by Krish Chavan</div>
          </div>
        </body>
      </html>
    `;

    window.electronAPI.printReceipt(html);
  });



  // Print order details
  const orderDetailsBtn = orderEl.querySelector('.order-details');
  orderDetailsBtn.addEventListener('click', () => {
    const orderDetailsHTML = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 13px;
              width: 200px;
              margin: 0;
              padding: 0;
              font-weight: 600;
            }
            .line {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .bold {
              font-weight: bold;
            }
            .toppings {
              font-size: 12px;
              margin-left: 5px;
            }
            .item-line {
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div><span class="bold">Name:</span> ${order.client_name}</div>
          <div><span class="bold">Phone:</span> ${order.client_phone_number}</div>

          <div class="line"></div>
          <div class="bold">Order Details:</div>

          ${order.client_order.map(item => `
            <div class="item-line">
              <div>${item.quantity || 1}x ${item.item}</div>
              ${item.toppings.length ? `<div class="toppings">+ ${item.toppings.join(', ')}</div>` : ''}
            </div>
          `).join('')}

          <div class="line"></div>
        </body>
      </html>
    `;

    window.electronAPI.printReceipt(orderDetailsHTML);
  });




  const deleteBtn = orderEl.querySelector('#delete-order');
  deleteBtn.addEventListener('click', () => {
    deleteModal.style.display = 'flex';
    cardIdToDelete = deleteBtn.closest('.order-card').id;
  });

  

  ordersContainer.prepend(orderEl);
}
