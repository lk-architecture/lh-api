import {map} from "bluebird";
import {expect} from "chai";
import express from "express";
import request from "supertest-as-promised";
import {sign} from "jsonwebtoken";

import api from "api";
import * as config from "config";
import dynamodb from "services/dynamodb";

describe("POST /organizations", () => {

    const server = express().use(api);
    const token = sign(
        {aud: config.AUTH0_CLIENT_ID, sub: "userId"},
        config.AUTH0_CLIENT_SECRET
    );

    afterEach(() => {
        return dynamodb.deleteAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Key: {name: "organizationName"}
        });
    });

    it("400 on bad request [CASE 0: no body]", () => {
        return request(server)
            .post("/organizations")
            .set("Authorization", `Bearer ${token}`)
            .expect(400)
            .expect(/Validation failed/);
    });

    it("400 on bad request [CASE 1: invalid body - missing name property]", () => {
        return request(server)
            .post("/organizations")
            .set("Authorization", `Bearer ${token}`)
            .send({notName: "notName"})
            .expect(400)
            .expect(/Validation failed/);
    });

    it("400 on bad request [CASE 2: invalid body - bad name property]", () => {
        const invalidNames = [
            "n.ame",
            "_name",
            "na--me",
            "na_-me",
            "name-"
        ];
        return map(invalidNames, name => (
            request(server)
                .post("/organizations")
                .set("Authorization", `Bearer ${token}`)
                .send({name})
                .expect(400)
                .expect(/Validation failed/)
        ));
    });

    it("400 on bad request [CASE 3: invalid body - disallowed additional properties]", () => {
        return request(server)
            .post("/organizations")
            .set("Authorization", `Bearer ${token}`)
            .send({name: "organizationName", notName: "notName"})
            .expect(400)
            .expect(/Validation failed/);
    });

    it("409 on existing organization", async () => {
        await dynamodb.putAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Item: {name: "organizationName"}
        });
        return request(server)
            .post("/organizations")
            .set("Authorization", `Bearer ${token}`)
            .send({name: "organizationName"})
            .expect(409)
            .expect(/Organization organizationName already exists/);
    });

    it("writes a new organization to dynamodb", async () => {
        await request(server)
            .post("/organizations")
            .set("Authorization", `Bearer ${token}`)
            .send({name: "organizationName"});
        const {Item: organization} = await dynamodb.getAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Key: {name: "organizationName"}
        });
        expect(organization).to.deep.equal({
            name: "organizationName",
            ownerId: "userId"
        });
    });

    it("201 on successful write", async () => {
        await request(server)
            .post("/organizations")
            .set("Authorization", `Bearer ${token}`)
            .send({name: "organizationName"})
            .expect(201);
        // Check that the write was successful
        const {Item: organization} = await dynamodb.getAsync({
            TableName: config.DYNAMODB_ORGANIZATIONS,
            Key: {name: "organizationName"}
        });
        expect(organization).to.deep.equal({
            name: "organizationName",
            ownerId: "userId"
        });
    });

    it("returns the created organization", () => {
        return request(server)
            .post("/organizations")
            .set("Authorization", `Bearer ${token}`)
            .send({name: "organizationName"})
            .expect(201)
            .expect({
                name: "organizationName",
                ownerId: "userId"
            });
    });

});
