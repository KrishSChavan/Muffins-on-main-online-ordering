const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const PORT = process.env.PORT || 3000;



// Middleware
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'app'))); // Serve static files from /app

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'admin.html'));
});

app.post('/api/orders', async (req, res) => {
  const order = req.body;

  const name = req.body.client_name;
  const phone = req.body.client_phone_number;
  const items = req.body.client_order;
  const subtotal = req.body.client_subtotal;
  const tax = req.body.client_tax;
  const final_total = req.body.client_final_total;

  // Basic validation
  if (!name || !phone || !items || items.length === 0 || !subtotal || !tax || !final_total || subtotal == 0 || tax == 0 || final_total == 0) {
    return res.status(400).json({ error: 'Invalid order data.' });
  }

  const orderSummary = items.map(i => `• ${i.item} - ${i.price}`).join('\n');
  const messageBody = `Hi ${name}, your order has been received:\n\n${orderSummary}\n\nTotal: ${final_total}`;

  console.log('Received order:', { name, phone, items, subtotal, tax, final_total });

  try {
    await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          client_name: name,
          client_phone_number: phone,
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
      console.log('Inserted order:', data);
      res.status(201).json({ message: 'Order received and SMS sent.' });
      io.emit('new-order', data[0]);
    }

  } catch (err) {
    console.error('SMS error:', err);
    res.status(500).json({ error: 'Order received, but SMS failed to send.' });
  }
});



// GET /menu → serve the JSON
app.get('/api/menu', (req, res) => {
  const menuPath = path.join(__dirname, 'menu.json');

  fs.readFile(menuPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read menu.json:', err);
      return res.status(500).json({ error: 'Failed to load menu' });
    }

    try {
      const menu = JSON.parse(data);
      res.json(menu);
    } catch (parseErr) {
      console.error('Invalid JSON format:', parseErr);
      res.status(500).json({ error: 'Invalid menu data' });
    }
  });
});



io.on('connection', (socket) => {
  console.log("Admin connected: ", socket.id);

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

  socket.on('order-complete', async (orderId, name, phone) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ complete: true })
      .eq('id', orderId)

    if (error) {
      console.error('order-complete-err:', error);
      return;
    }

    const messageBody = `Hi ${name}, your order is complete! Please come pick it up.`;

    try {
      await client.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE,
        to: phone,
      });
    } catch (err) {
      console.error('SMS error:', err);
    }
  });
});




// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
