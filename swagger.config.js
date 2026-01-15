// swagger.js
const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0", // swagger version
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "API endpoints test and documentation",
    },
    servers: [
      {
        url: "http://localhost:5000", // change to your backend URL
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"], // path to your endpoints
};

const swaggerSpec = swaggerJsDoc(options);
module.exports = swaggerSpec;
