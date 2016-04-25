import auth0 from "services/auth0";

export default function authenticateUser () {
    return async (req, res, next) => {
        if (!req.jwt) {
            next();
            return;
        }
        // The request has already passed through the `authenticateJwt`
        // middleware, therefore it's safe to assume that, if an authorization
        // header is present, it is also well-formed (i.e. Bearer xxxxx), hence
        // the simplified parsing that follows
        const [, unparsedJwt] = req.headers.authorization.split(" ");
        req.user = await auth0.tokens.getInfo(unparsedJwt);
        next();
    };
}
