const isDev = process.env.NODE_ENV !== "production";

const log = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

module.exports = { log };
