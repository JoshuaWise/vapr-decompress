'use strict';
const { createGunzip, createInflate } = require('zlib');
const { Request, River } = require('vapr');
const decodePlan = Symbol();

/*
	This plugin decompresses the request body as it is read. It supports both
	content-encoding and transfer-encoding headers, and it recognizes "gzip",
	"deflate", and "identity" encodings. If unrecognized encodings are received,
	a 501 or 415 will be triggered, as recommended in RFC 7230 and RFC 7231.
	When the plugin is constructed, an options object can be provided which will
	be passed to the zlib core module for configuring the decompression streams.
	For security reasons, if the body was encoded more than five times, a 422
	response will be triggered.
 */

module.exports = ({ transferOnly = false, ...options } = {}) => {
	options = Object.assign({}, options, { info: false });
	transferOnly = !!transferOnly;
	return (req) => {
		const encodings = [];
		
		// Process the content-encoding header.
		if (!transferOnly) {
			const ceHeader = req.headers.get('content-encoding');
			if (ceHeader) {
				if (!contentCodings.test(ceHeader)) return [415, 'Unrecognized Content-Encoding'];
				encodings.push(...ceHeader.split(','));
			}
		}
		
		// Process the transfer-encoding header.
		const teHeader = req.headers.get('transfer-encoding');
		if (teHeader) {
			if (!transferCodings.test(teHeader)) return [501, 'Unrecognized Transfer-Encoding'];
			encodings.push(...teHeader.split(','));
		}
		
		// If any encodings were specified, store a decoding plan in req.meta.
		if (encodings.length) {
			if (encodings.length > 5) return [422, 'Too Many Encodings'];
			const decoders = [];
			for (let encoding of encodings) {
				encoding = encoding.trim().toLowerCase();
				if (encoding === 'gzip') decoders.push(createGunzip);
				else if (encoding === 'deflate') decoders.push(createInflate);
			}
			decoders.reverse();
			req.meta[decodePlan] = { decoders, options };
		}
	};
};

const decodeRiver = (river, decoder) => new River((resolve, reject, write, free) => {
	decoder.on('end', resolve);
	decoder.on('error', reject);
	decoder.on('data', write);
	free(() => { cancel(); decoder.destroy(); });
	river.then(() => void decoder.end(), reject);
	const cancel = river.pump(data => void decoder.write(data));
});

function read() {
	const raw = noPlugin.call(this);
	if (!this.meta[decodePlan]) return raw;
	const { decoders, options } = this.meta[decodePlan];
	return decoders.reduce((river, decoder) => decodeRiver(river, decoder(options)), raw);
}

const contentCodings = /^(?:gzip|deflate|identity)(?:[ \t]*,[ \t]*(?:gzip|deflate|identity))*$/i;
const transferCodings = /^(?:gzip|deflate|identity|chunked$)(?:[ \t]*,[ \t]*(?:gzip|deflate|identity|chunked$))*$/i;
const noPlugin = Request.prototype.read;
Object.defineProperty(Request.prototype, 'read', {
	configurable: true,
	writable: true,
	value: read,
});
