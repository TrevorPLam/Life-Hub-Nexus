import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { systemClock } from "@workspace/domain-core";
import { createApiRouter } from "./routes";
import { createPlaceholderAuthVerifier } from "./middlewares/placeholder-verifier";
import { DrizzleProfileRepository } from "./data/profile/DrizzleProfileRepository";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api",
  createApiRouter(createPlaceholderAuthVerifier(), {
    repo: new DrizzleProfileRepository(),
    clock: systemClock,
  }),
);

export default app;
