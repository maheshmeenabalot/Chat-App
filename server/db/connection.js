const mongoose = require('mongoose');

const url = `mongodb+srv://immaheshbalot:6350@chatapp.3juxien.mongodb.net/?retryWrites=true&w=majority&appName=ChatApp`;

mongoose.connect(url, {
  tls: true,
  tlsAllowInvalidCertificates: true // Only use this option if necessary
}).then(() => console.log('Connected to DB'))
  .catch((e) => console.log('Error', e));

  