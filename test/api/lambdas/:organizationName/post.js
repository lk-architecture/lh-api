import {map} from "bluebird";
import {expect} from "chai";
import express from "express";
import request from "supertest-as-promised";
import {sign} from "jsonwebtoken";

import api from "api";
import * as config from "config";
import dynamodb from "services/dynamodb";

describe("POST /lambdas/:organizationName", () => {

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

    it("400 on bad request [CASE 0: no body]", () => {
        return request(server)
            .post("/lambdas/organizationName")
            .expect(400)
            .expect(/Validation failed/);
    });

    it("400 on bad request [CASE 1: invalid body - missing property]", () => {
        const invalidBodies = [
            {}, {name: "lambdaName"}, {sourceRepository: "gh/org/repo"}
        ];
        return map(invalidBodies, body => (
            request(server)
                .post("/lambdas/organizationName")
                .send(body)
                .expect(400)
                .expect(/Validation failed/)
        ));
    });

    it("400 on bad request [CASE 2: invalid body - bad name property]", () => {
        const invalidNames = [
            "n/ame",
            "_name",
            "na--me",
            "na_-me",
            "na.-me",
            "na..me",
            "name-",
            "name."
        ];
        return map(invalidNames, name => (
            request(server)
                .post("/lambdas/organizationName")
                .send({name: name, sourceRepository: "gh/org/repo"})
                .expect(400)
                .expect(/Validation failed/)
        ));
    });

    it("400 on bad request [CASE 3: invalid body - bad sourceRepository property]", () => {
        const invalidSourceRepositories = [
            "org/repo",
            "github/org/repo",
            "random"
        ];
        return map(invalidSourceRepositories, sourceRepository => (
            request(server)
                .post("/lambdas/organizationName")
                .send({name: "lambdaName", sourceRepository: sourceRepository})
                .expect(400)
                .expect(/Validation failed/)
        ));
    });

    it("400 on bad request [CASE 4: invalid body - disallowed additional properties]", () => {
        return request(server)
            .post("/lambdas/organizationName")
            .send({name: "lambdaName", sourceRepository: "gh/org/repo", notName: "notName"})
            .expect(400)
            .expect(/Validation failed/);
    });

    it("401 on missing authentication", () => {
        return request(server)
            .post("/lambdas/organizationName")
            .send({name: "lambdaName", sourceRepository: "gh/org/repo"})
            .expect(401)
            .expect(/Authentication required to perform this operation/);
    });

    it("403 on organization not belonging to the user", () => {
        const anotherUserToken= sign(
            {aud: config.AUTH0_CLIENT_ID, sub: "anotherUserId"},
            config.AUTH0_CLIENT_SECRET
        );
        return request(server)
            .post("/lambdas/organizationName")
            .set("Authorization", `Bearer ${anotherUserToken}`)
            .send({name: "lambdaName", sourceRepository: "gh/org/repo"})
            .expect(403)
            .expect(/Not allowed to create lambdas for organization organizationName/);
    });

    it("409 on existing lambda", async () => {
        await dynamodb.putAsync({
            TableName: config.DYNAMODB_LAMBDAS,
            Item: {
                organizationName: "organizationName",
                name: "lambdaName",
                sourceRepository: "gh/org/repo"
            }
        });
        return request(server)
            .post("/lambdas/organizationName")
            .set("Authorization", `Bearer ${token}`)
            .send({name: "lambdaName", sourceRepository: "gh/org/repo"})
            .expect(409)
            .expect(/Lambda lambdaName already exists for organization organizationName/);
    });

    it("writes a new lambda to dynamodb", async () => {
        await request(server)
            .post("/lambdas/organizationName")
            .set("Authorization", `Bearer ${token}`)
            .send({name: "lambdaName", sourceRepository: "gh/org/repo"});
        const {Item: lambda} = await dynamodb.getAsync({
            TableName: config.DYNAMODB_LAMBDAS,
            Key: {
                organizationName: "organizationName",
                name: "lambdaName"
            }
        });
        expect(lambda).to.deep.equal({
            organizationName: "organizationName",
            name: "lambdaName",
            sourceRepository: "gh/org/repo"
        });
    });

    it("on successful write, 201 and returns the created lambda", async () => {
        await request(server)
            .post("/lambdas/organizationName")
            .set("Authorization", `Bearer ${token}`)
            .send({name: "lambdaName", sourceRepository: "gh/org/repo"})
            .expect(201)
            .expect({
                organizationName: "organizationName",
                name: "lambdaName",
                sourceRepository: "gh/org/repo"
            });
        // Check that the write was successful
        const {Item: lambda} = await dynamodb.getAsync({
            TableName: config.DYNAMODB_LAMBDAS,
            Key: {
                organizationName: "organizationName",
                name: "lambdaName"
            }
        });
        expect(lambda).to.deep.equal({
            organizationName: "organizationName",
            name: "lambdaName",
            sourceRepository: "gh/org/repo"
        });
    });

});
