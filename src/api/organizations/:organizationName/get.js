import * as config from "config";
import dynamodb from "services/dynamodb";

export const path = "/organizations/:organizationName";
export const method = "get";
export const description = "Get organization by name";
export const tags = ["organizations"];
export const parameters = [{
    name: "organizationName",
    in: "path",
    required: true,
    type: "string"
}];
export const responses = {
    "200": {
        description: "Organization"
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
    res.status(200).send(organization);
}
