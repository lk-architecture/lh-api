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
    .convroute(require("api/organizations/get"))
    .convroute(require("api/organizations/post"))
    .convroute(require("api/organizations/:organizationName/get"))
    .convroute(require("api/organizations/:organizationName/delete"))
    .convroute(require("api/lambdas/:organizationName/get"))
    .convroute(require("api/lambdas/:organizationName/post"))
    .convroute(require("api/lambdas/:organizationName/:lambdaName/get"))
    .convroute(require("api/lambdas/:organizationName/:lambdaName/delete"));
