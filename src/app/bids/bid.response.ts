import { BaseResponses } from "@app/common/helpers";

export const BID_RESPONSE = {
  ...BaseResponses('Bid'),

  ERROR: {
    NOT_FOUND: 'Bid not found.',
    EXIST: 'Bid exists.',
  },

  LOG: {
    CREATE: 'Bid created.'
  }
};