import dotenv from "dotenv";
dotenv.config();

const config = {
  http: {
    port: process.env.PORT || 4002,
  },
  db: {},
};

export default config;
