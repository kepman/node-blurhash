# node-blurhash


A NodeJS implementation of [Blurhash](https://github.com/woltapp/blurhash).
The API is ready to use out of the box (either local or on a server):
- encoding an uploaded image into a blurhash
- decoding a blurhash to generate a preview of the blur image 
(image preview will be a data uri scheme:  data:image/jpeg;base64,... )


Blurhash is an algorithm written by [Dag Ågren](https://github.com/DagAgren) for [Wolt (woltapp/blurhash)](https://github.com/woltapp/blurhash) that encodes an image into a short (~20-30 byte) ASCII string. When you decode the string back into an image, you get a gradient of colors that represent the original image. This can be useful for scenarios where you want an image placeholder before loading, or even to censor the contents of an image [a la Mastodon](https://blog.joinmastodon.org/2019/05/improving-support-for-adult-content-on-mastodon/).

## Installation
(clone repo and run using npm/yarn or any other package manager)
```sh
git clone https://github.com/kepman/node-blurhash
```

## Usage

### Encoding an image to retreive the Blurhash
Send POST request with Content-Type: multipart/form-data;
Expected key 'uploaded_file' with the image as file.

Example response json:
```json
{
    "blurhash": "U]MYDUNISNsm}=WCbao0S4n%oef6j[ayfkjs",
    "info": {
        "file_name": "943-800x600.jpg",
        "image_width": 800,
        "image_height": 600,
        "file_mime": "image/jpeg",
        "file_md5": "f5a8ca7ccc15a96b380b40fbc48c45cc",
        "file_size": 16830,
        "file_size_human": "17KB"
    }
}
```
- image_width & image_height: are the actual image size. Use these values also for decoding the blurhash to maintain the same aspect ratio.
- file_mime is the actual mime type that is retreived from the file source using [@picturae/mmmagic](https://github.com/picturae/mmmagic). So even if the file extension is wrong the API will determine if the uploaded file is an image or not. Any non image files uploaded will result in an error.
- file_md5: the md5 of a file using [nodejs-md5](https://github.com/heinst/nodejs-md5). Regardless the filename if it is the same file, it will give the same md5.
