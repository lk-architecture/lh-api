import * as config from "config";
import dynamodb from "services/dynamodb";

export const path = "/l/:organizationName";
export const method = "post";
export const description = "Create a new lambda for an organization";
export const tags = ["lambdas"];
export const parameters = [
    {
        name: "organizationName",
        in: "path",
        required: true,
        type: "string"
    },
    {
        name: "lambda",
        in: "body",
        required: true,
        schema: {
            type: "object",
            properties: {
                name: {
                    description: "Name of the lambda",
                    type: "string",
                    pattern: "^[A-Za-z0-9][\\w-\\.]{2,15}[A-Za-z0-9]$"
                },
                sourceRepository: {
                    description: "Github source repository",
                    type: "string",
                    pattern: "^gh/"
                }
            },
            additionalProperties: false,
            required: ["name", "sourceRepository"]
        }
    }
];
export const responses = {
    "201": {
        description: "Lambda created"
    },
    "403": {
        description: "Not allowed to create lambdas for organization"
    },
    "404": {
        description: "Organization not found"
    },
    "409": {
        description: "Lambda with same name already exists"
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
    // Fail if the organization doesn't belong to the user
    if (organization.ownerId !== req.user.sub) {
        res.status(403).send({
            message: `Not allowed to create lambdas for organization ${req.params.organizationName}`
        });
        return;
    }
    const {Item: existingLambda} = await dynamodb.getAsync({
        TableName: config.DYNAMODB_LAMBDAS,
        Key: {
            organizationName: req.params.organizationName,
            name: req.body.name
        }
    });
    // Fail if a lambda with the same name already exists for the organization
    if (existingLambda) {
        res.status(409).send({
            message: `Lambda ${req.body.name} already exists for organization ${req.params.organizationName}`
        });
        return;
    }
    // TODO check sourceRepository
    // Create the lambda
    const lambda = {
        organizationName: req.params.organizationName,
        name: req.body.name,
        sourceRepository: req.body.sourceRepository
    };
    await dynamodb.putAsync({
        TableName: config.DYNAMODB_LAMBDAS,
        Item: lambda
    });
    res.status(201).send();
}
