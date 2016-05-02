'use strict';

module.exports = function(err, req, res, next) {
    var json = {
        code: err.code,
        msg: err.message
    };

    if (process.env.NODE_ENV !== 'production') {
        json.stack = err.stack;
    }

    res.status(500).json(err);
};