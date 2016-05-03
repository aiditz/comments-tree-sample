'use strict';

module.exports = function (err, req, res, next) {
    console.error(err);

    var json = {
        name: err.name,
        message: err.message
    };

    res.status(500).json(json);
};