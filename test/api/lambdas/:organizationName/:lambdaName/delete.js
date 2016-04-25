import {expect} from "chai";
import express from "express";
import request from "supertest-as-promised";
import {sign} from "jsonwebtoken";

import api from "api";
import * as config from "config";
import dynamodb from "services/dynamodb";

describe("DELETE /lambdas/:organizationName/:lambdaName", () => {

    const server = express().use(api);
    const token = sign(
        {aud: config.AUTH0_CLIENT_ID, sub: "userId"},
        config.AUTH0_CLIENT_SECRET
    );

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

    it("404 on organization not found", () => {
        return request(server)
            .delete("/lambdas/nonExistingOrganizationName/lambdaName")
            .set("Authorization", `Bearer ${token}`)
            .expect(404)
            .expect(/Organization nonExistingOrganizationName not found/);
    });

    it("403 on organization not belonging to the user", () => {
        const anotherUserToken= sign(
            {aud: config.AUTH0_CLIENT_ID, sub: "anotherUserId"},
            config.AUTH0_CLIENT_SECRET
        );
        return request(server)
            .delete("/lambdas/organizationName/lambdaName")
            .set("Authorization", `Bearer ${anotherUserToken}`)
            .expect(403)
            .expect(/Not allowed to delete lambdas for organization organizationName/);
    });

    it("404 on lambda not found", () => {
        return request(server)
            .delete("/lambdas/organizationName/nonEsistingLambdaName")
            .set("Authorization", `Bearer ${token}`)
            .expect(404)
            .expect(/Lambda nonEsistingLambdaName not found/);
    });

    it("deletes the lambda", async () => {
        await request(server)
            .delete("/lambdas/organizationName/lambdaName")
            .set("Authorization", `Bearer ${token}`);
        const {Item: lambda} = await dynamodb.getAsync({
            TableName: config.DYNAMODB_LAMBDAS,
            Key: {
                organizationName: "organizationName",
                name: "lambdaName"
            }
        });
        expect(lambda).to.equal(undefined);
    });

    it("doesn't delete the organization", async () => {
        await request(server)
            .delete("/lambdas/organizationName/lambdaName")
            .set("Authorization", `Bearer ${token}`);
        const {Item: organization} = await dynamodb.getAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Key: {name: "organizationName"}
        });
        expect(organization).not.to.equal(undefined);
    });

    it("on successful deletion, 204", async () => {
        await request(server)
            .delete("/lambdas/organizationName/lambdaName")
            .set("Authorization", `Bearer ${token}`)
            .expect(204);
        // Check that the deletion was successful
        const {Item: lambda} = await dynamodb.getAsync({
            TableName: config.DYNAMODB_LAMBDAS,
            Key: {
                organizationName: "organizationName",
                name: "lambdaName"
            }
        });
        expect(lambda).to.equal(undefined);
    });

});
