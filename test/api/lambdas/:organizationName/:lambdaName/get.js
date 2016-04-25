import express from "express";
import request from "supertest-as-promised";

import api from "api";
import * as config from "config";
import dynamodb from "services/dynamodb";

describe("GET /lambdas/:organizationName/:lambdaName", () => {

    const server = express().use(api);

    beforeEach(async () => {
        await dynamodb.putAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Item: {
                name: "organizationName",
                ownerId: "userId"
            }
        });
        await dynamodb.putAsync({
            TableName: config.DYNAMODB_LAMBDAS,
            Item: {
                organizationName: "organizationName",
                name: "lambdaName",
                sourceRepository: "gh/org/repo"
            }
        });
    });
    afterEach(async () => {
        await dynamodb.deleteAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Key: {name: "organizationName"}
        });
        await dynamodb.deleteAsync({
            TableName: config.DYNAMODB_LAMBDAS,
            Key: {
                organizationName: "organizationName",
                name: "lambdaName"
            }
        });
    });

    it("404 on lambda not found [CASE 0: non existing organization]", () => {
        return request(server)
            .get("/lambdas/nonExistingOrganizationName/lambdaName")
            .expect(404)
            .expect(/Lambda nonExistingOrganizationName\/lambdaName not found/);
    });

    it("404 on lambda not found [CASE 0: non existing lambda]", () => {
        return request(server)
            .get("/lambdas/organizationName/nonExistingLambdaName")
            .expect(404)
            .expect(/Lambda organizationName\/nonExistingLambdaName not found/);
    });

    it("200 and returns the requested lambda", () => {
        return request(server)
            .get("/lambdas/organizationName/lambdaName")
            .expect(200)
            .expect({
                organizationName: "organizationName",
                name: "lambdaName",
                sourceRepository: "gh/org/repo"
            });
    });

});
