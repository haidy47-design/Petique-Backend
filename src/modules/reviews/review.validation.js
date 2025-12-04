import  joi from 'joi';
import { generalFields } from '../../middelwares/validate.js';

export const addReviewVal = joi.object({
    comment : generalFields.comment,
    rate: generalFields.rate.required(),
    product : generalFields.objectId.required(),
});

export const updateReviewVal = joi.object({
    comment : generalFields.comment,
    rate: generalFields.rate,
    product : generalFields.objectId,
});