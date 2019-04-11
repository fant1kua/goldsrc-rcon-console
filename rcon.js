const dgram = require('dgram');
const EventEmitter = require('events');


class RCON extends EventEmitter {
    constructor(options = {}) {
        super();
        this.serverHost = options.serverHost || '127.0.0.1';
        this.serverPort = options.serverPort || 27015;
        this.clientHost = options.clientHost || '0.0.0.0';
        this.clientPort = options.clientPort || 30200;
        this.password = options.password || '';
        this.timeout = options.timeout || 1000;
        this.connected = false;
        this.connection = null;
        this.challenge = null;

        this.connect = this.connect.bind(this);
    }

    connect() {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.connected = false;
                this.connection.close();
                reject(new Error('Timeout'));
            }, this.timeout);

            this.connection = dgram.createSocket('udp4');

            this.connection.once('error', (err) => {
                clearTimeout(timer);
                this.connection.close();
                reject(err);
            });

            this.connection.once('message', (buffer) => {
                clearTimeout(timer);
                this.connection.removeAllListeners('message');
                this.connection.removeAllListeners('error');
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

            this.connection.once('listening', () => {
                this.connection.removeAllListeners('listening');
                this.connected = true;
                const buffer = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x63, 0x68, 0x61, 0x6C, 0x6C, 0x65, 0x6E, 0x67, 0x65, 0x20, 0x72, 0x63, 0x6F, 0x6E]);
                this.connection.send(buffer, 0, buffer.length, this.serverPort, this.serverHost);
            });

            this.connection.bind(this.clientPort, this.clientHost);
        });
    }

    execute(cmd) {
        return new Promise((resolve, reject) => {
            const buffer =
                  Buffer.concat([
                      this.challenge,
                      Buffer.from(`${cmd}\n`)
                  ]);
            this.connection.send(buffer, 0, buffer.length, this.serverPort, this.serverHost, (error) => {
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
