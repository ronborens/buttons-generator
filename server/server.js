require('dotenv').config() 
require('dotenv').config({ path: '.env.local' }) 
import express, { json } from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';

const app = express();
app.use(cors());
app.use(json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL,
});

app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
