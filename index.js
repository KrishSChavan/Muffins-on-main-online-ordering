const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');
require('dotenv').config();


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


webpush.setVapidDetails(
  `mailto:${process.env.PERSONAL_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const users = {};         // { name: socketId }
const subscriptions = {}; // { name: PushSubscription }


// const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const PORT = process.env.PORT || 3000;



const basicAuth = require('express-basic-auth');



// Middleware
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(bodyParser.json());
//app.use(express.static(path.join(__dirname, 'app'))); // Serve static files from /app
app.use('/', express.static(path.join(__dirname, 'app')));
app.use('/admin', express.static(path.join(__dirname, 'edit-menu-app')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});


app.use('/admin', basicAuth({
  users: { 'admin': '1234' },
  challenge: true
}));
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'edit-menu-app', 'edit-menu.html'));
});

app.post('/api/orders', async (req, res) => {
  const order = req.body;

  const name = req.body.client_name;
  const phone = req.body.client_phone_number;
  const pickup_date = req.body.client_order_pickup.split('T')[0];
  const pickup_time = req.body.client_order_pickup.split('T')[1].slice(0, 5); // Extract HH:MM from the datetime string
  const items = req.body.client_order;
  const subtotal = req.body.client_subtotal;
  const tax = req.body.client_tax;
  const final_total = req.body.client_final_total;

  // Basic validation
  if (!name || !phone || !pickup_date || !pickup_time || !items || items.length === 0 || !subtotal || !tax || !final_total || subtotal == 0 || tax == 0 || final_total == 0) {
    return res.status(400).json({ error: 'Invalid order data.' });
  }

  const orderSummary = items.map(i => `• ${i.item} - ${i.price}`).join('\n');
  const messageBody = `Hi ${name}, your order has been received:\n\n${orderSummary}\n\nTotal: ${final_total}`;

  // console.log('Received order:', { name, phone, items, subtotal, tax, final_total });

  try {
    // await client.messages.create({
    //   body: messageBody,
    //   from: process.env.TWILIO_PHONE,
    //   to: phone,
    // });


    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          client_name: name,
          client_phone_number: phone,
          client_order_pickup: `${pickup_date}T${pickup_time}:00`,
          client_order: items,
          client_subtotal: subtotal,
          client_tax: tax,
          client_final_total: final_total
        }
      ])
      .select()

    if (error) {
      console.error('Insert error:', error);
      res.status(500).json({ error: 'There was a problem saving your order.' });
    } else {
      updateLogs(`ORDER_RECEIVED`, `Order received from ${name} (${phone}) for pickup on ${pickup_date} at ${pickup_time}. Items: ${JSON.stringify(items)}`);
      console.log('Inserted order:', data);
      res.status(201).json({ message: 'Order received and SMS sent.' });
      io.emit('new-order', data[0]);
      console.log(`registered ${name}`);
      users[name] = data[0].id;
      console.log(data[0].id);
    }

  } catch (err) {
    console.error('SMS error:', err);
    res.status(500).json({ error: 'Order received, but SMS failed to send.' });
  }
});



// GET /menu → serve the JSON
app.get('/api/menu', async (req, res) => {


  const { data, error } = await supabase
      .from('menu_items')
      .select('*')

  if (error) {
    console.error('Failed to read menu.json:', error);
    return res.status(500).json({ error: 'Failed to load menu' });
  }

  // console.log('Menu data:', data);

  // res.json(data);

  const groupedByCategory = {};
  data.forEach(item => {
    const category = item.category;
    if (!groupedByCategory[category]) {
      groupedByCategory[category] = [];
    }
    groupedByCategory[category].push(item);
  });

  // console.log(groupedByCategory);
  return res.json({
    data: data,
    groupedByCategory: groupedByCategory
  });
});



async function updateLogs(for_, msg) {
  const { data, error } = await supabase
    .from('logs')
    .insert({ for: for_, message: msg })
}




io.on('connection', (socket) => {
  console.log("connection: ", socket.id);
  
  // updateLogs(`CONNECTION`, `New connection: ${socket.id}`);

  socket.on('get-order-data', async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('complete', false)

    if (error) {
      console.error('order-data-retrieval-err:', error);
      return;
    }
    socket.emit('load-order-data', data);
  });

  socket.on('order-complete', async (orderId, name) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ complete: true })
      .eq('id', orderId)

    if (error) {
      console.error('order-complete-err:', error);
      return;
    }

    updateLogs(`ORDER_COMPLETE`, `Order ${orderId} completed for ${name}`);
  });



  socket.on('add-menu-item', async (newItem) => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({ name: newItem.name, description: newItem.description, price: newItem.price, hidden: newItem.hidden, category: newItem.category })
      .select()

    if (error) {
      console.error('add-menu-item-err:', error);
      return;
    }

    // Emit the new item to all connected clients
    io.emit('menu-item-added', data[0]);
  });




  socket.on('update-menu-item', async (updatedItem) => {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ name: updatedItem.name, description: updatedItem.description, price: updatedItem.price, hidden: updatedItem.hidden, category: updatedItem.category })
      .eq('id', updatedItem.id)
      .select()

    if (error) {
      console.error('update-menu-item-err:', error);
      return;
    }

    // Emit the updated item to all connected clients
    io.emit('menu-item-updated', data[0]);
  });




  socket.on('toggle-item-visibility', async (id, hidden) => {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ hidden: hidden })
      .eq('id', id)
      .select()

    if (error) {
      console.error('toggle-item-visibility-err:', error);
      return;
    }

    // Emit the visibility change to all connected clients
    io.emit('item-visibility-toggled', data[0]);
  });




  socket.on('delete-item', async (id) => {
    const { data, error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      console.error('delete-menu-item-err:', error);
      return;
    }

    // Emit the deleted item to all connected clients
    io.emit('menu-item-deleted', id);
  });







  // Handle push subscription saving

  socket.on('save-subscription', (name, subscription) => {
    console.log(`subscription for ${name} saved`);
    subscriptions[name.toLowerCase()] = subscription;
  });


  socket.on('send-notification', (orderId, clientName) => {


    const title = `Your order is ready!`;
    const message = `Hi ${clientName}, your order is ready for pickup.`;


    console.log(`trying to send to ${clientName} | ${title} --> ${message}`);

    const subscription = subscriptions[clientName.toLowerCase()];
    sendPing(subscription, clientName.toLowerCase(), title, message, orderId);
  });



  async function sendPing(subscription, to, title, message, orderId) {
    if (subscription) {
      const payload = JSON.stringify({
        title: title,
        body: message
      });
      webpush.sendNotification(subscription, payload).catch(console.error);
      console.log(`Noti sent to ${to}`);
      socket.emit('registered-and-sent', orderId, to);
    } else {
      socket.emit('not-registered-for-notis', to);
    }
  }



});




// Start server
server.listen(PORT || 3000, () => {
  console.log(`Server running on port ${PORT || 3000}`)
});
