import * as config from "config";
import dynamodb from "services/dynamodb";

export const path = "/l/:organizationName";
export const method = "get";
export const description = "List lambdas for the given organization";
export const tags = ["lambdas"];
export const parameters = [{
    name: "organizationName",
    in: "path",
    required: true,
    type: "string"
}];
export const responses = {
    "200": {
        description: "Lambda list"
    },
    "404": {
        description: "Organization not found"
    }
};
export async function handler (req, res) {
    const {Item: organization} = await dynamodb.getAsync({
        TableName: config.DYNAMODB_ORGANIZATIONS,
        Key: {name: req.params.organizationName}
    });
    // Fail if the organization doesn't exist
    if (!organization) {
        res.status(404).send({
            message: `Organization ${req.params.organizationName} not found`
        });
        return;
    }
    // Retrieve lambdas by organizations
    const {Items: lambdas} = await dynamodb.queryAsync({
        TableName: config.DYNAMODB_LAMBDAS,
        KeyConditionExpression: "organizationName = :organizationName",
        ExpressionAttributeValues: {
            ":organizationName": req.params.organizationName
        }
    });
    res.status(200).send(lambdas);
}
