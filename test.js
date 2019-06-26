const { select, prompt } = require('enquirer');

(async () => {
    const response = await select({
        name: 'server',
        message: 'Choose server',
        choices: [
            {
                message: '127.0.0.1:27015',
                value: {
                    type: 'server',
                    host: '127.0.0.1',
                    port: 27015,
                    password: '123'
                }
            },
            {
                message: '127.0.0.1:27016',
                value: {
                    type: 'server',
                    host: '127.0.0.1',
                    port: 27016,
                    password: '123'
                }
            },
            {
                message: '127.0.0.1:27017',
                value: {
                    type: 'server',
                    host: '127.0.0.1',
                    port: 27017,
                    password: '123'
                }
            },
            {
                message: 'Add new',
                value: {
                    type: 'create'
                }
            }
        ],
    });
    if (response.type === 'server') {
        console.log(response);
    } else {
        const host = await prompt({
            type: 'input',
            name: 'host',
            message: 'Type server host:'
        });
        const port = await prompt({
            type: 'input',
            name: 'port',
            message: 'Type server port:'
        });

        const password = await prompt({
            type: 'input',
            name: 'password',
            message: 'Type server password:'
        });
        console.log(host, port, password);
    }

})();
