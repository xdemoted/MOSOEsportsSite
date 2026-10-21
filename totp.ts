const speakeasy = require('speakeasy');

const token = speakeasy.totp({
    secret: 'I65VU7K5ZQL7WB4E',
    encoding: 'base32'
});

console.log(token);