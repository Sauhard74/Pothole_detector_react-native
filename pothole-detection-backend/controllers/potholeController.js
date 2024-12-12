const Twitter = require('twitter');
const Pothole = require('../models/potholeModel');
const axios = require('axios');
const fs = require('fs');

exports.reportPothole = async (req, res) => {
  try {
    const { latitude, longitude, userId } = req.body;
    const image = req.file.path; // Image path

    // Validate the user has authenticated with Twitter
    if (!req.user || !req.user.token || !req.user.tokenSecret) {
      return res.status(401).json({ message: 'User is not authenticated with Twitter' });
    }

    // Validate image with AI model
    const aiResponse = await axios.post('https://d80e-14-194-166-142.ngrok-free.app/predict', {
      image: fs.readFileSync(image, { encoding: 'base64' }),
    });

    if (!aiResponse.data.isValid) {
      return res.status(400).json({ message: 'Image is not a valid pothole.' });
    }

    // Initialize Twitter client with user's tokens
    const twitterClient = new Twitter({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token_key: req.user.token,
      access_token_secret: req.user.tokenSecret,
    });

    // Post to Twitter
    const tweetText = `Pothole detected at latitude: ${latitude}, longitude: ${longitude}. #PotholeDetection`;
    const tweetMedia = await twitterClient.post('media/upload', {
      media: fs.readFileSync(image),
    });
    const tweet = await twitterClient.post('statuses/update', {
      status: tweetText,
      media_ids: tweetMedia.media_id_string,
    });

    // Save to database
    const pothole = new Pothole({
      location: { latitude, longitude },
      image,
      reportedBy: userId,
      tweeted: true,
    });
    await pothole.save();

    res.status(201).json({
      message: 'Pothole reported successfully',
      pothole: {
        id: pothole._id,
        location: pothole.location,
        image: pothole.image,
        tweetId: tweet.id_str
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to report pothole', error: error.message });
  }
};
