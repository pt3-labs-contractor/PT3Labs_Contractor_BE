const express = require('express');

const server = express();

// MULTER Middleware
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    console.log(file);
    cb(null, file.originalname);
  },
});

server.post('/upload', (req, res, next) => {
  const upload = multer({ storage }).single('name-of-input-key');
  upload(req, res, function(err) {
    if (err) {
      return res.send(err);
    }

    console.log('file uploaded to server');
    console.log(req.file);

    // use this to set config for cloudinary
    //     const { config, uploader } = require("cloudinary");
    // const cloudinaryConfig = () =>
    //   config({
    //     cloud_name: process.env.CLOUDINARY_API_NAME,
    //     api_key: process.env.CLOUDINARY_API_KEY,
    //     api_secret: process.env.CLOUDINARY_API_SECRET
    //   });

    // module.exports = { cloudinaryConfig, uploader };

    // SEND FILE TO Cloudinary
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: 'dj1fcl3lh',
      api_key: '762512356271656',
      api_secret: 'ZU3PKCsncvAeJXhFx9n_3M8h7VM',
    });

    const path = req.file.path;
    const uniqueFilename = new Date().toISOString();

    cloudinary.uploader.upload(
      path,
      { public_id: `blog/${uniqueFilename}`, tags: `blog` }, // create a blog(whatever_name_folder you want) folder in cloudinary
      function(err, image) {
        if (err) return res.send(err);
        console.log('file uploaded to Cloudinary');

        var fs = require('fs');
        fs.unlinkSync(path);

        res.json(image);
      }
    );
  });
});

server.listen(5000, () =>
  console.log('Server running on http://localhost:5000')
);

// note: please save uploads folder dir since all file(s) uploaded will go there.
// worked in postman, just need to integrated into...
