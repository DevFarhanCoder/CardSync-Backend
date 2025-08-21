import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { listCards, createCard, getCard, updateCard, deleteCard } from '../controllers/cards.js';

export const cardsRouter = Router();
cardsRouter.get('/', requireAuth, listCards);
cardsRouter.post('/', requireAuth, createCard);
cardsRouter.get('/:id', requireAuth, getCard);
cardsRouter.put('/:id', requireAuth, updateCard);
cardsRouter.delete('/:id', requireAuth, deleteCard);
