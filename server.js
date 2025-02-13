const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(cors());

app.get('/audio', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).send('Missing video URL');
  }

  const outputPath = path.resolve(__dirname, 'audio.mp3');

  try {
    console.log(`Fetching audio info for URL: ${videoUrl}`);
    const command = `yt-dlp -f bestaudio -o "${outputPath}" "${videoUrl}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error fetching audio: ${error.message}`);
        return res.status(500).send('Error fetching audio');
      }

      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);

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
  } catch (error) {
    console.error('Error fetching audio:', error.stack);
    res.status(500).send('Error fetching audio');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});