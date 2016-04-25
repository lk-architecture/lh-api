import * as config from "config";
import * as requireAuthentication from "middleware/require-authentication";
import dynamodb from "services/dynamodb";

export const path = "/organizations";
export const method = "get";
export const description = "List organizations for the given user";
export const tags = ["organizations"];
export const responses = {
    "200": {
        description: "Organization list"
    },
    ...requireAuthentication.responses
};
export const middleware = [requireAuthentication.middleware];
export async function handler (req, res) {
    // Retrieve organizations by owner
    const result = await dynamodb.scanAsync({
        TableName: config.DYNAMODB_ORGANIZATIONS,
        FilterExpression: "ownerId = :ownerId",
        ExpressionAttributeValues: {":ownerId": req.jwt.sub}
    });
    res.status(200).send(result.Items);
}
