import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import https from 'https';
import dns from 'dns';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// In-memory fallback database when MongoDB is not connected
let inMemoryTransactions = [];

// Create a custom DNS resolver using Google DNS (bypasses slow/broken local DNS)
const dnsResolver = new dns.Resolver();
dnsResolver.setServers(['8.8.8.8', '1.1.1.1']);

// Custom lookup function for https requests — uses Google DNS
function customLookup(hostname, options, callback) {
  dnsResolver.resolve4(hostname, (err, addresses) => {
    if (err) {
      // Fallback to default lookup
      dns.lookup(hostname, { family: 4 }, callback);
    } else {
      callback(null, addresses[0], 4);
    }
  });
}

// Configure multer for audio upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `audio-${Date.now()}${path.extname(file.originalname) || '.webm'}`);
  }
});

const upload = multer({ storage });

// Helper: Make HTTPS POST request using Node https module with Google DNS
function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: headers,
      family: 4,
      timeout: 60000,
      lookup: customLookup,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(json)}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (Buffer.isBuffer(body) || typeof body === 'string') {
      req.write(body);
    }
    req.end();
  });
}

// Helper: Build multipart form data manually for Whisper API
function buildMultipartFormData(fields, fileField) {
  const boundary = '----FormBoundary' + Date.now().toString(16);
  const parts = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
      `${value}\r\n`
    );
  }

  if (fileField) {
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\n` +
      `Content-Type: ${fileField.contentType}\r\n\r\n`
    );
  }

  const header = Buffer.from(parts.join(''));
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);

  let body;
  if (fileField) {
    body = Buffer.concat([header, fileField.data, footer]);
  } else {
    body = Buffer.concat([header, footer]);
  }

  return { boundary, body };
}

// POST /api/transcribe - Record and transcribe audio, extract transaction
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const audioPath = req.file.path;
    const audioBuffer = fs.readFileSync(audioPath);

    const language = req.body.language || 'en';

    // Step 1: Transcribe audio using OpenAI Whisper
    console.log('Sending audio to Whisper API...');

    const fields = { model: 'whisper-1' };
    if (language !== 'auto') {
      fields.language = language;
    }

    const { boundary, body } = buildMultipartFormData(fields, {
      name: 'file',
      filename: req.file.filename || 'audio.webm',
      contentType: 'audio/webm',
      data: audioBuffer,
    });

    const whisperData = await httpsPost(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
      body
    );

    const rawTranscription = whisperData.text.trim();
    console.log('Transcription:', rawTranscription);

    // Step 2: Extract financial data using GPT
    const gptBody = JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a financial data extractor. Extract transaction details from user speech. Return ONLY a valid JSON object, no markdown, no code blocks.

Format: {"type": "credit" or "debit", "amount": number, "description": "brief description", "category": "one of: Food, Bills, Salary, Shopping, Transport, Entertainment, Health, Education, Transfer, General"}

Rules:
- "type" must be exactly "credit" or "debit"
- "amount" must be a positive number
- Credit keywords: received, got, credited, earned, salary, deposit, refund, income, bonus, added
- Debit keywords: paid, spent, bought, purchased, bill, expense, withdrew, sent, gave
- If unclear, default to: {"type": "debit", "amount": 0, "description": "unclear", "category": "General"}`
        },
        {
          role: 'user',
          content: rawTranscription
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    const gptData = await httpsPost(
      'https://api.openai.com/v1/chat/completions',
      {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(gptBody),
      },
      gptBody
    );

    let extractedText = gptData.choices[0].message.content.trim();
    extractedText = extractedText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    console.log('Extracted:', extractedText);

    let transactionData;
    try {
      transactionData = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('Failed to parse GPT response:', extractedText);
      return res.status(422).json({
        error: 'Could not extract transaction data. Please try again.',
        rawTranscription
      });
    }

    if (!transactionData.type || !['credit', 'debit'].includes(transactionData.type)) {
      transactionData.type = 'debit';
    }
    if (!transactionData.amount || isNaN(transactionData.amount) || transactionData.amount < 0) {
      return res.status(422).json({
        error: 'Could not determine the amount. Please mention a clear amount.',
        rawTranscription
      });
    }

    const tData = {
      _id: new mongoose.Types.ObjectId().toString(),
      type: transactionData.type,
      amount: transactionData.amount,
      description: transactionData.description || 'Voice transaction',
      category: transactionData.category || 'General',
      rawTranscription,
      createdAt: new Date()
    };

    const isDBConnected = mongoose.connection.readyState === 1;
    if (isDBConnected) {
      const transaction = new Transaction(tData);
      await transaction.save();
    } else {
      inMemoryTransactions.unshift(tData);
    }

    fs.unlinkSync(audioPath);

    res.json({ success: true, transaction: tData, rawTranscription });

  } catch (error) {
    console.error('Transcription error:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process audio. Please try again.', details: error.message });
  }
});

// POST /api/transactions/manual
router.post('/manual', async (req, res) => {
  try {
    const { type, amount, description, category } = req.body;
    if (!type || !amount || !description) {
      return res.status(400).json({ error: 'type, amount, and description are required' });
    }

    const tData = {
      _id: new mongoose.Types.ObjectId().toString(),
      type,
      amount: Math.abs(Number(amount)),
      description,
      category: category || 'General',
      rawTranscription: 'Manual entry',
      createdAt: new Date()
    };

    const isDBConnected = mongoose.connection.readyState === 1;
    if (isDBConnected) {
      await new Transaction(tData).save();
    } else {
      inMemoryTransactions.unshift(tData);
    }
    res.json({ success: true, transaction: tData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const isDBConnected = mongoose.connection.readyState === 1;
    const transactions = isDBConnected
      ? await Transaction.find().sort({ createdAt: -1 })
      : inMemoryTransactions;
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/transactions/summary
router.get('/summary', async (req, res) => {
  try {
    const isDBConnected = mongoose.connection.readyState === 1;
    const transactions = isDBConnected ? await Transaction.find() : inMemoryTransactions;

    const totalCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalDebits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

    res.json({
      totalCredits,
      totalDebits,
      balance: totalCredits - totalDebits,
      transactionCount: transactions.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const isDBConnected = mongoose.connection.readyState === 1;
    if (isDBConnected) {
      const tx = await Transaction.findByIdAndDelete(req.params.id);
      if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    } else {
      const idx = inMemoryTransactions.findIndex(t => t._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Transaction not found' });
      inMemoryTransactions.splice(idx, 1);
    }
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
