import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nomichiRouter from "./nomichi";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nomichiRouter);

export default router;
