"use strict";
var t0 = Date.now();

var express = require("express"),
    xhub = require('express-x-hub'),
    comment = require("./lib/comment");

if (process.env.NODE_ENV === "dev") {
    // Load local env variables
    require("./env");
}

function logArgs() {
    var args = arguments;
    process.nextTick(function() {
        console.log.apply(console, args);
    });
}

var app = express();
app.use(xhub({ algorithm: 'sha1', secret: process.env.GITHUB_SECRET }));

app.post('/github-hook', function (req, res, next) {
    if (process.env.NODE_ENV != 'production' || req.isXHubValid()) {
        res.send(new Date().toISOString());
        var payload = req.body;
        switch(payload.action) {
            case "opened":
            case "edited":
            case "reopened":
            case "synchronize":
                logArgs(`${ payload.pull_request.base.repo.full_name }#${ payload.number }: ${ payload.action }`);
                comment(payload).then(logArgs, logArgs);
                break;
            default:
                logArgs("Unknown request", JSON.stringify(payload, null, 4));
        }
    } else {
        logArgs("Unverified request", req);
    }
    next();
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
    console.log("App started in", (Date.now() - t0) + "ms.");
});
