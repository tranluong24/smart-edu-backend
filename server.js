const app = require('./app');
const pool = require('./config/db'); 
require('dotenv').config();

const PORT = process.env.PORT || 5001;


app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});