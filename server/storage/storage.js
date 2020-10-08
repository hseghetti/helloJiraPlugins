const fs = require('fs');
const data = JSON.parse(fs.readFileSync(__dirname + '/data.json'));


export default {
    updateData: (domain, ticket, status, action) => {

        if (data[domain]) {
            if (data[ticket]) {
                data[domain][ticket].push({
                    status,
                    action,
                    timestamp: Date.now()
                });
            } else {
                data[domain][ticket] = [{
                        status,
                        action,
                        timestamp: Date.now()
                    }];
            }
        } else {
            // add new domain
        }

        fs.writeFileSync(__dirname + '/data.json', JSON.stringify(data));
    }
};