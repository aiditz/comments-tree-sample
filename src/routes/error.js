'use strict';

module.exports = function (err, req, res, next) {

    var json = {
        error: err.name,
        message: err.message
    };

    //console.error(err);
    //console.log(json);

    res.status(500).json(json);
};