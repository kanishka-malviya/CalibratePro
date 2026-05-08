import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Reminder trigger endpoint
  // In a real scenario, this would be secured and called by a cron job
  app.post('/api/reminders/check', async (req, res) => {
    try {
      // In a full implementation, we would query Firestore for reports due in 7 or 3 days.
      // Since this is a server-side route, we'd ideally use firebase-admin.
      // However, for simplicity in this environment, we can also pass the data from the client
      // or implement the check here if we had firebase-admin setup.
      
      // For now, let's assume the client sends the list of reminders to send to be "automatic"
      // Or better, we can implement a basic placeholder and explain the setup.
      
      const { recipients, subject, body } = req.body;

      if (!resend) {
        return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
      }

      const results = await Promise.all(
        recipients.map((to: string) => 
          resend.emails.send({
            from: 'Calibration Alerts <alerts@resend.dev>',
            to,
            subject,
            html: body
          })
        )
      );

      res.json({ success: true, results });
    } catch (error) {
      console.error('Reminder error:', error);
      res.status(500).json({ error: 'Failed to send reminders' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
