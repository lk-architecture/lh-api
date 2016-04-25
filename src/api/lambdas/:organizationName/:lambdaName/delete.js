import * as config from "config";
import * as requireAuthentication from "middleware/require-authentication";
import dynamodb from "services/dynamodb";

export const path = "/lambdas/:organizationName/:lambdaName";
export const method = "delete";
export const description = "Delete lambda by organization and name";
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
    "204": {
        description: "Organization deleted"
    },
    ...requireAuthentication.responses,
    "403": {
        description: "Not allowed to delete lambdas for organization"
    },
    "404": {
        description: "Lambda or organization not found"
    }
};
export const middleware = [requireAuthentication.middleware];
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
    // Fail if the organization doesn't belong to the user
    if (organization.ownerId !== req.jwt.sub) {
        res.status(403).send({
            message: `Not allowed to delete lambdas for organization ${req.params.organizationName}`
        });
        return;
    }
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
            message: `Lambda ${req.params.lambdaName} not found`
        });
        return;
    }
    // Delete the lambda
    await dynamodb.deleteAsync({
        TableName: config.DYNAMODB_LAMBDAS,
        Key: {
            organizationName: req.params.organizationName,
            name: req.params.lambdaName
        }
    });
    res.status(204).send();
}
