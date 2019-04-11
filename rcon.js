const dgram = require('dgram');
const EventEmitter = require('events');


class RCON extends EventEmitter {
    constructor() {
        super();

        this.connected = false;
        this.connection = null;
        this.challenge = null;

        this.connect = this.connect.bind(this);
        this.auth = this.auth.bind(this);
        this.execute = this.execute.bind(this);
        this.disconnect = this.disconnect.bind(this);
    }

    connect(host, port) {
	    this.remote = {
		    host,
		    port
	    };
        return new Promise((resolve, reject) => {
            this.connection = dgram.createSocket('udp4');

            this.connection.once('listening', () => {
                this.connection.removeAllListeners('listening');
                this.connected = true;
            });

	        resolve(this.connection);
        });
    }

	auth(host, port, password) {
		this.local = {
			host,
			port
		};
		this.password = password;

		return new Promise((resolve, reject) => {
			this.connection.once('message', (buffer) => {
				this.connection.removeAllListeners('message');
				this.challenge = Buffer.concat([
					Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x72, 0x63, 0x6f, 0x6e, 0x20]),
					buffer.slice(19, -2),
					Buffer.from(` ${this.password} `)
				]);

				this.connection.on('message', (buffer) => {
					this.emit('message', buffer.slice(4).toString('utf-8'));
				});
				resolve();
			});

			const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x63, 0x68, 0x61, 0x6C, 0x6C, 0x65, 0x6E, 0x67, 0x65, 0x20, 0x72, 0x63, 0x6F, 0x6E]);
			this.connection.send(buffer, 0, buffer.length, this.remote.port, this.remote.host);
		});
	}

    execute(cmd) {
        return new Promise((resolve, reject) => {
            const buffer =
                  Buffer.concat([
                      this.challenge,
                      Buffer.from(`${cmd}\n`)
                  ]);
            this.connection.send(buffer, 0, buffer.length, this.remote.port, this.remote.host, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    disconnect() {
        return new Promise((resolve) => {
            this.connection.close();
            resolve();
        });
    }
}

module.exports = RCON;
