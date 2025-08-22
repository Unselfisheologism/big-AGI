import * as z from 'zod';

export namespace PollinationsaiWire_API_Models_List {
  export const Model_schema = z.object({
    id: z.string(),
    object: z.string(),
    // Include other properties you expect from the Pollinations.AI /models endpoint
    // For example:
    // created: z.number().optional(),
    // owned_by: z.string().optional(),
    // permission: z.array(z.any()).optional(), // You might need a more specific schema here
  });

  export type Model = z.infer<typeof Model_schema>;

  export const Response_schema = z.object({
    data: z.array(Model_schema),
    // Include other properties if the response has them (like 'object', 'created')
    // object: z.literal('list').optional(),
    // created: z.number().optional(),
  });

  export type Response = z.infer<typeof Response_schema>;
}