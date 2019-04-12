const vorpal = require('vorpal')();
const chalk = require('chalk');
const program = require('commander');
const spinner = require('ora')();
const checkLocalhost = require('check-localhost');

const RCON = require('./rcon');
const STUN = require('./stun');

const REGEX_LOG = /^log\sL\s(\d{2}\/\d{2}\/\d{4}\s-\s\d{2}:\d{2}:\d{2}):\s(.+)/;
const REGEX_RCON = /^Rcon:\s/;

const init = (host, port, password) => {
	spinner.color = 'yellow';
	spinner.text = 'Connecting to server';
	spinner.start();

	const rcon = new RCON();

	const initConsole = () => {
		vorpal
			.catch('[command...]')
			.action(function (args, cb) {
				if (rcon.connected) {
					rcon.execute(args.command.join(' '))
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

		vorpal.log(chalk.green('Connected successfully'));
	};

	const checkPassword = (buffer) => {
		const msg = buffer.slice(5).toString('utf-8');
		if (/^Bad rcon_password/.test(msg)) {
			spinner.stop();
			console.log(`${chalk.red('Error:')} ${chalk.yellow('Bad rcon password')}`);
			rcon.disconnect();
			process.exit(1);
		} else if (/^logaddress_add:/.test(msg)) {
			spinner.stop();
			rcon.connection.removeListener('message', checkPassword);
			rcon.connection.on('message', (buffer) => {
				const msg = buffer.slice(4).toString('utf-8');
				const match = msg.match(REGEX_LOG);
				if (!match) {
					vorpal.log(chalk.yellow(msg.slice(1)));
				} else if (!REGEX_RCON.test(match[2])) {
					vorpal.log(`${chalk.green(match[1])}: ${chalk.yellow(match[2])}`);
				}
			});
			initConsole();
		}
	};

	rcon
		.connect(host, port)
		.then((socket) => {
			return checkLocalhost(rcon.remote.host)
				.then(status => {
					if (status) {
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
					} else {
						return STUN(socket);
					}
				});
		})
		.then((address) => rcon.auth(address.address, address.port, password))
		.then(() => {
			rcon.connection.removeAllListeners('message');
			rcon.connection.on('message', checkPassword)
		})
		.then(() => rcon.execute(`logaddress_del ${rcon.local.host} ${rcon.local.port}`))
		.then(() => rcon.execute(`logaddress_add ${rcon.local.host} ${rcon.local.port}`))
		.catch((error) => {
			spinner.stop();
			vorpal.log(`${chalk.red('Error:')} ${chalk.red(error.message)}`);
			process.exit(1);
		});

	process.on('exit', () => {
		if (rcon.connected) {
			rcon.execute(`logaddress_del ${rcon.local.host} ${rcon.local.port}`)
				.then(() => rcon.disconnect());
		}
	});
};

program
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
