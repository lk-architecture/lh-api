import express from "express";
import request from "supertest-as-promised";

import api from "api";
import * as config from "config";
import dynamodb from "services/dynamodb";

describe("GET /organizations/:organizationName", () => {

    const server = express().use(api);

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
            .get("/organizations/nonExistingOrganizationName")
            .expect(404)
            .expect(/Organization nonExistingOrganizationName not found/);
    });

    it("200 and returns the requested organization", () => {
        return request(server)
            .get("/organizations/organizationName")
            .expect(200)
            .expect({
                name: "organizationName",
                ownerId: "userId"
            });
    });

});
