import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.NOTIFICATION_PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Routes
// Send order confirmation email
app.post('/send-order-confirmation', async (req, res) => {
  try {
    const { userEmail, userName, orderId, items, totalAmount, estimatedDelivery } = req.body;

    const itemsHtml = items
      .map(
        item =>
          `<tr>
        <td>${item.name}</td>
        <td>${item.quantity} ${item.unit || 'pcs'}</td>
        <td>₹${item.price}</td>
        <td>₹${item.subtotal || item.price * item.quantity}</td>
      </tr>`
      )
      .join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Confirmed #${orderId}`,
      html: `
        <h2>Order Confirmation</h2>
        <p>Dear ${userName},</p>
        <p>Your order has been confirmed! Here are the details:</p>
        
        <h3>Order ID: ${orderId}</h3>
        
        <table border="1" cellpadding="10">
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Subtotal</th>
          </tr>
          ${itemsHtml}
        </table>
        
        <h3>Total: ₹${totalAmount}</h3>
        <p>Estimated Delivery: ${estimatedDelivery} minutes</p>
        
        <p>Thank you for shopping with us!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Order confirmation email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
});

// Send delivery status update
app.post('/send-delivery-update', async (req, res) => {
  try {
    const { userEmail, userName, orderId, status, estimatedTime } = req.body;

    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      preparing: 'We are preparing your order.',
      'out-for-delivery': 'Your order is out for delivery!',
      delivered: 'Your order has been delivered. Thank you!'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Update - ${status.toUpperCase()}`,
      html: `
        <h2>Order Status Update</h2>
        <p>Dear ${userName},</p>
        <p>${statusMessages[status]}</p>
        
        <h3>Order ID: ${orderId}</h3>
        <p>Current Status: <strong>${status.toUpperCase()}</strong></p>
        ${estimatedTime ? `<p>Estimated Time: ${estimatedTime}</p>` : ''}
        
        <p>Track your order in our app!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Delivery update email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
});

// Send payment receipt
app.post('/send-payment-receipt', async (req, res) => {
  try {
    const { userEmail, userName, orderId, amount, transactionId, paymentMethod } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Payment Receipt #${transactionId}`,
      html: `
        <h2>Payment Receipt</h2>
        <p>Dear ${userName},</p>
        <p>Your payment has been received successfully!</p>
        
        <h3>Payment Details</h3>
        <table>
          <tr><td>Order ID:</td><td>${orderId}</td></tr>
          <tr><td>Amount:</td><td>₹${amount}</td></tr>
          <tr><td>Transaction ID:</td><td>${transactionId}</td></tr>
          <tr><td>Payment Method:</td><td>${paymentMethod}</td></tr>
        </table>
        
        <p>Thank you for your payment!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Payment receipt email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Notification Service is running' });
});

app.listen(PORT, () => {
  console.log(`📧 Notification Service running on port ${PORT}`);
});
