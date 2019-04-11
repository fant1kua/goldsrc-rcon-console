const vorpal = require('vorpal')();

const RCON = require('./rcon');

//vorpal
//    .command('foo', 'Outputs "bar".')
//    .action(function(args, callback) {
//        this.log('bar');
//        callback();
//    });
//
//vorpal.command('feed [animal]')
//    .autocomplete(['cat', 'dog', 'horse'])
//    .action(function(args, callback) {
//        this.log('bar');
//        callback();
//    });

//const rcon = new RCON({
//    serverHost: '127.0.0.1',
//    serverPort: 27016,
//    clientHost: '127.0.0.1',
//    clientPort: 41234,
//    password: '12345',
//    timeout: 5000
//});
//
//vorpal
//    .catch('<command>')
//    .action(function (args, cb) {
//        console.log(args.command)
//        //rcon.execute(args.command)
//        //    .then(cb)
//        //    .catch(cb);
//    });
//
//rcon
//    .connect()
//    .then(() => rcon.execute(`logaddress_del 127.0.0.1 41234`))
//    .then(() => rcon.execute(`logaddress_add 127.0.0.1 41234`))
//    .then(() => {
//        rcon.on('message', (msg) => {
//            vorpal.log(msg);
//        })
//    })
//    .catch(console.error);
//
//vorpal
//    .delimiter('rcon$')
//    .show();

vorpal
    .mode('sql')
    .delimiter('rcon:')
    .init(function(args, callback){
        this.log('Welcome to SQL mode.\nYou can now directly enter arbitrary SQL commands. To exit, type `exit`.');
        callback();
    })
    .action(function(command, callback) {
        callback();
    });

vorpal
    .show();

vorpal
    .delimiter('')
    .exec('sql');






