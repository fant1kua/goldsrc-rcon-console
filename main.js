const vorpal = require('vorpal')();
const chalk = require('chalk');
const program = require('commander');
const checkLocalhost = require('check-localhost');

const RCON = require('./rcon');
const STUN = require('./stun');

const REGEX_LOG = /^log\sL\s(\d{2}\/\d{2}\/\d{4}\s-\s\d{2}:\d{2}:\d{2}):\s(.+)/;
const REGEX_RCON = /^Rcon:\s/;

const init = (host, port, password) => {
	const rcon = new RCON();

	rcon
		.connect(host, port)
		.then((socket) => {
			if (checkLocalhost(rcon.remote.host)) {
				return new Promise((resolve, reject) => {
					const listening = () => {
						socket.removeListener('listening', listening);
						resolve({
							address: rcon.remote.host,
							port: socket.address().port
						})
					};
					socket.on('listening', listening);
					socket.bind({
						address: rcon.remote.host
					});
				})

			}
			return STUN(socket);
		})
		.then((address) => rcon.auth(address.address, address.port, password))
		.then(() => rcon.execute(`logaddress_del ${rcon.local.host} ${rcon.local.port}`))
		.then(() => rcon.execute(`logaddress_add ${rcon.local.host} ${rcon.local.port}`))
		.then(() => {
			rcon.connection.on('message', (buffer) => {
				const msg = buffer.slice(4).toString('utf-8');
				const match = msg.match(REGEX_LOG);
				if (!match) {
					vorpal.log(chalk.yellow(msg.slice(1)));
				} else if (!REGEX_RCON.test(match[2])) {
					vorpal.log(`${chalk.green(match[1])}: ${chalk.yellow(match[2])}`);
				}
			});
		})
		.catch((error) => {
			vorpal.log(chalk.red(`Error: ${error.message}`));
			process.exit(1);
		});

	vorpal
		.catch('<command>')
		.action(function (args, cb) {
			if (rcon.connected) {
				rcon.execute(args.command)
					.then(cb)
					.catch(cb);
			}
		});

	vorpal.command('meta [command]')
		.autocomplete(['version', 'list'])
		.action(function (args, cb) {
			if (rcon.connected) {
				rcon.execute(`meta ${args.command}`)
					.then(cb)
					.catch(cb);
			}
		});

	vorpal.command('amxx [command]')
		.autocomplete(['version', 'list', 'modules'])
		.action(function (args, cb) {
			if (rcon.connected) {
				rcon.execute(`amxx ${args.command}`)
					.then(cb)
					.catch(cb);
			}
		});

	vorpal
		.delimiter(chalk.gray('$'))
		.show();

	process.on('exit', () => {
		if (rcon.connected) {
			rcon.execute(`logaddress_del ${rcon.local.host} ${rcon.local.port}`)
				.then(() => rcon.disconnect());
		}
	});
};


program
	// .option('-h, --host <host>', 'Server host', '127.0.0.1')
	// .option('-p, --port <port>', 'Server port', 27015)
	// .option('-a, --password <password>', 'RCON password')
	.arguments('<host> <port> <password>')
	.action(function (host, port, password) {
		if (!host || !port || !password) {
			program.outputHelp(chalk.green);
		} else {
			init(host, parseInt(port, 10), password);
		}
	});

program
	.parse(process.argv);
