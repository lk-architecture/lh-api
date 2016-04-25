import * as config from "config";
import dynamodb from "services/dynamodb";

export const path = "/organizations/:organizationName";
export const method = "delete";
export const description = "Delete organization by name";
export const tags = ["organizations"];
export const parameters = [{
    name: "organizationName",
    in: "path",
    required: true,
    type: "string"
}];
export const responses = {
    "204": {
        description: "Organization deleted"
    },
    "403": {
        description: "Not allowed to delete organization"
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
    // Fail if the organization doesn't belong to the user
    if (organization.ownerId !== req.user.sub) {
        res.status(403).send({
            message: `Not allowed to delete organization ${req.params.organizationName}`
        });
        return;
    }
    // Delete the organization
    await dynamodb.deleteAsync({
        TableName: config.DYNAMODB_ORGANIZATIONS,
        Key: {name: req.params.organizationName}
    });
    // TODO delete all lambdas for the organization
    res.status(204).send();
}
