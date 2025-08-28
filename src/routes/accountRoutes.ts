import { Router, Request, Response } from "express"
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../controller/accountController';
const accountRoutes = Router();

accountRoutes.get('/', getAccounts);         // US-AC-01, US-AC-05
accountRoutes.post('/', createAccount); // US-AC-02
accountRoutes.put('/:id', (req: Request, res: Response) => {
  updateAccount(req, res);
});   // US-AC-03
accountRoutes.delete('/:id', (req: Request, res: Response) => {
  deleteAccount(req, res);
}); // US-AC-04
export default accountRoutes;