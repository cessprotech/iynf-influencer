import { BaseResponses } from "@app/common/helpers";

export const INFLUENCER_RESPONSE = {
  ...BaseResponses('Influencer'),

  ERROR: {
    NOT_FOUND: 'Influencer not found.',
    EXIST: 'Influencer exists.',
  },

  LOG: {
    CREATE: 'Influencer created.'
  }
};