import {DynamoDB} from "aws-sdk";
import {promisifyAll} from "bluebird";

import * as config from "config";

const dynamodb = (
    config.NODE_ENV === "production" ?
    new DynamoDB.DocumentClient({
        apiVersion: "2012-08-10",
        region: config.DYNAMODB_REGION
    }) :
    new DynamoDB.DocumentClient({
        apiVersion: "2012-08-10",
        accessKeyId: "accessKeyId",
        secretAccessKey: "secretAccessKey",
        endpoint: "http://localhost:8000",
        region: config.DYNAMODB_REGION
    })
);
export default promisifyAll(dynamodb);
