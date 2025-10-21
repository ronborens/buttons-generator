require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is missing');
    process.exit(1);
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        const resp = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150
        });

        res.json({ response: resp.choices[0].message.content });
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message || 'Request failed');
    }
});

const port = 8787;
app.listen(port, () => console.log(`Server running on port ${port}`));