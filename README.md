# vapr-decompress [![Build Status](https://travis-ci.org/JoshuaWise/vapr-decompress.svg?branch=master)](https://travis-ci.org/JoshuaWise/vapr-decompress)

## Installation

```bash
npm install --save vapr
npm install --save vapr-decompress
```

## Usage

The `vapr-decompress` plugin decompresses the request body based on the Content-Encoding and Transfer-Encoding headers. If someone makes a request with an unsupported encoding, a they'll receive `415 Unrecognized Content-Encoding` or `501 Unrecognized Transfer-Encoding`.

Any options passed to the plugin are forwarded to the [zlib](https://nodejs.org/api/zlib.html#zlib_class_options) core module.

```js
const decompress = require('vapr-decompress');
const app = require('vapr')();
const route = app.get('/foo');

route.use(decompress());
route.use((req) => {
  const decompressed = req.read();
});
```
