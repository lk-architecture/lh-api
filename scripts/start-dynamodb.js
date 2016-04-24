import dynalite from "dynalite";

import * as config from "config";
import setupDynamodb from "./setup-dynamodb";

dynalite({createTableMs: 0})
    .listen(8000, async err => {
        if (err) {
            console.log("Error starting dynalite server");
            console.log(err.stack);
            process.exit(1);
            return;
        }
        console.log("dynalite started on http://localhost:8000");
        try {
            await setupDynamodb();
        } catch (err) {
            console.log(`Error creating table ${config.DYNAMODB_APPS_TABLE_NAME}`);
            console.log(err.stack);
            process.exit(1);
        }
    });
