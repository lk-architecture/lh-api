import {hostname} from "os";

export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = process.env.PORT || 3000;
export const HOSTNAME = process.env.HOSTNAME || "localhost";
export const HOST = `${HOSTNAME}:${PORT}`;

export const DYNAMODB_REGION = process.env.DYNAMODB_REGION || "us-west-1";
export const DYNAMODB_LAMBDAS = process.env.DYNAMODB_LAMBDAS || "lh-lambdas";
export const DYNAMODB_ORGANIZATIONS = process.env.DYNAMODB_ORGANIZATIONS || "lh-organizations";

export const STS_TARGET_ROLE_ARN = process.env.STS_TARGET_ROLE_ARN || "arn:aws:iam::000000000000:role/lh-worker";

export const S3_UPLOAD_BUCKET = process.env.S3_UPLOAD_BUCKET || "S3_UPLOAD_BUCKET";

export const SERVER_ID = `lh-api@${hostname()}`;
export const AWS_CLOUDWATCH_GROUP = "lh-api";
export const AWS_CLOUDWATCH_STREAM = SERVER_ID;
export const AWS_CLOUDWATCH_REGION = process.env.AWS_CLOUDWATCH_REGION;

export const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || "AUTH0_CLIENT_ID";
export const AUTH0_CLIENT_SECRET = new Buffer(
    process.env.AUTH0_CLIENT_SECRET || new Buffer("AUTH0_CLIENT_SECRET").toString("base64"),
    "base64"
);
