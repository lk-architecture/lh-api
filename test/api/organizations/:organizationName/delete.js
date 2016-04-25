import {expect} from "chai";
import express from "express";
import request from "supertest-as-promised";
import {sign} from "jsonwebtoken";

import api from "api";
import * as config from "config";
import dynamodb from "services/dynamodb";

describe("DELETE /organizations/:organizationName", () => {

    const server = express().use(api);
    const token = sign(
        {aud: config.AUTH0_CLIENT_ID, sub: "userId"},
        config.AUTH0_CLIENT_SECRET
    );

    beforeEach(() => {
        return dynamodb.putAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Item: {
                name: "organizationName",
                ownerId: "userId"
            }
        });
    });
    afterEach(() => {
        return dynamodb.deleteAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Key: {name: "organizationName"}
        });
    });

    it("404 on organization not found", () => {
        return request(server)
            .delete("/organizations/nonExistingOrganizationName")
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
            .delete("/organizations/organizationName")
            .set("Authorization", `Bearer ${anotherUserToken}`)
            .expect(403)
            .expect(/Not allowed to delete organization organizationName/);
    });

    it("deletes the organization", async () => {
        await request(server)
            .delete("/organizations/organizationName")
            .set("Authorization", `Bearer ${token}`);
        const {Item: organization} = await dynamodb.getAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Key: {name: "organizationName"}
        });
        expect(organization).to.equal(undefined);
    });

    it("on successful deletion, 204", async () => {
        await request(server)
            .delete("/organizations/organizationName")
            .set("Authorization", `Bearer ${token}`)
            .expect(204);
        // Check that the deletion was successful
        const {Item: organization} = await dynamodb.getAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Key: {name: "organizationName"}
        });
        expect(organization).to.equal(undefined);
    });

});
