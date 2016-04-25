export const responses = {
    "401": {
        description: "Authentication required"
    }
};

export function middleware (req, res, next) {
    if (req.jwt) {
        next();
        return;
    }
    res.status(401).send({
        message: "Authentication required to perform this operation"
    });
}
