const fs = require('fs');
// const { createCanvas, loadImage, Image } = require('canvas');
const probe = require('probe-image-size');
const { encode, decode, isBlurhashValid } = require("blurhash");
const nodejs_md5 = require('nodejs-md5');
const sharp = require('sharp');
const Magic = require('@picturae/mmmagic');
/**
 * Retrieve Image from path or url
 */
const getImage = async (path) => {
  console.log("get path:", path)
  return new Promise(async (resolve, reject) => {
    let result = await probe(fs.createReadStream("./" + path) || path);
    sharp("./" + path)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: "inside" })
      .toBuffer((err, buffer, { width, height }) => {
        if (err) return reject(err);
        resolve({
          width: width,
          height: height,
          dwidth: result.width,
          dheight: result.height,
          data: new Uint8ClampedArray(buffer)
        });
      });
  })
}

/**
 * Load Image Data from image URL or file
 */
const getImageData = async (image) => {
  let result = await probe(image);
  return result;
  // const canvas = createCanvas(image.width, image.height)
  // const context = canvas.getContext('2d')
  // context.drawImage(image, 0, 0)
  // return context.getImageData(0, 0, image.width, image.height)
  // test
}

/**
 * Generate BlurHash from image
 * imageData is the return of getImageData()
 */
const blurHashEncode = async imageData => {
  return encode(imageData.data, imageData.width, imageData.height, 4, 4)
};

/**
 * decode BlurHash to image base64
 */
const blurHashDecode = async (hash, width, height, options = { size: 16, quality: 40 }) => {
  const hashWidth = options?.size;
  const hashHeight = Math.round(hashWidth * (height / width));

  const pixels = decode(hash, hashWidth, hashHeight);

  const resizedImageBuf = await sharp(Buffer.from(pixels), {
    raw: {
      channels: 4,
      width: hashWidth,
      height: hashHeight,
    },
  })
    .jpeg({
      overshootDeringing: true,
      quality: options.quality,
    })
    .toBuffer(); // Here also possible to do whatever with your image, e.g. save it or something else.

  return `data:image/jpeg;base64,${resizedImageBuf.toString("base64")}`;
}

/**
 * Get the md5 of a file
 */
const md5File = async (file) => {
  const getTheHash = () => {
    return new Promise((resolve, reject) => {
      nodejs_md5.file.quiet(file, (err, filemd5) => { 
        if (err) {
          console.error(err)
          reject(err)
        } else {
          resolve(filemd5)
        }
      })
    })
  }
  return getTheHash();
}

/**
 * File detection using mmmagic to validate if it really is an image
 */
const validateUploadedFile = (path) => {
  const getTheMagic = () => {
    return new Promise((resolve, reject) => {
      const mm = new Magic.Magic(Magic.MAGIC_MIME_TYPE);
      mm.detectFile(path, (err, result) => {
        if (err) {
          console.error(err)
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }
  return getTheMagic();
}

/**
 * Remove the uploaded file
 */
const removeUploadedFile = (path) => {
  if (!fs.existsSync(path)) return;
  fs.unlink(path, (err) => {
    if (err) {
      console.error(err)
    }
  })
}

/**
 * express response to Throw error with code and message and remove the uploaded file
 */
const throwError = (code, message, req, res) => {
  res.status(code);
  res.send(JSON.stringify({ error: { code: code, message: message } }))
  if (req?.file?.path) removeUploadedFile(req.file.path);
  return;
}

/**
 * Process POST request
 */
const processBlurHashRequest = async (req, res) => {

  // set Content-Type response header to application/json
  const setHeaders = res.getHeaderNames();
  if (!setHeaders.includes("content-type")) res.setHeader('Content-Type', 'application/json');

  // check if no file received
  if (!req.file) {throwError(400, 'No file received', req, res); return;}

  // validate if it really is an image
  const fileType = await validateUploadedFile(req.file.path)
  if (!fileType) {throwError(400, 'Failed to detect file type', req, res); return;}
  if ('image' !== fileType.slice(0, 5)) { throwError(400, 'Not an image', req, res); return; }
  
  // check if the filesize is larger then allowed
  if (parseInt(process.env.MAX_FILE_SIZE) <= req.file.size) { throwError(400, 'File too large! Max allowed size: ' + (process.env.MAX_FILE_SIZE / 1000) + 'KB', req, res); return; }
  
  // all conditions passed so now generate the blurhash ====>
  console.log(req.file)
  const image = await getImage(req.file.path)
  // const imageData = getImageData(image);
  const fileMd5 = await md5File(req.file.path);
  const blurHash = await blurHashEncode(image);

  const output = {
    blurhash: blurHash,
    info: {
      file_name: req.file.originalname,
      image_width: image.dwidth,
      image_height: image.dheight,
      file_mime: fileType,
      file_md5: fileMd5,
      file_size: req.file.size,
      file_size_human: (req.file.size / 1000).toFixed(0) + 'KB',
    }
  }
  if (process.env.DEBUG === 'true') console.log("res.send(" + JSON.stringify(output, null, 2) + ");");
  res.status(200);
  res.send(JSON.stringify(output))
  
  // delete the uploaded file
  if (req.file.path) removeUploadedFile(req.file.path);
  return;
}
exports.processBlurHashRequest = processBlurHashRequest;

const processDecodeRequest = async (req, res) => {
  // set Content-Type response header to application/json
  const setHeaders = res.getHeaderNames();
  if (!setHeaders.includes("content-type")) res.setHeader('Content-Type', 'application/json');

  // check if the blurhash is valid and is set 
  if (!req?.body?.blurhash) { throwError(400, 'No blurhash received', req, res); return; }
  const hashValid = isBlurhashValid(req?.body?.blurhash);
  if (!hashValid.result) { throwError(400, hashValid.errorReason, req, res); return; } 

  const decoded = await blurHashDecode(
    req.body.blurhash,
    (req?.body?.width ?? 640),
    (req?.body?.height ?? 480),
    {
      size: parseInt(req?.body?.width ?? 640),
      quality: parseInt(req?.body?.quality ?? 100)
    }
  );

  res.status(200);
  // res.send(JSON.stringify({
  //   decoded: decoded
  // }))
  res.send(`<img src="${decoded}" style="width: 100%; height: auto;" />`)
}
exports.processDecodeRequest = processDecodeRequest;