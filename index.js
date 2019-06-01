require('dotenv').config();
const axios = require('axios');
const app = require('./api/server');

const port = process.env.PORT || 5000;

axios
  .get(
    'https://maps.googleapis.com/maps/api/distancematrix/json?origins=Rahway+NJ&destinations=Clark+NJ&key=AIzaSyDiDztOcm3XjTxlc0--EqMVXrzShv4tBAg'
  )
  .then(data => console.log(data))
  .catch(err => console.log(err));

app.listen(port, () => console.log(`Server listening on port ${port}.`));
