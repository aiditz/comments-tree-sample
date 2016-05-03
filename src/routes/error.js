'use strict';

module.exports = function (err, req, res, next) {
    console.error(err);

    var json = {
        error: err.name,
        code: err.code,
        message: err.message
    };

    res.status(500).json(json);
};