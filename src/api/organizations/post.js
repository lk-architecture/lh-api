import * as config from "config";
import dynamodb from "services/dynamodb";

export const path = "/organizations";
export const method = "post";
export const description = "Create a new organization";
export const tags = ["organizations"];
export const parameters = [{
    name: "organization",
    in: "body",
    required: true,
    schema: {
        type: "object",
        properties: {
            name: {
                description: "Name of the organization",
                type: "string",
                /*
                *   The name must follow these rules:
                *     - starts with a letter or a number
                *     - ends with a letter or a number
                *     - only contains letters, numbers, dashes and underscores
                *     - dashes and underscores are not adjacent
                *     - dashes and underscores are not consecutively repeated twice or more
                *   Example:
                *     - valid names: "name", "1name", "n-a-m-e", "n_a_m_e"
                *     - invalid names: "_name", "name-", "na--me", "na-_me", "n/a/m/e"
                */
                pattern: "^[A-Za-z0-9](?=[\\w-]{2,15}[A-Za-z0-9]$)(?!.*[-_]{2,}.*)"
            }
        },
        additionalProperties: false,
        required: ["name"]
    }
}];
export const responses = {
    "201": {
        description: "Organization created"
    },
    "409": {
        description: "Organization with same name already exists"
    }
};
export async function handler (req, res) {
    const {Item: existingOrganization} = await dynamodb.getAsync({
        TableName: config.DYNAMODB_ORGANIZATIONS,
        Key: {name: req.body.name}
    });
    // Fail if an organization by the same name already exists
    if (existingOrganization) {
        res.status(409).send({
            message: `Organization ${req.body.name} already exists`
        });
        return;
    }
    // Create the organization
    const organization = {
        name: req.body.name,
        ownerId: req.user.sub
    };
    await dynamodb.putAsync({
        TableName: config.DYNAMODB_ORGANIZATIONS,
        Item: organization
    });
    res.status(201).send(organization);
}
