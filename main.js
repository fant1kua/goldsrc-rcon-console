const vorpal = require('vorpal')();
const chalk = require('chalk');
const program = require('commander');
const RCON = require('./rcon');
const STUN = require('./stun');

const REGEX_LOG = /^log\sL\s(\d{2}\/\d{2}\/\d{4}\s-\s\d{2}:\d{2}:\d{2}):\s(.+)/;
const REGEX_RCON = /^Rcon:\s/;


program
	.option('--server [remote]', 'Server address')
	.option('--password [password]', 'RCON password')
	.parse(process.argv);

const rcon = new RCON();

const remote = (program.remote || '127.0.0.1:27015').split(':');

rcon
	.connect(remote[0], remote.length > 1 ? parseInt(remote[1], 10) : 27015)
	.then((socket) => {
		return STUN(socket);
	})
	.then((address) => rcon.auth(address.address, address.port, program.password))
	.then(() => rcon.execute(`logaddress_del ${rcon.local.host} ${rcon.local.port}`))
	.then(() => rcon.execute(`logaddress_add ${rcon.local.host} ${rcon.local.port}`))
	.then(() => {
	   rcon.on('message', (msg) => {
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
		if (rcon.connected) {
			rcon.execute(`logaddress_del ${rcon.local.host} ${rcon.local.port}`)
				.then(() => rcon.disconnect())
				.then(() => vorpal.exec('quit'));
		} else {
			vorpal.exec('quit');
		}
	});

vorpal
	.catch('<command>')
	.action(function (args, cb) {
		rcon.execute(args.command)
			.then(cb)
			.catch(cb);
	});

vorpal.command('meta [command]')
    .autocomplete(['version', 'list'])
    .action(function (args, cb) {
        rcon.execute(`meta ${args.command}`)
            .then(cb)
            .catch(cb);
    });

vorpal.command('amxx [command]')
    .autocomplete(['version', 'list', 'modules'])
    .action(function (args, cb) {
        rcon.execute(`amxx ${args.command}`)
            .then(cb)
            .catch(cb);
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






