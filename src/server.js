import bunyanRequest from "bunyan-request";
import cors from "cors";
import express from "express";

import api from "api";
import * as config from "config";
import log from "services/logger";

express()
    .use(cors())
    .use(bunyanRequest({
        logger: log.child({childName: "request-logger"})
    }))
    .use(api)
    .listen(config.PORT, () => {
        log.info(`Server listening on port ${config.PORT}`);
    });
