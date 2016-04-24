import {DynamoDB} from "aws-sdk";
import {promisifyAll} from "bluebird";

import * as config from "config";

const dynamodb = new DynamoDB({
    apiVersion: "2012-08-10",
    endpoint: "http://localhost:8000",
    region: config.DYNAMODB_REGION,
    accessKeyId: "accessKeyId",
    secretAccessKey: "secretAccessKey"
});
promisifyAll(dynamodb);

export default async function setupDynamodb () {
    await dynamodb.createTableAsync({
        AttributeDefinitions: [{
            AttributeName: "name",
            AttributeType: "S"
        }],
        KeySchema: [{
            AttributeName: "name",
            KeyType: "HASH"
        }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        },
        TableName: config.DYNAMODB_ORGANIZATIONS
    });
    await dynamodb.createTableAsync({
        AttributeDefinitions: [
            {
                AttributeName: "organizationName",
                AttributeType: "S"
            },
            {
                AttributeName: "name",
                AttributeType: "S"
            }
        ],
        KeySchema: [
            {
                AttributeName: "organizationName",
                KeyType: "HASH"
            },
            {
                AttributeName: "name",
                KeyType: "RANGE"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        },
        TableName: config.DYNAMODB_LAMBDAS
    });
}
