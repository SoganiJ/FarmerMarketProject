const express = require('express');
const router = express.Router();
const { PythonShell } = require('python-shell');
const path = require('path');

// Import verifyToken from the main index.js
const { verifyToken } = require('../index'); // <-- CHANGE THIS LINE

// Price advice endpoint
router.post('/get-advice', verifyToken, async (req, res) => {
  try {
    const { crop_name, district, state, crop_status } = req.body;

    // Validate required fields
    if (!crop_name || !district || !state || !crop_status) {
      return res.status(400).json({
        message: 'Missing required fields: crop_name, district, state, crop_status'
      });
    }

    // Python script options
    const options = {
      mode: 'text',
      pythonPath: 'python3', // or 'python' depending on your system
      scriptPath: path.join(__dirname, '..'),
      args: [crop_name, district, state, crop_status]
    };

    // Run the Python script
    PythonShell.run('price_advisor.py', options, (err, results) => {
      if (err) {
        console.error('Python script error:', err);
        return res.status(500).json({
          message: 'Error generating price advice',
          error: err.message
        });
      }

      try {
        // Parse the JSON result from Python script
        const adviceData = JSON.parse(results[0]);
        res.json(adviceData);
      } catch (parseError) {
        console.error('Error parsing Python script result:', parseError);
        res.status(500).json({
          message: 'Error parsing advice data',
          error: parseError.message
        });
      }
    });

  } catch (error) {
    console.error('Price advice error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;