import express from "express";
import { json } from "express";
import cors from "cors";
import { bootstrap } from "./src/modules/bootstrap.js";
import { webhookStripe } from "./src/utils/webHook.js";

const app = express();

const port = process.env.PORT || 3000;
app.post('/webHook', express.raw({type: 'application/json'}), webhookStripe)

app.use(json());
app.use(cors());

bootstrap(app);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
