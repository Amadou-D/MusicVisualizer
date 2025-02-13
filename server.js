const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: 'https://music-visualizeer.vercel.app', // Replace with your Vercel app URL
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.get('/audio', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).send('Missing video URL');
  }

  try {
    console.log(`Fetching audio info for URL: ${videoUrl}`);
    const outputPath = path.resolve(__dirname, 'audio.mp3');
    const audioStream = ytdl(videoUrl, { filter: 'audioonly' });

    const writeStream = fs.createWriteStream(outputPath);
    audioStream.pipe(writeStream);

    writeStream.on('finish', () => {
      res.setHeader('Content-Type', 'audio/mp3');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      const readStream = fs.createReadStream(outputPath);
      readStream.pipe(res);

      readStream.on('close', () => {
        fs.unlinkSync(outputPath); // Clean up the downloaded file
      });
    });

    writeStream.on('error', (error) => {
      console.error('Error writing audio file:', error);
      res.status(500).send('Error fetching audio');
    });
  } catch (error) {
    console.error('Error fetching audio:', error.stack);
    res.status(500).send('Error fetching audio');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});