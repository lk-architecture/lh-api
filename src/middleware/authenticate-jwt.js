import jwt from "express-jwt";

import * as config from "config";

export default function authenticateJwt () {
    const jwtMiddleware = jwt({
        secret: config.AUTH0_CLIENT_SECRET,
        audience: config.AUTH0_CLIENT_ID,
        requestProperty: "jwt",
        credentialsRequired: false
    });
    return (req, res, next) => {
        jwtMiddleware(req, res, err => {
            if (err) {
                res.status(401).send({
                    message: err.message
                });
            } else {
                next();
            }
        });
    };
}
