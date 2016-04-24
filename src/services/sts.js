import {STS} from "aws-sdk";
import {promisifyAll} from "bluebird";

const sts = new STS({
    apiVersion: "2011-06-15"
});
export default promisifyAll(sts);
