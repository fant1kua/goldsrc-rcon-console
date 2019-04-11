const stun = require('stun');

const {
	STUN_BINDING_REQUEST,
	STUN_ATTR_XOR_MAPPED_ADDRESS,
	STUN_EVENT_BINDING_RESPONSE,
	STUN_EVENT_BINDING_ERROR_RESPONSE,
} = stun.constants;

module.exports = function (socket) {
	return new Promise((resolve, reject) => {
		const server = stun.createServer(socket);
		const request = stun.createMessage(STUN_BINDING_REQUEST);

		server.once(STUN_EVENT_BINDING_RESPONSE, stunMsg => {
			const address = stunMsg.getAttribute(STUN_ATTR_XOR_MAPPED_ADDRESS).value;
			resolve(address);
		});

		server.once(STUN_EVENT_BINDING_ERROR_RESPONSE, reject);
		server.send(request, 19302, 'stun.l.google.com');
	});
};