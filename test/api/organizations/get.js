import {map} from "bluebird";
import {expect} from "chai";
import express from "express";
import request from "supertest-as-promised";
import {sign} from "jsonwebtoken";

import api from "api";
import * as config from "config";
import dynamodb from "services/dynamodb";

describe("GET /organizations", () => {

    const server = express().use(api);
    const token = sign(
        {aud: config.AUTH0_CLIENT_ID, sub: "userId"},
        config.AUTH0_CLIENT_SECRET
    );
    const names = ["org0", "org1", "org2"];

    beforeEach(() => {
        return map(names, name => (
            dynamodb.putAsync({
                TableName: config.DYNAMODB_ORGANIZATIONS,
                Item: {
                    name: name,
                    ownerId: "userId"
                }
            })
        ));
    });
    afterEach(() => {
        return map(names, name => (
            dynamodb.deleteAsync({
                TableName: config.DYNAMODB_ORGANIZATIONS,
                Key: {name}
            })
        ));
    });

    it("returns the user's organizations", async () => {
        const {body: organizations} = await request(server)
            .get("/organizations")
            .set("Authorization", `Bearer ${token}`)
            .expect(200);
        expect(organizations).to.deep.include.members(
            names.map(name => ({name: name, ownerId: "userId"}))
        );
        expect(organizations).to.have.length(names.length);
    });

});
