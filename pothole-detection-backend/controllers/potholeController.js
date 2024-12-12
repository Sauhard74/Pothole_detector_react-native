const Twitter = require('twitter');
const Pothole = require('../models/potholeModel');
const axios = require('axios');
const fs = require('fs');

exports.reportPothole = async (req, res) => {
  try {
    const { latitude, longitude, userId } = req.body;
    const image = req.file.path;

    // Validate image with AI model
    try {
      const imageBase64 = fs.readFileSync(image, { encoding: 'base64' });
      const aiResponse = await axios.post(process.env.AI_MODEL_URL, {
        image: imageBase64,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });

      console.log('AI Model Response:', aiResponse.data);

      const isPothole = aiResponse.data.result === "Pothole";
      const confidence = parseFloat(aiResponse.data.confidence.replace('%', ''));

      if (!isPothole || confidence < 50) {
        fs.unlinkSync(image);
        return res.status(400).json({ 
          message: 'Image is not identified as a pothole',
          result: aiResponse.data.result,
          confidence: aiResponse.data.confidence
        });
      }

      const pothole = new Pothole({
        location: { latitude, longitude },
        image,
        reportedBy: userId,
        confidence: aiResponse.data.confidence
      });
      await pothole.save();

      // Optional: Post to Twitter
      if (process.env.ENABLE_TWITTER === 'true') {
        const twitterClient = new Twitter({
          consumer_key: process.env.TWITTER_CONSUMER_KEY,
          consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
          access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
          access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
        });

        const tweet = await twitterClient.post('statuses/update', {
          status: `Pothole reported at Lat: ${latitude}, Long: ${longitude} (Confidence: ${aiResponse.data.confidence})`
        });

        pothole.tweeted = true;
        await pothole.save();
      }

      res.status(201).json({
        message: 'Pothole reported successfully',
        pothole: {
          id: pothole._id,
          location: pothole.location,
          image: pothole.image,
          confidence: aiResponse.data.confidence,
          result: aiResponse.data.result
        }
      });

    } catch (aiError) {
      console.error('AI Model Error:', aiError);
      fs.unlinkSync(image);
      return res.status(500).json({ 
        message: 'Failed to validate image with AI model',
        error: aiError.message 
      });
    }
  } catch (error) {
    console.error('Report Pothole Error:', error);
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to report pothole', error: error.message });
  }
};
