import * as config from "config";
import dynamodb from "services/dynamodb";

export const path = "/lambdas/:organizationName/:lambdaName";
export const method = "get";
export const description = "Get lambda by organization and name";
export const tags = ["lambdas"];
export const parameters = [
    {
        name: "organizationName",
        in: "path",
        required: true,
        type: "string"
    },
    {
        name: "lambdaName",
        in: "path",
        required: true,
        type: "string"
    }
];
export const responses = {
    "200": {
        description: "Lambda"
    },
    "404": {
        description: "Lambda not found"
    }
};
export async function handler (req, res) {
    const {Item: lambda} = await dynamodb.getAsync({
        TableName: config.DYNAMODB_LAMBDAS,
        Key: {
            organizationName: req.params.organizationName,
            name: req.params.lambdaName
        }
    });
    // Fail if the lambda doesn't exist
    if (!lambda) {
        res.status(404).send({
            message: `Lambda ${req.params.organizationName}/${req.params.lambdaName} not found`
        });
        return;
    }
    res.status(200).send(lambda);
}
