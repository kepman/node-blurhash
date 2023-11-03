require('dotenv').config();
const express = require('express');
const cors = require("cors");
const app = express();
const multer = require("multer");
const upload = multer({ dest: "./uploads/" });
const toolKit = require('./functions');

app.use(cors({
  origin: "*",
  "methods": "POST",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
}));

app.post("/", upload.single("uploaded_file"), (req, res, next) => {
  toolKit.processBlurHashRequest(req, res, next);
});

app.post("/decode", upload.fields([]), (req, res, next) => {
  toolKit.processDecodeRequest(req, res, next);
});

app.listen(process.env.PORT, () => {
  console.log(`App is listening on port ${process.env.PORT}.`);
});