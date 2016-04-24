import convexpress from "convexpress";

import * as config from "config";
import authenticate from "middleware/authenticate";

const options = {
    info: {
        title: "lh-api",
        version: "1.0.0"
    },
    host: config.HOST
};
export default convexpress(options)
    .serveSwagger()
    .use(authenticate())
    .convroute(require("api/o/get"))
    .convroute(require("api/o/post"))
    .convroute(require("api/o/:organizationName/get"))
    .convroute(require("api/o/:organizationName/delete"))
    .convroute(require("api/l/:organizationName/get"))
    .convroute(require("api/l/:organizationName/post"))
    .convroute(require("api/l/:organizationName/:lambdaName/get"))
    .convroute(require("api/l/:organizationName/:lambdaName/delete"));
