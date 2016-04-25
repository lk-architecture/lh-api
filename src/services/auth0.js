import {AuthenticationClient} from "auth0";

import * as config from "config";

export default new AuthenticationClient({
    domain: config.AUTH0_DOMAIN,
    clientId: config.AUTH0_CLIENT_ID
});
