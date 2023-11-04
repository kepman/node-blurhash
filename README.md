# node-blurhash


A NodeJS implementation of [Blurhash](https://github.com/woltapp/blurhash).
The API is ready to use out of the box (locally / server):
- encoding an uploaded image into a blurhash
- decoding a blurhash to generate a preview of the blur image

Blurhash is an algorithm written by [Dag Ågren](https://github.com/DagAgren) for [Wolt (woltapp/blurhash)](https://github.com/woltapp/blurhash) that encodes an image into a short (~20-30 byte) ASCII string. When you decode the string back into an image, you get a gradient of colors that represent the original image. This can be useful for scenarios where you want an image placeholder before loading, or even to censor the contents of an image [a la Mastodon](https://blog.joinmastodon.org/2019/05/improving-support-for-adult-content-on-mastodon/).

## Installation
(clone repo and run using npm/yarn or any other package manager)
```sh
git clone https://github.com/kepman/node-blurhash
```