import {all, map} from "bluebird";
import {expect} from "chai";
import express from "express";
import request from "supertest-as-promised";
import {sign} from "jsonwebtoken";

import api from "api";
import * as config from "config";
import dynamodb from "services/dynamodb";

describe("GET /lambdas/:organizationName", () => {

    const server = express().use(api);
    const token = sign(
        {aud: config.AUTH0_CLIENT_ID, sub: "userId"},
        config.AUTH0_CLIENT_SECRET
    );
    const orgNames = ["org0", "org1", "org2"];
    const lambdaNames = ["lambda0", "lambda1", "lambda2"];

    beforeEach(() => {
        return map(orgNames, orgName => all([
            dynamodb.putAsync({
                TableName: config.DYNAMODB_ORGANIZATIONS,
                Item: {
                    name: orgName,
                    ownerId: "userId"
                }
            }),
            map(lambdaNames, lambdaName => (
                dynamodb.putAsync({
                    TableName: config.DYNAMODB_LAMBDAS,
                    Item: {
                        organizationName: orgName,
                        name: lambdaName,
                        sourceRepository: "gh/org/repo"
                    }
                })
            ))
        ]));
    });
    afterEach(() => {
        return map(orgNames, orgName => all([
            dynamodb.deleteAsync({
                TableName: config.DYNAMODB_ORGANIZATIONS,
                Key: {name: orgName}
            }),
            map(lambdaNames, lambdaName => (
                dynamodb.deleteAsync({
                    TableName: config.DYNAMODB_LAMBDAS,
                    Key: {
                        organizationName: orgName,
                        name: lambdaName
                    }
                })
            ))
        ]));
    });

    it("404 on organization not found", () => {
        return request(server)
            .get("/lambdas/nonExistingOrganizationName")
            .set("Authorization", `Bearer ${token}`)
            .expect(404)
            .expect(/Organization nonExistingOrganizationName not found/);
    });

    it("200 and returns the organization's lambdas", () => {
        return map(orgNames, async orgName => {
            const {body: lambdas} = await request(server)
                .get(`/lambdas/${orgName}`)
                .set("Authorization", `Bearer ${token}`)
                .expect(200);
            expect(lambdas).to.deep.include.members(
                lambdaNames.map(lambdaName => ({
                    organizationName: orgName,
                    name: lambdaName,
                    sourceRepository: "gh/org/repo"
                }))
            );
            expect(lambdas).to.have.length(lambdaNames.length);
        });
    });

});
