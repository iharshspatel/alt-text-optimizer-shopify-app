import { Router } from "express";
import clientProvider from "../../utils/clientProvider.js";
import TemplateModel from "../../utils/models/templateModel.js";
import ProductLog from "../../utils/models/productLogModel.js";
import Queue from "../../utils/models/queueModel.js";

const userRoutes = Router();

userRoutes.get("/", (req, res) => {
  try {
    const sendData = { text: "This is coming from /apps/api routes" };
    return res.status(200).json(sendData);
  } catch (e) {
    console.error(e);
    return res.status(400).send({ error: true });
  }
});

userRoutes.post("/", (req, res) => {
  try {
    return res.status(200).json(req.body);
  } catch (e) {
    console.error(e);
    return res.status(400).send({ error: true });
  }
});

userRoutes.get("/debug/gql", async (req, res) => {
  try {
    //false for offline session, true for online session
    const { client } = await clientProvider.offline.graphqlClient({
      shop: res.locals.user_session.shop,
    });

    const shop = await client.request(
      `{
      shop {
        name
      }
    }`
    );

    return res.status(200).json({ text: shop.data.shop.name });
  } catch (e) {
    console.error(e);
    return res.status(400).send({ error: true, text: "GQL Query broke" });
  }
});

userRoutes.get("/debug/activeWebhooks", async (req, res) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({
      shop: res.locals.user_session.shop,
    });
    const activeWebhooks = await client.request(
      `{
      webhookSubscriptions(first: 25) {
        edges {
          node {
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
        }
      }
    }`
    );
    return res.status(200).json(activeWebhooks);
  } catch (e) {
    console.error(e);
    return res.status(400).send({ error: true });
  }
});

userRoutes.get("/debug/getActiveSubscriptions", async (req, res) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({
      shop: res.locals.user_session.shop,
    });
    const response = await client.request(
      `{
      appInstallation {
        activeSubscriptions {
          name
          status
          lineItems {
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  __typename
                  price {
                    amount
                    currencyCode
                  }
                  interval
                }
              }
            }
          }
          test
        }
      }
    }`
    );

    return res.status(200).send(response);
  } catch (e) {
    console.error(e);
    return res.status(400).send({ error: true });
  }
});

userRoutes.get("/debug/createNewSubscription", async (req, res) => {
  try {
    const { client, shop } = await clientProvider.offline.graphqlClient({
      shop: res.locals.user_session.shop,
    });
    const returnUrl = `${process.env.SHOPIFY_APP_URL}/?shop=${shop}`;

    const planName = "$10.25 plan";
    const planPrice = 10.25; //Always a decimal

    const response = await client.request(
      `mutation CreateSubscription{
    appSubscriptionCreate(
      name: "${planName}"
      returnUrl: "${returnUrl}"
      test: true
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount: ${planPrice}, currencyCode: USD }
            }
          }
        }
      ]
    ) {
      userErrors {
        field
        message
      }
      confirmationUrl
      appSubscription {
        id
        status
      }
    }
  }
`
    );

    if (response.data.appSubscriptionCreate.userErrors.length > 0) {
      console.log(
        `--> Error subscribing ${shop} to plan:`,
        response.data.appSubscriptionCreate.userErrors
      );
      res.status(400).send({ error: "An error occured." });
      return;
    }

    return res.status(200).send({
      confirmationUrl: `${response.data.appSubscriptionCreate.confirmationUrl}`,
    });
  } catch (e) {
    console.error(e);
    return res.status(400).send({ error: true });
  }
});

userRoutes.post("/saveTemplate", async (req, res) => {
  try {
    const userSession = res.locals.user_session;
    if (!userSession || !userSession["shop"]) {
      return res.status(400).json({ error: "User session or shop not found." });
    }

    const { template } = req.body;
    if (!template) {
      return res.status(400).json({ error: "Template data is required." });
    }

    const shop = userSession["shop"];

    // Check if a template already exists for the shop
    let existingTemplate = await TemplateModel.findOne({ shop });

    if (existingTemplate) {
      // Update the existing template
      existingTemplate.template = template;
      await existingTemplate.save();
      return res.status(200).json({
        message: "Template updated successfully.",
        template: existingTemplate,
      });
    } else {
      // Create a new template record if none exists
      const newTemplate = new TemplateModel({
        shop,
        template,
      });
      await newTemplate.save();
      return res.status(201).json({
        message: "Template created successfully.",
        template: newTemplate,
      });
    }
  } catch (error) {
    console.error("Error saving template:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

userRoutes.get("/template", async (req, res) => {
  const userSession = res.locals.user_session;
  const shop = userSession["shop"];
  let existingTemplate = await TemplateModel.findOne({ shop });

  if (!existingTemplate) {
    return res.status(400).json({
      message: "No Template Found",
    });
  }

  return res.status(200).json({
    message: existingTemplate,
  });
});

// userRoutes.post("/optimizeAltText", async (req, res) => {
//   //update record with inprogress true.
//   const userSession = res.locals.user_session;
//   const shop = userSession["shop"];
//   let existingTemplate = await TemplateModel.findOne({ shop });

//   if (existingTemplate.inprogress) {
//     return res.status(400).json({
//       message: "one batch is already is in progress",
//     });
//   }

//   if (existingTemplate) {
//     // Update the existing template
//     existingTemplate.inprogress = true;
//     // await existingTemplate.save();
//   }

//   //Optimize all the products one by one.

//   const { client } = await clientProvider.offline.graphqlClient({
//     shop: res.locals.user_session.shop,
//   });

//   const query = `
//   query($cursor: String) {
//    products(first: 250,after: $cursor) {
//    pageInfo {
//         hasNextPage
//       }
//     edges {
//     cursor
//       node {
//         title
//         id
//         images(first: 250) {
//           edges {
//             node {
//               id
//               altText
//             }
//           }
//         }
//       }
//     }
//   }

//   }
// `;

//   let productsHasNextPage = true;
//   let productCursor = null;

//   while (productsHasNextPage) {
//     const data = await client.query({
//       data: query,
//       variables: { cursor: productCursor },
//     });

//     const products = data.body.data.products.edges;

//     productsHasNextPage = data.body.data.products.pageInfo.hasNextPage;

//     for (const productEdge of products) {
//       const product = productEdge.node;
//       console.log(`Variant: ${product.title}`);
//       productCursor = productEdge.cursor;
//     }
//   }

//   return res.status(200).json({
//     message: "All Images Optimized Successfully",
//   });
// });

// userRoutes.post("/optimizeAltText", async (req, res) => {
//   try {
//     const userSession = res.locals.user_session;
//     const shop = userSession["shop"];
//     let existingTemplate = await TemplateModel.findOne({ shop });

//     if (existingTemplate.inprogress) {
//       return res.status(400).json({
//         message: "One batch is already in progress",
//       });
//     }

//     if (existingTemplate) {
//       existingTemplate.inprogress = true;
//       await existingTemplate.save();
//     }

//     const { client } = await clientProvider.offline.graphqlClient({
//       shop,
//     });

//     const query = `
//       query($cursor: String) {
//         products(first: 250, after: $cursor) {
//           pageInfo {
//             hasNextPage
//           }
//           edges {
//             cursor
//             node {
//               title
//               id
//               media(first: 250) {
//                 edges {
//                   node {
//                     id
//                     alt
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     `;

//     let productsHasNextPage = true;
//     let productCursor = null;
//     let processedCount = 0;

//     while (productsHasNextPage) {
//       const data = await client.query({
//         data: query,
//         variables: { cursor: productCursor },
//       });

//       const products = data.body.data.products.edges;
//       productsHasNextPage = data.body.data.products.pageInfo.hasNextPage;

//       for (const productEdge of products) {
//         const product = productEdge.node;
//         console.log(`Processing Product: ${product.title}`);
//         productCursor = productEdge.cursor;
//         console.log(product);
//         // Prepare media input for the mutation
//         const media = product.media.edges.map((imageEdge) => ({
//           alt: product.title, // Update this to whatever logic you want for alt text
//           id: imageEdge.node.id,
//         }));

//         if (media.length == 0) {
//           continue;
//         }

//         // Perform the mutation to update alt text
//         const mutation = `
//           mutation abc($media: [UpdateMediaInput!]! , $productId: ID!) {
//             productUpdateMedia( media: $media, productId: $productId) {
//               media {
//                 alt
//               }
//             }
//           }
//         `;

//         try {
//           await client.query({
//             data: {
//               query: mutation,
//               variables: { media: media, productId: product.id },
//             },
//           });
//         } catch (mutationError) {
//           console.error("Mutation Error:", mutationError);
//           if (mutationError.response && mutationError.response.errors) {
//             console.error("GraphQL Errors:", mutationError.response.errors);
//           }
//         }
//         console.log({
//           data: {
//             query: mutation,
//             variables: { media: media, productId: product.id },
//           },
//         });

//         processedCount++;
//       }
//     }

//     // Reset the inprogress status after processing
//     if (existingTemplate) {
//       existingTemplate.inprogress = false;
//       await existingTemplate.save();
//     }

//     return res.status(200).json({
//       message: "All images optimized successfully",
//       processedCount,
//     });
//   } catch (error) {
//     console.error("Error optimizing alt text:", error);
//     return res.status(500).json({
//       message: "An error occurred while optimizing alt text",
//       error: error.message,
//     });
//   }
// });
// Import the ProductLog model

// userRoutes.post("/optimizeAltText", async (req, res) => {
//   try {
//     const userSession = res.locals.user_session;
//     const shop = userSession["shop"];
//     let existingTemplate = await TemplateModel.findOne({ shop });

//     if (existingTemplate) {
//       if (existingTemplate.inprogress) {
//         return res.status(400).json({
//           message: "One batch is already in progress",
//         });
//       }
//       existingTemplate.inprogress = true;
//       await existingTemplate.save();
//     }

//     const { client } = await clientProvider.offline.graphqlClient({
//       shop,
//     });

//     const query = `
//       query($cursor: String) {
//         products(first: 250, after: $cursor) {
//           pageInfo {
//             hasNextPage
//           }
//           edges {
//             cursor
//             node {
//               title
//               id
//               media(first: 250) {
//                 edges {
//                   node {
//                     id
//                     alt
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     `;

//     let productsHasNextPage = true;
//     let productCursor = null;
//     let processedCount = 0;

//     while (productsHasNextPage) {
//       const data = await client.query({
//         data: query,
//         variables: { cursor: productCursor },
//       });

//       const products = data.body.data.products.edges;
//       productsHasNextPage = data.body.data.products.pageInfo.hasNextPage;

//       for (const productEdge of products) {
//         const product = productEdge.node;
//         productCursor = productEdge.cursor;

//         const media = product.media.edges.map((imageEdge) => ({
//           oldAlt: imageEdge.node.alt,
//           newAlt: product.title, // Adjust this logic as needed for new alt text
//           id: imageEdge.node.id,
//         }));

//         if (media.length === 0) continue;

//         const mutation = `
//           mutation UpdateProductMedia($media: [UpdateMediaInput!]!, $productId: ID!) {
//             productUpdateMedia(media: $media, productId: $productId) {
//               media {
//                 alt
//               }
//             }
//           }
//         `;

//         try {
//           await client.query({
//             data: {
//               query: mutation,
//               variables: {
//                 media: media.map(({ newAlt, id }) => ({ alt: newAlt, id })),
//                 productId: product.id,
//               },
//             },
//           });

//           // Log each media update
//           for (const { oldAlt, newAlt, id: mediaId } of media) {
//             await ProductLog.create({
//               shop,
//               productId: product.id,
//               mediaId,
//               oldAltText: oldAlt,
//               newAltText: newAlt,
//             });
//           }

//           processedCount++;
//         } catch (mutationError) {
//           console.error("Mutation Error:", mutationError);
//           if (mutationError.response?.errors) {
//             console.error("GraphQL Errors:", mutationError.response.errors);
//           }
//         }
//       }

//       await new Promise((resolve) => setTimeout(resolve, 200));
//     }

//     if (existingTemplate) {
//       existingTemplate.inprogress = false;
//       await existingTemplate.save();
//     }

//     return res.status(200).json({
//       message: "All images optimized successfully",
//       processedCount,
//     });
//   } catch (error) {
//     console.error("Error optimizing alt text:", error);
//     return res.status(500).json({
//       message: "An error occurred while optimizing alt text",
//       error: error.message,
//     });
//   }
// });

// userRoutes.post("/revertAllAltTexts", async (req, res) => {
//   try {
//     const { shop } = req.body;

//     // Retrieve all logs for the shop to revert each media item to its previous alt text
//     const productLogs = await ProductLog.find({ shop });

//     if (productLogs.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No previous alt text records found for this shop" });
//     }

//     const { client } = await clientProvider.offline.graphqlClient({ shop });

//     // Group media updates by productId for efficient bulk processing
//     const mediaUpdatesByProduct = productLogs.reduce((acc, log) => {
//       if (!acc[log.productId]) acc[log.productId] = [];
//       acc[log.productId].push({ id: log.mediaId, alt: log.oldAltText });
//       return acc;
//     }, {});

//     // Iterate over each product and revert its media alt texts
//     for (const [productId, mediaUpdates] of Object.entries(
//       mediaUpdatesByProduct
//     )) {
//       const mutation = `
//         mutation RevertProductMediaAltText($media: [UpdateMediaInput!]!, $productId: ID!) {
//           productUpdateMedia(media: $media, productId: $productId) {
//             media {
//               id
//               alt
//             }
//           }
//         }
//       `;

//       // Execute the mutation for each productId
//       await client.query({
//         data: {
//           query: mutation,
//           variables: {
//             media: mediaUpdates,
//             productId,
//           },
//         },
//       });
//     }

//     // Delete all logs for the shop once reverted
//     await ProductLog.deleteMany({ shop });

//     return res.status(200).json({
//       message: "Alt text reverted to previous versions for all products",
//       revertedMediaCount: productLogs.length,
//     });
//   } catch (error) {
//     console.error("Error reverting all alt texts:", error);
//     return res.status(500).json({
//       message: "An error occurred while reverting all alt texts",
//       error: error.message,
//     });
//   }
// });

// API to add an optimizeAltText job to the queue

userRoutes.post("/optimizeAltText", async (req, res) => {
  try {
    const userSession = res.locals.user_session;
    const shop = userSession["shop"];
    // Add a new job to the queue
    await Queue.create({
      shop,
      type: "optimize",
      status: "pending",
      attempts: 0,
      createdAt: new Date(),
    });

    let existingTemplate = await TemplateModel.findOne({ shop });

    if (existingTemplate) {
      if (existingTemplate.inprogress) {
        return res.status(400).json({
          message: "One batch is already in progress",
        });
      }
      existingTemplate.inprogress = true;
      await existingTemplate.save();
    }

    res.status(200).json({ message: "Optimize job added to queue" });
  } catch (error) {
    console.error("Error adding optimize job:", error);
    res
      .status(500)
      .json({ message: "Failed to queue optimize job", error: error.message });
  }
});

// API to add a revertAltText job to the queue
userRoutes.post("/revertAltText", async (req, res) => {
  try {
    console.log("inside route");
    const userSession = res.locals.user_session;
    const shop = userSession["shop"];
    // Add a new job to the queue
    await Queue.create({
      shop,
      type: "revert",
      status: "pending",
      attempts: 0,
      createdAt: new Date(),
    });

    res.status(200).json({ message: "Revert job added to queue" });
  } catch (error) {
    console.error("Error adding revert job:", error);
    res
      .status(500)
      .json({ message: "Failed to queue revert job", error: error.message });
  }
});

userRoutes.get("/logs", async (req, res) => {
  const userSession = res.locals.user_session;
  const shop = userSession["shop"];

  // Extract pagination parameters from the request query
  const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page
  const offset = parseInt(req.query.offset, 10) || 0;

  // Get the total count of logs for the shop
  const totalLogs = await ProductLog.countDocuments({ shop });

  // Fetch the paginated logs
  const productlogs = await ProductLog.find({ shop }).limit(limit).skip(offset);
  console.log(totalLogs, productlogs.length);
  // Return the logs and pagination info
  return res.status(200).json({
    logs: productlogs,
    pagination: {
      total: totalLogs,
      limit,
      offset,
    },
  });
});

export default userRoutes;
