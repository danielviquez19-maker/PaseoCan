import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Owner: a
    .model({
      name: a.string().required(),
      phone: a.string(),
      email: a.email(),
      zone: a.string(),
      address: a.string(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Dog: a
    .model({
      ownerId: a.id().required(),
      name: a.string().required(),
      breed: a.string(),
      age: a.integer(),
      size: a.string(),
      energy: a.string(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Walker: a
    .model({
      name: a.string().required(),
      phone: a.string(),
      email: a.email(),
      zone: a.string(),
      rate: a.integer(),
      rating: a.float(),
      distance: a.string(),
      tags: a.string().array(),
      availability: a.string(),
      status: a.string(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Walk: a
    .model({
      ownerId: a.id().required(),
      dogId: a.id().required(),
      walkerId: a.id(),
      date: a.date().required(),
      time: a.string().required(),
      duration: a.integer().required(),
      route: a.string(),
      status: a.string(),
      estimatedCost: a.integer(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
