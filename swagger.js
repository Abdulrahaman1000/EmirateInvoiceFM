const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Food Marketplace API Documentation",
      version: "1.0.0",
      description: "API documentation for Food Marketplace platform",
    },
    servers: [
      { url: "http://localhost:5000/api" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ["./src/routes/*.js"], // scan all route files
};

module.exports = swaggerJsDoc(options);
